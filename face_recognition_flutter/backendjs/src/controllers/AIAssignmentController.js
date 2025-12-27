const AIAssignmentService = require('../services/aiAssignmentService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const ResponseHelper = require('../utils/responseHelper');

// Configure multer for document uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = 'uploads/documents/';
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
        cb(null, `doc-${name}-${uniqueSuffix}${ext}`);
    }
});

const documentUpload = multer({
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
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not supported. Supported types: PDF, DOCX, TXT, XLSX'));
        }
    }
});

class AIAssignmentController {
    constructor() {
        this.aiService = new AIAssignmentService();
    }

    /**
     * Generate assignment template from uploaded document
     * POST /api/ai/generate-assignment
     */
    async generateAssignment(req, res) {
        try {
            const { user } = req;
            if (!user || user.role !== 'teacher') {
                return ResponseHelper.error(res, 'Unauthorized. Teacher access required.', 403);
            }

            if (!req.file) {
                return ResponseHelper.error(res, 'No document file uploaded', 400);
            }

            // Parse generation options from request body
            const options = {
                title: req.body.title,
                description: req.body.description,
                assignmentType: req.body.assignment_type || 'homework',
                questionCount: parseInt(req.body.question_count) || 10,
                questionTypes: req.body.question_types ? 
                    req.body.question_types.split(',').map(t => t.trim()) : 
                    ['multiple_choice', 'short_answer'],
                difficulty: req.body.difficulty || 'medium',
                language: req.body.language || 'vietnamese',
                subjectId: req.body.subject_id ? parseInt(req.body.subject_id) : null,
                topic: req.body.topic,
                isPublic: req.body.is_public === 'true'
            };

            console.log(`🎯 AI Assignment generation request from teacher ${user.id}`);
            console.log(`📄 File: ${req.file.originalname} (${req.file.size} bytes)`);
            console.log(`⚙️ Options:`, options);

            // Generate assignment using AI service
            const result = await this.aiService.generateAssignmentFromDocument({
                filePath: req.file.path,
                teacherId: user.id,
                options: options
            });

            // Clean up uploaded file after processing
            try {
                await fs.unlink(req.file.path);
            } catch (cleanupError) {
                console.warn('⚠️ Failed to clean up uploaded file:', cleanupError.message);
            }

            return ResponseHelper.success(res, result, 'Assignment template generated successfully');

        } catch (error) {
            console.error('❌ AI Assignment generation failed:', error);
            
            // Clean up uploaded file in case of error
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (cleanupError) {
                    console.warn('⚠️ Failed to clean up uploaded file after error:', cleanupError.message);
                }
            }

            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Get AI generation status/progress
     * GET /api/ai/generation-status/:generationId
     */
    async getGenerationStatus(req, res) {
        try {
            const { generationId } = req.params;
            // This would track ongoing generations in a real implementation
            // For now, return a simple response
            return ResponseHelper.success(res, {
                generation_id: generationId,
                status: 'completed',
                message: 'Generation completed successfully'
            });
        } catch (error) {
            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Preview questions before creating template
     * POST /api/ai/preview-questions
     */
    async previewQuestions(req, res) {
        try {
            const { user } = req;
            if (!user || user.role !== 'teacher') {
                return ResponseHelper.error(res, 'Unauthorized. Teacher access required.', 403);
            }

            if (!req.file) {
                return ResponseHelper.error(res, 'No document file uploaded', 400);
            }

            const options = {
                questionCount: Math.min(parseInt(req.body.question_count) || 5, 5), // Limit preview to 5 questions
                questionTypes: req.body.question_types ? 
                    req.body.question_types.split(',').map(t => t.trim()) : 
                    ['multiple_choice'],
                difficulty: req.body.difficulty || 'medium',
                language: req.body.language || 'vietnamese'
            };

            // Initialize AI service components individually for preview
            await this.aiService.initialize();
            
            // Parse document
            const parsedDoc = await this.aiService.documentParser.parseDocument(req.file.path);
            
            // Preprocess text
            const processedData = await this.aiService.textPreprocessor.preprocessText(
                parsedDoc.text, 
                { chunkSize: 500 } // Smaller chunks for preview
            );
            
            // Generate limited questions
            const questions = await this.aiService.questionGenerator.generateQuestions(
                processedData,
                options
            );
            
            // Clean up uploaded file
            try {
                await fs.unlink(req.file.path);
            } catch (cleanupError) {
                console.warn('⚠️ Failed to clean up preview file:', cleanupError.message);
            }

            return ResponseHelper.success(res, {
                questions: questions,
                document_info: {
                    format: parsedDoc.metadata.format,
                    pages: parsedDoc.metadata.pages || 1,
                    word_count: processedData.statistics.words,
                    estimated_reading_time: processedData.statistics.readingTime
                },
                preview: true
            }, 'Questions preview generated successfully');

        } catch (error) {
            console.error('❌ Questions preview failed:', error);
            
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (cleanupError) {
                    console.warn('⚠️ Failed to clean up preview file after error:', cleanupError.message);
                }
            }

            return ResponseHelper.error(res, error.message, 500);
        }
    }

    /**
     * Get supported document formats and AI capabilities
     * GET /api/ai/capabilities
     */
    async getCapabilities(req, res) {
        try {
            const capabilities = {
                supported_formats: ['PDF', 'DOCX', 'TXT', 'XLSX'],
                question_types: [
                    {
                        type: 'multiple_choice',
                        name: 'Trắc nghiệm',
                        description: 'Câu hỏi với 4 lựa chọn A, B, C, D'
                    },
                    {
                        type: 'short_answer',
                        name: 'Tự luận ngắn',
                        description: 'Câu hỏi yêu cầu trả lời 1-2 câu'
                    },
                    {
                        type: 'true_false',
                        name: 'Đúng/Sai',
                        description: 'Câu hỏi đúng hoặc sai'
                    },
                    {
                        type: 'essay',
                        name: 'Tự luận dài',
                        description: 'Câu hỏi yêu cầu phân tích chi tiết'
                    }
                ],
                difficulty_levels: ['easy', 'medium', 'hard'],
                languages: ['vietnamese', 'english'],
                limits: {
                    max_file_size: '10MB',
                    max_questions: 20,
                    min_questions: 1
                },
                features: [
                    'Automatic question generation',
                    'Multiple question types',
                    'Difficulty level adjustment',
                    'Content analysis and keyword extraction',
                    'Vietnamese language support',
                    'Quality validation and post-processing'
                ]
            };

            return ResponseHelper.success(res, capabilities);
        } catch (error) {
            console.error('❌ Get capabilities failed:', error);
        }
    }

    /**
     * Get AI generation statistics for teacher
     * GET /api/ai/stats
     */
    async getAIStats(req, res) {
        try {
            const { user } = req;
            if (!user || user.role !== 'teacher') {
                return ResponseHelper.error(res, 'Unauthorized. Teacher access required.', 403);
            }

            // This would query actual statistics from database
            // For now, return mock data
            const stats = {
                total_generations: 0,
                total_questions: 0,
                avg_generation_time: '0s',
                popular_question_types: ['multiple_choice', 'short_answer'],
                recent_generations: []
            };

            return ResponseHelper.success(res, stats);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 500);
        }
    }
}

// Export upload middleware and controller
const controller = new AIAssignmentController();

module.exports = {
    controller,
    uploadMiddleware: documentUpload.single('document')
};