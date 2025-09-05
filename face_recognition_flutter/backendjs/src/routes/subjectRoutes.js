const express = require('express');
const SubjectController = require('../controllers/SubjectController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

// Middleware: Yêu cầu authentication cho tất cả routes
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Subjects
 *   description: Subject management operations
 */

/**
 * @swagger
 * /subjects:
 *   get:
 *     summary: Get all subjects with optional filters
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by subject name (partial match)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of subjects per page
 *     responses:
 *       200:
 *         description: Subjects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subjects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve subjects
 */
router.get('/', SubjectController.getAllSubjects);

/**
 * @swagger
 * /subjects/schedules:
 *   get:
 *     summary: Get all schedules with optional filters
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: subject_id
 *         schema:
 *           type: integer
 *         description: Filter by subject ID
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: integer
 *         description: Filter by teacher ID
 *       - in: query
 *         name: weekday
 *         schema:
 *           type: integer
 *         description: Filter by weekday (0-6)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of schedules per page
 *     responses:
 *       200:
 *         description: Schedules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 schedules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       class_name:
 *                         type: string
 *                       subject_name:
 *                         type: string
 *                       teacher_name:
 *                         type: string
 *                       weekday:
 *                         type: integer
 *                       start_time:
 *                         type: string
 *                       end_time:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/schedules', SubjectController.getAllSchedules);

/**
 * @swagger
 * /subjects/schedules:
 *   post:
 *     summary: Create a new schedule (Admin only)
 *     tags: [Schedules]
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
 *               - teacher_id
 *               - weekday
 *               - start_time
 *               - end_time
 *             properties:
 *               class_id:
 *                 type: integer
 *                 description: Class ID
 *               subject_id:
 *                 type: integer
 *                 description: Subject ID
 *               teacher_id:
 *                 type: integer
 *                 description: Teacher ID
 *               weekday:
 *                 type: integer
 *                 description: Weekday (0=Sunday, 1=Monday, ..., 6=Saturday)
 *               start_time:
 *                 type: string
 *                 format: time
 *                 description: Start time (HH:MM:SS)
 *               end_time:
 *                 type: string
 *                 format: time
 *                 description: End time (HH:MM:SS)
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *       400:
 *         description: Missing required fields or schedule conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Class, subject, or teacher not found
 *       500:
 *         description: Failed to create schedule
 */
router.post('/schedules', authorize(USER_ROLES.ADMIN), SubjectController.createSchedule);

/**
 * @swagger
 * /subjects/schedules/options:
 *   get:
 *     summary: Get available classes, subjects, and teachers for scheduling
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 classes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                 subjects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                 teachers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       full_name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/schedules/options', SubjectController.getScheduleOptions);

/**
 * @swagger
 * /subjects/import:
 *   post:
 *     summary: Import subjects from Excel (Admin only)
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - name
 *               properties:
 *                 name:
 *                   type: string
 *                   description: Tên môn học
 *     responses:
 *       200:
 *         description: Import completed
 *       400:
 *         description: Invalid data format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Import failed
 */
router.post('/import', authorize(USER_ROLES.ADMIN), SubjectController.importSubjects);

/**
 * @swagger
 * /subjects/schedules/import:
 *   post:
 *     summary: Import schedules from Excel (Admin only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - class_name
 *                 - subject_name
 *                 - teacher_name
 *                 - weekday
 *                 - start_time
 *                 - end_time
 *               properties:
 *                 class_name:
 *                   type: string
 *                 subject_name:
 *                   type: string
 *                 teacher_name:
 *                   type: string
 *                 weekday:
 *                   type: integer
 *                 start_time:
 *                   type: string
 *                 end_time:
 *                   type: string
 *     responses:
 *       200:
 *         description: Import completed
 *       400:
 *         description: Invalid data format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Import failed
 */
router.post('/schedules/import', authorize(USER_ROLES.ADMIN), SubjectController.importSchedules);

/**
 * @swagger
 * /subjects/template:
 *   get:
 *     summary: Get subjects import template
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template generated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to generate template
 */
router.get('/template', SubjectController.getSubjectsTemplate);

/**
 * @swagger
 * /subjects/schedules/template:
 *   get:
 *     summary: Get schedules import template
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template generated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to generate template
 */
router.get('/schedules/template', SubjectController.getSchedulesTemplate);

/**
 * @swagger
 * /subjects/schedules/{id}:
 *   put:
 *     summary: Update schedule (Admin only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - subject_id
 *               - teacher_id
 *               - weekday
 *               - start_time
 *               - end_time
 *             properties:
 *               class_id:
 *                 type: integer
 *               subject_id:
 *                 type: integer
 *               teacher_id:
 *                 type: integer
 *               weekday:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: time
 *               end_time:
 *                 type: string
 *                 format: time
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       400:
 *         description: Missing required fields or schedule conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Failed to update schedule
 */
router.put('/schedules/:id', authorize(USER_ROLES.ADMIN), SubjectController.updateSchedule);

/**
 * @swagger
 * /subjects/schedules/{id}:
 *   delete:
 *     summary: Delete schedule (Admin only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Failed to delete schedule
 */
router.delete('/schedules/:id', authorize(USER_ROLES.ADMIN), SubjectController.deleteSchedule);

/**
 * @swagger
 * /subjects:
 *   post:
 *     summary: Create a new subject (Admin only)
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Subject name
 *     responses:
 *       201:
 *         description: Subject created successfully
 *       400:
 *         description: Subject name is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       409:
 *         description: Subject with this name already exists
 *       500:
 *         description: Failed to create subject
 */
router.post('/', authorize(USER_ROLES.ADMIN), SubjectController.createSubject);

/**
 * @swagger
 * /subjects/{id}:
 *   get:
 *     summary: Get subject by ID
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Failed to retrieve subject
 */
router.get('/:id', SubjectController.getSubjectById);

/**
 * @swagger
 * /subjects/{id}:
 *   put:
 *     summary: Update subject (Admin only)
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Subject name
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *       400:
 *         description: Subject name is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Subject not found
 *       409:
 *         description: Subject with this name already exists
 *       500:
 *         description: Failed to update subject
 */
router.put('/:id', authorize(USER_ROLES.ADMIN), SubjectController.updateSubject);

/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     summary: Delete subject (Admin only)
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 *       400:
 *         description: Cannot delete subject that is being used in schedules
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Failed to delete subject
 */
router.delete('/:id', authorize(USER_ROLES.ADMIN), SubjectController.deleteSubject);

/**
 * @swagger
 * /subjects/{id}/schedules:
 *   get:
 *     summary: Get schedules for subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject schedules retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Failed to retrieve subject schedules
 */
router.get('/:id/schedules', SubjectController.getSubjectSchedules);

/**
 * @swagger
 * /subjects/{id}/attendance-sessions:
 *   get:
 *     summary: Get attendance sessions for subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of sessions per page
 *     responses:
 *       200:
 *         description: Subject attendance sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Failed to retrieve subject attendance sessions
 */
router.get('/:id/attendance-sessions', SubjectController.getSubjectAttendanceSessions);

/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Schedule management operations
 */

/**
 * @swagger
 * /subjects/schedules:
 *   get:
 *     summary: Get all schedules with optional filters
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: subject_id
 *         schema:
 *           type: integer
 *         description: Filter by subject ID
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: integer
 *         description: Filter by teacher ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of schedules per page
 *     responses:
 *       200:
 *         description: Schedules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 schedules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       class_name:
 *                         type: string
 *                       subject_name:
 *                         type: string
 *                       teacher_name:
 *                         type: string
 *                       weekday:
 *                         type: integer
 *                       start_time:
 *                         type: string
 *                       end_time:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/schedules', SubjectController.getAllSchedules);

/**
 * @swagger
 * /subjects/schedules:
 *   post:
 *     summary: Create a new schedule (Admin only)
 *     tags: [Schedules]
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
 *               - teacher_id
 *               - weekday
 *               - start_time
 *               - end_time
 *             properties:
 *               class_id:
 *                 type: integer
 *               subject_id:
 *                 type: integer
 *               teacher_id:
 *                 type: integer
 *               weekday:
 *                 type: integer
 *                 description: Day of the week (1-7, 1=Sunday)
 *               start_time:
 *                 type: string
 *                 description: Start time in HH:MM format
 *               end_time:
 *                 type: string
 *                 description: End time in HH:MM format
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 schedule_id:
 *                   type: integer
 *       400:
 *         description: Invalid input or schedule conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Class, subject, or teacher not found
 *       500:
 *         description: Internal server error
 */
router.post('/schedules', authorize(USER_ROLES.ADMIN), SubjectController.createSchedule);

/**
 * @swagger
 * /subjects/schedules/{id}:
 *   put:
 *     summary: Update a schedule (Admin only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_id
 *               - subject_id
 *               - teacher_id
 *               - weekday
 *               - start_time
 *               - end_time
 *             properties:
 *               class_id:
 *                 type: integer
 *               subject_id:
 *                 type: integer
 *               teacher_id:
 *                 type: integer
 *               weekday:
 *                 type: integer
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       400:
 *         description: Invalid input or schedule conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Schedule, class, subject, or teacher not found
 *       500:
 *         description: Internal server error
 */
router.put('/schedules/:id', authorize(USER_ROLES.ADMIN), SubjectController.updateSchedule);

/**
 * @swagger
 * /subjects/schedules/{id}:
 *   delete:
 *     summary: Delete a schedule (Admin only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Internal server error
 */
router.delete('/schedules/:id', authorize(USER_ROLES.ADMIN), SubjectController.deleteSchedule);

/**
 * @swagger
 * /subjects/schedules/options:
 *   get:
 *     summary: Get available classes, subjects, and teachers for scheduling
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 classes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                 subjects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                 teachers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       full_name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/schedules/options', SubjectController.getScheduleOptions);

module.exports = router;