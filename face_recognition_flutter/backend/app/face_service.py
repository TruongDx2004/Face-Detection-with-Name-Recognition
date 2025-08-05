import cv2
import numpy as np
import os
import base64
from PIL import Image
from io import BytesIO
from typing import Tuple, Optional, List
from .config import settings

class FaceRecognitionService:
    def __init__(self):
        self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        
        # Load multiple cascade classifiers for better detection
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.face_cascade_alt = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_alt.xml'
        )
        self.profile_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_profileface.xml'
        )
        
        self.load_trained_model()
        
        # Create directories if they don't exist
        os.makedirs(settings.DATASET_PATH, exist_ok=True)
        os.makedirs(settings.UPLOAD_PATH, exist_ok=True)
        os.makedirs("trainer", exist_ok=True)
    
    def load_trained_model(self):
        """Load trained model if available"""
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
        print(f"Decoding base64 image. Input data length: {len(image_data)}")

        try:
            # Remove data URL prefix if present
            if 'data:image' in image_data:
                try:
                    image_data = image_data.split(',')[1]
                except IndexError:
                    print("Base64 string does not contain expected comma after data URL prefix.")
                    raise ValueError("Invalid image data: Malformed data URL prefix.")
            
            # Decode Base64
            try:
                image_bytes = base64.b64decode(image_data)
                print(f"Base64 decoded. Bytes length: {len(image_bytes)}")
            except (base64.binascii.Error, ValueError) as e:
                print(f"Base64 decoding failed: {e}")
                raise ValueError(f"Invalid image data: Base64 decoding error: {e}")

            # Open image with PIL
            try:
                image = Image.open(BytesIO(image_bytes))
                print(f"PIL Image opened successfully. Format: {image.format}, Mode: {image.mode}")
            except Image.DecompressionBombError as e:
                print(f"Image decompression bomb error: {e}")
                raise ValueError(f"Image too large or corrupt (Decompression bomb): {e}")
            except Exception as e:
                print(f"Error opening image with PIL from bytes: {e}. Possible truncated/corrupt file.")
                raise ValueError(f"Invalid image data: Could not open image (possibly truncated or corrupt): {e}")
            
            if image is None:
                print("PIL Image.open returned None after decoding.")
                raise ValueError("Invalid image data: Could not open image (result is None).")

            # Convert to OpenCV format
            if image.mode != 'RGB':
                image = image.convert('RGB')
                print(f"Converted PIL image to RGB mode.")

            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            print(f"Image converted to OpenCV format. Shape: {opencv_image.shape}")
            return opencv_image
            
        except ValueError as ve:
            raise ve
        except Exception as e:
            print(f"An unexpected error occurred in decode_base64_image: {e}")
            raise ValueError(f"An unexpected error occurred during image decoding: {e}")

    def auto_rotate_image(self, image: np.ndarray) -> Tuple[np.ndarray, int]:
        """Auto-rotate image to find the best orientation for face detection"""
        rotations = [0, 90, 180, 270]
        best_image = image
        best_rotation = 0
        max_faces = 0
        
        for rotation in rotations:
            if rotation == 0:
                rotated_image = image
            elif rotation == 90:
                rotated_image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
            elif rotation == 180:
                rotated_image = cv2.rotate(image, cv2.ROTATE_180)
            elif rotation == 270:
                rotated_image = cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
            
            # Quick face detection test
            gray = cv2.cvtColor(rotated_image, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.2, 
                minNeighbors=4,
                minSize=(30, 30)
            )
            
            print(f"Rotation {rotation}°: Found {len(faces)} faces")
            
            if len(faces) > max_faces:
                max_faces = len(faces)
                best_image = rotated_image
                best_rotation = rotation
        
        if best_rotation != 0:
            print(f"✅ Best orientation found at {best_rotation}° rotation with {max_faces} faces")
        
        return best_image, best_rotation

    def detect_faces_enhanced(self, image: np.ndarray) -> Tuple[List, np.ndarray]:
        """Enhanced face detection with auto-rotation and multiple methods"""
        
        # First, try to find the best orientation
        print("🔄 Testing image orientations...")
        rotated_image, rotation_used = self.auto_rotate_image(image)
        
        # Use the best rotated image
        gray = cv2.cvtColor(rotated_image, cv2.COLOR_BGR2GRAY)
        
        # Apply histogram equalization to improve contrast
        gray_eq = cv2.equalizeHist(gray)
        
        # Try different detection parameters
        detection_params = [
            # (scaleFactor, minNeighbors, minSize)
            (1.1, 3, (20, 20)),  # More sensitive
            (1.1, 4, (30, 30)),  # Default-ish
            (1.2, 5, (30, 30)),  # Original parameters
            (1.3, 6, (40, 40)),  # Less sensitive, larger faces
            (1.1, 3, (15, 15)),  # Very small faces
        ]
        
        all_faces = []
        
        # Try with rotated gray image
        for scale_factor, min_neighbors, min_size in detection_params:
            faces = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=scale_factor, 
                minNeighbors=min_neighbors,
                minSize=min_size,
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            if len(faces) > 0:
                print(f"✅ Found {len(faces)} faces with params: scale={scale_factor}, neighbors={min_neighbors}, minSize={min_size}")
                all_faces.extend(faces)
                break  # Found faces, no need to try other parameters
        
        # Try with histogram equalized image if no faces found
        if len(all_faces) == 0:
            print("🔄 Trying with histogram equalized image...")
            for scale_factor, min_neighbors, min_size in detection_params:
                faces = self.face_cascade.detectMultiScale(
                    gray_eq, 
                    scaleFactor=scale_factor, 
                    minNeighbors=min_neighbors,
                    minSize=min_size,
                    flags=cv2.CASCADE_SCALE_IMAGE
                )
                if len(faces) > 0:
                    print(f"✅ Found {len(faces)} faces with equalized image: scale={scale_factor}, neighbors={min_neighbors}, minSize={min_size}")
                    all_faces.extend(faces)
                    gray = gray_eq  # Use equalized image for final result
                    break
        
        # Try alternative cascade classifier
        if len(all_faces) == 0 and hasattr(self, 'face_cascade_alt'):
            print("🔄 Trying alternative face cascade...")
            for scale_factor, min_neighbors, min_size in detection_params[:3]:
                faces = self.face_cascade_alt.detectMultiScale(
                    gray, 
                    scaleFactor=scale_factor, 
                    minNeighbors=min_neighbors,
                    minSize=min_size
                )
                if len(faces) > 0:
                    print(f"✅ Found {len(faces)} faces with alternative cascade")
                    all_faces.extend(faces)
                    break
        
        # Try profile face detection as last resort
        if len(all_faces) == 0 and hasattr(self, 'profile_cascade'):
            print("🔄 Trying profile face detection...")
            faces = self.profile_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=3,
                minSize=(20, 20)
            )
            if len(faces) > 0:
                print(f"✅ Found {len(faces)} profile faces")
                all_faces.extend(faces)
        
        # Remove duplicate detections
        if len(all_faces) > 1:
            all_faces = self.remove_duplicate_faces(all_faces)
        
        print(f"Final face detection result: {len(all_faces)} faces found (rotation: {rotation_used}°)")
        return all_faces, gray
    
    def remove_duplicate_faces(self, faces: List) -> List:
        """Remove overlapping face detections"""
        if len(faces) <= 1:
            return faces
        
        faces = np.array(faces)
        unique_faces = []
        
        for i, face in enumerate(faces):
            x1, y1, w1, h1 = face
            is_duplicate = False
            
            for unique_face in unique_faces:
                x2, y2, w2, h2 = unique_face
                
                # Calculate overlap
                overlap_x = max(0, min(x1 + w1, x2 + w2) - max(x1, x2))
                overlap_y = max(0, min(y1 + h1, y2 + h2) - max(y1, y2))
                overlap_area = overlap_x * overlap_y
                
                area1 = w1 * h1
                area2 = w2 * h2
                
                # If overlap is more than 50% of either face, consider it duplicate
                if overlap_area > 0.5 * min(area1, area2):
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_faces.append(face)
        
        return unique_faces
    
    def detect_faces(self, image: np.ndarray) -> Tuple[List, np.ndarray]:
        """Original detect_faces method - keeping for compatibility"""
        return self.detect_faces_enhanced(image)
    
    def save_face_image_with_debug(self, user_id: int, image_data: str, count: int) -> str:
        """Enhanced save_face_image with debugging info"""
        print(f"Attempting to save image for user_id: {user_id}, count: {count}")
        print(f"Received image_data length: {len(image_data)}")

        try:
            # Decode image
            try:
                image = self.decode_base64_image(image_data)
                if image is None:
                    raise ValueError("Decoded image is None, check decode_base64_image.")
                print(f"Image decoded successfully. Shape: {image.shape}, Dtype: {image.dtype}")
            except ValueError as ve:
                print(f"Error in base64 decoding for user {user_id}, count {count}: {ve}")
                raise ValueError(f"Error saving face image: Invalid image data: {ve}")
            except Exception as e:
                print(f"Unexpected error during base64 decoding for user {user_id}, count {count}: {e}")
                raise ValueError(f"Error saving face image: Decoding failed unexpectedly: {e}")

            # Save original image for debugging
            debug_path = os.path.join(settings.UPLOAD_PATH, f"debug_user_{user_id}_{count}_original.jpg")
            cv2.imwrite(debug_path, image)
            print(f"Debug: Original image saved to {debug_path}")

            # Detect faces with enhanced method
            faces, gray = self.detect_faces_enhanced(image)

            if len(faces) == 0:
                print(f"❌ No face detected in image for user {user_id}, count {count}")
                
                # Save debug images
                gray_debug_path = os.path.join(settings.UPLOAD_PATH, f"debug_user_{user_id}_{count}_gray.jpg")
                cv2.imwrite(gray_debug_path, gray)
                print(f"Debug: Grayscale image saved to {gray_debug_path}")
                
                # Try with different image preprocessing
                print("🔄 Trying additional preprocessing...")
                
                # Gaussian blur to reduce noise
                blurred = cv2.GaussianBlur(gray, (3, 3), 0)
                faces_blur = self.face_cascade.detectMultiScale(blurred, 1.1, 3, minSize=(20, 20))
                
                if len(faces_blur) > 0:
                    print(f"✅ Found {len(faces_blur)} faces after Gaussian blur")
                    faces = faces_blur
                    gray = blurred
                else:
                    raise ValueError("No face detected in image even after enhanced detection")

            # Get the largest/best face
            if len(faces) > 1:
                print(f"Multiple faces detected ({len(faces)}), selecting largest one")
                largest_face = max(faces, key=lambda f: f[2] * f[3])
            else:
                largest_face = faces[0]
            
            x, y, w, h = largest_face
            face_img = gray[y:y+h, x:x+w]
            
            # Ensure minimum face size
            if w < 50 or h < 50:
                print(f"⚠️ Face size is small ({w}x{h}), resizing to 100x100")
                face_img = cv2.resize(face_img, (100, 100))

            # Save face image
            filename = f"User.{user_id}.{count}.jpg"
            filepath = os.path.join(settings.DATASET_PATH, filename)

            try:
                cv2.imwrite(filepath, face_img)
                print(f"✅ Face image saved successfully to: {filepath}")
                
                # Save debug face crop
                debug_face_path = os.path.join(settings.UPLOAD_PATH, f"debug_user_{user_id}_{count}_face.jpg")
                cv2.imwrite(debug_face_path, face_img)
                print(f"Debug: Face crop saved to {debug_face_path}")
                
                return filepath
            except Exception as e:
                print(f"❌ Error writing image file to {filepath} for user {user_id}, count {count}: {e}")
                raise ValueError(f"Error saving face image: Failed to write image file: {e}")

        except ValueError as ve:
            raise ve
        except Exception as e:
            print(f"❌ An unexpected error occurred in save_face_image for user {user_id}, count {count}: {e}")
            raise ValueError(f"An unexpected error occurred while saving face image: {e}")

    # Keep original method for backward compatibility
    def save_face_image(self, user_id: int, image_data: str, count: int) -> str:
        return self.save_face_image_with_debug(user_id, image_data, count)
    
    def recognize_face(self, image_data: str) -> Tuple[Optional[int], float]:
        """Recognize face from base64 image"""
        try:
            # Decode image
            image = self.decode_base64_image(image_data)
            faces, gray = self.detect_faces_enhanced(image)
            
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