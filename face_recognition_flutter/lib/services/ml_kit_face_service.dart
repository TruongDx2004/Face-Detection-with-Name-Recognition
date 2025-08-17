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
  
  // Performance tracking
  final Stopwatch _performanceTimer = Stopwatch();
  int _frameProcessedCount = 0;
  int _frameDroppedCount = 0;
  DateTime _lastPerformanceLog = DateTime.now();
  
  // Processing control
  bool _isProcessingFrame = false;
  final Queue<CameraImage> _frameQueue = Queue<CameraImage>();
  static const int _maxQueueSize = 3;
  Timer? _performanceLogTimer;

  Future<bool> initialize() async {
    try {
      if (_isInitialized) return true;
      
      _logger.i('🚀 Initializing ML Kit Face Service...');
      final initStopwatch = Stopwatch()..start();
      
      _faceDetector = FaceDetector(
        options: FaceDetectorOptions(
          enableContours: true,
          enableLandmarks: true,
          enableClassification: true,
          enableTracking: true,
          minFaceSize: 0.15,
          performanceMode: FaceDetectorMode.fast, // Fast mode for better performance
        ),
      );
      
      initStopwatch.stop();
      _isInitialized = true;
      
      _logger.i('✅ ML Kit Face Service initialized in ${initStopwatch.elapsedMilliseconds}ms');
      
      // Start performance monitoring
      _startPerformanceMonitoring();
      
      return true;
    } catch (e) {
      _logger.e('❌ ML Kit initialization error: $e');
      return false;
    }
  }

  void _startPerformanceMonitoring() {
    _performanceLogTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _logPerformanceStats();
    });
  }

  void _logPerformanceStats() {
    final now = DateTime.now();
    final duration = now.difference(_lastPerformanceLog);
    final fps = _frameProcessedCount / duration.inSeconds;
    
    _logger.i('''
📊 PERFORMANCE STATS (${duration.inSeconds}s):
   • Frames processed: $_frameProcessedCount
   • Frames dropped: $_frameDroppedCount
   • Processing FPS: ${fps.toStringAsFixed(1)}
   • Queue size: ${_frameQueue.length}
   • Is processing: $_isProcessingFrame
   • Drop rate: ${(_frameDroppedCount / (_frameProcessedCount + _frameDroppedCount) * 100).toStringAsFixed(1)}%
''');
    
    _frameProcessedCount = 0;
    _frameDroppedCount = 0;
    _lastPerformanceLog = now;
  }

  Future<void> dispose() async {
    try {
      _logger.i('🧹 Disposing ML Kit Face Service...');
      
      _performanceLogTimer?.cancel();
      _frameQueue.clear();
      await _faceDetector.close();
      _isInitialized = false;
      
      _logger.i('✅ ML Kit Face Service disposed');
    } catch (e) {
      _logger.e('❌ ML Kit dispose error: $e');
    }
  }

  // Optimized frame processing với queue management
  Future<FaceDetectionResult?> processCameraImage(CameraImage image) async {
    try {
      if (!_isInitialized) {
        await initialize();
      }

      // Skip processing if already busy and queue is full
      if (_isProcessingFrame && _frameQueue.length >= _maxQueueSize) {
        _frameDroppedCount++;
        _logger.w('⚠️ Frame dropped - processing busy, queue full (${_frameQueue.length})');
        return null;
      }

      // Add to queue if not processing
      if (!_isProcessingFrame) {
        return await _processImageDirectly(image);
      } else {
        // Queue for later processing
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
    _performanceTimer.start();
    
    try {
      final inputImage = await compute(_convertCameraImageIsolate, {
        'image': image,
        'logger': false, // Don't pass logger to isolate
      });
      
      if (inputImage == null) {
        _logger.w('⚠️ Image conversion failed');
        return null;
      }

      _logger.d('🔍 Processing face detection...');
      final detectionStart = Stopwatch()..start();
      
      final faces = await _faceDetector.processImage(inputImage);
      
      detectionStart.stop();
      _logger.d('✅ Face detection completed in ${detectionStart.elapsedMilliseconds}ms - Found ${faces.length} faces');
      
      FaceDetectionResult? result;
      
      if (faces.isNotEmpty) {
        final face = faces.first;
        final landmarks = _extractLandmarks(face);
        final confidence = _calculateConfidence(face);
        final boundingBox = _convertBoundingBox(face.boundingBox);
        
        result = FaceDetectionResult(
          hasFace: true,
          landmarks: landmarks,
          confidence: confidence,
          boundingBox: boundingBox,
          face: face,
        );
        
        _logger.d('👤 Face detected: confidence=${confidence.toStringAsFixed(2)}, landmarks=${landmarks.length}, bbox=${boundingBox.left},${boundingBox.top},${boundingBox.right},${boundingBox.bottom}');
      } else {
        result = FaceDetectionResult(
          hasFace: false,
          landmarks: [],
          confidence: 0.0,
          boundingBox: null,
        );
        _logger.d('👻 No face detected');
      }

      _frameProcessedCount++;
      return result;
      
    } catch (e) {
      _logger.e('❌ Face processing error in _processImageDirectly: $e');
      return null;
    } finally {
      _performanceTimer.stop();
      _isProcessingFrame = false;
      
      // Process next frame in queue if available
      if (_frameQueue.isNotEmpty) {
        final nextImage = _frameQueue.removeFirst();
        // Process in next frame to avoid blocking
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
      // Can't use logger in isolate
      debugPrint('❌ Image conversion error in isolate: $e');
      return null;
    }
  }

  InputImage? _convertCameraImage(CameraImage image) {
    try {
      _logger.d('🔄 Converting camera image: ${image.width}x${image.height}, format=${image.format.group}');
      
      final conversionStart = Stopwatch()..start();
      final bytes = _convertCameraImageToBytes(image);
      conversionStart.stop();
      
      _logger.d('✅ Image conversion completed in ${conversionStart.elapsedMilliseconds}ms, bytes=${bytes.length}');
      
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
      _logger.e('❌ Image conversion error: $e');
      return null;
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

  // Static version for isolate
  static Uint8List _convertCameraImageToBytesStatic(CameraImage image) {
    if (image.format.group == ImageFormatGroup.yuv420) {
      return _convertYUV420ToBytesStatic(image);
    } else if (image.format.group == ImageFormatGroup.bgra8888) {
      return image.planes[0].bytes;
    } else {
      throw UnsupportedError('Unsupported image format: ${image.format.group}');
    }
  }

  Uint8List _convertYUV420ToBytes(CameraImage image) {
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

  // Static version for isolate
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

  List<FaceLandmark> _extractLandmarks(Face face) {
    final extractionStart = Stopwatch()..start();
    final landmarks = <FaceLandmark>[];
    
    // Extract landmarks from ML Kit Face
    final faceContours = face.contours;
    int contourPointCount = 0;
    
    for (final contourType in FaceContourType.values) {
      final contour = faceContours[contourType];
      if (contour != null) {
        for (final point in contour.points) {
          landmarks.add(FaceLandmark(
            x: point.x.toDouble(),
            y: point.y.toDouble(),
            z: 0.0, // ML Kit doesn't provide Z coordinate
          ));
          contourPointCount++;
        }
      }
    }

    // Add facial landmarks
    final faceLandmarks = face.landmarks;
    int landmarkPointCount = 0;
    
    for (final landmarkType in FaceLandmarkType.values) {
      final landmark = faceLandmarks[landmarkType];
      if (landmark != null) {
        landmarks.add(FaceLandmark(
          x: landmark.position.x.toDouble(),
          y: landmark.position.y.toDouble(),
          z: 0.0,
        ));
        landmarkPointCount++;
      }
    }

    extractionStart.stop();
    _logger.d('🎯 Landmark extraction completed in ${extractionStart.elapsedMilliseconds}ms: contours=$contourPointCount, landmarks=$landmarkPointCount, total=${landmarks.length}');

    return landmarks;
  }

  double _calculateConfidence(Face face) {
    // ML Kit doesn't provide confidence directly
    // We'll calculate based on tracking ID and face size
    double confidence = 0.7; // Base confidence
    
    // Increase confidence if face is being tracked
    if (face.trackingId != null) {
      confidence += 0.2;
      _logger.d('🆔 Face tracked with ID: ${face.trackingId}');
    }
    
    // Increase confidence for larger faces
    final faceArea = face.boundingBox.width * face.boundingBox.height;
    if (faceArea > 10000) {
      confidence += 0.1;
      _logger.d('📏 Large face detected: area=$faceArea');
    }
    
    return min(1.0, confidence);
  }

  BoundingBox _convertBoundingBox(Rect rect) {
    return BoundingBox(
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    );
  }

  // Liveness detection methods với enhanced logging
  LivenessAnalysis analyzeLiveness(List<FaceLandmark> landmarks, 
                                   LivenessChallengeType challengeType, 
                                   {Face? face}) {
    _logger.d('🎭 Analyzing liveness: type=$challengeType, landmarks=${landmarks.length}');
    
    final analysisStart = Stopwatch()..start();
    LivenessAnalysis result;
    
    switch (challengeType) {
      case LivenessChallengeType.blink:
        result = _analyzeBlinking(face);
        break;
      case LivenessChallengeType.smile:
        result = _analyzeSmiling(face);
        break;
      case LivenessChallengeType.turnLeft:
      case LivenessChallengeType.turnRight:
        result = _analyzeHeadTurn(face, challengeType);
        break;
      case LivenessChallengeType.nod:
        result = _analyzeNodding(face);
        break;
    }
    
    analysisStart.stop();
    _logger.d('🎭 Liveness analysis completed in ${analysisStart.elapsedMilliseconds}ms: detected=${result.detected}, confidence=${result.confidence.toStringAsFixed(2)}');
    
    return result;
  }

  LivenessAnalysis _analyzeBlinking(Face? face) {
    if (face == null) {
      _logger.w('👁️ Blink analysis failed: No face detected');
      return LivenessAnalysis(
        challengeType: LivenessChallengeType.blink,
        detected: false,
        confidence: 0.0,
        data: {'error': 'No face detected'},
      );
    }

    // Use eye open probability from ML Kit
    final leftEyeOpenProbability = face.leftEyeOpenProbability ?? 0.5;
    final rightEyeOpenProbability = face.rightEyeOpenProbability ?? 0.5;
    final averageEyeOpenProbability = (leftEyeOpenProbability + rightEyeOpenProbability) / 2.0;
    
    const blinkThreshold = 0.3;
    final isBlinking = averageEyeOpenProbability < blinkThreshold;
    
    _logger.d('👁️ Blink analysis: left=${leftEyeOpenProbability.toStringAsFixed(2)}, right=${rightEyeOpenProbability.toStringAsFixed(2)}, avg=${averageEyeOpenProbability.toStringAsFixed(2)}, threshold=$blinkThreshold, blinking=$isBlinking');
    
    return LivenessAnalysis(
      challengeType: LivenessChallengeType.blink,
      detected: isBlinking,
      confidence: isBlinking ? (blinkThreshold - averageEyeOpenProbability) / blinkThreshold : 0.0,
      data: {
        'left_eye_open_probability': leftEyeOpenProbability,
        'right_eye_open_probability': rightEyeOpenProbability,
        'average_eye_open_probability': averageEyeOpenProbability,
        'threshold': blinkThreshold,
      },
    );
  }

  LivenessAnalysis _analyzeSmiling(Face? face) {
    if (face == null) {
      _logger.w('😊 Smile analysis failed: No face detected');
      return LivenessAnalysis(
        challengeType: LivenessChallengeType.smile,
        detected: false,
        confidence: 0.0,
        data: {'error': 'No face detected'},
      );
    }

    final smilingProbability = face.smilingProbability ?? 0.0;
    const smileThreshold = 0.7;
    final isSmiling = smilingProbability > smileThreshold;
    
    _logger.d('😊 Smile analysis: probability=${smilingProbability.toStringAsFixed(2)}, threshold=$smileThreshold, smiling=$isSmiling');
    
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

  LivenessAnalysis _analyzeHeadTurn(Face? face, LivenessChallengeType challengeType) {
    if (face == null) {
      _logger.w('🔄 Head turn analysis failed: No face detected');
      return LivenessAnalysis(
        challengeType: challengeType,
        detected: false,
        confidence: 0.0,
        data: {'error': 'No face detected'},
      );
    }

    final headEulerAngleY = face.headEulerAngleY ?? 0.0;
    const turnThreshold = 15.0;
    
    bool detected = false;
    if (challengeType == LivenessChallengeType.turnLeft) {
      detected = headEulerAngleY > turnThreshold;
    } else if (challengeType == LivenessChallengeType.turnRight) {
      detected = headEulerAngleY < -turnThreshold;
    }
    
    _logger.d('🔄 Head turn analysis: type=$challengeType, angle=${headEulerAngleY.toStringAsFixed(1)}°, threshold=${turnThreshold}°, detected=$detected');
    
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

  LivenessAnalysis _analyzeNodding(Face? face) {
    if (face == null) {
      _logger.w('📍 Nod analysis failed: No face detected');
      return LivenessAnalysis(
        challengeType: LivenessChallengeType.nod,
        detected: false,
        confidence: 0.0,
        data: {'error': 'No face detected'},
      );
    }

    final headEulerAngleX = face.headEulerAngleX ?? 0.0;
    const nodThreshold = 10.0;
    final isNodding = headEulerAngleX.abs() > nodThreshold;
    
    _logger.d('📍 Nod analysis: angle=${headEulerAngleX.toStringAsFixed(1)}°, threshold=${nodThreshold}°, nodding=$isNodding');
    
    return LivenessAnalysis(
      challengeType: LivenessChallengeType.nod,
      detected: isNodding,
      confidence: isNodding ? min(1.0, headEulerAngleX.abs() / nodThreshold) : 0.0,
      data: {
        'head_euler_angle_x': headEulerAngleX,
        'threshold': nodThreshold,
      },
    );
  }
}

// Queue class for frame management
class Queue<T> {
  final List<T> _items = <T>[];

  void add(T item) => _items.add(item);
  T removeFirst() => _items.removeAt(0);
  bool get isNotEmpty => _items.isNotEmpty;
  bool get isEmpty => _items.isEmpty;
  int get length => _items.length;
  void clear() => _items.clear();
}

// Enhanced FaceDetectionResult to include ML Kit Face
class FaceDetectionResult {
  final bool hasFace;
  final List<FaceLandmark> landmarks;
  final double confidence;
  final BoundingBox? boundingBox;
  final Face? face; // ML Kit Face object

  FaceDetectionResult({
    required this.hasFace,
    required this.landmarks,
    required this.confidence,
    this.boundingBox,
    this.face,
  });
}

// Keep existing classes from your original code
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

enum LivenessChallengeType {
  blink,
  smile,
  turnLeft,
  turnRight,
  nod,
}