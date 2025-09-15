// lib/screens/student/exam_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../models/assignment_models.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart'; // ignore: unused_import
import '../../widgets/loading_dialog.dart'; // ignore: unused_import
import 'exam_taking_screen.dart';

class ExamDetailScreen extends StatefulWidget {
  final Exam exam;
  final int userId;

  const ExamDetailScreen({
    super.key,
    required this.exam,
    required this.userId,
  });

  @override
  State<ExamDetailScreen> createState() => _ExamDetailScreenState();
}

class _ExamDetailScreenState extends State<ExamDetailScreen> {
  final Logger _logger = Logger();
  bool _isLoading = false;
  ExamResult? _examResult;

  @override
  void initState() {
    super.initState();
    _loadExamResult();
  }

  Future<void> _loadExamResult() async {
    try {
      setState(() => _isLoading = true);
      
      // Sử dụng API đã thống nhất để lấy kết quả exam cụ thể
      final response = await ApiService().getStudentExamResult(
        examId: widget.exam.id,
        // studentId không cần thiết vì API sẽ lấy từ token
      );
      
      if (response.success && response.data != null) {
        _examResult = response.data!;
      } else {
        // Nếu chưa có kết quả, _examResult sẽ là null
        _examResult = null;
      }
    } catch (e) {
      _logger.e('Error loading exam result: $e');
      // Nếu có lỗi (ví dụ: chưa làm bài), _examResult sẽ là null
      _examResult = null;
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _startExam() {
    final now = DateTime.now();
    final canTakeExam = now.isAfter(widget.exam.startTime) &&
        now.isBefore(widget.exam.endTime) &&
        _examResult?.isCompleted != true;

    if (!canTakeExam) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không thể làm bài kiểm tra lúc này'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ExamTakingScreen(
          exam: widget.exam,
          userId: widget.userId,
        ),
      ),
    ).then((_) {
      // Reload exam result after returning from exam
      _loadExamResult();
    });
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _getExamStatus() {
    final now = DateTime.now();
    
    if (_examResult?.isCompleted == true) {
      return 'Đã hoàn thành';
    } else if (now.isBefore(widget.exam.startTime)) {
      return 'Chưa bắt đầu';
    } else if (now.isAfter(widget.exam.endTime)) {
      return 'Đã kết thúc';
    } else {
      return 'Đang diễn ra';
    }
  }

  Color _getStatusColor() {
    final now = DateTime.now();
    
    if (_examResult?.isCompleted == true) {
      return Colors.green;
    } else if (now.isBefore(widget.exam.startTime)) {
      return Colors.orange;
    } else if (now.isAfter(widget.exam.endTime)) {
      return Colors.red;
    } else {
      return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final canTakeExam = now.isAfter(widget.exam.startTime) &&
        now.isBefore(widget.exam.endTime) &&
        _examResult?.isCompleted != true;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi tiết bài kiểm tra'),
        backgroundColor: const Color.fromARGB(255, 67, 148, 69),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Exam title and status
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.exam.title,
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: _getStatusColor().withOpacity(0.1),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: _getStatusColor()),
                            ),
                            child: Text(
                              _getExamStatus(),
                              style: TextStyle(
                                color: _getStatusColor(),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Exam description
                  if (widget.exam.description.isNotEmpty) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Mô tả',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              widget.exam.description,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Exam details
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Thông tin chi tiết',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          _buildDetailRow(
                            icon: Icons.access_time,
                            label: 'Thời gian làm bài',
                            value: '${widget.exam.duration} phút',
                          ),
                          _buildDetailRow(
                            icon: Icons.quiz,
                            label: 'Số câu hỏi',
                            value: '${widget.exam.questions.length} câu',
                          ),
                          _buildDetailRow(
                            icon: Icons.grade,
                            label: 'Tổng điểm',
                            value: '${widget.exam.totalScore} điểm',
                          ),
                          _buildDetailRow(
                            icon: Icons.schedule,
                            label: 'Thời gian bắt đầu',
                            value: _formatDateTime(widget.exam.startTime),
                          ),
                          _buildDetailRow(
                            icon: Icons.schedule_send,
                            label: 'Thời gian kết thúc',
                            value: _formatDateTime(widget.exam.endTime),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Exam result (if completed)
                  if (_examResult?.isCompleted == true) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Kết quả',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            _buildDetailRow(
                              icon: Icons.score,
                              label: 'Điểm đạt được',
                              value: '${_examResult!.score}/${_examResult!.totalScore}',
                            ),
                            if (_examResult!.score != null && _examResult!.totalScore! > 0)
                              _buildDetailRow(
                                icon: Icons.percent,
                                label: 'Phần trăm',
                                value: '${((_examResult!.score! / _examResult!.totalScore!) * 100).toStringAsFixed(1)}%',
                              ),
                            if (_examResult!.endTime != null)
                              _buildDetailRow(
                                icon: Icons.check_circle,
                                label: 'Thời gian nộp bài',
                                value: _formatDateTime(_examResult!.endTime!),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Instructions
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hướng dẫn',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            '• Đọc kỹ đề bài trước khi làm\n'
                            '• Quản lý thời gian hợp lý\n'
                            '• Kiểm tra lại bài làm trước khi nộp\n'
                            '• Không được thoát khỏi ứng dụng trong khi làm bài\n'
                            '• Bài làm sẽ được tự động nộp khi hết thời gian',
                            style: TextStyle(height: 1.5),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Action buttons
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: canTakeExam ? _startExam : null,
                      icon: Icon(canTakeExam ? Icons.play_arrow : Icons.lock),
                      label: Text(
                        canTakeExam
                            ? 'Bắt đầu làm bài'
                            : _examResult?.isCompleted == true
                                ? 'Đã hoàn thành'
                                : 'Không thể làm bài',
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: canTakeExam ? Colors.green : Colors.grey,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.green),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: const TextStyle(color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }
}