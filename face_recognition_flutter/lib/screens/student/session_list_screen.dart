// lib/screens/session_list_screen.dart
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../models/attendance_models.dart';
import '../../services/api_service.dart';
import 'face_capture_screen.dart';

class SessionListScreen extends StatefulWidget {
  final int userId;
  final int courseSectionId;
  final String courseSectionName;
  final VoidCallback onAttendanceMarked;

  const SessionListScreen({
    super.key,
    required this.userId,
    required this.courseSectionId,
    required this.courseSectionName,
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
    _sessionsFuture = _fetchSessions(widget.courseSectionId);
  }

  /// Fetch sessions for the selected course section
  Future<List<AttendanceSession>> _fetchSessions(int courseSectionId) async {
    try {
      // Gọi API để lấy tất cả các phiên điểm danh cho course section
      final response = await ApiService().getSessions();
      if (response.success) {
        // Lọc danh sách sessions để chỉ lấy những session có courseSectionId phù hợp
        final sessions = response.data!
            .where((session) => session.courseSectionId == courseSectionId)
            .toList();
        _logger.i('Fetched ${sessions.length} sessions for courseSectionId $courseSectionId');
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
              _sessionsFuture = _fetchSessions(widget.courseSectionId);
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
      backgroundColor: const Color(0xFFF8F9FA),
      body: CustomScrollView(
        slivers: [
          // Modern app bar with gradient
          SliverAppBar(
            expandedHeight: 50,
            floating: false,
            pinned: true,
            elevation: 0,
            backgroundColor: const Color(0xFF667eea),
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              title: Text(
                widget.courseSectionName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
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
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () => Navigator.of(context).pop(),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                onPressed: () {
                  setState(() {
                    _sessionsFuture = _fetchSessions(widget.courseSectionId);
                  });
                },
                tooltip: 'Làm mới',
              ),
            ],
          ),
          
          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeaderInfo(),
                  const SizedBox(height: 24),
                  _buildSessionsList(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderInfo() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF667eea), Color(0xFF764ba2)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.class_outlined,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Danh sách phiên điểm danh',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D3748),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Chọn phiên để thực hiện điểm danh',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSessionsList() {
    return FutureBuilder<List<AttendanceSession>>(
      future: _sessionsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildLoadingState();
        } else if (snapshot.hasError) {
          return _buildErrorWidget(snapshot.error.toString());
        } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
          return _buildSessionsGrid(snapshot.data!);
        } else {
          return _buildEmptyState();
        }
      },
    );
  }

  Widget _buildLoadingState() {
    return Container(
      padding: const EdgeInsets.all(40),
      child: const Column(
        children: [
          CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF667eea)),
          ),
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
  }

  Widget _buildSessionsGrid(List<AttendanceSession> sessions) {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() {
          _logger.i('Refreshing session list');
          _sessionsFuture = _fetchSessions(widget.courseSectionId);
        });
      },
      color: const Color(0xFF667eea),
      child: ListView.builder(
        padding: EdgeInsets.zero,
        itemCount: sessions.length,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemBuilder: (context, index) {
          final session = sessions[index];
          return _buildModernSessionCard(session);
        },
      ),
    );
  }

  /// Build modern session card
  Widget _buildModernSessionCard(AttendanceSession session) {
    final isActive = session.isActive;
    final statusColor = isActive ? const Color(0xFF10B981) : const Color(0xFF6B7280);
    final statusBgColor = isActive ? const Color(0xFFECFDF5) : const Color(0xFFF3F4F6);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: isActive ? () => _navigateToAttendance(session) : null,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row
                Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isActive 
                            ? [const Color(0xFF10B981), const Color(0xFF059669)]
                            : [const Color(0xFF6B7280), const Color(0xFF4B5563)],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        isActive ? Icons.play_circle_outline : Icons.pause_circle_outline,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            session.sessionName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _formatDate(session.sessionDate),
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: statusBgColor,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        isActive ? 'Đang mở' : 'Đã đóng',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Session details
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      _buildDetailRow(
                        Icons.access_time_outlined,
                        'Thời gian',
                        '${session.startTime} - ${session.endTime ?? 'Chưa kết thúc'}',
                      ),
                      const SizedBox(height: 8),
                      _buildDetailRow(
                        Icons.person_outline,
                        'Giảng viên',
                        session.teacherName ?? 'Chưa xác định',
                      ),
                      if (session.className != null) ...[
                        const SizedBox(height: 8),
                        _buildDetailRow(
                          Icons.class_outlined,
                          'Lớp học',
                          session.className!,
                        ),
                      ],
                    ],
                  ),
                ),
                
                if (isActive) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ElevatedButton(
                      onPressed: () => _navigateToAttendance(session),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.face_retouching_natural, color: Colors.white),
                          SizedBox(width: 8),
                          Text(
                            'Thực hiện điểm danh',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: const Color(0xFF6B7280),
        ),
        const SizedBox(width: 8),
        Text(
          '$label:',
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF6B7280),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1F2937),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(40),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(40),
            ),
            child: Icon(
              Icons.event_busy,
              size: 40,
              color: Colors.grey[400],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Không có phiên điểm danh',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Hiện tại chưa có phiên điểm danh nào cho môn học này.',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget(String error) {
    return Container(
      padding: const EdgeInsets.all(40),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.red[50],
              borderRadius: BorderRadius.circular(40),
            ),
            child: Icon(
              Icons.error_outline,
              size: 40,
              color: Colors.red[400],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Đã xảy ra lỗi',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              setState(() {
                _sessionsFuture = _fetchSessions(widget.courseSectionId);
              });
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Thử lại'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF667eea),
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  /// Widget to build enhanced session card (legacy)
  // ignore: unused_element
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
                              session.sessionName,
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
                        session.className ?? "Chưa có tên",
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
                  if (session.attendanceCount != null || session.totalStudents != null) ...[
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
    );
  }
}