// lib/screens/student/face_capture_screen_optimized.dart
import 'dart:io';
import 'dart:math';
import 'dart:async';
import 'dart:typed_data';
import 'package:face_attendance/services/ml_kit_face_service.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
    with WidgetsBindingObserver, TickerProviderStateMixin {
  final Logger _logger = Logger();

  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  bool _isProcessing = false;
  bool _isFlashOn = false;
  int _selectedCameraIndex = 0;

  String? _lastCapturedImagePath;
  String _statusMessage = 'Đang khởi tạo ML Kit...';
  Color _statusColor = Colors.blue;

  // ML Kit Service
  final MLKitFaceService _faceService = MLKitFaceService();
  StreamSubscription<CameraImage>? _imageStreamSubscription;

  // Performance monitoring
  final Stopwatch _performanceStopwatch = Stopwatch();
  int _totalFramesReceived = 0;
  int _totalFramesProcessed = 0;
  int _totalFramesDropped = 0;
  DateTime _lastPerformanceLog = DateTime.now();
  Timer? _performanceTimer;

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

  // Challenge Tracking với enhanced logging
  int _blinkCount = 0;
  int _requiredBlinks = 2;
  bool _previousEyeState = false; // true = open, false = closed
  DateTime? _lastBlinkTime;
  bool _isSmiling = false;
  double _headYaw = 0.0;
  Timer? _challengeTimer;

  // Liveness thresholds and counters
  static const int _minConsecutiveDetections = 3;
  int _consecutiveBlinkDetections = 0;
  int _consecutiveSmileDetections = 0;
  int _consecutiveHeadTurnDetections = 0;

  // Frame throttling
  DateTime? _lastProcessTime;
  static const Duration _minProcessInterval =
      Duration(milliseconds: 100); // Max 10 FPS processing

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeAnimations();
    _initializeServices();
    _startPerformanceMonitoring();
  }

  @override
  void dispose() {
    _logger.i('🧹 Disposing FaceCaptureScreen...');

    WidgetsBinding.instance.removeObserver(this);
    _imageStreamSubscription?.cancel();
    _challengeTimer?.cancel();
    _performanceTimer?.cancel();
    _cameraController?.dispose();
    _pulseAnimationController.dispose();
    _faceService.dispose();

    _logger.i('✅ FaceCaptureScreen disposed');
    super.dispose();
  }

  void _startPerformanceMonitoring() {
    _performanceTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      _logAppPerformance();
    });
  }

  void _logAppPerformance() {
    final now = DateTime.now();
    final duration = now.difference(_lastPerformanceLog);

    _logger.i('''
🚀 APP PERFORMANCE STATS (${duration.inSeconds}s):
   • Total frames received: $_totalFramesReceived
   • Total frames processed: $_totalFramesProcessed  
   • Total frames dropped: $_totalFramesDropped
   • Processing rate: ${(_totalFramesProcessed / duration.inSeconds).toStringAsFixed(1)} FPS
   • Drop rate: ${(_totalFramesDropped / max(1, _totalFramesReceived) * 100).toStringAsFixed(1)}%
   • Memory pressure: ${_getMemoryPressure()}
   • Camera state: ${_cameraController?.value.isInitialized ?? false ? 'OK' : 'NOT_READY'}
   • ML Kit ready: ${_faceService.initialize()}
   • Current challenge: ${_livenessCheckActive ? _challenges[_currentChallengeIndex].type : 'NONE'}
''');

    _totalFramesReceived = 0;
    _totalFramesProcessed = 0;
    _totalFramesDropped = 0;
    _lastPerformanceLog = now;
  }

  String _getMemoryPressure() {
    // Simple memory pressure indicator
    final rss = ProcessInfo.currentRss;
    final maxRss = ProcessInfo.maxRss;
    final pressure = (rss / maxRss * 100);

    if (pressure > 80) return 'HIGH';
    if (pressure > 60) return 'MEDIUM';
    return 'LOW';
  }

  void _initializeAnimations() {
    _pulseAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseAnimationController,
      curve: Curves.easeInOut,
    ));

    _pulseAnimationController.repeat(reverse: true);
  }

  Future<void> _initializeServices() async {
    try {
      _logger.i('🚀 Starting service initialization...');

      // Initialize ML Kit với performance tracking
      final mlKitStopwatch = Stopwatch()..start();
      final initialized = await _faceService.initialize();
      mlKitStopwatch.stop();

      if (!initialized) {
        _setStatus('Lỗi khởi tạo ML Kit', Colors.red);
        _logger.e('❌ ML Kit initialization failed');
        return;
      }

      _logger
          .i('✅ ML Kit initialized in ${mlKitStopwatch.elapsedMilliseconds}ms');

      // Initialize camera với performance tracking
      final cameraStopwatch = Stopwatch()..start();
      await _initializeCamera();
      cameraStopwatch.stop();

      _logger.i(
          '✅ Camera initialized in ${cameraStopwatch.elapsedMilliseconds}ms');
    } catch (e) {
      _logger.e('❌ Service initialization error: $e');
      _setStatus('Lỗi khởi tạo: $e', Colors.red);
    }
  }

  Future<void> _initializeCamera() async {
    try {
      _logger.i('📷 Initializing camera...');

      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) {
        _setStatus('Không tìm thấy camera', Colors.red);
        _logger.e('❌ No cameras found');
        return;
      }

      _logger.i('📷 Found ${_cameras!.length} cameras');
      for (int i = 0; i < _cameras!.length; i++) {
        final camera = _cameras![i];
        _logger.i('   Camera $i: ${camera.name} - ${camera.lensDirection}');
      }

      // Ưu tiên camera trước (selfie camera)
      int frontCameraIndex = _cameras!.indexWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
      );

      if (frontCameraIndex != -1) {
        _selectedCameraIndex = frontCameraIndex;
        _logger.i('📷 Using front camera at index $frontCameraIndex');
      } else {
        _selectedCameraIndex = 0;
        _logger.i('📷 Using default camera at index 0');
      }

      await _setupCamera(_selectedCameraIndex);
    } catch (e) {
      _logger.e('❌ Camera initialization error: $e');
      _setStatus('Lỗi khởi tạo camera: $e', Colors.red);
    }
  }

  Future<void> _setupCamera(int cameraIndex) async {
    try {
      _logger.i('⚙️ Setting up camera $cameraIndex...');

      if (_cameraController != null) {
        _logger.d('🧹 Disposing previous camera controller...');
        await _cameraController!.dispose();
        _imageStreamSubscription?.cancel();
      }

      final setupStopwatch = Stopwatch()..start();

      _cameraController = CameraController(
        _cameras![cameraIndex],
        ResolutionPreset
            .medium, // Changed from high to medium for better performance
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.yuv420,
      );

      await _cameraController!.initialize();

      setupStopwatch.stop();
      _logger.i(
          '✅ Camera setup completed in ${setupStopwatch.elapsedMilliseconds}ms');

      if (mounted) {
        setState(() {
          _isInitialized = true;
          _selectedCameraIndex = cameraIndex;
        });

        _setStatus(
            'Camera đã sẵn sàng - Bắt đầu kiểm tra liveness', Colors.green);
        _generateRandomChallenges();
        _startLivenessDetection();
      }
    } catch (e) {
      _logger.e('❌ Camera setup error: $e');
      _setStatus('Lỗi thiết lập camera: $e', Colors.red);
    }
  }

  void _generateRandomChallenges() {
    _logger.i('🎲 Generating random liveness challenges...');

    final random = Random();
    final challengeTypes = [
      LivenessChallengeType.blink,
      LivenessChallengeType.smile,
      LivenessChallengeType.turnLeft,
      LivenessChallengeType.turnRight,
    ];

    // Generate 2-3 random challenges
    _challenges.clear();
    final challengeCount = 2 + random.nextInt(2); // 2 or 3 challenges

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

    _logger.i(
        '🎯 Generated ${_challenges.length} challenges: ${_challenges.map((c) => c.type).toList()}');
  }

  String _getInstructionForChallenge(LivenessChallengeType type) {
    switch (type) {
      case LivenessChallengeType.blink:
        return 'Chớp mắt $_requiredBlinks lần';
      case LivenessChallengeType.smile:
        return 'Mỉm cười';
      case LivenessChallengeType.turnLeft:
        return 'Quay đầu sang trái';
      case LivenessChallengeType.turnRight:
        return 'Quay đầu sang phải';
      case LivenessChallengeType.nod:
        return 'Gật đầu';
    }
  }

  void _setStatus(String message, Color color) {
    if (mounted) {
      setState(() {
        _statusMessage = message;
        _statusColor = color;
      });
    }
    _logger.i('📝 Status: $message');
  }

  void _startLivenessDetection() {
    _logger.i('🎭 Starting liveness detection...');

    setState(() {
      _livenessCheckActive = true;
      _currentChallengeIndex = 0;
      _blinkCount = 0;
      _consecutiveBlinkDetections = 0;
      _consecutiveSmileDetections = 0;
      _consecutiveHeadTurnDetections = 0;
    });

    _setStatus(_challenges[0].instruction, Colors.orange);
    _startImageStream();

    // Set timeout for each challenge
    _challengeTimer = Timer(const Duration(seconds: 15), () {
      // Increased timeout
      if (_livenessCheckActive &&
          !_challenges[_currentChallengeIndex].completed) {
        _logger.w(
            '⏱️ Challenge timeout for ${_challenges[_currentChallengeIndex].type}');
        _setStatus('Thời gian hết! Thử lại...', Colors.red);
        _resetLivenessCheck();
      }
    });
  }

  void _startImageStream() {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      _logger.e('❌ Cannot start image stream - camera not ready');
      return;
    }

    _logger.i('📹 Starting camera image stream...');
    _performanceStopwatch.start();

    _cameraController!.startImageStream((CameraImage image) async {
      _totalFramesReceived++;

      // Frame throttling to reduce load
      final now = DateTime.now();
      if (_lastProcessTime != null &&
          now.difference(_lastProcessTime!) < _minProcessInterval) {
        _totalFramesDropped++;
        return; // Skip this frame
      }
      _lastProcessTime = now;

      if (!_livenessCheckActive || _isProcessing) {
        _totalFramesDropped++;
        return;
      }

      // Process frame on background
      _processFrameAsync(image);
    });
  }

  void _processFrameAsync(CameraImage image) async {
    try {
      setState(() {
        _isProcessing = true;
      });

      final result = await _faceService.processCameraImage(image);

      _logger.d(
          '📸 Frame processed: hasFace=${result?.hasFace}, landmarks=${result?.landmarks.length}')  ;
      

      if (result != null && mounted) {
        _logger.i(
            '✅ Frame processed successfully: hasFace=${result.hasFace}, confidence=${result.confidence.toStringAsFixed(2)}');
        _totalFramesProcessed++;

        setState(() {
          _currentFaceResult = result;
          _faceDetected = result.hasFace;
        });

        if (result.hasFace && result.landmarks.isNotEmpty) {
          _processLivenessChallenge(result);
        } else {
          // Reset consecutive detections when no face
          _resetConsecutiveDetections(_challenges[_currentChallengeIndex].type);
        }
      } else {
        _totalFramesDropped++;
      }
    } catch (e) {
      _logger.e('❌ Frame processing error: $e');
      _totalFramesDropped++;
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

    _logger.d(
        '🎭 Challenge ${currentChallenge.type}: detected=${analysis.detected}, confidence=${analysis.confidence.toStringAsFixed(2)}');

    if (analysis.detected && analysis.confidence > 0.2) {
      // Lowered threshold slightly
      _handleChallengeDetection(currentChallenge, analysis);
    } else {
      _resetConsecutiveDetections(currentChallenge.type);
    }
  }

  void _handleChallengeDetection(
      LivenessChallenge challenge, LivenessAnalysis analysis) {
    switch (challenge.type) {
      case LivenessChallengeType.blink:
        // Xử lý chớp mắt không cần phát hiện liên tục
        _handleBlinkDetection(analysis);
        break;
      case LivenessChallengeType.smile:
        _consecutiveSmileDetections++;
        _logger.d(
            '😊 Smile detection: consecutive=$_consecutiveSmileDetections/$_minConsecutiveDetections');
        if (_consecutiveSmileDetections >= _minConsecutiveDetections) {
          _completeCurrentChallenge();
        }
        break;
      case LivenessChallengeType.turnLeft:
      case LivenessChallengeType.turnRight:
        _consecutiveHeadTurnDetections++;
        _logger.d(
            '🔄 Head turn detection: type=${challenge.type}, consecutive=$_consecutiveHeadTurnDetections/$_minConsecutiveDetections');
        if (_consecutiveHeadTurnDetections >= _minConsecutiveDetections) {
          _completeCurrentChallenge();
        }
        break;
      case LivenessChallengeType.nod:
        // Gật đầu cũng là sự kiện, có thể hoàn thành ngay
        _logger.d('📍 Nod detected - completing challenge');
        _completeCurrentChallenge();
        break;
    }
  }

  void _handleBlinkDetection(LivenessAnalysis analysis) {
    // Lấy trạng thái mắt hiện tại từ ML Kit
    final avgEyeOpen =
        analysis.data['average_eye_open_probability'] as double? ?? 1.0;
    final bool isEyesCurrentlyClosed = avgEyeOpen < 0.4; // Ngưỡng mắt nhắm

    // Phát hiện sự kiện chớp mắt: là khi mắt chuyển từ trạng thái "nhắm" sang "mở"
    // _previousEyeState == false (frame trước mắt đang nhắm)
    // isEyesCurrentlyClosed == false (frame này mắt đã mở)
    if (!_previousEyeState && !isEyesCurrentlyClosed) {
      final now = DateTime.now();
      // Thêm một khoảng nghỉ để tránh 1 lần rung mi mắt bị đếm nhiều lần
      if (_lastBlinkTime == null ||
          now.difference(_lastBlinkTime!).inMilliseconds > 500) {
        _blinkCount++;
        _lastBlinkTime = now;
        _logger.i('👁️ BLINK DETECTED! Count: $_blinkCount/$_requiredBlinks');
        _setStatus('Chớp mắt ($_blinkCount/$_requiredBlinks)', Colors.blue);

        // Haptic feedback cho mỗi lần chớp mắt thành công
        HapticFeedback.lightImpact();

        if (_blinkCount >= _requiredBlinks) {
          _logger.i('✅ Blink challenge completed!');
          _completeCurrentChallenge();
        }
      }
    }

    // Cập nhật trạng thái mắt của frame trước đó cho lần xử lý tiếp theo
    _previousEyeState = isEyesCurrentlyClosed;
  }

  void _handleSmileDetection() {
    _consecutiveSmileDetections++;
    _logger.d(
        '😊 Smile detection: consecutive=$_consecutiveSmileDetections/$_minConsecutiveDetections');

    if (_consecutiveSmileDetections >= _minConsecutiveDetections) {
      _completeCurrentChallenge();
    }
  }

  void _handleHeadTurnDetection(LivenessChallengeType turnType) {
    _consecutiveHeadTurnDetections++;
    _logger.d(
        '🔄 Head turn detection: type=$turnType, consecutive=$_consecutiveHeadTurnDetections/$_minConsecutiveDetections');

    if (_consecutiveHeadTurnDetections >= _minConsecutiveDetections) {
      _completeCurrentChallenge();
    }
  }

  void _handleNodDetection() {
    _logger.d('📍 Nod detected - completing challenge');
    _completeCurrentChallenge();
  }

  void _resetConsecutiveDetections(LivenessChallengeType type) {
    switch (type) {
      case LivenessChallengeType.blink:
        // Không cần làm gì với chớp mắt vì chúng ta không dùng bộ đếm liên tục nữa.
        // Trạng thái _previousEyeState sẽ tự điều chỉnh.
        break;
      case LivenessChallengeType.smile:
        if (_consecutiveSmileDetections > 0) {
          _logger.d('😊 Smile streak broken');
          _consecutiveSmileDetections = 0;
        }
        break;
      case LivenessChallengeType.turnLeft:
      case LivenessChallengeType.turnRight:
        if (_consecutiveHeadTurnDetections > 0) {
          _logger.d('🔄 Head turn streak broken');
          _consecutiveHeadTurnDetections = 0;
        }
        break;
      case LivenessChallengeType.nod:
        break;
    }
  }

  void _completeCurrentChallenge() {
    if (_currentChallengeIndex < _challenges.length) {
      _logger.i(
          '✅ Challenge completed: ${_challenges[_currentChallengeIndex].type}');

      setState(() {
        _challenges[_currentChallengeIndex].completed = true;
        _currentChallengeIndex++;
      });

      _challengeTimer?.cancel();

      if (_currentChallengeIndex < _challenges.length) {
        // Move to next challenge
        _logger.i(
            '➡️ Moving to next challenge: ${_challenges[_currentChallengeIndex].type}');
        _setStatus(
            _challenges[_currentChallengeIndex].instruction, Colors.orange);
        _resetChallengeVariables();

        _challengeTimer = Timer(const Duration(seconds: 15), () {
          if (_livenessCheckActive &&
              !_challenges[_currentChallengeIndex].completed) {
            _logger.w(
                '⏱️ Challenge timeout for ${_challenges[_currentChallengeIndex].type}');
            _setStatus('Thời gian hết! Thử lại...', Colors.red);
            _resetLivenessCheck();
          }
        });
      } else {
        _completeLivenessCheck();
      }
    }
  }

  void _resetChallengeVariables() {
    _blinkCount = 0;
    _consecutiveBlinkDetections = 0;
    _consecutiveSmileDetections = 0;
    _consecutiveHeadTurnDetections = 0;
    _previousEyeState = false;
    _lastBlinkTime = null;
  }

  void _completeLivenessCheck() {
    _logger.i('🎉 All liveness challenges completed!');

    _challengeTimer?.cancel();
    _imageStreamSubscription?.cancel();

    setState(() {
      _livenessCheckActive = false;
      _challengeCompleted = true;
    });
    _setStatus(
        'Kiểm tra liveness hoàn thành! Nhấn chụp để điểm danh', Colors.green);

    // Haptic feedback
    HapticFeedback.mediumImpact();
  }

  void _resetLivenessCheck() {
    _logger.i('🔄 Resetting liveness check...');

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
    _logger.i('🔄 App lifecycle state changed: $state');

    final CameraController? cameraController = _cameraController;
    if (cameraController == null || !cameraController.value.isInitialized) {
      return;
    }

    if (state == AppLifecycleState.inactive) {
      _logger.i('⏸️ App inactive - pausing camera');
      _imageStreamSubscription?.cancel();
      cameraController.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _logger.i('▶️ App resumed - reinitializing camera');
      _initializeCamera();
    }
  }

  Future<void> _captureAndRecognize() async {
    if (!_isInitialized || _isProcessing || _cameraController == null) {
      _logger.w('⚠️ Cannot capture - not ready');
      return;
    }

    if (!_challengeCompleted) {
      _setStatus('Vui lòng hoàn thành kiểm tra liveness trước', Colors.red);
      _logger.w('⚠️ Capture blocked - liveness not completed');
      return;
    }

    _logger.i('📸 Starting capture and recognition...');

    setState(() {
      _isProcessing = true;
    });

    final captureStopwatch = Stopwatch()..start();

    try {
      _imageStreamSubscription?.cancel();

      _setStatus('Đang chụp ảnh...', Colors.orange);

      // Capture image
      final XFile imageFile = await _cameraController!.takePicture();
      _lastCapturedImagePath = imageFile.path;

      _logger.i('📷 Image captured: ${imageFile.path}');

      _setStatus('Đang xử lý nhận diện khuôn mặt...', Colors.blue);

      // Send for face recognition and attendance marking
      final apiStopwatch = Stopwatch()..start();
      final result = await ApiService().markAttendance(
        sessionId: widget.sessionId,
        imageFile: File(imageFile.path),
      );
      apiStopwatch.stop();

      captureStopwatch.stop();
      _logger
          .i('📤 API call completed in ${apiStopwatch.elapsedMilliseconds}ms');
      _logger.i(
          '⏱️ Total capture process: ${captureStopwatch.elapsedMilliseconds}ms');

      if (result.success) {
        _setStatus('Điểm danh thành công!', Colors.green);
        _logger.i('✅ Attendance marked successfully');

        // Show success dialog
        _showSuccessDialog(result.data!);

        // Callback to refresh parent screen
        if (widget.onFaceTrained != null) {
          widget.onFaceTrained!();
        }

        // Haptic feedback
        HapticFeedback.heavyImpact();

        // Auto close after 3 seconds
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) {
            Navigator.of(context).pop();
          }
        });
      } else {
        _logger.e('❌ Attendance marking failed: ${result.message}');
        _setStatus('Điểm danh thất bại: ${result.message}', Colors.red);
        // Reset liveness check for retry
        _resetLivenessCheck();
      }
    } catch (e) {
      captureStopwatch.stop();
      _logger.e('❌ Capture and recognize error: $e');
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
                Text('Liveness check: Passed',
                    style: TextStyle(color: Colors.green)),
              ],
            ),
            Text('Challenges completed: ${_challenges.length}'),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.speed, color: Colors.blue, size: 16),
                SizedBox(width: 4),
                Text('ML Kit processing: Optimized',
                    style: TextStyle(color: Colors.blue)),
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

    _logger.i('📷 Switching camera...');

    setState(() {
      _isProcessing = true;
    });

    try {
      int nextCameraIndex = (_selectedCameraIndex + 1) % _cameras!.length;
      await _setupCamera(nextCameraIndex);
      _logger.i('📷 Camera switched to index $nextCameraIndex');
    } catch (e) {
      _logger.e('❌ Switch camera error: $e');
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
      _logger.i('💡 Flash ${_isFlashOn ? 'ON' : 'OFF'}');
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
            Text('Đang khởi tạo camera và ML Kit...'),
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
            painter: MLKitFaceOverlayPainter(
              faceResult: _currentFaceResult,
              challenges: _challenges,
              currentChallengeIndex: _currentChallengeIndex,
              livenessActive: _livenessCheckActive,
              blinkCount: _blinkCount,
              requiredBlinks: _requiredBlinks,
            ),
          ),
        ),

        // Performance indicator (debug mode)
        if (kDebugMode)
          Positioned(
            top: 10,
            right: 10,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'FPS: ${(_totalFramesProcessed / max(1, _performanceStopwatch.elapsed.inSeconds)).toStringAsFixed(1)}',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                  Text(
                    'Drop: ${(_totalFramesDropped / max(1, _totalFramesReceived) * 100).toStringAsFixed(0)}%',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ],
              ),
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
              color: Colors.black87,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                AnimatedBuilder(
                  animation: _pulseAnimation,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _livenessCheckActive ? _pulseAnimation.value : 1.0,
                      child: Text(
                        _statusMessage,
                        style: TextStyle(
                          color: _statusColor,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    );
                  },
                ),
                if (_livenessCheckActive) ...[
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: (_currentChallengeIndex) / _challenges.length,
                    backgroundColor: Colors.grey[300],
                    valueColor: AlwaysStoppedAnimation<Color>(_statusColor),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Bước ${_currentChallengeIndex + 1}/${_challenges.length}',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                ],
                if (_faceDetected) ...[
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.face, color: Colors.green, size: 16),
                      const SizedBox(width: 4),
                      Text(
                          'Face detected (${(_currentFaceResult?.confidence ?? 0.0 * 100).toStringAsFixed(0)}%)',
                          style: const TextStyle(
                              color: Colors.green, fontSize: 12)),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),

        // Challenge instructions
        if (_livenessCheckActive && _currentChallengeIndex < _challenges.length)
          Positioned(
            bottom: 200,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  AnimatedBuilder(
                    animation: _pulseAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _pulseAnimation.value,
                        child: Icon(
                          _getIconForChallenge(
                              _challenges[_currentChallengeIndex].type),
                          size: 48,
                          color: Colors.white,
                        ),
                      );
                    },
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
                  if (_challenges[_currentChallengeIndex].type ==
                      LivenessChallengeType.blink)
                    Text(
                      'Đã chớp: $_blinkCount/$_requiredBlinks',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                      textAlign: TextAlign.center,
                    ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  IconData _getIconForChallenge(LivenessChallengeType type) {
    switch (type) {
      case LivenessChallengeType.blink:
        return Icons.remove_red_eye;
      case LivenessChallengeType.smile:
        return Icons.sentiment_satisfied;
      case LivenessChallengeType.turnLeft:
        return Icons.arrow_back;
      case LivenessChallengeType.turnRight:
        return Icons.arrow_forward;
      case LivenessChallengeType.nod:
        return Icons.vertical_align_center;
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
                color: _challengeCompleted ? Colors.white : Colors.grey[300],
                border: Border.all(
                  color: _challengeCompleted ? Colors.green : Colors.grey,
                  width: 4,
                ),
                boxShadow: _challengeCompleted
                    ? [
                        BoxShadow(
                          color: Colors.green.withOpacity(0.3),
                          blurRadius: 10,
                          spreadRadius: 2,
                        ),
                      ]
                    : null,
              ),
              child: _isProcessing
                  ? const CircularProgressIndicator(
                      strokeWidth: 3,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                    )
                  : Icon(
                      Icons.camera_alt,
                      size: 40,
                      color: _challengeCompleted ? Colors.green : Colors.grey,
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
          title: const Text('Điểm danh bằng khuôn mặt + ML Kit'),
          backgroundColor: Colors.blueAccent,
          foregroundColor: Colors.white,
          elevation: 0,
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _resetLivenessCheck,
              tooltip: 'Làm mới kiểm tra',
            ),
            if (kDebugMode)
              IconButton(
                icon: const Icon(Icons.analytics),
                onPressed: _logAppPerformance,
                tooltip: 'Performance Stats',
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.security,
                        size: 48,
                        color:
                            _challengeCompleted ? Colors.green : Colors.orange,
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.face,
                        size: 48,
                        color: _faceDetected ? Colors.green : Colors.grey,
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.speed,
                        size: 48,
                        color: _isProcessing ? Colors.blue : Colors.grey,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Kiểm tra Liveness + ML Kit Optimized',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: _challengeCompleted ? Colors.green : Colors.orange,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _challengeCompleted
                        ? '✓ Kiểm tra hoàn thành\n✓ Sẵn sàng điểm danh\n✓ ML Kit verified\n✓ Performance optimized'
                        : '• Thực hiện các thao tác được yêu cầu\n'
                            '• Giữ khuôn mặt trong khung hình\n'
                            '• Đảm bảo ánh sáng đủ sáng\n'
                            '• ML Kit đang phân tích...\n'
                            '• Frame throttling: Enabled',
                    style: TextStyle(
                      fontSize: 14,
                      color: _challengeCompleted
                          ? Colors.green
                          : const Color.fromARGB(179, 0, 0, 0),
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),

                  // Performance stats in debug mode
                  if (kDebugMode) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'DEBUG STATS',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[700],
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Received: $_totalFramesReceived | Processed: $_totalFramesProcessed | Dropped: $_totalFramesDropped',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.grey[600],
                            ),
                          ),
                          Text(
                            'FPS: ${(_totalFramesProcessed / max(1, _performanceStopwatch.elapsed.inSeconds)).toStringAsFixed(1)} | '
                            'Drop Rate: ${(_totalFramesDropped / max(1, _totalFramesReceived) * 100).toStringAsFixed(1)}%',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
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

// Enhanced Custom painter with ML Kit landmarks
class MLKitFaceOverlayPainter extends CustomPainter {
  final FaceDetectionResult? faceResult;
  final List<LivenessChallenge> challenges;
  final int currentChallengeIndex;
  final bool livenessActive;
  final int blinkCount;
  final int requiredBlinks;

  MLKitFaceOverlayPainter({
    required this.faceResult,
    required this.challenges,
    required this.currentChallengeIndex,
    required this.livenessActive,
    required this.blinkCount,
    required this.requiredBlinks,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = faceResult?.hasFace == true
          ? Colors.green.withOpacity(0.3)
          : Colors.blue.withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    // Draw face detection frame
    final center = Offset(size.width / 2, size.height / 2);
    final faceRectSize = Rect.fromCenter(
      center: center,
      width: size.width * 0.7,
      height: size.height * 0.5,
    );

    // Draw rounded rectangle
    final rrect = RRect.fromRectAndRadius(
      faceRectSize,
      const Radius.circular(20),
    );

    canvas.drawRRect(rrect, paint);

    // Draw ML Kit landmarks if available (simplified for performance)
    if (faceResult?.hasFace == true && faceResult!.landmarks.isNotEmpty) {
      _drawSimplifiedLandmarks(canvas, size);
    }

    // Draw corner markers
    final cornerPaint = Paint()
      ..color = faceResult?.hasFace == true ? Colors.green : Colors.blue
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;

    const cornerLength = 30.0;

    // Top-left corner
    canvas.drawLine(
      Offset(faceRectSize.left, faceRectSize.top + cornerLength),
      Offset(faceRectSize.left, faceRectSize.top),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(faceRectSize.left, faceRectSize.top),
      Offset(faceRectSize.left + cornerLength, faceRectSize.top),
      cornerPaint,
    );

    // Top-right corner
    canvas.drawLine(
      Offset(faceRectSize.right - cornerLength, faceRectSize.top),
      Offset(faceRectSize.right, faceRectSize.top),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(faceRectSize.right, faceRectSize.top),
      Offset(faceRectSize.right, faceRectSize.top + cornerLength),
      cornerPaint,
    );

    // Bottom-left corner
    canvas.drawLine(
      Offset(faceRectSize.left, faceRectSize.bottom - cornerLength),
      Offset(faceRectSize.left, faceRectSize.bottom),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(faceRectSize.left, faceRectSize.bottom),
      Offset(faceRectSize.left + cornerLength, faceRectSize.bottom),
      cornerPaint,
    );

    // Bottom-right corner
    canvas.drawLine(
      Offset(faceRectSize.right - cornerLength, faceRectSize.bottom),
      Offset(faceRectSize.right, faceRectSize.bottom),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(faceRectSize.right, faceRectSize.bottom - cornerLength),
      Offset(faceRectSize.right, faceRectSize.bottom),
      cornerPaint,
    );

    // Draw challenge indicators
    if (livenessActive && challenges.isNotEmpty) {
      _drawChallengeIndicators(canvas, size);
    }

    // Draw confidence score
    if (faceResult?.hasFace == true) {
      _drawConfidenceScore(canvas, size);
    }
  }

  void _drawSimplifiedLandmarks(Canvas canvas, Size size) {
    if (faceResult?.landmarks == null || faceResult!.landmarks.isEmpty) return;

    final landmarkPaint = Paint()
      ..color = Colors.red
      ..style = PaintingStyle.fill;

    // Draw only key landmarks (every 15th point for performance)
    for (int i = 0; i < faceResult!.landmarks.length; i += 15) {
      final landmark = faceResult!.landmarks[i];
      final x = landmark.x * size.width;
      final y = landmark.y * size.height;

      canvas.drawCircle(Offset(x, y), 1.5, landmarkPaint);
    }
  }

  void _drawConfidenceScore(Canvas canvas, Size size) {
    final confidence = faceResult?.confidence ?? 0.0;
    final confidencePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final textPainter = TextPainter(
      text: TextSpan(
        text: '${(confidence * 100).toStringAsFixed(0)}%',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
    );

    textPainter.layout();

    final rect = Rect.fromLTWH(
      size.width - textPainter.width - 20,
      size.height - textPainter.height - 20,
      textPainter.width + 10,
      textPainter.height + 6,
    );

    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, const Radius.circular(8)),
      Paint()..color = Colors.black54,
    );

    textPainter.paint(
      canvas,
      Offset(rect.left + 5, rect.top + 3),
    );
  }

  void _drawChallengeIndicators(Canvas canvas, Size size) {
    final indicatorPaint = Paint()..style = PaintingStyle.fill;

    const indicatorRadius = 8.0;
    const spacing = 20.0;
    final startX = (size.width - (challenges.length * spacing)) / 2;

    for (int i = 0; i < challenges.length; i++) {
      final challenge = challenges[i];
      final x = startX + (i * spacing);
      const y = 30.0;

      if (challenge.completed) {
        indicatorPaint.color = Colors.green;
      } else if (i == currentChallengeIndex) {
        indicatorPaint.color = Colors.orange;
      } else {
        indicatorPaint.color = Colors.grey;
      }

      canvas.drawCircle(Offset(x, y), indicatorRadius, indicatorPaint);

      // Draw check mark for completed challenges
      if (challenge.completed) {
        final checkPaint = Paint()
          ..color = Colors.white
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2;

        canvas.drawLine(
          Offset(x - 3, y),
          Offset(x - 1, y + 2),
          checkPaint,
        );
        canvas.drawLine(
          Offset(x - 1, y + 2),
          Offset(x + 3, y - 2),
          checkPaint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

// Liveness Challenge Classes
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

// Camera Permission Wrapper (placeholder - implement based on your existing CameraHelper)
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
    // This should implement your camera permission logic
    return child;
  }
}
