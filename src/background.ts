import { configManager } from "./background/config-manager";
import type {
  CompletionRequest,
  CompletionResponse,
  Message,
  UserConfig,
} from "./types";
import { MessageType, PREDEFINED_MODELS } from "./types";

/**
 * AI API 客户端
 */
class AIClient {
  /**
   * 请求 OpenAI API
   */
  private async requestOpenAI(
    apiKey: string,
    endpoint: string,
    modelId: string,
    prompt: string,
    maxTokens: number,
  ): Promise<string> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "system",
            content:
              "You are a code and text completion assistant. Complete the user's text naturally and concisely. Only return the completion text without any explanation or prefix.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API request failed");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  /**
   * 请求 Anthropic API
   */
  private async requestAnthropic(
    apiKey: string,
    endpoint: string,
    modelId: string,
    prompt: string,
    maxTokens: number,
  ): Promise<string> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: maxTokens,
        messages: [
          {
            role: "user",
            content: `You are a code and text completion assistant. Complete the following text naturally and concisely. Only return the completion text without any explanation or prefix.\n\n${prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Anthropic API request failed");
    }

    const data = await response.json();
    return data.content[0]?.text || "";
  }

  /**
   * 请求 DeepSeek API (兼容 OpenAI 格式)
   */
  private async requestDeepSeek(
    apiKey: string,
    endpoint: string,
    modelId: string,
    prompt: string,
    maxTokens: number,
  ): Promise<string> {
    return this.requestOpenAI(apiKey, endpoint, modelId, prompt, maxTokens);
  }

  /**
   * 统一的补全请求接口
   */
  async requestCompletion(
    request: CompletionRequest,
  ): Promise<CompletionResponse> {
    const config = configManager.get();
    const model = configManager.getModel(config.selectedModel);

    if (!model) {
      throw new Error(`Model not found: ${config.selectedModel}`);
    }

    const apiKey = configManager.getApiKey(model.provider);
    if (!apiKey) {
      throw new Error(`API Key not configured for provider: ${model.provider}`);
    }

    // 构建 prompt
    let prompt = request.text;
    if (config.contextAware && request.context) {
      prompt = `Context: ${request.context}\n\nText to complete: ${request.text}`;
    }

    // 根据 provider 调用对应的 API
    let completion: string;
    const maxTokens = model.maxTokens || 500;

    switch (model.provider) {
      case "openai":
        completion = await this.requestOpenAI(
          apiKey,
          model.apiEndpoint,
          model.id,
          prompt,
          maxTokens,
        );
        break;
      case "anthropic":
        completion = await this.requestAnthropic(
          apiKey,
          model.apiEndpoint,
          model.id,
          prompt,
          maxTokens,
        );
        break;
      case "deepseek":
        completion = await this.requestDeepSeek(
          apiKey,
          model.apiEndpoint,
          model.id,
          prompt,
          maxTokens,
        );
        break;
      case "custom":
        // 自定义模型默认使用 OpenAI 兼容格式
        completion = await this.requestOpenAI(
          apiKey,
          model.apiEndpoint,
          model.id,
          prompt,
          maxTokens,
        );
        break;
      default:
        throw new Error(`Unsupported provider: ${model.provider}`);
    }

    return {
      completion: completion.trim(),
      model: model.id,
    };
  }

  /**
   * 测试 API 连接
   */
  async testConnection(provider: string, apiKey: string): Promise<boolean> {
    const model = PREDEFINED_MODELS.find((m) => m.provider === provider);
    if (!model) {
      throw new Error(`No model found for provider: ${provider}`);
    }

    try {
      switch (provider) {
        case "openai":
          await this.requestOpenAI(
            apiKey,
            model.apiEndpoint,
            model.id,
            "Test",
            10,
          );
          break;
        case "anthropic":
          await this.requestAnthropic(
            apiKey,
            model.apiEndpoint,
            model.id,
            "Test",
            10,
          );
          break;
        case "deepseek":
          await this.requestDeepSeek(
            apiKey,
            model.apiEndpoint,
            model.id,
            "Test",
            10,
          );
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }
}

const aiClient = new AIClient();

/**
 * 消息处理器
 */
async function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    switch (message.type) {
      case MessageType.GET_CONFIG: {
        const config = await configManager.load();
        sendResponse({ success: true, data: config });
        break;
      }

      case MessageType.UPDATE_CONFIG: {
        await configManager.save(message.data as Partial<UserConfig>);
        sendResponse({ success: true });
        break;
      }

      case MessageType.TEST_CONNECTION: {
        const { provider, apiKey } = message.data as {
          provider: string;
          apiKey: string;
        };
        const result = await aiClient.testConnection(provider, apiKey);
        sendResponse({ success: result });
        break;
      }

      case MessageType.REQUEST_COMPLETION: {
        const request = message.data as CompletionRequest;
        const response = await aiClient.requestCompletion(request);
        sendResponse({ success: true, data: response });
        break;
      }

      default:
        sendResponse({ success: false, error: "Unknown message type" });
    }
  } catch (error) {
    console.error("Error handling message:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * 初始化
 */
async function initialize(): Promise<void> {
  // 加载配置
  await configManager.load();
  console.log("AI Writing Assistant background script initialized");
}

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // 保持消息通道开启以支持异步响应
});

// 初始化
initialize();
