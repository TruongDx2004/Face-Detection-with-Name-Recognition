# Rich Text Implementation Guide

## Vấn đề đã giải quyết

Trước đây, khi giáo viên nhập nội dung câu hỏi trong ExamForm với rich text formatting (in đậm, ký tự đặc biệt hóa học, v.v.), giao diện Flutter chỉ hiển thị như text thường, không giữ được định dạng.

## Giải pháp triển khai

### 1. Thêm Dependencies

Đã thêm `flutter_html: ^3.0.0-beta.2` vào `pubspec.yaml` để hỗ trợ render HTML content.

### 2. Tạo Widgets mới

#### `lib/widgets/rich_text_display.dart`
- Widget cơ bản dùng TextSpan để render HTML đơn giản
- Hỗ trợ: Bold, Italic, Underline, Subscript, Superscript
- Xử lý ký tự Unicode cho công thức hóa học

#### `lib/widgets/html_text_display.dart`
- Widget nâng cao sử dụng flutter_html package
- **HtmlTextDisplay**: Widget chính để hiển thị HTML content
- **ExamQuestionDisplay**: Widget đặc biệt cho câu hỏi exam
- **ExamAnswerDisplay**: Widget đặc biệt cho đáp án (hỗ trợ selection state)

### 3. Cập nhật Screens

#### `lib/screens/student/exam_detail_screen.dart`
- Thay thế `Text` widget bằng `HtmlTextDisplay` cho mô tả exam

#### `lib/screens/student/exam_taking_screen.dart`
- Thay thế hiển thị câu hỏi bằng `ExamQuestionDisplay`
- Thay thế hiển thị đáp án bằng `ExamAnswerDisplay`
- Cải thiện UX với styling và state management

## Các tính năng được hỗ trợ

### HTML Tags
- `<strong>`, `<b>`: **In đậm**
- `<em>`, `<i>`: *In nghiêng* 
- `<u>`: <u>Gạch chân</u>
- `<sub>`: Chỉ số dưới (H₂O)
- `<sup>`: Chỉ số trên (x²)
- `<span>` với CSS styling đặc biệt

### Ký tự Unicode Hóa học
- Subscripts: ₀₁₂₃₄₅₆₇₈₉
- Superscripts: ⁰¹²³⁴⁵⁶⁷⁸⁹
- Tự động chuyển đổi Unicode thành HTML tags

### Styling đặc biệt
- Công thức hóa học: font monospace, màu xanh
- Background highlight cho formulas quan trọng
- Responsive design cho mobile

## Cách sử dụng

### Trong ExamForm (React)
```jsx
// Đã có sẵn - RichTextEditor tạo HTML content
<RichTextEditor
  value={question.question_text}
  onChange={(value) => updateQuestion(index, 'question_text', value)}
  placeholder="Nhập nội dung câu hỏi - Sử dụng toolbar để định dạng văn bản và chèn công thức hóa học"
  height="120px"
/>
```

### Trong Flutter
```dart
// Cho câu hỏi
ExamQuestionDisplay(
  questionText: question.questionText, // HTML content từ API
  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
)

// Cho đáp án
ExamAnswerDisplay(
  answerText: option, // HTML content từ API
  isSelected: isSelected,
  onTap: () => selectAnswer(),
)

// Cho text thường với HTML
HtmlTextDisplay(
  htmlContent: htmlString,
  baseStyle: Theme.of(context).textTheme.bodyMedium,
)

// Extension method để dễ sử dụng
htmlString.toHtmlDisplay(style: myStyle)
htmlString.toExamQuestion()
```

## Ví dụ HTML được hỗ trợ

### Công thức Hóa học
```html
<strong>H₂SO₄</strong> + 2NaOH → Na₂SO₄ + 2H₂O
<span style="font-family: monospace; color: #2563eb;">CaCO₃</span>
```

### Toán học
```html
Tính: <strong>x²</strong> + 2<sup>3</sup> = ?
E = mc<sup>2</sup>
```

### Câu hỏi phức tạp
```html
<strong>Câu 1:</strong> Phản ứng giữa <strong>Ca(OH)₂</strong> và <strong>CO₂</strong>:
<br/>A. <strong>CaCO₃</strong> + H₂O
<br/>B. <em>Ca(HCO₃)₂</em>
```

## Testing

File test: `tmp_rovodev_test_rich_text.dart`
- Chứa các test cases cho different HTML formats
- Có thể chạy độc lập để kiểm tra rendering
- Bao gồm cả simple và complex cases

## Performance Notes

- `HtmlTextDisplay` fallback về `Text` widget nếu không có HTML tags
- Caching được implement trong flutter_html package
- Minimal overhead cho text thường
- Optimized cho mobile performance

## Tương thích

- ✅ Android
- ✅ iOS  
- ✅ Web (limited HTML support)
- ✅ All screen sizes
- ✅ Dark/Light themes

## Troubleshooting

### Nếu không hiển thị đúng:
1. Kiểm tra HTML format từ API
2. Verify flutter_html package được cài đặt
3. Check console logs cho HTML parsing errors

### Common issues:
- Nested tags: Đảm bảo proper closing tags
- Unicode: Sử dụng proper encoding UTF-8
- Styling: Test trên real device, không chỉ simulator

## Next Steps

1. **Testing**: Chạy trên real devices để đảm bảo rendering chính xác
2. **Optimization**: Monitor performance với large content
3. **Extension**: Thêm support cho images, tables nếu cần
4. **Accessibility**: Implement proper semantics cho screen readers