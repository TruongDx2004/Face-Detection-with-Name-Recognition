// lib/screens/student/event_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/html_text_display.dart';
import '../../widgets/loading_dialog.dart';

class EventDetailScreen extends StatefulWidget {
  final int eventId;

  const EventDetailScreen({
    Key? key,
    required this.eventId,
  }) : super(key: key);

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  final ApiService _apiService = ApiService();
  final AuthService _authService = AuthService();
  final TextEditingController _notesController = TextEditingController();

  NotificationEvent? _event;
  EventRegistration? _myRegistration;
  bool _isLoading = true;
  bool _isRegistering = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadEventDetails();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadEventDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Load event details and user's registrations
      final results = await Future.wait([
        _apiService.getEventById(widget.eventId),
        _apiService.getMyEventRegistrations(),
      ]);

      final ApiResponse<NotificationEvent> eventResponse =
          results[0] as ApiResponse<NotificationEvent>;

      final ApiResponse<List<EventRegistration>> registrationsResponse =
          results[1] as ApiResponse<List<EventRegistration>>;

      if (eventResponse.success && eventResponse.data != null) {
        setState(() {
          _event = eventResponse.data!;

          // Find user's registration for this event
          if (registrationsResponse.success) {
            _myRegistration = registrationsResponse.data?.firstWhere(
              (reg) => reg.eventId == widget.eventId,
              orElse: () => null as EventRegistration,
            );
          }

          _isLoading = false;
        });
      } else {
        setState(() {
          _error = eventResponse.message ?? 'Không thể tải thông tin sự kiện';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Lỗi kết nối: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _registerForEvent() async {
    if (_event == null) return;

    setState(() {
      _isRegistering = true;
    });

    try {
      final request = EventRegistrationRequest(
        notes: _notesController.text.trim().isNotEmpty
            ? _notesController.text.trim()
            : null,
      );

      final response =
          await _apiService.registerForEvent(widget.eventId, request);

      if (response.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.message ?? 'Đăng ký thành công'),
            backgroundColor: Colors.green,
          ),
        );

        // Reload event details
        await _loadEventDetails();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.message ?? 'Đăng ký thất bại'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi kết nối: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isRegistering = false;
      });
    }
  }

  Future<void> _cancelRegistration() async {
    if (_myRegistration == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận hủy đăng ký'),
        content:
            const Text('Bạn có chắc chắn muốn hủy đăng ký sự kiện này không?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Không'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Hủy đăng ký'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isRegistering = true;
    });

    try {
      final response =
          await _apiService.cancelEventRegistration(widget.eventId);

      if (response.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.message ?? 'Đã hủy đăng ký thành công'),
            backgroundColor: Colors.green,
          ),
        );

        // Reload event details
        await _loadEventDetails();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.message ?? 'Không thể hủy đăng ký'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi kết nối: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isRegistering = false;
      });
    }
  }

  void _showRegistrationDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Đăng ký sự kiện'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
                'Bạn có muốn đăng ký tham gia sự kiện "${_event!.title}" không?'),
            const SizedBox(height: 16),
            TextField(
              controller: _notesController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Ghi chú (không bắt buộc)',
                hintText: 'Nhập ghi chú cho việc đăng ký...',
                border: OutlineInputBorder(),
              ),
            ),
            if (_event!.registrationFee > 0) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info, color: Colors.orange[600], size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Lệ phí: ${NumberFormat('#,###').format(_event!.registrationFee)} VNĐ',
                        style: TextStyle(
                          color: Colors.orange[800],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _registerForEvent();
            },
            child: const Text('Đăng ký'),
          ),
        ],
      ),
    );
  }

  Widget _buildEventHeader() {
    if (_event == null) return const SizedBox();

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.blue[700]!,
            Colors.blue[500]!,
          ],
        ),
      ),
      child: Column(
        children: [
          if (_event!.imageUrl != null)
            Image.network(
              _event!.imageUrl!,
              width: double.infinity,
              height: 200,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  width: double.infinity,
                  height: 200,
                  color: Colors.grey[300],
                  child: Icon(
                    Icons.event,
                    size: 48,
                    color: Colors.grey[600],
                  ),
                );
              },
            ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _event!.typeText,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getStatusColor(_event!.status).withOpacity(0.9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _event!.statusText,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  _event!.title,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                if (_event!.eventDate != null) ...[
                  Row(
                    children: [
                      Icon(
                        Icons.event,
                        size: 16,
                        color: Colors.white.withOpacity(0.8),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Thời gian: ${DateFormat('dd/MM/yyyy HH:mm').format(_event!.eventDate!)}',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.9),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                if (_event!.eventLocation != null) ...[
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 16,
                        color: Colors.white.withOpacity(0.8),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Địa điểm: ${_event!.eventLocation}',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                Row(
                  children: [
                    Icon(
                      Icons.people,
                      size: 16,
                      color: Colors.white.withOpacity(0.8),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _event!.maxParticipants != null
                          ? 'Đã đăng ký: ${_event!.currentParticipants}/${_event!.maxParticipants}'
                          : 'Đã đăng ký: ${_event!.currentParticipants}',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegistrationStatus() {
    if (_myRegistration == null) return const SizedBox();

    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (_myRegistration!.status) {
      case 'registered':
        statusColor = Colors.blue;
        statusIcon = Icons.check_circle_outline;
        statusText = 'Đã đăng ký';
        break;
      case 'confirmed':
        statusColor = Colors.green;
        statusIcon = Icons.verified;
        statusText = 'Đã xác nhận';
        break;
      case 'attended':
        statusColor = Colors.purple;
        statusIcon = Icons.event_available;
        statusText = 'Đã tham gia';
        break;
      case 'cancelled':
        statusColor = Colors.red;
        statusIcon = Icons.cancel;
        statusText = 'Đã hủy';
        break;
      default:
        statusColor = Colors.grey;
        statusIcon = Icons.help_outline;
        statusText = _myRegistration!.statusText;
    }

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(statusIcon, color: statusColor, size: 24),
              const SizedBox(width: 12),
              Text(
                'Trạng thái đăng ký',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: statusColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            statusText,
            style: TextStyle(
              fontSize: 14,
              color: statusColor,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            'Đăng ký lúc: ${DateFormat('dd/MM/yyyy HH:mm').format(_myRegistration!.registrationDate)}',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
          if (_myRegistration!.notes != null) ...[
            const SizedBox(height: 8),
            Text(
              'Ghi chú: ${_myRegistration!.notes}',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[700],
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
          if (_myRegistration!.requiresPayment &&
              _event!.registrationFee > 0) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _myRegistration!.paymentStatus == 'paid'
                    ? Colors.green[50]
                    : Colors.orange[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _myRegistration!.paymentStatus == 'paid'
                      ? Colors.green[200]!
                      : Colors.orange[200]!,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    _myRegistration!.paymentStatus == 'paid'
                        ? Icons.payment
                        : Icons.payment_outlined,
                    color: _myRegistration!.paymentStatus == 'paid'
                        ? Colors.green[600]
                        : Colors.orange[600],
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Thanh toán: ${_myRegistration!.paymentStatusText}',
                          style: TextStyle(
                            color: _myRegistration!.paymentStatus == 'paid'
                                ? Colors.green[800]
                                : Colors.orange[800],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          'Số tiền: ${NumberFormat('#,###').format(_event!.registrationFee)} VNĐ',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEventContent() {
    if (_event == null) return const SizedBox();

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Mô tả sự kiện',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
          HtmlTextDisplay(
            htmlContent: _event!.content,
          ),
          const SizedBox(height: 24),
          if (_event!.registrationDeadline != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red[200]!),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.access_time,
                    color: Colors.red[700],
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Hạn đăng ký: ${DateFormat('dd/MM/yyyy HH:mm').format(_event!.registrationDeadline!)}',
                      style: TextStyle(
                        color: Colors.red[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
          _buildEventInfo(),
        ],
      ),
    );
  }

  Widget _buildEventInfo() {
    if (_event == null) return const SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Thông tin chi tiết',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 12),
        _buildInfoItem(
          Icons.monetization_on,
          'Lệ phí',
          _event!.registrationFee > 0
              ? '${NumberFormat('#,###').format(_event!.registrationFee)} VNĐ'
              : 'Miễn phí',
          _event!.registrationFee > 0 ? Colors.orange : Colors.green,
        ),
        if (_event!.maxParticipants != null)
          _buildInfoItem(
            Icons.people,
            'Số lượng tối đa',
            '${_event!.maxParticipants} người',
            Colors.blue,
          ),
        _buildInfoItem(
          Icons.approval,
          'Phê duyệt',
          _event!.requiresApproval ? 'Cần phê duyệt' : 'Tự động xác nhận',
          _event!.requiresApproval ? Colors.orange : Colors.green,
        ),
        if (_event!.createdBy != null)
          _buildInfoItem(
            Icons.person,
            'Người tạo',
            _event!.createdBy!.fullName,
            Colors.grey,
          ),
        _buildInfoItem(
          Icons.schedule,
          'Ngày tạo',
          DateFormat('dd/MM/yyyy HH:mm').format(_event!.createdAt),
          Colors.grey,
        ),
      ],
    );
  }

  Widget _buildInfoItem(
      IconData icon, String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 12),
          Text(
            '$label: ',
            style: const TextStyle(
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                color: Colors.grey[700],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    if (_event == null || _event!.status != 'published') {
      return const SizedBox();
    }

    if (_myRegistration != null) {
      // User is already registered
      return Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _myRegistration!.canBeCancelled && !_isRegistering
                ? _cancelRegistration
                : null,
            icon: _isRegistering
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Icon(Icons.cancel),
            label: Text(_isRegistering ? 'Đang xử lý...' : 'Hủy đăng ký'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
      );
    }

    // User is not registered yet
    bool canRegister = _event!.canRegister && !_event!.isFull;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed:
              canRegister && !_isRegistering ? _showRegistrationDialog : null,
          icon: _isRegistering
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Icon(Icons.event_available),
          label: Text(_isRegistering
              ? 'Đang đăng ký...'
              : !_event!.canRegister
                  ? 'Hết hạn đăng ký'
                  : _event!.isFull
                      ? 'Đã hết chỗ'
                      : 'Đăng ký tham gia'),
          style: ElevatedButton.styleFrom(
            backgroundColor: canRegister ? Colors.blue[700] : Colors.grey,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'published':
        return Colors.green;
      case 'scheduled':
        return Colors.blue;
      case 'completed':
        return Colors.purple;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Chi tiết sự kiện',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        backgroundColor: Colors.blue[700],
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_event != null)
            IconButton(
              icon: const Icon(Icons.share, color: Colors.white),
              onPressed: () {
                // TODO: Implement share functionality
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Tính năng chia sẻ sẽ được cập nhật'),
                  ),
                );
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadEventDetails,
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    Expanded(
                      child: SingleChildScrollView(
                        child: Column(
                          children: [
                            _buildEventHeader(),
                            _buildRegistrationStatus(),
                            _buildEventContent(),
                          ],
                        ),
                      ),
                    ),
                    _buildActionButtons(),
                  ],
                ),
    );
  }
}
