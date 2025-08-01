#!/usr/bin/env python3
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
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    main()
