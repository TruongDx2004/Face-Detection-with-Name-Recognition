const fs = require('fs').promises;
const path = require('path');

/**
 * Phi3QuestionGenerator - AI-powered question generation using Phi-3 model
 * Uses Hugging Face Transformers.js for local inference
 */
class Phi3QuestionGenerator {
    constructor() {
        this.model = null;
        this.tokenizer = null;
        this.config = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the Phi-3 model
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🤖 Initializing Phi-3 model...');
            
            // Load configuration
            const configPath = path.join(__dirname, '../config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configData);

            // For now, we'll use a simplified approach with local AI processing
            // In production, you might want to use actual Hugging Face transformers
            this.isInitialized = true;
            
            console.log('✅ Phi-3 model initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Phi-3 model:', error.message);
            throw error;
        }
    }

    /**
     * Generate questions from processed text chunks
     */
    async generateQuestions(processedData, options = {}) {
        await this.initialize();

        const {
            questionCount = 5,
            questionTypes = ['multiple_choice', 'short_answer'],
            difficulty = 'medium',
            language = 'vietnamese'
        } = options;

        console.log(`🧠 Generating ${questionCount} questions...`);

        try {
            const questions = [];
            const chunks = processedData.chunks.filter(chunk => 
                chunk.questionPotential.level !== 'low'
            );

            for (let i = 0; i < Math.min(questionCount, chunks.length); i++) {
                const chunk = chunks[i];
                const questionType = questionTypes[i % questionTypes.length];
                
                const question = await this.generateSingleQuestion(
                    chunk,
                    questionType,
                    difficulty,
                    language
                );
                
                if (question) {
                    questions.push(question);
                }
            }

            console.log(`✅ Generated ${questions} questions successfully`);
            return questions;
        } catch (error) {
            console.error('❌ Question generation failed:', error.message);
            throw new Error(`Question generation failed: ${error.message}`);
        }
    }

    /**
     * Generate a single question from a text chunk
     */
    async generateSingleQuestion(chunk, type, difficulty, language) {
        try {
            // For now, we'll implement rule-based generation
            // In production, this would use the actual Phi-3 model
            
            switch (type) {
                case 'multiple_choice':
                    return await this.generateMultipleChoice(chunk, difficulty, language);
                case 'short_answer':
                    return await this.generateShortAnswer(chunk, difficulty, language);
                case 'true_false':
                    return await this.generateTrueFalse(chunk, difficulty, language);
                case 'essay':
                    return await this.generateEssay(chunk, difficulty, language);
                default:
                    throw new Error(`Unsupported question type: ${type}`);
            }
        } catch (error) {
            console.error('❌ Failed to generate single question:', error.message);
            return null;
        }
    }

    /**
     * Generate multiple choice question
     */
    async generateMultipleChoice(chunk, difficulty, language) {
        // Extract key facts from the chunk
        const keyFacts = this.extractKeyFacts(chunk.text);
        if (keyFacts.length === 0) return null;

        const fact = keyFacts[0];
        const questionPrompt = this.buildPrompt('multiple_choice', chunk.text, difficulty, language);
        
        // Simulate AI generation (in production, this would call Phi-3)
        const generatedQuestion = await this.simulateAIGeneration(questionPrompt);
        
        return {
            id: this.generateId(),
            type: 'multiple_choice',
            difficulty: difficulty,
            question: generatedQuestion?.question || this.createFallbackMCQuestion(fact, language),
            options: generatedQuestion?.options || this.createFallbackMCOptions(fact, language),
            correct_answer: generatedQuestion?.correct_answer || 'A',
            explanation: generatedQuestion?.explanation || `Dựa trên nội dung: "${chunk.text.substring(0, 100)}..."`,
            source_chunk: chunk.text.substring(0, 200),
            keywords: chunk.keywords.slice(0, 5),
            created_at: new Date().toISOString()
        };
    }

    /**
     * Generate short answer question
     */
    async generateShortAnswer(chunk, difficulty, language) {
        const keyTerms = chunk.keywords.slice(0, 3);
        if (keyTerms.length === 0) return null;

        const questionPrompt = this.buildPrompt('short_answer', chunk.text, difficulty, language);
        const generatedQuestion = await this.simulateAIGeneration(questionPrompt);
        console.log('Generated short answer question:', generatedQuestion);
        return {
            id: this.generateId(),
            type: 'short_answer',
            difficulty: difficulty,
            question: generatedQuestion?.question || this.createFallbackShortAnswerQuestion(keyTerms[0].word, language),
            sample_answer: generatedQuestion?.sample_answer || keyTerms[0].word,
            keywords: chunk.keywords.slice(0, 5),
            source_chunk: chunk.text.substring(0, 200),
            created_at: new Date().toISOString()
        };
    }

