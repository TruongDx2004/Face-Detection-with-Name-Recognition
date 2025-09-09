const pool = require('../config/database');

class AssignmentSubmission {
    constructor(data) {
        this.id = data.id;
        this.assignment_id = data.assignment_id;
        this.student_id = data.student_id;
        this.submission_text = data.submission_text;
        this.attachment_path = data.attachment_path;
        this.submitted_at = data.submitted_at;
        this.score = data.score;
        this.feedback = data.feedback;
        this.graded_at = data.graded_at;
        this.graded_by = data.graded_by;
        this.status = data.status;
    }

    // Nộp bài tập
    static async create(submissionData) {
        const {
            assignment_id,
            student_id,
            submission_text,
            attachment_path
        } = submissionData;

        // Kiểm tra xem đã nộp bài chưa
        const [existing] = await pool.execute(
            'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
            [assignment_id, student_id]
        );

        if (existing.length > 0) {
            // Cập nhật bài nộp hiện tại
            const [result] = await pool.execute(
                `UPDATE assignment_submissions 
                SET submission_text = ?, attachment_path = ?, submitted_at = CURRENT_TIMESTAMP, status = 'submitted'
                WHERE assignment_id = ? AND student_id = ?`,
                [submission_text, attachment_path, assignment_id, student_id]
            );
            return existing[0].id;
        } else {
            // Tạo bài nộp mới
            const [result] = await pool.execute(
                `INSERT INTO assignment_submissions 
                (assignment_id, student_id, submission_text, attachment_path, status) 
                VALUES (?, ?, ?, ?, 'submitted')`,
                [assignment_id, student_id, submission_text, attachment_path]
            );
            return result.insertId;
        }
    }

    // Lấy bài nộp theo ID
    static async getById(id) {
        const [rows] = await pool.execute(
            `SELECT asub.*, 
                    a.title as assignment_title,
                    a.max_score,
                    u.full_name as student_name,
                    u.username as student_username
            FROM assignment_submissions asub
            JOIN assignments a ON asub.assignment_id = a.id
            JOIN users u ON asub.student_id = u.id
            WHERE asub.id = ?`,
            [id]
        );
        return rows.length > 0 ? new AssignmentSubmission(rows[0]) : null;
    }

    // Lấy bài nộp theo assignment và student
    static async getByAssignmentAndStudent(assignmentId, studentId) {
        const [rows] = await pool.execute(
            `SELECT asub.*, 
                    a.title as assignment_title,
                    a.max_score,
                    a.due_date
            FROM assignment_submissions asub
            JOIN assignments a ON asub.assignment_id = a.id
            WHERE asub.assignment_id = ? AND asub.student_id = ?`,
            [assignmentId, studentId]
        );
        return rows.length > 0 ? new AssignmentSubmission(rows[0]) : null;
    }

    // Lấy tất cả bài nộp của một bài tập
    static async getByAssignment(assignmentId) {
        const [rows] = await pool.execute(
            `SELECT asub.*, 
                    u.full_name as student_name,
                    u.username as student_username,
                    cs.student_code
            FROM assignment_submissions asub
            JOIN users u ON asub.student_id = u.id
            LEFT JOIN class_students cs ON u.id = cs.student_id
            WHERE asub.assignment_id = ?
            ORDER BY asub.submitted_at DESC`,
            [assignmentId]
        );
        return rows.map(row => new AssignmentSubmission(row));
    }

    // Chấm điểm bài tập
    static async grade(submissionId, score, feedback, gradedBy) {
        const [result] = await pool.execute(
            `UPDATE assignment_submissions 
            SET score = ?, feedback = ?, graded_at = CURRENT_TIMESTAMP, graded_by = ?, status = 'graded'
            WHERE id = ?`,
            [score, feedback, gradedBy, submissionId]
        );
        return result.affectedRows > 0;
    }

    // Lấy bài nộp của sinh viên theo course section
    static async getStudentSubmissions(studentId, courseSectionId) {
        const [rows] = await pool.execute(
            `SELECT asub.*, 
                    a.title as assignment_title,
                    a.max_score,
                    a.due_date,
                    a.assignment_type
            FROM assignment_submissions asub
            JOIN assignments a ON asub.assignment_id = a.id
            WHERE asub.student_id = ? AND a.course_section_id = ?
            ORDER BY a.due_date DESC`,
            [studentId, courseSectionId]
        );
        return rows.map(row => new AssignmentSubmission(row));
    }

    // Thống kê bài nộp chưa chấm
    static async getUngraded(teacherId) {
        const [rows] = await pool.execute(
            `SELECT asub.*, 
                    a.title as assignment_title,
                    a.max_score,
                    u.full_name as student_name,
                    cs.name as course_name
            FROM assignment_submissions asub
            JOIN assignments a ON asub.assignment_id = a.id
            JOIN course_sections cs ON a.course_section_id = cs.id
            JOIN users u ON asub.student_id = u.id
            WHERE cs.teacher_id = ? AND asub.status = 'submitted'
            ORDER BY asub.submitted_at ASC`,
            [teacherId]
        );
        return rows.map(row => new AssignmentSubmission(row));
    }

    // Xóa bài nộp
    static async delete(id) {
        const [result] = await pool.execute(
            'DELETE FROM assignment_submissions WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = AssignmentSubmission;