class FaceRegisterRequest {
  final List<String> images;

  FaceRegisterRequest({
    required this.images,
  });

  Map<String, dynamic> toJson() {
    return {
      'images': images,
    };
  }
}