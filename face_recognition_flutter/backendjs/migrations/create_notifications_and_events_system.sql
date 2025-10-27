-- Migration: Create notifications and events system
-- This migration creates tables for school notifications and events management

-- Bảng thông báo và sự kiện chính
CREATE TABLE IF NOT EXISTS notifications_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề thông báo/sự kiện',
    content TEXT NOT NULL COMMENT 'Nội dung chi tiết',
    type ENUM('notification', 'event') NOT NULL COMMENT 'Loại: thông báo chung hoặc sự kiện',
    category ENUM('general', 'academic', 'extracurricular', 'urgent') DEFAULT 'general' COMMENT 'Phân loại thông báo',
    
    -- Thông tin người tạo
    created_by INT NOT NULL COMMENT 'Admin/nhà trường tạo thông báo',
    
    -- Thông tin thời gian
    publish_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày đăng',
    event_start_datetime DATETIME NULL COMMENT 'Thời gian bắt đầu sự kiện (chỉ cho type=event)',
    event_end_datetime DATETIME NULL COMMENT 'Thời gian kết thúc sự kiện (chỉ cho type=event)',
    registration_deadline DATETIME NULL COMMENT 'Hạn đăng ký (chỉ cho sự kiện có đăng ký)',
    
    -- Thông tin địa điểm và tổ chức
    location VARCHAR(255) NULL COMMENT 'Địa điểm tổ chức (chỉ cho sự kiện)',
    organizer VARCHAR(255) NULL COMMENT 'Đơn vị tổ chức',
    
    -- Thông tin đăng ký
    allow_registration BOOLEAN DEFAULT FALSE COMMENT 'Có cho phép đăng ký không',
    max_participants INT NULL COMMENT 'Số lượng tối đa người tham gia',
    registration_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Phí đăng ký (nếu có)',
    
    -- File đính kèm
    image_path VARCHAR(500) NULL COMMENT 'Đường dẫn hình ảnh minh họa',
    attachment_path VARCHAR(500) NULL COMMENT 'File đính kèm (PDF, DOC, etc.)',
    
    -- Targeting
    target_audience JSON NULL COMMENT 'Đối tượng mục tiêu: {"classes": [1,2,3], "all_students": true, "years": ["2024"]}',
    
    -- Trạng thái
    status ENUM('draft', 'published', 'archived', 'cancelled') DEFAULT 'draft' COMMENT 'Trạng thái thông báo',
    is_priority BOOLEAN DEFAULT FALSE COMMENT 'Thông báo ưu tiên (hiển thị nổi bật)',
    
    -- Metadata
    view_count INT DEFAULT 0 COMMENT 'Số lượt xem',
    tags JSON NULL COMMENT 'Tags để tìm kiếm',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_publish_date (publish_date),
    INDEX idx_event_datetime (event_start_datetime, event_end_datetime),
    INDEX idx_registration_deadline (registration_deadline),
    INDEX idx_created_by (created_by),
    INDEX idx_priority (is_priority, publish_date),
    INDEX idx_view_count (view_count),
    
    -- Check constraints
    CONSTRAINT chk_event_dates CHECK (
        (type = 'notification') OR 
        (type = 'event' AND event_start_datetime IS NOT NULL)
    ),
    CONSTRAINT chk_registration_logic CHECK (
        (allow_registration = FALSE) OR 
        (allow_registration = TRUE AND registration_deadline IS NOT NULL)
    )
);

-- Bảng đăng ký tham gia sự kiện
CREATE TABLE IF NOT EXISTS event_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL COMMENT 'ID sự kiện',
    student_id INT NOT NULL COMMENT 'ID sinh viên đăng ký',
    
    -- Thông tin đăng ký
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian đăng ký',
    status ENUM('registered', 'confirmed', 'attended', 'absent', 'cancelled') DEFAULT 'registered' COMMENT 'Trạng thái đăng ký',
    
    -- Thông tin bổ sung
    notes TEXT NULL COMMENT 'Ghi chú từ sinh viên khi đăng ký',
    admin_notes TEXT NULL COMMENT 'Ghi chú từ admin',
    
    -- Thông tin thanh toán (nếu có phí)
    payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid' COMMENT 'Trạng thái thanh toán',
    payment_date TIMESTAMP NULL COMMENT 'Ngày thanh toán',
    payment_reference VARCHAR(100) NULL COMMENT 'Mã tham chiếu thanh toán',
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (event_id) REFERENCES notifications_events(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE KEY unique_student_event (student_id, event_id),
    
    -- Indexes
    INDEX idx_event_registrations (event_id, status),
    INDEX idx_student_registrations (student_id, registration_date),
    INDEX idx_registration_status (status),
    INDEX idx_payment_status (payment_status)
);

