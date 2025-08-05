// lib/utils/constants.dart

class ApiConstants {
  // Base URL for your FastAPI backend
  // IMPORTANT: Replace with your actual backend URL if not running locally
  // For Android Emulator, 'http://10.0.2.2:8000' maps to your host machine's localhost.
  // For iOS Simulator/Physical Device, use 'http://localhost:8000' or your machine's IP address.
  // Example for a deployed server: 'https://your-domain.com'
  static const String baseUrl = 'http://10.0.2.2:8000';

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
  static const String defaultErrorMessage = 'An unexpected error occurred. Please try again.';
  static const Duration apiTimeout = Duration(seconds: 30);
}

// You can define other constants as needed, e.g.,
// class SharedPreferencesKeys {
//   static const String authToken = 'authToken';
//   static const String userId = 'userId';
// }

// If you have specific roles or statuses that need string representation in the UI
// class UserRoles {
//   static const String student = 'student';
//   static const String teacher = 'teacher';
//   static const String admin = 'admin';
// }
