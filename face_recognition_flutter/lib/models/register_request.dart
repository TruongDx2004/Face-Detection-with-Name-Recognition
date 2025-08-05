// lib/models/register_request.dart
// (or within lib/models/models.dart if that's where you consolidate your models)

// ignore: unused_import
import 'package:flutter/foundation.dart'; // For @required if not using null-safety 'required'

class RegisterRequest {
  final String username;
  final String password;
  final String fullName; // Corresponds to 'full_name' in JSON
  final String email;
  final String role;
  final String? studentId; // Optional, corresponds to 'student_id'
  final String? className; // Optional, corresponds to 'class_name'

  RegisterRequest({
    required this.username,
    required this.password,
    required this.fullName,
    required this.email,
    required this.role,
    this.studentId, // Make optional
    this.className, // Make optional
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'username': username,
      'password': password,
      'full_name': fullName, // Match backend's snake_case
      'email': email,
      'role': role,
    };

    // Only include student_id and class_name if they are provided
    // and potentially if the role is 'student' as per Swagger.
    // The backend should handle validation, but including them conditionally
    // makes the request body cleaner.
    if (studentId != null && studentId!.isNotEmpty) {
      data['student_id'] = studentId;
    }
    if (className != null && className!.isNotEmpty) {
      data['class_name'] = className;
    }

    return data;
  }

  // Optional: A factory constructor for fromJson if you ever need to deserialize RegisterRequest
  // (Less common for request models, but good practice if needed)
  factory RegisterRequest.fromJson(Map<String, dynamic> json) {
    return RegisterRequest(
      username: json['username'] as String,
      password: json['password'] as String,
      fullName: json['full_name'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      studentId: json['student_id'] as String?,
      className: json['class_name'] as String?,
    );
  }
}