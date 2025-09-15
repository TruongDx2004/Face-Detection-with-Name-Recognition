import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { AppLayout, Header } from '../../components/layout/AppLayout';

// Base styles
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
    tableContainer: {
        overflowX: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: '8px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '800px'
    },
    tableHeader: {
        backgroundColor: '#f8fafc',
        fontWeight: '600',
        color: '#374151',
        padding: '12px',
        textAlign: 'left',
        borderBottom: '1px solid #e2e8f0',
        fontSize: '14px'
    },
    tableCell: {
        padding: '12px',
        borderBottom: '1px solid #f1f5f9',
        fontSize: '14px',
        color: '#374151'
    },
    gradeInput: {
        width: '60px',
        padding: '4px 8px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        fontSize: '12px',
        textAlign: 'center'
    },
    statusBadge: {
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
    },
    statusGraded: {
        backgroundColor: '#dcfce7',
        color: '#166534'
    },
    statusPending: {
        backgroundColor: '#fef3c7',
        color: '#92400e'
    },
    statusMissing: {
        backgroundColor: '#fee2e2',
        color: '#991b1b'
    }
};

// Grade Cell Component for inline editing
const GradeCell = ({ value, maxScore, status, onUpdate, isEditable }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value?.toString() || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setEditValue(value?.toString() || '');
    }, [value]);

    const handleSubmit = async () => {
        if (!editValue || editValue === value?.toString()) {
            setIsEditing(false);
            return;
        }

        const numericValue = parseFloat(editValue);
        if (isNaN(numericValue) || numericValue < 0 || numericValue > maxScore) {
            alert(`Điểm phải từ 0 đến ${maxScore}`);
            return;
        }

        setLoading(true);
        try {
            await onUpdate(numericValue);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating grade:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            setEditValue(value?.toString() || '');
            setIsEditing(false);
        }
    };

    const getStatusStyle = () => {
        switch (status) {
            case 'graded':
                return styles.statusGraded;
            case 'submitted':
            case 'completed':
                return styles.statusPending;
            default:
                return styles.statusMissing;
        }
    };

    const getDisplayText = () => {
        if (value !== null && value !== undefined && value !== '') {
            return value.toString();
        }
        switch (status) {
            case 'submitted':
            case 'completed':
                return 'Chưa chấm';
            case 'missing':
            case 'not_started':
                return '-';
            default:
                return '-';
        }
    };

    if (isEditing && isEditable) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={maxScore}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleSubmit}
                    style={{
                        ...styles.gradeInput,
                        width: '50px'
                    }}
                    autoFocus
                    disabled={loading}
                />
                {loading && <i className="fas fa-spinner fa-spin" style={{ fontSize: '12px' }}></i>}
            </div>
        );
    }

    return (
        <div
            style={{
                textAlign: 'center',
                cursor: isEditable ? 'pointer' : 'default',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                minHeight: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...(value !== null && value !== undefined && value !== '' ? {} : getStatusStyle())
            }}
            onClick={() => isEditable && setIsEditing(true)}
            title={isEditable ? 'Click để chỉnh sửa điểm' : undefined}
        >
            {getDisplayText()}
        </div>
    );
};

