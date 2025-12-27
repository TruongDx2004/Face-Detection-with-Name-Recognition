# AI Assignment Generation System

## Overview
This system uses phi-3 model to automatically generate assignment questions from uploaded documents.

## Features
- Document parsing (PDF, DOCX, TXT, XLSX)
- Intelligent text preprocessing
- Multiple question types generation
- Vietnamese language support
- Quality validation and post-processing

## API Endpoints
- POST /api/ai/generate-assignment - Generate full assignment
- POST /api/ai/preview-questions - Preview questions
- GET /api/ai/capabilities - Get system capabilities
- GET /api/ai/stats - Get generation statistics

## Usage
1. Upload a document through the teacher interface
2. Configure generation settings (question types, difficulty, count)
3. Preview sample questions (optional)
4. Generate full assignment template

## Configuration
Edit src/ai/config.json to customize:
- Model parameters
- Question types and limits
- Language settings
- Processing options

## Troubleshooting
- Ensure phi-3 model is properly configured
- Check document format and size limits
- Verify database migrations are applied
- Monitor logs in logs/ai-generation/

Generated: 2025-12-27T13:08:45.801Z
