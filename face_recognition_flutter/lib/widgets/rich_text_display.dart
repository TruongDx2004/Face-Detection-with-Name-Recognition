import 'package:flutter/material.dart';

/// Widget để hiển thị rich text content từ HTML
/// Hỗ trợ: Bold, Italic, Underline, Subscript, Superscript, và ký tự Unicode hóa học
class RichTextDisplay extends StatelessWidget {
  final String htmlContent;
  final TextStyle? baseStyle;
  final TextAlign textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  const RichTextDisplay({
    super.key,
    required this.htmlContent,
    this.baseStyle,
    this.textAlign = TextAlign.start,
    this.maxLines,
    this.overflow,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final defaultStyle = baseStyle ?? theme.textTheme.bodyMedium ?? const TextStyle();
    
    final richText = _parseHtmlToRichText(htmlContent, defaultStyle);
    
    return Text.rich(
      richText,
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
    );
  }

  /// Parse HTML content và chuyển đổi thành TextSpan
  TextSpan _parseHtmlToRichText(String html, TextStyle baseStyle) {
    // Nếu không có HTML tags, return text thường
    if (!html.contains('<') && !html.contains('>')) {
      return TextSpan(text: html, style: baseStyle);
    }

    List<TextSpan> spans = [];
    String currentText = '';
    TextStyle currentStyle = baseStyle;
    
    // Stack để theo dõi các style lồng nhau
    List<TextStyle> styleStack = [baseStyle];
    
    int i = 0;
    while (i < html.length) {
      if (html[i] == '<') {
        // Thêm text hiện tại nếu có
        if (currentText.isNotEmpty) {
          spans.add(TextSpan(text: currentText, style: currentStyle));
          currentText = '';
        }
        
        // Tìm tag kết thúc
        int tagEnd = html.indexOf('>', i);
        if (tagEnd == -1) break;
        
        String tag = html.substring(i + 1, tagEnd).toLowerCase();
        
        // Xử lý các tag
        if (tag == 'strong' || tag == 'b') {
          currentStyle = currentStyle.copyWith(fontWeight: FontWeight.bold);
          styleStack.add(currentStyle);
        } else if (tag == '/strong' || tag == '/b') {
          styleStack.removeLast();
          currentStyle = styleStack.last;
        } else if (tag == 'em' || tag == 'i') {
          currentStyle = currentStyle.copyWith(fontStyle: FontStyle.italic);
          styleStack.add(currentStyle);
        } else if (tag == '/em' || tag == '/i') {
          styleStack.removeLast();
          currentStyle = styleStack.last;
        } else if (tag == 'u') {
          currentStyle = currentStyle.copyWith(decoration: TextDecoration.underline);
          styleStack.add(currentStyle);
        } else if (tag == '/u') {
          styleStack.removeLast();
          currentStyle = styleStack.last;
        } else if (tag == 'sub') {
          currentStyle = currentStyle.copyWith(
            fontSize: (currentStyle.fontSize ?? 14) * 0.8,
            height: 1.2,
          );
          styleStack.add(currentStyle);
        } else if (tag == '/sub') {
          styleStack.removeLast();
          currentStyle = styleStack.last;
        } else if (tag == 'sup') {
          currentStyle = currentStyle.copyWith(
            fontSize: (currentStyle.fontSize ?? 14) * 0.8,
            height: 0.8,
          );
          styleStack.add(currentStyle);
        } else if (tag == '/sup') {
          styleStack.removeLast();
          currentStyle = styleStack.last;
        } else if (tag.startsWith('span')) {
          // Xử lý span với style đặc biệt cho công thức hóa học
          if (tag.contains('monospace') || tag.contains('color')) {
            currentStyle = currentStyle.copyWith(
              fontFamily: 'monospace',
              color: Colors.blue[700],
              fontWeight: FontWeight.w500,
            );
            styleStack.add(currentStyle);
          }
        } else if (tag == '/span') {
          if (styleStack.length > 1) {
            styleStack.removeLast();
            currentStyle = styleStack.last;
          }
        }
        
        i = tagEnd + 1;
      } else {
        currentText += html[i];
        i++;
      }
    }
    
    // Thêm text cuối cùng
    if (currentText.isNotEmpty) {
      spans.add(TextSpan(text: currentText, style: currentStyle));
    }
    
    return TextSpan(children: spans);
  }
}

/// Widget đơn giản để hiển thị chemical formulas với Unicode subscripts
class ChemicalFormulaText extends StatelessWidget {
  final String formula;
  final TextStyle? style;

  const ChemicalFormulaText({
    super.key,
    required this.formula,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    final defaultStyle = style ?? Theme.of(context).textTheme.bodyMedium;
    
    return Text(
      formula,
      style: defaultStyle?.copyWith(
        fontFamily: 'monospace',
        fontFeatures: [
          // Hỗ trợ subscript và superscript Unicode
          const FontFeature.enable('subs'),
          const FontFeature.enable('sups'),
        ],
      ),
    );
  }
}

/// Extension methods để dễ dàng sử dụng
extension RichTextHelper on String {
  /// Chuyển đổi HTML string thành RichTextDisplay widget
  Widget toRichText({
    TextStyle? style,
    TextAlign textAlign = TextAlign.start,
    int? maxLines,
    TextOverflow? overflow,
  }) {
    return RichTextDisplay(
      htmlContent: this,
      baseStyle: style,
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
    );
  }
  
  /// Hiển thị như chemical formula
  Widget toChemicalFormula({TextStyle? style}) {
    return ChemicalFormulaText(
      formula: this,
      style: style,
    );
  }
}