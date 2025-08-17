import cv2
import os
import argparse
import sys
import json
from datetime import datetime

def main():
    # ========== ARGUMENT PARSING ==========
    parser = argparse.ArgumentParser(description='Create face dataset from video')
    parser.add_argument('--video', required=True, help='Path to video file')
    parser.add_argument('--user-id', required=True, type=int, help='User ID for face dataset')
    parser.add_argument('--output-dir', default='dataset', help='Output directory for dataset')
    parser.add_argument('--max-samples', default=30, type=int, help='Maximum number of face samples')
    
    args = parser.parse_args()
    
    # ========== CẤU HÌNH ==========
    video_path = args.video
    output_dir = args.output_dir
    face_id = args.user_id
    max_samples = args.max_samples
    
    result = {
        "status": "success",
        "message": "",
        "data": {
            "user_id": face_id,
            "samples_collected": 0,
            "output_directory": output_dir,
            "timestamp": datetime.now().isoformat()
        }
    }
    
    try:
        # ========== KHỞI TẠO ==========
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Kiểm tra xem file video có tồn tại không
        if not os.path.exists(video_path):
            result["status"] = "error"
            result["message"] = f"Video file not found: {video_path}"
            print(json.dumps(result))
            sys.exit(1)
        
        face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        
        cam = cv2.VideoCapture(video_path)
        
        if not cam.isOpened():
            result["status"] = "error"
            result["message"] = "Cannot open video file. Check path or codec."
            print(json.dumps(result))
            sys.exit(1)
        
        count = 0
        
        while True:
            ret, frame = cam.read()
            if not ret:
                break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_detector.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
            
            for (x, y, w, h) in faces:
                count += 1
                face_img = gray[y:y+h, x:x+w]
                
                filename = os.path.join(output_dir, f"User.{face_id}.{count}.jpg")
                cv2.imwrite(filename, face_img)
                
                if count >= max_samples:
                    break
            
            if count >= max_samples:
                break
        
        # ========== DỌN DẸP ==========
        cam.release()
        
        result["data"]["samples_collected"] = count
        result["message"] = f"Successfully collected {count} face samples for user {face_id}"
        
        if count == 0:
            result["status"] = "warning"
            result["message"] = "No faces detected in the video"
        
    except Exception as e:
        result["status"] = "error"
        result["message"] = f"Error during dataset creation: {str(e)}"
    
    finally:
        # Output JSON result
        print(json.dumps(result))

if __name__ == "__main__":
    main()