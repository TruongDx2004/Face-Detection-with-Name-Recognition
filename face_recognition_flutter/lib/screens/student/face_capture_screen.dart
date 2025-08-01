// lib/screens/face_capture_screen.dart
import 'dart:convert';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../models/face_register_request.dart';


// Import các file cần thiết
import '../../services/api_service.dart'; // Sử dụng ApiService bạn đã cung cấp
// import 'package:face_attendance_app/utils/constants.dart';

/// Màn hình chụp ảnh khuôn mặt
class FaceCaptureScreen extends StatefulWidget {
  final int userId;
  final Function onFaceTrained;
  final int sessionId;

  const FaceCaptureScreen({
    super.key,
    required this.userId,
    required this.onFaceTrained,
    required this.sessionId,
  });

  @override
  State<FaceCaptureScreen> createState() => _FaceCaptureScreenState();
}

class _FaceCaptureScreenState extends State<FaceCaptureScreen> {
  final Logger _logger = Logger();
  late CameraController _cameraController;
  late Future<void> _initializeControllerFuture;
  bool _isCapturing = false;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  @override
  void dispose() {
    _cameraController.dispose();
    super.dispose();
  }

  /// Khởi tạo và cấu hình camera
  Future<void> _initializeCamera() async {
    final cameras = await availableCameras();
    _cameraController = CameraController(
      cameras.firstWhere(
          (camera) => camera.lensDirection == CameraLensDirection.front,
          orElse: () => cameras.first),
      ResolutionPreset.medium,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    _initializeControllerFuture = _cameraController.initialize();
    if (mounted) {
      setState(() {});
    }
  }

  /// Phương thức xử lý chụp ảnh và gửi ảnh lên API
  Future<void> _captureAndSendImage() async {
    if (_isCapturing) return;

    if (!_cameraController.value.isInitialized) {
      _logger.e('Camera controller is not initialized.');
      return;
    }

    setState(() {
      _isCapturing = true;
    });

    try {
      final image = await _cameraController.takePicture();
      _logger.i('Ảnh đã được chụp: ${image.path}');
      
      // Đọc file ảnh và chuyển đổi sang base64
      final bytes = await File(image.path).readAsBytes();
      final base64Image = base64Encode(bytes);

      // Gọi API để lưu trữ ảnh và đào tạo khuôn mặt
      final request = FaceRegisterRequest(
        images: [base64Image],
      );


      _logger.d('Gửi ảnh khuôn mặt cho user ID: ${widget.userId}...');
      final response = await ApiService().registerFace(request);

      if (response.success) {
        _logger.i('Ảnh khuôn mặt đã được gửi thành công. Bắt đầu quá trình đào tạo...');
        // Khi API trả về thành công, gọi hàm callback
        widget.onFaceTrained();
        _showSnackBar('Đăng ký khuôn mặt thành công!', Colors.green);
      } else {
        _logger.e('Lỗi khi gửi ảnh khuôn mặt: ${response.message}');
        _showSnackBar(response.message, Colors.red);
      }
    } catch (e) {
      _logger.e('Lỗi khi chụp ảnh hoặc gọi API: $e');
      _showSnackBar('Lỗi: Không thể chụp hoặc gửi ảnh.', Colors.red);
    } finally {
      if (mounted) {
        setState(() {
          _isCapturing = false;
        });
      }
    }
  }
  
  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thu thập ảnh khuôn mặt'),
        backgroundColor: Colors.blueAccent,
      ),
      body: FutureBuilder<void>(
        future: _initializeControllerFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text(
                      'Vui lòng đặt khuôn mặt vào khung hình và giữ cố định.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 16, color: Colors.black54),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      // Camera preview widget
                      SizedBox(
                        width: MediaQuery.of(context).size.width * 0.8,
                        height: MediaQuery.of(context).size.width * 0.8,
                        child: ClipOval(
                          child: CameraPreview(_cameraController),
                        ),
                      ),
                      // Frame for face detection
                      Container(
                        width: MediaQuery.of(context).size.width * 0.8,
                        height: MediaQuery.of(context).size.width * 0.8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: _isCapturing ? Colors.green : Colors.white,
                            width: 4,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  _isCapturing
                      ? const CircularProgressIndicator()
                      : ElevatedButton.icon(
                          onPressed: _captureAndSendImage,
                          icon: const Icon(Icons.camera_alt),
                          label: const Text('Chụp ảnh'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blueAccent,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            textStyle: const TextStyle(fontSize: 18),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                          ),
                        ),
                ],
              ),
            );
          } else {
            return const Center(child: CircularProgressIndicator());
          }
        },
      ),
    );
  }
}

// // Model để gửi yêu cầu đăng ký khuôn mặt
// class FaceRegisterRequest {
//   final int userId;
//   final String faceImageBase64;

//   FaceRegisterRequest({
//     required this.userId,
//     required this.faceImageBase64,
//   });

//   Map<String, dynamic> toJson() {
//     return {
//       'user_id': userId,
//       'face_image_base64': faceImageBase64,
//     };
//   }
// }
