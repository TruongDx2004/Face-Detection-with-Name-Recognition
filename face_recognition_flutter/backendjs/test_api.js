#!/usr/bin/env node
    /**
     * Test script for Face Attendance API
     */
    
    const axios = require('axios');
    
    const SERVER_URL = "http://localhost:8000";
    
    async function testLogin() {
        console.log("Testing login...");
        
        try {
            const response = await axios.post(`${SERVER_URL}/auth/login`, {
                username: "admin",
                password: "admin123"
            });
            
            if (response.status === 200) {
                console.log("✅ Admin login successful");
                return response.data.token;
            }
        } catch (error) {
            console.log(`❌ Login failed: ${error.response?.data?.message || error.message}`);
            return null;
        }
    }
    
    async function testProfile(token) {
        console.log("Testing profile...");
        
        try {
            const response = await axios.get(`${SERVER_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.status === 200) {
                const profile = response.data.data;
                console.log(`✅ Profile: ${profile.full_name} (${profile.role})`);
            }
        } catch (error) {
            console.log(`❌ Profile failed: ${error.response?.data?.message || error.message}`);
        }
    }
    
    async function testCreateSession() {
        console.log("🔍 Testing attendance session creation...");
    
        try {
            // 1. Đăng nhập tài khoản giáo viên
            const teacherLogin = await axios.post(`${SERVER_URL}/auth/login`, {
                username: "teacher1",
                password: "teacher123"
            });
    
            if (teacherLogin.status !== 200) throw new Error("Login failed");
    
            const teacherToken = teacherLogin.data.token;
    
            // 2. Dữ liệu khởi tạo: class_id và subject_id phải chính xác với dữ liệu database
            const sessionData = {
                class_id: 1,        // ID lớp học (ví dụ: CNTT01)
                subject_id: 2,      // ID môn học (ví dụ: Python Programming)
                start_time: "09:00:00" // Thời gian bắt đầu buổi học
            };
    
            // 3. Gửi request tạo session
            const response = await axios.post(
                `${SERVER_URL}/attendance/create-session`,
                sessionData,
                {
                    headers: {
                        Authorization: `Bearer ${teacherToken}`
                    }
                }
            );
    
            if (response.status === 201) {
                const session = response.data;
                console.log(`✅ Session created successfully. Session ID: ${session.session_id}`);
                return session.session_id;
            } else {
                console.log(`⚠️ Unexpected response status: ${response.status}`);
            }
    
        } catch (error) {
            console.log(`❌ Session creation failed: ${error.response?.data?.error || error.message}`);
        }
    
        return null;
    }
    
    
    async function main() {
        console.log("🚀 Testing Face Attendance API");
        console.log("=" .repeat(40));
        
        // Test server is running
        try {
            const response = await axios.get(SERVER_URL);
            console.log(`✅ Server is running: ${response.data.message}`);
        } catch (error) {
            console.log("❌ Server is not running. Please start it first.");
            return;
        }
        
        // Test login
        const token = await testLogin();
        if (!token) {
            return;
        }
        
        // Test profile
        await testProfile(token);
        
        // Test session creation
        const sessionId = await testCreateSession(token);
        
        console.log("🎉 All tests completed!");
    }
    
    if (require.main === module) {
        main().catch(console.error);
    }
    
    module.exports = { testLogin, testProfile, testCreateSession };
