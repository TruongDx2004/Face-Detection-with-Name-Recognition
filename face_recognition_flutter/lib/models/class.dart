class ClassData {
  final int id;
  final String name;
  final int studentCount;

  ClassData({
    required this.id,
    required this.name,
    required this.studentCount,
  });

  factory ClassData.fromJson(Map<String, dynamic> json) {
    return ClassData(
      id: int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] ?? '',
      studentCount: int.tryParse(json['student_count'].toString()) ?? 0,
    );
  }
}
