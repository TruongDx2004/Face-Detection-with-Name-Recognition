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

module.exports = router;