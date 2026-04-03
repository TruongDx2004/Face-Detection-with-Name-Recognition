const express = require('express');
const GradeConfigurationController = require('../controllers/GradeConfigurationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     GradeConfiguration:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Grade configuration ID
 *         course_section_id:
 *           type: integer
 *           description: Course section ID
 *         assignment_weight:
 *           type: number
 *           format: float
 *           description: Assignment weight percentage (0-100)
 *         exam_weight:
 *           type: number
 *           format: float
 *           description: Exam weight percentage (0-100)
 *         attendance_weight:
 *           type: number
 *           format: float
 *           description: Attendance weight percentage (0-100)
 *         passing_score:
 *           type: number
 *           format: float
 *           description: Minimum score to pass
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/course-sections/{courseSectionId}/grade-configuration:
 *   get:
 *     summary: Get grade configuration for course section
 *     tags: [Grade Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course section ID
 *     responses:
 *       200:
 *         description: Grade configuration retrieved successfully
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
 *                   $ref: '#/components/schemas/GradeConfiguration'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course section not found
 *       500:
 *         description: Server error
 */
router.get('/course-sections/:courseSectionId/grade-configuration', authenticateToken, GradeConfigurationController.getGradeConfiguration);

/**
 * @swagger
 * /api/course-sections/{courseSectionId}/grade-configuration:
 *   put:
 *     summary: Update grade configuration for course section
 *     tags: [Grade Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
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
 *             required:
 *               - assignment_weight
 *               - exam_weight
 *               - attendance_weight
 *               - passing_score
 *             properties:
 *               assignment_weight:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Assignment weight percentage (0-100)
 *               exam_weight:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Exam weight percentage (0-100)
 *               attendance_weight:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Attendance weight percentage (0-100)
 *               passing_score:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Minimum score to pass
 *             example:
 *               assignment_weight: 30.0
 *               exam_weight: 60.0
 *               attendance_weight: 10.0
 *               passing_score: 5.0
 *     responses:
 *       200:
 *         description: Grade configuration updated successfully
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
 *                   $ref: '#/components/schemas/GradeConfiguration'
 *       400:
 *         description: Invalid input (weights must total 100%)
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course section not found
 *       500:
 *         description: Server error
 */
router.put('/course-sections/:courseSectionId/grade-configuration', authenticateToken, GradeConfigurationController.updateGradeConfiguration);

/**
 * @swagger
 * /api/course-sections/{courseSectionId}/recalculate-grades:
 *   post:
 *     summary: Recalculate all grades for course section
 *     tags: [Grade Configuration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseSectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course section ID
 *     responses:
 *       200:
 *         description: Grades recalculated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Course section not found
 *       500:
 *         description: Server error
 */
router.post('/course-sections/:courseSectionId/recalculate-grades', authenticateToken, async (req, res) => {
    try {
        const { courseSectionId } = req.params;

        // Kiểm tra quyền
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        await GradeConfigurationController.recalculateAllGrades(courseSectionId);
        
        res.json({ 
            success: true, 
            message: 'All grades recalculated successfully' 
        });
    } catch (error) {
        console.error('Recalculate grades error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to recalculate grades' 
        });
    }
});

module.exports = router;