// lib/screens/admin/session_attendance_management_screen.dart
import 'package:face_attendance/models/attendance_models.dart';
import 'package:face_attendance/services/api_service.dart';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';

class SessionAttendanceManagementScreen extends StatefulWidget {
  const SessionAttendanceManagementScreen({super.key});

  @override
  State<SessionAttendanceManagementScreen> createState() =>
      _SessionAttendanceManagementScreenState();
}

class _SessionAttendanceManagementScreenState
    extends State<SessionAttendanceManagementScreen>
    with TickerProviderStateMixin {
  final Logger _logger = Logger();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Quản lý Phiên & Điểm danh'),
        backgroundColor: Colors.blueAccent,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Phiên điểm danh', icon: Icon(Icons.event)),
            Tab(text: 'Lịch sử điểm danh', icon: Icon(Icons.history)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          AttendanceSessionTab(),
          AttendanceHistoryTab(),
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

// Tab quản lý phiên điểm danh
class AttendanceSessionTab extends StatefulWidget {
  const AttendanceSessionTab({super.key});

  @override
  State<AttendanceSessionTab> createState() => _AttendanceSessionTabState();
}

class _AttendanceSessionTabState extends State<AttendanceSessionTab> {
  final Logger _logger = Logger();
  late Future<List<AttendanceSession>> _sessionsFuture;
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
      final apiService = ApiService();
      final response = await apiService.getSessions(
        date: _selectedDate,
        isActive: _selectedStatus == 'active'
            ? true
            : _selectedStatus == 'inactive'
                ? false
                : null,
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

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildFilterSection(),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              _refreshSessions();
            },
            child: FutureBuilder<List<AttendanceSession>>(
              future: _sessionsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting ||
                    _isLoading) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline,
                            size: 64, color: Colors.red[300]),
                        const SizedBox(height: 16),
                        Text(
                          'Lỗi: ${snapshot.error}',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.red[700]),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _refreshSessions,
                          child: const Text('Thử lại'),
                        ),
                      ],
                    ),
                  );
                } else if (snapshot.hasData) {
                  final sessions = snapshot.data!;
                  _logger.i('sessions: $sessions');
                  return _buildSessionsList(sessions);
                } else {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.event_busy, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('Không có dữ liệu phiên điểm danh.'),
                      ],
                    ),
                  );
                }
              },
            ),
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
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
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

  Widget _buildSessionsList(
    List<AttendanceSession> sessions,
  ) {
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
                      value: 'stop', child: Text('Kết thúc phiên')),
                const PopupMenuItem(value: 'edit', child: Text('Chỉnh sửa')),
                const PopupMenuItem(
                    value: 'delete',
                    child: Text('Xóa', style: TextStyle(color: Colors.red))),
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        ElevatedButton.icon(
                          onPressed: () => _viewSessionDetails(session),
                          icon: const Icon(Icons.visibility),
                          label: const Text('Chi tiết'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                          ),
                        ),
                        if (session.isActive)
                          ElevatedButton.icon(
                            onPressed: () => _manualAttendance(session),
                            icon: const Icon(Icons.edit),
                            label: const Text('Điểm danh thủ công'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              foregroundColor: Colors.white,
                            ),
                          ),
                      ],
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
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            count.toString(),
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }

  void _handleSessionAction(String action, AttendanceSession session) {
    switch (action) {
      case 'details':
        _viewSessionDetails(session);
        break;
      case 'stop':
        _stopSession(session);
        break;
      case 'edit':
        _editSession(session);
        break;
      case 'delete':
        _deleteSession(session);
        break;
    }
  }

  void _viewSessionDetails(AttendanceSession session) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => SessionDetailsScreen(session: session),
      ),
    );
  }

  void _manualAttendance(AttendanceSession session) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ManualAttendanceScreen(session: session),
      ),
    );
  }

  void _stopSession(AttendanceSession session) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Kết thúc phiên điểm danh'),
        content: Text(
            'Bạn có chắc muốn kết thúc phiên điểm danh "${session.subject}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              try {
                final apiService = ApiService();
                final response = await apiService.stopSession(session.id);

                if (response.success) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Đã kết thúc phiên điểm danh'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  }
                  _refreshSessions();
                } else {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Lỗi: ${response.error}'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Lỗi kết nối: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Kết thúc'),
          ),
        ],
      ),
    );
  }

  void _editSession(AttendanceSession session) {
    // TODO: Implement edit session dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Chức năng chỉnh sửa đang được phát triển')),
    );
  }

  void _deleteSession(AttendanceSession session) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa phiên điểm danh'),
        content: Text(
            'Bạn có chắc muốn xóa phiên điểm danh "${session.subject}"? Hành động này không thể hoàn tác.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              try {
                final apiService = ApiService();
                final response = await apiService.deleteSession(session.id);

                if (response.success) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Đã xóa phiên điểm danh'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  }
                  _refreshSessions();
                } else {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Lỗi: ${response.error}'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Lỗi kết nối: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
  }
}

