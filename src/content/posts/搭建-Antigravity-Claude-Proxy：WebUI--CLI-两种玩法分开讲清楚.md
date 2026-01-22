---
title: '搭建 Antigravity Claude Proxy：WebUI / CLI 两种玩法分开讲清楚'
date: 2026-01-17
tags:
  - Debian12
  - antigravity-claude-proxy
  - ClaudeCode
  - Proxy
  - OAuth
description: '在 Debian 12 上搭建 antigravity-claude-proxy，并分别用 WebUI 与 CLI 完成账号绑定与 Claude Code 配置；附带配置目录与 presets 文件说明。'
---

## 1. 先讲清楚：这个 Proxy 在做什么？

`antigravity-claude-proxy` 是一个 **Anthropic Messages API 兼容**的本地代理：  
Claude Code 以 Anthropic API 格式请求 → Proxy 转发到 Antigravity Cloud Code → 再把响应按 Anthropic 格式回给 Claude Code。:contentReference[oaicite:0]{index=0}

它支持三种账号来源：

- WebUI/CLI 添加 **Google OAuth 多账号**（最推荐）:contentReference[oaicite:1]{index=1}
- 如果你本机装了 Antigravity 并已登录，可自动检测（单账号模式）:contentReference[oaicite:2]{index=2}

---

## 2. Debian 12 安装（共同前置步骤）

### 2.1 安装 Node.js 18+ / npm

`antigravity-claude-proxy` 要求 Node.js 18 或更高。:contentReference[oaicite:3]{index=3}

Debian 12 可以先这样装（够用就行）：

```bash
sudo apt update
sudo apt install -y git curl ca-certificates nodejs npm
node -v
npm -v
```

### 2.2 安装 Proxy（推荐 npm 全局）

```bash
sudo npm install -g antigravity-claude-proxy@latest
antigravity-claude-proxy start
```

默认监听 `http://localhost:8080`。 ([GitHub][1])

### 2.3 健康检查（建议第一时间跑）

```bash
curl http://localhost:8080/health
curl "http://localhost:8080/account-limits?format=table"
```

README 里明确给了这两条验证命令。([GitHub][1])

---

# 路线 A：全程 WebUI（推荐给绝大多数人）

> 这条路线的特点：
> **账号绑定、监控、Claude Code 配置、保存 presets** 都在面板里搞定。([GitHub][1])

## A1. 打开面板

服务运行后浏览器打开：

```text
http://localhost:8080
```

README 把它称为 Web Dashboard / Web Management Console。([GitHub][1])

### 如果你在远程 Debian（SSH 上去的）

用端口转发把面板带回本机浏览器：

```bash
ssh -L 8080:127.0.0.1:8080 your_user@your_server
```

然后本机打开 `http://localhost:8080`

## A2. 用 WebUI 绑定账号（OAuth）

按 README 的 Web Dashboard 流程：([GitHub][1])

1. Accounts → Add Account
2. 浏览器弹窗走 Google OAuth
3. 成功后 Accounts 列表会出现账号状态与配额信息

多账号时，Proxy 会自动做负载均衡 / 冷却切换等策略。([GitHub][1])

## A3. 用 WebUI 直接配置 Claude Code（重点）

README 明确支持从 WebUI 进入：([GitHub][1])
**Settings → Claude CLI → 选择模型 → Apply to Claude CLI**

它会帮助你写入（或更新）Claude Code 的 `~/.claude/settings.json`（WebUI 里也会提示优先级规则）。([GitHub][1])

> 提醒：如果你在 `.zshrc/.bashrc` 里手动 export 过 `ANTHROPIC_*` 环境变量，它会覆盖 `settings.json`。([GitHub][1])

## A4. 用 WebUI 保存“Claude Presets”（你 Mac 上验证的就是这个）

从你提供的 macOS 配置来看，WebUI 会把 Claude CLI 的一组变量保存为 preset，例如：

- “Claude Thinking”
- “Gemini 1M”

每个 preset 其实就是一组 `ANTHROPIC_*` / `CLAUDE_*` 环境变量模板，用来快速切换 Claude Code 使用的模型组。

---

# 路线 B：全程 CLI（适合无桌面/重度命令行玩家）

> 这条路线的特点：
> 面板不是必需的，尤其适合 VPS / 纯 SSH 环境。([GitHub][1])

## B1. CLI 添加账号（OAuth）

README 给了两种方式：([GitHub][1])

### 方式 1：本机有浏览器（会自动打开）

```bash
antigravity-claude-proxy accounts add
```

### 方式 2：Headless（服务器/SSH，手动复制授权链接）

```bash
antigravity-claude-proxy accounts add --no-browser
```

## B2. CLI 管理账号（排查问题非常好用）

README 也列了常用命令：([GitHub][1])

```bash
antigravity-claude-proxy accounts list
antigravity-claude-proxy accounts verify
antigravity-claude-proxy accounts
```

## B3. CLI 配置 Claude Code（手改 settings.json）

