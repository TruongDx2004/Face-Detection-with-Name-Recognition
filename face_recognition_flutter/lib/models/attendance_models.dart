// lib/models/attendance_models.dart
import 'package:flutter/material.dart';

class AttendanceSession {
  final int id;
  final int teacherId;
  final String subject;
  final String className;
  final DateTime sessionDate;
  final String startTime;
  final String? endTime;
  final bool isActive;
  final DateTime createdAt;
  final String? teacherName;
  final int? totalAttendances;

  AttendanceSession({
    required this.id,
    required this.teacherId,
    required this.subject,
    required this.className,
    required this.sessionDate,
    required this.startTime,
    this.endTime,
    required this.isActive,
    required this.createdAt,
    this.teacherName,
    this.totalAttendances,
  });

  factory AttendanceSession.fromJson(Map<String, dynamic> json) {
  return AttendanceSession(
    id: json['id'] ?? 0,
    teacherId: json['teacher_id'] ?? 0,
    subject: json['subject']?.toString() ?? '',
    className: json['class_name']?.toString() ?? '',
    sessionDate: DateTime.tryParse(json['session_date']?.toString() ?? '') ?? DateTime.now(),
    startTime: json['start_time']?.toString() ?? '',
    endTime: json['end_time']?.toString(),
    isActive: json['is_active'] == 1 || json['is_active'] == true,
    createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
    teacherName: json['teacher_name']?.toString(),
    totalAttendances: json['total_attendances'] is int
        ? json['total_attendances']
        : int.tryParse(json['total_attendances']?.toString() ?? '0'),
  );
}

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'teacher_id': teacherId,
      'subject': subject,
      'class_name': className,
      'session_date': sessionDate.toIso8601String().split('T')[0],
      'start_time': startTime,
      'end_time': endTime,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'teacher_name': teacherName,
      'total_attendances': totalAttendances,
    };
  }
}

class Attendance {
  final int id;
  final int sessionId;
  final int studentId;
  final DateTime attendanceTime;
  final double? confidenceScore;
  final String? imagePath;
  final AttendanceStatus status;
  final String? studentName;
  final String? studentCode;
  final String? subject;
  final String? className;

  Attendance({
    required this.id,
    required this.sessionId,
    required this.studentId,
    required this.attendanceTime,
    this.confidenceScore,
    this.imagePath,
    required this.status,
    this.studentName,
    this.studentCode,
    this.subject,
    this.className,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['id'] ?? 0,
      sessionId: json['session_id'] ?? 0,
      studentId: json['student_id'] ?? 0,
      attendanceTime: DateTime.tryParse(json['attendance_time'] ?? '') ?? DateTime.now(),
      confidenceScore: json['confidence_score']?.toDouble(),
      imagePath: json['image_path'],
      status: AttendanceStatus.fromString(json['status'] ?? 'present'),
      studentName: json['student_name'] ?? json['full_name'],
      studentCode: json['student_code'] ?? json['student_id'],
      subject: json['subject'],
      className: json['class_name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'session_id': sessionId,
      'student_id': studentId,
      'attendance_time': attendanceTime.toIso8601String(),
      'confidence_score': confidenceScore,
      'image_path': imagePath,
      'status': status.toString(),
    };
  }
}

class AttendanceRequest {
  final int sessionId;
  final String imageData;

  AttendanceRequest({
    required this.sessionId,
    required this.imageData,
  });

  Map<String, dynamic> toJson() {
    return {
      'session_id': sessionId,
      'image_data': imageData,
    };
  }
}

enum AttendanceStatus {
  present,
  late,
  absent;

  static AttendanceStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'present':
        return AttendanceStatus.present;
      case 'late':
        return AttendanceStatus.late;
      case 'absent':
        return AttendanceStatus.absent;
      default:
        return AttendanceStatus.present;
    }
  }

  @override
  String toString() {
    return name;
  }

  String get displayName {
    switch (this) {
      case AttendanceStatus.present:
        return 'Có mặt';
      case AttendanceStatus.late:
        return 'Muộn';
      case AttendanceStatus.absent:
        return 'Vắng mặt';
    }
  }

  Color get color {
    switch (this) {
      case AttendanceStatus.present:
        return Colors.green;
      case AttendanceStatus.late:
        return Colors.orange;
      case AttendanceStatus.absent:
        return Colors.red;
    }
  }
}
