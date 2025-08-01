class AttendanceRequest {
  final int sessionId;
  final String imageData;

  AttendanceRequest({
    required this.sessionId,
    required this.imageData,
  });

  Map<String, dynamic> toJson() {
    return {
      'session_id': sessionId,
      'image_data': imageData,
    };
  }
}