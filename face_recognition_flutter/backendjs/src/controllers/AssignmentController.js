const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const ResponseHelper = require('../utils/ResponseHelper');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'uploads/assignments';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

class AssignmentController {
    // Tạo bài tập mới
    static async createAssignment(req, res) {
        try {
            const {
                course_section_id,
                title,
                description,
                assignment_type,
                max_score,
                due_date,
                instructions
            } = req.body;

            // Kiểm tra quyền giáo viên
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            const assignmentId = await Assignment.create({
                course_section_id,
                title,
                description,
                assignment_type,
                max_score,
                due_date,
                instructions,
                attachment_path: req.file ? req.file.path : null
            });

            const assignment = await Assignment.getById(assignmentId);
            ResponseHelper.success(res, assignment, 'Assignment created successfully', 201);

        } catch (error) {
            console.error('Create assignment error:', error);
            ResponseHelper.error(res, 'Failed to create assignment', 500);
        }
    }

    // Lấy tất cả bài tập của giáo viên
    static async getTeacherAssignments(req, res) {
        try {
            const teacherId = req.user.id;
            
            // Kiểm tra quyền giáo viên
            if (req.user.role !== 'teacher') {
                return ResponseHelper.error(res, 'Access denied. Teacher role required.', 403);
            }

            // Lấy filters từ query parameters
            const filters = {};
            if (req.query.status) filters.status = req.query.status;
            if (req.query.assignment_type) filters.assignment_type = req.query.assignment_type;
            if (req.query.course_section_id) filters.course_section_id = parseInt(req.query.course_section_id);

            const assignments = await Assignment.getByTeacher(teacherId, filters);

            ResponseHelper.success(res, assignments, 'Teacher assignments retrieved successfully');

        } catch (error) {
            console.error('Get teacher assignments error:', error);
            ResponseHelper.error(res, 'Failed to retrieve teacher assignments', 500);
        }
    }

