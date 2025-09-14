// lib/models/assignment_models.dart
import 'dart:convert';

class Assignment {
  final int id;
  final int courseSectionId;
  final String title;
  final String? description;
  final String assignmentType;
  final double maxScore;
  final DateTime dueDate;
  final DateTime createdDate;
  final bool isActive;
  final String? instructions;
  final String? attachmentPath;
  final String? courseName;
  final String? subjectName;
  final String? className;
  final int? submissionCount;
  final int? gradedCount;

  Assignment({
    required this.id,
    required this.courseSectionId,
    required this.title,
    this.description,
    required this.assignmentType,
    required this.maxScore,
    required this.dueDate,
    required this.createdDate,
    required this.isActive,
    this.instructions,
    this.attachmentPath,
    this.courseName,
    this.subjectName,
    this.className,
    this.submissionCount,
    this.gradedCount,
  });

  factory Assignment.fromJson(Map<String, dynamic> json) {
    return Assignment(
      id: json['id'] ?? 0,
      courseSectionId: json['course_section_id'] ?? 0,
      title: json['title'] ?? '',
      description: json['description'],
      assignmentType: json['assignment_type'] ?? 'homework',
      maxScore: json['max_score'] is String
          ? double.parse(json['max_score'])
          : (json['max_score'] as num).toDouble(),
      dueDate:
          DateTime.parse(json['due_date'] ?? DateTime.now().toIso8601String()),
      createdDate: DateTime.parse(
          json['created_date'] ?? DateTime.now().toIso8601String()),
      isActive: (json['is_active'] as int) == 1,
      instructions: json['instructions'],
      attachmentPath: json['attachment_path'] as String?,
      courseName: json['course_name'],
      subjectName: json['subject_name'],
      className: json['class_name'],
      submissionCount: json['submission_count'],
      gradedCount: json['graded_count'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'course_section_id': courseSectionId,
      'title': title,
      'description': description,
      'assignment_type': assignmentType,
      'max_score': maxScore,
      'due_date': dueDate.toIso8601String(),
      'created_date': createdDate.toIso8601String(),
      'is_active': isActive,
      'instructions': instructions,
      'attachment_path': attachmentPath,
      'course_name': courseName,
      'subject_name': subjectName,
      'class_name': className,
      'submission_count': submissionCount,
      'graded_count': gradedCount,
    };
  }

  String get assignmentTypeDisplay {
    switch (assignmentType) {
      case 'homework':
        return 'Bài tập về nhà';
      case 'project':
        return 'Dự án';
      case 'lab':
        return 'Thí nghiệm';
      case 'essay':
        return 'Tiểu luận';
      default:
        return 'Bài tập';
    }
  }

  bool get isOverdue {
    return DateTime.now().isAfter(dueDate);
  }

  bool get isDueSoon {
    final now = DateTime.now();
    final difference = dueDate.difference(now);
    return difference.inDays <= 3 && difference.inDays >= 0;
  }
}

class AssignmentSubmission {
  final int id;
  final int assignmentId;
  final int studentId;
  final DateTime? submittedAt;
  final double? score;
  final String status;
  final String? feedback;
  final String? submissionText;
  final String? attachmentPath;
  final String? studentName;
  final String? studentCode;

  AssignmentSubmission({
    required this.id,
    required this.assignmentId,
    required this.studentId,
    this.submittedAt,
    this.score,
    required this.status,
    this.feedback,
    this.submissionText,
    this.attachmentPath,
    this.studentName,
    this.studentCode,
  });

