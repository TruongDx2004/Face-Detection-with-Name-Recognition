const db = require('../config/database');

class ClassController {
    // Lấy danh sách tất cả classes
    async getAllClasses(req, res) {
        try {
            let page = parseInt(req.query.page, 10) || 1;
            let limit = parseInt(req.query.limit, 10) || 20;
            const offset = (page - 1) * limit;
            const name = (req.query.name || '').trim();
            const status = req.query.status;
            const year = req.query.year;

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

            if (status) {
                query += ' AND c.status = ?';
                params.push(status);
            }

            if (year) {
                query += ' AND c.year = ?';
                params.push(year);
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
            if (status) {
                countQuery += ' AND c.status = ?';
                countParams.push(status);
            }
            if (year) {
                countQuery += ' AND c.year = ?';
                countParams.push(year);
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
            const { name, code, year, description, status } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Class name is required' });
            }

            // Validate status if provided
            if (status && !['active', 'inactive'].includes(status)) {
                return res.status(400).json({ error: 'Status must be either "active" or "inactive"' });
            }

            // Check if class already exists by name
            const [existing] = await db.execute('SELECT id FROM classes WHERE name = ?', [name]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Class name already exists' });
            }

            // Check if code already exists (if provided)
            if (code) {
                const [codeExists] = await db.execute('SELECT id FROM classes WHERE code = ?', [code]);
                if (codeExists.length > 0) {
                    return res.status(400).json({ error: 'Mã lớp này đã tồn tại' });
                }
            }

            const [result] = await db.execute(
                'INSERT INTO classes (name, code, year, description, status) VALUES (?, ?, ?, ?, ?)', 
                [name, code || null, year || null, description || null, status || 'active']
            );

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
                    COUNT(DISTINCT cs.student_id) AS studentCount,
                    SUM(CASE WHEN u.face_trained = TRUE THEN 1 ELSE 0 END) AS studentsWithFace
                FROM classes c
                LEFT JOIN class_students cs ON c.id = cs.class_id
                LEFT JOIN users u ON cs.student_id = u.id
                WHERE c.id = ?
                GROUP BY c.id, c.name, c.code, c.year, c.description, c.status`,
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
            const { name, code, year, description, status } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Yêu cầu tên lớp' });
            }

            // Validate status if provided
            if (status && !['active', 'inactive'].includes(status)) {
                return res.status(400).json({ error: 'Trạng thái phải là "active" hoặc "inactive"' });
            }

            // Check for duplicate name (excluding current class)
            const [existing] = await db.execute('SELECT id FROM classes WHERE name = ? AND id != ?', [name, id]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Tên Lớp đã tồn tại' });
            }

            // Check for duplicate code (excluding current class)
            if (code) {
                const [codeExists] = await db.execute('SELECT id FROM classes WHERE code = ? AND id != ?', [code, id]);
                if (codeExists.length > 0) {
                    return res.status(400).json({ error: 'Mã Lớp này đã tồn tại' });
                }
            }

            const [result] = await db.execute(
                'UPDATE classes SET name = ?, code = ?, year = ?, description = ?, status = ? WHERE id = ?', 
                [name, code || null, year || null, description || null, status || 'active', id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Không tìm thấy Lớp' });
            }

            res.status(200).json({ message: 'Cập nhât Lớp thành công' });
        } catch (error) {
            console.error('Update class error:', error);
            res.status(500).json({ error: 'Lỗi khi cập nhật Lớp' });
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
                    error: 'Không thể xóa Lớp vì vẫn còn sinh viên trong lớp'
                });
            }

            await db.execute('DELETE FROM classes WHERE id = ?', [classId]);

            res.json({ message: 'Xóa lớp thành công' });
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
                    cs.student_code
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
                'INSERT INTO class_students (student_id, class_id, student_code) VALUES (?, ?, ?)',
                [student_id, id, student_code]
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
                const { name, code, year, description, status } = cls;

                // Validate required fields
                if (!name) {
                    result.status = 'failure';
                    result.message = 'Missing required field: name';
                    importResults.push(result);
                    continue;
                }

                // Validate status if provided
                if (status && !['active', 'inactive'].includes(status)) {
                    result.status = 'failure';
                    result.message = 'Status must be either "active" or "inactive"';
                    importResults.push(result);
                    continue;
                }

                // Check for existing class by name
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

                // Check for existing class by code (if provided)
                if (code) {
                    const [codeExists] = await connection.execute(
                        'SELECT id FROM classes WHERE code = ?',
                        [code]
                    );
                    if (codeExists.length > 0) {
                        result.status = 'failure';
                        result.message = `Class code '${code}' already exists`;
                        importResults.push(result);
                        continue;
                    }
                }

                // Insert class
                await connection.execute(
                    'INSERT INTO classes (name, code, year, description, status) VALUES (?, ?, ?, ?, ?)', 
                    [name, code || null, year || null, description || null, status || 'active']
                );

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

    // Lấy thống kê tổng quan về classes
    async getClassStatistics(req, res) {
        try {
            const [stats] = await db.execute(`
                SELECT 
                    COUNT(*) as totalClasses,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeClasses,
                    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactiveClasses,
                    COUNT(DISTINCT year) as totalYears
                FROM classes
            `);

            const [studentStats] = await db.execute(`
                SELECT 
                    COUNT(DISTINCT cs.student_id) as totalStudents,
                    COUNT(DISTINCT CASE WHEN u.face_trained = TRUE THEN cs.student_id END) as studentsWithFace
                FROM class_students cs
                LEFT JOIN users u ON cs.student_id = u.id
            `);

            const [yearStats] = await db.execute(`
                SELECT 
                    year,
                    COUNT(*) as classCount,
                    COUNT(DISTINCT cs.student_id) as studentCount
                FROM classes c
                LEFT JOIN class_students cs ON c.id = cs.class_id
                WHERE year IS NOT NULL
                GROUP BY year
                ORDER BY year DESC
            `);

            res.json({
                message: 'Class statistics retrieved successfully',
                statistics: {
                    ...stats[0],
                    ...studentStats[0],
                    yearBreakdown: yearStats
                }
            });
        } catch (error) {
            console.error('Get class statistics error:', error);
            res.status(500).json({ error: 'Failed to retrieve class statistics' });
        }
    }

    // Lấy danh sách các năm học có sẵn
    async getAvailableYears(req, res) {
        try {
            const [years] = await db.execute(`
                SELECT DISTINCT year 
                FROM classes 
                WHERE year IS NOT NULL 
                ORDER BY year DESC
            `);

            res.json({
                message: 'Available years retrieved successfully',
                years: years.map(row => row.year)
            });
        } catch (error) {
            console.error('Get available years error:', error);
            res.status(500).json({ error: 'Failed to retrieve available years' });
        }
    }

    // Cập nhật trạng thái class (active/inactive)
    async updateClassStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status || !['active', 'inactive'].includes(status)) {
                return res.status(400).json({ error: 'Status must be either "active" or "inactive"' });
            }

            const [result] = await db.execute(
                'UPDATE classes SET status = ? WHERE id = ?',
                [status, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Class not found' });
            }

            res.json({ message: `Class status updated to ${status} successfully` });
        } catch (error) {
            console.error('Update class status error:', error);
            res.status(500).json({ error: 'Failed to update class status' });
        }
    }

    // Lấy danh sách classes theo năm học
    async getClassesByYear(req, res) {
        try {
            const { year } = req.params;

            const [classes] = await db.execute(`
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
                WHERE c.year = ?
                GROUP BY c.id, c.name, c.code, c.year, c.description, c.status
                ORDER BY c.name
            `, [year]);

            res.json({
                message: `Classes for year ${year} retrieved successfully`,
                classes,
                year
            });
        } catch (error) {
            console.error('Get classes by year error:', error);
            res.status(500).json({ error: 'Failed to retrieve classes by year' });
        }
    }
}

module.exports = new ClassController();