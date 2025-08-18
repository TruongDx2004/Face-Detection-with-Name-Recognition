// lib/services/mediapipe_face_service.dart
import 'dart:typed_data';
import 'dart:math';
import 'package:camera/camera.dart';
import 'package:flutter/services.dart';
import 'package:logger/logger.dart';

class MediaPipeFaceService {
  static final MediaPipeFaceService _instance = MediaPipeFaceService._internal();
  factory MediaPipeFaceService() => _instance;
  MediaPipeFaceService._internal();

  final Logger _logger = Logger();
  static const MethodChannel _channel = MethodChannel('mediapipe_face');

  bool _isInitialized = false;
  
  // Face landmarks indices for specific features
 static const List<int> leftEyeLandmarks = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246
];

static const List<int> rightEyeLandmarks = [
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398
];
  
  static const List<int> lipLandmarks = [
    61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318,
    13, 82, 81, 80, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324
  ];
  
  static const List<int> noseLandmarks = [1, 2, 5, 4, 6, 168, 8, 9, 10, 151];
  
  static const List<int> faceOvalLandmarks = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
  ];

  Future<bool> initialize() async {
    try {
      if (_isInitialized) return true;
      
      final result = await _channel.invokeMethod('initialize');
      _isInitialized = result == true;
      _logger.i('MediaPipe Face Service initialized: $_isInitialized');
      return _isInitialized;
    } catch (e) {
      _logger.e('MediaPipe initialization error: $e');
      return false;
    }
  }

  Future<void> dispose() async {
    try {
      await _channel.invokeMethod('dispose');
      _isInitialized = false;
      _logger.i('MediaPipe Face Service disposed');
    } catch (e) {
      _logger.e('MediaPipe dispose error: $e');
    }
  }

  Future<FaceDetectionResult?> processCameraImage(CameraImage image) async {
    try {
      if (!_isInitialized) {
        await initialize();
      }

      final imageData = _convertCameraImageToBytes(image);
      
      final result = await _channel.invokeMethod('processImage', {
        'imageData': imageData,
        'width': image.width,
        'height': image.height,
        'format': image.format.group.name,
      });

      if (result != null) {
        return FaceDetectionResult.fromMap(result);
      }
      
      return null;
    } catch (e) {
      _logger.e('Face processing error: $e');
      return null;
    }
  }

  Uint8List _convertCameraImageToBytes(CameraImage image) {
    // Convert camera image to bytes based on format
    if (image.format.group == ImageFormatGroup.yuv420) {
      return _convertYUV420ToBytes(image);
    } else if (image.format.group == ImageFormatGroup.bgra8888) {
      return _convertBGRA8888ToBytes(image);
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
    
    // Copy Y plane
    bytes.setRange(0, ySize, yPlane.bytes);
    
    // Interleave U and V planes
    int uvIndex = ySize;
    for (int i = 0; i < uPlane.bytes.length; i++) {
      bytes[uvIndex++] = uPlane.bytes[i];
      bytes[uvIndex++] = vPlane.bytes[i];
    }
    
    return bytes;
  }

  Uint8List _convertBGRA8888ToBytes(CameraImage image) {
    return image.planes[0].bytes;
  }

  // Analyze face landmarks for liveness detection
  LivenessAnalysis analyzeLiveness(List<FaceLandmark> landmarks, 
                                   LivenessChallengeType challengeType) {
    switch (challengeType) {
      case LivenessChallengeType.blink:
        return _analyzeBlinking(landmarks);
      case LivenessChallengeType.smile:
        return _analyzeSmiling(landmarks);
      case LivenessChallengeType.turnLeft:
      case LivenessChallengeType.turnRight:
        return _analyzeHeadTurn(landmarks, challengeType);
      case LivenessChallengeType.nod:
        return _analyzeNodding(landmarks);
    }
  }

  LivenessAnalysis _analyzeBlinking(List<FaceLandmark> landmarks) {
    try {
      // Calculate Eye Aspect Ratio (EAR) for both eyes
      final leftEAR = _calculateEyeAspectRatio(landmarks, leftEyeLandmarks);
      final rightEAR = _calculateEyeAspectRatio(landmarks, rightEyeLandmarks);
      
      final averageEAR = (leftEAR + rightEAR) / 2.0;
      
      // EAR threshold for blink detection (typically around 0.2)
      const blinkThreshold = 0.25;
      final isBlinking = averageEAR < blinkThreshold;
      
      return LivenessAnalysis(
        challengeType: LivenessChallengeType.blink,
        detected: isBlinking,
        confidence: _calculateBlinkConfidence(averageEAR, blinkThreshold),
        data: {'ear': averageEAR, 'threshold': blinkThreshold},
      );
    } catch (e) {
      _logger.e('Blink analysis error: $e');
      return LivenessAnalysis(
        challengeType: LivenessChallengeType.blink,
        detected: false,
        confidence: 0.0,
        data: {'error': e.toString()},
      );
    }
  }

  double _calculateEyeAspectRatio(List<FaceLandmark> landmarks, List<int> eyePoints) {
    if (landmarks.length < eyePoints.length) return 0.0;
    
    // Get eye landmarks
    final eyeLandmarks = eyePoints.map((index) => landmarks[index]).toList();
    
    // Calculate vertical distances
    final vertical1 = _calculateDistance(eyeLandmarks[1], eyeLandmarks[5]);
    final vertical2 = _calculateDistance(eyeLandmarks[2], eyeLandmarks[4]);
    
    // Calculate horizontal distance
    final horizontal = _calculateDistance(eyeLandmarks[0], eyeLandmarks[3]);
    
    // Eye Aspect Ratio
    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  LivenessAnalysis _analyzeSmiling(List<FaceLandmark> landmarks) {
    try {
      // Calculate mouth aspect ratio and lip distances
      final mouthRatio = _calculateMouthAspectRatio(landmarks);
      
      // Smile detection threshold
      const smileThreshold = 0.02;
      final isSmiling = mouthRatio > smileThreshold;
      
      return LivenessAnalysis(
        challengeType: LivenessChallengeType.smile,
        detected: isSmiling,
        confidence: _calculateSmileConfidence(mouthRatio, smileThreshold),
        data: {'mouth_ratio': mouthRatio, 'threshold': smileThreshold},
      );
    } catch (e) {
      _logger.e('Smile analysis error: $e');
      return LivenessAnalysis(
        challengeType: LivenessChallengeType.smile,
        detected: false,
        confidence: 0.0,
        data: {'error': e.toString()},
      );
    }
  }

  double _calculateMouthAspectRatio(List<FaceLandmark> landmarks) {
    if (landmarks.length < lipLandmarks.length) return 0.0;
    
    // Get mouth corner points
    final leftCorner = landmarks[61];  // Left mouth corner
    final rightCorner = landmarks[291]; // Right mouth corner
    final topLip = landmarks[13];       // Top lip center
    final bottomLip = landmarks[14];    // Bottom lip center
    
    // Calculate mouth width and height
    final mouthWidth = _calculateDistance(leftCorner, rightCorner);
    final mouthHeight = _calculateDistance(topLip, bottomLip);
    
    return mouthHeight / mouthWidth;
  }

  LivenessAnalysis _analyzeHeadTurn(List<FaceLandmark> landmarks, 
                                    LivenessChallengeType challengeType) {
    try {
      // Calculate head pose using nose tip and face center
      final noseTip = landmarks[1];
      final faceCenter = _calculateFaceCenter(landmarks);
      
      // Calculate yaw angle (left/right rotation)
      final yawAngle = _calculateYawAngle(landmarks);
      
      const turnThreshold = 15.0; // degrees
      bool detected = false;
      
      if (challengeType == LivenessChallengeType.turnLeft) {
        detected = yawAngle > turnThreshold;
      } else if (challengeType == LivenessChallengeType.turnRight) {
        detected = yawAngle < -turnThreshold;
      }
      
      return LivenessAnalysis(
        challengeType: challengeType,
        detected: detected,
        confidence: _calculateTurnConfidence(yawAngle.abs(), turnThreshold),
        data: {'yaw_angle': yawAngle, 'threshold': turnThreshold},
      );
    } catch (e) {
      _logger.e('Head turn analysis error: $e');
      return LivenessAnalysis(
        challengeType: challengeType,
        detected: false,
        confidence: 0.0,
        data: {'error': e.toString()},
      );
    }
  }

  LivenessAnalysis _analyzeNodding(List<FaceLandmark> landmarks) {
    try {
      // Calculate pitch angle (up/down rotation)
      final pitchAngle = _calculatePitchAngle(landmarks);
      
      const nodThreshold = 10.0; // degrees
      final isNodding = pitchAngle.abs() > nodThreshold;
      
      return LivenessAnalysis(
        challengeType: LivenessChallengeType.nod,
        detected: isNodding,
        confidence: _calculateNodConfidence(pitchAngle.abs(), nodThreshold),
        data: {'pitch_angle': pitchAngle, 'threshold': nodThreshold},
      );
    } catch (e) {
      _logger.e('Nod analysis error: $e');
      return LivenessAnalysis(
        challengeType: LivenessChallengeType.nod,
        detected: false,
        confidence: 0.0,
        data: {'error': e.toString()},
      );
    }
  }

  double _calculateDistance(FaceLandmark point1, FaceLandmark point2) {
    final dx = point1.x - point2.x;
    final dy = point1.y - point2.y;
    return sqrt(dx * dx + dy * dy);
  }

  FaceLandmark _calculateFaceCenter(List<FaceLandmark> landmarks) {
    if (landmarks.isEmpty) return FaceLandmark(x: 0, y: 0, z: 0);
    
    double sumX = 0, sumY = 0, sumZ = 0;
    for (final landmark in landmarks) {
      sumX += landmark.x;
      sumY += landmark.y;
      sumZ += landmark.z;
    }
    
    return FaceLandmark(
      x: sumX / landmarks.length,
      y: sumY / landmarks.length,
      z: sumZ / landmarks.length,
    );
  }

  double _calculateYawAngle(List<FaceLandmark> landmarks) {
    // Simple yaw calculation using nose tip and face landmarks
    final noseTip = landmarks[1];
    final leftFace = landmarks[234];
    final rightFace = landmarks[454];
    
    final leftDistance = _calculateDistance(noseTip, leftFace);
    final rightDistance = _calculateDistance(noseTip, rightFace);
    
    // Calculate yaw based on distance ratio
    final ratio = leftDistance / rightDistance;
    return (ratio - 1.0) * 45.0; // Convert to approximate degrees
  }

  double _calculatePitchAngle(List<FaceLandmark> landmarks) {
    // Simple pitch calculation using nose and forehead landmarks
    final noseTip = landmarks[1];
    final foreheadCenter = landmarks[9];
    final chinCenter = landmarks[175];
    
    final noseToForehead = _calculateDistance(noseTip, foreheadCenter);
    final noseToChin = _calculateDistance(noseTip, chinCenter);
    
    final ratio = noseToForehead / noseToChin;
    return (ratio - 0.6) * 60.0; // Convert to approximate degrees
  }

  double _calculateBlinkConfidence(double ear, double threshold) {
    if (ear < threshold) {
      return min(1.0, (threshold - ear) / threshold);
    }
    return 0.0;
  }

  double _calculateSmileConfidence(double ratio, double threshold) {
    if (ratio > threshold) {
      return min(1.0, (ratio - threshold) / threshold);
    }
    return 0.0;
  }

  double _calculateTurnConfidence(double angle, double threshold) {
    if (angle > threshold) {
      return min(1.0, (angle - threshold) / threshold);
    }
    return 0.0;
  }

  double _calculateNodConfidence(double angle, double threshold) {
    if (angle > threshold) {
      return min(1.0, (angle - threshold) / threshold);
    }
    return 0.0;
  }
}

// Data classes for face detection results
class FaceDetectionResult {
  final bool hasFace;
  final List<FaceLandmark> landmarks;
  final double confidence;
  final BoundingBox? boundingBox;

  FaceDetectionResult({
    required this.hasFace,
    required this.landmarks,
    required this.confidence,
    this.boundingBox,
  });

  factory FaceDetectionResult.fromMap(Map<dynamic, dynamic> map) {
    final landmarksList = (map['landmarks'] as List<dynamic>?)
        ?.map((landmark) => FaceLandmark.fromMap(landmark))
        .toList() ?? [];

    BoundingBox? bbox;
    if (map['bounding_box'] != null) {
      bbox = BoundingBox.fromMap(map['bounding_box']);
    }

    return FaceDetectionResult(
      hasFace: map['has_face'] ?? false,
      landmarks: landmarksList,
      confidence: (map['confidence'] ?? 0.0).toDouble(),
      boundingBox: bbox,
    );
  }
}

class FaceLandmark {
  final double x;
  final double y;
  final double z;

  FaceLandmark({required this.x, required this.y, required this.z});

  factory FaceLandmark.fromMap(Map<dynamic, dynamic> map) {
    return FaceLandmark(
      x: (map['x'] ?? 0.0).toDouble(),
      y: (map['y'] ?? 0.0).toDouble(),
      z: (map['z'] ?? 0.0).toDouble(),
    );
  }
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

  factory BoundingBox.fromMap(Map<dynamic, dynamic> map) {
    return BoundingBox(
      left: (map['left'] ?? 0.0).toDouble(),
      top: (map['top'] ?? 0.0).toDouble(),
      right: (map['right'] ?? 0.0).toDouble(),
      bottom: (map['bottom'] ?? 0.0).toDouble(),
    );
  }
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

// Import the challenge type from the main screen
enum LivenessChallengeType {
  blink,
  smile,
  turnLeft,
  turnRight,
  nod,
}