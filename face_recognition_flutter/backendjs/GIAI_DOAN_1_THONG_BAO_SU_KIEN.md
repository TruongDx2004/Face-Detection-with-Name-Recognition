# GIAI ĐOẠN 1 - Thiết kế cấu trúc dữ liệu & chuẩn bị môi trường

## ✅ Đã hoàn thành

### 🗄️ Cấu trúc Database

Đã tạo migration và thiết kế 4 bảng chính cho hệ thống thông báo và sự kiện:

#### 1. `notifications_events` - Bảng chính lưu thông báo và sự kiện
- **Thông tin cơ bản**: title, content, type (notification/event), category
- **Thông tin người tạo**: created_by (admin/nhà trường)
- **Thông tin thời gian**: publish_date, event_start_datetime, event_end_datetime, registration_deadline
- **Thông tin địa điểm**: location, organizer
- **Thông tin đăng ký**: allow_registration, max_participants, registration_fee
- **File đính kèm**: image_path, attachment_path
- **Targeting**: target_audience (JSON) - cho phép gửi đến nhóm cụ thể
- **Trạng thái**: status (draft/published/archived/cancelled), is_priority
- **Metadata**: view_count, tags (JSON)

#### 2. `event_registrations` - Bảng đăng ký tham gia sự kiện
- **Thông tin đăng ký**: event_id, student_id, registration_date, status
- **Ghi chú**: notes (từ sinh viên), admin_notes (từ admin)
- **Thanh toán**: payment_status, payment_date, payment_reference

#### 3. `notification_views` - Bảng theo dõi lượt xem
- **Tracking**: notification_id, student_id, viewed_at, device_info
- **Unique constraint**: mỗi sinh viên chỉ tính 1 lượt xem cho mỗi thông báo

#### 4. `push_notification_logs` - Bảng log thông báo đẩy
- **Targeting**: target_type, target_data (JSON)
- **Nội dung**: push_title, push_body
- **Thống kê**: total_recipients, successful_sends, failed_sends
- **Trạng thái**: status (pending/sending/completed/failed)

### 📋 Models (Sequelize)

Đã tạo 4 model tương ứng với cấu trúc database:

#### 1. `NotificationEvent.js`
- **Validation**: event dates, registration logic
- **Associations**: với User (creator), EventRegistration, NotificationView, PushNotificationLog
- **Business methods**: kiểm tra trạng thái đăng ký, sự kiện, v.v.
- **Scopes**: published, priority, notifications, events, upcoming, etc.

#### 2. `EventRegistration.js`
- **Associations**: với NotificationEvent, User (student)
- **Business methods**: kiểm tra khả năng hủy, thanh toán, xác nhận
- **Scopes**: active, confirmed, paid, recent

#### 3. `NotificationView.js`
- **Associations**: với NotificationEvent, User (student)
- **Business methods**: phân loại thiết bị, kiểm tra thời gian xem
- **Scopes**: recent, mobile, web

#### 4. `PushNotificationLog.js`
- **Associations**: với NotificationEvent
- **Business methods**: tính tỷ lệ thành công, thời gian thực hiện
- **Scopes**: completed, failed, active, recent

### 🔧 Services

#### `NotificationService.js`
Service layer chính cho business logic:

**Cho Sinh viên:**
- `getNotificationsForStudent()` - Lấy danh sách thông báo/sự kiện
- `getNotificationDetails()` - Xem chi tiết và mark as viewed
- `registerForEvent()` - Đăng ký tham gia sự kiện
- `cancelEventRegistration()` - Hủy đăng ký sự kiện
- `getStudentRegistrations()` - Lấy danh sách đăng ký của sinh viên

**Cho Admin:**
- `createNotification()` - Tạo thông báo/sự kiện mới
- `updateNotification()` - Cập nhật thông báo/sự kiện
- `deleteNotification()` - Xóa thông báo/sự kiện
- `getEventRegistrations()` - Xem danh sách đăng ký sự kiện
- `updateRegistrationStatus()` - Cập nhật trạng thái đăng ký
- `getNotificationStats()` - Thống kê views và đăng ký

### ✅ Validators

#### `notificationValidator.js`
Validation schemas cho tất cả operations:

**Validation schemas:**
- `createNotificationSchema` - Validation tạo mới
- `updateNotificationSchema` - Validation cập nhật
- `eventRegistrationSchema` - Validation đăng ký sự kiện
- `getNotificationsQuerySchema` - Validation query parameters
- `updateRegistrationStatusSchema` - Validation cập nhật trạng thái
- `validateImageFile()` - Validation file ảnh
- `validateAttachmentFile()` - Validation file đính kèm

### ⚙️ Configuration

