import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:path_provider/path_provider.dart';
import 'package:image/image.dart' as img;

/// Widget để thu thập dataset khuôn mặt tự động từ camera
/// Tương tự như code Python OpenCV nhưng sử dụng ML Kit
class FaceDatasetCollector extends StatefulWidget {
 final String userId;
 final int maxSamples;
 final Function(String imagePath)? onImageCaptured;
 final Function(int count)? onProgressUpdate;
 final VoidCallback? onCompleted;

 const FaceDatasetCollector({
  super.key,
  required this.userId,
  this.maxSamples = 30,
  this.onImageCaptured,
  this.onProgressUpdate,
  this.onCompleted,
 });

 @override
 State<FaceDatasetCollector> createState() => _FaceDatasetCollectorState();
}

class _FaceDatasetCollectorState extends State<FaceDatasetCollector> {
 CameraController? _controller;
 late FaceDetector _faceDetector;
 
 bool _isInitialized = false;
 bool _isPlatformSupported = false; // Thêm biến kiểm tra nền tảng
 bool _isProcessing = false;
 bool _isCollecting = false;
 bool _isUploading = false;
 
 int _capturedCount = 0;
 String? _datasetDir;
 
 List<Rect> _detectedFaces = [];

 @override
 void initState() {
  super.initState();
  _initializeFaceDetector();
  _initializeCamera();
  if (_isPlatformSupported) {
   _createDatasetDirectory();
  }
 }

 void _initializeFaceDetector() {
  _faceDetector = FaceDetector(
   options: FaceDetectorOptions(
    performanceMode: FaceDetectorMode.accurate,
    minFaceSize: 0.1,
    enableContours: false,
    enableLandmarks: false,
    enableClassification: false,
    enableTracking: false,
   ),
  );
 }

 Future<void> _initializeCamera() async {
  // Kiểm tra xem nền tảng có được hỗ trợ không
  if (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS) {
   _isPlatformSupported = true;
   try {
    final cameras = await availableCameras();
    final frontCamera = cameras.firstWhere(
     (camera) => camera.lensDirection == CameraLensDirection.front,
     orElse: () => cameras.first,
    );

    _controller = CameraController(
     frontCamera,
     ResolutionPreset.medium,
     enableAudio: false,
    );

    await _controller!.initialize();
    
    if (mounted) {
     setState(() {
      _isInitialized = true;
     });
    }
   } catch (e) {
    print('Error initializing camera: $e');
   }
  } else {
   // Nếu không được hỗ trợ, chỉ cần cập nhật trạng thái
   if (mounted) {
    setState(() {
     _isInitialized = true;
     _isPlatformSupported = false;
    });
   }
  }
 }

 Future<void> _createDatasetDirectory() async {
  try {
   final appDir = await getApplicationDocumentsDirectory();
   _datasetDir = '${appDir.path}/dataset';
   final dir = Directory(_datasetDir!);
   if (!await dir.exists()) {
    await dir.create(recursive: true);
   }
  } catch (e) {
   print('Error creating dataset directory: $e');
  }
 }

 void _startCollection() {
  if (!_isInitialized || !_isPlatformSupported || _controller == null) return;
  
  setState(() {
   _isCollecting = true;
   _capturedCount = 0;
  });

  _startImageStream();
 }

 void _stopCollection() {
  setState(() {
   _isCollecting = false;
  });
  _controller?.stopImageStream();
  if (widget.onCompleted != null) {
   _sendDataToApi(); // Gửi dữ liệu khi hoàn tất
  }
 }

 void _startImageStream() {
  _controller?.startImageStream((CameraImage image) async {
   if (!_isCollecting || _isProcessing || _capturedCount >= widget.maxSamples) {
    if (_capturedCount >= widget.maxSamples) {
     _stopCollection();
    }
    return;
   }

   _isProcessing = true;

   try {
    final inputImage = _convertCameraImage(image);
    if (inputImage != null) {
     final faces = await _faceDetector.processImage(inputImage);
     
     if (mounted) {
      setState(() {
       _detectedFaces = faces.map((face) => face.boundingBox).toList();
      });

      // Nếu phát hiện được khuôn mặt, tự động chụp ảnh
      if (faces.isNotEmpty && _capturedCount < widget.maxSamples) {
       await _captureAndSaveFace(image, faces.first);
      }
     }
    }
   } catch (e) {
    print('Error processing image: $e');
   } finally {
    _isProcessing = false;
   }
  });
 }

