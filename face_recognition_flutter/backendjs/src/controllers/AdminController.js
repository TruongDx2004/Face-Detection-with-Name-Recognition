const db = require('../config/database');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

class AdminController {
    // Quản lý người dùng
    async getUsers(req, res) {
        try {
            const {
                role,
                search,
                status,
                face_trained,
                page = 1,
                limit = 20
            } = req.query;

            const limitInt = parseInt(limit, 10);
            const offsetInt = (parseInt(page, 10) - 1) * limitInt;

            const params = [];
            const whereClauses = [];

            if (role) {
                whereClauses.push('u.role = ?');
                params.push(role);
            }

            if (search) {
                whereClauses.push(`(
                    u.full_name LIKE ? OR 
                    u.username LIKE ? OR 
                    u.email LIKE ?
                )`);
                const searchParam = `%${search}%`;
                params.push(searchParam, searchParam, searchParam);
            }

            if (status !== undefined) {
                const isActive = (status === 'true' || status === '1') ? 1 : 0;
                whereClauses.push('u.is_active = ?');
                params.push(isActive);
            }

            if (face_trained !== undefined) {
                const faceTrainedVal = (face_trained === 'true' || face_trained === '1') ? 1 : 0;
                whereClauses.push('u.face_trained = ?');
                params.push(faceTrainedVal);
            }

            let query = `
              SELECT 
                u.id, u.username, u.full_name, u.email, u.role, u.is_active, u.face_trained, u.created_at,
                cs.student_code,
                c.name AS class_name
              FROM users u
              LEFT JOIN class_students cs ON u.id = cs.student_id AND u.role = 'student'
              LEFT JOIN classes c ON cs.class_id = c.id AND u.role = 'student'
            `;

            let countQuery = `
              SELECT COUNT(*) as total
              FROM users u
              LEFT JOIN class_students cs ON u.id = cs.student_id AND u.role = 'student'
              LEFT JOIN classes c ON cs.class_id = c.id AND u.role = 'student'
            `;

            if (whereClauses.length > 0) {
                const whereString = whereClauses.join(' AND ');
                query += ' WHERE ' + whereString;
                countQuery += ' WHERE ' + whereString;
            }
            query += ` ORDER BY u.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;
            const finalQueryParams = params.slice(); // Clone params for main query

            const [users] = await db.execute(query, finalQueryParams);
            const [countResult] = await db.execute(countQuery, params);

            res.set('Cache-Control', 'no-store');
            res.json({
                message: 'Users retrieved successfully',
                users,
                pagination: {
                    current_page: parseInt(page, 10),
                    per_page: limitInt,
                    total: countResult[0].total,
                    total_pages: Math.ceil(countResult[0].total / limitInt)
                }
            });

        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Failed to get users' });
        }
    }

    async createUser(req, res) {
        try {
            let { username, password, full_name, email, role, student_id, class_name } = req.body;

            console.log('Creating user with:', {
                username,
                password,
                full_name,
                email,
                role,
                student_id,
                class_name
            });

            // 1️⃣ Mặc định password nếu không có
            if (!password) {
                password = '123456';
            }

            // 2️⃣ Kiểm tra field bắt buộc chung
            if (!username || !password || !full_name || !email || !role) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // 3️⃣ Kiểm tra trùng username hoặc email
            const [existing] = await db.execute(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }

            // 4️⃣ Nếu là student → kiểm tra class_name + student_id hợp lệ trước khi insert
            let class_id = null;
            if (role === 'student') {
                if (class_name && student_id) {
                    const [classRows] = await db.execute('SELECT id FROM classes WHERE name = ?', [class_name]);
                    if (classRows.length > 0) {
                        class_id = classRows[0].id;
                    } else {
                        // class_name không tồn tại, bỏ qua việc thêm vào class_students
                        console.warn(`Class "${class_name}" không tồn tại, bỏ qua gán class_students`);
                    }
                } else {
                    // class_name hoặc student_id không có, bỏ qua thêm class_students
                    console.warn('Thiếu class_name hoặc student_id, bỏ qua gán class_students');
                }
            }

            // 5️⃣ Mã hóa password
            const password_hash = await bcrypt.hash(password, 10);

            // 6️⃣ Insert user
            const [userResult] = await db.execute(
                'INSERT INTO users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
                [username, password_hash, full_name, email, role]
            );
            const newUserId = userResult.insertId;

            // 7️⃣ Nếu là student và có class_id hợp lệ → insert vào class_students
            if (role === 'student' && class_id !== null) {
                await db.execute(
                    'INSERT INTO class_students (student_id, class_id, student_code) VALUES (?, ?, ?)',
                    [newUserId, class_id, student_id]
                );
            }

            res.status(201).json({
                message: 'User created successfully',
                user_id: newUserId
            });

        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            let { full_name, email, role, student_id, class_name, is_active } = req.body;

            console.log('Updating user with:', {
                id,
                full_name,
                email,
                role,
                student_id,
                class_name,
                is_active
            });

            // 1️⃣ Check user tồn tại
            const [existing] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // 2️⃣ Update bảng users
            await db.execute(
                `UPDATE users 
             SET full_name = ?, email = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
                [full_name, email, role, is_active ?? true, id]
            );

            // 3️⃣ Nếu là student → cập nhật class_students
            if (role === 'student') {
                let class_id = null;

                if (class_name && student_id) {
                    const [classRows] = await db.execute('SELECT id FROM classes WHERE name = ?', [class_name]);
                    if (classRows.length > 0) {
                        class_id = classRows[0].id;
                    } else {
                        console.warn(`Class "${class_name}" không tồn tại, bỏ qua gán class_students`);
                    }
                }

                if (class_id !== null) {
                    // Kiểm tra đã tồn tại student trong class_students chưa
                    const [existingClass] = await db.execute(
                        'SELECT id FROM class_students WHERE student_id = ?',
                        [id]
                    );

                    if (existingClass.length > 0) {
                        // Update record cũ
                        await db.execute(
                            'UPDATE class_students SET class_id = ?, student_code = ? WHERE student_id = ?',
                            [class_id, student_id, id]
                        );
                    } else {
                        // Insert mới nếu chưa có
                        await db.execute(
                            'INSERT INTO class_students (student_id, class_id, student_code) VALUES (?, ?, ?)',
                            [id, class_id, student_id]
                        );
                    }
                }
            } else {
                // Nếu đổi role từ student → teacher/admin thì xoá record class_students (nếu có)
                await db.execute('DELETE FROM class_students WHERE student_id = ?', [id]);
            }

            res.json({ message: 'User updated successfully' });

        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    }


    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Check if user exists
            const [existing] = await db.execute('SELECT id FROM users WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Delete user (this will cascade to related records)
            await db.execute('DELETE FROM users WHERE id = ?', [id]);

            res.json({ message: 'User deleted successfully' });

        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    }