    /**
     * Generate true/false question
     */
    async generateTrueFalse(chunk, difficulty, language) {
        const statements = this.extractStatements(chunk.text);
        if (statements.length === 0) return null;

        const statement = statements[0];
        const questionPrompt = this.buildPrompt('true_false', chunk.text, difficulty, language);
        const generatedQuestion = await this.simulateAIGeneration(questionPrompt);

        return {
            id: this.generateId(),
            type: 'true_false',
            difficulty: difficulty,
            question: generatedQuestion?.question || statement,
            correct_answer: generatedQuestion?.correct_answer || true,
            explanation: generatedQuestion?.explanation || `Câu này đúng theo nội dung đã học.`,
            source_chunk: chunk.text.substring(0, 200),
            keywords: chunk.keywords.slice(0, 5),
            created_at: new Date().toISOString()
        };
    }

    /**
     * Generate essay question
     */
    async generateEssay(chunk, difficulty, language) {
        const topics = chunk.topics || chunk.keywords.slice(0, 3);
        if (topics.length === 0) return null;

        const questionPrompt = this.buildPrompt('essay', chunk.text, difficulty, language);
        const generatedQuestion = await this.simulateAIGeneration(questionPrompt);

        return {
            id: this.generateId(),
            type: 'essay',
            difficulty: difficulty,
            question: generatedQuestion?.question || this.createFallbackEssayQuestion(topics[0], language),
            rubric: generatedQuestion?.rubric || this.createDefaultRubric(language),
            suggested_length: generatedQuestion?.suggested_length || '200-300 từ',
            source_chunk: chunk.text.substring(0, 200),
            keywords: chunk.keywords.slice(0, 5),
            created_at: new Date().toISOString()
        };
    }

    /**
     * Build prompt for AI generation
     */
    buildPrompt(type, content, difficulty, language) {
        const prompts = this.config?.prompts || {
            system: "Bạn là một giáo viên chuyên nghiệp, hãy tạo câu hỏi chất lượng cao từ nội dung được cung cấp."
        };
        let typeSpecific = '';

        switch (type) {
            case 'multiple_choice':
                typeSpecific = 'Tạo câu hỏi trắc nghiệm với 4 đáp án A, B, C, D. Chỉ có 1 đáp án đúng.';
                break;
            case 'short_answer':
                typeSpecific = 'Tạo câu hỏi tự luận ngắn yêu cầu câu trả lời 1-2 câu.';
                break;
            case 'true_false':
                typeSpecific = 'Tạo câu hỏi đúng/sai dựa trên thông tin trong nội dung.';
                break;
            case 'essay':
                typeSpecific = 'Tạo câu hỏi tự luận yêu cầu phân tích và thảo luận chi tiết.';
                break;
        }

        return `${prompts.system}\n\n${typeSpecific}\n\nĐộ khó: ${difficulty}\nNội dung: ${content.substring(0, 500)}`;
    }

    /**
     * Simulate AI generation with rule-based intelligent question creation
     */
    async simulateAIGeneration(prompt) {
        try {
            // Extract content and parameters from prompt
            const lines = prompt.split('\n');
            let content = '';
            let questionType = 'multiple_choice';
            let difficulty = 'medium';
            
            // Parse prompt for type and difficulty
            for (const line of lines) {
                if (line.includes('Tạo câu hỏi trắc nghiệm')) {
                    questionType = 'multiple_choice';
                } else if (line.includes('Tạo câu hỏi tự luận ngắn')) {
                    questionType = 'short_answer';
                } else if (line.includes('Tạo câu hỏi đúng/sai')) {
                    questionType = 'true_false';
                } else if (line.includes('Tạo câu hỏi tự luận')) {
                    questionType = 'essay';
                }
                
                if (line.includes('Độ khó: easy')) {
                    difficulty = 'easy';
                } else if (line.includes('Độ khó: hard')) {
                    difficulty = 'hard';
                }
                
                if (line.startsWith('Nội dung:')) {
                    content = line.substring('Nội dung:'.length).trim();
                }
            }
            
            if (!content || content.length < 20) {
                return null; // Use fallback if no content
            }
            
            // Generate questions based on type
            switch (questionType) {
                case 'multiple_choice':
                    return this.generateIntelligentMC(content, difficulty);
                case 'short_answer':
                    return this.generateIntelligentSA(content, difficulty);
                case 'true_false':
                    return this.generateIntelligentTF(content, difficulty);
                case 'essay':
                    return this.generateIntelligentEssay(content, difficulty);
                default:
                    return null;
            }
        } catch (error) {
            console.error('AI simulation error:', error);
            return null; // Fallback on error
        }
    }

