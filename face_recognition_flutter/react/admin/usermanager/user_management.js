class UserManager {
    constructor() {
        this.users = [];
        this.currentDeleteItem = null;
        this.elements = {
            adminCount: document.getElementById('admin-count'),
            teacherCount: document.getElementById('teacher-count'),
            studentCount: document.getElementById('student-count'),
            searchUsers: document.getElementById('search-users'),
            //statusFilter: document.getElementById('status-filter'),
            //faceFilter: document.getElementById('face-filter'),
            usersLoading: document.getElementById('users-loading'),
            usersEmpty: document.getElementById('users-empty'),
            userTable: document.getElementById('user-table'),
            userTableBody: document.getElementById('user-table-body'),
            addUserModal: document.getElementById('add-user-modal'),
            deleteUserModal: document.getElementById('delete-user-modal'),
            deleteUserMessage: document.getElementById('delete-user-message'),
            userFullname: document.getElementById('user-fullname'),
            userUsername: document.getElementById('user-username'),
            userEmail: document.getElementById('user-email'),
            userRole: document.getElementById('user-role'),
            userPassword: document.getElementById('user-password'),
            userStatus: document.getElementById('user-status')
        };

        this.init();
    }

    init() {
        // Initialize event listeners
        this.elements.searchUsers.addEventListener('input', () => this.fetchUsers());
        // this.elements.statusFilter.addEventListener('change', () => this.fetchUsers());
        // this.elements.faceFilter.addEventListener('change', () => this.fetchUsers());

        // Fetch users on page load
        this.fetchUsers();
    }

    async fetchUsers() {
        try {
            this.elements.usersLoading.style.display = 'block';
            this.elements.usersEmpty.style.display = 'none';
            this.elements.userTable.style.display = 'none';

            const filters = {
                search: this.elements.searchUsers.value,
                // status: this.elements.statusFilter.value,
                // face_trained: this.elements.faceFilter.value
            };

            // Gọi API qua apiService
            const res = await apiService.getAllUsers(filters);
            if (!res || !res.success) {
                throw new Error(res.error || 'Failed to fetch users');
            }
            console.log('Fetched users:', res.data);
            const users = res.data.users || [];
            this.users = users;

            // Update stats
            this.elements.adminCount.textContent = users.filter(u => u.role === 'admin').length;
            this.elements.teacherCount.textContent = users.filter(u => u.role === 'teacher').length;
            this.elements.studentCount.textContent = users.filter(u => u.role === 'student').length;

            // Render users
            this.renderUserList();

            // Show appropriate state
            if (users.length === 0) {
                this.elements.usersEmpty.style.display = 'block';
            } else {
                this.elements.userTable.style.display = 'table';
            }
        } catch (error) {
            console.error('Fetch users error:', error);
            alert('Lỗi: Không thể tải danh sách người dùng');
        } finally {
            this.elements.usersLoading.style.display = 'none';
        }
    }


    renderUserList() {
        this.elements.userTableBody.innerHTML = '';
        this.users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.full_name}</td>
                <td>${user.username}</td>
                <td>${user.email || '-'}</td>
                <td>${user.role === 'admin' ? 'Quản trị viên' : user.role === 'teacher' ? 'Giáo viên' : 'Sinh viên'}</td>
                <td>
                    <span class="status-badge ${user.is_active ? 'active' : 'inactive'}">
                        ${user.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.face_trained ? 'active' : 'inactive'}">
                        ${user.face_trained ? 'Đã huấn luyện' : 'Chưa huấn luyện'}
                    </span>
                </td>
                <td>${new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                <td class="actions">
                    <button class="action-btn" onclick="userManager.editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn danger" onclick="userManager.removeUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            this.elements.userTableBody.appendChild(tr);
        });
    }

    async editUser(userId) {
        // Implement edit user functionality (open modal with pre-filled data)
        alert('Chức năng chỉnh sửa người dùng chưa được triển khai!');
    }

    async removeUser(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) {
                console.error('User not found');
                alert('Người dùng không tồn tại!');
                return;
            }

            this.currentDeleteItem = {
                type: 'user',
                id: userId,
                name: user.full_name
            };

            this.elements.deleteUserMessage.textContent =
                `Bạn có chắc chắn muốn xóa người dùng "${user.full_name}" không?`;

            this.elements.deleteUserModal.classList.add('active');
        } catch (error) {
            console.error('Setup remove user error:', error);
            alert('Đã xảy ra lỗi khi chuẩn bị xóa người dùng!');
        }
    }

    async confirmDeleteUser() {
        try {
            const { id } = this.currentDeleteItem;

            const response = await fetch(`/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete user');
            }

            this.users = this.users.filter(u => u.id !== id);
            this.renderUserList();
            this.elements.deleteUserModal.classList.remove('active');
            this.currentDeleteItem = null;

            // Update stats
            this.elements.adminCount.textContent = this.users.filter(u => u.role === 'admin').length;
            this.elements.teacherCount.textContent = this.users.filter(u => u.role === 'teacher').length;
            this.elements.studentCount.textContent = this.users.filter(u => u.role === 'student').length;

            alert('Người dùng đã được xóa thành công!');
        } catch (error) {
            console.error('Delete user error:', error);
            alert(`Lỗi: ${error.message}`);
        }
    }

    async saveUser() {
        try {
            const user = {
                full_name: this.elements.userFullname.value.trim(),
                username: this.elements.userUsername.value.trim(),
                email: this.elements.userEmail.value.trim(),
                role: this.elements.userRole.value,
                password: this.elements.userPassword.value,
                is_active: this.elements.userStatus.value === 'true',
                // Nếu có thêm fields student_id, class_name thì lấy ở đây
                student_id: this.elements.userStudentId ? this.elements.userStudentId.value.trim() : undefined,
                class_name: this.elements.userClassName ? this.elements.userClassName.value.trim() : undefined,
            };

            if (!user.full_name || !user.username || !user.role || !user.password) {
                alert('Vui lòng điền đầy đủ các trường bắt buộc!');
                return;
            }

            const response = await apiService.createUser(user);

            this.elements.addUserModal.classList.remove('active');
            this.elements.userFullname.value = '';
            this.elements.userUsername.value = '';
            this.elements.userEmail.value = '';
            this.elements.userRole.value = '';
            this.elements.userPassword.value = '';
            this.elements.userStatus.value = 'true';

            // Nếu có form student_id và class_name cũng reset
            if (this.elements.userStudentId) this.elements.userStudentId.value = '';
            if (this.elements.userClassName) this.elements.userClassName.value = '';

            await this.fetchUsers(); // load lại danh sách sau khi thêm thành công
            alert('Người dùng đã được thêm thành công!');

        } catch (error) {
            console.error('Create user error:', error);
            alert(`Lỗi: ${error.message || error}`);
        }
    }

    setView(view) {
        const grid = this.elements.userTable.parentElement;
        grid.classList.remove('list-view', 'grid-view');
        grid.classList.add(`${view}-view`);
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.view-btn[onclick="setView('${view}')"]`).classList.add('active');
    }

    clearSearch() {
        this.elements.searchUsers.value = '';
        this.fetchUsers();
    }

    resetFilters() {
        this.elements.searchUsers.value = '';
        // this.elements.statusFilter.value = '';
        // this.elements.faceFilter.value = '';
        this.fetchUsers();
    }

    openAddUserModal() {
        this.elements.addUserModal.classList.add('active');
    }

    closeAddUserModal() {
        this.elements.addUserModal.classList.remove('active');
    }

    closeDeleteUserModal() {
        this.elements.deleteUserModal.classList.remove('active');
        this.currentDeleteItem = null;
    }
}

const userManager = new UserManager();

// Global functions for HTML onclick events
function openAddUserModal() {
    userManager.openAddUserModal();
}

function closeAddUserModal() {
    userManager.closeAddUserModal();
}

function closeDeleteUserModal() {
    userManager.closeDeleteUserModal();
}

function saveUser() {
    userManager.saveUser();
}

function confirmDeleteUser() {
    userManager.confirmDeleteUser();
}

function setView(view) {
    userManager.setView(view);
}

function clearSearch() {
    userManager.clearSearch();
}

function resetFilters() {
    userManager.resetFilters();
}

function exportUsers() {
    alert('Chức năng xuất danh sách chưa được triển khai!');
}