import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api-service';
import authService from '../../services/auth-service';
import useNotification from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import ConfirmModal from '../../components/ConfirmModal';
import { AppLayout, Header } from '../../components/layout/AppLayout';

// Styles
const styles = {
    container: {
        padding: '20px'
    },
    tabContainer: {
        display: 'flex',
        marginBottom: '24px',
        borderBottom: '2px solid #e2e8f0'
    },
    tab: {
        padding: '12px 24px',
        cursor: 'pointer',
        border: 'none',
        backgroundColor: 'transparent',
        fontSize: '16px',
        fontWeight: '500',
        color: '#64748b',
        borderBottom: '2px solid transparent',
        transition: 'all 0.2s ease'
    },
    activeTab: {
        color: '#3b82f6',
        borderBottomColor: '#3b82f6'
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0'
    },
    templateGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
    },
    templateCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
    },
    templateCardHover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
    },
    templateHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
    },
    templateTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a202c',
        marginBottom: '4px'
    },
    templateType: {
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '6px',
        fontWeight: '500',
        textTransform: 'uppercase'
    },
    templateDescription: {
        fontSize: '14px',
        color: '#64748b',
        marginBottom: '16px',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
    },
    templateMeta: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#64748b',
        marginBottom: '16px'
    },
    templateTags: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '16px'
    },
    tag: {
        fontSize: '11px',
        padding: '4px 8px',
        backgroundColor: '#f1f5f9',
        color: '#475569',
        borderRadius: '4px',
        border: '1px solid #e2e8f0'
    },
    templateActions: {
        display: 'flex',
        gap: '8px',
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
    buttonSuccess: {
        backgroundColor: '#10b981',
        color: '#ffffff'
    },
    buttonWarning: {
        backgroundColor: '#f59e0b',
        color: '#ffffff'
    },
    buttonDanger: {
        backgroundColor: '#ef4444',
        color: '#ffffff'
    },
    filterContainer: {
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
    },
    filterSelect: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        backgroundColor: '#ffffff'
    },
    searchInput: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        backgroundColor: '#ffffff',
        minWidth: '200px'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#64748b'
    },
    emptyStateIcon: {
        fontSize: '48px',
        marginBottom: '16px',
        color: '#cbd5e1'
    },
    loadingSpinner: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        fontSize: '18px',
        color: '#64748b'
    },
    tagFilterContainer: {
        marginTop: '16px'
    },
    tagFilterLabel: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px',
        display: 'block'
    },
    tagList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
    },
    tagFilter: {
        fontSize: '12px',
        padding: '6px 12px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        userSelect: 'none'
    },
    tagFilterActive: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        borderColor: '#3b82f6'
    },
    clearFilters: {
        fontSize: '12px',
        padding: '4px 8px',
        color: '#64748b',
        textDecoration: 'underline',
        cursor: 'pointer',
        border: 'none',
        backgroundColor: 'transparent'
    }
};

