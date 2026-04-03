
-- AI Assignment Generation Tables
CREATE TABLE IF NOT EXISTS ai_generation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    template_id INT,
    generation_id VARCHAR(255) UNIQUE,
    document_name VARCHAR(255),
    document_size_mb DECIMAL(10,2),
    questions_generated INT DEFAULT 0,
    generation_time_ms INT DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    settings JSON,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES assignment_templates(id) ON DELETE SET NULL
);

-- Add AI metadata to assignment_templates
ALTER TABLE assignment_templates 
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_metadata JSON,
ADD COLUMN IF NOT EXISTS generation_id VARCHAR(255);

-- AI Template Questions (separate table for generated questions)
CREATE TABLE IF NOT EXISTS ai_template_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    question_order INT DEFAULT 0,
    question_type ENUM('multiple_choice', 'short_answer', 'true_false', 'essay') NOT NULL,
    question_text TEXT NOT NULL,
    options JSON, -- For multiple choice options
    correct_answer TEXT,
    sample_answer TEXT,
    explanation TEXT,
    keywords JSON,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    estimated_time_minutes INT DEFAULT 2,
    complexity_score INT DEFAULT 1,
    source_chunk TEXT,
    ai_confidence DECIMAL(3,2) DEFAULT 0.8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES assignment_templates(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_logs_teacher ON ai_generation_logs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_status ON ai_generation_logs(status);
CREATE INDEX IF NOT EXISTS idx_template_questions_template ON ai_template_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_ai_templates ON assignment_templates(ai_generated);
