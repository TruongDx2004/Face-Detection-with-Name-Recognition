import 'dart:math';
import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:logger/logger.dart';

class MLKitFaceService {
  static final MLKitFaceService _instance = MLKitFaceService._internal();
  factory MLKitFaceService() => _instance;
  MLKitFaceService._internal();

  final Logger _logger = Logger();
  late FaceDetector _faceDetector;
  bool _isInitialized = false;

  // Device-specific configurations
  bool _useAlternativeImageFormat = false;
  InputImageRotation? _deviceSpecificRotation;

  // Performance tracking
  int _frameProcessedCount = 0;
  int _frameDroppedCount = 0;
  int _faceDetectionFailures = 0;
  int _consecutiveNoFaceDetections = 0;
  int _consecutiveNullResults = 0;
  bool _hasTriedAlternativeSettings = false;
  bool _hasTriedReinitialization = false;

  // Optimized processing control
  bool _isProcessingFrame = false;
  final Queue<CameraImage> _frameQueue = Queue<CameraImage>();
  DateTime? _lastSuccessfulProcessTime;
  int _processingTimeMs = 0;

  Future<bool> initialize() async {
    try {
      if (_isInitialized) return true;

      // Detect device-specific configurations
      await _detectDeviceConfiguration();

      _faceDetector = FaceDetector(
        options: FaceDetectorOptions(
          enableContours: false,
          enableLandmarks: true,
          enableClassification: true,
          enableTracking: false,
          minFaceSize: 0.05, // Giảm xuống 5% để phát hiện face nhỏ hơn
          performanceMode: FaceDetectorMode.fast, // Thử fast mode trước
        ),
      );

      _isInitialized = true;
      
      return true;
    } catch (e) {
      _logger.e('❌ ML Kit initialization error: $e');
      return false;
    }
  }

  Future<void> _detectDeviceConfiguration() async {
    try {
      // Platform-specific optimizations
      if (Platform.isAndroid) {
        // For Android devices, especially newer ones
        _useAlternativeImageFormat = true;
      } else if (Platform.isIOS) {
        // For iOS devices
        _deviceSpecificRotation = InputImageRotation.rotation0deg;
      }
    } catch (e) {
      _logger.w('⚠️ Could not detect device configuration: $e');
    }
  }

  // Method để reinitialize ML Kit khi có vấn đề
  Future<bool> _reinitializeMLKit() async {
    try {
      // Dispose current detector safely
      try {
        await _faceDetector.close();
      } catch (e) {
        _logger.w('⚠️ Error disposing old detector: $e');
      }
      
      // Create new detector with same settings
      _faceDetector = FaceDetector(
        options: FaceDetectorOptions(
          enableContours: false,
          enableLandmarks: true,
          enableClassification: true,
          enableTracking: false,
          minFaceSize: 0.05,
          performanceMode: FaceDetectorMode.fast,
        ),
      );
      
      return true;
    } catch (e) {
      _logger.e('❌ Failed to reinitialize ML Kit: $e');
      return false;
    }
  }

  // Thêm method để test với cấu hình ML Kit khác
  Future<bool> reinitializeWithDifferentSettings() async {
    try {
      // Dispose current detector
      try {
        await _faceDetector.close();
      } catch (e) {
        _logger.w('⚠️ Error disposing detector: $e');
      }
      
      // Try with most permissive settings
      _faceDetector = FaceDetector(
        options: FaceDetectorOptions(
          enableContours: false,
          enableLandmarks: false, // Disable để tăng performance
          enableClassification: false, // Disable để tăng performance
          enableTracking: false,
          minFaceSize: 0.01, // Cực kỳ nhỏ - 1% của ảnh
          performanceMode: FaceDetectorMode.accurate, // Thử accurate mode
        ),
      );
      
      return true;
    } catch (e) {
      _logger.e('❌ Failed to reinitialize ML Kit: $e');
      return false;
    }
  }

