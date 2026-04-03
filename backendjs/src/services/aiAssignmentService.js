const DocumentParser = require('../ai/parsers/DocumentParser');
const TextPreprocessor = require('../ai/processors/TextPreprocessor');
const Phi3QuestionGenerator = require('../ai/models/Phi3QuestionGenerator');
const QuestionPostProcessor = require('../ai/processors/QuestionPostProcessor');
const AssignmentTemplate = require('../models/AssignmentTemplate');
const fs = require('fs').promises;
const path = require('path');

/**
 * AIAssignmentService - Main service orchestrating the AI assignment generation pipeline
 * Pipeline: Upload -> Parse -> Preprocess -> Generate -> Process -> Save
 */
class AIAssignmentService {
    constructor() {
        this.documentParser = new DocumentParser();
        this.textPreprocessor = new TextPreprocessor();
        this.questionGenerator = new Phi3QuestionGenerator();
        this.postProcessor = new QuestionPostProcessor();
        this.initialized = false;
    }

    /**
     * Initialize all AI components
     */
    async initialize() {
        if (this.initialized) return;

        try {
            console.log('🚀 Initializing AI Assignment Service...');
            
            // Initialize the question generator (phi-3 model)
            await this.questionGenerator.initialize();
            
            this.initialized = true;
            console.log('✅ AI Assignment Service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize AI Assignment Service:', error);
            throw error;
        }
    }

    /**
     * Main method: Generate assignment template from uploaded document
     * @param {object} params - Generation parameters
     * @param {string} params.filePath - Path to uploaded document
     * @param {number} params.teacherId - Teacher ID
     * @param {object} params.options - Generation options
     */
    async generateAssignmentFromDocument(params) {
        await this.initialize();

        const {
            filePath,
            teacherId,
            options = {}
        } = params;

        console.log(`🎯 Starting AI assignment generation for: ${filePath}`);
        
        const generationLog = {
            startTime: new Date(),
            steps: [],
            errors: []
        };

        try {
            // Step 1: Parse Document
            const parseStep = await this.executeStep('Document Parsing', async () => {
                await this.documentParser.validateFile(filePath, 10);
                return await this.documentParser.parseDocument(filePath);
            });
            generationLog.steps.push(parseStep);

            // Step 2: Preprocess Text
            const preprocessStep = await this.executeStep('Text Preprocessing', async () => {
                return await this.textPreprocessor.preprocessText(
                    parseStep.result.text, 
                    options.preprocessing || {}
                );
            });
            generationLog.steps.push(preprocessStep);

            // Step 3: Generate Questions
            const generationStep = await this.executeStep('Question Generation', async () => {
                return await this.questionGenerator.generateQuestions(
                    preprocessStep.result,
                    {
                        questionCount: options.questionCount || 10,
                        questionTypes: options.questionTypes || ['multiple_choice', 'short_answer'],
                        difficulty: options.difficulty || 'medium',
                        language: options.language || 'vietnamese'
                    }
                );
            });
            generationLog.steps.push(generationStep);
            // Step 4: Post Process Questions
            const postProcessStep = await this.executeStep('Post Processing', async () => {
                return await this.postProcessor.processQuestions(
                    generationStep.result,
                    {
                        subject_id: options.subjectId,
                        topic: options.topic
                    }
                );
            });
            generationLog.steps.push(postProcessStep);

            // Step 5: Create Assignment Template
            const saveStep = await this.executeStep('Save Template', async () => {
                return await this.createAssignmentTemplate({
                    teacherId,
                    questions: postProcessStep.result,
                    originalDocument: parseStep.result,
                    processedData: preprocessStep.result,
                    options: { ...options, originalFilename: path.basename(filePath) },
                    filePath: filePath
                });
            });
            generationLog.steps.push(saveStep);
            console.log('✅ Assignment template created with ID:', saveStep.result.id);
            // Generate final report
            const report = this.generateReport(generationLog, saveStep.result);
            
            console.log('🎉 AI assignment generation completed successfully!');
            return {
                success: true,
                template: saveStep.result,
                report: report,
                log: generationLog
            };

        } catch (error) {
            generationLog.errors.push({
                error: error.message,
                timestamp: new Date(),
                stack: error.stack
            });
            
            console.error('❌ AI assignment generation failed:', error);
            throw new Error(`AI assignment generation failed: ${error.message}`);
        }
    }

    /**
     * Execute a pipeline step with error handling and logging
     */
    async executeStep(stepName, stepFunction) {
        const step = {
            name: stepName,
            startTime: new Date(),
            status: 'running'
        };

        try {
            console.log(`⏳ ${stepName}...`);
            step.result = await stepFunction();
            step.endTime = new Date();
            step.duration = step.endTime - step.startTime;
            step.status = 'completed';
            console.log(`✅ ${stepName} completed in ${step.duration}ms`);
            return step;
        } catch (error) {
            step.endTime = new Date();
            step.duration = step.endTime - step.startTime;
            step.status = 'failed';
            step.error = error.message;
            console.error(`❌ ${stepName} failed:`, error.message);
            throw error;
        }
    }

