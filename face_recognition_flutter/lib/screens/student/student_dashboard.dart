// lib/screens/student_dashboard.dart
import 'package:face_attendance/models/subject.dart';
import 'package:face_attendance/utils/logout_helper.dart';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../models/models.dart';
import '../../models/attendance_models.dart';
import '../../services/api_service.dart';
import 'face_capture_screen.dart';
import 'session_list_screen.dart';

class StudentDashboardScreen extends StatefulWidget {
  final int userId;

  const StudentDashboardScreen({super.key, required this.userId});

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen>
    with SingleTickerProviderStateMixin {
  final Logger _logger = Logger();
  late TabController _tabController;
  
  late Future<List<Schedule>> _schedulesFuture;
  late Future<List<AttendanceSession>> _activeSessionsFuture;
  late Future<List<Attendance>> _attendanceHistoryFuture;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _refreshData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  /// Refresh data for all tabs
  void _refreshData() {
    setState(() {
      _schedulesFuture = _fetchSchedules();
      _activeSessionsFuture = _fetchActiveSessions();
      _attendanceHistoryFuture = _fetchAttendanceHistory();
    });
  }

  /// Fetch schedules
  Future<List<Schedule>> _fetchSchedules() async {
    try {
      final response = await ApiService().getStudentSchedules();
      if (response.success) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch schedules: ${response.message}');
        return [];
      }
    } catch (e) {
      _logger.e('Error fetching schedules: $e');
      throw Exception('Failed to load schedules');
    }
  }

