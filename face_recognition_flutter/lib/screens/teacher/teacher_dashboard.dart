// lib/screens/teacher_dashboard.dart
import 'package:face_attendance/models/class.dart';
import 'package:face_attendance/models/subject.dart';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import 'attendance_session_screen.dart';
import 'package:face_attendance/utils/logout_helper.dart';

class TeacherDashboardScreen extends StatefulWidget {
  final int teacherId;

  const TeacherDashboardScreen({super.key, required this.teacherId});

  @override
  State<TeacherDashboardScreen> createState() => _TeacherDashboardScreenState();
}

class _TeacherDashboardScreenState extends State<TeacherDashboardScreen> {
  final Logger _logger = Logger();
  late Future<List<AttendanceSession>> _teacherSessionsFuture;
  final ApiService _apiService = ApiService();

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
      final response = await _apiService.getTeacherSessions();
      if (response.success) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch teacher sessions: ${response.success}');
        throw Exception(response.success);
      }
    } catch (e) {
      _logger.e('Error fetching teacher sessions: $e');
      throw Exception('Failed to load teacher sessions');
    }
  }

  /// Mở dialog để tạo phiên điểm danh mới
  Future<void> _createSession() async {
    try {
      final response = await _apiService.getScheduleOptions();
      if (response.success) {
        showDialog(
          context: context,
          builder: (context) => SessionCreateDialog(
            options: response.data!,
            onSave: (sessionData) async {
              try {
                final sessionRequest = SessionCreateRequest(
                  classId: sessionData['class_id'],
                  subjectId: sessionData['subject_id'],
                  scheduleId: sessionData['schedule_id'],
                  sessionDate: sessionData['session_date'],
                );
                final createResponse = await _apiService.createAttendanceSession(sessionRequest);
                if (createResponse.success) {
                  _logger.i('Session created: $sessionData');
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Tạo phiên điểm danh thành công'),
                      backgroundColor: Colors.green,
                    ),
                  );
                  _refreshSessions();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi: ${createResponse.success}')),
                  );
                }
              } catch (e) {
                _logger.e('Create session error: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Lỗi: $e')),
                );
              }
            },
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: ${response.success}')),
        );
      }
    } catch (e) {
      _logger.e('Error fetching schedule options: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể tải tùy chọn lịch học')),
      );
    }
  }

  /// Chuyển hướng đến màn hình chi tiết phiên điểm danh
  void _navigateToSessionDetails(AttendanceSession session) {
    Navigator.of(context)
        .push(
      MaterialPageRoute(
        builder: (context) => AttendanceSessionScreen(session: session),
      ),
    )
        .then((value) {
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
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => logout(context),
            tooltip: 'Đăng xuất',
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
            return const Center(
                child: Text('Bạn chưa có phiên điểm danh nào.'));
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
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 4),
              Text(
                'Lớp: ${session.className}',
                style: const TextStyle(color: Colors.black54),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.calendar_today,
                      size: 16, color: Colors.black54),
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
                  const Icon(Icons.access_time,
                      size: 16, color: Colors.black54),
                  const SizedBox(width: 4),
                  Text(
                    'Thời gian: ${session.startTime} - ${session.endTime ?? 'Chưa kết thúc'}',
                    style: const TextStyle(color: Colors.black54),
                  ),
                  const Spacer(),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: session.isActive ? Colors.green : Colors.red,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      session.isActive ? 'Đang mở' : 'Đã đóng',
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.bold),
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
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, color: Colors.black87),
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

class SessionCreateDialog extends StatefulWidget {
  final Map<String, dynamic> options;
  final Function(Map<String, dynamic>) onSave;

  const SessionCreateDialog({
    super.key,
    required this.options,
    required this.onSave,
  });

  @override
  State<SessionCreateDialog> createState() => _SessionCreateDialogState();
}