// Template Card Component
const TemplateCard = ({ template, onUse, onEdit, onDelete, isOwner, onView }) => {
    const [hovered, setHovered] = useState(false);

    const getTypeStyle = (type) => {
        const styles = {
            homework: { backgroundColor: '#dbeafe', color: '#1e40af' },
            project: { backgroundColor: '#dcfce7', color: '#166534' },
            lab: { backgroundColor: '#fef3c7', color: '#92400e' },
            essay: { backgroundColor: '#fce7f3', color: '#be185d' }
        };
        return styles[type] || styles.homework;
    };

    const getTypeLabel = (type) => {
        const labels = {
            homework: 'Bài tập',
            project: 'Dự án',
            lab: 'Thực hành',
            essay: 'Luận văn'
        };
        return labels[type] || 'Bài tập';
    };

    return (
        <div
            style={{
                ...styles.templateCard,
                ...(hovered ? styles.templateCardHover : {})
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onView(template)}
        >
            <div style={styles.templateHeader}>
                <div>
                    <div style={styles.templateTitle}>{template.title}</div>
                </div>
                <div style={{
                    ...styles.templateType,
                    ...getTypeStyle(template.assignment_type)
                }}>
                    {getTypeLabel(template.assignment_type)}
                </div>
            </div>

            {template.description && (
                <div style={styles.templateDescription}>
                    {template.description}
                </div>
            )}

            <div style={styles.templateMeta}>
                <span>
                    <i className="fas fa-star" style={{ marginRight: '4px', color: '#f59e0b' }}></i>
                    {template.default_max_score} điểm
                </span>
                <span>
                    <i className="fas fa-copy" style={{ marginRight: '4px', color: '#3b82f6' }}></i>
                    Đã dùng {template.usage_count || 0} lần
                </span>
                {!isOwner && (
                    <span>
                        <i className="fas fa-user" style={{ marginRight: '4px', color: '#10b981' }}></i>
                        {template.teacher_name}
                    </span>
                )}
            </div>

            {template.tags && template.tags.length > 0 && (
                <div style={styles.templateTags}>
                    {(Array.isArray(template.tags) ? template.tags : JSON.parse(template.tags || '[]')).map((tag, index) => (
                        <span key={index} style={styles.tag}>
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div style={styles.templateActions} onClick={(e) => e.stopPropagation()}>
                <button
                    style={{ ...styles.button, ...styles.buttonSuccess }}
                    onClick={() => onUse(template)}
                >
                    <i className="fas fa-plus"></i>
                    Sử dụng
                </button>
                {isOwner && (
                    <>
                        <button
                            style={{ ...styles.button, ...styles.buttonSecondary }}
                            onClick={() => onEdit(template)}
                        >
                            <i className="fas fa-edit"></i>
                            Sửa
                        </button>
                        <button
                            style={{ ...styles.button, ...styles.buttonDanger }}
                            onClick={() => onDelete(template)}
                        >
                            <i className="fas fa-trash"></i>
                            Xóa
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// Main Component
const AssignmentTemplateBank = () => {
    const navigate = useNavigate();
    const { notifications, showNotification, removeNotification } = useNotification();

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('my-templates');
    const [myTemplates, setMyTemplates] = useState([]);
    const [publicTemplates, setPublicTemplates] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    useEffect(() => {
        extractAvailableTags();
    }, [myTemplates, publicTemplates]);

    const loadData = async () => {
        try {
            setLoading(true);
            const user = await ApiService.getProfile();
            setCurrentUser(user.data);

            if (activeTab === 'my-templates') {
                await loadMyTemplates(user.data.id);
            } else {
                await loadPublicTemplates();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            showNotification('Không thể tải dữ liệu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadMyTemplates = async (teacherId) => {
        try {
            const params = {};
            if (filterType !== 'all') params.assignment_type = filterType;
            if (searchTerm) params.search = searchTerm;

            const response = await ApiService.getTeacherTemplates(teacherId, params);
            if (response.success) {
                setMyTemplates(response.data || []);
            }
        } catch (error) {
            console.error('Error loading my templates:', error);
            showNotification('Không thể tải templates của bạn', 'error');
        }
    };

    const loadPublicTemplates = async () => {
        try {
            const params = {};
            if (filterType !== 'all') params.assignment_type = filterType;
            if (searchTerm) params.search = searchTerm;

            const response = await ApiService.getPublicTemplates(params);
            if (response.success) {
                setPublicTemplates(response.data || []);
            }
        } catch (error) {
            console.error('Error loading public templates:', error);
            showNotification('Không thể tải templates công khai', 'error');
        }
    };

    // Remove the old handleUseTemplate function since we replaced it above

    const handleEditTemplate = (template) => {
        navigate(`/teacher/assignment-templates/${template.id}/edit`);
    };

    const handleDeleteTemplate = async (template) => {
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận xóa template',
            message: `Bạn có chắc chắn muốn xóa template "${template.title}"?`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                await performDeleteTemplate(template);
            },
            onCancel: () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const performDeleteTemplate = async (template) => {

        try {
            const response = await ApiService.deleteTemplate(template.id);
            if (response.success) {
                showNotification('Xóa template thành công', 'success');
                loadData();
            } else {
                throw new Error(response.message || 'Không thể xóa template');
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            showNotification(error.message || 'Không thể xóa template', 'error');
        }
    };

    const handleViewTemplate = (template) => {
        navigate(`/teacher/assignment-templates/${template.id}`);
    };

    const handleSearch = () => {
        loadData();
    };

    const extractAvailableTags = () => {
        const allTemplates = [...myTemplates, ...publicTemplates];
        const tagSet = new Set();
        
        allTemplates.forEach(template => {
            if (template.tags) {
                const tags = Array.isArray(template.tags) ? template.tags : JSON.parse(template.tags || '[]');
                tags.forEach(tag => tagSet.add(tag));
            }
        });
        
        setAvailableTags(Array.from(tagSet).sort());
    };

    const handleTagToggle = (tag) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleUseTemplate = async (template) => {
        try {
            // Lấy danh sách course sections của giáo viên
            const response = await ApiService.getCourseSectionsByTeacher(currentUser.id);
            if (response.success && response.data.courseSections) {
                const courseSections = response.data.courseSections;
                
                // Kiểm tra bài tập có tiêu đề tương tự đã tồn tại ở course sections nào
                const conflictSections = [];
                for (const section of courseSections) {
                    try {
                        const checkResponse = await ApiService.getAssignmentsByCourseSection(section.id);
                        if (checkResponse.success) {
                            const hasConflictAssignment = checkResponse.data.some(
                                assignment => assignment.title === template.title && 
                                             assignment.assignment_type === template.assignment_type
                            );
                            if (hasConflictAssignment) {
                                conflictSections.push(section.name);
                            }
                        }
                    } catch (error) {
                        console.warn('Error checking assignments for section:', section.id);
                    }
                }

                if (conflictSections.length > 0) {
                    setConfirmModal({
                        isOpen: true,
                        title: 'Bài tập đã tồn tại',
                        message: (
                            <div>
                                <p>Bài tập <strong>"{template.title}"</strong> đã tồn tại trong {conflictSections.length} lớp học phần:</p>
                                <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                                    {conflictSections.map((section, index) => (
                                        <li key={index}>{section}</li>
                                    ))}
                                </ul>
                                <p>Bạn có muốn tiếp tục tạo cho các lớp khác không?</p>
                                <p><em>Lưu ý: Bạn có thể thay đổi tiêu đề để tránh trùng lặp</em></p>
                            </div>
                        ),
                        onConfirm: () => {
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                            // Navigate to assignment creation form with template data
                            navigate('/teacher/assignments/new', { 
                                state: { 
                                    template: template,
                                    fromTemplate: true
                                }
                            });
                        },
                        onCancel: () => {
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                        }
                    });
                    return; // Don't navigate immediately
                }
            }
        } catch (error) {
            console.warn('Error checking assignment conflicts:', error);
        }

        // Navigate to assignment creation form with template data
        navigate('/teacher/assignments/new', { 
            state: { 
                template: template,
                fromTemplate: true
            }
        });
    };

    const getCurrentTemplates = () => {
        let templates = activeTab === 'my-templates' ? myTemplates : publicTemplates;
        
        // Filter by tags
        if (selectedTags.length > 0) {
            templates = templates.filter(template => {
                if (!template.tags) return false;
                const templateTags = Array.isArray(template.tags) ? template.tags : JSON.parse(template.tags || '[]');
                return selectedTags.some(selectedTag => templateTags.includes(selectedTag));
            });
        }
        
        return templates;
    };

    const breadcrumb = [
        { label: 'Trang chủ', path: '/teacher' },
        { label: 'Bài tập', path: '/teacher/assignments' },
        { label: 'Ngân hàng bài tập', path: '/teacher/assignment-templates' }
    ];

    if (loading) {
        return (
            <AppLayout
                user={currentUser}
                onLogout={() => { authService.logout(); navigate('/'); }}
                currentTime={new Date()}
                title="Ngân hàng bài tập"
            >
                <div style={styles.loadingSpinner}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
                    Đang tải dữ liệu...
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            user={currentUser}
            onLogout={() => { authService.logout(); navigate('/'); }}
            currentTime={new Date()}
            title="Ngân hàng bài tập"
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
                title="Ngân hàng bài tập"
                titleIcon="fas fa-database"
                showBack={true}
                onBack={() => navigate('/teacher/assignments')}
                breadcrumb={breadcrumb}
                actions={[
                    {
                        label: 'Tạo template mới',
                        icon: 'fas fa-plus',
                        onClick: () => navigate('/teacher/assignment-templates/new')
                    },
                    {
                        label: 'Làm mới',
                        icon: 'fas fa-sync-alt',
                        onClick: loadData
                    }
                ]}
            />

            <div style={styles.container}>
                {/* Tabs */}
                <div style={styles.tabContainer}>
                    <button
                        style={{
                            ...styles.tab,
                            ...(activeTab === 'my-templates' ? styles.activeTab : {})
                        }}
                        onClick={() => setActiveTab('my-templates')}
                    >
                        <i className="fas fa-user" style={{ marginRight: '8px' }}></i>
                        Templates của tôi ({myTemplates.length})
                    </button>
                    <button
                        style={{
                            ...styles.tab,
                            ...(activeTab === 'public-templates' ? styles.activeTab : {})
                        }}
                        onClick={() => setActiveTab('public-templates')}
                    >
                        <i className="fas fa-globe" style={{ marginRight: '8px' }}></i>
                        Templates công khai ({publicTemplates.length})
                    </button>
                </div>

                {/* Content */}
                <div style={styles.section}>
                    {/* Filters */}
                    <div style={styles.filterContainer}>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">Tất cả loại</option>
                            <option value="homework">Bài tập</option>
                            <option value="project">Dự án</option>
                            <option value="lab">Thực hành</option>
                            <option value="essay">Luận văn</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Tìm kiếm template..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />

                        <button
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            onClick={handleSearch}
                        >
                            <i className="fas fa-search"></i>
                            Tìm kiếm
                        </button>
                    </div>

                    {/* Tag Filters */}
                    {availableTags.length > 0 && (
                        <div style={styles.tagFilterContainer}>
                            <label style={styles.tagFilterLabel}>
                                <i className="fas fa-tags" style={{ marginRight: '6px' }}></i>
                                Lọc theo tags:
                            </label>
                            <div style={styles.tagList}>
                                {availableTags.map(tag => (
                                    <span
                                        key={tag}
                                        style={{
                                            ...styles.tagFilter,
                                            ...(selectedTags.includes(tag) ? styles.tagFilterActive : {})
                                        }}
                                        onClick={() => handleTagToggle(tag)}
                                    >
                                        #{tag}
                                    </span>
                                ))}
                                {selectedTags.length > 0 && (
                                    <button
                                        style={styles.clearFilters}
                                        onClick={() => setSelectedTags([])}
                                    >
                                        Xóa bộ lọc
                                    </button>
                                )}
                            </div>
                            {selectedTags.length > 0 && (
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                                    <i className="fas fa-filter" style={{ marginRight: '4px' }}></i>
                                    Đang lọc theo {selectedTags.length} tag(s): {selectedTags.join(', ')}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Templates Grid */}
                    {getCurrentTemplates().length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyStateIcon}>
                                <i className="fas fa-folder-open"></i>
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                                {activeTab === 'my-templates' ? 'Chưa có template nào' : 'Không tìm thấy template công khai'}
                            </div>
                            <div style={{ fontSize: '14px', marginBottom: '20px' }}>
                                {activeTab === 'my-templates' 
                                    ? 'Tạo template đầu tiên để tái sử dụng bài tập'
                                    : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                                }
                            </div>
                            {activeTab === 'my-templates' && (
                                <button
                                    style={{ ...styles.button, ...styles.buttonPrimary }}
                                    onClick={() => navigate('/teacher/assignment-templates/new')}
                                >
                                    <i className="fas fa-plus"></i>
                                    Tạo template đầu tiên
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={styles.templateGrid}>
                            {getCurrentTemplates().map(template => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onUse={handleUseTemplate}
                                    onEdit={handleEditTemplate}
                                    onDelete={handleDeleteTemplate}
                                    onView={handleViewTemplate}
                                    isOwner={activeTab === 'my-templates'}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                show={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={confirmModal.onCancel}
            />
        </AppLayout>
    );
};

export default AssignmentTemplateBank;