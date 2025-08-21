import React, { useState, useEffect } from 'react';
import Notification from '../components/Notification';
import ImportModal from '../components/ImportModal';
import Sidebar from '../components/Sidebar';
import LoadingOverlay from '../components/LoadingOverlay';
import useNotification from '../hooks/useNotification';
import useTime from '../hooks/useTime';
import styles from '../components/styles';
import apiService from '../services/api-service';
import authService from '../services/auth-service';

// User Management Styles
const userManagementStyles = {
    filterBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
    },
    searchSection: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flex: 1,
        minWidth: '300px'
    },
    searchBox: {
        position: 'relative',
        flex: 1,
        maxWidth: '300px'
    },
    searchIcon: {
        position: 'absolute',
        left: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#64748b',
        fontSize: '1rem'
    },
    searchInput: {
        width: '100%',
        padding: '0.75rem 1rem 0.75rem 2.5rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        '&:focus': {
            borderColor: '#6366f1',
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
        }
    },
    clearSearch: {
        position: 'absolute',
        right: '0.75rem',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
        padding: '0.25rem',
        borderRadius: '50%',
        '&:hover': {
            background: '#f1f5f9',
            color: '#64748b'
        }
    },
    filterSection: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    filterSelect: {
        padding: '0.75rem 1rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        background: '#fff',
        color: '#374151',
        outline: 'none',
        minWidth: '150px'
    },
    viewOptions: {
        display: 'flex',
        gap: '0.5rem',
        background: '#f8fafc',
        padding: '0.25rem',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0'
    },
    viewBtn: {
        padding: '0.5rem 0.75rem',
        background: 'transparent',
        border: 'none',
        borderRadius: '0.25rem',
        color: '#64748b',
        cursor: 'pointer',
        fontSize: '0.875rem',
        transition: 'all 0.2s'
    },
    viewBtnActive: {
        background: '#fff',
        color: '#6366f1',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
    },
    userCard: {
        background: '#fff',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s',
        height: 'fit-content'
    },
    userCardHover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
    },
    userCardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem'
    },
    userAvatar: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        fontWeight: '600',
        marginRight: '1rem'
    },
    userInfo: {
        flex: 1
    },
    userName: {
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.25rem'
    },
    userUsername: {
        fontSize: '0.875rem',
        color: '#64748b',
        marginBottom: '0.25rem'
    },
    userEmail: {
        fontSize: '0.875rem',
        color: '#64748b'
    },
    userRole: {
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: '500',
        background: '#f0f9ff',
        color: '#0369a1',
        border: '1px solid #bae6fd'
    },
    userStatus: {
        display: 'flex',
        gap: '0.5rem',
        marginTop: '1rem'
    },
    statusBadge: {
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: '500'
    },
    statusActive: {
        background: '#dcfce7',
        color: '#166534'
    },
    statusInactive: {
        background: '#fef2f2',
        color: '#dc2626'
    },
    faceTrainedBadge: {
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: '500'
    },
    faceTrained: {
        background: '#ddd6fe',
        color: '#7c3aed'
    },
    faceUntrained: {
        background: '#fef3c7',
        color: '#d97706'
    },
    userActions: {
        display: 'flex',
        gap: '0.5rem',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e2e8f0'
    },
    actionBtn: {
        padding: '0.5rem 0.75rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        background: '#fff',
        color: '#374151',
        cursor: 'pointer',
        fontSize: '0.875rem',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    actionBtnHover: {
        background: '#f9fafb',
        borderColor: '#9ca3af'
    },
    actionBtnDanger: {
        color: '#dc2626',
        borderColor: '#fca5a5',
        background: '#fef2f2'
    },
    usersGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem'
    },
    usersTable: {
        width: '100%',
        background: '#fff',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
    },
    tableHeader: {
        background: '#f8fafc',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #e2e8f0',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#374151'
    },
    tableRow: {
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #e2e8f0',
        fontSize: '0.875rem',
        '&:hover': {
            background: '#f9fafb'
        }
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
    },
    modalContent: {
        background: '#fff',
        borderRadius: '1rem',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
    },
    modalHeader: {
        padding: '1.5rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    modalTitle: {
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#1e293b',
        margin: 0
    },
    modalClose: {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        color: '#64748b',
        cursor: 'pointer',
        padding: '0.25rem',
        borderRadius: '0.25rem',
        '&:hover': {
            background: '#f1f5f9'
        }
    },
    modalBody: {
        padding: '1.5rem',
        maxHeight: '60vh',
        overflowY: 'auto'
    },
    modalFooter: {
        padding: '1.5rem',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        gap: '1rem',
        justifyContent: 'flex-end'
    },
    formGroup: {
        marginBottom: '1.5rem'
    },
    formLabel: {
        display: 'block',
        marginBottom: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#374151'
    },
    formInput: {
        width: '100%',
        padding: '0.75rem 1rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        '&:focus': {
            borderColor: '#6366f1',
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
        }
    },
    formSelect: {
        width: '100%',
        padding: '0.75rem 1rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        background: '#fff',
        outline: 'none'
    },
    formError: {
        color: '#dc2626',
        fontSize: '0.75rem',
        marginTop: '0.25rem'
    },
    required: {
        color: '#dc2626'
    },
    btn: {
        padding: '0.75rem 1.5rem',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    btnPrimary: {
        background: '#6366f1',
        color: '#fff',
        '&:hover': {
            background: '#5b21b6'
        }
    },
    btnOutline: {
        background: '#fff',
        color: '#374151',
        border: '1px solid #d1d5db',
        '&:hover': {
            background: '#f9fafb'
        }
    },
    btnDanger: {
        background: '#dc2626',
        color: '#fff',
        '&:hover': {
            background: '#b91c1c'
        }
    }
};

