// lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'student/student_dashboard.dart';
import 'teacher/teacher_dashboard.dart';
// import 'admin_dashboard_screen.dart'; // Màn hình admin dashboard

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final Logger _logger = Logger();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  /// Phương thức xử lý logic đăng nhập
  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final request = LoginRequest(
        email: _emailController.text,
        password: _passwordController.text,
      );

      final response = await ApiService().login(request);

      if (response.success && response.data != null) {
        _logger.i('Đăng nhập thành công. Token: ${response.data!.accessToken}');

        // Lưu token vào AuthService
        await AuthService().saveLoginData(response.data!);

        // Lấy thông tin profile để xác định vai trò
        final profileResponse = await ApiService().getProfile();
        if (profileResponse.success && profileResponse.data != null) {
          final user = profileResponse.data!;
          _logger.i('User logged in: ${user.fullName}, Role: ${user.role}');

          _navigateToDashboard(user);
        } else {
          _showSnackBar(profileResponse.message, Colors.red);
        }
      } else {
        _showSnackBar(response.message, Colors.red);
      }
    } catch (e) {
      _logger.e('Lỗi đăng nhập: $e');
      _showSnackBar('Lỗi mạng. Vui lòng thử lại.', Colors.red);
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  /// Điều hướng đến màn hình dashboard phù hợp
  void _navigateToDashboard(User user) {
    if (user.role == 'student') {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
            builder: (context) => StudentDashboardScreen(userId: user.id)),
      );
    } else if (user.role == 'teacher') {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
            builder: (context) => TeacherDashboardScreen(teacherId: user.id)),
      );
    } else if (user.role == 'admin') {
      // TODO: Điều hướng đến màn hình AdminDashboard
      // Navigator.of(context).pushReplacement(
      //   MaterialPageRoute(builder: (context) => AdminDashboardScreen()),
      // );
      _showSnackBar('Đăng nhập thành công với quyền Admin', Colors.green);
    }
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(
                  Icons.lock_person_sharp,
                  size: 100,
                  color: Colors.blueAccent,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Đăng nhập',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.blueAccent,
                  ),
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.email),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Vui lòng nhập email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.lock),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Vui lòng nhập mật khẩu';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : ElevatedButton(
                        onPressed: _login,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueAccent,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Đăng nhập',
                          style: TextStyle(fontSize: 18, color: Colors.white),
                        ),
                      ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
