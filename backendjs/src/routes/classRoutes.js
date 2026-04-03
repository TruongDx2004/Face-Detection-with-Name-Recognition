const express = require('express');
const ClassController = require('../controllers/ClassController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

// Middleware: Yêu cầu authentication cho tất cả routes
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: Class management operations
 */

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes with optional filters
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by class name (partial match)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by class status
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: Filter by academic year
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
 *         description: Number of classes per page
 *     responses:
 *       200:
 *         description: Classes retrieved successfully
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
 *                       code:
 *                         type: string
 *                       year:
 *                         type: integer
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       studentCount:
 *                         type: integer
 *                       studentsWithFace:
 *                         type: integer
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
 *         description: Có lỗi xảy ra, vui lòng thử lại!
 */
router.get('/', ClassController.getAllClasses);

/**
 * @swagger
 * /classes/available-students:
 *   get:
 *     summary: Get available students (not in any class)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available students retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 students:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       500:
 *         description: Failed to retrieve available students
 */
router.get('/available-students', authorize(USER_ROLES.ADMIN), ClassController.getAvailableStudents);

/**
 * @swagger
 * /classes/import:
 *   post:
 *     summary: Import multiple classes (Admin only)
 *     tags: [Classes]
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
 *                   description: Class name
 *     responses:
 *       200:
 *         description: Import process completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       message:
 *                         type: string
 *       400:
 *         description: Request body must be an array of classes
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       500:
 *         description: Failed to import classes
 */
router.post('/import', authorize(USER_ROLES.ADMIN), ClassController.importClasses);

/**
 * @swagger
 * /classes/statistics:
 *   get:
 *     summary: Get class statistics (Admin only)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Class statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalClasses:
 *                       type: integer
 *                     activeClasses:
 *                       type: integer
 *                     inactiveClasses:
 *                       type: integer
 *                     totalYears:
 *                       type: integer
 *                     totalStudents:
 *                       type: integer
 *                     studentsWithFace:
 *                       type: integer
 *                     yearBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           year:
 *                             type: string
 *                           classCount:
 *                             type: integer
 *                           studentCount:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       500:
 *         description: Failed to retrieve statistics
 */
router.get('/statistics', authorize(USER_ROLES.ADMIN), ClassController.getClassStatistics);

/**
 * @swagger
 * /classes/years:
 *   get:
 *     summary: Get available years
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available years retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 years:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve available years
 */
router.get('/years', ClassController.getAvailableYears);

/**
 * @swagger
 * /classes/year/{year}:
 *   get:
 *     summary: Get classes by year
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: string
 *         description: Academic year
 *     responses:
 *       200:
 *         description: Classes for the specified year retrieved successfully
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
 *                       code:
 *                         type: string
 *                       year:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       studentCount:
 *                         type: integer
 *                       studentsWithFace:
 *                         type: integer
 *                 year:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve classes by year
 */
router.get('/year/:year', ClassController.getClassesByYear);

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class (Admin only)
 *     tags: [Classes]
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
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 description: Class name
 *               code:
 *                 type: string
 *                 description: Class code
 *               year:
 *                 type: integer
 *                 description: Academic year
 *               description:
 *                 type: string
 *                 description: Class description
 *     responses:
 *       201:
 *         description: Class created successfully
 *       400:
 *         description: Name and code are required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       409:
 *         description: Class with this name or code already exists
 *       500:
 *         description: Failed to create class
 */
router.post('/', authorize(USER_ROLES.ADMIN), ClassController.createClass);

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Class not found
 *       500:
 *         description: Failed to retrieve class
 */
router.get('/:id', ClassController.getClassById);

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: Update class (Admin only)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               year:
 *                 type: integer
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       400:
 *         description: No fields to update
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Class not found
 *       409:
 *         description: Class with this name or code already exists
 *       500:
 *         description: Failed to update class
 */
router.put('/:id', authorize(USER_ROLES.ADMIN), ClassController.updateClass);

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: Delete class (Admin only)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class deleted successfully
 *       400:
 *         description: Cannot delete class with students
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Class not found
 *       500:
 *         description: Failed to delete class
 */
router.delete('/:id', authorize(USER_ROLES.ADMIN), ClassController.deleteClass);

/**
 * @swagger
 * /classes/{id}/students:
 *   get:
 *     summary: Get students in class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class students retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Class not found
 *       500:
 *         description: Failed to retrieve class students
 */
router.get('/:id/students', ClassController.getClassStudents);

/**
 * @swagger
 * /classes/{id}/students:
 *   post:
 *     summary: Add student to class (Admin only)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - student_code
 *             properties:
 *               student_id:
 *                 type: integer
 *                 description: Student user ID
 *               student_code:
 *                 type: string
 *                 description: Student code in this class
 *     responses:
 *       201:
 *         description: Student added to class successfully
 *       400:
 *         description: Student ID and student code are required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Class or student not found
 *       409:
 *         description: Student is already in this class or student code already exists
 *       500:
 *         description: Failed to add student to class
 */
router.post('/:id/students', authorize(USER_ROLES.ADMIN), ClassController.addStudentToClass);

/**
 * @swagger
 * /classes/{id}/students/{student_id}:
 *   delete:
 *     summary: Remove student from class (Admin only)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *       - in: path
 *         name: student_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student removed from class successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Student not found in this class
 *       500:
 *         description: Failed to remove student from class
 */
router.delete('/:id/students/:student_id', authorize(USER_ROLES.ADMIN), ClassController.removeStudentFromClass);

/**
 * @swagger
 * /classes/{id}/status:
 *   patch:
 *     summary: Update class status (Admin only)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: New status for the class
 *     responses:
 *       200:
 *         description: Class status updated successfully
 *       400:
 *         description: Status must be either "active" or "inactive"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin role required)
 *       404:
 *         description: Class not found
 *       500:
 *         description: Failed to update class status
 */
router.patch('/:id/status', authorize(USER_ROLES.ADMIN), ClassController.updateClassStatus);

module.exports = router;