  Future<void> dispose() async {
    try {
      _frameQueue.clear();
      await _faceDetector.close();
      _isInitialized = false;
    } catch (e) {
      _logger.e('❌ ML Kit dispose error: $e');
    }
  }

  Future<FaceDetectionResult?> processCameraImage(CameraImage image) async {
    try {
      // ignore: unnecessary_null_comparison
      if (image == null) {
        _logger.e('❌ CRITICAL: Camera image is completely NULL!');
        return null;
      }
      
      // Basic validation
      if (image.planes.isEmpty) {
        _logger.e('❌ CRITICAL: Image planes is NULL or EMPTY!');
        return null;
      }
      
      final width = image.width ?? 0;
      final height = image.height ?? 0;
      
      if (width <= 0 || height <= 0) {
        _logger.e('❌ CRITICAL: Invalid image dimensions: ${width}x$height');
        return null;
      }

      if (!_isInitialized) {
        final initResult = await initialize();
        if (!initResult) {
          _logger.e('❌ Failed to initialize ML Kit');
          return null;
        }
      }

      // Adaptive frame skipping based on processing performance
      final now = DateTime.now();
      
      // Skip frames if processing is too slow
      if (_lastSuccessfulProcessTime != null && _processingTimeMs > 150) {
        final timeSinceLastSuccess = now.difference(_lastSuccessfulProcessTime!).inMilliseconds;
        if (timeSinceLastSuccess < _processingTimeMs * 2) {
          _frameDroppedCount++;
          return null;
        }
      }

      // Skip processing if queue is full OR already processing
      if (_isProcessingFrame) {
        _frameDroppedCount++;
        return null;
      }

      // Process directly (no queueing for simplicity)
      return await _processImageDirectly(image);
    } catch (e) {
      _logger.e('❌ Face processing error: $e');
      _logger.e('Stack trace: ${StackTrace.current}');
      _faceDetectionFailures++;
      return null;
    }
  }

  Future<FaceDetectionResult?> _processImageDirectly(CameraImage image) async {
    _isProcessingFrame = true;
    final stopwatch = Stopwatch()..start();

    try {
      // Try multiple image conversion methods for better compatibility
      InputImage? inputImage = await _convertCameraImageWithFallback(image);

      if (inputImage == null) {
        _logger.e('❌ Image conversion failed completely');
        _faceDetectionFailures++;
        return null;
      }
      
      final faceStopwatch = Stopwatch()..start();
      List<Face>? faces;
      
      try {
        faces = await _faceDetector.processImage(inputImage);
        faceStopwatch.stop();
        
        // Reset null counter on successful processing
        if (_consecutiveNullResults > 0) {
          _consecutiveNullResults = 0;
        }
            } catch (e) {
        faceStopwatch.stop();
        _logger.e('❌ ML Kit processImage threw exception: $e');
        _logger.e('Stack trace: ${StackTrace.current}');
        _faceDetectionFailures++;
        return null;
      }

      if (faces.isEmpty) {
        _consecutiveNoFaceDetections++;
        
        // Tự động thử cấu hình khác sau 20 lần không phát hiện được
        if (_consecutiveNoFaceDetections >= 20 && !_hasTriedAlternativeSettings) {
          _hasTriedAlternativeSettings = true;
          
          final success = await reinitializeWithDifferentSettings();
          if (success) {
            _consecutiveNoFaceDetections = 0; // Reset counter
            
            // Retry detection với settings mới
            final retryFaces = await _faceDetector.processImage(inputImage);
            
            if (retryFaces.isNotEmpty) {
              // Update faces với kết quả mới
              faces.clear();
              faces.addAll(retryFaces);
            }
          }
        }
      } else {
        // Reset counter khi phát hiện được face
        _consecutiveNoFaceDetections = 0;
      }

      FaceDetectionResult? result;

      if (faces.isNotEmpty) {
        // Sort faces by size and take the largest one
        faces.sort((a, b) => (b.boundingBox.width * b.boundingBox.height)
            .compareTo(a.boundingBox.width * a.boundingBox.height));
        
        final face = faces.first;
        final landmarks = _extractLandmarks(face);
        final confidence = _calculateEnhancedConfidence(face, image);
        final boundingBox = _convertBoundingBox(face.boundingBox);

        result = FaceDetectionResult(
          hasFace: true,
          landmarks: landmarks,
          confidence: confidence,
          boundingBox: boundingBox,
          face: face,
        );
      } else {
        result = FaceDetectionResult(
          hasFace: false,
          landmarks: [],
          confidence: 0.0,
          boundingBox: null,
        );
      }

      _frameProcessedCount++;
      
      // Update processing time tracking
      _processingTimeMs = stopwatch.elapsedMilliseconds;
      if (result.hasFace) {
        _lastSuccessfulProcessTime = DateTime.now();
      }
      
      // Performance stats (removed debug logging)
      
      return result;
    } catch (e) {
      _logger.e('❌ Face processing error: $e');
      _logger.e('Stack trace: ${StackTrace.current}');
      _faceDetectionFailures++;
      return null;
    } finally {
      stopwatch.stop();
      _processingTimeMs = stopwatch.elapsedMilliseconds;
      _isProcessingFrame = false;
    }
  }

