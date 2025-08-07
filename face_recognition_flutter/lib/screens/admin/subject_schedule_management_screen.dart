// lib/screens/admin/subject_schedule_management_screen.dart
import 'package:face_attendance/models/class.dart';
import 'package:face_attendance/models/subject.dart';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';

class SubjectScheduleManagementScreen extends StatefulWidget {
  const SubjectScheduleManagementScreen({super.key});

  @override
  State<SubjectScheduleManagementScreen> createState() =>
      _SubjectScheduleManagementScreenState();
}

class _SubjectScheduleManagementScreenState
    extends State<SubjectScheduleManagementScreen>
    with TickerProviderStateMixin {
  // ignore: unused_field
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
        title: const Text('Quản lý Môn học & Lịch học'),
        backgroundColor: Colors.blueAccent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Môn học', icon: Icon(Icons.book)),
            Tab(text: 'Lịch học', icon: Icon(Icons.schedule)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          SubjectManagementTab(),
          ScheduleManagementTab(),
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

class SubjectManagementTab extends StatefulWidget {
  const SubjectManagementTab({super.key});

  @override
  State<SubjectManagementTab> createState() => _SubjectManagementTabState();
}

class _SubjectManagementTabState extends State<SubjectManagementTab> {
  final Logger _logger = Logger();
  late Future<List<Subject>> _subjectsFuture;
  String _searchQuery = '';
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _subjectsFuture = _fetchSubjects();
  }

  Future<List<Subject>> _fetchSubjects() async {
    try {
      final response = await _apiService.getSubjects(name: _searchQuery);
      if (response.success) {
        _logger.i('Fetched subjects: ${response.data!.length} items');
        return response.data!;
      } else {
        throw Exception(response.error);
      }
    } catch (e) {
      _logger.e('Fetch subjects error: $e');
      rethrow;
    }
  }

  void _refreshSubjects() {
    setState(() {
      _subjectsFuture = _fetchSubjects();
    });
  }

  List<Subject> _filterSubjects(List<Subject> subjects) {
    if (_searchQuery.isEmpty) return subjects;
    return subjects.where((subject) {
      return subject.name.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildSearchSection(),
        Expanded(
          child: FutureBuilder<List<Subject>>(
            future: _subjectsFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              } else if (snapshot.hasError) {
                return Center(child: Text('Lỗi: ${snapshot.error}'));
              } else if (snapshot.hasData) {
                final filteredSubjects = _filterSubjects(snapshot.data!);
                return _buildSubjectsList(filteredSubjects);
              } else {
                return const Center(child: Text('Không có dữ liệu môn học.'));
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSearchSection() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      color: Colors.grey[100],
      child: Row(
        children: [
          Expanded(
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Tìm kiếm môn học...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                  _subjectsFuture = _fetchSubjects();
                });
              },
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton.icon(
            onPressed: _showAddSubjectDialog,
            icon: const Icon(Icons.add),
            label: const Text('Thêm'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectsList(List<Subject> subjects) {
    if (subjects.isEmpty) {
      return const Center(child: Text('Không tìm thấy môn học nào.'));
    }

    return ListView.builder(
      itemCount: subjects.length,
      itemBuilder: (context, index) {
        final subject = subjects[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: ListTile(
            leading: const Icon(Icons.book, color: Colors.blueAccent),
            title: Text(subject.name),
            trailing: PopupMenuButton<String>(
              onSelected: (value) => _handleSubjectAction(value, subject),
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'edit', child: Text('Chỉnh sửa')),
                const PopupMenuItem(value: 'delete', child: Text('Xóa')),
              ],
            ),
          ),
        );
      },
    );
  }

  void _handleSubjectAction(String action, Subject subject) {
    switch (action) {
      case 'edit':
        _showEditSubjectDialog(subject);
        break;
      case 'delete':
        _deleteSubject(subject);
        break;
    }
  }

  void _showAddSubjectDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Thêm môn học mới'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Tên môn học',
            hintText: 'Ví dụ: Lập trình Flutter',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              if (controller.text.isNotEmpty) {
                try {
                  final response =
                      await _apiService.createSubject(controller.text);
                  if (response.success) {
                    _logger.i('Subject created: ${controller.text}');
                    Navigator.of(context).pop();
                    _refreshSubjects();
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Lỗi: ${response.error}')),
                    );
                  }
                } catch (e) {
                  _logger.e('Create subject error: $e');
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi: $e')),
                  );
                }
              }
            },
            child: const Text('Thêm'),
          ),
        ],
      ),
    );
  }

  void _showEditSubjectDialog(Subject subject) {
    final controller = TextEditingController(text: subject.name);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Chỉnh sửa môn học'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Tên môn học'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              if (controller.text.isNotEmpty) {
                try {
                  final response = await _apiService.updateSubject(
                      subject.id, controller.text);
                  if (response.success) {
                    _logger.i(
                        'Subject updated: ${subject.id} -> ${controller.text}');
                    Navigator.of(context).pop();
                    _refreshSubjects();
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Lỗi: ${response.error}')),
                    );
                  }
                } catch (e) {
                  _logger.e('Update subject error: $e');
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi: $e')),
                  );
                }
              }
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  void _deleteSubject(Subject subject) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa môn học'),
        content: Text(
            'Bạn có chắc muốn xóa môn học "${subject.name}"? Hành động này không thể hoàn tác.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              try {
                final response = await _apiService.deleteSubject(subject.id);
                if (response.success) {
                  _logger.i('Subject deleted: ${subject.id}');
                  Navigator.of(context).pop();
                  _refreshSubjects();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi: ${response.error}')),
                  );
                }
              } catch (e) {
                _logger.e('Delete subject error: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Lỗi: $e')),
                );
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

