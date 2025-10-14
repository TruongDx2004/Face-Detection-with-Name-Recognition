import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';

/// Widget để hiển thị HTML content với hỗ trợ đầy đủ
/// Sử dụng flutter_html package cho việc render chính xác HTML
class HtmlTextDisplay extends StatelessWidget {
  final String htmlContent;
  final TextStyle? baseStyle;
  final TextAlign textAlign;
  final EdgeInsets? padding;
  final Color? backgroundColor;

  const HtmlTextDisplay({
    Key? key,
    required this.htmlContent,
    this.baseStyle,
    this.textAlign = TextAlign.start,
    this.padding,
    this.backgroundColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final defaultStyle = baseStyle ?? theme.textTheme.bodyMedium;

    // Nếu không có HTML tags, hiển thị text thường
    if (!_containsHtmlTags(htmlContent)) {
      return Container(
        padding: padding,
        color: backgroundColor,
        child: Text(
          htmlContent,
          style: defaultStyle,
          textAlign: textAlign,
        ),
      );
    }

    return Container(
      padding: padding,
      color: backgroundColor,
      child: Html(
        data: _preprocessHtml(htmlContent),
        style: {
          "body": Style(
            margin: Margins.zero,
            padding: HtmlPaddings.zero,
            fontSize: FontSize(defaultStyle?.fontSize ?? 14),
            fontFamily: defaultStyle?.fontFamily,
            color: defaultStyle?.color,
            textAlign: _convertTextAlign(textAlign),
          ),
          "p": Style(
            margin: Margins.zero,
            padding: HtmlPaddings.zero,
          ),
          "strong": Style(
            fontWeight: FontWeight.bold,
          ),
          "b": Style(
            fontWeight: FontWeight.bold,
          ),
          "em": Style(
            fontStyle: FontStyle.italic,
          ),
          "i": Style(
            fontStyle: FontStyle.italic,
          ),
          "u": Style(
            textDecoration: TextDecoration.underline,
          ),
          "sub": Style(
            fontSize: FontSize((defaultStyle?.fontSize ?? 14) * 0.75),
            verticalAlign: VerticalAlign.sub,
          ),
          "sup": Style(
            fontSize: FontSize((defaultStyle?.fontSize ?? 14) * 0.75),
            verticalAlign: VerticalAlign.top,
          ),
          "span.chemical": Style(
            fontFamily: 'monospace',
            color: Colors.blue[700],
            fontWeight: FontWeight.w500,
          ),
          "span.formula": Style(
            fontFamily: 'monospace',
            color: Colors.blue[700],
            fontWeight: FontWeight.w500,
            backgroundColor: Colors.blue[50],
            padding: HtmlPaddings.symmetric(horizontal: 4),
            border: Border.all(color: Colors.blue[200]!),
          ),
        },
        onLinkTap: (url, attributes, element) {
          // Handle link taps if needed
        },
      ),
    );
  }

  /// Kiểm tra xem string có chứa HTML tags không
  bool _containsHtmlTags(String text) {
    return text.contains(RegExp(r'<[^>]+>'));
  }

  /// Chuyển đổi TextAlign thành TextAlign cho HTML
  TextAlign _convertTextAlign(TextAlign align) {
    switch (align) {
      case TextAlign.left:
        return TextAlign.left;
      case TextAlign.right:
        return TextAlign.right;
      case TextAlign.center:
        return TextAlign.center;
      case TextAlign.justify:
        return TextAlign.justify;
      default:
        return TextAlign.start;
    }
  }

  /// Tiền xử lý HTML để cải thiện hiển thị
  String _preprocessHtml(String html) {
    String processed = html;

    // Wrap trong p tag nếu chưa có
    if (!processed.trim().startsWith('<')) {
      processed = '<p>$processed</p>';
    }

    // Xử lý các span với style đặc biệt cho công thức hóa học
    processed = processed.replaceAllMapped(
      RegExp(r'<span[^>]*style[^>]*monospace[^>]*>(.*?)</span>', caseSensitive: false),
      (match) => '<span class="chemical">${match.group(1)}</span>',
    );

    // Xử lý các ký tự Unicode đặc biệt cho hóa học
    processed = _processChemicalUnicode(processed);

    return processed;
  }

  /// Xử lý các ký tự Unicode cho công thức hóa học
  String _processChemicalUnicode(String text) {
    // Map các ký tự subscript Unicode thành HTML sub tags
    final subscriptMap = {
      '₀': '<sub>0</sub>',
      '₁': '<sub>1</sub>',
      '₂': '<sub>2</sub>',
      '₃': '<sub>3</sub>',
      '₄': '<sub>4</sub>',
      '₅': '<sub>5</sub>',
      '₆': '<sub>6</sub>',
      '₇': '<sub>7</sub>',
      '₈': '<sub>8</sub>',
      '₉': '<sub>9</sub>',
    };

    // Map các ký tự superscript Unicode thành HTML sup tags
    final superscriptMap = {
      '⁰': '<sup>0</sup>',
      '¹': '<sup>1</sup>',
      '²': '<sup>2</sup>',
      '³': '<sup>3</sup>',
      '⁴': '<sup>4</sup>',
      '⁵': '<sup>5</sup>',
      '⁶': '<sup>6</sup>',
      '⁷': '<sup>7</sup>',
      '⁸': '<sup>8</sup>',
      '⁹': '<sup>9</sup>',
    };

    String result = text;

    // Thay thế subscript
    subscriptMap.forEach((unicode, html) {
      result = result.replaceAll(unicode, html);
    });

    // Thay thế superscript
    superscriptMap.forEach((unicode, html) {
      result = result.replaceAll(unicode, html);
    });

    return result;
  }
}

/// Widget đặc biệt cho việc hiển thị câu hỏi exam
class ExamQuestionDisplay extends StatelessWidget {
  final String questionText;
  final TextStyle? style;
  final EdgeInsets? padding;

