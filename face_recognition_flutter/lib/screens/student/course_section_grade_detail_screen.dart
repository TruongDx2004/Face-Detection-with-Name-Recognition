import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../models/grade_models.dart';
import '../../services/api_service.dart';

class CourseSectionGradeDetailScreen extends StatefulWidget {
  final int userId;
  final int courseSectionId;
  final String courseSectionName;

  const CourseSectionGradeDetailScreen({
    super.key,
    required this.userId,
    required this.courseSectionId,
    required this.courseSectionName,
  });

  @override
  State<CourseSectionGradeDetailScreen> createState() =>
      _CourseSectionGradeDetailScreenState();
}

class _CourseSectionGradeDetailScreenState
    extends State<CourseSectionGradeDetailScreen> {
  final Logger _logger = Logger();

  late Future<CourseSectionGradeDetail> _gradeDetailFuture;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  void _refreshData() {
    setState(() {
      _gradeDetailFuture = _fetchGradeDetail();
    });
  }

  Future<CourseSectionGradeDetail> _fetchGradeDetail() async {
    try {
      final response = await ApiService().getStudentCourseSectionGradeDetail(
        widget.userId,
        widget.courseSectionId,
      );
      if (response.success) {
        return response.data!;
      } else {
        _logger.e('Failed to fetch grade detail: ${response.message}');
        throw Exception(response.message);
      }
    } catch (e) {
      _logger.e('Error fetching grade detail: $e');
      rethrow;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Text(
          widget.courseSectionName,
          style: const TextStyle(
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
      body: FutureBuilder<CourseSectionGradeDetail>(
        future: _gradeDetailFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return _buildLoading();
          }

          if (snapshot.hasError) {
            return _buildError(snapshot.error.toString());
          }

          final gradeDetail = snapshot.data!;
          return RefreshIndicator(
            onRefresh: () async {
              _refreshData();
            },
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildOverallGradeCard(gradeDetail.overallGrade),
                  const SizedBox(height: 16),
                  _buildGradeConfigurationCard(gradeDetail.gradeConfiguration),
                  const SizedBox(height: 16),
                  _buildAssignmentsSection(gradeDetail.assignments),
                  const SizedBox(height: 16),
                  _buildExamsSection(gradeDetail.exams),
                  const SizedBox(height: 16),
                  _buildGradeBreakdownCard(gradeDetail),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildOverallGradeCard(StudentGrade grade) {
    final hasScore = grade.finalScore != null;
    final scoreColor = hasScore
        ? (grade.isPassed ? const Color(0xFF4CAF50) : const Color(0xFFFF5722))
        : Colors.grey[600];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            scoreColor?.withOpacity(0.8) ?? Colors.grey,
            scoreColor?.withOpacity(0.6) ?? Colors.grey,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: scoreColor?.withOpacity(0.3) ?? Colors.grey.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      grade.subjectName,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${grade.semester} - ${grade.academicYear}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    hasScore ? grade.finalScore!.toStringAsFixed(1) : 'Chưa có',
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    grade.letterGrade ?? '',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildOverallStatItem(
                'Bài tập',
                grade.assignmentAvg?.toStringAsFixed(1) ?? '-',
              ),
              _buildOverallStatItem(
                'Kiểm tra',
                grade.examAvg?.toStringAsFixed(1) ?? '-',
              ),
              _buildOverallStatItem(
                'Chuyên cần',
                grade.attendanceScore?.toStringAsFixed(1) ?? '-',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOverallStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.white.withOpacity(0.9),
          ),
        ),
      ],
    );
  }

  Widget _buildGradeConfigurationCard(Map<String, dynamic> config) {
    final assignmentWeight =
        double.tryParse(config['assignment_weight']?.toString() ?? '') ?? 30.0;
    final examWeight =
        double.tryParse(config['exam_weight']?.toString() ?? '') ?? 60.0;
    final attendanceWeight =
        double.tryParse(config['attendance_weight']?.toString() ?? '') ?? 10.0;
    final passingScore =
        double.tryParse(config['passing_score']?.toString() ?? '') ?? 5.0;

    return Container(
      padding: const EdgeInsets.all(16),
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
          const Row(
            children: [
              Icon(Icons.settings, color: Color(0xFF667eea)),
              SizedBox(width: 8),
              Text(
                'Cấu hình điểm',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3748),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildConfigItem(
                  'Bài tập',
                  '${assignmentWeight.toStringAsFixed(0)}%',
                  const Color(0xFFFF9800),
                ),
              ),
              Expanded(
                child: _buildConfigItem(
                  'Kiểm tra',
                  '${examWeight.toStringAsFixed(0)}%',
                  const Color(0xFF2196F3),
                ),
              ),
              Expanded(
                child: _buildConfigItem(
                  'Chuyên cần',
                  '${attendanceWeight.toStringAsFixed(0)}%',
                  const Color(0xFF4CAF50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.orange[200]!),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.orange[700], size: 20),
                const SizedBox(width: 8),
                Text(
                  'Điểm đậu: ${passingScore.toStringAsFixed(1)}',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.orange[700],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfigItem(String label, String value, Color color) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Center(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
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

  Widget _buildAssignmentsSection(List<AssignmentGrade> assignments) {
    return Container(
      padding: const EdgeInsets.all(16),
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
          Row(
            children: [
              const Icon(Icons.assignment, color: Color(0xFFFF9800)),
              const SizedBox(width: 8),
              Text(
                'Bài tập (${assignments.length})',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3748),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (assignments.isEmpty)
            _buildEmptySection('Chưa có bài tập nào', Icons.assignment)
          else
            ...assignments
                .map((assignment) => _buildAssignmentItem(assignment)),
        ],
      ),
    );
  }

  Widget _buildAssignmentItem(AssignmentGrade assignment) {
    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (assignment.status) {
      case 'graded':
        statusColor = const Color(0xFF4CAF50);
        statusIcon = Icons.check_circle;
        statusText = 'Đã chấm';
        break;
      case 'submitted':
        statusColor = const Color(0xFF2196F3);
        statusIcon = Icons.schedule;
        statusText = 'Đã nộp';
        break;
      case 'late':
        statusColor = const Color(0xFFFF9800);
        statusIcon = Icons.warning;
        statusText = 'Trễ hạn';
        break;
      default:
        statusColor = const Color(0xFFFF5722);
        statusIcon = Icons.cancel;
        statusText = 'Chưa nộp';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Icon(statusIcon, color: statusColor, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  assignment.assignmentTitle,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2D3748),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  statusText,
                  style: TextStyle(
                    fontSize: 12,
                    color: statusColor,
                  ),
                ),
                if (assignment.submittedAt != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Nộp: ${_formatDate(assignment.submittedAt!)}',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                assignment.score != null
                    ? '${assignment.score!.toStringAsFixed(1)}/${assignment.maxScore.toStringAsFixed(1)}'
                    : '-/${assignment.maxScore.toStringAsFixed(1)}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color:
                      assignment.score != null ? statusColor : Colors.grey[600],
                ),
              ),
              if (assignment.score != null) ...[
                const SizedBox(height: 2),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${((assignment.score! / assignment.maxScore) * 100).toStringAsFixed(0)}%',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildExamsSection(List<ExamGrade> exams) {
    return Container(
      padding: const EdgeInsets.all(16),
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
          Row(
            children: [
              const Icon(Icons.quiz, color: Color(0xFF2196F3)),
              const SizedBox(width: 8),
              Text(
                'Kiểm tra (${exams.length})',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3748),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (exams.isEmpty)
            _buildEmptySection('Chưa có bài kiểm tra nào', Icons.quiz)
          else
            ...exams.map((exam) => _buildExamItem(exam)),
        ],
      ),
    );
  }

  Widget _buildExamItem(ExamGrade exam) {
    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (exam.status) {
      case 'graded':
        statusColor = const Color(0xFF4CAF50);
        statusIcon = Icons.check_circle;
        statusText = 'Đã chấm';
        break;
      case 'completed':
        statusColor = const Color(0xFF2196F3);
        statusIcon = Icons.schedule;
        statusText = 'Đã thi';
        break;
      case 'in_progress':
        statusColor = const Color(0xFFFF9800);
        statusIcon = Icons.play_circle;
        statusText = 'Đang thi';
        break;
      default:
        statusColor = const Color(0xFF9E9E9E);
        statusIcon = Icons.radio_button_unchecked;
        statusText = 'Chưa thi';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Icon(statusIcon, color: statusColor, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  exam.examTitle,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2D3748),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  statusText,
                  style: TextStyle(
                    fontSize: 12,
                    color: statusColor,
                  ),
                ),
                if (exam.completedAt != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Thi: ${_formatDate(exam.completedAt!)}',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                exam.score != null
                    ? '${exam.score!.toStringAsFixed(1)}/${exam.maxScore.toStringAsFixed(1)}'
                    : '-/${exam.maxScore.toStringAsFixed(1)}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: exam.score != null ? statusColor : Colors.grey[600],
                ),
              ),
              if (exam.score != null) ...[
                const SizedBox(height: 2),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${((exam.score! / exam.maxScore) * 100).toStringAsFixed(0)}%',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGradeBreakdownCard(CourseSectionGradeDetail gradeDetail) {
    final config = gradeDetail.gradeConfiguration;
    final grade = gradeDetail.overallGrade;

    final assignmentWeight =
        double.tryParse(config['assignment_weight']?.toString() ?? '') ?? 30.0;
    final examWeight =
        double.tryParse(config['exam_weight']?.toString() ?? '') ?? 60.0;
    final attendanceWeight =
        double.tryParse(config['attendance_weight']?.toString() ?? '') ?? 10.0;

    return Container(
      padding: const EdgeInsets.all(16),
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
          const Row(
            children: [
              Icon(Icons.calculate, color: Color(0xFF667eea)),
              SizedBox(width: 8),
              Text(
                'Công thức tính điểm',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3748),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildBreakdownItem(
            'Điểm bài tập',
            grade.assignmentAvg?.toStringAsFixed(1) ?? '0.0',
            assignmentWeight,
            const Color(0xFFFF9800),
          ),
          const SizedBox(height: 8),
          _buildBreakdownItem(
            'Điểm kiểm tra',
            grade.examAvg?.toStringAsFixed(1) ?? '0.0',
            examWeight,
            const Color(0xFF2196F3),
          ),
          const SizedBox(height: 8),
          _buildBreakdownItem(
            'Điểm chuyên cần',
            grade.attendanceScore?.toStringAsFixed(1) ?? '0.0',
            attendanceWeight,
            const Color(0xFF4CAF50),
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Điểm cuối',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3748),
                ),
              ),
              Text(
                grade.finalScore?.toStringAsFixed(2) ?? '0.00',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: grade.isPassed
                      ? const Color(0xFF4CAF50)
                      : const Color(0xFFFF5722),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBreakdownItem(
      String label, String score, double weight, Color color) {
    final weightedScore = (double.tryParse(score) ?? 0.0) * weight / 100;

    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(6),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF2D3748),
            ),
          ),
        ),
        Text(
          '$score × ${weight.toStringAsFixed(0)}%',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '= ${weightedScore.toStringAsFixed(2)}',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptySection(String message, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Icon(
            icon,
            size: 48,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 12),
          Text(
            message,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoading() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text(
            'Đang tải điểm số...',
            style: TextStyle(
              fontSize: 16,
              color: Color(0xFF2D3748),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildError(String error) {
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
            'Không thể tải điểm số',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          // Text(
          //   error,
          //   style: TextStyle(
          //     fontSize: 14,
          //     color: Colors.grey[600],
          //   ),
          //   textAlign: TextAlign.center,
          // ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _refreshData,
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
}
