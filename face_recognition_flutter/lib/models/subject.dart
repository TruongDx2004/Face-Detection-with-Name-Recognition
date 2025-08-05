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
      id: json['id'] as int,
      classId: json['class_id'] as int,
      subjectId: json['subject_id'] as int,
      teacherId: json['teacher_id'] as int,
      className: json['class_name'] as String,
      subjectName: json['subject_name'] as String,
      teacherName: json['teacher_name'] as String,
      weekday: json['weekday'] as int,
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String,
    );
  }
}