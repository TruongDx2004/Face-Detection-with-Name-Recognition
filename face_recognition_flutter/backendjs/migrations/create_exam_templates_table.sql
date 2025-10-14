-- Create exam_templates table
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
);