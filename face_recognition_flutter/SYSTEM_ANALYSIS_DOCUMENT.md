# DOCUMENT PHÂN TÍCH HỆ THỐNG QUẢN LÝ GIÁO DỤC VÀ ĐIỂM DANH BẰNG NHẬN DIỆN KHUÔN MẶT

## I. TỔNG QUAN HỆ THỐNG

### 1.1 Mô tả chung
Hệ thống là một ứng dụng quản lý giáo dục tích hợp công nghệ nhận diện khuôn mặt để điểm danh và quản lý học tập. Hệ thống hỗ trợ ba vai trò chính: Admin, Giáo viên và Sinh viên.

### 1.2 Kiến trúc hệ thống
- **Backend**: Node.js + Express.js + MySQL
- **Frontend Web**: React.js 
- **Mobile App**: Flutter (Dart)
- **AI/ML**: Face Recognition với OpenCV, ML Kit
- **Database**: MySQL với các bảng chính

### 1.3 Các tài khoản test
- Admin: admin / admin123
- Teacher: teacher1 / teacher123  
- Student: student1 / student123

---

## II. PHÂN TÍCH CÁC ACTOR (NGƯỜI DÙNG)

### 2.1 Admin (Quản trị viên)
**Mô tả**: Người quản lý toàn bộ hệ thống
**Quyền hạn chính**:
- Quản lý người dùng (tạo, sửa, xóa tài khoản)
- Quản lý lớp học và môn học
- Quản lý phân quyền
- Xem báo cáo tổng thể
- Cấu hình hệ thống

### 2.2 Teacher (Giáo viên)
**Mô tả**: Người dạy và quản lý lớp học
**Quyền hạn chính**:
- Quản lý lớp học phần của mình
- Tạo và quản lý bài tập (assignments)
- Tạo và quản lý đề thi (exams)
- Điểm danh sinh viên
- Chấm bài và nhập điểm
- Xem báo cáo của lớp

### 2.3 Student (Sinh viên)
**Mô tả**: Người học và tham gia các hoạt động học tập
**Quyền hạn chính**:
- Xem thời khóa biểu
- Tham gia điểm danh bằng khuôn mặt
- Xem và nộp bài tập
- Làm bài thi trực tuyến
- Xem điểm số và kết quả học tập
- Đăng ký khuôn mặt

---

## III. CHỨC NĂNG CHÍNH CỦA HỆ THỐNG

### 3.1 Quản lý Authentication & Authorization
- **Đăng nhập/Đăng xuất**: Xác thực người dùng
- **Phân quyền**: Kiểm soát truy cập theo vai trò
- **Quản lý session**: Duy trì trạng thái đăng nhập
- **Bảo mật**: Mã hóa mật khẩu, JWT token

### 3.2 Quản lý Face Recognition  
- **Đăng ký khuôn mặt**: Thu thập và lưu trữ dữ liệu khuôn mặt
- **Nhận diện khuôn mặt**: Xác định danh tính qua camera
- **Training model**: Huấn luyện mô hình nhận diện
- **Điểm danh tự động**: Sử dụng AI để điểm danh

### 3.3 Quản lý User & Class
- **Quản lý người dùng**: CRUD users, phân vai trò
- **Quản lý lớp học**: Tạo lớp, phân công giáo viên
- **Quản lý sinh viên trong lớp**: Thêm/xóa sinh viên
- **Thông tin cá nhân**: Cập nhật profile

### 3.4 Quản lý Course & Subject
- **Quản lý môn học**: CRUD subjects với mã môn, tín chỉ
- **Quản lý lớp học phần**: Course sections theo học kỳ
- **Phân công giảng dạy**: Gán giáo viên cho lớp học phần
- **Lịch học**: Quản lý thời gian và địa điểm

### 3.5 Quản lý Assignment (Bài tập)
- **Tạo bài tập**: Giáo viên tạo bài tập với deadline
- **Template bài tập**: Sử dụng mẫu có sẵn
- **Nộp bài**: Sinh viên upload file hoặc text
- **Chấm bài**: Giáo viên chấm điểm và feedback
- **Rich text editor**: Soạn thảo văn bản phong phú

