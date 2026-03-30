# BitFrog Copilot 🐸

> **喜欢 VS Code，喜欢 Copilot 的内联 diff 和统一交互体验，又想要 Claude Code 级别的开发工作流？BitFrog 帮你实现。**

[English](README.md) | [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=rainlei.bitfrog-copilot)

![BitFrog Demo](docs/0323.gif)

## 为什么用 BitFrog？

你可能处于这几种情况之一：

- **公司要求使用 GitHub Copilot** — 企业策略、安全合规、不允许使用其他工具
- **你真心喜欢 VS Code + Copilot** — 内联 diff 视图、集成的 Chat 面板、斜杠命令的统一体验、无缝的编辑器集成
- **你见过 Claude Code 能做什么** — 结构化的 brainstorm → plan → execute → review 工作流 — 你想在自己喜欢的编辑器里也拥有这些

问题是：Copilot 的 agent 模式没有内置的工作流结构。当你需要从一个想法做到上线，没有流程、没有纪律、没有交接链。

**BitFrog 在 GitHub Copilot 内部提供 Claude Code 级别的结构化开发工作流。**

## 工作原理

BitFrog 在 Copilot Chat 中添加 **7+1 个专业 agent**，每个负责开发的一个阶段，自动交接：

```
@bitfrog（问任何问题 — 自动路由到正确的 agent）
    ↓
brainstorm → plan → execute → review
                       ↕
                     debug

mozi（全自动 — 给目标，一步到位）
```

不需要换编辑器。不需要新订阅。安装即用。

---

## 快速开始

### 1. 安装

**Agent Plugin（推荐，VS Code 1.110+）：**

`Cmd+Shift+P` → `Chat: Install Plugin` → `rainyulei/bitfrog-copilot`

**VS Code Marketplace：**

Extensions 搜索 **"BitFrog Copilot"** → 安装

### 2. 选择模型

BitFrog 推荐使用 **GPT-5.4** — 在指令遵循和工具使用方面提供最佳体验。

设置方法：点击 Copilot Chat 中的模型选择器 → 选择 **GPT-5.4**。

> 其他模型（Claude Sonnet 4、Gemini 2.5 Pro 等）也能用，但 GPT-5.4 最适合 BitFrog 的结构化工作流。

### 3. 设置权限模式

不同 agent 需要不同的自主权：

| Agent 阶段 | 推荐模式 | 原因 |
|-----------|---------|------|
| **@bitfrog**（路由器） | Default | 只读代码和路由 — 无风险 |
| **@bitfrog-brainstorm** | Default | 探索和提问 — 不改代码 |
| **@bitfrog-plan** | Default | 读代码库、写计划文档 — 风险极小 |
| **@bitfrog-execute** | Bypass Approvals | 需要编辑文件、跑测试、提交 — 频繁的工具调用，逐个审批会打断节奏 |
| **@bitfrog-debug** | Bypass Approvals | 需要自由地读日志、改代码、跑测试 |
| **@bitfrog-review** | Default | 审查代码、提建议 — 你来决定采纳哪些 |
| **@bitfrog-mentor** | Default | 只读引导 |
| **@bitfrog-mozi** | Bypass Approvals | 全自动端到端执行 — 需要完整工具权限，不被打断 |

**设置方法：** 点击 Chat 视图中的权限级别指示器（VS Code 1.111+）。

**经验法则：** 思考阶段用 **Default**（brainstorm、plan、review），行动阶段用 **Bypass**（execute、debug、mozi）。

### 4. 开始使用

打开 Copilot Chat，选择 **@bitfrog**，描述你想做的事：

- "我想加一个用户认证系统" → 路由到 **brainstorm**
- "这是设计文档，帮我拆成任务" → 路由到 **plan**
- "按上面的计划开始执行" → 路由到 **execute**
- "这个 API 返回 500" → 路由到 **debug**
- "审查一下这些改动" → 路由到 **review**
- "帮我做完——加个暗色模式" → 路由到 **mozi**

也可以直接从下拉菜单选择特定 agent。

---

## Agent 一览

