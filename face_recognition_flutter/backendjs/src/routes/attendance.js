const express = require('express');
const multer = require('multer');
const { authenticateToken, authorize } = require('../middleware/auth');
const faceService = require('../services/faceService');
const db = require('../config/database');

const router = express.Router();

// Configure multer for attendance images
const upload = multer({
    dest: 'temp/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are alloweddd'));
        }
    }
});

// Create attendance session (Teacher only)
/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance management operations
 */

// Create attendance session (Teacher only)
/**
 * @swagger
 * /attendance/create-session:
 *   post:
 *     summary: Create a new attendance session
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - class_name
 *               - start_time
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Subject name
 *               class_name:
 *                 type: string
 *                 description: Class name
 *               start_time:
 *                 type: string
 *                 format: time
 *                 description: Session start time (HH:MM:SS)
 *     responses:
 *       201:
 *         description: Attendance session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session_id:
 *                   type: integer
 *                 session_date:
 *                   type: string
 *                   format: date
 *                 start_time:
 *                   type: string
 *       400:
 *         description: Already have an active session today
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher role required)
 *       500:
 *         description: Internal server error
 */
router.post('/create-session', authenticateToken, authorize('teacher'), async (req, res) => {
    try {
        const { schedule_id, session_date } = req.body;
        let start_time = req.body.start_time || new Date().toTimeString().split(' ')[0]; // 'HH:MM:SS'
        const teacher_id = req.user.id;

        if (!schedule_id || !session_date || !start_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }


        // Lấy thông tin từ schedule
        const [schedules] = await db.execute(
            `SELECT class_id, subject_id, teacher_id, weekday FROM schedules WHERE id = ?`,
            [schedule_id]
        );

        if (schedules.length === 0) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const schedule = schedules[0];

        // Kiểm tra giáo viên có đúng quyền không
        if (schedule.teacher_id !== teacher_id) {
            return res.status(403).json({ error: 'You are not authorized to start this session' });
        }

        // Kiểm tra ngày hôm nay có khớp với lịch không (tuỳ bạn muốn enforce hay không)
        const actualWeekday = new Date(session_date).getDay();
        if (schedule.weekday !== (actualWeekday)) { // weekday in DB is 1-7, JS Date.getDay() is 0-6
            return res.status(400).json({
                error: `Schedule is set for weekday ${schedule.weekday}, but today is ${actualWeekday}`
            });
        }

        // Kiểm tra session đã tồn tại chưa
        const [existing] = await db.execute(
            `SELECT asess.id FROM attendance_sessions asess
             WHERE asess.schedule_id = ? AND asess.session_date = ? AND asess.is_active = TRUE`,
            [schedule_id, session_date]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Session already exists for today' });
        }

        // Tạo session
        const [result] = await db.execute(
            `INSERT INTO attendance_sessions (schedule_id, session_date, start_time)
             VALUES (?, ?, ?)`,
            [schedule_id, session_date, start_time]
        );

        res.status(200).json({
            message: 'Attendance session created successfully',
            session_id: result.insertId,
            schedule_id,
            class_id: schedule.class_id,
            subject_id: schedule.subject_id,
            session_date,
            start_time
        });

    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Failed to create attendance session' });
    }
});




// Mark attendance with face recognition
/**
 * @swagger
 * /attendance/mark-attendance:
 *   post:
 *     summary: Mark attendance using face recognition
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *               - image
 *             properties:
 *               session_id:
 *                 type: integer
 *                 description: ID of the attendance session
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Student face image for recognition
 *     responses:
 *       200:
 *         description: Attendance marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [present, late]
 *                 confidence:
 *                   type: number
 *                 minutes_late:
 *                   type: integer
 *       400:
 *         description: Bad request (missing image, already marked, face recognition failed)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (student role required)
 *       404:
 *         description: Active session not found
 *       500:
 *         description: Internal server error
 */
