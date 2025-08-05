import cv2
import numpy as np
import os
import argparse
import json
from datetime import datetime

# ======== THAM SỐ DÒNG LỆNH =========
parser = argparse.ArgumentParser()
parser.add_argument('--image', required=True, help='Đường dẫn ảnh đầu vào')
parser.add_argument('--model', default='trainer/trainer.yml', help='Đường dẫn model đã huấn luyện')
parser.add_argument('--cascade', default='models/haarcascade_frontalface_default.xml', help='Đường dẫn cascade file')
parser.add_argument('--debug_dir', default='debug_images', help='Thư mục lưu ảnh debug')
args = parser.parse_args()

# ======== TẠO THƯ MỤC DEBUG =========
os.makedirs(args.debug_dir, exist_ok=True)

# ======== KHỞI TẠO =========
recognizer = cv2.face.LBPHFaceRecognizer_create(radius=2, neighbors=8, grid_x=8, grid_y=8, threshold=80.0)
recognizer.read(args.model)
faceCascade = cv2.CascadeClassifier(args.cascade)

# ======== HÀM XỬ LÝ ẢNH =========
def process_image(image_path, source_label, debug_dir, save_faces=True):
    if not os.path.exists(image_path):
        return {"success": False, "error": f"Image not found: {image_path}"}, []

    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    # Lưu ảnh gốc
    original_save_path = os.path.join(debug_dir, f"{source_label}_{os.path.splitext(os.path.basename(image_path))[0]}.jpg")
    cv2.imwrite(original_save_path, img)

    # Lưu ảnh lật ngang
    flipped_img = cv2.flip(img, 1)
    flipped_save_path = os.path.join(debug_dir, f"flipped_{source_label}_{os.path.splitext(os.path.basename(image_path))[0]}.jpg")
    cv2.imwrite(flipped_save_path, flipped_img)
    flipped_gray = cv2.cvtColor(flipped_img, cv2.COLOR_BGR2GRAY)
    flipped_gray = cv2.equalizeHist(flipped_gray)
    flipped_gray = cv2.GaussianBlur(flipped_gray, (5, 5), 0)

    # Phát hiện khuôn mặt trên ảnh gốc
    faces = faceCascade.detectMultiScale(
        gray,
        scaleFactor=1.05,
        minNeighbors=5,
        minSize=(50, 50)
    )

    # Phát hiện khuôn mặt trên ảnh lật ngang
    flipped_faces = faceCascade.detectMultiScale(
        flipped_gray,
        scaleFactor=1.05,
        minNeighbors=5,
        minSize=(50, 50)
    )

    results = []
    face_paths = []

    # Nhận diện trên ảnh gốc
    for (x, y, w, h) in faces:
        face_roi = gray[y:y+h, x:x+w]
        face_roi = cv2.resize(face_roi, (100, 100))
        if save_faces:
            face_save_path = os.path.join(debug_dir, f"face_{source_label}_{x}_{y}.jpg")
            cv2.imwrite(face_save_path, face_roi)
            face_paths.append(face_save_path)
        
        label_id, confidence = recognizer.predict(face_roi)
        results.append({
            "label_id": label_id,
            "confidence": round(100 - confidence, 2),
            "timestamp": datetime.now().isoformat(),
            "source": f"{source_label}_original"
        })

    # Nhận diện trên ảnh lật ngang
    for (x, y, w, h) in flipped_faces:
        face_roi = flipped_gray[y:y+h, x:x+w]
        face_roi = cv2.resize(face_roi, (100, 100))
        if save_faces:
            face_save_path = os.path.join(debug_dir, f"flipped_face_{source_label}_{x}_{y}.jpg")
            cv2.imwrite(face_save_path, face_roi)
            face_paths.append(face_save_path)
        
        label_id, confidence = recognizer.predict(face_roi)
        results.append({
            "label_id": label_id,
            "confidence": round(100 - confidence, 2),
            "timestamp": datetime.now().isoformat(),
            "source": f"{source_label}_flipped"
        })

    return {
        "success": True,
        "original": original_save_path,
        "flipped": flipped_save_path
    }, results, face_paths

# ======== XỬ LÝ ẢNH GỐC (LẦN 1) =========
results = []
debug_images = []
initial_result, initial_results, flipped_face_paths = process_image(args.image, "initial", args.debug_dir)
if not initial_result["success"]:
    print(json.dumps(initial_result))
    exit(1)

results.extend(initial_results)
debug_images.append(initial_result["original"])
debug_images.append(initial_result["flipped"])

# ======== XỬ LÝ LẠI CÁC ẢNH KHUÔN MẶT LẬT NGANG (LẦN 2) =========
for face_path in flipped_face_paths:
    if "flipped_face" in face_path:
        second_result, second_results, _ = process_image(face_path, f"reprocess_{os.path.basename(face_path)}", args.debug_dir, save_faces=False)
        if second_result["success"]:
            results.extend(second_results)
            debug_images.append(second_result["original"])
            debug_images.append(second_result["flipped"])

# ======== KẾT HỢP KẾT QUẢ =========
final_results = {}
for result in results:
    label_id = result["label_id"]
    confidence = result["confidence"]
    if label_id not in final_results or confidence > final_results[label_id]["confidence"]:
        final_results[label_id] = result

# ======== OUTPUT =========
print(json.dumps({
    "success": True,
    "detected_faces": len(final_results),
    "results": list(final_results.values()),
    "debug_images": {
        "saved_images": debug_images,
        "faces": [f for f in os.listdir(args.debug_dir) if f.startswith("face_") or f.startswith("flipped_face_")]
    }
}, indent=2))