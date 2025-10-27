# GIAI ĐOẠN 2 - Controllers & API Endpoints

## ✅ Đã hoàn thành

### 🔧 Controllers

#### `NotificationController.js`
Controller chính xử lý tất cả API endpoints cho hệ thống thông báo và sự kiện:

**Student Endpoints:**
- `getNotifications()` - Lấy danh sách thông báo/sự kiện
- `getNotificationById()` - Xem chi tiết thông báo/sự kiện
- `registerForEvent()` - Đăng ký tham gia sự kiện
- `cancelEventRegistration()` - Hủy đăng ký sự kiện
- `getMyRegistrations()` - Xem danh sách đăng ký của mình

**Admin Endpoints:**
- `createNotification()` - Tạo thông báo/sự kiện mới
- `updateNotification()` - Cập nhật thông báo/sự kiện
- `deleteNotification()` - Xóa thông báo/sự kiện
- `getAdminNotifications()` - Lấy tất cả thông báo (admin view)
- `getEventRegistrations()` - Xem danh sách đăng ký sự kiện
- `updateRegistrationStatus()` - Cập nhật trạng thái đăng ký
- `getNotificationStats()` - Thống kê thông báo/sự kiện

**Utility Endpoints:**
- `getCategories()` - Lấy danh sách phân loại
- `getConfig()` - Lấy cấu hình hệ thống

### 🛣️ API Routes

#### **Public Routes (No Authentication)**
```
GET /api/notifications/config        - Lấy cấu hình hệ thống
GET /api/notifications/categories    - Lấy danh sách phân loại
```

#### **Student Routes (Authentication Required)**
```
GET /api/notifications               - Lấy danh sách thông báo/sự kiện
GET /api/notifications/:id           - Xem chi tiết thông báo/sự kiện
POST /api/notifications/:id/register - Đăng ký tham gia sự kiện
DELETE /api/notifications/:id/register - Hủy đăng ký sự kiện
GET /api/notifications/my/registrations - Xem danh sách đăng ký của mình
```

#### **Admin Routes (Admin/Teacher Only)**
```
GET /api/notifications/admin/notifications         - Lấy tất cả thông báo
POST /api/notifications/admin/notifications        - Tạo thông báo/sự kiện mới
PUT /api/notifications/admin/notifications/:id     - Cập nhật thông báo/sự kiện
DELETE /api/notifications/admin/notifications/:id  - Xóa thông báo/sự kiện
GET /api/notifications/admin/notifications/:id/registrations - Xem danh sách đăng ký
GET /api/notifications/admin/notifications/:id/stats - Thống kê thông báo
PUT /api/notifications/admin/registrations/:id/status - Cập nhật trạng thái đăng ký
```

### 📁 File Upload Support

**Middleware:** Multer với cấu hình tùy chỉnh
- **Images**: Max 5MB, JPG/PNG/GIF/WebP
- **Attachments**: Max 10MB, PDF/DOC/XLS/PPT/TXT/ZIP/RAR
- **Storage**: Organized by type (images/attachments)
- **Validation**: File type và size validation

**Upload Fields:**
- `image` - Hình ảnh minh họa
- `attachment` - File đính kèm

### 🔐 Authentication & Authorization

**Middleware Integration:**
- `authenticateToken` - Xác thực JWT token
- `authorize('student')` - Chỉ sinh viên
- `authorize('admin', 'teacher')` - Admin hoặc giáo viên

**Role-based Access:**
- **Students**: Xem, đăng ký sự kiện
- **Admin/Teacher**: Tạo, quản lý thông báo/sự kiện

### 🗄️ Service Layer

#### `RawSqlNotificationService.js`
Implementation thật sự sử dụng raw SQL queries:

**Features:**
- ✅ Tương thích với database hiện có
- ✅ Query optimization với indexes
- ✅ Transaction support
- ✅ Error handling
- ✅ Pagination
- ✅ JSON field handling
- ✅ File path management

### 📝 Validation

**Comprehensive validation sử dụng Joi:**
- Request body validation
- Query parameters validation
- File upload validation
- Business logic validation

**Error handling:**
- Standardized error responses
- Multilingual error messages
- HTTP status codes chuẩn

### 🔧 System Integration

**App Configuration:**
- Routes tích hợp vào `app.js`
- Model initialization tự động
- Error handling middleware
- File serving static

**Response Format:**
- Chuẩn hóa response với `responseHelper`
- Success/Error format nhất quán
- Timestamp và metadata

## 📊 API Endpoints Chi Tiết

### 1. Lấy danh sách thông báo/sự kiện
```http
GET /api/notifications?page=1&limit=20&type=event&category=academic
```

**Query Parameters:**
- `page` (optional): Trang hiện tại (default: 1)
- `limit` (optional): Số items per page (default: 20, max: 100)
- `type` (optional): 'notification' | 'event'
- `category` (optional): 'general' | 'academic' | 'extracurricular' | 'urgent'
- `priority` (optional): true | false