  Future<InputImage?> _convertCameraImageWithFallback(CameraImage image) async {
    try {
      final result = await _convertCameraImageMethod1(image);
      return result;
    } catch (e1) {
      _logger.w('⚠️ Primary conversion failed: $e1');
      
      try {
        final result = await _convertCameraImageMethod2(image);
        return result;
      } catch (e2) {
        _logger.e('❌ All conversion methods failed: $e2');
        return null;
      }
    }
  }

  Future<InputImage?> _convertCameraImageMethod1(CameraImage image) async {
    try {
      final bytes = _convertCameraImageToBytes(image);
      final rotation = _getImageRotation(image);
      final format = _getInputImageFormat(image);
      
      final inputImageData = InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: format,
        bytesPerRow: image.planes[0].bytesPerRow,
      );

      final inputImage = InputImage.fromBytes(
        bytes: bytes,
        metadata: inputImageData,
      );
      
      return inputImage;
    } catch (e) {
      _logger.e('❌ Method 1: Failed to convert image: $e');
      rethrow;
    }
  }

  Future<InputImage?> _convertCameraImageMethod2(CameraImage image) async {
    try {
      final bytes = _convertCameraImageToBytesAlternative(image);

      final inputImageData = InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: InputImageRotation.rotation0deg, // Try without rotation
        format: InputImageFormat.nv21,
        bytesPerRow: image.planes[0].bytesPerRow,
      );

      final inputImage = InputImage.fromBytes(
        bytes: bytes,
        metadata: inputImageData,
      );
      
      return inputImage;
    } catch (e) {
      _logger.e('❌ Method 2: Failed to convert image: $e');
      rethrow;
    }
  }

  InputImageRotation _getImageRotation(CameraImage image) {
    if (_deviceSpecificRotation != null) {
      return _deviceSpecificRotation!;
    }

    // Enhanced rotation detection
    switch (image.format.group) {
      case ImageFormatGroup.yuv420:
        return Platform.isIOS 
            ? InputImageRotation.rotation0deg 
            : InputImageRotation.rotation90deg;
      case ImageFormatGroup.bgra8888:
        return InputImageRotation.rotation0deg;
      default:
        return InputImageRotation.rotation0deg;
    }
  }

  InputImageFormat _getInputImageFormat(CameraImage image) {
    switch (image.format.group) {
      case ImageFormatGroup.yuv420:
        return InputImageFormat.nv21;
      case ImageFormatGroup.bgra8888:
        return InputImageFormat.bgra8888;
      default:
        return InputImageFormat.nv21;
    }
  }

  Uint8List _convertCameraImageToBytes(CameraImage image) {
    if (image.format.group == ImageFormatGroup.yuv420) {
      return _convertYUV420ToBytes(image);
    } else if (image.format.group == ImageFormatGroup.bgra8888) {
      return image.planes[0].bytes;
    } else {
      throw UnsupportedError('Unsupported image format: ${image.format.group}');
    }
  }

  Uint8List _convertCameraImageToBytesAlternative(CameraImage image) {
    // Alternative conversion method
    if (image.format.group == ImageFormatGroup.yuv420) {
      return _convertYUV420ToBytesAlternative(image);
    } else {
      return image.planes[0].bytes;
    }
  }

  Uint8List _convertYUV420ToBytes(CameraImage image) {
    try {
      if (image.planes.length < 3) {
        throw Exception('YUV420 requires at least 3 planes, got ${image.planes.length}');
      }
      
      final yPlane = image.planes[0];
      final uPlane = image.planes[1];
      final vPlane = image.planes[2];

      final ySize = yPlane.bytes.length;
      final uvSize = uPlane.bytes.length + vPlane.bytes.length;
      final totalSize = ySize + uvSize;

      final bytes = Uint8List(totalSize);
      bytes.setRange(0, ySize, yPlane.bytes);

      int uvIndex = ySize;
      final minUVLength = min(uPlane.bytes.length, vPlane.bytes.length);
      
      for (int i = 0; i < minUVLength; i++) {
        if (uvIndex < bytes.length) {
          bytes[uvIndex++] = uPlane.bytes[i];
        }
        if (uvIndex < bytes.length && i < vPlane.bytes.length) {
          bytes[uvIndex++] = vPlane.bytes[i];
        }
      }
      
      return bytes;
    } catch (e) {
      _logger.e('❌ YUV420 conversion failed: $e');
      rethrow;
    }
  }

  Uint8List _convertYUV420ToBytesAlternative(CameraImage image) {
    // More robust YUV420 conversion
    final yPlane = image.planes[0];
    final uPlane = image.planes[1];
    final vPlane = image.planes[2];

    final yBytes = yPlane.bytes;
    final uBytes = uPlane.bytes;
    final vBytes = vPlane.bytes;

    final totalSize = yBytes.length + ((uBytes.length + vBytes.length));
    final bytes = Uint8List(totalSize);

    // Copy Y plane
    bytes.setRange(0, yBytes.length, yBytes);

    // Interleave U and V planes
    int yuvIndex = yBytes.length;
    final uvLength = min(uBytes.length, vBytes.length);
    
    for (int i = 0; i < uvLength; i++) {
      if (yuvIndex < bytes.length) bytes[yuvIndex++] = uBytes[i];
      if (yuvIndex < bytes.length) bytes[yuvIndex++] = vBytes[i];
    }

    return bytes;
  }

  List<FaceLandmark> _extractLandmarks(Face face) {
    final landmarks = <FaceLandmark>[];

    // Extract all available landmarks for better accuracy
    final faceLandmarks = face.landmarks;
    final landmarkTypes = [
      FaceLandmarkType.leftEye,
      FaceLandmarkType.rightEye,
      FaceLandmarkType.noseBase,
      FaceLandmarkType.leftMouth,
      FaceLandmarkType.rightMouth,
      FaceLandmarkType.leftCheek,
      FaceLandmarkType.rightCheek,
    ];

    for (final landmarkType in landmarkTypes) {
      final landmark = faceLandmarks[landmarkType];
      if (landmark != null) {
        landmarks.add(FaceLandmark(
          x: landmark.position.x.toDouble(),
          y: landmark.position.y.toDouble(),
          z: 0.0,
        ));
      }
    }

    return landmarks;
  }

  double _calculateEnhancedConfidence(Face face, CameraImage image) {
    double confidence = 0.5; // Lower base confidence

    // Factor 1: Face size relative to image
    final imageArea = image.width * image.height;
    final faceArea = face.boundingBox.width * face.boundingBox.height;
    final faceRatio = faceArea / imageArea;
    
    if (faceRatio > 0.05) { // Face takes up at least 5% of image
      confidence += 0.2;
    }
    if (faceRatio > 0.1) { // Face takes up at least 10% of image
      confidence += 0.1;
    }

    // Factor 2: Landmark count
    final landmarkCount = face.landmarks.length;
    if (landmarkCount >= 3) {
      confidence += 0.1;
    }

    // Factor 3: Head pose (faces looking straight get higher confidence)
    final headEulerAngleY = face.headEulerAngleY?.abs() ?? 0.0;
    final headEulerAngleX = face.headEulerAngleX?.abs() ?? 0.0;
    
    if (headEulerAngleY < 15 && headEulerAngleX < 15) {
      confidence += 0.1;
    }

    // Factor 4: Classification probabilities
    final leftEyeOpenProbability = face.leftEyeOpenProbability ?? 1.0;
    final rightEyeOpenProbability = face.rightEyeOpenProbability ?? 1.0;
    
    if (leftEyeOpenProbability > 0.5 && rightEyeOpenProbability > 0.5) {
      confidence += 0.1;
    }

    return min(1.0, max(0.0, confidence));
  }

  BoundingBox _convertBoundingBox(Rect rect) {
    return BoundingBox(
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    );
  }

  // Enhanced liveness detection with new look straight analysis
  LivenessAnalysis analyzeLiveness(
      List<FaceLandmark> landmarks, LivenessChallengeType challengeType,
      {Face? face}) {
    switch (challengeType) {
      case LivenessChallengeType.smile:
        return _analyzeSmiling(face);
      case LivenessChallengeType.turnLeft:
      case LivenessChallengeType.turnRight:
        return _analyzeHeadTurn(face, challengeType);
      case LivenessChallengeType.lookStraight:
        return _analyzeLookStraight(face);
      // ignore: unreachable_switch_default
      default:
        return LivenessAnalysis(
          challengeType: challengeType,
          detected: false,
          confidence: 0.0,
          data: {'error': 'Unsupported challenge type'},
        );
    }
  }

  LivenessAnalysis _analyzeSmiling(Face? face) {
    if (face == null) {
      return LivenessAnalysis(
        challengeType: LivenessChallengeType.smile,
        detected: false,
        confidence: 0.0,
        data: {'error': 'No face detected'},
      );
    }

    final smilingProbability = face.smilingProbability ?? 0.0;
    const smileThreshold = 0.5; // Reduced threshold for easier detection
    final isSmiling = smilingProbability > smileThreshold;

    return LivenessAnalysis(
      challengeType: LivenessChallengeType.smile,
      detected: isSmiling,
      confidence: isSmiling ? smilingProbability : 0.0,
      data: {
        'smiling_probability': smilingProbability,
        'threshold': smileThreshold,
      },
    );
  }

  LivenessAnalysis _analyzeHeadTurn(
      Face? face, LivenessChallengeType challengeType) {
    if (face == null) {
      return LivenessAnalysis(
        challengeType: challengeType,
        detected: false,
        confidence: 0.0,
        data: {'error': 'No face detected'},
      );
    }

    final headEulerAngleY = face.headEulerAngleY ?? 0.0;
    const turnThreshold = 15.0; // Reduced from 20.0 for easier detection

    bool detected = false;
    if (challengeType == LivenessChallengeType.turnLeft) {
      detected = headEulerAngleY < -turnThreshold;
    } else if (challengeType == LivenessChallengeType.turnRight) {
      detected = headEulerAngleY > turnThreshold;
    }

    return LivenessAnalysis(
      challengeType: challengeType,
      detected: detected,
      confidence: detected ? min(1.0, headEulerAngleY.abs() / turnThreshold) : 0.0,
      data: {
        'head_euler_angle_y': headEulerAngleY,
        'threshold': turnThreshold,
      },
    );
  }

  LivenessAnalysis _analyzeLookStraight(Face? face) {
    if (face == null) {
      return LivenessAnalysis(
        challengeType: LivenessChallengeType.lookStraight,
        detected: false,
        confidence: 0.0,
        data: {'error': 'No face detected'},
      );
    }

    final headEulerAngleX = face.headEulerAngleX ?? 0.0;
    final headEulerAngleY = face.headEulerAngleY ?? 0.0;

    const straightThresholdX = 15.0; // Increased for easier detection
    const straightThresholdY = 15.0; // Increased for easier detection

    final isLookingStraightX = headEulerAngleX.abs() < straightThresholdX;
    final isLookingStraightY = headEulerAngleY.abs() < straightThresholdY;
    final isLookingStraight = isLookingStraightX && isLookingStraightY;

    final confidenceX = isLookingStraightX
        ? 1.0 - (headEulerAngleX.abs() / straightThresholdX)
        : 0.0;
    final confidenceY = isLookingStraightY
        ? 1.0 - (headEulerAngleY.abs() / straightThresholdY)
        : 0.0;
    final confidence = isLookingStraight ? (confidenceX + confidenceY) / 2.0 : 0.0;

    return LivenessAnalysis(
      challengeType: LivenessChallengeType.lookStraight,
      detected: isLookingStraight,
      confidence: confidence,
      data: {
        'head_euler_angle_x': headEulerAngleX,
        'head_euler_angle_y': headEulerAngleY,
        'threshold_x': straightThresholdX,
        'threshold_y': straightThresholdY,
        'looking_straight_x': isLookingStraightX,
        'looking_straight_y': isLookingStraightY,
      },
    );
  }

  // Debugging method to get detailed face detection info
  Map<String, dynamic> getDebugInfo() {
    return {
      'frames_processed': _frameProcessedCount,
      'frames_dropped': _frameDroppedCount,
      'detection_failures': _faceDetectionFailures,
      'success_rate': _frameProcessedCount > 0 
          ? '${((_frameProcessedCount - _faceDetectionFailures) / _frameProcessedCount * 100).toStringAsFixed(1)}%'
          : '0%',
      'device_config': {
        'use_alternative_format': _useAlternativeImageFormat,
        'device_specific_rotation': _deviceSpecificRotation?.toString(),
        'platform': Platform.operatingSystem,
      }
    };
  }
}

