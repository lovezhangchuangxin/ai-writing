import type { AIModel, UserConfig } from "./types";

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: UserConfig = {
  selectedModel: "gpt-4o-mini",
  apiKeys: {
    openai: "",
    anthropic: "",
    deepseek: "",
    custom: "",
  },
  autoComplete: true,
  triggerDelay: 500,
  triggerChars: [".", "(", "{", "[", ":", " "],
  manualTriggerKey: {
    ctrl: true,
    alt: false,
    shift: false,
    key: "k",
  },
  contextAware: true,
  customModels: [],
};

/**
 * 预定义的 AI 模型
 */
export const PREDEFINED_MODELS: AIModel[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    maxTokens: 500,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    maxTokens: 500,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    apiEndpoint: "https://api.anthropic.com/v1/messages",
    maxTokens: 500,
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    provider: "deepseek",
    apiEndpoint: "https://api.deepseek.com/v1/chat/completions",
    maxTokens: 500,
  },
];

/**
 * 系统提示词
 */
export const SYSTEM_PROMPT = `You are an intelligent text completion assistant. \
The user is typing on a webpage, and you need to predict and complete what they \
want to write next. Below you will receive the webpage context and the partial \
text the user has already typed. Your task is to naturally continue and complete \
the remaining content. Rules: 1) Only return the completion part, do not repeat \
the user's input; 2) Do not add any explanations, comments, or prefixes; 3) Keep \
the completion concise and natural; 4) For code, maintain proper formatting and \
indentation style.`;
