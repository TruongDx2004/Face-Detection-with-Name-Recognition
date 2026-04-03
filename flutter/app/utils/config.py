import os
from dotenv import load_dotenv # type: ignore

load_dotenv()

class Settings:
    # Database
    DATABASE_URL = "mysql+pymysql://root:12345678@localhost:3306/face_attendance"
    
    # JWT
    SECRET_KEY = "your-secret-key-here-change-in-production"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    # File paths
    DATASET_PATH = "dataset"
    TRAINER_PATH = "trainer/trainer.yml"
    FACE_CASCADE_PATH = "models/haarcascade_frontalface_default.xml"
    UPLOAD_PATH = "uploads"
    
    # Face recognition
    CONFIDENCE_THRESHOLD = 50  # Ngưỡng tin cậy để nhận diện

settings = Settings()