const AssignmentTemplate = require('../models/AssignmentTemplate');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Cấu hình multer cho upload file templates
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = 'uploads/assignment-templates/';
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
        cb(null, `template-${name}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
        }
    }
});

class AssignmentTemplateController {

    // Tạo template mới
    async createTemplate(req, res) {
        try {
            const {
                title,
                description,
                assignment_type = 'homework',
                default_max_score = 10.00,
                instructions,
                tags = [],
                is_public = false
            } = req.body;

            const teacher_id = req.user.id;

            // Validation
            if (!title) {
                return res.status(400).json({
                    error: 'Title is required'
                });
            }

            // Parse tags nếu là string
            let parsedTags = tags;
            if (typeof tags === 'string') {
                try {
                    parsedTags = JSON.parse(tags);
                } catch (e) {
                    parsedTags = tags.split(',').map(tag => tag.trim());
                }
            }

            const templateId = await AssignmentTemplate.create({
                teacher_id,
                title,
                description,
                assignment_type,
                default_max_score: parseFloat(default_max_score),
                instructions,
                attachment_path: req.file ? req.file.path : null,
                tags: parsedTags,
                is_public: is_public === 'true' || is_public === true
            });

            // Lấy template vừa tạo
            const template = await AssignmentTemplate.getById(templateId);

            res.status(201).json({
                success: true,
                message: 'Template created successfully',
                data: template
            });

        } catch (error) {
            console.error('Create template error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create template',
                message: error.message
            });
        }
    }

    // Lấy templates của giáo viên
    async getTeacherTemplates(req, res) {
        try {
            const { teacherId } = req.params;
            const current_user_id = req.user.id;
            const user_role = req.user.role;

            // Chỉ teacher hoặc admin mới có thể xem
            if (user_role !== 'admin' && parseInt(teacherId) !== current_user_id) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only view your own templates'
                });
            }

            const { assignment_type, search } = req.query;
            const filters = {};
            
            if (assignment_type) filters.assignment_type = assignment_type;
            if (search) filters.search = search;

            const templates = await AssignmentTemplate.getByTeacher(teacherId, filters);

            res.json({
                success: true,
                message: 'Templates retrieved successfully',
                data: templates
            });

        } catch (error) {
            console.error('Get teacher templates error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get templates',
                message: error.message
            });
        }
    }

    // Lấy templates công khai
    async getPublicTemplates(req, res) {
        try {
            const { assignment_type, search } = req.query;
            const current_user_id = req.user.id;
            
            const filters = {};
            if (assignment_type) filters.assignment_type = assignment_type;
            if (search) filters.search = search;
            filters.exclude_teacher_id = current_user_id; // Không hiển thị templates của chính mình

            const templates = await AssignmentTemplate.getPublicTemplates(filters);

            res.json({
                success: true,
                message: 'Public templates retrieved successfully',
                data: templates
            });

        } catch (error) {
            console.error('Get public templates error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get public templates',
                message: error.message
            });
        }
    }

    // Lấy template theo ID
    async getTemplateById(req, res) {
        try {
            const { id } = req.params;
            const template = await AssignmentTemplate.getById(id);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }

            // Kiểm tra quyền truy cập
            if (!template.is_public && template.teacher_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to view this template'
                });
            }

            res.json({
                success: true,
                message: 'Template retrieved successfully',
                data: template
            });

        } catch (error) {
            console.error('Get template error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get template',
                message: error.message
            });
        }
    }

    // Cập nhật template
    async updateTemplate(req, res) {
        try {
            const { id } = req.params;
            const teacher_id = req.user.id;

            // Kiểm tra template tồn tại và quyền sở hữu
            const template = await AssignmentTemplate.getById(id);
            if (!template) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }

            if (template.teacher_id !== teacher_id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'You can only update your own templates'
                });
            }

            const updateData = { ...req.body };

            // Xử lý file mới
            if (req.file) {
                updateData.attachment_path = req.file.path;

                // Xóa file cũ nếu có
                if (template.attachment_path) {
                    try {
                        await fs.unlink(template.attachment_path);
                    } catch (error) {
                        console.warn('Failed to delete old attachment:', error.message);
                    }
                }
            }

            // Parse tags nếu cần
            if (updateData.tags && typeof updateData.tags === 'string') {
                try {
                    updateData.tags = JSON.parse(updateData.tags);
                } catch (e) {
                    updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
                }
            }

            const success = await AssignmentTemplate.update(id, updateData);

            if (!success) {
                return res.status(400).json({
                    success: false,
                    error: 'No changes made'
                });
            }

            // Lấy template đã cập nhật
            const updatedTemplate = await AssignmentTemplate.getById(id);

            res.json({
                success: true,
                message: 'Template updated successfully',
                data: updatedTemplate
            });

        } catch (error) {
            console.error('Update template error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update template',
                message: error.message
            });
        }
    }

    // Xóa template
    async deleteTemplate(req, res) {
        try {
            const { id } = req.params;
            const teacher_id = req.user.id;

            // Kiểm tra template tồn tại và quyền sở hữu
            const template = await AssignmentTemplate.getById(id);
            if (!template) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }

            if (template.teacher_id !== teacher_id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'You can only delete your own templates'
                });
            }

            const success = await AssignmentTemplate.delete(id);

            if (!success) {
                return res.status(400).json({
                    success: false,
                    error: 'Failed to delete template'
                });
            }

            res.json({
                success: true,
                message: 'Template deleted successfully'
            });

        } catch (error) {
            console.error('Delete template error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete template',
                message: error.message
            });
        }
    }

    // Tạo assignment từ template
    async createAssignmentFromTemplate(req, res) {
        try {
            const { templateId } = req.params;
            const {
                course_section_id,
                title,
                description,
                assignment_type,
                max_score,
                due_date,
                instructions,
                attachment_path
            } = req.body;

            const teacher_id = req.user.id;

            // Validation
            if (!course_section_id || !due_date) {
                return res.status(400).json({
                    success: false,
                    error: 'course_section_id and due_date are required'
                });
            }

            // Lấy thông tin template để kiểm tra duplicate assignment
            const template = await AssignmentTemplate.getById(templateId);
            if (!template) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }

            const db = require('../config/database');
            
            // Kiểm tra bài tập có tiêu đề tương tự đã tồn tại trong lớp học phần chưa
            const assignmentTitle = title || template.title;
            const assignmentType = assignment_type || template.assignment_type;
            
            const [existingAssignments] = await db.execute(
                `SELECT a.id, a.title 
                FROM assignments a 
                WHERE a.course_section_id = ? AND a.title = ? AND a.assignment_type = ? AND a.is_active = TRUE`,
                [course_section_id, assignmentTitle, assignmentType]
            );

            if (existingAssignments.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Bài tập với tiêu đề này đã tồn tại trong lớp học phần',
                    existing_assignment: {
                        id: existingAssignments[0].id,
                        title: existingAssignments[0].title
                    }
                });
            }

            // Kiểm tra quyền truy cập course section
            const [courseSections] = await db.execute(
                'SELECT teacher_id FROM course_sections WHERE id = ? AND is_active = TRUE',
                [course_section_id]
            );

            if (courseSections.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Course section not found'
                });
            }

            if (courseSections[0].teacher_id !== teacher_id) {
                return res.status(403).json({
                    success: false,
                    error: 'You are not authorized to create assignments for this course section'
                });
            }

            // Tạo assignment từ template
            const assignmentId = await AssignmentTemplate.createAssignmentFromTemplate(templateId, {
                course_section_id,
                title,
                description,
                assignment_type,
                max_score: max_score ? parseFloat(max_score) : undefined,
                due_date,
                instructions,
                attachment_path
            });

            // Lấy assignment vừa tạo
            const Assignment = require('../models/Assignment');
            const assignment = await Assignment.getById(assignmentId);

            res.status(201).json({
                success: true,
                message: 'Assignment created from template successfully',
                data: assignment
            });

        } catch (error) {
            console.error('Create assignment from template error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create assignment from template',
                message: error.message
            });
        }
    }

    // Lấy thống kê templates
    async getTemplateStats(req, res) {
        try {
            const { teacherId } = req.params;
            const current_user_id = req.user.id;
            const user_role = req.user.role;

            // Chỉ teacher hoặc admin mới có thể xem
            if (user_role !== 'admin' && parseInt(teacherId) !== current_user_id) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only view your own statistics'
                });
            }

            const stats = await AssignmentTemplate.getTeacherTemplateStats(teacherId);

            res.json({
                success: true,
                message: 'Template statistics retrieved successfully',
                data: stats
            });

        } catch (error) {
            console.error('Get template stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get template statistics',
                message: error.message
            });
        }
    }

    // Lấy top templates được sử dụng nhiều nhất
    async getTopTemplates(req, res) {
        try {
            const { limit = 10 } = req.query;
            const templates = await AssignmentTemplate.getTopUsedTemplates(parseInt(limit));

            res.json({
                success: true,
                message: 'Top templates retrieved successfully',
                data: templates
            });

        } catch (error) {
            console.error('Get top templates error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get top templates',
                message: error.message
            });
        }
    }

    // Tìm kiếm templates theo tags
    async searchByTags(req, res) {
        try {
            const { tags } = req.query;
            const current_user_id = req.user.id;

            if (!tags) {
                return res.status(400).json({
                    success: false,
                    error: 'Tags parameter is required'
                });
            }

            const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
            const templates = await AssignmentTemplate.searchByTags(tagArray, current_user_id);

            res.json({
                success: true,
                message: 'Templates found by tags',
                data: templates
            });

        } catch (error) {
            console.error('Search by tags error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search templates',
                message: error.message
            });
        }
    }
}

module.exports = new AssignmentTemplateController();
module.exports.uploadMiddleware = upload.single('attachment');