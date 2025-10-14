const pool = require('../config/database');

class ExamTemplate {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.subject_id = data.subject_id;
        this.subject_name = data.subject_name;
        this.teacher_id = data.teacher_id;
        this.teacher_name = data.teacher_name;
        this.difficulty_level = data.difficulty_level; // easy, medium, hard
        this.duration_minutes = data.duration_minutes;
        this.total_points = data.total_points;
        this.questions = Array.isArray(data.questions)
            ? data.questions
            : data.questions
                ? JSON.parse(data.questions)
                : [];

        this.tags = Array.isArray(data.tags)
            ? data.tags
            : data.tags
                ? JSON.parse(data.tags)
                : [];

        this.usage_count = data.usage_count || 0;
        this.is_public = data.is_public || false;
        this.is_active = data.is_active !== false;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Tạo exam template mới
    static async create(templateData) {
        const {
            title,
            description,
            subject_id,
            teacher_id,
            difficulty_level,
            duration_minutes,
            total_points,
            questions,
            tags,
            is_public
        } = templateData;

        const query = `
            INSERT INTO exam_templates (
                title, description, subject_id, teacher_id, difficulty_level,
                duration_minutes, total_points, questions, tags, is_public,
                usage_count, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, TRUE, NOW(), NOW())
        `;

        const [result] = await pool.execute(query, [
            title,
            description,
            subject_id,
            teacher_id,
            difficulty_level,
            duration_minutes,
            total_points,
            JSON.stringify(questions),
            JSON.stringify(tags),
            is_public
        ]);

        return await ExamTemplate.getById(result.insertId);
    }

    // Lấy tất cả templates cho teacher
    static async getByTeacherId(teacherId, filters = {}) {
        let query = `
            SELECT et.*, s.name as subject_name, u.full_name as teacher_name
            FROM exam_templates et
            LEFT JOIN subjects s ON et.subject_id = s.id
            LEFT JOIN users u ON et.teacher_id = u.id
            WHERE et.teacher_id = ? AND et.is_active = TRUE
        `;
        const params = [teacherId];

        // Apply filters
        if (filters.subject_id) {
            query += ' AND et.subject_id = ?';
            params.push(filters.subject_id);
        }

        if (filters.difficulty_level) {
            query += ' AND et.difficulty_level = ?';
            params.push(filters.difficulty_level);
        }

        if (filters.search) {
            query += ' AND (et.title LIKE ? OR et.description LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        if (filters.tags && filters.tags.length > 0) {
            const tagConditions = filters.tags.map(() => 'JSON_SEARCH(et.tags, "one", ?) IS NOT NULL');
            query += ` AND (${tagConditions.join(' OR ')})`;
            params.push(...filters.tags);
        }

        query += ' ORDER BY et.updated_at DESC';

        const [rows] = await pool.execute(query, params);
        return rows.map(row => new ExamTemplate(row));
    }

    // Lấy templates công khai
    static async getPublicTemplates(teacherId, filters = {}) {
        let query = `
            SELECT et.*, s.name as subject_name, u.full_name as teacher_name
            FROM exam_templates et
            LEFT JOIN subjects s ON et.subject_id = s.id
            LEFT JOIN users u ON et.teacher_id = u.id
            WHERE et.is_public = TRUE AND et.is_active = TRUE AND et.teacher_id != ?
        `;
        const params = [teacherId];

        // Apply same filters as above
        if (filters.subject_id) {
            query += ' AND et.subject_id = ?';
            params.push(filters.subject_id);
        }

        if (filters.difficulty_level) {
            query += ' AND et.difficulty_level = ?';
            params.push(filters.difficulty_level);
        }

        if (filters.search) {
            query += ' AND (et.title LIKE ? OR et.description LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        if (filters.tags && filters.tags.length > 0) {
            const tagConditions = filters.tags.map(() => 'JSON_SEARCH(et.tags, "one", ?) IS NOT NULL');
            query += ` AND (${tagConditions.join(' OR ')})`;
            params.push(...filters.tags);
        }

        query += ' ORDER BY et.usage_count DESC, et.updated_at DESC';

        const [rows] = await pool.execute(query, params);
        return rows.map(row => new ExamTemplate(row));
    }

    // Lấy template theo ID
    static async getById(templateId) {
        const query = `
            SELECT et.*, s.name as subject_name, u.full_name as teacher_name
            FROM exam_templates et
            LEFT JOIN subjects s ON et.subject_id = s.id
            LEFT JOIN users u ON et.teacher_id = u.id
            WHERE et.id = ? AND et.is_active = TRUE
        `;

        const [rows] = await pool.execute(query, [templateId]);
        return rows.length > 0 ? new ExamTemplate(rows[0]) : null;
    }

