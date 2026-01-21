---
title: 告别 Cursor 订阅费！OpenCode 自定义代理 + Oh My OpenCode 完整配置指南
author: Jinx
date: 2026-01-21
slug: opencode-oh-my-opencode-combination-guide
featured: true
draft: false
category: AI
tags:
  - OpenCode
  - Oh My OpenCode
description: AI 编程工具多如牛毛，Cursor、GitHub Copilot、Claude Code... 选哪个？今天介绍一个开源、可定制、多模型支持的终端 AI 编程工具组合，让你的编程效率直接起飞。
---

# 告别 Cursor 订阅费！OpenCode 自定义代理 + Oh My OpenCode 完整配置指南

> AI 编程工具多如牛毛，Cursor、GitHub Copilot、Claude Code... 选哪个？今天介绍一个开源、可定制、多模型支持的终端 AI 编程工具组合，让你的编程效率直接起飞。

---

## 一、OpenCode 是什么？

### 一句话定义

**OpenCode** 是一个开源的 AI 编程智能体，可以在终端、桌面应用或 IDE 扩展中使用。它就像是开源版的 Claude Code，但更强大、更灵活。

### 核心优势

- ✅ **多模型支持**：Anthropic (Claude)、OpenAI (GPT)、Google (Gemini)、Groq、xAI 等全部支持
- ✅ **多种使用方式**：TUI 终端界面、CLI 命令行、Web 界面、IDE 扩展，随你选择
- ✅ **完全开源**：GitHub 开源项目，可自定义一切配置
- ✅ **LSP 支持**：内置语言服务器协议，智能代码导航和重构
- ✅ **MCP 服务器**：支持 Model Context Protocol，无限扩展工具能力
- ✅ **零屏幕闪烁**：终端不卡顿，高性能体验

### 与 Claude Code 的关系

功能对标 Claude Code，但完全开源免费。支持 Claude Code 的命令、技能、钩子等核心概念，还能混合使用多个模型。

---

## 二、为什么选 OpenCode

### 2.1 三个核心原因

- ✅ 开源免费，可深度定制，配置透明可控
- ✅ 自定义 Provider（baseURL + apiKey），成本可控、可绕过访问限制
- ✅ 多智能体协作，把 AI 当成团队使用

一句话总结：**你能完全掌控模型来源、成本与协作方式**，这正是 Cursor/Claude Code 给不了的自由度。

---

## 三、OpenCode 快速上手

### 3.1 安装方式

**方式一：一键安装脚本（推荐）**

```bash
curl -fsSL https://opencode.ai/install | bash
```

**方式二：npm 安装**

```bash
npm install -g @anthropic-ai/opencode
```

**方式三：Homebrew (macOS)**

```bash
brew install sst/tap/opencode
```

**方式四：Go 安装**

```bash
go install github.com/sst/opencode@latest
```

### 3.2 配置 LLM 提供商

OpenCode 需要 API Key 才能连接 LLM。设置环境变量：

```bash
# Claude (Anthropic)
export ANTHROPIC_API_KEY="your-key"

# OpenAI
export OPENAI_API_KEY="your-key"

# Google Gemini
export GOOGLE_API_KEY="your-key"
```

或者在配置文件 `~/.config/opencode/opencode.json` 中设置。

### 3.3 项目初始化与启动

```bash
# 进入项目目录
cd your-project

# 初始化（可选，会创建 .opencode 目录）
opencode init

# 启动 TUI 界面
opencode
```

### 3.4 基础用法

启动后你会看到一个漂亮的终端界面：

- **提问**：直接输入问题，AI 会分析代码并回答
- **编辑**：让 AI 修改代码，它会自动读取、分析、编辑文件
- **撤销**：`Ctrl+Z` 快速回滚更改
- **分享**：生成会话链接，分享给他人

---

## 四、Oh My OpenCode：让 OpenCode 直接开挂

### 4.1 什么是 Oh My OpenCode？

如果说 OpenCode 是 zsh，那 **Oh My OpenCode** 就是 oh-my-zsh。

这是作者花费 **24,000 美元 Token** 踩坑后提炼出的最佳实践集合。一句话概括：

> 让 AI 智能体像资深开发团队一样工作，写出的代码与人类无法区分。

