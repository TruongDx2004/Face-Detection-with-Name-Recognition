// lib/widgets/face_detector_widget.dart

import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui'; 

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:flutter/foundation.dart'; // Cho WriteBuffer
import 'package:logger/logger.dart';

/// Một widget độc lập để phát hiện khuôn mặt và chụp ảnh.
///
/// Widget này khởi tạo camera, hiển thị luồng video và cung cấp
/// một chức năng để chụp ảnh khi phát hiện thấy khuôn mặt.
class FaceDetectorWidget extends StatefulWidget {
  /// Callback được gọi khi một khuôn mặt được phát hiện và ảnh được chụp.
  final Function(String imageData)? onImageCaptured;

  /// Callback được gọi khi phát hiện trạng thái khuôn mặt thay đổi.
  final Function(bool isFaceDetected)? onFaceDetected;

  const FaceDetectorWidget({
    super.key,
    this.onImageCaptured,
    this.onFaceDetected,
  });

  @override
  State<FaceDetectorWidget> createState() => _FaceDetectorWidgetState();
}

class _FaceDetectorWidgetState extends State<FaceDetectorWidget> {
  final Logger _logger = Logger();
  CameraController? _cameraController;
  List<CameraDescription> _cameras = [];
  bool _isCameraInitialized = false;
  bool _isFaceDetected = false;
  bool _isProcessingImage = false;
  bool _isCapturing = false;

  late final FaceDetector _faceDetector;

