class SessionCreateRequest {
  final int classId;
  final int subjectId;
  final int scheduleId;
  final String sessionDate;

  SessionCreateRequest({
    required this.classId,
    required this.subjectId,
    required this.scheduleId,
    required this.sessionDate,
  });

  Map<String, dynamic> toJson() {
    return {
      'class_id': classId,
      'subject_id': subjectId,
      'schedule_id': scheduleId,
      'session_date': sessionDate,
    };
  }
}