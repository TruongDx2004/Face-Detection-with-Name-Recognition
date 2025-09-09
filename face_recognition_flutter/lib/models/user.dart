class User {
  final int id;
  final String username;
  final String fullName;
  final String email;
  final UserRole role;
  final bool isActive;
  final bool faceTrained;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  // Student-specific fields (from class_students table)
  final String? studentCode;
  final int? classId;
  final String? className;
  
  // Additional fields for admin/teacher views
  final String? passwordHash; // Only for admin operations
  final Map<String, dynamic>? metadata;

  User({
    required this.id,
    required this.username,
    required this.fullName,
    required this.email,
    required this.role,
    required this.isActive,
    required this.faceTrained,
    required this.createdAt,
    this.updatedAt,
    this.studentCode,
    this.classId,
    this.className,
    this.passwordHash,
    this.metadata,
  });

  // Backward compatibility getter
  String? get studentId => studentCode;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      fullName: json['full_name'] ?? json['student_name'] ?? '',
      email: json['email'] ?? '',
      role: UserRole.fromString(json['role'] ?? 'student'),
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      faceTrained: json['face_trained'] == 1 || json['face_trained'] == true,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.tryParse(json['updated_at'] as String)
          : null,
      studentCode: json['student_code']?.toString(),
      classId: json['class_id'] != null ? int.tryParse(json['class_id'].toString()) : null,
      className: json['class_name']?.toString(),
      passwordHash: json['password_hash']?.toString(),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'full_name': fullName,
      'email': email,
      'role': role.toString(),
      'is_active': isActive,
      'face_trained': faceTrained,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'student_code': studentCode,
      'class_id': classId,
      'class_name': className,
      if (passwordHash != null) 'password_hash': passwordHash,
      if (metadata != null) 'metadata': metadata,
    };
  }

  User copyWith({
    int? id,
    String? username,
    String? fullName,
    String? email,
    UserRole? role,
    bool? isActive,
    bool? faceTrained,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? studentCode,
    int? classId,
    String? className,
    String? passwordHash,
    Map<String, dynamic>? metadata,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      faceTrained: faceTrained ?? this.faceTrained,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      studentCode: studentCode ?? this.studentCode,
      classId: classId ?? this.classId,
      className: className ?? this.className,
      passwordHash: passwordHash ?? this.passwordHash,
      metadata: metadata ?? this.metadata,
    );
  }
}

enum UserRole {
  student,
  teacher,
  admin;

  static UserRole fromString(String role) {
    switch (role.toLowerCase()) {
      case 'student':
        return UserRole.student;
      case 'teacher':
        return UserRole.teacher;
      case 'admin':
        return UserRole.admin;
      default:
        return UserRole.student;
    }
  }

  @override
  String toString() {
    return name;
  }

  String get displayName {
    switch (this) {
      case UserRole.student:
        return 'Sinh viên';
      case UserRole.teacher:
        return 'Giáo viên';
      case UserRole.admin:
        return 'Quản trị viên';
    }
  }
}