// Tab lịch sử điểm danh
class AttendanceHistoryTab extends StatefulWidget {
  const AttendanceHistoryTab({super.key});

  @override
  State<AttendanceHistoryTab> createState() => _AttendanceHistoryTabState();
}

class _AttendanceHistoryTabState extends State<AttendanceHistoryTab> {
  final Logger _logger = Logger();
  late Future<List<Attendance>> _attendancesFuture;
  String _selectedClass = 'all';
  String _selectedStatus = 'all';
  DateTime _startDate = DateTime.now().subtract(const Duration(days: 7));
  DateTime _endDate = DateTime.now();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _attendancesFuture = _fetchAttendances();
  }

  Future<List<Attendance>> _fetchAttendances() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final apiService = ApiService();
      final response = await apiService.getAttendanceHistory(
        startDate: _startDate,
        endDate: _endDate,
        classId:
            _selectedClass == 'all' ? null : 1, // TODO: Map class names to IDs
        status: _selectedStatus == 'all' ? null : _selectedStatus,
      );

      if (response.success && response.data != null) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch attendance history: ${response.error}');
        throw Exception(response.error ?? 'Không thể tải lịch sử điểm danh');
      }
    } catch (e) {
      _logger.e('Error fetching attendance history: $e');
      throw Exception('Lỗi kết nối: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _refreshAttendances() {
    setState(() {
      _attendancesFuture = _fetchAttendances();
    });
  }

  String _getStatusDisplayName(String status) {
    switch (status) {
      case 'present':
        return 'Có mặt';
      case 'late':
        return 'Trễ';
      case 'absent':
        return 'Vắng';
      default:
        return 'Không xác định';
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'present':
        return Colors.green;
      case 'late':
        return Colors.orange;
      case 'absent':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildFilterSection(),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              _refreshAttendances();
            },
            child: FutureBuilder<List<Attendance>>(
              future: _attendancesFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting ||
                    _isLoading) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline,
                            size: 64, color: Colors.red[300]),
                        const SizedBox(height: 16),
                        Text(
                          'Lỗi: ${snapshot.error}',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.red[700]),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _refreshAttendances,
                          child: const Text('Thử lại'),
                        ),
                      ],
                    ),
                  );
                } else if (snapshot.hasData) {
                  final attendances = snapshot.data!;
                  for (var attendance in attendances) {
                    _logger.i(
                        'Attendance record: ${attendance.studentName}, Status: ${attendance.status}');
                  }
                  return _buildAttendancesList(attendances);
                } else {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.history, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('Không có dữ liệu điểm danh.'),
                      ],
                    ),
                  );
                }
              },
            ),
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
                  child: Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: DropdownButton<String>(
                      value: _selectedClass,
                      hint: const Text('Chọn lớp'),
                      isExpanded: true,
                      underline: const SizedBox(),
                      items: const [
                        DropdownMenuItem(
                            value: 'all', child: Text('Tất cả lớp')),
                        DropdownMenuItem(
                            value: 'CNTT K47', child: Text('CNTT K47')),
                        DropdownMenuItem(
                            value: 'KTPM K46', child: Text('KTPM K46')),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _selectedClass = value!;
                        });
                        _refreshAttendances();
                      },
                    ),
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
                            value: 'present', child: Text('Có mặt')),
                        DropdownMenuItem(value: 'late', child: Text('Trễ')),
                        DropdownMenuItem(value: 'absent', child: Text('Vắng')),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _selectedStatus = value!;
                        });
                        _refreshAttendances();
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Card(
                  child: ListTile(
                    dense: true,
                    title:
                        const Text('Từ ngày', style: TextStyle(fontSize: 14)),
                    subtitle: Text(
                        '${_startDate.day}/${_startDate.month}/${_startDate.year}'),
                    trailing: const Icon(Icons.calendar_today, size: 20),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: _startDate,
                        firstDate:
                            DateTime.now().subtract(const Duration(days: 365)),
                        lastDate: DateTime.now(),
                      );
                      if (date != null) {
                        setState(() {
                          _startDate = date;
                        });
                        _refreshAttendances();
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Card(
                  child: ListTile(
                    dense: true,
                    title:
                        const Text('Đến ngày', style: TextStyle(fontSize: 14)),
                    subtitle: Text(
                        '${_endDate.day}/${_endDate.month}/${_endDate.year}'),
                    trailing: const Icon(Icons.calendar_today, size: 20),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: _endDate,
                        firstDate: _startDate,
                        lastDate: DateTime.now(),
                      );
                      if (date != null) {
                        setState(() {
                          _endDate = date;
                        });
                        _refreshAttendances();
                      }
                    },
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAttendancesList(List<Attendance> attendances) {
    if (attendances.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('Không tìm thấy bản ghi điểm danh nào.'),
            Text('Thử thay đổi bộ lọc hoặc khoảng thời gian.',
                style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: attendances.length,
      itemBuilder: (context, index) {
        final attendance = attendances[index];
        _logger.i(
            'Attendance record: ${attendance.studentName}, Status: ${attendance.status}');
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          elevation: 2,
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: _getStatusColor(attendance.status.toString()),
              child: Text(
                attendance.studentName?.isNotEmpty == true
                    ? attendance.studentName![0].toUpperCase()
                    : 'S',
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
            title: Text(
              attendance.studentName ?? 'Không xác định',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                    '${attendance.studentCode ?? ''} - ${attendance.className ?? ''}'),
                if (attendance.subjectName != null)
                  Text('Môn: ${attendance.subjectName}'),
                Text(
                    '${attendance.attendanceTime.day}/${attendance.attendanceTime.month}/${attendance.attendanceTime.year} ${attendance.attendanceTime.hour}:${attendance.attendanceTime.minute.toString().padLeft(2, '0')}'),
                if (attendance.confidenceScore != null)
                  Text(
                      'Độ tin cậy: ${(attendance.confidenceScore! * 100).toStringAsFixed(1)}%'),
              ],
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Chip(
                  label: Text(
                    _getStatusDisplayName(attendance.status.toString()),
                    style: const TextStyle(fontSize: 12, color: Colors.white),
                  ),
                  backgroundColor:
                      _getStatusColor(attendance.status.toString()),
                ),
                PopupMenuButton<String>(
                  onSelected: (value) =>
                      _handleAttendanceAction(value, attendance),
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                        value: 'edit', child: Text('Chỉnh sửa')),
                    const PopupMenuItem(
                        value: 'delete',
                        child:
                            Text('Xóa', style: TextStyle(color: Colors.red))),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _handleAttendanceAction(String action, Attendance attendance) {
    switch (action) {
      case 'edit':
        _editAttendance(attendance);
        break;
      case 'delete':
        _deleteAttendance(attendance);
        break;
    }
  }

  void _editAttendance(Attendance attendance) {
    showDialog(
      context: context,
      builder: (context) => EditAttendanceDialog(
        attendance: attendance,
        onSave: (updatedData) async {
          _logger.i('Editing attendance: $updatedData');
          // TODO: Implement API call for updating attendance
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Chức năng chỉnh sửa đang được phát triển'),
            ),
          );
          _refreshAttendances();
        },
      ),
    );
  }

  void _deleteAttendance(Attendance attendance) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa bản ghi điểm danh'),
        content: Text(
            'Bạn có chắc muốn xóa bản ghi điểm danh của ${attendance.studentName}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              // TODO: Implement API call for deleting attendance
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Chức năng xóa đang được phát triển'),
                ),
              );
              _refreshAttendances();
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
  }
}

// Màn hình chi tiết phiên điểm danh
class SessionDetailsScreen extends StatefulWidget {
  final AttendanceSession session;

  const SessionDetailsScreen({super.key, required this.session});

  @override
  State<SessionDetailsScreen> createState() => _SessionDetailsScreenState();
}

class _SessionDetailsScreenState extends State<SessionDetailsScreen> {
  final Logger _logger = Logger();
  late Future<Map<String, dynamic>> _sessionDetailsFuture;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _sessionDetailsFuture = _fetchSessionDetails();
  }

  Future<Map<String, dynamic>> _fetchSessionDetails() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final apiService = ApiService();
      final response = await apiService.getSessionAttendance(widget.session.id);

      if (response.success && response.data != null) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch session details: ${response.error}');
        throw Exception(response.error ?? 'Không thể tải chi tiết phiên');
      }
    } catch (e) {
      _logger.e('Error fetching session details: $e');
      throw Exception('Lỗi kết nối: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Chi tiết phiên điểm danh'),
        backgroundColor: Colors.blueAccent,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isLoading
                ? null
                : () {
                    setState(() {
                      _sessionDetailsFuture = _fetchSessionDetails();
                    });
                  },
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSessionInfo(),
          Expanded(
            child: FutureBuilder<Map<String, dynamic>>(
              future: _sessionDetailsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting ||
                    _isLoading) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline,
                            size: 64, color: Colors.red[300]),
                        const SizedBox(height: 16),
                        Text(
                          'Lỗi: ${snapshot.error}',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.red[700]),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _sessionDetailsFuture = _fetchSessionDetails();
                            });
                          },
                          child: const Text('Thử lại'),
                        ),
                      ],
                    ),
                  );
                } else if (snapshot.hasData) {
                  final responseData = snapshot.data!;
                  _logger.i('Session detailsss: $responseData');

                  final attendances =
                      responseData['attendances'] as List<Attendance>? ?? [];

                  final statistics =
                      responseData['statistics'] as Map<String, dynamic>? ?? {};

                  return _buildAttendancesList(attendances, statistics);
                } else {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.event_busy, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('Không có dữ liệu điểm danh.'),
                      ],
                    ),
                  );
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSessionInfo() {
    return Card(
      margin: const EdgeInsets.all(16),
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${widget.session.subject} - ${widget.session.className}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            if (widget.session.teacherName != null)
              Text('Giáo viên: ${widget.session.teacherName}'),
            Text(
                'Ngày: ${widget.session.sessionDate.day}/${widget.session.sessionDate.month}/${widget.session.sessionDate.year}'),
            Text(
                'Thời gian: ${widget.session.startTime}${widget.session.endTime != null ? ' - ${widget.session.endTime}' : ''}'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: widget.session.isActive
                    ? Colors.green.withOpacity(0.1)
                    : Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: widget.session.isActive ? Colors.green : Colors.red,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    widget.session.isActive
                        ? Icons.play_circle
                        : Icons.stop_circle,
                    color: widget.session.isActive ? Colors.green : Colors.red,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    widget.session.isActive ? 'Đang hoạt động' : 'Đã kết thúc',
                    style: TextStyle(
                      color:
                          widget.session.isActive ? Colors.green : Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendancesList(
      List<Attendance> attendances, Map<String, dynamic> statistics) {
    return Column(
      children: [
        // Statistics Row
        if (statistics.isNotEmpty)
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildStatColumn(
                      'Tổng', statistics['total_students'] ?? 0, Colors.blue),
                  _buildStatColumn(
                      'Có mặt', statistics['present'] ?? 0, Colors.green),
                  _buildStatColumn(
                      'Trễ', statistics['late'] ?? 0, Colors.orange),
                  _buildStatColumn(
                      'Vắng', statistics['absent'] ?? 0, Colors.red),
                ],
              ),
            ),
          ),

        // Attendances List
        Expanded(
          child: attendances.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.people_outline, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('Chưa có sinh viên nào điểm danh.'),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: attendances.length,
                  itemBuilder: (context, index) {
                    final attendance = attendances[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor:
                              _getStatusColor(attendance.status.toString()),
                          child: Text(
                            attendance.studentName?.isNotEmpty == true
                                ? attendance.studentName![0].toUpperCase()
                                : 'S',
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold),
                          ),
                        ),
                        title: Text(
                          attendance.studentName ?? 'Không xác định',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(attendance.studentCode ?? ''),
                            Text(
                              'Điểm danh: ${attendance.attendanceTime.hour}:${attendance.attendanceTime.minute.toString().padLeft(2, '0')}',
                            ),
                            if (attendance.confidenceScore != null)
                              Text(
                                'Độ tin cậy: ${(attendance.confidenceScore! * 100).toStringAsFixed(1)}%',
                                style: TextStyle(
                                  color: attendance.confidenceScore! > 0.8
                                      ? Colors.green
                                      : Colors.orange,
                                  fontSize: 12,
                                ),
                              ),
                          ],
                        ),
                        trailing: Chip(
                          label: Text(
                            _getStatusDisplayName(attendance.status.toString()),
                            style: const TextStyle(
                                fontSize: 12, color: Colors.white),
                          ),
                          backgroundColor:
                              _getStatusColor(attendance.status.toString()),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildStatColumn(String label, int count, Color color) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            count.toString(),
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
      ],
    );
  }

  String _getStatusDisplayName(String status) {
    switch (status) {
      case 'present':
        return 'Có mặt';
      case 'late':
        return 'Trễ';
      case 'absent':
        return 'Vắng';
      default:
        return 'Không xác định';
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'present':
        return Colors.green;
      case 'late':
        return Colors.orange;
      case 'absent':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}

// Màn hình điểm danh thủ công
class ManualAttendanceScreen extends StatefulWidget {
  final AttendanceSession session;

  const ManualAttendanceScreen({super.key, required this.session});

  @override
  State<ManualAttendanceScreen> createState() => _ManualAttendanceScreenState();
}

class _ManualAttendanceScreenState extends State<ManualAttendanceScreen> {
  final Logger _logger = Logger();
  late Future<List<StudentAttendanceStatus>> _studentsFuture;
  List<StudentAttendanceStatus> _students = [];
  bool _hasChanges = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _studentsFuture = _fetchStudentsWithStatus();
  }

  Future<List<StudentAttendanceStatus>> _fetchStudentsWithStatus() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // TODO: Implement API call to get students with their current attendance status
      // For now, using mock data
      await Future.delayed(const Duration(seconds: 1));

      final mockStudents = [
        StudentAttendanceStatus(
          studentId: 1,
          studentName: 'Nguyễn Văn A',
          studentCode: 'SV001',
          currentStatus: 'present',
        ),
        StudentAttendanceStatus(
          studentId: 2,
          studentName: 'Trần Thị B',
          studentCode: 'SV002',
          currentStatus: 'late',
        ),
        StudentAttendanceStatus(
          studentId: 3,
          studentName: 'Lê Văn C',
          studentCode: 'SV003',
          currentStatus: 'absent',
        ),
        StudentAttendanceStatus(
          studentId: 4,
          studentName: 'Phạm Thị D',
          studentCode: 'SV004',
          currentStatus: 'absent',
        ),
        StudentAttendanceStatus(
          studentId: 5,
          studentName: 'Hoàng Văn E',
          studentCode: 'SV005',
          currentStatus: 'present',
        ),
      ];

      _students = mockStudents;
      return mockStudents;
    } catch (e) {
      _logger.e('Error fetching students: $e');
      throw Exception('Lỗi kết nối: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (_hasChanges) {
              _showUnsavedChangesDialog();
            } else {
              Navigator.pop(context);
            }
          },
        ),
        title: const Text('Điểm danh thủ công'),
        backgroundColor: Colors.blueAccent,
        actions: [
          TextButton(
            onPressed: _hasChanges && !_isLoading ? _saveAttendances : null,
            child: Text(
              'Lưu',
              style: TextStyle(
                color:
                    _hasChanges ? Colors.white : Colors.white.withOpacity(0.5),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSessionInfo(),
          _buildStatusSummary(),
          Expanded(
            child: FutureBuilder<List<StudentAttendanceStatus>>(
              future: _studentsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting ||
                    _isLoading) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline,
                            size: 64, color: Colors.red[300]),
                        const SizedBox(height: 16),
                        Text(
                          'Lỗi: ${snapshot.error}',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.red[700]),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _studentsFuture = _fetchStudentsWithStatus();
                            });
                          },
                          child: const Text('Thử lại'),
                        ),
                      ],
                    ),
                  );
                } else if (snapshot.hasData) {
                  return _buildStudentsList(snapshot.data!);
                } else {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.people_outline,
                            size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('Không có dữ liệu sinh viên.'),
                      ],
                    ),
                  );
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSessionInfo() {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${widget.session.subject} - ${widget.session.className}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            if (widget.session.teacherName != null)
              Text('Giáo viên: ${widget.session.teacherName}'),
            Text(
              'Ngày: ${widget.session.sessionDate.day}/${widget.session.sessionDate.month}/${widget.session.sessionDate.year}',
            ),
            Text('Thời gian: ${widget.session.startTime}'),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusSummary() {
    if (_students.isEmpty) return const SizedBox();

    final presentCount =
        _students.where((s) => s.currentStatus == 'present').length;
    final lateCount = _students.where((s) => s.currentStatus == 'late').length;
    final absentCount =
        _students.where((s) => s.currentStatus == 'absent').length;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildSummaryItem('Có mặt', presentCount, Colors.green),
            _buildSummaryItem('Trễ', lateCount, Colors.orange),
            _buildSummaryItem('Vắng', absentCount, Colors.red),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryItem(String label, int count, Color color) {
    return Column(
      children: [
        Text(
          count.toString(),
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildStudentsList(List<StudentAttendanceStatus> students) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: students.length,
      itemBuilder: (context, index) {
        final student = students[index];
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: _getStatusColor(student.currentStatus),
              child: Text(
                student.studentName[0].toUpperCase(),
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
            title: Text(
              student.studentName,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(student.studentCode),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: DropdownButton<String>(
                value: student.currentStatus,
                underline: const SizedBox(),
                items: const [
                  DropdownMenuItem(
                    value: 'present',
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle, color: Colors.green, size: 20),
                        SizedBox(width: 8),
                        Text('Có mặt'),
                      ],
                    ),
                  ),
                  DropdownMenuItem(
                    value: 'late',
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.access_time, color: Colors.orange, size: 20),
                        SizedBox(width: 8),
                        Text('Trễ'),
                      ],
                    ),
                  ),
                  DropdownMenuItem(
                    value: 'absent',
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.cancel, color: Colors.red, size: 20),
                        SizedBox(width: 8),
                        Text('Vắng'),
                      ],
                    ),
                  ),
                ],
                onChanged: (newStatus) {
                  if (newStatus != null && newStatus != student.currentStatus) {
                    setState(() {
                      student.currentStatus = newStatus;
                      _hasChanges = true;
                    });
                  }
                },
              ),
            ),
          ),
        );
      },
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'present':
        return Colors.green;
      case 'late':
        return Colors.orange;
      case 'absent':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  void _showUnsavedChangesDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Thay đổi chưa được lưu'),
        content: const Text('Bạn có muốn lưu những thay đổi trước khi thoát?'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop();
            },
            child: const Text('Không lưu'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _saveAttendances();
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  void _saveAttendances() async {
    setState(() {
      _isLoading = true;
    });

    try {
      _logger.i('Saving manual attendances for session: ${widget.session.id}');

      // TODO: Implement API call to save attendances
      // For now, simulate API call
      await Future.delayed(const Duration(seconds: 1));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã lưu điểm danh thành công'),
            backgroundColor: Colors.green,
          ),
        );

        setState(() {
          _hasChanges = false;
        });

        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khi lưu: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
}

