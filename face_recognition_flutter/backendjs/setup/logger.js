/**
 * Logger module for setup script
 * 
 * Provides consistent logging functionality with colors and formatting
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m'
};

// Log levels
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

class SetupLogger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logToFile = process.env.LOG_TO_FILE === 'true';
        this.logDir = 'logs';
        this.logFile = path.join(this.logDir, 'setup.log');
        this.startTime = Date.now();
        
        // Create logs directory if logging to file
        if (this.logToFile) {
            this.ensureLogDir();
        }
    }

    ensureLogDir() {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
        } catch (error) {
            console.warn(`Could not create log directory: ${error.message}`);
            this.logToFile = false;
        }
    }

    formatTime() {
        return new Date().toISOString();
    }

    getElapsedTime() {
        const elapsed = Date.now() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    }

    writeToFile(level, message) {
        if (!this.logToFile) return;
        
        try {
            const timestamp = this.formatTime();
            const logEntry = `[${timestamp}] [${level}] ${message}\n`;
            fs.appendFileSync(this.logFile, logEntry);
        } catch (error) {
            // Silently fail file logging
        }
    }

    log(level, message, color = colors.reset) {
        const timestamp = this.formatTime();
        const elapsed = this.getElapsedTime();
        const formattedMessage = `${color}${message}${colors.reset}`;
        
        console.log(formattedMessage);
        
        // Log to file without colors
        this.writeToFile(level, message);
    }

    // Main logging methods
    printHeader(title) {
        const separator = '='.repeat(60);
        const padding = Math.max(0, Math.floor((60 - title.length) / 2));
        const centeredTitle = ' '.repeat(padding) + title;
        
        console.log(`\n${colors.bright}${colors.cyan}${separator}${colors.reset}`);
        console.log(`${colors.bright}${colors.cyan}${centeredTitle}${colors.reset}`);
        console.log(`${colors.bright}${colors.cyan}${separator}${colors.reset}\n`);
        
        this.writeToFile('INFO', `=== ${title} ===`);
    }

    printStep(stepName) {
        const separator = '='.repeat(50);
        const elapsed = this.getElapsedTime();
        
        console.log(`\n${colors.blue}${separator}${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}🔄 ${stepName} (${elapsed})${colors.reset}`);
        console.log(`${colors.blue}${separator}${colors.reset}`);
        
        this.writeToFile('INFO', `STEP: ${stepName} (${elapsed})`);
    }

    printSuccess(message) {
        this.log('INFO', `✅ ${message}`, colors.green);
    }

    printError(message) {
        this.log('ERROR', `❌ ${message}`, colors.red);
    }

    printWarning(message) {
        this.log('WARN', `⚠️ ${message}`, colors.yellow);
    }

    printInfo(message) {
        this.log('INFO', `ℹ️ ${message}`, colors.cyan);
    }

    printDebug(message) {
        if (this.logLevel === 'debug' || process.env.DEBUG === 'true') {
            this.log('DEBUG', `🐛 ${message}`, colors.dim);
        }
    }

    printProgress(current, total, message = '') {
        const percentage = Math.round((current / total) * 100);
        const progressBar = this.createProgressBar(percentage);
        const progressMessage = `${progressBar} ${percentage}% ${message}`;
        
        // Use carriage return to overwrite the same line
        process.stdout.write(`\r${colors.cyan}${progressMessage}${colors.reset}`);
        
        if (current === total) {
            console.log(); // New line when complete
        }
    }

    createProgressBar(percentage, width = 30) {
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        return `[${bar}]`;
    }

    printTable(data, headers = null) {
        if (!Array.isArray(data) || data.length === 0) {
            this.printInfo('No data to display');
            return;
        }

        // Auto-detect headers if not provided
        if (!headers && typeof data[0] === 'object') {
            headers = Object.keys(data[0]);
        }

        if (!headers) {
            console.table(data);
            return;
        }

        // Calculate column widths
        const columnWidths = headers.map(header => {
            const headerWidth = header.length;
            const maxDataWidth = Math.max(...data.map(row => 
                String(row[header] || '').length
            ));
            return Math.max(headerWidth, maxDataWidth, 10);
        });

        // Print header
        const headerRow = headers.map((header, i) => 
            header.padEnd(columnWidths[i])
        ).join(' | ');
        
        console.log(`${colors.bright}${headerRow}${colors.reset}`);
        console.log(columnWidths.map(width => '-'.repeat(width)).join('-|-'));

        // Print rows
        data.forEach(row => {
            const dataRow = headers.map((header, i) => 
                String(row[header] || '').padEnd(columnWidths[i])
            ).join(' | ');
            console.log(dataRow);
        });

        console.log();
    }

    printSummary(title, items) {
        console.log(`\n${colors.bright}${colors.magenta}📋 ${title}${colors.reset}`);
        console.log(`${colors.magenta}${'='.repeat(title.length + 4)}${colors.reset}`);
        
        items.forEach((item, index) => {
            const number = `${index + 1}.`.padEnd(3);
            console.log(`${colors.bright}${number}${colors.reset} ${item}`);
        });
        
        console.log();
    }

    printBox(message, type = 'info') {
        const lines = message.split('\n');
        const maxLength = Math.max(...lines.map(line => line.length));
        const width = Math.max(maxLength + 4, 40);
        
        let color;
        let icon;
        
        switch (type) {
            case 'error':
                color = colors.red;
                icon = '❌';
                break;
            case 'warning':
                color = colors.yellow;
                icon = '⚠️';
                break;
            case 'success':
                color = colors.green;
                icon = '✅';
                break;
            default:
                color = colors.cyan;
                icon = 'ℹ️';
        }

        const topBorder = `╭${'─'.repeat(width - 2)}╮`;
        const bottomBorder = `╰${'─'.repeat(width - 2)}╯`;
        
        console.log(`\n${color}${topBorder}${colors.reset}`);
        
        lines.forEach(line => {
            const padding = width - line.length - 4;
            const leftPad = Math.floor(padding / 2);
            const rightPad = padding - leftPad;
            const formattedLine = `│ ${' '.repeat(leftPad)}${line}${' '.repeat(rightPad)} │`;
            console.log(`${color}${formattedLine}${colors.reset}`);
        });
        
        console.log(`${color}${bottomBorder}${colors.reset}\n`);
    }

    // Spinner functionality
    startSpinner(message) {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        
        this.spinner = setInterval(() => {
            process.stdout.write(`\r${colors.cyan}${frames[i]} ${message}${colors.reset}`);
            i = (i + 1) % frames.length;
        }, 100);
    }

    stopSpinner(message, success = true) {
        if (this.spinner) {
            clearInterval(this.spinner);
            this.spinner = null;
            
            const icon = success ? '✅' : '❌';
            const color = success ? colors.green : colors.red;
            console.log(`\r${color}${icon} ${message}${colors.reset}`);
        }
    }
}

// Create singleton instance
const logger = new SetupLogger();

module.exports = logger;