### 4.2 认识 Sisyphus：你的 AI 开发团队负责人

**Sisyphus**（西西弗斯）是 Oh My OpenCode 的主智能体。命名来源于希腊神话中那个永不停歇推石头的人。

核心设计理念：

- 像人类工程师一样思考和工作
- 不会放弃任务，持续推进直到完成
- 善于委派任务给专业智能体
- 代码风格与人类无法区分

### 4.3 智能体矩阵：各司其职

Oh My OpenCode 内置了一整套专业智能体团队：

| 智能体                | 职责                  | 推荐模型                 |
| --------------------- | --------------------- | ------------------------ |
| **Sisyphus**          | 主智能体/团队负责人   | Claude Opus 4.5 Thinking |
| **Oracle**            | 架构设计/疑难调试     | GPT 5.2 Codex            |
| **Frontend Engineer** | 前端 UI/UX 开发       | Gemini 3 Pro High        |
| **Librarian**         | 文档查询/开源代码搜索 | GPT 5.2 Codex            |
| **Explore**           | 快速代码库探索        | Gemini 3 Flash           |
| **Document Writer**   | 技术文档撰写          | Gemini 3 Flash           |

工作方式：

1. Sisyphus 接收任务，拆解为子任务
2. 并行派发后台智能体收集信息（不阻塞主流程）
3. 前端任务委派给 Gemini
4. 架构问题求助 Oracle
5. 文档查询交给 Librarian

**你是 AI 经理，智能体是你的开发团队。**

### 4.4 魔法词：`ultrawork`

不想深入了解这些配置？没问题。

**只需在提示中包含 `ultrawork`（或简写 `ulw`）。**

就是这样。所有功能会像魔法一样运行：

- 并行智能体自动启动
- 后台任务自动分配
- 深度探索自动执行
- 持续工作直到任务 100% 完成

真实案例：

> "用 Oh My Opencode 仅用一天就清理了 8000 个 eslint 警告" — Jacob Ferrari

> "我用 OhMyOpencode 一夜之间将一个 45k 行的 tauri 应用转换成了 SaaS Web 应用" — James Hargis

---

## 五、Oh My OpenCode 安装与配置

### 5.1 安装步骤

**推荐方式：让 AI 智能体来安装**

复制以下提示，粘贴到 Claude Code、Cursor 或任何 AI 编程工具：

```
按照以下说明安装和配置 oh-my-opencode：
https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/master/docs/guide/installation.md
```

**手动方式：**

确保 OpenCode 已安装，然后在 `~/.config/opencode/opencode.json` 中添加插件：

```json
{
  "plugin": ["oh-my-opencode"]
}
```

### 5.2 配置文件位置

- **项目级**：`.opencode/oh-my-opencode.json`
- **用户级**：`~/.config/opencode/oh-my-opencode.json`

### 5.3 核心配置示例

```jsonc
{
  // 智能体配置
  "agents": {
    "oracle": {
      "model": "openai/gpt-4o",
      "temperature": 0.7,
    },
  },

  // 后台任务并发限制
  "background": {
    "providers": {
      "anthropic": { "maxConcurrency": 3 },
      "openai": { "maxConcurrency": 5 },
    },
  },

  // 禁用特定钩子
  "disabled_hooks": ["comment-checker"],
}
```

### 5.4 内置功能一览

| 功能                 | 说明                             |
| -------------------- | -------------------------------- |
| **Todo Enforcer**    | 强制完成任务列表，不允许中途放弃 |
| **Comment Checker**  | 防止 AI 添加过多无意义注释       |
| **LSP 集成**         | 使用语言服务器进行安全重构       |
| **AST-Grep**         | 语法树感知的代码搜索和替换       |
| **Session Tools**    | 会话历史管理和搜索               |
| **Playwright Skill** | 浏览器自动化测试                 |
| **Git Master Skill** | 原子化 Git 提交                  |

### 5.5 内置 MCP 服务

| MCP                 | 功能            |
| ------------------- | --------------- |
| **Exa (websearch)** | 实时网络搜索    |
| **Context7**        | 官方文档查询    |
| **Grep.app**        | GitHub 代码搜索 |

---

## 六、OpenCode 进阶功能

### 6.1 Skills（技能）

