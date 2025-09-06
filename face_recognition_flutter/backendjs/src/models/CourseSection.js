const db = require('../config/database');

class CourseSection {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.code = data.code;
        this.class_id = data.class_id;
        this.subject_id = data.subject_id;
        this.teacher_id = data.teacher_id;
        this.semester = data.semester;
        this.academic_year = data.academic_year;
        this.max_students = data.max_students;
        this.description = data.description;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Tìm course section theo ID
    static async findById(id) {
        try {
            const [rows] = await db.execute(`
                SELECT cs.*, 
                       c.name as class_name, 
                       s.name as subject_name, s.code as subject_code, s.credits,
                       u.full_name as teacher_name
                FROM course_sections cs
                LEFT JOIN classes c ON cs.class_id = c.id
                LEFT JOIN subjects s ON cs.subject_id = s.id
                LEFT JOIN users u ON cs.teacher_id = u.id
                WHERE cs.id = ? AND cs.is_active = TRUE
            `, [id]);

            if (rows.length > 0) {
                const courseSection = new CourseSection(rows[0]);
                courseSection.class_name = rows[0].class_name;
                courseSection.subject_name = rows[0].subject_name;
                courseSection.subject_code = rows[0].subject_code;
                courseSection.credits = rows[0].credits;
                courseSection.teacher_name = rows[0].teacher_name;
                return courseSection;
            }
            return null;
        } catch (error) {
            throw new Error(`Error finding course section by ID: ${error.message}`);
        }
    }

