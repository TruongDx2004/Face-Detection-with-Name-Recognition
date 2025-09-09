const pool = require('../config/database');

class Assignment {
    constructor(data) {
        this.id = data.id;
        this.course_section_id = data.course_section_id;
        this.title = data.title;
        this.description = data.description;
        this.assignment_type = data.assignment_type;
        this.max_score = data.max_score;
        this.due_date = data.due_date;
        this.created_date = data.created_date;
        this.is_active = data.is_active;
        this.instructions = data.instructions;
        this.attachment_path = data.attachment_path;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Tạo bài tập mới
    static async create(assignmentData) {
        const {
            course_section_id,
            title,
            description,
            assignment_type = 'homework',
            max_score = 10.00,
            due_date,
            instructions,
            attachment_path
        } = assignmentData;

        const [result] = await pool.execute(
            `INSERT INTO assignments 
            (course_section_id, title, description, assignment_type, max_score, due_date, instructions, attachment_path) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [course_section_id, title, description, assignment_type, max_score, due_date, instructions, attachment_path]
        );

        return result.insertId;
    }

    // Lấy tất cả bài tập theo course_section_id
    static async getByCourseSection(courseSectionId) {
        const [rows] = await pool.execute(
            `SELECT a.*, cs.name as course_name, s.name as subject_name 
            FROM assignments a
            JOIN course_sections cs ON a.course_section_id = cs.id
            JOIN subjects s ON cs.subject_id = s.id
            WHERE a.course_section_id = ? AND a.is_active = TRUE
            ORDER BY a.due_date ASC`,
            [courseSectionId]
        );
        return rows.map(row => new Assignment(row));
    }

    // Lấy bài tập theo ID
    static async getById(id) {
        const [rows] = await pool.execute(
            `SELECT a.*, cs.name as course_name, s.name as subject_name 
            FROM assignments a
            JOIN course_sections cs ON a.course_section_id = cs.id
            JOIN subjects s ON cs.subject_id = s.id
            WHERE a.id = ?`,
            [id]
        );
        return rows.length > 0 ? new Assignment(rows[0]) : null;
    }

    // Cập nhật bài tập
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
            `UPDATE assignments SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    // Xóa bài tập (soft delete)
    static async delete(id) {
        const [result] = await pool.execute(
            'UPDATE assignments SET is_active = FALSE WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Lấy bài tập của sinh viên theo lớp học phần
    static async getStudentAssignments(studentId, courseSectionId) {
        const [rows] = await pool.execute(
            `SELECT a.*, 
                    asub.id as submission_id,
                    asub.submitted_at,
                    asub.score,
                    asub.status as submission_status,
                    asub.feedback
            FROM assignments a
            LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = ?
            WHERE a.course_section_id = ? AND a.is_active = TRUE
            ORDER BY a.due_date ASC`,
            [studentId, courseSectionId]
        );
        return rows;
    }

    // Thống kê bài tập theo giáo viên
    static async getTeacherAssignmentStats(teacherId) {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(a.id) as total_assignments,
                COUNT(asub.id) as total_submissions,
                AVG(asub.score) as avg_score,
                COUNT(CASE WHEN asub.status = 'graded' THEN 1 END) as graded_count
            FROM assignments a
            JOIN course_sections cs ON a.course_section_id = cs.id
            LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
            WHERE cs.teacher_id = ? AND a.is_active = TRUE`,
            [teacherId]
        );
        return rows[0];
    }
}

module.exports = Assignment;