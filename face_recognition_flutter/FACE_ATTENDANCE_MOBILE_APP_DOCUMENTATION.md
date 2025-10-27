# 📱 Face Attendance Mobile App - Document Chức Năng Chi Tiết

## 📋 Tổng Quan Hệ Thống

**Face Attendance Mobile App** là ứng dụng di động được phát triển bằng Flutter, hỗ trợ hệ thống điểm danh bằng nhận diện khuôn mặt và quản lý học tập cho sinh viên. Ứng dụng tích hợp AI/ML để nhận diện khuôn mặt và cung cấp các tính năng quản lý học tập toàn diện.

---

## 🏗️ Kiến Trúc Ứng Dụng

### **📁 Cấu Trúc Thư Mục**
```
lib/
├── main.dart                 # Entry point của ứng dụng
├── models/                   # Data models và entities
├── screens/                  # UI screens và pages
├── services/                 # Business logic và API services
├── utils/                    # Utilities và constants
└── widgets/                  # Reusable UI components
```

### **🔧 Tech Stack**
- **Framework:** Flutter (Dart)
- **State Management:** StatefulWidget/setState
- **Storage:** FlutterSecureStorage (cho token/user data)
- **Camera:** Camera Plugin
- **ML:** ML Kit Face Detection
- **HTTP:** Dio/HTTP client
- **Logging:** Logger

---

## 👤 Hệ Thống Người Dùng

### **🔐 Xác Thực & Bảo Mật**

#### **AuthService (Singleton Pattern)**
- **Quản lý phiên đăng nhập:** Lưu trữ token và thông tin user an toàn
- **Secure Storage:** Sử dụng FlutterSecureStorage để mã hóa dữ liệu
- **Auto-login:** Kiểm tra trạng thái đăng nhập khi khởi động app
- **Permission Management:** Kiểm tra quyền hạn theo vai trò

#### **Các Vai Trò Người Dùng**
```dart
enum UserRole {
  student,    // Sinh viên
  teacher,    // Giáo viên  
  admin       // Quản trị viên
}
```

**Hiện tại app chỉ hỗ trợ đầy đủ cho vai trò Student.**

---

## 🎓 Chức Năng Dành Cho Sinh Viên

### **🏠 Dashboard - Màn Hình Chính**
- **Thông tin cá nhân:** Hiển thị tên, mã sinh viên, lớp
- **Quick Actions:** Nút truy cập nhanh các chức năng chính
- **Thống kê tổng quan:** Điểm danh, bài tập, điểm số
- **Thông báo:** Hiển thị thông báo mới nhất từ hệ thống

### **📷 Hệ Thống Điểm Danh Bằng Khuôn Mặt**

#### **Face Capture Screen - Màn Hình Chụp Khuôn Mặt**
**Tính năng chính:**
- **Camera Integration:** Sử dụng camera để chụp ảnh thời gian thực
- **Face Detection:** ML Kit phát hiện khuôn mặt trong frame
- **Real-time Preview:** Hiển thị preview camera với face detection overlay
- **Quality Control:** Kiểm tra chất lượng ảnh trước khi submit
- **Location Tracking:** Thu thập vị trí GPS khi điểm danh

#### **ML Kit Face Service**
- **Face Detection:** Phát hiện khuôn mặt trong ảnh
- **Quality Assessment:** Đánh giá chất lượng khuôn mặt (độ rõ, góc nghiêng)
- **Multiple Face Handling:** Xử lý trường hợp có nhiều khuôn mặt

#### **Location Service**
- **GPS Tracking:** Lấy tọa độ GPS hiện tại
- **Geo-fencing:** Kiểm tra sinh viên có ở trong khu vực cho phép
- **Permission Handling:** Quản lý quyền truy cập vị trí

#### **Quy Trình Điểm Danh:**
1. **Chọn buổi học** từ danh sách sessions đang hoạt động
2. **Mở camera** và định vị khuôn mặt
3. **ML Kit validate** chất lượng ảnh
4. **Thu thập GPS** vị trí hiện tại
5. **Submit dữ liệu** lên server để xác thực
6. **Nhận kết quả** điểm danh (thành công/thất bại)

