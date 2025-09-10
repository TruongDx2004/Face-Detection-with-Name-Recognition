// lib/screens/student/student_dashboard.dart
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../models/models.dart';
import '../../models/attendance_models.dart';
import '../../services/api_service.dart';
import '../../utils/logout_helper.dart' as logout_helper;
import 'face_capture_screen.dart';
import 'student_schedule.dart';
import 'student_assignment_screen.dart';

class StudentDashboard extends StatefulWidget {
  final int userId;
  final String userName;

  const StudentDashboard({
    super.key, 
    required this.userId,
    required this.userName,
  });

  @override
  State<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> {
  final Logger _logger = Logger();
  
  late Future<List<AttendanceSession>> _activeSessionsFuture;
  late Future<List<Attendance>> _attendanceHistoryFuture;
  late Future<List<Schedule>> _schedulesFuture;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  void _refreshData() {
    setState(() {
      _activeSessionsFuture = _fetchActiveSessions();
      _attendanceHistoryFuture = _fetchAttendanceHistory();
      _schedulesFuture = _fetchSchedules();
    });
  }

  Future<List<AttendanceSession>> _fetchActiveSessions() async {
    try {
      final response = await ApiService().getActiveSessions();
      if (response.success) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch active sessions: ${response.message}');
        return [];
      }
    } catch (e) {
      _logger.e('Error fetching active sessions: $e');
      return [];
    }
  }

