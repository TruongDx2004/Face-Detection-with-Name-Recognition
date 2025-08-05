// lib/screens/admin_dashboard_screen.dart
import 'package:face_attendance/screens/admin/class_management_screen.dart';
import 'package:face_attendance/screens/admin/subject_schedule_management_screen.dart';
import 'package:face_attendance/screens/admin/user_management_screen.dart';
import 'package:face_attendance/screens/admin/session_attendance_management_screen.dart';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';

// TODO: Import các file cần thiết
// import 'package:face_attendance_app/utils/constants.dart';
// import 'package:face_attendance_app/services/api_service.dart';
// import 'package:face_attendance_app/models/statistics.dart'; // Giả sử bạn có model này

/// Màn hình bảng điều khiển dành cho Admin với nhiều chức năng hơn
class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  final Logger _logger = Logger();
  // Giả định đây là dữ liệu thống kê từ API
  late Future<Map<String, int>> _statisticsData;

  @override
  void initState() {
    super.initState();
    // Khởi tạo Future để lấy dữ liệu thống kê khi màn hình được tạo
    _statisticsData = _fetchStatistics();
  }

  /// TODO: Viết phương thức gọi API để lấy dữ liệu thống kê
  Future<Map<String, int>> _fetchStatistics() async {
    // try {
    //   final stats = await ApiService().getAdminStatistics();
    //   return stats;
    // } catch (e) {
    //   _logger.e('Error fetching statistics: $e');
    //   return {};
    // }

    // Dữ liệu giả lập cho mục đích demo
    await Future.delayed(const Duration(seconds: 2));
    return {
      'total_users': 150,
      'total_students': 120,
      'total_teachers': 25,
      'total_sessions': 500,
      'total_attendances': 15000,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bảng điều khiển Admin'),
        backgroundColor: Colors.blueAccent,
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(
          children: [
            // --- Thống kê hệ thống ---
            const Text(
              'Thống kê hệ thống',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            _buildStatisticsSection(),
            const SizedBox(height: 24),

            // --- Quản lý ---
            const Text(
              'Quản lý',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            _buildManagementCards(),
            const SizedBox(height: 24),

            // --- Cài đặt & Tiện ích ---
            const Text(
              'Cài đặt & Tiện ích',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            _buildUtilityCards(),
          ],
        ),
      ),
    );
  }

  /// Widget hiển thị phần thống kê
  Widget _buildStatisticsSection() {
    return FutureBuilder<Map<String, int>>(
      future: _statisticsData,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          return Center(child: Text('Lỗi: ${snapshot.error}'));
        } else if (snapshot.hasData) {
          final stats = snapshot.data!;
          return Wrap(
            spacing: 12.0,
            runSpacing: 12.0,
            children: [
              _buildStatCard(
                  'Tổng người dùng', stats['total_users'] ?? 0, Icons.people),
              _buildStatCard(
                  'Sinh viên', stats['total_students'] ?? 0, Icons.school),
              _buildStatCard(
                  'Giáo viên', stats['total_teachers'] ?? 0, Icons.person),
              _buildStatCard(
                  'Phiên điểm danh', stats['total_sessions'] ?? 0, Icons.event),
              _buildStatCard('Lượt điểm danh', stats['total_attendances'] ?? 0,
                  Icons.check_circle),
            ],
          );
        } else {
          return const Center(child: Text('Không có dữ liệu thống kê.'));
        }
      },
    );
  }

  /// Widget hiển thị các card chức năng quản lý
  Widget _buildManagementCards() {
    return Column(
      children: [
        _buildDashboardCard(
          context,
          icon: Icons.people_alt,
          title: 'Quản lý người dùng',
          subtitle: 'Thêm, sửa, xóa người dùng và phân quyền',
          onTap: () {
            _logger.i('Admin: Điều hướng đến trang Quản lý người dùng');
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => const UserManagementScreen(),
              ),
            );
          },
        ),       
        const SizedBox(height: 16),
        _buildDashboardCard(
          context,
          icon: Icons.event_note,
          title: 'Quản lý phiên điểm danh',
          subtitle: 'Xem và quản lý tất cả các phiên điểm danh của giáo viên',
          onTap: () {
            _logger.i('Admin: Điều hướng đến trang Quản lý phiên điểm danh');
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => const SessionAttendanceManagementScreen(),
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        _buildDashboardCard(
          context,
          icon: Icons.class_,
          title: 'Quản lý lớp học',
          subtitle: 'Xem, thêm và quản lý thông tin các lớp học',
          onTap: () {
            _logger.i('Admin: Điều hướng đến trang Quản lý lớp học');
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => const ClassManagementScreen(),
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        _buildDashboardCard(
          context,
          icon: Icons.schedule,
          title: 'Quản lý lịch học & môn học',
          subtitle: 'Quản lý môn học, thời khóa biểu cho các lớp',
          onTap: () {
            _logger.i('Admin: Điều hướng đến trang Quản lý lịch học & môn học');
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => const SubjectScheduleManagementScreen(),
              ),
            );
          },
        ),
      ],
    );
  }

  /// Widget hiển thị các card tiện ích
  Widget _buildUtilityCards() {
    return Column(
      children: [
        _buildDashboardCard(
          context,
          icon: Icons.face_retouching_natural,
          title: 'Quản lý ảnh khuôn mặt',
          subtitle: 'Xem và xóa các hình ảnh đã dùng để đào tạo',
          onTap: () {
            _logger.i('Admin: Điều hướng đến trang Quản lý ảnh khuôn mặt');
            // TODO: Chuyển hướng đến màn hình FaceImageManagementScreen
          },
        ),
        const SizedBox(height: 16),
        _buildDashboardCard(
          context,
          icon: Icons.model_training,
          title: 'Đào tạo lại mô hình',
          subtitle: 'Kích hoạt quá trình đào tạo lại mô hình nhận diện',
          onTap: () {
            _logger.i('Admin: Kích hoạt API đào tạo lại mô hình');
            // TODO: Gọi API để đào tạo lại mô hình
          },
        ),
        const SizedBox(height: 16),
        _buildDashboardCard(
          context,
          icon: Icons.settings,
          title: 'Cài đặt hệ thống',
          subtitle: 'Thay đổi các thông số cấu hình của hệ thống',
          onTap: () {
            _logger.i('Admin: Điều hướng đến trang Cài đặt hệ thống');
            // TODO: Chuyển hướng đến màn hình SystemSettingsScreen
          },
        ),
      ],
    );
  }

  /// Widget xây dựng Card chức năng cho Dashboard
  Widget _buildDashboardCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 4.0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12.0),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12.0),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Icon(icon, size: 40.0, color: Colors.blueAccent),
              const SizedBox(width: 16.0),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18.0,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4.0),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 14.0,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios,
                  size: 16.0, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }

  /// Widget xây dựng Card thống kê nhỏ
  Widget _buildStatCard(String title, int value, IconData icon) {
    return Card(
      elevation: 2.0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12.0),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 30, color: Colors.blueAccent),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.black54,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value.toString(),
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
