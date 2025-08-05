// lib/screens/user_management_screen.dart
import 'package:face_attendance/models/api_response.dart';
import 'package:face_attendance/services/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:logger/logger.dart';
// ignore: unused_import
import 'package:http/http.dart' as http;
import 'dart:io';
import 'dart:convert';
import 'dart:async';
import '../../models/user.dart';

import 'package:face_attendance/utils/logout_helper.dart';

import 'package:face_attendance/services/api_service.dart';
// ignore: unused_import
import 'package:face_attendance/utils/constants.dart';

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  final Logger _logger = Logger();
  late Future<ApiResponse<Map<String, dynamic>>> _usersFuture;
  List<User> _users = [];
  List<User> _filteredUsers = [];
  final _formKey = GlobalKey<FormState>();
  final _searchController = TextEditingController();
  final _apiService = ApiService();

  // Controllers for the add/edit user dialog
  final _usernameController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _studentIdController = TextEditingController();
  final _classNameController = TextEditingController();
  UserRole _selectedRole = UserRole.student;

  // Camera-related variables
  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  // bool _isRecording = false;
  // final List<String> _capturedImages = [];
  // final int _requiredImages = 8; // Số lượng ảnh cần chụp
  // Timer? _captureTimer;
  // bool _isTakingPicture = false;

  bool _isRecording = false;
  // ignore: unused_field
  String? _videoPath;
  final int _recordingDuration = 5; // 5 giây

  // Filter variables
  UserRole? _filterRole;
  bool? _filterFaceTrained;

  @override
  void initState() {
    super.initState();
    _usersFuture = _fetchUsers();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _fullNameController.dispose();
    _emailController.dispose();
    _studentIdController.dispose();
    _classNameController.dispose();
    _searchController.dispose();
    _cameraController?.dispose();
    super.dispose();
  }

  /// Fetch users using the correct API endpoint
  Future<ApiResponse<Map<String, dynamic>>> _fetchUsers() async {
    try {
      final response = await ApiService().getAllUsers();
      if (response.success && response.data != null) {
        // Convert List<User> to List<Map<String, dynamic>> for compatibility
        final users = response.data as List<User>;
        final usersJson = users.map((u) => u.toJson()).toList();
        return ApiResponse.success({'users': usersJson});
      } else {
        _logger.e('Failed to fetch users: ${response.message}');
        throw Exception(response.message);
      }
    } catch (e) {
      _logger.e('Error fetching users: $e');
      throw Exception('Failed to load users');
    }
  }

  /// Xử lý khi text search thay đổi
  void _onSearchChanged() {
    Timer(const Duration(milliseconds: 300), () {
      if (mounted) {
        _filterUsers();
      }
    });
  }

  /// Phương thức lọc người dùng
  void _filterUsers() {
    final query = _searchController.text.toLowerCase();
    final filteredList = _users.where((user) {
      final matchesSearch = user.fullName.toLowerCase().contains(query) ||
          user.email.toLowerCase().contains(query) ||
          user.username.toLowerCase().contains(query) ||
          (user.studentId?.toLowerCase().contains(query) ?? false);

      final matchesRole = _filterRole == null || user.role == _filterRole;
      final matchesFaceTrained =
          _filterFaceTrained == null || user.faceTrained == _filterFaceTrained;

      return matchesSearch && matchesRole && matchesFaceTrained;
    }).toList();

    if (mounted) {
      setState(() {
        _filteredUsers = filteredList;
      });
    }
  }

  /// Cập nhật danh sách người dùng sau khi fetch thành công
  void _updateUsersList(List<User> users) {
    _users = users;
    _filterUsers();
  }

  /// Khởi tạo camera
  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        _logger.e('No cameras available');
        _showSnackBar(
            'Không có camera nào khả dụng trên thiết bị.', Colors.red);
        return;
      }

      final camera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        camera,
        ResolutionPreset.medium,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _cameraController!.initialize();

      if (mounted) {
        setState(() {
          _isCameraInitialized = true;
        });
      }
    } catch (e) {
      _logger.e('Error initializing camera: $e');
      _showSnackBar('Không thể khởi tạo camera: $e', Colors.red);
    }
  }

  // /// Tự động chụp ảnh
  // void _startAutomaticCapture(User user) async {
  //   if (!_isCameraInitialized || _cameraController == null) {
  //     return;
  //   }

  //   setState(() {
  //     _isRecording = true;
  //     _capturedImages.clear();
  //   });

  //   _captureTimer =
  //       Timer.periodic(const Duration(milliseconds: 1000), (timer) async {
  //     if (_capturedImages.length >= _requiredImages) {
  //       timer.cancel();
  //       setState(() {
  //         _isRecording = false;
  //       });
  //       await _submitFaceData(user);
  //       return;
  //     }

  //     if (_isTakingPicture) return;

  //     _isTakingPicture = true;

  //     try {
  //       final XFile image = await _cameraController!.takePicture();
  //       final File imageFile = File(image.path);
  //       final bytes = await imageFile.readAsBytes();
  //       final base64Image = base64Encode(bytes);

  //       if (mounted) {
  //         setState(() {
  //           _capturedImages.add(base64Image);
  //         });
  //       }

  //       _logger.i('Captured image ${_capturedImages.length}/$_requiredImages');
  //     } catch (e) {
  //       _logger.e('Error capturing image: $e');
  //       timer.cancel();
  //       if (mounted) {
  //         setState(() {
  //           _isRecording = false;
  //         });
  //       }
  //       _showSnackBar('Lỗi khi chụp ảnh: $e', Colors.red);
  //     } finally {
  //       _isTakingPicture = false;
  //     }
  //   });
  // }

  void _startVideoRecording(User user) async {
    if (!_isCameraInitialized || _cameraController == null) {
      return;
    }

    setState(() {
      _isRecording = true;
    });

    try {
      // Bắt đầu quay video
      await _cameraController!.startVideoRecording();

      // Dừng sau 5 giây
      Timer(Duration(seconds: _recordingDuration), () async {
        if (_isRecording) {
          final videoFile = await _cameraController!.stopVideoRecording();
          setState(() {
            _isRecording = false;
            _videoPath = videoFile.path;
          });
          await _submitVideoData(user, File(videoFile.path));
        }
      });
    } catch (e) {
      _logger.e('Error recording video: $e');
      setState(() {
        _isRecording = false;
      });
      _showSnackBar('Lỗi khi quay video: $e', Colors.red);
    }
  }

  // /// Gửi dữ liệu khuôn mặt - Sử dụng uploadVideo thay vì registerFace deprecated
  // Future<void> _submitFaceData(User user) async {
  //   if (_capturedImages.isEmpty) {
  //     _showSnackBar('Chưa có ảnh nào được chụp', Colors.orange);
  //     return;
  //   }

  //   try {
  //     _showLoadingDialog('Đang xử lý dữ liệu khuôn mặt...');

  //     // Sử dụng registerFace (deprecated method) vì chưa có uploadVideo endpoint sẵn sàng
  //     final response = await ApiService().registerFace(
  //       userId: user.id,
  //       images: _capturedImages,
  //     );

  //     Navigator.of(context).pop(); // Đóng loading dialog

  //     if (response.success) {
  //       _logger.i('Face data submitted successfully: ${response.data}');
  //       _showSnackBar('Đăng ký khuôn mặt thành công!', Colors.green);

  //       // Cập nhật trạng thái user
  //       setState(() {
  //         final index = _users.indexWhere((u) => u.id == user.id);
  //         if (index != -1) {
  //           _users[index] = _users[index].copyWith(faceTrained: true);
  //           _filterUsers();
  //         }
  //       });

  //       Navigator.of(context).pop(); // Đóng dialog chụp ảnh
  //     } else {
  //       _logger.e('Error submitting face data: ${response.message}');
  //       _showSnackBar('Lỗi: ${response.message}', Colors.red);
  //     }
  //   } catch (e) {
  //     Navigator.of(context).pop();
  //     _logger.e('Network error: $e');
  //     _showSnackBar('Lỗi mạng: Không thể kết nối đến server', Colors.red);
  //   } finally {
  //     setState(() {
  //       _capturedImages.clear();
  //     });
  //   }
  // }

  Future<void> _submitVideoData(User user, File videoFile) async {
    try {
      _showLoadingDialog('Đang xử lý video khuôn mặt...');

      // Lấy token
      final token = AuthService().currentToken;
      if (token == null) {
        throw Exception('Không có token xác thực');
      }
      _logger.i('Submitting video for user: ${user.id}');

      // Gửi video đến server
      final response = await _apiService.uploadFaceVideo(
        token: token,
        videoFile: videoFile,
        userId: user.id,
      );

      Navigator.of(context).pop(); // Đóng loading dialog

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _logger.i('Video uploaded successfully: ${data['message']}');
        _showSnackBar('Đăng ký khuôn mặt thành công!', Colors.green);

        // Cập nhật trạng thái user
        setState(() {
          final index = _users.indexWhere((u) => u.id == user.id);
          if (index != -1) {
            _users[index] = _users[index].copyWith(faceTrained: true);
            _filterUsers();
          }
        });

        Navigator.of(context).pop(); // Đóng dialog
      } else {
        _logger.e('Error uploading video: ${response.body}');
        _showSnackBar('Lỗi: ${response.reasonPhrase}', Colors.red);
      }
    } catch (e) {
      Navigator.of(context).pop();
      _logger.e('Network error: $e');
      _showSnackBar('Lỗi mạng: Không thể kết nối đến server', Colors.red);
    }
  }

  /// Hiển thị dialog chụp ảnh khuôn mặt với responsive design
  void _showFaceRegistrationDialog(User user) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        child: Container(
          constraints: const BoxConstraints(
            maxWidth: 400,
            maxHeight: 600,
          ),
          child: StatefulBuilder(
            builder: (context, setDialogState) => Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Đăng ký khuôn mặt',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    user.fullName,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Quay video: ${_isRecording ? 'Đang quay...' : 'Sẵn sàng'}',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Hướng dẫn: Giữ khuôn mặt trong khung và nhấn quay video',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  if (!_isCameraInitialized)
                    const SizedBox(
                      height: 200,
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else
                    Container(
                      height: 200,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[300]!, width: 2),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: CameraPreview(_cameraController!),
                      ),
                    ),
                  const SizedBox(height: 16),
                  if (_isRecording)
                    Column(
                      children: [
                        const LinearProgressIndicator(),
                        const SizedBox(height: 8),
                        Text('Đang quay video... ($_recordingDuration giây)'),
                      ],
                    ),
                  const SizedBox(height: 16),
                  if (!_isRecording && _isCameraInitialized)
                    ElevatedButton.icon(
                      onPressed: () => _startVideoRecording(user),
                      icon: const Icon(Icons.videocam),
                      label: const Text('Bắt đầu quay video'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 12),
                      ),
                    )
                  else if (_isRecording)
                    Column(
                      children: [
                        const CircularProgressIndicator(),
                        const SizedBox(height: 8),
                        const Text(
                          'Đang quay video...',
                          style: TextStyle(
                              color: Colors.orange,
                              fontWeight: FontWeight.bold),
                        ),
                        TextButton(
                          onPressed: () async {
                            if (_cameraController!.value.isRecordingVideo) {
                              await _cameraController!.stopVideoRecording();
                            }
                            setState(() {
                              _isRecording = false;
                            });
                          },
                          child: const Text('Dừng quay'),
                        ),
                      ],
                    ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: _isRecording
                            ? null
                            : () {
                                Navigator.of(context).pop();
                              },
                        child: const Text('Đóng'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// Phương thức xử lý khi người dùng ấn nút thêm
  void _addUser() {
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
        title: const Row(
          children: [
            Icon(Icons.warning, color: Colors.red),
            SizedBox(width: 8),
            Flexible(child: Text('Xác nhận xóa')),
          ],
        ),
        content: const Text(
            'Bạn có chắc chắn muốn xóa người dùng này không?\nHành động này không thể hoàn tác.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        _showLoadingDialog('Đang xóa người dùng...');

        final response = await ApiService().deleteUser(userId);

        Navigator.of(context).pop(); // Đóng loading dialog

        if (response.success) {
          _logger.i('User deleted successfully: $userId');
          _showSnackBar('Đã xóa người dùng thành công', Colors.green);
          _refreshUsers();
        } else {
          _logger.e('Failed to delete user: ${response.message}');
          _showSnackBar('Lỗi: ${response.message}', Colors.red);
        }
      } catch (e) {
        Navigator.of(context).pop();
        _logger.e('Error deleting user: $e');
        _showSnackBar('Lỗi: Không thể xóa người dùng', Colors.red);
      }
    }
  }

  /// Phương thức hiển thị dialog thêm/sửa người dùng với responsive design
  void _showAddEditUserDialog({User? user}) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: Container(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.9,
            maxHeight: MediaQuery.of(context).size.height * 0.8,
          ),
          child: StatefulBuilder(
            builder: (context, setDialogState) => Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Icon(user == null ? Icons.person_add : Icons.edit,
                          color: Colors.blue),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          user == null
                              ? 'Thêm người dùng mới'
                              : 'Sửa người dùng',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Flexible(
                    child: SingleChildScrollView(
                      child: Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            TextFormField(
                              controller: _usernameController,
                              decoration: const InputDecoration(
                                labelText: 'Tên đăng nhập',
                                prefixIcon: Icon(Icons.account_circle),
                                border: OutlineInputBorder(),
                              ),
                              validator: (value) => value!.isEmpty
                                  ? 'Tên đăng nhập không được để trống'
                                  : null,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _fullNameController,
                              decoration: const InputDecoration(
                                labelText: 'Họ và tên',
                                prefixIcon: Icon(Icons.person),
                                border: OutlineInputBorder(),
                              ),
                              validator: (value) => value!.isEmpty
                                  ? 'Họ và tên không được để trống'
                                  : null,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(
                                labelText: 'Email',
                                prefixIcon: Icon(Icons.email),
                                border: OutlineInputBorder(),
                              ),
                              validator: (value) {
                                if (value!.isEmpty) {
                                  return 'Email không được để trống';
                                }
                                if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                                    .hasMatch(value)) {
                                  return 'Email không hợp lệ';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            DropdownButtonFormField<UserRole>(
                              value: _selectedRole,
                              decoration: const InputDecoration(
                                labelText: 'Vai trò',
                                prefixIcon: Icon(Icons.badge),
                                border: OutlineInputBorder(),
                              ),
                              items: UserRole.values
                                  .map((role) => DropdownMenuItem(
                                        value: role,
                                        child: Text(role.displayName),
                                      ))
                                  .toList(),
                              onChanged: (UserRole? newValue) {
                                if (newValue != null) {
                                  setDialogState(() {
                                    _selectedRole = newValue;
                                  });
                                }
                              },
                            ),
                            if (_selectedRole == UserRole.student) ...[
                              const SizedBox(height: 16),
                              TextFormField(
                                controller: _studentIdController,
                                decoration: const InputDecoration(
                                  labelText: 'Mã số sinh viên',
                                  prefixIcon: Icon(Icons.numbers),
                                  border: OutlineInputBorder(),
                                ),
                                validator: _selectedRole == UserRole.student
                                    ? (value) => value!.isEmpty
                                        ? 'Mã số sinh viên không được để trống'
                                        : null
                                    : null,
                              ),
                              const SizedBox(height: 16),
                              TextFormField(
                                controller: _classNameController,
                                decoration: const InputDecoration(
                                  labelText: 'Lớp',
                                  prefixIcon: Icon(Icons.class_),
                                  border: OutlineInputBorder(),
                                ),
                                validator: _selectedRole == UserRole.student
                                    ? (value) => value!.isEmpty
                                        ? 'Lớp không được để trống'
                                        : null
                                    : null,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('Hủy'),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () async {
                          if (_formKey.currentState!.validate()) {
                            final newUser = User(
                              id: user?.id ?? 0,
                              username: _usernameController.text.trim(),
                              fullName: _fullNameController.text.trim(),
                              email: _emailController.text.trim(),
                              role: _selectedRole,
                              studentId: _selectedRole == UserRole.student
                                  ? _studentIdController.text.trim()
                                  : null,
                              className: _selectedRole == UserRole.student
                                  ? _classNameController.text.trim()
                                  : null,
                              isActive: user?.isActive ?? true,
                              faceTrained: user?.faceTrained ?? false,
                              createdAt: user?.createdAt ?? DateTime.now(),
                            );

                            try {
                              _showLoadingDialog(user == null
                                  ? 'Đang thêm người dùng...'
                                  : 'Đang cập nhật người dùng...');

                              ApiResponse response;
                              if (user == null) {
                                response = await ApiService()
                                    .createUser(newUser.toJson());
                                _logger.i(': ${newUser.toJson()}');
                              } else {
                                response = await ApiService()
                                    .updateUser(user.id, newUser.toJson());
                                _logger.i('Updating user ID: ${user.id}');
                              }

                              Navigator.of(context)
                                  .pop(); // Đóng loading dialog

                              if (response.success) {
                                _showSnackBar(
                                    user == null
                                        ? 'Đã thêm người dùng mới thành công'
                                        : 'Đã cập nhật thông tin người dùng thành công',
                                    Colors.green);
                                _refreshUsers();
                                Navigator.of(context).pop(); // Đóng dialog
                              } else {
                                _showSnackBar(
                                    'Lỗi: ${response.message}', Colors.red);
                              }
                            } catch (e) {
                              Navigator.of(context)
                                  .pop(); // Đóng loading dialog
                              _logger.e('Error saving user: $e');
                              _showSnackBar(
                                  'Lỗi: Không thể lưu thông tin người dùng',
                                  Colors.red);
                            }
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Lưu'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// Phương thức làm mới danh sách người dùng
  void _refreshUsers() {
    setState(() {
      _usersFuture = _fetchUsers();
    });
  }

  void _showLoadingDialog(String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(message),
          ],
        ),
      ),
    );
  }

  void _showSnackBar(String message, Color color) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: color,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  /// Widget hiển thị bộ lọc với responsive design
  Widget _buildFilterSection() {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                labelText: 'Tìm kiếm theo tên, email, username, MSSV...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            LayoutBuilder(
              builder: (context, constraints) {
                if (constraints.maxWidth > 600) {
                  // Desktop layout
                  return Row(
                    children: [
                      Expanded(child: _buildRoleFilter()),
                      const SizedBox(width: 16),
                      Expanded(child: _buildFaceTrainedFilter()),
                    ],
                  );
                } else {
                  // Mobile layout
                  return Column(
                    children: [
                      _buildRoleFilter(),
                      const SizedBox(height: 16),
                      _buildFaceTrainedFilter(),
                    ],
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleFilter() {
    return DropdownButtonFormField<UserRole?>(
      value: _filterRole,
      decoration: const InputDecoration(
        labelText: 'Lọc theo vai trò',
        border: OutlineInputBorder(),
      ),
      items: [
        const DropdownMenuItem<UserRole?>(
          value: null,
          child: Text('Tất cả vai trò'),
        ),
        ...UserRole.values.map((role) => DropdownMenuItem(
              value: role,
              child: Text(role.displayName),
            )),
      ],
      onChanged: (value) {
        setState(() {
          _filterRole = value;
        });
        _filterUsers();
      },
    );
  }

  Widget _buildFaceTrainedFilter() {
    return DropdownButtonFormField<bool?>(
      value: _filterFaceTrained,
      decoration: const InputDecoration(
        labelText: 'Trạng thái khuôn mặt',
        border: OutlineInputBorder(),
      ),
      items: const [
        DropdownMenuItem<bool?>(
          value: null,
          child: Text('Tất cả'),
        ),
        DropdownMenuItem<bool?>(
          value: true,
          child: Text('Đã đăng ký'),
        ),
        DropdownMenuItem<bool?>(
          value: false,
          child: Text('Chưa đăng ký'),
        ),
      ],
      onChanged: (value) {
        setState(() {
          _filterFaceTrained = value;
        });
        _filterUsers();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context), // quay lại Dashboard
        ),
        title: const Text('Quản lý người dùng'),
        backgroundColor: Colors.blueAccent,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshUsers,
            tooltip: 'Làm mới danh sách',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => logout(context),
            tooltip: 'Đăng xuất',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterSection(),
          Expanded(
            child: FutureBuilder<ApiResponse<Map<String, dynamic>>>(
              future: _usersFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text('Đang tải danh sách người dùng...'),
                      ],
                    ),
                  );
                } else if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error, size: 64, color: Colors.red),
                        const SizedBox(height: 16),
                        Text('Lỗi: ${snapshot.error}'),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _refreshUsers,
                          child: const Text('Thử lại'),
                        ),
                      ],
                    ),
                  );
                } else if (snapshot.hasData) {
                  final apiResponse = snapshot.data!;
                  if (apiResponse.success && apiResponse.data != null) {
                    final usersData =
                        apiResponse.data!['users'] as List<dynamic>;
                    final users = usersData
                        .map((userData) => User.fromJson(userData))
                        .toList();

                    // Cập nhật danh sách người dùng
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      if (mounted && _users != users) {
                        _updateUsersList(users);
                      }
                    });

                    if (_filteredUsers.isEmpty && _users.isNotEmpty) {
                      return const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.search_off,
                                size: 64, color: Colors.grey),
                            SizedBox(height: 16),
                            Text(
                                'Không tìm thấy người dùng nào phù hợp với bộ lọc.'),
                          ],
                        ),
                      );
                    }

                    if (_users.isEmpty) {
                      return const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.people_outline,
                                size: 64, color: Colors.grey),
                            SizedBox(height: 16),
                            Text('Chưa có người dùng nào trong hệ thống.'),
                          ],
                        ),
                      );
                    }

                    return ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _filteredUsers.length,
                      itemBuilder: (context, index) {
                        final user = _filteredUsers[index];
                        return Card(
                          elevation: 2,
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      backgroundColor: _getRoleColor(user.role),
                                      child: Text(
                                        user.fullName.isNotEmpty
                                            ? user.fullName[0].toUpperCase()
                                            : '?',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            user.fullName,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            user.email,
                                            style: TextStyle(
                                              color: Colors.grey[600],
                                              fontSize: 14,
                                            ),
                                          ),
                                          Text(
                                            'Username: ${user.username}',
                                            style: TextStyle(
                                              color: Colors.grey[600],
                                              fontSize: 14,
                                            ),
                                          ),
                                          if (user.studentId != null)
                                            Text(
                                              'MSSV: ${user.studentId}',
                                              style: TextStyle(
                                                color: Colors.grey[600],
                                                fontSize: 14,
                                              ),
                                            ),
                                          if (user.className != null)
                                            Text(
                                              'Lớp: ${user.className}',
                                              style: TextStyle(
                                                color: Colors.grey[600],
                                                fontSize: 14,
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                // Chips row
                                SingleChildScrollView(
                                  scrollDirection: Axis.horizontal,
                                  child: Row(
                                    children: [
                                      _buildRoleChip(user.role),
                                      const SizedBox(width: 8),
                                      _buildFaceTrainedChip(user.faceTrained),
                                      const SizedBox(width: 8),
                                      _buildActiveChip(user.isActive),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 12),
                                // Action buttons
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    if (user.role == UserRole.student &&
                                        !user.faceTrained)
                                      IconButton(
                                        icon: const Icon(Icons.face,
                                            color: Colors.orange),
                                        tooltip: 'Đăng ký khuôn mặt',
                                        onPressed: () async {
                                          await _initializeCamera();
                                          if (_isCameraInitialized && mounted) {
                                            _showFaceRegistrationDialog(user);
                                          }
                                        },
                                      ),
                                    IconButton(
                                      icon: const Icon(Icons.edit,
                                          color: Colors.blue),
                                      tooltip: 'Chỉnh sửa',
                                      onPressed: () => _editUser(user),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete,
                                          color: Colors.red),
                                      tooltip: 'Xóa',
                                      onPressed: () => _deleteUser(user.id),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  } else {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error, size: 64, color: Colors.red),
                          const SizedBox(height: 16),
                          Text('Lỗi: ${apiResponse.message}'),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _refreshUsers,
                            child: const Text('Thử lại'),
                          ),
                        ],
                      ),
                    );
                  }
                } else {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.people_outline,
                            size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('Chưa có người dùng nào.'),
                      ],
                    ),
                  );
                }
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addUser,
        backgroundColor: Colors.blueAccent,
        icon: const Icon(Icons.add),
        label: const Text('Thêm người dùng'),
      ),
    );
  }

  /// Lấy màu theo vai trò
  Color _getRoleColor(UserRole role) {
    switch (role) {
      case UserRole.student:
        return Colors.green;
      case UserRole.teacher:
        return Colors.orange;
      case UserRole.admin:
        return Colors.red;
    }
  }

  /// Widget để hiển thị vai trò người dùng dưới dạng Chip
  Widget _buildRoleChip(UserRole role) {
    Color color;
    IconData icon;
    switch (role) {
      case UserRole.student:
        color = Colors.green;
        icon = Icons.school;
        break;
      case UserRole.teacher:
        color = Colors.orange;
        icon = Icons.person;
        break;
      case UserRole.admin:
        color = Colors.red;
        icon = Icons.admin_panel_settings;
        break;
    }
    return Chip(
      avatar: Icon(icon, color: Colors.white, size: 16),
      label: Text(
        role.displayName,
        style: const TextStyle(color: Colors.white, fontSize: 12),
      ),
      backgroundColor: color,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  /// Widget để hiển thị trạng thái đăng ký khuôn mặt
  Widget _buildFaceTrainedChip(bool faceTrained) {
    return Chip(
      avatar: Icon(
        faceTrained ? Icons.check_circle : Icons.cancel,
        color: Colors.white,
        size: 16,
      ),
      label: Text(
        faceTrained ? 'Đã đăng ký' : 'Chưa đăng ký',
        style: const TextStyle(color: Colors.white, fontSize: 12),
      ),
      backgroundColor: faceTrained ? Colors.blue : Colors.grey,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  /// Widget để hiển thị trạng thái hoạt động
  Widget _buildActiveChip(bool isActive) {
    return Chip(
      avatar: Icon(
        isActive ? Icons.check : Icons.block,
        color: Colors.white,
        size: 16,
      ),
      label: Text(
        isActive ? 'Hoạt động' : 'Tạm khóa',
        style: const TextStyle(color: Colors.white, fontSize: 12),
      ),
      backgroundColor: isActive ? Colors.green : Colors.red,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }
}
