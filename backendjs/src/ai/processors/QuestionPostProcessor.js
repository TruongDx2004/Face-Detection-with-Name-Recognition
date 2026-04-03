/**
 * QuestionPostProcessor - Post-processing and validation for generated questions
 */
class QuestionPostProcessor {
    constructor() {
        this.validationRules = {
            question: {
                minLength: 10,
                maxLength: 500,
                required: true
            },
            options: {
                minCount: 2,
                maxCount: 6,
                maxLength: 200
            },
            answer: {
                required: true
            }
        };
    }

    /**
     * Process and validate generated questions
     */
    async processQuestions(questions, options = {}) {
        console.log(`🔍 Post-processing ${questions.length} questions...`);
        
        try {
            const processedQuestions = [];
            
            for (const question of questions) {
                const processed = await this.processSingleQuestion(question, options);
                if (processed) {
                    processedQuestions.push(processed);
                }
            }
            
            // Remove duplicates
            const uniqueQuestions = this.removeDuplicates(processedQuestions);
            
            // Sort by difficulty and type
            const sortedQuestions = this.sortQuestions(uniqueQuestions);
            
            console.log(`✅ Post-processing completed. ${sortedQuestions.length} valid questions.`);
            return sortedQuestions;
            
        } catch (error) {
            console.error('❌ Post-processing failed:', error.message);
            throw new Error(`Post-processing failed: ${error.message}`);
        }
    }

    /**
     * Process a single question
     */
    async processSingleQuestion(question, options) {
        try {
            // Validate question structure
            if (!this.validateQuestion(question)) {
                console.warn(`⚠️ Invalid question skipped: ${question.id}`);
                return null;
            }

            // Clean and format question text
            const cleanedQuestion = this.cleanQuestionText(question);
            
            // Add metadata
            const enrichedQuestion = this.addMetadata(cleanedQuestion, options);
            
            // Format for database storage
            const formattedQuestion = this.formatForDatabase(enrichedQuestion);
            
            return formattedQuestion;
            
        } catch (error) {
            console.error(`❌ Error processing question ${question.id}:`, error.message);
            return null;
        }
    }

    /**
     * Validate question structure and content
     */
    validateQuestion(question) {
        // Check required fields
        if (!question.question || !question.type) {
            return false;
        }

        // Validate question text
        const questionText = question.question.trim();
        if (questionText.length < this.validationRules.question.minLength || 
            questionText.length > this.validationRules.question.maxLength) {
            return false;
        }

        // Type-specific validation
        switch (question.type) {
            case 'multiple_choice':
                return this.validateMultipleChoice(question);
            case 'short_answer':
                return this.validateShortAnswer(question);
            case 'true_false':
                return this.validateTrueFalse(question);
            case 'essay':
                return this.validateEssay(question);
            default:
                return false;
        }
    }

    /**
     * Validate multiple choice question
     */
    validateMultipleChoice(question) {
        if (!question.options || !Array.isArray(question.options)) {
            return false;
        }

        if (question.options.length < this.validationRules.options.minCount || 
            question.options.length > this.validationRules.options.maxCount) {
            return false;
        }

        // Check if all options are valid
        for (const option of question.options) {
            if (!option || typeof option !== 'string' || option.trim().length === 0) {
                return false;
            }
        }

        // Check correct answer
        if (!question.correct_answer) {
            return false;
        }

        return true;
    }

    /**
     * Validate short answer question
     */
    validateShortAnswer(question) {
        return question.sample_answer && question.sample_answer.trim().length > 0;
    }

    /**
     * Validate true/false question
     */
    validateTrueFalse(question) {
        return typeof question.correct_answer === 'boolean';
    }

    /**
     * Validate essay question
     */
    validateEssay(question) {
        return question.rubric && Array.isArray(question.rubric) && question.rubric.length > 0;
    }

    /**
     * Clean and format question text
     */
    cleanQuestionText(question) {
        const cleaned = { ...question };
        
        // Clean question text
        cleaned.question = this.cleanText(question.question);
        
        // Clean options for multiple choice
        if (question.type === 'multiple_choice' && question.options) {
            cleaned.options = question.options.map(option => this.cleanText(option));
        }
        
        // Clean other text fields
        if (question.explanation) {
            cleaned.explanation = this.cleanText(question.explanation);
        }
        
        if (question.sample_answer) {
            cleaned.sample_answer = this.cleanText(question.sample_answer);
        }
        
        return cleaned;
    }

    /**
     * Clean individual text
     */
    cleanText(text) {
        return text
            .trim()
            .replace(/\s+/g, ' ')  // Multiple spaces to single space
            .replace(/[""]/g, '"') // Normalize quotes
            .replace(/['']/g, "'") // Normalize apostrophes
            .replace(/…/g, '...'); // Normalize ellipsis
    }