    // Tìm course section theo code
    static async findByCode(code) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM course_sections WHERE code = ? AND is_active = TRUE',
                [code]
            );
            return rows.length > 0 ? new CourseSection(rows[0]) : null;
        } catch (error) {
            throw new Error(`Error finding course section by code: ${error.message}`);
        }
    }

    // Tạo course section mới
    static async create(courseSectionData) {
        try {
            const {
                name, code, class_id, subject_id, teacher_id,
                semester, academic_year, max_students, description
            } = courseSectionData;

            // Insert
            const [result] = await db.execute(`
            INSERT INTO course_sections 
                (name, code, class_id, subject_id, teacher_id, semester, academic_year, max_students, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, code, class_id, subject_id, teacher_id, semester, academic_year, max_students, description]);

            const insertId = result.insertId;

            // Fetch with JOIN to include related names
            const [rows] = await db.execute(`
            SELECT cs.*, 
                   c.name AS class_name,
                   s.name AS subject_name,
                   u.full_name AS teacher_name
            FROM course_sections cs
            JOIN classes c ON cs.class_id = c.id
            JOIN subjects s ON cs.subject_id = s.id
            JOIN users u ON cs.teacher_id = u.id
            WHERE cs.id = ?
        `, [insertId]);

            if (rows.length === 0) {
                throw new Error("Course section created but not found");
            }

            return rows[0];
        } catch (error) {
            throw new Error(`Error creating course section: ${error.message}`);
        }
    }


    // Cập nhật course section
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
            const query = `UPDATE course_sections SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;

            await db.execute(query, values);
            return await CourseSection.findById(id);
        } catch (error) {
            throw new Error(`Error updating course section: ${error.message}`);
        }
    }

    // Xóa course section (soft delete)
    static async delete(id) {
        try {
            await db.execute(
                'UPDATE course_sections SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
                [id]
            );
            return true;
        } catch (error) {
            throw new Error(`Error deleting course section: ${error.message}`);
        }
    }

    // Lấy tất cả course sections với phân trang
    static async getAll(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;

            // Base query
            let query = `
            SELECT cs.*, 
                   c.name AS class_name,
                   s.name AS subject_name,
                   u.full_name AS teacher_name
            FROM course_sections cs
            JOIN classes c ON cs.class_id = c.id
            JOIN subjects s ON cs.subject_id = s.id
            JOIN users u ON cs.teacher_id = u.id
            WHERE cs.is_active = 1
        `;

            let countQuery = `
            SELECT COUNT(*) as total
            FROM course_sections cs
            JOIN classes c ON cs.class_id = c.id
            JOIN subjects s ON cs.subject_id = s.id
            JOIN users u ON cs.teacher_id = u.id
            WHERE cs.is_active = 1
        `;

            const filterParams = [];

            // Apply filters dynamically
            if (filters.class_id) {
                query += ` AND cs.class_id = ?`;
                countQuery += ` AND cs.class_id = ?`;
                filterParams.push(filters.class_id);
            }

            if (filters.subject_id) {
                query += ` AND cs.subject_id = ?`;
                countQuery += ` AND cs.subject_id = ?`;
                filterParams.push(filters.subject_id);
            }

            if (filters.teacher_name) {
                query += ` AND u.full_name LIKE ?`;
                countQuery += ` AND u.full_name LIKE ?`;
                filterParams.push(`%${filters.teacher_name}%`);
            }

            if (filters.semester) {
                query += ` AND cs.semester = ?`;
                countQuery += ` AND cs.semester = ?`;
                filterParams.push(filters.semester);
            }

            if (filters.academic_year) {
                query += ` AND cs.academic_year = ?`;
                countQuery += ` AND cs.academic_year = ?`;
                filterParams.push(filters.academic_year);
            }

            // Add order and pagination
            query += ` ORDER BY u.created_at DESC LIMIT ${limit} OFFSET ${offset}`;


            // Execute queries
            const [rows] = await db.execute(query, [...filterParams]);
            const [countResult] = await db.execute(countQuery, filterParams);

            return {
                courseSections: rows,
                total: countResult[0].total,
                page,
                limit,
                totalPages: Math.ceil(countResult[0].total / limit)
            };
        } catch (error) {
            throw new Error(`Error getting course sections: ${error.message}`);
        }
    }




    // Lấy schedules của course section
    static async getSchedules(courseSectionId) {
        try {
            const [rows] = await db.execute(`
                SELECT * FROM schedules 
                WHERE course_section_id = ? AND is_active = TRUE
                ORDER BY weekday, start_time
            `, [courseSectionId]);

            return rows;
        } catch (error) {
            throw new Error(`Error getting course section schedules: ${error.message}`);
        }
    }

    // Lấy students trong course section (thông qua class)
    static async getStudents(courseSectionId) {
        try {
            const [rows] = await db.execute(`
                SELECT u.*, cs_students.student_code 
                FROM users u 
                JOIN class_students cs_students ON u.id = cs_students.student_id 
                JOIN course_sections cs ON cs_students.class_id = cs.class_id
                WHERE cs.id = ? AND u.is_active = TRUE AND cs.is_active = TRUE
                ORDER BY cs_students.student_code
            `, [courseSectionId]);

            return rows;
        } catch (error) {
            throw new Error(`Error getting course section students: ${error.message}`);
        }
    }

    // Lấy attendance sessions của course section
    static async getAttendanceSessions(courseSectionId) {
        try {
            const [rows] = await db.execute(`
                SELECT * FROM attendance_sessions 
                WHERE course_section_id = ? AND is_active = TRUE
                ORDER BY session_date DESC, start_time DESC
            `, [courseSectionId]);

            return rows;
        } catch (error) {
            throw new Error(`Error getting course section attendance sessions: ${error.message}`);
        }
    }

    // Kiểm tra course section code đã tồn tại
    static async codeExists(code, excludeId = null) {
        try {
            let query = 'SELECT id FROM course_sections WHERE code = ? AND is_active = TRUE';
            const params = [code];

            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }

            const [rows] = await db.execute(query, params);
            return rows.length > 0;
        } catch (error) {
            throw new Error(`Error checking course section code existence: ${error.message}`);
        }
    }

    // Lấy course sections theo teacher
    static async getByTeacher(teacherId, page = 1, limit = 10) {
        try {
            return await CourseSection.getAll(page, limit, { teacher_id: teacherId });
        } catch (error) {
            throw new Error(`Error getting course sections by teacher: ${error.message}`);
        }
    }

    // Lấy course sections theo class
    static async getByClass(classId, page = 1, limit = 10) {
        try {
            return await CourseSection.getAll(page, limit, { class_id: classId });
        } catch (error) {
            throw new Error(`Error getting course sections by class: ${error.message}`);
        }
    }
}

module.exports = CourseSection;