// lib/screens/student/face_capture_screen.dart
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:logger/logger.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import '../../services/api_service.dart';
import '../../models/attendance_models.dart';
import '../../utils/camera_helper.dart';

class FaceCaptureScreen extends StatefulWidget {
  final int userId;
  final int sessionId;
  final VoidCallback? onFaceTrained;

  const FaceCaptureScreen({
    super.key,
    required this.userId,
    required this.sessionId,
    this.onFaceTrained,
  });

  @override
  State<FaceCaptureScreen> createState() => _FaceCaptureScreenState();
}

class _FaceCaptureScreenState extends State<FaceCaptureScreen>
    with WidgetsBindingObserver {
  final Logger _logger = Logger();
  
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  bool _isProcessing = false;
  bool _isFlashOn = false;
  int _selectedCameraIndex = 0;
  
  String? _lastCapturedImagePath;
  String _statusMessage = 'Hãy đặt khuôn mặt vào khung hình và chụp ảnh';
  Color _statusColor = Colors.blue;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final CameraController? cameraController = _cameraController;
    if (cameraController == null || !cameraController.value.isInitialized) {
      return;
    }

    if (state == AppLifecycleState.inactive) {
      cameraController.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
    }
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) {
        _setStatus('Không tìm thấy camera', Colors.red);
        return;
      }

      // Ưu tiên camera trước (selfie camera)
      int frontCameraIndex = _cameras!.indexWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
      );
      
      if (frontCameraIndex != -1) {
        _selectedCameraIndex = frontCameraIndex;
      } else {
        _selectedCameraIndex = 0;
      }

      await _setupCamera(_selectedCameraIndex);
    } catch (e) {
      _logger.e('Camera initialization error: $e');
      _setStatus('Lỗi khởi tạo camera: $e', Colors.red);
    }
  }

  Future<void> _setupCamera(int cameraIndex) async {
    try {
      if (_cameraController != null) {
        await _cameraController!.dispose();
      }

      _cameraController = CameraController(
        _cameras![cameraIndex],
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _cameraController!.initialize();

      if (mounted) {
        setState(() {
          _isInitialized = true;
          _selectedCameraIndex = cameraIndex;
        });
        _setStatus('Camera đã sẵn sàng - Hãy chụp ảnh để điểm danh', Colors.green);
      }
    } catch (e) {
      _logger.e('Camera setup error: $e');
      _setStatus('Lỗi thiết lập camera: $e', Colors.red);
    }
  }

  void _setStatus(String message, Color color) {
    if (mounted) {
      setState(() {
        _statusMessage = message;
        _statusColor = color;
      });
    }
  }

  Future<void> _captureAndRecognize() async {
    if (!_isInitialized || _isProcessing || _cameraController == null) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      _setStatus('Đang chụp ảnh...', Colors.orange);

      // Capture image
      final XFile imageFile = await _cameraController!.takePicture();
      _lastCapturedImagePath = imageFile.path;

      _setStatus('Đang xử lý nhận diện khuôn mặt...', Colors.blue);

      // Send for face recognition and attendance marking
      final result = await ApiService().markAttendance(
        sessionId: widget.sessionId,
        imageFile: File(imageFile.path),
      );

      if (result.success) {
        _setStatus('Điểm danh thành công!', Colors.green);
        
        // Show success dialog
        _showSuccessDialog(result.data!);
        
        // Callback to refresh parent screen
        if (widget.onFaceTrained != null) {
          widget.onFaceTrained!();
        }
        
        // Auto close after 2 seconds
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            Navigator.of(context).pop();
          }
        });
      } else {
        _setStatus('Điểm danh thất bại: ${result.message}', Colors.red);
      }
    } catch (e) {
      _logger.e('Capture and recognize error: $e');
      _setStatus('Lỗi: $e', Colors.red);
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  void _showSuccessDialog(Map<String, dynamic> attendanceData) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 28),
            SizedBox(width: 8),
            Text('Điểm danh thành công!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Sinh viên: ${attendanceData['student_name'] ?? 'N/A'}'),
            Text('Mã SV: ${attendanceData['student_code'] ?? 'N/A'}'),
            Text('Thời gian: ${DateTime.now().toString().substring(0, 19)}'),
            if (attendanceData['confidence_score'] != null)
              Text('Độ tin cậy: ${(attendanceData['confidence_score'] * 100).toStringAsFixed(1)}%'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close dialog
              Navigator.of(context).pop(); // Close screen
            },
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  Future<void> _switchCamera() async {
    if (_cameras == null || _cameras!.length <= 1) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      int nextCameraIndex = (_selectedCameraIndex + 1) % _cameras!.length;
      await _setupCamera(nextCameraIndex);
    } catch (e) {
      _logger.e('Switch camera error: $e');
      _setStatus('Lỗi chuyển camera: $e', Colors.red);
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  Future<void> _toggleFlash() async {
    if (_cameraController == null || !_isInitialized) return;

    try {
      await _cameraController!.setFlashMode(
        _isFlashOn ? FlashMode.off : FlashMode.torch,
      );
      setState(() {
        _isFlashOn = !_isFlashOn;
      });
    } catch (e) {
      _logger.e('Toggle flash error: $e');
    }
  }

  Widget _buildCameraPreview() {
    if (!_isInitialized || _cameraController == null) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Đang khởi tạo camera...'),
          ],
        ),
      );
    }

    return Stack(
      children: [
        CameraPreview(_cameraController!),
        
        // Face detection overlay
        Positioned.fill(
          child: CustomPaint(
            painter: FaceOverlayPainter(),
          ),
        ),
        
        // Status overlay
        Positioned(
          top: 50,
          left: 16,
          right: 16,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black54,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              _statusMessage,
              style: TextStyle(
                color: _statusColor,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildControlButtons() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Flash toggle
          IconButton(
            onPressed: _toggleFlash,
            icon: Icon(
              _isFlashOn ? Icons.flash_on : Icons.flash_off,
              color: _isFlashOn ? Colors.yellow : Colors.white,
              size: 32,
            ),
            style: IconButton.styleFrom(
              backgroundColor: Colors.black54,
              padding: const EdgeInsets.all(12),
            ),
          ),
          
          // Capture button
          GestureDetector(
            onTap: _isProcessing ? null : _captureAndRecognize,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isProcessing ? Colors.grey : Colors.white,
                border: Border.all(color: Colors.blue, width: 4),
              ),
              child: _isProcessing
                  ? const CircularProgressIndicator(
                      strokeWidth: 3,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                    )
                  : const Icon(
                      Icons.camera_alt,
                      size: 40,
                      color: Colors.blue,
                    ),
            ),
          ),
          
          // Switch camera
          if (_cameras != null && _cameras!.length > 1)
            IconButton(
              onPressed: _isProcessing ? null : _switchCamera,
              icon: const Icon(
                Icons.flip_camera_ios,
                color: Colors.white,
                size: 32,
              ),
              style: IconButton.styleFrom(
                backgroundColor: Colors.black54,
                padding: const EdgeInsets.all(12),
              ),
            )
          else
            const SizedBox(width: 56), // Placeholder for alignment
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CameraPermissionWrapper(
      onPermissionDenied: () {
        CameraHelper.showPermissionDialog(context);
      },
      child: Scaffold(
        backgroundColor: const Color.fromARGB(255, 113, 113, 113),
        appBar: AppBar(
          title: const Text('Điểm danh bằng khuôn mặt'),
          backgroundColor: Colors.blueAccent,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: Column(
          children: [
            // Camera preview
            Expanded(
              flex: 4,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(20),
                ),
                child: _buildCameraPreview(),
              ),
            ),
            
            // Instructions
            Container(
              padding: const EdgeInsets.all(16),
              child: const Column(
                children: [
                  Icon(
                    Icons.face,
                    size: 48,
                    color: Colors.blue,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Hướng dẫn:',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color.fromARGB(255, 0, 0, 0),
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '• Đặt khuôn mặt vào khung hình\n'
                    '• Đảm bảo ánh sáng đủ sáng\n'
                    '• Nhìn thẳng vào camera\n'
                    '• Nhấn nút chụp để điểm danh',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color.fromARGB(179, 0, 0, 0),
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            
            // Control buttons
            _buildControlButtons(),
          ],
        ),
      ),
    );
  }
}

// Custom painter for face detection overlay
class FaceOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.blue.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    // Draw face detection frame
    final center = Offset(size.width / 2, size.height / 2);
    final faceRect = Rect.fromCenter(
      center: center,
      width: size.width * 0.7,
      height: size.height * 0.5,
    );

    // Draw rounded rectangle
    final rrect = RRect.fromRectAndRadius(
      faceRect,
      const Radius.circular(20),
    );
    
    canvas.drawRRect(rrect, paint);

    // Draw corner markers
    final cornerPaint = Paint()
      ..color = Colors.blue
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;

    const cornerLength = 30.0;
    
    // Top-left corner
    canvas.drawLine(
      Offset(faceRect.left, faceRect.top + cornerLength),
      Offset(faceRect.left, faceRect.top),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(faceRect.left, faceRect.top),
      Offset(faceRect.left + cornerLength, faceRect.top),
      cornerPaint,
    );
    
    // Top-right corner
    canvas.drawLine(
      Offset(faceRect.right - cornerLength, faceRect.top),
      Offset(faceRect.right, faceRect.top),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(faceRect.right, faceRect.top),
      Offset(faceRect.right, faceRect.top + cornerLength),
      cornerPaint,
    );
    
    // Bottom-left corner
    canvas.drawLine(
      Offset(faceRect.left, faceRect.bottom - cornerLength),
      Offset(faceRect.left, faceRect.bottom),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(faceRect.left, faceRect.bottom),
      Offset(faceRect.left + cornerLength, faceRect.bottom),
      cornerPaint,
    );
    
    // Bottom-right corner
    canvas.drawLine(
      Offset(faceRect.right - cornerLength, faceRect.bottom),
      Offset(faceRect.right, faceRect.bottom),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(faceRect.right, faceRect.bottom - cornerLength),
      Offset(faceRect.right, faceRect.bottom),
      cornerPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}