    // Reset user password
    async resetUserPassword(req, res) {
        try {
            const { id } = req.params;
            const { new_password } = req.body;

            if (!new_password) {
                return res.status(400).json({ error: 'New password is required' });
            }

            // Check if user exists
            const [existing] = await db.execute('SELECT id FROM users WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Hash new password
            const password_hash = await bcrypt.hash(new_password, 10);

            // Update password
            await db.execute(
                'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [password_hash, id]
            );

            res.json({ message: 'Password reset successfully' });

        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'Failed to reset password' });
        }
    }

    // Import multiple users
    async importUsers(req, res) {
        const usersToImport = req.body;
        const importResults = [];

        if (!Array.isArray(usersToImport)) {
            return res.status(400).json({ error: 'Request body must be an array of users.' });
        }

        // Use a transaction for atomicity
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const [index, user] of usersToImport.entries()) {
                const result = { row: index + 2, status: 'success', message: 'User created successfully' };
                const { username, full_name, email, role, password, student_code, class_name } = user;

                // Validate required fields
                if (!username || !full_name || !email || !role) {
                    result.status = 'failure';
                    result.message = 'Missing required fields: username, full_name, email, or role';
                    importResults.push(result);
                    continue;
                }

                // Check for existing user
                const [existing] = await connection.execute(
                    'SELECT id FROM users WHERE username = ? OR email = ?',
                    [username, email]
                );
                if (existing.length > 0) {
                    result.status = 'failure';
                    result.message = 'Username or email already exists';
                    importResults.push(result);
                    continue;
                }

                // Get class_id if role is 'student'
                let class_id = null;
                if (role === 'student' && class_name) {
                    const [classRows] = await connection.execute('SELECT id FROM classes WHERE name = ?', [class_name]);
                    if (classRows.length > 0) {
                        class_id = classRows[0].id;
                    }
                }

                // Hash password
                const password_hash = await bcrypt.hash(password || '123456', 10);

                // Insert user
                const [userResult] = await connection.execute(
                    'INSERT INTO users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
                    [username, password_hash, full_name, email, role]
                );
                const newUserId = userResult.insertId;

                // If student and class exists, insert into class_students
                if (role === 'student' && class_id) {
                    const codeToInsert = student_code || null;
                    await connection.execute(
                        'INSERT INTO class_students (student_id, class_id, student_code) VALUES (?, ?, ?)',
                        [newUserId, class_id, codeToInsert]
                    );
                }

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
            res.status(500).json({ error: 'Failed to import users. Transaction rolled back.' });
        } finally {
            connection.release();
        }
    }

    // Quản lý lớp học
    async getClasses(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const result = await Class.getAll(parseInt(page), parseInt(limit));
            res.json(result);
        } catch (error) {
            console.error('Get classes error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createClass(req, res) {
        try {
            const classData = req.body;
            const newClass = await Class.create(classData);

            res.status(201).json({
                message: 'Class created successfully',
                class: newClass
            });
        } catch (error) {
            console.error('Create class error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateClass(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const updatedClass = await Class.update(id, updateData);
            if (!updatedClass) {
                return res.status(404).json({ error: 'Class not found' });
            }

            res.json({
                message: 'Class updated successfully',
                class: updatedClass
            });
        } catch (error) {
            console.error('Update class error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteClass(req, res) {
        try {
            const { id } = req.params;

            const success = await Class.delete(id);
            if (!success) {
                return res.status(404).json({ error: 'Class not found' });
            }

            res.json({ message: 'Class deleted successfully' });
        } catch (error) {
            console.error('Delete class error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Quản lý môn học
    async getSubjects(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const result = await Subject.getAll(parseInt(page), parseInt(limit));
            res.json(result);
        } catch (error) {
            console.error('Get subjects error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createSubject(req, res) {
        try {
            const subjectData = req.body;
            const newSubject = await Subject.create(subjectData);

            res.status(201).json({
                message: 'Subject created successfully',
                subject: newSubject
            });
        } catch (error) {
            console.error('Create subject error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Thống kê hệ thống
    async getSystemStats(req, res) {
        try {
            const { start_date, end_date } = req.query;

            // Total users by role
            const [userStats] = await db.execute(`
                SELECT role, COUNT(*) as count 
                FROM users 
                WHERE is_active = TRUE 
                GROUP BY role
            `);

            // Attendance statistics
            let attendanceQuery = `
                SELECT 
                    DATE(s.session_date) as date,
                    COUNT(DISTINCT s.id) as total_sessions,
                    COUNT(a.id) as total_attendances,
                    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count
                FROM attendance_sessions s
                LEFT JOIN attendances a ON s.id = a.session_id
                WHERE 1=1
            `;

            const params = [];

            if (start_date) {
                attendanceQuery += ' AND s.session_date >= ?';
                params.push(start_date);
            }

            if (end_date) {
                attendanceQuery += ' AND s.session_date <= ?';
                params.push(end_date);
            }

            attendanceQuery += ' GROUP BY DATE(s.session_date) ORDER BY date DESC LIMIT 30';

            const [attendanceStats] = await db.execute(attendanceQuery, params);

            // Class statistics
            const [classStats] = await db.execute(`
                SELECT 
                    c.name AS class_name,
                    COUNT(u.id) AS student_count
                FROM classes c
                LEFT JOIN class_students cs ON cs.class_id = c.id
                LEFT JOIN users u 
                    ON u.id = cs.student_id 
                   AND u.role = 'student' 
                   AND u.is_active = TRUE
                GROUP BY c.id, c.name
                ORDER BY student_count DESC
            `);

            // Face training statistics
            const [faceStats] = await db.execute(`
                SELECT 
                    COUNT(*) as total_students,
                    COUNT(CASE WHEN face_trained = TRUE THEN 1 END) as trained_students
                FROM users 
                WHERE role = 'student' AND is_active = TRUE
            `);

            res.json({
                message: 'Statistics retrieved successfully',
                user_statistics: userStats,
                attendance_statistics: attendanceStats,
                class_statistics: classStats,
                face_training_statistics: faceStats[0]
            });

        } catch (error) {
            console.error('Get statistics error:', error);
            res.status(500).json({ error: 'Failed to get statistics' });
        }
    }

    // Get attendance reports
    async getAttendanceReports(req, res) {
        try {
            const { class_name, start_date, end_date, student_id } = req.query;

            let query = `
                SELECT 
                    u.full_name as student_name,
                    u.student_id as student_code,
                    u.class_name,
                    s.subject,
                    s.session_date,
                    s.start_time,
                    a.attendance_time,
                    a.status,
                    a.confidence_score,
                    teacher.full_name as teacher_name
                FROM attendances a
                JOIN users u ON a.student_id = u.id
                JOIN attendance_sessions s ON a.session_id = s.id
                JOIN users teacher ON s.teacher_id = teacher.id
                WHERE 1=1
            `;

            const params = [];

            if (class_name) {
                query += ' AND u.class_name = ?';
                params.push(class_name);
            }

            if (start_date) {
                query += ' AND s.session_date >= ?';
                params.push(start_date);
            }

            if (end_date) {
                query += ' AND s.session_date <= ?';
                params.push(end_date);
            }

            if (student_id) {
                query += ' AND u.id = ?';
                params.push(student_id);
            }

            query += ' ORDER BY s.session_date DESC, s.start_time DESC';

            const [attendances] = await db.execute(query, params);

            res.json({
                message: 'Attendance report retrieved successfully',
                attendances: attendances,
                total_records: attendances.length
            });

        } catch (error) {
            console.error('Get attendance report error:', error);
            res.status(500).json({ error: 'Failed to get attendance report' });
        }
    }
}

module.exports = new AdminController();