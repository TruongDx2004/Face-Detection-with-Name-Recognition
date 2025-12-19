# 🤖 Hướng dẫn sử dụng ChatWidget cho Giáo viên

## 📋 Tổng quan
ChatWidget là một trợ lý AI tích hợp trong hệ thống quản lý giáo dục, giúp giáo viên truy vấn thông tin nhanh chóng thông qua giao diện chat trực quan.

## ✅ Đã cài đặt thành công
- ✅ ChatService để gọi API
- ✅ ChatWidget component với UI đẹp
- ✅ Tích hợp vào TeacherDashboard 
- ✅ Responsive design cho mobile
- ✅ CSS animations và effects
- ✅ Error handling và loading states

## 🚀 Cách sử dụng

### 1. Mở Chat
- Click vào icon 💬 ở góc dưới bên trái
- Chat window sẽ xuất hiện với welcome message
- Hiển thị gợi ý câu hỏi mẫu

### 2. Các loại câu hỏi được hỗ trợ

**📚 Danh sách sinh viên**
- "Danh sách sinh viên lớp CNTT K20"
- "Cho tôi xem học sinh lớp 12A1" 
- "DS sinh viên lớp Toán Tin K19"

**📊 Thông tin điểm danh**
- "Điểm danh lớp CNTT K20 hôm nay"
- "Có bao nhiêu sinh viên vắng hôm qua?"
- "Tình hình điểm danh lớp 12A1"

**📈 Điểm số học tập**
- "Điểm của Nguyễn Văn A"
- "Điểm trung bình của Trần Thị B"
- "Kết quả học tập của Lê Văn C"

**📝 Tình hình bài tập**
- "Ai chưa nộp bài tập tuần 3?"
- "Bài tập tuần 5 lớp CNTT K20"
- "Tình hình nộp bài của lớp 12A1"

### 3. Tính năng đặc biệt
- **Gợi ý câu hỏi**: Click vào suggestions để gửi nhanh
- **Làm mới chat**: Button 🔄 để reset conversation
- **Responsive**: Tự động điều chỉnh trên mobile
- **Loading animation**: Hiển thị khi đang xử lý

## 📱 Responsive Design
- **Desktop**: 380px width, floating bottom-left
- **Tablet**: Adaptive width với max constraints  
- **Mobile**: Full-width trừ margins, 60% height

## 🔧 Cấu hình kỹ thuật

### Files đã tạo:
```
my-app/src/
├── components/
│   ├── ChatWidget.jsx          # Main component
│   ├── ChatWidget.css          # Responsive styles
│   ├── ChatWidget.test.jsx     # Unit tests
│   └── TeacherLayout.jsx       # Reusable layout
└── services/
    └── chat-service.jsx        # API service
```

### Backend Integration:
- Endpoint: `POST /api/chat`
- Authentication: Bearer token required
- Role: teacher, admin only

## 🎨 Customization

### Thay đổi màu sắc:
```css
/* Trong ChatWidget.css */
.chat-button {
    background-color: #your-color;
}
```

### Thay đổi vị trí:
```css
.chat-button {
    bottom: 20px;  /* Distance from bottom */
    left: 20px;    /* Distance from left */
}
```

### Thêm animations:
```css
.message {
    animation: your-animation 0.3s ease;
}
```

## 🐛 Troubleshooting

### Chat không hiển thị:
1. Kiểm tra user role (phải là teacher/admin)
2. Verify import ChatWidget trong component
3. Check CSS file được load

### API lỗi:
1. Kiểm tra backend server đang chạy
2. Verify token authentication
3. Check network console errors

### Mobile không responsive:
1. Kiểm tra ChatWidget.css được import
2. Verify CSS media queries
3. Test trên thiết bị thật

## 📞 Support
- Backend API: `http://localhost:8000/api/chat`
- Frontend Port: `http://localhost:3000`
- Test user: teacher role required

## 🔄 Updates
- v1.0: Basic chat functionality
- v1.1: Responsive design
- v1.2: Animations và UX improvements
- v1.3: Error handling và loading states

---

**ChatWidget đã sẵn sàng sử dụng! 🎉**