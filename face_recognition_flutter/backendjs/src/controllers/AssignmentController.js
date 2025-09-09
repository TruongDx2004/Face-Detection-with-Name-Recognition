const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const { responseHelper } = require('../utils/responseHelper');
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
                return responseHelper.error(res, 'Access denied', 403);
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
            responseHelper.success(res, assignment, 'Assignment created successfully', 201);

        } catch (error) {
            console.error('Create assignment error:', error);
            responseHelper.error(res, 'Failed to create assignment', 500);
        }
    }

    // Lấy danh sách bài tập theo lớp học phần
    static async getAssignmentsByCourseSection(req, res) {
        try {
            const { courseSectionId } = req.params;
            const assignments = await Assignment.getByCourseSection(courseSectionId);

            responseHelper.success(res, assignments, 'Assignments retrieved successfully');

        } catch (error) {
            console.error('Get assignments error:', error);
            responseHelper.error(res, 'Failed to retrieve assignments', 500);
        }
    }

    // Lấy chi tiết bài tập
    static async getAssignmentById(req, res) {
        try {
            const { id } = req.params;
            const assignment = await Assignment.getById(id);

            if (!assignment) {
                return responseHelper.error(res, 'Assignment not found', 404);
            }

            responseHelper.success(res, assignment, 'Assignment retrieved successfully');

        } catch (error) {
            console.error('Get assignment error:', error);
            responseHelper.error(res, 'Failed to retrieve assignment', 500);
        }
    }

    // Cập nhật bài tập
    static async updateAssignment(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            if (req.file) {
                updateData.attachment_path = req.file.path;
            }

            const updated = await Assignment.update(id, updateData);
            if (!updated) {
                return responseHelper.error(res, 'Assignment not found', 404);
            }

            const assignment = await Assignment.getById(id);
            responseHelper.success(res, assignment, 'Assignment updated successfully');

        } catch (error) {
            console.error('Update assignment error:', error);
            responseHelper.error(res, 'Failed to update assignment', 500);
        }
    }

    // Xóa bài tập
    static async deleteAssignment(req, res) {
        try {
            const { id } = req.params;

            // Kiểm tra quyền
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const deleted = await Assignment.delete(id);
            if (!deleted) {
                return responseHelper.error(res, 'Assignment not found', 404);
            }

            responseHelper.success(res, null, 'Assignment deleted successfully');

        } catch (error) {
            console.error('Delete assignment error:', error);
            responseHelper.error(res, 'Failed to delete assignment', 500);
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
                return responseHelper.error(res, 'Only students can submit assignments', 403);
            }

            const submissionId = await AssignmentSubmission.create({
                assignment_id: assignmentId,
                student_id: studentId,
                submission_text,
                attachment_path: req.file ? req.file.path : null
            });

            const submission = await AssignmentSubmission.getById(submissionId);
            responseHelper.success(res, submission, 'Assignment submitted successfully', 201);

        } catch (error) {
            console.error('Submit assignment error:', error);
            responseHelper.error(res, 'Failed to submit assignment', 500);
        }
    }

    // Lấy danh sách bài nộp của một bài tập
    static async getSubmissions(req, res) {
        try {
            const { assignmentId } = req.params;

            // Kiểm tra quyền giáo viên
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const submissions = await AssignmentSubmission.getByAssignment(assignmentId);
            responseHelper.success(res, submissions, 'Submissions retrieved successfully');

        } catch (error) {
            console.error('Get submissions error:', error);
            responseHelper.error(res, 'Failed to retrieve submissions', 500);
        }
    }

    // Chấm điểm bài tập
    static async gradeSubmission(req, res) {
        try {
            const { submissionId } = req.params;
            const { score, feedback } = req.body;

            // Kiểm tra quyền giáo viên
            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const graded = await AssignmentSubmission.grade(submissionId, score, feedback, req.user.id);
            if (!graded) {
                return responseHelper.error(res, 'Submission not found', 404);
            }

            const submission = await AssignmentSubmission.getById(submissionId);
            responseHelper.success(res, submission, 'Assignment graded successfully');

        } catch (error) {
            console.error('Grade submission error:', error);
            responseHelper.error(res, 'Failed to grade assignment', 500);
        }
    }

    // Lấy bài tập của sinh viên
    static async getStudentAssignments(req, res) {
        try {
            const { courseSectionId } = req.params;
            const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;

            if (!studentId) {
                return responseHelper.error(res, 'Student ID is required', 400);
            }

            const assignments = await Assignment.getStudentAssignments(studentId, courseSectionId);
            responseHelper.success(res, assignments, 'Student assignments retrieved successfully');

        } catch (error) {
            console.error('Get student assignments error:', error);
            responseHelper.error(res, 'Failed to retrieve student assignments', 500);
        }
    }

    // Lấy thống kê bài tập của giáo viên
    static async getTeacherStats(req, res) {
        try {
            const teacherId = req.user.id;

            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const stats = await Assignment.getTeacherAssignmentStats(teacherId);
            responseHelper.success(res, stats, 'Teacher assignment stats retrieved successfully');

        } catch (error) {
            console.error('Get teacher stats error:', error);
            responseHelper.error(res, 'Failed to retrieve teacher stats', 500);
        }
    }

    // Lấy bài nộp chưa chấm
    static async getUngraded(req, res) {
        try {
            const teacherId = req.user.id;

            if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
                return responseHelper.error(res, 'Access denied', 403);
            }

            const submissions = await AssignmentSubmission.getUngraded(teacherId);
            responseHelper.success(res, submissions, 'Ungraded submissions retrieved successfully');

        } catch (error) {
            console.error('Get ungraded error:', error);
            responseHelper.error(res, 'Failed to retrieve ungraded submissions', 500);
        }
    }
}

// Export controller và middleware upload
module.exports = {
    AssignmentController,
    uploadAssignment: upload.single('attachment')
};