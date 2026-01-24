---
title: Everything Claude Code 教程：少走弯路的配置路线
author: Jinx
date: 2026-01-24
slug: everything-claude-code-complete-guide
featured: true
draft: false
category: AI
tags:
  - Claude
  - Claude Code
  - AI 编程
description: 面向“只想少走弯路、装完就好用”的读者：按步骤安装 everything-claude-code，只启用必要的 commands/hooks/MCP，跑通 /plan→/tdd(or /build-fix)→/code-review 的验收闭环，并给出常见踩坑与回滚策略。
---

如果你已经在用 Claude Code，但经常遇到这些情况：

- 输出质量忽高忽低，明明说了“别改太大”它还是顺手重构
- 一换项目就乱：npm/pnpm/yarn/bun 跑错、命令猜错、CI 才发现
- 工具越装越多，结果上下文窗口缩水，模型反而变慢、变“钝”

这篇文章给你一份“照着做就能落地”的配置教程：用 `everything-claude-code` 把 Claude Code 变成可复用的工作流系统。

你读完能拿到三样东西：

1. 一套可复制的安装与启用步骤（插件版/手动版都有）
2. 一套可验收的最小闭环：`/plan → /tdd 或 /build-fix → /code-review`
3. 一套“该开什么/先别开什么”的选择策略（避免配置反噬）

仓库地址（本文所有步骤都围绕它）：

- https://github.com/affaan-m/everything-claude-code

---

## 你会得到什么（设置后的实际收益）

把配置跑通后，最直接的变化通常是这 6 件事：

1. **少打很多字**：常用流程变成 `/plan`、`/tdd`、`/build-fix`、`/code-review` 这种一键命令
2. **输出更稳定**：规则（rules）和技能（skills）让模型每次都按同一套标准交付
3. **少踩坑**：hooks 在你跑长命令、写出 `console.log`、忘记格式化时自动提醒
4. **上下文更省**：子代理（subagents）把探索/审查/修 CI 的细节分出去，主对话只保留决策与结果
5. **项目切换更顺**：包管理器自动检测（npm/pnpm/yarn/bun）减少 “跑错命令/跑错 lockfile” 的低级返工
6. **跨平台更稳**：hooks 和脚本用 Node.js 统一实现，Windows/macOS/Linux 行为更一致

如果你只想要一个结论：**先把 commands 跑通，再少量启用 hooks/MCP**，你就已经超过 90% 的“装了一堆但不好用”配置了。

### 这篇文章怎么用（建议阅读顺序）

如果你时间很少，按这个顺序看就够了：

1. 先看「2）30 分钟跑通最小闭环」：确认 commands 生效
2. 再看「3.3 hooks」：只启用 3 个高收益 hooks（提醒/质量/格式）
3. 再看「3.4 MCP」：按项目只启用 3-5 个
4. 最后看「4）包管理器自动检测」：多项目切换的人强烈建议配

### 你不需要做的事（先别折腾）

为了避免“配置越配越慢/越配越吵”，下面这些先别做：

- 先别把所有 MCP 都启用（这是最常见的性能崩坏原因）
- 先别让 hooks 自动跑全量测试/全量构建（慢、噪音大、还容易误判）
- 先别追求“跨会话记忆”一把梭（先把最小闭环跑顺，收益更确定）

---

## 0）准备清单（2 分钟检查）

- 你已经能正常使用 Claude Code（能在终端里打开并对话）
- 你本机有 Node.js（建议 LTS，用于仓库里的跨平台脚本）

```bash
# Check Node is available
node -v
```

---

## 1）安装：插件版（推荐）or 手动版（可控）

这个仓库本质上是一个 Claude Code 插件，包含：

- `commands/`：斜杠命令入口（你最先用到的）
- `agents/`：子代理（分工与限权）
- `skills/`：工作流与知识库
- `hooks/` + `scripts/`：自动化与跨平台实现
- `rules/`：永远生效的底层规则
- `mcp-configs/`：MCP 配置参考

### 选项 A：插件安装（最省事）

在 Claude Code 里执行：

```text
/plugin marketplace add affaan-m/everything-claude-code
/plugin install everything-claude-code@everything-claude-code
```

安装完成后，先做 3 个快速验收（建议都做完）：

1. 能看到插件启用状态：在 Claude Code 里运行 `/plugins`（或等价入口）能看到该插件已启用
2. 命令可用：输入 `/plan` 能触发，而不是当成普通文本
3. 命令输出“有结构”：至少包含步骤拆解与验收标准（否则可能是 rules/skills 没接上，或你的输入 scope 太大）

