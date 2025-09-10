# Assignment API Documentation

## Tổng quan
Các API endpoints cho việc quản lý bài tập và nộp bài, được xây dựng dựa trên database schema từ setup_server.js.

## Database Schema

### Bảng `assignments`
```sql
CREATE TABLE IF NOT EXISTS assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_section_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assignment_type ENUM('homework', 'project', 'lab', 'essay') DEFAULT 'homework',
    max_score DECIMAL(5,2) DEFAULT 10.00,
    due_date DATETIME NOT NULL,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    instructions TEXT,
    attachment_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_section_id) REFERENCES course_sections(id) ON DELETE CASCADE
)
```

### Bảng `assignment_submissions`
```sql
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submission_text TEXT,
    attachment_path VARCHAR(255),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score DECIMAL(5,2) NULL,
    feedback TEXT,
    graded_at TIMESTAMP NULL,
    graded_by INT NULL,
    status ENUM('submitted', 'graded', 'late', 'missing') DEFAULT 'submitted',
    UNIQUE KEY unique_submission (assignment_id, student_id),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL
)
```

## API Endpoints

### 1. Assignment Management (Teacher/Admin)

#### POST `/assignments`
**Tạo bài tập mới**
- **Auth**: Teacher/Admin only
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```json
  {
    "course_section_id": 1,
    "title": "Bài tập Python cơ bản",
    "description": "Viết chương trình Python đơn giản",
    "assignment_type": "homework",
    "max_score": 10,
    "due_date": "2024-01-15T23:59:59",
    "instructions": "Làm theo hướng dẫn trong file đính kèm"
  }
  ```
- **File**: `attachment` (optional)

#### GET `/assignments/{id}`
**Lấy chi tiết bài tập**
- **Auth**: Required
- **Response**:
  ```json
  {
    "message": "Assignment retrieved successfully",
    "data": {
      "id": 1,
      "course_section_id": 1,
      "title": "Bài tập Python cơ bản",
      "description": "Viết chương trình Python đơn giản",
      "assignment_type": "homework",
      "max_score": 10,
      "due_date": "2024-01-15T23:59:59",
      "instructions": "Làm theo hướng dẫn trong file đính kèm",
      "attachment_path": "uploads/assignments/file-123456.pdf",
      "course_name": "CNTT01 - Python Programming",
      "subject_name": "Python Programming"
    }
  }
  ```

#### PUT `/assignments/{id}`
**Cập nhật bài tập**
- **Auth**: Teacher/Admin only
- **Content-Type**: `multipart/form-data`
- **Body**: Tương tự POST (các field optional)

#### DELETE `/assignments/{id}`
**Xóa bài tập (soft delete)**
- **Auth**: Teacher/Admin only

### 2. Student Assignment Views

#### GET `/assignments/student/{courseSectionId}`
**Lấy danh sách bài tập của sinh viên theo lớp học phần**
- **Auth**: Student (chỉ xem bài tập của mình)
- **Response**:
  ```json
  {
    "message": "Assignments retrieved successfully",
    "data": [
      {
        "id": 1,
        "title": "Bài tập Python cơ bản",
        "description": "Viết chương trình Python đơn giản",
        "assignment_type": "homework",
        "max_score": 10,
        "due_date": "2024-01-15T23:59:59",
        "course_name": "CNTT01 - Python Programming",
        "subject_name": "Python Programming",
        "submission": {
          "id": 5,
          "submitted_at": "2024-01-10T14:30:00",
          "score": 8.5,
          "status": "graded",
          "feedback": "Làm tốt, cần cải thiện phần xử lý lỗi"
        }
      }
    ]
  }
  ```

### 3. Assignment Submission

#### POST `/assignments/submit`
**Nộp bài tập**
- **Auth**: Student only
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```json
  {
    "assignment_id": 1,
    "student_id": 3,
    "submission_text": "Nội dung bài làm của sinh viên..."
  }
  ```
- **File**: `attachment` (optional)
- **Validation**:
  - Kiểm tra assignment tồn tại
  - Kiểm tra chưa quá hạn
  - Student chỉ có thể nộp bài của mình
  - Tự động update nếu đã nộp trước đó