// Optimized Queue class
class Queue<T> {
  final List<T> _items = <T>[];

  void add(T item) => _items.add(item);
  T removeFirst() => _items.removeAt(0);
  bool get isNotEmpty => _items.isNotEmpty;
  bool get isEmpty => _items.isEmpty;
  int get length => _items.length;
  void clear() => _items.clear();
}

// Enhanced FaceDetectionResult
class FaceDetectionResult {
  final bool hasFace;
  final List<FaceLandmark> landmarks;
  final double confidence;
  final BoundingBox? boundingBox;
  final Face? face;

  FaceDetectionResult({
    required this.hasFace,
    required this.landmarks,
    required this.confidence,
    this.boundingBox,
    this.face,
  });
}

class FaceLandmark {
  final double x;
  final double y;
  final double z;

  FaceLandmark({required this.x, required this.y, required this.z});
}

class BoundingBox {
  final double left;
  final double top;
  final double right;
  final double bottom;

  BoundingBox({
    required this.left,
    required this.top,
    required this.right,
    required this.bottom,
  });
}

class LivenessAnalysis {
  final LivenessChallengeType challengeType;
  final bool detected;
  final double confidence;
  final Map<String, dynamic> data;

  LivenessAnalysis({
    required this.challengeType,
    required this.detected,
    required this.confidence,
    required this.data,
  });
}

// Enhanced enum with new lookStraight type
enum LivenessChallengeType {
  smile,
  turnLeft,
  turnRight,
  lookStraight, // New type for anti-fraud
}