    /**
     * Create assignment template from generated questions
     */
    async createAssignmentTemplate(params) {
        const {
            teacherId,
            questions,
            originalDocument,
            processedData,
            options,
            filePath
        } = params;
        
        // Generate template title and description
        const title = options.title || this.generateTitle(processedData, originalDocument);
        const description = options.description || this.generateDescription(processedData, questions);
        const instructions = this.generateInstructions(questions, options);

        // Prepare template data - ensure no undefined values
        const templateData = {
            teacher_id: teacherId,
            title: title || 'AI Generated Assignment',
            description: description || 'Assignment generated by AI',
            assignment_type: options.assignment_type || options.assignmentType || 'homework',
            default_max_score: 10,
            instructions: instructions || 'Complete all questions.',
            tags: ['ai-generated'],
            is_public: Boolean(options.is_public || options.isPublic),
            // Store AI generation metadata
            ai_generated: true,
            ai_metadata: JSON.stringify({
                source_document: {
                    format: originalDocument?.metadata?.format || 'unknown',
                    pages: originalDocument?.metadata?.pages || 1,
                    processing_time: new Date().toISOString()
                },
                generation_settings: {
                    question_count: questions?.length || 0,
                    question_types: questions ? [...new Set(questions.map(q => q.type).filter(Boolean))] : [],
                    difficulty_levels: questions ? [...new Set(questions.map(q => q.difficulty).filter(Boolean))] : [],
                    language: options.language || 'vietnamese'
                },
                text_analysis: {
                    total_words: processedData?.statistics?.words || 0,
                    total_sentences: processedData?.statistics?.sentences || 0,
                    reading_time: processedData?.statistics?.readingTime || 0,
                    key_topics: processedData?.topics || {}
                }
            }),
            // Add fields that might be expected by the model
            subject_id: options.subject_id ? parseInt(options.subject_id) : 3,
            topic: options.topic || "null",
            generation_id: `gen_${Date.now()}`,
            ai_model_version: 'phi-3-mini-4k',
            source_document_name: path.basename(options.originalFilename || 'unknown.doc'),
            source_document_hash: "null"
        };
        console.log('📝 Prepared template data:', templateData);
        // Add original filename from file path
        if (filePath && !templateData.source_document_name.includes('.')) {
            templateData.source_document_name = path.basename(filePath);
        }

        console.log('📝 Creating template with data:', {
            teacher_id: templateData.teacher_id,
            title: templateData.title,
            assignment_type: templateData.assignment_type,
            ai_generated: templateData.ai_generated,
            tags_length: templateData.tags ? templateData.tags.length : 0
        });

        // Create the template
        const template = await AssignmentTemplate.create(templateData);

        // Store questions separately (you might need to create a separate table for this)
        await this.storeTemplateQuestions(template.id, questions);

        return template;
    }

    /**
     * Generate appropriate title from content
     */
    generateTitle(processedData, originalDocument) {
        const topics = processedData.topics?.topics || processedData.topics?.nouns || [];
        const mainTopic = topics.length > 0 ? topics[0] : 'Tài liệu học tập';
        
        return `Bài tập: ${mainTopic} (AI Generated)`;
    }

    /**
     * Generate description with questions included
     */
    generateDescription(processedData, questions) {
        const stats = processedData.statistics;
        const questionTypes = [...new Set(questions.map(q => q.type))];
        
        let description = `Bài tập được tạo tự động từ tài liệu ${stats.words} từ. ` +
                         `Bao gồm ${questions.length} câu hỏi thuộc các dạng: ${questionTypes.join(', ')}. ` +
                         `Thời gian đọc ước tính: ${stats.readingTime} phút.\n\n`;
        
        description += `=== CÂU HỎI BÀI TẬP ===\n\n`;
        
        questions.forEach((question, index) => {
            description += `**Câu ${index + 1}:** (${this.getQuestionTypeName(question.type)} - ${this.getDifficultyName(question.difficulty)})\n`;
            description += `${question.sample_answer}\n`;
            
            // Add options for multiple choice
            // if (question.type === 'multiple_choice' && question.options) {
            //     question.options.forEach((option, optIndex) => {
            //         description += `   ${String.fromCharCode(65 + optIndex)}. ${option}\n`;
            //     });
            //     description += `   **Đáp án:** ${question.correct_answer}\n`;
            // }
            
            // Add sample answer for short answer
            if (question.type === 'short_answer' && question.sample_answer) {
            }
            
            // Add correct answer for true/false
            if (question.type === 'true_false') {
                description += `   **Đáp án:** ${question.correct_answer ? 'Đúng' : 'Sai'}\n`;
            }
            
            // Add rubric for essay
            if (question.type === 'essay' && question.rubric) {
                description += `   **Tiêu chí chấm điểm:**\n`;
                // question.rubric.forEach(criterion => {
                //     description += `   - ${criterion}\n`;
                // });
                if (question.suggested_length) {
                    description += `   **Độ dài đề xuất:** ${question.suggested_length}\n`;
                }
            }
            
            // Add explanation
            if (question.explanation) {
                description += `   **Giải thích:** ${question.explanation}\n`;
            }
            
            description += `\n`;
        });
        
        return description;
    }

