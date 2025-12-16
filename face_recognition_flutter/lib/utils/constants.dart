// lib/utils/constants.dart

class ApiConstants {
  // static const String baseUrl = 'http://10.0.2.2:8000';
  // static const String baseUrl = 'http://172.20.10.9:8000';
  static const String baseUrl = 'http://localhost:8000';
  // Auth Endpoints
  static const String login = '/auth/login';
  static const String profile = '/auth/profile';

  // Student Endpoints
  static const String registerFace = '/student/register-face';
  static const String submitAttendance = '/student/attendance';
  static const String attendanceHistory = '/student/attendance-history';
  static const String activeSessions = '/student/active-sessions';

  // Teacher Endpoints
  static const String createSession = '/teacher/create-session';
  // Note: The following endpoints require dynamic parameters in the path
  static const String closeSession = '/teacher/session'; // Requires /{session_id}/close
  static const String teacherSessions = '/teacher/sessions';
  static const String sessionAttendance = '/teacher/attendance'; // Requires /{session_id}

  // Admin Endpoints
  static const String adminUsers = '/admin/users';
  static const String adminStatistics = '/admin/statistics';
  static const String adminRetrainModel = '/admin/retrain-model';

  // Utility/Root Endpoint
  static const String root = '/'; // For testing connection
}

class AppConstants {
  static const String appName = 'Face Attendance System';
  static const String defaultErrorMessage = 'Có lỗi xảy ra, vui lòng thử lại.';
  static const Duration apiTimeout = Duration(seconds: 30);
}

