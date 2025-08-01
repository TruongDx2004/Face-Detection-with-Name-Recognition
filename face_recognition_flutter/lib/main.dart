import 'package:flutter/material.dart';
import 'package:face_attendance/widgets/WebFaceDetector.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ứng dụng thu thập dữ liệu khuôn mặt',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      // Đặt màn hình DatasetCollectionScreen làm màn hình chính của ứng dụng
      home: WebFaceDetector(),
    );
  }
}
