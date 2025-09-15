const pool = require('../config/database');

class ExamResult {
    constructor(data) {
        this.id = data.id;
        this.exam_id = data.exam_id;
        this.student_id = data.student_id;
        this.start_time = data.start_time;
        this.end_time = data.end_time;
        this.score = data.score;
        this.total_score = data.total_score;
        this.status = data.status;
        this.submitted_at = data.submitted_at;
        this.graded_at = data.graded_at;
        this.graded_by = data.graded_by;

        this.student_name = data.student_name;
        this.student_email = data.student_email;
        this.exam_title = data.exam_title;
        this.exam_max_score = data.exam_max_score;
        this.student_code = data.student_code;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;

    }

    // Bắt đầu làm bài thi
    static async startExam(examId, studentId, totalScore) {
        // Kiểm tra xem đã có kết quả chưa
        const [existing] = await pool.execute(
            'SELECT id, status FROM exam_results WHERE exam_id = ? AND student_id = ?',
            [examId, studentId]
        );

        if (existing.length > 0) {
            const result = existing[0];
            if (result.status === 'completed' || result.status === 'graded') {
                throw new Error('Bạn đã hoàn thành bài thi');
            }

            // Nếu đang làm dở, cập nhật thời gian bắt đầu
            if (result.status === 'in_progress') {
                return result.id;
            }
        }

        const [result] = await pool.execute(
            `INSERT INTO exam_results 
            (exam_id, student_id, total_score, status, start_time) 
            VALUES (?, ?, ?, 'in_progress', CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE 
            start_time = CURRENT_TIMESTAMP, status = 'in_progress'`,
            [examId, studentId, totalScore]
        );

        return result.insertId || existing[0].id;
    }

    // Nộp bài thi
    static async submitExam(resultId) {
        const [result] = await pool.execute(
            `UPDATE exam_results 
            SET end_time = CURRENT_TIMESTAMP, submitted_at = CURRENT_TIMESTAMP, status = 'completed'
            WHERE id = ? AND status = 'in_progress'`,
            [resultId]
        );

        if (result.affectedRows > 0) {
            // Tính điểm tự động cho các câu trắc nghiệm
            await this.calculateAutoScore(resultId);
            return true;
        }
        return false;
    }

    // Tính điểm tự động
    static async calculateAutoScore(resultId) {
        const [result] = await pool.execute(
            `UPDATE exam_results er
                SET score = (
                    SELECT COALESCE(SUM(ea.points_earned), 0)
                    FROM exam_answers ea
                    WHERE ea.exam_result_id = er.id
                )
                WHERE er.id = ?`,
            [resultId]
        );

        // Kiểm tra xem có câu tự luận cần chấm thủ công không
        const [essayQuestions] = await pool.execute(
            `SELECT COUNT(*) as essay_count
            FROM exam_answers ea
            JOIN exam_questions eq ON ea.question_id = eq.id
            WHERE ea.exam_result_id = ? AND eq.question_type = 'essay' AND ea.is_correct IS NULL`,
            [resultId]
        );

        // Nếu không có câu tự luận hoặc đã chấm xong, đánh dấu là đã chấm điểm
        if (essayQuestions[0].essay_count === 0) {
            await pool.execute(
                `UPDATE exam_results 
                SET status = 'graded', graded_at = CURRENT_TIMESTAMP 
                WHERE id = ?`,
                [resultId]
            );
        }

        return result.affectedRows > 0;
    }

    // Chấm điểm thủ công
    static async gradeManually(resultId, score, gradedBy) {
        const [result] = await pool.execute(
            `UPDATE exam_results 
            SET score = ?, graded_at = CURRENT_TIMESTAMP, graded_by = ?, status = 'graded'
            WHERE id = ?`,
            [score, gradedBy, resultId]
        );
        return result.affectedRows > 0;
    }

    // Lấy kết quả theo ID
    static async getById(id) {
        const [rows] = await pool.execute(
            `SELECT er.*, 
                    e.title as exam_title,
                    e.max_score as exam_max_score,
                    u.full_name as student_name,
                    u.email as student_email
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            JOIN users u ON er.student_id = u.id
            WHERE er.id = ?`,
            [id]
        );
        return rows.length > 0 ? new ExamResult(rows[0]) : null;
    }

