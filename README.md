# Face Recognition Attendance System using OpenCV (LBPH)

## 📸 Mô tả Dự Án

Đây là một hệ thống nhận diện khuôn mặt thời gian thực sử dụng OpenCV và thuật toán LBPH. Dự án hỗ trợ nhận diện người dùng qua camera, hiển thị tên và độ chính xác, đồng thời có khả năng lưu lại video quá trình nhận diện.

## 🧠 Mô hình sử dụng

- **LBPH (Local Binary Patterns Histograms)**: là mô hình phổ biến trong nhận diện khuôn mặt nhờ hiệu suất cao và không yêu cầu GPU.
- Được huấn luyện từ dữ liệu ảnh grayscale (`.pgm`, `.jpg`, v.v) đã được cắt vùng khuôn mặt.
- Mô hình được lưu dưới dạng `.yml` và được nạp khi chạy chương trình.

## 📂 Cấu trúc thư mục

📁 FaceRecognitionApp/
├── haarcascade_frontalface_default.xml # Bộ phân loại khuôn mặt của OpenCV
├── trainer.yml # File mô hình đã huấn luyện (LBPH)
├── dataset/ # Thư mục chứa ảnh khuôn mặt đã thu thập
├── README.md # Tài liệu mô tả dự án

📦 Yêu cầu cài đặt
pip install opencv-python