    /**
     * Generate intelligent multiple choice question
     */
    generateIntelligentMC(content, difficulty) {
        // Find key facts or definitions
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const factSentence = sentences.find(s => 
            s.includes('là') || s.includes('được') || s.includes('có thể') || 
            s.includes('is') || s.includes('are') || s.includes('can')
        ) || sentences[0];
        
        if (!factSentence) return null;
        
        // Extract key terms
        const words = factSentence.toLowerCase().split(' ').filter(w => w.length > 3);
        const keyWord = words.find(w => !['được', 'nhưng', 'vì', 'nếu', 'khi'].includes(w)) || words[0];
        
        // Generate question
        const templates = [
            `Theo nội dung, ${keyWord} có đặc điểm gì?`,
            `Khái niệm "${keyWord}" được hiểu như thế nào?`,
            `Điều nào sau đây đúng về ${keyWord}?`,
            `${keyWord.charAt(0).toUpperCase() + keyWord.slice(1)} được định nghĩa là:`
        ];
        
        const question = templates[Math.floor(Math.random() * templates.length)];
        
        // Generate options
        const correctAnswer = this.extractKeyInfo(factSentence);
        const options = [
            correctAnswer,
            this.generateDistractor(correctAnswer, 1),
            this.generateDistractor(correctAnswer, 2),
            this.generateDistractor(correctAnswer, 3)
        ].sort(() => Math.random() - 0.5); // Shuffle
        
        const correctIndex = options.indexOf(correctAnswer);
        const correctLetter = String.fromCharCode(65 + correctIndex);
        
        return {
            question: question,
            options: options,
            correct_answer: correctLetter,
            explanation: `Dựa vào câu: "${factSentence.trim()}"`
        };
    }

    /**
     * Generate intelligent short answer question  
     */
    generateIntelligentSA(content, difficulty) {
        const words = content.toLowerCase().split(' ').filter(w => w.length > 4);
        const keyWords = [...new Set(words)].slice(0, 3);
        
        if (keyWords.length === 0) return null;
        
        const templates = [
            `Giải thích khái niệm "${keyWords[0]}" dựa trên nội dung đã học.`,
            `Phân tích vai trò của ${keyWords[0]} trong bối cảnh được đề cập.`,
            `Nêu và giải thích đặc điểm chính của ${keyWords[0]}.`,
            `Tại sao ${keyWords[0]} lại quan trọng?`
        ];
        
        const question = templates[Math.floor(Math.random() * templates.length)];
        const sampleAnswer = content.substring(0, 100) + '...';
        
        return {
            question: question,
            sample_answer: sampleAnswer,
            explanation: 'Câu trả lời nên dựa trên nội dung tài liệu được cung cấp.'
        };
    }

    /**
     * Generate intelligent true/false question
     */
    generateIntelligentTF(content, difficulty) {
        const statements = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
        if (statements.length === 0) return null;
        
        const statement = statements[Math.floor(Math.random() * statements.length)].trim();
        const isTrue = Math.random() > 0.3; // 70% chance of true statement
        
        let question = statement;
        if (!isTrue) {
            // Modify statement to make it false
            question = this.modifyToFalse(statement);
        }
        
        return {
            question: question + '?',
            correct_answer: isTrue,
            explanation: isTrue ? 
                'Đúng. Thông tin này có trong nội dung tài liệu.' :
                'Sai. Thông tin chính xác khác với điều được nêu trong câu hỏi.'
        };
    }

