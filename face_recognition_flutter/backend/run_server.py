# run_server.py
"""
Script đơn giản để chạy Face Attendance API Server
"""

import os
import sys
import subprocess
import signal
import time
from pathlib import Path

# Configuration
SERVER_HOST = "0.0.0.0"
SERVER_PORT = 8000
SERVER_URL = f"http://localhost:{SERVER_PORT}"

def print_banner():
    """In banner khởi động"""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║                  FACE ATTENDANCE API SERVER                 ║
║                        Version 1.0.0                        ║
╚══════════════════════════════════════════════════════════════╝
"""
    print(banner)

def check_requirements():
    """Kiểm tra các yêu cầu trước khi chạy"""
    print("🔍 Checking requirements...")
    
    # Check if app directory exists
    if not Path("app").exists():
        print("❌ 'app' directory not found. Please run setup_server.py first.")
        return False
    
    # Check if main.py exists
    if not Path("app/main.py").exists():
        print("❌ 'app/main.py' not found. Please run setup_server.py first.")
        return False
    
    # Check if database config exists
    if not Path(".env").exists():
        print("❌ '.env' file not found. Please run setup_server.py first.")
        return False
    
    print("✅ All requirements met")
    return True

def start_server():
    """Khởi động server"""
    print(f"🚀 Starting server at {SERVER_URL}")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("📊 Alternative docs: http://localhost:8000/redoc")
    print("\n" + "="*60)
    print("🔑 DEFAULT LOGIN CREDENTIALS:")
    print("="*60)
    print("Admin    : admin / admin123")
    print("Teacher  : teacher1 / teacher123") 
    print("Student  : student1 / student123")
    print("="*60)
    print("\n💡 Press Ctrl+C to stop the server")
    print("-"*60)
    
    try:
        # Change to project root directory
        original_dir = os.getcwd()
        
        # Start uvicorn server
        cmd = [
            sys.executable, '-m', 'uvicorn',
            'app.main:app',
            '--host', SERVER_HOST,
            '--port', str(SERVER_PORT),
            '--reload',
            '--reload-dir', 'app'
        ]
        
        process = subprocess.Popen(cmd)
        
        # Handle Ctrl+C gracefully
        def signal_handler(sig, frame):
            print("\n\n🛑 Shutting down server...")
            process.terminate()
            process.wait()
            print("✅ Server stopped successfully")
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        
        # Wait for process to complete
        process.wait()
        
    except FileNotFoundError:
        print("❌ uvicorn not found. Please install it:")
        print("   pip install uvicorn[standard]")
        return False
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False
    
    return True

def show_help():
    """Hiển thị help"""
    help_text = """
USAGE:
    python run_server.py [options]

OPTIONS:
    --help, -h     Show this help message
    --port PORT    Set server port (default: 8000)
    --host HOST    Set server host (default: 0.0.0.0)
    --no-reload    Disable auto-reload
    --check        Check requirements only

EXAMPLES:
    python run_server.py                    # Start server with default settings
    python run_server.py --port 8080        # Start on port 8080
    python run_server.py --check            # Check requirements only
    
API ENDPOINTS:
    GET  /                           # Server info 
    POST /auth/login                 # User login
    GET  /auth/profile               # Get user profile
    POST /student/register-face      # Register student face
    POST /student/attendance         # Submit attendance
    GET  /student/attendance-history # Get attendance history
    POST /teacher/create-session     # Create attendance session
    PUT  /teacher/session/{id}/close # Close session
    GET  /teacher/sessions           # Get teacher sessions
    GET  /admin/users                # Manage users (admin only)
    POST /admin/retrain-model        # Retrain face model
"""
    print(help_text)

def main():
    """Main function"""
    # Update globals with parsed values
    global SERVER_PORT, SERVER_HOST, SERVER_URL
    args = sys.argv[1:]
    
    # Parse arguments
    port = SERVER_PORT
    host = SERVER_HOST
    reload = True
    check_only = False
    
    i = 0
    while i < len(args):
        arg = args[i]
        
        if arg in ['--help', '-h']:
            show_help()
            return
        elif arg == '--port':
            if i + 1 < len(args):
                port = int(args[i + 1])
                i += 1
            else:
                print("❌ --port requires a value")
                return
        elif arg == '--host':
            if i + 1 < len(args):
                host = args[i + 1]
                i += 1
            else:
                print("❌ --host requires a value")
                return
        elif arg == '--no-reload':
            reload = False
        elif arg == '--check':
            check_only = True
        else:
            print(f"❌ Unknown argument: {arg}")
            print("Use --help for usage information")
            return
        
        i += 1
    
    # Print banner
    print_banner()
    
    # Check requirements
    if not check_requirements():
        print("\n💡 Run 'python setup_server.py' to setup the system first")
        return
    
    if check_only:
        print("✅ All checks passed. System is ready to run.")
        return
    
    
    SERVER_PORT = port
    SERVER_HOST = host
    SERVER_URL = f"http://localhost:{SERVER_PORT}"
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()