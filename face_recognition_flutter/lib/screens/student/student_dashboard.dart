// lib/screens/student_dashboard.dart
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../services/api_service.dart';
import 'face_capture_screen.dart';

class StudentDashboardScreen extends StatefulWidget {
  final int userId;

  const StudentDashboardScreen({super.key, required this.userId});

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen> {
  final Logger _logger = Logger();
  late Future<List<AttendanceSession>> _activeSessionsFuture;
  late Future<List<Attendance>> _attendanceHistoryFuture;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  /// Làm mới dữ liệu cho cả hai tab
  void _refreshData() {
    setState(() {
      _activeSessionsFuture = _fetchActiveSessions();
      _attendanceHistoryFuture = _fetchAttendanceHistory();
    });
  }

  /// Phương thức gọi API để lấy danh sách các phiên điểm danh đang hoạt động
  Future<List<AttendanceSession>> _fetchActiveSessions() async {
    try {
      final response = await ApiService().getActiveSessions();
      if (response.success) {
        return response.data! as List<AttendanceSession>;
      } else {
        _logger.e('Failed to fetch active sessions: ${response.message}');
        return [];
      }
    } catch (e) {
      _logger.e('Error fetching active sessions: $e');
      throw Exception('Failed to load active sessions');
    }
  }

  /// Phương thức gọi API để lấy lịch sử điểm danh của sinh viên
  Future<List<Attendance>> _fetchAttendanceHistory() async {
    try {
      final response = await ApiService().getAttendanceHistory();
      if (response.success) {
        return response.data! as List<Attendance>;
      } else {
        _logger.e('Failed to fetch attendance history: ${response.message}');
        return [];
      }
    } catch (e) {
      _logger.e('Error fetching attendance history: $e');
      throw Exception('Failed to load attendance history');
    }
  }

  /// Phương thức chuyển hướng đến màn hình điểm danh
  void _navigateToAttendance(AttendanceSession session) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => FaceCaptureScreen(
          userId: widget.userId,
          // Khi điểm danh thành công, làm mới lại dữ liệu
          onFaceTrained: () {
            _refreshData();
          },
          sessionId: session.id, // Truyền sessionId để API biết phiên điểm danh
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Bảng điều khiển sinh viên'),
          backgroundColor: Colors.blueAccent,
          bottom: const TabBar(
            indicatorColor: Colors.white,
            tabs: [
              Tab(icon: Icon(Icons.class_), text: 'Phiên điểm danh đang mở'),
              Tab(icon: Icon(Icons.history), text: 'Lịch sử điểm danh'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildActiveSessionsTab(),
            _buildAttendanceHistoryTab(),
          ],
        ),
      ),
    );
  }

  /// Widget cho tab Phiên điểm danh đang mở
  Widget _buildActiveSessionsTab() {
    return FutureBuilder<List<AttendanceSession>>(
      future: _activeSessionsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          return Center(child: Text('Lỗi: ${snapshot.error}'));
        } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
          return ListView.builder(
            padding: const EdgeInsets.all(8.0),
            itemCount: snapshot.data!.length,
            itemBuilder: (context, index) {
              final session = snapshot.data![index];
              return _buildSessionCard(session);
            },
          );
        } else {
          return const Center(
              child: Text('Hiện không có phiên điểm danh nào đang mở.'));
        }
      },
    );
  }

  /// Widget cho tab Lịch sử điểm danh
  Widget _buildAttendanceHistoryTab() {
    return FutureBuilder<List<Attendance>>(
      future: _attendanceHistoryFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          return Center(child: Text('Lỗi: ${snapshot.error}'));
        } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
          return ListView.builder(
            padding: const EdgeInsets.all(8.0),
            itemCount: snapshot.data!.length,
            itemBuilder: (context, index) {
              final attendance = snapshot.data![index];
              return _buildAttendanceHistoryCard(attendance);
            },
          );
        } else {
          return const Center(child: Text('Không có lịch sử điểm danh.'));
        }
      },
    );
  }

  /// Widget xây dựng card cho phiên điểm danh
  Widget _buildSessionCard(AttendanceSession session) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
      elevation: 4.0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16.0),
        leading: const Icon(Icons.school, size: 40, color: Colors.blueAccent),
        title: Text(
          session.subject,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          'Lớp: ${session.className}\nGiáo viên: ${session.teacherName ?? 'N/A'}\nBắt đầu: ${session.startTime}',
        ),
        isThreeLine: true,
        trailing: ElevatedButton(
          onPressed: () => _navigateToAttendance(session),
          child: const Text('Điểm danh'),
        ),
      ),
    );
  }

  /// Widget xây dựng card cho lịch sử điểm danh
  Widget _buildAttendanceHistoryCard(Attendance attendance) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
      elevation: 4.0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16.0),
        leading: Icon(
          attendance.status == AttendanceStatus.present
              ? Icons.check_circle
              : Icons.cancel,
          size: 40,
          color: attendance.status.color,
        ),
        title: Text(
          attendance.subject ?? 'N/A',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          'Trạng thái: ${attendance.status.displayName}\nThời gian: ${attendance.attendanceTime.toString()}',
        ),
        trailing: Icon(
          Icons.arrow_forward_ios,
          color: Colors.grey[400],
        ),
      ),
    );
  }
}