    // Download assignment file
    static async downloadFile(req, res) {
        try {
            const { filename } = req.params;
            const filePath = path.join('uploads/assignments', filename);

            // Check if file exists
            try {
                await fs.access(filePath);
            } catch (error) {
                return ResponseHelper.error(res, 'File not found', 404);
            }

            // Security check: ensure filename doesn't contain path traversal
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return ResponseHelper.error(res, 'Invalid filename', 400);
            }

            // Set appropriate headers
            const ext = path.extname(filename).toLowerCase();
            let contentType = 'application/octet-stream';
            
            switch (ext) {
                case '.pdf':
                    contentType = 'application/pdf';
                    break;
                case '.doc':
                    contentType = 'application/msword';
                    break;
                case '.docx':
                    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    break;
                case '.txt':
                    contentType = 'text/plain';
                    break;
                case '.jpg':
                case '.jpeg':
                    contentType = 'image/jpeg';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.zip':
                    contentType = 'application/zip';
                    break;
                case '.rar':
                    contentType = 'application/x-rar-compressed';
                    break;
            }

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            // Stream the file
            const fileStream = require('fs').createReadStream(filePath);
            fileStream.pipe(res);

        } catch (error) {
            console.error('Download file error:', error);
            ResponseHelper.error(res, 'Failed to download file', 500);
        }
    }

    // Lấy danh sách bài tập theo lớp học phần
    static async getAssignmentsByCourseSection(req, res) {
        try {
            const { courseSectionId } = req.params;
            const assignments = await Assignment.getByCourseSection(courseSectionId);

            ResponseHelper.success(res, assignments, 'Assignments retrieved successfully');

        } catch (error) {
            console.error('Get assignments error:', error);
            ResponseHelper.error(res, 'Failed to retrieve assignments', 500);
        }
    }

    // Lấy chi tiết bài tập
    static async getAssignmentById(req, res) {
        try {
            const { id } = req.params;
            const assignment = await Assignment.getById(id);

            if (!assignment) {
                return ResponseHelper.error(res, 'Assignment not found', 404);
            }

            ResponseHelper.success(res, assignment, 'Assignment retrieved successfully');

        } catch (error) {
            console.error('Get assignment error:', error);
            ResponseHelper.error(res, 'Failed to retrieve assignment', 500);
        }
    }

    // Cập nhật bài tập
    static async updateAssignment(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            if (req.file) {
                updateData.attachment_path = req.file.path;
            }

            const updated = await Assignment.update(id, updateData);
            if (!updated) {
                return ResponseHelper.error(res, 'Assignment not found', 404);
            }

            const assignment = await Assignment.getById(id);
            ResponseHelper.success(res, assignment, 'Assignment updated successfully');

        } catch (error) {
            console.error('Update assignment error:', error);
            ResponseHelper.error(res, 'Failed to update assignment', 500);
        }
    }

    // Xóa bài tập
    static async deleteAssignment(req, res) {
        try {
            const { id } = req.params;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            const deleted = await Assignment.delete(id);
            if (!deleted) {
                return ResponseHelper.error(res, 'Assignment not found', 404);
            }

            ResponseHelper.success(res, null, 'Assignment deleted successfully');

        } catch (error) {
            console.error('Delete assignment error:', error);
            ResponseHelper.error(res, 'Failed to delete assignment', 500);
        }
    }

    // Nộp bài tập (sinh viên)
    static async submitAssignment(req, res) {
        try {
            const { assignmentId } = req.params;
            const { submission_text } = req.body;
            const studentId = req.user.id;

            // Kiểm tra quyền sinh viên
            if (req.user.role !== 'student') {
                return ResponseHelper.error(res, 'Only students can submit assignments', 403);
            }

            const submissionId = await AssignmentSubmission.create({
                assignment_id: assignmentId,
                student_id: studentId,
                submission_text,
                attachment_path: req.file ? req.file.path : null
            });

            const submission = await AssignmentSubmission.getById(submissionId);
            ResponseHelper.success(res, submission, 'Assignment submitted successfully', 201);

        } catch (error) {
            console.error('Submit assignment error:', error);
            ResponseHelper.error(res, 'Failed to submit assignment', 500);
        }
    }

    // Lấy danh sách bài nộp của một bài tập
    static async getSubmissions(req, res) {
        try {
            const { assignmentId } = req.params;

            // Kiểm tra quyền giáo viên
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            const submissions = await AssignmentSubmission.getByAssignment(assignmentId);
            ResponseHelper.success(res, submissions, 'Submissions retrieved successfully');

        } catch (error) {
            console.error('Get submissions error:', error);
            ResponseHelper.error(res, 'Failed to retrieve submissions', 500);
        }
    }

    // Chấm điểm bài tập
    static async gradeSubmission(req, res) {
        try {
            const { submissionId } = req.params;
            const { score, feedback } = req.body;

            // Kiểm tra quyền giáo viên
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            const graded = await AssignmentSubmission.grade(submissionId, score, feedback, req.user.id);
            if (!graded) {
                return ResponseHelper.error(res, 'Submission not found', 404);
            }

            const submission = await AssignmentSubmission.getById(submissionId);
            ResponseHelper.success(res, submission, 'Assignment graded successfully');

        } catch (error) {
            console.error('Grade submission error:', error);
            ResponseHelper.error(res, 'Failed to grade assignment', 500);
        }
    }

    // Lấy bài tập của sinh viên
    static async getStudentAssignments(req, res) {
        try {
            const { courseSectionId } = req.params;
            const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;

            if (!studentId) {
                return ResponseHelper.error(res, 'Student ID is required', 400);
            }

            const assignments = await Assignment.getStudentAssignments(studentId, courseSectionId);
            ResponseHelper.success(res, assignments, 'Student assignments retrieved successfully');

        } catch (error) {
            console.error('Get student assignments error:', error);
            ResponseHelper.error(res, 'Failed to retrieve student assignments', 500);
        }
    }

    // Lấy thống kê bài tập của giáo viên
    static async getTeacherStats(req, res) {
        try {
            const teacherId = req.user.id;

            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            const stats = await Assignment.getTeacherAssignmentStats(teacherId);
            ResponseHelper.success(res, stats, 'Teacher assignment stats retrieved successfully');

        } catch (error) {
            console.error('Get teacher stats error:', error);
            ResponseHelper.error(res, 'Failed to retrieve teacher stats', 500);
        }
    }

    // Lấy bài nộp chưa chấm
    static async getUngraded(req, res) {
        try {
            const teacherId = req.user.id;

            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return ResponseHelper.error(res, 'Access denied', 403);
            }

            const submissions = await AssignmentSubmission.getUngraded(teacherId);
            ResponseHelper.success(res, submissions, 'Ungraded submissions retrieved successfully');

        } catch (error) {
            console.error('Get ungraded error:', error);
            ResponseHelper.error(res, 'Failed to retrieve ungraded submissions', 500);
        }
    }
}

// Export controller và middleware upload
module.exports = {
    AssignmentController,
    uploadAssignment: upload.single('attachment')
};