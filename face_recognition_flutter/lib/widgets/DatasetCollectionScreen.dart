// lib/widgets/DatasetCollectionScreen.dart
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'dart:io';
import 'dart:convert';
import 'package:logger/logger.dart';
import 'package:http/http.dart' as http;
// ignore: unused_import
import 'dart:developer';

class DatasetCollectionScreen extends StatefulWidget {
  const DatasetCollectionScreen({super.key});

  @override
  _DatasetCollectionScreenState createState() =>
      _DatasetCollectionScreenState();
}

class _DatasetCollectionScreenState extends State<DatasetCollectionScreen> {
  final Logger _logger = Logger();
  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  bool _isCapturing = false;
  final List<String> _capturedImages = [];
  final int _requiredImages = 5; // Số lượng ảnh cần thu thập

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _studentIdController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _nameController.dispose();
    _studentIdController.dispose();
    super.dispose();
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        _logger.e(
            'No cameras available'); // Log này sẽ giúp bạn biết nếu không tìm thấy camera
        _showSnackBar('Không có camera nào khả dụng trên thiết bị.',
            Colors.red); // Thêm thông báo rõ ràng cho người dùng
        return;
      }

      final camera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        camera,
        ResolutionPreset.low,
        imageFormatGroup:
            ImageFormatGroup.jpeg, // Đảm bảo định dạng này được hỗ trợ
      );

      await _cameraController!.initialize();

      if (mounted) {
        setState(() {
          _isCameraInitialized = true;
        });
      }
    } catch (e) {
      _logger.e('Error initializing camera: $e'); // Log lỗi chi tiết
      _showSnackBar('Không thể khởi tạo camera: $e',
          Colors.red); // Hiển thị lỗi ra snackbar
    }
  }

  Future<void> _captureImage() async {
    if (!_isCameraInitialized || _cameraController == null || _isCapturing) {
      return;
    }

    if (_nameController.text.trim().isEmpty ||
        _studentIdController.text.trim().isEmpty) {
      _showSnackBar(
          'Vui lòng nhập đầy đủ thông tin trước khi chụp ảnh', Colors.orange);
      return;
    }

    if (_capturedImages.length >= _requiredImages) {
      _showSnackBar('Đã đủ số lượng ảnh yêu cầu', Colors.orange);
      return;
    }

    setState(() {
      _isCapturing = true;
    });

    try {
      final XFile image = await _cameraController!.takePicture();
      final File imageFile = File(image.path);
      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes);

      // Kiểm tra tính toàn vẹn của base64Image
      try {
        base64Decode(base64Image); // Thử giải mã ngược
        _logger.d('Base64 image is valid after encoding.');
      } catch (e) {
        _logger.e('Error decoding base64 image after encoding: $e');
        _showSnackBar('Lỗi xử lý ảnh: $e', Colors.red);
        return; // Dừng lại nếu dữ liệu đã hỏng từ client
      }

      setState(() {
        _capturedImages.add(base64Image);
      });

      _logger.i('Captured image ${_capturedImages.length}/$_requiredImages');
      _showSnackBar('Đã chụp ảnh ${_capturedImages.length}/$_requiredImages',
          Colors.green);

      // Tự động gửi dữ liệu khi đủ số lượng ảnh
      if (_capturedImages.length >= _requiredImages) {
        await _submitDataset();
      }
    } catch (e) {
      _logger.e('Error capturing image: $e');
      _showSnackBar('Lỗi khi chụp ảnh: $e', Colors.red);
    } finally {
      if (mounted) {
        setState(() {
          _isCapturing = false;
        });
      }
    }
  }

  Future<void> _submitDataset() async {
    if (_capturedImages.isEmpty) {
      _showSnackBar('Chưa có ảnh nào được chụp', Colors.orange);
      return;
    }

    try {
      _showLoadingDialog('Đang gửi dữ liệu...');

      final Map<String, dynamic> requestBody = {
        'images': _capturedImages,
      };

      _logger.d('Request Body: ${jsonEncode(requestBody)}');
      // Gửi dữ liệu đến backend
      final response = await http.post(
        Uri.parse(
            'http://10.0.2.2:8000/student/register-face'), // Thay đổi URL theo backend của bạn
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer $authToken', // Nếu bạn đã triển khai xác thực
        },
        body: jsonEncode(requestBody), // Gửi requestBody đã chuẩn bị
      );

      Navigator.of(context).pop(); // Đóng loading dialog

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        _logger.i('Dataset submitted successfully: $responseData');
        _showSnackBar('Đăng ký thành công!', Colors.green);
        _resetForm();
      } else {
        final errorData = jsonDecode(response.body);
        _logger.e('Error submitting dataset: ${errorData['message']}');
        _showSnackBar('Lỗi: ${errorData['message'] ?? 'Không thể gửi dữ liệu'}',
            Colors.red);
      }
    } catch (e) {
      Navigator.of(context).pop(); // Đóng loading dialog
      _logger.e('Network error: $e');
      _showSnackBar('Lỗi mạng: Không thể kết nối đến server', Colors.red);
    }
  }

  void _resetForm() {
    setState(() {
      _capturedImages.clear();
    });
    _nameController.clear();
    _studentIdController.clear();
  }

  void _deleteImage(int index) {
    setState(() {
      _capturedImages.removeAt(index);
    });
    _showSnackBar('Đã xóa ảnh ${index + 1}', Colors.blue);
  }

  void _showLoadingDialog(String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(message),
          ],
        ),
      ),
    );
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
        title: const Text('Thu thập dữ liệu khuôn mặt'),
        backgroundColor: Colors.blue[600],
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Form nhập thông tin
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Thông tin cá nhân',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue[800],
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        labelText: 'Họ và tên',
                        prefixIcon: const Icon(Icons.person),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _studentIdController,
                      decoration: InputDecoration(
                        labelText: 'Mã số sinh viên',
                        prefixIcon: const Icon(Icons.badge),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Camera preview
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(
                      'Chụp ảnh khuôn mặt (${_capturedImages.length}/$_requiredImages)',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),

                    if (!_isCameraInitialized)
                      const SizedBox(
                        height: 300,
                        child: Center(
                          child: CircularProgressIndicator(),
                        ),
                      )
                    else
                      Container(
                        height: 300,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: CameraPreview(_cameraController!),
                        ),
                      ),

                    const SizedBox(height: 20),

                    // Nút chụp ảnh
                    ElevatedButton.icon(
                      onPressed: _isCapturing ? null : _captureImage,
                      icon: _isCapturing
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.camera_alt),
                      label: Text(_isCapturing ? 'Đang chụp...' : 'Chụp ảnh'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue[600],
                        foregroundColor: Colors.white,
                        padding:
                            const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Hiển thị ảnh đã chụp
            if (_capturedImages.isNotEmpty)
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Ảnh đã chụp',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _capturedImages.asMap().entries.map((entry) {
                          int index = entry.key;
                          String base64Image = entry.value;

                          return Stack(
                            children: [
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.grey[300]!),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.memory(
                                    base64Decode(base64Image),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Positioned(
                                top: -8,
                                right: -8,
                                child: IconButton(
                                  icon: const Icon(Icons.close,
                                      color: Colors.red, size: 20),
                                  onPressed: () => _deleteImage(index),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                ),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 20),

            // Nút gửi dữ liệu (chỉ hiển thị khi có ảnh)
            if (_capturedImages.isNotEmpty)
              ElevatedButton.icon(
                onPressed: _submitDataset,
                icon: const Icon(Icons.cloud_upload),
                label: Text('Gửi dữ liệu (${_capturedImages.length} ảnh)'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green[600],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),

            const SizedBox(height: 10),

            // Nút reset
            if (_capturedImages.isNotEmpty)
              TextButton.icon(
                onPressed: _resetForm,
                icon: const Icon(Icons.refresh),
                label: const Text('Bắt đầu lại'),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.orange[600],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
