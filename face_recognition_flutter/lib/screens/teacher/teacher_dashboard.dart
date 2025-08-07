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

class _TeacherDashboardScreenState extends State<TeacherDashboardScreen>
    with TickerProviderStateMixin {
  final Logger _logger = Logger();
  late TabController _tabController;
  bool _isInit = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _isInit = true;
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInit) {
      _logger.w('TeacherDashboardScreen is not initialized yet.');
      return const Center(child: CircularProgressIndicator());
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bảng điều khiển giáo viên'),
        backgroundColor: Colors.blueAccent,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => logout(context),
            tooltip: 'Đăng xuất',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Lịch học', icon: Icon(Icons.schedule)),
            Tab(text: 'Phiên điểm danh', icon: Icon(Icons.event)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          ScheduleTab(teacherId: widget.teacherId),
          AttendanceSessionTab(teacherId: widget.teacherId),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}

class ScheduleTab extends StatefulWidget {
  final int teacherId;

  const ScheduleTab({super.key, required this.teacherId});

  @override
  State<ScheduleTab> createState() => _ScheduleTabState();
}

class _ScheduleTabState extends State<ScheduleTab> {
  final Logger _logger = Logger();
  late Future<List<Schedule>> _schedulesFuture;
  final ApiService _apiService = ApiService();
  final List<String> _timeSlots = [
    '07:00-08:00',
    '08:00-09:00',
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00',
  ];

  @override
  void initState() {
    super.initState();
    _schedulesFuture = _fetchSchedules();
  }

  Future<List<Schedule>> _fetchSchedules() async {
    try {
      final response =
          await _apiService.getSchedules(teacherId: widget.teacherId);
      if (response.success) {
        _logger.i('Fetched schedules: ${response.data!.length} items');
        return response.data!;
      } else {
        _logger.e('Fetch schedules failed: ${response.error}');
        throw Exception(response.error);
      }
    } catch (e) {
      _logger.e('Fetch schedules error: $e');
      rethrow;
    }
  }

  void _refreshSchedules() {
    setState(() {
      _schedulesFuture = _fetchSchedules();
    });
  }

  String _getWeekdayName(int weekday) {
    const weekdays = [
      '',
      'Chủ nhật',
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7'
    ];
    return weekdays[weekday];
  }

  int _timeToMinutes(String time) {
    final parts = time.split(':');
    return int.parse(parts[0]) * 60 + int.parse(parts[1]);
  }

  List<Map<String, dynamic>> _getSchedulesForSlot(
      List<Schedule> schedules, String timeSlot, int weekday) {
    final timeParts = timeSlot.split('-');
    final slotStart = _timeToMinutes(timeParts[0]);
    final slotEnd = _timeToMinutes(timeParts[1]);

    return schedules.asMap().entries.where((entry) {
      final schedule = entry.value;
      if (schedule.weekday != weekday) return false;
      final scheduleStart = _timeToMinutes(schedule.startTime);
      return slotStart <= scheduleStart && scheduleStart < slotEnd;
    }).map((entry) {
      final schedule = entry.value;
      final scheduleStart = _timeToMinutes(schedule.startTime);
      final scheduleEnd = _timeToMinutes(schedule.endTime);

      int rowSpan = 0;
      for (var slot in _timeSlots) {
        final slotParts = slot.split('-');
        final slotStartTime = _timeToMinutes(slotParts[0]);
        if (slotStartTime >= scheduleStart && slotStartTime < scheduleEnd) {
          rowSpan++;
        }
      }
      rowSpan = rowSpan > 0 ? rowSpan : 1;

      return {
        'schedule': schedule,
        'rowSpan': rowSpan,
        'index': entry.key,
      };
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16.0),
          color: Colors.grey[100],
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              ElevatedButton.icon(
                onPressed: _refreshSchedules,
                icon: const Icon(Icons.refresh),
                label: const Text('Làm mới'),
                style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blueAccent),
              ),
            ],
          ),
        ),
        Expanded(
          child: FutureBuilder<List<Schedule>>(
            future: _schedulesFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              } else if (snapshot.hasError) {
                return Center(child: Text('Lỗi: ${snapshot.error}'));
              } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
                return _buildTimetable(snapshot.data!);
              } else {
                return const Center(child: Text('Không có lịch học nào.'));
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTimetable(List<Schedule> schedules) {
    if (schedules.isEmpty) {
      return const Center(child: Text('Không tìm thấy lịch học nào.'));
    }

    final displayedSchedules = <int>{};

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minWidth: 800),
          child: Table(
            border: TableBorder.all(color: Colors.grey),
            columnWidths: const {
              0: FixedColumnWidth(100),
              1: FixedColumnWidth(150),
              2: FixedColumnWidth(150),
              3: FixedColumnWidth(150),
              4: FixedColumnWidth(150),
              5: FixedColumnWidth(150),
              6: FixedColumnWidth(150),
              7: FixedColumnWidth(150),
            },
            defaultVerticalAlignment: TableCellVerticalAlignment.middle,
            children: [
              TableRow(
                decoration: BoxDecoration(color: Colors.grey[300]),
                children: [
                  TableCell(
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      child: const Text(
                        'Thời gian',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  ...List.generate(7, (index) {
                    return TableCell(
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        child: Text(
                          _getWeekdayName(index + 1),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    );
                  }),
                ],
              ),
              ..._timeSlots.asMap().entries.map((entry) {
                final timeSlot = entry.value;
                return TableRow(
                  children: [
                    TableCell(
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        child: Text(
                          timeSlot,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    ...List.generate(7, (weekdayIndex) {
                      final weekday = weekdayIndex + 1;
                      final slotSchedules =
                          _getSchedulesForSlot(schedules, timeSlot, weekday);

                      if (slotSchedules.isEmpty) {
                        return const TableCell(child: SizedBox());
                      }

                      final slotData = slotSchedules
                          .cast<Map<String, dynamic>?>()
                          .firstWhere(
                            (data) =>
                                data != null &&
                                !displayedSchedules.contains(data['index']),
                            orElse: () => null,
                          );

                      if (slotData == null) {
                        return const TableCell(child: SizedBox());
                      }

                      final schedule = slotData['schedule'] as Schedule;
                      final scheduleIndex = slotData['index'] as int;

                      if (displayedSchedules.contains(scheduleIndex)) {
                        return const TableCell(child: SizedBox());
                      }
                      displayedSchedules.add(scheduleIndex);

                      final scheduleStart = _timeToMinutes(schedule.startTime);
                      final slotStart = _timeToMinutes(timeSlot.split('-')[0]);
                      if (scheduleStart != slotStart) {
                        return const TableCell(child: SizedBox());
                      }

                      return TableCell(
                        verticalAlignment: TableCellVerticalAlignment.top,
                        child: GestureDetector(
                          onTap: () => _handleScheduleTap(schedule),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.blueAccent.withOpacity(0.1),
                              border: Border.all(color: Colors.blueAccent),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  schedule.subjectName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.blueAccent,
                                    fontSize: 12,
                                  ),
                                ),
                                Text(
                                  schedule.className,
                                  style: const TextStyle(fontSize: 10),
                                ),
                                Text(
                                  '${schedule.startTime} - ${schedule.endTime}',
                                  style: const TextStyle(fontSize: 10),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                );
              }).toList(),
            ],
          ),
        ),
      ),
    );
  }

  void _handleScheduleTap(Schedule schedule) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${schedule.subjectName} - ${schedule.className}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Giáo viên: ${schedule.teacherName}'),
            Text(
              '${_getWeekdayName(schedule.weekday)}: ${schedule.startTime} - ${schedule.endTime}',
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Đóng'),
          ),
          ElevatedButton(
            onPressed: () async {
              // Lưu lại context trước khi pop, hoặc tách logic ra
              final navigator = Navigator.of(context); // Lưu lại trước khi pop
              navigator.pop(); // Đóng dialog

              final request = SessionCreateRequest(
                scheduleId: schedule.id,
                sessionDate: DateTime.now().toIso8601String(),
                classId: schedule.classId,
                subjectId: schedule.subjectId,
              );

              final response =
                  await ApiService().createAttendanceSession(request);

              if (!mounted) return; // Đảm bảo widget chưa bị dispose sau await

              final data = response.data;
              if (response.success && data != null && data['id'] != null) {
                final sessionId = data['id'] as int;
                _logger.i('Created session with ID: $sessionId');

                // Điều hướng sang màn hình điểm danh
                navigator.push(
                  MaterialPageRoute(
                    builder: (_) => AttendanceSessionScreen(
                      sessionId: sessionId,
                      subject: schedule.subjectName,
                    ),
                  ),
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(response.message)),
                );
              }
            },
            child: const Text('Tạo phiên điểm danh'),
          ),
        ],
      ),
    );
  }
}

