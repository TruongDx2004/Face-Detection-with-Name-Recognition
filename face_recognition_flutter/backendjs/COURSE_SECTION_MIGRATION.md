# Course Section (Lớp Học Phần) Migration Guide

## Tổng quan

Đã thêm khái niệm mới **"Lớp Học Phần" (Course Section)** để quản lý việc phân công giảng viên dạy môn học cụ thể cho lớp cụ thể với lịch học.

## Sự khác biệt giữa Class và Course Section

### Class (Lớp học)
- Đại diện cho một lớp sinh viên (ví dụ: CNTT01, CNTT02)
- Chứa danh sách sinh viên
- Là đơn vị tổ chức sinh viên

### Course Section (Lớp học phần)
- Đại diện cho việc dạy một môn học cụ thể cho một lớp cụ thể
- Bao gồm: Lớp + Môn học + Giảng viên + Lịch học + Học kỳ
- Ví dụ: "CNTT01 - Python Programming" (Lớp CNTT01 học môn Python với giảng viên A trong HK1 2024-2025)

## Cấu trúc Database mới

### Bảng `course_sections`
```sql
CREATE TABLE course_sections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,                    -- Tên lớp học phần
    code VARCHAR(20) UNIQUE NOT NULL,              -- Mã lớp học phần
    class_id INT NOT NULL,                         -- ID lớp học
    subject_id INT NOT NULL,                       -- ID môn học
    teacher_id INT NOT NULL,                       -- ID giảng viên
    semester VARCHAR(20) NOT NULL,                 -- Học kỳ (HK1, HK2, HK3, Summer)
    academic_year VARCHAR(9) NOT NULL,             -- Năm học (2024-2025)
    max_students INT DEFAULT 50,                   -- Số sinh viên tối đa
    description TEXT,                              -- Mô tả
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    UNIQUE KEY unique_course_section (class_id, subject_id, semester, academic_year)
);
```

### Bảng `schedules` (đã cập nhật)
```sql
CREATE TABLE schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_section_id INT NOT NULL,               -- Liên kết với lớp học phần
    weekday TINYINT NOT NULL,                     -- Thứ trong tuần (1=Monday, 7=Sunday)
    start_time TIME NOT NULL,                     -- Giờ bắt đầu
    end_time TIME NOT NULL,                       -- Giờ kết thúc
    room VARCHAR(50),                             -- Phòng học
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_section_id) REFERENCES course_sections(id)
);
```

### Bảng `subjects` (đã cập nhật)
```sql
CREATE TABLE subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,             -- Mã môn học
    description TEXT,                             -- Mô tả môn học
    credits INT DEFAULT 3,                        -- Số tín chỉ
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Bảng `attendance_sessions` (đã cập nhật)
```sql
CREATE TABLE attendance_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_section_id INT NOT NULL,               -- Liên kết với lớp học phần
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    session_name VARCHAR(100),                    -- Tên buổi học
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_section_id) REFERENCES course_sections(id)
);
```

## API Endpoints mới

### Course Sections
- `GET /api/course-sections` - Lấy tất cả lớp học phần
- `GET /api/course-sections/:id` - Lấy lớp học phần theo ID
- `POST /api/course-sections` - Tạo lớp học phần mới
- `PUT /api/course-sections/:id` - Cập nhật lớp học phần
- `DELETE /api/course-sections/:id` - Xóa lớp học phần

### Course Section Details
- `GET /api/course-sections/:id/schedules` - Lấy lịch học của lớp học phần
- `GET /api/course-sections/:id/students` - Lấy sinh viên của lớp học phần
- `GET /api/course-sections/:id/attendance-sessions` - Lấy buổi điểm danh của lớp học phần

### Filters
- `GET /api/course-sections/teacher/:teacherId` - Lấy lớp học phần theo giảng viên
- `GET /api/course-sections/class/:classId` - Lấy lớp học phần theo lớp

## Ví dụ sử dụng API

### 1. Tạo lớp học phần mới
```bash
POST /api/course-sections
Content-Type: application/json
Authorization: Bearer <token>

{
    "name": "CNTT01 - Python Programming",
    "code": "CNTT01_PY101",
    "class_id": 1,
    "subject_id": 1,
    "teacher_id": 2,
    "semester": "HK1",
    "academic_year": "2024-2025",
    "max_students": 40,
    "description": "Lớp học phần Python Programming cho lớp CNTT01"
}
```

### 2. Lấy tất cả lớp học phần với filter
```bash
GET /api/course-sections?class_id=1&semester=HK1&academic_year=2024-2025
Authorization: Bearer <token>
```

### 3. Lấy lớp học phần của giảng viên
```bash
GET /api/course-sections/teacher/2
Authorization: Bearer <token>
```

### 4. Lấy sinh viên trong lớp học phần
```bash
GET /api/course-sections/1/students
Authorization: Bearer <token>
```

## Workflow mới

1. **Tạo Class** (Lớp học) - chứa sinh viên
2. **Tạo Subject** (Môn học) - định nghĩa môn học
3. **Tạo Course Section** (Lớp học phần) - phân công giảng viên dạy môn cho lớp
4. **Tạo Schedule** - lịch học cho lớp học phần
5. **Tạo Attendance Session** - buổi điểm danh cho lớp học phần

## Migration từ hệ thống cũ

Hệ thống cũ sử dụng bảng `schedules` trực tiếp liên kết với `class_id`, `subject_id`, `teacher_id`. 
Hệ thống mới tạo bảng `course_sections` để quản lý mối quan hệ này tốt hơn và bảng `schedules` chỉ liên kết với `course_section_id`.

### Lợi ích của hệ thống mới:
1. **Quản lý rõ ràng hơn**: Mỗi lớp học phần có thông tin đầy đủ về lớp, môn, giảng viên, học kỳ
2. **Tránh trùng lặp**: Unique constraint đảm bảo không tạo trùng lớp học phần
3. **Linh hoạt hơn**: Có thể có nhiều lịch học cho một lớp học phần
4. **Theo dõi tốt hơn**: Dễ dàng theo dõi lớp học phần theo giảng viên, lớp, học kỳ
5. **Mở rộng**: Dễ dàng thêm các thông tin khác như số tín chỉ, mô tả chi tiết

## Dữ liệu mẫu

Khi chạy `setup_server.js`, hệ thống sẽ tự động tạo:
- Lớp CNTT01
- Môn Python Programming (PY101)
- Lớp học phần "CNTT01 - Python Programming"
- Lịch học thứ 2, 9:00-11:00, phòng P101
- Buổi điểm danh mẫu

## Swagger Documentation

API documentation có sẵn tại: `http://localhost:8000/docs`