  factory AssignmentSubmission.fromJson(Map<String, dynamic> json) {
    return AssignmentSubmission(
      id: json['id'] ?? 0,
      assignmentId: json['assignment_id'] ?? 0,
      studentId: json['student_id'] ?? 0,
      submittedAt: json['submitted_at'] != null
          ? DateTime.parse(json['submitted_at'])
          : null,
      score: double.tryParse(json['score'].toString()),
      status: json['status'] ?? 'pending',
      feedback: json['feedback'],
      submissionText: json['submission_text'],
      attachmentPath: json['attachment_path'],
      studentName: json['student_name'],
      studentCode: json['student_code'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'assignment_id': assignmentId,
      'student_id': studentId,
      'submitted_at': submittedAt?.toIso8601String(),
      'score': score,
      'status': status,
      'feedback': feedback,
      'submission_text': submissionText,
      'attachment_path': attachmentPath,
      'student_name': studentName,
      'student_code': studentCode,
    };
  }

  String get statusDisplay {
    switch (status) {
      case 'submitted':
        return 'Đã nộp';
      case 'graded':
        return 'Đã chấm điểm';
      case 'late':
        return 'Nộp muộn';
      case 'pending':
      default:
        return 'Chưa nộp';
    }
  }

  bool get isSubmitted {
    return status == 'submitted' || status == 'graded' || status == 'late';
  }

  bool get isGraded {
    return status == 'graded';
  }
}

class Quiz {
  final int id;
  final int courseSectionId;
  final String title;
  final String? description;
  final int timeLimit; // in minutes
  final int questionCount;
  final double maxScore;
  final DateTime startTime;
  final DateTime endTime;
  final bool isActive;
  final String? courseName;
  final String? subjectName;

  Quiz({
    required this.id,
    required this.courseSectionId,
    required this.title,
    this.description,
    required this.timeLimit,
    required this.questionCount,
    required this.maxScore,
    required this.startTime,
    required this.endTime,
    required this.isActive,
    this.courseName,
    this.subjectName,
  });

  factory Quiz.fromJson(Map<String, dynamic> json) {
    return Quiz(
      id: json['id'] ?? 0,
      courseSectionId: json['course_section_id'] ?? 0,
      title: json['title'] ?? '',
      description: json['description'],
      timeLimit: json['time_limit'] ?? 60,
      questionCount: json['question_count'] ?? 0,
      maxScore: json['max_score'] == null
          ? 0.0
          : double.tryParse(json['max_score'].toString()) ?? 0.0,
      startTime: DateTime.parse(
          json['start_time'] ?? DateTime.now().toIso8601String()),
      endTime:
          DateTime.parse(json['end_time'] ?? DateTime.now().toIso8601String()),
      isActive: json['is_active'] ?? true,
      courseName: json['course_name'],
      subjectName: json['subject_name'],
    );
  }

  bool get isAvailable {
    final now = DateTime.now();
    return now.isAfter(startTime) && now.isBefore(endTime) && isActive;
  }

  bool get isUpcoming {
    return DateTime.now().isBefore(startTime);
  }

  bool get isExpired {
    return DateTime.now().isAfter(endTime);
  }
}

class QuizAttempt {
  final int id;
  final int quizId;
  final int studentId;
  final DateTime startedAt;
  final DateTime? completedAt;
  final double? score;
  final String status;
  final Map<String, dynamic>? answers;

  QuizAttempt({
    required this.id,
    required this.quizId,
    required this.studentId,
    required this.startedAt,
    this.completedAt,
    this.score,
    required this.status,
    this.answers,
  });

  factory QuizAttempt.fromJson(Map<String, dynamic> json) {
    return QuizAttempt(
      id: json['id'] ?? 0,
      quizId: json['quiz_id'] ?? 0,
      studentId: json['student_id'] ?? 0,
      startedAt: DateTime.parse(
          json['started_at'] ?? DateTime.now().toIso8601String()),
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'])
          : null,
      score: json['score']?.toDouble(),
      status: json['status'] ?? 'in_progress',
      answers: json['answers'],
    );
  }

  bool get isCompleted {
    return status == 'completed';
  }

