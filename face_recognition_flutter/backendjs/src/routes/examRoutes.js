const express = require('express');
const ExamController = require('../controllers/ExamController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Exam:
 *       type: object
 *       required:
 *         - course_section_id
 *         - title
 *         - exam_date
 *         - start_time
 *         - end_time
 *       properties:
 *         id:
 *           type: integer
 *           description: Exam ID
 *         course_section_id:
 *           type: integer
 *           description: Course section ID
 *         title:
 *           type: string
 *           description: Exam title
 *         description:
 *           type: string
 *           description: Exam description
 *         exam_type:
 *           type: string
 *           enum: [quiz, midterm, final, practical]
 *           description: Type of exam
 *         max_score:
 *           type: number
 *           format: float
 *           description: Maximum score for exam
 *         duration_minutes:
 *           type: integer
 *           description: Exam duration in minutes
 *         exam_date:
 *           type: string
 *           format: date
 *           description: Exam date
 *         start_time:
 *           type: string
 *           format: time
 *           description: Exam start time
 *         end_time:
 *           type: string
 *           format: time
 *           description: Exam end time
 *         instructions:
 *           type: string
 *           description: Exam instructions
 *     
 *     ExamQuestion:
 *       type: object
 *       required:
 *         - exam_id
 *         - question_text
 *       properties:
 *         id:
 *           type: integer
 *           description: Question ID
 *         exam_id:
 *           type: integer
 *           description: Exam ID
 *         question_text:
 *           type: string
 *           description: Question text
 *         question_type:
 *           type: string
 *           enum: [multiple_choice, true_false, short_answer, essay]
 *           description: Type of question
 *         points:
 *           type: number
 *           format: float
 *           description: Points for this question
 *         question_order:
 *           type: integer
 *           description: Order of question in exam
 *         correct_answer:
 *           type: string
 *           description: Correct answer
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: Multiple choice options
 *     
 *     ExamResult:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Result ID
 *         exam_id:
 *           type: integer
 *           description: Exam ID
 *         student_id:
 *           type: integer
 *           description: Student ID
 *         score:
 *           type: number
 *           format: float
 *           description: Student's score
 *         total_score:
 *           type: number
 *           format: float
 *           description: Total possible score
 *         status:
 *           type: string
 *           enum: [not_started, in_progress, completed, graded]
 *           description: Exam status
 */

/**
 * @swagger
 * /exams:
 *   post:
 *     summary: Create a new exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_section_id
 *               - title
 *               - exam_date
 *               - start_time
 *               - end_time
 *             properties:
 *               course_section_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               exam_type:
 *                 type: string
 *                 enum: [quiz, midterm, final, practical]
 *               max_score:
 *                 type: number
 *               duration_minutes:
 *                 type: integer
 *               exam_date:
 *                 type: string
 *                 format: date
 *               start_time:
 *                 type: string
 *                 format: time
 *               end_time:
 *                 type: string
 *                 format: time
 *               instructions:
 *                 type: string
 *               questions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ExamQuestion'
 *     responses:
 *       201:
 *         description: Exam created successfully
 *       403:
 *         description: Access denied
 */
router.post('/', authenticateToken, ExamController.createExam);

/**
 * @swagger
 * /exams/course-section/{courseSectionId}:
 *   get:
 *     summary: Get exams by course section
 *     tags: [Exams]
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
 *         description: Exams retrieved successfully
 */
router.get('/course-section/:courseSectionId', authenticateToken, ExamController.getExamsByCourseSection);

/**
 * @swagger
 * /exams/{id}:
 *   get:
 *     summary: Get exam by ID
 *     tags: [Exams]
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
 *         description: Exam retrieved successfully
 *       404:
 *         description: Exam not found
 */
router.get('/:id', authenticateToken, ExamController.getExamById);

/**
 * @swagger
 * /exams/{id}:
 *   put:
 *     summary: Update exam
 *     tags: [Exams]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               exam_type:
 *                 type: string
 *               max_score:
 *                 type: number
 *               duration_minutes:
 *                 type: integer
 *               exam_date:
 *                 type: string
 *                 format: date
 *               start_time:
 *                 type: string
 *                 format: time
 *               end_time:
 *                 type: string
 *                 format: time
 *               instructions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Exam updated successfully
 *       404:
 *         description: Exam not found
 */
router.put('/:id', authenticateToken, ExamController.updateExam);

/**
 * @swagger
 * /exams/{id}:
 *   delete:
 *     summary: Delete exam
 *     tags: [Exams]
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
 *         description: Exam deleted successfully
 *       404:
 *         description: Exam not found
 */
router.delete('/:id', authenticateToken, ExamController.deleteExam);

/**
 * @swagger
 * /exams/{examId}/start:
 *   post:
 *     summary: Start taking an exam (student)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Exam started successfully
 *       400:
 *         description: Cannot start exam
 *       403:
 *         description: Access denied
 */
router.post('/:examId/start', authenticateToken, ExamController.startExam);

/**
 * @swagger
 * /exams/results/{resultId}/answer:
 *   post:
 *     summary: Save answer to exam question
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
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
 *               - question_id
 *               - student_answer
 *             properties:
 *               question_id:
 *                 type: integer
 *               student_answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer saved successfully
 *       403:
 *         description: Access denied
 */
router.post('/results/:resultId/answer', authenticateToken, ExamController.saveAnswer);

/**
 * @swagger
 * /exams/results/{resultId}/submit:
 *   post:
 *     summary: Submit exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question_id:
 *                       type: integer
 *                     student_answer:
 *                       type: string
 *     responses:
 *       200:
 *         description: Exam submitted successfully
 *       403:
 *         description: Access denied
 */
router.post('/results/:resultId/submit', authenticateToken, ExamController.submitExam);

/**
 * @swagger
 * /exams/{examId}/results:
 *   get:
 *     summary: Get exam results (teacher)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Exam results retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/:examId/results', authenticateToken, ExamController.getExamResults);

/**
 * @swagger
 * /exams/{examId}/result:
 *   get:
 *     summary: Get student exam result
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
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
 *         description: Exam result retrieved successfully
 *       404:
 *         description: Exam result not found
 */
router.get('/:examId/result', authenticateToken, ExamController.getStudentExamResult);

/**
 * @swagger
 * /exams/results/{resultId}/grade:
 *   post:
 *     summary: Grade exam manually
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *                 format: float
 *               grades:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     answer_id:
 *                       type: integer
 *                     is_correct:
 *                       type: boolean
 *                     points_earned:
 *                       type: number
 *     responses:
 *       200:
 *         description: Exam graded successfully
 *       403:
 *         description: Access denied
 */
router.post('/results/:resultId/grade', authenticateToken, ExamController.gradeExam);

/**
 * @swagger
 * /exams/student/{courseSectionId}:
 *   get:
 *     summary: Get student exams
 *     tags: [Exams]
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
 *         description: Student exams retrieved successfully
 */
router.get('/student/:courseSectionId', authenticateToken, ExamController.getStudentExams);

/**
 * @swagger
 * /exams/{examId}/statistics:
 *   get:
 *     summary: Get exam statistics
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Exam statistics retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/:examId/statistics', authenticateToken, ExamController.getExamStatistics);

/**
 * @swagger
 * /exams/results/{resultId}/time-check:
 *   get:
 *     summary: Check time limit for exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resultId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: duration_minutes
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Time check completed
 *       403:
 *         description: Access denied
 */
router.get('/results/:resultId/time-check', authenticateToken, ExamController.checkTimeLimit);

/**
 * @swagger
 * /exams/ungraded:
 *   get:
 *     summary: Get ungraded exams
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ungraded exams retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/ungraded', authenticateToken, ExamController.getUngraded);

module.exports = router;