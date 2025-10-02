import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { AppLayout, Header } from '../../components/layout/AppLayout';

// Styles
const styles = {
    section: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0'
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#1a202c',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
    },
    formGroup: {
        marginBottom: '20px'
    },
    formLabel: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '6px'
    },
    formInput: {
        width: '90%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        transition: 'border-color 0.2s ease'
    },
    formInputFocus: {
        borderColor: '#3b82f6',
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    button: {
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px'
    },
    buttonPrimary: {
        backgroundColor: '#3b82f6',
        color: '#ffffff'
    },
    buttonSecondary: {
        backgroundColor: '#f1f5f9',
        color: '#374151',
        border: '1px solid #e2e8f0'
    },
    buttonSuccess: {
        backgroundColor: '#10b981',
        color: '#ffffff'
    },
    infoCard: {
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
    },
    infoCardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#1a202c'
    },
    weightCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px'
    },
    weightHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
    },
    weightTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1a202c'
    },
    weightValue: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#3b82f6'
    },
    slider: {
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        background: '#e2e8f0',
        outline: 'none',
        marginBottom: '12px'
    },
    totalWeight: {
        padding: '16px',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '20px'
    },
    totalWeightValid: {
        backgroundColor: '#dcfce7',
        color: '#166534',
        border: '1px solid #16a34a'
    },
    totalWeightInvalid: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #dc2626'
    },
    previewSection: {
        backgroundColor: '#fefbf3',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '20px'
    },
    gradeScale: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '12px',
        marginTop: '16px'
    },
    gradeItem: {
        textAlign: 'center',
        padding: '8px',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0'
    },
    gradeItemLetter: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#1a202c'
    },
    gradeItemRange: {
        fontSize: '12px',
        color: '#64748b'
    }
};

