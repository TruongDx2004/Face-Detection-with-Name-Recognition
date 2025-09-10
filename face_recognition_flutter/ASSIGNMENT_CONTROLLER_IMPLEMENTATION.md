# Assignment Controller Implementation

## Tổng quan
Đã tạo Assignment Controller và Routes theo cấu trúc tương tự AttendanceController, sử dụng database schema từ setup_server.js.

## Cấu trúc Files

### 1. AssignmentController.js
**File:** `backendjs/src/controllers/AssignmentController.js`

**Cấu trúc theo AttendanceController:**
- Class-based controller với methods riêng biệt
- Multer configuration cho file upload
- Database queries sử dụng `db.execute()` trực tiếp
- Error handling và validation đầy đủ
- Role-based authorization trong từng method

### 2. assignmentRoutes.js  
**File:** `backendjs/src/routes/assignmentRoutes.js`

**Cấu trúc theo attendanceRoutes:**
- Express router với middleware authentication
- Swagger documentation cho từng endpoint
- Role authorization sử dụng `authorize()` middleware
- Upload middleware integration

## Database Schema Integration

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

## Controller Methods

### Assignment Management (Teacher/Admin)

#### `createAssignment(req, res)`
- **Route:** `POST /assignments`
- **Auth:** Teacher/Admin only
- **Features:**
  - Validates required fields
  - Checks teacher authorization for course section
  - Handles file upload with multer
  - Uses dayjs for date formatting
  - Returns assignment with course/subject info

#### `getAssignmentById(req, res)`
- **Route:** `GET /assignments/:id`
- **Auth:** All authenticated users
- **Features:**
  - Joins with course_sections and subjects
  - Returns complete assignment details

#### `updateAssignment(req, res)`
- **Route:** `PUT /assignments/:id`
- **Auth:** Teacher/Admin only
- **Features:**
  - Dynamic UPDATE query building
  - File replacement handling
  - Old file cleanup
  - Authorization check

#### `deleteAssignment(req, res)`
- **Route:** `DELETE /assignments/:id`
- **Auth:** Teacher/Admin only
- **Features:**
  - Soft delete (is_active = FALSE)
  - Authorization check

### Student Features

#### `getStudentAssignments(req, res)`
- **Route:** `GET /assignments/student/:courseSectionId`
- **Auth:** Student only
- **Features:**
  - Enrollment verification via class_students
  - LEFT JOIN with submissions
  - Transforms data to include submission status
  - Returns assignments with submission info

#### `submitAssignment(req, res)`
- **Route:** `POST /assignments/submit`
- **Auth:** Student only
- **Features:**
  - Ownership validation (student can only submit own work)
  - Due date checking
  - Enrollment verification
  - Upsert logic (INSERT or UPDATE existing submission)
  - File upload handling

#### `getSubmission(req, res)`
- **Route:** `GET /assignments/:assignmentId/submissions/:studentId`
- **Auth:** Student (own) or Teacher/Admin
- **Features:**
  - Role-based access control
  - Returns submission with assignment details

### Teacher Features

#### `getTeacherAssignments(req, res)`
- **Route:** `GET /assignments/teacher/:teacherId`
- **Auth:** Teacher/Admin only
- **Features:**
  - Query filters (status, type, course_section_id)
  - Aggregation for submission counts
  - Authorization check

#### `getAssignmentSubmissions(req, res)`
- **Route:** `GET /assignments/:assignmentId/submissions`
- **Auth:** Teacher/Admin only
- **Features:**
  - Teacher authorization for assignment
  - Returns all submissions with student info

#### `gradeSubmission(req, res)`
- **Route:** `PUT /assignments/submissions/:submissionId/grade`
- **Auth:** Teacher/Admin only
- **Features:**
  - Teacher authorization check
  - Updates score, feedback, graded_at, graded_by
  - Changes status to 'graded'

#### `getUngradedSubmissions(req, res)`
- **Route:** `GET /assignments/submissions/ungraded/:teacherId`
- **Auth:** Teacher/Admin only
- **Features:**
  - Filters by status = 'submitted'
  - Orders by submitted_at ASC (oldest first)

#### `getTeacherAssignmentStats(req, res)`
- **Route:** `GET /assignments/teacher/:teacherId/stats`
- **Auth:** Teacher/Admin only
- **Features:**
  - Aggregation queries for statistics
  - Returns counts and averages

## File Upload Configuration

### Multer Setup
```javascript
const storage = multer.diskStorage({
    destination: 'uploads/assignments/',
    filename: '{name}-{timestamp}-{random}.{ext}'
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: allowedTypes // PDF, Word, Text, Images, Archives
});
```

### File Types Allowed
- **Documents:** PDF, Word (.doc, .docx), Text
- **Images:** JPEG, PNG, GIF
- **Archives:** ZIP, RAR

## Security Features

