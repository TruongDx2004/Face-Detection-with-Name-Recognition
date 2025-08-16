import React, { useState, useEffect, useRef } from 'react';
import Notification from '../components/Notification';
import Sidebar from '../components/Sidebar';
import LoadingOverlay from '../components/LoadingOverlay';
import useNotification from '../hooks/useNotification';
// import CameraService from '../services/camera-service';
import apiService from '../services/api-service';
import authService from '../services/auth-service';
import styles from '../components/styles';

// Styles cho component
const faceRegistrationStyles = {
    container: {
        padding: '2rem',
        minHeight: '100vh',
        background: '#f8fafc'
    },
    pageHeader: {
        background: '#ffffff',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        border: '1px solid #e2e8f0',
        textAlign: 'center'
    },
    pageTitle: {
        fontSize: '2rem',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem'
    },
    pageSubtitle: {
        color: '#64748b',
        fontSize: '1rem'
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem'
    },
    panel: {
        background: '#ffffff',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        border: '1px solid #e2e8f0',
        padding: '2rem'
    },
    panelTitle: {
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    searchSection: {
        marginBottom: '1.5rem'
    },
    searchInput: {
        width: '100%',
        padding: '1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        marginBottom: '1rem'
    },
    filterRow: {
        display: 'flex',
        gap: '1rem'
    },
    selectInput: {
        flex: 1,
        padding: '0.5rem 1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        background: '#ffffff'
    },
    userList: {
        maxHeight: '400px',
        overflowY: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem'
    },
    userItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid #e2e8f0',
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out'
    },
    userItemSelected: {
        background: 'rgba(99, 102, 241, 0.1)',
        borderLeft: '4px solid #6366f1'
    },
    userItemHover: {
        background: '#f8fafc'
    },
    userAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#6366f1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '600',
        marginRight: '1rem'
    },
    userInfo: {
        flex: 1
    },
    userName: {
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '0.25rem'
    },
    userDetails: {
        color: '#64748b',
        fontSize: '0.85rem'
    },
    statusBadge: {
        padding: '0.25rem 0.5rem',
        borderRadius: '0.375rem',
        fontSize: '0.75rem',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    faceTrained: {
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981'
    },
    faceNotTrained: {
        background: 'rgba(245, 158, 11, 0.1)',
        color: '#f59e0b'
    },
    selectedUser: {
        background: '#f8fafc',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    },
    selectedUserAvatar: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: '#6366f1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '600',
        fontSize: '1.5rem'
    },
    methodSelection: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem'
    },
    methodBtn: {
        flex: 1,
        padding: '1.5rem',
        border: '2px solid #e2e8f0',
        borderRadius: '0.75rem',
        background: '#ffffff',
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out',
        textAlign: 'center'
    },
    methodBtnActive: {
        borderColor: '#6366f1',
        background: 'rgba(99, 102, 241, 0.1)',
        color: '#6366f1'
    },
    methodBtnHover: {
        borderColor: '#6366f1',
        background: 'rgba(99, 102, 241, 0.05)'
    },
    instructions: {
        background: 'rgba(6, 182, 212, 0.1)',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '1.5rem'
    },
    instructionsTitle: {
        color: '#06b6d4',
        fontWeight: '600',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    cameraSection: {
        display: 'none'
    },
    cameraSectionActive: {
        display: 'block'
    },
    cameraContainer: {
        position: 'relative',
        background: '#000',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        marginBottom: '1.5rem'
    },
    cameraPreview: {
        width: '100%',
        height: '300px',
        objectFit: 'cover'
    },
    cameraOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        flexDirection: 'column',
        gap: '1rem'
    },
    faceGuide: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '200px',
        height: '200px',
        border: '3px solid #06b6d4',
        borderRadius: '50%',
        opacity: 0.8
    },
    recordingIndicator: {
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        background: '#ef4444',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        fontSize: '0.85rem',
        fontWeight: '600',
        display: 'none',
        animation: 'pulse 1s infinite'
    },
    recordingIndicatorActive: {
        display: 'block'
    },
    cameraControls: {
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
    },
    controlBtn: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out'
    },
    recordBtn: {
        background: '#ef4444',
        color: 'white'
    },
    recordBtnHover: {
        background: '#dc2626',
        transform: 'scale(1.1)'
    },
    stopBtn: {
        background: '#64748b',
        color: 'white'
    },
    uploadSection: {
        display: 'none'
    },
    uploadSectionActive: {
        display: 'block'
    },
    uploadArea: {
        border: '2px dashed #e2e8f0',
        borderRadius: '0.75rem',
        padding: '3rem',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out',
        marginBottom: '1.5rem'
    },
    uploadAreaHover: {
        borderColor: '#6366f1',
        background: 'rgba(99, 102, 241, 0.05)'
    },
    uploadIcon: {
        fontSize: '3rem',
        color: '#94a3b8',
        marginBottom: '1.5rem'
    },
    progressContainer: {
        marginBottom: '1.5rem',
        display: 'none'
    },
    progressContainerActive: {
        display: 'block'
    },
    progressBar: {
        width: '100%',
        height: '8px',
        background: '#e2e8f0',
        borderRadius: '0.375rem',
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
        transition: 'width 0.3s ease-in-out',
        borderRadius: '0.375rem'
    },
    progressText: {
        textAlign: 'center',
        marginTop: '0.5rem',
        color: '#64748b',
        fontSize: '0.9rem'
    },
    btn: {
        padding: '1rem 2rem',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        color: '#1e293b',
        fontSize: '0.9rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        textDecoration: 'none'
    },
    btnPrimary: {
        background: '#6366f1',
        color: 'white',
        borderColor: '#6366f1'
    },
    btnDanger: {
        background: '#ef4444',
        color: 'white',
        borderColor: '#ef4444'
    },
    btnFull: {
        width: '100%',
        justifyContent: 'center'
    },
    btnDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
        pointerEvents: 'none'
    }
};

