// lib/models/notification_models.dart
import 'user_models.dart';

class NotificationEvent {
  final int id;
  final String title;
  final String content;
  final String type;
  final String priority;
  final String status;
  final DateTime? scheduledDate;
  final DateTime? eventDate;
  final String? eventLocation;
  final double registrationFee;
  final int? maxParticipants;
  final int? currentParticipants;
  final DateTime? registrationDeadline;
  final bool requiresApproval;
  final List<String>? targetAudience;
  final Map<String, dynamic>? metadata;
  final String? imageUrl;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final User? createdBy;
  final List<EventRegistration>? registrations;

  NotificationEvent({
    required this.id,
    required this.title,
    required this.content,
    required this.type,
    required this.priority,
    required this.status,
    this.scheduledDate,
    this.eventDate,
    this.eventLocation,
    required this.registrationFee,
    this.maxParticipants,
    this.currentParticipants,
    this.registrationDeadline,
    required this.requiresApproval,
    this.targetAudience,
    this.metadata,
    this.imageUrl,
    required this.createdAt,
    this.updatedAt,
    this.createdBy,
    this.registrations,
  });

  factory NotificationEvent.fromJson(Map<String, dynamic> json) {
    return NotificationEvent(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      type: (json['type'] is String && json['type'].isNotEmpty)
          ? json['type']
          : 'notification',
      priority: (json['priority'] is String && json['priority'].isNotEmpty)
          ? json['priority']
          : 'medium',
      status: (json['status'] is String && json['status'].isNotEmpty)
          ? json['status']
          : 'draft',
      scheduledDate: json['scheduled_date'] != null
          ? DateTime.parse(json['scheduled_date'])
          : null,
      eventDate: json['event_date'] != null
          ? DateTime.parse(json['event_date'])
          : null,
      eventLocation: json['event_location'],
      registrationFee:
          double.tryParse(json['registration_fee']?.toString() ?? '0') ?? 0.0,
      maxParticipants: json['max_participants'],
      currentParticipants: json['current_participants'] ?? 0,
      registrationDeadline: json['registration_deadline'] != null
          ? DateTime.parse(json['registration_deadline'])
          : null,
      requiresApproval: json['requires_approval'] ?? false,
      targetAudience: json['target_audience'] is List
          ? List<String>.from(json['target_audience'])
          : json['target_audience'] is Map
              ? (json['target_audience'] as Map).keys.cast<String>().toList()
              : [],
      metadata: json['metadata'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['metadata'])
          : {},
      imageUrl: json['image_url'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      createdBy:
          json['created_by'] != null ? User.fromJson(json['created_by']) : null,
      registrations: json['registrations'] is List
          ? (json['registrations'] as List)
              .map((e) => EventRegistration.fromJson(e))
              .toList()
          : null,
    );
  }

  /// Parse list from backend API response
  /// Handles different response formats from notification endpoints
  static List<NotificationEvent> fromApiResponse(dynamic responseData) {
    if (responseData == null) return [];

    try {
      // Handle direct array response
      if (responseData is List) {
        return responseData
            .map((item) =>
                NotificationEvent.fromJson(Map<String, dynamic>.from(item)))
            .toList();
      }

      // Handle wrapped response format
      if (responseData is Map<String, dynamic>) {
        // Standard format: {"success": true, "data": {"notifications": [...]}}
        final data = responseData['data'];
        if (data != null && data is Map<String, dynamic>) {
          // Check for notifications array
          if (data.containsKey('notifications') &&
              data['notifications'] is List) {
            return (data['notifications'] as List)
                .map((item) =>
                    NotificationEvent.fromJson(Map<String, dynamic>.from(item)))
                .toList();
          }
          // Check for other possible array keys
          if (data.containsKey('items') && data['items'] is List) {
            return (data['items'] as List)
                .map((item) =>
                    NotificationEvent.fromJson(Map<String, dynamic>.from(item)))
                .toList();
          }
          if (data.containsKey('results') && data['results'] is List) {
            return (data['results'] as List)
                .map((item) =>
                    NotificationEvent.fromJson(Map<String, dynamic>.from(item)))
                .toList();
          }
          if (data.containsKey('events') && data['events'] is List) {
            return (data['events'] as List)
                .map((item) =>
                    NotificationEvent.fromJson(Map<String, dynamic>.from(item)))
                .toList();
          }
        }

        // Fallback: check if responseData itself has notifications
        if (responseData.containsKey('notifications') &&
            responseData['notifications'] is List) {
          return (responseData['notifications'] as List)
              .map((item) =>
                  NotificationEvent.fromJson(Map<String, dynamic>.from(item)))
              .toList();
        }
      }

      return [];
    } catch (e) {
      print('Error parsing NotificationEvent list: $e');
      return [];
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'type': type,
      'priority': priority,
      'status': status,
      'scheduled_date': scheduledDate?.toIso8601String(),
      'event_date': eventDate?.toIso8601String(),
      'event_location': eventLocation,
      'registration_fee': registrationFee,
      'max_participants': maxParticipants,
      'current_participants': currentParticipants,
      'registration_deadline': registrationDeadline?.toIso8601String(),
      'requires_approval': requiresApproval,
      'target_audience': targetAudience,
      'metadata': metadata,
      'image_url': imageUrl,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  bool get isEvent => type == 'event';
  bool get isNotification => type == 'notification';
  bool get canRegister =>
      isEvent &&
      status == 'published' &&
      (registrationDeadline == null ||
          DateTime.now().isBefore(registrationDeadline!));
  bool get isFull =>
      maxParticipants != null && (currentParticipants ?? 0) >= maxParticipants!;

  String get priorityText {
    switch (priority) {
      case 'low':
        return 'Thông báo';
      case 'high':
        return 'Thông báo quan trọng';
      default:
        return priority;
    }
  }

  String get statusText {
    switch (status) {
      case 'draft':
        return 'Nháp';
      case 'scheduled':
        return 'Đã lên lịch';
      case 'published':
        return 'Đã xuất bản';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  String get typeText {
    switch (type) {
      case 'notification':
        return 'Thông báo';
      case 'event':
        return 'Sự kiện';
      default:
        return type;
    }
  }
}

class EventRegistration {
  final int id;
  final int eventId;
  final int studentId;
  final DateTime registrationDate;
  final String status;
  final String? notes;
  final String? adminNotes;
  final String paymentStatus;
  final DateTime? paymentDate;
  final String? paymentReference;
  final DateTime? updatedAt;
  final NotificationEvent? event;
  final User? student;

  EventRegistration({
    required this.id,
    required this.eventId,
    required this.studentId,
    required this.registrationDate,
    required this.status,
    this.notes,
    this.adminNotes,
    required this.paymentStatus,
    this.paymentDate,
    this.paymentReference,
    this.updatedAt,
    this.event,
    this.student,
  });

  factory EventRegistration.fromJson(Map<String, dynamic> json) {
    return EventRegistration(
      id: json['id'] ?? 0,
      eventId: json['event_id'] ?? 0,
      studentId: json['student_id'] ?? 0,
      registrationDate: DateTime.parse(json['registration_date']),
      status: json['status'] ?? 'registered',
      notes: json['notes'],
      adminNotes: json['admin_notes'],
      paymentStatus: json['payment_status'] ?? 'unpaid',
      paymentDate: json['payment_date'] != null
          ? DateTime.parse(json['payment_date'])
          : null,
      paymentReference: json['payment_reference'],
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      event: json['event'] != null
          ? NotificationEvent.fromJson(json['event'])
          : null,
      student: json['student'] != null ? User.fromJson(json['student']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'event_id': eventId,
      'student_id': studentId,
      'registration_date': registrationDate.toIso8601String(),
      'status': status,
      'notes': notes,
      'admin_notes': adminNotes,
      'payment_status': paymentStatus,
      'payment_date': paymentDate?.toIso8601String(),
      'payment_reference': paymentReference,
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  String get statusText {
    switch (status) {
      case 'registered':
        return 'Đã đăng ký';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'attended':
        return 'Đã tham gia';
      case 'absent':
        return 'Vắng mặt';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  String get paymentStatusText {
    switch (paymentStatus) {
      case 'unpaid':
        return 'Chưa thanh toán';
      case 'paid':
        return 'Đã thanh toán';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return paymentStatus;
    }
  }

  bool get canBeCancelled => ['registered', 'confirmed'].contains(status);
  bool get isConfirmed => ['confirmed', 'attended'].contains(status);
  bool get requiresPayment =>
      event?.registrationFee != null && event!.registrationFee > 0;
}

class NotificationView {
  final int id;
  final int notificationId;
  final int userId;
  final DateTime viewedAt;
  final bool isRead;
  final NotificationEvent? notification;

  NotificationView({
    required this.id,
    required this.notificationId,
    required this.userId,
    required this.viewedAt,
    required this.isRead,
    this.notification,
  });

  factory NotificationView.fromJson(Map<String, dynamic> json) {
    return NotificationView(
      id: json['id'] ?? 0,
      notificationId: json['notification_id'] ?? 0,
      userId: json['user_id'] ?? 0,
      viewedAt: DateTime.parse(json['viewed_at']),
      isRead: json['is_read'] ?? false,
      notification: json['notification'] != null
          ? NotificationEvent.fromJson(json['notification'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'notification_id': notificationId,
      'user_id': userId,
      'viewed_at': viewedAt.toIso8601String(),
      'is_read': isRead,
    };
  }
}

class EventRegistrationRequest {
  final String? notes;

  EventRegistrationRequest({this.notes});

  Map<String, dynamic> toJson() {
    return {
      'notes': notes,
    };
  }
}