### 3.6 Quản lý Exam (Thi cử)
- **Tạo đề thi**: Ngân hàng câu hỏi, template
- **Thi trực tuyến**: Làm bài thi trên hệ thống
- **Chấm thi tự động**: Auto grading cho trắc nghiệm
- **Kết quả thi**: Xem điểm và phân tích

### 3.7 Quản lý Attendance (Điểm danh)
- **Tạo session điểm danh**: Giáo viên mở phiên điểm danh
- **Điểm danh bằng khuôn mặt**: Sinh viên điểm danh qua camera
- **Điểm danh thủ công**: Backup method
- **Báo cáo điểm danh**: Thống kê tỷ lệ tham gia

### 3.8 Quản lý Grade (Điểm số)
- **Bảng điểm**: Quản lý điểm từng môn
- **Cấu hình điểm**: Thiết lập thang điểm, trọng số
- **Tính điểm tổng kết**: Công thức tính điểm cuối kỳ
- **Báo cáo học tập**: Transcript, GPA

### 3.9 Schedule Management (Quản lý lịch)
- **Thời khóa biểu**: Xem lịch học theo tuần/tháng
- **Lịch thi**: Quản lý lịch thi của sinh viên
- **Thông báo**: Alerts về lịch học, deadline

---

## IV. CẤU TRÚC DATABASE (CHO ERD)

### 4.1 Nhóm bảng User Management
```sql
users (id, username, password_hash, full_name, email, role, student_id, class_name, is_active, face_trained, created_at, updated_at)
```

### 4.2 Nhóm bảng Academic Management
```sql
subjects (id, name, code, description, credits, is_active, created_at, updated_at)
classes (id, name, code, year, description, teacher_id, status, created_at, updated_at)
course_sections (id, subject_id, class_id, teacher_id, name, semester, year, start_date, end_date, status, created_at, updated_at)
class_students (id, class_id, student_id, student_code, created_at)
```

### 4.3 Nhóm bảng Assignment & Exam
```sql
assignments (id, course_section_id, title, description, assignment_type, max_score, due_date, instructions, attachment_path, is_active, created_at, updated_at)
assignment_submissions (id, assignment_id, student_id, submission_text, attachment_path, score, status, feedback, submitted_at, graded_at)
assignment_templates (id, title, description, content, assignment_type, created_by, is_public, created_at, updated_at)

exams (id, course_section_id, title, description, exam_type, duration, start_time, end_time, max_score, is_active, created_at, updated_at)
exam_questions (id, exam_id, question_text, question_type, options, correct_answer, points, order_index)
exam_results (id, exam_id, student_id, score, start_time, end_time, answers, status, created_at)
exam_templates (id, title, description, questions_data, created_by, is_public, created_at, updated_at)
```

### 4.4 Nhóm bảng Attendance
```sql
attendance_sessions (id, course_section_id, teacher_id, session_date, start_time, end_time, location, status, qr_code, created_at, updated_at)
attendance_records (id, session_id, student_id, check_in_time, attendance_method, face_confidence, location_lat, location_lng, status, created_at)
```

### 4.5 Nhóm bảng Grade Management
```sql
gradebooks (id, course_section_id, student_id, assignment_score, exam_score, final_score, grade, status, created_at, updated_at)
grade_configurations (id, course_section_id, component_name, component_type, weight, max_score, is_active, created_at, updated_at)
student_grades (id, student_id, course_section_id, component_id, score, graded_at, graded_by, notes)
```

---

## V. CÁC USE CASE CHÍNH (CHO USECASE DIAGRAM)

### 5.1 Authentication Use Cases
- UC001: Đăng nhập hệ thống
- UC002: Đăng xuất hệ thống  
- UC003: Đổi mật khẩu
- UC004: Quên mật khẩu

### 5.2 Face Recognition Use Cases
- UC005: Đăng ký khuôn mặt
- UC006: Huấn luyện mô hình nhận diện
- UC007: Nhận diện khuôn mặt để điểm danh
- UC008: Cập nhật dữ liệu khuôn mặt

### 5.3 User Management Use Cases (Admin)
- UC009: Tạo tài khoản người dùng
- UC010: Sửa thông tin người dùng
- UC011: Xóa người dùng
- UC012: Phân quyền người dùng
- UC013: Xem danh sách người dùng

