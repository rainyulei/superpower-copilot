# BitFrog — Structured AI Development Agents for GitHub Copilot

> 7+1 structured AI development agents, infused with Chinese philosophical thinking, providing a deep development workflow for GitHub Copilot.

## Quick Start

BitFrog agents are automatically discovered by VS Code (`.github/agents/` directory). Open Copilot Chat and select from the agent dropdown to use them.

**Recommended entry point:** Select `@bitfrog`, describe what you want to do, and it will guide you to the right agent.

## Agents

| Agent | Role | Core Philosophy |
|-------|------|-----------------|
| **@bitfrog** | Main Router | Dialectical routing — discern intent before directing |
| **@bitfrog-brainstorm** | Explore & Design | 格物致知 (Investigate the essence) — understand the true nature before proposing solutions |
| **@bitfrog-plan** | Planning & Decomposition | 格物 (Investigation) + 辨证 (Dialectical analysis) — scout the terrain before making plans |
| **@bitfrog-execute** | Implementation | 知行合一 (Unity of Knowledge and Action) — true knowledge demands action; inaction reveals ignorance |
| **@bitfrog-debug** | Diagnosis & Fix | 辨证论治 (Dialectical diagnosis and treatment) — determine the true level before choosing a strategy |
| **@bitfrog-review** | Review & Wrap-up | 三省吾身 (Reflect upon oneself) — self-reflection, peer reflection, final reflection |
| **@bitfrog-mentor** | Guided Learning | 格物致知 (The process itself) |
| **@bitfrog-ui-design** | UX Research | 格物致知 applied to people — first understand the 神 (spirit/need), then shape the 形 (form) |

## Philosophy

BitFrog's underlying thinking system (see `bitfrog-philosophy.md` for details):

**Meta-Principle: 中庸之道 (The Doctrine of the Mean)** — 过犹不及 (Going too far is as bad as not going far enough). The "measure" that governs all behavior.

**Core Principles:**
1. **格物致知 (Investigate the Essence of Things)** — Understand the true nature before proposing solutions
2. **知行合一 (Unity of Knowledge and Action)** — True knowledge demands action; inaction reveals ignorance
3. **辨证论治 (Dialectical Diagnosis and Treatment)** — Determine the true level before choosing a strategy

**Collaboration Principles:**
4. **阴阳互生 (Yin-Yang Complementarity)** — Each fulfills their role while keeping the big picture in mind
5. **三省吾身 (Reflect Upon Oneself)** — Self-reflection, peer reflection, final reflection

### Comparison with Western Engineering Discipline

| Original (External Constraint) | BitFrog (Internal Drive) |
|-------------------------------|--------------------------|
| Iron Laws — absolute rules | 知行合一 (Unity of Knowledge and Action) — discipline from understanding |
| Hard Gates — pass/fail | 中庸 (The Golden Mean) — the right measure |
| Rationalization Blocking — blocking excuses | 格物致知 (Investigate the essence) — when understanding is deep, excuses do not arise |
| Checklist inspection — checking boxes | 三省吾身 (Reflect upon oneself) — reflecting on the thinking process |
| Optimal solution — finding the best answer | 中庸之道 (The Doctrine of the Mean) — finding the appropriate answer |

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
