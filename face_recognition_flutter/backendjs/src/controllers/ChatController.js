const aiService = require('../services/aiService');
const db = require('../config/database');
const ResponseHelper = require('../utils/responseHelper');

// Import existing controller methods for reuse
const ClassController = require('./ClassController');
const AttendanceController = require('./AttendanceController');
const GradebookController = require('./GradebookController');
const ScheduleController = require('./ScheduleController');

class ChatController {
    constructor() {
        this.sendMessage = this.sendMessage.bind(this);

        // Initialize existing controllers
        this.classController = ClassController;
        this.attendanceController = AttendanceController;
        this.scheduleController = ScheduleController;
    }

    /**
     * Main chat endpoint - reuses existing controller methods
     */
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
                    response = await this.handleStudentListQuery(intent, userId, req);
                    break;
                case 'QUERY_ATTENDANCE':
                    response = await this.handleAttendanceQuery(intent, userId, req);
                    break;
                case 'QUERY_GRADES':
                    response = await this.handleGradesQuery(intent, userId, req);
                    break;
                case 'QUERY_ASSIGNMENTS':
                    response = await this.handleAssignmentsQuery(intent, userId);
                    break;
                case 'QUERY_SCHEDULE':
                    response = await this.handleScheduleQuery(intent, userId, req);
                    break;
                case 'QUERY_TEACHING_LOAD':
                    response = await this.handleTeachingLoadQuery(intent, userId);
                    break;
                case 'QUERY_CLASS_SCHEDULE':
                    response = await this.handleClassScheduleQuery(intent, userId);
                    break;
                case 'QUERY_SUBJECT_SCHEDULE':
                    response = await this.handleSubjectScheduleQuery(intent, userId);
                    break;
                case 'QUERY_ROOM_SCHEDULE':
                    response = await this.handleRoomScheduleQuery(intent, userId);
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
     * Handle student list query - reuses ClassController.getClassStudents
     */
    async handleStudentListQuery(intent, userId, req) {
        try {
            const className = intent.params?.class || intent.params?.className;

            if (!className) {
                return "📚 Bạn muốn xem danh sách sinh viên lớp nào? Vui lòng cung cấp tên lớp.";
            }

            // Find class using existing pattern
            const [classes] = await db.execute(
                'SELECT id FROM classes WHERE name LIKE ? AND status = TRUE',
                [`%${className}%`]
            );

            if (classes.length === 0) {
                return `❌ Không tìm thấy lớp "${className}". Vui lòng kiểm tra lại tên lớp.`;
            }

            const classId = classes[0].id;

            // Create mock req object for reusing ClassController method
            const mockReq = {
                ...req,
                params: { id: classId }
            };

            // Create mock res object to capture response
            let mockResponse = null;
            const mockRes = {
                json: (data) => { mockResponse = data; },
                status: () => mockRes
            };

            // Reuse existing ClassController method
            await this.classController.getClassStudents(mockReq, mockRes);

            if (mockResponse && mockResponse.students) {
                let response = `📚 Lớp ${className} có ${mockResponse.students.length} sinh viên:\n\n`;
                mockResponse.students.forEach((student, index) => {
                    response += `${index + 1}. ${student.full_name} (${student.student_code || student.id})\n`;
                });
                return response;
            }

            return `📚 Lớp "${className}" chưa có sinh viên nào.`;

        } catch (error) {
            console.error('Error handling student list query:', error);
            return "❌ Lỗi khi truy vấn danh sách sinh viên. Vui lòng thử lại sau.";
        }
    }

