// lib/screens/student/assignment_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import '../../models/assignment_models.dart';
import '../../services/api_service.dart';

class AssignmentDetailScreen extends StatefulWidget {
  final Assignment assignment;
  final int userId;
  final AssignmentSubmission? submission;

  const AssignmentDetailScreen({
    super.key,
    required this.assignment,
    required this.userId,
    this.submission,
  });

  @override
  State<AssignmentDetailScreen> createState() => _AssignmentDetailScreenState();
}

class _AssignmentDetailScreenState extends State<AssignmentDetailScreen> {
  final Logger _logger = Logger();
  final TextEditingController _submissionController = TextEditingController();
  File? _selectedFile;
  bool _isSubmitting = false;
  AssignmentSubmission? _currentSubmission;

  @override
  void initState() {
    super.initState();
    _currentSubmission = widget.submission;
    if (_currentSubmission?.submissionText != null) {
      _submissionController.text = _currentSubmission!.submissionText!;
    }
  }

  @override
  void dispose() {
    _submissionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Chi tiết bài tập'),
        backgroundColor: const Color(0xFF667eea),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildAssignmentInfo(),
            const SizedBox(height: 24),
            _buildSubmissionSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildAssignmentInfo() {
    return Container(
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
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF667eea).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.assignment,
                    color: Color(0xFF667eea),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.assignment.title,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D3748),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.assignment.assignmentTypeDisplay,
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

            const SizedBox(height: 20),

            // Description
            if (widget.assignment.description != "") ...[
              const Text(
                'Mô tả bài tập',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3748),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                widget.assignment.description!,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Instructions
            if (widget.assignment.instructions != "") ...[
              const Text(
                'Hướng dẫn làm bài',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3748),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Text(
                  widget.assignment.instructions!,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.blue[800],
                    height: 1.5,
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Assignment details
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _buildDetailRow(
                    Icons.grade,
                    'Điểm tối đa',
                    '${widget.assignment.maxScore} điểm',
                  ),
                  const SizedBox(height: 12),
                  _buildDetailRow(
                    Icons.calendar_today,
                    'Hạn nộp',
                    _formatDate(widget.assignment.dueDate),
                  ),
                  const SizedBox(height: 12),
                  _buildDetailRow(
                    Icons.access_time,
                    'Thời gian',
                    _formatTime(widget.assignment.dueDate),
                  ),
                  if (widget.assignment.courseName != null) ...[
                    const SizedBox(height: 12),
                    _buildDetailRow(
                      Icons.school,
                      'Học phần',
                      widget.assignment.courseName!,
                    ),
                  ],
                ],
              ),
            ),

            // Attachment
            if (widget.assignment.attachmentPath != null) ...[
              const SizedBox(height: 20), 
              const Text(
                'Tài liệu đính kèm',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D3748),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green[200]!),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.attach_file,
                      color: Colors.green[700],
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        widget.assignment.attachmentPath!.split('/').last,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.green[800],
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: _downloadAttachment,
                      icon: Icon(
                        Icons.download,
                        color: Colors.green[700],
                        size: 20,
                      ),
                      tooltip: 'Tải xuống',
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSubmissionSection() {
    final isOverdue = widget.assignment.dueDate.isBefore(DateTime.now());
    final canSubmit = !(_currentSubmission?.isSubmitted ?? false) && !isOverdue;

    return Container(
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
            Row(
              children: [
                const Icon(
                  Icons.upload,
                  color: Color(0xFF667eea),
                  size: 24,
                ),
                const SizedBox(width: 12),
                const Text(
                  'Nộp bài tập',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D3748),
                  ),
                ),
                const Spacer(),
                if (_currentSubmission?.isSubmitted ?? false)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _currentSubmission!.statusDisplay,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.green[700],
                      ),
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 20),

            // Submission status
            if (_currentSubmission?.isSubmitted ?? false) ...[
              _buildSubmissionStatus(),
              const SizedBox(height: 20),
            ],

            // Submission form
            if (canSubmit) ...[
              _buildSubmissionForm(),
            ] else if (isOverdue && !(_currentSubmission?.isSubmitted ?? false)) ...[
              _buildOverdueMessage(),
            ] else if (_currentSubmission?.isSubmitted ?? false) ...[
              _buildSubmittedContent(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSubmissionStatus() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green[200]!),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                Icons.check_circle,
                color: Colors.green[700],
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Đã nộp bài thành công',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.green[800],
                ),
              ),
            ],
          ),
          if (_currentSubmission?.submittedAt != "") ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.schedule,
                  color: Colors.green[600],
                  size: 16,
                ),
                const SizedBox(width: 8),
                Text(
                  'Đã nộp: ${_formatDateTime(_currentSubmission!.submittedAt!)}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.green[700],
                  ),
                ),
              ],
            ),
          ],
          if (_currentSubmission?.isGraded ?? false) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.grade,
                  color: Colors.green[600],
                  size: 16,
                ),
                const SizedBox(width: 8),
                Text(
                  'Điểm: ${_currentSubmission!.score}/${widget.assignment.maxScore}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.green[700],
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSubmissionForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Nội dung bài làm',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF374151),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _submissionController,
          maxLines: 8,
          decoration: InputDecoration(
            hintText: 'Nhập nội dung bài làm của bạn...',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF667eea)),
            ),
            filled: true,
            fillColor: Colors.grey[50],
          ),
        ),

        const SizedBox(height: 16),

        // File attachment
        const Text(
          'Đính kèm file (tùy chọn)',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF374151),
          ),
        ),
        const SizedBox(height: 8),
        
        if (_selectedFile != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.attach_file,
                  color: Colors.blue[700],
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _selectedFile!.path.split('/').last,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.blue[800],
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () {
                    setState(() {
                      _selectedFile = null;
                    });
                  },
                  icon: Icon(
                    Icons.close,
                    color: Colors.blue[700],
                    size: 20,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        OutlinedButton.icon(
          onPressed: _pickFile,
          icon: const Icon(Icons.attach_file),
          label: Text(_selectedFile == null ? 'Chọn file' : 'Thay đổi file'),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF667eea),
            side: const BorderSide(color: Color(0xFF667eea)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          ),
        ),

        const SizedBox(height: 24),

        // Submit button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isSubmitting ? null : _submitAssignment,
            icon: _isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Icon(Icons.send),
            label: Text(_isSubmitting ? 'Đang nộp...' : 'Nộp bài tập'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF667eea),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(vertical: 16),
              textStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOverdueMessage() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red[200]!),
      ),
      child: Row(
        children: [
          Icon(
            Icons.warning,
            color: Colors.red[700],
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Đã quá hạn nộp bài',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.red[800],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Bài tập này đã quá hạn nộp. Vui lòng liên hệ giảng viên nếu cần thiết.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.red[700],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubmittedContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Nội dung đã nộp',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF374151),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Text(
            _currentSubmission?.submissionText ?? 'Không có nội dung',
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF374151),
              height: 1.5,
            ),
          ),
        ),

        if (_currentSubmission?.attachmentPath != null) ...[
          const SizedBox(height: 16),
          const Text(
            'File đã nộp',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.attach_file,
                  color: Colors.blue[700],
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _currentSubmission!.attachmentPath!.split('/').last,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.blue[800],
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => _downloadSubmissionFile(_currentSubmission!.attachmentPath!),
                  icon: Icon(
                    Icons.download,
                    color: Colors.blue[700],
                    size: 20,
                  ),
                  tooltip: 'Tải xuống',
                ),
              ],
            ),
          ),
        ],

        if (_currentSubmission?.isGraded ?? false) ...[
          const SizedBox(height: 16),
          _buildGradingInfo(),
        ],
      ],
    );
  }

  Widget _buildGradingInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.grade,
                color: Colors.green[700],
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Kết quả chấm điểm',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.green[800],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                'Điểm số: ',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.green[700],
                ),
              ),
              Text(
                '${_currentSubmission!.score}/${widget.assignment.maxScore}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.green[800],
                ),
              ),
            ],
          ),
          if (_currentSubmission?.feedback != "") ...[
            const SizedBox(height: 12),
            Text(
              'Nhận xét:',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.green[700],
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _currentSubmission!.feedback!,
              style: TextStyle(
                fontSize: 14,
                color: Colors.green[700],
                height: 1.4,
              ),
            ),
          ],
        ],
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

  String _formatDate(DateTime date) {
    final vnDate = date.toUtc().add(const Duration(hours: 7));
    final months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    final weekdays = [
      'Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'
    ];
    return '${weekdays[vnDate.weekday % 7]}, ${vnDate.day} ${months[vnDate.month - 1]} ${vnDate.year}';
  }

  String _formatTime(DateTime time) {
    final vnTime = time.toUtc().add(const Duration(hours: 7));
    return '${vnTime.hour.toString().padLeft(2, '0')}:${vnTime.minute.toString().padLeft(2, '0')}';
  }

  String _formatDateTime(DateTime dateTime) {
    return '${_formatDate(dateTime)} ${_formatTime(dateTime)}';
  }

  Future<void> _pickFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.any,
        allowMultiple: false,
      );

      if (result != null) {
        setState(() {
          _selectedFile = File(result.files.single.path!);
        });
      }
    } catch (e) {
      _logger.e('Error picking file: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Có lỗi khi chọn file'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _submitAssignment() async {
    if (_submissionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập nội dung bài làm'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final response = await ApiService().submitAssignment(
        assignmentId: widget.assignment.id,
        studentId: widget.userId,
        submissionText: _submissionController.text.trim(),
        attachmentFile: _selectedFile,
      );

      if (response.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Nộp bài tập thành công!'),
            backgroundColor: Colors.green,
          ),
        );

        // Refresh submission data
        final submissionResponse = await ApiService().getAssignmentSubmission(
          widget.assignment.id,
          widget.userId,
        );

        if (submissionResponse.success) {
          setState(() {
            _currentSubmission = submissionResponse.data;
          });
        }

        Navigator.of(context).pop(true); // Return true to indicate success
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: ${response.message}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      _logger.e('Error submitting assignment: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Có lỗi xảy ra khi nộp bài tập'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  Future<void> _downloadAttachment() async {
    // TODO: Implement download functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Tính năng tải xuống đang được phát triển'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  Future<void> _downloadSubmissionFile(String filePath) async {
    // TODO: Implement download functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Tính năng tải xuống đang được phát triển'),
        backgroundColor: Colors.blue,
      ),
    );
  }
}