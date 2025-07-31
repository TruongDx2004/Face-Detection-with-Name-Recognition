import cv2
import os

# ========== CẤU HÌNH ==========
video_path = "input_video3.mp4"

output_dir = "dataset"
face_cascade_path = "haarcascade_frontalface_default.xml"

# ========== KHỞI TẠO ==========
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

face_id = input("\n Nhập ID người dùng rồi nhấn Enter: ")

face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

cam = cv2.VideoCapture(video_path)

if not cam.isOpened():
    print("[LỖI] Không thể mở video. Kiểm tra đường dẫn hoặc codec.")
    exit()

print("\n[INFO] Đang nhận diện khuôn mặt từ video. Vui lòng chờ ...")

count = 0

while True:
    ret, frame = cam.read()
    if not ret:
        print("[INFO] Kết thúc video hoặc lỗi đọc khung hình.")
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_detector.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

    for (x, y, w, h) in faces:
        count += 1
        face_img = gray[y:y+h, x:x+w]

        filename = os.path.join(output_dir, f"User.{face_id}.{count}.jpg")
        cv2.imwrite(filename, face_img)

        cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
        cv2.putText(frame, f"Sample {count}", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 0, 0), 2)

    cv2.imshow('Video Face Capture', frame)

    k = cv2.waitKey(30) & 0xff
    if k == 27:  # ESC để thoát
        break
    elif count >= 30:  # Lấy 30 ảnh khuôn mặt rồi thoát
        break

# ========== DỌN DẸP ==========
print("\n[INFO] Hoàn tất. Đã lưu {0} ảnh khuôn mặt.".format(count))
cam.release()
cv2.destroyAllWindows()
