class SessionCreateRequest {
  final String subject;
  final String className;
  final String startTime;

  SessionCreateRequest({
    required this.subject,
    required this.className,
    required this.startTime,
  });

  Map<String, dynamic> toJson() {
    return {
      'subject': subject,
      'class_name': className,
      'start_time': startTime,
    };
  }
}