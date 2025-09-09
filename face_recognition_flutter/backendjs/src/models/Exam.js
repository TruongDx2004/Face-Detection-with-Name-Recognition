const pool = require('../config/database');

class Exam {
    constructor(data) {
        this.id = data.id;
        this.course_section_id = data.course_section_id;
        this.title = data.title;
        this.description = data.description;
        this.exam_type = data.exam_type;
        this.max_score = data.max_score;
        this.duration_minutes = data.duration_minutes;
        this.exam_date = data.exam_date;
        this.start_time = data.start_time;
        this.end_time = data.end_time;
        this.is_active = data.is_active;
        this.instructions = data.instructions;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Tạo bài kiểm tra mới
    static async create(examData) {
        const {
            course_section_id,
            title,
            description,
            exam_type = 'quiz',
            max_score = 10.00,
            duration_minutes = 60,
            exam_date,
            start_time,
            end_time,
            instructions
        } = examData;

        const [result] = await pool.execute(
            `INSERT INTO exams 
            (course_section_id, title, description, exam_type, max_score, duration_minutes, 
             exam_date, start_time, end_time, instructions) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [course_section_id, title, description, exam_type, max_score, duration_minutes,
             exam_date, start_time, end_time, instructions]
        );

        return result.insertId;
    }

    // Lấy bài kiểm tra theo ID
    static async getById(id) {
        const [rows] = await pool.execute(
            `SELECT e.*, 
                    cs.name as course_name, 
                    s.name as subject_name,
                    COUNT(eq.id) as question_count
            FROM exams e
            JOIN course_sections cs ON e.course_section_id = cs.id
            JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN exam_questions eq ON e.id = eq.exam_id
            WHERE e.id = ?
            GROUP BY e.id`,
            [id]
        );
        return rows.length > 0 ? new Exam(rows[0]) : null;
    }

    // Lấy tất cả bài kiểm tra theo course section
    static async getByCourseSection(courseSectionId) {
        const [rows] = await pool.execute(
            `SELECT e.*, 
                    COUNT(eq.id) as question_count,
                    COUNT(er.id) as student_count
            FROM exams e
            LEFT JOIN exam_questions eq ON e.id = eq.exam_id
            LEFT JOIN exam_results er ON e.id = er.exam_id
            WHERE e.course_section_id = ? AND e.is_active = TRUE
            GROUP BY e.id
            ORDER BY e.exam_date ASC`,
            [courseSectionId]
        );
        return rows.map(row => new Exam(row));
    }

    // Cập nhật bài kiểm tra
    static async update(id, updateData) {
        const fields = [];
        const values = [];

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(updateData[key]);
            }
        });

        if (fields.length === 0) return false;

        values.push(id);
        const [result] = await pool.execute(
            `UPDATE exams SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    // Xóa bài kiểm tra (soft delete)
    static async delete(id) {
        const [result] = await pool.execute(
            'UPDATE exams SET is_active = FALSE WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Lấy bài kiểm tra của sinh viên
    static async getStudentExams(studentId, courseSectionId) {
        const [rows] = await pool.execute(
            `SELECT e.*, 
                    er.id as result_id,
                    er.status as exam_status,
                    er.score,
                    er.start_time as student_start_time,
                    er.end_time as student_end_time,
                    er.submitted_at
            FROM exams e
            LEFT JOIN exam_results er ON e.id = er.exam_id AND er.student_id = ?
            WHERE e.course_section_id = ? AND e.is_active = TRUE
            ORDER BY e.exam_date ASC`,
            [studentId, courseSectionId]
        );
        return rows;
    }

    // Lấy bài kiểm tra theo giáo viên
    static async getByTeacher(teacherId) {
        const [rows] = await pool.execute(
            `SELECT e.*, 
                    cs.name as course_name,
                    s.name as subject_name,
                    COUNT(DISTINCT eq.id) as question_count,
                    COUNT(DISTINCT er.id) as student_count,
                    AVG(er.score) as avg_score
            FROM exams e
            JOIN course_sections cs ON e.course_section_id = cs.id
            JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN exam_questions eq ON e.id = eq.exam_id
            LEFT JOIN exam_results er ON e.id = er.exam_id AND er.status = 'graded'
            WHERE cs.teacher_id = ? AND e.is_active = TRUE
            GROUP BY e.id
            ORDER BY e.exam_date DESC`,
            [teacherId]
        );
        return rows.map(row => new Exam(row));
    }

    // Kiểm tra xem bài thi có thể làm không
    static async canTakeExam(examId, studentId) {
        const [rows] = await pool.execute(
            `SELECT e.*, er.status
            FROM exams e
            LEFT JOIN exam_results er ON e.id = er.exam_id AND er.student_id = ?
            WHERE e.id = ? AND e.is_active = TRUE`,
            [studentId, examId]
        );

        if (rows.length === 0) return { canTake: false, reason: 'Exam not found' };

        const exam = rows[0];
        const now = new Date();
        const examDateTime = new Date(`${exam.exam_date} ${exam.start_time}`);
        const examEndDateTime = new Date(`${exam.exam_date} ${exam.end_time}`);

        if (now < examDateTime) {
            return { canTake: false, reason: 'Exam has not started yet' };
        }

        if (now > examEndDateTime) {
            return { canTake: false, reason: 'Exam has ended' };
        }

        if (exam.status === 'completed' || exam.status === 'graded') {
            return { canTake: false, reason: 'Already completed' };
        }

        return { canTake: true, exam: new Exam(exam) };
    }

    // Thống kê bài kiểm tra
    static async getExamStats(examId) {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(er.id) as total_students,
                COUNT(CASE WHEN er.status = 'completed' OR er.status = 'graded' THEN 1 END) as completed_count,
                COUNT(CASE WHEN er.status = 'in_progress' THEN 1 END) as in_progress_count,
                AVG(CASE WHEN er.status = 'graded' THEN er.score END) as avg_score,
                MAX(er.score) as max_score,
                MIN(er.score) as min_score
            FROM exam_results er
            WHERE er.exam_id = ?`,
            [examId]
        );
        return rows[0];
    }
}

module.exports = Exam;