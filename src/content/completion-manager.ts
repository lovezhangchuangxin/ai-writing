import type {
  CompletionRequest,
  CompletionResponse,
  UserConfig,
} from "../types";
import { MessageType } from "../types";
import { CompletionUI } from "./completion-ui";
import { ContextExtractor } from "./context-extractor";
import { EditorDetector } from "./editor-detector";

/**
 * 补全管理器
 */
export class CompletionManager {
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

    // 检查补全 UI 是否显示
    const uiInstance = this.ui as CompletionUI;
    const isCompletionVisible =
      uiInstance.container && uiInstance.container.style.display !== "none";

    // Tab 键接受补全
    if (event.key === "Tab" && isCompletionVisible) {
      event.preventDefault();
      this.ui.accept();
      return;
    }

    // 如果补全可见，任何其他可打印字符或功能键都会取消补全
    if (isCompletionVisible) {
      // 允许的键（不取消补全）
      const allowedKeys = [
        "Shift",
        "Control",
        "Alt",
        "Meta",
        "CapsLock",
        "NumLock",
        "ScrollLock",
        "Tab", // 已经在上面处理
      ];

      // Esc 键明确取消补全
      if (event.key === "Escape") {
        this.ui.hide();
        this.cancelTrigger();
        return;
      }

      // 其他任何键都取消补全（除了允许的修饰键）
      if (!allowedKeys.includes(event.key)) {
        this.ui.hide();
        // 不阻止默认行为，让用户的输入正常进行
      }
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