### 5.4 Class Management Use Cases
- UC014: Tạo lớp học
- UC015: Sửa thông tin lớp học
- UC016: Xóa lớp học
- UC017: Thêm sinh viên vào lớp
- UC018: Xóa sinh viên khỏi lớp
- UC019: Xem danh sách lớp học

### 5.5 Subject & Course Section Use Cases
- UC020: Tạo môn học
- UC021: Sửa thông tin môn học
- UC022: Tạo lớp học phần
- UC023: Phân công giáo viên
- UC024: Xem lớp học phần

### 5.6 Assignment Use Cases
- UC025: Tạo bài tập (Teacher)
- UC026: Sửa bài tập (Teacher)
- UC027: Xóa bài tập (Teacher)
- UC028: Xem danh sách bài tập (Student/Teacher)
- UC029: Nộp bài tập (Student)
- UC030: Chấm bài tập (Teacher)
- UC031: Xem kết quả bài tập (Student)
- UC032: Sử dụng template bài tập (Teacher)

### 5.7 Exam Use Cases
- UC033: Tạo đề thi (Teacher)
- UC034: Sửa đề thi (Teacher)
- UC035: Làm bài thi (Student)
- UC036: Nộp bài thi (Student)
- UC037: Chấm thi (Teacher/Auto)
- UC038: Xem kết quả thi (Student)
- UC039: Sử dụng template đề thi (Teacher)

### 5.8 Attendance Use Cases
- UC040: Tạo phiên điểm danh (Teacher)
- UC041: Điểm danh bằng khuôn mặt (Student)
- UC042: Điểm danh thủ công (Teacher)
- UC043: Xem báo cáo điểm danh (Teacher)
- UC044: Xem lịch sử điểm danh (Student)

### 5.9 Grade Management Use Cases
- UC045: Nhập điểm (Teacher)
- UC046: Sửa điểm (Teacher)
- UC047: Cấu hình thang điểm (Teacher)
- UC048: Tính điểm tổng kết (System)
- UC049: Xem bảng điểm (Student)
- UC050: Xuất báo cáo điểm (Teacher)

### 5.10 Schedule Use Cases
- UC051: Xem thời khóa biểu (Student/Teacher)
- UC052: Tạo lịch học (Admin/Teacher)
- UC053: Sửa lịch học (Admin/Teacher)
- UC054: Thông báo thay đổi lịch (System)

---

## VI. QUY TRÌNH NGHIỆP VỤ CHÍNH (CHO ACTIVITY DIAGRAM)

### 6.1 Quy trình Đăng ký và Đăng nhập
1. Người dùng truy cập hệ thống
2. Nhập thông tin đăng nhập (username/password)
3. Hệ thống xác thực thông tin
4. Nếu hợp lệ: Tạo session và chuyển đến dashboard
5. Nếu không hợp lệ: Hiển thị lỗi và yêu cầu nhập lại

### 6.2 Quy trình Đăng ký khuôn mặt
1. Sinh viên đăng nhập vào hệ thống
2. Truy cập chức năng đăng ký khuôn mặt
3. Mở camera và thu thập ảnh khuôn mặt (nhiều góc độ)
4. Hệ thống xử lý và lưu trữ dữ liệu face encoding
5. Cập nhật trạng thái face_trained = true cho user
6. Thông báo đăng ký thành công

### 6.3 Quy trình Điểm danh bằng khuôn mặt
1. Giáo viên tạo phiên điểm danh cho lớp học phần
2. Sinh viên mở app mobile và chọn lớp cần điểm danh
3. Mở camera để chụp ảnh khuôn mặt
4. Hệ thống so sánh với dữ liệu đã lưu
5. Nếu nhận diện thành công: Ghi nhận điểm danh
6. Nếu thất bại: Cho phép thử lại hoặc điểm danh thủ công
7. Cập nhật kết quả vào attendance_records

### 6.4 Quy trình Tạo và Nộp bài tập
1. Giáo viên tạo bài tập cho lớp học phần
2. Thiết lập tiêu đề, mô tả, deadline, điểm tối đa
3. Publish bài tập cho sinh viên
4. Sinh viên xem danh sách bài tập
5. Mở bài tập cần làm và đọc yêu cầu
6. Soạn bài làm (text) hoặc upload file
7. Submit bài tập trước deadline
8. Hệ thống lưu submission và thông báo cho giáo viên

