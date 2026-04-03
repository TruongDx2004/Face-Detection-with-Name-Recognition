class StudentGrade {
  final int id;
  final int studentId;
  final int courseSectionId;
  final String courseSectionName;
  final String subjectName;
  final String semester;
  final String academicYear;
  final double? assignmentAvg;
  final double? examAvg;
  final double? attendanceScore;
  final double? finalScore;
  final String? letterGrade;
  final double? gpaPoints;
  final bool isPassed;
  final DateTime? calculatedAt;

  StudentGrade({
    required this.id,
    required this.studentId,
    required this.courseSectionId,
    required this.courseSectionName,
    required this.subjectName,
    required this.semester,
    required this.academicYear,
    this.assignmentAvg,
    this.examAvg,
    this.attendanceScore,
    this.finalScore,
    this.letterGrade,
    this.gpaPoints,
    required this.isPassed,
    this.calculatedAt,
  });

  factory StudentGrade.fromJson(Map<String, dynamic> json) {
    return StudentGrade(
      id: json['id'] ?? 0,
      studentId: json['student_id'] ?? 0,
      courseSectionId: json['course_section_id'] ?? 0,
      courseSectionName: json['course_section_name'] ?? '',
      subjectName: json['subject_name'] ?? '',
      semester: json['semester'] ?? '',
      academicYear: json['academic_year'] ?? '',
      assignmentAvg: json['assignment_avg'] != null
          ? double.tryParse(json['assignment_avg'].toString())
          : null,
      examAvg: json['exam_avg'] != null
          ? double.tryParse(json['exam_avg'].toString())
          : null,
      attendanceScore: json['attendance_score'] != null
          ? double.tryParse(json['attendance_score'].toString())
          : null,
      finalScore: json['final_score'] != null
          ? double.tryParse(json['final_score'].toString())
          : null,
      letterGrade: json['letter_grade']?.toString(),
      gpaPoints: json['gpa_points'] != null
          ? double.tryParse(json['gpa_points'].toString())
          : null,
      isPassed: json['is_passed'] == 1 ||
          json['is_passed'] == true ||
          json['is_passed'] == '1',
      calculatedAt: json['calculated_at'] != null
          ? DateTime.tryParse(json['calculated_at'].toString())
          : null,
    );
  }
}

class AssignmentGrade {
  final int id;
  final int assignmentId;
  final String assignmentTitle;
  final double? score;
  final double maxScore;
  final String status;
  final DateTime? submittedAt;
  final DateTime? gradedAt;
  final String? feedback;

  AssignmentGrade({
    required this.id,
    required this.assignmentId,
    required this.assignmentTitle,
    this.score,
    required this.maxScore,
    required this.status,
    this.submittedAt,
    this.gradedAt,
    this.feedback,
  });

  factory AssignmentGrade.fromJson(Map<String, dynamic> json) {
    return AssignmentGrade(
      id: json['id'] ?? 0,
      assignmentId: json['assignment_id'] ?? 0,
      assignmentTitle: json['assignment_title'] ?? '',
      score: json['score'] != null
          ? double.tryParse(json['score'].toString())
          : null,
      maxScore: double.tryParse(json['max_score']?.toString() ?? '0') ?? 0.0,
      status: json['status'] ?? 'not_submitted',
      submittedAt: json['submitted_at'] != null
          ? DateTime.parse(json['submitted_at'])
          : null,
      gradedAt:
          json['graded_at'] != null ? DateTime.parse(json['graded_at']) : null,
      feedback: json['feedback'],
    );
  }
}

class ExamGrade {
  final int id;
  final int examId;
  final String examTitle;
  final double? score;
  final double maxScore;
  final String status;
  final DateTime? completedAt;
  final DateTime? gradedAt;

  ExamGrade({
    required this.id,
    required this.examId,
    required this.examTitle,
    this.score,
    required this.maxScore,
    required this.status,
    this.completedAt,
    this.gradedAt,
  });