如果你想用“配置文件启用插件”的方式（适合自动化/多机同步），README 给了 `~/.claude/settings.json` 的示例（注释用英文）：

```jsonc
{
  "extraKnownMarketplaces": {
    "everything-claude-code": {
      "source": {
        "source": "github",
        "repo": "affaan-m/everything-claude-code",
      },
    },
  },
  "enabledPlugins": {
    "everything-claude-code@everything-claude-code": true,
  },
}
```

#### 安装后的“回滚开关”（重要）

配置类东西最怕的是：你装完发现不适合，但不知道怎么退。

你可以用这几个最小回滚策略：

- 觉得输出太长/太啰嗦：先减少启用的 MCP 数量（通常立刻变好）
- 觉得太吵：先关掉 hooks（或把拦截改成提醒）
- 只想临时停用插件：在 `~/.claude/settings.json` 里把 `enabledPlugins` 对应项改成 `false`

### 选项 B：手动安装（更可控）

适合你“只想挑一部分组件用”，比如只拿 `rules/` + `commands/`。

```bash
# Clone the repo
git clone https://github.com/affaan-m/everything-claude-code.git

# Copy agents
cp everything-claude-code/agents/*.md ~/.claude/agents/

# Copy rules
cp everything-claude-code/rules/*.md ~/.claude/rules/

# Copy commands
cp everything-claude-code/commands/*.md ~/.claude/commands/

# Copy skills (folders)
cp -r everything-claude-code/skills/* ~/.claude/skills/
```

提示：手动安装时，hooks 往往依赖仓库的 Node 脚本（`scripts/`）。如果你不打算完整接入脚本实现，建议先不要上复杂 hooks；先把 commands/rules 用顺，再逐步加。

手动安装建议做一次“文件落盘检查”（注释用英文）：

```bash
# Verify folders exist
ls -la ~/.claude/commands
ls -la ~/.claude/rules
ls -la ~/.claude/agents
ls -la ~/.claude/skills
```

如果你的机器没有 `~/.claude/` 目录，先创建对应目录再拷贝（避免 `cp` 失败）。

```bash
# Create folders if missing
mkdir -p ~/.claude/{agents,rules,commands,skills}
```

---

## 2）30 分钟跑通“最小闭环”（最重要的验收）

很多人配置失败不是“装不上”，而是“装上了也不知道是不是生效”。所以这里给你一个可重复的验收闭环：

### Step 1：先跑 `/plan`（把需求拆小）

在任意一个你正在写的仓库里，给 Claude Code 一个很小的需求，例如：

- “把某个按钮文案改成 X”
- “修一个 lint 报错”
- “给一个函数加边界处理”

然后输入：

```text
/plan
```

你要看到的结果是：它能输出步骤拆解、验收标准，而不是泛泛建议。

为了让 `/plan` 输出更“可执行”，建议你给它一段固定输入格式（直接复制即可）：

```text
Goal: [one sentence]
Constraints: [time limit / no refactor / minimal diff]
Must-not-do: [no new deps / no API change / no UI change]
Repo context: [stack + folder]
Acceptance: [how to verify]
```

你会发现：只要你把 “Constraints / Must-not-do / Acceptance” 写清楚，计划质量会稳定很多。

### Step 2：按任务类型跑 `/tdd` 或 `/build-fix`

- 如果你要加功能/修逻辑：用 `/tdd`
- 如果你卡在构建/测试报错：用 `/build-fix`

```text
/tdd
```

或：

```text
/build-fix
```

你要看到的结果是：它能给出明确的执行顺序（先复现→定位→最小修复→验证）。

这里有一个关键点：**不要让它猜你的测试命令**。你最好在指令里明确告诉它你项目的测试入口，例如：

```text
Test command: pnpm test
Lint command: pnpm lint
Typecheck command: pnpm typecheck
```

如果你不确定自己项目的命令，先用最保守的方式问一句（避免它猜错）：

```text
Before running anything, list the exact commands available in package.json scripts (or equivalent) and pick the correct test/lint/typecheck commands.
```

### Step 3：最后跑 `/code-review`（把质量拉稳）

```text
/code-review
```

你要看到的结果是：它能按规则检查可维护性/安全性/测试建议，而不是只说“看起来不错”。

如果这三步都能稳定跑通，说明你的 commands + rules 基本已经进入“可用状态”。接下来再考虑 hooks/MCP 的增量。

### 最小闭环验收清单（建议截图留档）

你可以把下面当成“配置完成”的定义（满足越多越好）：

