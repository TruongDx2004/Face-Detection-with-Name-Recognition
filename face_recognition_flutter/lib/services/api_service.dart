// lib/services/api_service.dart
import 'dart:convert';
import 'dart:io';
import 'package:face_attendance/models/class.dart';
import 'package:face_attendance/models/register_request.dart';
import 'package:face_attendance/models/student.dart';
import 'package:face_attendance/models/subject.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:mime/mime.dart';
import '../models/models.dart';
import '../utils/constants.dart';
import 'auth_service.dart';
import 'package:http_parser/http_parser.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final Logger _logger = Logger();
  final String baseUrl = ApiConstants.baseUrl;

  final AuthService _authService = AuthService();

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
        final message = responseData['message'] ?? 'Success';
        final dataRaw = responseData['data'] ?? responseData;
        _logger.d('Response Data: $dataRaw');

        if (fromJson != null) {
          final data = fromJson(dataRaw);
          return ApiResponse.success(data, message: message);
        } else {
          return ApiResponse.success(dataRaw as T, message: message);
        }
      } else {
        final errorMessage = responseData['detail'] is List
            ? (responseData['detail'] as List)
                .map((e) => e['msg'] ?? e.toString())
                .join(', ')
            : responseData['detail'] ??
                responseData['error'] ??
                responseData['message'] ??
                'Unknown error occurred';
        return ApiResponse.error(errorMessage, statusCode: response.statusCode);
      }
    } catch (e) {
      _logger.e('Error parsing response: $e');
      return ApiResponse.error('Failed to parse response: $e',
          statusCode: response.statusCode);
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
      final uriWithQuery =
          queryParams != null ? uri.replace(queryParameters: queryParams) : uri;

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

  Future<http.Response> _makeMultipartRequest(
    String method,
    String endpoint, {
    Map<String, String>? fields,
    List<http.MultipartFile>? files,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');
      _logger.d('$method Multipart Request: $uri');

      final request = http.MultipartRequest(method, uri);
      final token = _authService.currentToken;
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      if (fields != null) {
        request.fields.addAll(fields);
      }

      if (files != null) {
        request.files.addAll(files);
      }

      final streamedResponse = await request.send();
      return await http.Response.fromStream(streamedResponse);
    } catch (e) {
      _logger.e('Multipart request error: $e');
      rethrow;
    }
  }

  // ============ AUTH ENDPOINTS ============

  Future<ApiResponse<LoginResponse>> login(LoginRequest request) async {
    try {
      final response =
          await _makeRequest('POST', '/auth/login', body: request.toJson());
      return _handleResponse<LoginResponse>(
        response,
        (data) => LoginResponse.fromJson(data),
      );
    } catch (e) {
      _logger.e('Login error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<User>> register(RegisterRequest request) async {
    try {
      final response =
          await _makeRequest('POST', '/auth/register', body: request.toJson());
      return _handleResponse<User>(
        response,
        (data) => User.fromJson(data),
      );
    } catch (e) {
      _logger.e('Register error: $e');
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

  Future<ApiResponse<Map<String, dynamic>>> updateProfile(
      Map<String, dynamic> profileData) async {
    try {
      final response =
          await _makeRequest('PUT', '/auth/profile', body: profileData);
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Update profile error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final response =
          await _makeRequest('PUT', '/auth/change-password', body: {
        'current_password': currentPassword,
        'new_password': newPassword,
      });
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Change password error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ FACE RECOGNITION ENDPOINTS ============

  Future<http.Response> uploadFaceVideo({
    required String token,
    required File videoFile,
    required int userId,
  }) async {
    final uri = Uri.parse('http://10.0.2.2:8000/face/upload-video');

    final request = http.MultipartRequest('POST', uri)
      ..headers['Authorization'] = 'Bearer $token'
      ..fields['userId'] = userId.toString()
      ..files.add(await http.MultipartFile.fromPath(
        'video',
        videoFile.path,
        contentType:
            MediaType.parse(lookupMimeType(videoFile.path) ?? 'video/mp4'),
      ));

    final streamedResponse = await request.send();
    return await http.Response.fromStream(streamedResponse);
  }

  Future<ApiResponse<Map<String, dynamic>>> trainModel() async {
    try {
      final response = await _makeRequest('POST', '/face/train-model');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Train model error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> recognizeFace(
      File imageFile) async {
    try {
      final multipartFile = await http.MultipartFile.fromPath(
        'image',
        imageFile.path,
      );

      final response = await _makeMultipartRequest(
        'POST',
        '/face/recognize',
        files: [multipartFile],
      );

      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Recognize face error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getDatasetStats() async {
    try {
      final response = await _makeRequest('GET', '/face/dataset-stats');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Get dataset stats error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getModelStatus() async {
    try {
      final response = await _makeRequest('GET', '/face/model-status');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Get model status error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ ATTENDANCE ENDPOINTS ============

  Future<ApiResponse<Map<String, dynamic>>> createAttendanceSession(
      SessionCreateRequest request) async {
    try {
      final response = await _makeRequest('POST', '/attendance/create-session',
          body: request.toJson());
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Create session error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> markAttendance({
    required int sessionId,
    required File imageFile,
  }) async {
    try {
      final multipartFile = await http.MultipartFile.fromPath(
        'image',
        imageFile.path,
        contentType: MediaType('image', 'jpeg'),
      );

      final response = await _makeMultipartRequest(
        'POST',
        '/attendance/mark-attendance',
        fields: {'session_id': sessionId.toString()},
        files: [multipartFile],
      );

      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Mark attendance error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<List<AttendanceSession>>> getActiveSessions() async {
    try {
      final response = await _makeRequest('GET', '/attendance/active-sessions');
      return _handleResponse<List<AttendanceSession>>(
        response,
        (data) {
          final List<dynamic> sessionsList = data['sessions'] ?? [];
          return sessionsList
              .map((item) => AttendanceSession.fromJson(item))
              .toList();
        },
      );
    } catch (e) {
      _logger.e('Get active sessions error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<List<Attendance>>> getMyAttendance({
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;

      final response = await _makeRequest(
        'GET',
        '/attendance/my-attendance',
        queryParams: queryParams,
      );

      return _handleResponse<List<Attendance>>(
        response,
        (data) {
          final List<dynamic> attendancesList = data['attendances'] ?? [];
          return attendancesList
              .map((item) => Attendance.fromJson(item))
              .toList();
        },
      );
    } catch (e) {
      _logger.e('Get my attendance error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getSessionAttendance(
      int sessionId) async {
    try {
      final response =
          await _makeRequest('GET', '/attendance/session/$sessionId');

      return _handleResponse<Map<String, dynamic>>(
        response,
        (data) {
          return {
            'session': data['session'] != null
                ? AttendanceSession.fromJson(data['session'])
                : null,
            'attendances': (data['attendances'] as List<dynamic>? ?? [])
                .map((item) => Attendance.fromJson(item))
                .toList(),
            'absent_students': (data['absent_students'] as List<dynamic>? ?? [])
                .map((item) => User.fromJson(item))
                .toList(),
            'statistics': data['statistics'] ?? {},
          };
        },
      );
    } catch (e) {
      _logger.e('Get teacher sessions error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> endSession(int sessionId) async {
    try {
      final response =
          await _makeRequest('PUT', '/attendance/end-session/$sessionId');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('End session error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<List<AttendanceSession>>> getTeacherSessions({
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;

      final response = await _makeRequest(
        'GET',
        '/attendance/my-sessions',
        queryParams: queryParams,
      );

      return _handleResponse<List<AttendanceSession>>(
        response,
        (data) {
          final List<dynamic> sessionsList = data['sessions'] ?? [];
          return sessionsList
              .map((item) => AttendanceSession.fromJson(item))
              .toList();
        },
      );
    } catch (e) {
      _logger.e('Get teacher sessions error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<List<AttendanceSession>>> getSessions({
    int? teacherId,
    int? classId,
    DateTime? date,
    bool? isActive,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (teacherId != null) queryParams['teacher_id'] = teacherId.toString();
      if (classId != null) queryParams['class_id'] = classId.toString();
      if (date != null)
        queryParams['date'] = date.toIso8601String().split('T').first;
      if (isActive != null) queryParams['is_active'] = isActive.toString();

      final response = await _makeRequest(
        'GET',
        '/attendance/sessions',
        queryParams: queryParams,
      );

      return _handleResponse<List<AttendanceSession>>(
        response,
        (data) {
          final List<dynamic> sessionsList = data['sessions'] ?? [];
          return sessionsList
              .map((item) => AttendanceSession.fromJson(item))
              .toList();
        },
      );
    } catch (e) {
      _logger.e('Get sessions error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<List<Attendance>>> getAttendanceHistory({
    int? sessionId,
    int? studentId,
    int? classId,
    String? status,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (sessionId != null) queryParams['session_id'] = sessionId.toString();
      if (studentId != null) queryParams['student_id'] = studentId.toString();
      if (classId != null) queryParams['class_id'] = classId.toString();
      if (status != null) queryParams['status'] = status;
      if (startDate != null)
        queryParams['start_date'] =
            startDate.toIso8601String().split('T').first;
      if (endDate != null)
        queryParams['end_date'] = endDate.toIso8601String().split('T').first;

      final response = await _makeRequest(
        'GET',
        '/attendance/history',
        queryParams: queryParams,
      );

      return _handleResponse<List<Attendance>>(
        response,
        (data) {
          final List<dynamic> recordsList = data['records'] ?? [];
          return recordsList.map((item) => Attendance.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get attendance history error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> stopSession(int sessionId) async {
    try {
      final response =
          await _makeRequest('PUT', '/attendance/sessions/$sessionId/stop');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Stop session error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> deleteSession(int sessionId) async {
    try {
      final response =
          await _makeRequest('DELETE', '/attendance/sessions/$sessionId');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Delete session error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ CLASS MANAGEMENT ENDPOINTS ============

  Future<ApiResponse<List<ClassData>>> getClasses({String? name}) async {
    try {
      final queryParams = <String, String>{};
      if (name != null && name.isNotEmpty) {
        queryParams['name'] = name;
      }

      final response = await _makeRequest(
        'GET',
        '/classes',
        queryParams: queryParams,
      );

      return _handleResponse<List<ClassData>>(
        response,
        (data) {
          final List<dynamic> classesList = data['classes'] ?? [];
          return classesList.map((item) => ClassData.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get classes error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> createClass(String name) async {
    try {
      final response =
          await _makeRequest('POST', '/classes', body: {'name': name});
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Create class error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> updateClass(
      int id, String name) async {
    try {
      final response =
          await _makeRequest('PUT', '/classes/$id', body: {'name': name});
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Update class error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> deleteClass(int id) async {
    try {
      final response = await _makeRequest('DELETE', '/classes/$id');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Delete class error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<List<Student>>> getClassStudents(int classId) async {
    try {
      final response = await _makeRequest('GET', '/classes/$classId/students');
      return _handleResponse<List<Student>>(
        response,
        (data) {
          final List<dynamic> studentsList = data['students'] ?? [];
          return studentsList.map((item) => Student.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get class students error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> addStudentToClass({
    required int classId,
    required int studentId,
    required String studentCode,
  }) async {
    try {
      final response = await _makeRequest(
        'POST',
        '/classes/$classId/students',
        body: {
          'student_id': studentId,
          'student_code': studentCode,
        },
      );
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Add student to class error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> removeStudentFromClass({
    required int classId,
    required int studentId,
  }) async {
    try {
      final response = await _makeRequest(
        'DELETE',
        '/classes/$classId/students/$studentId',
      );
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Remove student from class error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<List<Student>>> getAvailableStudents(int classId) async {
    try {
      final response = await _makeRequest(
        'GET',
        '/classes/available-students',
        queryParams: {'class_id': classId.toString()},
      );
      return _handleResponse<List<Student>>(
        response,
        (data) {
          final List<dynamic> studentsList = data['students'] ?? [];
          return studentsList.map((item) => Student.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get available students error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ SUBJECT MANAGEMENT ENDPOINTS ============

  Future<ApiResponse<List<Subject>>> getSubjects({
    String? name,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      if (name != null) queryParams['name'] = name;

      final response =
          await _makeRequest('GET', '/subjects', queryParams: queryParams);

      return _handleResponse<List<Subject>>(
        response,
        (data) {
          final List<dynamic> subjectsList = data['subjects'] ?? [];
          return subjectsList.map((item) => Subject.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get subjects error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> createSubject(String name) async {
    try {
      final response =
          await _makeRequest('POST', '/subjects', body: {'name': name});
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Create subject error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> updateSubject(
      int id, String name) async {
    try {
      final response =
          await _makeRequest('PUT', '/subjects/$id', body: {'name': name});
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Update subject error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> deleteSubject(int id) async {
    try {
      final response = await _makeRequest('DELETE', '/subjects/$id');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Delete subject error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ SCHEDULE MANAGEMENT ENDPOINTS ============

  Future<ApiResponse<List<Schedule>>> getSchedules({
    int? classId,
    int? subjectId,
    int? teacherId,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      if (classId != null) queryParams['class_id'] = classId.toString();
      if (subjectId != null) queryParams['subject_id'] = subjectId.toString();
      if (teacherId != null) queryParams['teacher_id'] = teacherId.toString();

      final response = await _makeRequest('GET', '/subjects/schedules',
          queryParams: queryParams);

      return _handleResponse<List<Schedule>>(
        response,
        (data) {
          final List<dynamic> schedulesList = data['schedules'] ?? [];
          return schedulesList.map((item) => Schedule.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get schedules error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> createSchedule({
    required int classId,
    required int subjectId,
    required int teacherId,
    required int weekday,
    required String startTime,
    required String endTime,
  }) async {
    try {
      final response = await _makeRequest(
        'POST',
        '/subjects/schedules',
        body: {
          'class_id': classId,
          'subject_id': subjectId,
          'teacher_id': teacherId,
          'weekday': weekday,
          'start_time': startTime,
          'end_time': endTime,
        },
      );
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Create schedule error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> updateSchedule({
    required int id,
    required int classId,
    required int subjectId,
    required int teacherId,
    required int weekday,
    required String startTime,
    required String endTime,
  }) async {
    try {
      final response = await _makeRequest(
        'PUT',
        '/subjects/schedules/$id',
        body: {
          'class_id': classId,
          'subject_id': subjectId,
          'teacher_id': teacherId,
          'weekday': weekday,
          'start_time': startTime,
          'end_time': endTime,
        },
      );
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Update schedule error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> deleteSchedule(int id) async {
    try {
      final response = await _makeRequest('DELETE', '/subjects/schedules/$id');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Delete schedule error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getScheduleOptions() async {
    try {
      final response = await _makeRequest('GET', '/subjects/schedules/options');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Get schedule options error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

   // ============ NEW: SCHEDULE ENDPOINTS ============

  Future<ApiResponse<List<Schedule>>> getStudentSchedules() async {
    try {
      final response = await _makeRequest('GET', '/subjects/schedules');
      return _handleResponse<List<Schedule>>(
        response,
        (data) {
          final List<dynamic> schedulesList = data['schedules'] ?? [];
          return schedulesList.map((item) => Schedule.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get student schedules error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }
  
  // ============ ADMIN ENDPOINTS ============

  Future<ApiResponse<List<User>>> getAllUsers({
    String? role,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      if (role != null) queryParams['role'] = role;

      final response = await _makeRequest(
        'GET',
        '/admin/users',
        queryParams: queryParams,
      );

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

  Future<ApiResponse<Map<String, dynamic>>> createUser(
      Map<String, dynamic> userData) async {
    try {
      final response =
          await _makeRequest('POST', '/admin/users', body: userData);
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Create user error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> updateUser(
      int id, Map<String, dynamic> userData) async {
    try {
      final response = await _makeRequest(
        'PUT',
        '/admin/users/$id',
        body: userData,
      );
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Update user error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> deleteUser(int userId) async {
    try {
      final response = await _makeRequest('DELETE', '/admin/users/$userId');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Delete user error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> resetUserPassword({
    required int userId,
    required String newPassword,
  }) async {
    try {
      final response = await _makeRequest(
        'PUT',
        '/admin/users/$userId/reset-password',
        body: {'new_password': newPassword},
      );
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Reset password error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getStatistics({
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;

      final response = await _makeRequest(
        'GET',
        '/admin/statistics',
        queryParams: queryParams,
      );
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Get statistics error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getAttendanceReport({
    String? className,
    String? startDate,
    String? endDate,
    int? studentId,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (className != null) queryParams['class_name'] = className;
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;
      if (studentId != null) queryParams['student_id'] = studentId.toString();

      final response = await _makeRequest(
        'GET',
        '/admin/reports/attendance',
        queryParams: queryParams,
      );
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Get attendance report error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ UTILITY METHODS ============

  Future<ApiResponse<Map<String, dynamic>>> testConnection() async {
    try {
      final response = await _makeRequest('GET', '/');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Test connection error: $e');
      return ApiResponse.error('Cannot connect to server: $e');
    }
  }

  // ============ LEGACY SUPPORT (for backward compatibility) ============

  @Deprecated('Use uploadVideo instead')
  Future<ApiResponse<Map<String, dynamic>>> registerFace({
    required int userId,
    required List<String> images,
  }) async {
    try {
      final body = {
        'user_id': userId,
        'images': images,
      };
      final response =
          await _makeRequest('POST', '/student/register-face', body: body);
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Register face error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  @Deprecated('Use markAttendance instead')
  Future<ApiResponse<Map<String, dynamic>>> submitAttendance(
      AttendanceRequest request) async {
    try {
      final response = await _makeRequest('POST', '/student/attendance',
          body: request.toJson());
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Submit attendance error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  @Deprecated('Use createAttendanceSession instead')
  Future<ApiResponse<Map<String, dynamic>>> createSession(
      SessionCreateRequest request) async {
    try {
      final response = await _makeRequest('POST', '/teacher/create-session',
          body: request.toJson());
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Create session error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  @Deprecated('Use endSession instead')
  Future<ApiResponse<Map<String, dynamic>>> closeSession(int sessionId) async {
    try {
      final response =
          await _makeRequest('PUT', '/attendance/end-session/$sessionId');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Close session error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  @Deprecated('Use getTeacherSessions instead')
  Future<ApiResponse<List<AttendanceSession>>>
      getTeacherSessionsLegacy() async {
    try {
      final response = await _makeRequest('GET', '/teacher/sessions');
      return _handleResponse<List<AttendanceSession>>(
        response,
        (data) {
          final List<dynamic> sessionsList = data['sessions'] ?? [];
          return sessionsList
              .map((item) => AttendanceSession.fromJson(item))
              .toList();
        },
      );
    } catch (e) {
      _logger.e('Get teacher sessions error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  @Deprecated('Use trainModel instead')
  Future<ApiResponse<Map<String, dynamic>>> retrainModel() async {
    try {
      final response = await _makeRequest('POST', '/admin/retrain-model');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Retrain model error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }
}
