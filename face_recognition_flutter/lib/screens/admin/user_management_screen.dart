// lib/screens/user_management_screen.dart
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';

// TODO: Import các file cần thiết
// import 'package:face_attendance_app/services/api_service.dart';
// import 'package:face_attendance_app/utils/constants.dart';

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  final Logger _logger = Logger();
  late Future<List<User>> _usersFuture;
  List<User> _users = [];
  final _formKey = GlobalKey<FormState>();

  // Controllers for the add/edit user dialog
  final _usernameController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _studentIdController = TextEditingController();
  final _classNameController = TextEditingController();
  UserRole _selectedRole = UserRole.student;

  @override
  void initState() {
    super.initState();
    _usersFuture = _fetchUsers();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _fullNameController.dispose();
    _emailController.dispose();
    _studentIdController.dispose();
    _classNameController.dispose();
    super.dispose();
  }

  /// TODO: Viết phương thức gọi API để lấy danh sách người dùng
  Future<List<User>> _fetchUsers() async {
    // try {
    //   final users = await ApiService().getUsers();
    //   return users;
    // } catch (e) {
    //   _logger.e('Error fetching users: $e');
    //   throw Exception('Failed to load users');
    // }

    // Dữ liệu giả lập cho mục đích demo
    await Future.delayed(const Duration(seconds: 1));
    return [
      User(
        id: 1,
        username: 'vana',
        fullName: 'Nguyễn Văn A',
        email: 'vana@example.com',
        role: UserRole.student,
        studentId: 'SV001',
        className: 'CNTT K19',
        isActive: true,
        faceTrained: true,
        createdAt: DateTime.now(),
      ),
      User(
        id: 2,
        username: 'thib',
        fullName: 'Trần Thị B',
        email: 'thib@example.com',
        role: UserRole.student,
        studentId: 'SV002',
        className: 'CNTT K19',
        isActive: true,
        faceTrained: false,
        createdAt: DateTime.now(),
      ),
      User(
        id: 3,
        username: 'vanc',
        fullName: 'Lê Văn C',
        email: 'vanc@example.com',
        role: UserRole.teacher,
        isActive: true,
        faceTrained: true,
        createdAt: DateTime.now(),
      ),
      User(
        id: 4,
        username: 'thid',
        fullName: 'Phạm Thị D',
        email: 'thid@example.com',
        role: UserRole.admin,
        isActive: true,
        faceTrained: true,
        createdAt: DateTime.now(),
      ),
    ];
  }

  /// Phương thức xử lý khi người dùng ấn nút thêm
  void _addUser() {
    // Clear all controllers before opening the dialog
    _usernameController.clear();
    _fullNameController.clear();
    _emailController.clear();
    _studentIdController.clear();
    _classNameController.clear();
    _selectedRole = UserRole.student;
    _showAddEditUserDialog();
  }

  /// Phương thức xử lý khi người dùng ấn nút sửa
  void _editUser(User user) {
    _usernameController.text = user.username;
    _fullNameController.text = user.fullName;
    _emailController.text = user.email;
    _studentIdController.text = user.studentId ?? '';
    _classNameController.text = user.className ?? '';
    _selectedRole = user.role;
    _showAddEditUserDialog(user: user);
  }

  /// Phương thức xử lý khi người dùng ấn nút xóa
  void _deleteUser(int userId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: const Text('Bạn có chắc chắn muốn xóa người dùng này không?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      // TODO: Gọi API xóa người dùng
      // try {
      //   await ApiService().deleteUser(userId);
      //   _logger.i('User deleted successfully: $userId');
      //   _refreshUsers();
      // } catch (e) {
      //   _logger.e('Error deleting user: $e');
      // }
      _logger.i('User deleted: $userId (simulated)');
      _refreshUsers();
    }
  }

  /// Phương thức hiển thị dialog thêm/sửa người dùng
  void _showAddEditUserDialog({User? user}) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(user == null ? 'Thêm người dùng mới' : 'Sửa người dùng'),
          content: SingleChildScrollView(
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: _usernameController,
                    decoration: const InputDecoration(labelText: 'Tên đăng nhập'),
                    validator: (value) => value!.isEmpty ? 'Tên đăng nhập không được để trống' : null,
                  ),
                  TextFormField(
                    controller: _fullNameController,
                    decoration: const InputDecoration(labelText: 'Họ và tên'),
                    validator: (value) => value!.isEmpty ? 'Họ và tên không được để trống' : null,
                  ),
                  TextFormField(
                    controller: _emailController,
                    decoration: const InputDecoration(labelText: 'Email'),
                    validator: (value) => value!.isEmpty ? 'Email không được để trống' : null,
                  ),
                  DropdownButtonFormField<UserRole>(
                    value: _selectedRole,
                    decoration: const InputDecoration(labelText: 'Vai trò'),
                    items: UserRole.values
                        .map((role) => DropdownMenuItem(
                              value: role,
                              child: Text(role.displayName),
                            ))
                        .toList(),
                    onChanged: (UserRole? newValue) {
                      if (newValue != null) {
                        setState(() {
                          _selectedRole = newValue;
                        });
                      }
                    },
                  ),
                  // Hiển thị các trường bổ sung nếu vai trò là sinh viên
                  if (_selectedRole == UserRole.student) ...[
                    TextFormField(
                      controller: _studentIdController,
                      decoration: const InputDecoration(labelText: 'Mã số sinh viên'),
                    ),
                    TextFormField(
                      controller: _classNameController,
                      decoration: const InputDecoration(labelText: 'Lớp'),
                    ),
                  ],
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Hủy'),
            ),
            TextButton(
              onPressed: () async {
                if (_formKey.currentState!.validate()) {
                  // Tạo đối tượng User mới từ dữ liệu form
                  final newUser = User(
                    id: user?.id ?? 0,
                    username: _usernameController.text,
                    fullName: _fullNameController.text,
                    email: _emailController.text,
                    role: _selectedRole,
                    studentId: _selectedRole == UserRole.student ? _studentIdController.text : null,
                    className: _selectedRole == UserRole.student ? _classNameController.text : null,
                    isActive: user?.isActive ?? true,
                    faceTrained: user?.faceTrained ?? false,
                    createdAt: user?.createdAt ?? DateTime.now(),
                  );

                  // TODO: Gọi API thêm hoặc sửa người dùng
                  if (user == null) {
                    _logger.i('Adding new user: ${newUser.toJson()}');
                    // try {
                    //   await ApiService().addUser(newUser);
                    // } catch (e) { _logger.e('Error adding user: $e'); }
                    _logger.i('New user added (simulated)');
                  } else {
                    _logger.i('Editing user ID: ${user.id} with data: ${newUser.toJson()}');
                    // try {
                    //   await ApiService().updateUser(user.id, newUser);
                    // } catch (e) { _logger.e('Error updating user: $e'); }
                    _logger.i('User ID ${user.id} updated (simulated)');
                  }

                  _refreshUsers();
                  Navigator.of(context).pop();
                }
              },
              child: const Text('Lưu'),
            ),
          ],
        );
      },
    );
  }

  /// Phương thức làm mới danh sách người dùng
  void _refreshUsers() {
    setState(() {
      _usersFuture = _fetchUsers();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quản lý người dùng'),
        backgroundColor: Colors.blueAccent,
      ),
      body: FutureBuilder<List<User>>(
        future: _usersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Lỗi: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            _users = snapshot.data!;
            if (_users.isEmpty) {
              return const Center(child: Text('Chưa có người dùng nào.'));
            }
            return ListView.builder(
              itemCount: _users.length,
              itemBuilder: (context, index) {
                final user = _users[index];
                return ListTile(
                  leading: CircleAvatar(
                    child: Text(user.fullName[0]),
                  ),
                  title: Text(user.fullName),
                  subtitle: Text(user.email),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildRoleChip(user.role),
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.blue),
                        onPressed: () => _editUser(user),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => _deleteUser(user.id),
                      ),
                    ],
                  ),
                );
              },
            );
          } else {
            return const Center(child: Text('Chưa có người dùng nào.'));
          }
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addUser,
        backgroundColor: Colors.blueAccent,
        child: const Icon(Icons.add),
      ),
    );
  }

  /// Widget để hiển thị vai trò người dùng dưới dạng Chip
  Widget _buildRoleChip(UserRole role) {
    Color color;
    switch (role) {
      case UserRole.student:
        color = Colors.green;
        break;
      case UserRole.teacher:
        color = Colors.orange;
        break;
      case UserRole.admin:
        color = Colors.red;
        break;
    }
    return Chip(
      label: Text(
        role.displayName,
        style: const TextStyle(color: Colors.white, fontSize: 12),
      ),
      backgroundColor: color,
    );
  }
}

