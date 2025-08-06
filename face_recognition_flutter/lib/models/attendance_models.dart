// lib/models/attendance_models.dart
import 'package:flutter/material.dart';

/// Enum cho trạng thái điểm danh
enum AttendanceStatus {
  present,
  late,
  absent;

  static AttendanceStatus fromString(String? status) {
    if (status == null) return AttendanceStatus.present;
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
  String toString() => name;

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

/// Model cho phiên điểm danh
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

  final int? totalStudents;
  final int? presentCount;
  final int? lateCount;
  final int? absentCount;

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

    this.totalStudents,
    this.presentCount,
    this.lateCount,
    this.absentCount,
  });

  factory AttendanceSession.fromJson(Map<String, dynamic> json) {
    // Kiểm tra các trường bắt buộc
    if (json['id'] == null ||
        json['teacher_id'] == null ||
        json['subject'] == null ||
        json['class_name'] == null ||
        json['session_date'] == null ||
        json['start_time'] == null ||
        json['is_active'] == null ||
        json['created_at'] == null) {
      throw ArgumentError('Missing required fields in AttendanceSession JSON');
    }

    return AttendanceSession(
      id: json['id'] as int,
      teacherId: json['teacher_id'] as int,
      subject: json['subject'] as String,
      className: json['class_name'] as String,
      sessionDate: DateTime.tryParse(json['session_date'] as String) ??
          (throw ArgumentError('Invalid session_date format')),
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String?,
      isActive: json['is_active'] is bool
          ? json['is_active'] as bool
          : json['is_active'] == 1,
      createdAt: DateTime.tryParse(json['created_at'] as String) ??
          (throw ArgumentError('Invalid created_at format')),
      teacherName: json['teacher_name'] as String?,
      totalAttendances: json['total_attendances'] is int
          ? json['total_attendances'] as int
          : int.tryParse(json['total_attendances']?.toString() ?? '0'),
      totalStudents: json['total_students'] is int
          ? json['total_students'] as int
          : int.tryParse(json['total_students']?.toString() ?? '0'),
      presentCount: json['present_count'] is int
          ? json['present_count'] as int
          : int.tryParse(json['present_count']?.toString() ?? '0'),
      lateCount: json['late_count'] is int
          ? json['late_count'] as int
          : int.tryParse(json['late_count']?.toString() ?? '0') ,
      absentCount: json['absent_count'] is int
          ? json['absent_count'] as int
          : int.tryParse(json['absent_count']?.toString() ?? '0'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'teacher_id': teacherId,
      'subject': subject,
      'class_name': className,
      'session_date': sessionDate.toIso8601String(),
      'start_time': startTime,
      'end_time': endTime,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'teacher_name': teacherName,
      'total_attendances': totalAttendances,
      'total_students': totalStudents,
      'present_count': presentCount,
      'late_count': lateCount,
      'absent_count': absentCount,
    };
  }
}

/// Model cho bản ghi điểm danh
class Attendance {
  final int id;
  final int sessionId;
  final int studentId;
  final DateTime attendanceTime;
  final double? confidenceScore;
  final String? imagePath;
  final AttendanceStatus status;
  final String studentName;
  final String studentCode;
  final String subjectName;
  final String className;

  Attendance({
    required this.id,
    required this.sessionId,
    required this.studentId,
    required this.attendanceTime,
    this.confidenceScore,
    this.imagePath,
    required this.status,
    required this.studentName,
    required this.studentCode,
    required this.subjectName,
    required this.className,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    if (json['id'] == null ||
        json['session_id'] == null ||
        json['attendance_time'] == null ||
        json['status'] == null) {
      throw ArgumentError('Missing required fields in Attendance JSON');
    }

    return Attendance(
      id: (json['id'] ?? 0) as int,
      sessionId: (json['session_id'] ?? 0) as int,
      studentId: json['student_id'] != null
          ? (json['student_id'] as int)
          : 0, // fallback nếu API không trả student_id
      attendanceTime: DateTime.tryParse(json['attendance_time'] ?? '') ??
          (throw ArgumentError('Invalid attendance_time format')),
      confidenceScore: json['confidence_score'] != null
          ? (json['confidence_score'] as num).toDouble()
          : null,
      imagePath: json['image_path'] as String?,
      status: AttendanceStatus.fromString(json['status'] as String),
      studentName: json['studentName'] ?? json['student_name'] ?? 'Unknown',
      studentCode: json['studentCode'] ?? json['student_code'] ?? 'Unknown',
      subjectName: json['subjectName'] ?? json['subject_name'] ?? 'Unknown',
      className: json['className'] ?? json['class_name'] ?? 'Unknown',
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
      'studentName': studentName,
      'studentCode': studentCode,
      'subjectName': subjectName,
      'className': className,
    };
  }
}

/// Model cho yêu cầu điểm danh
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
