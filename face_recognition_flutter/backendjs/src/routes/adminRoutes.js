const express = require('express');
const AdminController = require('../controllers/AdminController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrator-level operations
 */

// Get all users
/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: A list of users with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       full_name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       student_id:
 *                         type: string
 *                       class_name:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 *                       face_trained:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (user not admin)
 *       500:
 *         description: Internal server error
 */
router.get('/users', authenticateToken, authorize('admin'), AdminController.getUsers);


// Create user
/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - full_name
 *               - email
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, teacher, student]
 *               student_id:
 *                 type: string
 *                 nullable: true
 *               class_name:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user_id:
 *                   type: integer
 *       400:
 *         description: Bad request (missing fields, username/email already exists)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/users', authenticateToken, authorize('admin'), AdminController.createUser);

// Update user
/**
 * @swagger
 * /admin/users/{user_id}:
 *   put:
 *     summary: Update an existing user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, teacher, student]
 *               student_id:
 *                 type: string
 *                 nullable: true
 *               class_name:
 *                 type: string
 *                 nullable: true
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/users/:id', authenticateToken, authorize('admin'), AdminController.updateUser);

// Delete user
/**
 * @swagger
 * /admin/users/{user_id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete('/users/:id', authenticateToken, authorize('admin'), AdminController.deleteUser);

// Class management routes
router.get('/classes', authenticateToken, authorize('admin'), AdminController.getClasses);
router.post('/classes', authenticateToken, authorize('admin'), AdminController.createClass);
router.put('/classes/:id', authenticateToken, authorize('admin'), AdminController.updateClass);
router.delete('/classes/:id', authenticateToken, authorize('admin'), AdminController.deleteClass);

// Subject management routes
router.get('/subjects', authenticateToken, authorize('admin'), AdminController.getSubjects);
router.post('/subjects', authenticateToken, authorize('admin'), AdminController.createSubject);

// Get attendance statistics
/**
 * @swagger
 * /admin/statistics:
 *   get:
 *     summary: Get attendance and user statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for attendance statistics (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for attendance statistics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/statistics', authenticateToken, authorize('admin'), AdminController.getSystemStats);

// Reset user password
/**
 * @swagger
 * /admin/users/{user_id}/reset-password:
 *   put:
 *     summary: Reset a user's password
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to reset the password for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_password
 *             properties:
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: New password is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/users/:id/reset-password', authenticateToken, authorize('admin'), AdminController.resetUserPassword);

// Get attendance reports
/**
 * @swagger
 * /admin/reports/attendance:
 *   get:
 *     summary: Get detailed attendance reports
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class_name
 *         schema:
 *           type: string
 *         description: Filter by class name
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report (YYYY-MM-DD)
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *         description: Filter by student ID
 *     responses:
 *       200:
 *         description: Attendance report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/reports/attendance', authenticateToken, authorize('admin'), AdminController.getAttendanceReports);

router.post('/users/import', authenticateToken, authorize('admin'), AdminController.importUsers);

/**
 * @swagger
 * /admin/users/template:
 *   get:
 *     summary: Get users import template
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 template:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       full_name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       password:
 *                         type: string
 *                       class_name:
 *                         type: string
 *                       student_code:
 *                         type: string
 *                 instructions:
 *                   type: object
 *                 available_data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       500:
 *         description: Failed to generate template
 */
router.get('/users/template', authenticateToken, authorize('admin'), AdminController.getUsersTemplate);

module.exports = router;