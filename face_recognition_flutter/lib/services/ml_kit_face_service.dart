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
  static const int _maxQueueSize = 1; // Giảm từ 3 xuống 1 để tránh lag
  DateTime? _lastSuccessfulProcessTime;
  int _processingTimeMs = 0;

  Future<bool> initialize() async {
    try {
      if (_isInitialized) return true;

      _logger.i('🚀 Initializing Improved ML Kit Face Service...');

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
      
      _logger.i('✅ ML Kit FaceDetector configured:');
      _logger.i('   minFaceSize: 0.05 (5% of image)');
      _logger.i('   performanceMode: fast');
      _logger.i('   enableLandmarks: true');
      _logger.i('   enableClassification: true');

      _isInitialized = true;
      _logger.i('✅ Improved ML Kit initialized with device-specific settings');
      
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
        _logger.i('📱 Android device detected - using optimized settings');
      } else if (Platform.isIOS) {
        // For iOS devices
        _deviceSpecificRotation = InputImageRotation.rotation0deg;
        _logger.i('📱 iOS device detected - using iOS-specific rotation');
      }
    } catch (e) {
      _logger.w('⚠️ Could not detect device configuration: $e');
    }
  }

  // Method để reinitialize ML Kit khi có vấn đề
  Future<bool> _reinitializeMLKit() async {
    try {
      _logger.i('🔄 Reinitializing ML Kit due to null result...');
      
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
      
      _logger.i('✅ ML Kit reinitialized successfully');
      return true;
    } catch (e) {
      _logger.e('❌ Failed to reinitialize ML Kit: $e');
      return false;
    }
  }

  // Thêm method để test với cấu hình ML Kit khác
  Future<bool> reinitializeWithDifferentSettings() async {
    try {
      _logger.i('🔄 Reinitializing ML Kit with alternative settings...');
      
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
      
      _logger.i('✅ ML Kit reconfigured with ultra-permissive settings:');
      _logger.i('   minFaceSize: 0.01 (1% of image)');
      _logger.i('   performanceMode: accurate');
      _logger.i('   landmarks: disabled');
      _logger.i('   classification: disabled');
      
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
      
      // Log performance statistics
      _logger.i('📊 ML Kit Performance Stats:');
      _logger.i('   Frames processed: $_frameProcessedCount');
      _logger.i('   Frames dropped: $_frameDroppedCount');
      _logger.i('   Detection failures: $_faceDetectionFailures');
      _logger.i('✅ ML Kit disposed');
    } catch (e) {
      _logger.e('❌ ML Kit dispose error: $e');
    }
  }

  Future<FaceDetectionResult?> processCameraImage(CameraImage image) async {
    try {
      // Debug camera image data với comprehensive null checks
      _logger.d('📷 Camera Image Debug:');
      
      if (image == null) {
        _logger.e('❌ CRITICAL: Camera image is completely NULL!');
        return null;
      }
      
      try {
        _logger.d('   Image object exists: ✅');
        _logger.d('   Width: ${image.width ?? 'NULL'}');
        _logger.d('   Height: ${image.height ?? 'NULL'}');
        
        // Safe format access
        try {
          _logger.d('   Format group: ${image.format?.group ?? 'NULL'}');
          _logger.d('   Format raw: ${image.format ?? 'NULL'}');
        } catch (e) {
          _logger.e('❌ Error accessing image format: $e');
        }
        
        // Safe planes access
        try {
          final planesCount = image.planes?.length ?? 0;
          _logger.d('   Planes count: $planesCount');
          
          if (image.planes == null) {
            _logger.e('❌ CRITICAL: Image planes is NULL!');
            return null;
          }
          
          if (image.planes!.isEmpty) {
            _logger.e('❌ CRITICAL: Image planes is EMPTY!');
            return null;
          }
          
          // Check each plane
          for (int i = 0; i < image.planes!.length; i++) {
            final plane = image.planes![i];
            if (plane == null) {
              _logger.e('❌ CRITICAL: Plane $i is NULL!');
              continue;
            }
            
            try {
              final bytesLength = plane.bytes?.length ?? 0;
              final bytesPerRow = plane.bytesPerRow ?? 0;
              // final pixelStride = plane.pixelStride ?? 0;
              
              _logger.d('   Plane $i:');
              _logger.d('     - Bytes length: $bytesLength');
              _logger.d('     - Bytes per row: $bytesPerRow');
              // _logger.d('     - Pixel stride: $pixelStride');
              
              if (plane.bytes == null) {
                _logger.e('❌ CRITICAL: Plane $i bytes is NULL!');
              } else if (plane.bytes!.isEmpty) {
                _logger.e('❌ CRITICAL: Plane $i bytes is EMPTY!');
              }
            } catch (e) {
              _logger.e('❌ Error accessing plane $i properties: $e');
            }
          }
        } catch (e) {
          _logger.e('❌ Error accessing image planes: $e');
        }
        
        // Validate image dimensions
        final width = image.width ?? 0;
        final height = image.height ?? 0;
        
        if (width <= 0 || height <= 0) {
          _logger.e('❌ CRITICAL: Invalid image dimensions: ${width}x${height}');
          return null;
        }
        
        _logger.d('✅ Image validation passed: ${width}x${height}');
        
      } catch (e) {
        _logger.e('❌ CRITICAL: Error during image debug analysis: $e');
        _logger.e('Stack trace: ${StackTrace.current}');
        return null;
      }

      if (!_isInitialized) {
        _logger.w('⚠️ ML Kit not initialized, initializing now...');
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
          _logger.d('⏭️ Frame skipped - processing too slow (${_processingTimeMs}ms)');
          return null;
        }
      }

      // Skip processing if queue is full OR already processing
      if (_isProcessingFrame) {
        _frameDroppedCount++;
        _logger.d('⏭️ Frame dropped - already processing (queue: ${_frameQueue.length}/$_maxQueueSize)');
        return null;
      }

      _logger.d('🔄 Processing frame (queue size: ${_frameQueue.length}, processing_time: ${_processingTimeMs}ms)');

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
      _logger.d('🔄 Starting image processing...');

      // Try multiple image conversion methods for better compatibility
      InputImage? inputImage = await _convertCameraImageWithFallback(image);

      if (inputImage == null) {
        _logger.e('❌ Image conversion failed completely');
        _faceDetectionFailures++;
        return null;
      }

      _logger.d('✅ Image converted successfully in ${stopwatch.elapsedMilliseconds}ms');

      // Process with ML Kit dengan comprehensive error handling
      _logger.d('🧠 Running ML Kit face detection...');
      _logger.d('   Input image size: ${inputImage.metadata?.size}');
      _logger.d('   Input image rotation: ${inputImage.metadata?.rotation}');
      _logger.d('   Input image format: ${inputImage.metadata?.format}');
      _logger.d('   Expected min face size: ${(image.width * image.height * 0.05).toInt()} pixels');
      
      final faceStopwatch = Stopwatch()..start();
      List<Face>? faces;
      
      try {
        faces = await _faceDetector.processImage(inputImage);
        faceStopwatch.stop();
        
        if (faces == null) {
          _consecutiveNullResults++;
          _logger.e('❌ CRITICAL: ML Kit returned NULL result! (${_consecutiveNullResults} consecutive)');
          _logger.e('   This indicates ML Kit processing failure');
          _logger.e('   Possible causes:');
          _logger.e('   - Invalid InputImage format');
          _logger.e('   - ML Kit model not loaded');
          _logger.e('   - Memory issues');
          _logger.e('   - Platform compatibility issues');
          
          // Strategy 1: Try to reinitialize ML Kit (first time)
          if (_consecutiveNullResults <= 3 && !_hasTriedReinitialization) {
            _logger.i('🔄 Strategy 1: Attempting to reinitialize ML Kit...');
            _hasTriedReinitialization = true;
            final reinitSuccess = await _reinitializeMLKit();
            if (reinitSuccess) {
              _logger.i('✅ ML Kit reinitialized, retrying...');
              try {
                faces = await _faceDetector.processImage(inputImage);
                _logger.i('🔄 Retry after reinit: ${faces?.length ?? 'NULL'} faces');
                if (faces != null) {
                  _consecutiveNullResults = 0; // Reset on success
                }
              } catch (e) {
                _logger.e('❌ Retry after reinit failed: $e');
                faces = null;
              }
            }
          }
          
          // Strategy 2: Try different image conversion (after 5 nulls)
          if (faces == null && _consecutiveNullResults >= 5) {
            _logger.i('🔄 Strategy 2: Trying with alternative image conversion...');
            try {
              // Force use method 2 conversion
              final alternativeImage = await _convertCameraImageMethod2(image);
              if (alternativeImage != null) {
                faces = await _faceDetector.processImage(alternativeImage);
                _logger.i('🔄 Alternative conversion result: ${faces?.length ?? 'NULL'} faces');
                if (faces != null) {
                  _consecutiveNullResults = 0; // Reset on success
                  _logger.i('✅ Success with alternative image conversion!');
                }
              }
            } catch (e) {
              _logger.e('❌ Alternative conversion failed: $e');
            }
          }
          
          // Strategy 3: Ultra-permissive settings (after 10 nulls)
          if (faces == null && _consecutiveNullResults >= 10 && !_hasTriedAlternativeSettings) {
            _logger.i('🔄 Strategy 3: Trying ultra-permissive ML Kit settings...');
            final success = await reinitializeWithDifferentSettings();
            if (success) {
              _hasTriedAlternativeSettings = true;
              try {
                faces = await _faceDetector.processImage(inputImage);
                _logger.i('🔄 Ultra-permissive result: ${faces?.length ?? 'NULL'} faces');
                if (faces != null) {
                  _consecutiveNullResults = 0; // Reset on success
                  _logger.i('✅ Success with ultra-permissive settings!');
                }
              } catch (e) {
                _logger.e('❌ Ultra-permissive retry failed: $e');
              }
            }
          }
          
          if (faces == null) {
            _faceDetectionFailures++;
            _logger.e('❌ All strategies failed, returning null');
            return null;
          }
        } else {
          // Reset null counter on successful processing
          if (_consecutiveNullResults > 0) {
            _logger.i('✅ ML Kit processing recovered after ${_consecutiveNullResults} null results');
            _consecutiveNullResults = 0;
          }
        }
      } catch (e) {
        faceStopwatch.stop();
        _logger.e('❌ ML Kit processImage threw exception: $e');
        _logger.e('Stack trace: ${StackTrace.current}');
        _faceDetectionFailures++;
        return null;
      }

      _logger.d('🔍 ML Kit completed in ${faceStopwatch.elapsedMilliseconds}ms, found ${faces.length} faces');
      
      if (faces.isEmpty) {
        _consecutiveNoFaceDetections++;
        _logger.w('❌ No faces detected (${_consecutiveNoFaceDetections} consecutive). Possible reasons:');
        _logger.w('   - Face smaller than ${(image.width * image.height * 0.05).toInt()} pixels');
        _logger.w('   - Poor lighting conditions');
        _logger.w('   - Face not facing camera');
        _logger.w('   - Image conversion issues');
        _logger.w('   - ML Kit model not loaded properly');
        
        // Tự động thử cấu hình khác sau 20 lần không phát hiện được
        if (_consecutiveNoFaceDetections >= 20 && !_hasTriedAlternativeSettings) {
          _logger.i('🔄 Attempting to reconfigure ML Kit with more permissive settings...');
          _hasTriedAlternativeSettings = true;
          
          final success = await reinitializeWithDifferentSettings();
          if (success) {
            _logger.i('✅ ML Kit reconfigured, retrying detection...');
            _consecutiveNoFaceDetections = 0; // Reset counter
            
            // Retry detection với settings mới
            final retryFaces = await _faceDetector.processImage(inputImage);
            _logger.i('🔄 Retry result: found ${retryFaces.length} faces');
            
            if (retryFaces.isNotEmpty) {
              _logger.i('🎉 Face detected with alternative settings!');
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

        // Detailed face info
        _logger.d('👤 Face Details:');
        _logger.d('   Bounding box: ${face.boundingBox}');
        _logger.d('   Landmarks count: ${face.landmarks.length}');
        _logger.d('   Head Euler Y: ${face.headEulerAngleY}');
        _logger.d('   Head Euler X: ${face.headEulerAngleX}');
        _logger.d('   Smiling probability: ${face.smilingProbability}');
        _logger.d('   Left eye open: ${face.leftEyeOpenProbability}');
        _logger.d('   Right eye open: ${face.rightEyeOpenProbability}');
        _logger.d('   Calculated confidence: $confidence');

        result = FaceDetectionResult(
          hasFace: true,
          landmarks: landmarks,
          confidence: confidence,
          boundingBox: boundingBox,
          face: face,
        );

        _logger.i('✅ Face detected: confidence=${confidence.toStringAsFixed(2)}, '
            'size=${(face.boundingBox.width * face.boundingBox.height).toInt()}px²');
      } else {
        _logger.w('❌ No faces detected by ML Kit');
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
      if (result != null && result.hasFace) {
        _lastSuccessfulProcessTime = DateTime.now();
      }
      
      // Performance stats
      if (_frameProcessedCount % 30 == 0) { // Log stats every 30 frames
        final stats = getDebugInfo();
        _logger.i('📊 Performance Stats (every 30 frames):');
        _logger.i('   Success rate: ${stats['success_rate']}');
        _logger.i('   Frames processed: ${stats['frames_processed']}');
        _logger.i('   Frames dropped: ${stats['frames_dropped']}');
        _logger.i('   Detection failures: ${stats['detection_failures']}');
        _logger.i('   Avg processing time: ${_processingTimeMs}ms');
      }
      
      return result;
    } catch (e) {
      _logger.e('❌ Face processing error: $e');
      _logger.e('Stack trace: ${StackTrace.current}');
      _faceDetectionFailures++;
      return null;
    } finally {
      stopwatch.stop();
      _processingTimeMs = stopwatch.elapsedMilliseconds;
      _logger.d('⏱️ Total processing time: ${_processingTimeMs}ms');
      _isProcessingFrame = false;
      
      // No more queue processing - simplified approach
    }
  }

  Future<InputImage?> _convertCameraImageWithFallback(CameraImage image) async {
    _logger.d('🔄 Starting image conversion...');
    
    try {
      _logger.d('🔧 Trying primary conversion method...');
      final result = await _convertCameraImageMethod1(image);
      _logger.d('✅ Primary conversion successful');
      return result;
    } catch (e1) {
      _logger.w('⚠️ Primary conversion failed: $e1');
      _logger.w('Stack trace: ${StackTrace.current}');
      
      try {
        _logger.d('🔧 Trying fallback conversion method...');
        final result = await _convertCameraImageMethod2(image);
        _logger.d('✅ Fallback conversion successful');
        return result;
      } catch (e2) {
        _logger.e('❌ All conversion methods failed: $e2');
        _logger.e('Stack trace: ${StackTrace.current}');
        return null;
      }
    }
  }

  Future<InputImage?> _convertCameraImageMethod1(CameraImage image) async {
    _logger.d('🔧 Method 1: Converting camera image to bytes...');
    
    try {
      final bytes = _convertCameraImageToBytes(image);
      _logger.d('✅ Method 1: Bytes conversion completed, length: ${bytes.length}');

      final rotation = _getImageRotation(image);
      final format = _getInputImageFormat(image);
      
      _logger.d('🔧 Method 1: Image metadata:');
      _logger.d('   Size: ${image.width}x${image.height}');
      _logger.d('   Rotation: $rotation');
      _logger.d('   Format: $format');
      _logger.d('   Bytes per row: ${image.planes[0].bytesPerRow}');
      
      final inputImageData = InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: format,
        bytesPerRow: image.planes[0].bytesPerRow,
      );

      _logger.d('🔧 Method 1: Creating InputImage...');
      final inputImage = InputImage.fromBytes(
        bytes: bytes,
        metadata: inputImageData,
      );
      
      _logger.d('✅ Method 1: InputImage created successfully');
      return inputImage;
    } catch (e) {
      _logger.e('❌ Method 1: Failed to convert image: $e');
      rethrow;
    }
  }

  Future<InputImage?> _convertCameraImageMethod2(CameraImage image) async {
    _logger.d('🔧 Method 2: Converting with alternative method...');
    
    try {
      final bytes = _convertCameraImageToBytesAlternative(image);
      _logger.d('✅ Method 2: Alternative bytes conversion completed, length: ${bytes.length}');

      _logger.d('🔧 Method 2: Using simplified metadata:');
      _logger.d('   Size: ${image.width}x${image.height}');
      _logger.d('   Rotation: rotation0deg (fixed)');
      _logger.d('   Format: nv21 (fixed)');
      _logger.d('   Bytes per row: ${image.planes[0].bytesPerRow}');

      final inputImageData = InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: InputImageRotation.rotation0deg, // Try without rotation
        format: InputImageFormat.nv21,
        bytesPerRow: image.planes[0].bytesPerRow,
      );

      _logger.d('🔧 Method 2: Creating InputImage...');
      final inputImage = InputImage.fromBytes(
        bytes: bytes,
        metadata: inputImageData,
      );
      
      _logger.d('✅ Method 2: InputImage created successfully');
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
    _logger.d('🔧 Converting YUV420 to bytes...');
    
    try {
      if (image.planes.length < 3) {
        throw Exception('YUV420 requires at least 3 planes, got ${image.planes.length}');
      }
      
      final yPlane = image.planes[0];
      final uPlane = image.planes[1];
      final vPlane = image.planes[2];
      
      _logger.d('   Y plane: ${yPlane.bytes.length} bytes');
      _logger.d('   U plane: ${uPlane.bytes.length} bytes');
      _logger.d('   V plane: ${vPlane.bytes.length} bytes');

      final ySize = yPlane.bytes.length;
      final uvSize = uPlane.bytes.length + vPlane.bytes.length;
      final totalSize = ySize + uvSize;
      
      _logger.d('   Total size: $totalSize bytes');

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
      
      _logger.d('✅ YUV420 conversion completed: ${bytes.length} bytes');
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
          ? ((_frameProcessedCount - _faceDetectionFailures) / _frameProcessedCount * 100).toStringAsFixed(1) + '%'
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
