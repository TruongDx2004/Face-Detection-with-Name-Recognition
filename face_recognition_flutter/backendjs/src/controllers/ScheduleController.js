const db = require('../config/database');
const responseHelper = require('../utils/responseHelper');

class ScheduleController {
    // Lấy danh sách tất cả schedules
    async getAllSchedules(req, res) {
        try {
            const { course_section_id, weekday, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    s.id,
                    s.course_section_id,
                    s.weekday,
                    s.start_time,
                    s.end_time,
                    s.room,
                    s.is_active,
                    s.created_at,
                    cs.name as course_section_name,
                    cs.code as course_section_code,
                    cs.semester,
                    cs.academic_year,
                    c.name as class_name,
                    cs.class_id,
                    sub.name as subject_name,
                    u.full_name as teacher_name
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                JOIN classes c ON cs.class_id = c.id
                JOIN subjects sub ON cs.subject_id = sub.id
                JOIN users u ON cs.teacher_id = u.id
                WHERE s.is_active = TRUE
            `;

            const params = [];

            // Role-based filtering
            if (req.user.role === 'teacher') {
                query += ' AND cs.teacher_id = ?';
                params.push(req.user.id);
            } else if (req.user.role === 'student') {
                query += ` AND cs.id IN (
                    SELECT cs.id 
                    FROM course_sections cs 
                    JOIN class_students cls ON cs.class_id = cls.class_id 
                    WHERE cls.student_id = ?
                )`;
                params.push(req.user.id);
            }

            if (course_section_id) {
                query += ' AND s.course_section_id = ?';
                params.push(parseInt(course_section_id));
            }

            if (weekday !== undefined) {
                query += ' AND s.weekday = ?';
                params.push(parseInt(weekday));
            }

            query += ` ORDER BY s.weekday, s.start_time LIMIT ${limit} OFFSET ${offset}`;

            const [schedules] = await db.execute(query, params);

            // Get total count
            let countQuery = `
                SELECT COUNT(*) as total 
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                WHERE s.is_active = TRUE
            `;
            const countParams = [];

            if (req.user.role === 'teacher') {
                countQuery += ' AND cs.teacher_id = ?';
                countParams.push(req.user.id);
            } else if (req.user.role === 'student') {
                countQuery += ` AND cs.id IN (
                    SELECT cs.id 
                    FROM course_sections cs 
                    JOIN class_students cls ON cs.class_id = cls.class_id 
                    WHERE cls.student_id = ?
                )`;
                countParams.push(req.user.id);
            }

            if (course_section_id) {
                countQuery += ' AND s.course_section_id = ?';
                countParams.push(parseInt(course_section_id));
            }

            if (weekday !== undefined) {
                countQuery += ' AND s.weekday = ?';
                countParams.push(parseInt(weekday));
            }

            const [countResult] = await db.execute(countQuery, countParams);
            const total = countResult[0].total;

            return responseHelper.success(res, {
                schedules,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }, 'Schedules retrieved successfully');
        } catch (error) {
            console.error('Get schedules error:', error);
            return responseHelper.error(res, 'Failed to retrieve schedules', 500);
        }
    }

    // Lấy lịch học theo tuần
    async getWeeklySchedule(req, res) {
        try {
            const { course_section_id, week_start } = req.query;

            let query = `
                SELECT 
                    s.id,
                    s.weekday,
                    s.start_time,
                    s.end_time,
                    s.room,
                    cs.name as course_section_name,
                    cs.code as course_section_code,
                    c.name as class_name,
                    sub.name as subject_name,
                    u.full_name as teacher_name
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                JOIN classes c ON cs.class_id = c.id
                JOIN subjects sub ON cs.subject_id = sub.id
                JOIN users u ON cs.teacher_id = u.id
                WHERE s.is_active = TRUE
            `;

            const params = [];

            // Role-based filtering
            if (req.user.role === 'teacher') {
                query += ' AND cs.teacher_id = ?';
                params.push(req.user.id);
            } else if (req.user.role === 'student') {
                query += ` AND cs.id IN (
                    SELECT cs.id 
                    FROM course_sections cs 
                    JOIN class_students cls ON cs.class_id = cls.class_id 
                    WHERE cls.student_id = ?
                )`;
                params.push(req.user.id);
            }

            if (course_section_id) {
                query += ' AND s.course_section_id = ?';
                params.push(parseInt(course_section_id));
            }

            query += ' ORDER BY s.weekday, s.start_time';

            const [schedules] = await db.execute(query, params);

            // Group schedules by weekday
            const weeklySchedule = {
                1: [], // Monday
                2: [], // Tuesday
                3: [], // Wednesday
                4: [], // Thursday
                5: [], // Friday
                6: [], // Saturday
                7: []  // Sunday
            };

            schedules.forEach(schedule => {
                weeklySchedule[schedule.weekday].push(schedule);
            });

            return responseHelper.success(res, {
                weekly_schedule: weeklySchedule,
                week_start: week_start || null
            }, 'Weekly schedule retrieved successfully');
        } catch (error) {
            console.error('Get weekly schedule error:', error);
            return responseHelper.error(res, 'Failed to retrieve weekly schedule', 500);
        }
    }

    // Lấy lịch học của một lớp học phần cụ thể
    async getCourseSchedules(req, res) {
        try {
            const { course_section_id } = req.params;
            const { weekday } = req.query;

            // Check if course section exists and user has permission
            const [courseSectionCheck] = await db.execute(
                'SELECT id, name, teacher_id FROM course_sections WHERE id = ?',
                [course_section_id]
            );

            if (courseSectionCheck.length === 0) {
                return responseHelper.error(res, 'Course section not found', 404);
            }

            const courseSection = courseSectionCheck[0];

            // Permission check
            if (req.user.role === 'teacher' && courseSection.teacher_id !== req.user.id) {
                return responseHelper.error(res, 'You can only view schedules for your own course sections', 403);
            }

            let query = `
                SELECT 
                    s.id,
                    s.weekday,
                    s.start_time,
                    s.end_time,
                    s.room,
                    s.is_active,
                    s.created_at,
                    s.updated_at
                FROM schedules s
                WHERE s.course_section_id = ? AND s.is_active = TRUE
            `;

            const params = [course_section_id];

            if (weekday !== undefined) {
                query += ' AND s.weekday = ?';
                params.push(parseInt(weekday));
            }

            query += ' ORDER BY s.weekday, s.start_time';

            const [schedules] = await db.execute(query, params);

            return responseHelper.success(res, {
                course_section: courseSection,
                schedules
            }, 'Course schedules retrieved successfully');
        } catch (error) {
            console.error('Get course schedules error:', error);
            return responseHelper.error(res, 'Failed to retrieve course schedules', 500);
        }
    }

    // Tạo lịch học mới
    async createSchedule(req, res) {
        try {
            const { course_section_id, weekday, start_time, end_time, room } = req.body;

            // Validation
            if (!course_section_id || weekday === undefined || !start_time || !end_time) {
                return responseHelper.error(res, 'Course section, weekday, start time, and end time are required', 400);
            }

            if (weekday < 1 || weekday > 7) {
                return responseHelper.error(res, 'Weekday must be between 1 (Monday) and 7 (Sunday)', 400);
            }

            // Validate time format and logic
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
            if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
                return responseHelper.error(res, 'Time must be in HH:MM:SS format', 400);
            }

            if (start_time >= end_time) {
                return responseHelper.error(res, 'Start time must be before end time', 400);
            }

            // Check if course section exists
            const [courseSectionCheck] = await db.execute(
                'SELECT id, teacher_id, class_id FROM course_sections WHERE id = ?',
                [course_section_id]
            );

            if (courseSectionCheck.length === 0) {
                return responseHelper.error(res, 'Course section not found', 404);
            }

            const courseSection = courseSectionCheck[0];

            // Permission check - only admin or assigned teacher can create schedules
            if (req.user.role === 'teacher' && courseSection.teacher_id !== req.user.id) {
                return responseHelper.error(res, 'You can only create schedules for your own course sections', 403);
            }

            // Check for time conflicts in the same class
            const [conflicts] = await db.execute(`
                SELECT s.id, cs.name as course_name
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                WHERE cs.class_id = ? AND s.weekday = ? 
                AND s.is_active = TRUE
                AND ((s.start_time <= ? AND s.end_time > ?) OR (s.start_time < ? AND s.end_time >= ?))
            `, [courseSection.class_id, weekday, start_time, start_time, end_time, end_time]);

            if (conflicts.length > 0) {
                return responseHelper.error(res,
                    `Thời điểm hiện tại đã có lịch học "${conflicts[0].course_name}"`, 400);
            }

            // Check for teacher conflicts
            const [teacherConflicts] = await db.execute(`
                SELECT s.id, cs.name as course_name, c.name as class_name
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                JOIN classes c ON cs.class_id = c.id
                WHERE cs.teacher_id = ? AND s.weekday = ? 
                AND s.is_active = TRUE
                AND ((s.start_time <= ? AND s.end_time > ?) OR (s.start_time < ? AND s.end_time >= ?))
            `, [courseSection.teacher_id, weekday, start_time, start_time, end_time, end_time]);

            if (teacherConflicts.length > 0) {
                return responseHelper.error(res,
                    `Teacher has conflicting schedule with course "${teacherConflicts[0].course_name}" in class "${teacherConflicts[0].class_name}"`, 400);
            }

            // Insert new schedule
            const [result] = await db.execute(
                'INSERT INTO schedules (course_section_id, weekday, start_time, end_time, room) VALUES (?, ?, ?, ?, ?)',
                [course_section_id, weekday, start_time, end_time, room || null]
            );

            // Get created schedule with related info
            const [newSchedule] = await db.execute(`
                SELECT 
                    s.id,
                    s.course_section_id,
                    s.weekday,
                    s.start_time,
                    s.end_time,
                    s.room,
                    s.is_active,
                    s.created_at,
                    cs.name as course_section_name,
                    cs.code as course_section_code
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                WHERE s.id = ?
            `, [result.insertId]);

            return responseHelper.success(res, {
                schedule: newSchedule[0]
            }, 'Schedule created successfully', 201);
        } catch (error) {
            console.error('Create schedule error:', error);
            return responseHelper.error(res, 'Failed to create schedule', 500);
        }
    }

    // Cập nhật lịch học
    async updateSchedule(req, res) {
        try {
            const { id } = req.params;
            const { weekday, start_time, end_time, room, is_active } = req.body;

            // Check if schedule exists and get course section info
            const [scheduleCheck] = await db.execute(`
                SELECT s.*, cs.teacher_id, cs.class_id
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                WHERE s.id = ?
            `, [id]);

            if (scheduleCheck.length === 0) {
                return responseHelper.error(res, 'Schedule not found', 404);
            }

            const schedule = scheduleCheck[0];

            // Permission check
            if (req.user.role === 'teacher' && schedule.teacher_id !== req.user.id) {
                return responseHelper.error(res, 'You can only update schedules for your own course sections', 403);
            }

            // Prepare update data
            const updateFields = [];
            const updateValues = [];

            if (weekday !== undefined) {
                if (weekday < 1 || weekday > 7) {
                    return responseHelper.error(res, 'Weekday must be between 1 (Monday) and 7 (Sunday)', 400);
                }
                updateFields.push('weekday = ?');
                updateValues.push(weekday);
            }

            if (start_time !== undefined) {
                const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
                if (!timeRegex.test(start_time)) {
                    return responseHelper.error(res, 'Start time must be in HH:MM:SS format', 400);
                }
                updateFields.push('start_time = ?');
                updateValues.push(start_time);
            }

            if (end_time !== undefined) {
                const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
                if (!timeRegex.test(end_time)) {
                    return responseHelper.error(res, 'End time must be in HH:MM:SS format', 400);
                }
                updateFields.push('end_time = ?');
                updateValues.push(end_time);
            }

            if (room !== undefined) {
                updateFields.push('room = ?');
                updateValues.push(room);
            }

            if (is_active !== undefined) {
                updateFields.push('is_active = ?');
                updateValues.push(is_active);
            }

            if (updateFields.length === 0) {
                return responseHelper.error(res, 'No fields to update', 400);
            }

            if (req.body.course_section_id !== undefined) {
                const [csCheck] = await db.execute(
                    'SELECT id FROM course_sections WHERE id = ?',
                    [req.body.course_section_id]
                );
                if (csCheck.length === 0) {
                    return responseHelper.error(res, 'Invalid course_section_id', 400);
                }
                updateFields.push('course_section_id = ?');
                updateValues.push(req.body.course_section_id);
            }
            
            // Validate time logic if both times are being updated or provided
            const finalStartTime = start_time || schedule.start_time;
            const finalEndTime = end_time || schedule.end_time;
            if (finalStartTime >= finalEndTime) {
                return responseHelper.error(res, 'Start time must be before end time', 400);
            }

            // Check for conflicts if time or weekday is being changed
            if (weekday !== undefined || start_time !== undefined || end_time !== undefined) {
                const finalWeekday = weekday !== undefined ? weekday : schedule.weekday;

                // Check class conflicts
                const [conflicts] = await db.execute(`
                    SELECT s.id, cs.name as course_name
                    FROM schedules s
                    JOIN course_sections cs ON s.course_section_id = cs.id
                    WHERE cs.class_id = ? AND s.weekday = ? AND s.id != ?
                    AND s.is_active = TRUE
                    AND ((s.start_time <= ? AND s.end_time > ?) OR (s.start_time < ? AND s.end_time >= ?))
                `, [schedule.class_id, finalWeekday, id, finalStartTime, finalStartTime, finalEndTime, finalEndTime]);

                if (conflicts.length > 0) {
                    return responseHelper.error(res,
                        `Thời điểm hiện tại đã có lịch học "${conflicts[0].course_name}"`, 400);
                }

                // Check teacher conflicts
                const [teacherConflicts] = await db.execute(`
                    SELECT s.id, cs.name as course_name, c.name as class_name
                    FROM schedules s
                    JOIN course_sections cs ON s.course_section_id = cs.id
                    JOIN classes c ON cs.class_id = c.id
                    WHERE cs.teacher_id = ? AND s.weekday = ? AND s.id != ?
                    AND s.is_active = TRUE
                    AND ((s.start_time <= ? AND s.end_time > ?) OR (s.start_time < ? AND s.end_time >= ?))
                `, [schedule.teacher_id, finalWeekday, id, finalStartTime, finalStartTime, finalEndTime, finalEndTime]);

                if (teacherConflicts.length > 0) {
                    return responseHelper.error(res,
                        `Teacher has conflicting schedule with course "${teacherConflicts[0].course_name}" in class "${teacherConflicts[0].class_name}"`, 400);
                }
            }

            updateValues.push(id);
            const [result] = await db.execute(
                `UPDATE schedules SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                updateValues
            );

            if (result.affectedRows === 0) {
                return responseHelper.error(res, 'Schedule not found', 404);
            }

            // Get updated schedule
            const [updatedSchedule] = await db.execute(`
                SELECT 
                    s.id,
                    s.course_section_id,
                    s.weekday,
                    s.start_time,
                    s.end_time,
                    s.room,
                    s.is_active,
                    s.created_at,
                    s.updated_at,
                    cs.name as course_section_name,
                    cs.code as course_section_code
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                WHERE s.id = ?
            `, [id]);

            return responseHelper.success(res, {
                schedule: updatedSchedule[0]
            }, 'Schedule updated successfully');
        } catch (error) {
            console.error('Update schedule error:', error);
            return responseHelper.error(res, 'Failed to update schedule', 500);
        }
    }