// Dialog chỉnh sửa điểm danh
class EditAttendanceDialog extends StatefulWidget {
  final Attendance attendance;
  final Function(Map<String, dynamic>) onSave;

  const EditAttendanceDialog({
    super.key,
    required this.attendance,
    required this.onSave,
  });

  @override
  State<EditAttendanceDialog> createState() => _EditAttendanceDialogState();
}

class _EditAttendanceDialogState extends State<EditAttendanceDialog> {
  late String _selectedStatus;
  late DateTime _selectedDateTime;

  @override
  void initState() {
    super.initState();
    _selectedStatus = widget.attendance.status.toString();
    _selectedDateTime = widget.attendance.attendanceTime;
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Chỉnh sửa điểm danh'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Sinh viên: ${widget.attendance.studentName}'),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _selectedStatus,
            decoration: const InputDecoration(labelText: 'Trạng thái'),
            items: const [
              DropdownMenuItem(value: 'present', child: Text('Có mặt')),
              DropdownMenuItem(value: 'late', child: Text('Trễ')),
              DropdownMenuItem(value: 'absent', child: Text('Vắng')),
            ],
            onChanged: (value) {
              setState(() {
                _selectedStatus = value!;
              });
            },
          ),
          const SizedBox(height: 16),
          ListTile(
            title: const Text('Thời gian điểm danh'),
            subtitle: Text(
                '${_selectedDateTime.day}/${_selectedDateTime.month}/${_selectedDateTime.year} ${_selectedDateTime.hour}:${_selectedDateTime.minute.toString().padLeft(2, '0')}'),
            trailing: const Icon(Icons.edit),
            onTap: () async {
              final date = await showDatePicker(
                context: context,
                initialDate: _selectedDateTime,
                firstDate: DateTime.now().subtract(const Duration(days: 30)),
                lastDate: DateTime.now(),
              );
              if (date != null) {
                final time = await showTimePicker(
                  context: context,
                  initialTime: TimeOfDay.fromDateTime(_selectedDateTime),
                );
                if (time != null) {
                  setState(() {
                    _selectedDateTime = DateTime(
                      date.year,
                      date.month,
                      date.day,
                      time.hour,
                      time.minute,
                    );
                  });
                }
              }
            },
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Hủy'),
        ),
        TextButton(
          onPressed: () {
            widget.onSave({
              'id': widget.attendance.id,
              'status': _selectedStatus,
              'attendance_time': _selectedDateTime.toIso8601String(),
            });
            Navigator.of(context).pop();
          },
          child: const Text('Lưu'),
        ),
      ],
    );
  }
}

class StudentAttendanceStatus {
  final int studentId;
  final String studentName;
  final String studentCode;
  String currentStatus;

  StudentAttendanceStatus({
    required this.studentId,
    required this.studentName,
    required this.studentCode,
    required this.currentStatus,
  });
}
