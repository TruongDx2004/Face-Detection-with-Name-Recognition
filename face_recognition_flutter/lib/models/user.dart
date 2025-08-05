class User {
  final int id;
  final String username;
  final String fullName;
  final String email;
  final UserRole role;
  final String? studentId;
  final String? className;
  final bool isActive;
  final bool faceTrained;
  final DateTime createdAt;

  User({
    required this.id,
    required this.username,
    required this.fullName,
    required this.email,
    required this.role,
    this.studentId,
    this.className,
    required this.isActive,
    required this.faceTrained,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      fullName: json['full_name'] ?? json['student_name'] ?? '',
      email: json['email'] ?? '',
      role: UserRole.fromString(json['role'] ?? 'student'),
      studentId: json['student_id']?.toString(),
      className: json['class_name']?.toString(),
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      faceTrained: json['face_trained'] == 1 || json['face_trained'] == true,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'full_name': fullName,
      'email': email,
      'role': role.toString(),
      'student_id': studentId,
      'class_name': className,
      'is_active': isActive,
      'face_trained': faceTrained,
      'created_at': createdAt.toIso8601String(),
    };
  }

  User copyWith({
    int? id,
    String? username,
    String? fullName,
    String? email,
    UserRole? role,
    String? studentId,
    String? className,
    bool? isActive,
    bool? faceTrained,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      role: role ?? this.role,
      studentId: studentId ?? this.studentId,
      className: className ?? this.className,
      isActive: isActive ?? this.isActive,
      faceTrained: faceTrained ?? this.faceTrained,
      createdAt: createdAt ?? this.createdAt,
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
