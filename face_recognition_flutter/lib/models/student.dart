import 'class.dart';

class Student {
  final int id;
  final String username;
  final String fullName;
  final String email;
  final String studentCode;
  final int? classId;
  final String? className;
  final bool isActive;
  final bool faceTrained;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  // Additional fields for detailed views
  final List<ClassStudent>? classes; // Student can be in multiple classes
  final Map<String, dynamic>? metadata;

  Student({
    required this.id,
    required this.username,
    required this.fullName,
    required this.email,
    required this.studentCode,
    this.classId,
    this.className,
    required this.isActive,
    required this.faceTrained,
    required this.createdAt,
    this.updatedAt,
    this.classes,
    this.metadata,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] as int,
      username: json['username'] ?? '',
      fullName: json['full_name'] as String,
      email: json['email'] ?? '',
      studentCode: json['student_code'] as String,
      classId: json['class_id'] != null ? int.tryParse(json['class_id'].toString()) : null,
      className: json['class_name'] as String?,
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      faceTrained: json['face_trained'] == 1 || json['face_trained'] == true,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.tryParse(json['updated_at'] as String)
          : null,
      classes: json['classes'] != null 
          ? (json['classes'] as List).map((c) => ClassStudent.fromJson(c)).toList()
          : null,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'full_name': fullName,
      'email': email,
      'student_code': studentCode,
      'class_id': classId,
      'class_name': className,
      'is_active': isActive,
      'face_trained': faceTrained,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'classes': classes?.map((c) => c.toJson()).toList(),
      'metadata': metadata,
    };
  }

  Student copyWith({
    int? id,
    String? username,
    String? fullName,
    String? email,
    String? studentCode,
    int? classId,
    String? className,
    bool? isActive,
    bool? faceTrained,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<ClassStudent>? classes,
    Map<String, dynamic>? metadata,
  }) {
    return Student(
      id: id ?? this.id,
      username: username ?? this.username,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      studentCode: studentCode ?? this.studentCode,
      classId: classId ?? this.classId,
      className: className ?? this.className,
      isActive: isActive ?? this.isActive,
      faceTrained: faceTrained ?? this.faceTrained,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      classes: classes ?? this.classes,
      metadata: metadata ?? this.metadata,
    );
  }
}