class _SessionCreateDialogState extends State<SessionCreateDialog> {
  final _formKey = GlobalKey<FormState>();
  int? _selectedClassId;
  int? _selectedSubjectId;
  int? _selectedScheduleId;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    final classes = (widget.options['classes'] as List<dynamic>? ?? [])
        .map((item) => ClassData.fromJson(item))
        .toList();
    final subjects = (widget.options['subjects'] as List<dynamic>? ?? [])
        .map((item) => Subject.fromJson(item))
        .toList();
    final schedules = (widget.options['schedules'] as List<dynamic>? ?? [])
        .map((item) => Schedule.fromJson(item))
        .toList();

    _selectedClassId = classes.isNotEmpty ? classes.first.id : null;
    _selectedSubjectId = subjects.isNotEmpty ? subjects.first.id : null;
    _selectedScheduleId = schedules.isNotEmpty ? schedules.first.id : null;
  }

  @override
  Widget build(BuildContext context) {
    final classes = (widget.options['classes'] as List<dynamic>? ?? [])
        .map((item) => ClassData.fromJson(item))
        .toList();
    final subjects = (widget.options['subjects'] as List<dynamic>? ?? [])
        .map((item) => Subject.fromJson(item))
        .toList();
    final schedules = (widget.options['schedules'] as List<dynamic>? ?? [])
        .map((item) => Schedule.fromJson(item))
        .toList();

    return AlertDialog(
      title: const Text('Tạo phiên điểm danh mới'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<int>(
                value: _selectedClassId,
                decoration: const InputDecoration(labelText: 'Lớp học'),
                items: classes.map((classData) {
                  return DropdownMenuItem(
                    value: classData.id,
                    child: Text(classData.name),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedClassId = value;
                    // Lọc schedules theo class_id
                    _selectedScheduleId = schedules
                        .where((s) => s.classId == value)
                        .toList()
                        .isNotEmpty
                        ? schedules.where((s) => s.classId == value).first.id
                        : null;
                  });
                },
                validator: (value) => value == null ? 'Vui lòng chọn lớp học' : null,
              ),
              DropdownButtonFormField<int>(
                value: _selectedSubjectId,
                decoration: const InputDecoration(labelText: 'Môn học'),
                items: subjects.map((subject) {
                  return DropdownMenuItem(
                    value: subject.id,
                    child: Text(subject.name),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedSubjectId = value;
                    // Lọc schedules theo subject_id
                    _selectedScheduleId = schedules
                        .where((s) => s.subjectId == value && s.classId == _selectedClassId)
                        .toList()
                        .isNotEmpty
                        ? schedules
                            .where((s) => s.subjectId == value && s.classId == _selectedClassId)
                            .first
                            .id
                        : null;
                  });
                },
                validator: (value) => value == null ? 'Vui lòng chọn môn học' : null,
              ),
              DropdownButtonFormField<int>(
                value: _selectedScheduleId,
                decoration: const InputDecoration(labelText: 'Lịch học'),
                items: schedules
                    .where((s) =>
                        (_selectedClassId == null || s.classId == _selectedClassId) &&
                        (_selectedSubjectId == null || s.subjectId == _selectedSubjectId))
                    .map((schedule) {
                  return DropdownMenuItem(
                    value: schedule.id,
                    child: Text(
                      '${schedule.subjectName} - ${schedule.className} (${schedule.startTime} - ${schedule.endTime})',
                    ),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedScheduleId = value;
                  });
                },
                validator: (value) => value == null ? 'Vui lòng chọn lịch học' : null,
              ),
              ListTile(
                title: Text(
                  'Ngày: ${_selectedDate.toLocal().toString().split(' ')[0]}',
                ),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime.now().subtract(const Duration(days: 30)),
                    lastDate: DateTime.now().add(const Duration(days: 30)),
                  );
                  if (date != null) {
                    setState(() {
                      _selectedDate = date;
                    });
                  }
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Hủy'),
        ),
        TextButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              final sessionData = {
                'class_id': _selectedClassId,
                'subject_id': _selectedSubjectId,
                'schedule_id': _selectedScheduleId,
                'session_date': _selectedDate.toIso8601String().split('T').first,
              };
              widget.onSave(sessionData);
              Navigator.of(context).pop();
            }
          },
          child: const Text('Tạo'),
        ),
      ],
    );
  }
}