- `/plan` 输出有：步骤、边界、验收方式
- `/tdd` 输出有：RED/GREEN/REFACTOR 的顺序 + 具体要跑的测试命令
- `/build-fix` 输出有：复现方式 + 最小修复 + 验证命令
- `/code-review` 输出有：风险点（security/logic）+ 建议的验证项
- 你没有为了“让它工作”而反复解释同样的规则（说明 rules 生效了）

### 闭环跑不通的 5 个高频原因（对症下药）

1. 需求太大：把一个“1-2 小时的任务”丢给了最小闭环（建议先缩到 15 分钟能验证）
2. 验收不清：没告诉它“怎样算做完”，它只能输出泛泛建议
3. 测试命令不明确：它猜错了项目脚本，后续一整条链都会歪
4. 约束不明确：你没说“不许做什么”，它就会“顺手重构”
5. 工具太多：启用一堆 MCP/插件后，上下文窗口缩水，输出开始失焦

---

## 3）只讲你需要的：commands / rules / hooks / MCP 分别该怎么开

### 3.1 commands：你每天都会用到的入口

作者仓库提供了一组很实用的 commands（这也是最值得先用的部分）：

- `/plan`：拆解任务（把“要做什么”说清楚）
- `/tdd`：测试驱动流程（把“怎么验证”说清楚）
- `/build-fix`：专注修构建/测试错误（少走弯路）
- `/code-review`：把质量、安全、可维护性扫一遍（减少返工）
- `/refactor-clean`：清死代码、收敛目录（不搞大重构）
- `/setup-pm`：配置包管理器（多项目切换很有用）

建议你先只把这几个用熟，先别追求“全自动化”。

#### Command 选择速查表（高密度版本）

| 你遇到的情况            | 先用哪个命令      | 你要提供的关键信息             |
| ----------------------- | ----------------- | ------------------------------ |
| 不知道从哪改、怎么拆    | `/plan`           | goal、限制、验收、影响范围     |
| 要加功能/修逻辑但怕回归 | `/tdd`            | 测试命令、接口定义、边界条件   |
| 构建/测试挂了           | `/build-fix`      | 报错日志、复现命令、环境信息   |
| 改完担心质量/安全       | `/code-review`    | 变更点、风险偏好、发布方式     |
| 代码越来越乱            | `/refactor-clean` | “只清理不重构”的限制、验证方式 |
| 项目间切包管理器        | `/setup-pm`       | 你希望的默认 pm、项目偏好      |

#### 提升命令质量的 3 个小技巧

1. **给出“禁止事项”**：例如“不要引入新依赖”“不要改 API shape”“不要跨模块重构”
2. **给出“验收命令”**：它会倾向输出可验证的步骤，而不是建议
3. **限制范围**：例如“只改 `src/foo` 下的文件”，能显著减少跑偏

#### 给每个命令一个“固定输入模板”（密度拉满，但很实用）

你不需要每次都想怎么提问，直接按命令套模板即可：

`/plan` 模板：

```text
Goal:
Non-goals:
Constraints:
Files/Areas in scope:
Acceptance:
```

`/tdd` 模板：

```text
Feature:
Public API / Interface:
Edge cases:
Test command:
Acceptance:
```

`/build-fix` 模板：

```text
Command that fails:
Error output (paste the key part):
What changed recently:
Acceptance:
```

`/code-review` 模板：

```text
What changed:
Risk level:
What must not break:
Verification commands:
```

### 3.2 rules：让输出长期稳定的底层开关

`rules/` 的作用是：即使你今天忘记说“不要写死 key、不要加 console.log、要跑测试”，模型也会默认遵守。

建议先启用这三类规则：

- `security.md`：密钥、输入校验、安全命令
- `coding-style.md`：小函数、小文件、少副作用
- `testing.md`：什么时候加测试、合并前跑什么

你会立刻感觉到的收益是：输出更像“团队标准”，而不是“每次风格都变”。

#### rules 最值得配的“高回报条款”（可以抄成清单）

你可以把下面当成你自己的最低标准（写进 rules 即可）：

- 安全：任何 token/key 必须来自环境变量，不允许硬编码
- 变更：默认最小 diff，不做无关重命名/搬家
- 输出：每次都给“如何验证”（命令或 checklist）
- 质量：禁止 `console.log`（或至少必须解释为什么保留）
- 测试：涉及逻辑变更时必须补测试或说明不补的原因

这类条款的特点是：**可执行、可验收、可复用**，不会变成“价值观宣言”。

### 3.3 hooks：少量启用，收益最大化

hooks 很容易“越配越吵”。教程建议你只从 3 个 hooks 开始：

1. **提醒类**：跑长命令前提醒 tmux
2. **质量类**：发现 `console.log` 提醒你删
3. **格式类**：修改后提醒格式化（或自动格式化）

