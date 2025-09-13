import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { AppLayout, Header } from '../../components/layout/AppLayout';

// Styles
const styles = {
    examGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
    },
    examCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease'
    },
    examCardHover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
    },
    examHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
    },
    examTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a202c',
        marginBottom: '4px'
    },
    examCourse: {
        fontSize: '14px',
        color: '#64748b'
    },
    examType: {
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '6px',
        fontWeight: '500'
    },
    typeQuiz: {
        backgroundColor: '#dbeafe',
        color: '#1d4ed8'
    },
    typeMidterm: {
        backgroundColor: '#fef3c7',
        color: '#92400e'
    },
    typeFinal: {
        backgroundColor: '#fecaca',
        color: '#dc2626'
    },
    typePractical: {
        backgroundColor: '#dcfce7',
        color: '#166534'
    },
    examDetails: {
        marginTop: '16px'
    },
    examDetailItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        fontSize: '14px',
        color: '#374151'
    },
    examActions: {
        display: 'flex',
        gap: '8px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #e2e8f0'
    },
    button: {
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
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
    buttonDanger: {
        backgroundColor: '#ef4444',
        color: '#ffffff'
    },
    filterSection: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0'
    },
    filterGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        alignItems: 'end'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column'
    },
    formLabel: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '6px'
    },
    formSelect: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        backgroundColor: '#ffffff'
    },
    statsSection: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
    },
    statCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        textAlign: 'center'
    },
    statNumber: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1a202c',
        marginBottom: '4px'
    },
    statLabel: {
        fontSize: '14px',
        color: '#64748b'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#64748b'
    },
    emptyStateIcon: {
        fontSize: '48px',
        marginBottom: '16px'
    },
    emptyStateTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '8px'
    },
    emptyStateText: {
        fontSize: '14px',
        marginBottom: '24px'
    }
};

