const pool = require('../config/database');

class AssignmentTemplate {
    constructor(data) {
        this.id = data.id;
        this.teacher_id = data.teacher_id;
        this.title = data.title;
        this.description = data.description;
        this.assignment_type = data.assignment_type;
        this.default_max_score = data.default_max_score;
        this.instructions = data.instructions;
        this.attachment_path = data.attachment_path;
        this.tags = data.tags;
        this.usage_count = data.usage_count;
        this.is_public = data.is_public;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;

        // Thông tin teacher (khi join)
        this.teacher_name = data.teacher_name;
    }

    // Tạo template mới
    static async create(templateData) {
        const {
            teacher_id,
            title,
            description,
            assignment_type = 'homework',
            default_max_score = 10.00,
            instructions,
            attachment_path,
            tags = [],
            is_public = false
        } = templateData;

        const [result] = await pool.execute(
            `INSERT INTO assignment_templates 
                (teacher_id, title, description, assignment_type, default_max_score, instructions, attachment_path, tags, is_public) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                teacher_id,
                title,
                description,
                assignment_type,
                default_max_score,
                instructions,
                attachment_path,
                JSON.stringify(tags),
                is_public
            ]
        );

        return result.insertId;
    }

    // Lấy templates của giáo viên
    static async getByTeacher(teacherId, filters = {}) {
        let query = `
            SELECT at.*, u.full_name as teacher_name
            FROM assignment_templates at
            JOIN users u ON at.teacher_id = u.id
            WHERE at.teacher_id = ? AND at.is_active = TRUE
        `;

        const params = [teacherId];

        if (filters.assignment_type) {
            query += ` AND at.assignment_type = ?`;
            params.push(filters.assignment_type);
        }

        if (filters.search) {
            query += ` AND (at.title LIKE ? OR at.description LIKE ? OR JSON_SEARCH(at.tags, 'one', ?) IS NOT NULL)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, `%${filters.search}%`);
        }

        query += ` ORDER BY at.updated_at DESC`;

        const [rows] = await pool.execute(query, params);
        return rows.map(row => new AssignmentTemplate(row));
    }

    // Lấy templates công khai (của tất cả giáo viên)
    static async getPublicTemplates(filters = {}) {
        let query = `
            SELECT at.*, u.full_name as teacher_name
            FROM assignment_templates at
            JOIN users u ON at.teacher_id = u.id
            WHERE at.is_public = TRUE AND at.is_active = TRUE
        `;

        const params = [];

        if (filters.assignment_type) {
            query += ` AND at.assignment_type = ?`;
            params.push(filters.assignment_type);
        }

        if (filters.search) {
            query += ` AND (at.title LIKE ? OR at.description LIKE ? OR JSON_SEARCH(at.tags, 'one', ?) IS NOT NULL)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, `%${filters.search}%`);
        }

        if (filters.exclude_teacher_id) {
            query += ` AND at.teacher_id != ?`;
            params.push(filters.exclude_teacher_id);
        }

        query += ` ORDER BY at.usage_count DESC, at.updated_at DESC`;

        const [rows] = await pool.execute(query, params);
        return rows.map(row => new AssignmentTemplate(row));
    }

    // Lấy template theo ID
    static async getById(id) {
        const [rows] = await pool.execute(
            `SELECT at.*, u.full_name as teacher_name
            FROM assignment_templates at
            JOIN users u ON at.teacher_id = u.id
            WHERE at.id = ?`,
            [id]
        );
        return rows.length > 0 ? new AssignmentTemplate(rows[0]) : null;
    }

    // Cập nhật template
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];

            for (const [key, value] of Object.entries(updateData)) {
                if (value !== undefined) {
                    if (key === 'tags') {
                        fields.push('tags = ?');
                        values.push(JSON.stringify(value));
                    } else if (key === 'is_public' || key === 'is_active') {
                        fields.push(`${key} = ?`);
                        values.push(value === true || value === 'true' ? 1 : 0);
                    } else {
                        fields.push(`${key} = ?`);
                        values.push(value);
                    }
                }
            }

            if (fields.length === 0) return false;

            values.push(id);

            const [result] = await pool.execute(
                `UPDATE assignment_templates SET ${fields.join(", ")} WHERE id = ?`,
                values
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Update template error:', error);
            throw error;
        }
    }

    // Xóa template (soft delete)
    static async delete(id) {
        const [result] = await pool.execute(
            'UPDATE assignment_templates SET is_active = FALSE WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Tạo assignment từ template
    static async createAssignmentFromTemplate(templateId, assignmentData) {
        try {
            // Lấy template
            const template = await AssignmentTemplate.getById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Tạo assignment với dữ liệu từ template + override data
            const Assignment = require('./Assignment');
            const assignmentId = await Assignment.create({
                course_section_id: assignmentData.course_section_id,
                title: assignmentData.title || template.title,
                description: assignmentData.description || template.description,
                assignment_type: assignmentData.assignment_type || template.assignment_type,
                max_score: assignmentData.max_score || template.default_max_score,
                due_date: assignmentData.due_date,
                instructions: assignmentData.instructions || template.instructions,
                attachment_path: assignmentData.attachment_path || template.attachment_path,
                template_id: templateId
            });

            // Ghi lại việc sử dụng template
            await pool.execute(
                'INSERT INTO assignment_template_usage (assignment_id, template_id) VALUES (?, ?)',
                [assignmentId, templateId]
            );

            // Tăng usage_count
            await pool.execute(
                'UPDATE assignment_templates SET usage_count = usage_count + 1 WHERE id = ?',
                [templateId]
            );

            return assignmentId;
        } catch (error) {
            console.error('Create assignment from template error:', error);
            throw error;
        }
    }

    // Lấy thống kê templates của teacher
    static async getTeacherTemplateStats(teacherId) {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(at.id) as total_templates,
                COUNT(CASE WHEN at.is_public = TRUE THEN 1 END) as public_templates,
                SUM(at.usage_count) as total_usage,
                AVG(at.usage_count) as avg_usage_per_template
            FROM assignment_templates at
            WHERE at.teacher_id = ? AND at.is_active = TRUE`,
            [teacherId]
        );
        return rows[0];
    }

    // Lấy top templates được sử dụng nhiều nhất
    static async getTopUsedTemplates(limit = 10) {
        const [rows] = await pool.execute(
            `SELECT at.*, u.full_name as teacher_name
            FROM assignment_templates at
            JOIN users u ON at.teacher_id = u.id
            WHERE at.is_public = TRUE AND at.is_active = TRUE
            ORDER BY at.usage_count DESC
            LIMIT ?`,
            [limit]
        );
        return rows.map(row => new AssignmentTemplate(row));
    }

    // Tìm kiếm templates theo tags
    static async searchByTags(tags, excludeTeacherId = null) {
        let query = `
            SELECT at.*, u.full_name as teacher_name
            FROM assignment_templates at
            JOIN users u ON at.teacher_id = u.id
            WHERE at.is_active = TRUE AND (
        `;

        const conditions = [];
        const params = [];

        tags.forEach(tag => {
            conditions.push('JSON_SEARCH(at.tags, "one", ?) IS NOT NULL');
            params.push(tag);
        });

        query += conditions.join(' OR ') + ')';

        if (excludeTeacherId) {
            query += ' AND at.teacher_id != ?';
            params.push(excludeTeacherId);
        }

        query += ' ORDER BY at.usage_count DESC, at.updated_at DESC';

        const [rows] = await pool.execute(query, params);
        return rows.map(row => new AssignmentTemplate(row));
    }
}

module.exports = AssignmentTemplate;