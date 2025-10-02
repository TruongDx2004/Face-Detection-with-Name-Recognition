# Triển khai Ngân hàng Bài tập (Assignment Template Bank)

## Tổng quan
Hệ thống ngân hàng bài tập cho phép giáo viên tạo, quản lý và tái sử dụng các template bài tập. Điều này giúp tiết kiệm thời gian và đảm bảo tính nhất quán khi tạo bài tập cho các khóa học khác nhau.

## Các tính năng chính

### 1. Quản lý Template
- **Tạo template mới**: Giáo viên có thể tạo template với thông tin đầy đủ
- **Chỉnh sửa template**: Cập nhật thông tin template đã có
- **Xóa template**: Soft delete để bảo toàn dữ liệu
- **Phân loại template**: Theo loại bài tập (homework, project, lab, essay)

### 2. Tính năng nâng cao
- **Tags hệ thống**: Gắn tags để dễ dàng tìm kiếm và phân loại
- **Template công khai**: Chia sẻ template với các giáo viên khác
- **Thống kê sử dụng**: Theo dõi số lần template được sử dụng
- **Tìm kiếm thông minh**: Tìm kiếm theo tên, mô tả, tags

### 3. Tái sử dụng Template
- **Tạo bài tập từ template**: Một click để tạo bài tập mới
- **Tùy chỉnh khi sử dụng**: Override các thông tin cần thiết
- **Tracking sử dụng**: Ghi lại mối liên hệ giữa assignment và template

## Cấu trúc Database

### Bảng `assignment_templates`
```sql
CREATE TABLE assignment_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assignment_type ENUM('homework', 'project', 'lab', 'essay'),
    default_max_score DECIMAL(5,2),
    instructions TEXT,
    attachment_path VARCHAR(255),
    tags JSON,
    usage_count INT DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Bảng `assignment_template_usage`
```sql
CREATE TABLE assignment_template_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    template_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Cập nhật bảng `assignments`
```sql
ALTER TABLE assignments 
ADD COLUMN template_id INT NULL,
ADD FOREIGN KEY (template_id) REFERENCES assignment_templates(id);
```

## API Endpoints

### Template Management
- `POST /assignment-templates` - Tạo template mới
- `GET /assignment-templates/teacher/:teacherId` - Lấy templates của giáo viên
- `GET /assignment-templates/public` - Lấy templates công khai
- `GET /assignment-templates/:id` - Lấy chi tiết template
- `PUT /assignment-templates/:id` - Cập nhật template
- `DELETE /assignment-templates/:id` - Xóa template

### Template Discovery
- `GET /assignment-templates/top` - Top templates được sử dụng nhiều nhất
- `GET /assignment-templates/search` - Tìm kiếm theo tags
- `GET /assignment-templates/teacher/:teacherId/stats` - Thống kê templates

### Template Usage
- `POST /assignment-templates/:templateId/create-assignment` - Tạo assignment từ template

## Frontend Components

### 1. AssignmentTemplateBank (`/teacher/assignment-templates`)
- **Tabs**: Templates của tôi vs Templates công khai
- **Filters**: Theo loại bài tập, tìm kiếm
- **Template Cards**: Hiển thị thông tin template với actions
- **Actions**: Sử dụng, Chỉnh sửa, Xóa

### 2. AssignmentTemplateForm (`/teacher/assignment-templates/new|edit`)
- **Form tạo/sửa template**
- **Tag management**: Thêm/xóa tags
- **File upload**: Đính kèm file mẫu
- **Public sharing**: Checkbox chia sẻ công khai

### 3. Enhanced AssignmentForm
- **Template integration**: Hỗ trợ tạo từ template
- **Pre-populated data**: Tự động điền thông tin từ template
- **Template selection**: Link đến ngân hàng template

## Luồng sử dụng

