import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';
import 'package:http_parser/http_parser.dart';

class FaceRecognitionTestScreen extends StatefulWidget {
  @override
  _FaceRecognitionTestScreenState createState() => _FaceRecognitionTestScreenState();
}

class _FaceRecognitionTestScreenState extends State<FaceRecognitionTestScreen> {
  File? _image;
  String? _result;
  bool _loading = false;

  final picker = ImagePicker();
  final String token = 'your_token_here'; // Thay token ở đây
  final String apiUrl = 'http://10.0.2.2:8000/face/recognize'; // Localhost Android

  Future<void> _pickImage(ImageSource source) async {
    final picked = await picker.pickImage(source: source);
    if (picked != null) {
      setState(() {
        _image = File(picked.path);
        _result = null;
      });
      _recognizeFace(_image!);
    }
  }

  Future<void> _recognizeFace(File imageFile) async {
    setState(() => _loading = true);

    final mimeType = lookupMimeType(imageFile.path) ?? 'image/jpeg';
    final request = http.MultipartRequest('POST', Uri.parse(apiUrl))
      ..headers['Authorization'] = 'Bearer $token'
      ..files.add(await http.MultipartFile.fromPath(
        'image',
        imageFile.path,
        contentType: MediaType.parse(mimeType),
      ));

    try {
      final response = await request.send();
      final resp = await http.Response.fromStream(response);

      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        setState(() {
          _result = jsonEncode(data['result'], toEncodable: (_) => _.toString());
        });
      } else {
        setState(() => _result = '❌ Error: ${resp.body}');
      }
    } catch (e) {
      setState(() => _result = '❌ Exception: $e');
    }

    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Test Face Recognition')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            if (_image != null) Image.file(_image!, height: 200),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton.icon(
                  onPressed: () => _pickImage(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt),
                  label: const Text("Camera"),
                ),
                ElevatedButton.icon(
                  onPressed: () => _pickImage(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library),
                  label: const Text("Gallery"),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_loading) const CircularProgressIndicator(),
            if (_result != null)
              Expanded(
                child: SingleChildScrollView(
                  child: Text("🔍 Kết quả:\n$_result"),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
