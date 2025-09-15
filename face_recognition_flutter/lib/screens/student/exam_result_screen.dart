// lib/screens/student/exam_result_screen.dart
import 'package:flutter/material.dart';
import '../../models/assignment_models.dart';
// import '../../utils/constants.dart';


class ExamResultScreen extends StatelessWidget {
  final ExamResult examResult;
  final Exam exam;

  const ExamResultScreen({
    super.key,
    required this.examResult,
    required this.exam,
  });
  
  @override
  Widget build(BuildContext context) {

    
    final totalScore = examResult.totalScore;
    final score = examResult.score ?? 0;
    
    print('ExamResultScreen: totalScore=$totalScore, score=$score');

    // Tránh chia cho 0
    final percentage = totalScore! > 0 ? (score / totalScore) * 100 : 0.0;
    final isPassed = percentage >= 50; // Assuming 50% is passing grade

    return Scaffold(
      appBar: AppBar(
        title: const Text('Kết quả bài kiểm tra'),
        backgroundColor: const Color(0xFF667eea),
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Success/Result Icon
            Container(
              padding: const EdgeInsets.all(24),
              child: Icon(
                isPassed ? Icons.check_circle : Icons.cancel,
                size: 80,
                color: isPassed ? Colors.green : Colors.red,
              ),
            ),

            // Result Header
            Text(
              isPassed ? 'Chúc mừng!' : 'Cần cố gắng thêm!',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isPassed ? Colors.green : Colors.red,
                  ),
            ),

            const SizedBox(height: 8),

            Text(
              exam.title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 24),

            // Score Card
            Card(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Main Score Display
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          '${examResult.score}',
                          style: TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.bold,
                            color: isPassed ? Colors.green : Colors.red,
                          ),
                        ),
                        Text(
                          '/${examResult.totalScore}',
                          style: TextStyle(
                            fontSize: 24,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 8),

                    // Percentage
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isPassed
                            ? Colors.green.withOpacity(0.1)
                            : Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isPassed ? Colors.green : Colors.red,
                        ),
                      ),
                      child: Text(
                        '${percentage.toStringAsFixed(1)}%',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: isPassed ? Colors.green : Colors.red,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Detailed Results
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Chi tiết kết quả',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 16),
                    _buildDetailRow(
                      icon: Icons.quiz,
                      label: 'Tổng số câu',
                      value: '${exam.questions.length}',
                    ),
                    _buildDetailRow(
                      icon: Icons.check_circle_outline,
                      label: 'Câu đã trả lời',
                      value: '${examResult.answers.length}',
                    ),
                    _buildDetailRow(
                      icon: Icons.access_time,
                      label: 'Thời gian làm bài',
                      value: '${exam.duration} phút',
                    ),
                    if (examResult.endTime != null)
                      _buildDetailRow(
                        icon: Icons.schedule,
                        label: 'Thời gian nộp bài',
                        value: _formatDateTime(examResult.endTime!),
                      ),
                    _buildDetailRow(
                      icon: Icons.grade,
                      label: 'Điểm đạt được',
                      value: '${examResult.score}/${examResult.totalScore}',
                      valueColor: isPassed ? Colors.green : Colors.red,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Progress Bar
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tiến độ hoàn thành',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Điểm số'),
                        Text(
                          '${(percentage.isNaN || percentage.isInfinite ? 0 : percentage).toStringAsFixed(1)}%',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: isPassed ? Colors.green : Colors.red,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: (percentage.isNaN || percentage.isInfinite)
                          ? 0
                          : (percentage / 100).clamp(0.0, 1.0),
                      backgroundColor: Colors.grey.shade300,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        isPassed ? Colors.green : Colors.red,
                      ),
                      minHeight: 8,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Tỷ lệ hoàn thành'),
                        Text(
                          '${examResult.answers.length}/${exam.questions.length}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: examResult.answers.length / exam.questions.length,
                      backgroundColor: Colors.grey.shade300,
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
                      minHeight: 8,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Performance Message
            Card(
              color: isPassed ? Colors.green.shade50 : Colors.orange.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Icon(
                      isPassed ? Icons.emoji_events : Icons.lightbulb_outline,
                      size: 32,
                      color: isPassed ? Colors.green : Colors.orange,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _getPerformanceMessage(percentage),
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        color: isPassed
                            ? Colors.green.shade700
                            : Colors.orange.shade700,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Action Buttons
            Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // Navigate back to exam list
                      Navigator.of(context).popUntil(
                        (route) =>
                            route.settings.name == '/student-assignments' ||
                            route.isFirst,
                      );
                    },
                    icon: const Icon(Icons.list),
                    label: const Text('Xem danh sách bài kiểm tra'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF667eea),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      // Navigate to dashboard
                      Navigator.of(context).popUntil((route) => route.isFirst);
                    },
                    icon: const Icon(Icons.home),
                    label: const Text('Về trang chủ'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.green,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
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

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
    Color? valueColor,
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
            child: Text(
              value,
              style: TextStyle(
                color: valueColor ?? Colors.black87,
                fontWeight:
                    valueColor != null ? FontWeight.bold : FontWeight.normal,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _getPerformanceMessage(double percentage) {
    if (percentage >= 90) {
      return 'Xuất sắc! Bạn đã làm bài rất tốt!';
    } else if (percentage >= 80) {
      return 'Tốt lắm! Kết quả của bạn rất ấn tượng!';
    } else if (percentage >= 70) {
      return 'Khá tốt! Bạn đã nắm vững phần lớn kiến thức!';
    } else if (percentage >= 60) {
      return 'Đạt yêu cầu! Hãy ôn tập thêm để cải thiện kết quả!';
    } else if (percentage >= 50) {
      return 'Đạt! Bạn cần cố gắng thêm để đạt kết quả tốt hơn!';
    } else {
      return 'Chưa đạt. Hãy ôn tập kỹ hơn và thử lại lần sau!';
    }
  }
}
