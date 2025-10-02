-- Migration: Add Assignment Templates table
-- This allows teachers to create reusable assignment templates

-- Bảng ngân hàng bài tập (Assignment Templates)
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

-- Bảng liên kết giữa assignments và templates (để tracking)
CREATE TABLE IF NOT EXISTS assignment_template_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    template_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES assignment_templates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment_template (assignment_id, template_id)
);

-- Thêm cột template_id vào bảng assignments (optional - để link back)
ALTER TABLE assignments 
ADD COLUMN template_id INT NULL COMMENT 'ID của template được sử dụng (nếu có)',
ADD FOREIGN KEY (template_id) REFERENCES assignment_templates(id) ON DELETE SET NULL;

-- Thêm một số template mẫu
INSERT INTO assignment_templates (teacher_id, title, description, assignment_type, default_max_score, instructions, tags, is_public) VALUES
(2, 'Bài tập Python cơ bản', 'Bài tập lập trình Python về cú pháp cơ bản', 'homework', 10.00, 
 'Viết chương trình Python để giải quyết các bài toán cơ bản về:\n1. Biến và kiểu dữ liệu\n2. Cấu trúc điều khiển\n3. Hàm\n\nYêu cầu:\n- Code phải có comment rõ ràng\n- Test với ít nhất 3 test case\n- Nộp file .py', 
 JSON_ARRAY('python', 'programming', 'basic', 'homework'), TRUE),
 
(2, 'Project nhóm Python', 'Dự án phát triển ứng dụng Python theo nhóm', 'project', 50.00,
 'Phát triển một ứng dụng Python hoàn chỉnh theo nhóm 3-4 người:\n\n1. Phân tích yêu cầu\n2. Thiết kế hệ thống\n3. Lập trình\n4. Test và debug\n5. Tài liệu hướng dẫn sử dụng\n\nDeliverable:\n- Source code\n- Tài liệu thiết kế\n- User manual\n- Video demo',
 JSON_ARRAY('python', 'project', 'teamwork', 'application'), TRUE),

(2, 'Lab thực hành', 'Bài lab thực hành trong lớp', 'lab', 15.00,
 'Thực hiện các bài tập thực hành trong phòng lab:\n\n1. Làm theo hướng dẫn\n2. Hoàn thành các task được giao\n3. Trả lời câu hỏi\n4. Demo kết quả\n\nLưu ý:\n- Hoàn thành trong thời gian lab\n- Được hỗ trợ từ giảng viên\n- Không được copy code',
 JSON_ARRAY('lab', 'practical', 'hands-on'), TRUE),

(2, 'Bài luận kỹ thuật', 'Viết báo cáo phân tích kỹ thuật', 'essay', 20.00,
 'Viết một bài báo cáo phân tích về chủ đề được giao:\n\nCấu trúc báo cáo:\n1. Tóm tắt (Abstract)\n2. Giới thiệu\n3. Phân tích chính\n4. Kết luận\n5. Tài liệu tham khảo\n\nYêu cầu:\n- Độ dài: 2000-3000 từ\n- Font: Times New Roman, 12pt\n- Ít nhất 5 tài liệu tham khảo',
 JSON_ARRAY('essay', 'technical', 'analysis', 'writing'), TRUE);