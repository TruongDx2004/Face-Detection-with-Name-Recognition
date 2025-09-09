// Model classes
class Subject {
  final int id;
  final String name;
  final String? code;
  final String? description;
  final int credits;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Subject({
    required this.id,
    required this.name,
    this.code,
    this.description,
    required this.credits,
    required this.isActive,
    required this.createdAt,
    this.updatedAt,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'] as int,
      name: json['name'] as String,
      code: json['code'] as String?,
      description: json['description'] as String?,
      credits: json['credits'] ?? 3,
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.tryParse(json['updated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
      'description': description,
      'credits': credits,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Subject copyWith({
    int? id,
    String? name,
    String? code,
    String? description,
    int? credits,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Subject(
      id: id ?? this.id,
      name: name ?? this.name,
      code: code ?? this.code,
      description: description ?? this.description,
      credits: credits ?? this.credits,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
class Schedule {
  final int id;
  final int courseSectionId;
  final int weekday;
  final String startTime;
  final String endTime;
  final String? room;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;
  
  // Related data from course_sections and joins
  final String? courseSectionName;
  final String? courseSectionCode;
  final String? semester;
  final String? academicYear;
  final String? className;
  final int? classId;
  final String? subjectName;
  final int? subjectId;
  final String? teacherName;
  final int? teacherId;

  Schedule({
    required this.id,
    required this.courseSectionId,
    required this.weekday,
    required this.startTime,
    required this.endTime,
    this.room,
    required this.isActive,
    required this.createdAt,
    this.updatedAt,
    this.courseSectionName,
    this.courseSectionCode,
    this.semester,
    this.academicYear,
    this.className,
    this.classId,
    this.subjectName,
    this.subjectId,
    this.teacherName,
    this.teacherId,
  });

  factory Schedule.fromJson(Map<String, dynamic> json) {
    return Schedule(
      id: json['id'] ?? 0,
      courseSectionId: json['course_section_id'] ?? 0,
      weekday: json['weekday'] ?? 0,
      startTime: json['start_time'] ?? '',
      endTime: json['end_time'] ?? '',
      room: json['room'] as String?,
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.tryParse(json['updated_at'] as String)
          : null,
      courseSectionName: json['course_section_name'] as String?,
      courseSectionCode: json['course_section_code'] as String?,
      semester: json['semester'] as String?,
      academicYear: json['academic_year'] as String?,
      className: json['class_name'] as String?,
      classId: json['class_id'] != null ? int.tryParse(json['class_id'].toString()) : null,
      subjectName: json['subject_name'] as String?,
      subjectId: json['subject_id'] != null ? int.tryParse(json['subject_id'].toString()) : null,
      teacherName: json['teacher_name'] as String?,
      teacherId: json['teacher_id'] != null ? int.tryParse(json['teacher_id'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'course_section_id': courseSectionId,
      'weekday': weekday,
      'start_time': startTime,
      'end_time': endTime,
      'room': room,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'course_section_name': courseSectionName,
      'course_section_code': courseSectionCode,
      'semester': semester,
      'academic_year': academicYear,
      'class_name': className,
      'class_id': classId,
      'subject_name': subjectName,
      'subject_id': subjectId,
      'teacher_name': teacherName,
      'teacher_id': teacherId,
    };
  }

  Schedule copyWith({
    int? id,
    int? courseSectionId,
    int? weekday,
    String? startTime,
    String? endTime,
    String? room,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? courseSectionName,
    String? courseSectionCode,
    String? semester,
    String? academicYear,
    String? className,
    int? classId,
    String? subjectName,
    int? subjectId,
    String? teacherName,
    int? teacherId,
  }) {
    return Schedule(
      id: id ?? this.id,
      courseSectionId: courseSectionId ?? this.courseSectionId,
      weekday: weekday ?? this.weekday,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      room: room ?? this.room,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      courseSectionName: courseSectionName ?? this.courseSectionName,
      courseSectionCode: courseSectionCode ?? this.courseSectionCode,
      semester: semester ?? this.semester,
      academicYear: academicYear ?? this.academicYear,
      className: className ?? this.className,
      classId: classId ?? this.classId,
      subjectName: subjectName ?? this.subjectName,
      subjectId: subjectId ?? this.subjectId,
      teacherName: teacherName ?? this.teacherName,
      teacherId: teacherId ?? this.teacherId,
    );
  }
}