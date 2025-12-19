
const aiService = require('../services/aiService');
const db = require('../config/database');
const ResponseHelper = require('../utils/responseHelper');

class ChatController {
    constructor() {
        this.sendMessage = this.sendMessage.bind(this);
    }
    /**
     * Chat endpoint - xử lý tin nhắn từ giáo viên
     * @swagger
     * /api/chat:
     *   post:
     *     summary: Send message to chatbot
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
     *                 data:
     *                   type: object
     *                   properties:
     *                     response:
     *                       type: string
     *                     intent:
     *                       type: string
     *                     timestamp:
     *                       type: string
     *       400:
     *         description: Bad request - missing message
     *       500:
     *         description: Server error
     */
    /**
     * Xử lý câu hỏi chung
     */
    handleGeneralQuestion(message) {
        return 'Câu hỏi này tôi sẽ trả lời sớm 😉';
    }

    async sendMessage(req, res) {
        try {
            const { message } = req.body;
            const userId = req.user?.id;

            if (!message || !message.trim()) {
                return ResponseHelper.badRequest(res, 'Tin nhắn không được để trống');
            }

            let intent;
            try {
                intent = await aiService.parseIntent(message);
            } catch (err) {
                console.error('AI parse error:', err);
                intent = { type: 'GENERAL_QUESTION' };
            }

            let response;
            switch (intent.type) {
                case 'QUERY_STUDENT_LIST':
                    response = await this.handleStudentListQuery(intent, userId);
                    break;
                case 'QUERY_ATTENDANCE':
                    response = await this.handleAttendanceQuery(intent, userId);
                    break;
                case 'QUERY_GRADES':
                    response = await this.handleGradesQuery(intent, userId);
                    break;
                case 'QUERY_ASSIGNMENTS':
                    response = await this.handleAssignmentsQuery(intent, userId);
                    break;
                default:
                    response = this.handleGeneralQuestion(message);
            }

            return ResponseHelper.success(res, {
                response,
                intent: intent.type,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Chat error:', error);
            return ResponseHelper.serverError(res);
        }
    }

    /**
     * Phân tích intent từ tin nhắn (phương pháp đơn giản - string matching)
     */
    parseIntent(message) {
        const intent = {
            type: 'GENERAL',
            entities: {}
        };

        // Phân tích danh sách sinh viên
        if (message.includes('danh sách sinh viên') || message.includes('học sinh') || message.includes('ds sinh viên')) {
            intent.type = 'QUERY_STUDENT_LIST';

            // Trích xuất tên lớp
            const classMatch = message.match(/lớp\s+([a-zA-ZÀ-ỹ0-9\s]+?)(?:\s|$)/i);
            if (classMatch) {
                intent.entities.className = classMatch[1].trim();
            }
        }

        // Phân tích điểm danh
        else if (message.includes('điểm danh') || message.includes('vắng') || message.includes('có mặt')) {
            intent.type = 'QUERY_ATTENDANCE';

            // Trích xuất thời gian
            if (message.includes('hôm nay')) {
                intent.entities.date = 'today';
            } else if (message.includes('hôm qua')) {
                intent.entities.date = 'yesterday';
            }

            // Trích xuất lớp
            const classMatch = message.match(/lớp\s+([a-zA-Z0-9\s]+)/i);
            if (classMatch) {
                intent.entities.className = classMatch[1].trim();
            }
        }

        // Phân tích điểm số
        else if (message.includes('điểm') || message.includes('điểm số') || message.includes('điểm trung bình')) {
            intent.type = 'QUERY_GRADES';

            // Trích xuất tên sinh viên
            const nameMatch = message.match(/của\s+([a-zA-ZÀ-ỹ\s]+)/i);
            if (nameMatch) {
                intent.entities.studentName = nameMatch[1].trim();
            }
        }

        // Phân tích bài tập
        else if (message.includes('bài tập') || message.includes('nộp bài') || message.includes('assignment')) {
            intent.type = 'QUERY_ASSIGNMENTS';

            // Trích xuất tuần
            const weekMatch = message.match(/tuần\s+(\d+)/i);
            if (weekMatch) {
                intent.entities.week = parseInt(weekMatch[1]);
            }

            // Trích xuất lớp
            const classMatch = message.match(/lớp\s+([a-zA-Z0-9\s]+)/i);
            if (classMatch) {
                intent.entities.className = classMatch[1].trim();
            }
        }

        return intent;
    }

    /**
     * Xử lý truy vấn danh sách sinh viên
     */
    async handleStudentListQuery(intent, userId) {
        try {
            // Sử dụng params thay vì entities (từ OpenRouter AI)
            const className = intent.params?.class || intent.params?.className;

            if (!className) {
                return "📚 Bạn muốn xem danh sách sinh viên lớp nào? Vui lòng cung cấp tên lớp.";
            }

            // Query database
            const [classes] = await db.execute(
                'SELECT id FROM classes WHERE name LIKE ? AND status = TRUE',
                [`%${className}%`]
            );

            if (classes.length === 0) {
                return `❌ Không tìm thấy lớp "${className}". Vui lòng kiểm tra lại tên lớp.`;
            }

            const classId = classes[0].id;
            const [students] = await db.execute(`
                SELECT u.full_name, u.id, cs.student_code
                FROM users u
                JOIN class_students cs ON u.id = cs.student_id  
                WHERE cs.class_id = ? AND u.is_active = TRUE AND u.role = 'student'
                ORDER BY cs.student_code
            `, [classId]);

            if (students.length === 0) {
                return `📚 Lớp "${className}" chưa có sinh viên nào.`;
            }

            let response = `📚 **Lớp ${className}** có ${students.length} sinh viên:\n\n`;
            students.forEach((student, index) => {
                response += `${index + 1}. ${student.full_name} (${student.student_code || student.id})\n`;
            });

            return response;

        } catch (error) {
            console.error('Error handling student list query:', error);
            return "❌ Lỗi khi truy vấn danh sách sinh viên. Vui lòng thử lại sau.";
        }
    }

    /**
     * Xử lý truy vấn điểm danh
     */
    async handleAttendanceQuery(intent, userId) {
        try {
            const className = intent.params?.class || intent.params?.className;
            const date = intent.params?.date;

            let dateCondition;
            if (date === 'yesterday') {
                dateCondition = 'DATE(a.attendance_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
            } else {
                dateCondition = 'DATE(a.attendance_time) = CURDATE()';
            }

            if (className) {
                const [classes] = await db.execute(
                    'SELECT id FROM classes WHERE name LIKE ? AND status = TRUE',
                    [`%${className}%`]
                );

                if (classes.length === 0) {
                    return `❌ Không tìm thấy lớp "${className}".`;
                }

                const classId = classes[0].id;

                // Query attendance with proper join
                const [attendance] = await db.execute(`
                SELECT 
                    COUNT(DISTINCT a.user_id) AS present_count,
                    (
                        SELECT COUNT(*) 
                        FROM class_students cs2
                        WHERE cs2.class_id = ?
                    ) AS total_students
                FROM attendances a
                JOIN class_students cs ON a.user_id = cs.student_id
                WHERE cs.class_id = ?
                  AND ${dateCondition}
            `, [classId, classId]);

                const present = attendance[0]?.present_count || 0;
                const total = attendance[0]?.total_students || 0;
                const absent = total - present;

                const dateText = date === 'yesterday' ? 'hôm qua' : 'hôm nay';

                return (
                    `📊 **Điểm danh lớp ${className} (${dateText})**\n\n` +
                    `✅ Có mặt: ${present} sinh viên\n` +
                    `❌ Vắng mặt: ${absent} sinh viên\n` +
                    `📚 Tổng số: ${total} sinh viên`
                );

            } else {
                // Tổng quan điểm danh
                const [summary] = await db.execute(`
                SELECT COUNT(DISTINCT a.user_id) AS total_present
                FROM attendances a
                WHERE ${dateCondition}
            `);

                const dateText = date === 'yesterday' ? 'hôm qua' : 'hôm nay';

                return (
                    `📊 **Tổng quan điểm danh (${dateText})**\n\n` +
                    `✅ Tổng số sinh viên đã điểm danh: ${summary[0]?.total_present || 0}`
                );
            }

        } catch (error) {
            console.error('Error handling attendance query:', error);
            return '❌ Lỗi khi truy vấn điểm danh. Vui lòng thử lại sau.';
        }
    }


    /**
     * Xử lý truy vấn điểm số
     */
    async handleGradesQuery(intent, userId) {
        try {
            // Sử dụng params từ OpenRouter AI
            const studentName = intent.params?.studentName;

            if (!studentName) {
                return "📊 Bạn muốn xem điểm của sinh viên nào? Vui lòng cung cấp tên sinh viên.";
            }

            // Find student - users table doesn't have student_id column
            const [students] = await db.execute(
                'SELECT id, full_name FROM users WHERE full_name LIKE ? AND role = ? AND is_active = TRUE',
                [`%${studentName}%`, 'student']
            );

            if (students.length === 0) {
                return `❌ Không tìm thấy sinh viên "${studentName}".`;
            }

            const student = students[0];

            // Get grades - fix column names based on Gradebook model
            const [grades] = await db.execute(`
                SELECT 
                    g.final_score AS score,
                    'final' AS type,
                    CONCAT(
                        cs.name,
                        ' (', s.code,
                        ' - ', cs.semester,
                        ' ', cs.academic_year,
                        ')'
                    ) AS subject_name
                FROM gradebook g
                JOIN course_sections cs ON g.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                WHERE g.student_id = ?
                AND g.final_score IS NOT NULL
                ORDER BY g.updated_at DESC
                LIMIT 10
            `, [student.id]);


            if (grades.length === 0) {
                return `📊 Sinh viên **${student.full_name}** chưa có điểm cuối kỳ nào được ghi nhận.`;
            }

            let response = `📊 **Điểm số của ${student.full_name}**:\n\n`;
            grades.forEach((grade, index) => {
                const scoreValue = grade.score ? parseFloat(grade.score).toFixed(2) : 'N/A';
                response += `${index + 1}. ${grade.subject_name}: ${scoreValue}/10\n`;
            });

            // Calculate average for valid scores
            const validGrades = grades.filter(g => g.score && !isNaN(parseFloat(g.score)));
            if (validGrades.length > 0) {
                const avgScore = validGrades.reduce((sum, g) => sum + parseFloat(g.score), 0) / validGrades.length;
                response += `\n📈 **Điểm trung bình**: ${avgScore.toFixed(2)}/10`;
            }

            return response;

        } catch (error) {
            console.error('Error handling grades query:', error);
            return "❌ Lỗi khi truy vấn thông tin điểm số. Vui lòng thử lại sau.";
        }
    }

    /**
     * Xử lý truy vấn bài tập
     */
    async handleAssignmentsQuery(intent, userId) {
        try {
            // Sử dụng params từ OpenRouter AI
            const week = intent.params?.week;
            const className = intent.params?.class || intent.params?.className;

            let whereCondition = 'WHERE a.status = "active"';
            let params = [];

            if (week) {
                whereCondition += ' AND WEEK(a.due_date) = WEEK(CURDATE()) + ?';
                params.push(week - 1); // Adjust for current week
            }

            if (className) {
                const [classes] = await db.execute(
                    'SELECT id FROM classes WHERE name LIKE ? AND status = TRUE',
                    [`%${className}%`]
                );

                if (classes.length === 0) {
                    return `❌ Không tìm thấy lớp "${className}".`;
                }

                whereCondition += ' AND a.class_id = ?';
                params.push(classes[0].id);
            }

            // Query assignments and submissions
            const [assignments] = await db.execute(`
                SELECT 
                    a.title,
                    a.due_date,
                    COUNT(DISTINCT cs.student_id) as total_students,
                    COUNT(DISTINCT asub.student_id) as submitted_count
                FROM assignments a
                LEFT JOIN class_students cs ON a.class_id = cs.class_id
                LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id 
                    AND asub.student_id = cs.student_id 
                    AND asub.status NOT IN ('draft', 'deleted')
                ${whereCondition}
                GROUP BY a.id, a.title, a.due_date
                ORDER BY a.due_date
            `, params);

            if (assignments.length === 0) {
                const weekText = week ? ` tuần ${week}` : '';
                const classText = className ? ` lớp ${className}` : '';
                return `📝 Không có bài tập nào${weekText}${classText}.`;
            }

            let response = `📝 **Thông tin bài tập**:\n\n`;
            assignments.forEach((assignment, index) => {
                const missingCount = assignment.total_students - assignment.submitted_count;
                response += `${index + 1}. **${assignment.title}**\n`;
                response += `   📅 Hạn nộp: ${new Date(assignment.due_date).toLocaleDateString('vi-VN')}\n`;
                response += `   ✅ Đã nộp: ${assignment.submitted_count}/${assignment.total_students}\n`;
                response += `   ❌ Chưa nộp: ${missingCount}\n\n`;
            });

            return response;

        } catch (error) {
            console.error('Error handling assignments query:', error);
            return "❌ Lỗi khi truy vấn thông tin bài tập. Vui lòng thử lại sau.";
        }
    }



    /**
     * Lưu lịch sử chat (tùy chọn)
     */
    async saveChatHistory(userId, message, response, intent) {
        try {
            await db.execute(`
                INSERT INTO chat_history (user_id, message, response, intent, created_at)
                VALUES (?, ?, ?, ?, NOW())
            `, [userId, message, response, intent]);
        } catch (error) {
            console.error('Error saving chat history:', error);
            // Không throw error - chỉ log
        }
    }
}

module.exports = new ChatController();