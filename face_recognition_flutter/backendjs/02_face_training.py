import cv2
import numpy as np
from PIL import Image
import os

# ========= CẤU HÌNH =========
dataset_path = 'dataset'
cascade_path = os.path.join('models', 'haarcascade_frontalface_default.xml')
trainer_output = os.path.join('trainer', 'trainer.yml')

# ========= KHỞI TẠO =========
recognizer = cv2.face.LBPHFaceRecognizer_create(radius=2, neighbors=8, grid_x=8, grid_y=8)
detector = cv2.CascadeClassifier(cascade_path)

# ========= HÀM ĐỌC DỮ LIỆU =========
def getImagesAndLabels(path):
    imagePaths = [os.path.join(path, f) for f in os.listdir(path) if f.endswith('.jpg')]     
    faceSamples = []
    ids = []

    for imagePath in imagePaths:
        try:
            PIL_img = Image.open(imagePath).convert('L')  # grayscale
            img_numpy = np.array(PIL_img, 'uint8')

            # Tiền xử lý ảnh trước khi phát hiện khuôn mặt
            img_numpy = cv2.equalizeHist(img_numpy)
            img_numpy = cv2.GaussianBlur(img_numpy, (5, 5), 0)

            id = int(os.path.split(imagePath)[-1].split(".")[1])
            faces = detector.detectMultiScale(
                img_numpy,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(50, 50)
            )

            for (x, y, w, h) in faces:
                face_img = img_numpy[y:y+h, x:x+w]
                face_img = cv2.resize(face_img, (100, 100))  # Chuẩn hóa kích thước
                faceSamples.append(face_img)
                ids.append(id)
        except Exception as e:
            print(f"[WARNING] Bỏ qua ảnh lỗi: {imagePath} - {e}")

    return faceSamples, ids

# ========= HUẤN LUYỆN =========
print("\n[INFO] Đang huấn luyện khuôn mặt. Vui lòng chờ ...")
faces, ids = getImagesAndLabels(dataset_path)
if len(faces) == 0:
    print("[ERROR] Không tìm thấy ảnh khuôn mặt nào để huấn luyện.")
    exit(1)

recognizer.train(faces, np.array(ids))

# ========= LƯU MODEL =========
if not os.path.exists('trainer'):
    os.makedirs('trainer')

recognizer.write(trainer_output)

print(f"\n[INFO] Đã huấn luyện {len(np.unique(ids))} người. Model lưu tại {trainer_output}")