    // Lấy kết quả theo exam và student
    static async getByExamAndStudent(examId, studentId) {
        const [rows] = await pool.execute(
            `SELECT er.*, e.title as exam_title, e.max_score as exam_max_score
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            WHERE er.exam_id = ? AND er.student_id = ?`,
            [examId, studentId]
        );
        return rows.length > 0 ? new ExamResult(rows[0]) : null;
    }

    // Lấy tất cả kết quả của một bài thi
    static async getByExam(examId) {
        const [rows] = await pool.execute(
            `SELECT er.*, 
                    u.full_name as student_name,
                    u.email as student_email,
                    cs.student_code
            FROM exam_results er
            JOIN users u ON er.student_id = u.id
            LEFT JOIN class_students cs ON u.id = cs.student_id
            WHERE er.exam_id = ?
            ORDER BY er.score DESC, er.submitted_at ASC`,
            [examId]
        );
        return rows.map(row => new ExamResult(row));
    }

    // Lấy kết quả thi của sinh viên
    static async getStudentResults(studentId, courseSectionId = null) {
        let query = `
            SELECT er.*, 
                   e.title as exam_title,
                   e.exam_type,
                   e.max_score as exam_max_score,
                   cs.name as course_name,
                   s.name as subject_name
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            JOIN course_sections cs ON e.course_section_id = cs.id
            JOIN subjects s ON cs.subject_id = s.id
            WHERE er.student_id = ?`;

        const params = [studentId];

        if (courseSectionId) {
            query += ' AND cs.id = ?';
            params.push(courseSectionId);
        }

        query += ' ORDER BY e.exam_date DESC';

        const [rows] = await pool.execute(query, params);
        return rows.map(row => new ExamResult(row));
    }

    // Lấy kết quả cần chấm điểm
    static async getUngraded(teacherId) {
        const [rows] = await pool.execute(
            `SELECT er.*, 
                    e.title as exam_title,
                    e.max_score as exam_max_score,
                    u.full_name as student_name,
                    u.email as student_email,
                    cs.name as course_name
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            JOIN course_sections cs ON e.course_section_id = cs.id
            JOIN users u ON er.student_id = u.id
            WHERE cs.teacher_id = ? AND er.status = 'completed'
            ORDER BY er.submitted_at ASC`,
            [teacherId]
        );
        return rows.map(row => new ExamResult(row));
    }

    // Thống kê kết quả thi
    static async getExamStatistics(examId) {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(*) as total_students,
                COUNT(CASE WHEN status IN ('completed', 'graded') THEN 1 END) as completed_count,
                COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded_count,
                AVG(CASE WHEN status = 'graded' THEN score END) as avg_score,
                MAX(score) as max_score,
                MIN(score) as min_score,
                STDDEV(score) as score_stddev
            FROM exam_results
            WHERE exam_id = ?`,
            [examId]
        );
        return rows[0];
    }

    // Xóa kết quả thi
    static async delete(id) {
        const [result] = await pool.execute(
            'DELETE FROM exam_results WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Kiểm tra thời gian làm bài
    static async checkTimeLimit(resultId, durationMinutes) {
        const [rows] = await pool.execute(
            `SELECT 
                start_time,
                TIMESTAMPDIFF(MINUTE, start_time, NOW()) as elapsed_minutes
            FROM exam_results 
            WHERE id = ? AND status = 'in_progress'`,
            [resultId]
        );

        if (rows.length === 0) return { valid: false, reason: 'Exam not found or not in progress' };

        const elapsed = rows[0].elapsed_minutes;
        if (elapsed >= durationMinutes) {
            // Tự động nộp bài khi hết thời gian
            await this.submitExam(resultId);
            return { valid: false, reason: 'Time limit exceeded', autoSubmitted: true };
        }

        return {
            valid: true,
            remainingMinutes: durationMinutes - elapsed,
            elapsedMinutes: elapsed
        };
    }
}

module.exports = ExamResult;