    // Xóa lịch học
    async deleteSchedule(req, res) {
        try {
            const { id } = req.params;

            // Check if schedule exists and get course section info
            const [scheduleCheck] = await db.execute(`
                SELECT s.*, cs.teacher_id, cs.name as course_section_name
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                WHERE s.id = ?
            `, [id]);

            if (scheduleCheck.length === 0) {
                return responseHelper.error(res, 'Schedule not found', 404);
            }

            const schedule = scheduleCheck[0];

            // Permission check
            if (req.user.role === 'teacher' && schedule.teacher_id !== req.user.id) {
                return responseHelper.error(res, 'You can only delete schedules for your own course sections', 403);
            }

            // Check if there are any attendance sessions for this schedule
            const [attendanceSessions] = await db.execute(
                'SELECT COUNT(*) as count FROM attendance_sessions WHERE course_section_id = ? AND session_date >= CURDATE()',
                [schedule.course_section_id]
            );

            if (attendanceSessions[0].count > 0) {
                // Soft delete instead of hard delete
                await db.execute(
                    'UPDATE schedules SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [id]
                );

                return responseHelper.success(res, {
                    schedule: { id, course_section_name: schedule.course_section_name }
                }, 'Schedule deactivated successfully (has associated attendance sessions)');
            } else {
                // Hard delete if no attendance sessions
                const [result] = await db.execute('DELETE FROM schedules WHERE id = ?', [id]);

                if (result.affectedRows === 0) {
                    return responseHelper.error(res, 'Schedule not found', 404);
                }

                return responseHelper.success(res, {
                    schedule: { id, course_section_name: schedule.course_section_name }
                }, 'Schedule deleted successfully');
            }
        } catch (error) {
            console.error('Delete schedule error:', error);
            return responseHelper.error(res, 'Failed to delete schedule', 500);
        }
    }

