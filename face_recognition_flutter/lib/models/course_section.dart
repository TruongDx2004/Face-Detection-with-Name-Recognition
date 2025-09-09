import 'user.dart';
import 'subject.dart';
import 'attendance_models.dart';

/// Model for CourseSection (lớp học phần)
class CourseSection {
  final int id;
  final String name;
  final String code;
  final int classId;
  final int subjectId;
  final int teacherId;
  final String semester;
  final String academicYear;
  final int? maxStudents;
  final String? description;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  // Related data from joins
  final String? className;
  final String? subjectName;
  final String? subjectCode;
  final int? credits;
  final String? teacherName;
  final int? studentCount;
  
  // For detailed views
  final List<User>? students;
  final List<Schedule>? schedules;
  final List<AttendanceSession>? attendanceSessions;

  CourseSection({
    required this.id,
    required this.name,
    required this.code,
    required this.classId,
    required this.subjectId,
    required this.teacherId,
    required this.semester,
    required this.academicYear,
    this.maxStudents,
    this.description,
    required this.isActive,
    required this.createdAt,
    this.updatedAt,
    this.className,
    this.subjectName,
    this.subjectCode,
    this.credits,
    this.teacherName,
    this.studentCount,
    this.students,
    this.schedules,
    this.attendanceSessions,
  });

  factory CourseSection.fromJson(Map<String, dynamic> json) {
    return CourseSection(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      classId: json['class_id'] ?? 0,
      subjectId: json['subject_id'] ?? 0,
      teacherId: json['teacher_id'] ?? 0,
      semester: json['semester'] ?? '',
      academicYear: json['academic_year'] ?? '',
      maxStudents: json['max_students'] != null ? int.tryParse(json['max_students'].toString()) : null,
      description: json['description'] as String?,
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.tryParse(json['updated_at'] as String)
          : null,
      className: json['class_name'] as String?,
      subjectName: json['subject_name'] as String?,
      subjectCode: json['subject_code'] as String?,
      credits: json['credits'] != null ? int.tryParse(json['credits'].toString()) : null,
      teacherName: json['teacher_name'] as String?,
      studentCount: json['student_count'] != null ? int.tryParse(json['student_count'].toString()) : null,
      students: json['students'] != null 
          ? (json['students'] as List).map((s) => User.fromJson(s)).toList()
          : null,
      schedules: json['schedules'] != null 
          ? (json['schedules'] as List).map((s) => Schedule.fromJson(s)).toList()
          : null,
      attendanceSessions: json['attendance_sessions'] != null 
          ? (json['attendance_sessions'] as List).map((s) => AttendanceSession.fromJson(s)).toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
      'class_id': classId,
      'subject_id': subjectId,
      'teacher_id': teacherId,
      'semester': semester,
      'academic_year': academicYear,
      'max_students': maxStudents,
      'description': description,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'class_name': className,
      'subject_name': subjectName,
      'subject_code': subjectCode,
      'credits': credits,
      'teacher_name': teacherName,
      'student_count': studentCount,
      'students': students?.map((s) => s.toJson()).toList(),
      'schedules': schedules?.map((sc) => sc.toJson()).toList(),
      'attendance_sessions': attendanceSessions?.map((s) => s.toJson()).toList(),
    };
  }

  CourseSection copyWith({
    int? id,
    String? name,
    String? code,
    int? classId,
    int? subjectId,
    int? teacherId,
    String? semester,
    String? academicYear,
    int? maxStudents,
    String? description,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? className,
    String? subjectName,
    String? subjectCode,
    int? credits,
    String? teacherName,
    int? studentCount,
    List<User>? students,
    List<Schedule>? schedules,
    List<AttendanceSession>? attendanceSessions,
  }) {
    return CourseSection(
      id: id ?? this.id,
      name: name ?? this.name,
      code: code ?? this.code,
      classId: classId ?? this.classId,
      subjectId: subjectId ?? this.subjectId,
      teacherId: teacherId ?? this.teacherId,
      semester: semester ?? this.semester,
      academicYear: academicYear ?? this.academicYear,
      maxStudents: maxStudents ?? this.maxStudents,
      description: description ?? this.description,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      className: className ?? this.className,
      subjectName: subjectName ?? this.subjectName,
      subjectCode: subjectCode ?? this.subjectCode,
      credits: credits ?? this.credits,
      teacherName: teacherName ?? this.teacherName,
      studentCount: studentCount ?? this.studentCount,
      students: students ?? this.students,
      schedules: schedules ?? this.schedules,
      attendanceSessions: attendanceSessions ?? this.attendanceSessions,
    );
  }
}