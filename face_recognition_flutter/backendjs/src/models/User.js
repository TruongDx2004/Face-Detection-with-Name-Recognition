const db = require('../config/database');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.full_name = data.full_name;
        this.email = data.email;
        this.role = data.role;
        this.is_active = data.is_active;
        this.face_trained = data.face_trained;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Tìm user theo username
    static async findByUsername(username) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
                [username]
            );
            return rows.length > 0 ? new User(rows[0]) : null;
        } catch (error) {
            throw new Error(`Error finding user by username: ${error.message}`);
        }
    }

    // Tìm user theo ID
    static async findById(id) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
                [id]
            );
            return rows.length > 0 ? new User(rows[0]) : null;
        } catch (error) {
            throw new Error(`Error finding user by ID: ${error.message}`);
        }
    }

    // Tạo user mới
    static async create(userData) {
        try {
            const { username, password_hash, full_name, email, role, student_id, class_name } = userData;
            
            const query = role === 'student'
                ? 'INSERT INTO users (username, password_hash, full_name, email, role, student_id, class_name) VALUES (?, ?, ?, ?, ?, ?, ?)'
                : 'INSERT INTO users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)';

            const params = role === 'student'
                ? [username, password_hash, full_name, email, role, student_id, class_name]
                : [username, password_hash, full_name, email, role];

            const [result] = await db.execute(query, params);
            
            return await User.findById(result.insertId);
        } catch (error) {
            throw new Error(`Error creating user: ${error.message}`);
        }
    }

    // Cập nhật user
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
            const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
            
            await db.execute(query, values);
            return await User.findById(id);
        } catch (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }
    }

    // Xóa user (soft delete)
    static async delete(id) {
        try {
            await db.execute(
                'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
                [id]
            );
            return true;
        } catch (error) {
            throw new Error(`Error deleting user: ${error.message}`);
        }
    }

    // Lấy tất cả users với phân trang
    static async getAll(page = 1, limit = 10, role = null) {
        try {
            const offset = (page - 1) * limit;
            let query = 'SELECT * FROM users WHERE is_active = TRUE';
            let countQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = TRUE';
            const params = [];

            if (role) {
                query += ' AND role = ?';
                countQuery += ' AND role = ?';
                params.push(role);
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await db.execute(query, params);
            const [countResult] = await db.execute(countQuery, role ? [role] : []);

            return {
                users: rows.map(row => new User(row)),
                total: countResult[0].total,
                page,
                limit,
                totalPages: Math.ceil(countResult[0].total / limit)
            };
        } catch (error) {
            throw new Error(`Error getting users: ${error.message}`);
        }
    }

    // Kiểm tra user tồn tại
    static async exists(username, email) {
        try {
            const [rows] = await db.execute(
                'SELECT id FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE',
                [username, email]
            );
            return rows.length > 0;
        } catch (error) {
            throw new Error(`Error checking user existence: ${error.message}`);
        }
    }
}

module.exports = User;