// Helper functions
const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getRoleDisplayName = (role) => {
    const roleNames = {
        admin: 'Quản trị viên',
        teacher: 'Giáo viên',
        student: 'Sinh viên'
    };
    return roleNames[role] || role;
};

const FaceRegistration = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentMethod, setCurrentMethod] = useState('camera');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [faceTrainedFilter, setFaceTrainedFilter] = useState('');
    const [hasPermission, setHasPermission] = useState(false);

    // Camera states
    const [cameraActive, setCameraActive] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [recordedVideo, setRecordedVideo] = useState(null);

    // Upload states
    const [selectedVideoFile, setSelectedVideoFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const [mediaStream, setMediaStream] = useState(null);

    // Refs
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordingTimerRef = useRef(null);
    // const cameraService = useRef(null);

    const { notifications, showNotification, removeNotification } = useNotification();

    useEffect(() => {
        const checkPermission = () => {
            const allowedRoles = ['admin', 'teacher'];
            const userHasPermission = authService.hasPermission(allowedRoles);
            setHasPermission(userHasPermission);

            if (!userHasPermission) {
                showNotification("Bạn không có quyền truy cập trang này.", 'error');
                setLoading(false);
                return;
            }

            loadUsers();
        };

        checkPermission();

        return () => {
            // Cleanup camera khi component unmount
            stopCamera();
        };
    }, []);

    // useEffect để cleanup và auto-start camera - FIXED VERSION
    useEffect(() => {
        // Auto start camera khi user chọn method camera và có selectedUser
        if (currentMethod === 'camera' && selectedUser && !cameraActive) {
            // Delay ngắn để đảm bảo DOM đã render
            const timer = setTimeout(() => {
                if (videoRef.current) {
                    startCamera();
                }
            }, 200);

            return () => clearTimeout(timer);
        }

        // Cleanup khi không dùng camera nữa
        if (currentMethod !== 'camera' && cameraActive) {
            stopCamera();
        }
    }, [currentMethod, selectedUser, cameraActive]);

    // Load users
    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await apiService.getAllUsers({ limit: 100 });
            if (response.success) {
                setAllUsers(response.data.users || []);
                setFilteredUsers(response.data.users || []);
                showNotification('Tải danh sách người dùng thành công', 'success');
            } else {
                showNotification('Lỗi khi tải danh sách người dùng', 'error');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            showNotification('Không thể tải danh sách người dùng: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filter users
    useEffect(() => {
        let filtered = allUsers.filter(user => {
            const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesRole = !roleFilter || user.role === roleFilter;
            
            const matchesFaceTrained = !faceTrainedFilter ||
                user.face_trained.toString() === faceTrainedFilter;


            return matchesSearch && matchesRole && matchesFaceTrained;
        });

        setFilteredUsers(filtered);
    }, [allUsers, searchQuery, roleFilter, faceTrainedFilter]);

    // Select user
    const selectUser = (user) => {
        setSelectedUser(user);
        // Reset states when selecting new user
        setRecordedVideo(null);
        setSelectedVideoFile(null);
        //stopCamera();
    };

    // Select method
    const selectMethod = (method) => {
        setCurrentMethod(method);
        // Reset states when switching method
        setRecordedVideo(null);
        setSelectedVideoFile(null);
        //stopCamera();
    };

    // Camera functions
    const startCamera = async () => {
        try {
            // Bật trạng thái cameraActive trước để video element được render
            setCameraActive(true);

            // Chờ video element render ra DOM (có thể dùng setTimeout nhỏ hoặc useEffect bên dưới)
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!videoRef.current) {
                throw new Error('Video element chưa sẵn sàng');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
            });

            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            setMediaStream(stream);

            showNotification('Camera đã được khởi động', 'success');

        } catch (error) {
            console.error('Error starting camera:', error);
            showNotification('Lỗi khi khởi động camera: ' + error.message, 'error');
        }
    };


    const stopCamera = () => {
        // Stop tất cả tracks của media stream
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => {
                track.stop();
            });
            setMediaStream(null);
        }

        // Clear video element
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        // Reset states
        setCameraActive(false);
        setIsRecording(false);
        setRecordingProgress(0);

        // Clear recording timer
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        // Stop media recorder nếu đang recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const startRecording = async () => {
        // Kiểm tra điều kiện trước khi recording
        if (!mediaStream || !videoRef.current) {
            showNotification('Vui lòng khởi động camera trước', 'warning');
            return;
        }

        if (!cameraActive) {
            showNotification('Camera chưa được khởi động', 'warning');
            return;
        }

        try {
            // Kiểm tra browser support cho MediaRecorder
            if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                if (!MediaRecorder.isTypeSupported('video/webm')) {
                    throw new Error('Trình duyệt không hỗ trợ ghi video');
                }
            }

            // Tạo MediaRecorder từ stream hiện tại
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                ? 'video/webm;codecs=vp9'
                : 'video/webm';

            const mediaRecorder = new MediaRecorder(mediaStream, {
                mimeType: mimeType
            });

            mediaRecorderRef.current = mediaRecorder;

            const recordedChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: mimeType });
                const videoFile = new File([blob], 'face_video.webm', { type: mimeType });
                setRecordedVideo(videoFile);
                setIsRecording(false);
                setRecordingProgress(0);
                showNotification('Quay video hoàn thành', 'success');
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                showNotification('Lỗi khi quay video: ' + event.error.message, 'error');
                setIsRecording(false);
                setRecordingProgress(0);
            };

            // Bắt đầu recording
            mediaRecorder.start(100); // Thu thập data mỗi 100ms
            setIsRecording(true);
            setRecordingProgress(0);

            showNotification('Bắt đầu quay video...', 'info');

            // Timer cập nhật tiến trình quay (5 giây)
            let progress = 0;
            recordingTimerRef.current = setInterval(() => {
                progress += 2; // Tăng 2% mỗi 100ms = 5 giây
                setRecordingProgress(progress);

                if (progress >= 100) {
                    stopRecording();
                }
            }, 100);

            // Dừng tự động sau 5 giây (backup)
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    stopRecording();
                }
            }, 5000);

        } catch (error) {
            console.error('Error starting recording:', error);
            showNotification('Không thể bắt đầu quay video: ' + error.message, 'error');
            setIsRecording(false);
            setRecordingProgress(0);
        }
    };

    const stopRecording = () => {
        try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }

            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }

            setIsRecording(false);

        } catch (error) {
            console.error('Error stopping recording:', error);
            showNotification('Lỗi khi dừng quay video', 'error');
            setIsRecording(false);
            setRecordingProgress(0);
        }
    };

    // Upload functions
    const handleVideoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleVideoFile(file);
        }
    };

    const handleVideoFile = (file) => {
        // Validate file
        if (!file.type.startsWith('video/')) {
            showNotification('Vui lòng chọn file video', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            showNotification('File video quá lớn (tối đa 10MB)', 'error');
            return;
        }

        setSelectedVideoFile(file);
        showNotification('Đã chọn video: ' + file.name, 'success');
    };

    const clearVideo = () => {
        setSelectedVideoFile(null);
        setRecordedVideo(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Submit face data
    const submitFaceData = async () => {
        if (!selectedUser) {
            showNotification('Vui lòng chọn người dùng', 'warning');
            return;
        }

        const videoFile = currentMethod === 'camera' ? recordedVideo : selectedVideoFile;
        if (!videoFile) {
            showNotification('Vui lòng quay video hoặc chọn file video', 'warning');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await apiService.uploadFaceVideo(videoFile, selectedUser.id);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (response.success) {
                showNotification('Đăng ký khuôn mặt thành công!', 'success');

                // Update user status
                const updatedUsers = allUsers.map(user =>
                    user.id === selectedUser.id
                        ? { ...user, face_trained: true }
                        : user
                );
                setAllUsers(updatedUsers);

                // Reset form
                resetForm();

                setTimeout(() => {
                    setUploadProgress(0);
                }, 2000);

            } else {
                throw new Error(response.message || 'Upload failed');
            }

        } catch (error) {
            console.error('Error submitting face data:', error);
            showNotification('Lỗi: ' + error.message, 'error');
            setUploadProgress(0);
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setSelectedUser(null);
        setRecordedVideo(null);
        setSelectedVideoFile(null);
        //stopCamera();
        setCurrentMethod('camera');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const mainContentStyle = {
        ...styles.mainContent,
        ...(sidebarCollapsed ? styles.mainContentCollapsed : {})
    };

    const canSubmit = selectedUser && (recordedVideo || selectedVideoFile) && !isUploading;

    if (!hasPermission) {
        return (
            <div style={styles.appContainer}>
                <Sidebar
                    isCollapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    activePage="face-recognition"
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
                            <p style={{ color: '#64748b' }}>Bạn không có quyền truy cập trang đăng ký khuôn mặt.</p>
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
                activePage="face-recognition"
            />

            {/* Main Content */}
            <main style={mainContentStyle}>
                <div style={faceRegistrationStyles.container}>
                    <LoadingOverlay isLoading={loading} />

                    {/* Header */}
                    <div style={faceRegistrationStyles.pageHeader}>
                        <h1 style={faceRegistrationStyles.pageTitle}>
                            <i className="fas fa-face-smile"></i>
                            Đăng ký khuôn mặt
                        </h1>
                        <p style={faceRegistrationStyles.pageSubtitle}>
                            Đăng ký dữ liệu khuôn mặt cho hệ thống điểm danh tự động
                        </p>
                    </div>

                    <div style={faceRegistrationStyles.mainGrid}>
                        {/* Student Selection Panel */}
                        <div style={faceRegistrationStyles.panel}>
                            <div style={faceRegistrationStyles.panelTitle}>
                                <i className="fas fa-users"></i>
                                Chọn sinh viên
                            </div>

                            <div style={faceRegistrationStyles.searchSection}>
                                <input
                                    type="text"
                                    style={faceRegistrationStyles.searchInput}
                                    placeholder="Tìm kiếm sinh viên..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div style={faceRegistrationStyles.filterRow}>
                                    <select
                                        style={faceRegistrationStyles.selectInput}
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                    >
                                        <option value="">Tất cả vai trò</option>
                                        <option value="student">Sinh viên</option>
                                        <option value="teacher">Giáo viên</option>
                                    </select>
                                    <select
                                        style={faceRegistrationStyles.selectInput}
                                        value={faceTrainedFilter}
                                        onChange={(e) => setFaceTrainedFilter(e.target.value)}
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="1">Đã đăng ký</option>
                                        <option value="0">Chưa đăng ký</option>
                                    </select>
                                </div>
                            </div>

                            <div style={faceRegistrationStyles.userList}>
                                {filteredUsers.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '2rem',
                                        color: '#64748b'
                                    }}>
                                        <i className="fas fa-users" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                                        <p>Không tìm thấy người dùng nào</p>
                                    </div>
                                ) : (
                                    filteredUsers.map(user => {
                                        const initials = getInitials(user.full_name);
                                        const isSelected = selectedUser?.id === user.id;

                                        return (
                                            <div
                                                key={user.id}
                                                style={{
                                                    ...faceRegistrationStyles.userItem,
                                                    ...(isSelected ? faceRegistrationStyles.userItemSelected : {})
                                                }}
                                                onClick={() => selectUser(user)}
                                            >
                                                <div style={faceRegistrationStyles.userAvatar}>
                                                    {initials}
                                                </div>
                                                <div style={faceRegistrationStyles.userInfo}>
                                                    <div style={faceRegistrationStyles.userName}>
                                                        {user.full_name}
                                                    </div>
                                                    <div style={faceRegistrationStyles.userDetails}>
                                                        {user.username} • {getRoleDisplayName(user.role)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span style={{
                                                        ...faceRegistrationStyles.statusBadge,
                                                        ...(user.face_trained
                                                            ? faceRegistrationStyles.faceTrained
                                                            : faceRegistrationStyles.faceNotTrained)
                                                    }}>
                                                        {user.face_trained ? 'Đã đăng ký' : 'Chưa đăng ký'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Registration Panel */}
                        <div style={faceRegistrationStyles.panel}>
                            <div style={faceRegistrationStyles.panelTitle}>
                                <i className="fas fa-camera"></i>
                                Đăng ký khuôn mặt
                            </div>

                            {selectedUser && (
                                <>
                                    {/* Selected User Info */}
                                    <div style={faceRegistrationStyles.selectedUser}>
                                        <div style={faceRegistrationStyles.selectedUserAvatar}>
                                            {getInitials(selectedUser.full_name)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                                                {selectedUser.full_name}
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                                {selectedUser.username} • {getRoleDisplayName(selectedUser.role)}
                                            </div>
                                            <div style={{
                                                ...faceRegistrationStyles.statusBadge,
                                                ...(selectedUser.face_trained
                                                    ? faceRegistrationStyles.faceTrained
                                                    : faceRegistrationStyles.faceNotTrained),
                                                marginTop: '0.5rem'
                                            }}>
                                                {selectedUser.face_trained ? 'Đã đăng ký khuôn mặt' : 'Chưa đăng ký khuôn mặt'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Method Selection */}
                                    <div style={faceRegistrationStyles.methodSelection}>
                                        <div
                                            style={{
                                                ...faceRegistrationStyles.methodBtn,
                                                ...(currentMethod === 'camera' ? faceRegistrationStyles.methodBtnActive : {})
                                            }}
                                            onClick={() => selectMethod('camera')}
                                        >
                                            <i className="fas fa-camera" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                                            <div style={{ fontWeight: '600' }}>Quay từ Camera</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                Quay video trực tiếp từ camera
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                ...faceRegistrationStyles.methodBtn,
                                                ...(currentMethod === 'upload' ? faceRegistrationStyles.methodBtnActive : {})
                                            }}
                                            onClick={() => selectMethod('upload')}
                                        >
                                            <i className="fas fa-upload" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                                            <div style={{ fontWeight: '600' }}>Tải lên Video</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                Chọn video từ thiết bị
                                            </div>
                                        </div>
                                    </div>

                                    {/* Instructions */}
                                    <div style={faceRegistrationStyles.instructions}>
                                        <div style={faceRegistrationStyles.instructionsTitle}>
                                            <i className="fas fa-info-circle"></i>
                                            Hướng dẫn
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#06b6d4', lineHeight: '1.6' }}>
                                            <li>Đảm bảo khuôn mặt được chiếu sáng đều và rõ ràng</li>
                                            <li>Nhìn thẳng vào camera và di chuyển đầu nhẹ nhàng</li>
                                            <li>Video sẽ được quay trong 5 giây</li>
                                            <li>Không đeo kính đen hoặc che mặt</li>
                                        </ul>
                                    </div>

                                    {/* Camera Section */}
                                    <div style={{
                                        ...faceRegistrationStyles.cameraSection,
                                        ...(currentMethod === 'camera' ? faceRegistrationStyles.cameraSectionActive : {})
                                    }}>
                                        <div style={faceRegistrationStyles.cameraContainer}>
                                            {cameraActive ? (
                                                <>
                                                    <video
                                                        ref={videoRef}
                                                        style={{
                                                            ...faceRegistrationStyles.cameraPreview,
                                                            display: cameraActive ? 'block' : 'none',
                                                            transform: 'scaleX(-1)',
                                                        }}
                                                        autoPlay
                                                        playsInline
                                                        muted
                                                    />
                                                    {cameraActive && (
                                                        <>
                                                            <div style={faceRegistrationStyles.faceGuide}></div>
                                                            <div style={{
                                                                ...faceRegistrationStyles.recordingIndicator,
                                                                ...(isRecording ? faceRegistrationStyles.recordingIndicatorActive : {})
                                                            }}>
                                                                <i className="fas fa-circle" style={{ marginRight: '0.5rem', fontSize: '0.75rem' }}></i>
                                                                ĐANG QUAY ({Math.ceil((100 - recordingProgress) / 20)})
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <div style={faceRegistrationStyles.cameraOverlay}>
                                                    <i className="fas fa-camera" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                                                    <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                        Camera chưa được khởi động
                                                    </p>
                                                    <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                                                        Nhấn nút bên dưới để bắt đầu
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Camera Controls */}
                                        <div style={faceRegistrationStyles.cameraControls}>
                                            {!cameraActive ? (
                                                <button
                                                    style={{
                                                        ...faceRegistrationStyles.btn,
                                                        ...faceRegistrationStyles.btnPrimary,
                                                        padding: '1rem 2rem',
                                                        borderRadius: '2rem'
                                                    }}
                                                    onClick={() => {
                                                        // Delay một chút để đảm bảo video element đã được render
                                                        setTimeout(startCamera, 100);
                                                    }}
                                                >
                                                    <i className="fas fa-camera"></i>
                                                    Khởi động Camera
                                                </button>
                                            ) : (
                                                <>
                                                    {!isRecording ? (
                                                        <button
                                                            style={{
                                                                ...faceRegistrationStyles.controlBtn,
                                                                ...faceRegistrationStyles.recordBtn
                                                            }}
                                                            onClick={startRecording}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.background = faceRegistrationStyles.recordBtnHover.background;
                                                                e.target.style.transform = faceRegistrationStyles.recordBtnHover.transform;
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.background = faceRegistrationStyles.recordBtn.background;
                                                                e.target.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            <i className="fas fa-play"></i>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            style={{
                                                                ...faceRegistrationStyles.controlBtn,
                                                                ...faceRegistrationStyles.stopBtn
                                                            }}
                                                            onClick={stopRecording}
                                                        >
                                                            <i className="fas fa-stop"></i>
                                                        </button>
                                                    )}
                                                    <button
                                                        style={{
                                                            ...faceRegistrationStyles.controlBtn,
                                                            background: '#64748b',
                                                            color: 'white'
                                                        }}
                                                        onClick={stopCamera}
                                                    >
                                                        <i className="fas fa-camera-slash"></i>
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Recording Progress */}
                                        {isRecording && (
                                            <div style={{
                                                ...faceRegistrationStyles.progressContainer,
                                                ...faceRegistrationStyles.progressContainerActive
                                            }}>
                                                <div style={faceRegistrationStyles.progressBar}>
                                                    <div
                                                        style={{
                                                            ...faceRegistrationStyles.progressFill,
                                                            width: `${recordingProgress}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <div style={faceRegistrationStyles.progressText}>
                                                    Đang quay video... {recordingProgress}%
                                                </div>
                                            </div>
                                        )}

                                        {/* Recorded Video Preview */}
                                        {recordedVideo && (
                                            <div style={{ marginTop: '1.5rem' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '1rem'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        color: '#10b981',
                                                        fontWeight: '600'
                                                    }}>
                                                        <i className="fas fa-check-circle"></i>
                                                        Video đã quay xong
                                                    </div>
                                                    <button
                                                        style={{
                                                            ...faceRegistrationStyles.btn,
                                                            background: '#f3f4f6',
                                                            color: '#6b7280',
                                                            padding: '0.5rem 1rem'
                                                        }}
                                                        onClick={clearVideo}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                        Xóa
                                                    </button>
                                                </div>
                                                <div style={{
                                                    background: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '0.5rem',
                                                    padding: '1rem',
                                                    fontSize: '0.9rem',
                                                    color: '#64748b'
                                                }}>
                                                    <i className="fas fa-file-video"></i> {recordedVideo.name} ({(recordedVideo.size / 1024 / 1024).toFixed(2)} MB)
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Section */}
                                    <div style={{
                                        ...faceRegistrationStyles.uploadSection,
                                        ...(currentMethod === 'upload' ? faceRegistrationStyles.uploadSectionActive : {})
                                    }}>
                                        <div
                                            style={faceRegistrationStyles.uploadArea}
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.style.borderColor = faceRegistrationStyles.uploadAreaHover.borderColor;
                                                e.currentTarget.style.background = faceRegistrationStyles.uploadAreaHover.background;
                                            }}
                                            onDragLeave={(e) => {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.background = 'transparent';
                                                const file = e.dataTransfer.files[0];
                                                if (file) {
                                                    handleVideoFile(file);
                                                }
                                            }}
                                        >
                                            <div style={faceRegistrationStyles.uploadIcon}>
                                                <i className="fas fa-cloud-upload-alt"></i>
                                            </div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                                                Chọn hoặc kéo thả video vào đây
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                                Hỗ trợ: MP4, WebM, AVI (tối đa 10MB)
                                            </div>
                                        </div>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="video/*"
                                            style={{ display: 'none' }}
                                            onChange={handleVideoUpload}
                                        />

                                        {/* Selected Video Preview */}
                                        {selectedVideoFile && (
                                            <div style={{ marginTop: '1.5rem' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '1rem'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        color: '#10b981',
                                                        fontWeight: '600'
                                                    }}>
                                                        <i className="fas fa-check-circle"></i>
                                                        Video đã chọn
                                                    </div>
                                                    <button
                                                        style={{
                                                            ...faceRegistrationStyles.btn,
                                                            background: '#f3f4f6',
                                                            color: '#6b7280',
                                                            padding: '0.5rem 1rem'
                                                        }}
                                                        onClick={clearVideo}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                        Xóa
                                                    </button>
                                                </div>
                                                <div style={{
                                                    background: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '0.5rem',
                                                    padding: '1rem',
                                                    fontSize: '0.9rem',
                                                    color: '#64748b'
                                                }}>
                                                    <i className="fas fa-file-video"></i> {selectedVideoFile.name} ({(selectedVideoFile.size / 1024 / 1024).toFixed(2)} MB)
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Progress */}
                                    {isUploading && (
                                        <div style={{
                                            ...faceRegistrationStyles.progressContainer,
                                            ...faceRegistrationStyles.progressContainerActive
                                        }}>
                                            <div style={faceRegistrationStyles.progressBar}>
                                                <div
                                                    style={{
                                                        ...faceRegistrationStyles.progressFill,
                                                        width: `${uploadProgress}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <div style={faceRegistrationStyles.progressText}>
                                                Đang xử lý và đăng ký khuôn mặt... {uploadProgress}%
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                        <button
                                            style={{
                                                ...faceRegistrationStyles.btn,
                                                ...faceRegistrationStyles.btnPrimary,
                                                ...faceRegistrationStyles.btnFull,
                                                ...(canSubmit ? {} : faceRegistrationStyles.btnDisabled)
                                            }}
                                            onClick={submitFaceData}
                                            disabled={!canSubmit}
                                        >
                                            <i className="fas fa-save"></i>
                                            {isUploading ? 'Đang xử lý...' : 'Đăng ký khuôn mặt'}
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <button
                                            style={{
                                                ...faceRegistrationStyles.btn,
                                                flex: 1
                                            }}
                                            onClick={resetForm}
                                        >
                                            <i className="fas fa-undo"></i>
                                            Đặt lại
                                        </button>
                                        <button
                                            style={{
                                                ...faceRegistrationStyles.btn,
                                                background: '#f3f4f6',
                                                color: '#6b7280',
                                                flex: 1
                                            }}
                                            onClick={() => setSelectedUser(null)}
                                        >
                                            <i className="fas fa-times"></i>
                                            Hủy
                                        </button>
                                    </div>
                                </>
                            )}

                            {!selectedUser && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '3rem 1rem',
                                    color: '#64748b'
                                }}>
                                    <i className="fas fa-user-plus" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#cbd5e1' }}></i>
                                    <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>Chọn người dùng</h3>
                                    <p>Vui lòng chọn một người dùng từ danh sách bên trái để bắt đầu đăng ký khuôn mặt.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FaceRegistration;