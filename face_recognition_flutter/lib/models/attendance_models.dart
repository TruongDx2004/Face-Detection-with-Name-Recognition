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
  final int courseSectionId;
  final String sessionName;
  final DateTime sessionDate;
  final String startTime;
  final String? endTime;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  // Thông tin từ course_sections và related tables
  final String? subjectName;
  final String? className;
  final String? teacherName;
  final String? courseSectionName;
  final String? courseSectionCode;
  final int? classId;
  final int? subjectId;
  final int? teacherId;
  
  // Thống kê điểm danh
  final int? attendanceCount;
  final int? totalStudents;
  final int? presentCount;
  final int? lateCount;
  final int? absentCount;
  final AttendanceStatus? attendanceStatus; // for student: 'present', 'absent', 'late', 'not_marked'

  AttendanceSession({
    required this.id,
    required this.courseSectionId,
    required this.sessionName,
    required this.sessionDate,
    required this.startTime,
    this.endTime,
    required this.isActive,
    required this.createdAt,
    this.updatedAt,
    this.subjectName,
    this.className,
    this.teacherName,
    this.courseSectionName,
    this.courseSectionCode,
    this.classId,
    this.subjectId,
    this.teacherId,
    this.attendanceCount,
    this.totalStudents,
    this.presentCount,
    this.lateCount,
    this.absentCount,
    this.attendanceStatus,
  });

  // Getter for backward compatibility
  String get subject => subjectName ?? '';
  
  factory AttendanceSession.fromJson(Map<String, dynamic> json) {
    if (json['id'] == null ||
        json['course_section_id'] == null ||
        json['session_date'] == null ||
        json['start_time'] == null) {
      throw ArgumentError('Missing required fields in AttendanceSession JSON');
    }

    return AttendanceSession(
      id: json['id'] as int,
      courseSectionId: json['course_section_id'] as int,
      sessionName: json['session_name'] as String? ?? 'Session ${json['session_date']}',
      sessionDate: DateTime.tryParse(json['session_date'] as String) ??
          (throw ArgumentError('Invalid session_date format')),
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String?,
      isActive: json['is_active'] is bool
          ? json['is_active'] as bool
          : json['is_active'] == 1,
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.tryParse(json['updated_at'] as String)
          : null,
      subjectName: json['subject_name'] as String?,
      className: json['class_name'] as String?,
      teacherName: json['teacher_name'] as String?,
      courseSectionName: json['course_section_name'] as String?,
      courseSectionCode: json['course_section_code'] as String?,
      classId: json['class_id'] as int?,
      subjectId: json['subject_id'] as int?,
      teacherId: json['teacher_id'] as int?,
      attendanceCount: int.tryParse(json['attendance_count']?.toString() ?? '0'),
      totalStudents: int.tryParse(json['total_students']?.toString() ?? '0'),
      presentCount: int.tryParse(json['present_count']?.toString() ?? '0'),
      lateCount: int.tryParse(json['late_count']?.toString() ?? '0'),
      absentCount: int.tryParse(json['absent_count']?.toString() ?? '0'),
      attendanceStatus: json['attendance_status'] != null
          ? AttendanceStatus.fromString(json['attendance_status'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'course_section_id': courseSectionId,
      'session_name': sessionName,
      'session_date': sessionDate.toIso8601String().split('T')[0], // Only date part
      'start_time': startTime,
      'end_time': endTime,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'subject_name': subjectName,
      'class_name': className,
      'teacher_name': teacherName,
      'course_section_name': courseSectionName,
      'course_section_code': courseSectionCode,
      'class_id': classId,
      'subject_id': subjectId,
      'teacher_id': teacherId,
      'attendance_count': attendanceCount,
      'total_students': totalStudents,
      'present_count': presentCount,
      'late_count': lateCount,
      'absent_count': absentCount,
      'attendance_status': attendanceStatus?.toString(),
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
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  // Thông tin từ attendance_sessions và related tables
  final String? sessionName;
  final DateTime? sessionDate;
  final String? startTime;
  final String? endTime;
  final String? subjectName;
  final String? className;
  final String? teacherName;
  final String? courseSectionName;
  
  // Thông tin student (cho teacher view)
  final String? studentName;
  final String? studentCode;
  final String? studentEmail;
  final String? classStudentCode;
  
  // Alias field for backward compatibility
  final DateTime? markedAt;

  Attendance({
    required this.id,
    required this.sessionId,
    required this.studentId,
    required this.attendanceTime,
    this.confidenceScore,
    this.imagePath,
    required this.status,
    required this.createdAt,
    this.updatedAt,
    this.sessionName,
    this.sessionDate,
    this.startTime,
    this.endTime,
    this.subjectName,
    this.className,
    this.teacherName,
    this.courseSectionName,
    this.studentName,
    this.studentCode,
    this.studentEmail,
    this.classStudentCode,
    this.markedAt,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    if (json['id'] == null ||
        json['session_id'] == null ||
        json['status'] == null) {
      throw ArgumentError('Missing required fields in Attendance JSON');
    }

    // Handle different time field names from backend
    DateTime? attendanceTime;
    if (json['attendance_time'] != null) {
      attendanceTime = DateTime.tryParse(json['attendance_time'] as String);
    } else if (json['marked_at'] != null) {
      attendanceTime = DateTime.tryParse(json['marked_at'] as String);
    }
    
    attendanceTime ??= DateTime.now();

    return Attendance(
      id: int.tryParse(json['id'].toString()) ?? 0,
      sessionId: (json['session_id'] ?? 0) as int,
      studentId: json['student_id'] != null ? (json['student_id'] as int) : 0,
      attendanceTime: attendanceTime,
      confidenceScore: json['confidence_score'] != null
          ? (json['confidence_score'] as num).toDouble()
          : null,
      imagePath: json['image_path'] as String?,
      status: AttendanceStatus.fromString(json['status'] as String),
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ??
          DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.tryParse(json['updated_at'] as String)
          : null,
      sessionName: json['session_name'] as String?,
      sessionDate: json['session_date'] != null 
          ? DateTime.tryParse(json['session_date'] as String)
          : null,
      startTime: json['start_time'] as String?,
      endTime: json['end_time'] as String?,
      subjectName: json['subject_name'] as String?,
      className: json['class_name'] as String?,
      teacherName: json['teacher_name'] as String?,
      courseSectionName: json['course_section_name'] as String?,
      studentName: json['student_name'] as String?,
      studentCode: json['student_code'] as String? ?? json['class_student_code'] as String?,
      studentEmail: json['student_email'] as String?,
      classStudentCode: json['class_student_code'] as String?,
      markedAt: json['marked_at'] != null 
          ? DateTime.tryParse(json['marked_at'] as String)
          : null,
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
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'session_name': sessionName,
      'session_date': sessionDate?.toIso8601String().split('T')[0],
      'start_time': startTime,
      'end_time': endTime,
      'subject_name': subjectName,
      'class_name': className,
      'teacher_name': teacherName,
      'course_section_name': courseSectionName,
      'student_name': studentName,
      'student_code': studentCode,
      'student_email': studentEmail,
      'class_student_code': classStudentCode,
      'marked_at': markedAt?.toIso8601String(),
    };
  }
}

/// Model cho yêu cầu điểm danh với vị trí
class AttendanceRequest {
  final int sessionId;
  final String? imageData; // For base64 image data
  final String? imagePath; // For file path
  final Map<String, dynamic>? locationData; // Thông tin vị trí
  final Map<String, dynamic>? metadata; // Thông tin bổ sung

  AttendanceRequest({
    required this.sessionId,
    this.imageData,
    this.imagePath,
    this.locationData,
    this.metadata,
  });

  Map<String, dynamic> toJson() {
    return {
      'session_id': sessionId,
      if (imageData != null) 'image_data': imageData,
      if (imagePath != null) 'image_path': imagePath,
      if (locationData != null) 'location_data': locationData,
      if (metadata != null) ...metadata!,
    };
  }

  /// Create form data for multipart request (used by backend /attendance/mark endpoint)
  Map<String, String> toFormData() {
    return {
      'session_id': sessionId.toString(),
      if (locationData != null) 'location_data': locationData.toString(),
      if (metadata != null) 
        for (var entry in metadata!.entries)
          entry.key: entry.value.toString(),
    };
  }
}

/// Model cho kết quả điểm danh
class AttendanceResult {
  final bool success;
  final String message;
  final Map<String, dynamic>? data;
  final double? confidence;
  final DateTime? timestamp;
  final Map<String, dynamic>? student;

  AttendanceResult({
    required this.success,
    required this.message,
    this.data,
    this.confidence,
    this.timestamp,
    this.student,
  });

  factory AttendanceResult.fromJson(Map<String, dynamic> json) {
    return AttendanceResult(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: json['data'] as Map<String, dynamic>?,
      confidence: json['confidence'] != null 
          ? (json['confidence'] as num).toDouble()
          : null,
      timestamp: json['timestamp'] != null 
          ? DateTime.tryParse(json['timestamp'] as String)
          : null,
      student: json['student'] as Map<String, dynamic>?,
    );
  }
}

/// Model cho yêu cầu tạo session điểm danh
class CreateAttendanceSessionRequest {
  final int courseSectionId;
  final String sessionDate; // YYYY-MM-DD format
  final String startTime; // HH:MM:SS format
  final String? endTime; // HH:MM:SS format
  final String? sessionName;
  final String? title;
  final String? description;
  final int? sessionNumber;

  CreateAttendanceSessionRequest({
    required this.courseSectionId,
    required this.sessionDate,
    required this.startTime,
    this.endTime,
    this.sessionName,
    this.title,
    this.description,
    this.sessionNumber,
  });

  Map<String, dynamic> toJson() {
    return {
      'course_section_id': courseSectionId,
      'session_date': sessionDate,
      'start_time': startTime,
      if (endTime != null) 'end_time': endTime,
      if (sessionName != null) 'session_name': sessionName,
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (sessionNumber != null) 'session_number': sessionNumber,
    };
  }
}

/// Model cho yêu cầu điểm danh thủ công
class ManualAttendanceRequest {
  final int sessionId;
  final int studentId;
  final String status; // 'present', 'absent', 'late'

  ManualAttendanceRequest({
    required this.sessionId,
    required this.studentId,
    required this.status,
  });

  Map<String, dynamic> toJson() {
    return {
      'session_id': sessionId,
      'student_id': studentId,
      'status': status,
    };
  }
}
