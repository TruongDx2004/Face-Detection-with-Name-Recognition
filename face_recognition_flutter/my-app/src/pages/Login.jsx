import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth-service';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const navigate = useNavigate();

    // Check if user is already logged in
    useEffect(() => {
        const checkAuth = async () => {
            if (window.authService?.isLoggedIn && !window.authService?.isTokenExpired()) {
                showNotification('Bạn đã đăng nhập. Chuyển hướng...', 'info');
                redirectBasedOnRole(window.authService.userRole);
            }
        };
        checkAuth();
    }, []);

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type, id: Date.now() });
        setTimeout(() => {
            setNotification(null);
        }, 5000);
    };

    const redirectBasedOnRole = (role) => {
        switch (role) {
            case 'admin':
                console.log('Redirecting to admin dashboard');
                navigate('/admin-dashboard');
                break;
            case 'teacher':
                navigate('/teacher-dashboard');
                break;
            case 'student':
                navigate('/student-dashboard');
                break;
            default:
                navigate('/');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim()) {
            newErrors.username = 'Tên đăng nhập hoặc email không được để trống';
        }
        if (!formData.password.trim()) {
            newErrors.password = 'Mật khẩu không được để trống';
        }
        if (formData.password.length < 6 && formData.password.trim()) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            // Check if authService is available
            if (!window.authService) {
                throw new Error('Auth service not available');
            }

            const response = await authService.login({
                username: formData.username,
                password: formData.password
            });

            console.log('Login response:', response);

            if (response.success) {
                showNotification('Đăng nhập thành công!', 'success');
                setTimeout(() => {
                    redirectBasedOnRole(window.authService.userRole);
                }, 1000);
            } else {
                showNotification(response.message || 'Đăng nhập thất bại', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';

            if (error.message.includes('401') || error.message.includes('unauthorized')) {
                errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Không thể kết nối đến server. Vui lòng thử lại sau.';
            } else if (error.message.includes('Auth service')) {
                errorMessage = 'Dịch vụ xác thực không khả dụng. Vui lòng tải lại trang.';
            }

            showNotification(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f1f5f9',
            padding: '1rem'
        }}>
            {/* Notification */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 10000,
                    backgroundColor: notification.type === 'error' ? '#fee2e2' :
                        notification.type === 'success' ? '#d1fae5' : '#dbeafe',
                    color: notification.type === 'error' ? '#dc2626' :
                        notification.type === 'success' ? '#065f46' : '#1e40af',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${notification.type === 'error' ? '#fecaca' :
                        notification.type === 'success' ? '#a7f3d0' : '#93c5fd'}`,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    maxWidth: '300px',
                    fontSize: '14px',
                    fontWeight: '500'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <i className={`fas ${notification.type === 'error' ? 'fa-exclamation-circle' :
                            notification.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}`}
                            style={{ marginRight: '8px' }}></i>
                        {notification.message}
                    </div>
                </div>
            )}

            {/* Login Form */}
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '1rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: '#6366f1',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'white',
                        fontSize: '24px'
                    }}>
                        <i className="fas fa-user-lock"></i>
                    </div>
                    <h2 style={{
                        fontSize: '1.875rem',
                        fontWeight: '700',
                        color: '#1e293b',
                        margin: '0 0 0.5rem 0'
                    }}>
                        Đăng nhập
                    </h2>
                    <p style={{
                        color: '#64748b',
                        fontSize: '0.875rem',
                        margin: 0
                    }}>
                        Nhập thông tin đăng nhập để truy cập hệ thống
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    {/* Username Field */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem'
                        }}>
                            Tên đăng nhập hoặc Email
                            <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    border: `2px solid ${errors.username ? '#ef4444' : '#e2e8f0'}`,
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: isLoading ? '#f9fafb' : 'white',
                                    boxSizing: 'border-box',
                                    outline: 'none'
                                }}
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Nhập tên đăng nhập hoặc email"
                                disabled={isLoading}
                                onFocus={(e) => {
                                    if (!errors.username) {
                                        e.target.style.borderColor = '#6366f1';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    if (!errors.username) {
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            />
                            <i className="fas fa-user" style={{
                                position: 'absolute',
                                left: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af',
                                fontSize: '14px'
                            }}></i>
                        </div>
                        {errors.username && (
                            <div style={{
                                color: '#ef4444',
                                fontSize: '0.75rem',
                                marginTop: '0.25rem',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <i className="fas fa-exclamation-circle" style={{ marginRight: '4px' }}></i>
                                {errors.username}
                            </div>
                        )}
                    </div>

                    {/* Password Field */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem'
                        }}>
                            Mật khẩu
                            <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="password"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    border: `2px solid ${errors.password ? '#ef4444' : '#e2e8f0'}`,
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: isLoading ? '#f9fafb' : 'white',
                                    boxSizing: 'border-box',
                                    outline: 'none'
                                }}
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Nhập mật khẩu"
                                disabled={isLoading}
                                onFocus={(e) => {
                                    if (!errors.password) {
                                        e.target.style.borderColor = '#6366f1';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    if (!errors.password) {
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            />
                            <i className="fas fa-lock" style={{
                                position: 'absolute',
                                left: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af',
                                fontSize: '14px'
                            }}></i>
                        </div>
                        {errors.password && (
                            <div style={{
                                color: '#ef4444',
                                fontSize: '0.75rem',
                                marginTop: '0.25rem',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <i className="fas fa-exclamation-circle" style={{ marginRight: '4px' }}></i>
                                {errors.password}
                            </div>
                        )}
                    </div>

                    {/* Forgot Password Link */}
                    <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                        <a
                            href="/forgot-password"
                            style={{
                                color: '#6366f1',
                                fontSize: '0.875rem',
                                textDecoration: 'none',
                                fontWeight: '500',
                                transition: 'color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#4f46e5'}
                            onMouseLeave={(e) => e.target.style.color = '#6366f1'}
                        >
                            Quên mật khẩu?
                        </a>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '0.875rem 1rem',
                            backgroundColor: isLoading ? '#9ca3af' : '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
                        }}
                        disabled={isLoading}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                e.target.style.backgroundColor = '#4f46e5';
                                e.target.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading) {
                                e.target.style.backgroundColor = '#6366f1';
                                e.target.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.2)';
                            }
                        }}
                    >
                        {isLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Đang đăng nhập...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-sign-in-alt"></i>
                                Đăng nhập
                            </>
                        )}
                    </button>
                </form>

                {/* Register Link */}
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                        Chưa có tài khoản?{' '}
                        <a
                            href="/register"
                            style={{
                                color: '#6366f1',
                                textDecoration: 'none',
                                fontWeight: '600',
                                transition: 'color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#4f46e5'}
                            onMouseLeave={(e) => e.target.style.color = '#6366f1'}
                        >
                            Đăng ký ngay
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;