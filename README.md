# BitFrog Copilot

[中文文档](readme-zh.md)

**7+1 AI development agents for GitHub Copilot, powered by Chinese philosophy thinking models.**

BitFrog Copilot brings structured, disciplined AI development workflows to GitHub Copilot — not through rigid rules, but through deeply integrated philosophical thinking patterns that guide how each agent reasons, decides, and acts.

## Install

**Via VS Code Marketplace:**
Search "BitFrog Copilot" in Extensions → Install

**Via Agent Plugin:**
Extensions sidebar → Agent Plugins → Search "bitfrog-copilot"

## Agents

| Agent | Role | Philosophy |
|-------|------|-----------|
| **@bitfrog** | Main router | Diagnose intent before routing |
| **@bitfrog-brainstorm** | Explore & design | 格物致知 — Investigate the nature of things |
| **@bitfrog-plan** | Map dependencies & decompose tasks | 格物 + 辨证 — Scout the terrain, then plan |
| **@bitfrog-execute** | TDD implementation | 知行合一 — Knowledge without action is not knowledge |
| **@bitfrog-debug** | Diagnose & fix | 辨证论治 — Diagnose the root level, then treat |
| **@bitfrog-review** | Two-phase review & completion | 三省吾身 — Self-reflect, peer-reflect, user-reflect |
| **@bitfrog-mentor** | Guided learning | 格物致知 (the process itself) |
| **@bitfrog-ui-design** | UX research | Understand the "spirit" before shaping the "form" |

## Philosophy

Five principles drive all BitFrog agents (see `bitfrog-philosophy.md`):

**Meta-principle: 中庸之道 (The Middle Way)** — Everything has an appropriate degree. Too much is as bad as too little.

**Core:**
1. **格物致知** — Investigate the essence before proposing solutions
2. **知行合一** — Discipline comes from understanding, not from rules
3. **辨证论治** — Diagnose the level of the problem before choosing a fix

**Collaboration:**
4. **阴阳互生** — Each agent does its own job while being aware of the whole
5. **三省吾身** — Self-review, peer-review, user-review

## Workflow

```
brainstorm → plan → execute → review
                       ↕
                     debug
```

Each arrow is a **handoff button** — agents suggest the next step, you decide when to proceed.

`debug` and `mentor` work independently at any time.

## Language

All agents support **English** and **简体中文** automatically.

## License

MIT

---

*BitFrog Copilot is part of the [BitFrog](https://github.com/rainyulei) product family.*