#### `notifications.js`
File cấu hình tập trung cho toàn bộ hệ thống:

**Các config chính:**
- **UPLOAD_SETTINGS**: Cấu hình upload file (size, types, directories)
- **CATEGORIES**: Các loại thông báo với màu sắc và icon
- **STATUS**: Trạng thái các đăng ký và thanh toán
- **PUSH_NOTIFICATION**: Cấu hình Firebase và templates
- **PAGINATION**: Cài đặt phân trang
- **CACHE**: Cài đặt cache TTL
- **EMAIL_NOTIFICATIONS**: Cấu hình email
- **VALIDATION**: Rules validation
- **DATETIME**: Cài đặt múi giờ và format
- **FEATURES**: Feature flags để enable/disable tính năng

### 🔄 Migration

Đã cập nhật `migrations.js` để include migration mới:
- **File**: `005_create_notifications_and_events_system.sql`
- **Tích hợp**: Vào built-in migrations của hệ thống
- **Sample data**: Tạo sẵn 1 thông báo và 1 sự kiện mẫu

## 📁 Cấu trúc Files đã tạo

```
backendjs/
├── migrations/
│   └── create_notifications_and_events_system.sql
├── src/
│   ├── models/
│   │   ├── NotificationEvent.js
│   │   ├── EventRegistration.js
│   │   ├── NotificationView.js
│   │   └── PushNotificationLog.js
│   ├── services/
│   │   └── NotificationService.js
│   ├── validators/
│   │   └── notificationValidator.js
│   └── config/
│       └── notifications.js
└── setup/
    └── migrations.js (đã cập nhật)
```

## 🎯 Tính năng hỗ trợ sẵn

### Cho Admin (Nhà trường):
- ✅ Tạo thông báo chung hoặc sự kiện
- ✅ Phân loại theo category (academic, extracurricular, urgent, general)
- ✅ Upload hình ảnh minh họa và file đính kèm
- ✅ Targeting đối tượng (tất cả sinh viên hoặc lớp cụ thể)
- ✅ Quản lý trạng thái (draft/published/archived/cancelled)
- ✅ Thiết lập sự kiện với thời gian, địa điểm
- ✅ Cấu hình đăng ký (cho phép/không, giới hạn người, phí)
- ✅ Xem thống kê views và đăng ký
- ✅ Quản lý danh sách đăng ký sinh viên

### Cho Sinh viên:
- ✅ Xem danh sách thông báo/sự kiện (có phân trang, filter)
- ✅ Xem chi tiết thông báo/sự kiện
- ✅ Theo dõi trạng thái đã xem/chưa xem
- ✅ Đăng ký tham gia sự kiện
- ✅ Hủy đăng ký sự kiện
- ✅ Xem danh sách sự kiện đã đăng ký
- ✅ Kiểm tra trạng thái đăng ký và thanh toán

### Hệ thống:
- ✅ Push notification logs (chuẩn bị cho tích hợp Firebase)
- ✅ View tracking và analytics
- ✅ Caching configuration
- ✅ File upload validation
- ✅ Email notification templates
- ✅ Comprehensive validation
- ✅ Database constraints và indexes
- ✅ Error handling

## 🚀 Sẵn sàng cho Giai đoạn 2

Cấu trúc dữ liệu và business logic đã hoàn thiện, có thể chuyển sang:
- **GIAI ĐOẠN 2**: Tạo Controllers và API endpoints
- **GIAI ĐOẠN 3**: Tạo giao diện Admin
- **GIAI ĐOẠN 4**: Tạo giao diện Mobile cho sinh viên

## 🔧 Cách sử dụng

### 1. Chạy migration:
```bash
cd backendjs
node setup_server.js
# hoặc
npm run migrate
```

### 2. Sử dụng Service:
```javascript
const NotificationService = require('./src/services/NotificationService');
const service = new NotificationService(models);

// Tạo sự kiện mới
const event = await service.createNotification(adminId, {
    title: "Hội thao sinh viên 2024",
    content: "...",
    type: "event",
    category: "extracurricular",
    event_start_datetime: "2024-12-01T09:00:00Z",
    allow_registration: true,
    max_participants: 500,
    target_audience: { all_students: true }
});

// Sinh viên đăng ký sự kiện
const registration = await service.registerForEvent(eventId, studentId, "Tôi muốn tham gia");
```

## 📝 Notes

- Database được thiết kế linh hoạt, dễ mở rộng
- Validation comprehensive và có thể customize
- Support cả thông báo và sự kiện trong 1 bảng
- Targeting linh hoạt với JSON field
- Sẵn sàng tích hợp push notification (Firebase)
- Có business logic methods để check trạng thái
- Performance optimized với indexes