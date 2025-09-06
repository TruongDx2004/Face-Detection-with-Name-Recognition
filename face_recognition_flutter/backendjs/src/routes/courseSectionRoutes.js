const express = require('express');
const router = express.Router();
const CourseSectionController = require('../controllers/CourseSectionController');

// Import auth middleware safely
let auth;
try {
  const authModule = require('../middleware/auth');
  auth = authModule.authenticateToken;
} catch (error) {
  console.warn('auth middleware not found, using empty middleware');
  auth = (req, res, next) => next();
}

// Import validator safely
let courseSectionValidator;
try {
  courseSectionValidator = require('../validators/courseSectionValidator').courseSectionValidator;
} catch (error) {
  console.warn('courseSectionValidator not found, using empty middleware');
  courseSectionValidator = {
    create: (req, res, next) => next(),
    update: (req, res, next) => next()
  };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CourseSection:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - class_id
 *         - subject_id
 *         - teacher_id
 *         - semester
 *         - academic_year
 *       properties:
 *         id:
 *           type: integer
 *           description: Course section ID
 *         name:
 *           type: string
 *           description: Course section name
 *         code:
 *           type: string
 *           description: Course section code (unique)
 *         class_id:
 *           type: integer
 *           description: Class ID
 *         subject_id:
 *           type: integer
 *           description: Subject ID
 *         teacher_id:
 *           type: integer
 *           description: Teacher ID
 *         semester:
 *           type: string
 *           description: Semester (e.g., HK1, HK2)
 *         academic_year:
 *           type: string
 *           description: Academic year (e.g., 2024-2025)
 *         max_students:
 *           type: integer
 *           description: Maximum number of students
 *         description:
 *           type: string
 *           description: Course section description
 *         is_active:
 *           type: boolean
 *           description: Whether the course section is active
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/course-sections:
 *   get:
 *     summary: Get all course sections
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
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
 *         name: semester
 *         schema:
 *           type: string
 *         description: Filter by semester
 *       - in: query
 *         name: academic_year
 *         schema:
 *           type: string
 *         description: Filter by academic year
 *     responses:
 *       200:
 *         description: Course sections retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, CourseSectionController.getAllCourseSections);

/**
 * @swagger
 * /api/course-sections/{id}:
 *   get:
 *     summary: Get course section by ID
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course section ID
 *     responses:
 *       200:
 *         description: Course section retrieved successfully
 *       404:
 *         description: Course section not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, CourseSectionController.getCourseSectionById);

/**
 * @swagger
 * /api/course-sections:
 *   post:
 *     summary: Create a new course section
 *     tags: [Course Sections]
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
 *               - class_id
 *               - subject_id
 *               - teacher_id
 *               - semester
 *               - academic_year
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               class_id:
 *                 type: integer
 *               subject_id:
 *                 type: integer
 *               teacher_id:
 *                 type: integer
 *               semester:
 *                 type: string
 *               academic_year:
 *                 type: string
 *               max_students:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course section created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, courseSectionValidator.create, CourseSectionController.createCourseSection);

/**
 * @swagger
 * /api/course-sections/{id}:
 *   put:
 *     summary: Update course section
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course section ID
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
 *               class_id:
 *                 type: integer
 *               subject_id:
 *                 type: integer
 *               teacher_id:
 *                 type: integer
 *               semester:
 *                 type: string
 *               academic_year:
 *                 type: string
 *               max_students:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course section updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Course section not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, courseSectionValidator.update, CourseSectionController.updateCourseSection);

/**
 * @swagger
 * /api/course-sections/{id}:
 *   delete:
 *     summary: Delete course section
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course section ID
 *     responses:
 *       200:
 *         description: Course section deleted successfully
 *       404:
 *         description: Course section not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, CourseSectionController.deleteCourseSection);

/**
 * @swagger
 * /api/course-sections/{id}/schedules:
 *   get:
 *     summary: Get course section schedules
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course section ID
 *     responses:
 *       200:
 *         description: Course section schedules retrieved successfully
 *       404:
 *         description: Course section not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id/schedules', auth, CourseSectionController.getCourseSectionSchedules);

/**
 * @swagger
 * /api/course-sections/{id}/students:
 *   get:
 *     summary: Get course section students
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course section ID
 *     responses:
 *       200:
 *         description: Course section students retrieved successfully
 *       404:
 *         description: Course section not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id/students', auth, CourseSectionController.getCourseSectionStudents);

/**
 * @swagger
 * /api/course-sections/{id}/attendance-sessions:
 *   get:
 *     summary: Get course section attendance sessions
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course section ID
 *     responses:
 *       200:
 *         description: Course section attendance sessions retrieved successfully
 *       404:
 *         description: Course section not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id/attendance-sessions', auth, CourseSectionController.getCourseSectionAttendanceSessions);

/**
 * @swagger
 * /api/course-sections/teacher/{teacherId}:
 *   get:
 *     summary: Get course sections by teacher
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Teacher ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Teacher course sections retrieved successfully
 *       404:
 *         description: Teacher not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/teacher/:teacherId', auth, CourseSectionController.getCourseSectionsByTeacher);

/**
 * @swagger
 * /api/course-sections/class/{classId}:
 *   get:
 *     summary: Get course sections by class
 *     tags: [Course Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Class course sections retrieved successfully
 *       404:
 *         description: Class not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/class/:classId', auth, CourseSectionController.getCourseSectionsByClass);

module.exports = router;