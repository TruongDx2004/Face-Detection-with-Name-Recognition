const db = require('../config/database');

class Subject {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.code = data.code;
        this.description = data.description;
        this.credits = data.credits;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Tìm subject theo ID
    static async findById(id) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM subjects WHERE id = ? AND is_active = TRUE',
                [id]
            );
            return rows.length > 0 ? new Subject(rows[0]) : null;
        } catch (error) {
            throw new Error(`Error finding subject by ID: ${error.message}`);
        }
    }

    // Tìm subject theo code
    static async findByCode(code) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM subjects WHERE code = ? AND is_active = TRUE',
                [code]
            );
            return rows.length > 0 ? new Subject(rows[0]) : null;
        } catch (error) {
            throw new Error(`Error finding subject by code: ${error.message}`);
        }
    }

    // Tạo subject mới
    static async create(subjectData) {
        try {
            const { name, code, description, credits } = subjectData;
            
            const [result] = await db.execute(
                'INSERT INTO subjects (name, code, description, credits) VALUES (?, ?, ?, ?)',
                [name, code, description, credits]
            );
            
            return await Subject.findById(result.insertId);
        } catch (error) {
            throw new Error(`Error creating subject: ${error.message}`);
        }
    }

    // Cập nhật subject
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (fields.length === 0) {
                throw new Error('No fields to update');
            }

            values.push(id);
            const query = `UPDATE subjects SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
            
            await db.execute(query, values);
            return await Subject.findById(id);
        } catch (error) {
            throw new Error(`Error updating subject: ${error.message}`);
        }
    }

    // Xóa subject (soft delete)
    static async delete(id) {
        try {
            await db.execute(
                'UPDATE subjects SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
                [id]
            );
            return true;
        } catch (error) {
            throw new Error(`Error deleting subject: ${error.message}`);
        }
    }

    // Lấy tất cả subjects với phân trang
    static async getAll(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            const [rows] = await db.execute(
                'SELECT * FROM subjects WHERE is_active = TRUE ORDER BY created_at DESC LIMIT ? OFFSET ?',
                [limit, offset]
            );

            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM subjects WHERE is_active = TRUE'
            );

            return {
                subjects: rows.map(row => new Subject(row)),
                total: countResult[0].total,
                page,
                limit,
                totalPages: Math.ceil(countResult[0].total / limit)
            };
        } catch (error) {
            throw new Error(`Error getting subjects: ${error.message}`);
        }
    }

    // Kiểm tra subject code đã tồn tại
    static async codeExists(code, excludeId = null) {
        try {
            let query = 'SELECT id FROM subjects WHERE code = ? AND is_active = TRUE';
            const params = [code];

            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }

            const [rows] = await db.execute(query, params);
            return rows.length > 0;
        } catch (error) {
            throw new Error(`Error checking subject code existence: ${error.message}`);
        }
    }
}

module.exports = Subject;