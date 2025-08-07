// lib/screens/session_list_screen.dart
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../models/attendance_models.dart';
import '../../services/api_service.dart';
import 'face_capture_screen.dart';

class SessionListScreen extends StatefulWidget {
  final int userId;
  final int scheduleId;
  final String scheduleName;
  final VoidCallback onAttendanceMarked;

  const SessionListScreen({
    super.key,
    required this.userId,
    required this.scheduleId,
    required this.scheduleName,
    required this.onAttendanceMarked,
  });

  @override
  State<SessionListScreen> createState() => _SessionListScreenState();
}

class _SessionListScreenState extends State<SessionListScreen> {
  final Logger _logger = Logger();
  late Future<List<AttendanceSession>> _sessionsFuture;

  @override
  void initState() {
    super.initState();
    _sessionsFuture = _fetchSessions(widget.scheduleId);
  }

  /// Fetch sessions for the selected schedule
  Future<List<AttendanceSession>> _fetchSessions(int scheduleId) async {
  try {
    // Gọi API để lấy tất cả các phiên điểm danh.
    final response = await ApiService().getSessions();
    if (response.success) {
      // Lọc danh sách sessions để chỉ lấy những session có scheduleId phù hợp
      final sessions = response.data!
          .where((session) => session.scheduleId == scheduleId)
          .toList();
      _logger.i('Fetched ${sessions.length} sessions for scheduleId $scheduleId');
      return sessions;
    } else {
      _logger.e('Failed to fetch sessions: ${response.message}');
      return [];
    }
  } catch (e) {
    _logger.e('Error fetching sessions: $e');
    throw Exception('Failed to load sessions');
  }
}