-- Bảng theo dõi lượt xem thông báo/sự kiện của sinh viên
CREATE TABLE IF NOT EXISTS notification_views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notification_id INT NOT NULL COMMENT 'ID thông báo/sự kiện',
    student_id INT NOT NULL COMMENT 'ID sinh viên xem',
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian xem',
    device_info VARCHAR(255) NULL COMMENT 'Thông tin thiết bị (mobile/web)',
    
    -- Foreign Keys
    FOREIGN KEY (notification_id) REFERENCES notifications_events(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint - mỗi sinh viên chỉ được tính 1 lượt xem
    UNIQUE KEY unique_student_notification_view (student_id, notification_id),
    
    -- Indexes
    INDEX idx_notification_views (notification_id),
    INDEX idx_student_views (student_id, viewed_at),
    INDEX idx_viewed_at (viewed_at)
);

-- Bảng thông báo đẩy (push notifications)
CREATE TABLE IF NOT EXISTS push_notification_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notification_id INT NOT NULL COMMENT 'ID thông báo/sự kiện gốc',
    
    -- Targeting
    target_type ENUM('all_students', 'specific_classes', 'individual_users') NOT NULL COMMENT 'Loại đối tượng nhận',
    target_data JSON NULL COMMENT 'Dữ liệu chi tiết về đối tượng nhận',
    
    -- Nội dung push notification
    push_title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề push notification',
    push_body TEXT NOT NULL COMMENT 'Nội dung push notification',
    
    -- Thống kê
    total_recipients INT DEFAULT 0 COMMENT 'Tổng số người nhận',
    successful_sends INT DEFAULT 0 COMMENT 'Số lượng gửi thành công',
    failed_sends INT DEFAULT 0 COMMENT 'Số lượng gửi thất bại',
    
    -- Trạng thái
    status ENUM('pending', 'sending', 'completed', 'failed') DEFAULT 'pending' COMMENT 'Trạng thái gửi',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL COMMENT 'Thời gian hoàn thành gửi',
    
    -- Foreign Keys
    FOREIGN KEY (notification_id) REFERENCES notifications_events(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_notification_push (notification_id),
    INDEX idx_push_status (status),
    INDEX idx_created_at (created_at)
);

-- Trigger tự động cập nhật view_count khi có lượt xem mới
DELIMITER $$
CREATE TRIGGER update_notification_view_count 
    AFTER INSERT ON notification_views
    FOR EACH ROW
BEGIN
    UPDATE notifications_events 
    SET view_count = view_count + 1 
    WHERE id = NEW.notification_id;
END$$
DELIMITER ;

-- Tạo một số dữ liệu mẫu
INSERT INTO notifications_events (
    title, content, type, category, created_by, 
    status, is_priority, target_audience
) 
SELECT 
    'Thông báo khai giảng năm học mới',
    'Trường thông báo lịch khai giảng năm học 2024-2025. Tất cả sinh viên cần có mặt đúng giờ.',
    'notification',
    'academic',
    u.id,
    'published',
    TRUE,
    JSON_OBJECT('all_students', true)
FROM users u 
WHERE u.role = 'admin' 
LIMIT 1;

INSERT INTO notifications_events (
    title, content, type, category, created_by,
    event_start_datetime, event_end_datetime, location,
    allow_registration, max_participants, registration_deadline,
    status, target_audience
)
SELECT 
    'Hội thao sinh viên 2024',
    'Hội thao thể thao sinh viên toàn trường năm 2024. Các môn thi đấu bao gồm: bóng đá, bóng chuyền, cầu lông, chạy bộ...',
    'event',
    'extracurricular',
    u.id,
    DATE_ADD(NOW(), INTERVAL 30 DAY),
    DATE_ADD(NOW(), INTERVAL 32 DAY),
    'Sân vận động trường',
    TRUE,
    500,
    DATE_ADD(NOW(), INTERVAL 15 DAY),
    'published',
    JSON_OBJECT('all_students', true)
FROM users u 
WHERE u.role = 'admin' 
LIMIT 1;