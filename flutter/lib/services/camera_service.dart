// lib/services/camera_service.dart
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;
import 'package:logger/logger.dart';
import 'package:permission_handler/permission_handler.dart';

class CameraService {
  static final CameraService _instance = CameraService._internal();
  factory CameraService() => _instance;
  
  CameraService._internal();

  final Logger _logger = Logger();
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  
  // Use a private variable to store the current zoom level
  double _currentZoomLevel = 1.0;

  CameraController? get controller => _controller;
  bool get isInitialized => _isInitialized;
  double get currentZoomLevel => _currentZoomLevel;

  /// Initialize camera service
  Future<bool> initialize() async {
    try {
      // Request camera permissions
      final permissionStatus = await _requestCameraPermission();
      if (!permissionStatus) {
        _logger.e('Camera permission denied');
        return false;
      }

      // Get available cameras
      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) {
        _logger.e('No cameras available');
        return false;
      }

      // Initialize camera controller with back camera (or first available)
      final camera = _cameras!.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => _cameras!.first,
      );

      _controller = CameraController(
        camera,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _controller!.initialize();
      _isInitialized = true;
      _currentZoomLevel = 1.0; // Reset zoom level on initialization
      _logger.i('Camera initialized successfully');
      return true;
    } catch (e) {
      _logger.e('Failed to initialize camera: $e');
      return false;
    }
  }

  /// Request camera permission
  Future<bool> _requestCameraPermission() async {
    final status = await Permission.camera.status;
    
    if (status.isGranted) {
      return true;
    }
    
    if (status.isDenied) {
      final result = await Permission.camera.request();
      return result.isGranted;
    }
    
    if (status.isPermanentlyDenied) {
      await openAppSettings();
      return false;
    }
    
    return false;
  }

  /// Switch between front and back camera
  Future<bool> switchCamera() async {
    if (_cameras == null || _cameras!.length < 2) {
      _logger.w('Cannot switch camera - insufficient cameras available');
      return false;
    }

    try {
      final currentCamera = _controller!.description;
      final newCamera = _cameras!.firstWhere(
        (camera) => camera.lensDirection != currentCamera.lensDirection,
        orElse: () => currentCamera,
      );

      if (newCamera == currentCamera) {
        _logger.w('No alternative camera found');
        return false;
      }

      await _controller!.dispose();
      _controller = CameraController(
        newCamera,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _controller!.initialize();
      _currentZoomLevel = 1.0; // Reset zoom level when switching cameras
      _logger.i('Camera switched successfully');
      return true;
    } catch (e) {
      _logger.e('Failed to switch camera: $e');
      return false;
    }
  }

  /// Take a picture and return the file path
  Future<String?> takePicture() async {
    if (!_isInitialized || _controller == null) {
      _logger.e('Camera not initialized');
      return null;
    }

    try {
      final XFile picture = await _controller!.takePicture();
      _logger.i('Picture taken: ${picture.path}');
      return picture.path;
    } catch (e) {
      _logger.e('Failed to take picture: $e');
      return null;
    }
  }

  /// Take a picture and return as Uint8List
  Future<Uint8List?> takePictureAsBytes() async {
    final picturePath = await takePicture();
    if (picturePath == null) return null;

    try {
      final file = File(picturePath);
      final bytes = await file.readAsBytes();
      // Clean up temporary file
      await file.delete();
      return bytes;
    } catch (e) {
      _logger.e('Failed to read picture bytes: $e');
      return null;
    }
  }

  /// Compress and resize image
  Future<Uint8List?> compressImage(
    String imagePath, {
    int maxWidth = 1024,
    int maxHeight = 1024,
    int quality = 85,
  }) async {
    try {
      final file = File(imagePath);
      final bytes = await file.readAsBytes();
      
      img.Image? image = img.decodeImage(bytes);
      if (image == null) {
        _logger.e('Failed to decode image');
        return null;
      }

      // Resize image if it's too large
      if (image.width > maxWidth || image.height > maxHeight) {
        image = img.copyResize(
          image,
          width: image.width > maxWidth ? maxWidth : null,
          height: image.height > maxHeight ? maxHeight : null,
          maintainAspect: true,
        );
      }

      // Compress image
      final compressedBytes = img.encodeJpg(image, quality: quality);
      _logger.i('Image compressed: ${bytes.length} -> ${compressedBytes.length} bytes');
      
      return Uint8List.fromList(compressedBytes);
    } catch (e) {
      _logger.e('Failed to compress image: $e');
      return null;
    }
  }

  /// Convert image to base64 string
  String imageToBase64(Uint8List imageBytes) {
    return base64Encode(imageBytes);
  }

  /// Convert base64 string to image bytes
  Uint8List base64ToImage(String base64String) {
    return base64Decode(base64String);
  }

  /// Set flash mode
  Future<void> setFlashMode(FlashMode flashMode) async {
    if (_controller != null && _isInitialized) {
      try {
        await _controller!.setFlashMode(flashMode);
        _logger.i('Flash mode set to: $flashMode');
      } catch (e) {
        _logger.e('Failed to set flash mode: $e');
      }
    }
  }

  /// Get current flash mode
  FlashMode? get currentFlashMode => _controller?.value.flashMode;

  /// Set exposure mode
  Future<void> setExposureMode(ExposureMode exposureMode) async {
    if (_controller != null && _isInitialized) {
      try {
        await _controller!.setExposureMode(exposureMode);
        _logger.i('Exposure mode set to: $exposureMode');
      } catch (e) {
        _logger.e('Failed to set exposure mode: $e');
      }
    }
  }

  /// Set focus mode
  Future<void> setFocusMode(FocusMode focusMode) async {
    if (_controller != null && _isInitialized) {
      try {
        await _controller!.setFocusMode(focusMode);
        _logger.i('Focus mode set to: $focusMode');
      } catch (e) {
        _logger.e('Failed to set focus mode: $e');
      }
    }
  }

  /// Set focus point
  Future<void> setFocusPoint(Offset point) async {
    if (_controller != null && _isInitialized) {
      try {
        await _controller!.setFocusPoint(point);
        _logger.i('Focus point set to: $point');
      } catch (e) {
        _logger.e('Failed to set focus point: $e');
      }
    }
  }

  /// Set exposure point
  Future<void> setExposurePoint(Offset point) async {
    if (_controller != null && _isInitialized) {
      try {
        await _controller!.setExposurePoint(point);
        _logger.i('Exposure point set to: $point');
      } catch (e) {
        _logger.e('Failed to set exposure point: $e');
      }
    }
  }

  /// Set zoom level
  Future<void> setZoomLevel(double zoom) async {
    if (_controller != null && _isInitialized) {
      try {
        final maxZoom = await _controller!.getMaxZoomLevel();
        final minZoom = await _controller!.getMinZoomLevel();
        final clampedZoom = zoom.clamp(minZoom, maxZoom);
        
        await _controller!.setZoomLevel(clampedZoom);
        _currentZoomLevel = clampedZoom; // Store the new zoom level
        _logger.i('Zoom level set to: $clampedZoom');
      } catch (e) {
        _logger.e('Failed to set zoom level: $e');
      }
    }
  }

  /// Get max zoom level
  Future<double?> getMaxZoomLevel() async {
    if (_controller != null && _isInitialized) {
      try {
        return await _controller!.getMaxZoomLevel();
      } catch (e) {
        _logger.e('Failed to get max zoom level: $e');
      }
    }
    return null;
  }

  /// Get min zoom level
  Future<double?> getMinZoomLevel() async {
    if (_controller != null && _isInitialized) {
      try {
        return await _controller!.getMinZoomLevel();
      } catch (e) {
        _logger.e('Failed to get min zoom level: $e');
      }
    }
    return null;
  }

  /// Pause camera preview
  Future<void> pausePreview() async {
    if (_controller != null && _isInitialized) {
      try {
        await _controller!.pausePreview();
        _logger.i('Camera preview paused');
      } catch (e) {
        _logger.e('Failed to pause preview: $e');
      }
    }
  }

  /// Resume camera preview
  Future<void> resumePreview() async {
    if (_controller != null && _isInitialized) {
      try {
        await _controller!.resumePreview();
        _logger.i('Camera preview resumed');
      } catch (e) {
        _logger.e('Failed to resume preview: $e');
      }
    }
  }

  /// Dispose camera resources
  Future<void> dispose() async {
    try {
      await _controller?.dispose();
      _controller = null;
      _isInitialized = false;
      _logger.i('Camera service disposed');
    } catch (e) {
      _logger.e('Failed to dispose camera: $e');
    }
  }

  /// Check if camera is available
  bool get isCameraAvailable => _cameras != null && _cameras!.isNotEmpty;

  /// Get available cameras count
  int get availableCamerasCount => _cameras?.length ?? 0;

  /// Check if front camera is available
  bool get hasFrontCamera {
    return _cameras?.any(
      (camera) => camera.lensDirection == CameraLensDirection.front,
    ) ?? false;
  }

  /// Check if back camera is available
  bool get hasBackCamera {
    return _cameras?.any(
      (camera) => camera.lensDirection == CameraLensDirection.back,
    ) ?? false;
  }
}
