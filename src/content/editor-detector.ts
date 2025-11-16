/**
 * 编辑器检测器
 */
export class EditorDetector {
  /**
   * 检测元素是否可编辑
   */
  isEditable(element: HTMLElement): boolean {
    if (element instanceof HTMLTextAreaElement) {
      return !element.disabled && !element.readOnly;
    }

    if (element instanceof HTMLInputElement) {
      const type = element.type.toLowerCase();
      return (
        (type === "text" ||
          type === "search" ||
          type === "email" ||
          type === "url") &&
        !element.disabled &&
        !element.readOnly
      );
    }

    return element.isContentEditable;
  }

  /**
   * 获取光标前的文本
   */
  getTextBeforeCursor(element: HTMLElement): string {
    if (
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLInputElement
    ) {
      return element.value.substring(0, element.selectionStart || 0);
    }

    if (element.isContentEditable) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return "";
      }

      const range = selection.getRangeAt(0);
      const preRange = range.cloneRange();
      preRange.selectNodeContents(element);
      preRange.setEnd(range.startContainer, range.startOffset);

      return preRange.toString();
    }

    return "";
  }

  /**
   * 检测编程语言
   */
  detectLanguage(element: HTMLElement): string | undefined {
    // 检查元素的 class 和 data 属性
    const className = element.className.toLowerCase();
    const dataLang = element.getAttribute("data-language");

    if (dataLang) {
      return dataLang;
    }

    // 常见的语言 class 模式
    const langPatterns = [
      /lang-(\w+)/,
      /language-(\w+)/,
      /\b(javascript|typescript|python|java|cpp|csharp|go|rust|php|ruby|swift)\b/,
    ];

    for (const pattern of langPatterns) {
      const match = className.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }
}