### Tạo Template
1. Giáo viên truy cập "Ngân hàng bài tập"
2. Click "Tạo template mới"
3. Điền thông tin template (tiêu đề, mô tả, hướng dẫn, tags)
4. Chọn chia sẻ công khai nếu muốn
5. Lưu template

### Sử dụng Template
1. Giáo viên vào "Ngân hàng bài tập"
2. Tìm template phù hợp (templates của mình hoặc công khai)
3. Click "Sử dụng" trên template
4. Được chuyển đến form tạo bài tập với dữ liệu đã điền sẵn
5. Tùy chỉnh thông tin cần thiết (hạn nộp, lớp học phần)
6. Tạo bài tập

### Quản lý Template
1. Xem danh sách templates trong tab "Templates của tôi"
2. Sử dụng filters để tìm kiếm
3. Chỉnh sửa hoặc xóa templates khi cần
4. Xem thống kê sử dụng

## Lợi ích

### Cho Giáo viên
- **Tiết kiệm thời gian**: Không cần viết lại hướng dẫn cho bài tập tương tự
- **Tính nhất quán**: Đảm bảo chất lượng bài tập đồng đều
- **Chia sẻ kinh nghiệm**: Học hỏi từ templates của đồng nghiệp
- **Theo dõi hiệu quả**: Thống kê templates được sử dụng nhiều

### Cho Hệ thống
- **Tái sử dụng**: Giảm duplicate content
- **Standardization**: Chuẩn hóa quy trình tạo bài tập
- **Knowledge sharing**: Tận dụng kinh nghiệm tập thể
- **Tracking**: Theo dõi các templates hiệu quả

## Triển khai

### Backend
1. ✅ Tạo migration database
2. ✅ Tạo models: AssignmentTemplate
3. ✅ Tạo controllers: AssignmentTemplateController
4. ✅ Tạo routes: assignmentTemplateRoutes
5. ✅ Cập nhật App.js để đăng ký routes

### Frontend
1. ✅ Tạo components: AssignmentTemplateBank, AssignmentTemplateForm
2. ✅ Cập nhật API service với template endpoints
3. ✅ Cập nhật AssignmentForm để hỗ trợ templates
4. ✅ Thêm navigation từ TeacherAssignments
5. ❌ Cập nhật App.js với routes mới (cần thực hiện)

### Routes cần thêm vào App.js
```jsx
<Route path="/teacher/assignment-templates" element={
    <ProtectedRoute allowedRoles={['teacher']}>
        <AssignmentTemplateBank />
    </ProtectedRoute>
} />

<Route path="/teacher/assignment-templates/new" element={
    <ProtectedRoute allowedRoles={['teacher']}>
        <AssignmentTemplateForm />
    </ProtectedRoute>
} />

<Route path="/teacher/assignment-templates/:id/edit" element={
    <ProtectedRoute allowedRoles={['teacher']}>
        <AssignmentTemplateForm />
    </ProtectedRoute>
} />
```

## Kiểm tra hoạt động

### 1. Khởi động backend
```bash
cd backendjs
npm run dev
```

### 2. Kiểm tra API
- Truy cập http://localhost:8000/docs để xem API documentation
- Test các endpoints assignment-templates

### 3. Khởi động frontend
```bash
cd my-app
npm start
```

### 4. Test workflow
1. Đăng nhập với tài khoản teacher
2. Vào "Bài tập" → "Ngân hàng bài tập"
3. Tạo template mới
4. Sử dụng template để tạo bài tập
5. Kiểm tra templates công khai

## Tính năng mở rộng

### Ngắn hạn
- Import/Export templates
- Template categories nâng cao
- Approval workflow cho templates công khai
- Template versioning

### Dài hạn
- AI-powered template suggestions
- Collaborative template editing
- Template marketplace
- Analytics dashboard cho template usage

---

**Ghi chú**: Hệ thống đã được triển khai và sẵn sàng sử dụng. Chỉ cần thêm routes vào App.js và kiểm tra hoạt động.