  @override
  void initState() {
    super.initState();
    // Khởi tạo FaceDetector với cấu hình tối ưu
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        enableContours: false,  // Tắt để tăng tốc độ
        enableLandmarks: false, // Tắt để tăng tốc độ
        enableClassification: false,
        enableTracking: false,
        minFaceSize: 0.1, // Giảm kích thước tối thiểu
        performanceMode: FaceDetectorMode.fast, // Chế độ nhanh
      ),
    );
    _initializeCamera();
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _faceDetector.close();
    super.dispose();
  }

  /// Khởi tạo camera và bắt đầu luồng xem trước.
  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) {
        _logger.e("Không tìm thấy camera nào.");
        return;
      }
      final frontCamera = _cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => _cameras.first,
      );

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      await _cameraController?.initialize();
      if (!mounted) return;
      setState(() {
        _isCameraInitialized = true;
      });

      _startImageStream();
    } catch (e) {
      _logger.e("Lỗi khởi tạo camera: $e");
    }
  }

  /// Bắt đầu luồng hình ảnh để xử lý liên tục.
  void _startImageStream() {
    _cameraController?.startImageStream((CameraImage image) {
      if (!_isProcessingImage) {
        _isProcessingImage = true;
        _detectFaceInImage(image).then((isDetected) {
          if (mounted) {
            setState(() {
              _isFaceDetected = isDetected;
            });
            widget.onFaceDetected?.call(isDetected);
          }
          // Đặt lại flag sau khi xử lý xong
          Future.delayed(const Duration(milliseconds: 100), () {
            _isProcessingImage = false;
          });
        }).catchError((error) {
          _logger.e("Error in face detection: $error");
          _isProcessingImage = false;
        });
      }
    });
  }

  /// [MLKIT] Logic phát hiện khuôn mặt thực tế.
  Future<bool> _detectFaceInImage(CameraImage cameraImage) async {
    try {
      final inputImage = _inputImageFromCameraImage(cameraImage);
      if (inputImage == null) {
        _logger.w("InputImage is null");
        return false;
      }

      final List<Face> faces = await _faceDetector.processImage(inputImage);
      _logger.d("Detected ${faces.length} faces");
      
      // Log thêm thông tin debug
      if (faces.isNotEmpty) {
        for (int i = 0; i < faces.length; i++) {
          final face = faces[i];
          _logger.d("Face $i: bounds = ${face.boundingBox}");
        }
      }
      
      return faces.isNotEmpty;
    } catch (e) {
      _logger.e("Lỗi xử lý hình ảnh: $e");
      return false;
    }
  }

  /// Chuyển đổi `CameraImage` sang `InputImage` của ML Kit.
  InputImage? _inputImageFromCameraImage(CameraImage cameraImage) {
    if (_cameras.isEmpty) return null;
    
    final camera = _cameras.firstWhere(
      (camera) => camera.lensDirection == CameraLensDirection.front,
      orElse: () => _cameras.first,
    );

    // Đơn giản hóa rotation logic
    InputImageRotation rotation = InputImageRotation.rotation0deg;
    
    // Xác định format - đơn giản hóa
    InputImageFormat format = InputImageFormat.yuv420;
    if (Platform.isIOS) {
      format = InputImageFormat.bgra8888;
    }

    try {
      // Sử dụng phương pháp đơn giản hơn
      final bytes = cameraImage.planes.fold<List<int>>(
        <int>[],
        (List<int> previousValue, Plane plane) => previousValue..addAll(plane.bytes),
      );

      return InputImage.fromBytes(
        bytes: Uint8List.fromList(bytes),
        metadata: InputImageMetadata(
          size: Size(cameraImage.width.toDouble(), cameraImage.height.toDouble()),
          rotation: rotation,
          format: format,
          bytesPerRow: cameraImage.planes.first.bytesPerRow,
        ),
      );
    } catch (e) {
      _logger.e("Lỗi tạo InputImage: $e");
      return null;
    }
  }

  /// Ghép nối các plane thành một mảng byte duy nhất
  Uint8List _concatenatePlanes(List<Plane> planes) {
    final WriteBuffer allBytes = WriteBuffer();
    for (final Plane plane in planes) {
      allBytes.putUint8List(plane.bytes);
    }
    return allBytes.done().buffer.asUint8List();
  }

  /// Chụp ảnh và chuyển đổi sang base64.
  Future<void> _captureImage() async {
    if (!_isCameraInitialized || _isCapturing) {
      return;
    }

    if (_isFaceDetected) {
      setState(() {
        _isCapturing = true;
      });

      try {
        final imageFile = await _cameraController?.takePicture();
        if (imageFile != null) {
          final bytes = await imageFile.readAsBytes();
          final imageData = base64Encode(bytes);
          widget.onImageCaptured?.call(imageData);
        }
      } catch (e) {
        _logger.e('Lỗi khi chụp ảnh: $e');
      } finally {
        if (mounted) {
          setState(() {
            _isCapturing = false;
          });
        }
      }
    } else {
      _logger.w('Không có khuôn mặt nào được phát hiện để chụp.');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isCameraInitialized || _cameraController == null || !_cameraController!.value.isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }

    // Tính toán tỷ lệ khung hình để tránh bị méo ảnh
    final size = MediaQuery.of(context).size;
    final deviceRatio = size.width / size.height;
    final cameraRatio = _cameraController!.value.aspectRatio;
    
    return Scaffold(
      body: Stack(
        children: [
          // Camera preview với aspect ratio đúng
          Container(
            width: size.width,
            height: size.height,
            child: FittedBox(
              fit: BoxFit.cover,
              child: SizedBox(
                width: size.width,
                height: size.width / cameraRatio,
                child: CameraPreview(_cameraController!),
              ),
            ),
          ),
          
          // Overlay chỉ báo trạng thái phát hiện khuôn mặt
          Positioned(
            top: MediaQuery.of(context).padding.top + 20,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: _isFaceDetected 
                    ? Colors.green.withOpacity(0.8)
                    : Colors.red.withOpacity(0.8),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _isFaceDetected ? 'Đã phát hiện khuôn mặt!' : 'Đang tìm kiếm khuôn mặt...',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          
          // Nút chụp ảnh
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: GestureDetector(
                onTap: _isFaceDetected ? _captureImage : null,
                child: Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isFaceDetected ? Colors.white : Colors.grey,
                    border: Border.all(
                      color: _isFaceDetected ? Colors.blue : Colors.grey,
                      width: 3,
                    ),
                  ),
                  child: _isCapturing
                      ? const CircularProgressIndicator(
                          color: Colors.blue,
                          strokeWidth: 2,
                        )
                      : Icon(
                          Icons.camera_alt,
                          size: 35,
                          color: _isFaceDetected ? Colors.blue : Colors.grey[600],
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}