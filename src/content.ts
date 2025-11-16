import type {
  CompletionRequest,
  CompletionResponse,
  PageContext,
  UserConfig,
} from "./types";
import { MessageType } from "./types";

/**
 * 补全 UI 管理器
 */
class CompletionUI {
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
   * 清理
   */
  destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

/**
 * 编辑器检测器
 */
class EditorDetector {
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

/**
 * 页面上下文提取器
 */
class ContextExtractor {
  /**
   * 提取页面上下文
   */
  extract(): PageContext {
    const title = document.title;
    const description =
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content") || "";
    const keywordsContent =
      document
        .querySelector('meta[name="keywords"]')
        ?.getAttribute("content") || "";
    const keywords = keywordsContent.split(",").map((k) => k.trim());

    // 提取标题
    const headings: string[] = [];
    for (const level of ["h1", "h2", "h3"]) {
      const elements = document.querySelectorAll(level);
      for (const el of elements) {
        const text = el.textContent?.trim();
        if (text) {
          headings.push(text);
        }
      }
    }

    // 提取主要内容
    let mainContent = "";
    const mainElement =
      document.querySelector("main") ||
      document.querySelector("article") ||
      document.querySelector('[role="main"]') ||
      document.body;

    if (mainElement) {
      mainContent = mainElement.textContent?.trim().substring(0, 2000) || "";
    }

    return {
      title,
      description,
      keywords,
      headings,
      mainContent,
    };
  }

  /**
   * 格式化上下文为字符串
   */
  format(context: PageContext): string {
    const parts: string[] = [];

    if (context.title) {
      parts.push(`Title: ${context.title}`);
    }

    if (context.description) {
      parts.push(`Description: ${context.description}`);
    }

    if (context.headings.length > 0) {
      parts.push(`Headings: ${context.headings.slice(0, 5).join(", ")}`);
    }

    return parts.join("\n");
  }
}

/**
 * 补全管理器
 */
class CompletionManager {
  private config: UserConfig | null = null;
  private ui: CompletionUI;
  private detector: EditorDetector;
  private contextExtractor: ContextExtractor;
  private currentElement: HTMLElement | null = null;
  private triggerTimer: number | null = null;
  private isRequesting = false;

  constructor() {
    this.ui = new CompletionUI();
    this.detector = new EditorDetector();
    this.contextExtractor = new ContextExtractor();
  }

  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    // 加载配置
    await this.loadConfig();

    // 监听焦点事件
    document.addEventListener("focusin", this.handleFocusIn.bind(this), true);
    document.addEventListener("focusout", this.handleFocusOut.bind(this), true);

    // 监听键盘事件
    document.addEventListener("keydown", this.handleKeyDown.bind(this), true);
    document.addEventListener("input", this.handleInput.bind(this), true);

    console.log("AI Writing Assistant content script initialized");
  }

  /**
   * 加载配置
   */
  private async loadConfig(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.GET_CONFIG,
      });
      if (response.success) {
        this.config = response.data;
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  }

  /**
   * 处理焦点进入
   */
  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (this.detector.isEditable(target)) {
      this.currentElement = target;
    }
  }

  /**
   * 处理焦点离开
   */
  private handleFocusOut(): void {
    this.currentElement = null;
    this.ui.hide();
    this.cancelTrigger();
  }

  /**
   * 处理键盘事件
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.currentElement || !this.config) {
      return;
    }

    // Tab 键接受补全
    if (event.key === "Tab" && this.ui) {
      // 检查补全 UI 是否显示
      const uiInstance = this.ui as CompletionUI;
      if (
        uiInstance.container &&
        uiInstance.container.style.display !== "none"
      ) {
        event.preventDefault();
        this.ui.accept();
        return;
      }
    }

    // Esc 键取消补全
    if (event.key === "Escape") {
      this.ui.hide();
      this.cancelTrigger();
      return;
    }

    // 手动触发快捷键
    const { ctrl, alt, shift, key } = this.config.manualTriggerKey;
    if (
      event.ctrlKey === ctrl &&
      event.altKey === alt &&
      event.shiftKey === shift &&
      event.key.toLowerCase() === key.toLowerCase()
    ) {
      event.preventDefault();
      this.requestCompletion();
    }
  }

  /**
   * 处理输入事件
   */
  private handleInput(event: Event): void {
    if (!this.currentElement || !this.config || !this.config.autoComplete) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target !== this.currentElement) {
      return;
    }

    // 取消之前的触发
    this.cancelTrigger();

    // 检查是否输入了触发字符
    const text = this.detector.getTextBeforeCursor(target);
    const lastChar = text[text.length - 1];

    if (this.config.triggerChars.includes(lastChar)) {
      // 立即触发
      this.requestCompletion();
    } else {
      // 延迟触发
      this.triggerTimer = window.setTimeout(() => {
        this.requestCompletion();
      }, this.config.triggerDelay);
    }
  }

  /**
   * 取消触发
   */
  private cancelTrigger(): void {
    if (this.triggerTimer) {
      clearTimeout(this.triggerTimer);
      this.triggerTimer = null;
    }
  }

  /**
   * 请求补全
   */
  private async requestCompletion(): Promise<void> {
    if (!this.currentElement || !this.config || this.isRequesting) {
      return;
    }

    const text = this.detector.getTextBeforeCursor(this.currentElement);
    if (!text || text.length < 3) {
      return;
    }

    this.isRequesting = true;

    try {
      const request: CompletionRequest = {
        text,
        language: this.detector.detectLanguage(this.currentElement),
      };

      // 添加页面上下文
      if (this.config.contextAware) {
        const context = this.contextExtractor.extract();
        request.context = this.contextExtractor.format(context);
      }

      const response = await chrome.runtime.sendMessage({
        type: MessageType.REQUEST_COMPLETION,
        data: request,
      });

      if (response.success) {
        const completion = response.data as CompletionResponse;
        if (completion.completion && this.currentElement) {
          this.ui.show(this.currentElement, completion.completion);
        }
      } else {
        console.error("Completion request failed:", response.error);
      }
    } catch (error) {
      console.error("Error requesting completion:", error);
    } finally {
      this.isRequesting = false;
    }
  }

  /**
   * 清理
   */
  destroy(): void {
    this.ui.destroy();
    this.cancelTrigger();
  }
}

// 初始化
const manager = new CompletionManager();
manager.initialize();