README 示例（注释用英文）：

```jsonc
{
  "PreToolUse": [
    {
      "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm|pnpm|yarn|cargo|pytest)\"",
      "hooks": [
        {
          "type": "command",
          "command": "if [ -z \"$TMUX\" ]; then echo '[Hook] Consider tmux for session persistence' >&2; fi",
        },
      ],
    },
  ],
}
```

```jsonc
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
  "hooks": [
    {
      "type": "command",
      "command": "#!/bin/bash\ngrep -n 'console\\.log' \"$file_path\" && echo '[Hook] Remove console.log' >&2",
    },
  ],
}
```

提示：不同版本/实现里 hooks 暴露的变量名可能不同（例如 `$file_path`）。照抄不生效时，优先以仓库 `hooks/hooks.json` 与对应 `scripts/hooks/` 实现为准。

#### hooks 怎么“接进来”（手动安装用户必看）

README 的建议是：把仓库 `hooks/hooks.json` 里的内容合并进你的 `~/.claude/settings.json`。

这里有两个实操建议，能减少 80% 的踩坑：

1. **别整段覆盖 settings**：用“合并”的方式把 hooks 段落并进去（避免把你原有设置覆盖掉）
2. **先只启用 1-2 个 hooks**：确认生效后再加（否则出了问题你很难定位是哪一个）

如果你想先用“极简版 hooks 包”，可以先只放这三类（注释用英文，具体字段以你的 Claude Code 版本为准）：

```jsonc
{
  "PreToolUse": [
    {
      "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm|pnpm|yarn|cargo|pytest)\"",
      "hooks": [
        {
          "type": "command",
          "command": "if [ -z \"$TMUX\" ]; then echo '[Hook] Consider tmux for session persistence' >&2; fi",
        },
      ],
    },
  ],
  "PostToolUse": [
    {
      "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
      "hooks": [
        { "type": "command", "command": "echo '[Hook] Consider formatting and typecheck' >&2" },
      ],
    },
  ],
  "Stop": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "echo '[Hook] Quick audit: remove console.log, update tests if needed' >&2",
        },
      ],
    },
  ],
}
```

#### hooks 启用策略（从低噪音到高收益）

你可以按“噪音/收益比”分三档：

- 第一档（建议默认开）：提醒 tmux、提醒 console.log、提醒格式化
- 第二档（按团队习惯开）：提交前检查 TODO、敏感信息扫描（提醒式）
- 第三档（慎用自动执行）：自动跑 typecheck、自动跑测试、自动生成变更摘要

如果你发现 hooks 让你“每次都被打断”，优先把它从“拦截/自动执行”改成“提醒”，稳定后再升级。

### 3.4 MCP：连接外部系统，但最重要的是“少启用”

MCP 的价值很直接：少复制粘贴、少切窗口、少上下文丢失。

但 MCP 的代价也很直接：工具一多，上下文窗口会缩水，模型会变“钝”。

建议按这个节奏启用：

- 第 1 天：不开或只开 1-2 个（例如 GitHub）
- 第 3 天：按项目固定 3-5 个（例如 GitHub + 部署平台 + 1 个数据库）
- 一周后：再考虑更重的工具（浏览器自动化、多个云平台）

作者仓库提供了 MCP 配置参考：

- 文件：`mcp-configs/mcp-servers.json`
- 用法：挑你需要的 server 复制到自己的配置里
- 注意：把 `YOUR_*_HERE` 这类占位符替换成你自己的 key（别把密钥提交进仓库）

禁用示例（注释用英文）：

```jsonc
{
  "disabledMcpServers": ["playwright", "cloudflare-docs", "clickhouse", "context7", "magic"],
}
```

#### MCP 选择建议（按常见工作场景）

下面是“最少但好用”的组合思路（不追求齐全）：

- 日常开发（大多数人）：`github` +（可选）`vercel`/`railway`
- 有数据库排查需求：在上面基础上加 `supabase`（或你的 DB MCP）
- 需要长期项目记忆：再加 `memory`（但记得控制写入内容，避免噪音）

你可以用一个简单判断来决定要不要开 MCP：

- 如果你经常复制粘贴同一类信息（PR 链接、日志、SQL），开
- 如果你只是“偶尔可能用到”，先别开（工具描述也会占上下文）

#### MCP 开太多的典型症状（出现 2 条就该减）

- 输出变长但没重点（像是在“展示工具”，不是解决问题）
- 经常忘记你刚刚说过的限制条件
- 计划里开始出现无关探索（跑偏）
- 同样的问题要你重复解释