    /**
     * Add metadata to question
     */
    addMetadata(question, options) {
        const enhanced = { ...question };
        
        // Add processing metadata
        enhanced.processed_at = new Date().toISOString();
        enhanced.ai_generated = true;
        enhanced.version = '1.0';
        
        // Add subject/topic if provided
        if (options.subject_id) {
            enhanced.subject_id = options.subject_id;
        }
        
        if (options.topic) {
            enhanced.topic = options.topic;
        }
        
        // Calculate complexity score
        enhanced.complexity_score = this.calculateComplexityScore(question);
        
        // Add estimated time to answer
        enhanced.estimated_time = this.estimateAnswerTime(question);
        
        return enhanced;
    }

    /**
     * Calculate question complexity score
     */
    calculateComplexityScore(question) {
        let score = 0;
        
        // Base score by type
        switch (question.type) {
            case 'true_false': score += 1; break;
            case 'multiple_choice': score += 2; break;
            case 'short_answer': score += 3; break;
            case 'essay': score += 4; break;
        }
        
        // Adjust by difficulty
        switch (question.difficulty) {
            case 'easy': score += 0; break;
            case 'medium': score += 1; break;
            case 'hard': score += 2; break;
        }
        
        // Adjust by question length
        const questionLength = question.question.length;
        if (questionLength > 100) score += 1;
        if (questionLength > 200) score += 1;
        
        return Math.min(score, 10); // Cap at 10
    }

    /**
     * Estimate time to answer question
     */
    estimateAnswerTime(question) {
        let minutes = 0;
        
        switch (question.type) {
            case 'true_false':
                minutes = 1;
                break;
            case 'multiple_choice':
                minutes = 2;
                break;
            case 'short_answer':
                minutes = 5;
                break;
            case 'essay':
                minutes = 15;
                break;
        }
        
        // Adjust by difficulty
        if (question.difficulty === 'hard') {
            minutes *= 1.5;
        } else if (question.difficulty === 'easy') {
            minutes *= 0.8;
        }
        
        return Math.ceil(minutes);
    }

    /**
     * Format question for database storage
     */
    formatForDatabase(question) {
        const dbFormat = {
            id: question.id,
            type: question.type,
            difficulty: question.difficulty,
            question: question.question,
            correct_answer: question.correct_answer,
            explanation: question.explanation || '',
            source_chunk: question.source_chunk || '',
            keywords: JSON.stringify(question.keywords || []),
            ai_generated: question.ai_generated || false,
            complexity_score: question.complexity_score || 1,
            estimated_time: question.estimated_time || 2,
            created_at: question.created_at || new Date().toISOString()
        };
        
        // Add type-specific fields
        switch (question.type) {
            case 'multiple_choice':
                dbFormat.options = JSON.stringify(question.options || []);
                break;
            case 'short_answer':
                dbFormat.sample_answer = question.sample_answer || '';
                break;
            case 'essay':
                dbFormat.rubric = JSON.stringify(question.rubric || []);
                dbFormat.suggested_length = question.suggested_length || '';
                break;
        }
        
        return dbFormat;
    }

    /**
     * Remove duplicate questions
     */
    removeDuplicates(questions) {
        const seen = new Set();
        const unique = [];
        
        for (const question of questions) {
            const key = this.generateQuestionKey(question);
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(question);
            }
        }
        
        return unique;
    }

    /**
     * Generate unique key for question deduplication
     */
    generateQuestionKey(question) {
        const normalizedQuestion = question.question
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        return `${question.type}_${normalizedQuestion.substring(0, 50)}`;
    }

    /**
     * Sort questions by difficulty and type
     */
    sortQuestions(questions) {
        const typeOrder = { 'true_false': 1, 'multiple_choice': 2, 'short_answer': 3, 'essay': 4 };
        const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
        
        return questions.sort((a, b) => {
            // First sort by difficulty
            const diffA = difficultyOrder[a.difficulty] || 2;
            const diffB = difficultyOrder[b.difficulty] || 2;
            
            if (diffA !== diffB) {
                return diffA - diffB;
            }
            
            // Then sort by type
            const typeA = typeOrder[a.type] || 5;
            const typeB = typeOrder[b.type] || 5;
            
            return typeA - typeB;
        });
    }

    /**
     * Generate quality report
     */
    generateQualityReport(originalCount, finalCount, questions) {
        const report = {
            original_count: originalCount,
            final_count: finalCount,
            success_rate: ((finalCount / originalCount) * 100).toFixed(2) + '%',
            types: {},
            difficulties: {},
            avg_complexity: 0
        };
        
        // Count by type and difficulty
        questions.forEach(q => {
            report.types[q.type] = (report.types[q.type] || 0) + 1;
            report.difficulties[q.difficulty] = (report.difficulties[q.difficulty] || 0) + 1;
            report.avg_complexity += q.complexity_score || 1;
        });
        
        report.avg_complexity = (report.avg_complexity / finalCount).toFixed(2);
        
        return report;
    }
}

module.exports = QuestionPostProcessor;