const TeacherExams = () => {
    const navigate = useNavigate();
    const { notifications, showNotification, removeNotification } = useNotification();

    const [exams, setExams] = useState([]);
    const [courseSections, setCourseSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [filters, setFilters] = useState({
        courseSection: '',
        examType: '',
        status: ''
    });

    useEffect(() => {
        const fetchUserAndSections = async () => {
            try {
                const user = await ApiService.getProfile();
                setCurrentUser(user.data);

                // Gọi tiếp courseSections
                await fetchCourseSections(user.data.id);
            } catch (error) {
                console.error('Error fetching user profile:', error);
                showNotification('Không thể tải thông tin người dùng', 'error');
            }
        };
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);

        fetchUserAndSections();
        return () => clearInterval(timer);
    }, []); // chỉ chạy 1 lần khi component mount

    useEffect(() => {
        if (courseSections.length > 0) {
            fetchExams();
        }
    }, [courseSections, filters]);

    const fetchCourseSections = async (teacherId) => {
        try {
            const response = await ApiService.getCourseSectionsByTeacher(teacherId);
            console.log('Course Sections:', response.data);
            setCourseSections(response.data.courseSections || []);
        } catch (error) {
            console.error('Error fetching course sections:', error);
            showNotification('Không thể tải danh sách lớp học phần', 'error');
        }
    };




    const fetchExams = async () => {
        try {
            setLoading(true);
            let allExams = [];

            if (filters.courseSection) {
                const response = await ApiService.getExamsByCourseSection(filters.courseSection);
                allExams = response.data || [];
                console.log(`Exams for course section if ${filters.courseSection}:`, allExams);
            } else {
                // Fetch exams from all course sections
                for (const cs of courseSections) {
                    try {
                        const response = await ApiService.getExamsByCourseSection(cs.id);
                        const examsData = response.data || [];
                        allExams = [
                            ...allExams,
                            ...examsData.map(exam => ({
                                ...exam,
                                course_name: cs.course_name,
                                subject_name: cs.subject_name,
                            }))
                        ];
                        console.log(`Exams for course section ${cs.id}:`, examsData);
                    } catch (error) {
                        console.error(`Error fetching exams for course section ${cs.id}:`, error);
                    }
                }
            }

            setExams(allExams);
        } catch (error) {
            console.error('Error fetching exams:', error);
            showNotification('Không thể tải danh sách bài kiểm tra', 'error');
        } finally {
            setLoading(false);
        }
    };


    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const filteredExams = useMemo(() => {
        return exams.filter(exam => {
            if (filters.examType && exam.exam_type !== filters.examType) return false;
            return true;
        });
    }, [exams, filters]);

    const examStats = useMemo(() => {
        const total = filteredExams.length;
        const byType = filteredExams.reduce((acc, exam) => {
            acc[exam.exam_type] = (acc[exam.exam_type] || 0) + 1;
            return acc;
        }, {});

        return {
            total,
            quiz: byType.quiz || 0,
            midterm: byType.midterm || 0,
            final: byType.final || 0,
            practical: byType.practical || 0
        };
    }, [filteredExams]);

    const getExamTypeStyle = (type) => {
        switch (type) {
            case 'quiz': return styles.typeQuiz;
            case 'midterm': return styles.typeMidterm;
            case 'final': return styles.typeFinal;
            case 'practical': return styles.typePractical;
            default: return styles.typeQuiz;
        }
    };

    const getExamTypeLabel = (type) => {
        switch (type) {
            case 'quiz': return 'Kiểm tra';
            case 'midterm': return 'Giữa kỳ';
            case 'final': return 'Cuối kỳ';
            case 'practical': return 'Thực hành';
            default: return type;
        }
    };

    const formatDateTime = (date, time) => {
        if (!date) return '';
        const formattedDate = new Date(date).toLocaleDateString('vi-VN');
        return time ? `${formattedDate} ${time}` : formattedDate;
    };

    const handleCreateExam = () => {
        navigate('/teacher/exams/create');
    };

    const handleEditExam = (examId) => {
        navigate(`/teacher/exams/edit/${examId}`);
    };

    const handleViewResults = (examId) => {
        navigate(`/teacher/exams/${examId}/results`);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleDeleteExam = async (examId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này?')) return;

        try {
            await ApiService.deleteExam(examId);
            showNotification('Xóa bài kiểm tra thành công', 'success');
            fetchExams();
        } catch (error) {
            console.error('Error deleting exam:', error);
            showNotification('Không thể xóa bài kiểm tra', 'error');
        }
    };

    return (
        <AppLayout
            user={currentUser}
            onLogout={handleLogout}
            currentTime={currentTime}
            title="Bài Kiểm Tra"
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

            {/* Filter Section */}
            <div style={styles.filterSection}>
                <div style={styles.filterGrid}>
                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Lớp học phần</label>
                        <select
                            style={styles.formSelect}
                            value={filters.courseSection}
                            onChange={(e) => handleFilterChange('courseSection', e.target.value)}
                        >
                            <option value="">Tất cả lớp học phần</option>
                            {courseSections.map(cs => (
                                <option key={cs.id} value={cs.id}>
                                    {cs.name} - {cs.subject_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Loại bài kiểm tra</label>
                        <select
                            style={styles.formSelect}
                            value={filters.examType}
                            onChange={(e) => handleFilterChange('examType', e.target.value)}
                        >
                            <option value="">Tất cả loại</option>
                            <option value="quiz">Kiểm tra</option>
                            <option value="midterm">Giữa kỳ</option>
                            <option value="final">Cuối kỳ</option>
                            <option value="practical">Thực hành</option>
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <button
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            onClick={handleCreateExam}
                        >
                            ➕ Tạo bài kiểm tra mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div style={styles.statsSection}>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{examStats.total}</div>
                    <div style={styles.statLabel}>Tổng số bài kiểm tra</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{examStats.quiz}</div>
                    <div style={styles.statLabel}>Bài kiểm tra</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{examStats.midterm}</div>
                    <div style={styles.statLabel}>Kiểm tra giữa kỳ</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{examStats.final}</div>
                    <div style={styles.statLabel}>Kiểm tra cuối kỳ</div>
                </div>
            </div>

            {/* Exams Grid */}
            {loading ? (
                <div style={styles.emptyState}>
                    <div style={styles.emptyStateIcon}>⏳</div>
                    <div style={styles.emptyStateTitle}>Đang tải...</div>
                </div>
            ) : filteredExams.length === 0 ? (
                <div style={styles.emptyState}>
                    <div style={styles.emptyStateIcon}>📝</div>
                    <div style={styles.emptyStateTitle}>Chưa có bài kiểm tra nào</div>
                    <div style={styles.emptyStateText}>
                        Hãy tạo bài kiểm tra đầu tiên để bắt đầu
                    </div>
                    <button
                        style={{ ...styles.button, ...styles.buttonPrimary }}
                        onClick={handleCreateExam}
                    >
                        ➕ Tạo bài kiểm tra mới
                    </button>
                </div>
            ) : (
                <div style={styles.examGrid}>
                    {filteredExams.map((exam) => (
                        <div
                            key={exam.id}
                            style={styles.examCard}
                            onMouseEnter={(e) => {
                                Object.assign(e.currentTarget.style, styles.examCardHover);
                            }}
                            onMouseLeave={(e) => {
                                Object.assign(e.currentTarget.style, styles.examCard);
                            }}
                        >
                            <div style={styles.examHeader}>
                                <div>
                                    <div style={styles.examTitle}>{exam.title}</div>
                                    <div style={styles.examCourse}>
                                        {exam.course_name} - {exam.subject_name}
                                    </div>
                                </div>
                                <span style={{
                                    ...styles.examType,
                                    ...getExamTypeStyle(exam.exam_type)
                                }}>
                                    {getExamTypeLabel(exam.exam_type)}
                                </span>
                            </div>

                            <div style={styles.examDetails}>
                                <div style={styles.examDetailItem}>
                                    📅 {formatDateTime(exam.exam_date)}
                                </div>
                                <div style={styles.examDetailItem}>
                                    ⏰ {exam.start_time} - {exam.end_time}
                                </div>
                                <div style={styles.examDetailItem}>
                                    ⏱️ {exam.duration_minutes} phút
                                </div>
                                <div style={styles.examDetailItem}>
                                    📊 {exam.max_score} điểm
                                </div>
                                <div style={styles.examDetailItem}>
                                    ❓ {exam.question_count || 0} câu hỏi
                                </div>
                                <div style={styles.examDetailItem}>
                                    👥 {exam.student_count || 0} học sinh đã làm
                                </div>
                            </div>

                            <div style={styles.examActions}>
                                <button
                                    style={{ ...styles.button, ...styles.buttonSecondary }}
                                    onClick={() => handleEditExam(exam.id)}
                                >
                                    ✏️ Chỉnh sửa
                                </button>
                                <button
                                    style={{ ...styles.button, ...styles.buttonPrimary }}
                                    onClick={() => handleViewResults(exam.id)}
                                >
                                    📈 Kết quả
                                </button>
                                <button
                                    style={{ ...styles.button, ...styles.buttonDanger }}
                                    onClick={() => handleDeleteExam(exam.id)}
                                >
                                    🗑️ Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AppLayout>
    );
};

export default TeacherExams;