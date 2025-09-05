const db = require('../config/database');

class SubjectController {
    // Lấy danh sách tất cả subjects
    async getAllSubjects(req, res) {
        try {
            const { name, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let query = 'SELECT id, name FROM subjects WHERE 1=1';
            const params = [];

            if (name) {
                query += ' AND name LIKE ?';
                params.push(`%${name}%`);
            }

            query += ` ORDER BY name LIMIT ${limit} OFFSET ${offset}`;

            const [subjects] = await db.execute(query, params);

            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as total FROM subjects WHERE 1=1';
            const countParams = [];
            if (name) {
                countQuery += ' AND name LIKE ?';
                countParams.push(`%${name}%`);
            }

            const [countResult] = await db.execute(countQuery, countParams);
            const total = countResult[0].total;

            res.json({
                message: 'Subjects retrieved successfully',
                subjects,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get subjects error:', error);
            res.status(500).json({ error: 'Failed to retrieve subjects' });
        }
    }

    // Tạo subject mới
    async createSubject(req, res) {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Subject name is required' });
            }

            // Check if subject with same name already exists
            const [existing] = await db.execute(
                'SELECT id FROM subjects WHERE name = ?',
                [name]
            );

            if (existing.length > 0) {
                return res.status(409).json({ error: 'Subject with this name already exists' });
            }

            const [result] = await db.execute(
                'INSERT INTO subjects (name) VALUES (?)',
                [name]
            );

            res.status(201).json({
                message: 'Subject created successfully',
                subject: {
                    id: result.insertId,
                    name
                }
            });
        } catch (error) {
            console.error('Create subject error:', error);
            res.status(500).json({ error: 'Failed to create subject' });
        }
    }

    // Lấy thông tin subject theo ID
    async getSubjectById(req, res) {
        try {
            const subjectId = req.params.id;

            const [subjects] = await db.execute(
                'SELECT id, name FROM subjects WHERE id = ?',
                [subjectId]
            );

            if (subjects.length === 0) {
                return res.status(404).json({ error: 'Subject not found' });
            }

            res.json({
                message: 'Subject retrieved successfully',
                subject: subjects[0]
            });
        } catch (error) {
            console.error('Get subject error:', error);
            res.status(500).json({ error: 'Failed to retrieve subject' });
        }
    }

    // Cập nhật subject
    async updateSubject(req, res) {
        try {
            const subjectId = req.params.id;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Subject name is required' });
            }

            // Check if subject exists
            const [existing] = await db.execute('SELECT id FROM subjects WHERE id = ?', [subjectId]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'Subject not found' });
            }

            // Check for duplicate name (excluding current subject)
            const [duplicates] = await db.execute(
                'SELECT id FROM subjects WHERE name = ? AND id != ?',
                [name, subjectId]
            );
            if (duplicates.length > 0) {
                return res.status(409).json({ error: 'Subject with this name already exists' });
            }