const GradeConfiguration = () => {
    const { courseSectionId } = useParams();
    const navigate = useNavigate();
    const { notifications, showNotification, removeNotification } = useNotification();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [courseSectionData, setCourseSectionData] = useState(null);
    const [configuration, setConfiguration] = useState({
        assignment_weight: 30,
        exam_weight: 60,
        attendance_weight: 10,
        passing_score: 5.0
    });
    const [currentUser, setCurrentUser] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        loadData();
        return () => clearInterval(timer);
    }, [courseSectionId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Get current user
            const userResponse = await ApiService.getProfile();
            setCurrentUser(userResponse.data);

            // Load course section details
            const courseSectionResponse = await ApiService.getCourseSection(courseSectionId);
            if (courseSectionResponse.success) {
                setCourseSectionData(courseSectionResponse.data);
            }

            // Load grade configuration
            const configResponse = await ApiService.getGradeConfiguration(courseSectionId);
            if (configResponse.success) {
                setConfiguration({
                    assignment_weight: parseFloat(configResponse.data.assignment_weight),
                    exam_weight: parseFloat(configResponse.data.exam_weight),
                    attendance_weight: parseFloat(configResponse.data.attendance_weight),
                    passing_score: parseFloat(configResponse.data.passing_score)
                });
            }

        } catch (error) {
            console.error('Error loading data:', error);
            showNotification('Lỗi khi tải dữ liệu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleWeightChange = (type, value) => {
        const numValue = parseFloat(value) || 0;
        setConfiguration(prev => ({
            ...prev,
            [type]: numValue
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Validate total weight
            const totalWeight = configuration.assignment_weight + configuration.exam_weight + configuration.attendance_weight;
            if (Math.abs(totalWeight - 100) > 0.01) {
                showNotification('Tổng trọng số phải bằng 100%', 'error');
                return;
            }

            const response = await ApiService.updateGradeConfiguration(courseSectionId, configuration);
            
            if (response.success) {
                showNotification('Cập nhật cấu hình thành công', 'success');
            } else {
                throw new Error('Failed to update configuration');
            }

        } catch (error) {
            console.error('Error saving configuration:', error);
            showNotification('Lỗi khi lưu cấu hình: ', error);
        } finally {
            setSaving(false);
        }
    };

    const handleRecalculate = async () => {
        try {
            setSaving(true);
            const response = await ApiService.recalculateGrades(courseSectionId);
            
            if (response.success) {
                showNotification('Tính lại điểm thành công', 'success');
            } else {
                throw new Error('Failed to recalculate grades');
            }

        } catch (error) {
            console.error('Error recalculating grades:', error);
            showNotification('Lỗi khi tính lại điểm', 'error');
        } finally {
            setSaving(false);
        }
    };

    const totalWeight = configuration.assignment_weight + configuration.exam_weight + configuration.attendance_weight;
    const isValidWeight = Math.abs(totalWeight - 100) < 0.01;

    const gradeScale = [
        { letter: 'A+', range: '9.0 - 10', gpa: '4.0' },
        { letter: 'A', range: '8.5 - 8.9', gpa: '3.7' },
        { letter: 'B+', range: '8.0 - 8.4', gpa: '3.5' },
        { letter: 'B', range: '7.0 - 7.9', gpa: '3.0' },
        { letter: 'C+', range: '6.5 - 6.9', gpa: '2.5' },
        { letter: 'C', range: '5.5 - 6.4', gpa: '2.0' },
        { letter: 'D+', range: '5.0 - 5.4', gpa: '1.5' },
        { letter: 'D', range: '4.0 - 4.9', gpa: '1.0' },
        { letter: 'F', range: '< 4.0', gpa: '0.0' }
    ];

    return (
        <AppLayout
            user={currentUser}
            onLogout={() => {
                authService.logout();
                navigate('/login');
            }}
            currentTime={currentTime}
            title="Cấu hình sổ điểm"
        >
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

            {/* Header */}
            <Header
                title="Cấu hình sổ điểm"
                titleIcon="fas fa-cog"
                showBack={true}
                onBack={() => navigate(`/teacher/course-sections/${courseSectionId}`)}
                actions={[
                    {
                        label: 'Tính lại tất cả điểm',
                        icon: 'fas fa-calculator',
                        onClick: handleRecalculate,
                        disabled: saving
                    }
                ]}
            />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#64748b' }}></i>
                    <div style={{ marginTop: '16px', color: '#64748b' }}>Đang tải dữ liệu...</div>
                </div>
            ) : (
                <>
                    {/* Course Section Info */}
                    <div style={styles.infoCard}>
                        <div style={styles.infoCardHeader}>
                            <i className="fas fa-chalkboard-teacher"></i>
                            Thông tin học phần
                        </div>
                        {courseSectionData && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                <div>
                                    <strong>Tên:</strong> {courseSectionData.name}
                                </div>
                                <div>
                                    <strong>Môn:</strong> {courseSectionData.subject_name}
                                </div>
                                <div>
                                    <strong>Lớp:</strong> {courseSectionData.class_name}
                                </div>
                                <div>
                                    <strong>Học kỳ:</strong> {courseSectionData.semester} - {courseSectionData.academic_year}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Total Weight Display */}
                    <div style={{
                        ...styles.totalWeight,
                        ...(isValidWeight ? styles.totalWeightValid : styles.totalWeightInvalid)
                    }}>
                        Tổng trọng số: {totalWeight.toFixed(1)}%
                        {isValidWeight ? (
                            <span style={{ marginLeft: '10px' }}>
                                <i className="fas fa-check-circle"></i> Hợp lệ
                            </span>
                        ) : (
                            <span style={{ marginLeft: '10px' }}>
                                <i className="fas fa-exclamation-triangle"></i> Phải bằng 100%
                            </span>
                        )}
                    </div>

                    {/* Weight Configuration */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>
                                <i className="fas fa-balance-scale"></i>
                                Cấu hình trọng số điểm
                            </h2>
                        </div>

                        <div style={styles.formGrid}>
                            {/* Assignment Weight */}
                            <div style={styles.weightCard}>
                                <div style={styles.weightHeader}>
                                    <div style={styles.weightTitle}>
                                        <i className="fas fa-tasks" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
                                        Bài tập
                                    </div>
                                    <div style={styles.weightValue}>{configuration.assignment_weight}%</div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={configuration.assignment_weight}
                                    onChange={(e) => handleWeightChange('assignment_weight', e.target.value)}
                                    style={styles.slider}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={configuration.assignment_weight}
                                    onChange={(e) => handleWeightChange('assignment_weight', e.target.value)}
                                    style={styles.formInput}
                                    placeholder="Nhập % trọng số"
                                />
                            </div>

                            {/* Exam Weight */}
                            <div style={styles.weightCard}>
                                <div style={styles.weightHeader}>
                                    <div style={styles.weightTitle}>
                                        <i className="fas fa-file-alt" style={{ marginRight: '8px', color: '#10b981' }}></i>
                                        Kiểm tra
                                    </div>
                                    <div style={styles.weightValue}>{configuration.exam_weight}%</div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={configuration.exam_weight}
                                    onChange={(e) => handleWeightChange('exam_weight', e.target.value)}
                                    style={styles.slider}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={configuration.exam_weight}
                                    onChange={(e) => handleWeightChange('exam_weight', e.target.value)}
                                    style={styles.formInput}
                                    placeholder="Nhập % trọng số"
                                />
                            </div>

                            {/* Attendance Weight */}
                            <div style={styles.weightCard}>
                                <div style={styles.weightHeader}>
                                    <div style={styles.weightTitle}>
                                        <i className="fas fa-clipboard-check" style={{ marginRight: '8px', color: '#f59e0b' }}></i>
                                        Chuyên cần
                                    </div>
                                    <div style={styles.weightValue}>{configuration.attendance_weight}%</div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={configuration.attendance_weight}
                                    onChange={(e) => handleWeightChange('attendance_weight', e.target.value)}
                                    style={styles.slider}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={configuration.attendance_weight}
                                    onChange={(e) => handleWeightChange('attendance_weight', e.target.value)}
                                    style={styles.formInput}
                                    placeholder="Nhập % trọng số"
                                />
                            </div>
                        </div>

                        {/* Passing Score */}
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>
                                <i className="fas fa-award" style={{ marginRight: '8px', color: '#ef4444' }}></i>
                                Điểm đậu tối thiểu
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={configuration.passing_score}
                                onChange={(e) => handleWeightChange('passing_score', e.target.value)}
                                style={styles.formInput}
                                placeholder="Nhập điểm đậu tối thiểu"
                            />
                        </div>

                        {/* Save Button */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                style={{ ...styles.button, ...styles.buttonSecondary }}
                                onClick={() => navigate(`/teacher/course-sections/${courseSectionId}`)}
                            >
                                <i className="fas fa-times"></i>
                                Hủy
                            </button>
                            <button
                                style={{ ...styles.button, ...styles.buttonSuccess }}
                                onClick={handleSave}
                                disabled={saving || !isValidWeight}
                            >
                                {saving ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save"></i>
                                        Lưu cấu hình
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Grade Scale Preview */}
                    <div style={styles.previewSection}>
                        <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <i className="fas fa-chart-line"></i>
                            Thang điểm xếp loại
                        </h3>
                        <div style={styles.gradeScale}>
                            {gradeScale.map(grade => (
                                <div key={grade.letter} style={styles.gradeItem}>
                                    <div style={styles.gradeItemLetter}>{grade.letter}</div>
                                    <div style={styles.gradeItemRange}>{grade.range}</div>
                                    <div style={styles.gradeItemRange}>GPA: {grade.gpa}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            backgroundColor: '#ffffff',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#64748b'
                        }}>
                            <strong>Công thức tính điểm cuối:</strong><br />
                            Điểm cuối = (Điểm TB Bài tập × {configuration.assignment_weight}%) + 
                            (Điểm TB Kiểm tra × {configuration.exam_weight}%) + 
                            (Điểm Chuyên cần × {configuration.attendance_weight}%)
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
};

export default GradeConfiguration;