    /**
     * Handle attendance query - reuses AttendanceController logic
     */
    async handleAttendanceQuery(intent, userId, req) {
        try {
            const className = intent.params?.class || intent.params?.className;
            const date = intent.params?.date;

            let dateCondition;
            let dateText = 'hôm nay';

            if (date === 'yesterday') {
                dateCondition = 'DATE(a.attendance_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
                dateText = 'hôm qua';
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

                // Reuse attendance query pattern from AttendanceController
                const [attendance] = await db.execute(`
                    SELECT 
                        COUNT(DISTINCT a.student_id) AS present_count,
                        (
                            SELECT COUNT(*) 
                            FROM class_students cs2
                            WHERE cs2.class_id = ?
                        ) AS total_students
                    FROM attendances a
                    JOIN attendance_sessions ats ON a.session_id = ats.id
                    JOIN course_sections cs ON ats.course_section_id = cs.id
                    WHERE cs.class_id = ? AND ${dateCondition}
                `, [classId, classId]);

                const present = attendance[0]?.present_count || 0;
                const total = attendance[0]?.total_students || 0;
                const absent = total - present;

                return (
                    `📊 Điểm danh lớp ${className} (${dateText})**\n\n` +
                    `✅ Có mặt: ${present} sinh viên\n` +
                    `❌ Vắng mặt: ${absent} sinh viên\n` +
                    `📚 Tổng số: ${total} sinh viên`
                );
            } else {
                // General attendance summary
                const [summary] = await db.execute(`
                    SELECT COUNT(DISTINCT a.student_id) AS total_present
                    FROM attendances a
                    WHERE ${dateCondition}
                `);

                return (
                    `📊 Tổng quan điểm danh (${dateText})**\n\n` +
                    `✅ Tổng số sinh viên đã điểm danh: ${summary[0]?.total_present || 0}`
                );
            }

        } catch (error) {
            console.error('Error handling attendance query:', error);
            return '❌ Lỗi khi truy vấn điểm danh. Vui lòng thử lại sau.';
        }
    }