### Authentication & Authorization
- **JWT Authentication:** Required for all endpoints
- **Role-based Access:** 
  - Students: Only own assignments/submissions
  - Teachers: Only own course sections
  - Admins: Full access

### Validation & Security
- **Ownership Validation:** Students can only submit own work
- **Enrollment Check:** Students must be enrolled in course section
- **Due Date Validation:** No submissions after deadline
- **File Type Validation:** Only allowed file types
- **SQL Injection Protection:** Parameterized queries

### Database Relationships
- **Foreign Key Constraints:** Proper referential integrity
- **Cascade Deletes:** Automatic cleanup
- **Unique Constraints:** One submission per student per assignment

## Query Optimizations

### Efficient JOINs
```sql
-- Student assignments with submission status
SELECT a.*, cs.name as course_name, s.name as subject_name,
       asub.id as submission_id, asub.status, asub.score
FROM assignments a
JOIN course_sections cs ON a.course_section_id = cs.id
JOIN subjects s ON cs.subject_id = s.id
LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = ?
WHERE a.course_section_id = ? AND a.is_active = TRUE
```

### Aggregation Queries
```sql
-- Teacher assignment statistics
SELECT COUNT(a.id) as total_assignments,
       COUNT(asub.id) as total_submissions,
       AVG(asub.score) as avg_score,
       COUNT(CASE WHEN asub.status = 'graded' THEN 1 END) as graded_count
FROM assignments a
JOIN course_sections cs ON a.course_section_id = cs.id
LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
WHERE cs.teacher_id = ? AND a.is_active = TRUE
```

## Error Handling

### Comprehensive Error Responses
- **400:** Validation errors, missing fields, overdue assignments
- **403:** Authorization errors, enrollment issues
- **404:** Assignment/submission not found
- **500:** Server errors with detailed logging

### File Handling Errors
- File type validation
- File size limits
- Storage errors
- Cleanup on failures

## Testing

### Test Script
**File:** `backendjs/test_assignment_controller.js`

**Test Coverage:**
- ✅ Authentication for all roles
- ✅ Assignment CRUD operations
- ✅ File upload functionality
- ✅ Student assignment workflow
- ✅ Teacher grading workflow
- ✅ Statistics and reporting
- ✅ Error scenarios
- ✅ Authorization checks

### Test Data
- Uses setup_server.js test data
- Creates realistic test files
- Tests file upload/download
- Validates database relationships

## Integration với Flutter

### API Compatibility
Các endpoints tương thích với Flutter ApiService:
- `getStudentAssignments()` ✅
- `submitAssignment()` ✅  
- `getAssignmentSubmission()` ✅

### Response Format
```json
{
    "message": "Success message",
    "data": {
        // Assignment/Submission data
        "submission": {
            "id": 1,
            "status": "graded",
            "score": 8.5,
            "feedback": "Good work!"
        }
    }
}
```

## Performance Considerations

### Database Optimization
- **Indexes:** On foreign keys and frequently queried columns
- **Pagination:** For large result sets
- **Selective Fields:** Only fetch needed columns
- **Connection Pooling:** Efficient database connections

### File Storage
- **Directory Structure:** Organized by type
- **File Naming:** Unique names to prevent conflicts
- **Cleanup:** Remove orphaned files
- **Size Limits:** Prevent abuse

## Deployment Notes

### Environment Setup
- **Upload Directory:** Ensure `uploads/assignments/` exists
- **File Permissions:** Proper read/write permissions
- **Database Schema:** Run setup_server.js first
- **Dependencies:** multer, dayjs, path, fs

### Production Considerations
- **File Storage:** Consider cloud storage for production
- **Backup:** Regular backup of uploaded files
- **Monitoring:** Log file operations
- **Security:** Virus scanning for uploads

## Comparison với Model-based Approach

### Controller Approach (Current)
✅ **Pros:**
- Direct database control
- Better performance
- Easier debugging
- Flexible queries
- No ORM overhead

❌ **Cons:**
- More boilerplate code
- Manual query writing
- Less abstraction

### Model Approach (Previous)
✅ **Pros:**
- Clean abstraction
- Reusable methods
- Type safety
- Easier testing

❌ **Cons:**
- Additional layer
- Potential performance overhead
- Less flexibility

## Kết luận

Assignment Controller implementation đã hoàn thành với:
- ✅ **Database Schema Compliance:** Tuân thủ 100% schema từ setup_server.js
- ✅ **Controller Pattern:** Theo cấu trúc AttendanceController
- ✅ **Security:** Role-based access, validation đầy đủ
- ✅ **File Upload:** Multer integration với type validation
- ✅ **Testing:** Comprehensive test coverage
- ✅ **Documentation:** Swagger API docs
- ✅ **Flutter Integration:** Compatible với existing ApiService

Hệ thống đã sẵn sàng cho production với đầy đủ tính năng quản lý bài tập và nộp bài.