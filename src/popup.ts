import { PREDEFINED_MODELS } from "./utils/constant";
import type { AIProvider, UserConfig } from "./utils/types";
import { MessageType } from "./utils/types";

/**
 * UI 元素
 */
interface UIElements {
  message: HTMLDivElement;
  modelSelect: HTMLSelectElement;
  apiKeyInput: HTMLInputElement;
  testConnectionBtn: HTMLButtonElement;
  autoCompleteCheckbox: HTMLInputElement;
  triggerDelayInput: HTMLInputElement;
  shortcutCtrlCheckbox: HTMLInputElement;
  shortcutAltCheckbox: HTMLInputElement;
  shortcutShiftCheckbox: HTMLInputElement;
  shortcutKeySelect: HTMLSelectElement;
  contextAwareCheckbox: HTMLInputElement;
  saveBtn: HTMLButtonElement;
}

/**
 * Popup 管理器
 */
class PopupManager {
  private elements!: UIElements;
  private config: UserConfig | null = null;
  private currentProvider: AIProvider = "openai";

  /**
   * 初始化
   */
  public async initialize(): Promise<void> {
    this.initElements();
    await this.loadConfig();
    this.bindEvents();
  }

  /**
   * 初始化 UI 元素
   */
  private initElements(): void {
    this.elements = {
      message: document.getElementById("message") as HTMLDivElement,
      modelSelect: document.getElementById("model") as HTMLSelectElement,
      apiKeyInput: document.getElementById("apiKey") as HTMLInputElement,
      testConnectionBtn: document.getElementById(
        "testConnection",
      ) as HTMLButtonElement,
      autoCompleteCheckbox: document.getElementById(
        "autoComplete",
      ) as HTMLInputElement,
      triggerDelayInput: document.getElementById(
        "triggerDelay",
      ) as HTMLInputElement,
      shortcutCtrlCheckbox: document.getElementById(
        "shortcutCtrl",
      ) as HTMLInputElement,
      shortcutAltCheckbox: document.getElementById(
        "shortcutAlt",
      ) as HTMLInputElement,
      shortcutShiftCheckbox: document.getElementById(
        "shortcutShift",
      ) as HTMLInputElement,
      shortcutKeySelect: document.getElementById(
        "shortcutKey",
      ) as HTMLSelectElement,
      contextAwareCheckbox: document.getElementById(
        "contextAware",
      ) as HTMLInputElement,
      saveBtn: document.getElementById("save") as HTMLButtonElement,
    };
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
        this.updateUI();
      }
    } catch (error) {
      this.showMessage("加载配置失败", "error");
      console.error("Failed to load config:", error);
    }
  }

  /**
   * 更新 UI
   */
  private updateUI(): void {
    if (!this.config) {
      return;
    }

    // 模型选择
    this.elements.modelSelect.value = this.config.selectedModel;
    this.updateApiKeyInput();

    // 补全设置
    this.elements.autoCompleteCheckbox.checked = this.config.autoComplete;
    this.elements.triggerDelayInput.value = this.config.triggerDelay.toString();

    // 快捷键设置
    this.elements.shortcutCtrlCheckbox.checked =
      this.config.manualTriggerKey.ctrl;
    this.elements.shortcutAltCheckbox.checked =
      this.config.manualTriggerKey.alt;
    this.elements.shortcutShiftCheckbox.checked =
      this.config.manualTriggerKey.shift;
    this.elements.shortcutKeySelect.value = this.config.manualTriggerKey.key;

    // 上下文感知
    this.elements.contextAwareCheckbox.checked = this.config.contextAware;
  }

  /**
   * 更新 API Key 输入框
   */
  private updateApiKeyInput(): void {
    if (!this.config) {
      return;
    }

    const selectedModel = this.elements.modelSelect.value;
    const model = PREDEFINED_MODELS.find((m) => m.id === selectedModel);
    if (model && this.config) {
      this.currentProvider = model.provider;
      this.elements.apiKeyInput.value =
        this.config.apiKeys[model.provider] || "";
      this.elements.apiKeyInput.placeholder = `输入 ${model.name} 的 API Key`;
    }
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    // 模型切换
    this.elements.modelSelect.addEventListener("change", () => {
      this.updateApiKeyInput();
    });

    // 测试连接
    this.elements.testConnectionBtn.addEventListener("click", () => {
      this.testConnection();
    });

    // 保存设置
    this.elements.saveBtn.addEventListener("click", () => {
      this.saveConfig();
    });
  }

  /**
   * 测试连接
   */
  private async testConnection(): Promise<void> {
    const apiKey = this.elements.apiKeyInput.value.trim();
    if (!apiKey) {
      this.showMessage("请输入 API Key", "error");
      return;
    }

    this.elements.testConnectionBtn.disabled = true;
    this.elements.testConnectionBtn.textContent = "测试中...";

    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.TEST_CONNECTION,
        data: {
          provider: this.currentProvider,
          apiKey,
        },
      });

      if (response.success) {
        this.showMessage("连接测试成功！", "success");
      } else {
        this.showMessage("连接测试失败，请检查 API Key", "error");
      }
    } catch (error) {
      this.showMessage("连接测试失败", "error");
      console.error("Test connection failed:", error);
    } finally {
      this.elements.testConnectionBtn.disabled = false;
      this.elements.testConnectionBtn.textContent = "测试连接";
    }
  }

  /**
   * 保存配置
   */
  private async saveConfig(): Promise<void> {
    if (!this.config) {
      return;
    }

    // 收集配置
    const selectedModel = this.elements.modelSelect.value;
    const apiKey = this.elements.apiKeyInput.value.trim();

    // 更新 API Key
    const model = PREDEFINED_MODELS.find((m) => m.id === selectedModel);
    if (model && apiKey) {
      this.config.apiKeys[model.provider] = apiKey;
    }

    const newConfig: Partial<UserConfig> = {
      selectedModel,
      apiKeys: this.config.apiKeys,
      autoComplete: this.elements.autoCompleteCheckbox.checked,
      triggerDelay: Number.parseInt(this.elements.triggerDelayInput.value, 10),
      manualTriggerKey: {
        ctrl: this.elements.shortcutCtrlCheckbox.checked,
        alt: this.elements.shortcutAltCheckbox.checked,
        shift: this.elements.shortcutShiftCheckbox.checked,
        key: this.elements.shortcutKeySelect.value,
      },
      contextAware: this.elements.contextAwareCheckbox.checked,
    };

    this.elements.saveBtn.disabled = true;
    this.elements.saveBtn.textContent = "保存中...";

    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.UPDATE_CONFIG,
        data: newConfig,
      });

      if (response.success) {
        this.showMessage("设置已保存！", "success");
        // 重新加载配置
        await this.loadConfig();
      } else {
        this.showMessage("保存失败", "error");
      }
    } catch (error) {
      this.showMessage("保存失败", "error");
      console.error("Failed to save config:", error);
    } finally {
      this.elements.saveBtn.disabled = false;
      this.elements.saveBtn.textContent = "保存设置";
    }
  }

  /**
   * 显示消息
   */
  private showMessage(text: string, type: "success" | "error"): void {
    this.elements.message.textContent = text;
    this.elements.message.className = `message ${type} show`;

    setTimeout(() => {
      this.elements.message.classList.remove("show");
    }, 3000);
  }
}

// 初始化
const manager = new PopupManager();
manager.initialize();