            const [result] = await db.execute(
                'UPDATE subjects SET name = ? WHERE id = ?',
                [name, subjectId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Subject not found' });
            }

            res.json({ message: 'Subject updated successfully' });
        } catch (error) {
            console.error('Update subject error:', error);
            res.status(500).json({ error: 'Failed to update subject' });
        }
    }

    // Xóa subject
    async deleteSubject(req, res) {
        try {
            const subjectId = req.params.id;

            // Check if subject exists
            const [existing] = await db.execute('SELECT id FROM subjects WHERE id = ?', [subjectId]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'Subject not found' });
            }

            // Check if subject is being used in schedules
            const [schedules] = await db.execute(
                'SELECT COUNT(*) as count FROM schedules WHERE subject_id = ?',
                [subjectId]
            );

            if (schedules[0].count > 0) {
                return res.status(400).json({ 
                    error: 'Cannot delete subject that is being used in schedules' 
                });
            }

            await db.execute('DELETE FROM subjects WHERE id = ?', [subjectId]);

            res.json({ message: 'Subject deleted successfully' });
        } catch (error) {
            console.error('Delete subject error:', error);
            res.status(500).json({ error: 'Failed to delete subject' });
        }
    }

    // Lấy schedules của subject
    async getSubjectSchedules(req, res) {
        try {
            const subjectId = req.params.id;

            // Check if subject exists
            const [subjectExists] = await db.execute('SELECT id FROM subjects WHERE id = ?', [subjectId]);
            if (subjectExists.length === 0) {
                return res.status(404).json({ error: 'Subject not found' });
            }

            const [schedules] = await db.execute(
                `SELECT 
                    s.id,
                    s.weekday,
                    s.start_time,
                    s.end_time,
                    c.name as class_name,
                    c.code as class_code,
                    u.full_name as teacher_name,
                    u.username as teacher_username
                FROM schedules s
                JOIN classes c ON s.class_id = c.id
                JOIN users u ON s.teacher_id = u.id
                WHERE s.subject_id = ?
                ORDER BY s.weekday, s.start_time`,
                [subjectId]
            );

            res.json({
                message: 'Subject schedules retrieved successfully',
                schedules
            });
        } catch (error) {
            console.error('Get subject schedules error:', error);
            res.status(500).json({ error: 'Failed to retrieve subject schedules' });
        }
    }

    // Lấy attendance sessions của subject
    async getSubjectAttendanceSessions(req, res) {
        try {
            const subjectId = req.params.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            // Check if subject exists
            const [subjectExists] = await db.execute('SELECT id FROM subjects WHERE id = ?', [subjectId]);
            if (subjectExists.length === 0) {
                return res.status(404).json({ error: 'Subject not found' });
            }

            const [sessions] = await db.execute(
                `SELECT 
                    ats.id,
                    ats.session_date,
                    ats.start_time,
                    ats.end_time,
                    ats.is_active,
                    ats.created_at,
                    s.weekday,
                    c.name as class_name,
                    c.code as class_code,
                    u.full_name as teacher_name,
                    COUNT(a.id) as total_attendance
                FROM attendance_sessions ats
                JOIN schedules s ON ats.schedule_id = s.id
                JOIN classes c ON s.class_id = c.id
                JOIN users u ON s.teacher_id = u.id
                LEFT JOIN attendances a ON ats.id = a.session_id
                WHERE s.subject_id = ?
                GROUP BY ats.id
                ORDER BY ats.session_date DESC, ats.start_time DESC
                LIMIT ${limit} OFFSET ${offset}`,
                [subjectId]
            );

            // Get total count
            const [countResult] = await db.execute(
                `SELECT COUNT(*) as total 
                FROM attendance_sessions ats
                JOIN schedules s ON ats.schedule_id = s.id
                WHERE s.subject_id = ?`,
                [subjectId]
            );
            const total = countResult[0].total;

            res.json({
                message: 'Subject attendance sessions retrieved successfully',
                sessions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get subject attendance sessions error:', error);
            res.status(500).json({ error: 'Failed to retrieve subject attendance sessions' });
        }
    }

    // ===== SCHEDULE MANAGEMENT METHODS =====

    // Lấy danh sách tất cả schedules
    async getAllSchedules(req, res) {
        try {
            const { class_id, subject_id, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    s.id,
                    c.name as class_name,
                    c.id as class_id,
                    sub.name as subject_name,
                    u.full_name as teacher_name,
                    s.weekday,
                    s.start_time,
                    s.end_time
                FROM schedules s
                JOIN classes c ON s.class_id = c.id
                JOIN subjects sub ON s.subject_id = sub.id
                JOIN users u ON s.teacher_id = u.id
            `;

            const params = [];

            if (req.user.role === 'teacher') {
                query += ' WHERE s.teacher_id = ?';
                params.push(req.user.id);
            } else if (req.user.role === 'admin') {
                query += ' WHERE 1=1';
                if (req.query.teacher_id) {
                    query += ' AND s.teacher_id = ?';
                    params.push(parseInt(req.query.teacher_id));
                }
            } else if (req.user.role === 'student') {
                // Join bảng class_students để lấy class_id của sinh viên hiện tại
                query += `
                    JOIN class_students cs ON s.class_id = cs.class_id
                    WHERE cs.student_id = ?
                `;
                params.push(req.user.id);
            } else {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            if (class_id) {
                query += ' AND s.class_id = ?';
                params.push(parseInt(class_id));
            }

            if (subject_id) {
                query += ' AND s.subject_id = ?';
                params.push(parseInt(subject_id));
            }

            query += ` ORDER BY s.weekday, s.start_time LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

            const [schedules] = await db.execute(query, params);

            res.status(200).json({
                message: 'Schedules retrieved successfully',
                schedules
            });
        } catch (error) {
            console.error('Get schedules error:', error);
            res.status(500).json({ error: 'Failed to retrieve schedules' });
        }
    }

    // Tạo schedule mới
    async createSchedule(req, res) {
        try {
            const { class_id, subject_id, teacher_id, weekday, start_time, end_time } = req.body;

            if (!class_id || !subject_id || !teacher_id || !weekday || !start_time || !end_time) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            // Validate class, subject, and teacher existence
            const [classCheck] = await db.execute('SELECT id FROM classes WHERE id = ?', [class_id]);
            if (classCheck.length === 0) {
                return res.status(404).json({ error: 'Class not found' });
            }

            const [subjectCheck] = await db.execute('SELECT id FROM subjects WHERE id = ?', [subject_id]);
            if (subjectCheck.length === 0) {
                return res.status(404).json({ error: 'Subject not found' });
            }

            const [teacherCheck] = await db.execute('SELECT id FROM users WHERE id = ? AND role = "teacher"', [teacher_id]);
            if (teacherCheck.length === 0) {
                return res.status(404).json({ error: 'Teacher not found' });
            }

            // Check for schedule conflicts
            const [conflicts] = await db.execute(`
                SELECT id FROM schedules 
                WHERE class_id = ? AND weekday = ? 
                AND ((start_time <= ? AND end_time >= ?) OR (start_time <= ? AND end_time >= ?))
            `, [class_id, weekday, start_time, start_time, end_time, end_time]);

            if (conflicts.length > 0) {
                return res.status(400).json({ error: 'Giáo viên đã có lịch trong hôm này' });
            }

            const [result] = await db.execute(
                'INSERT INTO schedules (class_id, subject_id, teacher_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
                [class_id, subject_id, teacher_id, weekday, start_time, end_time]
            );

            res.status(201).json({
                message: 'Schedule created successfully',
                schedule_id: result.insertId
            });
        } catch (error) {
            console.error('Create schedule error:', error);
            res.status(500).json({ error: 'Failed to create schedule' });
        }
    }

    // Cập nhật schedule
    async updateSchedule(req, res) {
        try {
            const { id } = req.params;
            const { class_id, subject_id, teacher_id, weekday, start_time, end_time } = req.body;

            if (!class_id || !subject_id || !teacher_id || !weekday || !start_time || !end_time) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            // Validate class, subject, and teacher existence
            const [classCheck] = await db.execute('SELECT id FROM classes WHERE id = ?', [class_id]);
            if (classCheck.length === 0) {
                return res.status(404).json({ error: 'Class not found' });
            }

            const [subjectCheck] = await db.execute('SELECT id FROM subjects WHERE id = ?', [subject_id]);
            if (subjectCheck.length === 0) {
                return res.status(404).json({ error: 'Subject not found' });
            }

            const [teacherCheck] = await db.execute('SELECT id FROM users WHERE id = ? AND role = "teacher"', [teacher_id]);
            if (teacherCheck.length === 0) {
                return res.status(404).json({ error: 'Teacher not found' });
            }

            // Check for schedule conflicts (excluding current schedule)
            const [conflicts] = await db.execute(`
                SELECT id FROM schedules 
                WHERE class_id = ? AND weekday = ? AND id != ?
                AND ((start_time <= ? AND end_time >= ?) OR (start_time <= ? AND end_time >= ?))
            `, [class_id, weekday, id, start_time, start_time, end_time, end_time]);

            if (conflicts.length > 0) {
                return res.status(400).json({ error: 'Schedule conflict detected' });
            }

            const [result] = await db.execute(
                'UPDATE schedules SET class_id = ?, subject_id = ?, teacher_id = ?, weekday = ?, start_time = ?, end_time = ? WHERE id = ?',
                [class_id, subject_id, teacher_id, weekday, start_time, end_time, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Schedule not found' });
            }

            res.status(200).json({ message: 'Schedule updated successfully' });
        } catch (error) {
            console.error('Update schedule error:', error);
            res.status(500).json({ error: 'Failed to update schedule' });
        }
    }

    // Xóa schedule
    async deleteSchedule(req, res) {
        try {
            const { id } = req.params;

            const [result] = await db.execute('DELETE FROM schedules WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Schedule not found' });
            }

            res.status(200).json({ message: 'Schedule deleted successfully' });
        } catch (error) {
            console.error('Delete schedule error:', error);
            res.status(500).json({ error: 'Failed to delete schedule' });
        }
    }

    // Lấy options cho scheduling (classes, subjects, teachers)
    async getScheduleOptions(req, res) {
        try {
            const [classes] = await db.execute('SELECT id, name FROM classes ORDER BY name');
            const [subjects] = await db.execute('SELECT id, name FROM subjects ORDER BY name');

            let teachers = [];
            // Giáo viên chỉ lấy thông tin của chính họ
            if (req.user.role === 'teacher') {
                const [result] = await db.execute('SELECT id, full_name FROM users WHERE id = ?', [req.user.id]);
                teachers = result;
            } else {
                const [result] = await db.execute('SELECT id, full_name FROM users WHERE role = "teacher" ORDER BY full_name');
                teachers = result;
            }

            res.status(200).json({
                message: 'Options retrieved successfully',
                classes,
                subjects,
                teachers
            });
        } catch (error) {
            console.error('Get schedule options error:', error);
            res.status(500).json({ error: 'Failed to retrieve options' });
        }
    }

    // Import nhiều subjects từ Excel
    async importSubjects(req, res) {
        const subjectsToImport = req.body;
        const importResults = [];

        if (!Array.isArray(subjectsToImport)) {
            return res.status(400).json({ error: 'Dữ liệu phải là một mảng các môn học.' });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const [index, subject] of subjectsToImport.entries()) {
                const result = { 
                    row: index + 2, 
                    status: 'success', 
                    message: 'Môn học được tạo thành công',
                    data: subject
                };
                const { name } = subject;

                // Validate required fields
                if (!name || name.trim() === '') {
                    result.status = 'failure';
                    result.message = 'Thiếu trường bắt buộc: name';
                    importResults.push(result);
                    continue;
                }

                // Check for existing subject by name
                const [existing] = await connection.execute(
                    'SELECT id FROM subjects WHERE name = ?',
                    [name.trim()]
                );
                if (existing.length > 0) {
                    result.status = 'failure';
                    result.message = `Môn học '${name}' đã tồn tại`;
                    importResults.push(result);
                    continue;
                }

                // Insert subject
                const [insertResult] = await connection.execute(
                    'INSERT INTO subjects (name) VALUES (?)', 
                    [name.trim()]
                );

                result.subject_id = insertResult.insertId;
                importResults.push(result);
            }

            await connection.commit();
            
            const successCount = importResults.filter(r => r.status === 'success').length;
            const failureCount = importResults.filter(r => r.status === 'failure').length;

            res.json({
                message: 'Quá trình import hoàn tất',
                summary: {
                    total: importResults.length,
                    success: successCount,
                    failure: failureCount
                },
                results: importResults
            });

        } catch (error) {
            await connection.rollback();
            console.error('Bulk import subjects error:', error);
            res.status(500).json({ error: 'Lỗi khi import môn học. Đã rollback transaction.' });
        } finally {
            connection.release();
        }
    }

    // Import nhiều schedules từ Excel
    async importSchedules(req, res) {
        const schedulesToImport = req.body;
        const importResults = [];

        if (!Array.isArray(schedulesToImport)) {
            return res.status(400).json({ error: 'Dữ liệu phải là một mảng các lịch học.' });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const [index, schedule] of schedulesToImport.entries()) {
                const result = { 
                    row: index + 2, 
                    status: 'success', 
                    message: 'Lịch học được tạo thành công',
                    data: schedule
                };
                
                const { class_name, subject_name, teacher_name, weekday, start_time, end_time } = schedule;

                // Validate required fields
                if (!class_name || !subject_name || !teacher_name || weekday === undefined || !start_time || !end_time) {
                    result.status = 'failure';
                    result.message = 'Thiếu các trường bắt buộc: class_name, subject_name, teacher_name, weekday, start_time, end_time';
                    importResults.push(result);
                    continue;
                }

                // Validate weekday
                if (weekday < 0 || weekday > 6) {
                    result.status = 'failure';
                    result.message = 'Weekday phải từ 0 (Chủ nhật) đến 6 (Thứ bảy)';
                    importResults.push(result);
                    continue;
                }

                // Get class ID
                const [classRows] = await connection.execute('SELECT id FROM classes WHERE name = ?', [class_name.trim()]);
                if (classRows.length === 0) {
                    result.status = 'failure';
                    result.message = `Không tìm thấy lớp '${class_name}'`;
                    importResults.push(result);
                    continue;
                }
                const class_id = classRows[0].id;

                // Get subject ID
                const [subjectRows] = await connection.execute('SELECT id FROM subjects WHERE name = ?', [subject_name.trim()]);
                if (subjectRows.length === 0) {
                    result.status = 'failure';
                    result.message = `Không tìm thấy môn học '${subject_name}'`;
                    importResults.push(result);
                    continue;
                }
                const subject_id = subjectRows[0].id;

                // Get teacher ID
                const [teacherRows] = await connection.execute('SELECT id FROM users WHERE full_name = ? AND role = "teacher"', [teacher_name.trim()]);
                if (teacherRows.length === 0) {
                    result.status = 'failure';
                    result.message = `Không tìm thấy giáo viên '${teacher_name}'`;
                    importResults.push(result);
                    continue;
                }
                const teacher_id = teacherRows[0].id;

                // Check for schedule conflicts
                const [conflicts] = await connection.execute(`
                    SELECT id FROM schedules 
                    WHERE class_id = ? AND weekday = ? 
                    AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))
                `, [class_id, weekday, start_time, start_time, end_time, end_time]);

                if (conflicts.length > 0) {
                    result.status = 'failure';
                    result.message = `Phát hiện xung đột lịch học cho lớp '${class_name}' vào thứ ${weekday}`;
                    importResults.push(result);
                    continue;
                }

                // Insert schedule
                const [insertResult] = await connection.execute(
                    'INSERT INTO schedules (class_id, subject_id, teacher_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
                    [class_id, subject_id, teacher_id, weekday, start_time, end_time]
                );

                result.schedule_id = insertResult.insertId;
                importResults.push(result);
            }

            await connection.commit();
            
            const successCount = importResults.filter(r => r.status === 'success').length;
            const failureCount = importResults.filter(r => r.status === 'failure').length;

            res.json({
                message: 'Quá trình import hoàn tất',
                summary: {
                    total: importResults.length,
                    success: successCount,
                    failure: failureCount
                },
                results: importResults
            });

        } catch (error) {
            await connection.rollback();
            console.error('Bulk import schedules error:', error);
            res.status(500).json({ error: 'Lỗi khi import lịch học. Đã rollback transaction.' });
        } finally {
            connection.release();
        }
    }

    // Lấy template cho import subjects
    async getSubjectsTemplate(req, res) {
        try {
            const template = [
                { name: 'Toán học' },
                { name: 'Vật lý' },
                { name: 'Hóa học' }
            ];

            res.json({
                message: 'Template môn học được tạo thành công',
                template,
                instructions: {
                    required_fields: ['name'],
                    notes: [
                        'Tên môn học phải là duy nhất',
                        'Xóa các dòng ví dụ trước khi import',
                        'Tối đa 100 môn học mỗi lần import'
                    ]
                }
            });
        } catch (error) {
            console.error('Export subjects template error:', error);
            res.status(500).json({ error: 'Lỗi khi tạo template môn học' });
        }
    }

    // Lấy template cho import schedules
    async getSchedulesTemplate(req, res) {
        try {
            // Get sample data for template
            const [classes] = await db.execute('SELECT name FROM classes LIMIT 3');
            const [subjects] = await db.execute('SELECT name FROM subjects LIMIT 3');
            const [teachers] = await db.execute('SELECT full_name FROM users WHERE role = "teacher" LIMIT 3');

            const template = [
                {
                    class_name: classes[0]?.name || 'Lớp 10A1',
                    subject_name: subjects[0]?.name || 'Toán học',
                    teacher_name: teachers[0]?.full_name || 'Nguyễn Văn A',
                    weekday: 1,
                    start_time: '08:00:00',
                    end_time: '09:30:00'
                },
                {
                    class_name: classes[1]?.name || 'Lớp 10A2',
                    subject_name: subjects[1]?.name || 'Vật lý',
                    teacher_name: teachers[1]?.full_name || 'Trần Thị B',
                    weekday: 2,
                    start_time: '10:00:00',
                    end_time: '11:30:00'
                }
            ];

            res.json({
                message: 'Template lịch học được tạo thành công',
                template,
                instructions: {
                    required_fields: ['class_name', 'subject_name', 'teacher_name', 'weekday', 'start_time', 'end_time'],
                    field_descriptions: {
                        class_name: 'Phải khớp chính xác với tên lớp đã có',
                        subject_name: 'Phải khớp chính xác với tên môn học đã có',
                        teacher_name: 'Phải khớp chính xác với họ tên giáo viên đã có',
                        weekday: 'Số: 0=Chủ nhật, 1=Thứ hai, 2=Thứ ba, 3=Thứ tư, 4=Thứ năm, 5=Thứ sáu, 6=Thứ bảy',
                        start_time: 'Định dạng: HH:MM:SS (24 giờ)',
                        end_time: 'Định dạng: HH:MM:SS (24 giờ)'
                    },
                    notes: [
                        'Tất cả lớp, môn học và giáo viên phải đã tồn tại trong hệ thống',
                        'Không được xung đột thời gian cho cùng lớp trong cùng ngày',
                        'Xóa các dòng ví dụ trước khi import',
                        'Tối đa 50 lịch học mỗi lần import'
                    ]
                },
                available_data: {
                    classes: classes.map(c => c.name),
                    subjects: subjects.map(s => s.name),
                    teachers: teachers.map(t => t.full_name)
                }
            });
        } catch (error) {
            console.error('Export schedules template error:', error);
            res.status(500).json({ error: 'Lỗi khi tạo template lịch học' });
        }
    }
}

module.exports = new SubjectController();