router.post('/mark-attendance', authenticateToken, authorize('student'), upload.single('image'), async (req, res) => {
    try {
        const { session_id } = req.body;
        const student_id = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        // Check if session exists and is active
        const [sessions] = await db.execute(
            'SELECT * FROM attendance_sessions WHERE id = ? AND is_active = TRUE',
            [session_id]
        );

        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Active session not found' });
        }

        const session = sessions[0];

        // Check if student already marked attendance for this session
        const [existing] = await db.execute(
            'SELECT id FROM attendances WHERE session_id = ? AND student_id = ?',
            [session_id, student_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Bạn đã điểm danh cho buổi học này' });
        }

        // Check if face recognition model is trained
        const isModelTrained = await faceService.isModelTrained();
        if (!isModelTrained) {
            return res.status(400).json({ error: 'Face recognition model is not available' });
        }

        try {
            //In ra thông tin để debug
            console.log("Recognizing face for session:", session_id, "and student:", student_id);
            console.log("Image path:", req.file.path);

            // Perform face recognition
            const recognition = await faceService.recognizeFace(req.file.path);

            const labelId = recognition.results[0].label_id;

            // Check if recognized face matches the student
            let status = 'present';
            let confidence_score = recognition.results[0].confidence || 0;

            console.log(`Recognized label ID: ${labelId}, Student ID: ${student_id}, Confidence: ${confidence_score}`);

            if (labelId !== student_id || confidence_score < 20) {
                return res.status(400).json({
                    error: 'Face recognition failed or confidence too low',
                    confidence: confidence_score
                });
            }

            // Determine if late (more than 15 minutes after start time)
            const now = new Date();
            const sessionStart = new Date(`${session.session_date}T${session.start_time}`);
            const minutesLate = (now - sessionStart) / (1000 * 60);

            if (minutesLate > 15) {
                status = 'late';
            }

            // Mark attendance
            await db.execute(
                'INSERT INTO attendances (session_id, student_id, confidence_score, image_path, status) VALUES (?, ?, ?, ?, ?)',
                [session_id, student_id, confidence_score, req.file.path, status]
            );

            res.json({
                message: 'Attendance marked successfully',
                status: status,
                confidence: confidence_score,
                minutes_late: Math.max(0, Math.round(minutesLate))
            });

        } catch (faceError) {
            console.error('Face recognition error:', faceError);
            res.status(400).json({ error: 'Face recognition failed: ' + faceError.message });
        }

    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    } finally {
        // Clean up uploaded file
        if (req.file) {
            require('fs').unlink(req.file.path, () => { });
        }
    }
});

// Get active sessions (for students)
/**
 * @swagger
 * /attendance/active-sessions:
 *   get:
 *     summary: Get active attendance sessions for student's class
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       subject:
 *                         type: string
 *                       class_name:
 *                         type: string
 *                       session_date:
 *                         type: string
 *                         format: date
 *                       start_time:
 *                         type: string
 *                       teacher_name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (student role required)
 *       500:
 *         description: Internal server error
 */
