const express = require('express');
const router = express.Router();
const StudentGradeController = require('../controllers/StudentGradeController');

// Import auth middleware safely
let auth;
try {
  const authModule = require('../middleware/auth');
  auth = authModule.authenticateToken;
} catch (error) {
  console.warn('auth middleware not found, using empty middleware');
  auth = (req, res, next) => next();
}

/**
 * @swagger
 * components:
 *   schemas:
 *     StudentGrade:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         student_id:
 *           type: integer
 *         course_section_id:
 *           type: integer
 *         course_section_name:
 *           type: string
 *         subject_name:
 *           type: string
 *         semester:
 *           type: string
 *         academic_year:
 *           type: string
 *         assignment_avg:
 *           type: number
 *         exam_avg:
 *           type: number
 *         attendance_score:
 *           type: number
 *         final_score:
 *           type: number
 *         letter_grade:
 *           type: string
 *         gpa_points:
 *           type: number
 *         is_passed:
 *           type: boolean
 *         calculated_at:
 *           type: string
 *           format: date-time
 *     SemesterSummary:
 *       type: object
 *       properties:
 *         semester:
 *           type: string
 *         academic_year:
 *           type: string
 *         total_credits:
 *           type: integer
 *         average_gpa:
 *           type: number
 *         total_subjects:
 *           type: integer
 *         passed_subjects:
 *           type: integer
 *         grades:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StudentGrade'
 *     GpaOverall:
 *       type: object
 *       properties:
 *         cumulative_gpa:
 *           type: number
 *         total_credits:
 *           type: integer
 *         total_semesters:
 *           type: integer
 *         average_score:
 *           type: number
 *         classification:
 *           type: string
 *         total_subjects:
 *           type: integer
 *         passed_subjects:
 *           type: integer
 *         pass_rate:
 *           type: number
 */

/**
 * @swagger
 * /api/students/{userId}/current-grades:
 *   get:
 *     summary: Get student's current semester grades
 *     tags: [Student Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student user ID
 *     responses:
 *       200:
 *         description: Current grades retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudentGrade'
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/students/:userId/current-grades', auth, StudentGradeController.getCurrentGrades);

/**
 * @swagger
 * /api/students/{userId}/semester-summaries:
 *   get:
 *     summary: Get student's semester summaries
 *     tags: [Student Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student user ID
 *     responses:
 *       200:
 *         description: Semester summaries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SemesterSummary'
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/students/:userId/semester-summaries', auth, StudentGradeController.getSemesterSummaries);

/**
 * @swagger
 * /api/students/{userId}/gpa-overall:
 *   get:
 *     summary: Get student's overall GPA and statistics
 *     tags: [Student Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student user ID
 *     responses:
 *       200:
 *         description: GPA overall retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/GpaOverall'
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/students/:userId/gpa-overall', auth, StudentGradeController.getGpaOverall);

/**
 * @swagger
 * /api/students/{userId}/course-sections/{courseSectionId}/grade-detail:
 *   get:
 *     summary: Get detailed grades for a specific course section
 *     tags: [Student Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student user ID
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course section ID
 *     responses:
 *       200:
 *         description: Course section grade detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     overall_grade:
 *                       $ref: '#/components/schemas/StudentGrade'
 *                     assignments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           assignment_id:
 *                             type: integer
 *                           assignment_title:
 *                             type: string
 *                           score:
 *                             type: number
 *                           max_score:
 *                             type: number
 *                           status:
 *                             type: string
 *                           submitted_at:
 *                             type: string
 *                             format: date-time
 *                           graded_at:
 *                             type: string
 *                             format: date-time
 *                           feedback:
 *                             type: string
 *                     exams:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           exam_id:
 *                             type: integer
 *                           exam_title:
 *                             type: string
 *                           score:
 *                             type: number
 *                           max_score:
 *                             type: number
 *                           status:
 *                             type: string
 *                           completed_at:
 *                             type: string
 *                             format: date-time
 *                           graded_at:
 *                             type: string
 *                             format: date-time
 *                     grade_configuration:
 *                       type: object
 *                       properties:
 *                         assignment_weight:
 *                           type: number
 *                         exam_weight:
 *                           type: number
 *                         attendance_weight:
 *                           type: number
 *                         passing_score:
 *                           type: number
 *       404:
 *         description: Grade record not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/students/:userId/course-sections/:courseSectionId/grade-detail', auth, StudentGradeController.getCourseSectionGradeDetail);

/**
 * @swagger
 * /api/students/{userId}/grade-history:
 *   get:
 *     summary: Get student's grade change history
 *     tags: [Student Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student user ID
 *     responses:
 *       200:
 *         description: Grade history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [assignment, exam]
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       score:
 *                         type: number
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       subject_name:
 *                         type: string
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/students/:userId/grade-history', auth, StudentGradeController.getGradeHistory);

/**
 * @swagger
 * /api/students/{userId}/grade-statistics:
 *   get:
 *     summary: Get student's grade statistics and trends
 *     tags: [Student Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student user ID
 *     responses:
 *       200:
 *         description: Grade statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     semester_progression:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           semester:
 *                             type: string
 *                           academic_year:
 *                             type: string
 *                           avg_score:
 *                             type: number
 *                           avg_gpa:
 *                             type: number
 *                           total_subjects:
 *                             type: integer
 *                           passed_subjects:
 *                             type: integer
 *                     grade_distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           grade_letter:
 *                             type: string
 *                           count:
 *                             type: integer
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/students/:userId/grade-statistics', auth, StudentGradeController.getGradeStatistics);

module.exports = router;