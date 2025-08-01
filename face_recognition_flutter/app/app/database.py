# app/database.py
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Float, Text, Time, Date, Enum # type: ignore
from sqlalchemy.ext.declarative import declarative_base # type: ignore
from sqlalchemy.orm import sessionmaker, Session # type: ignore
from sqlalchemy.sql import func # type: ignore
from datetime import datetime
import enum
from app.utils.config import settings

# Database connection
engine = create_engine(settings.DATABASE_URL) # type: ignore
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enums
class UserRole(enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"

class AttendanceStatus(enum.Enum):
    present = "present"
    late = "late"
    absent = "absent"

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password_hash = Column(String(255))
    full_name = Column(String(100))
    email = Column(String(100), unique=True)
    role = Column(Enum(UserRole))
    student_id = Column(String(20), unique=True, nullable=True)
    class_name = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    face_trained = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, index=True)
    subject = Column(String(100))
    class_name = Column(String(50))
    session_date = Column(Date)
    start_time = Column(Time)
    end_time = Column(Time, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

class Attendance(Base):
    __tablename__ = "attendances"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, index=True)
    student_id = Column(Integer, index=True)
    attendance_time = Column(DateTime, default=func.now())
    confidence_score = Column(Float)
    image_path = Column(String(255), nullable=True)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.present)

class FaceImage(Base):
    __tablename__ = "face_images"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    image_path = Column(String(255))
    created_at = Column(DateTime, default=func.now())

# Create tables
def create_database():
    Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()