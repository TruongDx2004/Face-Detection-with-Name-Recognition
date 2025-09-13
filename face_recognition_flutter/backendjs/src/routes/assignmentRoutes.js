const express = require('express');
const AssignmentController = require('../controllers/AssignmentController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

// Middleware: Yêu cầu authentication cho tất cả routes
router.use(authenticateToken);

/**
 * @swagger
 * /assignments:
 *   post:
 *     summary: Create a new assignment (Teacher only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - course_section_id
 *               - title
 *               - due_date
 *             properties:
 *               course_section_id:
 *                 type: integer
 *                 description: ID của lớp học phần
 *               title:
 *                 type: string
 *                 description: Tiêu đề bài tập
 *               description:
 *                 type: string
 *                 description: Mô tả bài tập
 *               assignment_type:
 *                 type: string
 *                 enum: [homework, project, lab, essay]
 *                 default: homework
 *               max_score:
 *                 type: number
 *                 default: 10
 *                 description: Điểm tối đa
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 description: Hạn nộp bài
 *               instructions:
 *                 type: string
 *                 description: Hướng dẫn làm bài
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: File đính kèm
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', 
    authorize(USER_ROLES.TEACHER, USER_ROLES.ADMIN), 
    AssignmentController.uploadMiddleware, 
    AssignmentController.createAssignment
);

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
router.get('/', authorize(USER_ROLES.TEACHER, USER_ROLES.ADMIN), AssignmentController.getTeacherAssignments);

/**
 * @swagger
 * /assignments/{id}:
 *   get:
 *     summary: Get assignment details
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment details retrieved successfully
 *       404:
 *         description: Assignment not found
 */
router.get('/:id', AssignmentController.getAssignmentById);

/**
 * @swagger
 * /assignments/{id}:
 *   put:
 *     summary: Update assignment (Teacher only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
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
 *       200:
 *         description: Assignment updated successfully
 *       404:
 *         description: Assignment not found
 *       403:
 *         description: Access denied
 */
router.put('/:id', 
    authorize(USER_ROLES.TEACHER, USER_ROLES.ADMIN), 
    AssignmentController.uploadMiddleware, 
    AssignmentController.updateAssignment
);

/**
 * @swagger
 * /assignments/{id}:
 *   delete:
 *     summary: Delete assignment (Teacher only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment deleted successfully
 *       404:
 *         description: Assignment not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', 
    authorize(USER_ROLES.TEACHER, USER_ROLES.ADMIN), 
    AssignmentController.deleteAssignment
);

/**
 * @swagger
 * /assignments/student/{courseSectionId}:
 *   get:
 *     summary: Get assignments for student by course section
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course Section ID
 *     responses:
 *       200:
 *         description: List of assignments with submission status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       due_date:
 *                         type: string
 *                         format: date-time
 *                       submission:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           score:
 *                             type: number
 *                             nullable: true
 *       403:
 *         description: Not enrolled in course section
 */
router.get('/student/:courseSectionId', 
    authorize(USER_ROLES.STUDENT), 
    AssignmentController.getStudentAssignments
);

/**
 * @swagger
 * /assignments/teacher/{teacherId}:
 *   get:
 *     summary: Get assignments created by teacher
 *     tags: [Assignments]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, closed]
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
 *         description: Filter by course section
 *     responses:
 *       200:
 *         description: List of teacher's assignments with statistics
 *       403:
 *         description: Access denied
 */
router.get('/teacher/:teacherId', 
    authorize(USER_ROLES.TEACHER, USER_ROLES.ADMIN), 
    AssignmentController.getTeacherAssignments
);

/**
 * @swagger
 * /assignments/submit:
 *   post:
 *     summary: Submit assignment (Student only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - assignment_id
 *               - student_id
 *             properties:
 *               assignment_id:
 *                 type: integer
 *                 description: ID của bài tập
 *               student_id:
 *                 type: integer
 *                 description: ID của sinh viên
 *               submission_text:
 *                 type: string
 *                 description: Nội dung bài làm
 *               attachment:
 *                 type: string
 *                 format: binary
 *                 description: File bài làm
 *     responses:
 *       201:
 *         description: Assignment submitted successfully
 *       400:
 *         description: Validation error or assignment overdue
 *       403:
 *         description: Access denied or not enrolled
 *       404:
 *         description: Assignment not found
 */
router.post('/submit', 
    authorize(USER_ROLES.STUDENT), 
    AssignmentController.uploadMiddleware, 
    AssignmentController.submitAssignment
);

/**
 * @swagger
 * /assignments/{assignmentId}/submissions/{studentId}:
 *   get:
 *     summary: Get specific assignment submission
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Assignment submission details
 *       404:
 *         description: Submission not found
 *       403:
 *         description: Access denied
 */
router.get('/:assignmentId/submissions/:studentId', AssignmentController.getSubmission);

/**
 * @swagger
 * /assignments/{assignmentId}/submissions:
 *   get:
 *     summary: Get all submissions for an assignment (Teacher only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: List of submissions for the assignment
 *       403:
 *         description: Access denied
 *       404:
 *         description: Assignment not found
 */
router.get('/:assignmentId/submissions', 
    authorize(USER_ROLES.TEACHER, USER_ROLES.ADMIN), 
    AssignmentController.getAssignmentSubmissions
);

/**
 * @swagger
 * /assignments/submissions/{submissionId}/grade:
 *   put:
 *     summary: Grade assignment submission (Teacher only)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Submission ID
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
 *                 minimum: 0
 *                 description: Điểm số
 *               feedback:
 *                 type: string
 *                 description: Nhận xét của giáo viên
 *     responses:
 *       200:
 *         description: Assignment graded successfully
 *       400:
 *         description: Invalid score
 *       403:
 *         description: Access denied
 *       404:
 *         description: Submission not found
 */
router.put('/submissions/:submissionId/grade', 
    authorize(USER_ROLES.TEACHER, USER_ROLES.ADMIN), 
    AssignmentController.gradeSubmission
);

/**
 * @swagger
 * /assignments/submissions/student/{studentId}:
 *   get:
 *     summary: Get all submissions by student
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: List of student's submissions
 *       403:
 *         description: Access denied
 */
router.get('/submissions/student/:studentId', AssignmentController.getStudentSubmissions);

/**
 * @swagger
 * /assignments/submissions/ungraded/{teacherId}:
 *   get:
 *     summary: Get ungraded submissions for teacher
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: List of ungraded submissions
 *       403:
 *         description: Access denied
 */
router.get('/submissions/ungraded/:teacherId', 
    authorize(USER_ROLES.TEACHER, USER_ROLES.ADMIN), 
    AssignmentController.getUngradedSubmissions
);

/**
 * @swagger
 * /assignments/teacher/{teacherId}/stats:
 *   get:
 *     summary: Get assignment statistics for teacher
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: Assignment statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_assignments:
 *                       type: integer
 *                     total_submissions:
 *                       type: integer
 *                     avg_score:
 *                       type: number
 *                     graded_count:
 *                       type: integer
 *       403:
 *         description: Access denied
 */
router.get('/teacher/:teacherId/stats', 
    authorize(USER_ROLES.TEACHER, USER_ROLES.ADMIN), 
    AssignmentController.getTeacherAssignmentStats
);

module.exports = router;