class ScheduleManagementTab extends StatefulWidget {
  const ScheduleManagementTab({super.key});

  @override
  State<ScheduleManagementTab> createState() => _ScheduleManagementTabState();
}

class _ScheduleManagementTabState extends State<ScheduleManagementTab> {
  final Logger _logger = Logger();
  late Future<List<Schedule>> _schedulesFuture;
  int? _selectedClassId;
  int? _selectedSubjectId;
  int? _selectedTeacherId;
  final ApiService _apiService = ApiService();

  // Define time slots for the timetable
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
      final response = await _apiService.getSchedules(
        classId: _selectedClassId,
        subjectId: _selectedSubjectId,
        teacherId: _selectedTeacherId,
      );
      if (response.success) {
        _logger.i('Fetched schedules: ${response.data!.length} items');
        _logger.d('Schedules data: ${response.data}');
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

  // Convert time string (HH:mm) to minutes for comparison
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

      // Tính số ô thời gian mà lịch học kéo dài
      int rowSpan = 0;
      for (var slot in _timeSlots) {
        final slotParts = slot.split('-');
        final slotStartTime = _timeToMinutes(slotParts[0]);
        // ignore: unused_local_variable
        final slotEndTime = _timeToMinutes(slotParts[1]);
        if (slotStartTime >= scheduleStart && slotStartTime < scheduleEnd) {
          rowSpan++;
        }
      }
      rowSpan = rowSpan > 0 ? rowSpan : 1;
      _logger.d(
          'Schedule ${schedule.id} at $timeSlot, weekday $weekday, spans $rowSpan slots, startTime: ${schedule.startTime}, endTime: ${schedule.endTime}');

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
        _buildFilterSection(),
        Expanded(
          child: FutureBuilder<List<Schedule>>(
            future: _schedulesFuture,
            builder: (context, snapshot) {
              _logger.d(
                  'Timetable FutureBuilder state: ${snapshot.connectionState}');
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              } else if (snapshot.hasError) {
                _logger.e('Timetable error: ${snapshot.error}');
                return Center(
                    child: Text('Lỗi khi tải lịch học: ${snapshot.error}'));
              } else if (snapshot.hasData) {
                _logger.d('Timetable schedules: ${snapshot.data!.length}');
                return _buildTimetable(snapshot.data!);
              } else {
                _logger.e('No schedule data available');
                return const Center(child: Text('Không có dữ liệu lịch học.'));
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFilterSection() {
    return FutureBuilder<ApiResponse<Map<String, dynamic>>>(
      future: _apiService.getScheduleOptions(),
      builder: (context, snapshot) {
        _logger.d('Filter FutureBuilder state: ${snapshot.connectionState}');
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          _logger.e('Filter error: ${snapshot.error}');
          return Center(child: Text('Lỗi khi tải tùy chọn: ${snapshot.error}'));
        } else if (snapshot.hasData && snapshot.data!.success) {
          final options = snapshot.data!.data!;
          final classes = (options['classes'] as List<dynamic>? ?? [])
              .map((item) => ClassData.fromJson(item))
              .toList();
          final subjects = (options['subjects'] as List<dynamic>? ?? [])
              .map((item) => Subject.fromJson(item))
              .toList();
          final teachers = (options['teachers'] as List<dynamic>? ?? [])
              .map((item) => User.fromJson(item))
              .toList();

          _logger.d(
              'Classes: ${classes.length}, Subjects: ${subjects.length}, Teachers: ${teachers.length}');

          return Container(
            padding: const EdgeInsets.all(16.0),
            color: Colors.grey[100],
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: DropdownButton<int?>(
                        value: _selectedClassId,
                        hint: const Text('Chọn lớp'),
                        isExpanded: true,
                        items: [
                          const DropdownMenuItem<int?>(
                              value: null, child: Text('Tất cả lớp')),
                          ...classes.map((classData) => DropdownMenuItem<int?>(
                                value: classData.id,
                                child: Text(classData.name),
                              )),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _selectedClassId = value;
                            _schedulesFuture = _fetchSchedules();
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: DropdownButton<int?>(
                        value: _selectedSubjectId,
                        hint: const Text('Chọn môn học'),
                        isExpanded: true,
                        items: [
                          const DropdownMenuItem<int?>(
                              value: null, child: Text('Tất cả môn học')),
                          ...subjects.map((subject) => DropdownMenuItem<int?>(
                                value: subject.id,
                                child: Text(subject.name),
                              )),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _selectedSubjectId = value;
                            _schedulesFuture = _fetchSchedules();
                          });
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                        child: DropdownButton<int?>(
                      value: _selectedTeacherId,
                      hint: const Text('Chọn giáo viên'),
                      isExpanded: true,
                      items: teachers.map((teacher) {
                        return DropdownMenuItem<int>(
                          value: teacher.id,
                          child: Text(teacher.fullName),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedTeacherId = value;
                          _schedulesFuture = _fetchSchedules();
                        });
                      },
                    )),
                    const SizedBox(width: 16),
                    ElevatedButton.icon(
                      onPressed: () => _showAddScheduleDialog(options),
                      icon: const Icon(Icons.add),
                      label: const Text('Thêm lịch học'),
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueAccent),
                    ),
                  ],
                ),
              ],
            ),
          );
        } else {
          _logger.e('Filter data invalid or empty');
          return const Center(child: Text('Không thể tải tùy chọn lọc.'));
        }
      },
    );
  }

  Widget _buildTimetable(List<Schedule> schedules) {
    if (schedules.isEmpty) {
      _logger.i('No schedules to display');
      return const Center(child: Text('Không tìm thấy lịch học nào.'));
    }

    // Theo dõi các lịch học đã hiển thị để tránh trùng lặp
    final displayedSchedules = <int>{};

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: ConstrainedBox(
          constraints: BoxConstraints(minWidth: 800),
          child: Table(
            border: TableBorder.all(color: Colors.grey),
            columnWidths: const {
              0: FixedColumnWidth(100), // Cột thời gian
              1: FixedColumnWidth(150), // Chủ nhật
              2: FixedColumnWidth(150), // Thứ 2
              3: FixedColumnWidth(150), // Thứ 3
              4: FixedColumnWidth(150), // Thứ 4
              5: FixedColumnWidth(150), // Thứ 5
              6: FixedColumnWidth(150), // Thứ 6
              7: FixedColumnWidth(150), // Thứ 7
            },
            defaultVerticalAlignment: TableCellVerticalAlignment.middle,
            children: [
              // Hàng tiêu đề
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
              // Hàng dữ liệu
              ..._timeSlots.asMap().entries.map((entry) {
                // ignore: unused_local_variable
                final timeSlotIndex = entry.key;
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

                      // Nếu không có lịch học, trả về ô trống
                      if (slotSchedules.isEmpty) {
                        return TableCell(child: Container());
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
                        return TableCell(child: Container());
                      }

                      final schedule = slotData['schedule'] as Schedule;
                      final rowSpan = slotData['rowSpan'] as int;
                      final scheduleIndex = slotData['index'] as int;

                      // Nếu đã hiển thị, để ô trống
                      if (displayedSchedules.contains(scheduleIndex)) {
                        return TableCell(child: Container());
                      }
                      displayedSchedules.add(scheduleIndex);

                      _logger.d(
                          'Schedule ${schedule.id} at $timeSlot, weekday $weekday, spans $rowSpan slots, startTime: ${schedule.startTime}, endTime: ${schedule.endTime}');

                      // Chỉ hiển thị khối lịch học nếu đây là ô bắt đầu
                      final scheduleStart = _timeToMinutes(schedule.startTime);
                      final slotStart = _timeToMinutes(timeSlot.split('-')[0]);
                      if (scheduleStart != slotStart) {
                        return TableCell(child: Container());
                      }

                      // Hiển thị khối lịch học với chiều cao tự động
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
                                  ),
                                ),
                                Text(schedule.className),
                                Text(schedule.teacherName),
                                Text(
                                    '${schedule.startTime} - ${schedule.endTime}'),
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
                '${_getWeekdayName(schedule.weekday)}: ${schedule.startTime} - ${schedule.endTime}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Đóng'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _showEditScheduleDialog(schedule);
            },
            child: const Text('Chỉnh sửa'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _deleteSchedule(schedule);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
  }

  // ignore: unused_element
  void _handleScheduleAction(String action, Schedule schedule) {
    switch (action) {
      case 'edit':
        _showEditScheduleDialog(schedule);
        break;
      case 'delete':
        _deleteSchedule(schedule);
        break;
    }
  }

  void _showAddScheduleDialog(Map<String, dynamic> options) {
    _logger.d('Opening add schedule dialog with options: $options');
    showDialog(
      context: context,
      builder: (context) => ScheduleFormDialog(
        options: options,
        onSave: (scheduleData) async {
          _logger.d('Saving schedule: $scheduleData');
          try {
            final response = await _apiService.createSchedule(
              classId: scheduleData['class_id'],
              subjectId: scheduleData['subject_id'],
              teacherId: scheduleData['teacher_id'],
              weekday: scheduleData['weekday'],
              startTime: scheduleData['start_time'],
              endTime: scheduleData['end_time'],
            );
            if (response.success) {
              _logger.i('Schedule created: $scheduleData');
              _refreshSchedules();
            } else {
              _logger.e('Create schedule failed: ${response.error}');
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Lỗi: ${response.error}')),
              );
            }
          } catch (e) {
            _logger.e('Create schedule error: $e');
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Lỗi: $e')),
            );
          }
        },
      ),
    );
  }

  void _showEditScheduleDialog(Schedule schedule) {
    showDialog(
      context: context,
      builder: (context) => FutureBuilder<ApiResponse<Map<String, dynamic>>>(
        future: _apiService.getScheduleOptions(),
        builder: (context, snapshot) {
          _logger.d(
              'Edit schedule FutureBuilder state: ${snapshot.connectionState}');
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            _logger.e('Edit schedule error: ${snapshot.error}');
            return Center(child: Text('Lỗi: ${snapshot.error}'));
          } else if (snapshot.hasData && snapshot.data!.success) {
            return ScheduleFormDialog(
              schedule: schedule,
              options: snapshot.data!.data!,
              onSave: (scheduleData) async {
                _logger.d('Updating schedule: $scheduleData');
                try {
                  final response = await _apiService.updateSchedule(
                    id: schedule.id,
                    classId: scheduleData['class_id'],
                    subjectId: scheduleData['subject_id'],
                    teacherId: scheduleData['teacher_id'],
                    weekday: scheduleData['weekday'],
                    startTime: scheduleData['start_time'],
                    endTime: scheduleData['end_time'],
                  );
                  if (response.success) {
                    _logger.i('Schedule updated: $scheduleData');
                    _refreshSchedules();
                  } else {
                    _logger.e('Update schedule failed: ${response.error}');
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Lỗi: ${response.error}')),
                    );
                  }
                } catch (e) {
                  _logger.e('Update schedule error: $e');
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi: $e')),
                  );
                }
              },
            );
          } else {
            _logger.e('Edit schedule data invalid or empty');
            return const Center(child: Text('Không thể tải tùy chọn.'));
          }
        },
      ),
    );
  }

  void _deleteSchedule(Schedule schedule) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa lịch học'),
        content: Text(
            'Bạn có chắc muốn xóa lịch học "${schedule.subjectName} - ${schedule.className}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              try {
                final response = await _apiService.deleteSchedule(schedule.id);
                if (response.success) {
                  _logger.i('Schedule deleted: ${schedule.id}');
                  Navigator.of(context).pop();
                  _refreshSchedules();
                } else {
                  _logger.e('Delete schedule failed: ${response.error}');
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi: ${response.error}')),
                  );
                }
              } catch (e) {
                _logger.e('Delete schedule error: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Lỗi: $e')),
                );
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

