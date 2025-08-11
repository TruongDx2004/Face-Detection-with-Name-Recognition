// services/auth-service.js
import apiService from './api-service';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.currentToken = null;
        this.tokenKey = 'auth_token';
        this.userKey = 'user_data';
        this.listeners = [];

        // Initialize on creation
        this.initialize();
    }

    // Initialize auth service
    initialize() {
        console.log('AuthService initializing...');
        this.loadUserData();
        console.log('AuthService initialized. Is logged in:', this.isLoggedIn);

        if (this.isLoggedIn) {
            console.log('Current user role:', this.currentUser?.role);
        }
    }

    // Load user data from localStorage
    loadUserData() {
        try {
            const token = localStorage.getItem(this.tokenKey);
            const userJson = localStorage.getItem(this.userKey);

            if (token && userJson) {
                this.currentToken = token;
                this.currentUser = JSON.parse(userJson);
                console.log('User data loaded from localStorage.');
                this.notifyListeners();
            } else {
                console.log('No user data found in localStorage.');
            }
        } catch (error) {
            console.error('Error loading user data from localStorage:', error);
            this.logout();
        }
    }

    // Save login data
    saveLoginData(loginResponse) {
        try {
            this.currentToken = loginResponse.token;
            this.currentUser = loginResponse.user;

            localStorage.setItem(this.tokenKey, loginResponse.token);
            localStorage.setItem(this.userKey, JSON.stringify(loginResponse.user));

            console.log('Login data saved successfully for user:', this.currentUser?.username);
            this.notifyListeners();

            // Update API service token
            if (window.apiService) {
                window.apiService.setToken(loginResponse.token);
            }
        } catch (error) {
            console.error('Failed to save login data:', error);
            throw new Error('Failed to save login data: ' + error.message);
        }
    }

    // Update user data
    updateUser(user) {
        try {
            this.currentUser = user;
            localStorage.setItem(this.userKey, JSON.stringify(user));
            console.log('User data updated successfully for user:', user.username);
            this.notifyListeners();
        } catch (error) {
            console.error('Failed to update user data:', error);
            throw new Error('Failed to update user data: ' + error.message);
        }
    }

    // Logout and clear all data
    logout() {
        try {
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.userKey);

            this.currentToken = null;
            this.currentUser = null;

            console.log('User logged out. All data cleared.');
            this.notifyListeners();

            // Clear API service token
            if (window.apiService) {
                window.apiService.clearToken();
            }
        } catch (error) {
            console.error('Error during logout:', error);
            // Force clear in memory even if localStorage fails
            this.currentToken = null;
            this.currentUser = null;
            this.notifyListeners();
        }
    }

    // Check permissions based on roles
    hasPermission(allowedRoles) {
        if (!this.currentUser) {
            console.warn('Checking permission but current user is null.');
            return false;
        }

        if (Array.isArray(allowedRoles)) {
            return allowedRoles.includes(this.currentUser.role);
        } else {
            return this.currentUser.role === allowedRoles;
        }
    }

    // Getters
    get isLoggedIn() {
        return this.currentUser !== null && this.currentToken !== null;
    }

    get isStudent() {
        return this.currentUser?.role === 'student';
    }

    get isTeacher() {
        return this.currentUser?.role === 'teacher';
    }

    get isAdmin() {
        return this.currentUser?.role === 'admin';
    }

    get userId() {
        return this.currentUser?.id;
    }

    get userRole() {
        return this.currentUser?.role;
    }

    get userName() {
        return this.currentUser?.full_name || this.currentUser?.fullName;
    }

    get userEmail() {
        return this.currentUser?.email;
    }

    get userUsername() {
        return this.currentUser?.username;
    }

    get token() {
        return this.currentToken;
    }

    get user() {
        return this.currentUser;
    }

    // Auth state listeners
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback({
                    isLoggedIn: this.isLoggedIn,
                    user: this.currentUser,
                    token: this.currentToken
                });
            } catch (error) {
                console.error('Error notifying auth listener:', error);
            }
        });
    }

    // Login method
    async login(credentials) {
        try {
            if (!window.apiService) {
                throw new Error('API Service not available');
            }

            const response = await apiService.login(credentials);

            if (response.success) {
                this.saveLoginData(response.data);
                return response;
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Register method
    async register(userData) {
        try {
            if (!window.apiService) {
                throw new Error('API Service not available');
            }

            const response = await window.apiService.register(userData);
            return response;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    // Get current user profile
    async refreshProfile() {
        try {
            if (!this.isLoggedIn) {
                throw new Error('User not logged in');
            }

            if (!window.apiService) {
                throw new Error('API Service not available');
            }

            const response = await window.apiService.getProfile();

            if (response.success) {
                this.updateUser(response.data);
                return response;
            } else {
                throw new Error(response.message || 'Failed to refresh profile');
            }
        } catch (error) {
            console.error('Refresh profile error:', error);
            // If token is invalid, logout
            if (error.message.includes('401') || error.message.includes('unauthorized')) {
                this.logout();
            }
            throw error;
        }
    }

    // Check if token is expired (basic check)
    isTokenExpired() {
        if (!this.currentToken) return true;

        try {
            // Basic JWT token expiry check
            const payload = JSON.parse(atob(this.currentToken.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            return payload.exp < currentTime;
        } catch (error) {
            console.error('Error checking token expiry:', error);
            return true;
        }
    }

    // Auto refresh token if needed
    async checkTokenValidity() {
        if (this.isTokenExpired()) {
            console.log('Token expired, logging out...');
            this.logout();
            return false;
        }
        return true;
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.isLoggedIn) {
                throw new Error('User not logged in');
            }

            if (!window.apiService) {
                throw new Error('API Service not available');
            }

            const response = await window.apiService.changePassword({
                current_password: currentPassword,
                new_password: newPassword
            });

            return response;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }

    // Update profile
    async updateProfile(profileData) {
        try {
            if (!this.isLoggedIn) {
                throw new Error('User not logged in');
            }

            if (!window.apiService) {
                throw new Error('API Service not available');
            }

            const response = await window.apiService.updateProfile(profileData);

            if (response.success) {
                // Refresh profile to get updated data
                await this.refreshProfile();
                return response;
            } else {
                throw new Error(response.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    // Utility method to get auth headers
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (this.currentToken) {
            headers['Authorization'] = `Bearer ${this.currentToken}`;
        }

        return headers;
    }
}

// Create singleton instance
const authService = new AuthService();

// Export for ES6 import
export default authService;

// Nếu vẫn cần hỗ trợ Node/CommonJS:
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authService;
}

// Gắn vào window nếu chạy browser
if (typeof window !== 'undefined') {
    window.AuthService = AuthService; // class
    window.authService = authService; // instance
}
