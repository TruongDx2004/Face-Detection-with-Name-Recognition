// services/api-service.js
class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:8000'; // Thay đổi theo API của bạn
        this.token = localStorage.getItem('auth_token');
    }

    // Helper methods
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async handleResponse(response) {
        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.detail || data.error || data.message || 'Unknown error occurred';
            throw new Error(errorMessage);
        }

        return {
            success: true,
            data: data.data || data,
            message: data.message || 'Success'
        };
    }

    async makeRequest(method, endpoint, body = null, queryParams = null) {
        try {
            let url = `${this.baseUrl}${endpoint}`;

            if (queryParams) {
                const params = new URLSearchParams(queryParams);
                url += `?${params.toString()}`;
            }

            const config = {
                method: method.toUpperCase(),
                headers: this.getHeaders(),
            };

            if (body && method.toUpperCase() !== 'GET') {
                config.body = JSON.stringify(body);
            }

            console.log(`${method} Request:`, url);
            if (body) console.log('Request Body:', body);

            const response = await fetch(url, config);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Network error:', error);
            throw error;
        }
    }

    async makeMultipartRequest(method, endpoint, formData) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const headers = {};

            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(url, {
                method: method.toUpperCase(),
                headers: headers,
                body: formData
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Multipart request error:', error);
            throw error;
        }
    }

    // ============ AUTH ENDPOINTS ============
    async login(credentials) {
        return await this.makeRequest('POST', '/auth/login', credentials);
    }

    async register(userData) {
        return await this.makeRequest('POST', '/auth/register', userData);
    }

    async getProfile() {
        return await this.makeRequest('GET', '/auth/profile');
    }

    async updateProfile(profileData) {
        return await this.makeRequest('PUT', '/auth/profile', profileData);
    }

    async changePassword(passwordData) {
        return await this.makeRequest('PUT', '/auth/change-password', passwordData);
    }

    // ============ FACE RECOGNITION ENDPOINTS ============
    async uploadFaceVideo(videoFile, userId) {
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('userId', userId.toString());

        return await this.makeMultipartRequest('POST', '/face/upload-video', formData);
    }

    async trainModel() {
        return await this.makeRequest('POST', '/face/train-model');
    }

    async recognizeFace(imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        return await this.makeMultipartRequest('POST', '/face/recognize', formData);
    }

    async getDatasetStats() {
        return await this.makeRequest('GET', '/face/dataset-stats');
    }

    async getModelStatus() {
        return await this.makeRequest('GET', '/face/model-status');
    }

    // ============ USER IMPORT ENDPOINT ============
    async importUsers(usersData) {
        return await this.makeRequest('POST', '/admin/users/import', usersData);
    }

    // ============ CLASS IMPORT ENDPOINT ============
    async importClasses(classesData) {
        return await this.makeRequest('POST', '/classes/import', classesData);
    }

    // ============ SUBJECT IMPORT ENDPOINT ============
    async importSubjects(subjectsData) {
        return await this.makeRequest('POST', '/subjects/import', subjectsData);
    }

    // ============ SCHEDULE IMPORT ENDPOINT ============
    async importSchedules(schedulesData) {
        return await this.makeRequest('POST', '/subjects/schedules/import', schedulesData);
    }

    // ============ ATTENDANCE ENDPOINTS ============
    async createAttendanceSession(sessionData) {
        return await this.makeRequest('POST', '/attendance/create-session', sessionData);
    }

    async markAttendance(sessionId, imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('session_id', sessionId.toString());

        return await this.makeMultipartRequest('POST', '/attendance/mark-attendance', formData);
    }

    async markAttendanceManual(sessionId, studentId, status = 'present') {
        return await this.makeRequest('POST', '/attendance/mark-attendance-manual', {
            session_id: sessionId,
            student_id: studentId,
            status: status
        });
    }

    async getActiveSessions() {
        return await this.makeRequest('GET', '/attendance/active-sessions');
    }

    async getMyAttendance(startDate = null, endDate = null) {
        const queryParams = {};
        if (startDate) queryParams.start_date = startDate;
        if (endDate) queryParams.end_date = endDate;

        return await this.makeRequest('GET', '/attendance/my-attendance', null, queryParams);
    }

    async getSessionAttendance(sessionId) {
        return await this.makeRequest('GET', `/attendance/session/${sessionId}`);
    }

    async endSession(sessionId) {
        return await this.makeRequest('PUT', `/attendance/end-session/${sessionId}`);
    }

    async activateSession(sessionId) {
        return await this.makeRequest('PUT', `/attendance/sessions/${sessionId}/activate`);
    }

    async updateSessionStatus(sessionId, isActive) {
        return await this.makeRequest('PUT', `/attendance/sessions/${sessionId}/status`, {
            is_active: isActive
        });
    }

    async getTeacherSessions(startDate = null, endDate = null) {
        const queryParams = {};
        if (startDate) queryParams.start_date = startDate;
        if (endDate) queryParams.end_date = endDate;

        return await this.makeRequest('GET', '/attendance/my-sessions', null, queryParams);
    }

    async getSessions(filters = {}) {
        return await this.makeRequest('GET', '/attendance/sessions', null, filters);
    }

    async getAttendanceHistory(filters = {}) {
        return await this.makeRequest('GET', '/attendance/history', null, filters);
    }

    async stopSession(sessionId) {
        return await this.makeRequest('PUT', `/attendance/sessions/${sessionId}/stop`);
    }

    async deleteSession(sessionId) {
        return await this.makeRequest('DELETE', `/attendance/sessions/${sessionId}`);
    }

    async getSessionAttendanceRecords(sessionId) {
        return await this.makeRequest('GET', `/attendance/sessions/${sessionId}/records`);
    }

    async getTodaySessionsByCourseSection(courseSectionId) {
        const today = new Date().toISOString().split('T')[0];
        return await this.makeRequest('GET', '/attendance/sessions', null, {
            course_section_id: courseSectionId,
            session_date: today
        });
    }

    // ============ CLASS MANAGEMENT ENDPOINTS ============
    async getClasses(name = null) {
        const queryParams = {};
        if (name) queryParams.name = name;

        return await this.makeRequest('GET', '/classes', null, queryParams);
    }

    async createClass(classData) {
        return await this.makeRequest('POST', '/classes', classData);
    }

    async updateClass(id, classData) {
        return await this.makeRequest('PUT', `/classes/${id}`, classData);
    }

    async deleteClass(id) {
        return await this.makeRequest('DELETE', `/classes/${id}`);
    }

    async getClassStudents(classId) {
        return await this.makeRequest('GET', `/classes/${classId}/students`);
    }

    async addStudentToClass(classId, studentData) {
        return await this.makeRequest('POST', `/classes/${classId}/students`, studentData);
    }

    async removeStudentFromClass(classId, studentId) {
        return await this.makeRequest('DELETE', `/classes/${classId}/students/${studentId}`);
    }

    async getAvailableStudents() {
        return await this.makeRequest('GET', '/classes/available-students');
    }

    // ============ SUBJECT MANAGEMENT ENDPOINTS ============
    async getSubjects(filters = {}) {
        const queryParams = {
            page: filters.page || 1,
            limit: filters.limit || 20
        };
        if (filters.name) queryParams.name = filters.name;

        return await this.makeRequest('GET', '/subjects', null, queryParams);
    }

    async createSubject(name) {
        return await this.makeRequest('POST', '/subjects', { name });
    }

    async updateSubject(id, name) {
        return await this.makeRequest('PUT', `/subjects/${id}`, { name });
    }

    async deleteSubject(id) {
        return await this.makeRequest('DELETE', `/subjects/${id}`);
    }

    // ============ SCHEDULE MANAGEMENT ENDPOINTS ============
    async getSessionAttendanceForClass(sessionId) {
        return await this.makeRequest('GET', `/attendance/session/${sessionId}`);
    }

    async getSchedules(filters = {}) {
        const queryParams = {
            page: filters.page || 1,
            limit: filters.limit || 20
        };
        if (filters.classId) queryParams.class_id = filters.classId;
        if (filters.subjectId) queryParams.subject_id = filters.subjectId;
        if (filters.teacherId) queryParams.teacher_id = filters.teacherId;

        return await this.makeRequest('GET', '/schedules', null, queryParams);
    }

    async createSchedule(scheduleData) {
        return await this.makeRequest('POST', '/schedules', scheduleData);
    }

    async updateSchedule(id, scheduleData) {
        return await this.makeRequest('PUT', `/schedules/${id}`, scheduleData);
    }

    async deleteSchedule(id) {
        return await this.makeRequest('DELETE', `/schedules/${id}`);
    }

    async getScheduleOptions() {
        return await this.makeRequest('GET', '/schedules/options');
    }

    async getStudentSchedules() {
        return await this.makeRequest('GET', '/schedules');
    }

    // ============ ADMIN ENDPOINTS ============
    async getAllUsers(filters = {}) {
        const queryParams = {
            page: filters.page || 1,
            limit: filters.limit || 20
        };

        if (filters.role) queryParams.role = filters.role;
        if (filters.search) queryParams.search = filters.search;
        if (filters.status) queryParams.status = filters.status;
        if (filters.face_trained) queryParams.face_trained = filters.face_trained;

        return await this.makeRequest('GET', '/admin/users', null, queryParams);
    }

    async createUser(userData) {
        return await this.makeRequest('POST', '/admin/users', userData);
    }

    async updateUser(id, userData) {
        return await this.makeRequest('PUT', `/admin/users/${id}`, userData);
    }

    async deleteUser(userId) {
        return await this.makeRequest('DELETE', `/admin/users/${userId}`);
    }

    async resetUserPassword(userId, newPassword) {
        return await this.makeRequest('PUT', `/admin/users/${userId}/reset-password`, {
            new_password: newPassword
        });
    }

    async getStatistics(startDate = null, endDate = null) {
        const queryParams = {};
        if (startDate) queryParams.start_date = startDate;
        if (endDate) queryParams.end_date = endDate;

        return await this.makeRequest('GET', '/admin/statistics', null, queryParams);
    }

    async getAttendanceReport(filters = {}) {
        return await this.makeRequest('GET', '/admin/reports/attendance', null, filters);
    }

    // ============ COURSE SECTIONS ENDPOINTS ============
    async getCourseSections(params = {}) {
        return await this.makeRequest('GET', '/course-sections', null, params);
    }

    async getCourseSection(id) {
        return await this.makeRequest('GET', `/course-sections/${id}`);
    }

    async createCourseSection(courseSectionData) {
        return await this.makeRequest('POST', '/course-sections', courseSectionData);
    }

    async updateCourseSection(id, courseSectionData) {
        return await this.makeRequest('PUT', `/course-sections/${id}`, courseSectionData);
    }

    async deleteCourseSection(id) {
        return await this.makeRequest('DELETE', `/course-sections/${id}`);
    }

    async getCourseSectionSchedules(id) {
        return await this.makeRequest('GET', `/course-sections/${id}/schedules`);
    }

    async getCourseSectionStudents(id) {
        return await this.makeRequest('GET', `/course-sections/${id}/students`);
    }

    async getCourseSectionAttendanceSessions(id) {
        return await this.makeRequest('GET', `/course-sections/${id}/attendance-sessions`);
    }

    async getCourseSectionsByTeacher(teacherId, params = {}) {
        return await this.makeRequest('GET', `/course-sections/teacher/${teacherId}`, null, params);
    }

    async getCourseSectionsByClass(classId, params = {}) {
        return await this.makeRequest('GET', `/course-sections/class/${classId}`, null, params);
    }
    
    // ============ EXAM ENDPOINTS ============
    async getExams(params = {}) {
        return await this.makeRequest('GET', '/exams', null, params);
    }

    async getExamsByCourseSection(courseSectionId) {
        return await this.makeRequest('GET', `/exams/course-section/${courseSectionId}`);
    }

    async getTeacherExams(teacherId) {
        return await this.makeRequest('GET', `/exams/teacher/${teacherId}`);
    }

    async getExam(id) {
        return await this.makeRequest('GET', `/exams/${id}`);
    }

    async createExam(examData) {
        return await this.makeRequest('POST', '/exams', examData);
    }

    async updateExam(id, examData) {
        return await this.makeRequest('PUT', `/exams/${id}`, examData);
    }

    async deleteExam(id) {
        return await this.makeRequest('DELETE', `/exams/${id}`);
    }

    async getExamResults(examId) {
        return await this.makeRequest('GET', `/exams/${examId}/results`);
    }

    async getExamStatistics(examId) {
        return await this.makeRequest('GET', `/exams/${examId}/statistics`);
    }

    // ============ ASSIGNMENT TEMPLATE ENDPOINTS ============
    async createTemplate(templateData) {
        return await this.makeMultipartRequest('POST', '/assignment-templates', templateData);
    }

    async getTeacherTemplates(teacherId, params = {}) {
        return await this.makeRequest('GET', `/assignment-templates/teacher/${teacherId}`, null, params);
    }

    async getPublicTemplates(params = {}) {
        return await this.makeRequest('GET', '/assignment-templates/public', null, params);
    }

    async getTemplate(templateId) {
        return await this.makeRequest('GET', `/assignment-templates/${templateId}`);
    }

    async updateTemplate(templateId, templateData) {
        return await this.makeMultipartRequest('PUT', `/assignment-templates/${templateId}`, templateData);
    }

    async deleteTemplate(templateId) {
        return await this.makeRequest('DELETE', `/assignment-templates/${templateId}`);
    }

    async createAssignmentFromTemplate(templateId, assignmentData) {
        return await this.makeRequest('POST', `/assignment-templates/${templateId}/create-assignment`, assignmentData);
    }

    async getTemplateStats(teacherId) {
        return await this.makeRequest('GET', `/assignment-templates/teacher/${teacherId}/stats`);
    }

    async getTopTemplates(limit = 10) {
        return await this.makeRequest('GET', `/assignment-templates/top?limit=${limit}`);
    }

    async searchTemplatesByTags(tags) {
        const tagString = Array.isArray(tags) ? tags.join(',') : tags;
        return await this.makeRequest('GET', `/assignment-templates/search?tags=${encodeURIComponent(tagString)}`);
    }

    // ============ ASSIGNMENT ENDPOINTS ============
    async getAssignments(params = {}) {
        return await this.makeRequest('GET', '/assignments', null, params);
    }

    async getTeacherAssignments(teacherId) {
        return await this.makeRequest('GET', `/assignments/teacher/${teacherId}`);
    }

    async getAssignment(id) {
        return await this.makeRequest('GET', `/assignments/${id}`);
    }

    async createAssignment(assignmentData) {
        if (assignmentData instanceof FormData) {
            return await this.makeMultipartRequest('POST', '/assignments', assignmentData);
        }
        return await this.makeRequest('POST', '/assignments', assignmentData);
    }

    async updateAssignment(id, assignmentData) {
        if (assignmentData instanceof FormData) {
            return await this.makeMultipartRequest('PUT', `/assignments/${id}`, assignmentData);
        }
        return await this.makeRequest('PUT', `/assignments/${id}`, assignmentData);
    }

    async deleteAssignment(id) {
        return await this.makeRequest('DELETE', `/assignments/${id}`);
    }

    async getAssignmentSubmissions(assignmentId, params = {}) {
        return await this.makeRequest('GET', `/assignments/${assignmentId}/submissions`, null, params);
    }

    async getAssignmentsByCourseSection(courseSectionId, params = {}) {
        return await this.makeRequest('GET', `/assignments`, null, { course_section_id: courseSectionId, ...params });
    }

    async gradeSubmission(submissionId, gradeData) {
        return await this.makeRequest('PUT', `/assignments/submissions/${submissionId}/grade`, gradeData);
    }

    // Gradebook methods
    async getGradebookByCourseSection(courseSectionId, params = {}) {
        return await this.makeRequest('GET', `/course-sections/${courseSectionId}/gradebook`, null, params);
    }

    async updateExamResult(examResultId, resultData) {
        return await this.makeRequest('PUT', `/exam-results/${examResultId}`, resultData);
    }

    async downloadSubmissionFile(filename) {
        try {
            const url = `${this.baseUrl}/assignments/submissions/files/${filename}`;
            const headers = this.getHeaders();

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error('Failed to download submission file');
            }

            return response.blob();
        } catch (error) {
            console.error('Download submission file error:', error);
            throw error;
        }
    }

    // Grade Configuration methods
    async getGradeConfiguration(courseSectionId) {
        return await this.makeRequest('GET', `/course-sections/${courseSectionId}/grade-configuration`);
    }

    async updateGradeConfiguration(courseSectionId, configData) {
        return await this.makeRequest('PUT', `/course-sections/${courseSectionId}/grade-configuration`, configData);
    }

    async recalculateGrades(courseSectionId) {
        return await this.makeRequest('POST', `/course-sections/${courseSectionId}/recalculate-grades`);
    }

    async exportGradebookExcel(courseSectionId) {
        try {
            const url = `${this.baseUrl}/course-sections/${courseSectionId}/export-gradebook`;
            const headers = this.getHeaders();

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error('Failed to export gradebook');
            }

            // Lấy tên file từ response header
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'BangDiem.xlsx';
            if (contentDisposition) {
                const matches = /filename\*=UTF-8''(.+)/.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = decodeURIComponent(matches[1]);
                }
            }

            const blob = await response.blob();
            return { blob, filename };
        } catch (error) {
            console.error('Export gradebook excel error:', error);
            throw error;
        }
    }

    async getTeacherCourseSections() {
        return await this.makeRequest('GET', '/course-sections/teacher');
    }

    // Download assignment file
    async downloadAssignmentFile(filename) {
        try {
            const url = `${this.baseUrl}/assignments/files/${filename}`;
            const headers = this.getHeaders();

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error('Failed to download file');
            }

            return response.blob();
        } catch (error) {
            console.error('Download file error:', error);
            throw error;
        }
    }

    // ============ UTILITY METHODS ============
    async testConnection() {
        return await this.makeRequest('GET', '/');
    }

    // Token management
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    getToken() {
        return this.token;
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }
}

export default new ApiService();