// User model and UserRole enum
//
// Đây là các lớp model và enum mới được cung cấp để định nghĩa cấu trúc dữ liệu người dùng.
// Chúng đã được tích hợp vào logic của màn hình.
//

enum UserRole {
  student,
  teacher,
  admin;

  static UserRole fromString(String role) {
    switch (role.toLowerCase()) {
      case 'student':
        return UserRole.student;
      case 'teacher':
        return UserRole.teacher;
      case 'admin':
        return UserRole.admin;
      default:
        return UserRole.student;
    }
  }

  @override
  String toString() {
    return name;
  }

  String get displayName {
    switch (this) {
      case UserRole.student:
        return 'Sinh viên';
      case UserRole.teacher:
        return 'Giáo viên';
      case UserRole.admin:
        return 'Quản trị viên';
    }
  }
}

class User {
  final int id;
  final String username;
  final String fullName;
  final String email;
  final UserRole role;
  final String? studentId;
  final String? className;
  final bool isActive;
  final bool faceTrained;
  final DateTime createdAt;

  User({
    required this.id,
    required this.username,
    required this.fullName,
    required this.email,
    required this.role,
    this.studentId,
    this.className,
    required this.isActive,
    required this.faceTrained,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      fullName: json['full_name'] ?? '',
      email: json['email'] ?? '',
      role: UserRole.fromString(json['role'] ?? 'student'),
      studentId: json['student_id'],
      className: json['class_name'],
      isActive: json['is_active'] ?? true,
      faceTrained: json['face_trained'] ?? false,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'full_name': fullName,
      'email': email,
      'role': role.toString(),
      'student_id': studentId,
      'class_name': className,
      'is_active': isActive,
      'face_trained': faceTrained,
      'created_at': createdAt.toIso8601String(),
    };
  }

  User copyWith({
    int? id,
    String? username,
    String? fullName,
    String? email,
    UserRole? role,
    String? studentId,
    String? className,
    bool? isActive,
    bool? faceTrained,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      role: role ?? this.role,
      studentId: studentId ?? this.studentId,
      className: className ?? this.className,
      isActive: isActive ?? this.isActive,
      faceTrained: faceTrained ?? this.faceTrained,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
