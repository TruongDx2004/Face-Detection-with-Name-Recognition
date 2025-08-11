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

    // ============ CLASS MANAGEMENT ENDPOINTS ============
    async getClasses(name = null) {
        const queryParams = {};
        if (name) queryParams.name = name;

        return await this.makeRequest('GET', '/classes', null, queryParams);
    }

    async createClass(name) {
        return await this.makeRequest('POST', '/classes', { name });
    }

    async updateClass(id, name) {
        return await this.makeRequest('PUT', `/classes/${id}`, { name });
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

    async getAvailableStudents(classId) {
        return await this.makeRequest('GET', '/classes/available-students', null, { class_id: classId });
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
    async getSchedules(filters = {}) {
        const queryParams = {
            page: filters.page || 1,
            limit: filters.limit || 20
        };
        if (filters.classId) queryParams.class_id = filters.classId;
        if (filters.subjectId) queryParams.subject_id = filters.subjectId;
        if (filters.teacherId) queryParams.teacher_id = filters.teacherId;

        return await this.makeRequest('GET', '/subjects/schedules', null, queryParams);
    }

    async createSchedule(scheduleData) {
        return await this.makeRequest('POST', '/subjects/schedules', scheduleData);
    }

    async updateSchedule(id, scheduleData) {
        return await this.makeRequest('PUT', `/subjects/schedules/${id}`, scheduleData);
    }

    async deleteSchedule(id) {
        return await this.makeRequest('DELETE', `/subjects/schedules/${id}`);
    }

    async getScheduleOptions() {
        return await this.makeRequest('GET', '/subjects/schedules/options');
    }

    async getStudentSchedules() {
        return await this.makeRequest('GET', '/subjects/schedules');
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