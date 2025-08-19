// lib/screens/student/face_capture_screen_optimized.dart
import 'dart:io';
import 'dart:math';
import 'dart:async';
import 'package:face_attendance/services/ml_kit_face_service.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:logger/logger.dart';
import '../../services/api_service.dart';
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
    with WidgetsBindingObserver, TickerProviderStateMixin {
  final Logger _logger = Logger();

  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  bool _isProcessing = false;
  bool _isFlashOn = false;
  int _selectedCameraIndex = 0;

  // ignore: unused_field
  String? _lastCapturedImagePath;
  String _statusMessage = 'Đang khởi tạo ML Kit...';
  Color _statusColor = Colors.blue;

  // ML Kit Service
  final MLKitFaceService _faceService = MLKitFaceService();
  StreamSubscription<CameraImage>? _imageStreamSubscription;

  // Liveness Detection Variables
  bool _livenessCheckActive = false;
  int _currentChallengeIndex = 0;
  bool _challengeCompleted = false;
  List<LivenessChallenge> _challenges = [];

  // Animation Controllers
  late AnimationController _pulseAnimationController;
  late Animation<double> _pulseAnimation;

  // Face Detection Variables
  bool _faceDetected = false;
  FaceDetectionResult? _currentFaceResult;

  // Challenge Tracking (simplified)
  Timer? _challengeTimer;

  // Enhanced anti-fraud parameters
  static const int _minConsecutiveDetections = 5; // Increased from 3
  int _consecutiveSmileDetections = 0;
  int _consecutiveHeadTurnDetections = 0;
  int _consecutiveLookStraightDetections = 0;

  // Frame throttling (increased for better performance)
  DateTime? _lastProcessTime;
  static const Duration _minProcessInterval =
      Duration(milliseconds: 150); // Reduced from 100ms

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeAnimations();
    _initializeServices();
  }

  @override
  void dispose() {
    _logger.i('🧹 Disposing FaceCaptureScreen...');
    WidgetsBinding.instance.removeObserver(this);
    _imageStreamSubscription?.cancel();
    _challengeTimer?.cancel();
    _cameraController?.dispose();
    _pulseAnimationController.dispose();
    _faceService.dispose();
    super.dispose();
  }

  void _initializeAnimations() {
    _pulseAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(
      begin: 0.9,
      end: 1.1,
    ).animate(CurvedAnimation(
      parent: _pulseAnimationController,
      curve: Curves.easeInOut,
    ));

    _pulseAnimationController.repeat(reverse: true);
  }

  Future<void> _initializeServices() async {
    try {
      _logger.i('🚀 Starting service initialization...');

      // Initialize ML Kit
      final initialized = await _faceService.initialize();
      if (!initialized) {
        _setStatus('Lỗi khởi tạo ML Kit', Colors.red);
        return;
      }

      // Initialize camera
      await _initializeCamera();
    } catch (e) {
      _logger.e('❌ Service initialization error: $e');
      _setStatus('Lỗi khởi tạo: $e', Colors.red);
    }
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) {
        _setStatus('Không tìm thấy camera', Colors.red);
        return;
      }

      // Prefer front camera
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
      _logger.e('❌ Camera initialization error: $e');
      _setStatus('Lỗi khởi tạo camera: $e', Colors.red);
    }
  }

  Future<void> _setupCamera(int cameraIndex) async {
    try {
      if (_cameraController != null) {
        await _cameraController!.dispose();
        _imageStreamSubscription?.cancel();
      }

      _cameraController = CameraController(
        _cameras![cameraIndex],
        ResolutionPreset.medium, // Balanced performance
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.yuv420,
      );

      await _cameraController!.initialize();

      if (mounted) {
        setState(() {
          _isInitialized = true;
          _selectedCameraIndex = cameraIndex;
        });

        _setStatus('Camera đã sẵn sàng', Colors.green);
        _generateRandomChallenges();
        _startLivenessDetection();
      }
    } catch (e) {
      _logger.e('❌ Camera setup error: $e');
      _setStatus('Lỗi thiết lập camera: $e', Colors.red);
    }
  }

  void _generateRandomChallenges() {
    final random = Random();
    final challengeTypes = [
      LivenessChallengeType.smile,
      LivenessChallengeType.turnLeft,
      LivenessChallengeType.turnRight,
    ];

    _challenges.clear();
    final challengeCount = 2; // Fixed 2 challenges + look straight

    final usedTypes = <LivenessChallengeType>{};

    for (int i = 0; i < challengeCount; i++) {
      LivenessChallengeType challengeType;
      do {
        challengeType = challengeTypes[random.nextInt(challengeTypes.length)];
      } while (usedTypes.contains(challengeType));

      usedTypes.add(challengeType);
      _challenges.add(LivenessChallenge(
        type: challengeType,
        instruction: _getInstructionForChallenge(challengeType),
        completed: false,
      ));
    }

    // Add final "look straight" challenge
    _challenges.add(LivenessChallenge(
      type: LivenessChallengeType.lookStraight,
      instruction: 'Nhìn thẳng vào camera',
      completed: false,
    ));

    _logger.i(
        '🎯 Generated challenges: ${_challenges.map((c) => c.type).toList()}');
  }

  String _getInstructionForChallenge(LivenessChallengeType type) {
    switch (type) {
      case LivenessChallengeType.smile:
        return 'Mỉm cười';
      case LivenessChallengeType.turnLeft:
        return 'Quay đầu sang trái';
      case LivenessChallengeType.turnRight:
        return 'Quay đầu sang phải';
      case LivenessChallengeType.lookStraight:
        return 'Nhìn thẳng vào camera';
      // ignore: unreachable_switch_default
      default:
        return 'Thực hiện động tác';
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

  void _startLivenessDetection() {
    setState(() {
      _livenessCheckActive = true;
      _currentChallengeIndex = 0;
      _consecutiveSmileDetections = 0;
      _consecutiveHeadTurnDetections = 0;
      _consecutiveLookStraightDetections = 0;
    });

    _setStatus(_challenges[0].instruction, Colors.orange);
    _startImageStream();

    _challengeTimer = Timer(const Duration(seconds: 20), () {
      if (_livenessCheckActive &&
          !_challenges[_currentChallengeIndex].completed) {
        _setStatus('Thời gian hết! Thử lại...', Colors.red);
        _resetLivenessCheck();
      }
    });
  }

  void _startImageStream() {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    _cameraController!.startImageStream((CameraImage image) async {
      // Frame throttling
      final now = DateTime.now();
      if (_lastProcessTime != null &&
          now.difference(_lastProcessTime!) < _minProcessInterval) {
        return;
      }
      _lastProcessTime = now;

      if (!_livenessCheckActive || _isProcessing) {
        return;
      }

      _processFrameAsync(image);
    });
  }

  void _processFrameAsync(CameraImage image) async {
    try {
      setState(() {
        _isProcessing = true;
      });

      final result = await _faceService.processCameraImage(image);

      if (result != null && mounted) {

        setState(() {
          _currentFaceResult = result;
          _faceDetected = result.hasFace;
        });

        if (result.hasFace && result.landmarks.isNotEmpty) {
          _processLivenessChallenge(result);
        } else {
          _resetConsecutiveDetections(_challenges[_currentChallengeIndex].type);
        }
      } else {
      }
    } catch (e) {
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  void _processLivenessChallenge(FaceDetectionResult result) {
    if (_currentChallengeIndex >= _challenges.length) {
      _completeLivenessCheck();
      return;
    }

    final currentChallenge = _challenges[_currentChallengeIndex];
    final analysis = _faceService.analyzeLiveness(
        result.landmarks, currentChallenge.type as LivenessChallengeType,
        face: result.face);

    if (analysis.detected && analysis.confidence > 0.3) {
      _handleChallengeDetection(currentChallenge, analysis);
    } else {
      _resetConsecutiveDetections(currentChallenge.type);
    }
  }

  void _handleChallengeDetection(
      LivenessChallenge challenge, LivenessAnalysis analysis) {
    switch (challenge.type) {
      case LivenessChallengeType.smile:
        _consecutiveSmileDetections++;
        if (_consecutiveSmileDetections >= _minConsecutiveDetections) {
          _completeCurrentChallenge();
        }
        break;
      case LivenessChallengeType.turnLeft:
      case LivenessChallengeType.turnRight:
        _consecutiveHeadTurnDetections++;
        if (_consecutiveHeadTurnDetections >= _minConsecutiveDetections) {
          _completeCurrentChallenge();
        }
        break;
      case LivenessChallengeType.lookStraight:
        if (analysis.detected) {
          _consecutiveLookStraightDetections++;
          if (_consecutiveLookStraightDetections >= _minConsecutiveDetections) {
            _completeCurrentChallenge();
          }
        } else {
          _consecutiveLookStraightDetections = 0;
        }
        break;
      // ignore: unreachable_switch_default
      default:
        break;
    }
  }

  // New method to analyze looking straight
  // ignore: unused_element
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

    // Stricter thresholds for looking straight
    const straightThreshold = 8.0; // Reduced from 15.0

    final isLookingStraight = headEulerAngleX.abs() < straightThreshold &&
        headEulerAngleY.abs() < straightThreshold;

    final confidence = isLookingStraight
        ? 1.0 -
            max(headEulerAngleX.abs(), headEulerAngleY.abs()) /
                straightThreshold
        : 0.0;

    return LivenessAnalysis(
      challengeType: LivenessChallengeType.lookStraight,
      detected: isLookingStraight,
      confidence: confidence,
      data: {
        'head_euler_angle_x': headEulerAngleX,
        'head_euler_angle_y': headEulerAngleY,
        'threshold': straightThreshold,
      },
    );
  }

  Future<void> _autoMarkAttendance() async {

    if (!_isInitialized || _cameraController == null) {
      //Debugging message
      _logger.w('isInitialized: $_isInitialized, isProcessing: $_isProcessing, cameraController: $_cameraController');
      _setStatus('Hệ thống chưa sẵn sàng', Colors.red);
      return;
    }

    _logger.i('🎯 Auto-marking attendance after look straight detection');

    setState(() {
      _isProcessing = true;
    });

    try { 
      _imageStreamSubscription?.cancel();
      _setStatus('Tự động chụp ảnh...', Colors.blue);

      // Capture image
      final XFile imageFile = await _cameraController!.takePicture();
      _lastCapturedImagePath = imageFile.path;

      _setStatus('Đang xử lý nhận diện...', Colors.blue);

      // Send for face recognition and attendance marking
      final result = await ApiService().markAttendance(
        sessionId: widget.sessionId,
        imageFile: File(imageFile.path),
      );

      if (result.success) {
        _setStatus('Điểm danh thành công!', Colors.green);
        _showSuccessDialog(result.data!);

        if (widget.onFaceTrained != null) {
          widget.onFaceTrained!();
        }

        HapticFeedback.heavyImpact();

        // Auto close after 3 seconds
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) {
            Navigator.of(context).pop();
          }
        });
      } else {
        _setStatus('Điểm danh thất bại: ${result.message}', Colors.red);
        _resetLivenessCheck();
      }
    } catch (e) {
      _logger.e('❌ Auto attendance marking error: $e');
      _setStatus('Lỗi: $e', Colors.red);
      _resetLivenessCheck();
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  void _resetConsecutiveDetections(LivenessChallengeType type) {
    switch (type) {
      case LivenessChallengeType.smile:
        if (_consecutiveSmileDetections > 0) {
          _consecutiveSmileDetections = 0;
        }
        break;
      case LivenessChallengeType.turnLeft:
      case LivenessChallengeType.turnRight:
        if (_consecutiveHeadTurnDetections > 0) {
          _consecutiveHeadTurnDetections = 0;
        }
        break;
      case LivenessChallengeType.lookStraight:
        if (_consecutiveLookStraightDetections > 0) {
          _consecutiveLookStraightDetections = 0;
        }
        break;
      // ignore: unreachable_switch_default
      default:
        break;
    }
  }

  void _completeCurrentChallenge() {
    if (_currentChallengeIndex < _challenges.length) {
      bool wasLookStraightChallenge =
          _challenges[_currentChallengeIndex].type ==
              LivenessChallengeType.lookStraight;

      setState(() {
        _challenges[_currentChallengeIndex].completed = true;
        _currentChallengeIndex++;
      });

      _challengeTimer?.cancel();

      if (_currentChallengeIndex < _challenges.length) {
        _setStatus(
            _challenges[_currentChallengeIndex].instruction, Colors.orange);
        _resetChallengeVariables();

        _challengeTimer = Timer(const Duration(seconds: 20), () {
          if (_livenessCheckActive &&
              !_challenges[_currentChallengeIndex].completed) {
            _setStatus('Thời gian hết! Thử lại...', Colors.red);
            _resetLivenessCheck();
          }
        });
      } else {
        _completeLivenessCheck();
        _logger.i('🎯 All challenges completed!');
        if (wasLookStraightChallenge) {
          _autoMarkAttendance();
        }
      }
    }
  }

  void _resetChallengeVariables() {
    _consecutiveSmileDetections = 0;
    _consecutiveHeadTurnDetections = 0;
    _consecutiveLookStraightDetections = 0;
  }

  void _completeLivenessCheck() {
    _challengeTimer?.cancel();

    setState(() {
      _livenessCheckActive = false;
      _challengeCompleted = true;
    });

    _setStatus('Tất cả thử thách hoàn thành!', Colors.green);
    HapticFeedback.mediumImpact();
  }

  void _resetLivenessCheck() {
    _challengeTimer?.cancel();
    _imageStreamSubscription?.cancel();

    setState(() {
      _livenessCheckActive = false;
      _challengeCompleted = false;
      _currentChallengeIndex = 0;
    });

    _resetChallengeVariables();
    _generateRandomChallenges();

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        _startLivenessDetection();
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final CameraController? cameraController = _cameraController;
    if (cameraController == null || !cameraController.value.isInitialized) {
      return;
    }

    if (state == AppLifecycleState.inactive) {
      _imageStreamSubscription?.cancel();
      cameraController.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
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
              Text(
                  'Độ tin cậy: ${(attendanceData['confidence_score'] * 100).toStringAsFixed(1)}%'),
            const SizedBox(height: 8),
            const Row(
              children: [
                Icon(Icons.security, color: Colors.green, size: 16),
                SizedBox(width: 4),
                Text('Liveness: Đã xác thực',
                    style: TextStyle(color: Colors.green)),
              ],
            ),
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
      _logger.e('❌ Toggle flash error: $e');
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
            painter: OptimizedFaceOverlayPainter(
              faceResult: _currentFaceResult,
              challenges: _challenges,
              currentChallengeIndex: _currentChallengeIndex,
              livenessActive: _livenessCheckActive,
              consecutiveDetections: _getConsecutiveDetections(),
              requiredDetections: _minConsecutiveDetections,
            ),
          ),
        ),

        // Compact status bar
        Positioned(
          top: 20,
          left: 16,
          right: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: const Color.fromARGB(221, 82, 82, 82),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _getIconForChallenge(
                          _currentChallengeIndex < _challenges.length
                              ? _challenges[_currentChallengeIndex].type
                              : LivenessChallengeType.lookStraight),
                      color: _statusColor,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        _statusMessage,
                        style: TextStyle(
                          color: _statusColor,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                // Progress indicator
                if (_livenessCheckActive) ...[
                  CircularProgressIndicator(
                    value: (_currentChallengeIndex) / _challenges.length,
                    backgroundColor: Colors.grey[600],
                    valueColor: AlwaysStoppedAnimation<Color>(_statusColor),
                    strokeWidth: 2,
                  ),
                ] else if (_faceDetected) ...[
                  const Icon(Icons.face, color: Colors.green, size: 20),
                ],
              ],
            ),
          ),
        ),

        // Challenge instruction overlay
        if (_livenessCheckActive && _currentChallengeIndex < _challenges.length)
          Positioned(
            bottom: 200,
            left: 16,
            right: 16,
            child: AnimatedBuilder(
              animation: _pulseAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: _pulseAnimation.value,
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color.fromARGB(150, 70, 70, 70),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: _statusColor, width: 2),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          _getIconForChallenge(
                              _challenges[_currentChallengeIndex].type),
                          size: 40,
                          color: _statusColor,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _challenges[_currentChallengeIndex].instruction,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Bước ${_currentChallengeIndex + 1}/${_challenges.length}',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                        // Progress bar for current detection
                        if (_getConsecutiveDetections() > 0) ...[
                          const SizedBox(height: 8),
                          LinearProgressIndicator(
                            value: _getConsecutiveDetections() /
                                _minConsecutiveDetections,
                            backgroundColor: Colors.grey[600],
                            valueColor:
                                AlwaysStoppedAnimation<Color>(_statusColor),
                          ),
                          Text(
                            '${_getConsecutiveDetections()}/$_minConsecutiveDetections',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  int _getConsecutiveDetections() {
    if (_currentChallengeIndex >= _challenges.length) return 0;

    switch (_challenges[_currentChallengeIndex].type) {
      case LivenessChallengeType.smile:
        return _consecutiveSmileDetections;
      case LivenessChallengeType.turnLeft:
      case LivenessChallengeType.turnRight:
        return _consecutiveHeadTurnDetections;
      case LivenessChallengeType.lookStraight:
        return _consecutiveLookStraightDetections;
      // ignore: unreachable_switch_default
      default:
        return 0;
    }
  }

  IconData _getIconForChallenge(LivenessChallengeType type) {
    switch (type) {
      case LivenessChallengeType.smile:
        return Icons.sentiment_satisfied;
      case LivenessChallengeType.turnLeft:
        return Icons.arrow_back;
      case LivenessChallengeType.turnRight:
        return Icons.arrow_forward;
      case LivenessChallengeType.lookStraight:
        return Icons.center_focus_strong;
      // ignore: unreachable_switch_default
      default:
        return Icons.face;
    }
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
              size: 28,
            ),
            style: IconButton.styleFrom(
              backgroundColor: Colors.grey[600],
              padding: const EdgeInsets.all(12),
            ),
          ),

          // Auto-capture indicator (no manual capture button)
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _challengeCompleted
                  ? Colors.green.withOpacity(0.2)
                  : Colors.grey.withOpacity(0.2),
              border: Border.all(
                color: _challengeCompleted ? Colors.green : Colors.grey,
                width: 3,
              ),
            ),
            child: _isProcessing
                ? const CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                  )
                : Icon(
                    Icons.auto_awesome,
                    size: 32,
                    color: _challengeCompleted ? Colors.green : Colors.grey,
                  ),
          ),

          // Switch camera
          if (_cameras != null && _cameras!.length > 1)
            IconButton(
              onPressed: _isProcessing ? null : _switchCamera,
              icon: const Icon(
                Icons.flip_camera_ios,
                color: Colors.white,
                size: 28,
              ),
              style: IconButton.styleFrom(
                backgroundColor: Colors.grey[600],
                padding: const EdgeInsets.all(12),
              ),
            )
          else
            const SizedBox(width: 56),
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
        backgroundColor: Colors.grey[600],
        appBar: AppBar(
          title: const Text('Điểm danh tự động'),
          backgroundColor: Colors.blueAccent,
          foregroundColor: Colors.white,
          elevation: 0,
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _resetLivenessCheck,
              tooltip: 'Làm mới',
            ),
          ],
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
              child: Column(
                children: [
                  // Status icons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.security,
                        size: 40,
                        color:
                            _challengeCompleted ? Colors.green : Colors.orange,
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.face,
                        size: 40,
                        color: _faceDetected ? Colors.green : Colors.grey,
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.auto_awesome,
                        size: 40,
                        color: _challengeCompleted ? Colors.blue : Colors.grey,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Điểm danh tự động',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: _challengeCompleted ? Colors.green : Colors.orange,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _challengeCompleted
                        ? '✅ Kiểm tra hoàn thành\n✅ Hệ thống sẽ tự động điểm danh\n✅ Không cần nhấn nút'
                        : '• Thực hiện các động tác được yêu cầu\n'
                            '• Giữ khuôn mặt trong khung hình\n'
                            '• Đảm bảo ánh sáng đủ sáng\n'
                            '• Hệ thống sẽ tự động xử lý',
                    style: TextStyle(
                      fontSize: 14,
                      color:
                          _challengeCompleted ? Colors.green : Colors.white70,
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

// Enhanced Custom painter for optimized display
class OptimizedFaceOverlayPainter extends CustomPainter {
  final FaceDetectionResult? faceResult;
  final List<LivenessChallenge> challenges;
  final int currentChallengeIndex;
  final bool livenessActive;
  final int consecutiveDetections;
  final int requiredDetections;

  OptimizedFaceOverlayPainter({
    required this.faceResult,
    required this.challenges,
    required this.currentChallengeIndex,
    required this.livenessActive,
    required this.consecutiveDetections,
    required this.requiredDetections,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Main face detection frame
    final paint = Paint()
      ..color = faceResult?.hasFace == true
          ? Colors.green.withOpacity(0.4)
          : Colors.blue.withOpacity(0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    final center = Offset(size.width / 2, size.height / 2);
    final faceRectSize = Rect.fromCenter(
      center: center,
      width: size.width * 0.75,
      height: size.height * 0.55,
    );

    final rrect = RRect.fromRectAndRadius(
      faceRectSize,
      const Radius.circular(25),
    );

    canvas.drawRRect(rrect, paint);

    // Draw corner markers
    _drawCornerMarkers(canvas, faceRectSize);

    // Draw challenge progress indicators
    if (livenessActive && challenges.isNotEmpty) {
      _drawChallengeProgress(canvas, size);
    }

    // Draw confidence indicator
    if (faceResult?.hasFace == true) {
      _drawConfidenceIndicator(canvas, size);
    }

    // Draw detection progress for current challenge
    if (consecutiveDetections > 0 && livenessActive) {
      _drawDetectionProgress(canvas, size);
    }
  }

  void _drawCornerMarkers(Canvas canvas, Rect rect) {
    final cornerPaint = Paint()
      ..color = faceResult?.hasFace == true ? Colors.green : Colors.blue
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;

    const cornerLength = 25.0;

    // Draw all four corners
    final corners = [
      // Top-left
      [
        Offset(rect.left, rect.top + cornerLength),
        Offset(rect.left, rect.top),
        Offset(rect.left + cornerLength, rect.top)
      ],
      // Top-right
      [
        Offset(rect.right - cornerLength, rect.top),
        Offset(rect.right, rect.top),
        Offset(rect.right, rect.top + cornerLength)
      ],
      // Bottom-left
      [
        Offset(rect.left, rect.bottom - cornerLength),
        Offset(rect.left, rect.bottom),
        Offset(rect.left + cornerLength, rect.bottom)
      ],
      // Bottom-right
      [
        Offset(rect.right - cornerLength, rect.bottom),
        Offset(rect.right, rect.bottom),
        Offset(rect.right, rect.bottom - cornerLength)
      ],
    ];

    for (final corner in corners) {
      canvas.drawLine(corner[0], corner[1], cornerPaint);
      canvas.drawLine(corner[1], corner[2], cornerPaint);
    }
  }

  void _drawChallengeProgress(Canvas canvas, Size size) {
    final indicatorPaint = Paint()..style = PaintingStyle.fill;
    const indicatorRadius = 6.0;
    const spacing = 25.0;
    final startX = (size.width - (challenges.length * spacing)) / 2;

    for (int i = 0; i < challenges.length; i++) {
      final challenge = challenges[i];
      final x = startX + (i * spacing);
      const y = 60.0;

      Color color;
      if (challenge.completed) {
        color = Colors.green;
      } else if (i == currentChallengeIndex) {
        color = Colors.orange;
      } else {
        color = Colors.grey.withOpacity(0.5);
      }

      indicatorPaint.color = color;
      canvas.drawCircle(Offset(x, y), indicatorRadius, indicatorPaint);

      // Draw check mark for completed challenges
      if (challenge.completed) {
        final checkPaint = Paint()
          ..color = Colors.white
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2;

        canvas.drawLine(Offset(x - 3, y), Offset(x - 1, y + 2), checkPaint);
        canvas.drawLine(Offset(x - 1, y + 2), Offset(x + 3, y - 2), checkPaint);
      }
    }
  }

  void _drawConfidenceIndicator(Canvas canvas, Size size) {
    final confidence = faceResult?.confidence ?? 0.0;

    // Draw confidence bar
    const barWidth = 80.0;
    const barHeight = 6.0;
    final barRect = Rect.fromLTWH(
      size.width - barWidth - 20,
      size.height - 60,
      barWidth,
      barHeight,
    );

    // Background
    canvas.drawRRect(
      RRect.fromRectAndRadius(barRect, const Radius.circular(3)),
      Paint()..color = const Color.fromARGB(137, 90, 90, 90),
    );

    // Progress
    final progressRect = Rect.fromLTWH(
      barRect.left,
      barRect.top,
      barWidth * confidence,
      barHeight,
    );

    canvas.drawRRect(
      RRect.fromRectAndRadius(progressRect, const Radius.circular(3)),
      Paint()..color = confidence > 0.7 ? Colors.green : Colors.orange,
    );
  }

  void _drawDetectionProgress(Canvas canvas, Size size) {
    final progress = consecutiveDetections / requiredDetections;
    final progressPaint = Paint()
      ..color = Colors.orange
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;

    final center = Offset(size.width / 2, size.height / 2);
    const radius = 40.0;

    // Draw progress circle
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      2 * pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

// Enhanced Liveness Challenge Class
class LivenessChallenge {
  final LivenessChallengeType type;
  final String instruction;
  bool completed;

  LivenessChallenge({
    required this.type,
    required this.instruction,
    this.completed = false,
  });
}

// Camera Permission Wrapper
class CameraPermissionWrapper extends StatelessWidget {
  final Widget child;
  final VoidCallback onPermissionDenied;

  const CameraPermissionWrapper({
    super.key,
    required this.child,
    required this.onPermissionDenied,
  });

  @override
  Widget build(BuildContext context) {
    return child;
  }
}
