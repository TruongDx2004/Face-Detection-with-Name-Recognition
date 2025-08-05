import cv2
import os
import argparse

# ======== ĐỌC THAM SỐ ==========
parser = argparse.ArgumentParser()
parser.add_argument('--video', required=True, help='Đường dẫn video đầu vào')
parser.add_argument('--user-id', required=True, help='ID người dùng')
parser.add_argument('--output-dir', default='dataset', help='Thư mục lưu ảnh khuôn mặt')
args = parser.parse_args()

video_path = args.video
face_id = args.user_id
output_dir = args.output_dir

# ======== TẠO THƯ MỤC OUTPUT ==========
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# ======== DÙNG CASCADE ==========
face_cascade_path = os.path.join('models', 'haarcascade_frontalface_default.xml')
face_detector = cv2.CascadeClassifier(face_cascade_path)

# ======== MỞ VIDEO ==========
cam = cv2.VideoCapture(video_path)

if not cam.isOpened():
    print("[LỖI] Không thể mở video. Kiểm tra đường dẫn hoặc codec.")
    exit()

print(f"\n[INFO] Đang nhận diện khuôn mặt từ video {video_path} ...")

count = 0
target_samples = 50  # Tăng số lượng mẫu để cải thiện chất lượng dataset

while True:
    ret, frame = cam.read()
    if not ret:
        print("[INFO] Kết thúc video hoặc lỗi đọc khung hình.")
        break

    # Tiền xử lý ảnh: chuyển sang grayscale, cân bằng histogram, giảm nhiễu
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)  # Cân bằng histogram để cải thiện độ tương phản
    gray = cv2.GaussianBlur(gray, (5, 5), 0)  # Giảm nhiễu bằng GaussianBlur

    # Phát hiện khuôn mặt với tham số tối ưu
    faces = face_detector.detectMultiScale(
        gray,
        scaleFactor=1.05,  # Giảm scaleFactor để tăng độ nhạy
        minNeighbors=5,
        minSize=(50, 50)  # Kích thước tối thiểu để loại bỏ nhiễu
    )

    for (x, y, w, h) in faces:
        count += 1
        face_img = gray[y:y+h, x:x+w]
        face_img = cv2.resize(face_img, (100, 100))  # Chuẩn hóa kích thước khuôn mặt

        filename = os.path.join(output_dir, f"User.{face_id}.{count}.jpg")
        cv2.imwrite(filename, face_img)

        cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
        cv2.putText(frame, f"Sample {count}", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 0, 0), 2)

    # Tùy chọn hiển thị nếu muốn debug
    # cv2.imshow('Video Face Capture', frame)

    k = cv2.waitKey(1) & 0xff
    if k == 27:  # ESC để thoát
        break
    elif count >= target_samples:
        break

# ======== DỌN DẸP ==========
print(f"\n[INFO] Hoàn tất. Đã lưu {count} ảnh khuôn mặt.")
cam.release()
cv2.destroyAllWindows()