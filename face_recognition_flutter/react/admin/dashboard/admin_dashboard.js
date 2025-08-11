// Dashboard JavaScript - Modern Professional Implementation

class DashboardApp {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.currentTimeElement = document.getElementById('currentTime');
        
        this.statistics = null;
        this.activities = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateCurrentTime();
        this.loadDashboardData();
        this.renderQuickActions();
        this.renderManagementCards();
        
        // Update time every second
        setInterval(() => this.updateCurrentTime(), 1000);
        
        // Refresh data every 5 minutes
        setInterval(() => this.refreshData(), 5 * 60 * 1000);
    }
    
    setupEventListeners() {
        // Sidebar toggle
        this.sidebarToggle?.addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (item.dataset.page) {
                    e.preventDefault();
                    this.setActiveNavItem(item);
                    this.handleNavigation(item.dataset.page);
                }
            });
        });
        
        // Quick actions
        document.querySelectorAll('.quick-action-card').forEach(card => {
            card.addEventListener('click', () => {
                this.handleQuickAction(card.dataset.action);
            });
        });
        
        // Management cards
        document.addEventListener('click', (e) => {
            const managementCard = e.target.closest('.management-card');
            if (managementCard) {
                this.handleManagementCardClick(managementCard.dataset.page);
            }
        });
        
        // Responsive sidebar for mobile
        if (window.innerWidth <= 768) {
            document.addEventListener('click', (e) => {
                if (!this.sidebar.contains(e.target) && this.sidebar.classList.contains('open')) {
                    this.sidebar.classList.remove('open');
                }
            });
        }
    }
    
    toggleSidebar() {
        if (window.innerWidth <= 768) {
            this.sidebar.classList.toggle('open');
        } else {
            this.sidebar.classList.toggle('collapsed');
        }
    }
    
    setActiveNavItem(activeItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }
    
    updateCurrentTime() {
        if (this.currentTimeElement) {
            const now = new Date();
            const timeString = now.toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            this.currentTimeElement.textContent = timeString;
        }
    }
    
    showLoading() {
        this.loadingOverlay?.classList.add('active');
    }
    
    hideLoading() {
        this.loadingOverlay?.classList.remove('active');
    }
    
    async loadDashboardData() {
        this.showLoading();
        
        try {
            // Simulate API calls
            await this.loadStatistics();
            await this.loadRecentActivities();
            
            this.renderStatistics();
            this.renderActivities();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showErrorMessage('Không thể tải dữ liệu dashboard');
        } finally {
            this.hideLoading();
        }
    }
    
    async loadStatistics() {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                this.statistics = {
                    total_users: 150,
                    total_students: 120,
                    total_teachers: 25,
                    total_classes: 15,
                    total_sessions: 500,
                    total_attendances: 15000,
                    active_sessions: 3,
                    model_accuracy: 98.5
                };
                resolve();
            }, 1000);
        });
    }
    
    async loadRecentActivities() {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                this.activities = [
                    {
                        id: 1,
                        type: 'attendance',
                        title: 'Phiên điểm danh mới được tạo',
                        description: 'Lớp CNTT K47 - Môn Lập trình Web',
                        time: '5 phút trước',
                        icon: 'fas fa-calendar-check',
                        color: '#10b981'
                    },
                    {
                        id: 2,
                        type: 'user',
                        title: 'Người dùng mới đăng ký',
                        description: 'Nguyễn Văn A - Sinh viên',
                        time: '15 phút trước',
                        icon: 'fas fa-user-plus',
                        color: '#3b82f6'
                    },
                    {
                        id: 3,
                        type: 'training',
                        title: 'Huấn luyện mô hình AI hoàn tất',
                        description: 'Độ chính xác: 98.5%',
                        time: '1 giờ trước',
                        icon: 'fas fa-brain',
                        color: '#8b5cf6'
                    },
                    {
                        id: 4,
                        type: 'report',
                        title: 'Báo cáo tuần được tạo',
                        description: 'Báo cáo điểm danh tuần 10',
                        time: '2 giờ trước',
                        icon: 'fas fa-chart-bar',
                        color: '#f59e0b'
                    }
                ];
                resolve();
            }, 800);
        });
    }
    
    renderStatistics() {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid || !this.statistics) return;
        
        const statsConfig = [
            {
                title: 'Tổng người dùng',
                value: this.statistics.total_users,
                icon: 'fas fa-users',
                color: '#3b82f6',
                change: '+5.2%'
            },
            {
                title: 'Sinh viên',
                value: this.statistics.total_students,
                icon: 'fas fa-user-graduate',
                color: '#10b981',
                change: '+2.1%'
            },
            {
                title: 'Giáo viên',
                value: this.statistics.total_teachers,
                icon: 'fas fa-chalkboard-teacher',
                color: '#f59e0b',
                change: '+1'
            },
            {
                title: 'Lớp học',
                value: this.statistics.total_classes,
                icon: 'fas fa-school',
                color: '#ef4444',
                change: '+2'
            },
            {
                title: 'Phiên điểm danh',
                value: this.statistics.total_sessions,
                icon: 'fas fa-calendar-check',
                color: '#8b5cf6',
                change: '+12.8%'
            },
            {
                title: 'Lượt điểm danh',
                value: this.statistics.total_attendances,
                icon: 'fas fa-check-circle',
                color: '#06b6d4',
                change: '+8.4%'
            }
        ];
        
        statsGrid.innerHTML = statsConfig.map(stat => `
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-icon" style="background: ${stat.color}">
                        <i class="${stat.icon}"></i>
                    </div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        ${stat.change}
                    </div>
                </div>
                <div class="stat-value">${stat.value.toLocaleString()}</div>
                <div class="stat-label">${stat.title}</div>
            </div>
        `).join('');
    }
    
    renderQuickActions() {
        // Quick actions are already in HTML, just add event listeners
        const quickActionCards = document.querySelectorAll('.quick-action-card');
        quickActionCards.forEach(card => {
            card.addEventListener('click', () => {
                this.handleQuickAction(card.dataset.action);
            });
        });
    }
    
    renderManagementCards() {
        const managementGrid = document.getElementById('managementGrid');
        if (!managementGrid) return;
        
        const managementCards = [
            {
                title: 'Quản lý người dùng',
                description: 'Thêm, sửa, xóa người dùng và phân quyền hệ thống',
                icon: 'fas fa-users',
                color: '#3b82f6',
                page: 'users',
                stats: {
                    'Tổng người dùng': this.statistics?.total_users || 0,
                    'Hoạt động': '45',
                    'Chờ duyệt': '3'
                }
            },
            {
                title: 'Quản lý lớp học',
                description: 'Tạo lớp học mới và quản lý danh sách sinh viên',
                icon: 'fas fa-school',
                color: '#10b981',
                page: 'classes',
                stats: {
                    'Tổng lớp học': this.statistics?.total_classes || 0,
                    'Sinh viên': this.statistics?.total_students || 0,
                    'Đang học': '12'
                }
            },
            {
                title: 'Phiên điểm danh',
                description: 'Theo dõi và quản lý tất cả các phiên điểm danh',
                icon: 'fas fa-calendar-check',
                color: '#f59e0b',
                page: 'sessions',
                stats: {
                    'Tổng phiên': this.statistics?.total_sessions || 0,
                    'Đang diễn ra': this.statistics?.active_sessions || 0,
                    'Hôm nay': '8'
                }
            },
            {
                title: 'Môn học & Lịch học',
                description: 'Quản lý môn học và lập thời khóa biểu',
                icon: 'fas fa-book',
                color: '#8b5cf6',
                page: 'subjects',
                stats: {
                    'Môn học': '25',
                    'Lịch học': '150',
                    'Tuần này': '35'
                }
            },
            {
                title: 'Nhận diện khuôn mặt',
                description: 'Quản lý và huấn luyện mô hình AI nhận diện',
                icon: 'fas fa-face-smile',
                color: '#ef4444',
                page: 'face-recognition',
                stats: {
                    'Mẫu huấn luyện': '2.5K',
                    'Độ chính xác': `${this.statistics?.model_accuracy || 0}%`,
                    'Cập nhật': '2 giờ trước'
                }
            },
            {
                title: 'Báo cáo & Thống kê',
                description: 'Xem báo cáo chi tiết và phân tích dữ liệu',
                icon: 'fas fa-chart-bar',
                color: '#06b6d4',
                page: 'reports',
                stats: {
                    'Báo cáo': '50',
                    'Xuất tháng này': '12',
                    'Tự động': '8'
                }
            }
        ];
        
        managementGrid.innerHTML = managementCards.map(card => `
            <div class="management-card" data-page="${card.page}">
                <div class="card-header">
                    <div class="card-icon" style="background: ${card.color}">
                        <i class="${card.icon}"></i>
                    </div>
                    <div class="card-content">
                        <h3>${card.title}</h3>
                        <p>${card.description}</p>
                    </div>
                </div>
                <div class="card-stats">
                    ${Object.entries(card.stats).map(([key, value]) => `
                        <div class="stat-row">
                            <span>${key}</span>
                            <span>${value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    
    renderActivities() {
        const activitiesList = document.getElementById('activitiesList');
        if (!activitiesList || !this.activities) return;
        
        activitiesList.innerHTML = this.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${activity.color}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');
    }
    
    handleQuickAction(action) {
        console.log(`Quick action: ${action}`);
        
        switch (action) {
            case 'new-session':
                this.showNotification('Chuyển đến trang tạo phiên điểm danh mới', 'info');
                // window.location.href = 'create-session.html';
                break;
                
            case 'add-user':
                this.showNotification('Chuyển đến trang thêm người dùng', 'info');
                // window.location.href = 'add-user.html';
                break;
                
            case 'train-model':
                this.handleTrainModel();
                break;
                
            case 'export-report':
                this.handleExportReport();
                break;
                
            default:
                this.showNotification('Tính năng đang được phát triển', 'warning');
        }
    }
    
    async handleTrainModel() {
        this.showNotification('Bắt đầu huấn luyện mô hình AI...', 'info');
        
        try {
            // Simulate training process
            await new Promise(resolve => setTimeout(resolve, 3000));
            this.showNotification('Huấn luyện mô hình thành công! Độ chính xác: 98.7%', 'success');
            
            // Update statistics
            if (this.statistics) {
                this.statistics.model_accuracy = 98.7;
                this.renderStatistics();
            }
        } catch (error) {
            this.showNotification('Huấn luyện mô hình thất bại', 'error');
        }
    }
    
    handleExportReport() {
        this.showNotification('Đang chuẩn bị báo cáo...', 'info');
        
        // Simulate report generation
        setTimeout(() => {
            this.showNotification('Báo cáo đã được tải xuống', 'success');
        }, 2000);
    }
    
    handleNavigation(page) {
        console.log(`Navigate to: ${page}`);
        
        switch (page) {
            case 'dashboard':
                // Already on dashboard
                break;
            case 'users':
                window.location.href = '../usermanager/user_management.html';
                break;
            case 'classes':
                window.location.href = '../classmanager/class_management.html';
                break;
            case 'sessions':
                this.showNotification('Chuyển đến trang quản lý phiên điểm danh', 'info');
                break;
            default:
                this.showNotification('Tính năng đang được phát triển', 'warning');
        }
    }
    
    handleManagementCardClick(page) {
        this.handleNavigation(page);
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => this.removeNotification(notification), 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });
    }
    
    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }
    
    async refreshData() {
        console.log('Refreshing dashboard data...');
        await this.loadDashboardData();
        this.showNotification('Dữ liệu đã được cập nhật', 'success');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardApp = new DashboardApp();
});

// Add notification styles dynamically
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        border-left: 4px solid;
        padding: 16px;
        min-width: 300px;
        max-width: 400px;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success { border-left-color: #10b981; }
    .notification-error { border-left-color: #ef4444; }
    .notification-warning { border-left-color: #f59e0b; }
    .notification-info { border-left-color: #3b82f6; }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .notification-content i {
        font-size: 18px;
    }
    
    .notification-success i { color: #10b981; }
    .notification-error i { color: #ef4444; }
    .notification-warning i { color: #f59e0b; }
    .notification-info i { color: #3b82f6; }
    
    .notification-close {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: #64748b;
    }
    
    .notification-close:hover {
        color: #334155;
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);