技能是可复用的行为定义，放在 `.opencode/skills/<name>/SKILL.md`。

示例结构：

```
.opencode/
└── skills/
    └── my-skill/
        └── SKILL.md
```

SKILL.md 格式：

```markdown
---
name: my-skill
description: 这个技能的用途说明
---

# 技能内容

详细的行为指令...
```

### 6.2 Rules（规则）

规则文件会自动注入到上下文：

- **项目级**：`OPENCODE.md` 或 `CLAUDE.md`（兼容）
- **全局级**：`~/.config/opencode/OPENCODE.md`
- **目录级**：`.opencode/rules/*.md`

### 6.3 MCP 服务器配置

在 `opencode.json` 中配置自定义 MCP：

```json
{
  "mcp": {
    "my-server": {
      "type": "local",
      "command": ["node", "path/to/server.js"],
      "enabled": true
    }
  }
}
```

### 6.4 自定义智能体

在配置中覆盖智能体的模型和行为：

```json
{
  "agents": {
    "build": {
      "model": "anthropic/claude-sonnet-4-20250514",
      "temperature": 0.5,
      "maxTokens": 8192
    }
  }
}
```

---

## 七、终极大招：自定义 Provider 配置

这是 OpenCode 最被低估的能力——**完全自定义 LLM Provider**。

### 7.1 为什么需要自定义配置？

使用官方 API 的痛点：

- 💸 **成本高**：Claude Opus、GPT-5 按量计费，跑个大项目烧钱飞快
- 🚫 **访问受限**：某些地区无法直接访问官方 API
- 🐌 **速率限制**：官方 API 有并发和 Token 限制
- 🔒 **企业合规**：部分企业要求走内部代理审计

OpenCode 的解决方案：**自定义 baseURL + apiKey**，接入任意兼容 API。

### 7.2 配置文件详解

主配置文件位置：`~/.config/opencode/opencode.json`