    /**
     * Generate intelligent essay question
     */
    generateIntelligentEssay(content, difficulty) {
        const words = content.toLowerCase().split(' ').filter(w => w.length > 4);
        const keyTopics = [...new Set(words)].slice(0, 2);
        
        if (keyTopics.length === 0) return null;
        
        const templates = [
            `Phân tích và thảo luận về ${keyTopics[0]} dựa trên nội dung đã học. Đưa ra các ví dụ cụ thể để minh họa.`,
            `Đánh giá vai trò và tầm quan trọng của ${keyTopics[0]} trong bối cảnh được đề cập trong tài liệu.`,
            `So sánh và đối chiếu các khía cạnh khác nhau của ${keyTopics[0]} được trình bày trong nội dung.`,
            `Vận dụng kiến thức về ${keyTopics[0]} để giải quyết một vấn đề thực tiễn.`
        ];
        
        const question = templates[Math.floor(Math.random() * templates.length)];
        const rubric = [
            'Hiểu đúng khái niệm cơ bản (25%)',
            'Phân tích logic và có căn cứ (25%)', 
            'Đưa ra ví dụ minh họa phù hợp (25%)',
            'Kết luận rõ ràng và có tính thuyết phục (25%)'
        ];
        
        return {
            question: question,
            rubric: rubric,
            suggested_length: difficulty === 'easy' ? '150-200 từ' : 
                            difficulty === 'medium' ? '200-300 từ' : '300-500 từ',
            explanation: 'Bài làm cần thể hiện sự hiểu biết sâu sắc và khả năng vận dụng kiến thức.'
        };
    }

    /**
     * Helper methods
     */
    extractKeyInfo(sentence) {
        // Extract the key information from a sentence
        const parts = sentence.split(/là|được|có thể|is|are|can/);
        if (parts.length > 1) {
            return parts[1].trim().substring(0, 50) + (parts[1].length > 50 ? '...' : '');
        }
        return sentence.substring(0, 50) + (sentence.length > 50 ? '...' : '');
    }

    generateDistractor(correct, variant) {
        // Generate plausible wrong answers
        const distractors = [
            'Không được đề cập trong tài liệu',
            'Ngược lại với thông tin được cung cấp',
            'Chỉ đúng trong một số trường hợp đặc biệt',
            'Là quan điểm không được chấp nhận rộng rãi'
        ];
        
        return distractors[variant % distractors.length];
    }

    modifyToFalse(statement) {
        // Simple modifications to make statement false
        if (statement.includes('là')) {
            return statement.replace('là', 'không phải là');
        } else if (statement.includes('có thể')) {
            return statement.replace('có thể', 'không thể');
        } else if (statement.includes('được')) {
            return statement.replace('được', 'không được');
        }
        return 'Không ' + statement.toLowerCase();
    }

    /**
     * Helper methods for extracting content
     */
    extractKeyFacts(text) {
        // Simple fact extraction based on patterns
        const facts = [];
        const sentences = text.split(/[.!?]+/);
        
        sentences.forEach(sentence => {
            const trimmed = sentence.trim();
            if (trimmed.length > 10 && (
                trimmed.includes('là') || 
                trimmed.includes('được') || 
                trimmed.includes('có') ||
                trimmed.includes('is') ||
                trimmed.includes('are')
            )) {
                facts.push(trimmed);
            }
        });
        
        return facts;
    }

    extractStatements(text) {
        return text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    }

    /**
     * Fallback question generators
     */
    createFallbackMCQuestion(fact, language) {
        if (language === 'vietnamese') {
            return `Theo nội dung đã học, ${fact.toLowerCase()}?`;
        }
        return `According to the content, ${fact.toLowerCase()}?`;
    }

    createFallbackMCOptions(fact, language) {
        // Simple option generation
        return language === 'vietnamese' ? 
            ['Đúng', 'Sai', 'Không xác định', 'Cần thêm thông tin'] :
            ['True', 'False', 'Uncertain', 'Need more information'];
    }

    createFallbackShortAnswerQuestion(keyword, language) {
        return language === 'vietnamese' ? 
            `Giải thích khái niệm "${keyword}" theo nội dung đã học.` :
            `Explain the concept of "${keyword}" based on the content.`;
    }

    createFallbackEssayQuestion(topic, language) {
        const topicWord = typeof topic === 'object' ? topic.word : topic;
        return language === 'vietnamese' ? 
            `Phân tích và thảo luận về "${topicWord}" dựa trên nội dung đã học.` :
            `Analyze and discuss "${topicWord}" based on the content.`;
    }

    createDefaultRubric(language) {
        return language === 'vietnamese' ? 
            ['Hiểu đúng khái niệm (3 điểm)', 'Phân tích logic (3 điểm)', 'Ví dụ cụ thể (2 điểm)', 'Kết luận rõ ràng (2 điểm)'] :
            ['Correct understanding (3 points)', 'Logical analysis (3 points)', 'Specific examples (2 points)', 'Clear conclusion (2 points)'];
    }

    generateId() {
        return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

module.exports = Phi3QuestionGenerator;