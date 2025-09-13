// lib/screens/student/student_schedule.dart
// File tổng hợp tất cả tính năng student_schedule với thiết kế hiện đại
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../models/models.dart';
import '../../models/attendance_models.dart';
import '../../services/api_service.dart';
import 'face_capture_screen.dart';
import 'session_list_screen.dart';

class StudentScheduleScreen extends StatefulWidget {
  final int userId;

  const StudentScheduleScreen({super.key, required this.userId});

  @override
  State<StudentScheduleScreen> createState() => _StudentScheduleScreenState();
}

class _StudentScheduleScreenState extends State<StudentScheduleScreen>
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
      final response = await ApiService().getSchedules();
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
      final response = await ApiService().getMyAttendance();

      if (response.success) {
        // ApiService.getMyAttendance() already returns List<Attendance>
        return response.data ?? [];
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
          courseSectionId: schedule.courseSectionId,
          courseSectionName:
              '${schedule.subjectName ?? 'Môn học'} - ${schedule.className ?? 'Lớp'}',
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
      '', // Index 0 - not used
      'Thứ hai', // Index 1 - Monday
      'Thứ ba', // Index 2 - Tuesday
      'Thứ tư', // Index 3 - Wednesday
      'Thứ năm', // Index 4 - Thursday
      'Thứ sáu', // Index 5 - Friday
      'Thứ bảy', // Index 6 - Saturday
      'Chủ nhật' // Index 7 - Sunday
    ];
    if (weekday >= 1 && weekday <= 7) {
      return weekdays[weekday];
    }
    return 'Không xác định';
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
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFF667eea),
                        Color(0xFF764ba2),
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

  /// Widget for Schedules tab with weekly view
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
            color: const Color(0xFF667eea),
            child: _buildWeeklyScheduleView(snapshot.data!),
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

  /// Build weekly schedule view grouped by days
  Widget _buildWeeklyScheduleView(List<Schedule> schedules) {
    // Group schedules by weekday
    final Map<int, List<Schedule>> schedulesByDay = {};
    for (final schedule in schedules) {
      if (!schedulesByDay.containsKey(schedule.weekday)) {
        schedulesByDay[schedule.weekday] = [];
      }
      schedulesByDay[schedule.weekday]!.add(schedule);
    }

    // Sort schedules within each day by start time
    schedulesByDay.forEach((day, daySchedules) {
      daySchedules.sort((a, b) => a.startTime.compareTo(b.startTime));
    });

    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: 7, // 7 days of the week
      itemBuilder: (context, index) {
        final weekday = index + 1; // 1 = Monday, 7 = Sunday
        final daySchedules = schedulesByDay[weekday] ?? [];
        return _buildDayScheduleSection(weekday, daySchedules);
      },
    );
  }

  /// Build schedule section for a specific day
  Widget _buildDayScheduleSection(int weekday, List<Schedule> daySchedules) {
    final dayName = _getWeekdayName(weekday);
    final dayColors = _getDayColors(weekday);

    return Container(
      margin: const EdgeInsets.only(bottom: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Day header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: dayColors,
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: dayColors[0].withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Icon(
                  _getDayIcon(weekday),
                  color: Colors.white,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Text(
                  dayName,
                  style: const TextStyle(
                    color: Color.fromARGB(255, 255, 255, 255),
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${daySchedules.length} môn',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Schedule cards for this day
          if (daySchedules.isEmpty)
            _buildEmptyDayCard()
          else
            ...daySchedules
                .map((schedule) => _buildModernScheduleCard(schedule)),
        ],
      ),
    );
  }

  /// Get colors for each day of the week
  List<Color> _getDayColors(int weekday) {
    switch (weekday) {
      case 1: // Monday
        return [const Color(0xFF667eea), const Color(0xFF764ba2)];
      case 2: // Tuesday
        return [
          const Color.fromARGB(255, 46, 99, 147),
          const Color.fromARGB(255, 1, 157, 165)
        ];
      case 3: // Wednesday
        return [
          const Color.fromARGB(255, 49, 169, 89),
          const Color.fromARGB(255, 35, 155, 133)
        ];
      case 4: // Thursday
        return [
          const Color.fromARGB(255, 156, 71, 96),
          const Color.fromARGB(255, 168, 149, 42)
        ];
      case 5: // Friday
        return [
          const Color.fromARGB(255, 105, 148, 146),
          const Color.fromARGB(255, 153, 129, 136)
        ];
      case 6: // Saturday
        return [
          const Color.fromARGB(255, 132, 122, 109),
          const Color.fromARGB(255, 156, 113, 98)
        ];
      case 7: // Sunday
        return [
          const Color.fromARGB(255, 150, 116, 140),
          const Color.fromARGB(255, 78, 90, 112)
        ];
      default:
        return [
          const Color.fromARGB(255, 65, 81, 150),
          const Color.fromARGB(255, 79, 50, 108)
        ];
    }
  }

  /// Get icon for each day of the week
  IconData _getDayIcon(int weekday) {
    switch (weekday) {
      case 1:
        return Icons.work_outline; // Monday
      case 2:
        return Icons.school_outlined; // Tuesday
      case 3:
        return Icons.lightbulb_outline; // Wednesday
      case 4:
        return Icons.psychology_outlined; // Thursday
      case 5:
        return Icons.celebration_outlined; // Friday
      case 6:
        return Icons.weekend_outlined; // Saturday
      case 7:
        return Icons.home_outlined; // Sunday
      default:
        return Icons.calendar_today;
    }
  }

  /// Build empty day card
  Widget _buildEmptyDayCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!, width: 1),
      ),
      child: Row(
        children: [
          Icon(
            Icons.free_breakfast_outlined,
            color: Colors.grey[400],
            size: 24,
          ),
          const SizedBox(width: 12),
          Text(
            'Không có lịch học',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  /// Widget for Active Sessions tab - Thiết kế hiện đại
  Widget _buildActiveSessionsTab() {
    return FutureBuilder<List<AttendanceSession>>(
      future: _activeSessionsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          return _buildErrorWidget('Lỗi: ${snapshot.error}');
        } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
          return RefreshIndicator(
            onRefresh: () async => _refreshData(),
            color: const Color(0xFF667eea),
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                final session = snapshot.data![index];
                return _buildModernSessionCard(session);
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

  /// Widget for Attendance History tab - Nhóm theo môn học
  Widget _buildAttendanceHistoryTab() {
    return FutureBuilder<List<Attendance>>(
      future: _attendanceHistoryFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          return _buildErrorWidget('Lỗi: ${snapshot.error}');
        } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
          return RefreshIndicator(
            onRefresh: () async => _refreshData(),
            color: const Color(0xFF667eea),
            child: _buildAttendanceHistoryList(snapshot.data!),
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

  /// Widget to build modern schedule card
  Widget _buildModernScheduleCard(Schedule schedule) {
    final dayColors = _getDayColors(schedule.weekday);

    return Container(
      margin: const EdgeInsets.only(bottom: 12.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.0),
        boxShadow: [
          BoxShadow(
            color: dayColors[0].withOpacity(0.1),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16.0),
          onTap: () => _navigateToSessionList(schedule),
          child: Container(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                // Time indicator
                Container(
                  width: 4,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: dayColors,
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 16),

                // Time display
                SizedBox(
                  width: 70,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        schedule.startTime,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: dayColors[0],
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        schedule.endTime,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 16),

                // Subject info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        schedule.subjectName ?? 'Môn học',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D3748),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.person_outline,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              schedule.teacherName ?? 'Giáo viên',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey[600],
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            schedule.room ?? 'Phòng học',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: dayColors[0].withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              schedule.className ?? 'Lớp',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: dayColors[0],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 8),

                // Arrow icon
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: dayColors[0].withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 14,
                    color: dayColors[0],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Widget to build schedule card with enhanced design (legacy - keep for compatibility)
  // ignore: unused_element
  Widget _buildScheduleCard(Schedule schedule) {
    return _buildModernScheduleCard(schedule);
  }

  /// Build modern session card với thiết kế hiện đại
  Widget _buildModernSessionCard(AttendanceSession session) {
    final bool canAttend = session.isActive && (session.attendanceStatus == null || session.attendanceStatus == 'not_marked');
    final bool alreadyMarked = session.attendanceStatus != null && session.attendanceStatus != 'not_marked';

    return Container(
      margin: const EdgeInsets.only(bottom: 16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.0),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20.0),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: canAttend ? [Colors.green[400]!, Colors.green[600]!] : alreadyMarked ? [Colors.blue[400]!, Colors.blue[600]!] : [Colors.grey[400]!, Colors.grey[600]!],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(16.0), topRight: Radius.circular(16.0)),
            ),
            child: Row(
              children: [
                Container(
                  width: 50, height: 50,
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12.0)),
                  child: Icon(alreadyMarked ? Icons.check_circle : Icons.school_rounded, size: 26, color: Colors.white),
                ),
                const SizedBox(width: 16.0),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(session.subjectName ?? session.sessionName, style: const TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 4.0),
                      Text(session.className ?? 'Lớp', style: TextStyle(fontSize: 14.0, color: Colors.white.withOpacity(0.9))),
                    ],
                  ),
                ),
                _buildStatusChip(session),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(child: _buildInfoItem(icon: Icons.person_rounded, label: 'Giáo viên', value: session.teacherName ?? 'Chưa xác định')),
                    const SizedBox(width: 16),
                    Expanded(child: _buildInfoItem(icon: Icons.calendar_today_rounded, label: 'Ngày', value: _formatDate(session.sessionDate))),
                  ],
                ),
                const SizedBox(height: 16.0),
                Row(
                  children: [
                    Expanded(child: _buildInfoItem(icon: Icons.access_time_rounded, label: 'Thời gian', value: session.startTime, valueColor: Colors.blue[600])),
                    const SizedBox(width: 16),
                    Expanded(child: _buildAttendanceButton(session)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
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
            const Text(
              'Đã xảy ra lỗi',
              style: TextStyle(
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

  /// Format date helper
  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  /// Build attendance history list nhóm theo môn học
  Widget _buildAttendanceHistoryList(List<Attendance> attendances) {
    final Map<String, List<Attendance>> groupedBySubject = {};
    for (final attendance in attendances) {
      final subjectName = attendance.subjectName ?? 'Môn học không xác định';
      if (!groupedBySubject.containsKey(subjectName)) {
        groupedBySubject[subjectName] = [];
      }
      groupedBySubject[subjectName]!.add(attendance);
    }

    groupedBySubject.forEach((subject, attendanceList) {
      attendanceList.sort((a, b) => b.attendanceTime.compareTo(a.attendanceTime));
    });

    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: groupedBySubject.length,
      itemBuilder: (context, index) {
        final subject = groupedBySubject.keys.elementAt(index);
        final attendanceList = groupedBySubject[subject]!;
        return _buildSubjectAttendanceGroup(subject, attendanceList);
      },
    );
  }

  /// Build subject attendance group
  Widget _buildSubjectAttendanceGroup(String subjectName, List<Attendance> attendances) {
    final presentCount = attendances.where((a) => a.status == AttendanceStatus.present).length;
    final totalCount = attendances.length;
    final attendanceRate = totalCount > 0 ? (presentCount / totalCount * 100).round() : 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 20.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.0),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(20.0),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [Colors.indigo[400]!, Colors.indigo[600]!], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(16.0), topRight: Radius.circular(16.0)),
            ),
            child: Row(
              children: [
                Container(
                  width: 50, height: 50,
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12.0)),
                  child: const Icon(Icons.book_rounded, size: 26, color: Colors.white),
                ),
                const SizedBox(width: 16.0),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(subjectName, style: const TextStyle(fontSize: 18.0, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 4.0),
                      Text('$totalCount buổi học', style: TextStyle(fontSize: 14.0, color: Colors.white.withOpacity(0.9))),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                  child: Text('$attendanceRate%', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16.0),
            itemCount: attendances.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final attendance = attendances[index];
              return _buildAttendanceHistoryItem(attendance);
            },
          ),
        ],
      ),
    );
  }

  /// Helper methods
  Widget _buildAttendanceHistoryItem(Attendance attendance) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12.0),
        border: Border.all(color: attendance.status.color.withOpacity(0.3), width: 1),
      ),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: attendance.status.color.withOpacity(0.1), borderRadius: BorderRadius.circular(10.0)),
            child: Icon(
              attendance.status == AttendanceStatus.present ? Icons.check_circle_rounded : attendance.status == AttendanceStatus.late ? Icons.watch_later_rounded : Icons.cancel_rounded,
              size: 20, color: attendance.status.color,
            ),
          ),
          const SizedBox(width: 12.0),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: Text(_formatDate(attendance.attendanceTime), style: const TextStyle(fontSize: 14.0, fontWeight: FontWeight.w600, color: Colors.black87))),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: attendance.status.color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                      child: Text(attendance.status.displayName, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: attendance.status.color)),
                    ),
                  ],
                ),
                const SizedBox(height: 4.0),
                Text('${attendance.attendanceTime.hour}:${attendance.attendanceTime.minute.toString().padLeft(2, '0')}', style: TextStyle(fontSize: 13.0, color: Colors.grey[600])),
              ],
            ),
          ),
          if (attendance.confidenceScore != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(8)),
              child: Text('${(attendance.confidenceScore! * 100).toInt()}%', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.blue[700])),
            ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(AttendanceSession session) {
    String text;
    if (session.attendanceStatus != null && session.attendanceStatus != 'not_marked') {
      switch (session.attendanceStatus) {
        case 'present': text = 'Đã điểm danh'; break;
        case 'late': text = 'Muộn'; break;
        case 'absent': text = 'Vắng'; break;
        default: text = 'Chưa điểm danh';
      }
    } else if (session.isActive) {
      text = 'Đang mở';
    } else {
      text = 'Đã đóng';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
      child: Text(text, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white)),
    );
  }

  Widget _buildInfoItem({required IconData icon, required String label, required String value, Color? valueColor}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: Colors.grey[600]),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600], fontWeight: FontWeight.w500)),
          ],
        ),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: valueColor ?? Colors.black87)),
      ],
    );
  }

  Widget _buildAttendanceButton(AttendanceSession session) {
    final bool canAttend = session.isActive && (session.attendanceStatus == null || session.attendanceStatus == 'not_marked');
    final bool alreadyMarked = session.attendanceStatus != null && session.attendanceStatus != 'not_marked';

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: canAttend ? Colors.green[600] : alreadyMarked ? Colors.blue[600] : Colors.grey[400],
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
          padding: const EdgeInsets.symmetric(vertical: 12.0),
        ),
        onPressed: canAttend ? () => _navigateToAttendance(session) : null,
        child: Text(canAttend ? 'Điểm danh' : alreadyMarked ? 'Đã điểm danh' : 'Không khả dụng', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
      ),
    );
  }
}