#### GET `/assignments/{assignmentId}/submissions/{studentId}`
**Lấy bài nộp cụ thể**
- **Auth**: Student (chỉ xem bài của mình) hoặc Teacher/Admin
- **Response**:
  ```json
  {
    "message": "Submission retrieved successfully",
    "data": {
      "id": 5,
      "assignment_id": 1,
      "student_id": 3,
      "submission_text": "Nội dung bài làm...",
      "attachment_path": "uploads/assignments/submission-789.zip",
      "submitted_at": "2024-01-10T14:30:00",
      "score": 8.5,
      "feedback": "Làm tốt, cần cải thiện phần xử lý lỗi",
      "status": "graded",
      "assignment_title": "Bài tập Python cơ bản",
      "max_score": 10
    }
  }
  ```

### 4. Teacher Assignment Management

#### GET `/assignments/teacher/{teacherId}`
**Lấy danh sách bài tập của giáo viên**
- **Auth**: Teacher/Admin only
- **Query params**:
  - `status`: `active` | `closed`
  - `assignment_type`: `homework` | `project` | `lab` | `essay`
  - `course_section_id`: number

#### GET `/assignments/{assignmentId}/submissions`
**Lấy tất cả bài nộp của một bài tập**
- **Auth**: Teacher/Admin only

#### GET `/assignments/submissions/ungraded/{teacherId}`
**Lấy danh sách bài chưa chấm điểm**
- **Auth**: Teacher/Admin only

### 5. Grading

#### PUT `/assignments/submissions/{submissionId}/grade`
**Chấm điểm bài tập**
- **Auth**: Teacher/Admin only
- **Body**:
  ```json
  {
    "score": 8.5,
    "feedback": "Làm tốt, cần cải thiện phần xử lý lỗi"
  }
  ```

### 6. Statistics

#### GET `/assignments/teacher/{teacherId}/stats`
**Thống kê bài tập của giáo viên**
- **Auth**: Teacher/Admin only
- **Response**:
  ```json
  {
    "message": "Assignment statistics retrieved successfully",
    "data": {
      "total_assignments": 15,
      "total_submissions": 120,
      "avg_score": 7.8,
      "graded_count": 100
    }
  }
  ```

#### GET `/assignments/submissions/student/{studentId}`
**Lấy tất cả bài nộp của sinh viên**
- **Auth**: Student (chỉ xem của mình) hoặc Teacher/Admin

## File Upload Configuration

### Multer Settings
- **Destination**: `uploads/assignments/`
- **File size limit**: 10MB
- **Allowed file types**:
  - PDF: `application/pdf`
  - Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - Text: `text/plain`
  - Images: `image/jpeg`, `image/png`, `image/gif`
  - Archives: `application/zip`, `application/x-rar-compressed`

### File Naming
- Format: `{original-name}-{timestamp}-{random}.{ext}`
- Example: `assignment1-1704123456789-987654321.pdf`

## Security Features

### Authentication & Authorization
- JWT token required for all endpoints
- Role-based access control:
  - **Student**: Chỉ xem và nộp bài tập của mình
  - **Teacher**: Quản lý bài tập của lớp mình dạy
  - **Admin**: Full access

### Validation
- Joi schema validation cho tất cả input
- File type validation
- Due date validation (không cho nộp quá hạn)
- Ownership validation (student chỉ nộp bài của mình)

### Error Handling
- Comprehensive error messages
- File cleanup on errors
- Transaction rollback support

## Usage Examples

### 1. Student workflow
```javascript
// 1. Lấy danh sách bài tập
GET /assignments/student/1

// 2. Xem chi tiết bài tập
GET /assignments/5

// 3. Nộp bài tập
POST /assignments/submit
FormData: {
  assignment_id: 5,
  student_id: 3,
  submission_text: "Nội dung bài làm...",
  attachment: file
}

// 4. Xem bài đã nộp
GET /assignments/5/submissions/3
```

### 2. Teacher workflow
```javascript
// 1. Tạo bài tập
POST /assignments
FormData: {
  course_section_id: 1,
  title: "Bài tập mới",
  due_date: "2024-01-15T23:59:59",
  attachment: file
}

// 2. Xem bài nộp
GET /assignments/5/submissions

// 3. Chấm điểm
PUT /assignments/submissions/10/grade
{
  score: 8.5,
  feedback: "Làm tốt"
}
```

## Integration với Flutter App

Các API endpoints này đã được tích hợp sẵn trong Flutter app thông qua:
- `ApiService.getStudentAssignments()`
- `ApiService.submitAssignment()`
- `ApiService.getAssignmentSubmission()`

Xem file `lib/services/api_service.dart` để biết chi tiết implementation.