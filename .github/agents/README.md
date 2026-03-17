# BitFrog — Structured AI Development Agents for GitHub Copilot

> 7+1 structured AI development agents, infused with Chinese philosophical thinking, providing a deep development workflow for GitHub Copilot.

## Quick Start

BitFrog agents are automatically discovered by VS Code (`.github/agents/` directory). Open Copilot Chat and select from the agent dropdown to use them.

**Recommended entry point:** Select `@bitfrog`, describe what you want to do, and it will guide you to the right agent.

## Agents

| Agent | Role | Core Philosophy |
|-------|------|-----------------|
| **@bitfrog** | Main Router | Dialectical routing — discern intent before directing |
| **@bitfrog-brainstorm** | Explore & Design | 格物致知 — understand the true nature before proposing solutions |
| **@bitfrog-plan** | Planning & Decomposition | 格物 + 辨证 — scout the terrain before making plans |
| **@bitfrog-execute** | Implementation | 知行合一 — true knowledge demands action; inaction reveals ignorance |
| **@bitfrog-debug** | Diagnosis & Fix | 辨证论治 — determine the true level before choosing a strategy |
| **@bitfrog-review** | Review & Wrap-up | 三省吾身 — self-reflection, peer reflection, final reflection |
| **@bitfrog-mentor** | Guided Learning | 格物致知 — the process itself |
| **@bitfrog-ui-design** | UX Research | 格物致知 applied to people — first understand the 神 (spirit/need), then shape the 形 (form) |

## Philosophy

BitFrog's underlying thinking system (see `bitfrog-philosophy.md` for details):

**Meta-Principle: 中庸之道** — 过犹不及. The "measure" that governs all behavior.

**Core Principles:**
1. **格物致知** — Understand the true nature before proposing solutions
2. **知行合一** — True knowledge demands action; inaction reveals ignorance
3. **辨证论治** — Determine the true level before choosing a strategy

**Collaboration Principles:**
4. **阴阳互生** — Each fulfills their role while keeping the big picture in mind
5. **三省吾身** — Self-reflection, peer reflection, final reflection

### Comparison with Western Engineering Discipline

| Original (External Constraint) | BitFrog (Internal Drive) |
|-------------------------------|--------------------------|
| Iron Laws — absolute rules | 知行合一 — discipline from understanding |
| Hard Gates — pass/fail | 中庸 — the right measure |
| Rationalization Blocking — blocking excuses | 格物致知 — when understanding is deep, excuses do not arise |
| Checklist inspection — checking boxes | 三省吾身 — reflecting on the thinking process |
| Optimal solution — finding the best answer | 中庸之道 — finding the appropriate answer |

## Workflow

```
brainstorm ──[Create Plan]──▶ plan ──[Start Execution]──▶ execute ──[Code Review]──▶ review
                                                    │
                                              [Hit a bug]
                                                    ▼
                                                  debug
```

Each arrow is a **handoff button** — click to transition, or stay in the current conversation.

**Independent entry points:** `debug` and `mentor` can be used directly at any time.

## Language

All agents support **English** and **简体中文**, automatically matching the user's language.

---

*BitFrog is part of the [bit-frog](https://github.com/rainyulei) product family.*