    /**
     * Get Vietnamese question type name
     */
    getQuestionTypeName(type) {
        const typeNames = {
            'multiple_choice': 'Trắc nghiệm',
            'short_answer': 'Tự luận ngắn',
            'true_false': 'Đúng/Sai',
            'essay': 'Tự luận dài'
        };
        return typeNames[type] || type;
    }

    /**
     * Get Vietnamese difficulty name
     */
    getDifficultyName(difficulty) {
        const difficultyNames = {
            'easy': 'Dễ',
            'medium': 'Trung bình', 
            'hard': 'Khó'
        };
        return difficultyNames[difficulty] || difficulty;
    }

    /**
     * Generate instructions for the assignment
     */
    generateInstructions(questions, options) {
        const instructions = [
            "Hướng dẫn làm bài:",
            "1. Đọc kỹ nội dung tài liệu được cung cấp",
            "2. Trả lời tất cả các câu hỏi một cách đầy đủ và chính xác",
            "3. Đối với câu hỏi trắc nghiệm, chỉ chọn một đáp án đúng nhất",
            "4. Đối với câu hỏi tự luận, trình bày rõ ràng, logic và có căn cứ",
            ""
        ];

        // Add time estimates
        const totalTime = questions.reduce((sum, q) => sum + (q.estimated_time || 2), 0);
        instructions.push(`Thời gian làm bài dự kiến: ${totalTime} phút`);
        
        // Add scoring information
        const totalScore = 10;
        instructions.push(`Tổng điểm: ${totalScore} điểm`);

        return instructions.join('\n');
    }

    /**
     * Calculate total score for assignment
     */
    calculateTotalScore(questions) {
        const scoreMap = {
            'true_false': 1,
            'multiple_choice': 2,
            'short_answer': 3,
            'essay': 5
        };

        return questions.reduce((total, question) => {
            const baseScore = scoreMap[question.type] || 2;
            const difficultyMultiplier = question.difficulty === 'hard' ? 1.5 : 
                                       question.difficulty === 'easy' ? 0.8 : 1;
            return total + Math.round(baseScore * difficultyMultiplier);
        }, 0);
    }

    /**
     * Generate tags from processed data
     */
    generateTags(processedData) {
        const tags = ['ai-generated'];
        
        if (processedData.topics?.topics) {
            tags.push(...processedData.topics.topics.slice(0, 5));
        }
        
        if (processedData.topics?.nouns) {
            tags.push(...processedData.topics.nouns.slice(0, 3));
        }
        
        return [...new Set(tags)]; // Remove duplicates
    }

    /**
     * Store questions for the template (implement based on your database schema)
     */
    async storeTemplateQuestions(templateId, questions) {
        // This would store questions in a separate table
        // For now, we'll store them in the template's metadata or create a new table
        console.log(`📝 Storing ${questions.length} questions for template ${templateId}`);
        
        // You might want to create a separate table like 'template_questions'
        // or store them as JSON in the assignment_templates table
        return true;
    }

    /**
     * Generate final report
     */
    generateReport(log, template) {
        const totalTime = log.steps.reduce((sum, step) => sum + (step.duration || 0), 0);
        
        return {
            generation_id: `gen_${Date.now()}`,
            template_id: template.id,
            total_time_ms: totalTime,
            steps_completed: log.steps.filter(s => s.status === 'completed').length,
            steps_failed: log.steps.filter(s => s.status === 'failed').length,
            success_rate: `${((log.steps.filter(s => s.status === 'completed').length / log.steps.length) * 100).toFixed(1)}%`,
            performance: {
                parsing_time: log.steps.find(s => s.name === 'Document Parsing')?.duration || 0,
                preprocessing_time: log.steps.find(s => s.name === 'Text Preprocessing')?.duration || 0,
                generation_time: log.steps.find(s => s.name === 'Question Generation')?.duration || 0,
                postprocessing_time: log.steps.find(s => s.name === 'Post Processing')?.duration || 0,
                saving_time: log.steps.find(s => s.name === 'Save Template')?.duration || 0
            },
            generated_at: log.startTime,
            completed_at: new Date()
        };
    }
}

module.exports = AIAssignmentService;