// Stats Card Component
const StatsCard = ({ title, value, icon, color, change }) => {
    const [isHovered, setIsHovered] = useState(false);

    const cardStyle = {
        ...styles.statCard,
        ...(isHovered ? styles.statCardHover : {})
    };

    return (
        <div
            style={cardStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={styles.statCardBorder}></div>
            <div style={styles.statHeader}>
                <div style={{ ...styles.statIcon, background: color }}>
                    <i className={icon}></i>
                </div>
                <div style={styles.statChange}>
                    <i className="fas fa-arrow-up"></i>
                    {change}
                </div>
            </div>
            <div style={styles.statValue}>{value?.toLocaleString()}</div>
            <div style={styles.statLabel}>{title}</div>
        </div>
    );
};

// User Card Component
const UserCard = ({ userData, onEditUser, onDeleteUser, onResetPassword }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [hoveredAction, setHoveredAction] = useState(null);

    const cardStyle = {
        ...userManagementStyles.userCard,
        ...(isHovered ? userManagementStyles.userCardHover : {})
    };

    const getActionBtnStyle = (action, isDanger = false) => {
        const baseStyle = userManagementStyles.actionBtn;
        if (hoveredAction === action) {
            return {
                ...baseStyle,
                ...(isDanger ? userManagementStyles.actionBtnDanger : userManagementStyles.actionBtnHover)
            };
        }
        return baseStyle;
    };

    const getRoleStyle = (role) => {
        const baseStyle = userManagementStyles.userRole;
        switch (role) {
            case 'admin':
                return { ...baseStyle, background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' };
            case 'teacher':
                return { ...baseStyle, background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' };
            case 'student':
                return { ...baseStyle, background: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' };
            default:
                return baseStyle;
        }
    };

    const getRoleText = (role) => {
        switch (role) {
            case 'admin': return 'Quản trị viên';
            case 'teacher': return 'Giáo viên';
            case 'student': return 'Sinh viên';
            default: return role;
        }
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div
            style={cardStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={userManagementStyles.userCardHeader}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div style={userManagementStyles.userAvatar}>
                        {getInitials(userData.full_name)}
                    </div>
                    <div style={userManagementStyles.userInfo}>
                        <div style={userManagementStyles.userName}>{userData.full_name}</div>
                        <div style={userManagementStyles.userUsername}>@{userData.username}</div>
                        <div style={userManagementStyles.userEmail}>{userData.email || 'Chưa có email'}</div>
                    </div>
                </div>
                <div style={getRoleStyle(userData.role)}>
                    {getRoleText(userData.role)}
                </div>
            </div>

            <div style={userManagementStyles.userStatus}>
                <div style={{
                    ...userManagementStyles.statusBadge,
                    ...(userData.is_active ? userManagementStyles.statusActive : userManagementStyles.statusInactive)
                }}>
                    <i className={`fas ${userData.is_active ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                    {userData.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </div>
                <div style={{
                    ...userManagementStyles.faceTrainedBadge,
                    ...(userData.face_trained ? userManagementStyles.faceTrained : userManagementStyles.faceUntrained)
                }}>
                    <i className={`fas ${userData.face_trained ? 'fa-check' : 'fa-exclamation-triangle'}`}></i>
                    {userData.face_trained ? 'Đã huấn luyện' : 'Chưa huấn luyện'}
                </div>
            </div>

            <div style={userManagementStyles.userActions}>
                <button
                    style={getActionBtnStyle('edit')}
                    onClick={() => onEditUser(userData)}
                    onMouseEnter={() => setHoveredAction('edit')}
                    onMouseLeave={() => setHoveredAction(null)}
                >
                    <i className="fas fa-edit"></i>
                    Sửa
                </button>
                <button
                    style={getActionBtnStyle('reset')}
                    onClick={() => onResetPassword(userData)}
                    onMouseEnter={() => setHoveredAction('reset')}
                    onMouseLeave={() => setHoveredAction(null)}
                >
                    <i className="fas fa-key"></i>
                    Reset MK
                </button>
                <button
                    style={getActionBtnStyle('delete', true)}
                    onClick={() => onDeleteUser(userData)}
                    onMouseEnter={() => setHoveredAction('delete')}
                    onMouseLeave={() => setHoveredAction(null)}
                >
                    <i className="fas fa-trash"></i>
                    Xóa
                </button>
            </div>
        </div>
    );
};

// User Table Component
const UserTable = ({ users, onEditUser, onDeleteUser, onResetPassword }) => {
    const getRoleText = (role) => {
        switch (role) {
            case 'admin': return 'Quản trị viên';
            case 'teacher': return 'Giáo viên';
            case 'student': return 'Sinh viên';
            default: return role;
        }
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div style={userManagementStyles.usersTable}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Người dùng</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Tài khoản</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Vai trò</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Trạng thái</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Khuôn mặt</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Ngày tạo</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user, index) => (
                        <tr key={user.id} style={{
                            borderBottom: index < users.length - 1 ? '1px solid #e2e8f0' : 'none'
                        }}>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.875rem',
                                        fontWeight: '600'
                                    }}>
                                        {getInitials(user.full_name)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{user.full_name}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: '1rem' }}>@{user.username}</td>
                            <td style={{ padding: '1rem', color: '#64748b' }}>{user.email || 'Chưa có'}</td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    background: user.role === 'admin' ? '#fef2f2' : user.role === 'teacher' ? '#f0fdf4' : '#f0f9ff',
                                    color: user.role === 'admin' ? '#dc2626' : user.role === 'teacher' ? '#166534' : '#0369a1'
                                }}>
                                    {getRoleText(user.role)}
                                </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    background: user.is_active ? '#dcfce7' : '#fef2f2',
                                    color: user.is_active ? '#166534' : '#dc2626'
                                }}>
                                    {user.is_active ? 'Hoạt động' : 'Ngừng'}
                                </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    background: user.face_trained ? '#ddd6fe' : '#fef3c7',
                                    color: user.face_trained ? '#7c3aed' : '#d97706'
                                }}>
                                    {user.face_trained ? 'Đã có' : 'Chưa có'}
                                </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                                {new Date(user.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                    <button
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            background: '#f0f9ff',
                                            color: '#0369a1',
                                            border: 'none',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem'
                                        }}
                                        onClick={() => onEditUser(user)}
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            background: '#fef3c7',
                                            color: '#d97706',
                                            border: 'none',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem'
                                        }}
                                        onClick={() => onResetPassword(user)}
                                    >
                                        <i className="fas fa-key"></i>
                                    </button>
                                    <button
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            background: '#fee2e2',
                                            color: '#dc2626',
                                            border: 'none',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem'
                                        }}
                                        onClick={() => onDeleteUser(user)}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, size = 'normal', children }) => {
    if (!isOpen) return null;

    const modalStyle = {
        ...userManagementStyles.modalContent,
        ...(size === 'large' ? { maxWidth: '800px' } : {}),
        ...(size === 'small' ? { maxWidth: '400px' } : {})
    };

    return (
        <div style={userManagementStyles.modal} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                <div style={userManagementStyles.modalHeader}>
                    <h3 style={userManagementStyles.modalTitle}>{title}</h3>
                    <button
                        style={userManagementStyles.modalClose}
                        onClick={onClose}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// User Form Component
const UserForm = ({ userData, onSave, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        full_name: userData?.full_name || '',
        username: userData?.username || '',
        email: userData?.email || '',
        role: userData?.role || '',
        password: '',
        is_active: userData?.is_active !== undefined ? userData.is_active : true,
        student_id: userData?.student_code || '',
        class_name: userData?.class_name || ''
    });
    const [errors, setErrors] = useState({});

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Họ và tên không được để trống';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Tên đăng nhập không được để trống';
        }

        if (!formData.role) {
            newErrors.role = 'Vui lòng chọn vai trò';
        }

        if (!userData && !formData.password) {
            newErrors.password = 'Mật khẩu không được để trống khi tạo mới';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            const submitData = { ...formData };
            if (userData && !submitData.password) {
                delete submitData.password; // Không gửi password rỗng khi update
            }
            onSave(submitData);
        }
    };

    return (
        <>
            <div style={userManagementStyles.modalBody}>
                <div style={userManagementStyles.formGroup}>
                    <label style={userManagementStyles.formLabel}>
                        Họ và tên <span style={userManagementStyles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        style={userManagementStyles.formInput}
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Nhập họ và tên"
                    />
                    {errors.full_name && <div style={userManagementStyles.formError}>{errors.full_name}</div>}
                </div>

                <div style={userManagementStyles.formGroup}>
                    <label style={userManagementStyles.formLabel}>
                        Tên đăng nhập <span style={userManagementStyles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        style={userManagementStyles.formInput}
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="Nhập tên đăng nhập"
                        disabled={userData} // Không cho phép sửa username khi update
                    />
                    {errors.username && <div style={userManagementStyles.formError}>{errors.username}</div>}
                </div>

                <div style={userManagementStyles.formGroup}>
                    <label style={userManagementStyles.formLabel}>Email</label>
                    <input
                        type="email"
                        style={userManagementStyles.formInput}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Nhập email"
                    />
                    {errors.email && <div style={userManagementStyles.formError}>{errors.email}</div>}
                </div>

                <div style={userManagementStyles.formGroup}>
                    <label style={userManagementStyles.formLabel}>
                        Vai trò <span style={userManagementStyles.required}>*</span>
                    </label>
                    <select
                        style={userManagementStyles.formSelect}
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                    >
                        <option value="">Chọn vai trò</option>
                        <option value="admin">Quản trị viên</option>
                        <option value="teacher">Giáo viên</option>
                        <option value="student">Sinh viên</option>
                    </select>
                    {errors.role && <div style={userManagementStyles.formError}>{errors.role}</div>}
                </div>

                {formData.role === 'student' && (
                    <>
                        <div style={userManagementStyles.formGroup}>
                            <label style={userManagementStyles.formLabel}>Mã sinh viên</label>
                            <input
                                type="text"
                                style={userManagementStyles.formInput}
                                value={formData.student_id}
                                onChange={(e) => handleInputChange('student_id', e.target.value)}
                                placeholder="Nhập mã sinh viên"
                            />
                        </div>

                        <div style={userManagementStyles.formGroup}>
                            <label style={userManagementStyles.formLabel}>Tên lớp</label>
                            <input
                                type="text"
                                style={userManagementStyles.formInput}
                                value={formData.class_name}
                                onChange={(e) => handleInputChange('class_name', e.target.value)}
                                placeholder="Ví dụ: CNTT K47"
                            />
                        </div>
                    </>
                )}

                <div style={userManagementStyles.formGroup}>
                    <label style={userManagementStyles.formLabel}>
                        Mật khẩu {!userData && <span style={userManagementStyles.required}>*</span>}
                    </label>
                    <input
                        type="password"
                        style={userManagementStyles.formInput}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder={userData ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu"}
                    />
                    {errors.password && <div style={userManagementStyles.formError}>{errors.password}</div>}
                </div>

                <div style={userManagementStyles.formGroup}>
                    <label style={{ ...userManagementStyles.formLabel, display: 'flex', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => handleInputChange('is_active', e.target.checked)}
                            style={{ marginRight: '0.5rem' }}
                        />
                        Tài khoản đang hoạt động
                    </label>
                </div>
            </div>

            <div style={userManagementStyles.modalFooter}>
                <button
                    style={{ ...userManagementStyles.btn, ...userManagementStyles.btnOutline }}
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Hủy
                </button>
                <button
                    style={{ ...userManagementStyles.btn, ...userManagementStyles.btnPrimary }}
                    onClick={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-save"></i>
                            {userData ? 'Cập nhật' : 'Thêm người dùng'}
                        </>
                    )}
                </button>
            </div>
        </>
    );
};

// Main User Management Component
const UserManagement = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [currentView, setCurrentView] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [faceTrainedFilter, setFaceTrainedFilter] = useState('');

    // Modal states
    const [showUserModal, setShowUserModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);

    const currentTime = useTime();
    const { notifications, showNotification, removeNotification } = useNotification();

    useEffect(() => {
        const checkPermission = () => {
            const allowedRoles = ['admin'];
            const userHasPermission = authService.hasPermission(allowedRoles);
            setHasPermission(userHasPermission);

            if (!userHasPermission) {
                showNotification("Bạn không có quyền truy cập trang này.", 'error');
                setLoading(false);
                return;
            }

            fetchUsers();
        };

        checkPermission();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await apiService.getAllUsers({
                page: 1,
                limit: 100
            });

            if (response.success) {
                setUsers(response.data.users || []);
                showNotification('Tải danh sách người dùng thành công', 'success');
            } else {
                showNotification(response.message || 'Lấy danh sách người dùng thất bại.', 'error');
            }
        } catch (error) {
            showNotification('Lỗi khi kết nối đến server: ' + error.message, 'error');
            console.error('Fetch users error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    useEffect(() => {
        let filtered = users.filter(user => {
            const matchesSearch = !searchQuery ||
                user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.student_code && user.student_code.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesRole = !roleFilter || user.role === roleFilter;
            const matchesStatus = !statusFilter ||
                (statusFilter === 'active' && user.is_active) ||
                (statusFilter === 'inactive' && !user.is_active);
            const matchesFaceTrained = !faceTrainedFilter ||
                (faceTrainedFilter === 'trained' && user.face_trained) ||
                (faceTrainedFilter === 'untrained' && !user.face_trained);

            return matchesSearch && matchesRole && matchesStatus && matchesFaceTrained;
        });

        setFilteredUsers(filtered);
    }, [users, searchQuery, roleFilter, statusFilter, faceTrainedFilter]);

    // Calculate statistics
    const statistics = {
        totalUsers: users.length,
        adminCount: users.filter(u => u.role === 'admin').length,
        teacherCount: users.filter(u => u.role === 'teacher').length,
        studentCount: users.filter(u => u.role === 'student').length,
        activeUsers: users.filter(u => u.is_active).length,
        usersWithFace: users.filter(u => u.face_trained).length
    };

    const statsConfig = [
        { title: 'Tổng người dùng', value: statistics.totalUsers, icon: 'fas fa-users', color: '#3b82f6', change: '+2' },
        { title: 'Sinh viên', value: statistics.studentCount, icon: 'fas fa-user-graduate', color: '#10b981', change: '+5.2%' },
        { title: 'Giáo viên', value: statistics.teacherCount, icon: 'fas fa-chalkboard-teacher', color: '#f59e0b', change: '+1' },
        { title: 'Đã huấn luyện', value: statistics.usersWithFace, icon: 'fas fa-face-smile', color: '#8b5cf6', change: '+3' }
    ];

    const handleImportUsers = async (usersData) => {
        setModalLoading(true);
        try {
            // Chuyển đổi định dạng dữ liệu nếu cần
            const formattedUsers = usersData.map(user => ({
                full_name: user.full_name,
                username: user.username,
                email: user.email,
                role: user.role,
                password: user.password || '123456', // Mật khẩu mặc định nếu không có
                is_active: user.is_active === 'TRUE' || user.is_active === '1', // Xử lý giá trị boolean
                student_code: user.student_code,
                class_name: user.class_name
            }));

            // Gửi dữ liệu tới API import
            const response = await apiService.importUsers(formattedUsers);

            if (response.success) {
                showNotification('Nhập người dùng thành công!', 'success');
                setShowImportModal(false);
                fetchUsers();
            } else {
                showNotification(response.message || 'Có lỗi xảy ra khi nhập dữ liệu', 'error');
            }
        } catch (error) {
            console.error('Import users error:', error);
            showNotification('Có lỗi xảy ra khi nhập dữ liệu: ' + error.message, 'error');
        } finally {
            setModalLoading(false);
        }
    };

    // Handle actions
    const handleSaveUser = async (formData) => {
        setModalLoading(true);

        try {
            let response;
            if (currentUser) {
                // Update existing user
                response = await apiService.updateUser(currentUser.id, formData);
            } else {
                // Create new user
                response = await apiService.createUser(formData);
            }

            if (response.success) {
                showNotification(
                    currentUser ? 'Cập nhật người dùng thành công!' : 'Thêm người dùng thành công!',
                    'success'
                );
                setShowUserModal(false);
                setCurrentUser(null);
                fetchUsers();
            } else {
                showNotification(response.message || 'Có lỗi xảy ra khi lưu người dùng', 'error');
            }
        } catch (error) {
            console.error('Save user error:', error);
            showNotification('Có lỗi xảy ra khi lưu người dùng: ' + error.message, 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setCurrentUser(user);
        setShowUserModal(true);
    };

    const handleDeleteUser = (user) => {
        setDeleteTarget(user);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        setModalLoading(true);

        try {
            const response = await apiService.deleteUser(deleteTarget.id);

            if (response.success) {
                showNotification('Xóa người dùng thành công!', 'success');
                setShowDeleteModal(false);
                setDeleteTarget(null);
                fetchUsers();
            } else {
                showNotification(response.message || 'Có lỗi xảy ra khi xóa người dùng', 'error');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            showNotification('Có lỗi xảy ra khi xóa người dùng: ' + error.message, 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const handleResetPassword = (user) => {
        setResetPasswordTarget(user);
        setNewPassword('123456'); // Default password
        setShowResetPasswordModal(true);
    };

    const handleConfirmResetPassword = async () => {
        if (!newPassword) {
            showNotification('Vui lòng nhập mật khẩu mới', 'warning');
            return;
        }

        setModalLoading(true);

        try {
            const response = await apiService.resetUserPassword(resetPasswordTarget.id, newPassword);

            if (response.success) {
                showNotification('Reset mật khẩu thành công!', 'success');
                setShowResetPasswordModal(false);
                setResetPasswordTarget(null);
                setNewPassword('');
            } else {
                showNotification(response.message || 'Có lỗi xảy ra khi reset mật khẩu', 'error');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            showNotification('Có lỗi xảy ra khi reset mật khẩu: ' + error.message, 'error');
        } finally {
            setModalLoading(false);
        }
    };

    const handleAddUser = () => {
        setCurrentUser(null);
        setShowUserModal(true);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setRoleFilter('');
        setStatusFilter('');
        setFaceTrainedFilter('');
    };

    const mainContentStyle = {
        ...styles.mainContent,
        ...(sidebarCollapsed ? styles.mainContentCollapsed : {})
    };

    if (!hasPermission) {
        return (
            <div style={styles.appContainer}>
                <Sidebar
                    isCollapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    activePage="users"
                />
                <main style={mainContentStyle}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        background: '#f8fafc'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <i className="fas fa-lock" style={{ fontSize: '4rem', color: '#64748b', marginBottom: '1rem' }}></i>
                            <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Không có quyền truy cập</h2>
                            <p style={{ color: '#64748b' }}>Bạn không có quyền truy cập trang quản lý người dùng.</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={styles.appContainer}>
            {/* Notifications */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000 }}>
                {notifications.map((notification) => (
                    <Notification
                        key={notification.id}
                        notification={notification}
                        onRemove={removeNotification}
                    />
                ))}
            </div>

            {/* Sidebar */}
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                activePage="users"
            />

            {/* Main Content */}
            <main style={mainContentStyle}>
                {/* Header */}
                <header style={styles.header}>
                    <div style={styles.headerLeft}>
                        <h1 style={styles.pageTitle}>
                            <i className="fas fa-users" style={{ color: '#6366f1', marginRight: '1rem' }}></i>
                            Quản lý người dùng
                        </h1>
                        <p style={styles.pageSubtitle}>Quản lý thông tin tài khoản và phân quyền người dùng</p>
                    </div>
                    <div style={styles.headerRight}>
                        <div style={styles.headerActions}>
                            <button
                                style={styles.actionBtn}
                                onClick={() => fetchUsers()}
                                title="Làm mới dữ liệu"
                            >
                                <i className="fas fa-sync-alt"></i>
                            </button>
                            <button
                                style={styles.actionBtn}
                                onClick={() => setShowImportModal(true)}
                                title="Nhập từ Excel"
                            >
                                <i className="fas fa-file-import"></i>
                            </button>
                            <button
                                style={styles.actionBtn}
                                onClick={() => showNotification('Đang xuất dữ liệu...', 'info')}
                                title="Xuất Excel"
                            >
                                <i className="fas fa-file-export"></i>
                            </button>
                        </div>
                        <button
                            style={{ ...styles.btn, ...styles.btnPrimary }}
                            onClick={handleAddUser}
                        >
                            <i className="fas fa-plus"></i>
                            Thêm người dùng
                        </button>
                    </div>
                </header>

                <div style={styles.dashboardContent}>
                    <LoadingOverlay isLoading={loading} />

                    {/* Filter Bar */}
                    <div style={userManagementStyles.filterBar}>
                        <div style={userManagementStyles.searchSection}>
                            <div style={userManagementStyles.searchBox}>
                                <i className="fas fa-search" style={userManagementStyles.searchIcon}></i>
                                <input
                                    type="text"
                                    style={userManagementStyles.searchInput}
                                    placeholder="Tìm kiếm theo tên, tài khoản, email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        style={userManagementStyles.clearSearch}
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={userManagementStyles.filterSection}>
                            <select
                                style={userManagementStyles.filterSelect}
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="">Tất cả vai trò</option>
                                <option value="admin">Quản trị viên</option>
                                <option value="teacher">Giáo viên</option>
                                <option value="student">Sinh viên</option>
                            </select>

                            <select
                                style={userManagementStyles.filterSelect}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="inactive">Ngừng hoạt động</option>
                            </select>

                            <select
                                style={userManagementStyles.filterSelect}
                                value={faceTrainedFilter}
                                onChange={(e) => setFaceTrainedFilter(e.target.value)}
                            >
                                <option value="">Tất cả khuôn mặt</option>
                                <option value="trained">Đã huấn luyện</option>
                                <option value="untrained">Chưa huấn luyện</option>
                            </select>

                            <button
                                style={{ ...userManagementStyles.btn, ...userManagementStyles.btnOutline }}
                                onClick={handleClearFilters}
                            >
                                <i className="fas fa-undo"></i>
                                Reset
                            </button>

                            <div style={userManagementStyles.viewOptions}>
                                <button
                                    style={{
                                        ...userManagementStyles.viewBtn,
                                        ...(currentView === 'grid' ? userManagementStyles.viewBtnActive : {})
                                    }}
                                    onClick={() => setCurrentView('grid')}
                                >
                                    <i className="fas fa-th-large"></i>
                                </button>
                                <button
                                    style={{
                                        ...userManagementStyles.viewBtn,
                                        ...(currentView === 'table' ? userManagementStyles.viewBtnActive : {})
                                    }}
                                    onClick={() => setCurrentView('table')}
                                >
                                    <i className="fas fa-table"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <section style={{ marginBottom: '3rem' }}>
                        <div style={styles.statsGrid}>
                            {statsConfig.map((stat, index) => (
                                <StatsCard key={index} {...stat} />
                            ))}
                        </div>
                    </section>

                    {/* User List */}
                    <section>
                        <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>
                                <i className="fas fa-list" style={styles.sectionIcon}></i>
                                Danh sách người dùng ({filteredUsers.length})
                            </h2>
                        </div>

                        {filteredUsers.length === 0 && !loading ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '4rem 2rem',
                                background: 'white',
                                borderRadius: '1rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: '#f8fafc',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem',
                                    fontSize: '2rem',
                                    color: '#94a3b8'
                                }}>
                                    <i className="fas fa-users"></i>
                                </div>
                                <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>
                                    {searchQuery || roleFilter || statusFilter || faceTrainedFilter
                                        ? 'Không tìm thấy người dùng nào'
                                        : 'Chưa có người dùng nào'
                                    }
                                </h3>
                                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                                    {searchQuery || roleFilter || statusFilter || faceTrainedFilter
                                        ? 'Thử điều chỉnh bộ lọc để xem kết quả khác'
                                        : 'Bắt đầu bằng cách tạo tài khoản người dùng đầu tiên'
                                    }
                                </p>
                                <button
                                    style={{ ...userManagementStyles.btn, ...userManagementStyles.btnPrimary }}
                                    onClick={handleAddUser}
                                >
                                    <i className="fas fa-plus"></i>
                                    Thêm người dùng đầu tiên
                                </button>
                            </div>
                        ) : currentView === 'grid' ? (
                            <div style={userManagementStyles.usersGrid}>
                                {filteredUsers.map(user => (
                                    <UserCard
                                        key={user.id}
                                        userData={user}
                                        onEditUser={handleEditUser}
                                        onDeleteUser={handleDeleteUser}
                                        onResetPassword={handleResetPassword}
                                    />
                                ))}
                            </div>
                        ) : (
                            <UserTable
                                users={filteredUsers}
                                onEditUser={handleEditUser}
                                onDeleteUser={handleDeleteUser}
                                onResetPassword={handleResetPassword}
                            />
                        )}
                    </section>
                </div>
            </main>

            {/* User Modal */}
            <Modal
                isOpen={showUserModal}
                onClose={() => !modalLoading && setShowUserModal(false)}
                title={currentUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
            >
                <UserForm
                    userData={currentUser}
                    onSave={handleSaveUser}
                    onCancel={() => setShowUserModal(false)}
                    isLoading={modalLoading}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => !modalLoading && setShowDeleteModal(false)}
                title="Xác nhận xóa"
                size="small"
            >
                <div style={userManagementStyles.modalBody}>
                    <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                            fontSize: '1.5rem'
                        }}>
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <p style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '1rem' }}>
                            Bạn có chắc chắn muốn xóa người dùng <strong>"{deleteTarget?.full_name}"</strong> không?
                        </p>
                        <small style={{ color: '#94a3b8' }}>
                            Tất cả dữ liệu liên quan sẽ bị xóa. Hành động này không thể hoàn tác!
                        </small>
                    </div>
                </div>

                <div style={userManagementStyles.modalFooter}>
                    <button
                        style={{ ...userManagementStyles.btn, ...userManagementStyles.btnOutline }}
                        onClick={() => setShowDeleteModal(false)}
                        disabled={modalLoading}
                    >
                        Hủy
                    </button>
                    <button
                        style={{ ...userManagementStyles.btn, ...userManagementStyles.btnDanger }}
                        onClick={handleConfirmDelete}
                        disabled={modalLoading}
                    >
                        {modalLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Đang xóa...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-trash"></i>
                                Xóa người dùng
                            </>
                        )}
                    </button>
                </div>
            </Modal>

            

            {/* Reset Password Modal */}
            <Modal
                isOpen={showResetPasswordModal}
                onClose={() => !modalLoading && setShowResetPasswordModal(false)}
                title="Reset mật khẩu"
                size="small"
            >
                <div style={userManagementStyles.modalBody}>
                    <div style={{ padding: '1rem' }}>
                        <p style={{ marginBottom: '1rem', color: '#1e293b' }}>
                            Đặt lại mật khẩu cho người dùng: <strong>{resetPasswordTarget?.full_name}</strong>
                        </p>
                        <div style={userManagementStyles.formGroup}>
                            <label style={userManagementStyles.formLabel}>
                                Mật khẩu mới <span style={userManagementStyles.required}>*</span>
                            </label>
                            <input
                                type="password"
                                style={userManagementStyles.formInput}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới"
                            />
                        </div>
                        <small style={{ color: '#64748b' }}>
                            Mật khẩu mặc định là "123456". Người dùng nên đổi mật khẩu sau lần đăng nhập đầu tiên.
                        </small>
                    </div>
                </div>

                <div style={userManagementStyles.modalFooter}>
                    <button
                        style={{ ...userManagementStyles.btn, ...userManagementStyles.btnOutline }}
                        onClick={() => setShowResetPasswordModal(false)}
                        disabled={modalLoading}
                    >
                        Hủy
                    </button>
                    <button
                        style={{ ...userManagementStyles.btn, ...userManagementStyles.btnPrimary }}
                        onClick={handleConfirmResetPassword}
                        disabled={modalLoading || !newPassword}
                    >
                        {modalLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Đang reset...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-key"></i>
                                Reset mật khẩu
                            </>
                        )}
                    </button>
                </div>
            </Modal>

            {/* Import User Modal */}
            <ImportModal
                isOpen={showImportModal}
                onClose={() => !modalLoading && setShowImportModal(false)}
                onImport={handleImportUsers}
                isLoading={modalLoading}
            />
        </div>
    );
};

export default UserManagement;