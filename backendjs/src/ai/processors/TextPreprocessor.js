const natural = require('natural');
const compromise = require('compromise');

/**
 * TextPreprocessor - Handles text preprocessing for AI question generation
 */
class TextPreprocessor {
    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        this.stopwords = new Set([
            'và', 'của', 'là', 'có', 'trong', 'được', 'một', 'cho', 'với', 'đã', 'các', 'này', 'đó', 'để', 'sẽ',
            'không', 'từ', 'như', 'về', 'theo', 'sau', 'trước', 'khi', 'nếu', 'hoặc', 'nhưng', 'mà', 'do', 'vì',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'
        ]);
    }

    /**
     * Main preprocessing method
     * @param {string} text - Raw text from document
     * @param {object} options - Processing options
     * @returns {object} Processed text data
     */
    async preprocessText(text, options = {}) {
        console.log('🔄 Starting text preprocessing...');
        
        try {
            // 1. Clean and normalize text
            const cleanedText = this.cleanText(text);
            
            // 2. Split into chunks
            const chunks = this.splitIntoChunks(cleanedText, options.chunkSize || 1000);
            
            // 3. Extract key information from each chunk
            const processedChunks = chunks.map(chunk => this.processChunk(chunk));
            
            // 4. Extract overall document structure
            const documentStructure = this.extractDocumentStructure(cleanedText);
            
            // 5. Identify key concepts and topics
            const keyTopics = this.extractKeyTopics(cleanedText);
            
            const result = {
                originalText: text,
                cleanedText: cleanedText,
                chunks: processedChunks,
                structure: documentStructure,
                topics: keyTopics,
                statistics: this.getTextStatistics(cleanedText)
            };
            
            console.log(`✅ Text preprocessing completed. ${chunks.length} chunks created.`);
            return result;
            
        } catch (error) {
            console.error('❌ Text preprocessing failed:', error.message);
            throw new Error(`Text preprocessing failed: ${error.message}`);
        }
    }

    /**
     * Clean and normalize text
     */
    cleanText(text) {
        // Remove excessive whitespace and normalize
        let cleaned = text
            .replace(/\s+/g, ' ')  // Multiple spaces to single space
            .replace(/\n\s*\n/g, '\n\n')  // Multiple newlines to double newline
            .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF.,!?;:()\[\]"'-]/g, '')  // Keep Vietnamese characters
            .trim();
        
        return cleaned;
    }

    /**
     * Split text into manageable chunks
     */
    splitIntoChunks(text, maxChunkSize = 1000) {
        const sentences = text.split(/[.!?]+/);
        const chunks = [];
        let currentChunk = '';
        
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;
            
            if ((currentChunk + trimmedSentence).length <= maxChunkSize) {
                currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk + '.');
                }
                currentChunk = trimmedSentence;
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk + '.');
        }
        
        return chunks;
    }

    /**
     * Process individual chunk
     */
    processChunk(chunk) {
        const doc = compromise(chunk);
        
        return {
            text: chunk,
            sentences: chunk.split(/[.!?]+/).filter(s => s.trim()),
            keywords: this.extractKeywords(chunk),
            entities: {
                people: doc.people().out('array'),
                places: doc.places().out('array'),
                organizations: doc.organizations().out('array'),
                topics: doc.topics().out('array')
            },
            difficulty: this.estimateDifficulty(chunk),
            questionPotential: this.assessQuestionPotential(chunk)
        };
    }

    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        const tokens = this.tokenizer.tokenize(text.toLowerCase());
        const filteredTokens = tokens.filter(token => 
            token.length > 2 && 
            !this.stopwords.has(token) &&
            /^[a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+$/.test(token)
        );
        
        // Calculate word frequency
        const wordFreq = {};
        filteredTokens.forEach(token => {
            wordFreq[token] = (wordFreq[token] || 0) + 1;
        });
        
        // Sort by frequency and return top keywords
        return Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word, freq]) => ({ word, frequency: freq }));
    }

    /**
     * Extract document structure
     */
    extractDocumentStructure(text) {
        const lines = text.split('\n');
        const structure = {
            headers: [],
            sections: [],
            lists: [],
            tables: []
        };
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            // Detect headers (lines that are short and followed by content)
            if (trimmed.length < 100 && trimmed.length > 5) {
                if (lines[index + 1] && lines[index + 1].trim().length > 50) {
                    structure.headers.push({ text: trimmed, line: index });
                }
            }
            
            // Detect lists
            if (/^[-*•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
                structure.lists.push({ text: trimmed, line: index });
            }
            
            // Detect tables (simple detection by | or tab characters)
            if (trimmed.includes('|') || trimmed.includes('\t')) {
                structure.tables.push({ text: trimmed, line: index });
            }
        });
        
        return structure;
    }

    /**
     * Extract key topics using simple NLP
     */
    extractKeyTopics(text) {
        const doc = compromise(text);
        
        return {
            nouns: doc.nouns().out('array').slice(0, 20),
            verbs: doc.verbs().out('array').slice(0, 10),
            adjectives: doc.adjectives().out('array').slice(0, 10),
            topics: doc.topics().out('array').slice(0, 15)
        };
    }

    /**
     * Estimate text difficulty
     */
    estimateDifficulty(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        const words = this.tokenizer.tokenize(text);
        
        const avgSentenceLength = words.length / sentences.length;
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        
        // Simple difficulty scoring
        let score = 0;
        if (avgSentenceLength > 20) score += 1;
        if (avgWordLength > 6) score += 1;
        if (text.includes('therefore') || text.includes('however') || text.includes('consequently')) score += 1;
        
        const levels = ['easy', 'medium', 'hard'];
        return levels[Math.min(score, 2)];
    }

    /**
     * Assess potential for question generation
     */
    assessQuestionPotential(chunk) {
        let score = 0;
        
        // Check for factual content
        if (/\d+/.test(chunk)) score += 1;  // Contains numbers
        if (/is|are|was|were|là|được/.test(chunk)) score += 1;  // Contains definitions
        if (chunk.includes('because') || chunk.includes('vì')) score += 1;  // Contains reasoning
        if (chunk.split('.').length > 2) score += 1;  // Multiple sentences
        
        return {
            score: score,
            level: score >= 3 ? 'high' : score >= 2 ? 'medium' : 'low'
        };
    }

    /**
     * Get text statistics
     */
    getTextStatistics(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        const words = this.tokenizer.tokenize(text);
        const characters = text.length;
        
        return {
            characters,
            words: words.length,
            sentences: sentences.length,
            avgWordsPerSentence: Math.round(words.length / sentences.length),
            readingTime: Math.ceil(words.length / 200) // Assuming 200 words per minute
        };
    }
}

module.exports = TextPreprocessor;