// lib/models/assignment_models.dart

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
      dueDate: DateTime.parse(json['due_date'] ?? DateTime.now().toIso8601String()),
      createdDate: DateTime.parse(json['created_date'] ?? DateTime.now().toIso8601String()),
      isActive: (json['is_active'] as int) == 1,
      instructions: json['instructions'],
      attachmentPath: json['attachment_path'],
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
      score: json['score']?.toDouble(),
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
      maxScore: (json['max_score'] ?? 0).toDouble(),
      startTime: DateTime.parse(json['start_time'] ?? DateTime.now().toIso8601String()),
      endTime: DateTime.parse(json['end_time'] ?? DateTime.now().toIso8601String()),
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
      startedAt: DateTime.parse(json['started_at'] ?? DateTime.now().toIso8601String()),
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
  final DateTime startTime;
  final DateTime endTime;
  final int duration; // in minutes
  final int totalScore;
  final int courseSectionId;
  final int teacherId;
  final List<ExamQuestion> questions;
  final DateTime createdAt;
  final DateTime updatedAt;

  Exam({
    required this.id,
    required this.title,
    required this.description,
    required this.startTime,
    required this.endTime,
    required this.duration,
    required this.totalScore,
    required this.courseSectionId,
    required this.teacherId,
    required this.questions,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Exam.fromJson(Map<String, dynamic> json) {
    return Exam(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      startTime: DateTime.parse(json['start_time']),
      endTime: DateTime.parse(json['end_time']),
      duration: json['duration'] ?? 0,
      totalScore: json['total_score'] ?? 0,
      courseSectionId: json['course_section_id'] ?? 0,
      teacherId: json['teacher_id'] ?? 0,
      questions: (json['questions'] as List?)
              ?.map((q) => ExamQuestion.fromJson(q))
              .toList() ??
          [],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'start_time': startTime.toIso8601String(),
      'end_time': endTime.toIso8601String(),
      'duration': duration,
      'total_score': totalScore,
      'course_section_id': courseSectionId,
      'teacher_id': teacherId,
      'questions': questions.map((q) => q.toJson()).toList(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
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
  final int points;
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
    return ExamQuestion(
      id: json['id'] ?? 0,
      examId: json['exam_id'] ?? 0,
      questionText: json['question_text'] ?? '',
      questionType: json['question_type'] ?? 'multiple_choice',
      options: List<String>.from(json['options'] ?? []),
      correctAnswer: json['correct_answer'],
      points: json['points'] ?? 0,
      orderIndex: json['order_index'] ?? 0,
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
  final int totalScore;
  final DateTime? startTime;
  final DateTime? endTime;
  final bool isCompleted;
  final List<ExamAnswer> answers;

  ExamResult({
    required this.id,
    required this.examId,
    required this.studentId,
    this.score,
    required this.totalScore,
    this.startTime,
    this.endTime,
    required this.isCompleted,
    required this.answers,
  });

  factory ExamResult.fromJson(Map<String, dynamic> json) {
    return ExamResult(
      id: json['id'] ?? 0,
      examId: json['exam_id'] ?? 0,
      studentId: json['student_id'] ?? 0,
      score: json['score']?.toDouble(),
      totalScore: json['total_score'] ?? 0,
      startTime: json['start_time'] != null 
          ? DateTime.parse(json['start_time']) 
          : null,
      endTime: json['end_time'] != null 
          ? DateTime.parse(json['end_time']) 
          : null,
      isCompleted: json['is_completed'] ?? false,
      answers: (json['answers'] as List?)
              ?.map((a) => ExamAnswer.fromJson(a))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'exam_id': examId,
      'student_id': studentId,
      'score': score,
      'total_score': totalScore,
      'start_time': startTime?.toIso8601String(),
      'end_time': endTime?.toIso8601String(),
      'is_completed': isCompleted,
      'answers': answers.map((a) => a.toJson()).toList(),
    };
  }
}

class ExamAnswer {
  final int id;
  final int examResultId;
  final int questionId;
  final String answer;
  final bool isCorrect;
  final int pointsEarned;

  ExamAnswer({
    required this.id,
    required this.examResultId,
    required this.questionId,
    required this.answer,
    required this.isCorrect,
    required this.pointsEarned,
  });

  factory ExamAnswer.fromJson(Map<String, dynamic> json) {
    return ExamAnswer(
      id: json['id'] ?? 0,
      examResultId: json['exam_result_id'] ?? 0,
      questionId: json['question_id'] ?? 0,
      answer: json['answer'] ?? '',
      isCorrect: json['is_correct'] ?? false,
      pointsEarned: json['points_earned'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'exam_result_id': examResultId,
      'question_id': questionId,
      'answer': answer,
      'is_correct': isCorrect,
      'points_earned': pointsEarned,
    };
  }
}