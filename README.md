# BitFrog Copilot 🐸

> **Love VS Code. Love Copilot's inline diff and unified UX. Want Claude Code-level development workflows. BitFrog makes it happen.**

[中文文档](readme-zh.md) | [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=rainlei.bitfrog-copilot)

<!-- TODO: Add GIF demo here
![BitFrog Demo](docs/assets/demo.gif)
-->

## Why BitFrog?

You might be in one of these situations:

- **Your company requires GitHub Copilot** — enterprise policy, security compliance, no alternatives allowed
- **You genuinely prefer VS Code + Copilot** — the inline diff view, the integrated Chat panel, the slash command UX, the seamless editor integration
- **You've seen what Claude Code can do** — structured brainstorm → plan → execute → review workflows — and you want that *inside* your favorite editor

The problem: Copilot's agent mode doesn't have built-in structure. When you need to go from idea to shipped feature, there's no workflow, no discipline, no handoff chain.

**BitFrog gives you Claude Code-level structured development workflows, running entirely inside GitHub Copilot.**

## How It Works

BitFrog adds **7+1 specialized agents** directly inside Copilot Chat. Each handles one phase of development, handing off to each other automatically:

```
@bitfrog (ask anything — auto-routes to the right agent)
    ↓
brainstorm → plan → execute → review
                       ↕
                     debug
```

No new editor. No new subscription. Just install and go.

---

## Quick Start

### 1. Install

**Agent Plugin (recommended, VS Code 1.110+):**

`Cmd+Shift+P` → `Chat: Install Plugin` → `rainyulei/bitfrog-copilot`

**VS Code Marketplace:**

Search **"BitFrog Copilot"** in Extensions → Install

### 2. Choose Your Model

BitFrog works best with **GPT-5.4** — it is the recommended model for all agents.

To set the model: click the model picker in Copilot Chat → select **GPT-5.4**.

> Other models (Claude Sonnet 4, Gemini 2.5 Pro, etc.) also work, but GPT-5.4 provides the best balance of instruction-following and tool use for BitFrog's structured workflows.

### 3. Set Permission Mode

Different agents need different levels of autonomy:

| Agent Phase | Recommended Mode | Why |
|-------------|-----------------|-----|
| **@bitfrog** (router) | Default | Only reads code and routes — no risk |
| **@bitfrog-brainstorm** | Default | Explores and asks questions — no code changes |
| **@bitfrog-plan** | Default | Reads codebase, writes plan doc — minimal risk |
| **@bitfrog-execute** | Bypass Approvals | Needs to edit files, run tests, commit — frequent tool calls; approving each one breaks flow |
| **@bitfrog-debug** | Bypass Approvals | Needs to read logs, edit code, run tests freely |
| **@bitfrog-review** | Default | Reviews code, suggests changes — you decide what to apply |
| **@bitfrog-mentor** | Default | Read-only guidance |
| **@bitfrog-ui-design** | Default | Research and document — no code changes |

**How to set:** Click the permission level indicator in the Chat view (VS Code 1.111+).

**Rule of thumb:** Use **Default** when thinking (brainstorm, plan, review). Use **Bypass** when doing (execute, debug).

### 4. Start Using

Open Copilot Chat, select **@bitfrog**, and describe what you want to do:

- "I want to add a user authentication system" → routes to **brainstorm**
- "Here's the spec, break it into tasks" → routes to **plan**
- "Execute the plan above" → routes to **execute**
- "This API returns 500" → routes to **debug**
- "Review the changes" → routes to **review**

Or select a specific agent directly from the dropdown.

---

## Agents

| Agent | What it does | When to use it | Mode |
|-------|-------------|----------------|------|
| **@bitfrog** | Auto-routes to the right agent | Don't know where to start? Start here | Default |
| **@bitfrog-brainstorm** | Explores ideas, challenges assumptions, writes specs | "I want to build..." / "I have an idea..." | Default |
| **@bitfrog-plan** | Maps dependencies, decomposes into bite-sized TDD tasks | Design is done, need a concrete plan | Default |
| **@bitfrog-execute** | TDD implementation with parallel sub-agents | Plan is ready, time to code | Bypass |
| **@bitfrog-debug** | Four-diagnostic-method root cause analysis | Something is broken | Bypass |
| **@bitfrog-review** | Three-reflection review (spec → code quality → user intent) | Code is done, need quality check | Default |
| **@bitfrog-mentor** | Guided learning through hints, never gives direct answers | Want to understand, not just get answers | Default |
| **@bitfrog-ui-design** | Jobs-to-be-Done analysis, user journey, flow specs | Building user-facing features | Default |

### Internal Sub-Agents (v4.2)

These work behind the scenes — you don't interact with them directly:

| Sub-Agent | Used by | Purpose |
|-----------|---------|---------|
| `bitfrog-spec-reviewer` | brainstorm | Independent design spec review before approval |
| `bitfrog-code-reviewer` | review | Independent code quality review (peer reflection) |
| `bitfrog-task-worker` | execute | Parallel execution of independent tasks |

---

## What Makes It Different

Most AI coding tools use **hard rules**: "you MUST write tests", "you MUST NOT skip review". BitFrog uses **Chinese philosophy thinking models** — agents don't follow rules mechanically, they *understand why* the rules exist.

| Rules-based approach | BitFrog's philosophy approach |
|---------------------|-------------------------------|
| "You MUST write tests" | Agent understands *why* tests matter → writes them naturally |
| "You MUST NOT skip root cause analysis" | Agent knows treating symptoms creates more problems |
| Checklist: pass / fail | Reflection: "Is my thinking process right?" |
| Find the optimal solution | Find the *appropriate* solution for this context |

Five principles drive all agents:

| Principle | Meaning |
|-----------|---------|
| **中庸之道** (Right Measure) | Every action has its appropriate level — too much process is as harmful as too little |
| **格物致知** (Investigate First) | Understand the true nature of the problem before proposing solutions |
| **知行合一** (Unity of Knowing and Doing) | If you know you should do something but skip it, you don't truly understand |
| **辨证论治** (Diagnose Before Treating) | Same symptom, different root causes — classify the problem level first |
| **阴阳互生 + 三省吾身** (Awareness + Reflection) | Stay aware of the whole system; reflect on your thinking, not just the output |

Read the full guide: [bitfrog-philosophy.md](.github/agents/bitfrog-philosophy.md)

## Language

All agents support **English** and **简体中文** automatically.

## Star This Repo ⭐

If BitFrog helps your workflow, **give it a star** — it helps other developers in the same situation discover it.

## Acknowledgments

Inspired by [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent. BitFrog builds on that foundation by replacing external rule constraints with internal philosophical thinking models.

## License

MIT

---

*BitFrog Copilot is part of the [BitFrog](https://github.com/rainyulei) product family.*
