# Face Attendance Backend API

Hệ thống API backend cho ứng dụng điểm danh bằng nhận diện khuôn mặt, được tổ chức theo mô hình MVC với cấu trúc rõ ràng và dễ bảo trì.

## 🏗️ Cấu trúc dự án

```
backendjs/
├── src/
│   ├── config/           # Cấu hình ứng dụng
│   │   ├── app.js        # Cấu hình Express app
│   │   ├── constants.js  # Hằng số và cấu hình
│   │   └── database.js   # Cấu hình database
│   ├── controllers/      # Controllers xử lý logic
│   │   ├── AuthController.js
│   │   ├── AdminController.js
│   │   ├── FaceController.js
│   │   └── AttendanceController.js
│   ├── models/          # Models tương tác với database
│   │   ├── User.js
│   │   ├── Class.js
│   │   └── Subject.js
│   ├── routes/          # Định nghĩa routes
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── faceRoutes.js
│   │   └── attendanceRoutes.js
│   ├── middleware/      # Middleware
│   │   ├── auth.js      # Authentication & Authorization
│   │   ├── errorHandler.js # Xử lý lỗi
│   │   └── logger.js    # Logging
│   ├── services/        # Business logic services
│   │   └── faceService.js
│   ├── validators/      # Validation schemas
│   │   └── authValidator.js
│   ├── server.js        # Entry point
│   └── swagger.js       # API documentation
├── uploads/             # File uploads
├── dataset/             # Face dataset
├── trainer/             # Trained models
├── logs/               # Log files
├── .env                # Environment variables
├── .env.example        # Environment template
├── package.json
└── README.md
```

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
cd backendjs
npm install
```

### 2. Cấu hình môi trường

Sao chép file `.env.example` thành `.env` và cấu hình:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=face_attendance

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=24h

# Server
PORT=8000
NODE_ENV=development

# Face Recognition
CONFIDENCE_THRESHOLD=50
DATASET_PATH=dataset
TRAINER_PATH=trainer/trainer.yml
```

### 3. Chạy ứng dụng

```bash
# Development mode
npm run dev

# Production mode
npm start

# Setup database (nếu cần)
npm run setup
```

## 📚 API Documentation

Sau khi chạy server, truy cập:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔧 Các tính năng chính

### 1. Authentication & Authorization
- Đăng nhập/đăng ký với JWT
- Phân quyền theo role (admin, teacher, student)
- Middleware bảo mật

### 2. Face Recognition
- Đăng ký khuôn mặt từ video/ảnh
- Huấn luyện model AI
- Nhận diện khuôn mặt real-time

### 3. Attendance Management
- Tạo session điểm danh
- Điểm danh bằng nhận diện khuôn mặt
- Báo cáo và thống kê

### 4. Admin Management
- Quản lý người dùng
- Quản lý lớp học và môn học
- Thống kê hệ thống

## 🛠️ Công nghệ sử dụng

- **Framework**: Express.js
- **Database**: MySQL với mysql2
- **Authentication**: JWT
- **File Upload**: Multer
- **Validation**: Joi
- **Documentation**: Swagger
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan + Custom Logger

## 📁 Cấu trúc MVC

### Models
- Chứa logic tương tác với database
- Định nghĩa các phương thức CRUD
- Validation dữ liệu

### Controllers
- Xử lý request/response
- Gọi các services và models
- Trả về kết quả cho client

### Routes
- Định nghĩa endpoints
- Áp dụng middleware
- Kết nối với controllers

### Services
- Business logic phức tạp
- Tích hợp với external APIs
- Xử lý file và AI

## 🔒 Bảo mật

- JWT authentication
- Role-based authorization
- Rate limiting
- Input validation
- Error handling
- CORS configuration
- Helmet security headers

## 📊 Logging & Monitoring

- Access logs
- Error logs
- Custom logger với multiple levels
- Health check endpoint
- Graceful shutdown

## 🧪 Testing

```bash
# Chạy tests
npm test

# Test coverage
npm run test:coverage
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (nếu có)
```bash
docker build -t face-attendance-api .
docker run -p 8000:8000 face-attendance-api
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `GET /api/auth/profile` - Lấy thông tin profile

### Face Recognition
- `POST /api/face/register-video` - Đăng ký khuôn mặt từ video
- `POST /api/face/register-image` - Đăng ký khuôn mặt từ ảnh
- `POST /api/face/train` - Huấn luyện model
- `POST /api/face/recognize` - Nhận diện khuôn mặt

### Attendance
- `POST /api/attendance/sessions` - Tạo session điểm danh
- `GET /api/attendance/sessions` - Lấy danh sách sessions
- `POST /api/attendance/mark` - Điểm danh bằng khuôn mặt
- `GET /api/attendance/sessions/:id/report` - Báo cáo điểm danh

### Admin
- `GET /api/admin/users` - Quản lý người dùng
- `GET /api/admin/classes` - Quản lý lớp học
- `GET /api/admin/stats` - Thống kê hệ thống

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên GitHub repository.