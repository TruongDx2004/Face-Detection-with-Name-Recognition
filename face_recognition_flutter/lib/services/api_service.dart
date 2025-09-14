// lib/services/api_service_new.dart
import 'dart:convert';
import 'dart:io';
import 'package:face_attendance/models/register_request.dart';
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

  Future<ApiResponse<List<T>>> _handleListResponse<T>(
    http.Response response,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    _logger.d('Response Status: ${response.statusCode}');
    _logger.d('Response Body: ${response.body}');

    try {
      final dynamic responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final String message;
        final dynamic dataRaw;

        if (responseData is Map<String, dynamic>) {
          message = responseData['message'] ?? 'Success';
          dataRaw = responseData['data'] ?? responseData;
        } else {
          message = 'Success';
          dataRaw = responseData;
        }

        _logger.d('Response Data: $dataRaw');

        // Handle List response
        if (dataRaw is List) {
          final List<T> items = dataRaw
              .map((item) => fromJson(Map<String, dynamic>.from(item)))
              .toList();
          return ApiResponse.success(items, message: message);
        } else {
          return ApiResponse.error(
              'Expected list response but got: ${dataRaw.runtimeType}');
        }
      } else {
        final errorMessage = responseData is Map<String, dynamic> &&
                responseData['detail'] is List
            ? (responseData['detail'] as List)
                .map((e) => e['msg'] ?? e.toString())
                .join(', ')
            : responseData is Map<String, dynamic>
                ? (responseData['detail'] ??
                    responseData['error'] ??
                    responseData['message'] ??
                    'Unknown error occurred')
                : 'Unknown error occurred';
        return ApiResponse.error(errorMessage, statusCode: response.statusCode);
      }
    } catch (e) {
      _logger.e('Error parsing response: $e');
      return ApiResponse.error('Failed to parse response: $e',
          statusCode: response.statusCode);
    }
  }

  Future<ApiResponse<T>> _handleResponse<T>(
    http.Response response,
    T Function(Map<String, dynamic>)? fromJson,
  ) async {
    _logger.d('Response Status: ${response.statusCode}');
    _logger.d('Response Body: ${response.body}');

    try {
      final dynamic responseData = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Handle both Map and List responses
        final String message;
        final dynamic dataRaw;

        if (responseData is Map<String, dynamic>) {
          message = responseData['message'] ?? 'Success';
          dataRaw = responseData['data'] ?? responseData;
        } else {
          // If response is directly a list or other type
          message = 'Success';
          dataRaw = responseData;
        }

        _logger.d('Response Data: $dataRaw');

        if (fromJson != null) {
          // Ensure we pass a Map to fromJson
          if (dataRaw is Map<String, dynamic>) {
            final data = fromJson(dataRaw);
            return ApiResponse.success(data, message: message);
          } else {
            // If dataRaw is not a Map, we can't use fromJson
            return ApiResponse.success(dataRaw as T, message: message);
          }
        } else {
          return ApiResponse.success(dataRaw as T, message: message);
        }
      } else {
        final errorMessage = responseData is Map<String, dynamic> &&
                responseData['detail'] is List
            ? (responseData['detail'] as List)
                .map((e) => e['msg'] ?? e.toString())
                .join(', ')
            : responseData is Map<String, dynamic>
                ? (responseData['detail'] ??
                    responseData['error'] ??
                    responseData['message'] ??
                    'Unknown error occurred')
                : 'Unknown error occurred';
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
    Duration? timeout,
  }) async {
    final uri =
        Uri.parse('$baseUrl$endpoint').replace(queryParameters: queryParams);

    _logger.d('Making $method request to: $uri');
    if (body != null) _logger.d('Request body: $body');

    final requestTimeout = timeout ?? const Duration(seconds: 30);

    try {
      switch (method.toUpperCase()) {
        case 'GET':
          return await http.get(uri, headers: _headers).timeout(requestTimeout);
        case 'POST':
          return await http
              .post(uri,
                  headers: _headers,
                  body: body != null ? jsonEncode(body) : null)
              .timeout(requestTimeout);
        case 'PUT':
          return await http
              .put(uri,
                  headers: _headers,
                  body: body != null ? jsonEncode(body) : null)
              .timeout(requestTimeout);
        case 'DELETE':
          return await http
              .delete(uri, headers: _headers)
              .timeout(requestTimeout);
        default:
          throw Exception('Unsupported HTTP method: $method');
      }
    } catch (e) {
      _logger.e('Network request failed: $e');
      if (e.toString().contains('TimeoutException')) {
        throw Exception(
            'Request timeout. Please check your internet connection.');
      }
      rethrow;
    }
  }

  // ============ AUTH METHODS ============
  // Based on: /auth/login, /auth/register, /auth/profile, /auth/change-password

  Future<ApiResponse<LoginResponse>> login(Map<String, dynamic> body) async {
    try {
      final response = await _makeRequest('POST', '/auth/login', body: body);

      return _handleResponse<LoginResponse>(
        response,
        (data) => LoginResponse.fromJson(data),
      );
    } catch (e) {
      _logger.e('Login error: $e');
      return ApiResponse.error(_getUserFriendlyErrorMessage(e.toString()));
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
      return ApiResponse.error(_getUserFriendlyErrorMessage(e.toString()));
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

  // ============ FACE RECOGNITION METHODS ============
  // Based on: /face/train-model, /face/recognize, /face/dataset-stats, /face/model-status
  // /face/register-image, /face/register-video, /face/upload-video

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
      final request =
          http.MultipartRequest('POST', Uri.parse('$baseUrl/face/recognize'));

      // Add headers
      final token = _authService.currentToken;
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      // Add file
      final mimeType = lookupMimeType(imageFile.path) ?? 'image/jpeg';
      final multipartFile = await http.MultipartFile.fromPath(
        'file',
        imageFile.path,
        contentType: MediaType.parse(mimeType),
      );
      request.files.add(multipartFile);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

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

  Future<ApiResponse<Map<String, dynamic>>> registerFaceFromImage({
    required File imageFile,
  }) async {
    try {
      final request = http.MultipartRequest(
          'POST', Uri.parse('$baseUrl/face/register-image'));

      // Add headers
      final token = _authService.currentToken;
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      // Add file
      final mimeType = lookupMimeType(imageFile.path) ?? 'image/jpeg';
      final multipartFile = await http.MultipartFile.fromPath(
        'file',
        imageFile.path,
        contentType: MediaType.parse(mimeType),
      );
      request.files.add(multipartFile);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Register face from image error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> registerFaceFromVideo({
    required File videoFile,
  }) async {
    try {
      final request = http.MultipartRequest(
          'POST', Uri.parse('$baseUrl/face/register-video'));

      // Add headers
      final token = _authService.currentToken;
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      // Add file
      final mimeType = lookupMimeType(videoFile.path) ?? 'video/mp4';
      final multipartFile = await http.MultipartFile.fromPath(
        'file',
        videoFile.path,
        contentType: MediaType.parse(mimeType),
      );
      request.files.add(multipartFile);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Register face from video error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ ATTENDANCE METHODS ============
  // Based on: /attendance/sessions, /attendance/mark, /attendance/active-sessions,
  // /attendance/my-attendance, /attendance/my-sessions, etc.

  Future<ApiResponse<Map<String, dynamic>>> createAttendanceSession({
    required int classId,
    required int subjectId,
    required String sessionName,
    required DateTime startTime,
    required DateTime endTime,
    String? location,
  }) async {
    try {
      final response =
          await _makeRequest('POST', '/attendance/sessions', body: {
        'class_id': classId,
        'subject_id': subjectId,
        'session_name': sessionName,
        'start_time': startTime.toIso8601String(),
        'end_time': endTime.toIso8601String(),
        if (location != null) 'location': location,
      });
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Create attendance session error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> markAttendanceByFace({
    required File imageFile,
    required int sessionId,
    Map<String, dynamic>? locationData,
  }) async {
    try {
      final request =
          http.MultipartRequest('POST', Uri.parse('$baseUrl/attendance/mark'));

      // Add headers
      final token = _authService.currentToken;
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      // Add file
      final mimeType = lookupMimeType(imageFile.path) ?? 'image/jpeg';
      final multipartFile = await http.MultipartFile.fromPath(
        'image',
        imageFile.path,
        contentType: MediaType.parse(mimeType),
      );
      request.files.add(multipartFile);

      // Add session_id
      request.fields['session_id'] = sessionId.toString();

      // Add location data if provided
      if (locationData != null) {
        request.fields['location_data'] = jsonEncode(locationData);
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Mark attendance error: $e');
      return ApiResponse.error(_getUserFriendlyErrorMessage(e.toString()));
    }
  }

  // Alias method for easier usage - matches your preferred calling style
  Future<ApiResponse<Map<String, dynamic>>> markAttendance({
    required int sessionId,
    required File imageFile,
    Map<String, dynamic>? locationData,
  }) async {
    return markAttendanceByFace(
      imageFile: imageFile,
      sessionId: sessionId,
      locationData: locationData,
    );
  }

  Future<ApiResponse<List<AttendanceSession>>> getActiveSessions() async {
    try {
      final response = await _makeRequest('GET', '/attendance/active-sessions');
      return _handleResponse<List<AttendanceSession>>(
        response,
        (data) {
          // Handle both response formats: {sessions: [...]} or directly [...]
          final List<dynamic> sessionsList;
          sessionsList = data['sessions'] ?? data['data'] ?? [];
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

  Future<ApiResponse<List<AttendanceSession>>> getSessions({
    int? classId,
    int? teacherId,
    String? status,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (classId != null) queryParams['class_id'] = classId.toString();
      if (teacherId != null) queryParams['teacher_id'] = teacherId.toString();
      if (status != null) queryParams['status'] = status;

      final response = await _makeRequest(
        'GET',
        '/attendance/sessions',
        queryParams: queryParams,
      );

      return _handleResponse<List<AttendanceSession>>(
        response,
        (data) {
          // Handle both response formats: {sessions: [...]} or directly [...]
          final List<dynamic> sessionsList;
          sessionsList = data['sessions'] ?? data['data'] ?? [];
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
          final List<dynamic> recordsList;
          recordsList =
              data['attendance'] ?? data['data'] ?? data['records'] ?? [];
          return recordsList.map((item) => Attendance.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get my attendance error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<List<AttendanceSession>>> getTeacherSessions() async {
    try {
      final response = await _makeRequest('GET', '/attendance/my-sessions');
      return _handleResponse<List<AttendanceSession>>(
        response,
        (data) {
          // Handle both response formats: {sessions: [...]} or directly [...]
          final List<dynamic> sessionsList;
          sessionsList = data['sessions'] ?? data['data'] ?? [];
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

  Future<ApiResponse<Map<String, dynamic>>> endSession(int sessionId) async {
    try {
      final response =
          await _makeRequest('PUT', '/attendance/sessions/$sessionId/end');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('End session error: $e');
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

  Future<ApiResponse<Map<String, dynamic>>> getSessionDetails(
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
            'attendances': (data['attendances'] as List?)
                    ?.map((item) => Attendance.fromJson(item))
                    .toList() ??
                [],
            'students': (data['students'] as List?)
                    ?.map((item) => User.fromJson(item))
                    .toList() ??
                [],
          };
        },
      );
    } catch (e) {
      _logger.e('Get session details error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ CLASS MANAGEMENT METHODS ============
  // Based on: /classes routes

  Future<ApiResponse<List<ClassData>>> getClasses({
    String? name,
    String? status,
    String? year,
    int? page,
    int? limit,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (name != null) queryParams['name'] = name;
      if (status != null) queryParams['status'] = status;
      if (year != null) queryParams['year'] = year;
      if (page != null) queryParams['page'] = page.toString();
      if (limit != null) queryParams['limit'] = limit.toString();

      final response = await _makeRequest(
        'GET',
        '/classes',
        queryParams: queryParams,
      );

      return _handleResponse<List<ClassData>>(
        response,
        (data) {
          final List<dynamic> classesList;
          classesList = data['classes'] ?? data['data'] ?? [];
          return classesList.map((item) => ClassData.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get classes error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> createClass({
    required String name,
    String? description,
    String? year,
  }) async {
    try {
      final response = await _makeRequest('POST', '/classes', body: {
        'name': name,
        if (description != null) 'description': description,
        if (year != null) 'year': year,
      });
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Create class error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> updateClass(
      int id, Map<String, dynamic> classData) async {
    try {
      final response =
          await _makeRequest('PUT', '/classes/$id', body: classData);
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
          final List<dynamic> studentsList;
          studentsList = data['students'] ?? data['data'] ?? [];
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
  }) async {
    try {
      final response =
          await _makeRequest('POST', '/classes/$classId/students', body: {
        'student_id': studentId,
      });
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
      final response =
          await _makeRequest('DELETE', '/classes/$classId/students/$studentId');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Remove student from class error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ SUBJECT MANAGEMENT METHODS ============
  // Based on: /subjects routes

  Future<ApiResponse<List<Subject>>> getSubjects() async {
    try {
      final response = await _makeRequest('GET', '/subjects');
      return _handleResponse<List<Subject>>(
        response,
        (data) {
          final List<dynamic> subjectsList;
          subjectsList = data['subjects'] ?? data['data'] ?? [];
          return subjectsList.map((item) => Subject.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get subjects error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> createSubject({
    required String name,
    String? description,
    String? code,
  }) async {
    try {
      final response = await _makeRequest('POST', '/subjects', body: {
        'name': name,
        if (description != null) 'description': description,
        if (code != null) 'code': code,
      });
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Create subject error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> updateSubject(
      int id, Map<String, dynamic> subjectData) async {
    try {
      final response =
          await _makeRequest('PUT', '/subjects/$id', body: subjectData);
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

  // ============ SCHEDULE MANAGEMENT METHODS ============
  // Based on: /schedules routes

  Future<ApiResponse<List<Schedule>>> getSchedules() async {
    try {
      final response = await _makeRequest('GET', '/schedules');
      return _handleResponse<List<Schedule>>(
        response,
        (data) {
          final List<dynamic> schedulesList;
          schedulesList = data['schedules'] ?? data['data'] ?? [];
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
    required String dayOfWeek,
    required String startTime,
    required String endTime,
    String? location,
  }) async {
    try {
      final response = await _makeRequest('POST', '/schedules', body: {
        'class_id': classId,
        'subject_id': subjectId,
        'teacher_id': teacherId,
        'day_of_week': dayOfWeek,
        'start_time': startTime,
        'end_time': endTime,
        if (location != null) 'location': location,
      });
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Create schedule error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> updateSchedule({
    required int id,
    int? classId,
    int? subjectId,
    int? teacherId,
    String? dayOfWeek,
    String? startTime,
    String? endTime,
    String? location,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (classId != null) body['class_id'] = classId;
      if (subjectId != null) body['subject_id'] = subjectId;
      if (teacherId != null) body['teacher_id'] = teacherId;
      if (dayOfWeek != null) body['day_of_week'] = dayOfWeek;
      if (startTime != null) body['start_time'] = startTime;
      if (endTime != null) body['end_time'] = endTime;
      if (location != null) body['location'] = location;

      final response = await _makeRequest('PUT', '/schedules/$id', body: body);
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Update schedule error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> deleteSchedule(int id) async {
    try {
      final response = await _makeRequest('DELETE', '/schedules/$id');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Delete schedule error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getScheduleOptions() async {
    try {
      final response = await _makeRequest('GET', '/schedules/options');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Get schedule options error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<List<Schedule>>> getWeeklySchedule() async {
    try {
      final response = await _makeRequest('GET', '/schedules/weekly');
      return _handleResponse<List<Schedule>>(
        response,
        (data) {
          final List<dynamic> schedulesList;
          schedulesList = data['schedules'] ?? data['data'] ?? [];
          return schedulesList.map((item) => Schedule.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get weekly schedule error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ ADMIN METHODS ============
  // Based on: /admin routes

  Future<ApiResponse<List<User>>> getUsers({
    String? role,
    int? page,
    int? limit,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (role != null) queryParams['role'] = role;
      if (page != null) queryParams['page'] = page.toString();
      if (limit != null) queryParams['limit'] = limit.toString();

      final response = await _makeRequest(
        'GET',
        '/admin/users',
        queryParams: queryParams,
      );

      return _handleResponse<List<User>>(
        response,
        (data) {
          final List<dynamic> usersList;
          usersList = data['users'] ?? data['data'] ?? [];
          return usersList.map((item) => User.fromJson(item)).toList();
        },
      );
    } catch (e) {
      _logger.e('Get users error: $e');
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
      final response =
          await _makeRequest('PUT', '/admin/users/$id', body: userData);
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
          'PUT', '/admin/users/$userId/reset-password',
          body: {
            'new_password': newPassword,
          });
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Reset user password error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> getStatistics({
    String? startDate,
    String? endDate,
    int? classId,
    int? subjectId,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;
      if (classId != null) queryParams['class_id'] = classId.toString();
      if (subjectId != null) queryParams['subject_id'] = subjectId.toString();

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
    String? startDate,
    String? endDate,
    int? classId,
    int? subjectId,
    int? studentId,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;
      if (classId != null) queryParams['class_id'] = classId.toString();
      if (subjectId != null) queryParams['subject_id'] = subjectId.toString();
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

  Future<bool> checkNetworkConnectivity() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (e) {
      _logger.w('Network connectivity check failed: $e');
      return false;
    }
  }

  Future<ApiResponse<Map<String, dynamic>>> testConnection() async {
    try {
      // First check basic connectivity
      final isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        return ApiResponse.error(
            'Unable to connect to server. Please check your internet connection and server status.');
      }

      final response = await _makeRequest('GET', '/');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Test connection error: $e');
      return ApiResponse.error('Network error: $e');
    }
  }

  // ============ ASSIGNMENT ENDPOINTS ============

  Future<ApiResponse<List<Assignment>>> getStudentAssignments(
      int courseSectionId) async {
    try {
      final response =
          await _makeRequest('GET', '/assignments/student/$courseSectionId');

      return _handleListResponse<Assignment>(
        response,
        (json) => Assignment.fromJson(json),
      );
    } catch (e) {
      _logger.e('Error getting student assignments: $e');
      return ApiResponse.error('Failed to get assignments: ${e.toString()}');
    }
  }

  /// Get student submissions
  Future<ApiResponse<List<AssignmentSubmission>>> getStudentSubmissions(
      int studentId) async {
    try {
      final response = await _makeRequest(
          'GET', '/assignments/submissions/student/$studentId');

      return _handleListResponse<AssignmentSubmission>(
        response,
        (json) => AssignmentSubmission.fromJson(json),
      );
    } catch (e) {
      _logger.e('Error getting student submissions: $e');
      return ApiResponse.error('Failed to get submissions: $e');
    }
  }

  /// Submit assignment with file upload
  Future<ApiResponse<AssignmentSubmission>> submitAssignment({
    required int assignmentId,
    required int studentId,
    String? submissionText,
    File? attachmentFile,
  }) async {
    try {
      if (attachmentFile != null) {
        // Submit with file upload
        final request = http.MultipartRequest(
          'POST',
          Uri.parse('$baseUrl/assignments/submit'),
        );

        // Add headers
        final token = _authService.currentToken;
        if (token != null) {
          request.headers['Authorization'] = 'Bearer $token';
        }

        // Add fields
        request.fields['assignment_id'] = assignmentId.toString();
        request.fields['student_id'] = studentId.toString();
        if (submissionText != null) {
          request.fields['submission_text'] = submissionText;
        }

        // Add file
        final mimeType =
            lookupMimeType(attachmentFile.path) ?? 'application/octet-stream';
        final multipartFile = await http.MultipartFile.fromPath(
          'attachment',
          attachmentFile.path,
          contentType: MediaType.parse(mimeType),
        );
        request.files.add(multipartFile);

        final streamedResponse = await request.send();
        final response = await http.Response.fromStream(streamedResponse);

        return _handleResponse<AssignmentSubmission>(response, (json) {
          return AssignmentSubmission.fromJson(json);
        });
      } else {
        // Submit without file
        final data = {
          'assignment_id': assignmentId,
          'student_id': studentId,
          'submission_text': submissionText,
        };

        final response = await _makeRequest(
          'POST',
          '/assignments/submit',
          body: data,
        );

        return _handleResponse<AssignmentSubmission>(response, (json) {
          return AssignmentSubmission.fromJson(json);
        });
      }
    } catch (e) {
      _logger.e('Error submitting assignment: $e');
      return ApiResponse.error('Failed to submit assignment: $e');
    }
  }

  /// Get assignment submission by assignment and student
  Future<ApiResponse<AssignmentSubmission>> getAssignmentSubmission(
    int assignmentId,
    int studentId,
  ) async {
    try {
      final response = await _makeRequest(
        'GET',
        '/assignments/$assignmentId/submissions/$studentId',
      );

      return _handleResponse<AssignmentSubmission>(response, (json) {
        return AssignmentSubmission.fromJson(json);
      });
    } catch (e) {
      _logger.e('Error getting assignment submission: $e');
      return ApiResponse.error('Failed to get assignment submission: $e');
    }
  }

  /// Get assignment details
  Future<ApiResponse<Assignment>> getAssignmentDetails(int assignmentId) async {
    try {
      final response = await _makeRequest(
        'GET',
        '/assignments/$assignmentId',
      );

      return _handleResponse<Assignment>(response, (json) {
        return Assignment.fromJson(json);
      });
    } catch (e) {
      _logger.e('Error getting assignment details: $e');
      return ApiResponse.error('Failed to get assignment details: $e');
    }
  }

  // ============ QUIZ ENDPOINTS ============

  /// Get quizzes for student by course section
  Future<ApiResponse<List<Quiz>>> getStudentQuizzes(int courseSectionId) async {
    try {
      final response =
          await _makeRequest('GET', '/quizzes/student/$courseSectionId');
      return _handleResponse<List<Quiz>>(response, (jsonList) {
        return (jsonList as List).map((json) => Quiz.fromJson(json)).toList();
      });
    } catch (e) {
      _logger.e('Error getting student quizzes: $e');
      return ApiResponse.error('Failed to get quizzes: $e');
    }
  }

  /// Start quiz attempt
  Future<ApiResponse<QuizAttempt>> startQuizAttempt({
    required int quizId,
    required int studentId,
  }) async {
    try {
      final data = {'quiz_id': quizId, 'student_id': studentId};
      final response = await _makeRequest('POST', '/quizzes/start', body: data);
      return _handleResponse<QuizAttempt>(
          response, (json) => QuizAttempt.fromJson(json));
    } catch (e) {
      _logger.e('Error starting quiz attempt: $e');
      return ApiResponse.error('Failed to start quiz: $e');
    }
  }

  /// Submit quiz attempt
  Future<ApiResponse<QuizAttempt>> submitQuizAttempt({
    required int attemptId,
    required Map<String, dynamic> answers,
  }) async {
    try {
      final data = {'attempt_id': attemptId, 'answers': answers};
      final response =
          await _makeRequest('POST', '/quizzes/submit', body: data);
      return _handleResponse<QuizAttempt>(
          response, (json) => QuizAttempt.fromJson(json));
    } catch (e) {
      _logger.e('Error submitting quiz attempt: $e');
      return ApiResponse.error('Failed to submit quiz: $e');
    }
  }

  /// Get quiz attempt details
  Future<ApiResponse<QuizAttempt>> getQuizAttempt(int attemptId) async {
    try {
      final response =
          await _makeRequest('GET', '/quizzes/attempts/$attemptId');
      return _handleResponse<QuizAttempt>(
          response, (json) => QuizAttempt.fromJson(json));
    } catch (e) {
      _logger.e('Error getting quiz attempt: $e');
      return ApiResponse.error('Failed to get quiz attempt: $e');
    }
  }

  // ============ COURSE SECTION ENDPOINTS ============

  /// Get course sections for student
  /// Get course sections for student
  Future<ApiResponse<List<CourseSection>>> getStudentCourseSections(
      int studentId) async {
    try {
      final response =
          await _makeRequest('GET', '/course-sections/student/$studentId');

      return _handleResponse<List<CourseSection>>(
        response,
        (data) {
          // Lấy danh sách course_sections từ response
          final List<dynamic> sectionsList = data['course_sections'] ?? [];
          return sectionsList
              .map((item) =>
                  CourseSection.fromJson(item as Map<String, dynamic>))
              .toList();
        },
      );
    } catch (e) {
      _logger.e('Error getting student course sections: $e');
      return ApiResponse.error('Failed to get course sections: $e');
    }
  }

  /// Get all course sections
  Future<ApiResponse<List<CourseSection>>> getCourseSections() async {
    try {
      final response = await _makeRequest('GET', '/course-sections');

      return _handleListResponse<CourseSection>(
        response,
        (json) => CourseSection.fromJson(json),
      );
    } catch (e) {
      _logger.e('Error getting course sections: $e');
      return ApiResponse.error('Failed to get course sections: $e');
    }
  }

  /// Get course section details
  Future<ApiResponse<CourseSection>> getCourseSectionDetails(
      int courseSectionId) async {
    try {
      final response =
          await _makeRequest('GET', '/course-sections/$courseSectionId');

      return _handleResponse<CourseSection>(
        response,
        (json) => CourseSection.fromJson(json),
      );
    } catch (e) {
      _logger.e('Error getting course section details: $e');
      return ApiResponse.error('Failed to get course section details: $e');
    }
  }

  // ============ EXAM ENDPOINTS ============

  /// Get exams for student by course section
  Future<ApiResponse<List<Exam>>> getStudentExams(int courseSectionId) async {
    try {
      // Get current user info to get student ID
      final currentUser = _authService.currentUser;
      Map<String, String>? queryParams;

      if (currentUser?.role == 'student') {
        // For students, the backend will use req.user.id automatically
        queryParams = null;
      } else {
        // For non-students (teachers/admin), need to provide studentId
        // This case shouldn't happen in student screens, but adding for completeness
        _logger.w('Non-student user trying to get student exams');
      }

      final response = await _makeRequest(
        'GET',
        '/exams/student/$courseSectionId',
        queryParams: queryParams,
      );

      return _handleListResponse<Exam>(
        response,
        (json) => Exam.fromJson(json),
      );
    } catch (e) {
      _logger.e('Error getting student exams: $e');
      return ApiResponse.error('Failed to get exams: $e');
    }
  }

  /// Get student exam result for specific exam
  Future<ApiResponse<ExamResult>> getStudentExamResult({
    required int examId,
    int? studentId, // Optional for teachers to check other students
  }) async {
    try {
      final queryParams = <String, String>{};
      if (studentId != null) {
        queryParams['studentId'] = studentId.toString();
      }

      final response = await _makeRequest(
        'GET',
        '/exams/$examId/result',
        queryParams: queryParams,
      );

      return _handleResponse<ExamResult>(
        response,
        (json) => ExamResult.fromJson(json),
      );
    } catch (e) {
      _logger.e('Error getting student exam result: $e');
      return ApiResponse.error('Failed to get exam result: $e');
    }
  }

  /// Start exam attempt
  Future<ApiResponse<ExamResult>> startExamAttempt({
    required int examId,
    required int studentId,
  }) async {
    try {
      final response = await _makeRequest('POST', '/exams/$examId/start');
      return _handleResponse<ExamResult>(response, (json) {
        if (json.containsKey('result_id')) {
          // Backend trả về result_id + exam + questions
          final examJson = json['exam'] ?? {};
          return ExamResult(
            id: json['result_id'],
            examId: examJson['id'] ?? examId,
            studentId: studentId,
            score: 0.0,
            totalScore:
                double.tryParse(examJson['max_score']?.toString() ?? '0') ??
                    0.0,
            status: 'in_progress',
            startTime: DateTime.now(),
            endTime: null,
            submittedAt: null,
            gradedAt: null,
            gradedBy: null,
            answers: [], // chưa có câu trả lời khi bắt đầu
            exam: examJson.isNotEmpty ? Exam.fromJson(examJson) : null,
          );
        } else {
          // Trường hợp API trả về đúng chuẩn ExamResult
          return ExamResult.fromJson(json);
        }
      });
    } catch (e) {
      _logger.e('Error starting exam attempt: $e');
      return ApiResponse.error('Failed to start exam: $e');
    }
  }

  //Lấy các bài kiểm tra theo học phần /exams/course-section/{courseSectionId}
  Future<ApiResponse<List<Exam>>> getExamsByCourseSection(
      int courseSectionId) async {
    try {
      final response =
          await _makeRequest('GET', '/exams/course-section/$courseSectionId');

      return _handleListResponse<Exam>(
        response,
        (json) => Exam.fromJson(json),
      );
    } catch (e) {
      _logger.e('Error getting exams by course section: $e');
      return ApiResponse.error('Failed to get exams: $e');
    }
  }

  /// Submit exam attempt (sử dụng resultId từ startExamAttempt)
  Future<ApiResponse<ExamResult>> submitExamAttempt({
    required int resultId, // Thay examId bằng resultId
    required List<ExamAnswer> answers,
  }) async {
    try {
      final data = {
        'answers': answers
            .map((answer) => {
                  'question_id': answer.questionId,
                  'student_answer': answer.studentAnswer,
                })
            .toList(),
      };

      // Sử dụng đúng endpoint từ backend
      final response = await _makeRequest(
          'POST', '/exams/results/$resultId/submit',
          body: data);
      return _handleResponse<ExamResult>(
          response, (json) => ExamResult.fromJson(json));
    } catch (e) {
      _logger.e('Error submitting exam attempt: $e');
      return ApiResponse.error('Failed to submit exam: $e');
    }
  }

  /// Get exam details
  Future<ApiResponse<Exam>> getExamDetails(int examId) async {
    try {
      final response = await _makeRequest(
        'GET',
        '/exams/$examId',
      );

      return _handleResponse<Exam>(response, (json) {
        return Exam.fromJson(json);
      });
    } catch (e) {
      _logger.e('Error getting exam details: $e');
      return ApiResponse.error('Failed to get exam details: $e');
    }
  }

  /// Save individual exam answer
  Future<ApiResponse<Map<String, dynamic>>> saveExamAnswer({
    required int resultId,
    required int questionId,
    required String studentAnswer,
  }) async {
    try {
      final data = {
        'question_id': questionId,
        'student_answer': studentAnswer,
      };

      final response = await _makeRequest(
        'POST',
        '/exams/results/$resultId/answer',
        body: data,
      );

      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Error saving exam answer: $e');
      return ApiResponse.error('Failed to save answer: $e');
    }
  }

  /// Check exam time limit
  Future<ApiResponse<Map<String, dynamic>>> checkExamTimeLimit({
    required int resultId,
    required int durationMinutes,
  }) async {
    try {
      final response = await _makeRequest(
        'GET',
        '/exams/results/$resultId/time-check',
        queryParams: {'duration_minutes': durationMinutes.toString()},
      );

      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Error checking exam time limit: $e');
      return ApiResponse.error('Failed to check time limit: $e');
    }
  }

  /// Get exam statistics (for teachers)
  Future<ApiResponse<Map<String, dynamic>>> getExamStatistics(
      int examId) async {
    try {
      final response = await _makeRequest('GET', '/exams/$examId/statistics');
      return _handleResponse<Map<String, dynamic>>(response, null);
    } catch (e) {
      _logger.e('Error getting exam statistics: $e');
      return ApiResponse.error('Failed to get exam statistics: $e');
    }
  }

  /// Get ungraded exams (for teachers)
  Future<ApiResponse<List<ExamResult>>> getUngradedExams() async {
    try {
      final response = await _makeRequest('GET', '/exams/ungraded');
      return _handleListResponse<ExamResult>(
        response,
        (json) => ExamResult.fromJson(json),
      );
    } catch (e) {
      _logger.e('Error getting ungraded exams: $e');
      return ApiResponse.error('Failed to get ungraded exams: $e');
    }
  }

  /// Grade exam manually (for teachers)
  Future<ApiResponse<ExamResult>> gradeExam({
    required int resultId,
    double? score,
    List<Map<String, dynamic>>? grades,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (score != null) data['score'] = score;
      if (grades != null) data['grades'] = grades;

      final response = await _makeRequest(
        'POST',
        '/exams/results/$resultId/grade',
        body: data,
      );

      return _handleResponse<ExamResult>(
        response,
        (json) => ExamResult.fromJson(json),
      );
    } catch (e) {
      _logger.e('Error grading exam: $e');
      return ApiResponse.error('Failed to grade exam: $e');
    }
  }

  // Helper method to get user-friendly error messages
  String _getUserFriendlyErrorMessage(String error) {
    if (error.contains('SocketException') ||
        error.contains('NetworkException')) {
      return 'No internet connection. Please check your network settings.';
    } else if (error.contains('TimeoutException')) {
      return 'Request timeout. Please try again.';
    } else if (error.contains('FormatException')) {
      return 'Invalid server response format.';
    } else if (error.contains('HandshakeException')) {
      return 'SSL/TLS connection error. Please check server configuration.';
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }
}