**完整配置示例（实战可用）：**

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  // 禁用官方 OpenCode 托管服务
  "disabled_providers": ["opencode"],
  // 加载 Oh My OpenCode 插件
  "plugin": ["oh-my-opencode"],

  "provider": {
    // ========== 自定义 Claude 代理 ==========
    "my-claude": {
      "npm": "@ai-sdk/anthropic",
      "name": "My Claude Proxy",
      "options": {
        "baseURL": "https://your-proxy.com/v1",
        "apiKey": "sk-your-key",
      },
      "models": {
        "claude-opus-4-5-thinking": {
          "name": "Claude Opus 4.5 Thinking",
          "limit": { "context": 1048576, "output": 65535 },
          "modalities": {
            "input": ["text", "image", "pdf"],
            "output": ["text"],
          },
        },
        "claude-sonnet-4-5-thinking": {
          "name": "Claude Sonnet 4.5 Thinking",
          "limit": { "context": 1048576, "output": 65535 },
          "modalities": {
            "input": ["text", "image", "pdf"],
            "output": ["text"],
          },
        },
        "claude-sonnet-4-5": {
          "name": "Claude Sonnet 4.5",
          "limit": { "context": 1048576, "output": 65535 },
          "modalities": {
            "input": ["text", "image", "pdf"],
            "output": ["text"],
          },
        },
      },
    },

    // ========== 自定义 Gemini 代理 ==========
    "my-gemini": {
      "npm": "@ai-sdk/google",
      "name": "My Gemini Proxy",
      "options": {
        "baseURL": "https://your-proxy.com/v1beta",
        "apiKey": "sk-your-key",
      },
      "models": {
        "gemini-3-pro-high": {
          "name": "Gemini 3 Pro High",
          "limit": { "context": 1048576, "output": 65535 },
          "modalities": {
            "input": ["text", "image", "pdf", "video", "audio"],
            "output": ["text"],
          },
        },
        "gemini-3-pro-image": {
          "name": "Gemini 3 Pro Image",
          "limit": { "context": 65536, "output": 32768 },
          "modalities": {
            "input": ["text"],
            "output": ["text", "image"],
          },
        },
        "gemini-3-flash": {
          "name": "Gemini 3 Flash",
          "limit": { "context": 1048576, "output": 65535 },
          "modalities": {
            "input": ["text", "image", "pdf", "video", "audio"],
            "output": ["text"],
          },
        },
        "gemini-2.5-flash-thinking": {
          "name": "Gemini 2.5 Flash Thinking",
          "limit": { "context": 1048576, "output": 65535 },
          "modalities": {
            "input": ["text", "image", "pdf", "video", "audio"],
            "output": ["text"],
          },
        },
        "gemini-2.5-flash": {
          "name": "Gemini 2.5 Flash",
          "limit": { "context": 1048576, "output": 65535 },
          "modalities": {
            "input": ["text", "image", "pdf", "video", "audio"],
            "output": ["text"],
          },
        },
        "gemini-2.5-flash-lite": {
          "name": "Gemini 2.5 Flash Lite",
          "limit": { "context": 1048576, "output": 65535 },
          "modalities": {
            "input": ["text", "image", "pdf", "video", "audio"],
            "output": ["text"],
          },
        },
      },
    },

    // ========== 自定义 OpenAI 代理（支持推理模型）==========
    "my-openai": {
      "npm": "@ai-sdk/openai",
      "options": {
        "baseURL": "https://your-proxy.com/v1",
        "apiKey": "sk-your-key",
        // GPT-5.x 系列特有配置
        "reasoningEffort": "medium",
        "reasoningSummary": "auto",
        "textVerbosity": "medium",
        "include": ["reasoning.encrypted_content"],
        "store": false,
      },
      "models": {
        "gpt-5.2": {
          "name": "GPT 5.2",
          "limit": { "context": 272000, "output": 128000 },
          "modalities": {
            "input": ["text", "image"],
            "output": ["text"],
          },
          // 模型变体：不同推理强度
          "variants": {
            "none": {
              "reasoningEffort": "none",
              "reasoningSummary": "auto",
              "textVerbosity": "medium",
            },
            "low": {
              "reasoningEffort": "low",
              "reasoningSummary": "auto",
              "textVerbosity": "medium",
            },
            "medium": {
              "reasoningEffort": "medium",
              "reasoningSummary": "auto",
              "textVerbosity": "medium",
            },
            "high": {
              "reasoningEffort": "high",
              "reasoningSummary": "detailed",
              "textVerbosity": "medium",
            },
            "xhigh": {
              "reasoningEffort": "xhigh",
              "reasoningSummary": "detailed",
              "textVerbosity": "medium",
            },
          },
        },
        "gpt-5.2-codex": {
          "name": "GPT 5.2 Codex",
          "limit": { "context": 272000, "output": 128000 },
          "modalities": {
            "input": ["text", "image"],
            "output": ["text"],
          },
          "variants": {
            "low": {
              "reasoningEffort": "low",
              "reasoningSummary": "auto",
            },
            "medium": {
              "reasoningEffort": "medium",
              "reasoningSummary": "auto",
            },
            "high": {
              "reasoningEffort": "high",
              "reasoningSummary": "detailed",
            },
            "xhigh": {
              "reasoningEffort": "xhigh",
              "reasoningSummary": "detailed",
            },
          },
        },
        "gpt-5.1-codex-max": {
          "name": "GPT 5.1 Codex Max",
          "limit": { "context": 272000, "output": 128000 },
          "modalities": {
            "input": ["text", "image"],
            "output": ["text"],
          },
          "variants": {
            "low": {
              "reasoningEffort": "low",
              "reasoningSummary": "detailed",
            },
            "medium": {
              "reasoningEffort": "medium",
              "reasoningSummary": "detailed",
            },
            "high": {
              "reasoningEffort": "high",
              "reasoningSummary": "detailed",
            },
            "xhigh": {
              "reasoningEffort": "xhigh",
              "reasoningSummary": "detailed",
            },
          },
        },
        "gpt-5.1-codex": {
          "name": "GPT 5.1 Codex",
          "limit": { "context": 272000, "output": 128000 },
          "modalities": {
            "input": ["text", "image"],
            "output": ["text"],
          },
          "variants": {
            "low": {
              "reasoningEffort": "low",
              "reasoningSummary": "auto",
            },
            "medium": {
              "reasoningEffort": "medium",
              "reasoningSummary": "auto",
            },
            "high": {
              "reasoningEffort": "high",
              "reasoningSummary": "detailed",
            },
          },
        },
        "gpt-5.1": {
          "name": "GPT 5.1",
          "limit": { "context": 272000, "output": 128000 },
          "modalities": {
            "input": ["text", "image"],
            "output": ["text"],
          },
          "variants": {
            "none": {
              "reasoningEffort": "none",
              "reasoningSummary": "auto",
            },
            "low": {
              "reasoningEffort": "low",
              "reasoningSummary": "auto",
            },
            "medium": {
              "reasoningEffort": "medium",
              "reasoningSummary": "auto",
            },
            "high": {
              "reasoningEffort": "high",
              "reasoningSummary": "detailed",
            },
          },
        },
      },
    },
  },
}
```

### 7.3 关键配置字段解析

| 字段                | 说明                   | 示例                                                    |
| ------------------- | ---------------------- | ------------------------------------------------------- |
| `npm`               | SDK 包名               | `@ai-sdk/anthropic`、`@ai-sdk/openai`、`@ai-sdk/google` |
| `baseURL`           | 代理地址（核心）       | `https://proxy.example.com/v1`                          |
| `apiKey`            | 你的 API Key           | `sk-xxxxxxxx`                                           |
| `limit.context`     | 上下文窗口大小         | `1048576`（1M tokens）                                  |
| `limit.output`      | 最大输出长度           | `65535`                                                 |
| `modalities.input`  | 支持的输入类型         | `["text", "image", "pdf"]`                              |
| `modalities.output` | 支持的输出类型         | `["text"]` 或 `["text", "image"]`                       |
| `variants`          | 模型变体（推理强度等） | 见上方示例                                              |