// Course Section Detail Component
const CourseSectionDetail = () => {
    const { courseSectionId } = useParams();
    const navigate = useNavigate();
    const { notifications, showNotification, removeNotification } = useNotification();

    // State management
    const [loading, setLoading] = useState(true);
    const [courseSectionData, setCourseSectionData] = useState(null);
    const [students, setStudents] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [exams, setExams] = useState([]);
    const [gradebook, setGradebook] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [error, setError] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        loadCourseSectionData();
        return () => clearInterval(timer);
    }, [courseSectionId]);

    const loadCourseSectionData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const userResponse = await ApiService.getProfile();
            setCurrentUser(userResponse.data);

            // Load course section details
            const courseSectionResponse = await ApiService.getCourseSection(courseSectionId);
            if (courseSectionResponse.success) {
                setCourseSectionData(courseSectionResponse.data);
            }

            // Load students in this course section
            const studentsResponse = await ApiService.getCourseSectionStudents(courseSectionId);
            if (studentsResponse.success) {
                setStudents(studentsResponse.data || []);
            }

            // Load assignments and exams first (needed for gradebook)
            const [assignmentsResponse, examsResponse] = await Promise.all([
                ApiService.getAssignmentsByCourseSection(courseSectionId),
                ApiService.getExamsByCourseSection(courseSectionId)
            ]);

            const loadedAssignments = assignmentsResponse.success ? (assignmentsResponse.data || []) : [];
            const loadedExams = examsResponse.success ? (examsResponse.data || []) : [];

            setAssignments(loadedAssignments);
            setExams(loadedExams);

            // Load gradebook data after assignments and exams are loaded
            await loadGradebookDataWithParams(loadedAssignments, loadedExams, studentsResponse.data || []);

        } catch (error) {
            console.error('Error loading course section data:', error);
            setError('Không thể tải dữ liệu học phần');
            showNotification('Lỗi khi tải dữ liệu học phần', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadGradebookDataWithParams = async (assignmentsData, examsData, studentsData) => {
        try {
            // Use parameters instead of state to avoid timing issues
            const assignments = assignmentsData || [];
            const exams = examsData || [];
            const students = studentsData || [];

            console.log('Loading gradebook with params:', { assignments, exams, students });

            // Load assignment submissions for all students
            const submissionsPromises = assignments.map(assignment =>
                ApiService.getAssignmentSubmissions(assignment.id)
            );
            const submissionsResponses = await Promise.all(submissionsPromises);

            // Load exam results for all students
            const examResultsPromises = exams.map(exam =>
                ApiService.getExamResults(exam.id)
            );
            const examResultsResponses = await Promise.all(examResultsPromises);

            // Load gradebook entries
            const gradebookResponse = await ApiService.getGradebookByCourseSection(courseSectionId);

            // Process and organize the data
            const gradebookData = {};
            students.forEach(student => {
                gradebookData[student.id] = {
                    student: student,
                    assignments: {},
                    exams: {},
                    gradebook: null
                };
            });

            // Process assignment submissions
            submissionsResponses.forEach((response, index) => {
                if (response.success && response.data) {
                    const assignmentId = assignments[index].id;
                    response.data.forEach(submission => {
                        if (gradebookData[submission.student_id]) {
                            gradebookData[submission.student_id].assignments[assignmentId] = submission;
                        }
                    });
                }
            });

            // Process exam results
            examResultsResponses.forEach((response, index) => {
                if (response.success && response.data) {
                    const examId = exams[index].id;
                    response.data.forEach(result => {
                        if (gradebookData[result.student_id]) {
                            gradebookData[result.student_id].exams[examId] = result;
                        }
                    });
                }
            });

            // Process gradebook entries
            if (gradebookResponse.success && gradebookResponse.data) {
                gradebookResponse.data.forEach(entry => {
                    if (gradebookData[entry.student_id]) {
                        gradebookData[entry.student_id].gradebook = entry;
                    }
                });
            }

            setGradebook(gradebookData);
        } catch (error) {
            console.error('Error loading gradebook data:', error);
            showNotification('Lỗi khi tải dữ liệu bảng điểm', 'warning');
        }
    };

    const loadGradebookData = async () => {
        // Wrapper function for refresh button - uses current state
        await loadGradebookDataWithParams(assignments, exams, students);
    };

    const updateGrade = async (studentId, type, itemId, score) => {
        try {
            let response;
            if (type === 'assignment') {
                // Find the submission
                const submission = gradebook[studentId]?.assignments[itemId];
                if (submission) {
                    response = await ApiService.gradeSubmission(submission.id, {
                        score: parseFloat(score),
                        feedback: ''
                    });
                } else {
                    showNotification('Không tìm thấy bài nộp', 'error');
                    return;
                }
            } else if (type === 'exam') {
                // Update exam result
                const examResult = gradebook[studentId]?.exams[itemId];
                if (examResult) {
                    response = await ApiService.updateExamResult(examResult.id, {
                        score: parseFloat(score)
                    });
                } else {
                    showNotification('Không tìm thấy kết quả thi', 'error');
                    return;
                }
            }

            if (response && response.success) {
                showNotification('Cập nhật điểm thành công', 'success');
                await loadGradebookData(); // Reload data
            } else {
                throw new Error('Failed to update grade');
            }
        } catch (error) {
            console.error('Error updating grade:', error);
            showNotification('Lỗi khi cập nhật điểm', 'error');
        }
    };

    const handleExportExcel = async () => {
        try {
            showNotification('Đang xuất file Excel...', 'info');
            
            const { blob, filename } = await ApiService.exportGradebookExcel(courseSectionId);
            
            // Tạo URL để download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification('Xuất file Excel thành công', 'success');
        } catch (error) {
            console.error('Error exporting Excel:', error);
            showNotification('Lỗi khi xuất file Excel', 'error');
        }
    };

    return (
        <AppLayout
            user={currentUser}
            onLogout={() => {
                authService.logout();
                navigate('/login');
            }}
            currentTime={currentTime}
            title="Chi tiết học phần"
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

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#64748b' }}></i>
                    <div style={{ marginTop: '16px', color: '#64748b' }}>Đang tải dữ liệu...</div>
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }}></i>
                    <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>Có lỗi xảy ra</div>
                    <div style={{ color: '#64748b', marginBottom: '20px' }}>{error}</div>
                    <button
                        style={{ ...styles.button, ...styles.buttonPrimary }}
                        onClick={loadCourseSectionData}
                    >
                        <i className="fas fa-sync-alt"></i>
                        Thử lại
                    </button>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <Header
                        title={courseSectionData?.name || 'Chi tiết học phần'}
                        titleIcon="fas fa-chalkboard-teacher"
                        showBack={true}
                        onBack={() => navigate('/teacher/course-sections')}
                        actions={[
                            {
                                label: 'Xuất Excel',
                                icon: 'fas fa-file-excel',
                                onClick: handleExportExcel,
                                style: { backgroundColor: '#10b981', color: '#ffffff' }
                            },
                            {
                                label: 'Cấu hình sổ điểm',
                                icon: 'fas fa-cog',
                                onClick: () => navigate(`/teacher/course-sections/${courseSectionId}/grade-config`)
                            },
                            {
                                label: 'Tạo bài tập',
                                icon: 'fas fa-plus',
                                onClick: () => navigate(`/teacher/assignments/create?courseSectionId=${courseSectionId}`)
                            },
                            {
                                label: 'Tạo bài kiểm tra',
                                icon: 'fas fa-file-alt',
                                onClick: () => navigate(`/teacher/exams/create?courseSectionId=${courseSectionId}`)
                            }
                        ]}
                    />

                    {/* Course Section Info */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>
                                <i className="fas fa-info-circle"></i>
                                Thông tin học phần
                            </h2>
                        </div>

                        {courseSectionData && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>Tên học phần</div>
                                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{courseSectionData.name}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>Môn học</div>
                                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{courseSectionData.subject_name}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>Lớp</div>
                                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{courseSectionData.class_name}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>Giảng viên</div>
                                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{courseSectionData.teacher_name}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>Học kỳ</div>
                                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{courseSectionData.semester} - {courseSectionData.academic_year}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>Số sinh viên</div>
                                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{students.length}/{courseSectionData.max_students}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Student Gradebook */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>
                                <i className="fas fa-table"></i>
                                Bảng điểm sinh viên ({students.length})
                            </h2>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    style={{ 
                                        ...styles.button, 
                                        backgroundColor: '#10b981',
                                        color: '#ffffff',
                                        border: 'none'
                                    }}
                                    onClick={handleExportExcel}
                                >
                                    <i className="fas fa-file-excel"></i>
                                    Xuất Excel
                                </button>
                                <button
                                    style={{ ...styles.button, ...styles.buttonSecondary }}
                                    onClick={loadCourseSectionData}
                                >
                                    <i className="fas fa-sync-alt"></i>
                                    Làm mới
                                </button>
                            </div>
                        </div>

                        {/* Gradebook Table */}
                        {students.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                                <i className="fas fa-user-graduate" style={{ fontSize: '48px', marginBottom: '16px', color: '#cbd5e1' }}></i>
                                <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                                    Chưa có sinh viên nào
                                </div>
                                <div style={{ fontSize: '14px' }}>
                                    Học phần này chưa có sinh viên đăng ký
                                </div>
                            </div>
                        ) : (
                            <div style={styles.tableContainer}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.tableHeader}>STT</th>
                                            <th style={styles.tableHeader}>Mã SV</th>
                                            <th style={styles.tableHeader}>Họ và tên</th>

                                            {/* Assignment columns */}
                                            {assignments.map(assignment => (
                                                <th key={`assignment-${assignment.id}`} style={styles.tableHeader}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '12px', fontWeight: '500' }}>BT</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                            {assignment.title.length > 15
                                                                ? assignment.title.substring(0, 15) + '...'
                                                                : assignment.title}
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                                                            /{assignment.max_score}
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}

                                            {/* Exam columns */}
                                            {exams.map(exam => (
                                                <th key={`exam-${exam.id}`} style={styles.tableHeader}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '12px', fontWeight: '500' }}>KT</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                            {exam.title.length > 15
                                                                ? exam.title.substring(0, 15) + '...'
                                                                : exam.title}
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                                                            /{exam.max_score}
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}

                                            <th style={styles.tableHeader}>TB BT</th>
                                            <th style={styles.tableHeader}>TB KT</th>
                                            <th style={styles.tableHeader}>Điểm cuối</th>
                                            <th style={styles.tableHeader}>Xếp loại</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student, index) => {
                                            const studentGrades = gradebook[student.id] || {};
                                            return (
                                                <tr key={student.id}>
                                                    <td style={styles.tableCell}>{index + 1}</td>
                                                    <td style={styles.tableCell}>{student.student_code}</td>
                                                    <td style={styles.tableCell}>{student.full_name}</td>

                                                    {/* Assignment grades */}
                                                    {assignments.map(assignment => {
                                                        const submission = studentGrades.assignments?.[assignment.id];
                                                        return (
                                                            <td key={`assignment-${assignment.id}-${student.id}`} style={styles.tableCell}>
                                                                <GradeCell
                                                                    value={submission?.score || ''}
                                                                    maxScore={assignment.max_score}
                                                                    status={submission?.status || 'missing'}
                                                                    onUpdate={(score) => updateGrade(student.id, 'assignment', assignment.id, score)}
                                                                    isEditable={submission?.status === 'submitted' || submission?.status === 'graded'}
                                                                />
                                                            </td>
                                                        );
                                                    })}

                                                    {/* Exam grades */}
                                                    {exams.map(exam => {
                                                        const examResult = studentGrades.exams?.[exam.id];
                                                        return (
                                                            <td key={`exam-${exam.id}-${student.id}`} style={styles.tableCell}>
                                                                <GradeCell
                                                                    value={examResult?.score || ''}
                                                                    maxScore={exam.max_score}
                                                                    status={examResult?.status || 'not_started'}
                                                                    onUpdate={(score) => updateGrade(student.id, 'exam', exam.id, score)}
                                                                    isEditable={examResult?.status === 'completed' || examResult?.status === 'graded'}
                                                                />
                                                            </td>
                                                        );
                                                    })}

                                                    <td style={styles.tableCell}>
                                                        <span style={{ fontWeight: '600' }}>
                                                            {studentGrades.gradebook?.assignment_avg != null
                                                                ? Number(studentGrades.gradebook.assignment_avg).toFixed(1)
                                                                : '-'}
                                                        </span>
                                                    </td>
                                                    <td style={styles.tableCell}>
                                                        <span style={{ fontWeight: '600' }}>
                                                            {studentGrades.gradebook?.exam_avg != null
                                                                ? Number(studentGrades.gradebook.exam_avg).toFixed(1)
                                                                : '-'}
                                                        </span>
                                                    </td>
                                                    <td style={styles.tableCell}>
                                                        <span style={{
                                                            fontWeight: '700',
                                                            color: Number(studentGrades.gradebook?.final_score ?? 0) >= 5
                                                                ? '#16a34a'
                                                                : '#dc2626'
                                                        }}>
                                                            {studentGrades.gradebook?.final_score != null
                                                                ? Number(studentGrades.gradebook.final_score).toFixed(1)
                                                                : '-'}

                                                        </span>
                                                    </td>
                                                    <td style={styles.tableCell}>
                                                        <span style={{
                                                            ...styles.statusBadge,
                                                            ...(studentGrades.gradebook?.is_passed ? styles.statusGraded : styles.statusPending)
                                                        }}>
                                                            {studentGrades.gradebook?.letter_grade || 'Chưa có'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </AppLayout>
    );
};

export default CourseSectionDetail;