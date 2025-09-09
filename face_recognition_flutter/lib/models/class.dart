import 'user.dart';

class ClassData {
  final int id;
  final String name;
  final String? description;
  final int? teacherId;
  final String? teacherName;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final int studentCount;
  
  // Additional fields for detailed views
  final List<User>? students;
  final String? code; // Some classes might have codes

  ClassData({
    required this.id,
    required this.name,
    this.description,
    this.teacherId,
    this.teacherName,
    required this.isActive,
    required this.createdAt,
    this.updatedAt,
    required this.studentCount,
    this.students,
    this.code,
  });

  factory ClassData.fromJson(Map<String, dynamic> json) {
    return ClassData(
      id: int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] ?? '',
      description: json['description'] as String?,
      teacherId: json['teacher_id'] != null ? int.tryParse(json['teacher_id'].toString()) : null,
      teacherName: json['teacher_name'] as String?,
      isActive: json['is_active'] == 1 || json['is_active'] == true || json['status'] == true,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.tryParse(json['updated_at'] as String)
          : null,
      studentCount: int.tryParse(json['student_count'].toString()) ?? 0,
      students: json['students'] != null 
          ? (json['students'] as List).map((s) => User.fromJson(s)).toList()
          : null,
      code: json['code'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'teacher_id': teacherId,
      'teacher_name': teacherName,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'student_count': studentCount,
      'students': students?.map((s) => s.toJson()).toList(),
      'code': code,
    };
  }

  ClassData copyWith({
    int? id,
    String? name,
    String? description,
    int? teacherId,
    String? teacherName,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? studentCount,
    List<User>? students,
    String? code,
  }) {
    return ClassData(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      teacherId: teacherId ?? this.teacherId,
      teacherName: teacherName ?? this.teacherName,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      studentCount: studentCount ?? this.studentCount,
      students: students ?? this.students,
      code: code ?? this.code,
    );
  }
}

/// Model for class-student relationship
class ClassStudent {
  final int id;
  final int classId;
  final int studentId;
  final String studentCode;
  final DateTime createdAt;
  
  // Related data
  final String? studentName;
  final String? className;
  final User? student;

  ClassStudent({
    required this.id,
    required this.classId,
    required this.studentId,
    required this.studentCode,
    required this.createdAt,
    this.studentName,
    this.className,
    this.student,
  });

  factory ClassStudent.fromJson(Map<String, dynamic> json) {
    return ClassStudent(
      id: json['id'] ?? 0,
      classId: json['class_id'] ?? 0,
      studentId: json['student_id'] ?? 0,
      studentCode: json['student_code'] ?? '',
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      studentName: json['student_name'] as String?,
      className: json['class_name'] as String?,
      student: json['student'] != null ? User.fromJson(json['student']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'class_id': classId,
      'student_id': studentId,
      'student_code': studentCode,
      'created_at': createdAt.toIso8601String(),
      'student_name': studentName,
      'class_name': className,
      'student': student?.toJson(),
    };
  }
}