    // Lấy thông tin options cho tạo lịch (course sections)
    async getScheduleOptions(req, res) {
        try {
            let courseSectionsQuery = `
                SELECT 
                    cs.id,
                    cs.name,
                    cs.code,
                    cs.semester,
                    cs.academic_year,
                    c.name as class_name,
                    sub.name as subject_name,
                    u.full_name as teacher_name
                FROM course_sections cs
                JOIN classes c ON cs.class_id = c.id
                JOIN subjects sub ON cs.subject_id = sub.id
                JOIN users u ON cs.teacher_id = u.id
                WHERE cs.is_active = TRUE
            `;

            const params = [];

            // Filter by role
            if (req.user.role === 'teacher') {
                courseSectionsQuery += ' AND cs.teacher_id = ?';
                params.push(req.user.id);
            }

            courseSectionsQuery += ' ORDER BY cs.academic_year DESC, cs.semester, cs.name';

            const [courseSections] = await db.execute(courseSectionsQuery, params);

            const weekdays = [
                { value: 1, label: 'Thứ Hai' },
                { value: 2, label: 'Thứ Ba' },
                { value: 3, label: 'Thứ Tư' },
                { value: 4, label: 'Thứ Năm' },
                { value: 5, label: 'Thứ Sáu' },
                { value: 6, label: 'Thứ Bảy' },
                { value: 7, label: 'Chủ Nhật' }
            ];

            return responseHelper.success(res, {
                courseSections,
                weekdays
            }, 'Schedule options retrieved successfully');
        } catch (error) {
            console.error('Get schedule options error:', error);
            return responseHelper.error(res, 'Failed to retrieve schedule options', 500);
        }
    }