  const ExamQuestionDisplay({
    Key? key,
    required this.questionText,
    this.style,
    this.padding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return HtmlTextDisplay(
      htmlContent: questionText,
      baseStyle: style,
      padding: padding ?? const EdgeInsets.symmetric(vertical: 8),
      backgroundColor: Colors.grey[50],
    );
  }
}

/// Widget đặc biệt cho việc hiển thị đáp án
class ExamAnswerDisplay extends StatelessWidget {
  final String answerText;
  final bool isSelected;
  final bool isCorrect;
  final bool showCorrectAnswer;
  final VoidCallback? onTap;

  const ExamAnswerDisplay({
    Key? key,
    required this.answerText,
    this.isSelected = false,
    this.isCorrect = false,
    this.showCorrectAnswer = false,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color backgroundColor = Colors.transparent;
    Color borderColor = Colors.grey.shade300;
    IconData iconData = Icons.radio_button_unchecked;
    Color iconColor = Colors.grey;

    if (showCorrectAnswer) {
      if (isCorrect) {
        backgroundColor = Colors.green.withOpacity(0.1);
        borderColor = Colors.green;
        iconData = Icons.check_circle;
        iconColor = Colors.green;
      } else if (isSelected) {
        backgroundColor = Colors.red.withOpacity(0.1);
        borderColor = Colors.red;
        iconData = Icons.cancel;
        iconColor = Colors.red;
      }
    } else if (isSelected) {
      backgroundColor = Colors.blue.withOpacity(0.1);
      borderColor = Colors.blue;
      iconData = Icons.radio_button_checked;
      iconColor = Colors.blue;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: backgroundColor,
            border: Border.all(color: borderColor, width: 1.5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(iconData, color: iconColor, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: HtmlTextDisplay(
                  htmlContent: answerText,
                  baseStyle: TextStyle(
                    fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Extension methods để dễ dàng sử dụng
extension HtmlDisplayHelper on String {
  /// Chuyển đổi HTML string thành HtmlTextDisplay widget
  Widget toHtmlDisplay({
    TextStyle? style,
    TextAlign textAlign = TextAlign.start,
    EdgeInsets? padding,
    Color? backgroundColor,
  }) {
    return HtmlTextDisplay(
      htmlContent: this,
      baseStyle: style,
      textAlign: textAlign,
      padding: padding,
      backgroundColor: backgroundColor,
    );
  }

  /// Hiển thị như exam question
  Widget toExamQuestion({
    TextStyle? style,
    EdgeInsets? padding,
  }) {
    return ExamQuestionDisplay(
      questionText: this,
      style: style,
      padding: padding,
    );
  }
}