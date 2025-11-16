# AI Writing Assistant - 智能写作助手

<div align="center">

✨ 一款简单易用的 Chrome 浏览器插件，提供文本的 AI 智能补全功能。

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/ai-writing)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

## 📖 简介

AI Writing Assistant 是一款智能浏览器插件，能够在任何网页的文本编辑区域提供 AI 驱动的代码和文本补全功能。无论你是在编写代码、撰写文档还是填写表单，都能获得智能的补全建议，大幅提升工作效率。

### ✨ 核心特性

- 🤖 **多模型支持** - 内置 GPT-4o、GPT-4o Mini、Claude 3.5 Sonnet、DeepSeek 等多种 AI 模型，支持自定义模型。
- 🎯 **智能上下文感知** - 自动分析页面内容和用户输入上下文
- ⚡ **实时补全建议** - 在适当时机智能显示 AI 生成的补全内容
- 🌐 **跨平台兼容** - 支持主流网页编辑器（CodePen、JSFiddle、GitHub 等）
- ⚙️ **高度可配置** - 自定义触发条件、延迟时间、快捷键等

## 🚀 快速开始

### 安装步骤

1. **下载插件**

   ```bash
   git clone https://github.com/lovezhangchuangxin/ai-writing.git
   cd ai-writing
   ```

2. **安装依赖**

   项目使用 `nodejs` 22.0.0 及以上版本，请确保你的本地环境已经安装了 `nodejs` 和 `pnpm`。

   ```bash
   pnpm install
   ```

3. **构建插件**

   ```bash
   pnpm build
   ```

4. **加载到 Chrome**

   - 打开 Chrome 浏览器
   - 访问 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目文件夹

5. **配置 API Key**

   - 点击浏览器工具栏中的插件图标
   - 选择你想使用的 AI 模型
   - 输入对应的 API Key
   - 点击"测试连接"验证
   - 保存配置

### 获取 API Key