    // Cập nhật template
    static async update(templateId, updateData) {
        const {
            title,
            description,
            subject_id,
            difficulty_level,
            duration_minutes,
            total_points,
            questions,
            tags,
            is_public
        } = updateData;

        const query = `
            UPDATE exam_templates
            SET title = ?, description = ?, subject_id = ?, difficulty_level = ?,
                duration_minutes = ?, total_points = ?, questions = ?, tags = ?,
                is_public = ?, updated_at = NOW()
            WHERE id = ?
        `;

        await pool.execute(query, [
            title,
            description,
            subject_id,
            difficulty_level,
            duration_minutes,
            total_points,
            JSON.stringify(questions),
            JSON.stringify(tags),
            is_public,
            templateId
        ]);

        return await ExamTemplate.getById(templateId);
    }

    // Xóa template (soft delete)
    static async delete(templateId) {
        const query = 'UPDATE exam_templates SET is_active = FALSE WHERE id = ?';
        await pool.execute(query, [templateId]);
        return true;
    }

    // Tạo exam từ template
    static async createExamFromTemplate(templateId, examData) {
        const template = await ExamTemplate.getById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        // Increment usage count
        await pool.execute(
            'UPDATE exam_templates SET usage_count = usage_count + 1 WHERE id = ?',
            [templateId]
        );

        // Create exam from template
        const Exam = require('./Exam');
        const newExamData = {
            title: examData.title || template.title,
            description: examData.description || template.description,
            subject_id: template.subject_id,
            teacher_id: examData.teacher_id,
            class_id: examData.class_id,
            duration_minutes: template.duration_minutes,
            total_points: template.total_points,
            start_time: examData.start_time,
            end_time: examData.end_time,
            is_active: true,
            questions: template.questions
        };

        return await Exam.create(newExamData);
    }

    // Lấy tất cả tags
    static async getAllTags() {
        const query = `
            SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(tags, CONCAT('$[', numbers.n, ']'))) as tag
            FROM exam_templates
            CROSS JOIN (
                SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION 
                SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION 
                SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION 
                SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
            ) as numbers
            WHERE JSON_UNQUOTE(JSON_EXTRACT(tags, CONCAT('$[', numbers.n, ']'))) IS NOT NULL
            AND is_active = TRUE
            ORDER BY tag
        `;

        const [rows] = await pool.execute(query);
        return rows.map(row => row.tag).filter(tag => tag);
    }

    // Tìm kiếm templates theo tags
    static async searchByTags(tags, excludeTeacherId = null) {
        let query = `
            SELECT et.*, s.name as subject_name, u.full_name as teacher_name
            FROM exam_templates et
            LEFT JOIN subjects s ON et.subject_id = s.id
            LEFT JOIN users u ON et.teacher_id = u.id
            WHERE et.is_active = TRUE AND (
        `;

        const conditions = [];
        const params = [];

        tags.forEach(tag => {
            conditions.push('JSON_SEARCH(et.tags, "one", ?) IS NOT NULL');
            params.push(tag);
        });

        query += conditions.join(' OR ') + ')';

        if (excludeTeacherId) {
            query += ' AND et.teacher_id != ?';
            params.push(excludeTeacherId);
        }

        query += ' ORDER BY et.usage_count DESC, et.updated_at DESC';

        const [rows] = await pool.execute(query, params);
        return rows.map(row => new ExamTemplate(row));
    }

    // Get statistics
    static async getStatistics(teacherId) {
        const queries = {
            total: 'SELECT COUNT(*) as count FROM exam_templates WHERE teacher_id = ? AND is_active = TRUE',
            public: 'SELECT COUNT(*) as count FROM exam_templates WHERE teacher_id = ? AND is_public = TRUE AND is_active = TRUE',
            private: 'SELECT COUNT(*) as count FROM exam_templates WHERE teacher_id = ? AND is_public = FALSE AND is_active = TRUE',
            totalUsage: 'SELECT SUM(usage_count) as total FROM exam_templates WHERE teacher_id = ? AND is_active = TRUE'
        };

        const results = {};
        for (const [key, query] of Object.entries(queries)) {
            const [rows] = await pool.execute(query, [teacherId]);
            results[key] = rows[0].count || rows[0].total || 0;
        }

        return results;
    }
}

module.exports = ExamTemplate;