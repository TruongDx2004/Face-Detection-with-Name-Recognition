const express = require('express');
const ChatController = require('../controllers/ChatController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');

const router = express.Router();

// Middleware: Yêu cầu authentication cho tất cả routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Send message to chatbot
 *     description: Send a message to the teacher chatbot and get intelligent response
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Message from teacher
 *                 example: "Danh sách sinh viên lớp CNTT K20"
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Chat response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *                       description: Chatbot response message
 *                       example: "📚 Lớp CNTT K20 có 25 sinh viên:\n\n1. Nguyễn Văn A\n2. Trần Thị B..."
 *                     intent:
 *                       type: string
 *                       description: Detected intent from message
 *                       example: "QUERY_STUDENT_LIST"
 *                       enum: [QUERY_STUDENT_LIST, QUERY_ATTENDANCE, QUERY_GRADES, QUERY_ASSIGNMENTS, GENERAL]
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Response timestamp
 *                       example: "2023-12-19T10:30:00.000Z"
 *       400:
 *         description: Bad request - missing or invalid message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Tin nhắn không được để trống"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Lỗi xử lý tin nhắn"
 */
router.post('/', authorize(USER_ROLES.TEACHER), ChatController.sendMessage);

/**
 * @swagger
 * /api/chat/history:
 *   get:
 *     summary: Get chat history (Future feature)
 *     description: Retrieve chat history for current user (to be implemented)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *       501:
 *         description: Feature not implemented yet
 */
router.get('/history', authorize(USER_ROLES.TEACHER), (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Tính năng lịch sử chat sẽ được phát triển trong phiên bản tiếp theo'
    });
});

/**
 * @swagger
 * /api/chat/intents:
 *   get:
 *     summary: Get available intents
 *     description: Get list of available chatbot intents and example messages
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available intents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       intent:
 *                         type: string
 *                         example: "QUERY_STUDENT_LIST"
 *                       description:
 *                         type: string
 *                         example: "Xem danh sách sinh viên theo lớp"
 *                       examples:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["Danh sách sinh viên lớp CNTT K20", "Cho tôi xem học sinh lớp 12A1"]
 */
router.get('/intents', authorize(USER_ROLES.TEACHER), (req, res) => {
    const intents = [
        {
            intent: 'QUERY_STUDENT_LIST',
            description: 'Xem danh sách sinh viên theo lớp',
            examples: [
                'Danh sách sinh viên lớp CNTT K20',
                'Cho tôi xem học sinh lớp 12A1',
                'DS sinh viên lớp Toán Tin K19'
            ]
        },
        {
            intent: 'QUERY_ATTENDANCE',
            description: 'Kiểm tra thông tin điểm danh',
            examples: [
                'Điểm danh lớp CNTT K20 hôm nay',
                'Có bao nhiêu sinh viên vắng hôm qua?',
                'Tình hình điểm danh lớp 12A1'
            ]
        },
        {
            intent: 'QUERY_GRADES',
            description: 'Xem điểm số học tập',
            examples: [
                'Điểm của Nguyễn Văn A',
                'Điểm trung bình của Trần Thị B',
                'Kết quả học tập của Lê Văn C'
            ]
        },
        {
            intent: 'QUERY_ASSIGNMENTS',
            description: 'Kiểm tra tình hình bài tập',
            examples: [
                'Ai chưa nộp bài tập tuần 3?',
                'Bài tập tuần 5 lớp CNTT K20',
                'Tình hình nộp bài của lớp 12A1'
            ]
        }
    ];

    res.json({
        success: true,
        data: intents
    });
});

module.exports = router;