// lib/screens/admin/class_management_screen.dart
import 'package:face_attendance/models/class.dart';
import 'package:face_attendance/models/student.dart';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';

class ClassManagementScreen extends StatefulWidget {
  const ClassManagementScreen({super.key});

  @override
  State<ClassManagementScreen> createState() => _ClassManagementScreenState();
}

class _ClassManagementScreenState extends State<ClassManagementScreen> {
  final Logger _logger = Logger();
  late Future<List<ClassData>> _classesFuture;
  String _searchQuery = '';
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _classesFuture = _fetchClasses();
  }

  Future<List<ClassData>> _fetchClasses() async {
  try {
    final ApiResponse<List<ClassData>> response =
        await _apiService.getClasses(name: _searchQuery);

    if (response.success && response.data != null) {
      _logger.i('Fetched classes: ${response.data!.length} items');
      return response.data!;
    } else {
      throw Exception(response.error ?? 'Unknown error');
    }
  } catch (e) {
    _logger.e('Fetch classes error: $e');
    rethrow;
  }
}


  void _refreshClasses() {
    setState(() {
      _classesFuture = _fetchClasses();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quản lý lớp học'),
        backgroundColor: Colors.blueAccent,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshClasses,
          ),
          IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchSection(),
          Expanded(
            child: FutureBuilder<List<ClassData>>(
              future: _classesFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(child: Text('Lỗi: ${snapshot.error}'));
                } else if (snapshot.hasData) {
                  final classes = snapshot.data!;
                  return _buildClassesList(classes);
                } else {
                  return const Center(child: Text('Không có dữ liệu lớp học.'));
                }
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddClassDialog(),
        backgroundColor: Colors.blueAccent,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildSearchSection() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      color: Colors.grey[100],
      child: TextField(
        decoration: const InputDecoration(
          hintText: 'Tìm kiếm lớp học...',
          prefixIcon: Icon(Icons.search),
          border: OutlineInputBorder(),
        ),
        onChanged: (value) {
          setState(() {
            _searchQuery = value;
            _classesFuture = _fetchClasses();
          });
        },
      ),
    );
  }

  Widget _buildClassesList(List<ClassData> classes) {
    if (classes.isEmpty) {
      return const Center(child: Text('Không tìm thấy lớp học nào.'));
    }

    return ListView.builder(
      itemCount: classes.length,
      itemBuilder: (context, index) {
        final classData = classes[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: ExpansionTile(
            leading: const Icon(Icons.class_, color: Colors.blueAccent),
            title: Text(
              classData.name,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text('${classData.studentCount} sinh viên'),
            trailing: PopupMenuButton<String>(
              onSelected: (value) => _handleClassAction(value, classData),
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'edit', child: Text('Chỉnh sửa')),
                const PopupMenuItem(
                    value: 'manage_students', child: Text('Quản lý sinh viên')),
                const PopupMenuItem(value: 'delete', child: Text('Xóa')),
              ],
            ),
            children: [
              // if (classData.students.isNotEmpty)
              //   ...classData.students.map((student) => ListTile(
              //         leading: const Icon(Icons.person, size: 20),
              //         title: Text(student.fullName),
              //         subtitle: Text('Mã SV: ${student.studentCode}'),
              //         trailing: IconButton(
              //           icon:
              //               const Icon(Icons.remove_circle, color: Colors.red),
              //           onPressed: () =>
              //               _removeStudentFromClass(classData, student),
              //         ),
              //       ))
              // else
              //   const ListTile(
              //     title: Text('Chưa có sinh viên nào trong lớp'),
              //   ),
              ListTile(
                leading: const Icon(Icons.add, color: Colors.green),
                title: const Text('Thêm sinh viên'),
                onTap: () => _showAddStudentToClassDialog(classData),
              ),
            ],
          ),
        );
      },
    );
  }

  void _handleClassAction(String action, ClassData classData) {
    switch (action) {
      case 'edit':
        _showEditClassDialog(classData);
        break;
      case 'manage_students':
        _showManageStudentsDialog(classData);
        break;
      case 'delete':
        _deleteClass(classData);
        break;
    }
  }

  void _showAddClassDialog() {
    final TextEditingController controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Thêm lớp học mới'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Tên lớp học',
            hintText: 'Ví dụ: CNTT K47',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              if (controller.text.isNotEmpty) {
                try {
                  final response = await _apiService.createClass(controller.text);
                  if (response.success) {
                    _logger.i('Class created: ${controller.text}');
                    Navigator.of(context).pop();
                    _refreshClasses();
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Lỗi: ${response.error}')),
                    );
                  }
                } catch (e) {
                  _logger.e('Create class error: $e');
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi: $e')),
                  );
                }
              }
            },
            child: const Text('Thêm'),
          ),
        ],
      ),
    );
  }

  void _showEditClassDialog(ClassData classData) {
    final TextEditingController controller =
        TextEditingController(text: classData.name);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Chỉnh sửa lớp học'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Tên lớp học',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              if (controller.text.isNotEmpty) {
                try {
                  final response = await _apiService.updateClass(classData.id, controller.text);
                  if (response.success) {
                    _logger.i('Class updated: ${classData.id} -> ${controller.text}');
                    Navigator.of(context).pop();
                    _refreshClasses();
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Lỗi: ${response.error}')),
                    );
                  }
                } catch (e) {
                  _logger.e('Update class error: $e');
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi: $e')),
                  );
                }
              }
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  void _showManageStudentsDialog(ClassData classData) {
    Navigator.of(context)
        .push(
          MaterialPageRoute(
            builder: (context) =>
                ClassStudentManagementScreen(classData: classData),
          ),
        )
        .then((_) => _refreshClasses());
  }

  void _showAddStudentToClassDialog(ClassData classData) {
    showDialog(
      context: context,
      builder: (context) => AddStudentToClassDialog(
        classData: classData,
        onAddStudent: (studentData) async {
          try {
            final response = await _apiService.addStudentToClass(
              classId: studentData['class_id'],
              studentId: studentData['student_id'],
              studentCode: studentData['student_code'],
            );
            if (response.success) {
              _logger.i('Student added to class: $studentData');
              Navigator.of(context).pop();
              _refreshClasses();
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Lỗi: ${response.error}')),
              );
            }
          } catch (e) {
            _logger.e('Add student error: $e');
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Lỗi: $e')),
            );
          }
        },
      ),
    );
  }

  // ignore: unused_element
  void _removeStudentFromClass(ClassData classData, Student student) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận'),
        content: Text(
            'Bạn có chắc muốn xóa ${student.fullName} khỏi lớp ${classData.name}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              try {
                final response = await _apiService.removeStudentFromClass(
                  classId: classData.id,
                  studentId: student.id,
                );
                if (response.success) {
                  _logger.i('Student removed from class: ${student.id} from ${classData.id}');
                  Navigator.of(context).pop();
                  _refreshClasses();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi: ${response.error}')),
                  );
                }
              } catch (e) {
                _logger.e('Remove student error: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Lỗi: $e')),
                );
              }
            },
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
  }

  void _deleteClass(ClassData classData) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa lớp học'),
        content: Text(
            'Bạn có chắc muốn xóa lớp ${classData.name}? Hành động này không thể hoàn tác.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              try {
                final response = await _apiService.deleteClass(classData.id);
                if (response.success) {
                  _logger.i('Class deleted: ${classData.id}');
                  Navigator.of(context).pop();
                  _refreshClasses();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi: ${response.error}')),
                  );
                }
              } catch (e) {
                _logger.e('Delete class error: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Lỗi: $e')),
                );
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
  }
}

