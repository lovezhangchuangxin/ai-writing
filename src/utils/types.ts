/**
 * AI 模型提供商
 */
export type AIProvider = "openai" | "anthropic" | "deepseek" | "custom";

/**
 * AI 模型配置
 */
export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  apiEndpoint: string;
  maxTokens?: number;
}

/**
 * 用户配置
 */
export interface UserConfig {
  // 当前选中的模型
  selectedModel: string;
  // API Keys (按 provider 存储)
  apiKeys: Record<AIProvider, string>;
  // 自动补全开关
  autoComplete: boolean;
  // 触发延迟（毫秒）
  triggerDelay: number;
  // 触发字符
  triggerChars: string[];
  // 手动触发快捷键
  manualTriggerKey: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    key: string;
  };
  // 页面上下文感知
  contextAware: boolean;
  // 自定义模型配置
  customModels: AIModel[];
}

/**
 * 消息类型枚举
 */
export enum MessageType {
  GET_CONFIG = "GET_CONFIG",
  UPDATE_CONFIG = "UPDATE_CONFIG",
  TEST_CONNECTION = "TEST_CONNECTION",
  REQUEST_COMPLETION = "REQUEST_COMPLETION",
  COMPLETION_RESPONSE = "COMPLETION_RESPONSE",
  ERROR = "ERROR",
}

/**
 * 消息基类
 */
export interface Message {
  type: MessageType;
  data?: unknown;
}

/**
 * 补全请求
 */
export interface CompletionRequest {
  text: string; // 光标前的文本
  context?: string; // 页面上下文
  language?: string; // 编程语言类型
}

/**
 * 补全响应
 */
export interface CompletionResponse {
  completion: string;
  model: string;
}

/**
 * 页面上下文信息
 */
export interface PageContext {
  url: string;
  title: string;
  description: string;
  keywords: string[];
  headings: string[];
  mainContent: string;
}