 InputImage? _convertCameraImage(CameraImage image) {
  try {
   final camera = _controller!.description;
   final plane = image.planes.first;

   // Determine rotation
   InputImageRotation rotation = InputImageRotation.rotation0deg;
   if (Platform.isAndroid) {
    if (camera.lensDirection == CameraLensDirection.front) {
     rotation = InputImageRotation.rotation270deg;
    } else {
     rotation = InputImageRotation.rotation90deg;
    }
   }

   // Determine format
   final InputImageFormat? format = _getImageFormat(image.format.group);
   if (format == null) return null;

   // Get bytes
   final bytes = plane.bytes;

   return InputImage.fromBytes(
    bytes: bytes,
    metadata: InputImageMetadata(
     size: Size(image.width.toDouble(), image.height.toDouble()),
     rotation: rotation,
     format: format,
     bytesPerRow: plane.bytesPerRow,
    ),
   );
  } catch (e) {
   print('Error converting camera image: $e');
   return null;
  }
 }

 InputImageFormat? _getImageFormat(ImageFormatGroup formatGroup) {
  if (formatGroup == ImageFormatGroup.bgra8888) {
   return InputImageFormat.bgra8888;
  } else if (formatGroup == ImageFormatGroup.yuv420) {
   return InputImageFormat.yuv420;
  } 
  return null;
 }

 Future<void> _captureAndSaveFace(CameraImage cameraImage, Face face) async {
  try {
   if (_datasetDir == null) return;
   
   final inputImage = _convertCameraImage(cameraImage);
   if (inputImage == null) return;

   final img.Image? image = await _convertInputImageToImage(inputImage);
   if (image == null) return;

   // Extract face region
   final faceRect = face.boundingBox;
   final int x = faceRect.left.toInt().clamp(0, image.width - 1);
   final int y = faceRect.top.toInt().clamp(0, image.height - 1);
   final int width = faceRect.width.toInt().clamp(1, image.width - x);
   final int height = faceRect.height.toInt().clamp(1, image.height - y);

   // Crop face
   final faceImage = img.copyCrop(image, x: x, y: y, width: width, height: height);
   
   // Convert to grayscale (similar to OpenCV)
   final grayFace = img.grayscale(faceImage);

   // Resize to standard size (similar to OpenCV preprocessing)
   final resizedFace = img.copyResize(grayFace, width: 100, height: 100);

   // Save image
   _capturedCount++;
   final filename = 'User.${widget.userId}.${_capturedCount}.jpg';
   final filepath = '$_datasetDir/$filename';
   
   final file = File(filepath);
   await file.writeAsBytes(img.encodeJpg(resizedFace));

   print('Saved face image: $filename');
   
   widget.onImageCaptured?.call(filepath);
   widget.onProgressUpdate?.call(_capturedCount);

   // Add delay to avoid capturing too many similar images
   await Future.delayed(const Duration(milliseconds: 500));

  } catch (e) {
   print('Error capturing face: $e');
  }
 }
 
 // Helper function to convert InputImage to an Image object
 Future<img.Image?> _convertInputImageToImage(InputImage inputImage) async {
  final bytes = inputImage.bytes;
  if (bytes == null) return null;
  
  final image = img.Image.fromBytes(
   width: inputImage.metadata!.size.width.toInt(),
   height: inputImage.metadata!.size.height.toInt(),
   bytes: bytes.buffer,
   format: img.Format.uint8,
  );
  
  // Apply rotation based on metadata
  switch (inputImage.metadata!.rotation) {
   case InputImageRotation.rotation90deg:
    return img.copyRotate(image, angle: 90);
   case InputImageRotation.rotation180deg:
    return img.copyRotate(image, angle: 180);
   case InputImageRotation.rotation270deg:
    return img.copyRotate(image, angle: 270);
   case InputImageRotation.rotation0deg:
    return image;
  }
 }

