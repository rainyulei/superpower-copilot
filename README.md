# BitFrog Copilot 🐸

> **Already have GitHub Copilot? Get Claude Code-level structured development experience — without switching editors.**

[中文文档](readme-zh.md) | [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=rainlei.bitfrog-copilot)

<!-- TODO: Add GIF demo here
![BitFrog Demo](docs/assets/demo.gif)
-->

## The Problem

GitHub Copilot is great at code completion. But when you need it to **brainstorm → plan → execute → review** a feature end-to-end, it falls apart — no structure, no discipline, no workflow.

Tools like Claude Code and Cursor solve this with agentic workflows. But you have to **leave your editor and your Copilot subscription behind**.

## The Solution

BitFrog Copilot adds **7+1 specialized agents** directly inside GitHub Copilot Chat. Each agent handles one phase of development, and they hand off to each other automatically:

```
@bitfrog (ask anything — auto-routes to the right agent)
    ↓
brainstorm → plan → execute → review
                       ↕
                     debug
```

No new editor. No new subscription. Just install and go.

## What Makes It Different

Most AI coding tools use **hard rules** to enforce discipline ("you MUST write tests", "you MUST NOT skip review"). BitFrog uses **Chinese philosophy thinking models** instead — the agents don't follow rules mechanically, they *understand why* the rules exist.

| Rules-based approach | BitFrog's philosophy approach |
|---------------------|-------------------------------|
| "You MUST write tests" | Agent understands *why* tests matter → writes them naturally |
| "You MUST NOT skip root cause analysis" | Agent knows treating symptoms creates more problems |
| Checklist: ✅ / ❌ | Reflection: "Is my thinking process right?" |
| Find the optimal solution | Find the *appropriate* solution for this context |

The result: agents that make better judgment calls, not just follow instructions.

## Install

**VS Code Marketplace:**
Search **"BitFrog Copilot"** in Extensions → Install

**Agent Plugin (VS Code 1.110+):**
`Cmd+Shift+P` → `Chat: Install Plugin` → `rainyulei/bitfrog-copilot`

## Agents

| Agent | What it does | When to use it |
|-------|-------------|----------------|
| **@bitfrog** | Auto-routes to the right agent | Don't know which agent? Start here |
| **@bitfrog-brainstorm** | Explores ideas, challenges assumptions | "I want to build..." / "I have an idea..." |
| **@bitfrog-plan** | Maps dependencies, decomposes tasks | Design is done, need an execution plan |
| **@bitfrog-execute** | TDD implementation with verification | Plan is ready, time to code |
| **@bitfrog-debug** | Diagnoses root cause, fixes, verifies | Something is broken |
| **@bitfrog-review** | Two-phase review + merge/PR | Code is done, need quality check |
| **@bitfrog-mentor** | Guided learning through hints | Want to understand, not just get answers |
| **@bitfrog-ui-design** | UX research before UI implementation | Building user-facing features |

## Philosophy

Five principles from Chinese philosophy drive all BitFrog agents:

| Principle | Meaning in BitFrog |
|-----------|-------------------|
| **中庸之道** | Every action has a right measure — too much is as bad as too little |
| **格物致知** | Understand the true nature of the problem before proposing solutions |
| **知行合一** | If you know you should do something, do it — skipping reveals you don't truly understand |
| **辨证论治** | Same symptom, different root causes — diagnose the level before choosing a fix |
| **阴阳互生 + 三省吾身** | Stay aware of the whole system; reflect on your thinking, not just the output |

Read the full philosophy guide: [bitfrog-philosophy.md](.github/agents/bitfrog-philosophy.md)

## Language

All agents support **English** and **简体中文** automatically.

## Star This Repo ⭐

If BitFrog Copilot helps your workflow, **please give it a star** — it helps other developers discover it.

## Acknowledgments

Inspired by [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent. BitFrog builds on that foundation by replacing external rule constraints with internal philosophical thinking models.

## License

MIT

---

*BitFrog Copilot is part of the [BitFrog](https://github.com/rainyulei) product family.*
