/**
 * Migration management module
 * 
 * Handles database migrations and schema updates
 */

const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('./logger');

class MigrationManager {
    constructor() {
        this.connection = null;
        this.migrationsPath = 'migrations';
        this.executedMigrations = [];
    }

    /**
     * Initialize database connection
     */
    async connect() {
        if (!this.connection) {
            this.connection = await mysql.createConnection(config.DB_CONFIG);
        }
        return this.connection;
    }

    /**
     * Create migrations tracking table
     */
    async createMigrationsTable() {
        try {
            await this.connection.execute(`
                CREATE TABLE IF NOT EXISTS migrations (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    filename VARCHAR(255) NOT NULL UNIQUE,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    execution_time_ms INT DEFAULT 0,
                    checksum VARCHAR(64),
                    INDEX idx_filename (filename),
                    INDEX idx_executed_at (executed_at)
                )
            `);
            
            logger.printDebug('Migrations tracking table ready');
            return true;
        } catch (error) {
            logger.printError(`Failed to create migrations table: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get list of executed migrations
     */
    async getExecutedMigrations() {
        try {
            const [rows] = await this.connection.execute(
                'SELECT filename FROM migrations ORDER BY executed_at'
            );
            return rows.map(row => row.filename);
        } catch (error) {
            logger.printWarning(`Could not fetch executed migrations: ${error.message}`);
            return [];
        }
    }

    /**
     * Calculate file checksum
     */
    calculateChecksum(content) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Execute a single migration
     */
    async executeMigration(filename, content) {
        const startTime = Date.now();
        
        try {
            logger.printInfo(`Executing migration: ${filename}`);
            
            // Split migration into individual statements
            const statements = this.parseMigrationStatements(content);
            
            // Execute each statement
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await this.connection.execute(statement);
                    } catch (error) {
                        // Some migrations use prepared statements that might fail in execute
                        // Try with query instead
                        try {
                            await this.connection.query(statement);
                        } catch (queryError) {
                            logger.printWarning(`Statement warning in ${filename}: ${queryError.message}`);
                            // Continue with other statements
                        }
                    }
                }
            }
            
            const executionTime = Date.now() - startTime;
            const checksum = this.calculateChecksum(content);
            
            // Record migration execution
            await this.connection.execute(
                'INSERT INTO migrations (filename, execution_time_ms, checksum) VALUES (?, ?, ?)',
                [filename, executionTime, checksum]
            );
            
            this.executedMigrations.push(filename);
            logger.printSuccess(`Migration ${filename} completed in ${executionTime}ms`);
            
            return true;
            
        } catch (error) {
            logger.printError(`Migration ${filename} failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Parse migration file into individual SQL statements
     */
    parseMigrationStatements(content) {
        // Remove comments and split by semicolons
        const statements = content
            .split('\n')
            .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
            .join('\n')
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
            
        return statements;
    }

    /**
     * Run built-in migrations (embedded in the module)
     */
    async runBuiltInMigrations() {
        try {
            logger.printStep('RUNNING BUILT-IN MIGRATIONS');
            
            const migrations = this.getBuiltInMigrations();
            const executedMigrations = await this.getExecutedMigrations();
            
            let executed = 0;
            const total = migrations.length;
            
            for (const migration of migrations) {
                if (!executedMigrations.includes(migration.filename)) {
                    await this.executeMigration(migration.filename, migration.content);
                    executed++;
                } else {
                    logger.printDebug(`Migration ${migration.filename} already executed`);
                }
                
                logger.printProgress(
                    executedMigrations.length + executed,
                    executedMigrations.length + total,
                    `Processing migrations...`
                );
            }
            
            if (executed > 0) {
                logger.printSuccess(`Executed ${executed} new migrations`);
            } else {
                logger.printInfo('All migrations already up to date');
            }
            
            return true;
            
        } catch (error) {
            logger.printError(`Built-in migration execution failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Run migrations from files
     */
    async runFileMigrations() {
        try {
            // Check if migrations directory exists
            try {
                await fs.access(this.migrationsPath);
            } catch {
                logger.printInfo('No migrations directory found, skipping file migrations');
                return true;
            }
            
            logger.printStep('RUNNING FILE MIGRATIONS');
            
            const files = await fs.readdir(this.migrationsPath);
            const migrationFiles = files
                .filter(file => file.endsWith('.sql'))
                .sort(); // Execute in alphabetical order
            
            if (migrationFiles.length === 0) {
                logger.printInfo('No migration files found');
                return true;
            }
            
            const executedMigrations = await this.getExecutedMigrations();
            let executed = 0;
            
            for (const file of migrationFiles) {
                if (!executedMigrations.includes(file)) {
                    const filePath = path.join(this.migrationsPath, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    
                    await this.executeMigration(file, content);
                    executed++;
                } else {
                    logger.printDebug(`Migration ${file} already executed`);
                }
                
                logger.printProgress(
                    executed,
                    migrationFiles.length,
                    `Processing ${file}...`
                );
            }
            
            if (executed > 0) {
                logger.printSuccess(`Executed ${executed} file migrations`);
            } else {
                logger.printInfo('All file migrations already up to date');
            }
            
            return true;
            
        } catch (error) {
            logger.printError(`File migration execution failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get built-in migrations (embedded in code)
     */
    getBuiltInMigrations() {
        return [
            {
                filename: '001_add_missing_class_fields.sql',
                content: `-- Migration: Add missing fields to classes table

-- Check and add code column if not exists
SET @col_exists = 0;
SELECT count(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = database() 
AND table_name = 'classes' 
AND column_name = 'code';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE classes ADD COLUMN code VARCHAR(50) UNIQUE AFTER name', 
    'SELECT "Column code already exists" as msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add year column if not exists
SET @col_exists = 0;
SELECT count(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = database() 
AND table_name = 'classes' 
AND column_name = 'year';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE classes ADD COLUMN year VARCHAR(4) DEFAULT "2024" AFTER code', 
    'SELECT "Column year already exists" as msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add status column if not exists
SET @col_exists = 0;
SELECT count(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = database() 
AND table_name = 'classes' 
AND column_name = 'status';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE classes ADD COLUMN status ENUM("active", "inactive") DEFAULT "active" AFTER description', 
    'SELECT "Column status already exists" as msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing records to have default values
UPDATE classes SET 
    code = CONCAT('CLS', LPAD(id, 3, '0')),
    year = '2024',
    status = 'active'
WHERE code IS NULL OR year IS NULL OR status IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
CREATE INDEX IF NOT EXISTS idx_classes_year ON classes(year);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);`
            },
            {
                filename: '002_create_assignment_templates.sql',
                content: `-- Migration: Create assignment templates tables

-- Assignment templates table
CREATE TABLE IF NOT EXISTS assignment_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assignment_type ENUM('homework', 'project', 'lab', 'essay') DEFAULT 'homework',
    default_max_score DECIMAL(5,2) DEFAULT 10.00,
    instructions TEXT,
    attachment_path VARCHAR(255),
    tags JSON COMMENT 'Tags để tìm kiếm và phân loại template',
    usage_count INT DEFAULT 0 COMMENT 'Số lần template được sử dụng',
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Template có được chia sẻ với giáo viên khác không',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teacher_templates (teacher_id, is_active),
    INDEX idx_public_templates (is_public, is_active),
    INDEX idx_assignment_type (assignment_type)
);

-- Assignment template usage tracking
CREATE TABLE IF NOT EXISTS assignment_template_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    template_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES assignment_templates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment_template (assignment_id, template_id)
);

-- Add template_id to assignments table if not exists
SET @col_exists = 0;
SELECT count(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = database() 
AND table_name = 'assignments' 
AND column_name = 'template_id';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE assignments ADD COLUMN template_id INT NULL COMMENT "ID của template được sử dụng (nếu có)"', 
    'SELECT "Column template_id already exists" as msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if column was just created
SET @fk_exists = 0;
SELECT count(*) INTO @fk_exists 
FROM information_schema.key_column_usage 
WHERE table_schema = database() 
AND table_name = 'assignments' 
AND column_name = 'template_id' 
AND referenced_table_name = 'assignment_templates';

SET @query = IF(@fk_exists = 0, 
    'ALTER TABLE assignments ADD FOREIGN KEY (template_id) REFERENCES assignment_templates(id) ON DELETE SET NULL', 
    'SELECT "Foreign key already exists" as msg');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;`
            },
            {
                filename: '003_create_exam_templates.sql',
                content: `-- Migration: Create exam templates table

CREATE TABLE IF NOT EXISTS exam_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id INT,
    teacher_id INT NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    duration_minutes INT NOT NULL DEFAULT 60,
    total_points DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    questions JSON NOT NULL,
    tags JSON,
    usage_count INT DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    KEY idx_teacher_id (teacher_id),
    KEY idx_subject_id (subject_id),
    KEY idx_difficulty (difficulty_level),
    KEY idx_is_public (is_public),
    KEY idx_is_active (is_active),
    KEY idx_created_at (created_at),
    KEY idx_usage_count (usage_count)
);`
            },
            {
                filename: '004_insert_sample_assignment_templates.sql',
                content: `-- Migration: Insert sample assignment templates

-- Insert sample templates only if teacher exists
INSERT IGNORE INTO assignment_templates (teacher_id, title, description, assignment_type, default_max_score, instructions, tags, is_public)
SELECT 
    u.id,
    'Bài tập Python cơ bản',
    'Bài tập lập trình Python về cú pháp cơ bản',
    'homework',
    10.00,
    'Viết chương trình Python để giải quyết các bài toán cơ bản về:\\n1. Biến và kiểu dữ liệu\\n2. Cấu trúc điều khiển\\n3. Hàm\\n\\nYêu cầu:\\n- Code phải có comment rõ ràng\\n- Test với ít nhất 3 test case\\n- Nộp file .py',
    JSON_ARRAY('python', 'programming', 'basic', 'homework'),
    TRUE
FROM users u 
WHERE u.role = 'teacher' 
LIMIT 1;

INSERT IGNORE INTO assignment_templates (teacher_id, title, description, assignment_type, default_max_score, instructions, tags, is_public)
SELECT 
    u.id,
    'Project nhóm Python',
    'Dự án phát triển ứng dụng Python theo nhóm',
    'project',
    50.00,
    'Phát triển một ứng dụng Python hoàn chỉnh theo nhóm 3-4 người:\\n\\n1. Phân tích yêu cầu\\n2. Thiết kế hệ thống\\n3. Lập trình\\n4. Test và debug\\n5. Tài liệu hướng dẫn sử dụng\\n\\nDeliverable:\\n- Source code\\n- Tài liệu thiết kế\\n- User manual\\n- Video demo',
    JSON_ARRAY('python', 'project', 'teamwork', 'application'),
    TRUE
FROM users u 
WHERE u.role = 'teacher' 
LIMIT 1;

INSERT IGNORE INTO assignment_templates (teacher_id, title, description, assignment_type, default_max_score, instructions, tags, is_public)
SELECT 
    u.id,
    'Lab thực hành',
    'Bài lab thực hành trong lớp',
    'lab',
    15.00,
    'Thực hiện các bài tập thực hành trong phòng lab:\\n\\n1. Làm theo hướng dẫn\\n2. Hoàn thành các task được giao\\n3. Trả lời câu hỏi\\n4. Demo kết quả\\n\\nLưu ý:\\n- Hoàn thành trong thời gian lab\\n- Được hỗ trợ từ giảng viên\\n- Không được copy code',
    JSON_ARRAY('lab', 'practical', 'hands-on'),
    TRUE
FROM users u 
WHERE u.role = 'teacher' 
LIMIT 1;`
            }
        ];
    }

    /**
     * Rollback a specific migration
     */
    async rollbackMigration(filename) {
        try {
            logger.printInfo(`Rolling back migration: ${filename}`);
            
            // Remove from migrations table
            await this.connection.execute(
                'DELETE FROM migrations WHERE filename = ?',
                [filename]
            );
            
            logger.printWarning(`Migration ${filename} rolled back (manual cleanup may be required)`);
            return true;
            
        } catch (error) {
            logger.printError(`Rollback failed for ${filename}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get migration status
     */
    async getStatus() {
        try {
            const executedMigrations = await this.getExecutedMigrations();
            const builtInMigrations = this.getBuiltInMigrations();
            
            const status = {
                executed: executedMigrations.length,
                available: builtInMigrations.length,
                pending: builtInMigrations.filter(m => 
                    !executedMigrations.includes(m.filename)
                ).map(m => m.filename)
            };
            
            return status;
            
        } catch (error) {
            logger.printError(`Failed to get migration status: ${error.message}`);
            throw error;
        }
    }

    /**
     * Main migration runner
     */
    async runAll(options = {}) {
        try {
            // Connect to database
            await this.connect();
            
            // Create migrations tracking table
            await this.createMigrationsTable();
            
            // Run built-in migrations
            await this.runBuiltInMigrations();
            
            // Run file migrations if directory exists
            await this.runFileMigrations();
            
            // Show final status
            const status = await this.getStatus();
            logger.printSummary('Migration Status', [
                `Total executed: ${status.executed}`,
                `Available: ${status.available}`,
                `Pending: ${status.pending.length}`
            ]);
            
            logger.printSuccess('All migrations completed successfully');
            return true;
            
        } catch (error) {
            logger.printError(`Migration execution failed: ${error.message}`);
            throw error;
        } finally {
            // Clean up connection
            if (this.connection) {
                await this.connection.end();
                this.connection = null;
            }
        }
    }
}

// Export singleton instance
module.exports = new MigrationManager();