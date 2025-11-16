import type { AIModel, AIProvider, UserConfig } from "../types";
import { DEFAULT_CONFIG, PREDEFINED_MODELS } from "../types";

/**
 * 配置管理器
 */
export class ConfigManager {
  private config: UserConfig = DEFAULT_CONFIG;

  async load(): Promise<UserConfig> {
    const result = await chrome.storage.local.get("config");
    if (result.config) {
      this.config = { ...DEFAULT_CONFIG, ...result.config };
    }
    return this.config;
  }

  async save(config: Partial<UserConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await chrome.storage.local.set({ config: this.config });
  }

  get(): UserConfig {
    return this.config;
  }

  getModel(modelId: string): AIModel | undefined {
    const allModels = [...PREDEFINED_MODELS, ...this.config.customModels];
    return allModels.find((m) => m.id === modelId);
  }

  getApiKey(provider: string): string {
    return this.config.apiKeys[provider as AIProvider] || "";
  }
}

export const configManager = new ConfigManager();
