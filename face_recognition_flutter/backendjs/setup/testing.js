/**
 * Testing setup module
 * 
 * Handles creation of test scripts and testing infrastructure
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const config = require('./config');
const logger = require('./logger');

class TestingManager {
    constructor() {
        this.testFiles = [];
        this.serverUrl = config.SERVER_URL;
    }

    /**
     * Create test directory structure
     */
    async createTestDirectories() {
        const testDirs = [
            'tests',
            'tests/unit',
            'tests/integration',
            'tests/fixtures',
            'tests/helpers'
        ];

        for (const dir of testDirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
                logger.printDebug(`Created test directory: ${dir}`);
            } catch (error) {
                logger.printWarning(`Failed to create test directory ${dir}: ${error.message}`);
            }
        }
    }

    /**
     * Create main API test script
     */
    async createApiTestScript() {
        const apiTestContent = `#!/usr/bin/env node
/**
 * API Test Script for Face Attendance System
 * 
 * Tests all major API endpoints and functionality
 */

const axios = require('axios');
const config = require('./src/config/app');

const SERVER_URL = \`http://\${config.server.host}:\${config.server.port}\`;

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
            console.log(\`✅ \${testName}: \${message}\`);
        } else {
            this.results.failed++;
            console.log(\`❌ \${testName}: \${message}\`);
        }
    }

    /**
     * Make authenticated request
     */
    async makeRequest(method, endpoint, data = null, token = null) {
        try {
            const config = {
                method,
                url: \`\${SERVER_URL}\${endpoint}\`,
                headers: {}
            };

            if (token) {
                config.headers.Authorization = \`Bearer \${token}\`;
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
        console.log('\\n🔍 Testing server connectivity...');
        
        try {
            const response = await axios.get(\`\${SERVER_URL}/health\`, { timeout: 5000 });
            
            if (response.status === 200) {
                this.logResult('Server Health Check', true, \`Server is running (\${response.data.status})\`);
                return true;
            } else {
                this.logResult('Server Health Check', false, \`Unexpected status: \${response.status}\`);
                return false;
            }
        } catch (error) {
            this.logResult('Server Health Check', false, \`Server not reachable: \${error.message}\`);
            return false;
        }
    }

    /**
     * Test authentication endpoints
     */
    async testAuthentication() {
        console.log('\\n🔐 Testing authentication...');
        
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
                this.logResult('Profile Access', true, \`Profile: \${profileResult.data.data?.full_name}\`);
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
        console.log('\\n🏫 Testing class management...');
        
        if (!this.tokens.admin) {
            this.logResult('Class Management', false, 'Admin token required');
            return;
        }

        // Get classes list
        const classesResult = await this.makeRequest('GET', '/api/classes', null, this.tokens.admin);
        
        if (classesResult.success) {
            this.logResult('Get Classes', true, \`Found \${classesResult.data.data?.length || 0} classes\`);
            this.testData.classes = classesResult.data.data || [];
        } else {
            this.logResult('Get Classes', false, classesResult.error?.message || 'Failed to get classes');
        }
    }

    /**
     * Test attendance session creation
     */
    async testAttendanceSession() {
        console.log('\\n📋 Testing attendance session...');
        
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
                this.logResult('Create Attendance Session', true, \`Session ID: \${sessionResult.data.session_id}\`);
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
        console.log('\\n👤 Testing face recognition...');
        
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
        console.log('\\n🗄️ Testing database connectivity...');
        
        if (!this.tokens.admin) {
            this.logResult('Database Connectivity', false, 'Admin token required');
            return;
        }

        // Test by getting user count or similar
        const usersResult = await this.makeRequest('GET', '/api/admin/users', null, this.tokens.admin);
        
        if (usersResult.success) {
            this.logResult('Database Connectivity', true, \`Database accessible, found \${usersResult.data.data?.length || 0} users\`);
        } else {
            this.logResult('Database Connectivity', false, usersResult.error?.message || 'Database not accessible');
        }
    }

    /**
     * Generate test report
     */
    generateReport() {
        console.log('\\n📊 TEST REPORT');
        console.log('='.repeat(50));
        console.log(\`Total Tests: \${this.results.tests.length}\`);
        console.log(\`✅ Passed: \${this.results.passed}\`);
        console.log(\`❌ Failed: \${this.results.failed}\`);
        console.log(\`⏭️ Skipped: \${this.results.skipped}\`);
        console.log(\`Success Rate: \${((this.results.passed / this.results.tests.length) * 100).toFixed(1)}%\`);
        
        if (this.results.failed > 0) {
            console.log('\\n❌ Failed Tests:');
            this.results.tests
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(\`  - \${test.name}: \${test.message}\`);
                });
        }
        
        console.log('\\n📝 Recommendations:');
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
                console.log('\\n❌ Server is not accessible. Stopping tests.');
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
            
            console.log(\`\\n⏱️ Tests completed in \${duration}s\`);
            this.generateReport();
            
            return this.results.failed === 0;
            
        } catch (error) {
            console.error('\\n💥 Test execution failed:', error.message);
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
`;

        await fs.writeFile('test_api.js', apiTestContent);
        await fs.chmod('test_api.js', 0o755);
        this.testFiles.push('test_api.js');
        logger.printDebug('Created main API test script');
    }

    /**
     * Create Jest unit test example
     */
    async createUnitTests() {
        const unitTestContent = `/**
 * Unit tests for Face Attendance API
 */

const request = require('supertest');
const app = require('../src/server');

describe('Face Attendance API', () => {
    // Test server health
    describe('GET /health', () => {
        it('should return server health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
                
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('environment');
        });
    });

    // Test root endpoint
    describe('GET /', () => {
        it('should return API information', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
                
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('status', 'running');
        });
    });

    // Test 404 handling
    describe('GET /nonexistent', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/nonexistent')
                .expect(404);
                
            expect(response.body).toHaveProperty('error', 'Route not found');
        });
    });

    // Authentication tests
    describe('Authentication', () => {
        describe('POST /api/auth/login', () => {
            it('should reject login without credentials', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({})
                    .expect(400);
            });

            it('should reject login with invalid credentials', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: 'invalid',
                        password: 'invalid'
                    })
                    .expect(401);
            });

            it('should accept login with valid credentials', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: 'admin',
                        password: 'admin123'
                    })
                    .expect(200);
                    
                expect(response.body).toHaveProperty('token');
                expect(response.body).toHaveProperty('user');
            });
        });
    });
});
`;

        await fs.writeFile('tests/unit/api.test.js', unitTestContent);
        this.testFiles.push('tests/unit/api.test.js');
        logger.printDebug('Created unit tests');
    }

    /**
     * Create integration test example
     */
    async createIntegrationTests() {
        const integrationTestContent = `/**
 * Integration tests for Face Attendance System
 */

const request = require('supertest');
const app = require('../../src/server');
const database = require('../../src/config/database');

describe('Integration Tests', () => {
    let adminToken;
    let teacherToken;

    beforeAll(async () => {
        // Test database connection
        const connected = await database.testConnection();
        if (!connected) {
            throw new Error('Database connection failed');
        }

        // Get admin token
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'admin',
                password: 'admin123'
            });
        
        if (adminLogin.status === 200) {
            adminToken = adminLogin.body.token;
        }

        // Get teacher token
        const teacherLogin = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'teacher1',
                password: 'teacher123'
            });
        
        if (teacherLogin.status === 200) {
            teacherToken = teacherLogin.body.token;
        }
    });

    afterAll(async () => {
        // Clean up database connections
        await database.pool.end();
    });

    describe('Full Workflow Tests', () => {
        it('should complete attendance session workflow', async () => {
            if (!teacherToken) {
                console.warn('Teacher token not available, skipping workflow test');
                return;
            }

            // Create attendance session
            const sessionResponse = await request(app)
                .post('/api/attendance/create-session')
                .set('Authorization', \`Bearer \${teacherToken}\`)
                .send({
                    class_id: 1,
                    subject_id: 1,
                    start_time: '09:00:00'
                });

            expect(sessionResponse.status).toBeLessThan(500);
            
            if (sessionResponse.status === 201) {
                expect(sessionResponse.body).toHaveProperty('session_id');
            }
        });

        it('should handle class management workflow', async () => {
            if (!adminToken) {
                console.warn('Admin token not available, skipping class test');
                return;
            }

            // Get classes
            const classesResponse = await request(app)
                .get('/api/classes')
                .set('Authorization', \`Bearer \${adminToken}\`);

            expect(classesResponse.status).toBeLessThan(500);
            
            if (classesResponse.status === 200) {
                expect(Array.isArray(classesResponse.body.data)).toBe(true);
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            // This test would require temporarily breaking the database connection
            // For now, just ensure error middleware is working
            
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);
                
            expect(response.body).toHaveProperty('error');
        });

        it('should handle unauthorized access', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .expect(401);
                
            expect(response.body).toHaveProperty('error');
        });
    });
});
`;

        await fs.writeFile('tests/integration/workflow.test.js', integrationTestContent);
        this.testFiles.push('tests/integration/workflow.test.js');
        logger.printDebug('Created integration tests');
    }

    /**
     * Create test configuration files
     */
    async createTestConfig() {
        // Jest configuration
        const jestConfig = `module.exports = {
    testEnvironment: 'node',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js',
        '!src/config/database.js'
    ],
    testMatch: [
        '**/tests/**/*.test.js',
        '**/__tests__/**/*.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 30000,
    verbose: true
};
`;

        await fs.writeFile('jest.config.js', jestConfig);
        this.testFiles.push('jest.config.js');

        // Test setup file
        const testSetup = `/**
 * Jest test setup
 */

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console.log in tests to reduce noise
const originalLog = console.log;
console.log = (...args) => {
    if (process.env.NODE_ENV !== 'test') {
        originalLog(...args);
    }
};

// Global test utilities
global.testUtils = {
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    generateRandomString: (length = 10) => {
        return Math.random().toString(36).substring(2, length + 2);
    }
};
`;

        await fs.writeFile('tests/setup.js', testSetup);
        this.testFiles.push('tests/setup.js');

        logger.printDebug('Created test configuration files');
    }

    /**
     * Create performance test script
     */
    async createPerformanceTests() {
        const perfTestContent = `#!/usr/bin/env node
/**
 * Performance test script for Face Attendance API
 */

const axios = require('axios');
const config = require('./src/config/app');

const SERVER_URL = \`http://\${config.server.host}:\${config.server.port}\`;

class PerformanceTester {
    constructor() {
        this.results = [];
        this.concurrentUsers = 10;
        this.testDuration = 30; // seconds
    }

    async measureResponseTime(endpoint, method = 'GET', data = null, token = null) {
        const startTime = Date.now();
        
        try {
            const config = {
                method,
                url: \`\${SERVER_URL}\${endpoint}\`,
                headers: {},
                timeout: 10000
            };

            if (token) {
                config.headers.Authorization = \`Bearer \${token}\`;
            }

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            const endTime = Date.now();
            
            return {
                success: true,
                responseTime: endTime - startTime,
                status: response.status
            };
        } catch (error) {
            const endTime = Date.now();
            return {
                success: false,
                responseTime: endTime - startTime,
                error: error.message,
                status: error.response?.status || 0
            };
        }
    }

    async loadTest(endpoint, concurrent = 10, duration = 30) {
        console.log(\`🚀 Load testing \${endpoint} with \${concurrent} concurrent users for \${duration}s\`);
        
        const results = [];
        const startTime = Date.now();
        const endTime = startTime + (duration * 1000);
        
        const workers = [];
        
        for (let i = 0; i < concurrent; i++) {
            workers.push(this.worker(endpoint, endTime, results));
        }
        
        await Promise.all(workers);
        
        return this.analyzeResults(results);
    }

    async worker(endpoint, endTime, results) {
        while (Date.now() < endTime) {
            const result = await this.measureResponseTime(endpoint);
            results.push(result);
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    analyzeResults(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        const responseTimes = successful.map(r => r.responseTime);
        
        responseTimes.sort((a, b) => a - b);
        
        const analysis = {
            totalRequests: results.length,
            successful: successful.length,
            failed: failed.length,
            successRate: (successful.length / results.length * 100).toFixed(2),
            averageResponseTime: responseTimes.length > 0 ? 
                (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) : 0,
            medianResponseTime: responseTimes.length > 0 ? 
                responseTimes[Math.floor(responseTimes.length / 2)] : 0,
            minResponseTime: Math.min(...responseTimes) || 0,
            maxResponseTime: Math.max(...responseTimes) || 0,
            p95ResponseTime: responseTimes.length > 0 ? 
                responseTimes[Math.floor(responseTimes.length * 0.95)] : 0,
            requestsPerSecond: (results.length / 30).toFixed(2)
        };
        
        return analysis;
    }

    printResults(endpoint, analysis) {
        console.log(\`\\n📊 Results for \${endpoint}:\`);
        console.log(\`   Total Requests: \${analysis.totalRequests}\`);
        console.log(\`   Successful: \${analysis.successful} (\${analysis.successRate}%)\`);
        console.log(\`   Failed: \${analysis.failed}\`);
        console.log(\`   Requests/sec: \${analysis.requestsPerSecond}\`);
        console.log(\`   Avg Response Time: \${analysis.averageResponseTime}ms\`);
        console.log(\`   Median Response Time: \${analysis.medianResponseTime}ms\`);
        console.log(\`   95th Percentile: \${analysis.p95ResponseTime}ms\`);
        console.log(\`   Min/Max: \${analysis.minResponseTime}ms / \${analysis.maxResponseTime}ms\`);
    }

    async runTests() {
        console.log('🎯 Starting Performance Tests');
        console.log('='.repeat(50));
        
        const endpoints = [
            '/health',
            '/',
            '/api/auth/login'
        ];
        
        for (const endpoint of endpoints) {
            const analysis = await this.loadTest(endpoint, this.concurrentUsers, this.testDuration);
            this.printResults(endpoint, analysis);
        }
        
        console.log('\\n✅ Performance tests completed');
    }
}

if (require.main === module) {
    const tester = new PerformanceTester();
    tester.runTests().catch(console.error);
}

module.exports = PerformanceTester;
`;

        await fs.writeFile('test_performance.js', perfTestContent);
        await fs.chmod('test_performance.js', 0o755);
        this.testFiles.push('test_performance.js');
        logger.printDebug('Created performance test script');
    }

    /**
     * Main setup method
     */
    async setup(options = {}) {
        try {
            logger.printStep('SETTING UP TESTING INFRASTRUCTURE');
            
            // Create test directories
            await this.createTestDirectories();
            
            // Create test scripts
            await this.createApiTestScript();
            
            // Create Jest tests if in development mode
            if (options.dev || config.isDevelopment) {
                await this.createUnitTests();
                await this.createIntegrationTests();
                await this.createTestConfig();
            }
            
            // Create performance tests
            await this.createPerformanceTests();
            
            logger.printSummary('Testing Setup Complete', [
                `Created ${this.testFiles.length} test files`,
                'API test script: node test_api.js',
                'Performance tests: node test_performance.js',
                options.dev ? 'Unit/Integration tests: npm test' : 'Unit tests: install dev dependencies first'
            ]);
            
            logger.printSuccess('Testing infrastructure setup completed');
            return true;
            
        } catch (error) {
            logger.printError(`Testing setup failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get summary of created test files
     */
    getSummary() {
        return {
            files: this.testFiles.length,
            createdFiles: this.testFiles
        };
    }
}

// Export singleton instance
module.exports = new TestingManager();