  bool get isInProgress {
    return status == 'in_progress';
  }
}

// ============ EXAM MODELS ============

class Exam {
  final int id;
  final String title;
  final String description;
  final String examType;
  final DateTime startTime;
  final DateTime endTime;
  final int duration; // in minutes
  final double totalScore;
  final int courseSectionId;
  final String? instructions;
  final bool isActive;
  final List<ExamQuestion> questions;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Exam({
    required this.id,
    required this.title,
    required this.description,
    required this.examType,
    required this.startTime,
    required this.endTime,
    required this.duration,
    required this.totalScore,
    required this.courseSectionId,
    this.instructions,
    required this.isActive,
    required this.questions,
    this.createdAt,
    this.updatedAt,
  });

  factory Exam.fromJson(Map<String, dynamic> json) {
    DateTime parseDateTime(String? dateStr, String? timeStr) {
      if (dateStr == null) return DateTime.now();

      // Parse chuẩn ISO 8601 từ backend
      final baseDate = DateTime.tryParse(dateStr) ?? DateTime.now();

      if (timeStr == null) return baseDate;

      final timeParts = timeStr.split(':');
      final hour = int.tryParse(timeParts[0]) ?? 0;
      final minute = int.tryParse(timeParts[1]) ?? 0;
      final second = timeParts.length > 2 ? int.tryParse(timeParts[2]) ?? 0 : 0;

      return DateTime(
        baseDate.year,
        baseDate.month,
        baseDate.day,
        hour,
        minute,
        second,
      );
    }

    return Exam(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      examType: json['exam_type'] ?? 'quiz',
      startTime: parseDateTime(json['exam_date'], json['start_time']),
      endTime: parseDateTime(json['exam_date'], json['end_time']),
      duration: int.tryParse(json['duration_minutes'].toString()) ?? 0,
      totalScore: json['max_score'] == null
          ? 0.0
          : double.tryParse(json['max_score'].toString()) ?? 0.0,
      courseSectionId: json['course_section_id'] ?? 0,
      instructions: json['instructions'],
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      questions: (json['questions'] as List?)
              ?.map((q) => ExamQuestion.fromJson(q))
              .toList() ??
          [],
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'exam_type': examType,
      'exam_date':
          '${startTime.year}-${startTime.month.toString().padLeft(2, '0')}-${startTime.day.toString().padLeft(2, '0')}',
      'start_time':
          '${startTime.hour.toString().padLeft(2, '0')}:${startTime.minute.toString().padLeft(2, '0')}:00',
      'end_time':
          '${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')}:00',
      'duration_minutes': duration,
      'max_score': totalScore,
      'course_section_id': courseSectionId,
      'instructions': instructions,
      'is_active': isActive,
      'questions': questions.map((q) => q.toJson()).toList(),
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}

class ExamQuestion {
  final int id;
  final int examId;
  final String questionText;
  final String questionType; // 'multiple_choice', 'true_false', 'essay'
  final List<String> options;
  final String? correctAnswer;
  final double points;
  final int orderIndex;

  ExamQuestion({
    required this.id,
    required this.examId,
    required this.questionText,
    required this.questionType,
    required this.options,
    this.correctAnswer,
    required this.points,
    required this.orderIndex,
  });

  factory ExamQuestion.fromJson(Map<String, dynamic> json) {
    // Parse options - có thể là string JSON hoặc array
    List<String> parseOptions(dynamic optionsData) {
      if (optionsData == null) return [];
      if (optionsData is List) {
        return optionsData.map((e) => e.toString()).toList();
      }
      if (optionsData is String) {
        try {
          // Thử parse JSON string
          final List<dynamic> parsed = jsonDecode(optionsData);
          return parsed.map((e) => e.toString()).toList();
        } catch (e) {
          // Nếu không parse được, return empty list
          return [];
        }
      }
      return [];
    }

    return ExamQuestion(
      id: json['id'] ?? 0,
      examId: json['exam_id'] ?? 0,
      questionText: json['question_text'] ?? '',
      questionType: json['question_type'] ?? 'multiple_choice',
      options: parseOptions(json['options']),
      correctAnswer: json['correct_answer'],
      points: double.tryParse(json['points'].toString()) ?? 0.0,
      orderIndex: json['question_order'] ?? json['order_index'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'exam_id': examId,
      'question_text': questionText,
      'question_type': questionType,
      'options': options,
      'correct_answer': correctAnswer,
      'points': points,
      'order_index': orderIndex,
    };
  }
}

class ExamResult {
  final int id;
  final int examId;
  final int studentId;
  final double? score;
  final double? totalScore;
  final String status; // 'in_progress', 'completed', 'graded'
  final DateTime? startTime;
  final DateTime? endTime;
  final DateTime? submittedAt;
  final DateTime? gradedAt;
  final int? gradedBy;
  final List<ExamAnswer> answers;
  final Exam? exam; // Thêm field exam

