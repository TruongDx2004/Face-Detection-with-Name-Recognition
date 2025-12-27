const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const mime = require('mime-types');

/**
 * DocumentParser - Handles parsing of various document formats
 * Supports: PDF, DOCX, TXT, XLSX
 */
class DocumentParser {
    constructor() {
        this.supportedFormats = ['pdf', 'docx', 'txt', 'xlsx', 'xls'];
    }

    /**
     * Parse document based on file type
     * @param {string} filePath - Path to the document
     * @returns {Promise<{text: string, metadata: object}>}
     */
    async parseDocument(filePath) {
        try {
            const fileExtension = path.extname(filePath).toLowerCase().slice(1);
            const mimeType = mime.lookup(filePath);
            
            console.log(`📄 Parsing document: ${filePath} (${fileExtension})`);

            switch (fileExtension) {
                case 'pdf':
                    return await this.parsePDF(filePath);
                case 'docx':
                    return await this.parseDOCX(filePath);
                case 'txt':
                    return await this.parseTXT(filePath);
                case 'xlsx':
                case 'xls':
                    return await this.parseExcel(filePath);
                default:
                    throw new Error(`Unsupported file format: ${fileExtension}`);
            }
        } catch (error) {
            console.error('❌ Document parsing failed:', error.message);
            throw new Error(`Failed to parse document: ${error.message}`);
        }
    }

    /**
     * Parse PDF document
     */
    async parsePDF(filePath) {
        const fileBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(fileBuffer);
        
        return {
            text: pdfData.text,
            metadata: {
                pages: pdfData.numpages,
                info: pdfData.info,
                format: 'pdf'
            }
        };
    }

    /**
     * Parse DOCX document
     */
    async parseDOCX(filePath) {
        const fileBuffer = await fs.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        
        return {
            text: result.value,
            metadata: {
                format: 'docx',
                warnings: result.messages
            }
        };
    }

    /**
     * Parse TXT document
     */
    async parseTXT(filePath) {
        const text = await fs.readFile(filePath, 'utf8');
        
        return {
            text: text,
            metadata: {
                format: 'txt',
                encoding: 'utf8'
            }
        };
    }

    /**
     * Parse Excel document
     */
    async parseExcel(filePath) {
        const workbook = XLSX.readFile(filePath);
        const sheetNames = workbook.SheetNames;
        let allText = '';
        
        sheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            jsonData.forEach(row => {
                if (row.length > 0) {
                    allText += row.join(' | ') + '\n';
                }
            });
            allText += '\n--- End of Sheet: ' + sheetName + ' ---\n\n';
        });
        
        return {
            text: allText,
            metadata: {
                format: 'excel',
                sheets: sheetNames,
                totalSheets: sheetNames.length
            }
        };
    }

    /**
     * Validate file format
     */
    isSupported(filePath) {
        const extension = path.extname(filePath).toLowerCase().slice(1);
        return this.supportedFormats.includes(extension);
    }

    /**
     * Get file size in MB
     */
    async getFileSize(filePath) {
        const stats = await fs.stat(filePath);
        return stats.size / (1024 * 1024); // Convert to MB
    }

    /**
     * Validate file before parsing
     */
    async validateFile(filePath, maxSizeMB = 10) {
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            throw new Error('File does not exist');
        }

        // Check file format
        if (!this.isSupported(filePath)) {
            throw new Error(`Unsupported file format. Supported: ${this.supportedFormats.join(', ')}`);
        }

        // Check file size
        const fileSize = await this.getFileSize(filePath);
        if (fileSize > maxSizeMB) {
            throw new Error(`File too large: ${fileSize.toFixed(2)}MB. Max allowed: ${maxSizeMB}MB`);
        }

        return true;
    }
}

module.exports = DocumentParser;