### 6.5 Quy trình Chấm bài và Nhập điểm
1. Giáo viên xem danh sách bài nộp
2. Mở từng bài submission để chấm
3. Đọc nội dung và đánh giá
4. Nhập điểm số và feedback
5. Lưu kết quả chấm bài
6. Sinh viên nhận thông báo có điểm mới
7. Điểm được cập nhật vào gradebook

### 6.6 Quy trình Thi trực tuyến
1. Giáo viên tạo đề thi với ngân hàng câu hỏi
2. Thiết lập thời gian thi, rules
3. Publish đề thi cho sinh viên
4. Sinh viên login và vào phòng thi
5. Bắt đầu làm bài (timer countdown)
6. Trả lời từng câu hỏi
7. Submit bài thi (tự động khi hết giờ)
8. Hệ thống chấm tự động (trắc nghiệm) hoặc giáo viên chấm thủ công
9. Công bố kết quả

### 6.7 Quy trình Quản lý điểm số
1. Giáo viên cấu hình thang điểm cho môn học
2. Thiết lập trọng số: Bài tập (30%), Thi giữa kỳ (20%), Thi cuối kỳ (50%)
3. Nhập điểm từng component khi có kết quả
4. Hệ thống tự động tính điểm tổng kết theo công thức
5. Sinh viên xem điểm từng phần và điểm tổng
6. Xuất transcript khi cần

---

## VII. YÊU CẦU HỆ THỐNG

### 7.1 Yêu cầu chức năng (Functional Requirements)

#### FR001: Authentication & Authorization
- Hệ thống phải hỗ trợ đăng nhập/đăng xuất an toàn
- Phân quyền theo 3 role: Admin, Teacher, Student
- Session management với JWT token
- Password encryption với bcrypt

#### FR002: Face Recognition
- Thu thập và lưu trữ dữ liệu khuôn mặt người dùng
- Nhận diện khuôn mặt real-time qua camera
- Đạt độ chính xác tối thiểu 85% trong điều kiện ánh sáng bình thường
- Hỗ trợ multiple face encoding cho một user

#### FR003: User Management
- CRUD operations cho tất cả user types
- Bulk import users từ Excel/CSV
- Quản lý profile và thông tin cá nhân
- Soft delete để bảo toàn dữ liệu

#### FR004: Academic Management
- Quản lý subjects, classes, course sections
- Phân công teaching assignments
- Quản lý class rosters và enrollment
- Academic calendar integration

#### FR005: Assignment Management
- Rich text editor với MathJax support
- File attachment upload/download
- Template library và reuse
- Deadline management với notifications
- Plagiarism detection (future)

#### FR006: Exam Management
- Question bank với multiple choice, essay types
- Online proctoring (future)
- Auto-grading cho objective questions
- Secure exam environment
- Result analytics và performance metrics

#### FR007: Attendance Management
- Multiple attendance methods: Face recognition, manual, QR code
- Real-time attendance tracking
- Location-based verification
- Attendance reports và analytics
- Integration với academic calendar

#### FR008: Grade Management
- Flexible grading schemes
- Weighted score calculations
- Grade analytics và distribution
- Transcript generation
- Parent/guardian access (future)

### 7.2 Yêu cầu phi chức năng (Non-functional Requirements)

#### NFR001: Performance
- Response time < 2 seconds cho mọi web operations
- Face recognition processing < 3 seconds
- Hỗ trợ đồng thời 500+ concurrent users
- Database query optimization

#### NFR002: Security
- Data encryption in transit và at rest
- HTTPS/SSL enforcement
- Input validation và XSS protection
- SQL injection prevention
- Regular security audits

#### NFR003: Scalability
- Horizontal scaling capability
- Load balancing support
- Database sharding readiness
- CDN integration cho static files

#### NFR004: Reliability
- 99.5% uptime SLA
- Automated backup daily
- Disaster recovery plan
- Error monitoring và alerting

