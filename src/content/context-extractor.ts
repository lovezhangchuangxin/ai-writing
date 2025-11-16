import type { PageContext } from "../types";

/**
 * 页面上下文提取器
 */
export class ContextExtractor {
  /**
   * 提取页面上下文
   */
  extract(): PageContext {
    const title = document.title;
    const description =
      document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    const keywordsContent =
      document.querySelector('meta[name="keywords"]')?.getAttribute("content") || "";
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

