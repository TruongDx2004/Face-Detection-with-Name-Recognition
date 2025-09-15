const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const dayjs = require('dayjs');

// Cấu hình multer cho upload file assignments
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = 'uploads/assignments/';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow common file types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/zip',
            'application/x-rar-compressed'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
        }
    }
});

class AssignmentController {

    // Tạo bài tập mới (Teacher only)
    async createAssignment(req, res) {
        try {
            const {
                course_section_id,
                title,
                description,
                assignment_type = 'homework',
                max_score = 10.00,
                due_date,
                instructions
            } = req.body;

            const teacher_id = req.user.id;

            // Validation
            if (!course_section_id || !title || !due_date) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    required: ['course_section_id', 'title', 'due_date']
                });
            }

            // Kiểm tra teacher có quyền tạo assignment cho course section này không
            const [courseSections] = await db.execute(
                `SELECT teacher_id, name FROM course_sections WHERE id = ? AND is_active = TRUE`,
                [course_section_id]
            );

            if (courseSections.length === 0) {
                return res.status(404).json({ error: 'Course section not found' });
            }

            if (courseSections[0].teacher_id !== teacher_id) {
                return res.status(403).json({
                    error: 'You are not authorized to create assignments for this course section'
                });
            }

            // Format due_date cho MySQL DATETIME
            const formattedDueDate = dayjs(due_date).format("YYYY-MM-DD HH:mm:ss");

            // Tạo assignment
            const [result] = await db.execute(
                `INSERT INTO assignments 
                (course_section_id, title, description, assignment_type, max_score, due_date, instructions, attachment_path) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    course_section_id,
                    title,
                    description,
                    assignment_type,
                    max_score,
                    formattedDueDate,
                    instructions,
                    req.file ? req.file.path : null
                ]
            );

            // Lấy assignment vừa tạo với thông tin đầy đủ
            const [assignments] = await db.execute(
                `SELECT a.*, cs.name as course_name, s.name as subject_name 
                FROM assignments a
                JOIN course_sections cs ON a.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                WHERE a.id = ?`,
                [result.insertId]
            );

            res.status(201).json({
                message: 'Assignment created successfully',
                data: assignments[0]
            });

        } catch (error) {
            console.error('Create assignment error:', error);
            res.status(500).json({
                error: 'Failed to create assignment',
                message: error.message
            });
        }
    }

    // Lấy chi tiết bài tập
    async getAssignmentById(req, res) {
        try {
            const { id } = req.params;

            const [assignments] = await db.execute(
                `SELECT a.*, cs.name as course_name, s.name as subject_name
                FROM assignments a
                JOIN course_sections cs ON a.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                WHERE a.id = ?`,
                [id]
            );

            if (assignments.length === 0) {
                return res.status(404).json({ error: 'Assignment not found' });
            }

            res.json({
                message: 'Assignment retrieved successfully',
                data: assignments[0]
            });

        } catch (error) {
            console.error('Get assignment error:', error);
            res.status(500).json({
                error: 'Failed to get assignment',
                message: error.message
            });
        }
    }

    // Cập nhật bài tập (Teacher only)
    async updateAssignment(req, res) {
        try {
            const { id } = req.params;
            const teacher_id = req.user.id;

            // Kiểm tra assignment tồn tại và teacher có quyền
            const [assignments] = await db.execute(
                `SELECT a.*, cs.teacher_id 
                FROM assignments a
                JOIN course_sections cs ON a.course_section_id = cs.id
                WHERE a.id = ?`,
                [id]
            );

            if (assignments.length === 0) {
                return res.status(404).json({ error: 'Assignment not found' });
            }

            if (assignments[0].teacher_id !== teacher_id) {
                return res.status(403).json({
                    error: 'You are not authorized to update this assignment'
                });
            }

            const assignment = assignments[0];
            const updateData = { ...req.body };

            // Xử lý file mới
            if (req.file) {
                updateData.attachment_path = req.file.path;

                // Xóa file cũ nếu có
                if (assignment.attachment_path) {
                    try {
                        await fs.unlink(assignment.attachment_path);
                    } catch (error) {
                        console.warn('Failed to delete old attachment:', error.message);
                    }
                }
            }

            // Tạo câu UPDATE động
            const fields = [];
            const values = [];

            for (const [key, value] of Object.entries(updateData)) {
                if (value !== undefined) {
                    if (key === "due_date") {
                        fields.push("due_date = ?");
                        values.push(dayjs(value).format("YYYY-MM-DD HH:mm:ss"));
                    } else if (key === "is_active") {
                        fields.push("is_active = ?");
                        values.push(value == "true" ? 1 : 0);
                    } else {
                        fields.push(`${key} = ?`);
                        values.push(value);
                    }
                }
            }

            if (fields.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            values.push(id);

            await db.execute(
                `UPDATE assignments SET ${fields.join(", ")} WHERE id = ?`,
                values
            );

            // Lấy assignment đã cập nhật
            const [updatedAssignments] = await db.execute(
                `SELECT a.*, cs.name as course_name, s.name as subject_name
                FROM assignments a
                JOIN course_sections cs ON a.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                WHERE a.id = ?`,
                [id]
            );

            res.json({
                message: 'Assignment updated successfully',
                data: updatedAssignments[0]
            });

        } catch (error) {
            console.error('Update assignment error:', error);
            res.status(500).json({
                error: 'Failed to update assignment',
                message: error.message
            });
        }
    }

    // Xóa bài tập (soft delete - Teacher only)
    async deleteAssignment(req, res) {
        try {
            const { id } = req.params;
            const teacher_id = req.user.id;

            // Kiểm tra assignment tồn tại và teacher có quyền
            const [assignments] = await db.execute(
                `SELECT a.*, cs.teacher_id 
                FROM assignments a
                JOIN course_sections cs ON a.course_section_id = cs.id
                WHERE a.id = ?`,
                [id]
            );

            if (assignments.length === 0) {
                return res.status(404).json({ error: 'Assignment not found' });
            }

            if (assignments[0].teacher_id !== teacher_id) {
                return res.status(403).json({
                    error: 'You are not authorized to delete this assignment'
                });
            }

            // Soft delete
            await db.execute(
                'UPDATE assignments SET is_active = FALSE WHERE id = ?',
                [id]
            );

            res.json({ message: 'Assignment deleted successfully' });

        } catch (error) {
            console.error('Delete assignment error:', error);
            res.status(500).json({
                error: 'Failed to delete assignment',
                message: error.message
            });
        }
    }

    // Lấy bài tập của sinh viên theo course section
    async getStudentAssignments(req, res) {
        try {
            const { courseSectionId } = req.params;
            const student_id = req.user.id;

            // Kiểm tra student có trong course section này không
            const [enrollments] = await db.execute(
                `SELECT cs.id FROM course_sections cs
                JOIN class_students cls ON cs.class_id = cls.class_id
                WHERE cs.id = ? AND cls.student_id = ? AND cs.is_active = TRUE`,
                [courseSectionId, student_id]
            );

            if (enrollments.length === 0) {
                return res.status(403).json({
                    error: 'You are not enrolled in this course section'
                });
            }

            // Lấy assignments với submission status
            const [assignments] = await db.execute(
                `SELECT a.*, 
                        cs.name as course_name,
                        s.name as subject_name,
                        asub.id as submission_id,
                        asub.submitted_at,
                        asub.score,
                        asub.status as submission_status,
                        asub.feedback,
                        asub.submission_text,
                        asub.attachment_path as submission_attachment_path
                FROM assignments a
                JOIN course_sections cs ON a.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = ?
                WHERE a.course_section_id = ?
                ORDER BY a.due_date ASC`,
                [student_id, courseSectionId]
            );

            // Transform data để include submission info
            const result = assignments.map(row => ({
                id: row.id,
                course_section_id: row.course_section_id,
                title: row.title,
                description: row.description,
                assignment_type: row.assignment_type,
                max_score: row.max_score,
                due_date: row.due_date,
                created_date: row.created_date,
                is_active: row.is_active,
                instructions: row.instructions,
                attachment_path: row.attachment_path,
                course_name: row.course_name,
                subject_name: row.subject_name,
                submission: row.submission_id ? {
                    id: row.submission_id,
                    submitted_at: row.submitted_at,
                    score: row.score,
                    status: row.submission_status,
                    feedback: row.feedback,
                    submission_text: row.submission_text,
                    attachment_path: row.submission_attachment_path
                } : null
            }));

            res.json({
                message: 'Assignments retrieved successfully',
                data: result
            });

        } catch (error) {
            console.error('Get student assignments error:', error);
            res.status(500).json({
                error: 'Failed to get assignments',
                message: error.message
            });
        }
    }

    // Nộp bài tập (Student only)
    async submitAssignment(req, res) {
        try {
            const { assignment_id, student_id, submission_text } = req.body;
            const current_user_id = req.user.id;

            // Validation
            if (!assignment_id || !student_id) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    required: ['assignment_id', 'student_id']
                });
            }

            // Kiểm tra student chỉ có thể nộp bài của mình
            if (parseInt(student_id) !== current_user_id) {
                return res.status(403).json({
                    error: 'You can only submit your own assignments'
                });
            }

            // Kiểm tra assignment tồn tại và chưa quá hạn
            const [assignments] = await db.execute(
                `SELECT * FROM assignments WHERE id = ? AND is_active = TRUE`,
                [assignment_id]
            );

            if (assignments.length === 0) {
                return res.status(404).json({ error: 'Assignment not found' });
            }

            const assignment = assignments[0];
            const now = new Date();
            const dueDate = new Date(assignment.due_date);

            if (now > dueDate) {
                return res.status(400).json({
                    error: 'Assignment is overdue',
                    due_date: assignment.due_date
                });
            }

            // Kiểm tra student có trong course section này không
            const [enrollments] = await db.execute(
                `SELECT cs.id FROM course_sections cs
                JOIN class_students cls ON cs.class_id = cls.class_id
                WHERE cs.id = ? AND cls.student_id = ? AND cs.is_active = TRUE`,
                [assignment.course_section_id, student_id]
            );

            if (enrollments.length === 0) {
                return res.status(403).json({
                    error: 'You are not enrolled in this course section'
                });
            }

            // Kiểm tra đã nộp bài chưa
            const [existingSubmissions] = await db.execute(
                'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
                [assignment_id, student_id]
            );

            let submissionId;

            if (existingSubmissions.length > 0) {
                // Cập nhật submission hiện tại
                submissionId = existingSubmissions[0].id;
                await db.execute(
                    `UPDATE assignment_submissions 
                    SET submission_text = ?, attachment_path = ?, submitted_at = CURRENT_TIMESTAMP, status = 'submitted'
                    WHERE assignment_id = ? AND student_id = ?`,
                    [submission_text, req.file ? req.file.path : null, assignment_id, student_id]
                );
            } else {
                // Tạo submission mới
                const [result] = await db.execute(
                    `INSERT INTO assignment_submissions 
                    (assignment_id, student_id, submission_text, attachment_path, status) 
                    VALUES (?, ?, ?, ?, 'submitted')`,
                    [assignment_id, student_id, submission_text, req.file ? req.file.path : null]
                );
                submissionId = result.insertId;
            }

            // Lấy submission vừa tạo/cập nhật
            const [submissions] = await db.execute(
                `SELECT asub.*, 
                        a.title as assignment_title,
                        a.max_score,
                        u.full_name as student_name,
                        u.username as student_username
                FROM assignment_submissions asub
                JOIN assignments a ON asub.assignment_id = a.id
                JOIN users u ON asub.student_id = u.id
                WHERE asub.id = ?`,
                [submissionId]
            );

            res.status(201).json({
                message: 'Assignment submitted successfully',
                data: submissions[0]
            });

        } catch (error) {
            console.error('Submit assignment error:', error);
            res.status(500).json({
                error: 'Failed to submit assignment',
                message: error.message
            });
        }
    }

    // Lấy submission cụ thể
    async getSubmission(req, res) {
        try {
            const { assignmentId, studentId } = req.params;
            const current_user_id = req.user.id;
            const user_role = req.user.role;

            // Students chỉ có thể xem submission của mình
            if (user_role === 'student' && parseInt(studentId) !== current_user_id) {
                return res.status(403).json({
                    error: 'You can only view your own submissions'
                });
            }

            const [submissions] = await db.execute(
                `SELECT asub.*, 
                        a.title as assignment_title,
                        a.max_score,
                        a.due_date
                FROM assignment_submissions asub
                JOIN assignments a ON asub.assignment_id = a.id
                WHERE asub.assignment_id = ? AND asub.student_id = ?`,
                [assignmentId, studentId]
            );

            if (submissions.length === 0) {
                return res.status(404).json({ error: 'Submission not found' });
            }

            res.json({
                message: 'Submission retrieved successfully',
                data: submissions[0]
            });

        } catch (error) {
            console.error('Get submission error:', error);
            res.status(500).json({
                error: 'Failed to get submission',
                message: error.message
            });
        }
    }

    // Chấm điểm bài tập (Teacher only)
    async gradeSubmission(req, res) {
        try {
            const { submissionId } = req.params;
            const { score, feedback } = req.body;
            const graded_by = req.user.id;

            if (score === undefined || score < 0) {
                return res.status(400).json({ error: 'Valid score is required' });
            }

            // Kiểm tra submission tồn tại và teacher có quyền chấm
            const [submissions] = await db.execute(
                `SELECT asub.*, a.course_section_id, cs.teacher_id
                FROM assignment_submissions asub
                JOIN assignments a ON asub.assignment_id = a.id
                JOIN course_sections cs ON a.course_section_id = cs.id
                WHERE asub.id = ?`,
                [submissionId]
            );

            if (submissions.length === 0) {
                return res.status(404).json({ error: 'Submission not found' });
            }

            if (submissions[0].teacher_id !== graded_by) {
                return res.status(403).json({
                    error: 'You are not authorized to grade this submission'
                });
            }

            // Cập nhật điểm
            await db.execute(
                `UPDATE assignment_submissions 
                SET score = ?, feedback = ?, graded_at = CURRENT_TIMESTAMP, graded_by = ?, status = 'graded'
                WHERE id = ?`,
                [score, feedback, graded_by, submissionId]
            );

            // Lấy submission đã chấm điểm
            const [gradedSubmissions] = await db.execute(
                `SELECT asub.*, 
                        a.title as assignment_title,
                        a.max_score,
                        u.full_name as student_name,
                        u.username as student_username
                FROM assignment_submissions asub
                JOIN assignments a ON asub.assignment_id = a.id
                JOIN users u ON asub.student_id = u.id
                WHERE asub.id = ?`,
                [submissionId]
            );

            // Tự động tính lại điểm cho sinh viên
            await AssignmentController.autoCalculateGradesAfterGrading(submissionId);
            console.log('Auto calculate grades after assignment grading completed for submission:', submissionId);
            res.json({
                message: 'Assignment graded successfully',
                data: gradedSubmissions[0]
            });

        } catch (error) {
            console.error('Grade submission error:', error);
            res.status(500).json({
                error: 'Failed to grade submission',
                message: error.message
            });
        }
    }

    // Tự động tính lại điểm sau khi chấm bài
    static async autoCalculateGradesAfterGrading(submissionId) {
        try {
            // Lấy thông tin submission và course section
            const [submissions] = await db.execute(`
                SELECT asub.student_id, a.course_section_id
                FROM assignment_submissions asub
                JOIN assignments a ON asub.assignment_id = a.id
                WHERE asub.id = ?
            `, [submissionId]);

            if (submissions.length > 0) {
                const { student_id, course_section_id } = submissions[0];

                // Import và gọi hàm tính điểm
                const GradeConfigurationController = require('./GradeConfigurationController');
                await GradeConfigurationController.calculateStudentGrade(course_section_id, student_id);
                console.log('Auto calculate grades after assignment grading for student:', student_id, 'in course section:', course_section_id);
            }
        } catch (error) {
            console.error('Auto calculate grades error:', error);
            // Không throw error để không ảnh hưởng đến flow chính
        }
    }

    // Lấy tất cả submissions của một assignment (Teacher only)
    async getAssignmentSubmissions(req, res) {
        try {
            const { assignmentId } = req.params;
            const teacher_id = req.user.id;

            // Kiểm tra teacher có quyền xem submissions của assignment này
            const [assignments] = await db.execute(
                `SELECT cs.teacher_id FROM assignments a
                JOIN course_sections cs ON a.course_section_id = cs.id
                WHERE a.id = ?`,
                [assignmentId]
            );

            if (assignments.length === 0) {
                return res.status(404).json({ error: 'Assignment not found' });
            }

            if (assignments[0].teacher_id !== teacher_id) {
                return res.status(403).json({
                    error: 'You are not authorized to view submissions for this assignment'
                });
            }

            const [submissions] = await db.execute(
                `SELECT asub.*, 
                        u.full_name as student_name,
                        u.email as student_email,
                        cs.student_code
                FROM assignment_submissions asub
                JOIN users u ON asub.student_id = u.id
                LEFT JOIN class_students cs ON u.id = cs.student_id
                WHERE asub.assignment_id = ?
                ORDER BY asub.submitted_at DESC`,
                [assignmentId]
            );

            res.json({
                message: 'Submissions retrieved successfully',
                data: submissions
            });

        } catch (error) {
            console.error('Get assignment submissions error:', error);
            res.status(500).json({
                error: 'Failed to get submissions',
                message: error.message
            });
        }
    }

    // Lấy submissions của student
    async getStudentSubmissions(req, res) {
        try {
            const { studentId } = req.params;
            const current_user_id = req.user.id;
            const user_role = req.user.role;

            // Students chỉ có thể xem submissions của mình
            if (user_role === 'student' && parseInt(studentId) !== current_user_id) {
                return res.status(403).json({
                    error: 'You can only view your own submissions'
                });
            }

            const [submissions] = await db.execute(
                `SELECT asub.*, 
                        a.title as assignment_title,
                        a.max_score,
                        a.due_date,
                        a.assignment_type,
                        cs.name as course_name,
                        s.name as subject_name
                FROM assignment_submissions asub
                JOIN assignments a ON asub.assignment_id = a.id
                JOIN course_sections cs ON a.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                WHERE asub.student_id = ?
                ORDER BY a.due_date DESC`,
                [studentId]
            );

            res.json({
                message: 'Student submissions retrieved successfully',
                data: submissions
            });

        } catch (error) {
            console.error('Get student submissions error:', error);
            res.status(500).json({
                error: 'Failed to get student submissions',
                message: error.message
            });
        }
    }

    // Lấy assignments của teacher
    async getTeacherAssignments(req, res) {
        try {
            const { teacherId } = req.params;
            const current_user_id = req.user.id;
            const user_role = req.user.role;
            console.log('Teacher ID:', teacherId, 'Current User ID:', current_user_id, 'User Role:', user_role);
            // Chỉ teacher hoặc admin mới có thể xem
            if (user_role !== 'admin' && parseInt(teacherId) !== current_user_id) {
                return res.status(403).json({
                    error: 'You can only view your own assignments'
                });
            }

            const { status, assignment_type, course_section_id } = req.query;

            let query = `
                SELECT a.*, 
                       cs.name as course_name, 
                       s.name as subject_name,
                       c.name as class_name,
                       COUNT(asub.id) as submission_count,
                       COUNT(CASE WHEN asub.status = 'graded' THEN 1 END) as graded_count
                FROM assignments a
                JOIN course_sections cs ON a.course_section_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                JOIN classes c ON cs.class_id = c.id
                LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
                WHERE cs.teacher_id = ?
            `;

            const params = [teacherId];

            // Thêm filters
            if (status) {
                if (status === 'active') {
                    query += ` AND a.due_date > NOW()`;
                } else if (status === 'closed') {
                    query += ` AND a.due_date <= NOW()`;
                }
            }

            if (assignment_type) {
                query += ` AND a.assignment_type = ?`;
                params.push(assignment_type);
            }

            if (course_section_id) {
                query += ` AND a.course_section_id = ?`;
                params.push(course_section_id);
            }

            query += ` GROUP BY a.id ORDER BY a.created_at DESC`;

            const [assignments] = await db.execute(query, params);

            res.json({
                message: 'Teacher assignments retrieved successfully',
                data: assignments
            });

        } catch (error) {
            console.error('Get teacher assignments error:', error);
            res.status(500).json({
                error: 'Failed to get teacher assignments',
                message: error.message
            });
        }
    }

    // Lấy thống kê assignments của teacher
    async getTeacherAssignmentStats(req, res) {
        try {
            const { teacherId } = req.params;
            const current_user_id = req.user.id;
            const user_role = req.user.role;

            // Chỉ teacher hoặc admin mới có thể xem
            if (user_role !== 'admin' && parseInt(teacherId) !== current_user_id) {
                return res.status(403).json({
                    error: 'You can only view your own statistics'
                });
            }

            const [stats] = await db.execute(
                `SELECT 
                    COUNT(a.id) as total_assignments,
                    COUNT(asub.id) as total_submissions,
                    AVG(asub.score) as avg_score,
                    COUNT(CASE WHEN asub.status = 'graded' THEN 1 END) as graded_count
                FROM assignments a
                JOIN course_sections cs ON a.course_section_id = cs.id
                LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
                WHERE cs.teacher_id = ? AND a.is_active = TRUE`,
                [teacherId]
            );

            res.json({
                message: 'Assignment statistics retrieved successfully',
                data: stats[0]
            });

        } catch (error) {
            console.error('Get assignment stats error:', error);
            res.status(500).json({
                error: 'Failed to get assignment statistics',
                message: error.message
            });
        }
    }

    // Lấy submissions chưa chấm điểm của teacher
    async getUngradedSubmissions(req, res) {
        try {
            const { teacherId } = req.params;
            const current_user_id = req.user.id;
            const user_role = req.user.role;

            // Chỉ teacher hoặc admin mới có thể xem
            if (user_role !== 'admin' && parseInt(teacherId) !== current_user_id) {
                return res.status(403).json({
                    error: 'You can only view your own ungraded submissions'
                });
            }

            const [submissions] = await db.execute(
                `SELECT asub.*, 
                        a.title as assignment_title,
                        a.max_score,
                        u.full_name as student_name,
                        cs.name as course_name
                FROM assignment_submissions asub
                JOIN assignments a ON asub.assignment_id = a.id
                JOIN course_sections cs ON a.course_section_id = cs.id
                JOIN users u ON asub.student_id = u.id
                WHERE cs.teacher_id = ? AND asub.status = 'submitted'
                ORDER BY asub.submitted_at ASC`,
                [teacherId]
            );

            res.json({
                message: 'Ungraded submissions retrieved successfully',
                data: submissions
            });

        } catch (error) {
            console.error('Get ungraded submissions error:', error);
            res.status(500).json({
                error: 'Failed to get ungraded submissions',
                message: error.message
            });
        }
    }
}

module.exports = new AssignmentController();
module.exports.uploadMiddleware = upload.single('attachment');