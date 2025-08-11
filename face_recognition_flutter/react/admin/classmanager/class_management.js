// js/class_management.js

class ClassManager {
    constructor() {
        this.classes = [];
        this.filteredClasses = [];
        this.currentView = 'grid';
        this.isLoading = false;

        // Modal states
        this.currentClassId = null;
        this.currentDeleteItem = null;

        // Elements
        this.elements = {};

        this.init();
    }

    init() {
        this.initElements();
        this.initEventListeners();
        this.loadClasses();
        this.updateStats();
    }

    initElements() {
        // Main elements
        this.elements.sidebar = document.getElementById('sidebar');
        this.elements.sidebarToggle = document.getElementById('sidebarToggle');
        this.elements.classesGrid = document.getElementById('classesGrid');
        this.elements.loadingState = document.getElementById('loadingState');
        this.elements.emptyState = document.getElementById('emptyState');

        // Header elements
        this.elements.refreshBtn = document.getElementById('refreshBtn');
        this.elements.importBtn = document.getElementById('importBtn');
        this.elements.exportBtn = document.getElementById('exportBtn');
        this.elements.addClassBtn = document.getElementById('addClassBtn');
        this.elements.emptyAddBtn = document.getElementById('emptyAddBtn');

        // Search and filter elements
        this.elements.searchInput = document.getElementById('searchInput');
        this.elements.clearSearch = document.getElementById('clearSearch');
        this.elements.filterByStatus = document.getElementById('filterByStatus');
        this.elements.filterByYear = document.getElementById('filterByYear');
        this.elements.resetFilters = document.getElementById('resetFilters');

        // View options
        this.elements.viewBtns = document.querySelectorAll('.view-btn');

        // Stats elements
        this.elements.totalClasses = document.getElementById('totalClasses');
        this.elements.totalStudents = document.getElementById('totalStudents');
        this.elements.avgStudentsPerClass = document.getElementById('avgStudentsPerClass');
        this.elements.activeClasses = document.getElementById('activeClasses');

        // Class modal elements
        this.elements.classModal = document.getElementById('classModal');
        this.elements.classModalTitle = document.getElementById('classModalTitle');
        this.elements.classModalClose = document.getElementById('classModalClose');
        this.elements.classForm = document.getElementById('classForm');
        this.elements.cancelClassBtn = document.getElementById('cancelClassBtn');
        this.elements.saveClassBtn = document.getElementById('saveClassBtn');

        // Form fields
        this.elements.className = document.getElementById('className');
        this.elements.classCode = document.getElementById('classCode');
        this.elements.classYear = document.getElementById('classYear');
        this.elements.classDescription = document.getElementById('classDescription');
        this.elements.classNameError = document.getElementById('classNameError');

        // Student modal elements
        this.elements.studentModal = document.getElementById('studentModal');
        this.elements.studentModalTitle = document.getElementById('studentModalTitle');
        this.elements.studentModalClose = document.getElementById('studentModalClose');
        this.elements.closeStudentModalBtn = document.getElementById('closeStudentModalBtn');
        this.elements.modalStudentCount = document.getElementById('modalStudentCount');
        this.elements.modalStudentWithFace = document.getElementById('modalStudentWithFace');
        this.elements.availableStudents = document.getElementById('availableStudents');
        this.elements.studentCode = document.getElementById('studentCode');
        this.elements.addStudentBtn = document.getElementById('addStudentBtn');
        this.elements.studentSearchInput = document.getElementById('studentSearchInput');
        this.elements.studentList = document.getElementById('studentList');
        this.elements.importStudentsBtn = document.getElementById('importStudentsBtn');
        this.elements.exportStudentsBtn = document.getElementById('exportStudentsBtn');

        // Delete modal elements
        this.elements.deleteModal = document.getElementById('deleteModal');
        this.elements.deleteModalClose = document.getElementById('deleteModalClose');
        this.elements.deleteMessage = document.getElementById('deleteMessage');
        this.elements.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        this.elements.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        // Import modal elements
        this.elements.importModal = document.getElementById('importModal');
        this.elements.importModalClose = document.getElementById('importModalClose');
        this.elements.fileUploadArea = document.getElementById('fileUploadArea');
        this.elements.selectFileBtn = document.getElementById('selectFileBtn');
        this.elements.excelFileInput = document.getElementById('excelFileInput');
        this.elements.downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
        this.elements.cancelImportBtn = document.getElementById('cancelImportBtn');
        this.elements.startImportBtn = document.getElementById('startImportBtn');
    }