class ScheduleFormDialog extends StatefulWidget {
  final Schedule? schedule;
  final Map<String, dynamic> options;
  final Function(Map<String, dynamic>) onSave;

  const ScheduleFormDialog({
    super.key,
    this.schedule,
    required this.options,
    required this.onSave,
  });

  @override
  State<ScheduleFormDialog> createState() => _ScheduleFormDialogState();
}

class _ScheduleFormDialogState extends State<ScheduleFormDialog> {
  final _formKey = GlobalKey<FormState>();
  int? _selectedClassId;
  int? _selectedSubjectId;
  int? _selectedTeacherId;
  int _selectedWeekday = 2;
  TimeOfDay _startTime = const TimeOfDay(hour: 8, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 11, minute: 0);

  @override
  void initState() {
    super.initState();
    if (widget.schedule != null) {
      final classes = (widget.options['classes'] as List<dynamic>? ?? [])
          .map((item) => ClassData.fromJson(item))
          .toList();
      final subjects = (widget.options['subjects'] as List<dynamic>? ?? [])
          .map((item) => Subject.fromJson(item))
          .toList();
      final teachers = (widget.options['teachers'] as List<dynamic>? ?? [])
          .map((item) => User.fromJson(item))
          .toList();

      _selectedClassId = classes
          .firstWhere(
            (c) => c.name == widget.schedule!.className,
            orElse: () => classes.first,
          )
          .id;
      _selectedSubjectId = subjects
          .firstWhere(
            (s) => s.name == widget.schedule!.subjectName,
            orElse: () => subjects.first,
          )
          .id;
      _selectedTeacherId = teachers
          .firstWhere(
            (t) => t.fullName == widget.schedule!.teacherName,
            orElse: () => teachers.first,
          )
          .id;
      _selectedWeekday = widget.schedule!.weekday;
      final startParts = widget.schedule!.startTime.split(':');
      _startTime = TimeOfDay(
          hour: int.parse(startParts[0]), minute: int.parse(startParts[1]));
      final endParts = widget.schedule!.endTime.split(':');
      _endTime = TimeOfDay(
          hour: int.parse(endParts[0]), minute: int.parse(endParts[1]));
    } else {
      final classes = (widget.options['classes'] as List<dynamic>? ?? [])
          .map((item) => ClassData.fromJson(item))
          .toList();
      final subjects = (widget.options['subjects'] as List<dynamic>? ?? [])
          .map((item) => Subject.fromJson(item))
          .toList();
      final teachers = (widget.options['teachers'] as List<dynamic>? ?? [])
          .map((item) => User.fromJson(item))
          .toList();
      _selectedClassId = classes.isNotEmpty ? classes.first.id : null;
      _selectedSubjectId = subjects.isNotEmpty ? subjects.first.id : null;
      _selectedTeacherId = teachers.isNotEmpty ? teachers.first.id : null;
    }
  }

