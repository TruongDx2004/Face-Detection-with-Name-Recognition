const db = require('../config/database');
const faceService = require('../services/faceService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Cấu hình multer cho upload ảnh attendance
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/attendance/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'attendance-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

class AttendanceController {

    // Tạo session điểm danh (theo database schema thực tế)
    async createAttendanceSession(req, res) {
        try {
            const { course_section_id, session_date, session_name } = req.body;
            let start_time = req.body.start_time || new Date().toTimeString().split(' ')[0];
            const teacher_id = req.user.id;

            if (!course_section_id || !session_date || !start_time) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Lấy thông tin từ course_section
            const [courseSections] = await db.execute(
                `SELECT class_id, subject_id, teacher_id, name FROM course_sections WHERE id = ? AND is_active = TRUE`,
                [course_section_id]
            );

            if (courseSections.length === 0) {
                return res.status(404).json({ error: 'Course section not found' });
            }

            const courseSection = courseSections[0];

            // Kiểm tra teacher có quyền tạo session cho course section này không
            if (courseSection.teacher_id !== teacher_id) {
                return res.status(403).json({ error: 'You are not authorized to create session for this course section' });
            }

            // Kiểm tra đã có session active cho ngày này chưa
            const [existingSessions] = await db.execute(
                `SELECT id FROM attendance_sessions 
                 WHERE course_section_id = ? AND session_date = ? AND is_active = TRUE`,
                [course_section_id, session_date]
            );

            if (existingSessions.length > 0) {
                return res.status(400).json({ error: 'Already have an active session today' });
            }

            const [result] = await db.execute(`
                INSERT INTO attendance_sessions (course_section_id, session_date, start_time, session_name, is_active) 
                VALUES (?, ?, ?, ?, TRUE)
            `, [course_section_id, session_date, start_time, session_name || `Session ${session_date}`, true]);

            res.status(201).json({
                message: 'Attendance session created successfully',
                session_id: result.insertId,
                session_date,
                start_time,
                session_name: session_name || `Session ${session_date}`
            });
        } catch (error) {
            console.error('Create attendance session error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Lấy danh sách sessions
    async getAttendanceSessions(req, res) {
        try {
            const { class_id, teacher_id, is_active } = req.query;
            let query = `
                SELECT 
                    ats.*,
                    c.name AS class_name,
                    s.name AS subject_name,
                    u.full_name AS teacher_name,
                    cs.name AS course_section_name,
                    cs.code AS course_section_code
                FROM attendance_sessions ats
                JOIN course_sections cs ON ats.course_section_id = cs.id
                JOIN classes c ON cs.class_id = c.id
                JOIN subjects s ON cs.subject_id = s.id
                JOIN users u ON cs.teacher_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (class_id) {
                query += ' AND cs.class_id = ?';
                params.push(class_id);
            }

            if (teacher_id) {
                query += ' AND cs.teacher_id = ?';
                params.push(teacher_id);
            }

            if (is_active !== undefined) {
                query += ' AND ats.is_active = ?';
                params.push(is_active === 'true');
            }

            query += ' ORDER BY ats.created_at DESC';

            const [sessions] = await db.execute(query, params);
            res.json({
                message: 'Sessions retrieved successfully',
                sessions
            });
        } catch (error) {
            console.error('Get attendance sessions error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Điểm danh bằng nhận diện khuôn mặt
    async markAttendanceByFace(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No image uploaded' });
            }

            const { session_id } = req.body;
            const imagePath = req.file.path;

            // Kiểm tra session tồn tại và đang active
            const [sessions] = await db.execute(
                'SELECT * FROM attendance_sessions WHERE id = ? AND is_active = TRUE',
                [session_id]
            );

            if (sessions.length === 0) {
                await fs.unlink(imagePath);
                return res.status(404).json({ error: 'Attendance session not found or not active' });
            }

            const session = sessions[0];

            // Kiểm tra thời gian điểm danh
            const now = new Date();
            const startTime = new Date(session.start_time);
            const endTime = new Date(session.end_time);

            if (now < startTime || now > endTime) {
                await fs.unlink(imagePath);
                return res.status(400).json({ error: 'Attendance session is not in valid time range' });
            }

            // Nhận diện khuôn mặt
            const recognitionResult = await faceService.recognizeFace(imagePath);

            if (!recognitionResult.success || !recognitionResult.user_id) {
                await fs.unlink(imagePath);
                return res.status(400).json({
                    error: 'Face not recognized',
                    confidence: recognitionResult.confidence || 0
                });
            }

            const userId = recognitionResult.user_id;

            // Lấy thông tin course section từ session
            const [courseSectionInfo] = await db.execute(
                `SELECT cs.class_id FROM course_sections cs 
                 JOIN attendance_sessions ats ON cs.id = ats.course_section_id 
                 WHERE ats.id = ?`,
                [session_id]
            );

            if (courseSectionInfo.length === 0) {
                await fs.unlink(imagePath);
                return res.status(404).json({ error: 'Course section not found for this session' });
            }

            // Kiểm tra user có trong class không
            const [classStudents] = await db.execute(
                'SELECT * FROM class_students WHERE class_id = ? AND student_id = ?',
                [courseSectionInfo[0].class_id, userId]
            );

            if (classStudents.length === 0) {
                await fs.unlink(imagePath);
                return res.status(403).json({ error: 'Student not enrolled in this class' });
            }

            // Kiểm tra đã điểm danh chưa
            const [existingAttendance] = await db.execute(
                'SELECT * FROM attendances WHERE session_id = ? AND student_id = ?',
                [session_id, userId]
            );

            if (existingAttendance.length > 0) {
                await fs.unlink(imagePath);
                return res.status(409).json({ error: 'Already marked attendance for this session' });
            }

            // Lưu bản ghi điểm danh
            await db.execute(`
                INSERT INTO attendances 
                (session_id, student_id, confidence_score, image_path, status) 
                VALUES (?, ?, ?, ?, 'present')
            `, [session_id, userId, recognitionResult.confidence, imagePath]);

            // Lấy thông tin student
            const [students] = await db.execute(
                'SELECT id, username, full_name FROM users WHERE id = ?',
                [userId]
            );

            res.json({
                message: 'Attendance marked successfully',
                student: students[0],
                confidence: recognitionResult.confidence,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Mark attendance error:', error);

            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting file:', unlinkError);
                }
            }

            res.status(500).json({
                error: 'Attendance marking failed',
                message: error.message
            });
        }
    }

    // Lấy chi tiết session
    async getSessionDetails(req, res) {
        try {
            const { session_id } = req.params;

            // Lấy thông tin session với thông tin liên quan
            const [sessions] = await db.execute(`
                SELECT 
                    ats.*,
                    c.name as class_name,
                    c.code as class_code,
                    s.name as subject_name,
                    u.full_name as teacher_name,
                    u.username as teacher_username,
                    cs.class_id,
                    cs.subject_id,
                    cs.teacher_id,
                    cs.name as course_section_name,
                    cs.code as course_section_code
                FROM attendance_sessions ats
                JOIN course_sections cs ON ats.course_section_id = cs.id
                JOIN classes c ON cs.class_id = c.id
                JOIN subjects s ON cs.subject_id = s.id
                JOIN users u ON cs.teacher_id = u.id
                WHERE ats.id = ?
            `, [session_id]);

            if (sessions.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Session not found'
                });
            }

            const session = sessions[0];

            // Lấy danh sách sinh viên trong lớp với thông tin điểm danh
            const [students] = await db.execute(`
                SELECT 
                    u.id,
                    u.username,
                    u.full_name,
                    cs.student_code,
                    a.id as attendance_id,
                    a.status,
                    a.attendance_time,
                    a.confidence_score,
                    a.image_path
                FROM users u
                JOIN class_students cs ON u.id = cs.student_id
                LEFT JOIN attendances a ON u.id = a.student_id AND a.session_id = ?
                WHERE cs.class_id = ? AND u.is_active = TRUE
                ORDER BY cs.student_code, u.full_name
            `, [session_id, session.class_id]);

            // Tính toán thống kê
            const totalStudents = students.length;
            const presentStudents = students.filter(s => s.status === 'present').length;
            const absentStudents = students.filter(s => !s.status || s.status === 'absent').length;
            const lateStudents = students.filter(s => s.status === 'late').length;

            // Tạo response theo format mà React component mong đợi
            const responseData = {
                session: {
                    id: session.id,
                    course_section_id: session.course_section_id,
                    session_date: session.session_date,
                    start_time: session.start_time,
                    end_time: session.end_time,
                    session_name: session.session_name,
                    is_active: session.is_active,
                    created_at: session.created_at,
                    class_name: session.class_name,
                    class_code: session.class_code,
                    subject_name: session.subject_name,
                    teacher_name: session.teacher_name,
                    teacher_username: session.teacher_username,
                    class_id: session.class_id,
                    subject_id: session.subject_id,
                    teacher_id: session.teacher_id,
                    course_section_name: session.course_section_name,
                    course_section_code: session.course_section_code
                },
                students: students.map(student => ({
                    id: student.id,
                    username: student.username,
                    full_name: student.full_name,
                    student_code: student.student_code,
                    attendance: student.attendance_id ? {
                        id: student.attendance_id,
                        status: student.status,
                        attendance_time: student.attendance_time,
                        confidence_score: student.confidence_score,
                        image_path: student.image_path
                    } : null,
                    status: student.status || 'absent'
                })),
                summary: {
                    total: totalStudents,
                    present: presentStudents,
                    absent: absentStudents,
                    late: lateStudents,
                    attendance_rate: totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0
                }
            };

            res.json({
                success: true,
                message: 'Session details retrieved successfully',
                data: responseData
            });
        } catch (error) {
            console.error('Get session details error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Lấy báo cáo điểm danh
    async getAttendanceReport(req, res) {
        try {
            const { session_id } = req.params;

            // Lấy thông tin session
            const [sessions] = await db.execute(`
                SELECT 
                    ats.*,
                    c.name as class_name,
                    s.name as subject_name,
                    u.full_name as teacher_name,
                    cs.class_id,
                    cs.name as course_section_name,
                    cs.code as course_section_code
                FROM attendance_sessions ats
                JOIN course_sections cs ON ats.course_section_id = cs.id
                JOIN classes c ON cs.class_id = c.id
                JOIN subjects s ON cs.subject_id = s.id
                JOIN users u ON cs.teacher_id = u.id
                WHERE ats.id = ?
            `, [session_id]);

            if (sessions.length === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }

            const session = sessions[0];

            // Lấy danh sách students trong class
            const [allStudents] = await db.execute(`
                SELECT 
                    u.id, u.username, u.full_name,
                    cs.student_code
                FROM users u
                JOIN class_students cs ON u.id = cs.student_id
                WHERE cs.class_id = ? AND u.is_active = TRUE
                ORDER BY cs.student_code
            `, [session.class_id]);

            // Lấy bản ghi điểm danh
            const [attendanceRecords] = await db.execute(`
                SELECT 
                    a.*,
                    u.username, u.full_name
                FROM attendances a
                JOIN users u ON a.student_id = u.id
                WHERE a.session_id = ?
            `, [session_id]);

            // Tạo map attendance records
            const attendanceMap = {};
            attendanceRecords.forEach(record => {
                attendanceMap[record.student_id] = record;
            });

            // Tạo báo cáo đầy đủ
            const report = allStudents.map(student => ({
                ...student,
                attendance: attendanceMap[student.id] || null,
                status: attendanceMap[student.id] ? attendanceMap[student.id].status : 'absent'
            }));

            res.json({
                session,
                students: report,
                summary: {
                    total: allStudents.length,
                    present: attendanceRecords.filter(r => r.status === 'present').length,
                    absent: allStudents.length - attendanceRecords.filter(r => r.status === 'present').length
                }
            });
        } catch (error) {
            console.error('Get attendance report error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Cập nhật trạng thái session
    async updateSessionStatus(req, res) {
        try {
            const { session_id } = req.params;
            const { is_active } = req.body;

            if (typeof is_active !== 'boolean') {
                return res.status(400).json({ error: 'is_active must be a boolean value' });
            }

            const updateFields = ['is_active = ?'];
            const params = [is_active];

            // Nếu deactivate session, set end_time
            if (!is_active) {
                updateFields.push('end_time = CURRENT_TIME');
            }

            await db.execute(
                `UPDATE attendance_sessions SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [...params, session_id]
            );

            res.json({ message: 'Session status updated successfully' });
        } catch (error) {
            console.error('Update session status error:', error);
            res.status(500).json({ error: 'Failed to update session status' });
        }
    }

    // Điểm danh thủ công (Teacher only)
    async markAttendanceManual(req, res) {
        try {
            const { session_id, student_id, status } = req.body;
            const teacher_id = req.user.id;

            // Kiểm tra session tồn tại và thuộc về teacher
            const [sessions] = await db.execute(
                `SELECT ats.id, ats.is_active 
                 FROM attendance_sessions ats
                 JOIN course_sections cs ON ats.course_section_id = cs.id
                 WHERE ats.id = ? AND cs.teacher_id = ?`,
                [session_id, teacher_id]
            );

            if (sessions.length === 0) {
                return res.status(404).json({ error: 'Session not found or not authorized' });
            }

            if (!sessions[0].is_active) {
                return res.status(400).json({ error: 'Session is not active' });
            }

            // Kiểm tra student đã điểm danh chưa
            const [existing] = await db.execute(
                'SELECT id FROM attendances WHERE session_id = ? AND student_id = ?',
                [session_id, student_id]
            );

            if (existing.length > 0) {
                // Cập nhật status
                await db.execute(
                    'UPDATE attendances SET status = ?, attendance_time = CURRENT_TIMESTAMP WHERE session_id = ? AND student_id = ?',
                    [status, session_id, student_id]
                );
            } else {
                // Tạo mới
                await db.execute(
                    'INSERT INTO attendances (session_id, student_id, status, attendance_time) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
                    [session_id, student_id, status]
                );
            }

            res.json({ message: 'Attendance marked manually successfully' });
        } catch (error) {
            console.error('Manual attendance error:', error);
            res.status(500).json({ error: 'Failed to mark attendance manually' });
        }
    }

    // Lấy active sessions cho student
    async getActiveSessions(req, res) {
        try {
            const student_id = req.user.id;

            // Lấy class của student
            const [studentClasses] = await db.execute(
                'SELECT class_id FROM class_students WHERE student_id = ?',
                [student_id]
            );

            if (studentClasses.length === 0) {
                return res.json({
                    message: 'No active sessions found',
                    sessions: []
                });
            }

            const classIds = studentClasses.map(c => c.class_id);
            const placeholders = classIds.map(() => '?').join(',');

            const [sessions] = await db.execute(
                `SELECT 
                    ats.id,
                    ats.session_name,
                    ats.session_date,
                    ats.start_time,
                    ats.end_time,
                    s.name as subject_name,
                    c.name as class_name,
                    u.full_name as teacher_name,
                    cs.name as course_section_name,
                    CASE WHEN a.id IS NOT NULL THEN a.status ELSE 'not_marked' END as attendance_status
                FROM attendance_sessions ats
                JOIN course_sections cs ON ats.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                JOIN classes c ON cs.class_id = c.id
                JOIN users u ON cs.teacher_id = u.id
                LEFT JOIN attendances a ON ats.id = a.session_id AND a.student_id = ?
                WHERE cs.class_id IN (${placeholders}) AND ats.is_active = TRUE
                ORDER BY ats.session_date DESC, ats.start_time DESC`,
                [student_id, ...classIds]
            );

            res.json({
                message: 'Active sessions retrieved successfully',
                sessions
            });
        } catch (error) {
            console.error('Get active sessions error:', error);
            res.status(500).json({ error: 'Failed to retrieve active sessions' });
        }
    }

    // Lấy attendance history của student
    async getMyAttendance(req, res) {
        try {
            const student_id = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const [records] = await db.execute(
                `SELECT 
                    a.id,
                    a.status,
                    a.attendance_time as marked_at,
                    ats.session_name,
                    ats.session_date,
                    ats.start_time,
                    ats.end_time,
                    s.name as subject_name,
                    c.name as class_name,
                    u.full_name as teacher_name,
                    cs.name as course_section_name
                FROM attendances a
                JOIN attendance_sessions ats ON a.session_id = ats.id
                JOIN course_sections cs ON ats.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                JOIN classes c ON cs.class_id = c.id
                JOIN users u ON cs.teacher_id = u.id
                WHERE a.student_id = ?
                ORDER BY ats.session_date DESC, ats.start_time DESC
                LIMIT ${limit} OFFSET ${offset}`,
                [student_id]
            );

            // Get total count
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM attendances WHERE student_id = ?',
                [student_id]
            );
            const total = countResult[0].total;

            res.json({
                message: 'Attendance history retrieved successfully',
                records,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get my attendance error:', error);
            res.status(500).json({ error: 'Failed to retrieve attendance history' });
        }
    }

    // Lấy sessions của teacher
    async getMySessions(req, res) {
        try {
            const teacher_id = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const [sessions] = await db.execute(
                `SELECT 
                    ats.id,
                    ats.session_name,
                    ats.session_date,
                    ats.start_time,
                    ats.end_time,
                    ats.is_active,
                    s.name as subject_name,
                    c.name as class_name,
                    cs.name as course_section_name,
                    COUNT(a.id) as total_attendance
                FROM attendance_sessions ats
                JOIN course_sections cs ON ats.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                JOIN classes c ON cs.class_id = c.id
                LEFT JOIN attendances a ON ats.id = a.session_id
                WHERE cs.teacher_id = ?
                GROUP BY ats.id
                ORDER BY ats.session_date DESC, ats.start_time DESC
                LIMIT ${limit} OFFSET ${offset}`,
                [teacher_id]
            );

            // Get total count
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM attendance_sessions ats JOIN course_sections cs ON ats.course_section_id = cs.id WHERE cs.teacher_id = ?',
                [teacher_id]
            );
            const total = countResult[0].total;

            res.json({
                message: 'Teacher sessions retrieved successfully',
                sessions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get my sessions error:', error);
            res.status(500).json({ error: 'Failed to retrieve teacher sessions' });
        }
    }

    // Kết thúc session
    async endSession(req, res) {
        try {
            const sessionId = req.params.session_id;
            const teacher_id = req.user.id;

            // Kiểm tra session thuộc về teacher
            const [sessions] = await db.execute(
                `SELECT ats.id, ats.is_active 
                 FROM attendance_sessions ats
                 JOIN course_sections cs ON ats.course_section_id = cs.id
                 WHERE ats.id = ? AND cs.teacher_id = ?`,
                [sessionId, teacher_id]
            );

            if (sessions.length === 0) {
                return res.status(404).json({ error: 'Session not found or not authorized' });
            }

            if (!sessions[0].is_active) {
                return res.status(400).json({ error: 'Session is already completed' });
            }

            await db.execute(
                'UPDATE attendance_sessions SET is_active = FALSE, end_time = CURRENT_TIME, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [sessionId]
            );

            res.json({ message: 'Session ended successfully' });
        } catch (error) {
            console.error('End session error:', error);
            res.status(500).json({ error: 'Failed to end session' });
        }
    }

    // Xóa session
    async deleteSession(req, res) {
        try {
            const sessionId = req.params.id;
            const teacher_id = req.user.id;

            // Kiểm tra session thuộc về teacher hoặc user là admin
            let query = `SELECT ats.id FROM attendance_sessions ats`;
            let params = [sessionId];

            if (req.user.role !== 'admin') {
                query += ` JOIN course_sections cs ON ats.course_section_id = cs.id WHERE ats.id = ? AND cs.teacher_id = ?`;
                params.push(teacher_id);
            } else {
                query += ` WHERE ats.id = ?`;
            }

            const [sessions] = await db.execute(query, params);

            if (sessions.length === 0) {
                return res.status(404).json({ error: 'Session not found or not authorized' });
            }

            // Xóa attendance records trước
            await db.execute('DELETE FROM attendances WHERE session_id = ?', [sessionId]);

            // Xóa session
            await db.execute('DELETE FROM attendance_sessions WHERE id = ?', [sessionId]);

            res.json({ message: 'Session deleted successfully' });
        } catch (error) {
            console.error('Delete session error:', error);
            res.status(500).json({ error: 'Failed to delete session' });
        }
    }

    // Điểm danh thủ công (Teacher only)
    async markAttendanceManual(req, res) {
        try {
            const { session_id, student_id, status } = req.body;

            if (!session_id || !student_id || !status) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Kiểm tra session tồn tại
            const [sessions] = await db.execute(
                'SELECT * FROM attendance_sessions WHERE id = ?',
                [session_id]
            );

            if (sessions.length === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Kiểm tra đã điểm danh chưa
            const [existing] = await db.execute(
                'SELECT * FROM attendances WHERE session_id = ? AND student_id = ?',
                [session_id, student_id]
            );

            if (existing.length > 0) {
                // Cập nhật trạng thái
                await db.execute(
                    'UPDATE attendances SET status = ? WHERE session_id = ? AND student_id = ?',
                    [status, session_id, student_id]
                );
            } else {
                // Tạo mới
                await db.execute(
                    'INSERT INTO attendances (session_id, student_id, status) VALUES (?, ?, ?)',
                    [session_id, student_id, status]
                );
            }

            res.json({ message: 'Attendance marked successfully' });
        } catch (error) {
            console.error('Mark attendance manual error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Lấy sessions đang active cho student
    async getActiveSessions(req, res) {
        try {
            const student_id = req.user.id;

            const [sessions] = await db.execute(`
                SELECT 
                    ats.*,
                    c.name as class_name,
                    s.name as subject_name,
                    u.full_name as teacher_name
                FROM attendance_sessions ats
                JOIN schedules sch ON ats.schedule_id = sch.id
                JOIN classes c ON sch.class_id = c.id
                JOIN subjects s ON sch.subject_id = s.id
                JOIN users u ON sch.teacher_id = u.id
                JOIN class_students cs ON c.id = cs.class_id
                WHERE cs.student_id = ? AND ats.is_active = TRUE
                ORDER BY ats.session_date DESC, ats.start_time DESC
            `, [student_id]);

            res.json({
                message: 'Active sessions retrieved successfully',
                sessions
            });
        } catch (error) {
            console.error('Get active sessions error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Lấy lịch sử điểm danh của student
    async getMyAttendance(req, res) {
        try {
            const student_id = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const [attendances] = await db.execute(`
                SELECT 
                    a.*,
                    ats.session_date,
                    ats.start_time,
                    c.name as class_name,
                    s.name as subject_name,
                    u.full_name as teacher_name
                FROM attendances a
                JOIN attendance_sessions ats ON a.session_id = ats.id
                JOIN schedules sch ON ats.schedule_id = sch.id
                JOIN classes c ON sch.class_id = c.id
                JOIN subjects s ON sch.subject_id = s.id
                JOIN users u ON sch.teacher_id = u.id
                WHERE a.student_id = ?
                ORDER BY ats.session_date DESC, ats.start_time DESC
                LIMIT ${limit} OFFSET ${offset}
            `, [student_id]);

            // Get total count
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM attendances WHERE student_id = ?',
                [student_id]
            );

            res.json({
                message: 'Attendance history retrieved successfully',
                attendances,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            });
        } catch (error) {
            console.error('Get my attendance error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Lấy sessions của teacher
    // Lấy sessions của teacher
    async getMySessions(req, res) {
        try {
            const teacher_id = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const [sessions] = await db.execute(`
            SELECT 
                ats.*,
                c.name as class_name,
                s.name as subject_name,
                COUNT(a.id) as attendance_count
            FROM attendance_sessions ats
            JOIN course_sections cs ON ats.course_section_id = cs.id
            JOIN classes c ON cs.class_id = c.id
            JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN attendances a ON ats.id = a.session_id
            WHERE cs.teacher_id = ?
            GROUP BY ats.id
            ORDER BY ats.session_date DESC, ats.start_time DESC
            LIMIT ${limit} OFFSET ${offset}
        `, [teacher_id]);

            res.json({
                message: 'Teacher sessions retrieved successfully',
                sessions
            });
        } catch (error) {
            console.error('Get my sessions error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Lấy lịch sử điểm danh tổng quát
    async getAttendanceHistory(req, res) {
        try {
            const { class_id, subject_id, student_id, start_date, end_date, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    a.*,
                    ats.session_date,
                    ats.start_time,
                    c.name as class_name,
                    s.name as subject_name,
                    u.full_name as student_name,
                    t.full_name as teacher_name
                FROM attendances a
                JOIN attendance_sessions ats ON a.session_id = ats.id
                JOIN schedules sch ON ats.schedule_id = sch.id
                JOIN classes c ON sch.class_id = c.id
                JOIN subjects s ON sch.subject_id = s.id
                JOIN users u ON a.student_id = u.id
                JOIN users t ON sch.teacher_id = t.id
                WHERE 1=1
            `;
            const params = [];

            if (class_id) {
                query += ' AND sch.class_id = ?';
                params.push(class_id);
            }

            if (subject_id) {
                query += ' AND sch.subject_id = ?';
                params.push(subject_id);
            }

            if (student_id) {
                query += ' AND a.student_id = ?';
                params.push(student_id);
            }

            if (start_date) {
                query += ' AND ats.session_date >= ?';
                params.push(start_date);
            }

            if (end_date) {
                query += ' AND ats.session_date <= ?';
                params.push(end_date);
            }

            query += ` ORDER BY ats.session_date DESC, ats.start_time DESC LIMIT ${limit} OFFSET ${offset}`;

            const [history] = await db.execute(query, params);

            res.json({
                message: 'Attendance history retrieved successfully',
                history
            });
        } catch (error) {
            console.error('Get attendance history error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

const attendanceController = new AttendanceController();

// Export both the instance and the upload middleware
module.exports = attendanceController;
module.exports.uploadMiddleware = upload.single('image');