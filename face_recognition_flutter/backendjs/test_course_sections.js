// test_course_sections.js
/**
 * Test script for Course Section APIs
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
let authToken = '';

// Test credentials
const TEST_ADMIN = {
    username: 'admin',
    password: 'admin123'
};

// Test data
const TEST_COURSE_SECTION = {
    name: 'CNTT02 - JavaScript Programming',
    code: 'CNTT02_JS101',
    class_id: 1,
    subject_id: 1,
    teacher_id: 2,
    semester: 'HK1',
    academic_year: '2024-2025',
    max_students: 35,
    description: 'Lớp học phần JavaScript Programming cho lớp CNTT02'
};

// Utility functions
function printStep(stepName) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔄 ${stepName}`);
    console.log(`${'='.repeat(50)}`);
}

function printSuccess(message) {
    console.log(`✅ ${message}`);
}

function printError(message) {
    console.log(`❌ ${message}`);
}

function printInfo(message) {
    console.log(`ℹ️ ${message}`);
}

// Test functions
async function login() {
    printStep('LOGIN TEST');
    
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_ADMIN);
        
        if (response.data.success && response.data.data.token) {
            authToken = response.data.data.token;
            printSuccess('Login successful');
            printInfo(`Token: ${authToken.substring(0, 20)}...`);
            return true;
        } else {
            printError('Login failed - no token received');
            return false;
        }
    } catch (error) {
        printError(`Login failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testGetAllCourseSections() {
    printStep('GET ALL COURSE SECTIONS TEST');
    
    try {
        const response = await axios.get(`${BASE_URL}/api/course-sections`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            printSuccess('Get all course sections successful');
            printInfo(`Found ${response.data.data.total} course sections`);
            console.log('Course sections:', JSON.stringify(response.data.data.courseSections, null, 2));
            return true;
        } else {
            printError('Get all course sections failed');
            return false;
        }
    } catch (error) {
        printError(`Get all course sections failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testCreateCourseSection() {
    printStep('CREATE COURSE SECTION TEST');
    
    try {
        const response = await axios.post(`${BASE_URL}/api/course-sections`, TEST_COURSE_SECTION, {
            headers: { 
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            printSuccess('Create course section successful');
            printInfo(`Created course section ID: ${response.data.data.id}`);
            console.log('Created course section:', JSON.stringify(response.data.data, null, 2));
            return response.data.data.id;
        } else {
            printError('Create course section failed');
            return null;
        }
    } catch (error) {
        printError(`Create course section failed: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.errors) {
            console.log('Validation errors:', error.response.data.errors);
        }
        return null;
    }
}

async function testGetCourseSectionById(courseSectionId) {
    printStep('GET COURSE SECTION BY ID TEST');
    
    try {
        const response = await axios.get(`${BASE_URL}/api/course-sections/${courseSectionId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            printSuccess('Get course section by ID successful');
            console.log('Course section details:', JSON.stringify(response.data.data, null, 2));
            return true;
        } else {
            printError('Get course section by ID failed');
            return false;
        }
    } catch (error) {
        printError(`Get course section by ID failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testUpdateCourseSection(courseSectionId) {
    printStep('UPDATE COURSE SECTION TEST');
    
    const updateData = {
        name: 'CNTT02 - Advanced JavaScript Programming',
        max_students: 40,
        description: 'Lớp học phần JavaScript Programming nâng cao cho lớp CNTT02'
    };
    
    try {
        const response = await axios.put(`${BASE_URL}/api/course-sections/${courseSectionId}`, updateData, {
            headers: { 
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            printSuccess('Update course section successful');
            console.log('Updated course section:', JSON.stringify(response.data.data, null, 2));
            return true;
        } else {
            printError('Update course section failed');
            return false;
        }
    } catch (error) {
        printError(`Update course section failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testGetCourseSectionStudents(courseSectionId) {
    printStep('GET COURSE SECTION STUDENTS TEST');
    
    try {
        const response = await axios.get(`${BASE_URL}/api/course-sections/${courseSectionId}/students`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            printSuccess('Get course section students successful');
            printInfo(`Found ${response.data.data.length} students`);
            console.log('Students:', JSON.stringify(response.data.data, null, 2));
            return true;
        } else {
            printError('Get course section students failed');
            return false;
        }
    } catch (error) {
        printError(`Get course section students failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testGetCourseSectionSchedules(courseSectionId) {
    printStep('GET COURSE SECTION SCHEDULES TEST');
    
    try {
        const response = await axios.get(`${BASE_URL}/api/course-sections/${courseSectionId}/schedules`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            printSuccess('Get course section schedules successful');
            printInfo(`Found ${response.data.data.length} schedules`);
            console.log('Schedules:', JSON.stringify(response.data.data, null, 2));
            return true;
        } else {
            printError('Get course section schedules failed');
            return false;
        }
    } catch (error) {
        printError(`Get course section schedules failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testGetCourseSectionsByTeacher() {
    printStep('GET COURSE SECTIONS BY TEACHER TEST');
    
    try {
        const response = await axios.get(`${BASE_URL}/api/course-sections/teacher/2`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            printSuccess('Get course sections by teacher successful');
            printInfo(`Found ${response.data.data.total} course sections for teacher`);
            console.log('Teacher course sections:', JSON.stringify(response.data.data.courseSections, null, 2));
            return true;
        } else {
            printError('Get course sections by teacher failed');
            return false;
        }
    } catch (error) {
        printError(`Get course sections by teacher failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testGetCourseSectionsByClass() {
    printStep('GET COURSE SECTIONS BY CLASS TEST');
    
    try {
        const response = await axios.get(`${BASE_URL}/api/course-sections/class/1`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            printSuccess('Get course sections by class successful');
            printInfo(`Found ${response.data.data.total} course sections for class`);
            console.log('Class course sections:', JSON.stringify(response.data.data.courseSections, null, 2));
            return true;
        } else {
            printError('Get course sections by class failed');
            return false;
        }
    } catch (error) {
        printError(`Get course sections by class failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testDeleteCourseSection(courseSectionId) {
    printStep('DELETE COURSE SECTION TEST');
    
    try {
        const response = await axios.delete(`${BASE_URL}/api/course-sections/${courseSectionId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            printSuccess('Delete course section successful');
            return true;
        } else {
            printError('Delete course section failed');
            return false;
        }
    } catch (error) {
        printError(`Delete course section failed: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Main test function
async function runTests() {
    console.log('🚀 Starting Course Section API Tests...\n');
    
    let courseSectionId = null;
    
    try {
        // 1. Login
        const loginSuccess = await login();
        if (!loginSuccess) {
            printError('Cannot proceed without authentication');
            return;
        }
        
        // 2. Get all course sections
        await testGetAllCourseSections();
        
        // 3. Create course section
        courseSectionId = await testCreateCourseSection();
        if (!courseSectionId) {
            printError('Cannot proceed without creating course section');
            return;
        }
        
        // 4. Get course section by ID
        await testGetCourseSectionById(courseSectionId);
        
        // 5. Update course section
        await testUpdateCourseSection(courseSectionId);
        
        // 6. Get course section students
        await testGetCourseSectionStudents(courseSectionId);
        
        // 7. Get course section schedules
        await testGetCourseSectionSchedules(courseSectionId);
        
        // 8. Get course sections by teacher
        await testGetCourseSectionsByTeacher();
        
        // 9. Get course sections by class
        await testGetCourseSectionsByClass();
        
        // 10. Delete course section
        await testDeleteCourseSection(courseSectionId);
        
        console.log('\n🎉 All tests completed!');
        
    } catch (error) {
        printError(`Test suite failed: ${error.message}`);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    login,
    testGetAllCourseSections,
    testCreateCourseSection,
    testGetCourseSectionById,
    testUpdateCourseSection,
    testDeleteCourseSection
};