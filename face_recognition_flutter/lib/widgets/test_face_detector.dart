// Test đơn giản để kiểm tra face detection
import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

class SimpleFaceTest extends StatefulWidget {
  @override
  _SimpleFaceTestState createState() => _SimpleFaceTestState();
}

class _SimpleFaceTestState extends State<SimpleFaceTest> {
  CameraController? _controller;
  bool _faceDetected = false;
  late FaceDetector _faceDetector;

  @override
  void initState() {
    super.initState();
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        performanceMode: FaceDetectorMode.accurate, // Thay đổi sang accurate
        minFaceSize: 0.05, // Giảm kích thước tối thiểu
        enableContours: false,
        enableLandmarks: false,
        enableClassification: false,
        enableTracking: false,
      ),
    );
    _initCamera();
  }

  Future<void> _initCamera() async {
    final cameras = await availableCameras();
    final frontCamera = cameras.firstWhere(
      (camera) => camera.lensDirection == CameraLensDirection.front,
      orElse: () => cameras.first,
    );

    _controller = CameraController(frontCamera, ResolutionPreset.medium); // Thay đổi từ low sang medium
    await _controller!.initialize();
    
    if (mounted) {
      setState(() {});
      _startImageStream();
    }
  }

  void _startImageStream() {
    _controller!.startImageStream((CameraImage image) async {
      try {
        final inputImage = _convertCameraImage(image);
        if (inputImage == null) {
          print('Failed to convert camera image');
          return;
        }

        final faces = await _faceDetector.processImage(inputImage);
        
        if (mounted && _faceDetected != faces.isNotEmpty) {
          setState(() {
            _faceDetected = faces.isNotEmpty;
          });
          print('Faces detected: ${faces.length}');
          if (faces.isNotEmpty) {
            for (int i = 0; i < faces.length; i++) {
              print('Face $i bounds: ${faces[i].boundingBox}');
            }
          }
        }
      } catch (e) {
        print('Error: $e');
      }
    });
  }

  InputImage? _convertCameraImage(CameraImage image) {
    final camera = _controller!.description;
    
    // Xác định rotation
    InputImageRotation rotation = InputImageRotation.rotation0deg;
    if (camera.lensDirection == CameraLensDirection.front) {
      switch (camera.sensorOrientation) {
        case 90:
          rotation = InputImageRotation.rotation270deg;
          break;
        case 180:
          rotation = InputImageRotation.rotation180deg;
          break;
        case 270:
          rotation = InputImageRotation.rotation90deg;
          break;
        default:
          rotation = InputImageRotation.rotation0deg;
      }
    } else {
      switch (camera.sensorOrientation) {
        case 90:
          rotation = InputImageRotation.rotation90deg;
          break;
        case 180:
          rotation = InputImageRotation.rotation180deg;
          break;
        case 270:
          rotation = InputImageRotation.rotation270deg;
          break;
        default:
          rotation = InputImageRotation.rotation0deg;
      }
    }

    // Xác định format
    InputImageFormat format = InputImageFormat.yuv420;
    if (image.format.group == ImageFormatGroup.bgra8888) {
      format = InputImageFormat.bgra8888;
    }

    // Tạo InputImage với plane đầu tiên (Y plane cho YUV420)
    final plane = image.planes.first;
    
    return InputImage.fromBytes(
      bytes: plane.bytes,
      metadata: InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: format,
        bytesPerRow: plane.bytesPerRow,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_controller == null || !_controller!.value.isInitialized) {
      return Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      body: Stack(
        children: [
          CameraPreview(_controller!),
          Positioned(
            top: 50,
            left: 20,
            right: 20,
            child: Container(
              padding: EdgeInsets.all(10),
              color: _faceDetected ? Colors.green : Colors.red,
              child: Text(
                _faceDetected ? 'FACE DETECTED!' : 'No face detected',
                style: TextStyle(color: Colors.white, fontSize: 20),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    _faceDetector.close();
    super.dispose();
  }
}