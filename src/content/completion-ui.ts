/**
 * 补全 UI 管理器
 */
export class CompletionUI {
  public container: HTMLDivElement | null = null;
  public currentCompletion: string = "";
  public targetElement: HTMLElement | null = null;

  /**
   * 创建补全 UI 容器
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "ai-writing-completion";
    container.style.display = "none";
    document.body.appendChild(container);
    return container;
  }

  /**
   * 获取或创建容器
   */
  private getContainer(): HTMLDivElement {
    if (!this.container) {
      this.container = this.createContainer();
    }
    return this.container;
  }

  /**
   * 显示补全建议
   */
  show(element: HTMLElement, completion: string): void {
    this.targetElement = element;
    this.currentCompletion = completion;

    const container = this.getContainer();
    container.textContent = completion;

    // 计算位置
    const rect = this.getCaretPosition(element);
    if (rect) {
      container.style.left = `${rect.left}px`;
      container.style.top = `${rect.top}px`;
    }

    container.style.display = "block";
  }

  /**
   * 隐藏补全建议
   */
  hide(): void {
    if (this.container) {
      this.container.style.display = "none";
    }
    this.currentCompletion = "";
    this.targetElement = null;
  }

  /**
   * 接受补全
   */
  accept(): void {
    if (!this.targetElement || !this.currentCompletion) {
      return;
    }

    this.insertText(this.targetElement, this.currentCompletion);
    this.hide();
  }

  /**
   * 获取光标位置
   */
  private getCaretPosition(
    element: HTMLElement,
  ): { left: number; top: number } | null {
    // 对于 textarea 和 input
    if (
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLInputElement
    ) {
      return this.getCaretPositionForInput(element);
    }

    // 对于 contenteditable
    if (element.isContentEditable) {
      return this.getCaretPositionForContentEditable();
    }

    return null;
  }

  /**
   * 获取 input/textarea 的光标位置
   */
  private getCaretPositionForInput(
    element: HTMLTextAreaElement | HTMLInputElement,
  ): { left: number; top: number } {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const fontSize = Number.parseFloat(style.fontSize);

    // 创建临时 div 来计算位置
    const div = document.createElement("div");
    const copyStyle = [
      "fontFamily",
      "fontSize",
      "fontWeight",
      "letterSpacing",
      "lineHeight",
      "padding",
      "border",
      "boxSizing",
    ];

    for (const prop of copyStyle) {
      const key = prop as keyof CSSStyleDeclaration;
      const value = style[key];
      if (typeof value === "string") {
        // biome-ignore lint/suspicious/noExplicitAny: ignore
        (div.style as any)[key] = value;
      }
    }

    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    div.style.width = `${element.offsetWidth}px`;

    const text = element.value.substring(0, element.selectionStart || 0);
    div.textContent = text;

    const span = document.createElement("span");
    span.textContent = "|";
    div.appendChild(span);

    document.body.appendChild(div);
    const spanRect = span.getBoundingClientRect();
    const divRect = div.getBoundingClientRect();
    document.body.removeChild(div);

    return {
      left: rect.left + (spanRect.left - divRect.left) + window.scrollX,
      top: rect.top + (spanRect.top - divRect.top) + fontSize + window.scrollY,
    };
  }

  /**
   * 获取 contenteditable 的光标位置
   */
  private getCaretPositionForContentEditable(): { left: number; top: number } {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return { left: 0, top: 0 };
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    return {
      left: rect.left + window.scrollX,
      top: rect.bottom + window.scrollY,
    };
  }