  factory ExamGrade.fromJson(Map<String, dynamic> json) {
    return ExamGrade(
      id: json['id'] ?? 0,
      examId: json['exam_id'] ?? 0,
      examTitle: json['exam_title'] ?? '',
      score: json['score'] != null
          ? double.tryParse(json['score'].toString())
          : null,
      maxScore: double.tryParse(json['max_score']?.toString() ?? '0') ?? 0.0,
      status: json['status'] ?? 'not_started',
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'])
          : null,
      gradedAt:
          json['graded_at'] != null ? DateTime.parse(json['graded_at']) : null,
    );
  }
}

class SemesterSummary {
  final String semester;
  final String academicYear;
  final int totalCredits;
  final double averageGpa;
  final int totalSubjects;
  final int passedSubjects;
  final List<StudentGrade> grades;

  SemesterSummary({
    required this.semester,
    required this.academicYear,
    required this.totalCredits,
    required this.averageGpa,
    required this.totalSubjects,
    required this.passedSubjects,
    required this.grades,
  });

  factory SemesterSummary.fromJson(Map<String, dynamic> json) {
    return SemesterSummary(
      semester: json['semester']?.toString() ?? '',
      academicYear: json['academic_year']?.toString() ?? '',
      totalCredits: json['total_credits'] != null
          ? int.tryParse(json['total_credits'].toString()) ?? 0
          : 0,
      averageGpa: json['average_gpa'] != null
          ? double.tryParse(json['average_gpa'].toString()) ?? 0.0
          : 0.0,
      totalSubjects: json['total_subjects'] != null
          ? int.tryParse(json['total_subjects'].toString()) ?? 0
          : 0,
      passedSubjects: json['passed_subjects'] != null
          ? int.tryParse(json['passed_subjects'].toString()) ?? 0
          : 0,
      grades: (json['grades'] as List? ?? [])
          .map((g) => StudentGrade.fromJson(g as Map<String, dynamic>))
          .toList(),
    );
  }
}

class GpaOverall {
  final double cumulativeGpa;
  final int totalCredits;
  final int totalSemesters;
  final double averageScore;
  final String classification;

  GpaOverall({
    required this.cumulativeGpa,
    required this.totalCredits,
    required this.totalSemesters,
    required this.averageScore,
    required this.classification,
  });

  factory GpaOverall.fromJson(Map<String, dynamic> json) {
    return GpaOverall(
      cumulativeGpa: json['cumulative_gpa'] != null
          ? double.tryParse(json['cumulative_gpa'].toString()) ?? 0.0
          : 0.0,
      totalCredits: json['total_credits'] != null
          ? int.tryParse(json['total_credits'].toString()) ?? 0
          : 0,
      totalSemesters: json['total_semesters'] != null
          ? int.tryParse(json['total_semesters'].toString()) ?? 0
          : 0,
      averageScore: json['average_score'] != null
          ? double.tryParse(json['average_score'].toString()) ?? 0.0
          : 0.0,
      classification: json['classification']?.toString() ?? 'Chưa xác định',
    );
  }
}

class CourseSectionGradeDetail {
  final StudentGrade overallGrade;
  final List<AssignmentGrade> assignments;
  final List<ExamGrade> exams;
  final Map<String, dynamic> gradeConfiguration;

  CourseSectionGradeDetail({
    required this.overallGrade,
    required this.assignments,
    required this.exams,
    required this.gradeConfiguration,
  });

  factory CourseSectionGradeDetail.fromJson(Map<String, dynamic> json) {
    return CourseSectionGradeDetail(
      overallGrade: StudentGrade.fromJson(
          (json['overall_grade'] as Map<String, dynamic>?) ?? {}),
      assignments: (json['assignments'] as List? ?? [])
          .map((a) => AssignmentGrade.fromJson(a as Map<String, dynamic>))
          .toList(),
      exams: (json['exams'] as List? ?? [])
          .map((e) => ExamGrade.fromJson(e as Map<String, dynamic>))
          .toList(),
      gradeConfiguration:
          (json['grade_configuration'] as Map<String, dynamic>?) ?? {},
    );
  }
}
