// lib/widgets/attendance_card.dart
import 'package:flutter/material.dart';
import '../models/models.dart';

/// Một widget thẻ có thể tái sử dụng để hiển thị thông tin điểm danh.
class AttendanceCard extends StatelessWidget {
  final Attendance attendance;

  const AttendanceCard({
    super.key,
    required this.attendance,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
      elevation: 2.0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: attendance.status.color,
          child: Icon(
            attendance.status == AttendanceStatus.present ? Icons.check : Icons.close,
            color: Colors.white,
          ),
        ),
        title: Text(
          attendance.studentName ?? 'Sinh viên chưa biết',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          'Mã số: ${attendance.studentCode ?? 'N/A'}\nThời gian: ${attendance.attendanceTime.toLocal().toString().substring(11, 16)}',
        ),
        trailing: Text(
          attendance.status.displayName,
          style: TextStyle(color: attendance.status.color, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