- **OpenAI (GPT-4o/GPT-4o Mini)**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Anthropic (Claude)**: [https://console.anthropic.com/](https://console.anthropic.com/)
- **DeepSeek**: [https://platform.deepseek.com/](https://platform.deepseek.com/)

## 📚 使用说明

### 基本操作

1. **自动触发补全**

   - 在任何文本框或编辑器中输入内容
   - 停顿 500ms 或输入特定字符（如 `.`、`(`、`{` 等）
   - 补全建议会自动出现

2. **手动触发补全**

   - 按下 `Ctrl + K` 快捷键（可自定义）
   - 即刻获取 AI 补全建议

3. **接受补全**

   - 按下 `Tab` 键接受当前补全建议
   - 补全内容会自动插入到光标位置

4. **拒绝补全**
   - 按下 `Esc` 键关闭补全提示
   - 继续正常输入

### 支持的编辑器

✅ 标准 HTML `<textarea>` 和 `<input>` 元素
✅ ContentEditable 元素
✅ CodeMirror 编辑器
✅ Monaco Editor
✅ Ace Editor
✅ 其他主流在线代码编辑器

### 使用场景

- 📝 **代码编写** - 在 CodePen、JSFiddle、GitHub Gist 等平台编写代码
- 📄 **文档撰写** - 在 Google Docs、Notion 等平台编写文档
- 💬 **内容创作** - 在社交媒体、论坛等平台发表内容
- 📧 **邮件撰写** - 在 Gmail、Outlook 等邮箱中撰写邮件
- 📋 **表单填写** - 快速填写各类在线表单

## ⚙️ 配置选项

### 模型设置

在插件设置页面选择合适的 AI 模型：

| 模型              | 特点       | 推荐场景           |
| ----------------- | ---------- | ------------------ |
| GPT-4o Mini       | 快速、经济 | 日常使用、快速补全 |
| GPT-4o            | 强大、智能 | 复杂代码、专业文档 |
| Claude 3.5 Sonnet | 理解力强   | 长文本、创意写作   |
| DeepSeek          | 性价比高   | 代码补全、技术文档 |

### 高级设置

- **自动补全** - 启用/禁用自动触发补全
- **触发延迟** - 设置停顿多久后触发补全（默认 500ms）
- **触发字符** - 自定义触发补全的特殊字符
- **手动触发快捷键** - 自定义快捷键组合（默认 Ctrl+K）
  - 可选修饰键：Ctrl、Alt、Shift
  - 可选按键：A-Z、0-9
- **页面上下文感知** - 读取网页信息提供更准确的补全
  - 自动提取页面标题、描述、关键词
  - 识别页面结构（H1-H3 标题）
  - 提取主要内容（最多 2000 字符）
  - 可在设置中开启/关闭

## 🎯 技术架构

```
ai-writing/
├── src/                               # 源码（TypeScript）
│   ├── background/                    # 后台相关模块
│   ├── background.ts                  # Service Worker（模型路由、配置存储、消息转发）
│   ├── content/                       # 内容脚本相关模块
│   ├── content.ts                     # 内容脚本（DOM 监听、编辑器探测、补全 UI 注入）
│   ├── popup/                         # 弹窗页面相关模块
│   └── popup.ts                       # 弹窗逻辑（模型选择、API Key 配置、参数设置）
├── public/                            # 开发期静态资源
│   ├── manifest.json                  # 扩展清单
│   ├── popup.html                     # 弹窗页面
│   ├── content.css                    # 内容脚本样式
│   └── icons/                         # 扩展图标
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── dist/                              # 生产构建产物（由 tsup 生成）
│   ├── backgroud/                     # 构建后后台目录（若有拆分资源）
│   ├── background.js                  # Service Worker 构建后脚本
│   ├── content/                       # 构建后的内容脚本资源目录
│   ├── content.css                    # 构建后的样式
│   ├── content.js                     # 构建后的内容脚本入口
│   ├── icons/                         # 生产图标
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   ├── manifest.json                  # 生产清单
│   ├── popup/                         # 构建后的弹窗资源目录
│   ├── popup.html                     # 构建后的弹窗页面
│   └── popup.js                       # 构建后的弹窗入口
├── tsup.config.ts                     # 构建工具配置（打包多入口、拷贝静态等）
├── tsconfig.json                      # TypeScript 配置
├── biome.json                         # 代码规范/格式化配置
├── package.json                       # 项目依赖与脚本
├── pnpm-lock.yaml                     # 锁定依赖版本
├── pnpm-workspace.yaml                #（如使用工作区，保留）
├── README.md                          # 项目说明
└── LICENSE                            # 许可证
```

### 核心功能实现

1. **上下文感知**

   - 自动检测可编辑元素
   - 提取光标前后的文本内容
   - 识别编程语言类型

2. **AI 通信**

   - 支持 OpenAI、Anthropic、DeepSeek API
   - 优化的 Prompt 工程

3. **UI 交互**

   - 实时计算光标位置
   - 动画效果和过渡
   - 响应式设计

4. **配置管理**
   - Chrome Storage API
   - 实时配置同步
   - API Key 安全存储

## 🛠️ 开发指南

### 项目结构

```javascript
// background.js - 后台服务
- AI 模型配置和管理
- API 请求处理
- 配置存储和读取

// content.js - 内容脚本
- DOM 监听和元素检测
- 用户输入事件处理
- 补全 UI 显示和交互

// popup.js - 设置页面
- 模型选择
- API Key 配置
- 参数设置
```

### 本地开发

1. 修改代码后，在 `chrome://extensions/` 页面点击"重新加载"
2. 刷新目标网页以应用新的 content script
3. 查看控制台输出进行调试

### 调试技巧

- **Background Script**: 在扩展页面点击"Service Worker"查看日志
- **Content Script**: 在目标网页打开开发者工具查看日志
- **Popup**: 右键点击插件图标，选择"检查"查看日志

## 🔒 隐私与安全

- ✅ API Key 仅存储在本地浏览器中
- ✅ 不会收集或上传用户数据
- ✅ 所有 AI 请求直接发送到对应的官方 API
- ✅ 开源代码，可自行审查

## 🐛 常见问题

### Q: 出现 "Extension context invalidated" 错误？

A: 这是因为插件被重新加载了，解决方法：

1. **刷新页面**（按 F5）即可解决

### Q: 补全没有出现？

A: 请检查：

1. 是否已配置正确的 API Key
2. 是否启用了自动补全功能
3. 网络连接是否正常
4. 是否需要刷新页面（如果刚重载了插件）
5. 查看控制台是否有错误信息

### Q: 补全速度慢？

A: 建议：

1. 选择 GPT-4o Mini 或 DeepSeek 等快速模型
2. 减小触发延迟时间
3. 检查网络延迟

### Q: 某些网站不生效？

A: 可能原因：

1. 网站使用了特殊的编辑器框架
2. 网站的安全策略阻止了插件注入
3. 尝试刷新页面或重新加载插件

### Q: API Key 是否安全？

A: 是的，API Key 仅存储在本地浏览器的 Chrome Storage 中，不会上传到任何服务器。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feat/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some AmazingFeature'`)
4. 推送到分支 (`git push origin feat/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 💖 致谢

感谢所有 AI 模型提供商和开源社区的支持！

---

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐️**

Made with ❤️ by lovezhangchuangxin

</div>
