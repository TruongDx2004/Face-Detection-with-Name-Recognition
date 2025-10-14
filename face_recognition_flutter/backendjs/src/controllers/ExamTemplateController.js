const ExamTemplate = require('../models/ExamTemplate');
const { validationResult } = require('express-validator');

const ExamTemplateController = {
    // Lấy tất cả templates của teacher
    async getMyTemplates(req, res) {
        try {
            const teacherId = req.user.id;
            const filters = {
                subject_id: req.query.subject_id,
                difficulty_level: req.query.difficulty_level,
                search: req.query.search,
                tags: req.query.tags ? req.query.tags.split(',') : undefined
            };

            const templates = await ExamTemplate.getByTeacherId(teacherId, filters);
            
            res.json({
                success: true,
                data: templates,
                message: 'Templates retrieved successfully'
            });
        } catch (error) {
            console.error('Error fetching my templates:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching templates',
                error: error.message
            });
        }
    },

    // Lấy templates công khai
    async getPublicTemplates(req, res) {
        try {
            const teacherId = req.user.id;
            const filters = {
                subject_id: req.query.subject_id,
                difficulty_level: req.query.difficulty_level,
                search: req.query.search,
                tags: req.query.tags ? req.query.tags.split(',') : undefined
            };

            const templates = await ExamTemplate.getPublicTemplates(teacherId, filters);
            
            res.json({
                success: true,
                data: templates,
                message: 'Public templates retrieved successfully'
            });
        } catch (error) {
            console.error('Error fetching public templates:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching public templates',
                error: error.message
            });
        }
    },

    // Lấy template theo ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const template = await ExamTemplate.getById(id);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }

            // Check permissions - owner hoặc public template
            if (template.teacher_id !== req.user.id && !template.is_public) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            res.json({
                success: true,
                data: template,
                message: 'Template retrieved successfully'
            });
        } catch (error) {
            console.error('Error fetching template:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching template',
                error: error.message
            });
        }
    },

    // Tạo template mới
    async create(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const templateData = {
                ...req.body,
                teacher_id: req.user.id
            };

            // Validate questions format
            if (!templateData.questions || !Array.isArray(templateData.questions) || templateData.questions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Questions array is required and must not be empty'
                });
            }

            // Validate total points calculation
            let calculatedPoints = 0;
            for (const question of templateData.questions) {
                if (!question.points || question.points <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Each question must have valid points'
                    });
                }
                calculatedPoints += parseFloat(question.points);
            }

            if (Math.abs(calculatedPoints - parseFloat(templateData.total_points)) > 0.01) {
                return res.status(400).json({
                    success: false,
                    message: `Total points mismatch. Calculated: ${calculatedPoints}, Provided: ${templateData.total_points}`
                });
            }

            const template = await ExamTemplate.create(templateData);

            res.status(201).json({
                success: true,
                data: template,
                message: 'Template created successfully'
            });
        } catch (error) {
            console.error('Error creating template:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating template',
                error: error.message
            });
        }
    },

    // Cập nhật template
    async update(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const template = await ExamTemplate.getById(id);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }

            // Check ownership
            if (template.teacher_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Validate questions and points if provided
            if (req.body.questions) {
                if (!Array.isArray(req.body.questions) || req.body.questions.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Questions array is required and must not be empty'
                    });
                }

                let calculatedPoints = 0;
                for (const question of req.body.questions) {
                    if (!question.points || question.points <= 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Each question must have valid points'
                        });
                    }
                    calculatedPoints += parseFloat(question.points);
                }

                const totalPoints = req.body.total_points || template.total_points;
                if (Math.abs(calculatedPoints - parseFloat(totalPoints)) > 0.01) {
                    return res.status(400).json({
                        success: false,
                        message: `Total points mismatch. Calculated: ${calculatedPoints}, Provided: ${totalPoints}`
                    });
                }
            }

            const updatedTemplate = await ExamTemplate.update(id, req.body);

            res.json({
                success: true,
                data: updatedTemplate,
                message: 'Template updated successfully'
            });
        } catch (error) {
            console.error('Error updating template:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating template',
                error: error.message
            });
        }
    },

    // Xóa template
    async delete(req, res) {
        try {
            const { id } = req.params;
            const template = await ExamTemplate.getById(id);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }

            // Check ownership
            if (template.teacher_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            await ExamTemplate.delete(id);

            res.json({
                success: true,
                message: 'Template deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting template:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting template',
                error: error.message
            });
        }
    },

    // Tạo exam từ template
    async createExamFromTemplate(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { templateId } = req.params;
            const examData = {
                ...req.body,
                teacher_id: req.user.id
            };

            const template = await ExamTemplate.getById(templateId);
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }

            // Check access permission
            if (template.teacher_id !== req.user.id && !template.is_public) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this template'
                });
            }

            const exam = await ExamTemplate.createExamFromTemplate(templateId, examData);

            res.status(201).json({
                success: true,
                data: exam,
                message: 'Exam created from template successfully'
            });
        } catch (error) {
            console.error('Error creating exam from template:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating exam from template',
                error: error.message
            });
        }
    },

    // Lấy tất cả tags
    async getAllTags(req, res) {
        try {
            const tags = await ExamTemplate.getAllTags();
            
            res.json({
                success: true,
                data: tags,
                message: 'Tags retrieved successfully'
            });
        } catch (error) {
            console.error('Error fetching tags:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching tags',
                error: error.message
            });
        }
    },

    // Tìm kiếm theo tags
    async searchByTags(req, res) {
        try {
            const { tags } = req.query;
            if (!tags) {
                return res.status(400).json({
                    success: false,
                    message: 'Tags parameter is required'
                });
            }

            const tagArray = tags.split(',');
            const excludeTeacherId = req.query.exclude_own === 'true' ? req.user.id : null;
            
            const templates = await ExamTemplate.searchByTags(tagArray, excludeTeacherId);
            
            res.json({
                success: true,
                data: templates,
                message: 'Templates found by tags'
            });
        } catch (error) {
            console.error('Error searching by tags:', error);
            res.status(500).json({
                success: false,
                message: 'Error searching by tags',
                error: error.message
            });
        }
    },

    // Lấy thống kê
    async getStatistics(req, res) {
        try {
            const teacherId = req.user.id;
            const stats = await ExamTemplate.getStatistics(teacherId);
            
            res.json({
                success: true,
                data: stats,
                message: 'Statistics retrieved successfully'
            });
        } catch (error) {
            console.error('Error fetching statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching statistics',
                error: error.message
            });
        }
    },

    // Duplicate template
    async duplicate(req, res) {
        try {
            const { id } = req.params;
            const template = await ExamTemplate.getById(id);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }

            // Check access permission
            if (template.teacher_id !== req.user.id && !template.is_public) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Create duplicate
            const duplicateData = {
                title: `${template.title} (Copy)`,
                description: template.description,
                subject_id: template.subject_id,
                teacher_id: req.user.id,
                difficulty_level: template.difficulty_level,
                duration_minutes: template.duration_minutes,
                total_points: template.total_points,
                questions: template.questions,
                tags: template.tags,
                is_public: false // Duplicates are always private initially
            };

            const duplicatedTemplate = await ExamTemplate.create(duplicateData);

            res.status(201).json({
                success: true,
                data: duplicatedTemplate,
                message: 'Template duplicated successfully'
            });
        } catch (error) {
            console.error('Error duplicating template:', error);
            res.status(500).json({
                success: false,
                message: 'Error duplicating template',
                error: error.message
            });
        }
    }
};

module.exports = ExamTemplateController;