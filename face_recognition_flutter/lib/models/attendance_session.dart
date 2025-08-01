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
      subject: json['subject'] ?? '',
      className: json['class_name'] ?? '',
      sessionDate: DateTime.tryParse(json['session_date'] ?? '') ?? DateTime.now(),
      startTime: json['start_time'] ?? '',
      endTime: json['end_time'],
      isActive: json['is_active'] ?? true,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      teacherName: json['teacher_name'],
      totalAttendances: json['total_attendances'],
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
    };
  }
}
