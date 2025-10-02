const express = require('express');
const router = express.Router();
const AssignmentTemplateController = require('../controllers/AssignmentTemplateController');
const { authenticateToken, authorize } = require('../middleware/auth');

const { USER_ROLES } = require('../config/constants');

// Middleware: Yêu cầu authentication cho tất cả routes
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     AssignmentTemplate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         teacher_id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         assignment_type:
 *           type: string
 *           enum: [homework, project, lab, essay]
 *         default_max_score:
 *           type: number
 *           format: decimal
 *         instructions:
 *           type: string
 *         attachment_path:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         usage_count:
 *           type: integer
 *         is_public:
 *           type: boolean
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         teacher_name:
 *           type: string
 */

/**
 * @swagger
 * /assignment-templates:
 *   post:
 *     summary: Tạo template bài tập mới
 *     tags: [Assignment Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignment_type:
 *                 type: string
 *                 enum: [homework, project, lab, essay]
 *               default_max_score:
 *                 type: number
 *               instructions:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: JSON array hoặc comma-separated string
 *               is_public:
 *                 type: boolean
 *               attachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Template được tạo thành công
 */
router.post('/', AssignmentTemplateController.uploadMiddleware, AssignmentTemplateController.createTemplate);

/**
 * @swagger
 * /assignment-templates/teacher/{teacherId}:
 *   get:
 *     summary: Lấy templates của giáo viên
 *     tags: [Assignment Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: assignment_type
 *         schema:
 *           type: string
 *           enum: [homework, project, lab, essay]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Templates được lấy thành công
 */
router.get('/teacher/:teacherId', AssignmentTemplateController.getTeacherTemplates);

/**
 * @swagger
 * /assignment-templates/public:
 *   get:
 *     summary: Lấy templates công khai
 *     tags: [Assignment Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assignment_type
 *         schema:
 *           type: string
 *           enum: [homework, project, lab, essay]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Templates công khai được lấy thành công
 */
router.get('/public', AssignmentTemplateController.getPublicTemplates);

/**
 * @swagger
 * /assignment-templates/top:
 *   get:
 *     summary: Lấy top templates được sử dụng nhiều nhất
 *     tags: [Assignment Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top templates được lấy thành công
 */
router.get('/top', AssignmentTemplateController.getTopTemplates);

/**
 * @swagger
 * /assignment-templates/search:
 *   get:
 *     summary: Tìm kiếm templates theo tags
 *     tags: [Assignment Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tags
 *         required: true
 *         schema:
 *           type: string
 *           description: Comma-separated tags
 *     responses:
 *       200:
 *         description: Templates được tìm thấy
 */
router.get('/search', AssignmentTemplateController.searchByTags);

/**
 * @swagger
 * /assignment-templates/{id}:
 *   get:
 *     summary: Lấy template theo ID
 *     tags: [Assignment Templates]
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
 *         description: Template được lấy thành công
 */
router.get('/:id', AssignmentTemplateController.getTemplateById);

/**
 * @swagger
 * /assignment-templates/{id}:
 *   put:
 *     summary: Cập nhật template
 *     tags: [Assignment Templates]
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
 *               default_max_score:
 *                 type: number
 *               instructions:
 *                 type: string
 *               tags:
 *                 type: string
 *               is_public:
 *                 type: boolean
 *               attachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Template được cập nhật thành công
 */
router.put('/:id', AssignmentTemplateController.uploadMiddleware, AssignmentTemplateController.updateTemplate);

/**
 * @swagger
 * /assignment-templates/{id}:
 *   delete:
 *     summary: Xóa template
 *     tags: [Assignment Templates]
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
 *         description: Template được xóa thành công
 */
router.delete('/:id', AssignmentTemplateController.deleteTemplate);

/**
 * @swagger
 * /assignment-templates/{templateId}/create-assignment:
 *   post:
 *     summary: Tạo assignment từ template
 *     tags: [Assignment Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
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
 *               - course_section_id
 *               - due_date
 *             properties:
 *               course_section_id:
 *                 type: integer
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
 *               attachment_path:
 *                 type: string
 *     responses:
 *       201:
 *         description: Assignment được tạo từ template thành công
 */
router.post('/:templateId/create-assignment', AssignmentTemplateController.createAssignmentFromTemplate);

/**
 * @swagger
 * /assignment-templates/teacher/{teacherId}/stats:
 *   get:
 *     summary: Lấy thống kê templates của giáo viên
 *     tags: [Assignment Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thống kê templates được lấy thành công
 */
router.get('/teacher/:teacherId/stats', AssignmentTemplateController.getTemplateStats);

module.exports = router;