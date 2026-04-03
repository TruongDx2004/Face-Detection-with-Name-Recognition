import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../models/grade_models.dart';
import '../../services/api_service.dart';
import 'course_section_grade_detail_screen.dart';

class StudentGradesScreen extends StatefulWidget {
  final int userId;

  const StudentGradesScreen({
    super.key,
    required this.userId,
  });

  @override
  State<StudentGradesScreen> createState() => _StudentGradesScreenState();
}

class _StudentGradesScreenState extends State<StudentGradesScreen>
    with SingleTickerProviderStateMixin {
  final Logger _logger = Logger();
  late TabController _tabController;

  // Futures for loading data
  late Future<List<SemesterSummary>> _semestersFuture;
  late Future<GpaOverall> _gpaOverallFuture;
  late Future<List<StudentGrade>> _currentGradesFuture;

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

  void _refreshData() {
    setState(() {
      _semestersFuture = _fetchSemesterSummaries();
      _gpaOverallFuture = _fetchGpaOverall();
      _currentGradesFuture = _fetchCurrentGrades();
    });
  }

  Future<List<SemesterSummary>> _fetchSemesterSummaries() async {
    try {
      final response = await ApiService().getStudentSemesterSummaries(widget.userId);
      if (response.success) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch semester summaries: ${response.message}');
        return [];
      }
    } catch (e) {
      _logger.e('Error fetching semester summaries: $e');
      return [];
    }
  }

  Future<GpaOverall> _fetchGpaOverall() async {
    try {
      final response = await ApiService().getStudentGpaOverall(widget.userId);
      if (response.success) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch GPA overall: ${response.message}');
        return GpaOverall(
          cumulativeGpa: 0.0,
          totalCredits: 0,
          totalSemesters: 0,
          averageScore: 0.0,
          classification: 'Chưa xác định',
        );
      }
    } catch (e) {
      _logger.e('Error fetching GPA overall: $e');
      return GpaOverall(
        cumulativeGpa: 0.0,
        totalCredits: 0,
        totalSemesters: 0,
        averageScore: 0.0,
        classification: 'Chưa xác định',
      );
    }
  }

  Future<List<StudentGrade>> _fetchCurrentGrades() async {
    try {
      final response = await ApiService().getStudentCurrentGrades(widget.userId);
      if (response.success) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch current grades: ${response.message}');
        return [];
      }
    } catch (e) {
      _logger.e('Error fetching current grades: $e');
      return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text(
          'Điểm số',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF667eea),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _refreshData,
            icon: const Icon(Icons.refresh, color: Colors.white),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildOverallStats(),
          _buildTabBar(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildCurrentGradesTab(),
                _buildSemesterSummaryTab(),
                _buildGpaOverallTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverallStats() {
    return FutureBuilder<GpaOverall>(
      future: _gpaOverallFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildStatsLoading();
        }

        final gpaOverall = snapshot.data ??
            GpaOverall(
              cumulativeGpa: 0.0,
              totalCredits: 0,
              totalSemesters: 0,
              averageScore: 0.0,
              classification: 'Chưa xác định',
            );

        return Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF667eea), Color(0xFF764ba2)],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF667eea).withOpacity(0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildStatItem(
                    'GPA Tích lũy',
                    gpaOverall.cumulativeGpa.toStringAsFixed(2),
                    Icons.school,
                  ),
                  _buildStatItem(
                    'Tổng tín chỉ',
                    gpaOverall.totalCredits.toString(),
                    Icons.credit_score,
                  ),
                  _buildStatItem(
                    'Học kỳ',
                    gpaOverall.totalSemesters.toString(),
                    Icons.calendar_month,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'Xếp loại: ${gpaOverall.classification}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatsLoading() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey[300],
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              CircularProgressIndicator(),
              CircularProgressIndicator(),
              CircularProgressIndicator(),
            ],
          ),
          SizedBox(height: 16),
          CircularProgressIndicator(),
        ],
      ),
    );
  }

  Widget _buildStatItem(String title, String value, IconData icon) {
    return Column(
      children: [
        Icon(
          icon,
          color: Colors.white,
          size: 32,
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          title,
          style: TextStyle(
            color: Colors.white.withOpacity(0.9),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TabBar(
        controller: _tabController,
        labelColor: const Color(0xFF667eea),
        unselectedLabelColor: Colors.grey[600],
        indicatorColor: const Color(0xFF667eea),
        indicatorWeight: 3,
        tabs: const [
          Tab(
            icon: Icon(Icons.grade),
            text: 'Học phần hiện tại',
          ),
          Tab(
            icon: Icon(Icons.history),
            text: 'Theo học kỳ',
          ),
          Tab(
            icon: Icon(Icons.analytics),
            text: 'Tổng kết',
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentGradesTab() {
    return FutureBuilder<List<StudentGrade>>(
      future: _currentGradesFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildListLoading();
        }

        if (snapshot.hasError) {
          return _buildError('Không thể tải điểm số hiện tại');
        }

        final grades = snapshot.data ?? [];
        if (grades.isEmpty) {
          return _buildEmptyState(
            'Chưa có điểm số',
            'Bạn chưa được ghi nhận điểm số nào trong học kỳ này',
            Icons.grade,
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            _refreshData();
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: grades.length,
            itemBuilder: (context, index) {
              final grade = grades[index];
              return _buildCurrentGradeCard(grade);
            },
          ),
        );
      },
    );
  }

  Widget _buildCurrentGradeCard(StudentGrade grade) {
    final hasScore = grade.finalScore != null;
    final scoreColor = hasScore
        ? (grade.isPassed ? const Color(0xFF4CAF50) : const Color(0xFFFF5722))
        : Colors.grey[600];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => _navigateToCourseSectionDetail(grade),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            grade.subjectName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF2D3748),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            grade.courseSectionName,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: scoreColor?.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            hasScore 
                                ? grade.finalScore!.toStringAsFixed(1)
                                : 'Chưa có',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: scoreColor,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          grade.letterGrade ?? '',
                          style: TextStyle(
                            fontSize: 12,
                            color: scoreColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildMiniStat('BT', grade.assignmentAvg?.toStringAsFixed(1) ?? '-'),
                    const SizedBox(width: 16),
                    _buildMiniStat('KT', grade.examAvg?.toStringAsFixed(1) ?? '-'),
                    const SizedBox(width: 16),
                    _buildMiniStat('CC', grade.attendanceScore?.toStringAsFixed(1) ?? '-'),
                    const Spacer(),
                    Icon(
                      Icons.chevron_right,
                      color: Colors.grey[400],
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

  Widget _buildMiniStat(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2D3748),
          ),
        ),
      ],
    );
  }

  Widget _buildSemesterSummaryTab() {
    return FutureBuilder<List<SemesterSummary>>(
      future: _semestersFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildListLoading();
        }

        if (snapshot.hasError) {
          return _buildError('Không thể tải dữ liệu học kỳ');
        }

        final semesters = snapshot.data ?? [];
        if (semesters.isEmpty) {
          return _buildEmptyState(
            'Chưa có dữ liệu học kỳ',
            'Bạn chưa hoàn thành học kỳ nào',
            Icons.calendar_month,
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            _refreshData();
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: semesters.length,
            itemBuilder: (context, index) {
              final semester = semesters[index];
              return _buildSemesterCard(semester);
            },
          ),
        );
      },
    );
  }

  Widget _buildSemesterCard(SemesterSummary semester) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ExpansionTile(
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: const Color(0xFF667eea).withOpacity(0.1),
            borderRadius: BorderRadius.circular(25),
          ),
          child: const Icon(
            Icons.calendar_month,
            color: Color(0xFF667eea),
          ),
        ),
        title: Text(
          '${semester.semester} - ${semester.academicYear}',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(
          'GPA: ${semester.averageGpa.toStringAsFixed(2)} • ${semester.passedSubjects}/${semester.totalSubjects} môn đậu',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildSemesterStat('Tổng tín chỉ', semester.totalCredits.toString()),
                    _buildSemesterStat('GPA học kỳ', semester.averageGpa.toStringAsFixed(2)),
                    _buildSemesterStat('Tỷ lệ đậu', '${(semester.passedSubjects/semester.totalSubjects*100).toStringAsFixed(1)}%'),
                  ],
                ),
                const SizedBox(height: 16),
                ...semester.grades.map((grade) => _buildSemesterGradeItem(grade)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSemesterStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF667eea),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildSemesterGradeItem(StudentGrade grade) {
    final scoreColor = grade.isPassed ? const Color(0xFF4CAF50) : const Color(0xFFFF5722);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  grade.subjectName,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  grade.courseSectionName,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                grade.finalScore?.toStringAsFixed(1) ?? '-',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: scoreColor,
                ),
              ),
              Text(
                grade.letterGrade ?? '',
                style: TextStyle(
                  fontSize: 12,
                  color: scoreColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGpaOverallTab() {
    return FutureBuilder<GpaOverall>(
      future: _gpaOverallFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildListLoading();
        }

        if (snapshot.hasError) {
          return _buildError('Không thể tải dữ liệu tổng kết');
        }

        final gpaOverall = snapshot.data ??
            GpaOverall(
              cumulativeGpa: 0.0,
              totalCredits: 0,
              totalSemesters: 0,
              averageScore: 0.0,
              classification: 'Chưa xác định',
            );

        return RefreshIndicator(
          onRefresh: () async {
            _refreshData();
          },
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildGpaOverallCard(gpaOverall),
                const SizedBox(height: 16),
                _buildClassificationCard(gpaOverall),
                const SizedBox(height: 16),
                _buildGpaChart(gpaOverall),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildGpaOverallCard(GpaOverall gpaOverall) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text(
            'GPA Tích lũy',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            gpaOverall.cumulativeGpa.toStringAsFixed(2),
            style: const TextStyle(
              fontSize: 48,
              fontWeight: FontWeight.bold,
              color: Color(0xFF667eea),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildOverallStat('Tổng tín chỉ', gpaOverall.totalCredits.toString()),
              _buildOverallStat('Học kỳ', gpaOverall.totalSemesters.toString()),
              _buildOverallStat('Điểm TB', gpaOverall.averageScore.toStringAsFixed(2)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOverallStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2D3748),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildClassificationCard(GpaOverall gpaOverall) {
    Color classificationColor;
    IconData classificationIcon;
    
    if (gpaOverall.cumulativeGpa >= 3.6) {
      classificationColor = const Color(0xFF4CAF50);
      classificationIcon = Icons.stars;
    } else if (gpaOverall.cumulativeGpa >= 3.2) {
      classificationColor = const Color(0xFF2196F3);
      classificationIcon = Icons.star;
    } else if (gpaOverall.cumulativeGpa >= 2.5) {
      classificationColor = const Color(0xFFFF9800);
      classificationIcon = Icons.star_half;
    } else {
      classificationColor = const Color(0xFFFF5722);
      classificationIcon = Icons.star_border;
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: classificationColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(30),
            ),
            child: Icon(
              classificationIcon,
              size: 30,
              color: classificationColor,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Xếp loại học tập',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  gpaOverall.classification,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: classificationColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGpaChart(GpaOverall gpaOverall) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Tiến độ GPA',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          LinearProgressIndicator(
            value: gpaOverall.cumulativeGpa / 4.0,
            backgroundColor: Colors.grey[200],
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF667eea)),
            minHeight: 8,
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '0.0',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              Text(
                '4.0',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildListLoading() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          height: 100,
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: BorderRadius.circular(12),
          ),
        );
      },
    );
  }

  Widget _buildError(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _refreshData,
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String message, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
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
            message,
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

  void _navigateToCourseSectionDetail(StudentGrade grade) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => CourseSectionGradeDetailScreen(
          userId: widget.userId,
          courseSectionId: grade.courseSectionId,
          courseSectionName: grade.courseSectionName,
        ),
      ),
    );
  }
}