### 7.4 配套智能体配置

配置好 Provider 后，还需要在 `oh-my-opencode.json` 中指定各智能体使用的模型：

**配置文件位置**：`~/.config/opencode/oh-my-opencode.json`

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  "agents": {
    // ========== 主智能体：用最强模型 ==========
    "Sisyphus": {
      "model": "my-claude/claude-opus-4-5-thinking",
    },
    "Planner-Sisyphus": {
      "model": "my-claude/claude-opus-4-5-thinking",
    },

    // ========== 重推理任务：用 GPT-5.2 Codex ==========
    "librarian": {
      "model": "my-openai/gpt-5.2-codex",
    },
    "oracle": {
      "model": "my-openai/gpt-5.2-codex",
    },

    // ========== 快速任务：用 Gemini Flash ==========
    "explore": {
      "model": "my-gemini/gemini-3-flash",
    },
    "document-writer": {
      "model": "my-gemini/gemini-3-flash",
    },
    "multimodal-looker": {
      "model": "my-gemini/gemini-3-flash",
    },

    // ========== 前端任务：用 Gemini Pro High ==========
    "frontend-ui-ux-engineer": {
      "model": "my-gemini/gemini-3-pro-high",
    },
  },
}
```

### 7.5 模型选型策略

基于成本和能力的最佳实践：

| 任务类型                  | 推荐模型                 | 理由                         |
| ------------------------- | ------------------------ | ---------------------------- |
| **主智能体（Sisyphus）**  | Claude Opus 4.5 Thinking | 最强代码能力 + 深度推理      |
| **规划智能体**            | Claude Opus 4.5 Thinking | 复杂任务拆解需要顶级推理     |
| **架构决策（Oracle）**    | GPT-5.2 Codex            | 强推理 + 长上下文 + 代码专精 |
| **文档搜索（Librarian）** | GPT-5.2 Codex            | 理解复杂文档结构             |
| **代码探索（Explore）**   | Gemini 3 Flash           | 快速 + 便宜 + 够用           |
| **前端 UI（Frontend）**   | Gemini 3 Pro High        | 视觉理解强 + 设计感好        |
| **文档写作**              | Gemini 3 Flash           | 成本低 + 输出质量好          |
| **多模态分析**            | Gemini 3 Flash           | 原生多模态支持               |

### 7.6 代理服务方案

国内开发者常用的代理方案：

| 方案                  | 优点               | 缺点                   |
| --------------------- | ------------------ | ---------------------- |
| **自建反代**          | 完全可控、数据安全 | 需要服务器、技术门槛高 |
| **API 中转服务**      | 开箱即用、价格便宜 | 稳定性取决于服务商     |
| **Cloudflare Worker** | 免费额度、全球加速 | 有请求限制、需配置     |
| **企业内网代理**      | 合规审计、统一管理 | 需要 IT 支持           |

> ⚠️ **安全提示**：选择代理服务时，注意数据安全和隐私合规。敏感项目建议自建。

### 7.7 配置生效验证

配置完成后，验证是否生效：

```bash
# 启动 OpenCode
opencode