  ExamResult({
    required this.id,
    required this.examId,
    required this.studentId,
    this.score,
    required this.totalScore,
    required this.status,
    this.startTime,
    this.endTime,
    this.submittedAt,
    this.gradedAt,
    this.gradedBy,
    required this.answers,
    this.exam, // Thêm field exam
  });

  // Convenience getters
  bool get isCompleted => status == 'completed' || status == 'graded';
  bool get isGraded => status == 'graded';
  bool get isInProgress => status == 'in_progress';

  factory ExamResult.fromJson(Map<String, dynamic> json) {
    return ExamResult(
      id: json['id'] ?? 0,
      examId: json['exam_id'] ?? 0,
      studentId: json['student_id'] ?? 0,
      score: double.tryParse(json['score'].toString()),
      totalScore: double.tryParse(json['total_score'].toString()) ?? 0,
      status: json['status'] ?? 'in_progress',
      startTime: json['start_time'] != null
          ? DateTime.parse(json['start_time'])
          : null,
      endTime:
          json['end_time'] != null ? DateTime.parse(json['end_time']) : null,
      submittedAt: json['submitted_at'] != null
          ? DateTime.parse(json['submitted_at'])
          : null,
      gradedAt:
          json['graded_at'] != null ? DateTime.parse(json['graded_at']) : null,
      gradedBy: json['graded_by'],
      answers: (json['answers'] as List?)
              ?.map((a) => ExamAnswer.fromJson(a))
              .toList() ??
          [],
      exam: json['exam'] != null
          ? Exam.fromJson(json['exam'])
          : null, // Thêm field exam
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'exam_id': examId,
      'student_id': studentId,
      'score': score,
      'total_score': totalScore,
      'status': status,
      'start_time': startTime?.toIso8601String(),
      'end_time': endTime?.toIso8601String(),
      'submitted_at': submittedAt?.toIso8601String(),
      'graded_at': gradedAt?.toIso8601String(),
      'graded_by': gradedBy,
      'answers': answers.map((a) => a.toJson()).toList(),
      'exam': exam?.toJson(), // Thêm field exam
    };
  }
}

class ExamAnswer {
  final int id;
  final int examResultId;
  final int questionId;
  final String? studentAnswer;
  final bool? isCorrect;
  final double pointsEarned;

  ExamAnswer({
    required this.id,
    required this.examResultId,
    required this.questionId,
    this.studentAnswer,
    this.isCorrect,
    required this.pointsEarned,
  });

  // Convenience getter for compatibility
  String? get answer => studentAnswer;

  factory ExamAnswer.fromJson(Map<String, dynamic> json) {
    return ExamAnswer(
      id: json['id'] ?? 0,
      examResultId: json['exam_result_id'] ?? 0,
      questionId: json['question_id'] ?? 0,
      studentAnswer: json['student_answer'] ?? json['answer'],
      isCorrect: json['is_correct'] == null
          ? null
          : (json['is_correct'] == 1 || json['is_correct'] == true),
      pointsEarned: double.tryParse(json['points_earned'].toString()) ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'exam_result_id': examResultId,
      'question_id': questionId,
      'student_answer': studentAnswer,
      'is_correct': isCorrect,
      'points_earned': pointsEarned,
    };
  }
}
