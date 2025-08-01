import 'dart:html' as html;
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'dart:ui_web' as ui_web;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'dart:js' as js;

/// Web version của face detector sử dụng HTML5 camera
class WebFaceDetector extends StatefulWidget {
  final Function(String imageData)? onImageCaptured;
  final Function(bool isFaceDetected)? onFaceDetected;

  const WebFaceDetector({
    super.key,
    this.onImageCaptured,
    this.onFaceDetected,
  });

  @override
  State<WebFaceDetector> createState() => _WebFaceDetectorState();
}

class _WebFaceDetectorState extends State<WebFaceDetector> {
  html.VideoElement? _videoElement;
  html.CanvasElement? _canvasElement;
  html.MediaStream? _stream;
  bool _isInitialized = false;
  bool _isFaceDetected = false;
  bool _isCapturing = false;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      // Tạo video element
      _videoElement = html.VideoElement()
        ..width = 640
        ..height = 480
        ..autoplay = true
        ..muted = true;

      // Tạo canvas element cho capture
      _canvasElement = html.CanvasElement(width: 640, height: 480);

      // Request camera access
      _stream = await html.window.navigator.mediaDevices!.getUserMedia({
        'video': {
          'width': 640,
          'height': 480,
          'facingMode': 'user', // Front camera
        }
      });

      _videoElement!.srcObject = _stream;
      await _videoElement!.play();

      // Register video element với Flutter
      ui_web.platformViewRegistry.registerViewFactory(
        'video-element',
        (int viewId) => _videoElement!,
      );

      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
        _startFaceDetection();
      }
    } catch (e) {
      print('Error initializing camera: $e');
    }
  }

  void _startFaceDetection() {
    // Simulate face detection (vì không có ML Kit trên web)
    // Trong thực tế, bạn có thể sử dụng TensorFlow.js hoặc MediaPipe
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isFaceDetected = true;
        });
        widget.onFaceDetected?.call(true);
      }
    });
  }

  Future<void> _captureImage() async {
    if (!_isInitialized || _isCapturing || !_isFaceDetected) return;

    setState(() {
      _isCapturing = true;
    });

    try {
      final context = _canvasElement!.context2D;
      
      // Draw video frame to canvas
      context.drawImageScaled(
        _videoElement!,
        0, 0,
        _canvasElement!.width!,
        _canvasElement!.height!,
      );

      // Convert canvas to base64
      final dataUrl = _canvasElement!.toDataUrl('image/jpeg', 0.8);
      final base64Data = dataUrl.split(',')[1]; // Remove data:image/jpeg;base64,

      widget.onImageCaptured?.call(base64Data);
      
      // Show capture feedback
      _showCaptureEffect();
      
    } catch (e) {
      print('Error capturing image: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isCapturing = false;
        });
      }
    }
  }

  void _showCaptureEffect() {
    // Simple flash effect
    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => Container(
          color: Colors.white,
          child: const Center(
            child: Text(
              '📸',
              style: TextStyle(fontSize: 100),
            ),
          ),
        ),
      );
      
      Future.delayed(const Duration(milliseconds: 200), () {
        if (mounted) {
          Navigator.of(context).pop();
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 20),
              Text('Initializing camera...'),
              SizedBox(height: 10),
              Text(
                'Please allow camera access when prompted',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          // Video stream
          Positioned.fill(
            child: HtmlElementView(viewType: 'video-element'),
          ),
          
          // Status overlay
          Positioned(
            top: 50,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: _isFaceDetected
                    ? Colors.green.withOpacity(0.9)
                    : Colors.red.withOpacity(0.9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    _isFaceDetected ? Icons.face : Icons.face_retouching_off,
                    color: Colors.white,
                    size: 24,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    _isFaceDetected 
                        ? 'Face detected! Ready to capture' 
                        : 'Looking for faces...',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Capture button
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: GestureDetector(
                onTap: _isFaceDetected ? _captureImage : null,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isFaceDetected ? Colors.white : Colors.grey,
                    border: Border.all(
                      color: _isFaceDetected ? Colors.blue : Colors.grey,
                      width: 4,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black26,
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: _isCapturing
                      ? const CircularProgressIndicator(
                          color: Colors.blue,
                          strokeWidth: 3,
                        )
                      : Icon(
                          Icons.camera_alt,
                          size: 40,
                          color: _isFaceDetected ? Colors.blue : Colors.grey[600],
                        ),
                ),
              ),
            ),
          ),
          
          // Web notice
          Positioned(
            bottom: 150,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.8),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'Web Version: Face detection is simulated. For full ML functionality, use mobile app.',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                ),
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
    _stream?.getTracks().forEach((track) => track.stop());
    super.dispose();
  }
}