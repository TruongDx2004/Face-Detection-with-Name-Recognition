import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart'; // ignore: unused_import
import '../models/models.dart';

class AuthService {
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

  User? _currentUser;
  String? _currentToken;

  // Getters
  User? get currentUser => _currentUser;
  String? get currentToken => _currentToken;
  bool get isLoggedIn => _currentUser != null && _currentToken != null;

  Future<void> initialize() async {
    await _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      final token = await _secureStorage.read(key: _tokenKey);
      final userJson = await _secureStorage.read(key: _userKey);

      if (token != null && userJson != null) {
        _currentToken = token;
        _currentUser = User.fromJson(jsonDecode(userJson));
      }
    } catch (e) {
      // Clear invalid data
      await logout();
    }
  }

  Future<void> saveLoginData(LoginResponse loginResponse) async {
    try {
      _currentToken = loginResponse.accessToken;
      _currentUser = loginResponse.user;

      await _secureStorage.write(key: _tokenKey, value: loginResponse.accessToken);
      await _secureStorage.write(key: _userKey, value: jsonEncode(loginResponse.user.toJson()));
    } catch (e) {
      throw Exception('Failed to save login data: $e');
    }
  }

  Future<void> updateUser(User user) async {
    try {
      _currentUser = user;
      await _secureStorage.write(key: _userKey, value: jsonEncode(user.toJson()));
    } catch (e) {
      throw Exception('Failed to update user data: $e');
    }
  }

  Future<void> logout() async {
    try {
      await _secureStorage.delete(key: _tokenKey);
      await _secureStorage.delete(key: _userKey);
      
      _currentToken = null;
      _currentUser = null;
    } catch (e) {
      // Force clear even if there's an error
      _currentToken = null;
      _currentUser = null;
    }
  }

  bool hasPermission(List<UserRole> allowedRoles) {
    if (_currentUser == null) return false;
    return allowedRoles.contains(_currentUser!.role);
  }

  bool get isStudent => _currentUser?.role == UserRole.student;
  bool get isTeacher => _currentUser?.role == UserRole.teacher;
  bool get isAdmin => _currentUser?.role == UserRole.admin;
}