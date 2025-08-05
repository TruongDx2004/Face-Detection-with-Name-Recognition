class Student {
  final int id;
  final String fullName;
  final String studentCode;

  Student({
    required this.id,
    required this.fullName,
    required this.studentCode,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] as int,
      fullName: json['full_name'] as String,
      studentCode: json['student_code'] as String,
    );
  }
}
