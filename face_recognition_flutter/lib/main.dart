// lib/main.dart
// ignore: unused_import
import 'package:face_attendance/services/api_service.dart';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:logger/logger.dart';
// ignore: unused_import
import 'package:shared_preferences/shared_preferences.dart'; // Mặc dù không trực tiếp dùng ở đây, nhưng AuthService dùng nó
import 'screens/login_screen.dart';
import 'screens/student/student_dashboard.dart';
import 'screens/teacher/teacher_dashboard.dart';
import 'screens/admin/admin_dashboard.dart';
import 'services/auth_service.dart';
import 'models/models.dart'; // Đảm bảo đã import các models như UserRole, User

// Biến toàn cục để lưu trữ danh sách các camera có sẵn
List<CameraDescription> cameras = [];
final Logger _logger = Logger(); // Khai báo Logger ở ngoài để dùng chung

Future<void> main() async {
  // Đảm bảo Flutter binding đã được khởi tạo trước khi gọi các plugin
  WidgetsFlutterBinding.ensureInitialized();

  try {
    // Khởi tạo danh sách camera có sẵn
    cameras = await availableCameras();
  } on CameraException catch (e) {
    _logger.e('Lỗi khi khởi tạo camera: $e');
  } 

  // Chạy ứng dụng Flutter
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  // Widget ban đầu sẽ hiển thị (ví dụ: màn hình loading)
  Widget _initialScreen = const Center(child: CircularProgressIndicator());

  @override
  void initState() {
    super.initState();
    // Kiểm tra trạng thái đăng nhập khi ứng dụng khởi động
    _checkLoginStatus();
  }

  /// Phương thức kiểm tra trạng thái đăng nhập và xác định màn hình khởi đầu
  Future<void> _checkLoginStatus() async {
    final authService = AuthService(); // Lấy thể hiện của AuthService
    final isLoggedIn =
        authService.isLoggedIn; // Truy cập getter isLoggedIn qua thể hiện
    if (isLoggedIn) {
      final userRole = authService.userRole; // Truy cập userRole qua thể hiện
      final userId = authService.userId; // Truy cập userId qua thể hiện

      if (userId == null || userRole == null) {
        // Nếu đã đăng nhập nhưng thiếu thông tin cần thiết, quay về LoginScreen
        _initialScreen = const LoginScreen();
        await authService.logout();
        _logger.w(
            'Thiếu thông tin người dùng sau khi đăng nhập, điều hướng về Login.');
        setState(() {}); // Cập nhật UI
        return;
      }

      switch (userRole) {
        case UserRole.student:
          _initialScreen = StudentDashboardScreen(userId: userId);
          break;
        case UserRole.teacher:
          _initialScreen = TeacherDashboardScreen(teacherId: userId);
          break;
        case UserRole.admin:
          _initialScreen = const AdminDashboardScreen();
          break;
      }
    } else {
      // Nếu chưa đăng nhập, hiển thị LoginScreen
      _logger.w('Unknown user role: ${authService.userRole}. Showing error dialog.');
      _initialScreen = const LoginScreen();
    }

    // Cập nhật trạng thái để Flutter rebuild widget và hiển thị màn hình chính xác
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Face Attendance App',
      debugShowCheckedModeBanner: false, // Tắt banner debug
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.blueAccent, // Màu mặc định cho AppBar
          foregroundColor: Colors.white, // Màu chữ và icon trên AppBar
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blueAccent,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ),
      // Sử dụng _initialScreen làm home widget
      home: _initialScreen,
      // Bạn có thể thêm các named routes ở đây nếu muốn sử dụng chúng
      routes: {
        '/login': (context) => const LoginScreen(),
        '/student_dashboard': (context) => StudentDashboardScreen(userId: ModalRoute.of(context)!.settings.arguments as int),
        '/teacher_dashboard': (context) => TeacherDashboardScreen(teacherId: ModalRoute.of(context)!.settings.arguments as int),
        '/admin_dashboard': (context) => const AdminDashboardScreen(),
      },
    );
  }
}