class AddStudentToClassDialog extends StatefulWidget {
  final ClassData classData;
  final Function(Map<String, dynamic>) onAddStudent;

  const AddStudentToClassDialog({
    super.key,
    required this.classData,
    required this.onAddStudent,
  });

  @override
  State<AddStudentToClassDialog> createState() =>
      _AddStudentToClassDialogState();
}

class _AddStudentToClassDialogState extends State<AddStudentToClassDialog> {
  final _formKey = GlobalKey<FormState>();
  final _studentCodeController = TextEditingController();
  Student? _selectedStudent;
  List<Student> _availableStudents = [];
  final ApiService _apiService = ApiService();
  final Logger _logger = Logger();

  @override
  void initState() {
    super.initState();
    _loadAvailableStudents();
  }

  Future<void> _loadAvailableStudents() async {
    try {
      final response = await _apiService.getAvailableStudents(widget.classData.id);
      if (response.success) {
        setState(() {
          _availableStudents = response.data!;
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: ${response.error}')),
        );
      }
    } catch (e) {
      _logger.e('Load available students error: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Thêm sinh viên vào lớp ${widget.classData.name}'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<Student>(
              value: _selectedStudent,
              decoration: const InputDecoration(labelText: 'Chọn sinh viên'),
              items: _availableStudents.map((student) {
                return DropdownMenuItem(
                  value: student,
                  child: Text('${student.fullName} (${student.studentCode})'),
                );
              }).toList(),
              onChanged: (student) {
                setState(() {
                  _selectedStudent = student;
                  _studentCodeController.text = student?.studentCode ?? '';
                });
              },
              validator: (value) {
                if (value == null) {
                  return 'Vui lòng chọn sinh viên';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _studentCodeController,
              decoration: const InputDecoration(
                labelText: 'Mã sinh viên trong lớp',
                hintText: 'Có thể khác với mã sinh viên gốc',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Vui lòng nhập mã sinh viên';
                }
                return null;
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Hủy'),
        ),
        TextButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              widget.onAddStudent({
                'student_id': _selectedStudent!.id,
                'class_id': widget.classData.id,
                'student_code': _studentCodeController.text,
              });
            }
          },
          child: const Text('Thêm'),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _studentCodeController.dispose();
    super.dispose();
  }
}

class ClassStudentManagementScreen extends StatefulWidget {
  final ClassData classData;

  const ClassStudentManagementScreen({super.key, required this.classData});

  @override
  State<ClassStudentManagementScreen> createState() =>
      _ClassStudentManagementScreenState();
}

class _ClassStudentManagementScreenState
    extends State<ClassStudentManagementScreen> {
  final Logger _logger = Logger();
  late Future<List<Student>> _studentsFuture;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _studentsFuture = _fetchClassStudents();
  }

  Future<List<Student>> _fetchClassStudents() async {
    try {
      final response = await _apiService.getClassStudents(widget.classData.id);
      if (response.success) {
        return response.data!;
      } else {
        throw Exception(response.error);
      }
    } catch (e) {
      _logger.e('Fetch class students error: $e');
      rethrow;
    }
  }

  void _refreshStudents() {
    setState(() {
      _studentsFuture = _fetchClassStudents();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Sinh viên lớp ${widget.classData.name}'),
        backgroundColor: Colors.blueAccent,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshStudents,
          ),
        ],
      ),
      body: FutureBuilder<List<Student>>(
        future: _studentsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Lỗi: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            final students = snapshot.data!;
            return _buildStudentsList(students);
          } else {
            return const Center(child: Text('Không có dữ liệu sinh viên.'));
          }
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddStudentDialog(),
        backgroundColor: Colors.blueAccent,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildStudentsList(List<Student> students) {
    if (students.isEmpty) {
      return const Center(child: Text('Chưa có sinh viên nào trong lớp.'));
    }

    return ListView.builder(
      itemCount: students.length,
      itemBuilder: (context, index) {
        final student = students[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.blueAccent,
              child: Text(
                student.fullName.isNotEmpty
                    ? student.fullName[0].toUpperCase()
                    : 'S',
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
            title: Text(student.fullName),
            subtitle: Text('Mã SV: ${student.studentCode}'),
            trailing: PopupMenuButton<String>(
              onSelected: (value) => _handleStudentAction(value, student),
              itemBuilder: (context) => [
                const PopupMenuItem(
                    value: 'edit_code', child: Text('Sửa mã SV')),
                const PopupMenuItem(
                    value: 'remove', child: Text('Xóa khỏi lớp')),
              ],
            ),
          ),
        );
      },
    );
  }

  void _handleStudentAction(String action, Student student) {
    switch (action) {
      case 'edit_code':
        _showEditStudentCodeDialog(student);
        break;
      case 'remove':
        _removeStudentFromClass(student);
        break;
    }
  }

  void _showAddStudentDialog() {
    showDialog(
      context: context,
      builder: (context) => AddStudentToClassDialog(
        classData: widget.classData,
        onAddStudent: (studentData) async {
          try {
            final response = await _apiService.addStudentToClass(
              classId: studentData['class_id'],
              studentId: studentData['student_id'],
              studentCode: studentData['student_code'],
            );
            if (response.success) {
              _logger.i('Student added to class: $studentData');
              _refreshStudents();
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Lỗi: ${response.error}')),
              );
            }
          } catch (e) {
            _logger.e('Add student error: $e');
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Lỗi: $e')),
            );
          }
        },
      ),
    );
  }