| Agent | 功能 | 使用场景 | 模式 |
|-------|------|---------|------|
| **@bitfrog** | 自动路由到合适的 agent | 不知道找谁？从这里开始 | Default |
| **@bitfrog-brainstorm** | 探索想法、挑战假设、写设计文档 | "我想做……" / "我有个想法……" | Default |
| **@bitfrog-plan** | 映射依赖、拆解为 TDD 小任务 | 设计完成，需要执行计划 | Default |
| **@bitfrog-execute** | TDD 实现 + 并行子代理执行 | 计划就绪，开始写代码 | Bypass |
| **@bitfrog-debug** | 望闻问切四诊法定位根因 | 出 bug 了 | Bypass |
| **@bitfrog-review** | 三省审查（spec → 代码质量 → 用户意图） | 代码写完，需要质量检查 | Default |
| **@bitfrog-mentor** | 通过提示引导学习，从不直接给答案 | 想理解原理，不只是要答案 | Default |
| **@bitfrog-mozi** | [BETA] 全自动深度工作者 — 调研、计划、执行、自验，直到目标达成 | "帮我做完" — 给目标，端到端完成 | Bypass |

### 内部子代理（v4.2）

这些在幕后工作 — 你不需要直接使用：

| 子代理 | 调用方 | 用途 |
|--------|--------|------|
| `bitfrog-spec-reviewer` | brainstorm | 独立审查设计文档 |
| `bitfrog-code-reviewer` | review | 独立代码质量审查（互省） |
| `bitfrog-task-worker` | execute | 并行执行独立任务 |

---

## 为什么不同

大多数 AI 编码工具用**硬规则**强制纪律。BitFrog 用**中国哲学思维模型** — agent 不是机械地遵循规则，而是*理解规则为什么存在*。

| 规则驱动 | BitFrog 哲学驱动 |
|---------|-----------------|
| "你必须写测试" | Agent 理解测试的价值 → 自然地写 |
| "你必须做根因分析" | Agent 理解治标不治本会制造更多问题 |
| 检查清单：通过/失败 | 反省："我的思维过程对吗？" |
| 找最优解 | 找**恰当**解 |

五条准则驱动所有 agent：

| 准则 | 含义 |
|------|------|
| **中庸之道** | 每个行为都有恰当的度 — 过犹不及 |
| **格物致知** | 先穷究事物本质再行动 |
| **知行合一** | 知道该做而不做，说明并不真的知道 |
| **辨证论治** | 同症异因 — 先辨清问题层次再选策略 |
| **阴阳互生 + 三省吾身** | 心怀全局；反省思维过程，不只看输出 |

详见：[bitfrog-philosophy.md](.github/agents/bitfrog-philosophy.md)

## v4.3 更新

### 移除：`@bitfrog-ui-design`

有很多优秀的专业设计 skill 可以直接在工作流中使用（如 [Impeccable](https://impeccable.style)）。与其内置一个平庸的设计 agent，不如让用户自由搭配专业的设计工具。

### 新增：`@bitfrog-mozi` — 全自动深度工作者 (BETA)

以墨子命名——兼爱非攻，亲力亲为的工匠精神。

给墨子一个明确目标，它会自主调研代码库、和你对齐方案，然后全自动执行、自我验证、反复迭代直到目标达成。无需在阶段之间手动 handoff。

**什么时候用墨子，什么时候用标准流程？**

| 场景 | 推荐 |
|------|------|
| 探索新想法，方向不确定 | brainstorm → plan → execute → review |
| 目标明确，想端到端完成 | **@bitfrog-mozi** |
| 复杂的多子系统项目 | brainstorm → plan → execute → review |
| "帮我给设置页加个暗色模式" | **@bitfrog-mozi** |

**推荐模式：** Bypass Approvals — 墨子需要完整的工具权限来自主工作，不被审批打断。

## 语言

所有 agent 自动支持 **English** 和 **简体中文**。

## 给个 Star ⭐

如果 BitFrog 对你有帮助，**给个 star** — 帮助更多同样处境的开发者发现它。

## 致谢

受 Jesse Vincent 的 [Superpowers](https://github.com/obra/superpowers) 启发。BitFrog 在那个基础上用哲学思维模型替换了外在规则约束。

## 许可证

MIT

---

*BitFrog Copilot 是 [BitFrog](https://github.com/rainyulei) 产品家族的一部分。*
