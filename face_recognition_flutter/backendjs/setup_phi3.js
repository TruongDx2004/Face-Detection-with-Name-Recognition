#!/usr/bin/env node

/**
 * Phi-3 Setup Script for AI Assignment Generation
 * This script sets up the phi-3 model for automatic assignment generation
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function setupPhi3() {
    console.log('🚀 Starting Phi-3 setup for AI Assignment Generation...');
    
    try {
        // 1. Create directories
        const dirs = [
            'src/ai',
            'src/ai/models',
            'src/ai/parsers',
            'src/ai/processors',
            'uploads/documents'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
            console.log(`✅ Created directory: ${dir}`);
        }
        
        // 2. Install required packages
        console.log('📦 Installing required packages...');
        const packages = [
            '@huggingface/transformers',
            'mammoth',           // For .docx files
            'pdf-parse',         // For PDF files
            'xlsx',              // For Excel files
            'natural',           // NLP processing
            'compromise',        // Text analysis
            'multer',            // File upload (already installed)
            'mime-types'         // File type detection
        ];
        
        execSync(`npm install ${packages.join(' ')}`, { stdio: 'inherit' });
        console.log('✅ Packages installed successfully');
        
        // 3. Create configuration
        const config = {
            phi3: {
                model: 'microsoft/Phi-3-mini-4k-instruct',
                maxTokens: 2048,
                temperature: 0.7,
                topP: 0.9
            },
            parsers: {
                maxFileSize: '10MB',
                supportedFormats: ['pdf', 'docx', 'txt', 'xlsx'],
                chunkSize: 1000
            },
            generation: {
                maxQuestions: 20,
                questionTypes: ['multiple_choice', 'short_answer', 'essay', 'true_false'],
                difficultyLevels: ['easy', 'medium', 'hard']
            }
        };
        
        await fs.writeFile('src/ai/config.json', JSON.stringify(config, null, 2));
        console.log('✅ AI configuration created');
        
        console.log('🎉 Phi-3 setup completed successfully!');
        console.log('📋 Next steps:');
        console.log('  1. Download phi-3 model weights (will be done automatically on first run)');
        console.log('  2. Test document parsing with sample files');
        console.log('  3. Test question generation');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    setupPhi3();
}

module.exports = { setupPhi3 };