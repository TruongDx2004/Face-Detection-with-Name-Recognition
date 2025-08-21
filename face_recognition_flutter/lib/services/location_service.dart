import 'package:geolocator/geolocator.dart';
import 'package:location/location.dart' as loc;
import 'package:logger/logger.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  final Logger _logger = Logger();
// Vị trí mặc định của trường học (có thể cấu hình)
  static double _schoolLatitude = 37.421998; // Vĩ độ // trục bắc nam
  static double _schoolLongitude = -122.084; // Kinh độ // trục đông tây
  static double _allowedRadius = 100.0; // Bán kính cho phép (mét)

  /// Kiểm tra quyền truy cập vị trí
  Future<bool> checkLocationPermission() async {
    try {
      // Kiểm tra GPS có bật không
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _logger.w('GPS service is disabled');
        return false;
      }

      // Kiểm tra quyền
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _logger.w('Location permission denied');
          return false;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        _logger.w('Location permission denied forever');
        return false;
      }

      return true;
    } catch (e) {
      _logger.e('Error checking location permission: $e');
      return false;
    }
  }

  /// Lấy vị trí hiện tại
  Future<Position?> getCurrentLocation() async {
    try {
      if (!await checkLocationPermission()) {
        return null;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      final mock = await isMockLocation();
      _logger.i('[GPS] lat=${position.latitude.toStringAsFixed(6)}, '
          'lng=${position.longitude.toStringAsFixed(6)}, '
          'accuracy=${position.accuracy.toStringAsFixed(1)}m, '
          'mock=$mock, time=${position.timestamp}');

      return position;
    } catch (e) {
      _logger.e('Error getting current location: $e');
      return null;
    }
  }

  /// Kiểm tra mock location (chỉ Android)
  Future<bool> isMockLocation() async {
    try {
      final loc.Location location = loc.Location();
      final loc.LocationData locData = await location.getLocation();

      bool isMock = locData.isMock ?? false;
      _logger.i('Mock location detected: $isMock');

      return isMock;
    } catch (e) {
      _logger.e('Error checking mock location: $e');
      return false;
    }
  }

  /// Kiểm tra xem vị trí có trong phạm vi cho phép không
  Future<bool> isLocationAllowed() async {
    try {
      final position = await getCurrentLocation();
      if (position == null) {
        return false;
      }

      // Kiểm tra mock location
      if (await isMockLocation()) {
        _logger.w('Mock location detected - attendance not allowed');
        return false;
      }

      // Tính khoảng cách từ vị trí hiện tại đến trường học
      double distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        _schoolLatitude,
        _schoolLongitude,
      );

      _logger.i('Distance from school: ${distance.toStringAsFixed(2)}m');

      bool isAllowed = distance <= _allowedRadius;
      _logger.i('Location allowed: $isAllowed');

      return isAllowed;
    } catch (e) {
      _logger.e('Error checking location allowance: $e');
      return false;
    }
  }

  /// Lấy thông tin vị trí chi tiết
  Future<Map<String, dynamic>?> getLocationInfo() async {
    try {
      final position = await getCurrentLocation();
      if (position == null) {
        return null;
      }

      final isMock = await isMockLocation();
      final isAllowed = await isLocationAllowed();

      return {
        'latitude': position.latitude,
        'longitude': position.longitude,
        'accuracy': position.accuracy,
        'timestamp': position.timestamp?.toIso8601String(),
        'isMock': isMock,
        'isAllowed': isAllowed,
        'distanceFromSchool': Geolocator.distanceBetween(
          position.latitude,
          position.longitude,
          _schoolLatitude,
          _schoolLongitude,
        ),
      };
    } catch (e) {
      _logger.e('Error getting location info: $e');
      return null;
    }
  }

  /// Cập nhật tọa độ trường học
  static void updateSchoolLocation(double latitude, double longitude,
      {double? radius}) {
    // Có thể lưu vào SharedPreferences hoặc config
    _schoolLatitude = latitude;
    _schoolLongitude = longitude;
    if (radius != null) {
      _allowedRadius = radius;
    }
  }
}