    /**
     * Handle grades query - reuses GradebookController patterns
     */
    async handleGradesQuery(intent, userId, req) {
        try {
            const studentName = intent.params?.studentName;

            if (!studentName) {
                return "📊 Bạn muốn xem điểm của sinh viên nào? Vui lòng cung cấp tên sinh viên.";
            }

            // Find student
            const [students] = await db.execute(
                'SELECT id, full_name FROM users WHERE full_name LIKE ? AND role = ? AND is_active = TRUE',
                [`%${studentName}%`, 'student']
            );

            if (students.length === 0) {
                return `❌ Không tìm thấy sinh viên "${studentName}".`;
            }

            const student = students[0];

            // Reuse gradebook query pattern from GradebookController
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
                return `📊 Sinh viên ${student.full_name} chưa có điểm cuối kỳ nào được ghi nhận.`;
            }

            let response = `📊 Điểm số của ${student.full_name}: \n\n`;
            grades.forEach((grade, index) => {
                const scoreValue = grade.score ? parseFloat(grade.score).toFixed(2) : 'N/A';
                response += `${index + 1}. ${grade.subject_name}: ${scoreValue}/10\n`;
            });

            // Calculate average
            const validGrades = grades.filter(g => g.score && !isNaN(parseFloat(g.score)));
            if (validGrades.length > 0) {
                const avgScore = validGrades.reduce((sum, g) => sum + parseFloat(g.score), 0) / validGrades.length;
                response += `\n📈 Điểm trung bình:  ${avgScore.toFixed(2)}/10`;
            }

            return response;

        } catch (error) {
            console.error('Error handling grades query:', error);
            return "❌ Lỗi khi truy vấn thông tin điểm số. Vui lòng thử lại sau.";
        }
    }

    /**
     * Handle schedule query - reuses ScheduleController patterns
     */
    async handleScheduleQuery(intent, userId, req) {
        try {
            const date = intent.params?.date;
            const subject = intent.params?.subject;

            // Build date condition using same logic as original
            let dateCondition = '';
            let dateText = '';

            if (date === 'today') {
                dateCondition = `a.session_date = CURDATE()`;
                dateText = 'hôm nay';
            }
            else if (date === 'tomorrow') {
                dateCondition = `a.session_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)`;
                dateText = 'ngày mai';
            }
            else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(date?.toLowerCase())) {
                // JS getDay(): CN=0, Thứ 2=1, ..., Thứ 7=6
                const dayNumberMap = {
                    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
                    thursday: 4, friday: 5, saturday: 6
                };
                const dayNumber = dayNumberMap[date.toLowerCase()];

                const today = new Date();
                const currentDay = today.getDay(); // 0-6
                let diff = dayNumber - currentDay;
                if (diff < 0) diff += 7; // lấy ngày trong tuần hiện tại hoặc tuần sau nếu đã qua
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + diff);

                const yyyy = targetDate.getFullYear();
                const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
                const dd = String(targetDate.getDate()).padStart(2, '0');
                const formattedDate = `${yyyy}-${mm}-${dd}`;

                dateCondition = `a.session_date = '${formattedDate}'`;
                dateText = `thứ ${date}`; // ví dụ: "thứ thursday"
            }


            else {
                // Mặc định là hôm nay
                dateCondition = `a.session_date = CURDATE()`;
                dateText = 'hôm nay';
            }


            // Reuse schedule query pattern from ScheduleController
            let query = `
                SELECT 
                    a.start_time,
                    a.end_time,
                    s.room,
                    cs.name AS course_name,
                    c.name AS class_name,
                    sub.name AS subject_name
                FROM attendance_sessions a
                JOIN schedules s ON a.schedule_id = s.id
                JOIN course_sections cs ON s.course_section_id = cs.id
                JOIN classes c ON cs.class_id = c.id
                LEFT JOIN subjects sub ON cs.subject_id = sub.id
                WHERE cs.teacher_id = ? 
                AND s.is_active = 1 
                AND ${dateCondition}
                `;



            let params = [userId];

            if (subject) {
                query += ' AND (sub.name LIKE ? OR cs.name LIKE ?)';
                params.push(`%${subject}%`, `%${subject}%`);
            }

            query += ' ORDER BY s.start_time';
            console.log('Schedule query:', query, params);
            const [schedules] = await db.execute(query, params);
            if (schedules.length === 0) {
                if (subject) {
                    return `📅 Bạn không có lịch dạy môn "${subject}" ${dateText}.`;
                }
                return `📅 Bạn không có lịch dạy ${dateText}.`;
            }

            let response = `📅 Lịch dạy ${dateText}:\n\n`;
            schedules.forEach((schedule, index) => {
                const startTime = schedule.start_time;
                const endTime = schedule.end_time;


                response += `${index + 1}. ${schedule.course_name || schedule.subject_name}\n`;
                response += `   🏫 Lớp: ${schedule.class_name}\n`;
                response += `   🕐 Thời gian: ${startTime} - ${endTime}\n`;
                response += `   📍 Phòng: ${schedule.room || 'Chưa xác định'}\n\n`;
            });

            return response;

        } catch (error) {
            console.error('Error handling schedule query:', error);
            return "❌ Lỗi khi truy vấn lịch dạy. Vui lòng thử lại sau.";
        }

    }


    /**
     * Handle assignments query - reuses database patterns from existing controllers
     */
    async handleAssignmentsQuery(intent, userId) {
        try {
            const week = intent.params?.week;
            const className = intent.params?.class || intent.params?.className;

            let whereCondition = 'WHERE a.status = "active"';
            let params = [];

            if (week) {
                whereCondition += ' AND WEEK(a.due_date) = WEEK(CURDATE()) + ?';
                params.push(week - 1);
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

            // Reuse assignment query pattern
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

            let response = `📝 Thông tin bài tập: \n\n`;
            assignments.forEach((assignment, index) => {
                const missingCount = assignment.total_students - assignment.submitted_count;
                response += `${index + 1}. ${assignment.title}**\n`;
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
     * Copy remaining methods from original - these maintain existing functionality
     */
    async handleTeachingLoadQuery(intent, userId) {
        // Copy from original ChatController - keeping original implementation for now
        try {
            const week = intent.params?.week;
            const month = intent.params?.month;

            let dateCondition = '';
            let periodText = '';

            if (week === 'this week') {
                dateCondition = `
                    s.start_time >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
                    AND s.start_time < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
                `;
                periodText = 'tuần này';
            } else if (week === 'next week') {
                dateCondition = `
                    s.start_time >= DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
                    AND s.start_time < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 14 DAY)
                `;
                periodText = 'tuần tới';
            } else if (month === 'this month') {
                dateCondition = `
                    YEAR(s.start_time) = YEAR(CURDATE())
                    AND MONTH(s.start_time) = MONTH(CURDATE())
                `;
                periodText = 'tháng này';
            } else {
                dateCondition = `
                    s.start_time >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
                    AND s.start_time < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
                `;
                periodText = 'tuần này';
            }

            const [stats] = await db.execute(`
                SELECT 
                    COUNT(s.id) as total_sessions,
                    COUNT(DISTINCT cs.id) as total_courses,
                    COUNT(DISTINCT c.id) as total_classes,
                    SUM(TIMESTAMPDIFF(HOUR, s.start_time, s.end_time)) as total_hours
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                JOIN classes c ON cs.class_id = c.id
                WHERE cs.teacher_id = ? AND ${dateCondition}
            `, [userId]);

            const [subjects] = await db.execute(`
                SELECT 
                    COALESCE(sub.name, cs.name) as subject_name,
                    COUNT(s.id) as session_count,
                    SUM(TIMESTAMPDIFF(HOUR, s.start_time, s.end_time)) as subject_hours,
                    COUNT(DISTINCT c.id) as class_count,
                    GROUP_CONCAT(DISTINCT CONCAT('Thứ ', 
                        CASE s.weekday 
                            WHEN 1 THEN 'CN'
                            WHEN 2 THEN '2'
                            WHEN 3 THEN '3'
                            WHEN 4 THEN '4'
                            WHEN 5 THEN '5'
                            WHEN 6 THEN '6'
                            WHEN 7 THEN '7'
                        END, ' - ', s.room) SEPARATOR '; ') as schedule_info
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                JOIN classes c ON cs.class_id = c.id
                LEFT JOIN subjects sub ON cs.subject_id = sub.id
                WHERE cs.teacher_id = ? AND ${dateCondition}
                GROUP BY sub.id, cs.name
                ORDER BY subject_hours DESC
            `, [userId]);


            if (stats[0].total_sessions === 0) {
                return `📊 Bạn không có lịch dạy nào ${periodText}.`;
            }

            let response = `📊 Tải công việc ${periodText}: \n\n`;
            response += `📚 Tổng quan: \n`;
            response += `   • Số buổi dạy: ${stats[0].total_sessions || 0} buổi\n`;
            response += `   • Số môn học: ${stats[0].total_courses || 0} môn\n`;
            response += `   • Số lớp: ${stats[0].total_classes || 0} lớp\n`;
            response += `   • Tổng giờ dạy: ${stats[0].total_hours || 0} giờ\n\n`;

            if (subjects.length > 0) {
                response += `📋 Chi tiết theo môn: \n`;
                subjects.forEach((subject, index) => {
                    response += `${index + 1}. ${subject.subject_name}\n`;
                    response += `   • ${subject.session_count} buổi - ${subject.subject_hours} giờ\n`;
                    response += `   • ${subject.class_count} lớp\n`;
                    response += `   • Lịch dạy: ${subject.schedule_info}\n\n`; // mới thêm
                });

            }

            return response;

        } catch (error) {
            console.error('Error handling teaching load query:', error);
            return "❌ Lỗi khi truy vấn tải công việc. Vui lòng thử lại sau.";
        }
    }

    async handleClassScheduleQuery(intent, userId) {
        // Copy from original - keep existing functionality
        try {
            const className = intent.params?.class;
            const date = intent.params?.date;

            if (!className) {
                return "📅 Bạn muốn xem lịch dạy lớp nào? Vui lòng cung cấp tên lớp.";
            }

            const [classes] = await db.execute(
                'SELECT id FROM classes WHERE name LIKE ? AND status = TRUE',
                [`%${className}%`]
            );

            if (classes.length === 0) {
                return `❌ Không tìm thấy lớp "${className}".`;
            }

            let dateCondition = 'DATE(s.start_time) = CURDATE()';
            let dateText = 'hôm nay';

            if (date === 'tomorrow') {
                dateCondition = 'DATE(s.start_time) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)';
                dateText = 'ngày mai';
            }

            const [schedules] = await db.execute(`
                SELECT 
                    s.start_time,
                    s.end_time,
                    s.room,
                    cs.name as course_name,
                    u.full_name as teacher_name,
                    sub.name as subject_name
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                JOIN users u ON cs.teacher_id = u.id
                LEFT JOIN subjects sub ON cs.subject_id = sub.id
                WHERE cs.class_id = ? AND ${dateCondition}
                ORDER BY s.start_time
            `, [classes[0].id]);

            if (schedules.length === 0) {
                return `📅 Lớp ${className} không có lịch dạy ${dateText}.`;
            }

            let response = `📅 Lịch dạy lớp ${className} ${dateText}: \n\n`;
            schedules.forEach((schedule, index) => {
                const startTime = schedule.start_time;
                const endTime = schedule.end_time;

                response += `${index + 1}. ${schedule.course_name || schedule.subject_name}**\n`;
                response += `   👨‍🏫 Giáo viên: ${schedule.teacher_name}\n`;
                response += `   🕐 Thời gian: ${startTime} - ${endTime}\n`;
                response += `   📍 Phòng: ${schedule.room || 'Chưa xác định'}\n\n`;
            });

            return response;

        } catch (error) {
            console.error('Error handling class schedule query:', error);
            return "❌ Lỗi khi truy vấn lịch dạy lớp. Vui lòng thử lại sau.";
        }
    }

    async handleSubjectScheduleQuery(intent, userId) {
        // Copy from original - keep existing functionality  
        try {
            const subject = intent.params?.subject;
            const date = intent.params?.date;

            if (!subject) {
                return "📚 Bạn muốn xem lịch dạy môn nào? Vui lòng cung cấp tên môn học.";
            }

            let dateCondition = 'DATE(s.start_time) = CURDATE()';
            let dateText = 'hôm nay';

            if (date === 'this week') {
                dateCondition = `
                    s.start_time >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
                    AND s.start_time < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
                `;
                dateText = 'tuần này';
            } else if (date === 'tomorrow') {
                dateCondition = 'DATE(s.start_time) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)';
                dateText = 'ngày mai';
            }

            const [schedules] = await db.execute(`
                SELECT 
                    s.start_time,
                    s.end_time,
                    s.room,
                    cs.name as course_name,
                    c.name as class_name,
                    u.full_name as teacher_name,
                    sub.name as subject_name
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                JOIN classes c ON cs.class_id = c.id
                JOIN users u ON cs.teacher_id = u.id
                LEFT JOIN subjects sub ON cs.subject_id = sub.id
                WHERE (sub.name LIKE ? OR cs.name LIKE ?) AND ${dateCondition}
                ORDER BY s.start_time, c.name
            `, [`%${subject}%`, `%${subject}%`]);

            if (schedules.length === 0) {
                return `📚 Không có lịch dạy môn "${subject}" ${dateText}.`;
            }

            let response = `📚 Lịch dạy môn ${subject} ${dateText}: \n\n`;
            schedules.forEach((schedule, index) => {
                const startTime = schedule.start_time;
                const endTime = schedule.end_time;

                response += `${index + 1}. ${schedule.class_name}**\n`;
                response += `   👨‍🏫 Giáo viên: ${schedule.teacher_name}\n`;
                response += `   🕐 Thời gian: ${startTime} - ${endTime}\n`;
                response += `   📍 Phòng: ${schedule.room || 'Chưa xác định'}\n\n`;
            });

            return response;

        } catch (error) {
            console.error('Error handling subject schedule query:', error);
            return "❌ Lỗi khi truy vấn lịch dạy môn học. Vui lòng thử lại sau.";
        }
    }

    async handleRoomScheduleQuery(intent, userId) {
        // Copy from original - keep existing functionality
        try {
            const room = intent.params?.room;
            const date = intent.params?.date;

            if (!room) {
                return "🏫 Bạn muốn xem lịch phòng nào? Vui lòng cung cấp tên/số phòng.";
            }

            let dateCondition = 'DATE(s.start_time) = CURDATE()';
            let dateText = 'hôm nay';

            if (date === 'tomorrow') {
                dateCondition = 'DATE(s.start_time) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)';
                dateText = 'ngày mai';
            }

            const [schedules] = await db.execute(`
                SELECT 
                    s.start_time,
                    s.end_time,
                    cs.name as course_name,
                    c.name as class_name,
                    u.full_name as teacher_name,
                    sub.name as subject_name
                FROM schedules s
                JOIN course_sections cs ON s.course_section_id = cs.id
                JOIN classes c ON cs.class_id = c.id
                JOIN users u ON cs.teacher_id = u.id
                LEFT JOIN subjects sub ON cs.subject_id = sub.id
                WHERE s.room LIKE ? AND ${dateCondition}
                ORDER BY s.start_time
            `, [`%${room}%`]);

            if (schedules.length === 0) {
                return `🏫 Phòng ${room} không có lịch sử dụng ${dateText}.`;
            }

            let response = `🏫 Lịch sử dụng phòng ${room} ${dateText}: \n\n`;
            schedules.forEach((schedule, index) => {
                const startTime = schedule.start_time;
                const endTime = schedule.end_time;

                response += `${index + 1}. ${schedule.course_name || schedule.subject_name}**\n`;
                response += `   🏫 Lớp: ${schedule.class_name}\n`;
                response += `   👨‍🏫 Giáo viên: ${schedule.teacher_name}\n`;
                response += `   🕐 Thời gian: ${startTime} - ${endTime}\n\n`;
            });

            return response;

        } catch (error) {
            console.error('Error handling room schedule query:', error);
            return "❌ Lỗi khi truy vấn lịch phòng học. Vui lòng thử lại sau.";
        }
    }

    /**
     * General question handler
     */
    handleGeneralQuestion(message) {
        const responses = [
            "🤖 Tôi có thể giúp bạn:\n\n" +
            "📚 Quản lý lớp học: \n" +
            "• Danh sách sinh viên: 'Danh sách sinh viên lớp [tên lớp]'\n" +
            "• Điểm danh: 'Điểm danh lớp [tên lớp] hôm nay'\n" +
            "• Điểm số: 'Điểm của [tên sinh viên]'\n" +
            "• Bài tập: 'Ai chưa nộp bài tập tuần [số]'\n\n" +
            "📅 Lịch dạy & Thời khóa biểu: \n" +
            "• Lịch cá nhân: 'Lịch dạy hôm nay'\n" +
            "• Theo môn: 'Môn Java có lịch dạy nào tuần này'\n" +
            "• Theo lớp: 'Lịch dạy lớp CNTT K20 ngày mai'\n" +
            "• Tải công việc: 'Tải công việc tuần này'\n" +
            "• Phòng học: 'Phòng 301 có lịch gì hôm nay'\n\n" +
            "Hãy thử một trong những câu hỏi trên!",

            "💡 Tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi về:\n\n" +
            "🎓 Quản lý học tập: \n" +
            "- Danh sách sinh viên và thông tin lớp\n" +
            "- Tình hình điểm danh và vắng mặt\n" +
            "- Điểm số và kết quả học tập\n" +
            "- Bài tập và deadline\n\n" +
            "📆 Lịch dạy & Thời gian: \n" +
            "- Lịch dạy hôm nay/ngày mai\n" +
            "- Lịch dạy theo môn học\n" +
            "- Tải công việc tuần/tháng\n" +
            "- Lịch sử dụng phòng học\n\n" +
            "Vui lòng thử lại với câu hỏi cụ thể hơn!"
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }
}

module.exports = new ChatController();