    initEventListeners() {
        // Sidebar toggle
        this.elements.sidebarToggle?.addEventListener('click', () => {
            this.elements.sidebar.classList.toggle('collapsed');
        });

        // Header actions
        this.elements.refreshBtn?.addEventListener('click', () => this.refreshData());
        this.elements.importBtn?.addEventListener('click', () => this.openImportModal());
        this.elements.exportBtn?.addEventListener('click', () => this.exportClasses());
        this.elements.addClassBtn?.addEventListener('click', () => this.openClassModal());
        this.elements.emptyAddBtn?.addEventListener('click', () => this.openClassModal());

        // Search functionality
        this.elements.searchInput?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        this.elements.clearSearch?.addEventListener('click', () => {
            this.elements.searchInput.value = '';
            this.handleSearch('');
        });

        // Filter functionality
        this.elements.filterByStatus?.addEventListener('change', () => this.applyFilters());
        this.elements.filterByYear?.addEventListener('change', () => this.applyFilters());
        this.elements.resetFilters?.addEventListener('click', () => this.resetFilters());

        // View options
        this.elements.viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.closest('.view-btn').dataset.view;
                this.changeView(view);
            });
        });

        // Class modal events
        this.elements.classModalClose?.addEventListener('click', () => this.closeClassModal());
        this.elements.cancelClassBtn?.addEventListener('click', () => this.closeClassModal());
        this.elements.saveClassBtn?.addEventListener('click', () => this.saveClass());
        this.elements.classModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.classModal) this.closeClassModal();
        });

        // Form validation
        this.elements.className?.addEventListener('input', () => this.validateClassName());

        // Student modal events
        this.elements.studentModalClose?.addEventListener('click', () => this.closeStudentModal());
        this.elements.closeStudentModalBtn?.addEventListener('click', () => this.closeStudentModal());
        this.elements.studentModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.studentModal) this.closeStudentModal();
        });
        this.elements.addStudentBtn?.addEventListener('click', () => this.addStudentToClass());
        this.elements.studentSearchInput?.addEventListener('input', (e) => {
            this.searchStudents(e.target.value);
        });

        // Delete modal events
        this.elements.deleteModalClose?.addEventListener('click', () => this.closeDeleteModal());
        this.elements.cancelDeleteBtn?.addEventListener('click', () => this.closeDeleteModal());
        this.elements.confirmDeleteBtn?.addEventListener('click', () => this.confirmDelete());
        this.elements.deleteModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.deleteModal) this.closeDeleteModal();
        });

        // Import modal events
        this.elements.importModalClose?.addEventListener('click', () => this.closeImportModal());
        this.elements.cancelImportBtn?.addEventListener('click', () => this.closeImportModal());
        this.elements.startImportBtn?.addEventListener('click', () => this.startImport());
        this.elements.selectFileBtn?.addEventListener('click', () => this.elements.excelFileInput.click());
        this.elements.excelFileInput?.addEventListener('change', (e) => this.handleFileSelect(e));
        this.elements.downloadTemplateBtn?.addEventListener('click', () => this.downloadTemplate());

        // File drag and drop
        this.elements.fileUploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.fileUploadArea.classList.add('dragover');
        });

        this.elements.fileUploadArea?.addEventListener('dragleave', () => {
            this.elements.fileUploadArea.classList.remove('dragover');
        });

        this.elements.fileUploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.fileUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect({ target: { files } });
            }
        });

        // Logout functionality
        document.querySelector('.logout-btn')?.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                localStorage.removeItem('auth_token');
                window.location.href = 'login.html';
            }
        });
    }

    // Data Management
    async loadClasses() {
        this.showLoading(true);

        try {
            // Gọi API thật thay cho mock data
            const response = await window.apiService.getClasses();

            if (response.success && Array.isArray(response.data.classes)) {
                this.classes = response.data.classes;
                this.filteredClasses = [...this.classes];
                console.log('Classes loaded:', this.classes);
                this.renderClasses();
                this.updateStats();

            } else {
                console.warn('API getClasses trả về dữ liệu không hợp lệ:', response);
                this.showError(response.message || 'Không thể tải danh sách lớp học.');
            }

        } catch (error) {
            console.error('Error loading classes:', error);
            this.showError('Không thể tải danh sách lớp học. Vui lòng thử lại.');
        } finally {
            this.showLoading(false);
        }
    }


    async refreshData() {
        const refreshIcon = this.elements.refreshBtn.querySelector('i');
        refreshIcon.classList.add('fa-spin');

        await this.loadClasses();

        setTimeout(() => {
            refreshIcon.classList.remove('fa-spin');
        }, 1000);
    }

    // UI Rendering
    renderClasses() {
        if (this.filteredClasses.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        const html = this.filteredClasses.map(cls => this.createClassCard(cls)).join('');
        this.elements.classesGrid.innerHTML = html;

        // Add event listeners to class cards
        this.attachClassCardEvents();
    }

    createClassCard(cls) {
        const statusBadge = cls.status === 'active'
            ? '<span class="status-badge active"><i class="fas fa-check-circle"></i> Hoạt động</span>'
            : '<span class="status-badge inactive"><i class="fas fa-pause-circle"></i> Tạm dừng</span>';

        return `
            <div class="class-card" data-class-id="${cls.id}">
                <div class="class-card-header">
                    <div class="class-info">
                        <div class="class-name">${cls.name}</div>
                        <div class="class-code">${cls.code} - Khóa ${cls.year}</div>
                    </div>
                </div>
                <div class="class-card-body">
                    <div class="class-stats">
                        <div class="class-stat">
                            <div class="class-stat-value">${cls.studentCount}</div>
                            <div class="class-stat-label">Sinh viên</div>
                        </div>
                        <div class="class-stat">
                            <div class="class-stat-value">${cls.studentsWithFace}</div>
                            <div class="class-stat-label">Có khuôn mặt</div>
                        </div>
                    </div>
                    ${cls.description ? `<div class="class-description">${cls.description}</div>` : ''}
                    <div class="class-actions">
                        <button class="class-action-btn manage-students-btn" data-class-id="${cls.id}">
                            <i class="fas fa-users"></i>
                            Quản lý SV
                        </button>
                        <button class="class-action-btn edit-class-btn" data-class-id="${cls.id}">
                            <i class="fas fa-edit"></i>
                            Sửa
                        </button>
                        <button class="class-action-btn danger delete-class-btn" data-class-id="${cls.id}">
                            <i class="fas fa-trash"></i>
                            Xóa
                        </button>
                        ${statusBadge}
                    </div>
                </div>
            </div>
        `;
    }

    attachClassCardEvents() {
        // Manage students buttons
        document.querySelectorAll('.manage-students-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const classId = parseInt(btn.dataset.classId);
                this.openStudentModal(classId);
            });
        });

        // Edit class buttons
        document.querySelectorAll('.edit-class-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const classId = parseInt(btn.dataset.classId);
                this.editClass(classId);
            });
        });

        // Delete class buttons
        document.querySelectorAll('.delete-class-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const classId = parseInt(btn.dataset.classId);
                this.deleteClass(classId);
            });
        });
    }

    showLoading(show) {
        this.isLoading = show;
        this.elements.loadingState.style.display = show ? 'block' : 'none';
        this.elements.classesGrid.style.display = show ? 'none' : 'block';
    }

    showEmptyState() {
        this.elements.emptyState.style.display = 'block';
        this.elements.classesGrid.style.display = 'none';
    }

    hideEmptyState() {
        this.elements.emptyState.style.display = 'none';
        this.elements.classesGrid.style.display = 'block';
    }

    updateStats() {
        const totalClasses = this.classes.length;
        const totalStudents = this.classes.reduce((sum, cls) => sum + cls.studentCount, 0);
        const avgStudents = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;
        const activeClasses = this.classes.filter(cls => cls.status === 'active').length;

        this.elements.totalClasses.textContent = totalClasses;
        this.elements.totalStudents.textContent = totalStudents;
        this.elements.avgStudentsPerClass.textContent = avgStudents;
        this.elements.activeClasses.textContent = activeClasses;
    }

    // Search and Filter
    handleSearch(query) {
        const showClear = query.length > 0;
        this.elements.clearSearch.style.display = showClear ? 'block' : 'none';

        this.applyFilters();
    }

    applyFilters() {
        const query = this.elements.searchInput.value.toLowerCase().trim();
        const statusFilter = this.elements.filterByStatus.value;
        const yearFilter = this.elements.filterByYear.value;

        this.filteredClasses = this.classes.filter(cls => {
            const matchesSearch = !query ||
                cls.name.toLowerCase().includes(query) ||
                cls.code.toLowerCase().includes(query) ||
                cls.description?.toLowerCase().includes(query);

            const matchesStatus = statusFilter === 'all' || cls.status === statusFilter;
            const matchesYear = yearFilter === 'all' || cls.year === yearFilter;

            return matchesSearch && matchesStatus && matchesYear;
        });

        this.renderClasses();
    }

    resetFilters() {
        this.elements.searchInput.value = '';
        this.elements.filterByStatus.value = 'all';
        this.elements.filterByYear.value = 'all';
        this.elements.clearSearch.style.display = 'none';

        this.filteredClasses = [...this.classes];
        this.renderClasses();
    }

    changeView(view) {
        this.currentView = view;

        // Update view buttons
        this.elements.viewBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Update grid class
        this.elements.classesGrid.classList.toggle('list-view', view === 'list');
    }

    // Class Management
    openClassModal(classId = null) {
        this.currentClassId = classId;

        if (classId) {
            const cls = this.classes.find(c => c.id === classId);
            this.elements.classModalTitle.textContent = 'Chỉnh sửa lớp học';
            this.elements.className.value = cls.name;
            this.elements.classCode.value = cls.code;
            this.elements.classYear.value = cls.year;
            this.elements.classDescription.value = cls.description || '';
        } else {
            this.elements.classModalTitle.textContent = 'Thêm lớp học mới';
            this.elements.classForm.reset();
        }

        this.elements.classModal.classList.add('active');
        this.elements.className.focus();
    }

    closeClassModal() {
        this.elements.classModal.classList.remove('active');
        this.currentClassId = null;
        this.clearFormErrors();
    }

    validateClassName() {
        const name = this.elements.className.value.trim();
        const errorElement = this.elements.classNameError;

        if (!name) {
            errorElement.textContent = 'Tên lớp học không được để trống';
            return false;
        }

        // Check for duplicate names (excluding current class)
        const isDuplicate = this.classes.some(cls =>
            cls.name.toLowerCase() === name.toLowerCase() && cls.id !== this.currentClassId
        );

        if (isDuplicate) {
            errorElement.textContent = 'Tên lớp học đã tồn tại';
            return false;
        }

        errorElement.textContent = '';
        return true;
    }

    async saveClass() {
        if (!this.validateClassName()) {
            return;
        }

        const formData = {
            name: this.elements.className.value.trim(),
            code: this.elements.classCode.value.trim(),
            year: this.elements.classYear.value,
            description: this.elements.classDescription.value.trim()
        };

        // Auto-generate code if empty
        if (!formData.code) {
            formData.code = this.generateClassCode(formData.name, formData.year);
        }

        this.elements.saveClassBtn.disabled = true;
        this.elements.saveClassBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

        try {
            await this.delay(1000); // Simulate API call

            if (this.currentClassId) {
                // Update existing class
                const classIndex = this.classes.findIndex(c => c.id === this.currentClassId);
                this.classes[classIndex] = { ...this.classes[classIndex], ...formData };
                this.showSuccess('Cập nhật lớp học thành công!');
            } else {
                // Create new class
                const newClass = {
                    id: Date.now(),
                    ...formData,
                    status: 'active',
                    studentCount: 0,
                    studentsWithFace: 0,
                    students: []
                };
                this.classes.unshift(newClass);
                this.showSuccess('Thêm lớp học thành công!');
            }

            this.applyFilters();
            this.updateStats();
            this.closeClassModal();

        } catch (error) {
            console.error('Error saving class:', error);
            this.showError('Có lỗi xảy ra khi lưu lớp học. Vui lòng thử lại.');
        } finally {
            this.elements.saveClassBtn.disabled = false;
            this.elements.saveClassBtn.innerHTML = '<i class="fas fa-save"></i> Lưu lớp học';
        }
    }

    editClass(classId) {
        this.openClassModal(classId);
    }

    deleteClass(classId) {
        const cls = this.classes.find(c => c.id === classId);
        this.currentDeleteItem = { type: 'class', id: classId, name: cls.name };

        this.elements.deleteMessage.textContent =
            `Bạn có chắc chắn muốn xóa lớp "${cls.name}" không? Tất cả dữ liệu sinh viên trong lớp sẽ bị xóa.`;

        this.elements.deleteModal.classList.add('active');
    }

    generateClassCode(name, year) {
        // Extract abbreviation from class name
        const words = name.toUpperCase().split(' ').filter(word => word.length > 0);
        let code = '';

        for (const word of words) {
            if (word.match(/^[A-Z]+$/)) {
                code += word;
            } else {
                code += word.charAt(0);
            }
        }

        return code + year.slice(-2);
    }

    // Student Management
    async openStudentModal(classId) {
        this.currentClassId = classId;
        const cls = this.classes.find(c => c.id === classId);

        this.elements.studentModalTitle.textContent = `Quản lý sinh viên - ${cls.name}`;
        this.elements.modalStudentCount.textContent = cls.studentCount;
        this.elements.modalStudentWithFace.textContent = cls.studentsWithFace;

        // Load available students
        await this.loadAvailableStudents();

        // Render current students
        this.renderStudentList(cls.students);

        this.elements.studentModal.classList.add('active');
    }

    closeStudentModal() {
        this.elements.studentModal.classList.remove('active');
        this.currentClassId = null;
    }

    async loadAvailableStudents(classId) {
        try {
            const response = await apiService.getAvailableStudents(classId);
            const data = response.data; 

            const html = '<option value="">Chọn sinh viên...</option>' +
                data.students.map(student =>
                    `<option value="${student.id}">${student.name} (${student.email})</option>`
                ).join('');

            this.elements.availableStudents.innerHTML = html;
        } catch (err) {
            console.error('Error loading available students:', err);
            this.elements.availableStudents.innerHTML =
                '<option value="">Không thể tải danh sách sinh viên</option>';
        }
    }



    async addStudentToClass() {
        const studentId = parseInt(this.elements.availableStudents.value);
        const studentCode = this.elements.studentCode.value.trim();

        if (!studentId) {
            this.showError('Vui lòng chọn sinh viên');
            return;
        }

        if (!studentCode) {
            this.showError('Vui lòng nhập mã sinh viên trong lớp');
            return;
        }

        try {
            // Gọi API thêm sinh viên vào lớp
            await apiService.addStudentToClass(this.currentClassId, {
                student_id: studentId,
                student_code: studentCode
            });

            // Lấy thông tin từ option đã chọn
            const selectedOption = this.elements.availableStudents.selectedOptions[0];
            const studentName = selectedOption.textContent.split(' (')[0];
            const studentEmail = selectedOption.textContent.match(/\(([^)]+)\)/)[1];

            // Cập nhật dữ liệu trên UI
            const cls = this.classes.find(c => c.id === this.currentClassId);
            const newStudent = {
                id: studentId,
                name: studentName,
                code: studentCode,
                email: studentEmail,
                hasFace: false
            };
            cls.students.push(newStudent);
            cls.studentCount++;

            // Render lại danh sách
            this.renderStudentList(cls.students);
            this.elements.modalStudentCount.textContent = cls.studentCount;
            this.updateStats();

            // Reset form
            this.elements.availableStudents.value = '';
            this.elements.studentCode.value = '';

            this.showSuccess('Thêm sinh viên thành công!');
        } catch (error) {
            console.error('Error adding student:', error);
            this.showError('Có lỗi xảy ra khi thêm sinh viên');
        }
    }


    renderStudentList(students) {
        if (students.length === 0) {
            this.elements.studentList.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center;">
                    <p>Chưa có sinh viên nào trong lớp</p>
                </div>
            `;
            return;
        }

        const html = students.map(student => `
            <div class="student-item">
                <div class="student-info">
                    <div class="student-avatar">
                        ${student.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="student-details">
                        <h5>${student.name}</h5>
                        <p>${student.code} • ${student.email}</p>
                        <small style="color: ${student.hasFace ? '#10b981' : '#f59e0b'};">
                            <i class="fas fa-${student.hasFace ? 'check' : 'exclamation-triangle'}"></i>
                            ${student.hasFace ? 'Đã có khuôn mặt' : 'Chưa có khuôn mặt'}
                        </small>
                    </div>
                </div>
                <div class="student-actions-btn">
                    <button class="student-action remove-student-btn" data-student-id="${student.id}" title="Xóa khỏi lớp">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.elements.studentList.innerHTML = html;

        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-student-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const studentId = parseInt(btn.dataset.studentId);
                this.removeStudentFromClass(studentId);
            });
        });
    }

    removeStudentFromClass(studentId) {
        const cls = this.classes.find(c => c.id === this.currentClassId);
        const student = cls.students.find(s => s.id === studentId);

        this.currentDeleteItem = {
            type: 'student',
            id: studentId,
            name: student.name,
            classId: this.currentClassId
        };

        this.elements.deleteMessage.textContent =
            `Bạn có chắc chắn muốn xóa sinh viên "${student.name}" khỏi lớp không?`;

        this.elements.deleteModal.classList.add('active');
    }

    searchStudents(query) {
        // Implementation for student search within the modal
        const cls = this.classes.find(c => c.id === this.currentClassId);
        if (!cls) return;

        const filteredStudents = cls.students.filter(student =>
            student.name.toLowerCase().includes(query.toLowerCase()) ||
            student.code.toLowerCase().includes(query.toLowerCase()) ||
            student.email.toLowerCase().includes(query.toLowerCase())
        );

        this.renderStudentList(filteredStudents);
    }

    // Delete Functionality
    closeDeleteModal() {
        this.elements.deleteModal.classList.remove('active');
        this.currentDeleteItem = null;
    }

    async confirmDelete() {
        if (!this.currentDeleteItem) return;

        this.elements.confirmDeleteBtn.disabled = true;
        this.elements.confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xóa...';

        try {
            await this.delay(1000);

            if (this.currentDeleteItem.type === 'class') {
                // Delete class
                const classIndex = this.classes.findIndex(c => c.id === this.currentDeleteItem.id);
                if (classIndex > -1) {
                    this.classes.splice(classIndex, 1);
                    this.applyFilters();
                    this.updateStats();
                    this.showSuccess('Xóa lớp học thành công!');
                }
            } else if (this.currentDeleteItem.type === 'student') {
                // Remove student from class
                const cls = this.classes.find(c => c.id === this.currentDeleteItem.classId);
                const studentIndex = cls.students.findIndex(s => s.id === this.currentDeleteItem.id);
                if (studentIndex > -1) {
                    cls.students.splice(studentIndex, 1);
                    cls.studentCount--;
                    if (cls.students[studentIndex]?.hasFace) {
                        cls.studentsWithFace--;
                    }
                    this.renderStudentList(cls.students);
                    this.elements.modalStudentCount.textContent = cls.studentCount;
                    this.elements.modalStudentWithFace.textContent = cls.studentsWithFace;
                    this.updateStats();
                    this.showSuccess('Xóa sinh viên khỏi lớp thành công!');
                }
            }

            this.closeDeleteModal();

        } catch (error) {
            console.error('Error deleting:', error);
            this.showError('Có lỗi xảy ra khi xóa. Vui lòng thử lại.');
        } finally {
            this.elements.confirmDeleteBtn.disabled = false;
            this.elements.confirmDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Xóa';
        }
    }

    // Import/Export Functionality
    openImportModal() {
        this.elements.importModal.classList.add('active');
    }

    closeImportModal() {
        this.elements.importModal.classList.remove('active');
        this.elements.excelFileInput.value = '';
        this.elements.startImportBtn.disabled = true;
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            this.showError('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('File không được vượt quá 10MB');
            return;
        }

        this.elements.startImportBtn.disabled = false;

        // Update upload area
        this.elements.fileUploadArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-file-excel" style="color: #10b981;"></i>
            </div>
            <p><strong>${file.name}</strong></p>
            <small>Kích thước: ${(file.size / 1024).toFixed(1)} KB</small>
        `;
    }

    async startImport() {
        this.elements.startImportBtn.disabled = true;
        this.elements.startImportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        try {
            // Simulate import process
            await this.delay(2000);

            this.showSuccess('Import dữ liệu thành công!');
            this.closeImportModal();
            this.refreshData();

        } catch (error) {
            console.error('Import error:', error);
            this.showError('Có lỗi xảy ra khi import dữ liệu');
        } finally {
            this.elements.startImportBtn.disabled = false;
            this.elements.startImportBtn.innerHTML = '<i class="fas fa-upload"></i> Bắt đầu nhập';
        }
    }

    downloadTemplate() {
        // Create and download Excel template
        const csvContent = "data:text/csv;charset=utf-8," +
            "Tên lớp,Mã lớp,Khóa học,Mô tả\n" +
            "CNTT K47,CNTT47,2024,Lớp Công nghệ thông tin khóa 47\n" +
            "KTPM K46,KTPM46,2023,Lớp Kỹ thuật phần mềm khóa 46";

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_classes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async exportClasses() {
        try {
            // Simulate export process
            const exportBtn = this.elements.exportBtn;
            const originalHTML = exportBtn.innerHTML;
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            exportBtn.disabled = true;

            await this.delay(1000);

            // Create CSV content
            const headers = ['Tên lớp', 'Mã lớp', 'Khóa học', 'Trạng thái', 'Số sinh viên', 'Có khuôn mặt', 'Mô tả'];
            const csvRows = [
                headers.join(','),
                ...this.classes.map(cls => [
                    `"${cls.name}"`,
                    `"${cls.code}"`,
                    cls.year,
                    cls.status === 'active' ? 'Hoạt động' : 'Tạm dừng',
                    cls.studentCount,
                    cls.studentsWithFace,
                    `"${cls.description || ''}"`
                ].join(','))
            ];

            const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `classes_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showSuccess('Xuất dữ liệu thành công!');

        } catch (error) {
            console.error('Export error:', error);
            this.showError('Có lỗi xảy ra khi xuất dữ liệu');
        } finally {
            this.elements.exportBtn.innerHTML = '<i class="fas fa-file-export"></i>';
            this.elements.exportBtn.disabled = false;
        }
    }

    // Utility Functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearFormErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.textContent = '';
        });
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles if not exist
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 1rem 1.5rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    z-index: 10000;
                    min-width: 300px;
                    border-left: 4px solid;
                    animation: slideInRight 0.3s ease-out;
                }
                .notification.success {
                    border-color: #10b981;
                    color: #065f46;
                }
                .notification.error {
                    border-color: #ef4444;
                    color: #991b1b;
                }
                .notification-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0.25rem;
                    margin-left: auto;
                    opacity: 0.7;
                }
                .notification-close:hover {
                    opacity: 1;
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add to document
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        const timeout = setTimeout(() => {
            notification.remove();
        }, 5000);

        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timeout);
            notification.remove();
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ClassManager();
});