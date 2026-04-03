import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart'; // Thêm Logger để debug
import '../models/models.dart'; // Import tất cả models, bao gồm User và LoginResponse

class AuthService {
  // Singleton pattern
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  final Logger _logger = Logger(); // Khởi tạo Logger

  User? _currentUser;
  String? _currentToken;

  // Getters
  User? get currentUser => _currentUser;
  String? get currentToken => _currentToken;
  bool get isLoggedIn => _currentUser != null && _currentToken != null;

  // Khởi tạo AuthService, nên gọi một lần khi app khởi động
  Future<void> initialize() async {
    _logger.d('AuthService initializing...');
    await _loadUserData();
    _logger.d('AuthService initialized. Is logged in: $isLoggedIn');
    if (isLoggedIn) {
      _logger.d('Current user role: ${_currentUser?.role.name}');
    }
  }

  // Tải dữ liệu người dùng và token từ bộ nhớ an toàn
  Future<void> _loadUserData() async {
    try {
      final token = await _secureStorage.read(key: _tokenKey);
      final userJson = await _secureStorage.read(key: _userKey);

      if (token != null && userJson != null) {
        _currentToken = token;
        _currentUser = User.fromJson(jsonDecode(userJson));
        _logger.d('User data loaded from secure storage.');
      } else {
        _logger.d('No user data found in secure storage.');
      }
    } catch (e) {
      _logger.e('Error loading user data from secure storage: $e');
      // Nếu có lỗi khi đọc, coi như dữ liệu không hợp lệ và xóa đi
      await logout();
    }
  }

  // Lưu token và thông tin người dùng sau khi đăng nhập
  Future<void> saveLoginData(LoginResponse loginResponse) async {
    try {
      _currentToken = loginResponse.token;
      _currentUser = loginResponse.user;

      await _secureStorage.write(key: _tokenKey, value: loginResponse.token);
      await _secureStorage.write(key: _userKey, value: jsonEncode(loginResponse.user.toJson()));
      _logger.i('Login data saved successfully for user: ${_currentUser?.username}');
    } catch (e) {
      _logger.e('Failed to save login data: $e');
      throw Exception('Failed to save login data: $e');
    }
  }

  // Cập nhật thông tin người dùng (ví dụ: sau khi chỉnh sửa hồ sơ)
  Future<void> updateUser(User user) async {
    try {
      _currentUser = user;
      await _secureStorage.write(key: _userKey, value: jsonEncode(user.toJson()));
      _logger.i('User data updated successfully for user: ${user.username}');
    } catch (e) {
      _logger.e('Failed to update user data: $e');
      throw Exception('Failed to update user data: $e');
    }
  }

  // Đăng xuất và xóa tất cả dữ liệu
  Future<void> logout() async {
    try {
      await _secureStorage.delete(key: _tokenKey);
      await _secureStorage.delete(key: _userKey);

      _currentToken = null;
      _currentUser = null;
      _logger.i('User logged out. All data cleared.');
    } catch (e) {
      _logger.e('Error during logout: $e. Forcing clear in memory.');
      // Buộc xóa trong bộ nhớ ngay cả khi có lỗi xóa storage
      _currentToken = null;
      _currentUser = null;
    }
  }

  // Kiểm tra quyền hạn dựa trên vai trò
  bool hasPermission(List<UserRole> allowedRoles) {
    if (_currentUser == null) {
      _logger.w('Checking permission but current user is null.');
      return false;
    }
    return allowedRoles.contains(_currentUser!.role);
  }

  // Getters tiện ích cho vai trò
  bool get isStudent => _currentUser?.role == UserRole.student;
  bool get isTeacher => _currentUser?.role == UserRole.teacher;
  bool get isAdmin => _currentUser?.role == UserRole.admin;

  // Getters cho thông tin người dùng cụ thể từ _currentUser
  int? get userId => _currentUser?.id;
  UserRole? get userRole => _currentUser?.role;
  String? get userName => _currentUser?.fullName;
  String? get userEmail => _currentUser?.email;
  String? get userUsername => _currentUser?.username;
}