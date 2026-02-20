# Superpower Copilot

**13 个结构化 AI 开发工作流 Agent，适用于 GitHub Copilot Chat**

Superpower Copilot 通过 VS Code 的 [Custom Agents](https://code.visualstudio.com/docs/copilot/chat/chat-agents) 功能，为 GitHub Copilot 带来规范化、流程驱动的开发工作流。每个 Agent 执行特定的开发实践 — 从头脑风暴、规划到 TDD、调试和代码审查 — 让你以专业工程团队的标准进行 AI 辅助开发。

## 为什么需要这个

GitHub Copilot 很强大，但缺少有约束力的开发工作流。没有流程约束，AI 辅助编程容易导致：

- 跳过设计直接写代码
- 不写测试，或者事后补测试
- 靠猜而不是系统性地排查 bug
- 没有验证就声称"做完了"

Superpower Copilot 提供 13 个 Agent，每个都有严格的系统提示词（200-300 行），强制执行最佳实践。灵感来自 [Superpowers](https://github.com/cline/superpowers) 技能框架和 [awesome-copilot](https://github.com/github/awesome-copilot) 社区，为 GitHub Copilot 的 Agent 架构量身适配。

## 13 个 Agent

### 核心工作流链

| Agent | 说明 |
|-------|------|
| `@superpower-brainstorm` — 探索想法与设计 | 探索创意、明确需求、产出设计文档 |
| `@superpower-plan` — 分步实现计划 | 将设计拆分为可测试的小任务 |
| `@superpower-execute` — 执行计划 | 按批次逐步执行计划，带检查点 |
| `@superpower-verify` — 先验证再声明 | 运行所有验证命令后才能声明完成 |
| `@superpower-finish` — 合并/PR/丢弃 | 完成开发分支的结构化选项 |

### 纪律 Agent（随时可用）

| Agent | 说明 |
|-------|------|
| `@superpower-tdd` — 红-绿-重构 | 测试驱动开发，严格循环纪律 |
| `@superpower-debug` — 先找根因 | 4 阶段系统性调试：先调查再修复 |
| `@superpower-review` — 代码审查 | 对照计划和需求进行结构化审查 |
| `@superpower-respond` — 处理反馈 | 以技术严谨性处理审查反馈 |

### 新增：思维与设计 Agent

| Agent | 说明 |
|-------|------|
| `@superpower-ui-design` — UX 研究 | JTBD 分析、用户旅程映射、流程规格 |
| `@superpower-think` — 挑战假设 | 苏格拉底式提问 — 只问为什么，不给答案 |
| `@superpower-mentor` — 引导学习 | 通过提示和问题引导，不直接给答案 |
| `@superpower-context` — 依赖映射 | 多文件变更前映射影响范围和依赖关系 |

## 推荐工作流

Agent 设计为链式工作。每个 Agent 了解其他 Agent 并建议下一步：

```
brainstorm → plan → execute → verify → finish
     ↓          ↓                ↓
 ui-design   context    tdd / debug（按需）
                                 ↓
                        review → respond

    think / mentor — 随时用来挑战思维
```

**完整功能开发流程：**

1. `@superpower-brainstorm` — 探索问题、提问、产出设计文档
2. `@superpower-ui-design` — 如果涉及 UI，先做 UX 研究
3. `@superpower-context` — 多文件变更前映射依赖
4. `@superpower-plan` — 将设计转为分步实现计划
5. `@superpower-execute` — 按批次（每批 3 个任务）实现计划
6. `@superpower-verify` — 运行测试、lint、构建 — 先验证再声明
7. `@superpower-finish` — 本地合并、创建 PR 或保留分支

**独立 Agent**（随时可用）：

- `@superpower-tdd` — 构建任何新功能时使用
- `@superpower-debug` — 出 bug 时使用
- `@superpower-review` — 合并前使用
- `@superpower-respond` — 处理审查反馈时使用
- `@superpower-think` — 需要挑战自己假设时使用
- `@superpower-mentor` — 学习代码库或教学时使用

## 安装

1. 从 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=rainlei.superpower-copilot) 安装 **Superpower Copilot**
2. 扩展会将 13 个 Agent 文件复制到 `~/.superpower-copilot/agents/` 并全局注册
3. 打开 Copilot Chat，从下拉菜单中选择任意 `@superpower-*` Agent

## 系统要求

- VS Code 1.99.0 或更高版本
- GitHub Copilot（需要支持 Custom Agents 功能）

## 使用方法

打开 Copilot Chat（Ctrl+Shift+I / Cmd+Shift+I），输入：

```
@superpower-brainstorm 我需要给 Express 应用添加用户认证
```

```
@superpower-tdd 实现一个购物车，支持添加/删除/计算总价
```

```
@superpower-debug 为什么结账接口返回 500？
```

```
@superpower-think 我们应该用微服务还是单体架构？
```

```
@superpower-ui-design 设计移动应用的注册引导流程
```

Agent 会逐步引导你完成流程。每个 Agent 都有硬性门槛 — 例如 `@superpower-debug` 在根因调查完成前不允许提出修复方案。

## 有什么不同

**硬性门槛，不是建议。** 每个 Agent 都有明确的前置条件。Debug Agent 要求先做根因分析。TDD Agent 要求先有失败测试。Verify Agent 要求先运行命令并展示输出。

**反合理化表格。** 每个 Agent 都包含常见借口表（"太简单不需要测试"、"写完再补测试"）及其反驳，防止 AI 走捷径。

**正反示例。** Agent 展示正确和错误行为的具体例子，让 AI 理解标准。

**工作流交接。** Agent 包含交接按钮，连接到链条中的下一个逻辑步骤。

**Agent 间互知。** 每个 Agent 在描述中包含 Related Agents 引用，Copilot 可以建议合适的下一步 Agent。

## 最佳实践

- **从 brainstorm 开始** 处理任何非简单功能。花 10 分钟设计能省下数小时返工。
- **多文件变更先映射上下文。** 用 `@superpower-context` 再用 `@superpower-plan`。
- **做 UI 前先做 UX 研究。** 用 `@superpower-ui-design` 先理解用户。
- **所有新代码都用 TDD。** `@superpower-tdd` 强制红-绿-重构。没看到测试失败就不知道测的对不对。
- **先验证再说完成。** `@superpower-verify` 要求运行命令并展示输出。不接受"应该没问题"。
- **系统性调试。** 出问题时别猜。用 `@superpower-debug` 先追溯根因。
- **挑战自己的思维。** 用 `@superpower-think`，当决策感觉太轻松时 — 它会暴露盲点。
- **审查自己的代码。** 合并前用 `@superpower-review`，它能发现你遗漏的问题。

## 工作原理

扩展激活时：

1. 将 13 个 `.agent.md` 文件从扩展包复制到 `~/.superpower-copilot/agents/`
2. 在 VS Code 的 `chat.agentFilesLocations` 设置中注册路径（用户级别）
3. VS Code 发现这些 Agent 并添加到 Copilot Chat 下拉菜单

扩展停用时，自动清理复制的文件并移除设置项。

## 语言支持

所有 Agent 同时支持英文和简体中文。

## 致谢

灵感来自 [Superpowers](https://github.com/cline/superpowers) 技能框架和 [awesome-copilot](https://github.com/github/awesome-copilot) 社区集合。为 GitHub Copilot 的 Custom Agents 架构适配，支持原生集成（工具、交接、Agent 引用）。

## 许可证

MIT