 Future<void> _sendDataToApi() async {
  if (_datasetDir == null) return;

  setState(() {
   _isUploading = true;
  });
  
  try {
   final dir = Directory(_datasetDir!);
   final imageFiles = dir.listSync().whereType<File>().toList();
   
   final List<String> base64Images = [];
   for (var file in imageFiles) {
    final bytes = await file.readAsBytes();
    base64Images.add(base64Encode(bytes));
   }

   final url = Uri.parse('http://your-api-server-ip/student/register-face');
   final headers = {'Content-Type': 'application/json'};
   final body = jsonEncode({'images': base64Images});
   
   final response = await http.post(url, headers: headers, body: body);

   if (response.statusCode == 200) {
    print('API call successful: ${response.body}');
    
    // Xóa các file ảnh đã lưu sau khi gửi thành công
    await dir.delete(recursive: true);
   } else {
    print('API call failed with status ${response.statusCode}: ${response.body}');
    throw Exception('Failed to register face: ${response.body}');
   }
  } catch (e) {
   print('Error sending data to API: $e');
   ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Failed to register face: $e')),
   );
  } finally {
   setState(() {
    _isUploading = false;
   });
   widget.onCompleted?.call();
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
       Text('Initializing...'),
      ],
     ),
    ),
   );
  }
  
  if (!_isPlatformSupported) {
   return const Scaffold(
    body: Center(
     child: Padding(
      padding: EdgeInsets.all(20),
      child: Text(
       'Camera functionality is not supported on this platform. Please run this app on an Android or iOS device.',
       textAlign: TextAlign.center,
       style: TextStyle(fontSize: 18, color: Colors.red),
      ),
     ),
    ),
   );
  }

  if (_isUploading) {
   return Scaffold(
    body: Center(
     child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: const [
       CircularProgressIndicator(),
       SizedBox(height: 20),
       Text('Uploading data to API...'),
      ],
     ),
    ),
   );
  }

  return Scaffold(
   appBar: AppBar(
    title: Text('Face Dataset Collection - User ${widget.userId}'),
    backgroundColor: Colors.blue,
   ),
   body: Stack(
    fit: StackFit.expand,
    children: [
     // Camera preview
     CameraPreview(_controller!),
     
     // Face detection overlay
     CustomPaint(
      painter: FaceDetectionPainter(_detectedFaces),
     ),
     
     // Status overlay
     Positioned(
      top: 20,
      left: 20,
      right: 20,
      child: Container(
       padding: const EdgeInsets.all(15),
       decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(10),
       ),
       child: Column(
        children: [
         Text(
          _isCollecting ? 'COLLECTING DATASET...' : 'READY TO COLLECT',
          style: TextStyle(
           color: _isCollecting ? Colors.green : Colors.white,
           fontSize: 18,
           fontWeight: FontWeight.bold,
          ),
         ),
         const SizedBox(height: 5),
         Text(
          'Captured: $_capturedCount / ${widget.maxSamples}',
          style: const TextStyle(color: Colors.white, fontSize: 16),
         ),
         if (_detectedFaces.isNotEmpty)
          Text(
           'Faces detected: ${_detectedFaces.length}',
           style: const TextStyle(color: Colors.yellow, fontSize: 14),
          ),
        ],
       ),
      ),
     ),
     
     // Control buttons
     Positioned(
      bottom: 40,
      left: 0,
      right: 0,
      child: Row(
       mainAxisAlignment: MainAxisAlignment.spaceEvenly,
       children: [
        // Start/Stop button
        ElevatedButton(
         onPressed: _isCollecting ? _stopCollection : _startCollection,
         style: ElevatedButton.styleFrom(
          backgroundColor: _isCollecting ? Colors.red : Colors.green,
          padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
         ),
         child: Text(
          _isCollecting ? 'STOP' : 'START',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
         ),
        ),
        
        // Progress indicator
        if (_isCollecting)
         Container(
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
           color: Colors.blue,
           borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
           '${((_capturedCount / widget.maxSamples) * 100).toInt()}%',
           style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
           ),
          ),
         ),
       ],
      ),
     ),
    ],
   ),
  );
 }

 @override
 void dispose() {
  if (_isPlatformSupported && _controller != null) {
   _controller!.dispose();
  }
  _faceDetector.close();
  super.dispose();
 }
}

// Custom painter để vẽ khung xung quanh khuôn mặt
class FaceDetectionPainter extends CustomPainter {
 final List<Rect> faces;

 FaceDetectionPainter(this.faces);

 @override
 void paint(Canvas canvas, Size size) {
  final paint = Paint()
   ..color = Colors.blue
   ..strokeWidth = 3.0
   ..style = PaintingStyle.stroke;

  for (final face in faces) {
   canvas.drawRect(face, paint);
   
   // Draw sample counter text
   final textPainter = TextPainter(
    text: const TextSpan(
     text: 'Face Detected',
     style: TextStyle(
      color: Colors.blue,
      fontSize: 16,
      fontWeight: FontWeight.bold,
     ),
    ),
    textDirection: TextDirection.ltr,
   );
   textPainter.layout();
   textPainter.paint(canvas, Offset(face.left, face.top - 25));
  }
 }

 @override
 bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
