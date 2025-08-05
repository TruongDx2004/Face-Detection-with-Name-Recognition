import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> logout(BuildContext context) async {
  final confirm = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Xác nhận đăng xuất'),
      content: const Text('Bạn có chắc chắn muốn đăng xuất không?'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Huỷ'),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context, true),
          child: const Text('Đăng xuất'),
        ),
      ],
    ),
  );

  if (confirm == true) {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear(); // hoặc chỉ xóa token: prefs.remove('token');

    Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
  }
}
