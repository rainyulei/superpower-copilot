# BitFrog Copilot

[中文文档](readme-zh.md)

**7+1 AI development agents for GitHub Copilot, powered by Chinese philosophy thinking models.**

BitFrog Copilot brings structured, disciplined AI development workflows to GitHub Copilot — not through rigid rules, but through deeply integrated philosophical thinking patterns that guide how each agent reasons, decides, and acts.

## Why Philosophy Instead of Rules?

Most AI coding agents use **hard rules** to enforce discipline: iron laws, hard gates, rationalization blockers. This works — but we found it has limits.

When you force an LLM with "you MUST do X" and "you MUST NOT do Y", the model follows the letter but misses the spirit. It checks boxes without understanding why. The result looks correct but feels mechanical.

**Chinese philosophy offers a different approach:** instead of constraining behavior from the outside, it shapes how the agent *thinks* from the inside. An agent that truly understands why tests matter will write them naturally — no iron law needed.

This project is deeply inspired by [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent. We are grateful for its foundational concepts and workflow design. BitFrog builds on that foundation by replacing external constraints with philosophical thinking models — not because rules are wrong, but because we believe understanding runs deeper than compliance.

## Install

**Via VS Code Marketplace:**
Search "BitFrog Copilot" in Extensions → Install

**Via Agent Plugin:**
Extensions sidebar → Agent Plugins → Search "bitfrog-copilot"

## Agents

| Agent | Role | Philosophy |
|-------|------|-----------|
| **@bitfrog** | Main router | Diagnose intent before routing |
| **@bitfrog-brainstorm** | Explore & design | 格物致知 — understand the real problem before proposing solutions |
| **@bitfrog-plan** | Map dependencies & decompose tasks | 格物 + 辨证 — scout the terrain, then plan |
| **@bitfrog-execute** | TDD implementation | 知行合一 — if you know you should write tests, write them |
| **@bitfrog-debug** | Diagnose & fix | 辨证论治 — diagnose the root level, then treat |
| **@bitfrog-review** | Two-phase review & completion | 三省吾身 — self-reflect, peer-reflect, user-reflect |
| **@bitfrog-mentor** | Guided learning | 格物致知 as a process — guide, don't tell |
| **@bitfrog-ui-design** | UX research | Understand the user's real need before designing the interface |

## Philosophy

Five principles drive all BitFrog agents (see `bitfrog-philosophy.md`):

**Meta-principle: 中庸之道** — Every action has a right measure. Too much is as bad as too little. This is not "find the middle ground" — it is the judgment to know what is *enough* in each specific situation.

**Core:**
1. **格物致知** — Investigate the true nature of things before acting. The user may not know what they really need.
2. **知行合一** — Knowing and doing are inseparable. If you skip what you know you should do, you don't truly know it.
3. **辨证论治** — The same symptom can have different root causes. Diagnose the level of the problem before choosing a fix.

**Collaboration:**
4. **阴阳互生** — Each agent does its own job while staying aware of the whole system.
5. **三省吾身** — Quality comes from reflecting on your thinking process, not from checking boxes.

### Why Not Just Use Rules?

| Rules-based (external constraint) | Philosophy-based (internal drive) |
|----------------------------------|----------------------------------|
| "You MUST write tests" | Agent understands *why* tests matter → writes them naturally |
| "You MUST NOT skip root cause analysis" | Agent understands that treating symptoms creates more problems |
| Lists 11 excuses and blocks them | When understanding is deep, excuses don't arise |
| Checklist: ✅ / ❌ | Reflection: "Is my thinking process right?" |
| Finds the optimal solution | Finds the *appropriate* solution for this context |

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

## Acknowledgments

BitFrog Copilot is inspired by [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent. The workflow structure, skill-based architecture, and many foundational concepts originate from that project. We are grateful for the open-source foundation it provides.

## License

MIT

---

*BitFrog Copilot is part of the [BitFrog](https://github.com/rainyulei) product family.*