Claude Code 的用户级配置文件路径：`~/.claude/settings.json`。([GitHub][1])

写入类似下面的内容（README 示例）：([GitHub][1])

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "test",
    "ANTHROPIC_BASE_URL": "http://localhost:8080",
    "ANTHROPIC_MODEL": "claude-opus-4-5-thinking",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-5-thinking",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-5-thinking",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "gemini-2.5-flash-lite[1m]",
    "CLAUDE_CODE_SUBAGENT_MODEL": "claude-sonnet-4-5-thinking",
    "ENABLE_EXPERIMENTAL_MCP_CLI": "true"
  }
}
```

README 还特别强调：**把 Haiku 默认模型设为 `gemini-2.5-flash-lite`**，因为 Claude Code 会用它做一些后台任务，避免更快耗尽 Claude 配额。([GitHub][1])

## B4. 启动 Claude Code

确保 proxy 在跑，然后：

```bash
claude
```

---

## 3. 你在 macOS 验证出来的配置目录（Debian 通常也同理）

你贴出来的是：

```bash
cd ~/.config/antigravity-proxy
ls
# accounts.json
# claude-presets.json
# config.json
# usage-history.json
```

这套目录非常关键——你可以把它理解成 proxy 的“运行状态 + UI 配置落盘”。

### 3.1 claude-presets.json（Claude Code 的“环境变量配置模板”）

你给的内容结构是：

- 顶层是数组
- 每个元素：`name` + `config`
- `config` 就是一套 Claude Code 环境变量

例如（你原样的两个 preset）：

- `Claude Thinking` → `claude-opus-4-5-thinking / claude-sonnet-4-5-thinking`
- `Gemini 1M` → `gemini-3-pro-high[1m] / gemini-3-flash[1m]`

这意味着：你可以在 WebUI 中一键切换不同模型组，而不用每次手改 `~/.claude/settings.json`。

### 3.2 config.json（Proxy 服务端参数）

你贴出来的 `config.json` 包含这些典型内容：

- `apiKey` / `webuiPassword`
- `logLevel` / `debug`
- `maxRetries` / `retryBaseMs` / `retryMaxMs`
- `defaultCooldownMs` / `maxWaitBeforeErrorMs`
- `port`
- `modelMapping`

README 里明确说支持通过 WebUI（Settings → Server）或者 `config.json` 来调优，包括：API Key、WebUI Password、自定义端口、重试、冷却、持久化 token cache 等。([GitHub][1])

> 你这里的 `port: 38236` 说明你已经改成非默认端口了。
> 此时 Claude Code 里的 `ANTHROPIC_BASE_URL` 也要对应改成 `http://localhost:38236`。

### 3.3 accounts.json / usage-history.json（账号与用量）

文件名已经很直观：

- `accounts.json`：OAuth 账号信息（多账号轮转依赖它）
- `usage-history.json`：用量历史（WebUI 里展示用量趋势也会用到）

README 也描述了 WebUI 会保留历史并支持按时间范围查看、过滤、日志流等能力。([GitHub][1])

---

## 4. 生产化建议（别把它当玩具跑裸奔）

### 4.1 给 `/v1/*` 加 API Key（对外暴露必须）

项目已经支持：用 `API_KEY` 环境变量或 `apiKey` 配置项保护 `/v1/*`。([GitHub][1])

### 4.2 给 WebUI 加密码

同样支持 `WEBUI_PASSWORD` 或 `webuiPassword`。([GitHub][1])

---

## 5. 最小闭环（写给读者的“验收清单”）

做到下面 4 条，就算搭建完成：

1. `antigravity-claude-proxy start` 正常启动（默认 8080 或你的自定义端口）([GitHub][1])
2. `curl /health` 返回 OK ([GitHub][1])
3. 已通过 WebUI 或 CLI 添加 Google OAuth 账号 ([GitHub][1])
4. Claude Code 指向 `ANTHROPIC_BASE_URL=http://localhost:<port>` 且能正常 `claude` 对话 ([GitHub][1])

---

## 附：WebUI vs CLI 该怎么选？

- **你能打开浏览器 / 想省事 / 想看监控面板** → 用 WebUI 路线 A
- **你在 VPS 上 / 只想命令行搞定 / 可复制粘贴配置** → 用 CLI 路线 B

两条路线最终产物是一样的：
Proxy 能稳定跑 + OAuth 账号可用 + Claude Code 走代理。

---

```

如果你愿意，我还可以在这份 MD 的基础上再补两块“更像博客教程”的内容：

1) **systemd 常驻与自启动（Debian 12 标准写法）**
2) **一套“preset 快速切换”的 CLI 脚本（不用进 WebUI，也能选 Claude/Gemini 组合）**
::contentReference[oaicite:27]{index=27}
```

[1]: https://github.com/badrisnarayanan/antigravity-claude-proxy 'GitHub - badrisnarayanan/antigravity-claude-proxy: Proxy that exposes Antigravity provided claude / gemini models, so we can use them in Claude Code'
