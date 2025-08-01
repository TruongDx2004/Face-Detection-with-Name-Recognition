from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session # type: ignore
from datetime import datetime, timedelta, date, time
from typing import List, Optional
from pydantic import BaseModel
import uvicorn


from .database import create_database, get_db, User, AttendanceSession, Attendance, FaceImage, UserRole, AttendanceStatus
from .auth import authenticate_user, create_access_token, get_current_user, get_password_hash # type: ignore
from .face_service import face_service
from .config import settings


# Create FastAPI app
app = FastAPI(title="Face Attendance API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong production nên chỉ định cụ thể
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: str
    role: UserRole
    student_id: Optional[str] = None
    class_name: Optional[str] = None

class SessionCreate(BaseModel):
    subject: str
    class_name: str
    start_time: str  # Format: "HH:MM"

class AttendanceSubmit(BaseModel):
    session_id: int
    image_data: str

class FaceRegister(BaseModel):
    images: List[str]  # List of base64 images

# Create database tables
create_database()

# Routes
@app.get("/")
async def root():
    return {"message": "Face Attendance API Server", "version": "1.0.0"}

# ============ AUTH ROUTES ============
@app.post("/auth/login")
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.value,
            "student_id": user.student_id,
            "class_name": user.class_name
        }
    }

@app.get("/auth/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role.value,
        "student_id": current_user.student_id,
        "class_name": current_user.class_name,
        "face_trained": current_user.face_trained
    }

# ============ STUDENT ROUTES ============
@app.post("/student/register-face")
async def register_face(
    face_data: FaceRegister,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Only students can register faces")
    
    try:
        saved_images = []
        
        # Save all face images
        for i, image_data in enumerate(face_data.images, 1):
            filepath = face_service.save_face_image(current_user.id, image_data, i)
            saved_images.append(filepath)
            
            # Save to database
            face_img = FaceImage(user_id=current_user.id, image_path=filepath)
            db.add(face_img)
        
        # Update user face_trained status
        current_user.face_trained = True
        db.commit()
        
        # Retrain model
        trained_faces = face_service.train_faces()
        
        return {
            "message": f"Face registered successfully. {len(saved_images)} images saved.",
            "trained_faces": trained_faces
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error registering face: {str(e)}")

@app.post("/student/attendance")
async def submit_attendance(
    attendance_data: AttendanceSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Only students can submit attendance")
    
    # Check if session exists and is active
    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == attendance_data.session_id,
        AttendanceSession.is_active == True
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
    
    # Check if already attended
    existing = db.query(Attendance).filter(
        Attendance.session_id == attendance_data.session_id,
        Attendance.student_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already attended this session")
    
    # Recognize face
    try:
        user_id, confidence = face_service.recognize_face(attendance_data.image_data)
        
        if user_id is None:
            raise HTTPException(status_code=400, detail="No face detected in image")
        
        if user_id != current_user.id:
            raise HTTPException(status_code=400, detail="Face does not match your profile")
        
        if confidence < settings.CONFIDENCE_THRESHOLD:
            raise HTTPException(
                status_code=400, 
                detail=f"Face recognition confidence too low: {confidence:.1f}%"
            )
        
        # Create attendance record
        attendance = Attendance(
            session_id=attendance_data.session_id,
            student_id=current_user.id,
            confidence_score=confidence,
            status=AttendanceStatus.present
        )
        
        db.add(attendance)
        db.commit()
        
        return {
            "message": "Attendance recorded successfully",
            "confidence": confidence,
            "attendance_time": attendance.attendance_time
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing attendance: {str(e)}")

@app.get("/student/attendance-history")
async def get_attendance_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get attendance history with session info
    attendances = db.query(Attendance, AttendanceSession).join(
        AttendanceSession, Attendance.session_id == AttendanceSession.id
    ).filter(Attendance.student_id == current_user.id).all()
    
    history = []
    for attendance, session in attendances:
        history.append({
            "session_id": session.id,
            "subject": session.subject,
            "class_name": session.class_name,
            "session_date": session.session_date,
            "attendance_time": attendance.attendance_time,
            "status": attendance.status.value,
            "confidence_score": attendance.confidence_score
        })
    
    return {"history": history}

# ============ TEACHER ROUTES ============
@app.post("/teacher/create-session")
async def create_attendance_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.teacher:
        raise HTTPException(status_code=403, detail="Only teachers can create sessions")
    
    try:
        # Parse time
        start_time_obj = datetime.strptime(session_data.start_time, "%H:%M").time()
        
        session = AttendanceSession(
            teacher_id=current_user.id,
            subject=session_data.subject,
            class_name=session_data.class_name,
            session_date=date.today(),
            start_time=start_time_obj,
            is_active=True
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return {
            "message": "Session created successfully",
            "session_id": session.id,
            "session_date": session.session_date,
            "start_time": session.start_time
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

@app.put("/teacher/session/{session_id}/close")
async def close_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.teacher:
        raise HTTPException(status_code=403, detail="Only teachers can close sessions")
    
    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == session_id,
        AttendanceSession.teacher_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.is_active = False
    session.end_time = datetime.now().time()
    db.commit()
    
    return {"message": "Session closed successfully"}

@app.get("/teacher/sessions")
async def get_teacher_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.teacher:
        raise HTTPException(status_code=403, detail="Access denied")
    
    sessions = db.query(AttendanceSession).filter(
        AttendanceSession.teacher_id == current_user.id
    ).order_by(AttendanceSession.created_at.desc()).all()
    
    return {"sessions": sessions}

@app.get("/teacher/attendance/{session_id}")
async def get_session_attendance(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.teacher:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Verify session belongs to teacher
    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == session_id,
        AttendanceSession.teacher_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get attendance with student info
    attendances = db.query(Attendance, User).join(
        User, Attendance.student_id == User.id
    ).filter(Attendance.session_id == session_id).all()
    
    attendance_list = []
    for attendance, student in attendances:
        attendance_list.append({
            "student_id": student.student_id,
            "full_name": student.full_name,
            "attendance_time": attendance.attendance_time,
            "status": attendance.status.value,
            "confidence_score": attendance.confidence_score
        })
    
    return {
        "session": session,
        "attendances": attendance_list
    }

# ============ ADMIN ROUTES ============
@app.post("/admin/users")
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if user exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create user
    user = User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        email=user_data.email,
        role=user_data.role,
        student_id=user_data.student_id,
        class_name=user_data.class_name
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "User created successfully", "user_id": user.id}

@app.get("/admin/users")
async def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = db.query(User).all()
    return {"users": users}

@app.get("/admin/statistics")
async def get_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_users = db.query(User).count()
    total_students = db.query(User).filter(User.role == UserRole.student).count()
    total_teachers = db.query(User).filter(User.role == UserRole.teacher).count()
    total_sessions = db.query(AttendanceSession).count()
    total_attendances = db.query(Attendance).count()
    
    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_sessions": total_sessions,
        "total_attendances": total_attendances
    }

# ============ UTILITY ROUTES ============
@app.post("/admin/retrain-model")
async def retrain_model(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        trained_faces = face_service.train_faces()
        return {
            "message": "Model retrained successfully",
            "trained_faces": trained_faces
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retraining model: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)