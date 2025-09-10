const pool = require('../config/database');
const dayjs = require('dayjs');

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

        this.course_name = data.course_name;
        this.subject_name = data.subject_name;
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

        // Nếu cột trong DB là DATETIME
        const formattedDueDate = due_date
            ? dayjs(due_date).format("YYYY-MM-DD HH:mm:ss")
            : null;

        console.log("Formatted due_date:", course_section_id);

        const [result] = await pool.execute(
            `INSERT INTO assignments 
                (course_section_id, title, description, assignment_type, max_score, due_date, instructions, attachment_path) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                course_section_id,
                title,
                description,
                assignment_type,
                max_score,
                formattedDueDate,
                instructions,
                attachment_path
            ]
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
        try {
            const fields = [];
            const values = [];

            for (const [key, value] of Object.entries(updateData)) {
                if (value !== undefined) {
                    if (key === "due_date") {
                        // format datetime cho MySQL
                        const formattedDueDate = value
                            ? dayjs(value).format("YYYY-MM-DD HH:mm:ss")
                            : null;
                        fields.push("due_date = ?");
                        values.push(formattedDueDate);
                    } else if (key === "is_active") {
                        // convert boolean -> tinyint
                        fields.push("is_active = ?");
                        values.push(value === "true" ? 1 : 0);
                    } else {
                        fields.push(`${key} = ?`);
                        values.push(value);
                    }
                }
            }

            if (fields.length === 0) return false;

            values.push(id);

            const [result] = await pool.execute(
                `UPDATE assignments SET ${fields.join(", ")} WHERE id = ?`,
                values
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error("Update assignment error:", error);
            throw error;
        }
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
                    cs.name as course_name,
                    s.name as subject_name,
                    asub.id as submission_id,
                    asub.submitted_at,
                    asub.score,
                    asub.status as submission_status,
                    asub.feedback,
                    asub.submission_text,
                    asub.attachment_path as submission_attachment_path
            FROM assignments a
            JOIN course_sections cs ON a.course_section_id = cs.id
            JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = ?
            WHERE a.course_section_id = ? AND a.is_active = TRUE
            ORDER BY a.due_date ASC`,
            [studentId, courseSectionId]
        );
        
        // Transform rows to include submission data properly
        return rows.map(row => {
            const assignment = new Assignment(row);
            return {
                ...assignment,
                submission: row.submission_id ? {
                    id: row.submission_id,
                    submitted_at: row.submitted_at,
                    score: row.score,
                    status: row.submission_status,
                    feedback: row.feedback,
                    submission_text: row.submission_text,
                    attachment_path: row.submission_attachment_path
                } : null
            };
        });
    }

    // Lấy tất cả bài tập của giáo viên
    static async getByTeacher(teacherId, filters = {}) {
        let query = `
            SELECT a.*, 
                   cs.name as course_name, 
                   s.name as subject_name,
                   c.name as class_name,
                   COUNT(asub.id) as submission_count,
                   COUNT(CASE WHEN asub.status = 'graded' THEN 1 END) as graded_count
            FROM assignments a
            JOIN course_sections cs ON a.course_section_id = cs.id
            JOIN subjects s ON cs.subject_id = s.id
            JOIN classes c ON cs.class_id = c.id
            LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
            WHERE cs.teacher_id = ? 
        `;

        const params = [teacherId];

        // Thêm filters
        if (filters.status) {
            if (filters.status === 'active') {
                query += ` AND a.due_date > NOW()`;
            } else if (filters.status === 'closed') {
                query += ` AND a.due_date <= NOW()`;
            }
        }

        if (filters.assignment_type) {
            query += ` AND a.assignment_type = ?`;
            params.push(filters.assignment_type);
        }

        if (filters.course_section_id) {
            query += ` AND a.course_section_id = ?`;
            params.push(filters.course_section_id);
        }

        query += ` GROUP BY a.id ORDER BY a.created_at DESC`;

        const [rows] = await pool.execute(query, params);
        return rows.map(row => ({
            ...new Assignment(row),
            course_name: row.course_name,
            subject_name: row.subject_name,
            class_name: row.class_name,
            submission_count: row.submission_count,
            graded_count: row.graded_count
        }));
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