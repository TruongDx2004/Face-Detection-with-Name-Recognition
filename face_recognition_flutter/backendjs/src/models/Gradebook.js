const pool = require('../config/database');

class Gradebook {
    constructor(data) {
        this.id = data.id;
        this.course_section_id = data.course_section_id;
        this.student_id = data.student_id;
        this.assignment_avg = data.assignment_avg;
        this.exam_avg = data.exam_avg;
        this.attendance_score = data.attendance_score;
        this.final_score = data.final_score;
        this.letter_grade = data.letter_grade;
        this.gpa_points = data.gpa_points;
        this.is_passed = data.is_passed;
        this.calculated_at = data.calculated_at;
        this.updated_at = data.updated_at;
    }

    // Tính toán điểm số cho một sinh viên
    static async calculateGrade(courseSectionId, studentId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Lấy cấu hình điểm số
            const [configRows] = await connection.execute(
                'SELECT * FROM grade_configurations WHERE course_section_id = ?',
                [courseSectionId]
            );

            const config = configRows[0] || {
                assignment_weight: 30.00,
                exam_weight: 60.00,
                attendance_weight: 10.00,
                passing_score: 5.00
            };

            // Tính điểm trung bình bài tập
            const [assignmentRows] = await connection.execute(
                `SELECT AVG(asub.score) as avg_score
                FROM assignment_submissions asub
                JOIN assignments a ON asub.assignment_id = a.id
                WHERE a.course_section_id = ? AND asub.student_id = ? AND asub.status = 'graded'`,
                [courseSectionId, studentId]
            );
            const assignmentAvg = assignmentRows[0].avg_score || 0;

            // Tính điểm trung bình thi
            const [examRows] = await connection.execute(
                `SELECT AVG(er.score) as avg_score
                FROM exam_results er
                JOIN exams e ON er.exam_id = e.id
                WHERE e.course_section_id = ? AND er.student_id = ? AND er.status = 'graded'`,
                [courseSectionId, studentId]
            );
            const examAvg = examRows[0].avg_score || 0;

            // Tính điểm chuyên cần
            const attendanceScore = await this.calculateAttendanceScore(courseSectionId, studentId);

            // Tính điểm cuối kỳ
            const finalScore = (
                (assignmentAvg * config.assignment_weight / 100) +
                (examAvg * config.exam_weight / 100) +
                (attendanceScore * config.attendance_weight / 100)
            );

            // Xác định điểm chữ và GPA
            const { letterGrade, gpaPoints } = this.calculateLetterGrade(finalScore);
            const isPassed = finalScore >= config.passing_score;

            // Lưu hoặc cập nhật vào gradebook
            await connection.execute(
                `INSERT INTO gradebook 
                (course_section_id, student_id, assignment_avg, exam_avg, attendance_score, 
                 final_score, letter_grade, gpa_points, is_passed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                assignment_avg = VALUES(assignment_avg),
                exam_avg = VALUES(exam_avg),
                attendance_score = VALUES(attendance_score),
                final_score = VALUES(final_score),
                letter_grade = VALUES(letter_grade),
                gpa_points = VALUES(gpa_points),
                is_passed = VALUES(is_passed),
                updated_at = CURRENT_TIMESTAMP`,
                [courseSectionId, studentId, assignmentAvg, examAvg, attendanceScore,
                 finalScore, letterGrade, gpaPoints, isPassed]
            );

            await connection.commit();
            return {
                assignment_avg: assignmentAvg,
                exam_avg: examAvg,
                attendance_score: attendanceScore,
                final_score: finalScore,
                letter_grade: letterGrade,
                gpa_points: gpaPoints,
                is_passed: isPassed
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Tính điểm chuyên cần
    static async calculateAttendanceScore(courseSectionId, studentId) {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(ats.id) as total_sessions,
                COUNT(att.id) as attended_sessions
            FROM attendance_sessions ats
            LEFT JOIN attendances att ON ats.id = att.session_id AND att.student_id = ?
            WHERE ats.course_section_id = ? AND ats.is_active = TRUE`,
            [studentId, courseSectionId]
        );

        const { total_sessions, attended_sessions } = rows[0];
        if (total_sessions === 0) return 10; // Điểm tối đa nếu chưa có buổi học

        const attendanceRate = attended_sessions / total_sessions;
        return Math.round(attendanceRate * 10 * 100) / 100; // Điểm từ 0-10
    }

    // Tính điểm chữ và GPA
    static calculateLetterGrade(score) {
        if (score >= 9.5) return { letterGrade: 'A+', gpaPoints: 4.0 };
        if (score >= 8.5) return { letterGrade: 'A', gpaPoints: 3.7 };
        if (score >= 8.0) return { letterGrade: 'B+', gpaPoints: 3.5 };
        if (score >= 7.0) return { letterGrade: 'B', gpaPoints: 3.0 };
        if (score >= 6.5) return { letterGrade: 'C+', gpaPoints: 2.5 };
        if (score >= 5.5) return { letterGrade: 'C', gpaPoints: 2.0 };
        if (score >= 5.0) return { letterGrade: 'D+', gpaPoints: 1.5 };
        if (score >= 4.0) return { letterGrade: 'D', gpaPoints: 1.0 };
        return { letterGrade: 'F', gpaPoints: 0.0 };
    }

    // Tính toán lại điểm cho tất cả sinh viên trong lớp học phần
    static async recalculateAllGrades(courseSectionId) {
        // Lấy danh sách sinh viên trong lớp học phần
        const [students] = await pool.execute(
            `SELECT DISTINCT cs.student_id
            FROM class_students cs
            JOIN course_sections csec ON cs.class_id = csec.class_id
            WHERE csec.id = ?`,
            [courseSectionId]
        );

        const results = [];
        for (const student of students) {
            try {
                const grade = await this.calculateGrade(courseSectionId, student.student_id);
                results.push({ student_id: student.student_id, ...grade });
            } catch (error) {
                console.error(`Error calculating grade for student ${student.student_id}:`, error);
            }
        }

        return results;
    }

    // Lấy sổ điểm theo lớp học phần
    static async getByCourseSection(courseSectionId) {
        const [rows] = await pool.execute(
            `SELECT g.*, 
                    u.full_name as student_name,
                    u.username as student_username,
                    cs.student_code,
                    csec.name as course_name,
                    s.name as subject_name
            FROM gradebook g
            JOIN users u ON g.student_id = u.id
            LEFT JOIN class_students cs ON u.id = cs.student_id
            JOIN course_sections csec ON g.course_section_id = csec.id
            JOIN subjects s ON csec.subject_id = s.id
            WHERE g.course_section_id = ?
            ORDER BY g.final_score DESC`,
            [courseSectionId]
        );
        return rows.map(row => new Gradebook(row));
    }

    // Lấy sổ điểm của sinh viên
    static async getByStudent(studentId, courseSectionId = null) {
        let query = `
            SELECT g.*, 
                   csec.name as course_name,
                   s.name as subject_name,
                   s.credits,
                   csec.semester,
                   csec.academic_year
            FROM gradebook g
            JOIN course_sections csec ON g.course_section_id = csec.id
            JOIN subjects s ON csec.subject_id = s.id
            WHERE g.student_id = ?`;
        
        const params = [studentId];
        
        if (courseSectionId) {
            query += ' AND g.course_section_id = ?';
            params.push(courseSectionId);
        }
        
        query += ' ORDER BY csec.academic_year DESC, csec.semester DESC';

        const [rows] = await pool.execute(query, params);
        return rows.map(row => new Gradebook(row));
    }

    // Lấy thống kê sổ điểm
    static async getGradeStatistics(courseSectionId) {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(*) as total_students,
                COUNT(CASE WHEN is_passed = TRUE THEN 1 END) as passed_students,
                AVG(final_score) as avg_score,
                MAX(final_score) as max_score,
                MIN(final_score) as min_score,
                STDDEV(final_score) as score_stddev,
                COUNT(CASE WHEN letter_grade = 'A+' THEN 1 END) as grade_a_plus,
                COUNT(CASE WHEN letter_grade = 'A' THEN 1 END) as grade_a,
                COUNT(CASE WHEN letter_grade = 'B+' THEN 1 END) as grade_b_plus,
                COUNT(CASE WHEN letter_grade = 'B' THEN 1 END) as grade_b,
                COUNT(CASE WHEN letter_grade = 'C+' THEN 1 END) as grade_c_plus,
                COUNT(CASE WHEN letter_grade = 'C' THEN 1 END) as grade_c,
                COUNT(CASE WHEN letter_grade = 'D+' THEN 1 END) as grade_d_plus,
                COUNT(CASE WHEN letter_grade = 'D' THEN 1 END) as grade_d,
                COUNT(CASE WHEN letter_grade = 'F' THEN 1 END) as grade_f
            FROM gradebook
            WHERE course_section_id = ?`,
            [courseSectionId]
        );
        return rows[0];
    }

    // Tính GPA tổng của sinh viên
    static async calculateStudentGPA(studentId) {
        const [rows] = await pool.execute(
            `SELECT 
                SUM(g.gpa_points * s.credits) as total_grade_points,
                SUM(s.credits) as total_credits
            FROM gradebook g
            JOIN course_sections cs ON g.course_section_id = cs.id
            JOIN subjects s ON cs.subject_id = s.id
            WHERE g.student_id = ? AND g.is_passed = TRUE`,
            [studentId]
        );

        const { total_grade_points, total_credits } = rows[0];
        if (total_credits === 0) return 0;

        return Math.round((total_grade_points / total_credits) * 100) / 100;
    }

    // Xóa bản ghi sổ điểm
    static async delete(courseSectionId, studentId) {
        const [result] = await pool.execute(
            'DELETE FROM gradebook WHERE course_section_id = ? AND student_id = ?',
            [courseSectionId, studentId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Gradebook;