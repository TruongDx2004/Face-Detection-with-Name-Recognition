const db = require('../config/database');

class ClassController {
    // Lấy danh sách tất cả classes
    async getAllClasses(req, res) {
        try {
            let page = parseInt(req.query.page, 10) || 1;
            let limit = parseInt(req.query.limit, 10) || 20;
            const offset = (page - 1) * limit;
            const name = (req.query.name || '').trim();

            let query = `
                SELECT 
                    c.id,
                    c.name,
                    c.code,
                    c.year,
                    c.description,
                    c.status,
                    COUNT(DISTINCT cs.student_id) AS studentCount,
                    SUM(CASE WHEN u.face_trained = TRUE THEN 1 ELSE 0 END) AS studentsWithFace
                FROM classes c
                LEFT JOIN class_students cs ON c.id = cs.class_id
                LEFT JOIN users u ON cs.student_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (name) {
                query += ' AND c.name LIKE ?';
                params.push(`%${name}%`);
            }

            query += `
                GROUP BY c.id, c.name, c.code, c.year, c.description, c.status
                ORDER BY c.name
                LIMIT ${limit} OFFSET ${offset}
            `;

            const [classes] = await db.execute(query, params);

            // Get total count for pagination
            let countQuery = 'SELECT COUNT(DISTINCT c.id) as total FROM classes c WHERE 1=1';
            const countParams = [];
            if (name) {
                countQuery += ' AND c.name LIKE ?';
                countParams.push(`%${name}%`);
            }

            const [countResult] = await db.execute(countQuery, countParams);
            const total = countResult[0].total;

            res.json({
                message: 'Classes retrieved successfully',
                classes,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get classes error:', error);
            res.status(500).json({ error: 'Failed to retrieve classes' });
        }
    }

    // Tạo class mới
    async createClass(req, res) {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Class name is required' });
            }

            // Check if class already exists
            const [existing] = await db.execute('SELECT id FROM classes WHERE name = ?', [name]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Class already exists' });
            }

            const [result] = await db.execute('INSERT INTO classes (name) VALUES (?)', [name]);

            res.status(201).json({
                message: 'Class created successfully',
                class_id: result.insertId
            });
        } catch (error) {
            console.error('Create class error:', error);
            res.status(500).json({ error: 'Failed to create class' });
        }
    }

    // Lấy thông tin class theo ID
    async getClassById(req, res) {
        try {
            const classId = req.params.id;

            const [classes] = await db.execute(
                `SELECT 
                    c.id,
                    c.name,
                    c.code,
                    c.year,
                    c.description,
                    c.status,
                    c.created_at,
                    c.updated_at,
                    COUNT(DISTINCT cs.student_id) AS studentCount,
                    SUM(CASE WHEN u.face_trained = TRUE THEN 1 ELSE 0 END) AS studentsWithFace
                FROM classes c
                LEFT JOIN class_students cs ON c.id = cs.class_id
                LEFT JOIN users u ON cs.student_id = u.id
                WHERE c.id = ?
                GROUP BY c.id`,
                [classId]
            );

            if (classes.length === 0) {
                return res.status(404).json({ error: 'Class not found' });
            }

            res.json({
                message: 'Class retrieved successfully',
                class: classes[0]
            });
        } catch (error) {
            console.error('Get class error:', error);
            res.status(500).json({ error: 'Failed to retrieve class' });
        }
    }

    // Cập nhật class
    async updateClass(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Class name is required' });
            }

            // Check for duplicate name (excluding current class)
            const [existing] = await db.execute('SELECT id FROM classes WHERE name = ? AND id != ?', [name, id]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Class name already exists' });
            }

            const [result] = await db.execute('UPDATE classes SET name = ? WHERE id = ?', [name, id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Class not found' });
            }

            res.status(200).json({ message: 'Class updated successfully' });
        } catch (error) {
            console.error('Update class error:', error);
            res.status(500).json({ error: 'Failed to update class' });
        }
    }

    // Xóa class
    async deleteClass(req, res) {
        try {
            const classId = req.params.id;

            // Check if class exists
            const [existing] = await db.execute('SELECT id FROM classes WHERE id = ?', [classId]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'Class not found' });
            }

            // Check if class has students
            const [students] = await db.execute(
                'SELECT COUNT(*) as count FROM class_students WHERE class_id = ?',
                [classId]
            );

            if (students[0].count > 0) {
                return res.status(400).json({ 
                    error: 'Cannot delete class with students. Please remove all students first.' 
                });
            }

            await db.execute('DELETE FROM classes WHERE id = ?', [classId]);

            res.json({ message: 'Class deleted successfully' });
        } catch (error) {
            console.error('Delete class error:', error);
            res.status(500).json({ error: 'Failed to delete class' });
        }
    }

    // Lấy danh sách students trong class
    async getClassStudents(req, res) {
        try {
            const classId = req.params.id;

            // Check if class exists
            const [classExists] = await db.execute('SELECT id FROM classes WHERE id = ?', [classId]);
            if (classExists.length === 0) {
                return res.status(404).json({ error: 'Class not found' });
            }

            const [students] = await db.execute(
                `SELECT 
                    u.id,
                    u.username,
                    u.full_name,
                    u.email,
                    u.face_trained,
                    u.is_active,
                    cs.student_code,
                    cs.joined_at
                FROM class_students cs
                JOIN users u ON cs.student_id = u.id
                WHERE cs.class_id = ?
                ORDER BY cs.student_code, u.full_name`,
                [classId]
            );

            res.json({
                message: 'Class students retrieved successfully',
                students
            });
        } catch (error) {
            console.error('Get class students error:', error);
            res.status(500).json({ error: 'Failed to retrieve class students' });
        }
    }

    // Thêm student vào class
    async addStudentToClass(req, res) {
        try {
            const { id } = req.params;
            let { student_id, student_code } = req.body;

            if (!student_id) {
                return res.status(400).json({ error: 'Student ID is required' });
            }

            // Nếu không có student_code thì tự tạo
            if (!student_code || student_code.trim() === '') {
                student_code = `SV${id}${student_id}`;
            }

            // Check if class exists
            const [classCheck] = await db.execute('SELECT id FROM classes WHERE id = ?', [id]);
            if (classCheck.length === 0) {
                return res.status(404).json({ error: 'Class not found' });
            }

            // Check if student exists and has student role
            const [studentCheck] = await db.execute('SELECT id FROM users WHERE id = ? AND role = "student"', [student_id]);
            if (studentCheck.length === 0) {
                return res.status(404).json({ error: 'Student not found' });
            }

            // Check if student is already in class
            const [existing] = await db.execute(
                'SELECT id FROM class_students WHERE class_id = ? AND student_id = ?',
                [id, student_id]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Student already in class' });
            }

            // Check if student code is unique
            const [codeCheck] = await db.execute('SELECT id FROM class_students WHERE student_code = ?', [student_code]);
            if (codeCheck.length > 0) {
                return res.status(400).json({ error: 'Student code already exists' });
            }

            await db.execute(
                'INSERT INTO class_students (class_id, student_id, student_code) VALUES (?, ?, ?)',
                [id, student_id, student_code]
            );

            res.status(201).json({ message: 'Student added to class successfully' });
        } catch (error) {
            console.error('Add student to class error:', error);
            res.status(500).json({ error: 'Failed to add student to class' });
        }
    }

    // Xóa student khỏi class
    async removeStudentFromClass(req, res) {
        try {
            const classId = req.params.id;
            const studentId = req.params.student_id;

            // Check if student is in this class
            const [studentInClass] = await db.execute(
                'SELECT id FROM class_students WHERE class_id = ? AND student_id = ?',
                [classId, studentId]
            );

            if (studentInClass.length === 0) {
                return res.status(404).json({ error: 'Student not found in this class' });
            }

            await db.execute(
                'DELETE FROM class_students WHERE class_id = ? AND student_id = ?',
                [classId, studentId]
            );

            res.json({ message: 'Student removed from class successfully' });
        } catch (error) {
            console.error('Remove student from class error:', error);
            res.status(500).json({ error: 'Failed to remove student from class' });
        }
    }

    // Lấy danh sách students có thể thêm vào class (chưa thuộc lớp nào)
    async getAvailableStudents(req, res) {
        try {
            const [students] = await db.execute(
                `SELECT 
                    u.id, 
                    u.full_name AS name, 
                    u.email
                FROM users u
                WHERE u.role = 'student'
                  AND u.is_active = 1
                  AND u.id NOT IN (
                      SELECT cs.student_id FROM class_students cs
                  )
                ORDER BY u.full_name`
            );
            
            res.json({
                message: 'Available students retrieved successfully',
                students
            });
        } catch (error) {
            console.error('Get available students error:', error);
            res.status(500).json({ error: 'Failed to retrieve available students' });
        }
    }

    // Import nhiều classes cùng lúc
    async importClasses(req, res) {
        const classesToImport = req.body;
        const importResults = [];

        if (!Array.isArray(classesToImport)) {
            return res.status(400).json({ error: 'Request body must be an array of classes.' });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const [index, cls] of classesToImport.entries()) {
                const result = { row: index + 2, status: 'success', message: 'Class created successfully' };
                const { name } = cls;

                // Validate required fields
                if (!name) {
                    result.status = 'failure';
                    result.message = 'Missing required field: name';
                    importResults.push(result);
                    continue;
                }

                // Check for existing class
                const [existing] = await connection.execute(
                    'SELECT id FROM classes WHERE name = ?',
                    [name]
                );
                if (existing.length > 0) {
                    result.status = 'failure';
                    result.message = `Class name '${name}' already exists`;
                    importResults.push(result);
                    continue;
                }

                // Insert class
                await connection.execute('INSERT INTO classes (name) VALUES (?)', [name]);

                importResults.push(result);
            }

            await connection.commit();
            res.json({
                message: 'Import process completed',
                results: importResults
            });

        } catch (error) {
            await connection.rollback();
            console.error('Bulk import error:', error);
            res.status(500).json({ error: 'Failed to import classes. Transaction rolled back.' });
        } finally {
            connection.release();
        }
    }
}

module.exports = new ClassController();