const db = require('../config/database');

class Class {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.code = data.code;
        this.year = data.year;
        this.description = data.description;
        this.teacher_id = data.teacher_id;
        this.status = data.status || data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Tìm class theo ID
    static async findById(id) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM classes WHERE id = ? AND status = TRUE',
                [id]
            );
            return rows.length > 0 ? new Class(rows[0]) : null;
        } catch (error) {
            throw new Error(`Error finding class by ID: ${error.message}`);
        }
    }

    // Tạo class mới
    static async create(classData) {
        try {
            const { name, code, year, description, teacher_id, status = 'active' } = classData;
            
            const [result] = await db.execute(
                'INSERT INTO classes (name, code, year, description, teacher_id, status) VALUES (?, ?, ?, ?, ?, ?)',
                [name, code, year, description, teacher_id, status]
            );
            
            return await Class.findById(result.insertId);
        } catch (error) {
            throw new Error(`Error creating class: ${error.message}`);
        }
    }

    // Cập nhật class
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
            const query = `UPDATE classes SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
            
            await db.execute(query, values);
            return await Class.findById(id);
        } catch (error) {
            throw new Error(`Error updating class: ${error.message}`);
        }
    }

    // Xóa class (soft delete)
    static async delete(id) {
        try {
            await db.execute(
                'UPDATE classes SET status = FALSE, updated_at = NOW() WHERE id = ?',
                [id]
            );
            return true;
        } catch (error) {
            throw new Error(`Error deleting class: ${error.message}`);
        }
    }

    // Lấy tất cả classes với phân trang
    static async getAll(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            const [rows] = await db.execute(`
                SELECT c.*, u.full_name as teacher_name 
                FROM classes c 
                LEFT JOIN users u ON c.teacher_id = u.id 
                WHERE c.status  = TRUE 
                ORDER BY c.created_at DESC 
                LIMIT ? OFFSET ?
            `, [limit, offset]);

            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM classes WHERE status  = TRUE'
            );

            return {
                classes: rows.map(row => ({
                    ...new Class(row),
                    teacher_name: row.teacher_name
                })),
                total: countResult[0].total,
                page,
                limit,
                totalPages: Math.ceil(countResult[0].total / limit)
            };
        } catch (error) {
            throw new Error(`Error getting classes: ${error.message}`);
        }
    }

    // Lấy students trong class
    static async getStudents(classId) {
        try {
            const [rows] = await db.execute(`
                SELECT u.*, cs.student_code 
                FROM users u 
                JOIN class_students cs ON u.id = cs.student_id 
                WHERE cs.class_id = ? AND u.status = TRUE
                ORDER BY cs.student_code
            `, [classId]);

            return rows;
        } catch (error) {
            throw new Error(`Error getting class students: ${error.message}`);
        }
    }

    // Thêm student vào class
    static async addStudent(classId, studentId, studentCode) {
        try {
            await db.execute(
                'INSERT INTO class_students (class_id, student_id, student_code) VALUES (?, ?, ?)',
                [classId, studentId, studentCode]
            );
            return true;
        } catch (error) {
            throw new Error(`Error adding student to class: ${error.message}`);
        }
    }

    // Xóa student khỏi class
    static async removeStudent(classId, studentId) {
        try {
            await db.execute(
                'DELETE FROM class_students WHERE class_id = ? AND student_id = ?',
                [classId, studentId]
            );
            return true;
        } catch (error) {
            throw new Error(`Error removing student from class: ${error.message}`);
        }
    }
}

module.exports = Class;