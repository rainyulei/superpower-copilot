# BitFrog — Structured AI Development Agents for GitHub Copilot

> 7+1 个结构化 AI 开发代理，融合中国哲学底层思维，为 GitHub Copilot 提供有深度的开发工作流。

## Quick Start

BitFrog agents 自动被 VS Code 发现（`.github/agents/` 目录）。打开 Copilot Chat，在 agent 下拉框中选择即可使用。

**推荐入口：** 选择 `@bitfrog`，描述你想做什么，它会引导你到合适的 agent。

## Agents

| Agent | 职责 | 核心哲学 |
|-------|------|---------|
| **@bitfrog** | 主路由 | 辨证路由 — 辨清意图再指路 |
| **@bitfrog-brainstorm** | 探索设计 | 格物致知 — 穷究本质再论方案 |
| **@bitfrog-plan** | 规划拆解 | 格物 + 辨证 — 先侦察地形再制定计划 |
| **@bitfrog-execute** | 执行开发 | 知行合一 — 真知必行，不行非真知 |
| **@bitfrog-debug** | 诊断修复 | 辨证论治 — 先辨本质层次再选策略 |
| **@bitfrog-review** | 审查收尾 | 三省吾身 — 自省、互省、终省 |
| **@bitfrog-mentor** | 学习引导 | 格物致知（过程本身） |
| **@bitfrog-ui-design** | UX 研究 | 格物致知（对人）— 先明"神"再塑"形" |

## Philosophy

BitFrog 的底层思维体系（详见 `bitfrog-philosophy.md`）：

**元准则：中庸之道** — 过犹不及。控制一切行为的"度"。

**核心准则：**
1. **格物致知** — 穷究事物本质，再论方案
2. **知行合一** — 真知必行，不行非真知
3. **辨证论治** — 先辨本质层次，再选策略

**协作准则：**
4. **阴阳互生** — 各司其职，心怀全局
5. **三省吾身** — 自省、互省、终省

### 与西方工程纪律的区别

| 原版（外在约束） | BitFrog（内在驱动） |
|----------------|-------------------|
| Iron Laws — 绝对规则 | 知行合一 — 纪律来自理解 |
| Hard Gates — 通过/不通过 | 中庸 — 恰当的度 |
| Rationalization Blocking — 封堵借口 | 格物致知 — 理解到位，借口不会产生 |
| Checklist inspection — 逐项打勾 | 三省吾身 — 反省思维过程 |
| Optimal solution — 找最优解 | 中庸之道 — 找恰当解 |

## Workflow

```
brainstorm ──[进入计划]──▶ plan ──[开始执行]──▶ execute ──[代码审查]──▶ review
                                                    │
                                              [遇到 bug]
                                                    ▼
                                                  debug
```

每个箭头是一个 **handoff 按钮**，点击即可流转，不点则留在当前对话。

**独立入口：** `debug` 和 `mentor` 可以随时直接使用。

## Language

所有 agents 支持 **English** 和 **简体中文**，自动匹配用户语言。

---

*BitFrog is part of the [bit-frog](https://github.com/rainyulei) product family.*
