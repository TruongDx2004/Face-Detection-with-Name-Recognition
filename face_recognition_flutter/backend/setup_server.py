# setup_server.py
"""
Script để setup và chạy Face Attendance API Server
"""

import os
import sys
import subprocess
import mysql.connector
from mysql.connector import Error
import requests
import json
import base64
from pathlib import Path
import bcrypt

# ========================================
# CONFIGURATION
# ========================================

# Database config
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '12345678',  # Thay đổi password của bạn
    'database': 'face_attendance'
}

# Server config
SERVER_HOST = 'localhost'
SERVER_PORT = 8000
SERVER_URL = f'http://{SERVER_HOST}:{SERVER_PORT}'

# Test credentials
TEST_USERS = {
    'admin': {'username': 'admin', 'password': 'admin123'},
    'teacher': {'username': 'teacher1', 'password': 'teacher123'},
    'student': {'username': 'student1', 'password': 'student123'}
}

# ========================================
# UTILITY FUNCTIONS
# ========================================

def print_step(step_name):
    print(f"\n{'='*50}")
    print(f"🔄 {step_name}")
    print(f"{'='*50}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️ {message}")

def create_directories():
    """Tạo các thư mục cần thiết"""
    print_step("CREATING DIRECTORIES")
    
    directories = [
        'dataset',
        'trainer',
        'uploads',
        'models',
        'app',
        'app/routers',
        'app/services',
        'app/models',
        'app/utils'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print_success(f"Created directory: {directory}")

def check_mysql_connection():
    """Kiểm tra kết nối MySQL"""
    print_step("CHECKING MYSQL CONNECTION")
    
    try:
        # Test connection without database first
        config = DB_CONFIG.copy()
        config.pop('database', None)
        
        connection = mysql.connector.connect(**config)
        if connection.is_connected():
            print_success("MySQL connection successful")
            connection.close()
            return True
    except Error as e:
        print_error(f"MySQL connection failed: {e}")
        print_info("Make sure MySQL is running and credentials are correct")
        return False

def setup_database():
    """Setup database và chạy SQL script"""
    print_step("SETTING UP DATABASE")
    
    try:
        # Connect without database
        config = DB_CONFIG.copy()
        config.pop('database', None)
        
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        # Create database
        cursor.execute(f"DROP DATABASE IF EXISTS {DB_CONFIG['database']}")
        cursor.execute(f"CREATE DATABASE {DB_CONFIG['database']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print_success(f"Database '{DB_CONFIG['database']}' created")
        
        # Use database
        cursor.execute(f"USE {DB_CONFIG['database']}")
        
        # Read and execute SQL script
        sql_script = """
        -- Users table
        CREATE TABLE users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE,
            role ENUM('student', 'teacher', 'admin') NOT NULL,
            student_id VARCHAR(20) UNIQUE NULL,
            class_name VARCHAR(50) NULL,
            is_active BOOLEAN DEFAULT TRUE,
            face_trained BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_username (username),
            INDEX idx_role (role),
            INDEX idx_student_id (student_id)
        );

        -- Attendance sessions table
        CREATE TABLE attendance_sessions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            teacher_id INT NOT NULL,
            subject VARCHAR(100) NOT NULL,
            class_name VARCHAR(50) NOT NULL,
            session_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_teacher_id (teacher_id),
            INDEX idx_session_date (session_date),
            INDEX idx_is_active (is_active),
            FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Attendances table
        CREATE TABLE attendances (
            id INT PRIMARY KEY AUTO_INCREMENT,
            session_id INT NOT NULL,
            student_id INT NOT NULL,
            attendance_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            confidence_score FLOAT NULL,
            image_path VARCHAR(255) NULL,
            status ENUM('present', 'late', 'absent') DEFAULT 'present',
            INDEX idx_session_id (session_id),
            INDEX idx_student_id (student_id),
            UNIQUE KEY unique_attendance (session_id, student_id),
            FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Face images table
        CREATE TABLE face_images (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            image_path VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """
        
        # Execute each statement
        for statement in sql_script.split(';'):
            if statement.strip():
                cursor.execute(statement)
        
        # Danh sách user và mật khẩu tương ứng
        users = [
            {"username": "admin", "password": "admin123", "full_name": "System Administrator", "email": "admin@school.edu", "role": "admin"},
            {"username": "teacher1", "password": "teacher123", "full_name": "Nguyễn Văn A", "email": "teacher1@school.edu", "role": "teacher"},
            {"username": "student1", "password": "student123", "full_name": "Lê Văn C", "email": "student1@school.edu", "role": "student", "student_id": "SV001", "class_name": "CNTT01"},
            {"username": "student2", "password": "student123", "full_name": "Phạm Thị D", "email": "student2@school.edu", "role": "student", "student_id": "SV002", "class_name": "CNTT01"}
        ]

        # Tạo các câu lệnh INSERT
        insert_statements = []
        for user in users:
            hashed_pw = bcrypt.hashpw(user["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            if user["role"] == "student":
                stmt = f"""INSERT INTO users (username, password_hash, full_name, email, role, student_id, class_name)
        VALUES ('{user["username"]}', '{hashed_pw}', '{user["full_name"]}', '{user["email"]}', '{user["role"]}', '{user["student_id"]}', '{user["class_name"]}');"""
            else:
                stmt = f"""INSERT INTO users (username, password_hash, full_name, email, role)
        VALUES ('{user["username"]}', '{hashed_pw}', '{user["full_name"]}', '{user["email"]}', '{user["role"]}');"""
            insert_statements.append(stmt)
        
        for query in insert_statements:
            cursor.execute(query)
        
        connection.commit()
        print_success("Database tables created and sample data inserted")
        
        cursor.close()
        connection.close()
        return True
        
    except Error as e:
        print_error(f"Database setup failed: {e}")
        return False

def check_dependencies():
    """Kiểm tra và cài đặt dependencies"""
    print_step("CHECKING DEPENDENCIES")
    
    required_packages = [
        'fastapi==0.104.1',
        'uvicorn[standard]==0.24.0',
        'mysql-connector-python==8.2.0',
        'opencv-python==4.8.1.78',
        'pillow==10.1.0',
        'numpy==1.24.3',
        'python-multipart==0.0.6',
        'python-jose[cryptography]==3.3.0',
        'passlib[bcrypt]==1.7.4',
        'python-dotenv==1.0.0',
        'pydantic==2.5.0',
        'sqlalchemy==2.0.23',
        'pymysql==1.1.0',
        'requests==2.31.0'
    ]
    
    print_info("Installing required packages...")
    
    for package in required_packages:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print_success(f"Installed: {package}")
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to install {package}: {e}")
            return False
    
    return True

def download_cascade_file():
    """Download Haar cascade file"""
    print_step("DOWNLOADING HAAR CASCADE FILE")
    
    cascade_url = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
    cascade_path = "models/haarcascade_frontalface_default.xml"
    
    try:
        os.makedirs("models", exist_ok=True)
        
        if not os.path.exists(cascade_path):
            print_info("Downloading haarcascade_frontalface_default.xml...")
            response = requests.get(cascade_url)
            
            with open(cascade_path, 'wb') as f:
                f.write(response.content)
            
            print_success("Haar cascade file downloaded")
        else:
            print_success("Haar cascade file already exists")
            
        return True
        
    except Exception as e:
        print_error(f"Failed to download cascade file: {e}")
        return False

def create_env_file():
    """Tạo file .env"""
    print_step("CREATING ENVIRONMENT FILE")
    
    env_content = f"""# Database Configuration
DATABASE_URL=mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Paths
DATASET_PATH=dataset
TRAINER_PATH=trainer/trainer.yml
FACE_CASCADE_PATH=models/haarcascade_frontalface_default.xml
UPLOAD_PATH=uploads

# Face Recognition
CONFIDENCE_THRESHOLD=50
"""
    
    with open('.env', 'w', encoding='utf-8') as f:
        f.write(env_content)
    
    print_success("Environment file created: .env")

def create_init_files():
    """Tạo các file __init__.py"""
    print_step("CREATING INIT FILES")
    
    init_files = [
        'app/__init__.py',
        'app/models/__init__.py',
        'app/routers/__init__.py',
        'app/services/__init__.py',
        'app/utils/__init__.py'
    ]
    
    for init_file in init_files:
        Path(init_file).touch()
        print_success(f"Created: {init_file}")

def test_server():
    """Test server endpoints"""
    print_step("TESTING SERVER ENDPOINTS")
    
    # Wait for server to start
    import time
    time.sleep(3)
    
    try:
        # Test root endpoint
        response = requests.get(f"{SERVER_URL}/")
        if response.status_code == 200:
            print_success("Root endpoint working")
        else:
            print_error(f"Root endpoint failed: {response.status_code}")
            return False
        
        # Test login
        login_data = TEST_USERS['admin']
        response = requests.post(f"{SERVER_URL}/auth/login", json=login_data)
        
        if response.status_code == 200:
            print_success("Admin login working")
            token = response.json()['access_token']
            
            # Test protected endpoint
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(f"{SERVER_URL}/auth/profile", headers=headers)
            
            if response.status_code == 200:
                print_success("Protected endpoint working")
                print_info(f"Admin profile: {response.json()['full_name']}")
            else:
                print_error("Protected endpoint failed")
                
        else:
            print_error(f"Login failed: {response.text}")
            return False
            
        return True
        
    except requests.ConnectionError:
        print_error("Cannot connect to server. Make sure it's running.")
        return False
    except Exception as e:
        print_error(f"Test failed: {e}")
        return False

def run_server():
    """Chạy server"""
    print_step("STARTING SERVER")
    
    print_info(f"Starting server at {SERVER_URL}")
    print_info("Press Ctrl+C to stop the server")
    
    try:
        # Change to app directory if main.py is there
        os.chdir('app')
        subprocess.run([
            sys.executable, '-m', 'uvicorn', 
            'main:app', 
            '--host', SERVER_HOST, 
            '--port', str(SERVER_PORT), 
            '--reload'
        ])
    except KeyboardInterrupt:
        print_info("\nServer stopped by user")
    except Exception as e:
        print_error(f"Failed to start server: {e}")

def create_test_script():
    """Tạo script test API"""
    print_step("CREATING TEST SCRIPT")
    
    test_script = '''#!/usr/bin/env python3
"""
Test script for Face Attendance API
"""

import requests
import json

SERVER_URL = "http://localhost:8000"

def test_login():
    """Test login functionality"""
    print("Testing login...")
    
    # Test admin login
    response = requests.post(f"{SERVER_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    
    if response.status_code == 200:
        print("✅ Admin login successful")
        return response.json()['access_token']
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_profile(token):
    """Test profile endpoint"""
    print("Testing profile...")
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{SERVER_URL}/auth/profile", headers=headers)
    
    if response.status_code == 200:
        profile = response.json()
        print(f"✅ Profile: {profile['full_name']} ({profile['role']})")
    else:
        print(f"❌ Profile failed: {response.text}")

def test_create_session(token):
    """Test creating attendance session"""
    print("Testing session creation...")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # First login as teacher
    teacher_response = requests.post(f"{SERVER_URL}/auth/login", json={
        "username": "teacher1",
        "password": "teacher123"
    })
    
    if teacher_response.status_code == 200:
        teacher_token = teacher_response.json()['access_token']
        teacher_headers = {'Authorization': f'Bearer {teacher_token}'}
        
        # Create session
        session_data = {
            "subject": "Python Programming",
            "class_name": "CNTT01",
            "start_time": "09:00"
        }
        
        response = requests.post(f"{SERVER_URL}/teacher/create-session", 
                               json=session_data, headers=teacher_headers)
        
        if response.status_code == 200:
            session = response.json()
            print(f"✅ Session created: ID {session['session_id']}")
            return session['session_id']
        else:
            print(f"❌ Session creation failed: {response.text}")
    
    return None

def main():
    print("🚀 Testing Face Attendance API")
    print("=" * 40)
    
    # Test server is running
    try:
        response = requests.get(SERVER_URL)
        print(f"✅ Server is running: {response.json()['message']}")
    except:
        print("❌ Server is not running. Please start it first.")
        return
    
    # Test login
    token = test_login()
    if not token:
        return
    
    # Test profile
    test_profile(token)
    
    # Test session creation
    session_id = test_create_session(token)
    
    print("\\n🎉 All tests completed!")

if __name__ == "__main__":
    main()
'''
    
    with open('test_api.py', 'w', encoding='utf-8') as f:
        f.write(test_script)
    
    print_success("Test script created: test_api.py")

def main():
    """Main setup function"""
    print("🚀 FACE ATTENDANCE SYSTEM SETUP")
    print("=" * 60)
    print("This script will setup the complete backend system")
    print("=" * 60)
    
    # Step 1: Check MySQL connection
    if not check_mysql_connection():
        print_error("Please install and configure MySQL first")
        return False
    
    # Step 2: Create directories
    create_directories()
    
    # Step 3: Check and install dependencies
    if not check_dependencies():
        print_error("Failed to install dependencies")
        return False
    
    # Step 4: Download required files
    if not download_cascade_file():
        print_error("Failed to download required files")
        return False
    
    # Step 5: Setup database
    if not setup_database():
        print_error("Failed to setup database")
        return False
    
    # Step 6: Create configuration files
    create_env_file()
    create_init_files()
    create_test_script()
    
    # Final message
    print_step("SETUP COMPLETED SUCCESSFULLY! 🎉")
    print_success("Backend system is ready to use")
    
    print("\\n" + "=" * 60)
    print("📋 NEXT STEPS:")
    print("=" * 60)
    print("1. Start the server:")
    print("   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
    print("")
    print("2. Or use the run_server() function in this script")
    print("")
    print("3. Test the API:")
    print("   python test_api.py")
    print("")
    print("4. Access the API documentation:")
    print(f"   {SERVER_URL}/docs")
    print("")
    print("5. Default login credentials:")
    for role, creds in TEST_USERS.items():
        print(f"   {role.capitalize()}: {creds['username']} / {creds['password']}")
    print("")
    print("📱 Ready to build Flutter app!")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    success = main()
    
    if success:
        # Ask if user wants to start server
        print("\\n🤔 Do you want to start the server now? (y/n): ", end="")
        choice = input().strip().lower()
        
        if choice in ['y', 'yes']:
            run_server()
    else:
        print_error("Setup failed. Please check the errors above.")
        sys.exit(1)