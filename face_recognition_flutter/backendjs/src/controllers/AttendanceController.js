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

    // Tạo session điểm danh
    async createAttendanceSession(req, res) {
        try {
            const { class_id, subject_id, session_name, start_time, end_time, location } = req.body;
            const teacher_id = req.user.id;

            // Kiểm tra quyền teacher
            if (req.user.role !== 'teacher') {
                return res.status(403).json({ error: 'Only teachers can create attendance sessions' });
            }

            const [result] = await db.execute(`
                INSERT INTO attendance_sessions 
                (class_id, subject_id, teacher_id, session_name, start_time, end_time, location) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [class_id, subject_id, teacher_id, session_name, start_time, end_time, location]);

            res.status(201).json({
                message: 'Attendance session created successfully',
                session_id: result.insertId
            });
        } catch (error) {
            console.error('Create attendance session error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Lấy danh sách sessions
    async getAttendanceSessions(req, res) {
        try {
            const { class_id, teacher_id, status } = req.query;
            let query = `
                SELECT 
                    ats.*,
                    c.name AS class_name,
                    s.name AS subject_name,
                    u.full_name AS teacher_name
                FROM attendance_sessions ats
                JOIN schedules sch ON ats.schedule_id = sch.id
                JOIN classes c ON sch.class_id = c.id
                JOIN subjects s ON sch.subject_id = s.id
                JOIN users u ON sch.teacher_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (class_id) {
                query += ' AND ats.class_id = ?';
                params.push(class_id);
            }

            if (teacher_id) {
                query += ' AND ats.teacher_id = ?';
                params.push(teacher_id);
            }

            if (status) {
                query += ' AND ats.status = ?';
                params.push(status);
            }

            query += ' ORDER BY ats.created_at DESC';

            const [sessions] = await db.execute(query, params);
            res.json(sessions);
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
                'SELECT * FROM attendance_sessions WHERE id = ? AND status = "active"',
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

            // Kiểm tra user có trong class không
            const [classStudents] = await db.execute(
                'SELECT * FROM class_students WHERE class_id = ? AND student_id = ?',
                [session.class_id, userId]
            );

            if (classStudents.length === 0) {
                await fs.unlink(imagePath);
                return res.status(403).json({ error: 'Student not enrolled in this class' });
            }

            // Kiểm tra đã điểm danh chưa
            const [existingAttendance] = await db.execute(
                'SELECT * FROM attendance_records WHERE session_id = ? AND student_id = ?',
                [session_id, userId]
            );

            if (existingAttendance.length > 0) {
                await fs.unlink(imagePath);
                return res.status(409).json({ error: 'Already marked attendance for this session' });
            }

            // Lưu bản ghi điểm danh
            await db.execute(`
                INSERT INTO attendance_records 
                (session_id, student_id, status, confidence_score, image_path) 
                VALUES (?, ?, 'present', ?, ?)
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
                    u.full_name as teacher_name
                FROM attendance_sessions ats
                JOIN classes c ON ats.class_id = c.id
                JOIN subjects s ON ats.subject_id = s.id
                JOIN users u ON ats.teacher_id = u.id
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
                    ar.*,
                    u.username, u.full_name
                FROM attendance_records ar
                JOIN users u ON ar.student_id = u.id
                WHERE ar.session_id = ?
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
            const { status } = req.body;

            await db.execute(
                'UPDATE attendance_sessions SET status = ? WHERE id = ?',
                [status, session_id]
            );

            res.json({ message: 'Session status updated successfully' });
        } catch (error) {
            console.error('Update session status error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

const attendanceController = new AttendanceController();

// Export both the instance and the upload middleware
module.exports = attendanceController;
module.exports.uploadMiddleware = upload.single('image');