// Model classes
class Subject {
  final int id;
  final String name;

  Subject({required this.id, required this.name});

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }
}
class Schedule {
  final int id;
  final int classId;
  final int subjectId;
  final int teacherId;
  final String className;
  final String subjectName;
  final String teacherName;
  final int weekday;
  final String startTime;
  final String endTime;

  Schedule({
    required this.id,
    required this.classId,
    required this.subjectId,
    required this.teacherId,
    required this.className,
    required this.subjectName,
    required this.teacherName,
    required this.weekday,
    required this.startTime,
    required this.endTime,
  });

  factory Schedule.fromJson(Map<String, dynamic> json) {
  return Schedule(
    id: json['id'] ?? 0,
    classId: json['class_id'] ?? 0,
    subjectId: json['subject_id'] ?? 0,
    teacherId: json['teacher_id'] ?? 0,
    className: json['class_name'] ?? '',
    subjectName: json['subject_name'] ?? '',
    teacherName: json['teacher_name'] ?? '',
    weekday: json['weekday'] ?? 0,
    startTime: json['start_time'] ?? '',
    endTime: json['end_time'] ?? '',
  );
}

}