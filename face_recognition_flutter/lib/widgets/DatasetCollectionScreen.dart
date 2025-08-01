import 'package:flutter/material.dart';
import 'package:face_attendance/widgets/FaceDatasetCollector.dart'; // Import widget từ file trên

class DatasetCollectionScreen extends StatefulWidget {
  @override
  _DatasetCollectionScreenState createState() => _DatasetCollectionScreenState();
}

class _DatasetCollectionScreenState extends State<DatasetCollectionScreen> {
  final TextEditingController _userIdController = TextEditingController();
  bool _showCollection = false;

  @override
  void initState() {
    super.initState();
    // Thêm listener để cập nhật trạng thái nút khi văn bản thay đổi
    _userIdController.addListener(_onTextChanged);
  }

  void _onTextChanged() {
    // Gọi setState để widget được build lại,
    // nhờ đó điều kiện _userIdController.text.isNotEmpty sẽ được đánh giá lại
    setState(() {});
  }

  @override
  void dispose() {
    // Loại bỏ listener và dispose controller để tránh rò rỉ bộ nhớ
    _userIdController.removeListener(_onTextChanged);
    _userIdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_showCollection) {
      return FaceDatasetCollector(
        userId: _userIdController.text,
        maxSamples: 30, // Giống như code Python
        onImageCaptured: (String imagePath) {
          print('Image saved: $imagePath');
          // Có thể hiển thị snackbar hoặc update UI
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Face captured: ${imagePath.split('/').last}'),
              duration: const Duration(milliseconds: 500),
            ),
          );
        },
        onProgressUpdate: (int count) {
          print('Progress: $count/30');
        },
        onCompleted: () {
          print('Dataset collection completed!');
          // Quay lại màn hình chính
          setState(() {
            _showCollection = false;
          });
          
          // Hiển thị dialog hoàn thành
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Collection Complete'),
              content: Text('Successfully collected 30 face samples for user ${_userIdController.text}'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('OK'),
                ),
              ],
            ),
          );
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Face Dataset Collection'),
        backgroundColor: Colors.blue,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.face,
              size: 100,
              color: Colors.blue,
            ),
            
            const SizedBox(height: 30),
            
            const Text(
              'Face Dataset Collection',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 10),
            
            const Text(
              'This will automatically capture 30 face samples for training',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
            
            const SizedBox(height: 40),
            
            TextField(
              controller: _userIdController,
              decoration: const InputDecoration(
                labelText: 'Enter User ID',
                hintText: 'e.g., 001, john_doe, etc.',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person),
              ),
              keyboardType: TextInputType.text,
            ),
            
            const SizedBox(height: 30),
            
            ElevatedButton(
              onPressed: _userIdController.text.isNotEmpty
                  ? () {
                      setState(() {
                        _showCollection = true;
                      });
                    }
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 15),
                textStyle: const TextStyle(fontSize: 18),
              ),
              child: const Text('Start Collection'),
            ),
            
            const SizedBox(height: 20),
            
            const Card(
              child: Padding(
                padding: EdgeInsets.all(15.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Instructions:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 10),
                    Text('• Position your face in front of the camera'),
                    Text('• Ensure good lighting'),
                    Text('• Move your head slightly during capture'),
                    Text('• The system will automatically capture 30 samples'),
                    Text('• Press START when ready'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