    // Import nhiều schedules từ Excel
    async importSchedules(req, res) {
        const schedulesToImport = req.body;
        const importResults = [];

        if (!Array.isArray(schedulesToImport)) {
            return responseHelper.error(res, 'Data must be an array of schedules', 400);
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const [index, scheduleData] of schedulesToImport.entries()) {
                const result = {
                    row: index + 2,
                    status: 'success',
                    message: 'Schedule created successfully',
                    data: scheduleData
                };

                const { course_section_code, weekday, start_time, end_time, room } = scheduleData;

                // Validate required fields
                if (!course_section_code || weekday === undefined || !start_time || !end_time) {
                    result.status = 'failure';
                    result.message = 'Missing required fields: course_section_code, weekday, start_time, end_time';
                    importResults.push(result);
                    continue;
                }

                // Validate weekday
                if (weekday < 1 || weekday > 7) {
                    result.status = 'failure';
                    result.message = 'Weekday must be between 1 (Monday) and 7 (Sunday)';
                    importResults.push(result);
                    continue;
                }

                // Validate time format
                const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
                if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
                    result.status = 'failure';
                    result.message = 'Time must be in HH:MM:SS format';
                    importResults.push(result);
                    continue;
                }

                if (start_time >= end_time) {
                    result.status = 'failure';
                    result.message = 'Start time must be before end time';
                    importResults.push(result);
                    continue;
                }

                // Get course section ID
                const [courseSectionRows] = await connection.execute(
                    'SELECT id, teacher_id, class_id FROM course_sections WHERE code = ?',
                    [course_section_code.trim()]
                );
                if (courseSectionRows.length === 0) {
                    result.status = 'failure';
                    result.message = `Course section with code '${course_section_code}' not found`;
                    importResults.push(result);
                    continue;
                }
                const courseSection = courseSectionRows[0];

                // Permission check for teacher role
                if (req.user.role === 'teacher' && courseSection.teacher_id !== req.user.id) {
                    result.status = 'failure';
                    result.message = 'You can only create schedules for your own course sections';
                    importResults.push(result);
                    continue;
                }

                // Check for conflicts
                const [conflicts] = await connection.execute(`
                    SELECT s.id, cs.name as course_name
                    FROM schedules s
                    JOIN course_sections cs ON s.course_section_id = cs.id
                    WHERE cs.class_id = ? AND s.weekday = ?
                    AND s.is_active = TRUE
                    AND ((s.start_time <= ? AND s.end_time > ?) OR (s.start_time < ? AND s.end_time >= ?))
                `, [courseSection.class_id, weekday, start_time, start_time, end_time, end_time]);

                if (conflicts.length > 0) {
                    result.status = 'failure';
                    result.message = `Đã có lịch học "${conflicts[0].course_name}"`;
                    importResults.push(result);
                    continue;
                }

                // Insert schedule
                const [insertResult] = await connection.execute(
                    'INSERT INTO schedules (course_section_id, weekday, start_time, end_time, room) VALUES (?, ?, ?, ?, ?)',
                    [courseSection.id, weekday, start_time, end_time, room || null]
                );

                result.schedule_id = insertResult.insertId;
                importResults.push(result);
            }