  /// Navigate to attendance screen
  void _navigateToAttendance(AttendanceSession session) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => FaceCaptureScreen(
          userId: widget.userId,
          sessionId: session.id,
          onFaceTrained: () {
            widget.onAttendanceMarked();
            // Refresh the session list after attendance
            setState(() {
              _sessionsFuture = _fetchSessions(widget.scheduleId);
            });
          },
        ),
      ),
    );
  }

  /// Format date for display
  String _formatDate(DateTime date) {
    final months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
      'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
      'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    
    final weekdays = [
      'Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư',
      'Thứ năm', 'Thứ sáu', 'Thứ bảy'
    ];
    
    return '${weekdays[date.weekday % 7]}, ${date.day} ${months[date.month - 1]} ${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          widget.scheduleName,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              setState(() {
                _sessionsFuture = _fetchSessions(widget.scheduleId);
              });
            },
            tooltip: 'Làm mới',
          ),
        ],
      ),
      body: FutureBuilder<List<AttendanceSession>>(
        future: _sessionsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text(
                    'Đang tải danh sách phiên điểm danh...',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            );
          } else if (snapshot.hasError) {
            return _buildErrorWidget(snapshot.error.toString());
          } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
            return RefreshIndicator(
              onRefresh: () async {
                setState(() {
                  _logger.i('Refreshing session list');
                  _sessionsFuture = _fetchSessions(widget.scheduleId);
                });
              },
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
            return _buildEmptyState();
          }
        },
      ),
    );
  }

  /// Widget to build enhanced session card
  Widget _buildSessionCard(AttendanceSession session) {
    final bool canAttend = session.isActive;
    final DateTime now = DateTime.now();
    final DateTime sessionDateTime = DateTime(
      session.sessionDate.year,
      session.sessionDate.month,
      session.sessionDate.day,
    );
    
    // Check if session is today
    final bool isToday = sessionDateTime.day == now.day &&
        sessionDateTime.month == now.month &&
        sessionDateTime.year == now.year;

    return Container(
      margin: const EdgeInsets.only(bottom: 16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: isToday ? Colors.blue[200]! : Colors.transparent,
          width: isToday ? 2 : 0,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with subject and status
            Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: canAttend 
                          ? [Colors.green[400]!, Colors.green[600]!]
                          : [Colors.grey[400]!, Colors.grey[600]!],
                    ),
                    borderRadius: BorderRadius.circular(12.0),
                  ),
                  child: Icon(
                    canAttend ? Icons.school_rounded : Icons.lock_rounded,
                    size: 26,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 16.0),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              session.subject,
                              style: const TextStyle(
                                fontSize: 18.0,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                          ),
                          if (isToday)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8.0,
                                vertical: 4.0,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.blue[50],
                                border: Border.all(color: Colors.blue[300]!),
                                borderRadius: BorderRadius.circular(12.0),
                              ),
                              child: Text(
                                'Hôm nay',
                                style: TextStyle(
                                  fontSize: 11.0,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.blue[700],
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4.0),
                      Text(
                        session.className,
                        style: TextStyle(
                          fontSize: 14.0,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16.0),
            
            // Session details
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12.0),
              ),
              child: Column(
                children: [
                  _buildInfoRow(
                    icon: Icons.calendar_today_rounded,
                    label: 'Ngày học',
                    value: _formatDate(session.sessionDate),
                    color: Colors.blue[600]!,
                  ),
                  const SizedBox(height: 12.0),
                  _buildInfoRow(
                    icon: Icons.access_time_rounded,
                    label: 'Thời gian',
                    value: session.endTime != null 
                        ? '${session.startTime} - ${session.endTime}'
                        : session.startTime,
                    color: Colors.orange[600]!,
                  ),
                  const SizedBox(height: 12.0),
                  _buildInfoRow(
                    icon: Icons.person_rounded,
                    label: 'Giáo viên',
                    value: session.teacherName ?? 'Chưa xác định',
                    color: Colors.green[600]!,
                  ),
                  if (session.totalStudents != null || session.presentCount != null) ...[
                    const SizedBox(height: 12.0),
                    _buildAttendanceStats(session),
                  ],
                ],
              ),
            ),
            
            const SizedBox(height: 16.0),
            
            // Status and action button
            Row(
              children: [
                // Status indicator
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12.0,
                    vertical: 6.0,
                  ),
                  decoration: BoxDecoration(
                    color: canAttend ? Colors.green[50] : Colors.grey[100],
                    border: Border.all(
                      color: canAttend ? Colors.green[200]! : Colors.grey[300]!,
                    ),
                    borderRadius: BorderRadius.circular(20.0),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: canAttend ? Colors.green : Colors.grey,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6.0),
                      Text(
                        canAttend ? 'Đang mở' : 'Đã đóng',
                        style: TextStyle(
                          fontSize: 12.0,
                          fontWeight: FontWeight.w600,
                          color: canAttend ? Colors.green[700] : Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                
                const Spacer(),
                
                // Action button
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: canAttend ? Colors.blue[600] : Colors.grey[400],
                    foregroundColor: Colors.white,
                    elevation: canAttend ? 3 : 1,
                    shadowColor: canAttend ? Colors.blue[200] : Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.0),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20.0,
                      vertical: 12.0,
                    ),
                  ),
                  onPressed: canAttend ? () => _navigateToAttendance(session) : null,
                  icon: Icon(
                    canAttend ? Icons.face_rounded : Icons.lock_rounded,
                    size: 20,
                  ),
                  label: Text(
                    canAttend ? 'Điểm danh' : 'Không khả dụng',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Widget to build info row
  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8.0),
        Text(
          '$label:',
          style: TextStyle(
            fontSize: 14.0,
            color: Colors.grey[700],
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(width: 8.0),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14.0,
              color: Colors.black87,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  /// Widget to build attendance statistics
  Widget _buildAttendanceStats(AttendanceSession session) {
    return Container(
      padding: const EdgeInsets.all(12.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8.0),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Icon(Icons.groups_rounded, size: 18, color: Colors.blue[600]),
          const SizedBox(width: 8.0),
          Text(
            'Thống kê:',
            style: TextStyle(
              fontSize: 14.0,
              color: Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
          ),
          const Spacer(),
          if (session.totalStudents != null)
            _buildStatChip(
              'Tổng: ${session.totalStudents}',
              Colors.blue[100]!,
              Colors.blue[700]!,
            ),
          if (session.presentCount != null) ...[
            const SizedBox(width: 8.0),
            _buildStatChip(
              'Có mặt: ${session.presentCount}',
              Colors.green[100]!,
              Colors.green[700]!,
            ),
          ],
        ],
      ),
    );
  }

  /// Widget to build stat chip
  Widget _buildStatChip(String text, Color bgColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12.0),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12.0,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  /// Widget for empty state
  Widget _buildEmptyState() {
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
                Icons.event_busy_rounded,
                size: 40,
                color: Colors.grey[400],
              ),
            ),
            const SizedBox(height: 24.0),
            const Text(
              'Không có phiên điểm danh',
              style: TextStyle(
                fontSize: 18.0,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8.0),
            Text(
              'Hiện tại chưa có phiên điểm danh nào cho môn học này.',
              style: TextStyle(
                fontSize: 14.0,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24.0),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _sessionsFuture = _fetchSessions(widget.scheduleId);
                });
              },
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
              onPressed: () {
                setState(() {
                  _sessionsFuture = _fetchSessions(widget.scheduleId);
                });
              },
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