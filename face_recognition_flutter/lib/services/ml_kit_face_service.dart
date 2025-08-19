import 'dart:typed_data';
import 'dart:math';
import 'dart:isolate';
import 'dart:async';
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

  // Optimized performance tracking
  int _frameProcessedCount = 0;
  int _frameDroppedCount = 0;

  // Processing control with reduced queue size
  bool _isProcessingFrame = false;
  final Queue<CameraImage> _frameQueue = Queue<CameraImage>();
  static const int _maxQueueSize = 2; // Reduced from 3

  Future<bool> initialize() async {
    try {
      if (_isInitialized) return true;

      _logger.i('🚀 Initializing Optimized ML Kit Face Service...');

      _faceDetector = FaceDetector(
        options: FaceDetectorOptions(
          enableContours: false, // Disabled for performance
          enableLandmarks: true,
          enableClassification: true,
          enableTracking: false, // Disabled for performance
          minFaceSize: 0.2, // Increased from 0.15
          performanceMode: FaceDetectorMode.fast,
        ),
      );

      _isInitialized = true;
      _logger.i('✅ Optimized ML Kit initialized');

      return true;
    } catch (e) {
      _logger.e('❌ ML Kit initialization error: $e');
      return false;
    }
  }

  Future<void> dispose() async {
    try {
      _frameQueue.clear();
      await _faceDetector.close();
      _isInitialized = false;
      _logger.i('✅ ML Kit disposed');
    } catch (e) {
      _logger.e('❌ ML Kit dispose error: $e');
    }
  }

  Future<FaceDetectionResult?> processCameraImage(CameraImage image) async {
    try {
      if (!_isInitialized) {
        await initialize();
      }

      // Skip processing if already busy and queue is full
      if (_isProcessingFrame && _frameQueue.length >= _maxQueueSize) {
        _frameDroppedCount++;
        return null;
      }

      // Add to queue if not processing
      if (!_isProcessingFrame) {
        return await _processImageDirectly(image);
      } else {
        _frameQueue.add(image);
        return null;
      }
    } catch (e) {
      _logger.e('❌ Face processing error: $e');
      return null;
    }
  }

  Future<FaceDetectionResult?> _processImageDirectly(CameraImage image) async {
    _isProcessingFrame = true;

    try {
      final inputImage = await compute(_convertCameraImageIsolate, {
        'image': image,
      });

      if (inputImage == null) {
        return null;
      }

      final faces = await _faceDetector.processImage(inputImage);

      FaceDetectionResult? result;

      if (faces.isNotEmpty) {
        final face = faces.first;
        final landmarks =
            _extractSimplifiedLandmarks(face); // Simplified extraction
        final confidence = _calculateConfidence(face);
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
      return result;
    } catch (e) {
      _logger.e('❌ Face processing error: $e');
      return null;
    } finally {
      _isProcessingFrame = false;

      // Process next frame in queue if available
      if (_frameQueue.isNotEmpty) {
        final nextImage = _frameQueue.removeFirst();
        Future.microtask(() => _processImageDirectly(nextImage));
      }
    }
  }

  // Static function for isolate processing
  static InputImage? _convertCameraImageIsolate(Map<String, dynamic> params) {
    final CameraImage image = params['image'];

    try {
      final bytes = _convertCameraImageToBytesStatic(image);

      InputImageRotation rotation;
      switch (image.format.group) {
        case ImageFormatGroup.yuv420:
          rotation = InputImageRotation.rotation90deg;
          break;
        case ImageFormatGroup.bgra8888:
          rotation = InputImageRotation.rotation0deg;
          break;
        default:
          rotation = InputImageRotation.rotation0deg;
      }

      final inputImageData = InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: image.format.group == ImageFormatGroup.yuv420
            ? InputImageFormat.nv21
            : InputImageFormat.bgra8888,
        bytesPerRow: image.planes[0].bytesPerRow,
      );

      return InputImage.fromBytes(
        bytes: bytes,
        metadata: inputImageData,
      );
    } catch (e) {
      debugPrint('❌ Image conversion error in isolate: $e');
      return null;
    }
  }

  static Uint8List _convertCameraImageToBytesStatic(CameraImage image) {
    if (image.format.group == ImageFormatGroup.yuv420) {
      return _convertYUV420ToBytesStatic(image);
    } else if (image.format.group == ImageFormatGroup.bgra8888) {
      return image.planes[0].bytes;
    } else {
      throw UnsupportedError('Unsupported image format: ${image.format.group}');
    }
  }

  static Uint8List _convertYUV420ToBytesStatic(CameraImage image) {
    final yPlane = image.planes[0];
    final uPlane = image.planes[1];
    final vPlane = image.planes[2];

    final ySize = yPlane.bytes.length;
    final uvSize = uPlane.bytes.length + vPlane.bytes.length;

    final bytes = Uint8List(ySize + uvSize);
    bytes.setRange(0, ySize, yPlane.bytes);

    int uvIndex = ySize;
    for (int i = 0; i < uPlane.bytes.length; i++) {
      bytes[uvIndex++] = uPlane.bytes[i];
      if (i < vPlane.bytes.length) {
        bytes[uvIndex++] = vPlane.bytes[i];
      }
    }

    return bytes;
  }

  // Simplified landmark extraction for better performance
  List<FaceLandmark> _extractSimplifiedLandmarks(Face face) {
    final landmarks = <FaceLandmark>[];

    // Only extract essential landmarks
    final faceLandmarks = face.landmarks;
    final essentialLandmarkTypes = [
      FaceLandmarkType.leftEye,
      FaceLandmarkType.rightEye,
      FaceLandmarkType.noseBase,
      FaceLandmarkType.leftMouth,
      FaceLandmarkType.rightMouth,
    ];

    for (final landmarkType in essentialLandmarkTypes) {
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

  double _calculateConfidence(Face face) {
    double confidence = 0.7; // Base confidence

    // Increase confidence for larger faces
    final faceArea = face.boundingBox.width * face.boundingBox.height;
    if (faceArea > 15000) {
      // Increased threshold
      confidence += 0.2;
    }

    // Consider head pose for confidence
    final headEulerAngleY = face.headEulerAngleY?.abs() ?? 0.0;
    final headEulerAngleX = face.headEulerAngleX?.abs() ?? 0.0;

    // Reduce confidence for extreme head poses
    if (headEulerAngleY > 30 || headEulerAngleX > 30) {
      confidence -= 0.1;
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
    const smileThreshold = 0.6; // Slightly reduced threshold
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
    const turnThreshold = 20.0; // Increased threshold for clearer detection

    bool detected = false;
    // Fixed: Corrected logic for front camera
    if (challengeType == LivenessChallengeType.turnLeft) {
      detected = headEulerAngleY < -turnThreshold; // Fixed: was >
    } else if (challengeType == LivenessChallengeType.turnRight) {
      detected = headEulerAngleY > turnThreshold; // Fixed: was <
    }

    return LivenessAnalysis(
      challengeType: challengeType,
      detected: detected,
      confidence:
          detected ? min(1.0, headEulerAngleY.abs() / turnThreshold) : 0.0,
      data: {
        'head_euler_angle_y': headEulerAngleY,
        'threshold': turnThreshold,
      },
    );
  }

  // New method: Analyze looking straight for anti-fraud
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

    const straightThresholdX = 12.0; // Giá trị cũ: 10.0
    const straightThresholdY = 12.0; // Giá trị cũ: 10.0

    final isLookingStraightX = headEulerAngleX.abs() < straightThresholdX;
    final isLookingStraightY = headEulerAngleY.abs() < straightThresholdY;
    final isLookingStraight = isLookingStraightX && isLookingStraightY;

    final confidenceX = isLookingStraightX
        ? 1.0 - (headEulerAngleX.abs() / straightThresholdX)
        : 0.0;
    final confidenceY = isLookingStraightY
        ? 1.0 - (headEulerAngleY.abs() / straightThresholdY)
        : 0.0;
    final confidence =
        isLookingStraight ? (confidenceX + confidenceY) / 2.0 : 0.0;

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