            await connection.commit();

            const successCount = importResults.filter(r => r.status === 'success').length;
            const failureCount = importResults.filter(r => r.status === 'failure').length;

            return responseHelper.success(res, {
                summary: {
                    total: importResults.length,
                    success: successCount,
                    failure: failureCount
                },
                results: importResults
            }, 'Import process completed');

        } catch (error) {
            await connection.rollback();
            console.error('Bulk import schedules error:', error);
            return responseHelper.error(res, 'Error importing schedules. Transaction rolled back.', 500);
        } finally {
            connection.release();
        }
    }

    // Lấy template cho import schedules
    async getSchedulesTemplate(req, res) {
        try {
            // Get sample data for template
            const [courseSections] = await db.execute(`
                SELECT cs.code, cs.name, c.name as class_name, sub.name as subject_name 
                FROM course_sections cs
                JOIN classes c ON cs.class_id = c.id
                JOIN subjects sub ON cs.subject_id = sub.id
                LIMIT 3
            `);

            const template = [
                {
                    course_section_code: courseSections[0]?.code || 'MATH101_CNTT47',
                    weekday: 1,
                    start_time: '08:00:00',
                    end_time: '09:30:00',
                    room: 'A101'
                },
                {
                    course_section_code: courseSections[1]?.code || 'PHYS101_CNTT47',
                    weekday: 2,
                    start_time: '10:00:00',
                    end_time: '11:30:00',
                    room: 'B205'
                }
            ];

            return responseHelper.success(res, {
                template,
                instructions: {
                    required_fields: ['course_section_code', 'weekday', 'start_time', 'end_time'],
                    optional_fields: ['room'],
                    field_descriptions: {
                        course_section_code: 'Mã lớp học phần (bắt buộc, phải tồn tại)',
                        weekday: 'Thứ trong tuần: 1=Thứ Hai, 2=Thứ Ba, ..., 7=Chủ Nhật (bắt buộc)',
                        start_time: 'Giờ bắt đầu, định dạng: HH:MM:SS (bắt buộc)',
                        end_time: 'Giờ kết thúc, định dạng: HH:MM:SS (bắt buộc)',
                        room: 'Phòng học (tùy chọn)'
                    },
                    notes: [
                        'Mã lớp học phần phải tồn tại trong hệ thống',
                        'Giờ bắt đầu phải trước giờ kết thúc',
                        'Không được xung đột thời gian trong cùng lớp hoặc cùng giáo viên',
                        'Xóa các dòng ví dụ trước khi import',
                        'Tối đa 50 lịch học mỗi lần import'
                    ]
                },
                available_course_sections: courseSections.map(cs => ({
                    code: cs.code,
                    name: cs.name,
                    class_name: cs.class_name,
                    subject_name: cs.subject_name
                }))
            }, 'Schedule template created successfully');
        } catch (error) {
            console.error('Export schedules template error:', error);
            return responseHelper.error(res, 'Failed to create schedule template', 500);
        }
    }
}

module.exports = new ScheduleController();