// lib/services/api_service.dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import '../models/models.dart';
import '../utils/constants.dart';
import 'auth_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final Logger _logger = Logger();
  final String baseUrl = ApiConstants.baseUrl;
  late final AuthService _authService;

  void initialize() {
    _authService = AuthService();
  }

  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    final token = _authService.currentToken;
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    return headers;
  }

  // ============ HELPER METHODS ============
  
  Future<ApiResponse<T>> _handleResponse<T>(
    http.Response response,
    T Function(Map<String, dynamic>)? fromJson,
  ) async {
    _logger.d('Response Status: ${response.statusCode}');
    _logger.d('Response Body: ${response.body}');

    try {
      final Map<String, dynamic> responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Success response
        if (fromJson != null) {
          final data = fromJson(responseData);
          return ApiResponse.success(data, message: responseData['message'] ?? 'Success');
        } else {
          return ApiResponse.success(responseData as T, message: responseData['message'] ?? 'Success');
        }
      } else {
        // Error response
        final errorMessage = responseData['detail'] ?? 
                            responseData['message'] ?? 
                            'Unknown error occurred';
        return ApiResponse.error(errorMessage, statusCode: response.statusCode);
      }
    } catch (e) {
      _logger.e('Error parsing response: $e');
      return ApiResponse.error('Failed to parse response: $e', statusCode: response.statusCode);
    }
  }

  Future<http.Response> _makeRequest(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? queryParams,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');
      final uriWithQuery = queryParams != null 
          ? uri.replace(queryParameters: queryParams)
          : uri;

      _logger.d('$method Request: $uriWithQuery');
      if (body != null) {
        _logger.d('Request Body: ${jsonEncode(body)}');
      }

      http.Response response;
      
      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(uriWithQuery, headers: _headers);
          break;
        case 'POST':
          response = await http.post(
            uriWithQuery,
            headers: _headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'PUT':
          response = await http.put(
            uriWithQuery,
            headers: _headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'DELETE':
          response = await http.delete(uriWithQuery, headers: _headers);
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }

      return response;
    } catch (e) {
      _logger.e('Network error: $e');
      rethrow;
    }
  }

  // ============ AUTH ENDPOINTS ============

  Future<ApiResponse<LoginResponse>> login(LoginRequest request) async {
    try {
      final response = await _makeRequest('POST', '/auth/login', body: request.toJson());
      return _handleResponse<LoginResponse>(
        response,
        (data) => LoginResponse.fromJson(data),
      );
    } catch (e) {
      _logger.e('Login error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<User>> getProfile() async {
    try {
      final response = await _makeRequest('GET', '/auth/profile');
      return _handleResponse<User>(
        response,
        (data) => User.fromJson(data),
      );
    } catch (e) {
      _logger.e('Get profile error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ STUDENT ENDPOINTS ============

  Future<ApiResponse<Map<String, dynamic>>> registerFace(FaceRegisterRequest request) async {
    try {
      final response = await _makeRequest('POST', '/student/register-face', body: request.toJson());
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Register face error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> submitAttendance(AttendanceRequest request) async {
    try {
      final response = await _makeRequest('POST', '/student/attendance', body: request.toJson());
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Submit attendance error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<List<Attendance>>> getAttendanceHistory() async {
    try {
      final response = await _makeRequest('GET', '/student/attendance-history');
      return _handleResponse<List<Attendance>>(
        response,
        (data) {
          final List<dynamic> historyList = data['history'] ?? [];
          return historyList.map((item) => Attendance.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get attendance history error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ TEACHER ENDPOINTS ============

  Future<ApiResponse<Map<String, dynamic>>> createSession(SessionCreateRequest request) async {
    try {
      final response = await _makeRequest('POST', '/teacher/create-session', body: request.toJson());
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Create session error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> closeSession(int sessionId) async {
    try {
      final response = await _makeRequest('PUT', '/teacher/session/$sessionId/close');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Close session error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<List<AttendanceSession>>> getTeacherSessions() async {
    try {
      final response = await _makeRequest('GET', '/teacher/sessions');
      return _handleResponse<List<AttendanceSession>>(
        response,
        (data) {
          final List<dynamic> sessionsList = data['sessions'] ?? [];
          return sessionsList.map((item) => AttendanceSession.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get teacher sessions error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getSessionAttendance(int sessionId) async {
    try {
      final response = await _makeRequest('GET', '/teacher/attendance/$sessionId');
      return _handleResponse<Map<String, dynamic>>(
        response,
        (data) {
          return {
            'session': AttendanceSession.fromJson(data['session']),
            'attendances': (data['attendances'] as List<dynamic>)
                .map((item) => Attendance.fromJson(item))
                .toList(),
          };
        },
      );
    } catch (e) {
      _logger.e('Get session attendance error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ ADMIN ENDPOINTS ============

  Future<ApiResponse<List<User>>> getAllUsers() async {
    try {
      final response = await _makeRequest('GET', '/admin/users');
      return _handleResponse<List<User>>(
        response,
        (data) {
          final List<dynamic> usersList = data['users'] ?? [];
          return usersList.map((item) => User.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get all users error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> createUser(Map<String, dynamic> userData) async {
    try {
      final response = await _makeRequest('POST', '/admin/users', body: userData);
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Create user error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getStatistics() async {
    try {
      final response = await _makeRequest('GET', '/admin/statistics');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Get statistics error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> retrainModel() async {
    try {
      final response = await _makeRequest('POST', '/admin/retrain-model');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Retrain model error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ UTILITY METHODS ============

  Future<ApiResponse<List<AttendanceSession>>> getActiveSessions() async {
    try {
      final response = await _makeRequest('GET', '/student/active-sessions');
      return _handleResponse<List<AttendanceSession>>(
        response,
        (data) {
          final List<dynamic> sessionsList = data['sessions'] ?? [];
          return sessionsList.map((item) => AttendanceSession.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get active sessions error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // Test connection
  Future<ApiResponse<Map<String, dynamic>>> testConnection() async {
    try {
      final response = await _makeRequest('GET', '/');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Test connection error: $e');
      return ApiResponse.error('Cannot connect to server: $e');
    }
  }
}