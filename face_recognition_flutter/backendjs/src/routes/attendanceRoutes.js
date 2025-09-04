const express = require('express');
const AttendanceController = require('../controllers/AttendanceController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

// Middleware: Yêu cầu authentication cho tất cả routes
router.use(authenticateToken);

/**
 * @swagger
 * /attendance/sessions:
 *   post:
 *     summary: Create attendance session (Teacher only)
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
 *               - class_id
 *               - subject_id
 *               - session_name
 *               - start_time
 *               - end_time
 *             properties:
 *               class_id:
 *                 type: integer
 *               subject_id:
 *                 type: integer
 *               session_name:
 *                 type: string
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendance session created successfully
 *       403:
 *         description: Only teachers can create sessions
 */
router.post('/sessions', authorize(USER_ROLES.TEACHER), AttendanceController.createAttendanceSession);

/**
 * @swagger
 * /attendance/sessions:
 *   get:
 *     summary: Get attendance sessions
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: integer
 *         description: Filter by teacher ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by session status
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 */
router.get('/sessions', AttendanceController.getAttendanceSessions);

/**
 * @swagger
 * /attendance/mark:
 *   post:
 *     summary: Mark attendance by face recognition
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image for face recognition
 *               session_id:
 *                 type: integer
 *                 description: Attendance session ID
 *     responses:
 *       200:
 *         description: Attendance marked successfully
 *       400:
 *         description: Face not recognized or session not active
 *       409:
 *         description: Already marked attendance
 */
router.post('/mark', AttendanceController.uploadMiddleware, AttendanceController.markAttendanceByFace);

/**
 * @swagger
 * /attendance/sessions/{session_id}/report:
 *   get:
 *     summary: Get attendance report for session
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
 *         description: Attendance report retrieved successfully
 *       404:
 *         description: Session not found
 */
router.get('/sessions/:session_id/report', AttendanceController.getAttendanceReport);

/**
 * @swagger
 * /attendance/session/{session_id}:
 *   get:
 *     summary: Get session details
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
 *         description: Session details retrieved successfully
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
 *                     schedule_id:
 *                       type: integer
 *                     session_date:
 *                       type: string
 *                       format: date
 *                     start_time:
 *                       type: string
 *                       format: time
 *                     end_time:
 *                       type: string
 *                       format: time
 *                     is_active:
 *                       type: boolean
 *                     class_name:
 *                       type: string
 *                     class_code:
 *                       type: string
 *                     subject_name:
 *                       type: string
 *                     teacher_name:
 *                       type: string
 *                     attendance_count:
 *                       type: integer
 *                     total_students:
 *                       type: integer
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.get('/session/:session_id', AttendanceController.getSessionDetails);

/**
 * @swagger
 * /attendance/sessions/{session_id}/status:
 *   put:
 *     summary: Update session status (Teacher only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, completed, cancelled]
 *     responses:
 *       200:
 *         description: Session status updated successfully
 */
router.put('/sessions/:session_id/status', authorize(USER_ROLES.TEACHER, USER_ROLES.ADMIN), AttendanceController.updateSessionStatus);

/**
 * @swagger
 * /attendance/mark-manual:
 *   post:
 *     summary: Mark attendance manually (Teacher only)
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
 *               - session_id
 *               - student_id
 *               - status
 *             properties:
 *               session_id:
 *                 type: integer
 *               student_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [present, absent, late]
 *     responses:
 *       200:
 *         description: Attendance marked manually successfully
 */
router.post('/mark-manual', authorize(USER_ROLES.TEACHER), AttendanceController.markAttendanceManual);

/**
 * @swagger
 * /attendance/active-sessions:
 *   get:
 *     summary: Get active sessions for student
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 */
router.get('/active-sessions', authorize(USER_ROLES.STUDENT), AttendanceController.getActiveSessions);

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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Attendance history retrieved successfully
 */
router.get('/my-attendance', authorize(USER_ROLES.STUDENT), AttendanceController.getMyAttendance);

/**
 * @swagger
 * /attendance/my-sessions:
 *   get:
 *     summary: Get teacher's sessions
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Teacher sessions retrieved successfully
 */
router.get('/my-sessions', authorize(USER_ROLES.TEACHER), AttendanceController.getMySessions);

/**
 * @swagger
 * /attendance/sessions/{session_id}/end:
 *   put:
 *     summary: End attendance session (Teacher only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Session ended successfully
 */
router.put('/sessions/:session_id/end', authorize(USER_ROLES.TEACHER), AttendanceController.endSession);

/**
 * @swagger
 * /attendance/sessions/{id}:
 *   delete:
 *     summary: Delete attendance session (Teacher/Admin only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Session deleted successfully
 */
router.delete('/sessions/:id', authorize(USER_ROLES.TEACHER, USER_ROLES.ADMIN), AttendanceController.deleteSession);

module.exports = router;