  /**
   * 插入文本
   */
  private insertText(element: HTMLElement, text: string): void {
    // 检测是否是代码编辑器环境
    if (this.isCodeEditor(element)) {
      // 对于代码编辑器，使用键盘输入模拟
      this.insertTextByKeyboardSimulation(element, text);
      return;
    }

    // 对于 textarea 和 input
    if (
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLInputElement
    ) {
      const start = element.selectionStart || 0;
      const end = element.selectionEnd || 0;
      const value = element.value;

      element.value = value.substring(0, start) + text + value.substring(end);
      element.selectionStart = element.selectionEnd = start + text.length;

      // 触发 input 事件
      element.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    // 对于 contenteditable
    if (element.isContentEditable) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);

      // 触发 input 事件
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  /**
   * 检测是否是代码编辑器
   */
  private isCodeEditor(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    while (current && current !== document.body) {
      const classList = current.classList;
      const className = current.className;

      // Monaco Editor
      if (
        classList.contains("monaco-editor") ||
        classList.contains("view-lines") ||
        classList.contains("view-line")
      ) {
        return true;
      }

      // CodeMirror
      if (
        classList.contains("CodeMirror") ||
        classList.contains("cm-content") ||
        classList.contains("cm-line")
      ) {
        return true;
      }

      // Ace Editor
      if (
        classList.contains("ace_editor") ||
        classList.contains("ace_text-input")
      ) {
        return true;
      }

      // 通用代码编辑器特征
      if (
        className.includes("editor") ||
        className.includes("code") ||
        className.includes("codemirror")
      ) {
        const role = current.getAttribute("role");
        if (role === "textbox" || role === "code") {
          return true;
        }
      }

      current = current.parentElement;
    }
    return false;
  }

  /**
   * 通过键盘输入模拟插入文本
   */
  private async insertTextByKeyboardSimulation(
    element: HTMLElement,
    text: string,
  ) {
    // 确保元素获得焦点
    element.focus();

    // 预处理文本：移除多行代码中的缩进，让编辑器自己处理
    const processedText = this.preprocessTextForCodeEditor(text);

    // 逐字符模拟键盘输入
    for await (const char of processedText) {
      const charCode = char.charCodeAt(0);

      // 创建 keydown 事件
      const keydownEvent = new KeyboardEvent("keydown", {
        key: char,
        code: this.getKeyCode(char),
        charCode: charCode,
        keyCode: charCode,
        which: charCode,
        bubbles: true,
        cancelable: true,
        composed: true,
      });

      // 创建 keypress 事件
      const keypressEvent = new KeyboardEvent("keypress", {
        key: char,
        code: this.getKeyCode(char),
        charCode: charCode,
        keyCode: charCode,
        which: charCode,
        bubbles: true,
        cancelable: true,
        composed: true,
      });

      // 创建 input 事件
      const inputEvent = new InputEvent("input", {
        data: char,
        inputType: "insertText",
        bubbles: true,
        cancelable: false,
        composed: true,
      });

      // 创建 keyup 事件
      const keyupEvent = new KeyboardEvent("keyup", {
        key: char,
        code: this.getKeyCode(char),
        charCode: charCode,
        keyCode: charCode,
        which: charCode,
        bubbles: true,
        cancelable: true,
        composed: true,
      });

      // 按顺序触发事件
      element.dispatchEvent(keydownEvent);
      element.dispatchEvent(keypressEvent);

      // 对于标准输入元素，直接插入字符
      if (
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLInputElement
      ) {
        const start = element.selectionStart || 0;
        const end = element.selectionEnd || 0;
        const value = element.value;
        element.value = value.substring(0, start) + char + value.substring(end);
        element.selectionStart = element.selectionEnd = start + 1;
      }

      element.dispatchEvent(inputEvent);
      element.dispatchEvent(keyupEvent);

      // 添加微小延迟，模拟真实输入（可选）
      await new Promise((resolve) => setTimeout(resolve, 4));
      // 对于长文本，可以考虑批量处理以提高性能
    }

    // 触发 change 事件
    element.dispatchEvent(new Event("change", { bubbles: true }));

    console.log(
      `Inserted text via keyboard simulation: ${text.length} characters`,
    );
  }

  /**
   * 预处理文本：移除多行代码中每行开头的空白，让编辑器自己处理缩进
   */
  private preprocessTextForCodeEditor(text: string): string {
    // 检查是否包含换行符
    if (!text.includes("\n")) {
      // 单行文本，不需要处理
      return text;
    }

    // 分割成行
    const lines = text.split("\n");

    // 如果只有一行（末尾有换行符的情况），不需要处理
    if (lines.length <= 1) {
      return text;
    }

    // 处理每一行
    const processedLines = lines.map((line, index) => {
      if (index === 0) {
        // 第一行保持原样
        return line;
      }

      // 后续行：移除所有前导空白
      // 编辑器会根据上下文自动添加适当的缩进
      line = line.trimStart();
      // 上一行如果是 :、{，下一行增加一个缩进
      const lastLine = lines[index - 1];
      if (lastLine.endsWith(":") || lastLine.endsWith("{")) {
        line = `\t${line}`;
      }
      return line;
    });

    return processedLines.join("\n");
  }

  /**
   * 获取字符对应的 KeyCode
   */
  private getKeyCode(char: string): string {
    // 特殊字符映射
    const specialKeys: Record<string, string> = {
      "\n": "Enter",
      "\t": "Tab",
      " ": "Space",
      "{": "BracketLeft",
      "}": "BracketRight",
      "(": "Digit9",
      ")": "Digit0",
      "[": "BracketLeft",
      "]": "BracketRight",
      ";": "Semicolon",
      ":": "Semicolon",
      "'": "Quote",
      '"': "Quote",
      ",": "Comma",
      ".": "Period",
      "/": "Slash",
      "\\": "Backslash",
      "`": "Backquote",
      "-": "Minus",
      "=": "Equal",
    };

    if (specialKeys[char]) {
      return specialKeys[char];
    }

    // 字母
    if (/[a-zA-Z]/.test(char)) {
      return `Key${char.toUpperCase()}`;
    }

    // 数字
    if (/[0-9]/.test(char)) {
      return `Digit${char}`;
    }

    return "Unidentified";
  }

  /**
   * 清理
   */
  destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