解决方式通常只有一个：**禁用一批 MCP，回到 3-5 个/项目**。

---

## 4）包管理器自动检测（多项目切换强烈建议开）

如果你经常在 npm/pnpm/yarn/bun 之间切换，最容易浪费时间的坑就是：

- 项目明明用 pnpm，你却跑了 npm
- lockfile 不一致，CI 才发现

作者插件提供“包管理器检测”，优先级如下：

1. 环境变量 `CLAUDE_PACKAGE_MANAGER`
2. 项目配置 `.claude/package-manager.json`
3. `package.json` 的 `packageManager` 字段
4. lock 文件检测（`package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` / `bun.lockb`）
5. 全局配置 `~/.claude/package-manager.json`
6. fallback：第一个可用的包管理器

你可以这样设置（注释用英文）：

```bash
# Via environment variable
export CLAUDE_PACKAGE_MANAGER=pnpm

# Via global config
node scripts/setup-package-manager.js --global pnpm

# Via project config
node scripts/setup-package-manager.js --project bun

# Detect current setting
node scripts/setup-package-manager.js --detect
```

提示：上面这些 `node scripts/...` 命令适用于你本地 clone 了仓库（或你把脚本拷贝到了可运行的位置）的场景；如果你走的是插件安装，优先用 `/setup-pm`，更省事也更不容易路径出错。

或者直接在 Claude Code 里运行：

```text
/setup-pm
```

#### 一条更“工程化”的建议：把包管理器写进项目本身

如果你的项目是 Node 工程，建议你同时做两件事（避免团队成员各跑各的）：

1. 在 `package.json` 里写 `packageManager` 字段（注释用英文）：

```jsonc
{
  "packageManager": "pnpm@9.0.0",
}
```

2. 再用作者的机制让 Claude Code 自动对齐（环境变量或项目级配置）

---

## 5）可选：如何确认“这套配置不会悄悄坏掉”

如果你是 clone 仓库使用（手动安装场景），作者仓库带了测试，可以直接跑：

```bash
# Run all tests
node tests/run-all.js
```

这件事的意义在于：当你升级/修改 hooks 或 scripts 后，能快速发现行为是否被破坏。

如果你不想跑完整测试，也至少保留一个“人肉验收”：

- 找一个小改动：跑 `/plan` → `/tdd` → `/code-review`
- 看输出是否还是“有结构、可验收、限制条件不丢”

---

## 6）常见问题（按踩坑概率排序）

### Q1：命令 `/plan`、`/tdd` 没反应？

- 优先检查插件是否真的启用（在 Claude Code 里用 `/plugins` 看状态）
- 手动安装用户：确认文件是否在 `~/.claude/commands/` 里
- 手动安装用户：确认文件编码为 UTF-8（少见但会影响解析）
- 如果你刚改了 `~/.claude/` 下的文件：重启 Claude Code 再试一次（避免缓存）

### Q2：hooks 不生效？

- 先确认 hooks 配置是否真的写进了 `~/.claude/settings.json`
- 再确认你匹配的 `tool` 名称、字段名是否正确
- 如果变量名不对（如 `$file_path`），以仓库 `hooks/hooks.json` 为准
- 如果你从 README 复制了 JSON：确认没有少逗号、少引号（建议用 JSON 校验器过一遍）

### Q3：启用 MCP 后感觉模型变慢/变笨？

- 先砍到 3-5 个 MCP（每项目）
- 把不常用的 server 放到 `disabledMcpServers`
- 工具数量控制在 80 以内（这是最常见的性能拐点）

### Q4：`/tdd` 输出很长，但落地不了？

这通常不是命令的问题，而是你给的输入不够“工程化”。你可以补充 3 类信息：

- 你的测试命令是什么（`pnpm test` / `pytest` / `cargo test`）
- 你希望的验收标准是什么（“至少覆盖 X 分支”“必须有回归用例”）
- 你不希望发生什么（“不改 API”“不做重构”“不引入新依赖”）

### Q5：我到底该不该让 hooks 自动跑测试/类型检查？

一个实用判断：

- 如果你的 `typecheck/test` 通常 **30 秒内**：可以考虑自动跑（但仍建议先提醒再自动）
- 如果经常 **> 1 分钟**：先别自动跑，改成提醒（否则你会为了省时间把 hooks 关掉）

---

## 资源链接（只留你用得上的）

- 仓库（配置本体）：https://github.com/affaan-m/everything-claude-code
- Shorthand Guide（建议先读）：https://x.com/affaanmustafa/status/2012378465664745795
- Longform Guide（进阶再看）：https://x.com/affaanmustafa/status/2014040193557471352
