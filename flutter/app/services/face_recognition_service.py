import cv2
import numpy as np
import os
import base64
from PIL import Image
from io import BytesIO
from typing import Tuple, Optional, List
from app.utils.config import settings # type: ignore

class FaceRecognitionService:
    def __init__(self):
        self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.load_trained_model()
        
        # Tạo thư mục nếu chưa có
        os.makedirs(settings.DATASET_PATH, exist_ok=True)
        os.makedirs(settings.UPLOAD_PATH, exist_ok=True)
        os.makedirs("trainer", exist_ok=True)
    
    def load_trained_model(self):
        """Load trained model nếu có"""
        try:
            if os.path.exists(settings.TRAINER_PATH):
                self.recognizer.read(settings.TRAINER_PATH)
                print("✅ Loaded trained model successfully")
            else:
                print("⚠️ No trained model found. Please train first.")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
    
    def decode_base64_image(self, image_data: str) -> np.ndarray:
        """Decode base64 image to OpenCV format"""
        try:
            # Remove data URL prefix if exists
            if 'data:image' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            image = Image.open(BytesIO(image_bytes))
            
            # Convert to OpenCV format
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            return opencv_image
        except Exception as e:
            raise ValueError(f"Invalid image data: {e}")
    
    def detect_faces(self, image: np.ndarray) -> Tuple[List, np.ndarray]:
        """Detect faces in image"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.2, 
            minNeighbors=5,
            minSize=(30, 30)
        )
        return faces, gray
    
    def recognize_face(self, image_data: str) -> Tuple[Optional[int], float]:
        """Recognize face from base64 image"""
        try:
            # Decode image
            image = self.decode_base64_image(image_data)
            faces, gray = self.detect_faces(image)
            
            if len(faces) == 0:
                return None, 0.0
            
            # Get largest face
            largest_face = max(faces, key=lambda f: f[2] * f[3])
            x, y, w, h = largest_face
            face_roi = gray[y:y+h, x:x+w]
            
            # Predict
            user_id, confidence = self.recognizer.predict(face_roi)
            
            # Convert confidence to percentage (lower is better in OpenCV)
            confidence_percentage = max(0, 100 - confidence)
            
            return user_id, confidence_percentage
            
        except Exception as e:
            print(f"❌ Error in face recognition: {e}")
            return None, 0.0
    
    def save_face_image(self, user_id: int, image_data: str, count: int) -> str:
        """Save face image for training"""
        try:
            image = self.decode_base64_image(image_data)
            faces, gray = self.detect_faces(image)
            
            if len(faces) == 0:
                raise ValueError("No face detected in image")
            
            # Get first face
            x, y, w, h = faces[0]
            face_img = gray[y:y+h, x:x+w]
            
            # Save image
            filename = f"User.{user_id}.{count}.jpg"
            filepath = os.path.join(settings.DATASET_PATH, filename)
            cv2.imwrite(filepath, face_img)
            
            return filepath
            
        except Exception as e:
            raise ValueError(f"Error saving face image: {e}")
    
    def train_faces(self) -> int:
        """Train face recognition model from dataset"""
        try:
            face_samples = []
            ids = []
            
            # Read all images from dataset
            if not os.path.exists(settings.DATASET_PATH):
                return 0
                
            for filename in os.listdir(settings.DATASET_PATH):
                if filename.endswith('.jpg'):
                    try:
                        # Extract user ID from filename
                        parts = filename.split('.')
                        if len(parts) >= 3 and parts[0] == 'User':
                            user_id = int(parts[1])
                            
                            # Load image
                            image_path = os.path.join(settings.DATASET_PATH, filename)
                            pil_image = Image.open(image_path).convert('L')
                            img_numpy = np.array(pil_image, 'uint8')
                            
                            # Detect faces
                            faces = self.face_cascade.detectMultiScale(img_numpy)
                            
                            for (x, y, w, h) in faces:
                                face_samples.append(img_numpy[y:y+h, x:x+w])
                                ids.append(user_id)
                    except (ValueError, IndexError) as e:
                        print(f"⚠️ Skipping invalid filename {filename}: {e}")
                        continue
            
            if len(face_samples) == 0:
                return 0
            
            # Train the recognizer
            self.recognizer.train(face_samples, np.array(ids))
            
            # Save the model
            os.makedirs("trainer", exist_ok=True)
            self.recognizer.save(settings.TRAINER_PATH)
            
            unique_faces = len(np.unique(ids))
            print(f"✅ Training completed. {unique_faces} faces trained with {len(face_samples)} samples")
            
            return unique_faces
            
        except Exception as e:
            print(f"❌ Error in training: {e}")
            return 0

# Initialize face service
face_service = FaceRecognitionService()