### **📚 Quản Lý Học Tập**

#### **📋 Assignment Management - Quản Lý Bài Tập**
**Tính năng:**
- **Danh sách bài tập:** Xem tất cả assignments theo môn học
- **Chi tiết bài tập:** Xem đề bài, deadline, điểm số
- **Trạng thái bài tập:** Chưa làm, Đã nộp, Quá hạn, Đã chấm điểm
- **File attachments:** Tải xuống tài liệu đính kèm
- **Submission tracking:** Theo dõi lịch sử nộp bài

#### **📊 Grade Management - Quản Lý Điểm Số**
**Tính năng:**
- **Bảng điểm tổng hợp:** Xem điểm tất cả môn học
- **Chi tiết điểm môn:** Điểm thành phần, điểm tổng kết
- **Course Section Grades:** Điểm theo từng khóa học cụ thể
- **Grade breakdown:** Phân tích điểm theo category (attendance, assignment, exam)
- **Statistical data:** Thống kê điểm trung bình, xếp hạng

#### **📝 Exam System - Hệ Thống Thi Trực Tuyến**
**Tính năng:**
- **Exam taking:** Làm bài thi trực tuyến
- **Question types:** Hỗ trợ multiple choice, short answer
- **Rich text content:** Hiển thị đề bài có formatting, hình ảnh
- **Time management:** Đếm ngược thời gian làm bài
- **Auto-save:** Tự động lưu đáp án
- **Exam results:** Xem kết quả và đáp án sau khi thi

### **📅 Schedule Management - Quản Lý Lịch Học**
**Tính năng:**
- **Weekly schedule:** Xem lịch học theo tuần
- **Session details:** Chi tiết buổi học (thời gian, phòng, giáo viên)
- **Active sessions:** Danh sách buổi học đang diễn ra (có thể điểm danh)
- **Session history:** Lịch sử các buổi học đã tham gia

### **📈 Attendance Tracking - Theo Dõi Điểm Danh**
**Tính năng:**
- **Attendance history:** Lịch sử điểm danh theo môn học
- **Attendance statistics:** Thống kê tỷ lệ điểm danh
- **Session results:** Kết quả điểm danh từng buổi học
- **Absence tracking:** Theo dõi số buổi vắng mặt

---

## 🛠️ Services & Technical Components

### **🌐 API Service**
**Chức năng:**
- **HTTP Client:** Quản lý tất cả API calls
- **Authentication:** Tự động thêm JWT token vào headers
- **Error handling:** Xử lý lỗi API một cách thống nhất
- **Retry mechanism:** Tự động retry khi có lỗi network
- **Request/Response logging:** Log chi tiết để debug

**Endpoints chính:**
```dart
// Authentication
POST /auth/login
GET /auth/profile

// Student Features  
POST /student/register-face
POST /student/attendance
GET /student/attendance-history
GET /student/active-sessions

// Academic Features
GET /student/assignments
GET /student/grades
GET /student/exams
GET /student/schedule
```

### **📱 Camera Service**
**Chức năng:**
- **Camera initialization:** Khởi tạo và cấu hình camera
- **Photo capture:** Chụp ảnh chất lượng cao
- **Camera permissions:** Quản lý quyền truy cập camera
- **Multiple camera support:** Hỗ trợ camera trước/sau

### **🎯 ML Kit Face Service**
**Chức năng:**
- **Face detection:** Phát hiện khuôn mặt real-time
- **Face quality assessment:** Đánh giá chất lượng ảnh
- **Multiple face handling:** Xử lý nhiều khuôn mặt trong ảnh
- **Performance optimization:** Tối ưu hiệu suất cho mobile

---

## 📱 UI/UX Components

### **🎨 Custom Widgets**
- **AttendanceCard:** Hiển thị thông tin điểm danh
- **CameraPreviewWidget:** Widget preview camera với overlay
- **CustomButton:** Button có styling nhất quán
- **CustomTextField:** Input field có validation
- **LoadingDialog:** Dialog loading với animation
- **RichTextDisplay:** Hiển thị nội dung rich text/HTML

