// lib/utils/camera_helper.dart
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';

class CameraHelper {
  static Future<bool> requestCameraPermission() async {
    final status = await Permission.camera.request();
    return status.isGranted;
  }

  static Future<bool> checkCameraPermission() async {
    final status = await Permission.camera.status;
    return status.isGranted;
  }

  static void showPermissionDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.camera_alt, color: Colors.orange),
            SizedBox(width: 8),
            Text('Cần quyền truy cập Camera'),
          ],
        ),
        content: const Text(
          'Ứng dụng cần quyền truy cập camera để chụp ảnh điểm danh. '
          'Vui lòng cấp quyền trong cài đặt.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              openAppSettings();
            },
            child: const Text('Mở cài đặt'),
          ),
        ],
      ),
    );
  }

  static Future<List<CameraDescription>> getAvailableCameras() async {
    try {
      return await availableCameras();
    } catch (e) {
      return [];
    }
  }

  static CameraDescription? getFrontCamera(List<CameraDescription> cameras) {
    try {
      return cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
      );
    } catch (e) {
      return null;
    }
  }

  static CameraDescription? getBackCamera(List<CameraDescription> cameras) {
    try {
      return cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
      );
    } catch (e) {
      return null;
    }
  }

  static String getCameraDirectionName(CameraLensDirection direction) {
    switch (direction) {
      case CameraLensDirection.front:
        return 'Camera trước';
      case CameraLensDirection.back:
        return 'Camera sau';
      case CameraLensDirection.external:
        return 'Camera ngoài';
    }
  }

  static ResolutionPreset getOptimalResolution() {
    // Trả về độ phân giải tối ưu cho face recognition
    return ResolutionPreset.high;
  }
}

// Extension methods for CameraController
extension CameraControllerExtension on CameraController {
  Future<bool> isFlashAvailable() async {
    try {
      return value.flashMode != FlashMode.off;
    } catch (e) {
      return false;
    }
  }

  Future<void> toggleFlash() async {
    try {
      final isFlashOn = value.flashMode == FlashMode.torch;
      await setFlashMode(isFlashOn ? FlashMode.off : FlashMode.torch);
    } catch (e) {
      // Handle error silently
    }
  }
}

// Widget wrapper for camera permission handling
class CameraPermissionWrapper extends StatefulWidget {
  final Widget child;
  final VoidCallback? onPermissionDenied;

  const CameraPermissionWrapper({
    super.key,
    required this.child,
    this.onPermissionDenied,
  });

  @override
  State<CameraPermissionWrapper> createState() => _CameraPermissionWrapperState();
}

class _CameraPermissionWrapperState extends State<CameraPermissionWrapper> {
  bool _hasPermission = false;
  bool _isChecking = true;

  @override
  void initState() {
    super.initState();
    _checkPermission();
  }

  Future<void> _checkPermission() async {
    final hasPermission = await CameraHelper.checkCameraPermission();
    
    if (!hasPermission) {
      final granted = await CameraHelper.requestCameraPermission();
      setState(() {
        _hasPermission = granted;
        _isChecking = false;
      });
      
      if (!granted && widget.onPermissionDenied != null) {
        widget.onPermissionDenied!();
      }
    } else {
      setState(() {
        _hasPermission = true;
        _isChecking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isChecking) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Đang kiểm tra quyền truy cập camera...'),
            ],
          ),
        ),
      );
    }

    if (!_hasPermission) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Cần quyền truy cập'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.camera_alt,
                  size: 64,
                  color: Colors.grey,
                ),
                const SizedBox(height: 20),
                const Text(
                  'Cần quyền truy cập Camera',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Ứng dụng cần quyền truy cập camera để chụp ảnh điểm danh. '
                  'Vui lòng cấp quyền để tiếp tục.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 30),
                ElevatedButton.icon(
                  onPressed: () {
                    openAppSettings();
                  },
                  icon: const Icon(Icons.settings),
                  label: const Text('Mở cài đặt'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _checkPermission,
                  child: const Text('Thử lại'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return widget.child;
  }
}