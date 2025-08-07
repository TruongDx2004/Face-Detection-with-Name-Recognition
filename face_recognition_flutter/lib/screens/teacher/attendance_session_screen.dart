// lib/screens/attendance_session_screen.dart
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../services/api_service.dart';
import '../../models/models.dart'; // Giả sử các class model được định nghĩa trong file models.dart

class AttendanceSessionScreen extends StatefulWidget {
  final int sessionId;
  final String subject;

  const AttendanceSessionScreen({
    Key? key,
    required this.sessionId,
    required this.subject, // ✅ Và thêm vào constructor
  }) : super(key: key);

  @override
  State<AttendanceSessionScreen> createState() => _AttendanceSessionScreenState();
}

class _AttendanceSessionScreenState extends State<AttendanceSessionScreen> {
  final Logger _logger = Logger();
  late Future<Map<String, dynamic>> _sessionAttendanceFuture;

  @override
  void initState() {
    super.initState();
    _sessionAttendanceFuture = _fetchSessionAttendance();
  }

  /// Phương thức gọi API để lấy danh sách điểm danh của một phiên
  Future<Map<String, dynamic>> _fetchSessionAttendance() async {
    try {
      final response = await ApiService().getSessionAttendance(widget.sessionId);
      if (response.success) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch session attendance: ${response.message}');
        throw Exception(response.message);
      }
    } catch (e) {
      _logger.e('Error fetching session attendance: $e');
      throw Exception('Failed to load session attendance');
    }
  }

  /// Phương thức gọi API để đóng phiên điểm danh
  Future<void> _closeSession() async {
    try {
      final response = await ApiService().closeSession(widget.sessionId);
      if (response.success) {
        _showSnackBar('Phiên điểm danh đã được đóng thành công.', Colors.green);
        if (mounted) {
          Navigator.of(context).pop(); // Quay lại màn hình trước đó
        }
      } else {
        _showSnackBar('Lỗi: ${response.message}', Colors.red);
      }
    } catch (e) {
      _showSnackBar('Lỗi mạng: Không thể đóng phiên điểm danh.', Colors.red);
    }
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.subject),
        backgroundColor: Colors.blueAccent,
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _sessionAttendanceFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Lỗi: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            final List<Attendance> attendances = snapshot.data!['attendances'];
            final AttendanceSession session = snapshot.data!['session'];

            return Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSessionDetails(session),
                  const SizedBox(height: 16),
                  Text(
                    'Tổng số sinh viên: ${attendances.length}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: ListView.builder(
                      itemCount: attendances.length,
                      itemBuilder: (context, index) {
                        final attendance = attendances[index];
                        return _buildAttendanceCard(attendance);
                      },
                    ),
                  ),
                  if (session.isActive)
                    Padding(
                      padding: const EdgeInsets.only(top: 16.0),
                      child: Center(
                        child: ElevatedButton(
                          onPressed: _closeSession,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.redAccent,
                            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: const Text(
                            'Đóng phiên điểm danh',
                            style: TextStyle(fontSize: 16),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            );
          } else {
            return const Center(child: Text('Không có dữ liệu điểm danh.'));
          }
        },
      ),
    );
  }

  Widget _buildSessionDetails(AttendanceSession session) {
    return Card(
      elevation: 4.0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Lớp: ${session.className}',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text('Giáo viên: ${session.teacherName ?? 'N/A'}'),
            const SizedBox(height: 4),
            Text('Ngày: ${session.sessionDate.toLocal().toString().split(' ')[0]}'),
            const SizedBox(height: 4),
            Text('Thời gian: ${session.startTime} - ${session.endTime ?? 'Chưa kết thúc'}'),
            const SizedBox(height: 4),
            Text('Trạng thái: ${session.isActive ? 'Đang mở' : 'Đã đóng'}', style: TextStyle(color: session.isActive ? Colors.green : Colors.red)),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceCard(Attendance attendance) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      elevation: 2.0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: attendance.status.color,
          child: Icon(
            attendance.status == AttendanceStatus.present ? Icons.check : Icons.close,
            color: Colors.white,
          ),
        ),
        title: Text(
          attendance.studentName ,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          'Mã số: ${attendance.studentCode}\nThời gian: ${attendance.attendanceTime.toLocal().toString().substring(11, 16)}',
        ),
        trailing: Text(
          attendance.status.displayName,
          style: TextStyle(color: attendance.status.color, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