  Future<List<Attendance>> _fetchAttendanceHistory() async {
    try {
      final response = await ApiService().getMyAttendance();
      if (response.success) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch attendance history: ${response.message}');
        return [];
      }
    } catch (e) {
      _logger.e('Error fetching attendance history: $e');
      return [];
    }
  }

  Future<List<Schedule>> _fetchSchedules() async {
    try {
      final response = await ApiService().getSchedules();
      if (response.success) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch schedules: ${response.message}');
        return [];
      }
    } catch (e) {
      _logger.e('Error fetching schedules: $e');
      return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            _refreshData();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                const SizedBox(height: 24),
                _buildQuickStats(),
                const SizedBox(height: 24),
                _buildMainFeatures(),
                const SizedBox(height: 24),
                _buildRecentActivity(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF667eea), Color(0xFF764ba2)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF667eea).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(30),
            ),
            child: const Icon(
              Icons.person,
              color: Colors.white,
              size: 30,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Xin chào!',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  widget.userName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Học sinh',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => logout_helper.logout(context),
            icon: const Icon(
              Icons.logout,
              color: Colors.white,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStats() {
    return FutureBuilder<List<dynamic>>(
      future: Future.wait([
        _activeSessionsFuture,
        _attendanceHistoryFuture,
        _schedulesFuture,
      ]),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildStatsLoading();
        }

        final activeSessions = snapshot.data?[0] as List<AttendanceSession>? ?? [];
        final attendanceHistory = snapshot.data?[1] as List<Attendance>? ?? [];
        final schedules = snapshot.data?[2] as List<Schedule>? ?? [];

        // Tính toán thống kê
        final totalSubjects = schedules.length;
        final attendanceRate = attendanceHistory.isEmpty 
            ? 0.0 
            : (attendanceHistory.where((a) => a.status == AttendanceStatus.present).length / attendanceHistory.length * 100);
        final pendingSessions = activeSessions.length;

        return Row(
          children: [
            Expanded(
              child: _buildStatCard(
                icon: Icons.book,
                title: 'Môn học',
                value: totalSubjects.toString(),
                color: const Color(0xFF4CAF50),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                icon: Icons.check_circle,
                title: 'Tỷ lệ điểm danh',
                value: '${attendanceRate.toStringAsFixed(1)}%',
                color: const Color(0xFF2196F3),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                icon: Icons.schedule,
                title: 'Phiên chờ',
                value: pendingSessions.toString(),
                color: const Color(0xFFFF9800),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatsLoading() {
    return Row(
      children: [
        Expanded(child: _buildStatCardLoading()),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCardLoading()),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCardLoading()),
      ],
    );
  }

  Widget _buildStatCardLoading() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: 40,
            height: 16,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(height: 4),
          Container(
            width: 60,
            height: 12,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(6),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(
            icon,
            color: color,
            size: 24,
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildMainFeatures() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Chức năng chính',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2D3748),
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.1,
          children: [
            _buildFeatureCard(
              icon: Icons.schedule,
              title: 'Lịch học',
              subtitle: 'Xem thời khóa biểu',
              color: const Color(0xFF667eea),
              onTap: () => _navigateToSchedule(),
            ),
            _buildFeatureCard(
              icon: Icons.face,
              title: 'Điểm danh',
              subtitle: 'Điểm danh khuôn mặt',
              color: const Color(0xFF4CAF50),
              onTap: () => _navigateToAttendance(),
            ),
            _buildFeatureCard(
              icon: Icons.assignment,
              title: 'Bài tập',
              subtitle: 'Quản lý bài tập',
              color: const Color(0xFFFF9800),
              onTap: () => _navigateToAssignments(),
            ),
            _buildFeatureCard(
              icon: Icons.grade,
              title: 'Điểm số',
              subtitle: 'Xem kết quả học tập',
              color: const Color(0xFFE91E63),
              onTap: () => _navigateToGrades(),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFeatureCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.1),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(25),
              ),
              child: Icon(
                icon,
                color: color,
                size: 28,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2D3748),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontWeight: FontWeight.w400,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentActivity() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Hoạt động gần đây',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2D3748),
              ),
            ),
            TextButton(
              onPressed: () => _navigateToAttendanceHistory(),
              child: const Text(
                'Xem tất cả',
                style: TextStyle(
                  color: Color(0xFF667eea),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        FutureBuilder<List<Attendance>>(
          future: _attendanceHistoryFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _buildActivityLoading();
            }

            if (snapshot.hasError) {
              return _buildActivityError();
            }

            final attendanceList = snapshot.data ?? [];
            if (attendanceList.isEmpty) {
              return _buildEmptyActivity();
            }

            // Lấy 3 hoạt động gần đây nhất
            final recentActivities = attendanceList.take(3).toList();

            return Column(
              children: recentActivities
                  .map((attendance) => _buildActivityItem(attendance))
                  .toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _buildActivityLoading() {
    return Column(
      children: List.generate(
        3,
        (index) => Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 120,
                      height: 16,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: 80,
                      height: 12,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActivityError() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(
            Icons.error_outline,
            color: Colors.grey[400],
            size: 48,
          ),
          const SizedBox(height: 12),
          Text(
            'Không thể tải hoạt động',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyActivity() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(
            Icons.history,
            color: Colors.grey[400],
            size: 48,
          ),
          const SizedBox(height: 12),
          Text(
            'Chưa có hoạt động nào',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityItem(Attendance attendance) {
    final isPresent = attendance.status == AttendanceStatus.present;
    final statusColor = isPresent ? const Color(0xFF4CAF50) : const Color(0xFFFF5722);
    final statusIcon = isPresent ? Icons.check_circle : Icons.cancel;
    final statusText = isPresent ? 'Có mặt' : 'Vắng mặt';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(
              statusIcon,
              color: statusColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Điểm danh - ${attendance.sessionName ?? 'Phiên ${attendance.sessionId}'}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2D3748),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  attendance.attendanceTime.toString().split(' ')[0],
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              statusText,
              style: TextStyle(
                fontSize: 12,
                color: statusColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Navigation methods
  void _navigateToSchedule() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => StudentScheduleScreen(userId: widget.userId),
      ),
    );
  }

  void _navigateToAttendance() {
    // Navigate to active sessions for attendance
    _activeSessionsFuture.then((sessions) {
      if (sessions.isNotEmpty) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => FaceCaptureScreen(
              userId: widget.userId,
              sessionId: sessions.first.id,
              onFaceTrained: _refreshData,
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Hiện tại không có phiên điểm danh nào đang hoạt động'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    });
  }

  void _navigateToAssignments() {
    // Điều hướng đến màn hình bài tập và kiểm tra
    _schedulesFuture.then((schedules) {
      if (schedules.isNotEmpty) {
        final firstSchedule = schedules.first;
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => StudentAssignmentScreen(
              userId: widget.userId,
              courseSectionId: firstSchedule.id,
              courseSectionName: firstSchedule.subjectName ?? 'Học phần',
            ),
          ),
        );
      } else {
        // Nếu không có schedule, sử dụng giá trị mặc định
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => StudentAssignmentScreen(
              userId: widget.userId,
              courseSectionId: 1,
              courseSectionName: 'Bài tập & Kiểm tra',
            ),
          ),
        );
      }
    }).catchError((error) {
      // Nếu có lỗi, vẫn điều hướng với giá trị mặc định
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => StudentAssignmentScreen(
            userId: widget.userId,
            courseSectionId: 1,
            courseSectionName: 'Bài tập & Kiểm tra',
          ),
        ),
      );
    });
  }

  void _navigateToGrades() {
    // Điều hướng đến màn hình bài tập và kiểm tra
    // Sử dụng courseSectionId mặc định hoặc lấy từ schedule đầu tiên
    _schedulesFuture.then((schedules) {
      if (schedules.isNotEmpty) {
        final firstSchedule = schedules.first;
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => StudentAssignmentScreen(
              userId: widget.userId,
              courseSectionId: firstSchedule.id, // Sử dụng schedule ID làm course section ID
              courseSectionName: firstSchedule.subjectName ?? 'Học phần',
            ),
          ),
        );
      } else {
        // Nếu không có schedule, sử dụng giá trị mặc định
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => StudentAssignmentScreen(
              userId: widget.userId,
              courseSectionId: 1, // Giá trị mặc định
              courseSectionName: 'Bài tập & Kiểm tra',
            ),
          ),
        );
      }
    }).catchError((error) {
      // Nếu có lỗi, vẫn điều hướng với giá trị mặc định
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => StudentAssignmentScreen(
            userId: widget.userId,
            courseSectionId: 1,
            courseSectionName: 'Bài tập & Kiểm tra',
          ),
        ),
      );
    });
  }

  void _navigateToAttendanceHistory() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => StudentScheduleScreen(userId: widget.userId),
      ),
    );
  }
}