#### NFR005: Usability
- Responsive design cho mobile/tablet/desktop
- Multilingual support (Vietnamese/English)
- Accessibility compliance (WCAG 2.1)
- Intuitive user interface

#### NFR006: Compatibility
- Modern browser support (Chrome, Firefox, Safari, Edge)
- Mobile app cho iOS và Android
- Cross-platform database compatibility
- API versioning support

---

## VIII. KIẾN TRÚC TECHNICAL STACK

### 8.1 Backend Architecture
```
Node.js + Express.js
├── Controllers (Business logic)
├── Models (Data access layer)
├── Routes (API endpoints)
├── Middleware (Auth, validation, logging)
├── Services (External integrations)
└── Utils (Helper functions)
```

### 8.2 Frontend Architecture
```
React.js Web App
├── Components (Reusable UI components)
├── Pages (Route-based views)
├── Services (API communication)
├── Hooks (Custom React hooks)
├── Utils (Utility functions)
└── Styles (CSS/Styled components)

Flutter Mobile App
├── Screens (UI views)
├── Models (Data structures)
├── Services (API & device services)
├── Widgets (Custom UI components)
└── Utils (Helper functions)
```

### 8.3 Database Design
```
MySQL Database
├── Users & Authentication tables
├── Academic Management tables
├── Assignment & Exam tables
├── Attendance tracking tables
├── Grade management tables
└── System configuration tables
```

### 8.4 AI/ML Integration
```
Face Recognition Pipeline
├── OpenCV (Image processing)
├── ML Kit (Mobile face detection)
├── Face encoding storage
├── Recognition algorithms
└── Training data management
```

---

## IX. API DESIGN OVERVIEW

### 9.1 Authentication APIs
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/change-password
```

### 9.2 User Management APIs
```
GET /api/users
POST /api/users
GET /api/users/:id
PUT /api/users/:id
DELETE /api/users/:id
```

### 9.3 Face Recognition APIs
```
POST /api/face/register
POST /api/face/recognize
POST /api/face/train
DELETE /api/face/data/:userId
```

### 9.4 Academic APIs
```
GET /api/subjects
POST /api/subjects
GET /api/classes
POST /api/classes
GET /api/course-sections
POST /api/course-sections
```

### 9.5 Assignment APIs
```
GET /api/assignments
POST /api/assignments
GET /api/assignments/:id
PUT /api/assignments/:id
POST /api/assignments/:id/submit
GET /api/assignments/:id/submissions
```

### 9.6 Attendance APIs
```
POST /api/attendance/sessions
GET /api/attendance/sessions/:id
POST /api/attendance/checkin
GET /api/attendance/reports
```

---

## X. DEPLOYMENT & INFRASTRUCTURE

### 10.1 Development Environment
- Local development với Docker containers
- MySQL database với sample data
- Redis cho session storage
- File storage cho uploads

### 10.2 Production Environment
- Cloud hosting (AWS/GCP/Azure)
- Load balancer với SSL termination
- Database clustering
- CDN cho static assets
- Monitoring và logging

### 10.3 CI/CD Pipeline
- Git-based workflow
- Automated testing
- Build và deployment automation
- Environment-specific configurations

---

## XI. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 11.1 Tính năng đã hoàn thành
- ✅ User authentication và role-based access
- ✅ Face recognition và registration
- ✅ Basic CRUD cho academic entities
- ✅ Assignment management với rich text editor
- ✅ Attendance tracking với face recognition
- ✅ Grade management system
- ✅ Mobile app với Flutter
- ✅ Responsive web interface

### 11.2 Tính năng cần phát triển
- 🔄 Advanced exam proctoring
- 🔄 Plagiarism detection
- 🔄 Parent/guardian portal
- 🔄 Advanced analytics và reporting
- 🔄 Mobile push notifications
- 🔄 Integration với LMS khác

### 11.3 Khuyến nghị kỹ thuật
- Implement Redis caching cho performance
- Add comprehensive logging và monitoring
- Enhance security với rate limiting
- Optimize database queries
- Add automated testing coverage
- Implement proper backup strategy

---

*Document này cung cấp foundation đầy đủ để vẽ Use Case Diagram, ERD, Activity Diagram và đặc tả yêu cầu hệ thống một cách chi tiết và chính xác.*