**Response:**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": 1,
        "title": "Thông báo khai giảng",
        "content": "...",
        "type": "notification",
        "category": "academic",
        "publish_date": "2024-01-15T10:00:00Z",
        "is_priority": true,
        "creator_name": "Admin",
        "is_viewed": false,
        "view_count": 150
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 89,
      "items_per_page": 20
    }
  }
}
```

### 2. Xem chi tiết thông báo/sự kiện
```http
GET /api/notifications/1
```

**Response:**
```json
{
  "success": true,
  "message": "Notification details retrieved successfully",
  "data": {
    "id": 1,
    "title": "Hội thao sinh viên 2024",
    "content": "Chi tiết sự kiện...",
    "type": "event",
    "category": "extracurricular",
    "event_start_datetime": "2024-12-01T09:00:00Z",
    "event_end_datetime": "2024-12-03T17:00:00Z",
    "location": "Sân vận động trường",
    "allow_registration": true,
    "registration_deadline": "2024-11-15T23:59:59Z",
    "max_participants": 500,
    "registration_fee": 50000,
    "is_viewed": true,
    "registration_info": {
      "current_registrations": 234,
      "max_participants": 500,
      "is_full": false,
      "is_registration_open": true,
      "user_registration": {
        "id": 15,
        "status": "registered",
        "registration_date": "2024-01-10T14:30:00Z",
        "payment_status": "unpaid"
      }
    }
  }
}
```

### 3. Đăng ký sự kiện
```http
POST /api/notifications/1/register
Content-Type: application/json

{
  "notes": "Tôi muốn tham gia môn bóng đá"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký sự kiện thành công",
  "data": {
    "id": 15,
    "event_id": 1,
    "student_id": 10,
    "status": "registered",
    "notes": "Tôi muốn tham gia môn bóng đá",
    "payment_status": "unpaid",
    "registration_date": "2024-01-10T14:30:00Z"
  }
}
```

### 4. Tạo thông báo/sự kiện (Admin)
```http
POST /api/notifications/admin/notifications
Content-Type: multipart/form-data

{
  "title": "Hội thao sinh viên 2024",
  "content": "Chi tiết sự kiện...",
  "type": "event",
  "category": "extracurricular",
  "event_start_datetime": "2024-12-01T09:00:00Z",
  "event_end_datetime": "2024-12-03T17:00:00Z",
  "location": "Sân vận động trường",
  "allow_registration": true,
  "registration_deadline": "2024-11-15T23:59:59Z",
  "max_participants": 500,
  "registration_fee": 50000,
  "target_audience": {
    "all_students": true
  },
  "status": "published",
  "is_priority": false,
  "tags": ["hội thao", "thể thao", "sinh viên"]
}
// + file uploads: image, attachment
```

### 5. Lấy danh sách đăng ký sự kiện (Admin)
```http
GET /api/notifications/admin/notifications/1/registrations?page=1&status=registered
```

**Response:**
```json
{
  "success": true,
  "message": "Event registrations retrieved successfully",
  "data": {
    "registrations": [
      {
        "id": 15,
        "event_id": 1,
        "student_id": 10,
        "status": "registered",
        "registration_date": "2024-01-10T14:30:00Z",
        "payment_status": "unpaid",
        "student_username": "student001",
        "student_name": "Nguyễn Văn A",
        "student_email": "student001@example.com"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 234,
      "items_per_page": 50
    }
  }
}
```

## 🚀 Error Handling

**Standardized Error Responses:**
```json
{
  "success": false,
  "message": "Đã hết hạn đăng ký",
  "errors": null,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (already exists)
- `500` - Internal Server Error

## 🔧 File Upload

**Supported Operations:**
- Upload hình ảnh minh họa (max 5MB)
- Upload file đính kèm (max 10MB)
- Auto-generated unique filenames
- Directory organization
- File type validation

**File Access:**
```
GET /uploads/notifications/images/filename.jpg
GET /uploads/notifications/attachments/document.pdf
```

## 🚀 Sẵn sàng cho các giai đoạn tiếp theo

**GIAI ĐOẠN 3**: Admin Interface (React)
**GIAI ĐOẠN 4**: Mobile Interface (Flutter)
**GIAI ĐOẠN 5**: Push Notifications & Advanced Features

## 📝 Testing

**Manual Testing với Postman/Thunder Client:**
```bash
# Test authentication
POST http://localhost:3000/api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

# Test get notifications
GET http://localhost:3000/api/notifications
Authorization: Bearer <token>

# Test create notification
POST http://localhost:3000/api/notifications/admin/notifications
Authorization: Bearer <token>
Content-Type: application/json
{
  "title": "Test Event",
  "content": "Test content",
  "type": "event",
  "event_start_datetime": "2024-12-01T09:00:00Z",
  "target_audience": {"all_students": true},
  "status": "published"
}
```

## 🏗️ Kiến trúc

```
Request → Routes → Auth Middleware → Controller → Service → Database → Response
          ↓         ↓                  ↓           ↓         ↓
      Validation  JWT Check      Business Logic  SQL Query  JSON Response
```

**Layers:**
1. **Routes**: URL mapping và middleware
2. **Controllers**: Request/Response handling
3. **Services**: Business logic
4. **Database**: Data persistence
5. **Validation**: Input validation
6. **Middleware**: Cross-cutting concerns