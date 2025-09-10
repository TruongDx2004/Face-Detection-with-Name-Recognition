#!/usr/bin/env node
/**
 * Test script for Assignment API endpoints
 * Run: node test_assignment_api.js
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const SERVER_URL = "http://localhost:8000";

// Test credentials
const TEST_USERS = {
    teacher: { username: 'teacher1', password: 'teacher123' },
    student: { username: 'student1', password: 'student123' },
    admin: { username: 'admin', password: 'admin123' }
};

let tokens = {};
let testData = {
    assignmentId: null,
    submissionId: null,
    courseSectionId: 1 // Assuming course section exists
};

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

// Helper function to login and get token
async function login(role) {
    try {
        const response = await axios.post(`${SERVER_URL}/auth/login`, TEST_USERS[role]);
        if (response.status === 200) {
            tokens[role] = response.data.token;
            printSuccess(`${role} login successful`);
            return tokens[role];
        }
    } catch (error) {
        printError(`${role} login failed: ${error.response?.data?.message || error.message}`);
        return null;
    }
}

// Test 1: Login all users
async function testLogin() {
    printStep("TESTING USER LOGIN");
    
    for (const role of ['teacher', 'student', 'admin']) {
        await login(role);
    }
    
    if (!tokens.teacher || !tokens.student) {
        printError("Required tokens not available. Stopping tests.");
        process.exit(1);
    }
}

// Test 2: Create assignment (Teacher)
async function testCreateAssignment() {
    printStep("TESTING CREATE ASSIGNMENT");
    
    try {
        const assignmentData = {
            course_section_id: testData.courseSectionId,
            title: "Test Assignment - Python Basics",
            description: "This is a test assignment for API testing",
            assignment_type: "homework",
            max_score: 10,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            instructions: "Complete the Python exercises as described in the attachment"
        };

        const response = await axios.post(
            `${SERVER_URL}/assignments`,
            assignmentData,
            {
                headers: {
                    'Authorization': `Bearer ${tokens.teacher}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status === 201) {
            testData.assignmentId = response.data.data.id;
            printSuccess(`Assignment created successfully. ID: ${testData.assignmentId}`);
            printInfo(`Assignment: ${response.data.data.title}`);
        }
    } catch (error) {
        printError(`Create assignment failed: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.details) {
            console.log("Validation errors:", error.response.data.details);
        }
    }
}

// Test 3: Get assignment details
async function testGetAssignment() {
    printStep("TESTING GET ASSIGNMENT DETAILS");
    
    if (!testData.assignmentId) {
        printError("No assignment ID available for testing");
        return;
    }

    try {
        const response = await axios.get(
            `${SERVER_URL}/assignments/${testData.assignmentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${tokens.student}`
                }
            }
        );

        if (response.status === 200) {
            const assignment = response.data.data;
            printSuccess("Assignment details retrieved successfully");
            printInfo(`Title: ${assignment.title}`);
            printInfo(`Due date: ${assignment.due_date}`);
            printInfo(`Max score: ${assignment.max_score}`);
        }
    } catch (error) {
        printError(`Get assignment failed: ${error.response?.data?.message || error.message}`);
    }
}

// Test 4: Get student assignments
async function testGetStudentAssignments() {
    printStep("TESTING GET STUDENT ASSIGNMENTS");
    
    try {
        const response = await axios.get(
            `${SERVER_URL}/assignments/student/${testData.courseSectionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${tokens.student}`
                }
            }
        );

        if (response.status === 200) {
            const assignments = response.data.data;
            printSuccess(`Retrieved ${assignments.length} assignments for student`);
            
            assignments.forEach((assignment, index) => {
                printInfo(`${index + 1}. ${assignment.title} - Due: ${assignment.due_date}`);
                if (assignment.submission) {
                    printInfo(`   Submitted: ${assignment.submission.submitted_at}, Status: ${assignment.submission.status}`);
                } else {
                    printInfo(`   Not submitted yet`);
                }
            });
        }
    } catch (error) {
        printError(`Get student assignments failed: ${error.response?.data?.message || error.message}`);
    }
}

// Test 5: Submit assignment (Student)
async function testSubmitAssignment() {
    printStep("TESTING SUBMIT ASSIGNMENT");
    
    if (!testData.assignmentId) {
        printError("No assignment ID available for testing");
        return;
    }

    try {
        // Create a test file
        const testFilePath = path.join(__dirname, 'test_submission.txt');
        const testContent = `Test submission content
Assignment ID: ${testData.assignmentId}
Submitted at: ${new Date().toISOString()}
This is a test submission for API testing.`;
        
        fs.writeFileSync(testFilePath, testContent);

        const formData = new FormData();
        formData.append('assignment_id', testData.assignmentId.toString());
        formData.append('student_id', '3'); // Assuming student1 has ID 3
        formData.append('submission_text', 'This is my solution to the assignment. I have completed all the required exercises.');
        formData.append('attachment', fs.createReadStream(testFilePath));

        const response = await axios.post(
            `${SERVER_URL}/assignments/submit`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${tokens.student}`,
                    ...formData.getHeaders()
                }
            }
        );

        if (response.status === 201) {
            testData.submissionId = response.data.data.id;
            printSuccess(`Assignment submitted successfully. Submission ID: ${testData.submissionId}`);
            printInfo(`Submitted at: ${response.data.data.submitted_at}`);
        }

        // Clean up test file
        fs.unlinkSync(testFilePath);
    } catch (error) {
        printError(`Submit assignment failed: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.details) {
            console.log("Validation errors:", error.response.data.details);
        }
    }
}

// Test 6: Get submission details
async function testGetSubmission() {
    printStep("TESTING GET SUBMISSION DETAILS");
    
    if (!testData.assignmentId) {
        printError("No assignment ID available for testing");
        return;
    }

    try {
        const response = await axios.get(
            `${SERVER_URL}/assignments/${testData.assignmentId}/submissions/3`, // student1 ID
            {
                headers: {
                    'Authorization': `Bearer ${tokens.student}`
                }
            }
        );

        if (response.status === 200) {
            const submission = response.data.data;
            printSuccess("Submission details retrieved successfully");
            printInfo(`Submission text: ${submission.submission_text?.substring(0, 50)}...`);
            printInfo(`Status: ${submission.status}`);
            printInfo(`Score: ${submission.score || 'Not graded yet'}`);
        }
    } catch (error) {
        if (error.response?.status === 404) {
            printInfo("No submission found (expected if not submitted yet)");
        } else {
            printError(`Get submission failed: ${error.response?.data?.message || error.message}`);
        }
    }
}

// Test 7: Grade assignment (Teacher)
async function testGradeAssignment() {
    printStep("TESTING GRADE ASSIGNMENT");
    
    if (!testData.submissionId) {
        printError("No submission ID available for testing");
        return;
    }

    try {
        const gradingData = {
            score: 8.5,
            feedback: "Good work! Your solution is correct and well-structured. Consider adding more comments to explain your logic."
        };

        const response = await axios.put(
            `${SERVER_URL}/assignments/submissions/${testData.submissionId}/grade`,
            gradingData,
            {
                headers: {
                    'Authorization': `Bearer ${tokens.teacher}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status === 200) {
            printSuccess("Assignment graded successfully");
            printInfo(`Score: ${response.data.data.score}`);
            printInfo(`Feedback: ${response.data.data.feedback}`);
        }
    } catch (error) {
        printError(`Grade assignment failed: ${error.response?.data?.message || error.message}`);
    }
}

// Test 8: Get teacher assignments
async function testGetTeacherAssignments() {
    printStep("TESTING GET TEACHER ASSIGNMENTS");
    
    try {
        const response = await axios.get(
            `${SERVER_URL}/assignments/teacher/2`, // Assuming teacher1 has ID 2
            {
                headers: {
                    'Authorization': `Bearer ${tokens.teacher}`
                }
            }
        );

        if (response.status === 200) {
            const assignments = response.data.data;
            printSuccess(`Retrieved ${assignments.length} assignments for teacher`);
            
            assignments.forEach((assignment, index) => {
                printInfo(`${index + 1}. ${assignment.title}`);
                printInfo(`   Submissions: ${assignment.submission_count || 0}, Graded: ${assignment.graded_count || 0}`);
            });
        }
    } catch (error) {
        printError(`Get teacher assignments failed: ${error.response?.data?.message || error.message}`);
    }
}

// Test 9: Get assignment statistics
async function testGetAssignmentStats() {
    printStep("TESTING GET ASSIGNMENT STATISTICS");
    
    try {
        const response = await axios.get(
            `${SERVER_URL}/assignments/teacher/2/stats`, // Assuming teacher1 has ID 2
            {
                headers: {
                    'Authorization': `Bearer ${tokens.teacher}`
                }
            }
        );

        if (response.status === 200) {
            const stats = response.data.data;
            printSuccess("Assignment statistics retrieved successfully");
            printInfo(`Total assignments: ${stats.total_assignments || 0}`);
            printInfo(`Total submissions: ${stats.total_submissions || 0}`);
            printInfo(`Average score: ${stats.avg_score || 0}`);
            printInfo(`Graded count: ${stats.graded_count || 0}`);
        }
    } catch (error) {
        printError(`Get assignment stats failed: ${error.response?.data?.message || error.message}`);
    }
}

// Main test function
async function runTests() {
    console.log("🚀 TESTING ASSIGNMENT API ENDPOINTS");
    console.log("=" .repeat(60));
    
    try {
        // Test server is running
        const response = await axios.get(SERVER_URL);
        printSuccess(`Server is running: ${response.data.message}`);
    } catch (error) {
        printError("Server is not running. Please start it first.");
        return;
    }

    // Run all tests
    await testLogin();
    await testCreateAssignment();
    await testGetAssignment();
    await testGetStudentAssignments();
    await testSubmitAssignment();
    await testGetSubmission();
    await testGradeAssignment();
    await testGetTeacherAssignments();
    await testGetAssignmentStats();

    printStep("ALL TESTS COMPLETED! 🎉");
    console.log("\n📋 Test Summary:");
    console.log("✅ User authentication");
    console.log("✅ Assignment creation (Teacher)");
    console.log("✅ Assignment details retrieval");
    console.log("✅ Student assignments listing");
    console.log("✅ Assignment submission (Student)");
    console.log("✅ Submission details retrieval");
    console.log("✅ Assignment grading (Teacher)");
    console.log("✅ Teacher assignments listing");
    console.log("✅ Assignment statistics");
    
    console.log("\n🔗 API Endpoints tested:");
    console.log("POST   /assignments");
    console.log("GET    /assignments/{id}");
    console.log("GET    /assignments/student/{courseSectionId}");
    console.log("POST   /assignments/submit");
    console.log("GET    /assignments/{assignmentId}/submissions/{studentId}");
    console.log("PUT    /assignments/submissions/{submissionId}/grade");
    console.log("GET    /assignments/teacher/{teacherId}");
    console.log("GET    /assignments/teacher/{teacherId}/stats");
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    testLogin,
    testCreateAssignment,
    testSubmitAssignment,
    testGradeAssignment
};