class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;
  final String? error;
  final int? statusCode;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.error,
    this.statusCode,
  });

  factory ApiResponse.success(T data, {String message = 'Success'}) {
    return ApiResponse<T>(
      success: true,
      message: message,
      data: data,
      statusCode: 200,
    );
  }

  factory ApiResponse.error(String error, {int? statusCode}) {
    return ApiResponse<T>(
      success: false,
      message: error,
      error: error,
      statusCode: statusCode,
    );
  }

  factory ApiResponse.fromJson(Map<String, dynamic> json, T Function(dynamic)? fromJsonT) {
    try {
      return ApiResponse<T>(
        success: json['success'] ?? true,
        message: json['message'] ?? '',
        data: fromJsonT != null && json['data'] != null ? fromJsonT(json['data']) : json['data'],
        error: json['error'],
        statusCode: json['status_code'],
      );
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        message: 'Parse error: $e',
        error: e.toString(),
      );
    }
  }
}