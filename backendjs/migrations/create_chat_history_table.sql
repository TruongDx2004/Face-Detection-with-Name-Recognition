-- Migration: Tạo bảng chat_history để lưu lịch sử chat
-- Created: 2024-12-19
-- Description: Bảng lưu trữ lịch sử chat của giáo viên với chatbot

CREATE TABLE IF NOT EXISTS chat_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    intent VARCHAR(100) DEFAULT 'GENERAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Index for performance
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_intent (intent)
);

-- Add some metadata
INSERT INTO migration_history (migration_name, executed_at) 
VALUES ('create_chat_history_table', NOW()) 
ON DUPLICATE KEY UPDATE executed_at = NOW();