// lib/screens/teacher_dashboard.dart
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import 'attendance_session_screen.dart';

class TeacherDashboardScreen extends StatefulWidget {
  final int teacherId;

  const TeacherDashboardScreen({super.key, required this.teacherId});

  @override
  State<TeacherDashboardScreen> createState() => _TeacherDashboardScreenState();
}

class _TeacherDashboardScreenState extends State<TeacherDashboardScreen> {
  final Logger _logger = Logger();
  late Future<List<AttendanceSession>> _teacherSessionsFuture;

  @override
  void initState() {
    super.initState();
    _refreshSessions();
  }

  /// Phương thức làm mới danh sách các phiên điểm danh
  void _refreshSessions() {
    setState(() {
      _teacherSessionsFuture = _fetchTeacherSessions();
    });
  }

  /// Phương thức gọi API để lấy danh sách các phiên điểm danh của giáo viên
  Future<List<AttendanceSession>> _fetchTeacherSessions() async {
    try {
      final response = await ApiService().getTeacherSessions();
      if (response.success) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch teacher sessions: ${response.message}');
        throw Exception(response.message);
      }
    } catch (e) {
      _logger.e('Error fetching teacher sessions: $e');
      throw Exception('Failed to load teacher sessions');
    }
  }

  /// Mở màn hình tạo phiên điểm danh mới
  Future<void> _createSession() async {
    // TODO: Chuyển hướng đến màn hình tạo phiên, có thể là một dialog hoặc màn hình mới
    _logger.i('Creating a new session...');
    // Sau khi tạo xong, làm mới danh sách
    // _refreshSessions();

    // Dữ liệu giả lập cho demo
    await Future.delayed(const Duration(seconds: 1));
    _refreshSessions();
  }

  /// Chuyển hướng đến màn hình chi tiết phiên điểm danh
  void _navigateToSessionDetails(AttendanceSession session) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => AttendanceSessionScreen(session: session),
      ),
    ).then((value) {
      // Khi quay lại từ màn hình chi tiết, làm mới danh sách để cập nhật trạng thái
      _refreshSessions();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bảng điều khiển giáo viên'),
        backgroundColor: Colors.blueAccent,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _createSession,
            tooltip: 'Tạo phiên điểm danh mới',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshSessions,
            tooltip: 'Làm mới',
          ),
        ],
      ),
      body: FutureBuilder<List<AttendanceSession>>(
        future: _teacherSessionsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Lỗi: ${snapshot.error}'));
          } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
            final sessions = snapshot.data!;
            return ListView.builder(
              padding: const EdgeInsets.all(8.0),
              itemCount: sessions.length,
              itemBuilder: (context, index) {
                final session = sessions[index];
                return _buildSessionCard(session);
              },
            );
          } else {
            return const Center(child: Text('Bạn chưa có phiên điểm danh nào.'));
          }
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createSession,
        backgroundColor: Colors.blueAccent,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildSessionCard(AttendanceSession session) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      elevation: 4.0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
      child: InkWell(
        onTap: () => _navigateToSessionDetails(session),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                session.subject,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 4),
              Text(
                'Lớp: ${session.className}',
                style: const TextStyle(color: Colors.black54),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 16, color: Colors.black54),
                  const SizedBox(width: 4),
                  Text(
                    'Ngày: ${session.sessionDate.toLocal().toString().split(' ')[0]}',
                    style: const TextStyle(color: Colors.black54),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.access_time, size: 16, color: Colors.black54),
                  const SizedBox(width: 4),
                  Text(
                    'Thời gian: ${session.startTime} - ${session.endTime ?? 'Chưa kết thúc'}',
                    style: const TextStyle(color: Colors.black54),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: session.isActive ? Colors.green : Colors.red,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      session.isActive ? 'Đang mở' : 'Đã đóng',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              if (session.totalAttendances != null)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    const Divider(),
                    Text(
                      'Tổng số sinh viên đã điểm danh: ${session.totalAttendances}',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}
