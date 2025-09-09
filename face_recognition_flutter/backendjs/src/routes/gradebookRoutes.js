const express = require('express');
const GradebookController = require('../controllers/GradebookController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Gradebook:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Gradebook record ID
 *         course_section_id:
 *           type: integer
 *           description: Course section ID
 *         student_id:
 *           type: integer
 *           description: Student ID
 *         assignment_avg:
 *           type: number
 *           format: float
 *           description: Average assignment score
 *         exam_avg:
 *           type: number
 *           format: float
 *           description: Average exam score
 *         attendance_score:
 *           type: number
 *           format: float
 *           description: Attendance score
 *         final_score:
 *           type: number
 *           format: float
 *           description: Final calculated score
 *         letter_grade:
 *           type: string
 *           enum: [A+, A, B+, B, C+, C, D+, D, F]
 *           description: Letter grade
 *         gpa_points:
 *           type: number
 *           format: float
 *           description: GPA points
 *         is_passed:
 *           type: boolean
 *           description: Whether student passed
 *     
 *     GradeConfiguration:
 *       type: object
 *       required:
 *         - course_section_id
 *       properties:
 *         id:
 *           type: integer
 *           description: Configuration ID
 *         course_section_id:
 *           type: integer
 *           description: Course section ID
 *         assignment_weight:
 *           type: number
 *           format: float
 *           description: Assignment weight percentage
 *         exam_weight:
 *           type: number
 *           format: float
 *           description: Exam weight percentage
 *         attendance_weight:
 *           type: number
 *           format: float
 *           description: Attendance weight percentage
 *         passing_score:
 *           type: number
 *           format: float
 *           description: Minimum passing score
 */

/**
 * @swagger
 * /gradebook/calculate/{courseSectionId}/{studentId}:
 *   post:
 *     summary: Calculate grade for a student
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Grade calculated successfully
 *       403:
 *         description: Access denied
 */
router.post('/calculate/:courseSectionId/:studentId', authenticateToken, GradebookController.calculateStudentGrade);

/**
 * @swagger
 * /gradebook/recalculate/{courseSectionId}:
 *   post:
 *     summary: Recalculate all grades in course section
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: All grades recalculated successfully
 *       403:
 *         description: Access denied
 */
router.post('/recalculate/:courseSectionId', authenticateToken, GradebookController.recalculateAllGrades);

/**
 * @swagger
 * /gradebook/course-section/{courseSectionId}:
 *   get:
 *     summary: Get gradebook by course section
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Gradebook retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/course-section/:courseSectionId', authenticateToken, GradebookController.getGradebookByCourseSection);

/**
 * @swagger
 * /gradebook/student/{studentId}:
 *   get:
 *     summary: Get student gradebook
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: courseSectionId
 *         schema:
 *           type: integer
 *         description: Filter by course section
 *     responses:
 *       200:
 *         description: Student gradebook retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/student/:studentId', authenticateToken, GradebookController.getStudentGradebook);

/**
 * @swagger
 * /gradebook/statistics/{courseSectionId}:
 *   get:
 *     summary: Get grade statistics
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Grade statistics retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/statistics/:courseSectionId', authenticateToken, GradebookController.getGradeStatistics);

/**
 * @swagger
 * /gradebook/gpa/{studentId}:
 *   get:
 *     summary: Get student GPA
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student GPA calculated successfully
 *       403:
 *         description: Access denied
 */
router.get('/gpa/:studentId', authenticateToken, GradebookController.getStudentGPA);

/**
 * @swagger
 * /gradebook/configuration/{courseSectionId}:
 *   get:
 *     summary: Get grade configuration
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Grade configuration retrieved successfully
 */
router.get('/configuration/:courseSectionId', authenticateToken, GradebookController.getGradeConfiguration);

/**
 * @swagger
 * /gradebook/configuration/{courseSectionId}:
 *   put:
 *     summary: Update grade configuration
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
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
 *               assignment_weight:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *               exam_weight:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *               attendance_weight:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *               passing_score:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 10
 *     responses:
 *       200:
 *         description: Grade configuration updated successfully
 *       400:
 *         description: Invalid configuration
 *       403:
 *         description: Access denied
 */
router.put('/configuration/:courseSectionId', authenticateToken, GradebookController.updateGradeConfiguration);

/**
 * @swagger
 * /gradebook/configuration/{courseSectionId}/copy:
 *   post:
 *     summary: Copy grade configuration from another course section
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromCourseSectionId
 *             properties:
 *               fromCourseSectionId:
 *                 type: integer
 *                 description: Source course section ID
 *     responses:
 *       200:
 *         description: Grade configuration copied successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Source configuration not found
 */
router.post('/configuration/:courseSectionId/copy', authenticateToken, GradebookController.copyGradeConfiguration);

/**
 * @swagger
 * /gradebook/teacher/configurations:
 *   get:
 *     summary: Get teacher's grade configurations
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher configurations retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/teacher/configurations', authenticateToken, GradebookController.getTeacherConfigurations);

/**
 * @swagger
 * /gradebook/export/{courseSectionId}:
 *   get:
 *     summary: Export gradebook as CSV
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Gradebook exported successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       403:
 *         description: Access denied
 */
router.get('/export/:courseSectionId', authenticateToken, GradebookController.exportGradebook);

/**
 * @swagger
 * /gradebook/ranking/{courseSectionId}:
 *   get:
 *     summary: Get class ranking
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Class ranking retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/ranking/:courseSectionId', authenticateToken, GradebookController.getClassRanking);

/**
 * @swagger
 * /gradebook/{courseSectionId}/{studentId}:
 *   delete:
 *     summary: Delete gradebook record
 *     tags: [Gradebook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Gradebook record deleted successfully
 *       404:
 *         description: Gradebook record not found
 *       403:
 *         description: Access denied
 */
router.delete('/:courseSectionId/:studentId', authenticateToken, GradebookController.deleteGradebookRecord);

module.exports = router;