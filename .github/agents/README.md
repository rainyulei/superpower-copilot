# BitFrog — Structured AI Development Agents for GitHub Copilot

> 7+1 个结构化 AI 开发代理，为 GitHub Copilot 提供纪律性的开发工作流。

## Quick Start

BitFrog agents 自动被 VS Code 发现（`.github/agents/` 目录）。打开 Copilot Chat，在 agent 下拉框中选择即可使用。

**推荐入口：** 选择 `@bitfrog`，描述你想做什么，它会自动引导你到合适的 agent。

## Agents

| Agent | 职责 | 何时使用 |
|-------|------|---------|
| **@bitfrog** | 主路由 | 不确定用哪个 agent 时，从这里开始 |
| **@bitfrog-brainstorm** | 探索设计 | 有新想法、需要设计方案时 |
| **@bitfrog-plan** | 规划拆解 | 设计确定后，需要拆解为可执行任务时 |
| **@bitfrog-execute** | 执行开发 | 有计划后，开始写代码时 |
| **@bitfrog-debug** | 诊断修复 | 遇到 bug、报错、问题时 |
| **@bitfrog-review** | 审查收尾 | 代码写完，需要审查和合并时 |
| **@bitfrog-mentor** | 学习引导 | 想理解代码、学习新概念时 |
| **@bitfrog-ui-design** | UX 研究 | 涉及 UI/UX 设计、用户研究时 |

## Workflow

```
brainstorm ──[进入计划]──▶ plan ──[开始执行]──▶ execute ──[代码审查]──▶ review
                                                    │
                                              [遇到 bug]
                                                    ▼
                                                  debug
```

每个箭头是一个 **handoff 按钮**，agent 完成后会在聊天框底部显示。点击即可流转，不点则留在当前对话。

**独立入口：** `debug` 和 `mentor` 可以随时直接使用，不依赖流程链。

## Core Principles

1. **自闭环** — 每个 agent 能独立完成自己职责范围内的事
2. **超出范围才 handoff** — 只有问题超出当前 agent 能力时才建议流转
3. **TDD 纪律** — execute agent 遵循 Red-Green-Refactor
4. **先诊断后修复** — debug agent 确认根因后才动手
5. **两阶段 review** — 先检查 spec 合规，再检查代码质量

## Language

所有 agents 支持 **English** 和 **简体中文**，自动匹配用户语言。

---

*BitFrog is part of the [bit-frog](https://github.com/rainyulei) product family.*