  /// Fetch active sessions
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
      throw Exception('Failed to load active sessions');
    }
  }

  /// Fetch attendance history
  Future<List<Attendance>> _fetchAttendanceHistory() async {
    try {
      final response = await ApiService().getAttendanceHistory();
      if (response.success) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch attendance history: ${response.message}');
        return [];
      }
    } catch (e) {
      _logger.e('Error fetching attendance history: $e');
      throw Exception('Failed to load attendance history');
    }
  }

  /// Navigate to session list for a schedule
  void _navigateToSessionList(Schedule schedule) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => SessionListScreen(
          userId: widget.userId,
          scheduleId: schedule.id,
          scheduleName: '${schedule.subjectName} - ${schedule.className}',
          onAttendanceMarked: _refreshData,
        ),
      ),
    );
  }

  /// Navigate to attendance screen
  void _navigateToAttendance(AttendanceSession session) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => FaceCaptureScreen(
          userId: widget.userId,
          sessionId: session.id,
          onFaceTrained: _refreshData,
        ),
      ),
    );
  }

  /// Get weekday name in Vietnamese
  String _getWeekdayName(int weekday) {
    const weekdays = [
      'Chủ nhật',
      'Thứ hai', 
      'Thứ ba',
      'Thứ tư',
      'Thứ năm',
      'Thứ sáu',
      'Thứ bảy'
    ];
    return weekdays[weekday % 8 - 1];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              expandedHeight: 120,
              floating: false,
              pinned: true,
              elevation: 0,
              backgroundColor: Colors.blue[600],
              flexibleSpace: FlexibleSpaceBar(
                title: const Text(
                  'Bảng điều khiển sinh viên',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.blue[400]!,
                        Colors.blue[600]!,
                      ],
                    ),
                  ),
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                  onPressed: _refreshData,
                  tooltip: 'Làm mới',
                ),
                IconButton(
                  icon: const Icon(Icons.logout_rounded, color: Colors.white),
                  onPressed: () => logout(context),
                  tooltip: 'Đăng xuất',
                ),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(60),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: TabBar(
                    controller: _tabController,
                    indicatorColor: Colors.blue[600],
                    indicatorWeight: 3,
                    labelColor: Colors.blue[600],
                    unselectedLabelColor: Colors.grey[500],
                    labelStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    unselectedLabelStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                    tabs: const [
                      Tab(
                        icon: Icon(Icons.schedule_rounded, size: 20),
                        text: 'Thời khóa biểu',
                      ),
                      Tab(
                        icon: Icon(Icons.class_rounded, size: 20),
                        text: 'Phiên điểm danh',
                      ),
                      Tab(
                        icon: Icon(Icons.history_rounded, size: 20),
                        text: 'Lịch sử',
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildSchedulesTab(),
            _buildActiveSessionsTab(),
            _buildAttendanceHistoryTab(),
          ],
        ),
      ),
    );
  }

  /// Widget for Schedules tab
  Widget _buildSchedulesTab() {
    return FutureBuilder<List<Schedule>>(
      future: _schedulesFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        } else if (snapshot.hasError) {
          return _buildErrorWidget('Lỗi: ${snapshot.error}');
        } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
          return RefreshIndicator(
            onRefresh: () async => _refreshData(),
            color: Colors.blue[600],
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                final schedule = snapshot.data![index];
                return _buildScheduleCard(schedule);
              },
            ),
          );
        } else {
          return _buildEmptyState(
            icon: Icons.schedule_rounded,
            title: 'Không có thời khóa biểu',
            subtitle: 'Hiện tại chưa có lịch học nào được xếp cho bạn.',
          );
        }
      },
    );
  }

  /// Widget for Active Sessions tab
  Widget _buildActiveSessionsTab() {
    return FutureBuilder<List<AttendanceSession>>(
      future: _activeSessionsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        } else if (snapshot.hasError) {
          return _buildErrorWidget('Lỗi: ${snapshot.error}');
        } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
          return RefreshIndicator(
            onRefresh: () async => _refreshData(),
            color: Colors.blue[600],
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                final session = snapshot.data![index];
                return _buildSessionCard(session);
              },
            ),
          );
        } else {
          return _buildEmptyState(
            icon: Icons.class_rounded,
            title: 'Không có phiên điểm danh',
            subtitle: 'Hiện không có phiên điểm danh nào đang mở.',
          );
        }
      },
    );
  }

  /// Widget for Attendance History tab
  Widget _buildAttendanceHistoryTab() {
    return FutureBuilder<List<Attendance>>(
      future: _attendanceHistoryFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        } else if (snapshot.hasError) {
          return _buildErrorWidget('Lỗi: ${snapshot.error}');
        } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
          return RefreshIndicator(
            onRefresh: () async => _refreshData(),
            color: Colors.blue[600],
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                final attendance = snapshot.data![index];
                return _buildAttendanceHistoryCard(attendance);
              },
            ),
          );
        } else {
          return _buildEmptyState(
            icon: Icons.history_rounded,
            title: 'Không có lịch sử điểm danh',
            subtitle: 'Chưa có bản ghi điểm danh nào.',
          );
        }
      },
    );
  }

  /// Widget to build schedule card with enhanced design
  Widget _buildScheduleCard(Schedule schedule) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16.0),
          onTap: () => _navigateToSessionList(schedule),
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.blue[400]!, Colors.blue[600]!],
                    ),
                    borderRadius: BorderRadius.circular(16.0),
                  ),
                  child: const Icon(
                    Icons.book_rounded,
                    size: 30,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 16.0),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        schedule.subjectName,
                        style: const TextStyle(
                          fontSize: 18.0,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8.0),
                      _buildInfoRow(
                        icon: Icons.class_rounded,
                        text: schedule.className,
                        color: Colors.grey[600]!,
                      ),
                      const SizedBox(height: 4.0),
                      _buildInfoRow(
                        icon: Icons.person_rounded,
                        text: schedule.teacherName,
                        color: Colors.grey[600]!,
                      ),
                      const SizedBox(height: 4.0),
                      _buildInfoRow(
                        icon: Icons.access_time_rounded,
                        text: '${_getWeekdayName(schedule.weekday)}, ${schedule.startTime} - ${schedule.endTime}',
                        color: Colors.blue[600]!,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8.0),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(12.0),
                  ),
                  child: Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 16,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Widget to build session card with enhanced design
  Widget _buildSessionCard(AttendanceSession session) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.green[400]!, Colors.green[600]!],
                    ),
                    borderRadius: BorderRadius.circular(12.0),
                  ),
                  child: const Icon(
                    Icons.school_rounded,
                    size: 26,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 16.0),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        session.subject,
                        style: const TextStyle(
                          fontSize: 18.0,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4.0),
                      Text(
                        session.className,
                        style: TextStyle(
                          fontSize: 14.0,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12.0,
                    vertical: 6.0,
                  ),
                  decoration: BoxDecoration(
                    color: (!session.isActive) ? Colors.green[50] : Colors.grey[100],
                    border: Border.all(
                      color: (!session.isActive) ? Colors.green[200]! : Colors.grey[300]!,
                    ),
                    borderRadius: BorderRadius.circular(20.0),
                  ),
                  child: Text(
                    (!session.isActive) ? 'Đang mở' : 'Đã đóng',
                    style: TextStyle(
                      fontSize: 12.0,
                      fontWeight: FontWeight.w600,
                      color: (!session.isActive) ? Colors.green[700] : Colors.grey[600],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16.0),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildInfoRow(
                        icon: Icons.person_rounded,
                        text: session.teacherName ?? 'Chưa xác định',
                        color: Colors.grey[600]!,
                      ),
                      const SizedBox(height: 4.0),
                      _buildInfoRow(
                        icon: Icons.calendar_today_rounded,
                        text: '${session.sessionDate.day}/${session.sessionDate.month}/${session.sessionDate.year}',
                        color: Colors.grey[600]!,
                      ),
                      const SizedBox(height: 4.0),
                      _buildInfoRow(
                        icon: Icons.access_time_rounded,
                        text: session.startTime,
                        color: Colors.blue[600]!,
                      ),
                    ],
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: (!session.isActive) ? Colors.blue[600] : Colors.grey[400],
                    foregroundColor: Colors.white,
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.0),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20.0,
                      vertical: 12.0,
                    ),
                  ),
                  onPressed: (!session.isActive) ? () => _navigateToAttendance(session) : null,
                  child: const Text(
                    'Điểm danh',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Widget to build attendance history card with enhanced design
  Widget _buildAttendanceHistoryCard(Attendance attendance) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: attendance.status.color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12.0),
                border: Border.all(
                  color: attendance.status.color.withOpacity(0.3),
                  width: 2,
                ),
              ),
              child: Icon(
                attendance.status == AttendanceStatus.present
                    ? Icons.check_circle_rounded
                    : attendance.status == AttendanceStatus.late
                        ? Icons.watch_later_rounded
                        : Icons.cancel_rounded,
                size: 26,
                color: attendance.status.color,
              ),
            ),
            const SizedBox(width: 16.0),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    attendance.subjectName,
                    style: const TextStyle(
                      fontSize: 16.0,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8.0),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10.0,
                      vertical: 4.0,
                    ),
                    decoration: BoxDecoration(
                      color: attendance.status.color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16.0),
                    ),
                    child: Text(
                      attendance.status.displayName,
                      style: TextStyle(
                        fontSize: 12.0,
                        fontWeight: FontWeight.w600,
                        color: attendance.status.color,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8.0),
                  Text(
                    '${attendance.attendanceTime.day}/${attendance.attendanceTime.month}/${attendance.attendanceTime.year} - ${attendance.attendanceTime.hour}:${attendance.attendanceTime.minute.toString().padLeft(2, '0')}',
                    style: TextStyle(
                      fontSize: 14.0,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            if (attendance.confidenceScore != null)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8.0,
                  vertical: 4.0,
                ),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12.0),
                ),
                child: Text(
                  '${(attendance.confidenceScore! * 100).toInt()}%',
                  style: TextStyle(
                    fontSize: 12.0,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  /// Helper widget for building info rows
  Widget _buildInfoRow({
    required IconData icon,
    required String text,
    required Color color,
  }) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 6.0),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 14.0,
              color: color,
            ),
          ),
        ),
      ],
    );
  }

  /// Widget for empty state
  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(40.0),
              ),
              child: Icon(
                icon,
                size: 40,
                color: Colors.grey[400],
              ),
            ),
            const SizedBox(height: 24.0),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18.0,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8.0),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 14.0,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24.0),
            ElevatedButton.icon(
              onPressed: _refreshData,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Làm mới'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue[600],
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12.0),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 20.0,
                  vertical: 12.0,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Widget for error state
  Widget _buildErrorWidget(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(40.0),
              ),
              child: Icon(
                Icons.error_rounded,
                size: 40,
                color: Colors.red[400],
              ),
            ),
            const SizedBox(height: 24.0),
            Text(
              'Đã xảy ra lỗi',
              style: const TextStyle(
                fontSize: 18.0,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8.0),
            Text(
              error,
              style: TextStyle(
                fontSize: 14.0,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24.0),
            ElevatedButton.icon(
              onPressed: _refreshData,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Thử lại'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue[600],
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12.0),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 20.0,
                  vertical: 12.0,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}