# 在 TUI 界面查看可用模型
# 按 Ctrl+P 调出模型选择器
# 应该能看到你自定义的 Provider 和模型
```

或者直接在对话中测试：

```
告诉我你现在使用的模型名称
```

如果返回的是你配置的模型名（如 `Claude Opus 4.5 Thinking`），配置成功。

---

## 八、实战技巧

### 8.1 高效提示词模板

**代码重构：**

```
ultrawork 将这个项目从 JavaScript 迁移到 TypeScript，保持所有功能正常工作
```

**Bug 调试：**

```
ulw 这个函数在处理空数组时会崩溃，帮我找出问题并修复
```

**功能开发：**

```
ultrawork 添加一个用户认证系统，使用 JWT，包含注册、登录、登出功能
```

### 8.2 多智能体协作示例

当你输入复杂任务时，Sisyphus 会自动：

1. 启动 Explore 智能体扫描代码库结构
2. 派 Librarian 查找相关文档和最佳实践
3. 让 Oracle 设计整体架构方案
4. 将前端组件任务交给 Frontend Engineer
5. 自己负责核心逻辑实现和任务协调

### 8.3 常见使用场景

- 🔧 **大规模代码重构**：迁移框架、升级依赖
- 📚 **理解陌生代码库**：快速掌握项目结构
- 🐛 **疑难 Bug 调试**：Oracle 帮你分析复杂问题
- 🎨 **前端组件开发**：Gemini 处理 UI/UX
- 📖 **文档生成**：自动生成 README、API 文档

---

## 九、注意事项

### 9.1 版本与兼容性

⚠️ **Claude OAuth 限制**：自 2026 年 1 月起，Anthropic 限制了第三方 OAuth 访问。使用自己的 API Key 是更稳妥的选择。

⚠️ **版本兼容**：建议使用 OpenCode 1.0.132 以上版本，避免配置解析 Bug。

⚠️ **安全警告**：只从官方 GitHub 下载，谨防钓鱼网站。`ohmyopencode.com` 不是官方网站！

### 9.2 自定义配置注意事项

⚠️ **API Key 安全**：配置文件中的 apiKey 是明文存储。如果是共享设备或公开仓库，考虑使用环境变量：

```bash
export MY_CLAUDE_API_KEY="sk-xxxxxxxx"
```

⚠️ **模型能力匹配**：自定义模型时，确保 `limit` 和 `modalities` 配置与实际模型能力一致，否则可能导致请求失败或输出截断。

⚠️ **SDK 版本**：不同 npm 包版本可能有 API 差异。建议保持 OpenCode 和 SDK 包在最新稳定版。

### 9.3 资源链接

| 资源            | 链接                                           |
| --------------- | ---------------------------------------------- |
| OpenCode 官网   | https://opencode.ai                            |
| OpenCode 文档   | https://opencode.ai/docs                       |
| OpenCode GitHub | https://github.com/sst/opencode                |
| Oh My OpenCode  | https://github.com/code-yeongyu/oh-my-opencode |
| Discord 社区    | https://discord.gg/PUwSMR9XNk                  |

---

## 十、总结

OpenCode + Oh My OpenCode 这套组合的核心价值：

1. **开源免费**：无限可扩展，无限可定制
2. **多模型编排**：按需选择最适合的模型
3. **智能体团队**：像管理开发团队一样管理 AI
4. **开箱即用**：一个 `ultrawork` 解决所有问题
5. **完全自主**：自定义 Provider 配置，不受官方 API 限制，成本可控

如果你厌倦了 Cursor 的订阅费，想要更多的控制权和定制能力，OpenCode + Oh My OpenCode 就是你的答案。

**行动建议**：

1. 今天就安装体验
2. 用自定义 Provider 配置省钱
3. 加入我的社区交流心得
4. 有好想法？直接留言交流

---

_本文作者实测有效，如有问题欢迎留言交流。_