  String _formatTimeOfDay(TimeOfDay time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final classes = (widget.options['classes'] as List<dynamic>? ?? [])
        .map((item) => ClassData.fromJson(item))
        .toList();
    final subjects = (widget.options['subjects'] as List<dynamic>? ?? [])
        .map((item) => Subject.fromJson(item))
        .toList();
    final teachers = (widget.options['teachers'] as List<dynamic>? ?? [])
        .map((item) => User.fromJson(item))
        .toList();

    return AlertDialog(
      title: Text(
          widget.schedule == null ? 'Thêm lịch học' : 'Chỉnh sửa lịch học'),
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
                  });
                },
                validator: (value) =>
                    value == null ? 'Vui lòng chọn môn học' : null,
              ),
              DropdownButtonFormField<int>(
                value: _selectedTeacherId,
                decoration: const InputDecoration(labelText: 'Giáo viên'),
                items: teachers.map((teacher) {
                  return DropdownMenuItem(
                    value: teacher.id,
                    child: Text(teacher.fullName),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedTeacherId = value;
                  });
                },
                validator: (value) =>
                    value == null ? 'Vui lòng chọn giáo viên' : null,
              ),
              DropdownButtonFormField<int>(
                value: _selectedWeekday,
                decoration: const InputDecoration(labelText: 'Thứ'),
                items: const [
                  DropdownMenuItem(value: 1, child: Text('Chủ nhật')),
                  DropdownMenuItem(value: 2, child: Text('Thứ 2')),
                  DropdownMenuItem(value: 3, child: Text('Thứ 3')),
                  DropdownMenuItem(value: 4, child: Text('Thứ 4')),
                  DropdownMenuItem(value: 5, child: Text('Thứ 5')),
                  DropdownMenuItem(value: 6, child: Text('Thứ 6')),
                  DropdownMenuItem(value: 7, child: Text('Thứ 7')),
                ],
                onChanged: (value) {
                  setState(() {
                    _selectedWeekday = value!;
                  });
                },
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ListTile(
                      title: const Text('Giờ bắt đầu'),
                      subtitle: Text(_formatTimeOfDay(_startTime)),
                      trailing: const Icon(Icons.access_time),
                      onTap: () async {
                        final time = await showTimePicker(
                          context: context,
                          initialTime: _startTime,
                        );
                        if (time != null) {
                          setState(() {
                            _startTime = time;
                          });
                        }
                      },
                    ),
                  ),
                  Expanded(
                    child: ListTile(
                      title: const Text('Giờ kết thúc'),
                      subtitle: Text(_formatTimeOfDay(_endTime)),
                      trailing: const Icon(Icons.access_time),
                      onTap: () async {
                        final time = await showTimePicker(
                          context: context,
                          initialTime: _endTime,
                        );
                        if (time != null) {
                          setState(() {
                            _endTime = time;
                          });
                        }
                      },
                    ),
                  ),
                ],
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
              final scheduleData = {
                'class_id': _selectedClassId,
                'subject_id': _selectedSubjectId,
                'teacher_id': _selectedTeacherId,
                'weekday': _selectedWeekday,
                'start_time': _formatTimeOfDay(_startTime),
                'end_time': _formatTimeOfDay(_endTime),
              };
              widget.onSave(scheduleData);
              Navigator.of(context).pop();
            }
          },
          child: const Text('Lưu'),
        ),
      ],
    );
  }
}