class AttendanceSessionTab extends StatefulWidget {
  final int teacherId;

  const AttendanceSessionTab({super.key, required this.teacherId});

  @override
  State<AttendanceSessionTab> createState() => _AttendanceSessionTabState();
}

class _AttendanceSessionTabState extends State<AttendanceSessionTab> {
  final Logger _logger = Logger();
  late Future<List<AttendanceSession>> _sessionsFuture;
  final ApiService _apiService = ApiService();
  String _selectedStatus = 'all';
  DateTime _selectedDate = DateTime.now();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _sessionsFuture = _fetchSessions();
  }

  Future<List<AttendanceSession>> _fetchSessions() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final response = await _apiService.getSessions(
        date: _selectedDate,
        isActive: _selectedStatus == 'active'
            ? true
            : _selectedStatus == 'inactive'
                ? false
                : null,
        teacherId: widget.teacherId,
      );
      if (response.success && response.data != null) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch sessions: ${response.error}');
        throw Exception(response.error ?? 'Không thể tải danh sách phiên');
      }
    } catch (e) {
      _logger.e('Error fetching sessions: $e');
      throw Exception('Lỗi kết nối: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _refreshSessions() {
    setState(() {
      _sessionsFuture = _fetchSessions();
    });
  }

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
                final createResponse =
                    await _apiService.createAttendanceSession(sessionRequest);
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
                    SnackBar(content: Text('Lỗi: ${createResponse.error}')),
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
          SnackBar(content: Text('Lỗi: ${response.error}')),
        );
      }
    } catch (e) {
      _logger.e('Error fetching schedule options: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể tải tùy chọn lịch học')),
      );
    }
  }

  void _navigateToSessionDetails(AttendanceSession session) {
    Navigator.of(context)
        .push(
      MaterialPageRoute(
        builder: (context) => AttendanceSessionScreen(
          sessionId: session.id,
          subject: session.subject,
        ),
      ),
    )
        .then((value) {
      _refreshSessions();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildFilterSection(),
        Expanded(
          child: FutureBuilder<List<AttendanceSession>>(
            future: _sessionsFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              } else if (snapshot.hasError) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text('Lỗi: ${snapshot.error}'),
                      ElevatedButton(
                        onPressed: _refreshSessions,
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                );
              } else if (snapshot.hasData) {
                return _buildSessionsList(snapshot.data!);
              } else {
                return const Center(
                    child: Text('Không có dữ liệu phiên điểm danh.'));
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFilterSection() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.2),
            spreadRadius: 1,
            blurRadius: 3,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Card(
                  child: ListTile(
                    dense: true,
                    title: const Text('Ngày', style: TextStyle(fontSize: 14)),
                    subtitle: Text(
                        '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}'),
                    trailing: const Icon(Icons.calendar_today, size: 20),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: _selectedDate,
                        firstDate:
                            DateTime.now().subtract(const Duration(days: 365)),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (date != null) {
                        setState(() {
                          _selectedDate = date;
                        });
                        _refreshSessions();
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Card(
                  child: Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: DropdownButton<String>(
                      value: _selectedStatus,
                      hint: const Text('Trạng thái'),
                      isExpanded: true,
                      underline: const SizedBox(),
                      items: const [
                        DropdownMenuItem(value: 'all', child: Text('Tất cả')),
                        DropdownMenuItem(
                            value: 'active', child: Text('Đang hoạt động')),
                        DropdownMenuItem(
                            value: 'inactive', child: Text('Đã kết thúc')),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _selectedStatus = value!;
                        });
                        _refreshSessions();
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              ElevatedButton.icon(
                onPressed: _createSession,
                icon: const Icon(Icons.add),
                label: const Text('Tạo phiên'),
                style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blueAccent),
              ),
              ElevatedButton.icon(
                onPressed: _isLoading ? null : _refreshSessions,
                icon: _isLoading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.refresh),
                label: Text(_isLoading ? 'Đang tải...' : 'Làm mới'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSessionsList(List<AttendanceSession> sessions) {
    if (sessions.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('Không tìm thấy phiên điểm danh nào.'),
            Text('Thử thay đổi bộ lọc hoặc chọn ngày khác.',
                style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: sessions.length,
      itemBuilder: (context, index) {
        final session = sessions[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0),
          ),
          child: ExpansionTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: session.isActive ? Colors.green : Colors.red,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                session.isActive ? Icons.play_circle : Icons.stop_circle,
                color: Colors.white,
                size: 24,
              ),
            ),
            title: Text(
              '${session.subject} - ${session.className}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (session.teacherName != null)
                  Text('Giáo viên: ${session.teacherName}'),
                Text(
                    '${session.sessionDate.day}/${session.sessionDate.month}/${session.sessionDate.year} • ${session.startTime}${session.endTime != null ? ' - ${session.endTime}' : ''}'),
                const SizedBox(height: 4),
                Chip(
                  label: Text(
                    session.isActive ? 'Đang hoạt động' : 'Đã kết thúc',
                    style: const TextStyle(fontSize: 12, color: Colors.white),
                  ),
                  backgroundColor: session.isActive ? Colors.green : Colors.red,
                ),
              ],
            ),
            trailing: PopupMenuButton<String>(
              onSelected: (value) => _handleSessionAction(value, session),
              itemBuilder: (context) => [
                const PopupMenuItem(
                    value: 'details', child: Text('Xem chi tiết')),
                if (session.isActive)
                  const PopupMenuItem(
                      value: 'close', child: Text('Đóng phiên')),
              ],
            ),
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatChip(
                            'Tổng', session.totalStudents ?? 0, Colors.blue),
                        _buildStatChip(
                            'Có mặt', session.presentCount ?? 0, Colors.green),
                        _buildStatChip(
                            'Trễ', session.lateCount ?? 0, Colors.orange),
                        _buildStatChip(
                            'Vắng', session.absentCount ?? 0, Colors.red),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _navigateToSessionDetails(session),
                        icon: const Icon(Icons.visibility),
                        label: const Text('Xem chi tiết'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueAccent,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatChip(String label, int count, Color color) {
    return Chip(
      label: Text(
        '$label: $count',
        style: const TextStyle(color: Colors.white, fontSize: 12),
      ),
      backgroundColor: color,
    );
  }

  void _handleSessionAction(String action, AttendanceSession session) async {
    switch (action) {
      case 'details':
        _navigateToSessionDetails(session);
        break;
      case 'close':
        await _closeSession(session.id);
        break;
    }
  }

  Future<void> _closeSession(int sessionId) async {
    try {
      final response = await _apiService.endSession(sessionId);
      if (response.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Phiên điểm danh đã được đóng thành công.'),
            backgroundColor: Colors.green,
          ),
        );
        _refreshSessions();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: ${response.error}')),
        );
      }
    } catch (e) {
      _logger.e('Close session error: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Lỗi mạng: Không thể đóng phiên điểm danh.')),
      );
    }
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
                    _selectedScheduleId = schedules
                            .where((s) => s.classId == value)
                            .toList()
                            .isNotEmpty
                        ? schedules.where((s) => s.classId == value).first.id
                        : null;
                  });
                },
                validator: (value) =>
                    value == null ? 'Vui lòng chọn lớp học' : null,
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
                    _selectedScheduleId = schedules
                            .where((s) =>
                                s.subjectId == value &&
                                s.classId == _selectedClassId)
                            .toList()
                            .isNotEmpty
                        ? schedules
                            .where((s) =>
                                s.subjectId == value &&
                                s.classId == _selectedClassId)
                            .first
                            .id
                        : null;
                  });
                },
                validator: (value) =>
                    value == null ? 'Vui lòng chọn môn học' : null,
              ),
              DropdownButtonFormField<int>(
                value: _selectedScheduleId,
                decoration: const InputDecoration(labelText: 'Lịch học'),
                items: schedules
                    .where((s) =>
                        (_selectedClassId == null ||
                            s.classId == _selectedClassId) &&
                        (_selectedSubjectId == null ||
                            s.subjectId == _selectedSubjectId))
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
                validator: (value) =>
                    value == null ? 'Vui lòng chọn lịch học' : null,
              ),
              const SizedBox(height: 16),
              ListTile(
                title: Text(
                  'Ngày: ${_selectedDate.toLocal().toString().split(' ')[0]}',
                ),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate:
                        DateTime.now().subtract(const Duration(days: 30)),
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
                'session_date':
                    _selectedDate.toIso8601String().split('T').first,
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