### **📐 Design System**
- **Color scheme:** Blue accent primary color
- **Typography:** Consistent font sizing và weights
- **Spacing:** Standardized padding và margins
- **Responsive design:** Adaptive layout cho different screen sizes

---

## 📊 Data Models

### **👤 User Model**
```dart
class User {
  final int id;
  final String username;
  final String fullName;
  final String email;
  final UserRole role;
  final bool isActive;
  final bool faceTrained;
  final String? studentCode;
  final int? classId;
  final String? className;
}
```

### **📚 Academic Models**
- **Assignment:** Bài tập với deadline, điểm số, trạng thái
- **CourseSection:** Khóa học cụ thể với teacher, subject
- **Grade:** Điểm số với breakdown theo category
- **AttendanceRecord:** Record điểm danh với timestamp, location
- **Exam:** Bài thi với questions, time limit, results

### **🏫 Course Management Models**
- **Class:** Lớp học với students, teacher
- **Subject:** Môn học với metadata
- **Schedule:** Lịch học với time slots, rooms

---

## 🔒 Security Features

### **🛡️ Data Protection**
- **Secure Storage:** FlutterSecureStorage cho sensitive data
- **Token Management:** JWT token với auto-refresh
- **Biometric Authentication:** Face recognition cho attendance
- **Location Verification:** GPS validation cho điểm danh

### **⚡ Performance Optimization**
- **Image Compression:** Tối ưu kích thước ảnh trước khi upload
- **Caching:** Cache API responses để giảm network calls
- **Lazy Loading:** Load data theo demand
- **Memory Management:** Proper disposal của camera resources

---

## 📈 Analytics & Monitoring

### **📊 Tracking Features**
- **Attendance Analytics:** Thống kê tỷ lệ điểm danh
- **Academic Progress:** Theo dõi tiến độ học tập
- **App Usage:** Monitor user engagement
- **Error Tracking:** Log errors để debugging

### **🔍 Debugging Tools**
- **Logger Integration:** Detailed logging system
- **Network Inspection:** API call monitoring
- **Crash Reporting:** Error tracking và reporting

---

## 🚀 Future Roadmap

### **📋 Planned Features**
- **Teacher Dashboard:** Interface cho giáo viên
- **Admin Panel:** Mobile admin interface
- **Offline Mode:** Hoạt động offline với sync
- **Push Notifications:** Real-time notifications
- **Dark Mode:** Theme switching
- **Multi-language:** Internationalization support

### **🔧 Technical Improvements**
- **State Management:** Migration to Bloc/Riverpod
- **Testing:** Unit và integration tests
- **CI/CD:** Automated build và deployment
- **Performance:** Further optimization cho low-end devices

---

## ⚙️ Cấu Hình & Setup

### **🔗 API Configuration**
```dart
class ApiConstants {
  static const String baseUrl = 'http://10.0.2.2:8000'; // Android emulator
  static const Duration apiTimeout = Duration(seconds: 30);
}
```

### **📦 Dependencies chính**
- `camera`: Camera functionality
- `flutter_secure_storage`: Secure data storage
- `google_ml_kit`: Face detection
- `dio`: HTTP client
- `logger`: Logging system
- `geolocator`: Location services

---

## 📞 Support & Documentation

### **🆘 Troubleshooting**
- **Camera Issues:** Check permissions và device compatibility
- **Face Detection:** Ensure good lighting và clear face visibility
- **Network Errors:** Verify API connectivity và authentication
- **GPS Problems:** Check location permissions và services

### **📚 Additional Resources**
- API Documentation: `/api/docs` endpoint
- Backend Repository: Detailed server-side documentation
- Flutter Documentation: Framework-specific guides

---

*Document này được tạo dựa trên phân tích source code từ thư mục `lib/` của Face Attendance Mobile App. Cập nhật lần cuối: {{current_date}}*