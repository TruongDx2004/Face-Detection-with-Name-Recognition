// lib/screens/student/student_assignment_screen.dart
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import 'assignment_detail_screen.dart';
import 'exam_detail_screen.dart';
import 'exam_taking_screen.dart';
import 'exam_result_screen.dart';

class StudentAssignmentScreen extends StatefulWidget {
  final int userId;

  const StudentAssignmentScreen({
    super.key,
    required this.userId,
    required int courseSectionId,
    required String courseSectionName,
  });

  @override
  State<StudentAssignmentScreen> createState() =>
      _StudentAssignmentScreenState();
}

class _StudentAssignmentScreenState extends State<StudentAssignmentScreen>
    with SingleTickerProviderStateMixin {
  final Logger _logger = Logger();
  late TabController _tabController;

  late Future<List<CourseSection>> _courseSectionsFuture;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadData() {
    _courseSectionsFuture = _fetchCourseSections();
  }

  void _refreshData() {
    setState(() {
      _courseSectionsFuture = _fetchCourseSections();
    });
  }

  /// Fetch course sections for the student
  Future<List<CourseSection>> _fetchCourseSections() async {
    try {
      final response =
          await ApiService().getStudentCourseSections(widget.userId);
      if (response.success) {
        _logger.i('Fetched ${response.data!.length} course sections');
        return response.data!;
      } else {
        _logger.e('Failed to fetch course sections: ${response.message}');
        return [];
      }
    } catch (e) {
      _logger.e('Error fetching course sections: $e');
      throw Exception('Failed to load course sections');
    }
  }

  /// Get assignment count for a course section
  Future<int> _getAssignmentCount(int courseSectionId) async {
    try {
      final response =
          await ApiService().getStudentAssignments(courseSectionId);
      if (response.success) {
        return response.data!.length;
      }
      return 0;
    } catch (e) {
      _logger.e('Error getting assignment count: $e');
      return 0;
    }
  }

  /// Get exam count for a course section
  Future<int> _getExamCount(int courseSectionId) async {
    try {
      final response = await ApiService().getStudentExams(courseSectionId) as ApiResponse<List<Exam>>;
      _logger.i('Exam count response: success=${response.statusCode}, data=${response.data}');
      if (response.success && response.data != null) {
        _logger.i('Found ${response.data!.length} exams');
        return response.data!.length;
      } else {
        _logger.w('No exam data or unsuccessful response');
        return 0;
      }
    } catch (e) {
      _logger.e('Error getting exam count: $e');
      return 0;
    }
  }

  /// Navigate to course section assignments
  void _navigateToCourseAssignments(CourseSection courseSection) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CourseAssignmentsScreen(
          userId: widget.userId,
          courseSection: courseSection,
        ),
      ),
    );
  }

  /// Navigate to course section exams
  void _navigateToCourseExams(CourseSection courseSection) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CourseExamsScreen(
          userId: widget.userId,
          courseSection: courseSection,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: DefaultTabController(
        length: 2,
        child: CustomScrollView(
          slivers: [
            // Modern app bar with gradient
            SliverAppBar(
              expandedHeight: 120,
              floating: false,
              pinned: true,
              elevation: 0,
              flexibleSpace: FlexibleSpaceBar(
                title: const Text(
                  'Bài tập & Kiểm tra',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
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
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => Navigator.of(context).pop(),
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
                    labelColor: Colors.blue[600],
                    unselectedLabelColor: Colors.grey[600],
                    indicatorColor: Colors.blue[600],
                    indicatorWeight: 3,
                    labelStyle: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                    unselectedLabelStyle: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 16,
                    ),
                    tabs: const [
                      Tab(
                        icon: Icon(Icons.assignment),
                        text: 'Bài tập',
                      ),
                      Tab(
                        icon: Icon(Icons.quiz),
                        text: 'Kiểm tra',
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Tab content
            SliverFillRemaining(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildAssignmentsTab(),
                  _buildExamsTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Build assignments tab - show course sections
  Widget _buildAssignmentsTab() {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() {
          _loadData();
        });
      },
      color: const Color(0xFF667eea),
      child: FutureBuilder<List<CourseSection>>(
        future: _courseSectionsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return _buildLoadingState('Đang tải danh sách học phần...');
          } else if (snapshot.hasError) {
            return _buildErrorWidget(snapshot.error.toString());
          } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
            return _buildCourseSectionsList(snapshot.data!, isAssignment: true);
          } else {
            return _buildEmptyState(
              'Chưa có học phần nào',
              'Hiện tại bạn chưa đăng ký học phần nào.',
              Icons.school_outlined,
            );
          }
        },
      ),
    );
  }

  /// Build exams tab - show course sections
  Widget _buildExamsTab() {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() {
          _loadData();
        });
      },
      color: const Color(0xFF667eea),
      child: FutureBuilder<List<CourseSection>>(
        future: _courseSectionsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return _buildLoadingState('Đang tải danh sách học phần...');
          } else if (snapshot.hasError) {
            return _buildErrorWidget(snapshot.error.toString());
          } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
            return _buildCourseSectionsList(snapshot.data!,
                isAssignment: false);
          } else {
            return _buildEmptyState(
              'Chưa có học phần nào',
              'Hiện tại bạn chưa đăng ký học phần nào.',
              Icons.school_outlined,
            );
          }
        },
      ),
    );
  }

  /// Build course sections list
  Widget _buildCourseSectionsList(List<CourseSection> courseSections,
      {required bool isAssignment}) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: courseSections.length,
      itemBuilder: (context, index) {
        final courseSection = courseSections[index];
        return _buildCourseSectionCard(courseSection, isAssignment);
      },
    );
  }

  /// Build course section card
  Widget _buildCourseSectionCard(
      CourseSection courseSection, bool isAssignment) {
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
          onTap: () {
            if (isAssignment) {
              _navigateToCourseAssignments(courseSection);
            } else {
              _navigateToCourseExams(courseSection);
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF667eea).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        isAssignment ? Icons.assignment : Icons.quiz,
                        color: const Color(0xFF667eea),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            courseSection.name,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF2D3748),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            courseSection.name,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.arrow_forward_ios,
                      color: Colors.grey,
                      size: 16,
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Count and status
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: FutureBuilder<int>(
                          future: isAssignment
                              ? _getAssignmentCount(courseSection.id)
                              : _getExamCount(courseSection.id),
                          builder: (context, countSnapshot) {
                            final count = countSnapshot.data ?? 0;
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isAssignment
                                      ? 'Số bài tập'
                                      : 'Số bài kiểm tra',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '$count',
                                  style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF667eea),
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Đang học',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.green[700],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Additional info
                Row(
                  children: [
                    Icon(
                      Icons.person,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Giảng viên: ${courseSection.teacherName ?? "Chưa cập nhật"}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[700],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.schedule,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Học kỳ: ${courseSection.semester}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[700],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingState(String message) {
    return Container(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF667eea)),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget(String error) {
    return Container(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Colors.red[300],
          ),
          const SizedBox(height: 16),
          Text(
            'Có lỗi xảy ra',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.red[700],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            style: TextStyle(
              fontSize: 14,
              color: Colors.red[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _loadData();
              });
            },
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(40),
            ),
            child: Icon(
              icon,
              size: 40,
              color: Colors.grey[400],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
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
}

// Course Assignments Screen - hiển thị bài tập của học phần
class CourseAssignmentsScreen extends StatefulWidget {
  final int userId;
  final CourseSection courseSection;

  const CourseAssignmentsScreen({
    super.key,
    required this.userId,
    required this.courseSection,
  });

  @override
  State<CourseAssignmentsScreen> createState() =>
      _CourseAssignmentsScreenState();
}

class _CourseAssignmentsScreenState extends State<CourseAssignmentsScreen> {
  final Logger _logger = Logger();
  late Future<List<Assignment>> _assignmentsFuture;
  late Future<List<AssignmentSubmission>> _submissionsFuture;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    _assignmentsFuture = _fetchAssignments();
    _submissionsFuture = _fetchSubmissions();
  }

  Future<List<Assignment>> _fetchAssignments() async {
    try {
      final response =
          await ApiService().getStudentAssignments(widget.courseSection.id);
      if (response.success) {
        return response.data!;
      }
      return [];
    } catch (e) {
      _logger.e('Error fetching assignments: $e');
      throw Exception('Failed to load assignments');
    }
  }

  Future<List<AssignmentSubmission>> _fetchSubmissions() async {
    try {
      final response = await ApiService().getStudentSubmissions(widget.userId);
      if (response.success) {
        return response.data!;
      }
      return [];
    } catch (e) {
      _logger.e('Error fetching submissions: $e');
      throw Exception('Failed to load submissions');
    }
  }

  /// Format date for display (Vietnam timezone)
String _formatDate(DateTime date) {
  // Chuyển về VN (UTC+7)
  final vnDate = date.toUtc().add(const Duration(hours: 7));

  final months = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12'
  ];

  final weekdays = [
    'Chủ nhật',
    'Thứ hai',
    'Thứ ba',
    'Thứ tư',
    'Thứ năm',
    'Thứ sáu',
    'Thứ bảy'
  ];

  return '${weekdays[vnDate.weekday % 7]}, ${vnDate.day} ${months[vnDate.month - 1]} ${vnDate.year}';
}

/// Format time for display (Vietnam timezone)
String _formatTime(DateTime time) {
  // Chuyển về VN (UTC+7)
  final vnTime = time.toUtc().add(const Duration(hours: 7));

  return '${vnTime.hour.toString().padLeft(2, '0')}:${vnTime.minute.toString().padLeft(2, '0')}';
}


  /// Get assignment status color
  Color _getAssignmentStatusColor(
      Assignment assignment, AssignmentSubmission? submission) {
    if (submission != null && submission.isSubmitted) {
      if (submission.isGraded) {
        return Colors.green;
      }
      return Colors.blue;
    }

    if (assignment.dueDate.isBefore(DateTime.now())) {
      return Colors.red;
    }

    if (assignment.dueDate.difference(DateTime.now()).inDays <= 3) {
      return Colors.orange;
    }

    return Colors.grey;
  }

  /// Get assignment status text
  String _getAssignmentStatusText(
      Assignment assignment, AssignmentSubmission? submission) {
    if (submission != null && submission.isSubmitted) {
      if (submission.isGraded) {
        return 'Đã chấm điểm (${submission.score}/${assignment.maxScore})';
      }
      return 'Đã nộp bài';
    }

    if (assignment.dueDate.isBefore(DateTime.now())) {
      return 'Quá hạn';
    }

    if (assignment.dueDate.difference(DateTime.now()).inDays <= 3) {
      return 'Sắp hết hạn';
    }

    return 'Chưa nộp';
  }

  /// Navigate to assignment detail
  void _navigateToAssignmentDetail(Assignment assignment) async {
    // Get current submission for this assignment
    AssignmentSubmission? submission;
    try {
      final response = await ApiService().getAssignmentSubmission(
        assignment.id,
        widget.userId,
      );
      if (response.success) {
        submission = response.data;
      }
    } catch (e) {
      _logger.e('Error getting submission: $e');
    }

    if (mounted) {
      final result = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => AssignmentDetailScreen(
            assignment: assignment,
            userId: widget.userId,
            submission: submission,
          ),
        ),
      );

      // Refresh data if submission was successful
      if (result == true) {
        setState(() {
          _loadData();
        });
      }
    }
  }

  /// Submit assignment
  void _submitAssignment(Assignment assignment) async {
    // Navigate to assignment detail screen for submission
    _navigateToAssignmentDetail(assignment);
  }

  /// View assignment result
  void _viewAssignmentResult(
      Assignment assignment, AssignmentSubmission submission) {
    // TODO: Implement view result screen
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Xem kết quả bài tập: ${assignment.title}'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Text(widget.courseSection.name),
        backgroundColor: const Color(0xFF667eea),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() {
            _loadData();
          });
        },
        color: const Color(0xFF667eea),
        child: FutureBuilder<List<Assignment>>(
          future: _assignmentsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF667eea)),
                ),
              );
            } else if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.red[300],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Có lỗi xảy ra',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.red[700],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${snapshot.error}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.red[600],
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _loadData();
                        });
                      },
                      child: const Text('Thử lại'),
                    ),
                  ],
                ),
              );
            } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
              return FutureBuilder<List<AssignmentSubmission>>(
                future: _submissionsFuture,
                builder: (context, submissionSnapshot) {
                  final submissions = submissionSnapshot.data ?? [];

                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: snapshot.data!.length,
                    itemBuilder: (context, index) {
                      final assignment = snapshot.data![index];
                      final submission = submissions.firstWhere(
                        (s) => s.assignmentId == assignment.id,
                        orElse: () => AssignmentSubmission(
                          id: 0,
                          assignmentId: assignment.id,
                          studentId: widget.userId,
                          submittedAt: null,
                          submissionText: '',
                          score: null,
                          feedback: null,
                          status: '', // bắt buộc vì constructor yêu cầu
                          attachmentPath: null,
                          studentName: null,
                          studentCode: null,
                        ),
                      );

                      return _buildAssignmentCard(assignment, submission);
                    },
                  );
                },
              );
            } else {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(40),
                      ),
                      child: Icon(
                        Icons.assignment_outlined,
                        size: 40,
                        color: Colors.grey[400],
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Chưa có bài tập nào',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2D3748),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Hiện tại chưa có bài tập nào được giao cho học phần này.',
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
          },
        ),
      ),
    );
  }

  /// Build assignment card with enhanced UI and buttons
  Widget _buildAssignmentCard(
      Assignment assignment, AssignmentSubmission submission) {
    final statusColor = _getAssignmentStatusColor(assignment, submission);
    final statusText = _getAssignmentStatusText(assignment, submission);
    final isOverdue = assignment.dueDate.isBefore(DateTime.now());
    final canSubmit = !submission.isSubmitted && !isOverdue;

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
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF667eea).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.assignment,
                    color: Color(0xFF667eea),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        assignment.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D3748),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Điểm tối đa: ${assignment.maxScore}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    statusText,
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

            // Description
            if (assignment.description != null) ...[
              Text(
                assignment.description.toString(),
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                  height: 1.4,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 16),
            ],

            // Details
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _buildDetailRow(
                    Icons.calendar_today,
                    'Hạn nộp',
                    _formatDate(assignment.dueDate),
                  ),
                  const SizedBox(height: 12),
                  _buildDetailRow(
                    Icons.access_time,
                    'Thời gian',
                    _formatTime(assignment.dueDate),
                  ),
                  if (submission.isSubmitted) ...[
                    const SizedBox(height: 12),
                    _buildDetailRow(
                      Icons.check_circle,
                      'Đã nộp',
                      submission.submittedAt != null
                          ? _formatDate(submission.submittedAt!)
                          : 'Không xác định',
                    ),
                  ],
                  if (submission.isGraded && submission.score != null) ...[
                    const SizedBox(height: 12),
                    _buildDetailRow(
                      Icons.grade,
                      'Điểm số',
                      '${submission.score}/${assignment.maxScore}',
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _navigateToAssignmentDetail(assignment),
                    icon: const Icon(Icons.visibility),
                    label: const Text('Xem chi tiết'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF667eea),
                      side: const BorderSide(color: Color(0xFF667eea)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: submission.isGraded
                      ? ElevatedButton.icon(
                          onPressed: () =>
                              _viewAssignmentResult(assignment, submission),
                          icon: const Icon(Icons.grade),
                          label: const Text('Xem điểm'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF667eea),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        )
                      : ElevatedButton.icon(
                          onPressed: canSubmit
                              ? () => _submitAssignment(assignment)
                              : null,
                          icon: Icon(canSubmit ? Icons.upload : Icons.lock),
                          label: Text(canSubmit ? 'Nộp bài' : 'Không thể nộp'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: canSubmit
                                ? const Color(0xFF667eea)
                                : Colors.grey[400],
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
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
}

// Course Exams Screen - hiển thị bài kiểm tra của học phần
class CourseExamsScreen extends StatefulWidget {
  final int userId;
  final CourseSection courseSection;

  const CourseExamsScreen({
    super.key,
    required this.userId,
    required this.courseSection,
  });

  @override
  State<CourseExamsScreen> createState() => _CourseExamsScreenState();
}

class _CourseExamsScreenState extends State<CourseExamsScreen> {
  final Logger _logger = Logger();
  late Future<List<Exam>> _examsFuture;
  late Future<List<ExamResult>> _examResultsFuture;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    _examsFuture = _fetchExams();
    _examResultsFuture = _fetchExamResults();
  }

  Future<List<Exam>> _fetchExams() async {
    try {
      final response =
          await ApiService().getStudentExams(widget.courseSection.id);
      _logger.i('Fetched exams: ${response.data}');
      if (response.success) {
        return response.data!;
      }
      return [];
    } catch (e) {
      _logger.e('Error fetching exams: $e');
      throw Exception('Failed to load exams');
    }
  }

  Future<List<ExamResult>> _fetchExamResults() async {
    try {
      // Lấy danh sách exams trước
      final examsResponse = await ApiService().getStudentExams(widget.courseSection.id);
      if (!examsResponse.success || examsResponse.data == null) {
        return [];
      }

      final exams = examsResponse.data!;
      final results = <ExamResult>[];

      // Lấy kết quả cho từng exam
      for (final exam in exams) {
        try {
          final resultResponse = await ApiService().getStudentExamResult(
            examId: exam.id,
            // studentId không cần thiết vì API sẽ lấy từ token
          );
          
          if (resultResponse.success && resultResponse.data != null) {
            results.add(resultResponse.data!);
          }
        } catch (e) {
          // Nếu chưa có kết quả cho exam này, bỏ qua
          _logger.d('No result found for exam ${exam.id}: $e');
        }
      }

      return results;
    } catch (e) {
      _logger.e('Error fetching exam results: $e');
      return []; // Trả về empty list thay vì throw exception để UI không crash
    }
  }

  /// Format date for display
  String _formatDate(DateTime date) {
    final months = [
      'Tháng 1',
      'Tháng 2',
      'Tháng 3',
      'Tháng 4',
      'Tháng 5',
      'Tháng 6',
      'Tháng 7',
      'Tháng 8',
      'Tháng 9',
      'Tháng 10',
      'Tháng 11',
      'Tháng 12'
    ];

    final weekdays = [
      'Chủ nhật',
      'Thứ hai',
      'Thứ ba',
      'Thứ tư',
      'Thứ năm',
      'Thứ sáu',
      'Thứ bảy'
    ];

    return '${weekdays[date.weekday % 7]}, ${date.day} ${months[date.month - 1]} ${date.year}';
  }

  /// Format time for display
  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }

  /// Navigate to exam detail
  void _navigateToExamDetail(Exam exam) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ExamDetailScreen(
          exam: exam,
          userId: widget.userId,
        ),
      ),
    );
  }

  /// Start exam
  void _startExam(Exam exam) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ExamTakingScreen(
          exam: exam,
          userId: widget.userId,
        ),
      ),
    );
  }

  /// View exam result
  void _viewExamResult(Exam exam, ExamResult result) {
    _logger.i('Viewing result for exam ${exam.id}');
    _logger.i('Result details: ${result.toJson()}');
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ExamResultScreen(
          examResult: result,
          exam: exam,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Text(widget.courseSection.name),
        backgroundColor: const Color(0xFF667eea),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() {
            _loadData();
          });
        },
        color: const Color(0xFF667eea),
        child: FutureBuilder<List<Exam>>(
          future: _examsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF667eea)),
                ),
              );
            } else if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.red[300],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Có lỗi xảy ra',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.red[700],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${snapshot.error}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.red[600],
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _loadData();
                        });
                      },
                      child: const Text('Thử lại'),
                    ),
                  ],
                ),
              );
            } else if (snapshot.hasData && snapshot.data!.isNotEmpty) {
              return FutureBuilder<List<ExamResult>>(
                future: _examResultsFuture,
                builder: (context, resultSnapshot) {
                  final results = resultSnapshot.data ?? [];

                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: snapshot.data!.length,
                    itemBuilder: (context, index) {
                      final exam = snapshot.data![index];
                      final result = results.firstWhere(
                        (r) => r.examId == exam.id,
                        orElse: () => ExamResult(
                          id: 0,
                          examId: exam.id,
                          studentId: widget.userId,
                          score: null,
                          totalScore: exam.totalScore.toDouble(),
                          status: 'not_started', // Sử dụng status phù hợp hơn
                          startTime: null,
                          endTime: null,
                          submittedAt: null,
                          gradedAt: null,
                          gradedBy: null,
                          answers: [], 
                        ),
                      );

                      return _buildExamCard(exam, result);
                    },
                  );
                },
              );
            } else {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(40),
                      ),
                      child: Icon(
                        Icons.quiz_outlined,
                        size: 40,
                        color: Colors.grey[400],
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Chưa có bài kiểm tra nào',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2D3748),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Hiện tại chưa có bài kiểm tra nào cho học phần này.',
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
          },
        ),
      ),
    );
  }

  /// Build exam card with enhanced UI and buttons
  Widget _buildExamCard(Exam exam, ExamResult result) {
    final now = DateTime.now();
    final canTakeExam = now.isAfter(exam.startTime) &&
        now.isBefore(exam.endTime) &&
        !result.isCompleted;
    final isUpcoming = now.isBefore(exam.startTime);
    final isExpired = now.isAfter(exam.endTime);
    _logger.i(
        'Exam: ${exam.title}, Now: $now, Start: ${exam.startTime}, End: ${exam.endTime}, CanTake: $canTakeExam, Completed: ${result.isCompleted}');
    
    Color statusColor;
    String statusText;

    if (result.isCompleted) {
      statusColor = Colors.green;
      statusText = 'Đã hoàn thành';
    } else if (canTakeExam) {
      statusColor = Colors.blue;
      statusText = 'Có thể làm bài';
    } else if (isUpcoming) {
      statusColor = Colors.orange;
      statusText = 'Sắp diễn ra';
    } else if (isExpired) {
      statusColor = Colors.red;
      statusText = 'Đã hết hạn';
    } else {
      statusColor = Colors.grey;
      statusText = 'Không khả dụng';
    }

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
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF667eea).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.quiz,
                    color: Color(0xFF667eea),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        exam.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D3748),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Thời gian: ${exam.duration} phút',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    statusText,
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

            // Description
            if (exam.description.isNotEmpty) ...[
              Text(
                exam.description,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                  height: 1.4,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 16),
            ],

            // Details
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _buildDetailRow(
                    Icons.schedule,
                    'Bắt đầu',
                    '${_formatDate(exam.startTime)} ${_formatTime(exam.startTime)}',
                  ),
                  const SizedBox(height: 12),
                  _buildDetailRow(
                    Icons.schedule_outlined,
                    'Kết thúc',
                    '${_formatDate(exam.endTime)} ${_formatTime(exam.endTime)}',
                  ),
                  const SizedBox(height: 12),
                  _buildDetailRow(
                    Icons.quiz,
                    'Số câu hỏi',
                    '${exam.questions.length} câu',
                  ),
                  const SizedBox(height: 12),
                  _buildDetailRow(
                    Icons.grade,
                    'Điểm tối đa',
                    '${exam.totalScore} điểm',
                  ),
                  if (result.isCompleted && result.score != null) ...[
                    const SizedBox(height: 12),
                    _buildDetailRow(
                      Icons.star,
                      'Điểm đạt được',
                      '${result.score}/${result.totalScore}',
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _navigateToExamDetail(exam),
                    icon: const Icon(Icons.visibility),
                    label: const Text('Xem chi tiết'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF667eea),
                      side: const BorderSide(color: Color(0xFF667eea)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: result.isCompleted
                      ? ElevatedButton.icon(
                          onPressed: () => _viewExamResult(exam, result),
                          icon: const Icon(Icons.grade),
                          label: const Text('Xem điểm'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF667eea),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        )
                      : ElevatedButton.icon(
                          onPressed:
                              canTakeExam ? () => _startExam(exam) : null,
                          icon:
                              Icon(canTakeExam ? Icons.play_arrow : Icons.lock),
                          label: Text(canTakeExam ? 'Làm bài' : statusText),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: canTakeExam
                                ? const Color(0xFF667eea)
                                : Colors.grey[400],
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 12),
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
}
