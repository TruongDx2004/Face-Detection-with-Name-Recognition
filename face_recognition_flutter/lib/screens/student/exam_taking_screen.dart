// lib/screens/student/exam_taking_screen.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; 
import 'package:logger/logger.dart';
import '../../models/assignment_models.dart';
import '../../services/api_service.dart';
import '../../utils/constants.dart'; // ignore: unused_import
import '../../widgets/loading_dialog.dart'; // ignore: unused_import
import 'exam_result_screen.dart';

class ExamTakingScreen extends StatefulWidget {
  final Exam exam;
  final int userId;

  const ExamTakingScreen({
    super.key,
    required this.exam,
    required this.userId,
  });

  @override
  State<ExamTakingScreen> createState() => _ExamTakingScreenState();
}

class _ExamTakingScreenState extends State<ExamTakingScreen>
    with WidgetsBindingObserver {
  final Logger _logger = Logger();
  final PageController _pageController = PageController();
  
  Timer? _timer;
  int _remainingTimeInSeconds = 0;
  int _currentQuestionIndex = 0;
  bool _isSubmitting = false;
  bool _hasStarted = false;
  ExamResult? _examResult;
  
  // Store answers: question_id -> answer
  final Map<int, ExamAnswer> _answers = {};
  final List<TextEditingController> _essayControllers = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    
    // Defer initialization until after the widget tree is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeExam();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    for (var controller in _essayControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Prevent app backgrounding during exam
    if (_hasStarted && !_isSubmitting && state != AppLifecycleState.resumed) {
      _showAppBackgroundWarning();
    }
  }

  void _initializeExam() {
    // Validate exam data before initializing
    if (widget.exam.questions.isEmpty) {
      _showErrorAndExit('Bài kiểm tra không có câu hỏi nào.');
      return;
    }
    
    if (widget.exam.duration <= 0) {
      _showErrorAndExit('Thời gian làm bài không hợp lệ.');
      return;
    }
    
    _remainingTimeInSeconds = widget.exam.duration * 60; // Convert to seconds
    
    // Initialize essay controllers
    for (int i = 0; i < widget.exam.questions.length; i++) {
      _essayControllers.add(TextEditingController());
    }
    
    _startExamAttempt();
  }

  Future<void> _startExamAttempt() async {
    try {
      // Check if widget is still mounted before showing dialogs
      if (!mounted) return;
      
      _showLoadingDialog('Đang bắt đầu bài kiểm tra...');
      final response = await ApiService().startExamAttempt(
        examId: widget.exam.id,
        studentId: widget.userId,
      );
      
      if (!mounted) return;
      Navigator.of(context).pop(); // Close loading dialog
      
      if (response.success) {
        _examResult = response.data!;
        
        // Cập nhật exam questions từ backend response nếu có
        if (_examResult!.exam != null && _examResult!.exam!.questions.isNotEmpty) {
          // Clear existing questions and add from response
          widget.exam.questions.clear();
          widget.exam.questions.addAll(_examResult!.exam!.questions);
          
          // Re-initialize essay controllers with correct count
          for (var controller in _essayControllers) {
            controller.dispose();
          }
          _essayControllers.clear();
          for (int i = 0; i < widget.exam.questions.length; i++) {
            _essayControllers.add(TextEditingController());
          }
        }
        
        if (mounted) setState(() => _hasStarted = true);
        _startTimer();
      } else {
        _showErrorAndExit('Không thể bắt đầu bài kiểm tra: ${response.message}');
      }
    } catch (e) {
      if (mounted) Navigator.of(context).pop(); // Close loading dialog
      _logger.e('Error starting exam: $e');
      if (mounted) _showErrorAndExit('Lỗi khi bắt đầu bài kiểm tra');
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _remainingTimeInSeconds--;
      });
      
      if (_remainingTimeInSeconds <= 0) {
        _autoSubmitExam();
      } else if (_remainingTimeInSeconds <= 300) { // 5 minutes warning
        if (_remainingTimeInSeconds % 60 == 0) {
          _showTimeWarning();
        }
      }
    });
  }

  void _showTimeWarning() {
    if (!mounted) return;
    
    final minutes = _remainingTimeInSeconds ~/ 60;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Còn $minutes phút!'),
        backgroundColor: Colors.orange,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _showAppBackgroundWarning() {
    if (!mounted) return;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Cảnh báo'),
        content: const Text('Không được thoát khỏi ứng dụng trong khi làm bài!'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Đã hiểu'),
          ),
        ],
      ),
    );
  }

  void _showErrorAndExit(String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Lỗi'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop();
            },
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _showLoadingDialog(String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(message),
          ],
        ),
      ),
    );
  }

  void _saveAnswer(int questionId, String? selectedAnswer, String? essayAnswer) {
    setState(() {
      // Combine selected answer and essay answer into a single answer field
      String? finalAnswer;
      if (selectedAnswer != null) {
        finalAnswer = selectedAnswer;
      } else if (essayAnswer != null && essayAnswer.isNotEmpty) {
        finalAnswer = essayAnswer;
      }
      
      _answers[questionId] = ExamAnswer(
        id: 0,
        examResultId: _examResult!.id,
        questionId: questionId,
        studentAnswer: finalAnswer,
        isCorrect: null, // Will be determined by backend
        pointsEarned: 0.0, // Will be calculated by backend
      );
    });
  }

  Future<void> _submitExam() async {
    final shouldSubmit = await _showSubmitConfirmation();
    if (!shouldSubmit) return;

    await _performSubmit();
  }

  Future<void> _autoSubmitExam() async {
    _timer?.cancel();
    await _performSubmit(isAutoSubmit: true);
  }

  Future<void> _performSubmit({bool isAutoSubmit = false}) async {
    if (_isSubmitting) return;
    
    setState(() => _isSubmitting = true);
    
    try {
      _showLoadingDialog(
        isAutoSubmit ? 'Hết thời gian! Đang nộp bài...' : 'Đang nộp bài...'
      );
      
      final answers = _answers.values.toList();
      
      final response = await ApiService().submitExamAttempt(
        resultId: _examResult!.id, // Sử dụng resultId thay vì examId
        answers: answers,
      );
      
      Navigator.of(context).pop(); // Close loading dialog
      
      if (response.success) {
        final result = response.data!;
        _navigateToResult(result);
      } else {
        throw Exception(response.message);
      }
    } catch (e) {
      Navigator.of(context).pop(); // Close loading dialog
      setState(() => _isSubmitting = false);
      _logger.e('Error submitting exam: $e');
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi khi nộp bài: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _navigateToResult(ExamResult result) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => ExamResultScreen(
          examResult: result,
          exam: widget.exam,
        ),
      ),
    );
  }

  Future<bool> _showSubmitConfirmation() async {
    final unansweredCount = widget.exam.questions.isNotEmpty 
        ? widget.exam.questions.length - _answers.length 
        : 0;
    
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nộp bài'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bạn có chắc chắn muốn nộp bài?'),
            if (unansweredCount > 0) ...[
              const SizedBox(height: 8),
              Text(
                'Còn $unansweredCount câu chưa trả lời.',
                style: const TextStyle(color: Colors.orange),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Nộp bài'),
          ),
        ],
      ),
    ) ?? false;
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasStarted) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return WillPopScope(
      onWillPop: () async {
        final shouldExit = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Thoát bài kiểm tra'),
            content: const Text('Bạn có chắc chắn muốn thoát? Bài làm sẽ không được lưu.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Hủy'),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Thoát'),
              ),
            ],
          ),
        );
        return shouldExit ?? false;
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.exam.title),
          backgroundColor: const Color(0xFF667eea),
          foregroundColor: Colors.white,
          automaticallyImplyLeading: false,
          actions: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              margin: const EdgeInsets.only(right: 16),
              decoration: BoxDecoration(
                color: _remainingTimeInSeconds <= 300 ? Colors.red : Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _formatTime(_remainingTimeInSeconds),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: _remainingTimeInSeconds <= 300 ? Colors.white : Colors.green,
                ),
              ),
            ),
          ],
        ),
        body: Column(
          children: [
            // Progress indicator
            Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Câu ${_currentQuestionIndex + 1}/${widget.exam.questions.length}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'Đã trả lời: ${_answers.length}/${widget.exam.questions.length}',
                        style: const TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: widget.exam.questions.isNotEmpty 
                        ? (_currentQuestionIndex + 1) / widget.exam.questions.length 
                        : 0.0,
                    backgroundColor: Colors.grey.shade300,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
                  ),
                ],
              ),
            ),
            
            // Question content
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() => _currentQuestionIndex = index);
                },
                itemCount: widget.exam.questions.length,
                itemBuilder: (context, index) {
                  final question = widget.exam.questions[index];
                  return _buildQuestionWidget(question, index);
                },
              ),
            ),
            
            // Navigation and submit buttons
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (_currentQuestionIndex > 0)
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          _pageController.previousPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                        icon: const Icon(Icons.arrow_back),
                        label: const Text('Câu trước'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  
                  if (_currentQuestionIndex > 0 && _currentQuestionIndex < widget.exam.questions.length - 1)
                    const SizedBox(width: 16),
                  
                  if (_currentQuestionIndex < widget.exam.questions.length - 1)
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          _pageController.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                        icon: const Icon(Icons.arrow_forward),
                        label: const Text('Câu sau'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF667eea),
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  
                  if (_currentQuestionIndex == widget.exam.questions.length - 1) ...[
                    if (_currentQuestionIndex > 0) const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting ? null : _submitExam,
                        icon: const Icon(Icons.send),
                        label: const Text('Nộp bài'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF667eea),
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestionWidget(ExamQuestion question, int index) {
    final currentAnswer = _answers[question.id];
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Question header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      '${question.points.toStringAsFixed(1)} điểm',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const Spacer(),
                  if (currentAnswer != null)
                    const Icon(Icons.check_circle, color: Colors.green),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Question text
              Text(
                question.questionText,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Answer options based on question type
              if (question.questionType == 'multiple_choice')
                _buildMultipleChoiceOptions(question, currentAnswer),
              
              if (question.questionType == 'true_false')
                _buildTrueFalseOptions(question, currentAnswer),
              
              if (question.questionType == 'essay')
                _buildEssayAnswer(question, index, currentAnswer),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMultipleChoiceOptions(ExamQuestion question, ExamAnswer? currentAnswer) {
    return Column(
      children: question.options.map((option) {
        final isSelected = currentAnswer?.answer == option;
        
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          child: InkWell(
            onTap: () => _saveAnswer(question.id, option, null),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(
                  color: isSelected ? Colors.green : Colors.grey.shade300,
                  width: isSelected ? 2 : 1,
                ),
                borderRadius: BorderRadius.circular(8),
                color: isSelected ? Colors.green.withOpacity(0.1) : Colors.transparent,
              ),
              child: Row(
                children: [
                  Icon(
                    isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                    color: isSelected ? Colors.green : Colors.grey,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      option,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTrueFalseOptions(ExamQuestion question, ExamAnswer? currentAnswer) {
    return Column(
      children: [
        _buildTrueFalseOption('Đúng', 'true', currentAnswer?.answer == 'true', question.id),
        const SizedBox(height: 8),
        _buildTrueFalseOption('Sai', 'false', currentAnswer?.answer == 'false', question.id),
      ],
    );
  }

  Widget _buildTrueFalseOption(String label, String value, bool isSelected, int questionId) {
    return InkWell(
      onTap: () => _saveAnswer(questionId, value, null),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? Colors.green : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(8),
          color: isSelected ? Colors.green.withOpacity(0.1) : Colors.transparent,
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              color: isSelected ? Colors.green : Colors.grey,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEssayAnswer(ExamQuestion question, int index, ExamAnswer? currentAnswer) {
    final controller = _essayControllers[index];
    
    if (currentAnswer?.answer != null && controller.text != currentAnswer!.answer) {
      controller.text = currentAnswer.answer!;
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Câu trả lời của bạn:',
          style: TextStyle(fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          maxLines: 8,
          decoration: InputDecoration(
            hintText: 'Nhập câu trả lời của bạn...',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Colors.green),
            ),
          ),
          onChanged: (value) {
            _saveAnswer(question.id, null, value.isEmpty ? null : value);
          },
        ),
      ],
    );
  }
}