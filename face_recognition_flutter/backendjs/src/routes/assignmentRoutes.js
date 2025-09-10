const express = require('express');
const { AssignmentController, uploadAssignment } = require('../controllers/AssignmentController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Assignment:
 *       type: object
 *       required:
 *         - course_section_id
 *         - title
 *         - due_date
 *       properties:
 *         id:
 *           type: integer
 *           description: Assignment ID
 *         course_section_id:
 *           type: integer
 *           description: Course section ID
 *         title:
 *           type: string
 *           description: Assignment title
 *         description:
 *           type: string
 *           description: Assignment description
 *         assignment_type:
 *           type: string
 *           enum: [homework, project, lab, essay]
 *           description: Type of assignment
 *         max_score:
 *           type: number
 *           format: float
 *           description: Maximum score for assignment
 *         due_date:
 *           type: string
 *           format: date-time
 *           description: Assignment due date
 *         instructions:
 *           type: string
 *           description: Assignment instructions
 *         attachment_path:
 *           type: string
 *           description: Path to attachment file
 *     
 *     AssignmentSubmission:
 *       type: object
 *       required:
 *         - assignment_id
 *         - student_id
 *       properties:
 *         id:
 *           type: integer
 *           description: Submission ID
 *         assignment_id:
 *           type: integer
 *           description: Assignment ID
 *         student_id:
 *           type: integer
 *           description: Student ID
 *         submission_text:
 *           type: string
 *           description: Text submission
 *         attachment_path:
 *           type: string
 *           description: Path to submitted file
 *         score:
 *           type: number
 *           format: float
 *           description: Graded score
 *         feedback:
 *           type: string
 *           description: Teacher feedback
 *         status:
 *           type: string
 *           enum: [submitted, graded, late, missing]
 *           description: Submission status
 */

/**
 * @swagger
 * /assignments:
 *   post:
 *     summary: Create a new assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               course_section_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignment_type:
 *                 type: string
 *                 enum: [homework, project, lab, essay]
 *               max_score:
 *                 type: number
 *               due_date:
 *                 type: string
 *                 format: date-time
 *               instructions:
 *                 type: string
 *               attachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *       403:
 *         description: Access denied
 */
router.post('/', authenticateToken, uploadAssignment, AssignmentController.createAssignment);

/**
 * @swagger
 * /assignments/course-section/{courseSectionId}:
 *   get:
 *     summary: Get assignments by course section
 *     tags: [Assignments]
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
 *         description: Assignments retrieved successfully
 */
router.get('/course-section/:courseSectionId', authenticateToken, AssignmentController.getAssignmentsByCourseSection);

/**
 * @swagger
 * /assignments/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Assignments]
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
 *         description: Assignment retrieved successfully
 *       404:
 *         description: Assignment not found
 */
router.get('/:id', authenticateToken, AssignmentController.getAssignmentById);

/**
 * @swagger
 * /assignments/{id}:
 *   put:
 *     summary: Update assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignment_type:
 *                 type: string
 *               max_score:
 *                 type: number
 *               due_date:
 *                 type: string
 *                 format: date-time
 *               instructions:
 *                 type: string
 *               attachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       404:
 *         description: Assignment not found
 */
router.put('/:id', authenticateToken, uploadAssignment, AssignmentController.updateAssignment);

/**
 * @swagger
 * /assignments/{id}:
 *   delete:
 *     summary: Delete assignment
 *     tags: [Assignments]
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
 *         description: Assignment deleted successfully
 *       404:
 *         description: Assignment not found
 */
router.delete('/:id', authenticateToken, AssignmentController.deleteAssignment);

/**
 * @swagger
 * /assignments/{assignmentId}/submit:
 *   post:
 *     summary: Submit assignment (student)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               submission_text:
 *                 type: string
 *               attachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Assignment submitted successfully
 *       403:
 *         description: Access denied
 */
router.post('/:assignmentId/submit', authenticateToken, uploadAssignment, AssignmentController.submitAssignment);

/**
 * @swagger
 * /assignments/{assignmentId}/submissions:
 *   get:
 *     summary: Get assignment submissions (teacher)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Submissions retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/:assignmentId/submissions', authenticateToken, AssignmentController.getSubmissions);

/**
 * @swagger
 * /assignments/submissions/{submissionId}/grade:
 *   post:
 *     summary: Grade assignment submission
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
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
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *                 format: float
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment graded successfully
 *       404:
 *         description: Submission not found
 */
router.post('/submissions/:submissionId/grade', authenticateToken, AssignmentController.gradeSubmission);

/**
 * @swagger
 * /assignments/student/{courseSectionId}:
 *   get:
 *     summary: Get student assignments
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: integer
 *         description: Student ID (for teachers)
 *     responses:
 *       200:
 *         description: Student assignments retrieved successfully
 */
router.get('/student/:courseSectionId', authenticateToken, AssignmentController.getStudentAssignments);

/**
 * @swagger
 * /assignments:
 *   get:
 *     summary: Get all assignments for teacher
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, closed, draft]
 *         description: Filter by assignment status
 *       - in: query
 *         name: assignment_type
 *         schema:
 *           type: string
 *           enum: [homework, project, lab, essay]
 *         description: Filter by assignment type
 *       - in: query
 *         name: course_section_id
 *         schema:
 *           type: integer
 *         description: Filter by course section ID
 *     responses:
 *       200:
 *         description: Teacher assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Assignment'
 *                       - type: object
 *                         properties:
 *                           course_name:
 *                             type: string
 *                           subject_name:
 *                             type: string
 *                           class_name:
 *                             type: string
 *                           submission_count:
 *                             type: integer
 *                           graded_count:
 *                             type: integer
 *                 message:
 *                   type: string
 *       403:
 *         description: Access denied - Teacher role required
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, AssignmentController.getTeacherAssignments);

/**
 * @swagger
 * /assignments/teacher/stats:
 *   get:
 *     summary: Get teacher assignment statistics
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher stats retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/teacher/stats', authenticateToken, AssignmentController.getTeacherStats);

/**
 * @swagger
 * /assignments/ungraded:
 *   get:
 *     summary: Get ungraded submissions
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ungraded submissions retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/ungraded', authenticateToken, AssignmentController.getUngraded);

/**
 * @swagger
 * /assignments/files/uploads/assignments/{filename}:
 *   get:
 *     summary: Download assignment attachment file
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The filename to download
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *       403:
 *         description: Access denied
 */
router.get('/files/uploads/assignments/:filename', authenticateToken, AssignmentController.downloadFile);

module.exports = router;