router.get('/active-sessions', authenticateToken, authorize('student'), async (req, res) => {
    try {

        const student_id = req.user.id;
        const [classStudentRows] = await db.execute(
            'SELECT class_id FROM class_students WHERE student_id = ? LIMIT 1',
            [student_id]
        );
        if (classStudentRows.length === 0) return res.status(400).json({ error: 'Student not assigned to any class' });
        const class_id = classStudentRows[0].class_id;

        const [sessions] = await db.execute(`
  SELECT 
    s.id,
    subj.name AS subject,
    c.name AS class_name,
    s.session_date,
    s.start_time,
    u.full_name AS teacher_name
  FROM attendance_sessions s
  JOIN schedules sch ON s.schedule_id = sch.id
  JOIN classes c ON sch.class_id = c.id
  JOIN subjects subj ON sch.subject_id = subj.id
  JOIN users u ON sch.teacher_id = u.id
  WHERE s.is_active = 1 
    AND s.session_date = CURDATE()
    AND sch.class_id = ?
  ORDER BY s.start_time DESC
`, [class_id]);

        console.log('Active sessions:', sessions);

        return res.status(200).json({
            message: 'Active sessions retrieved successfully',
            sessions
        });

    } catch (error) {
        console.error('Get active sessions error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


// Get attendance history (for students)
/**
 * @swagger
 * /attendance/my-attendance:
 *   get:
 *     summary: Get student's attendance history
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Attendance history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 attendances:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       session_id:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         enum: [present, late, absent]
 *                       attendance_time:
 *                         type: string
 *                         format: date-time
 *                       confidence_score:
 *                         type: number
 *                       subject:
 *                         type: string
 *                       class_name:
 *                         type: string
 *                       session_date:
 *                         type: string
 *                         format: date
 *                       start_time:
 *                         type: string
 *                       teacher_name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (student role required)
 *       500:
 *         description: Internal server error
 */
router.get('/my-attendance', authenticateToken, authorize('student'), async (req, res) => {
    try {
        const student_id = req.user.id;
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                a.*, s.subject, s.class_name, s.session_date, s.start_time,
                u.full_name as teacher_name
            FROM attendances a
            JOIN attendance_sessions s ON a.session_id = s.id
            JOIN users u ON s.teacher_id = u.id
            WHERE a.student_id = ?
        `;

        const params = [student_id];

        if (start_date) {
            query += ' AND s.session_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND s.session_date <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY s.session_date DESC, s.start_time DESC';

        const [attendances] = await db.execute(query, params);

        res.json({
            message: 'Attendance history retrieved successfully',
            attendances: attendances
        });

    } catch (error) {
        console.error('Get attendance history error:', error);
        res.status(500).json({ error: 'Failed to get attendance history' });
    }
});

// Get session attendance (for teachers)
// Get session attendance (for teachers)
/**
 * @swagger
 * /attendance/session/{session_id}:
 *   get:
 *     summary: Get attendance details for a specific session
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session attendance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     subject:
 *                       type: string
 *                     class_name:
 *                       type: string
 *                     session_date:
 *                       type: string
 *                       format: date
 *                     start_time:
 *                       type: string
 *                     end_time:
 *                       type: string
 *                     is_active:
 *                       type: boolean
 *                 attendances:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       full_name:
 *                         type: string
 *                       student_code:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [present, late]
 *                       attendance_time:
 *                         type: string
 *                         format: date-time
 *                       confidence_score:
 *                         type: number
 *                 absent_students:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       full_name:
 *                         type: string
 *                       student_code:
 *                         type: string
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total_students:
 *                       type: integer
 *                     present:
 *                       type: integer
 *                     late:
 *                       type: integer
 *                     absent:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher role required)
 *       404:
 *         description: Session not found or access denied
 *       500:
 *         description: Internal server error
 */
router.get('/session/:session_id', authenticateToken, authorize('teacher', 'admin'), async (req, res) => {
    try {
        const { session_id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Xây query filter theo role
        let teacherFilter = '';
        let queryParams = [session_id];

        if (userRole === 'teacher') {
            teacherFilter = 'AND sch.teacher_id = ?';
            queryParams.push(userId);
        }

        // Lấy thông tin session + class_id
        const [sessions] = await db.execute(`
            SELECT 
                s.id,
                sch.teacher_id,
                subj.name AS subject,
                cls.id AS class_id,
                cls.name AS class_name,
                s.session_date,
                s.start_time,
                s.end_time,
                s.is_active,
                s.created_at,
                u.full_name AS teacher_name
            FROM attendance_sessions s
            INNER JOIN schedules sch ON s.schedule_id = sch.id
            INNER JOIN subjects subj ON sch.subject_id = subj.id
            INNER JOIN classes cls ON sch.class_id = cls.id
            INNER JOIN users u ON sch.teacher_id = u.id
            WHERE s.id = ? ${teacherFilter}
        `, queryParams);

        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Session not found or access denied' });
        }

        const session = sessions[0];

        // Lấy danh sách đã điểm danh
        const [attendances] = await db.execute(`
            SELECT 
                a.id,
                a.session_id,
                a.student_id,
                a.attendance_time,
                a.confidence_score,
                a.image_path,
                a.status,
                u.full_name AS student_name,
                cs.student_code
            FROM attendances a
            JOIN users u ON a.student_id = u.id
            JOIN class_students cs ON cs.student_id = u.id
            WHERE a.session_id = ?
            ORDER BY a.attendance_time ASC
        `, [session_id]);

        // Lấy danh sách vắng
        const [absentStudents] = await db.execute(`
            SELECT 
                u.id AS student_id,
                u.full_name AS student_name,
                cs.student_code
            FROM class_students cs
            JOIN users u ON cs.student_id = u.id
            WHERE cs.class_id = ?
              AND u.id NOT IN (
                  SELECT student_id FROM attendances WHERE session_id = ?
              )
        `, [session.class_id, session_id]);

        res.json({
            message: 'Session attendance retrieved successfully',
            session,
            attendances,
            absent_students: absentStudents,
            statistics: {
                total_students: attendances.length + absentStudents.length,
                present: attendances.filter(a => a.status === 'present').length,
                late: attendances.filter(a => a.status === 'late').length,
                absent: absentStudents.length
            }
        });

    } catch (error) {
        console.error('Get session attendance error:', error);
        res.status(500).json({ error: 'Failed to get session attendance' });
    }
});



// End session (for teachers)
/**
 * @swagger
 * /attendance/end-session/{session_id}:
 *   put:
 *     summary: End an active attendance session
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Session ID to end
 *     responses:
 *       200:
 *         description: Session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 end_time:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher role required)
 *       404:
 *         description: Active session not found or access denied
 *       500:
 *         description: Internal server error
 */

router.put('/end-session/:session_id', authenticateToken, authorize('teacher'), async (req, res) => {
    try {
        const { session_id } = req.params;
        const teacher_id = req.user.id;

        // Verify session belongs to this teacher
        const [sessions] = await db.execute(
            `SELECT s.* 
                FROM attendance_sessions s
                JOIN schedules sch ON s.schedule_id = sch.id
                WHERE s.id = ? 
                AND sch.teacher_id = ? 
                AND s.is_active = TRUE`,
            [session_id, teacher_id]
        );

        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Active session not found or access denied' });
        }

        // End the session
        const end_time = new Date().toTimeString().split(' ')[0];
        await db.execute(
            'UPDATE attendance_sessions SET is_active = FALSE, end_time = ? WHERE id = ?',
            [end_time, session_id]
        );

        res.json({
            message: 'Session ended successfully',
            end_time: end_time
        });

    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
});
// Get teacher's sessions
/**
 * @swagger
 * /attendance/my-sessions:
 *   get:
 *     summary: Get teacher's attendance sessions
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       subject:
 *                         type: string
 *                       class_name:
 *                         type: string
 *                       session_date:
 *                         type: string
 *                         format: date
 *                       start_time:
 *                         type: string
 *                       end_time:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 *                       total_attendances:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (teacher role required)
 *       500:
 *         description: Internal server error
 */
router.get('/my-sessions', authenticateToken, authorize('teacher'), async (req, res) => {
    try {
        const teacher_id = req.user.id;
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                s.id,
                cls.id AS class_id,
                sch.teacher_id,
                subj.name AS subject,
                cls.name AS class_name,
                s.session_date,
                s.start_time,
                s.end_time,
                s.is_active,
                s.created_at,
                u.full_name AS teacher_name,
                COUNT(a.id) AS total_attendances
            FROM attendance_sessions s
            INNER JOIN schedules sch ON s.schedule_id = sch.id
            INNER JOIN subjects subj ON sch.subject_id = subj.id
            INNER JOIN classes cls ON sch.class_id = cls.id
            INNER JOIN users u ON sch.teacher_id = u.id
            LEFT JOIN attendances a ON s.id = a.session_id
            WHERE sch.teacher_id = ?
        `;

        const params = [teacher_id];

        if (start_date) {
            query += ' AND s.session_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND s.session_date <= ?';
            params.push(end_date);
        }

        query += ' GROUP BY s.id, sch.teacher_id, subj.name, cls.name, u.full_name, s.session_date, s.start_time, s.end_time, s.is_active, s.created_at';
        query += ' ORDER BY s.session_date DESC, s.start_time DESC';

        const [sessions] = await db.execute(query, params);

        res.json({
            message: 'Sessions retrieved successfully',
            sessions
        });

    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to get sessions' });
    }
});


// API để lấy danh sách phiên điểm danh (dành cho admin)
/**
 * @swagger
 * /attendance/sessions:
 *   get:
 *     summary: Get a list of attendance sessions with filters
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: integer
 *         description: Filter by teacher ID
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const { teacher_id, class_id, date, is_active } = req.query;

        let query = `
        SELECT 
            asess.id, 
            asess.schedule_id,
            sch.teacher_id,
            c.name AS class_name,
            subj.name AS subject,
            u.full_name AS teacher_name,
            DATE_FORMAT(asess.session_date, '%Y-%m-%d') AS session_date,
            asess.start_time, 
            asess.end_time, 
            asess.is_active,
            asess.created_at,
            IFNULL(att_stats.total_attendances, 0) AS total_attendances,
            IFNULL(cs_stats.total_students, 0) AS total_students,
            IFNULL(att_stats.present_count, 0) AS present_count,
            IFNULL(att_stats.late_count, 0) AS late_count,
            (IFNULL(cs_stats.total_students, 0) 
                - IFNULL(att_stats.present_count, 0) 
                - IFNULL(att_stats.late_count, 0)) AS absent_count
        FROM attendance_sessions asess
        JOIN schedules sch ON asess.schedule_id = sch.id
        JOIN classes c ON sch.class_id = c.id
        JOIN subjects subj ON sch.subject_id = subj.id
        JOIN users u ON sch.teacher_id = u.id

        -- Số học sinh
        LEFT JOIN (
            SELECT class_id, COUNT(student_id) AS total_students
            FROM class_students
            GROUP BY class_id
        ) cs_stats ON cs_stats.class_id = c.id

        -- Thống kê điểm danh
        LEFT JOIN (
            SELECT 
                session_id,
                COUNT(DISTINCT id) AS total_attendances,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_count
            FROM attendances
            GROUP BY session_id
        ) att_stats ON att_stats.session_id = asess.id

        WHERE 1=1
        `;

        const params = [];
        if (teacher_id) {
            query += ' AND sch.teacher_id = ?';
            params.push(teacher_id);
        }
        if (class_id) {
            query += ' AND sch.class_id = ?';
            params.push(class_id);
        }
        if (date) {
            query += ' AND asess.session_date = ?';
            params.push(date);
        }
        if (is_active !== undefined) {
            query += ' AND asess.is_active = ?';
            params.push(is_active === 'true' ? 1 : 0);
        }

        query += ' ORDER BY asess.session_date DESC, asess.start_time DESC';

        const [sessions] = await db.execute(query, params);
        res.status(200).json({ message: 'Sessions retrieved successfully', sessions });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to retrieve sessions' });
    }
});


// API để lấy lịch sử điểm danh (dành cho admin)
/**
 * @swagger
 * /attendance/history:
 *   get:
 *     summary: Get attendance history with filters
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: session_id
 *         schema:
 *           type: integer
 *         description: Filter by session ID
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *         description: Filter by student ID
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [present, late, absent]
 *         description: Filter by attendance status
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Attendance history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { session_id, student_id, class_id, status, start_date, end_date } = req.query;

        let query = `
            SELECT 
                att.id, 
                att.session_id, 
                u.full_name AS studentName, 
                cs.student_code AS studentCode,
                c.name AS className, 
                subj.name AS subjectName, 
                att.attendance_time, 
                att.status,
                att.confidence_score
            FROM attendances att
            JOIN users u ON att.student_id = u.id
            JOIN class_students cs ON cs.student_id = u.id
            JOIN attendance_sessions asess ON att.session_id = asess.id
            JOIN schedules sch ON asess.schedule_id = sch.id
            JOIN classes c ON sch.class_id = c.id
            JOIN subjects subj ON sch.subject_id = subj.id
            WHERE 1=1
        `;

        const params = [];

        if (session_id) {
            query += ' AND att.session_id = ?';
            params.push(session_id);
        }
        if (student_id) {
            query += ' AND att.student_id = ?';
            params.push(student_id);
        }
        if (class_id) {
            query += ' AND sch.class_id = ?';
            params.push(class_id);
        }
        if (status) {
            query += ' AND att.status = ?';
            params.push(status);
        }
        if (start_date) {
            query += ' AND asess.session_date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND asess.session_date <= ?';
            params.push(end_date);
        }

        // Chỉ 1 ORDER BY duy nhất
        query += ' ORDER BY asess.session_date DESC, asess.start_time DESC';

        const [records] = await db.execute(query, params);

        res.status(200).json({
            message: 'Attendance records retrieved successfully',
            records
        });
    } catch (error) {
        console.error('Get attendance history error:', error);
        res.status(500).json({ error: 'Failed to retrieve attendance history' });
    }
});


// API để kết thúc một phiên điểm danh
/**
 * @swagger
 * /attendance/sessions/{id}/stop:
 *   put:
 *     summary: Stop an active attendance session
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the session to stop
 *     responses:
 *       200:
 *         description: Session stopped successfully
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.put('/sessions/:id/stop', authenticateToken, async (req, res) => {
    try {
        const sessionId = req.params.id;
        const [result] = await db.execute(
            'UPDATE attendance_sessions SET is_active = 0, end_time = ? WHERE id = ? AND is_active = 1',
            [new Date().toTimeString().split(' ')[0], sessionId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Active session not found' });
        }

        res.status(200).json({ message: 'Session stopped successfully' });
    } catch (error) {
        console.error('Stop session error:', error);
        res.status(500).json({ error: 'Failed to stop session' });
    }
});

// API để xóa một phiên điểm danh
/**
 * @swagger
 * /attendance/sessions/{id}:
 *   delete:
 *     summary: Delete an attendance session
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the session to delete
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.delete('/sessions/:id', authenticateToken, async (req, res) => {
    try {
        const sessionId = req.params.id;
        const [result] = await db.execute('DELETE FROM attendance_sessions WHERE id = ?', [sessionId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});


module.exports = router;