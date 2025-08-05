// lib/widgets/camera_preview_widget.dart
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import '../services/camera_service.dart';

class CameraPreviewWidget extends StatefulWidget {
  final Function(String)? onImageCaptured;
  final bool showCaptureButton;
  final bool showSwitchCamera;
  final bool showFlashToggle;
  final String? overlayText;

  const CameraPreviewWidget({
    super.key,
    this.onImageCaptured,
    this.showCaptureButton = true,
    this.showSwitchCamera = true,
    this.showFlashToggle = true,
    this.overlayText,
  });

  @override
  State<CameraPreviewWidget> createState() => _CameraPreviewWidgetState();
}

class _CameraPreviewWidgetState extends State<CameraPreviewWidget> {
  final CameraService _cameraService = CameraService();
  bool _isInitialized = false;
  bool _isCapturing = false;
  FlashMode _currentFlashMode = FlashMode.auto;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      final success = await _cameraService.initialize();
      if (mounted) {
        setState(() {
          _isInitialized = success;
        });
      }
    } catch (e) {
      print('Error initializing camera: $e');
    }
  }

  Future<void> _captureImage() async {
    if (_isCapturing || !_isInitialized) return;

    setState(() {
      _isCapturing = true;
    });

    try {
      final imagePath = await _cameraService.takePicture();
      if (imagePath != null && widget.onImageCaptured != null) {
        widget.onImageCaptured!(imagePath);
      }
    } catch (e) {
      print('Error capturing image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi chụp ảnh: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCapturing = false;
        });
      }
    }
  }

  Future<void> _switchCamera() async {
    try {
      await _cameraService.switchCamera();
      if (mounted) {
        setState(() {});
      }
    } catch (e) {
      print('Error switching camera: $e');
    }
  }

  Future<void> _toggleFlash() async {
    FlashMode newMode;
    switch (_currentFlashMode) {
      case FlashMode.off:
        newMode = FlashMode.auto;
        break;
      case FlashMode.auto:
        newMode = FlashMode.always;
        break;
      case FlashMode.always:
        newMode = FlashMode.torch;
        break;
      case FlashMode.torch:
        newMode = FlashMode.off;
        break;
    }

    await _cameraService.setFlashMode(newMode);
    setState(() {
      _currentFlashMode = newMode;
    });
  }

  IconData _getFlashIcon() {
    switch (_currentFlashMode) {
      case FlashMode.off:
        return Icons.flash_off;
      case FlashMode.auto:
        return Icons.flash_auto;
      case FlashMode.always:
        return Icons.flash_on;
      case FlashMode.torch:
        return Icons.flashlight_on;
    }
  }

  @override
  void dispose() {
    _cameraService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    final controller = _cameraService.controller;
    if (controller == null || !controller.value.isInitialized) {
      return const Center(
        child: Text('Camera not available'),
      );
    }

    return Stack(
      children: [
        // Camera Preview
        Positioned.fill(
          child: AspectRatio(
            aspectRatio: controller.value.aspectRatio,
            child: CameraPreview(controller),
          ),
        ),

        // Overlay text
        if (widget.overlayText != null)
          Positioned(
            top: 50,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                widget.overlayText!,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),

        // Camera controls
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            height: 120,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Colors.black54],
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Flash toggle
                if (widget.showFlashToggle)
                  IconButton(
                    onPressed: _toggleFlash,
                    icon: Icon(
                      _getFlashIcon(),
                      color: Colors.white,
                      size: 30,
                    ),
                  ),

                // Capture button
                if (widget.showCaptureButton)
                  GestureDetector(
                    onTap: _captureImage,
                    child: Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        color: _isCapturing ? Colors.grey : Colors.transparent,
                      ),
                      child: _isCapturing
                          ? const Center(
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(
                              Icons.camera_alt,
                              color: Colors.white,
                              size: 30,
                            ),
                    ),
                  ),

                // Switch camera
                if (widget.showSwitchCamera && _cameraService.availableCamerasCount > 1)
                  IconButton(
                    onPressed: _switchCamera,
                    icon: const Icon(
                      Icons.switch_camera,
                      color: Colors.white,
                      size: 30,
                    ),
                  ),
              ],
            ),
          ),
        ),

        // Focus indicator (tap to focus)
        Positioned.fill(
          child: GestureDetector(
            onTapUp: (details) async {
              final offset = Offset(
                details.localPosition.dx / context.size!.width,
                details.localPosition.dy / context.size!.height,
              );
              await _cameraService.setFocusPoint(offset);
              await _cameraService.setExposurePoint(offset);
            },
          ),
        ),
      ],
    );
  }
}