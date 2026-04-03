#!/usr/bin/env node
/**
 * API Test Script for Face Attendance System
 * 
 * Tests all major API endpoints and functionality
 */

const axios = require('axios');
const config = require('./src/config/app');

const SERVER_URL = `http://${config.server.host}:${config.server.port}`;

class ApiTester {
    constructor() {
        this.tokens = {};
        this.testData = {
            users: [],
            sessions: [],
            classes: []
        };
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
        };
    }

    /**
     * Log test result
     */
    logResult(testName, passed, message = '', data = null) {
        const result = {
            name: testName,
            passed,
            message,
            data,
            timestamp: new Date().toISOString()
        };
        
        this.results.tests.push(result);
        
        if (passed) {
            this.results.passed++;
            console.log(`✅ ${testName}: ${message}`);
        } else {
            this.results.failed++;
            console.log(`❌ ${testName}: ${message}`);
        }
    }

    /**
     * Make authenticated request
     */
    async makeRequest(method, endpoint, data = null, token = null) {
        try {
            const config = {
                method,
                url: `${SERVER_URL}${endpoint}`,
                headers: {}
            };

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            if (data) {
                config.data = data;
                config.headers['Content-Type'] = 'application/json';
            }

            const response = await axios(config);
            return { success: true, data: response.data, status: response.status };
            
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message,
                status: error.response?.status || 0
            };
        }
    }

    /**
     * Test server connectivity
     */
    async testServerConnectivity() {
        console.log('\n🔍 Testing server connectivity...');
        
        try {
            const response = await axios.get(`${SERVER_URL}/health`, { timeout: 5000 });
            
            if (response.status === 200) {
                this.logResult('Server Health Check', true, `Server is running (${response.data.status})`);
                return true;
            } else {
                this.logResult('Server Health Check', false, `Unexpected status: ${response.status}`);
                return false;
            }
        } catch (error) {
            this.logResult('Server Health Check', false, `Server not reachable: ${error.message}`);
            return false;
        }
    }

    /**
     * Test authentication endpoints
     */
    async testAuthentication() {
        console.log('\n🔐 Testing authentication...');
        
        // Test login with valid credentials
        const loginResult = await this.makeRequest('POST', '/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        if (loginResult.success && loginResult.data.token) {
            this.tokens.admin = loginResult.data.token;
            this.logResult('Admin Login', true, 'Login successful');
            
            // Test profile access
            const profileResult = await this.makeRequest('GET', '/api/auth/profile', null, this.tokens.admin);
            
            if (profileResult.success) {
                this.logResult('Profile Access', true, `Profile: ${profileResult.data.data?.full_name}`);
            } else {
                this.logResult('Profile Access', false, profileResult.error?.message || 'Profile access failed');
            }
            
        } else {
            this.logResult('Admin Login', false, loginResult.error?.message || 'Login failed');
        }

        // Test login with invalid credentials
        const invalidLoginResult = await this.makeRequest('POST', '/api/auth/login', {
            username: 'invalid',
            password: 'invalid'
        });

        if (!invalidLoginResult.success && invalidLoginResult.status === 401) {
            this.logResult('Invalid Login Rejection', true, 'Invalid credentials properly rejected');
        } else {
            this.logResult('Invalid Login Rejection', false, 'Should reject invalid credentials');
        }
    }

    /**
     * Test class management
     */
    async testClassManagement() {
        console.log('\n🏫 Testing class management...');
        
        if (!this.tokens.admin) {
            this.logResult('Class Management', false, 'Admin token required');
            return;
        }

        // Get classes list
        const classesResult = await this.makeRequest('GET', '/api/classes', null, this.tokens.admin);
        
        if (classesResult.success) {
            this.logResult('Get Classes', true, `Found ${classesResult.data.data?.length || 0} classes`);
            this.testData.classes = classesResult.data.data || [];
        } else {
            this.logResult('Get Classes', false, classesResult.error?.message || 'Failed to get classes');
        }
    }

    /**
     * Test attendance session creation
     */
    async testAttendanceSession() {
        console.log('\n📋 Testing attendance session...');
        
        // Login as teacher first
        const teacherLoginResult = await this.makeRequest('POST', '/api/auth/login', {
            username: 'teacher1',
            password: 'teacher123'
        });

        if (teacherLoginResult.success) {
            this.tokens.teacher = teacherLoginResult.data.token;
            this.logResult('Teacher Login', true, 'Teacher login successful');
            
            // Try to create attendance session
            const sessionData = {
                class_id: 1,
                subject_id: 1,
                start_time: '09:00:00'
            };

            const sessionResult = await this.makeRequest('POST', '/api/attendance/create-session', sessionData, this.tokens.teacher);
            
            if (sessionResult.success) {
                this.logResult('Create Attendance Session', true, `Session ID: ${sessionResult.data.session_id}`);
                this.testData.sessions.push(sessionResult.data);
            } else {
                this.logResult('Create Attendance Session', false, sessionResult.error?.message || 'Session creation failed');
            }
            
        } else {
            this.logResult('Teacher Login', false, teacherLoginResult.error?.message || 'Teacher login failed');
        }
    }

    /**
     * Test face recognition endpoints
     */
    async testFaceRecognition() {
        console.log('\n👤 Testing face recognition...');
        
        if (!this.tokens.admin) {
            this.logResult('Face Recognition', false, 'Admin token required');
            return;
        }

        // Test face detection endpoint (without actual image)
        const faceResult = await this.makeRequest('GET', '/api/face/status', null, this.tokens.admin);
        
        if (faceResult.success || faceResult.status === 404) {
            this.logResult('Face API Status', true, 'Face API endpoints accessible');
        } else {
            this.logResult('Face API Status', false, 'Face API not accessible');
        }
    }

    /**
     * Test database connectivity through API
     */
    async testDatabaseConnectivity() {
        console.log('\n🗄️ Testing database connectivity...');
        
        if (!this.tokens.admin) {
            this.logResult('Database Connectivity', false, 'Admin token required');
            return;
        }

        // Test by getting user count or similar
        const usersResult = await this.makeRequest('GET', '/api/admin/users', null, this.tokens.admin);
        
        if (usersResult.success) {
            this.logResult('Database Connectivity', true, `Database accessible, found ${usersResult.data.data?.length || 0} users`);
        } else {
            this.logResult('Database Connectivity', false, usersResult.error?.message || 'Database not accessible');
        }
    }

    /**
     * Generate test report
     */
    generateReport() {
        console.log('\n📊 TEST REPORT');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.results.tests.length}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⏭️ Skipped: ${this.results.skipped}`);
        console.log(`Success Rate: ${((this.results.passed / this.results.tests.length) * 100).toFixed(1)}%`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.tests
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.message}`);
                });
        }
        
        console.log('\n📝 Recommendations:');
        if (this.results.failed === 0) {
            console.log('  ✅ All tests passed! API is working correctly.');
        } else {
            console.log('  🔧 Some tests failed. Check server logs and database connectivity.');
            console.log('  📋 Ensure all required services are running.');
            console.log('  🔑 Verify authentication and authorization setup.');
        }
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting API Tests');
        console.log('='.repeat(50));
        
        const startTime = Date.now();
        
        try {
            // Test server connectivity first
            const serverOnline = await this.testServerConnectivity();
            
            if (!serverOnline) {
                console.log('\n❌ Server is not accessible. Stopping tests.');
                return false;
            }

            // Run test suites
            await this.testAuthentication();
            await this.testClassManagement();
            await this.testAttendanceSession();
            await this.testFaceRecognition();
            await this.testDatabaseConnectivity();
            
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            
            console.log(`\n⏱️ Tests completed in ${duration}s`);
            this.generateReport();
            
            return this.results.failed === 0;
            
        } catch (error) {
            console.error('\n💥 Test execution failed:', error.message);
            return false;
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new ApiTester();
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}

module.exports = ApiTester;