  void _showEditStudentCodeDialog(Student student) {
    final controller = TextEditingController(text: student.studentCode);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sửa mã sinh viên'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Mã sinh viên'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              if (controller.text.isNotEmpty) {
                try {
                  final response = await _apiService.addStudentToClass(
                    classId: widget.classData.id,
                    studentId: student.id,
                    studentCode: controller.text,
                  );
                  if (response.success) {
                    _logger.i('Student code updated: ${student.id} -> ${controller.text}');
                    Navigator.of(context).pop();
                    _refreshStudents();
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Lỗi: ${response.error}')),
                    );
                  }
                } catch (e) {
                  _logger.e('Update student code error: $e');
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi: $e')),
                  );
                }
              }
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  void _removeStudentFromClass(Student student) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận'),
        content: Text(
            'Bạn có chắc muốn xóa ${student.fullName} khỏi lớp ${widget.classData.name}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              try {
                final response = await _apiService.removeStudentFromClass(
                  classId: widget.classData.id,
                  studentId: student.id,
                );
                if (response.success) {
                  _logger.i('Student removed from class: ${student.id} from ${widget.classData.id}');
                  Navigator.of(context).pop();
                  _refreshStudents();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lỗi: ${response.error}')),
                  );
                }
              } catch (e) {
                _logger.e('Remove student error: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Lỗi: $e')),
                );
              }
            },
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
  }
}
