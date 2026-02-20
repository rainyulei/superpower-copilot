# Superpower Copilot v2.0 — Agent.md Refactoring Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor Superpower Copilot from TypeScript Chat Participant architecture to VS Code Custom Agents (.agent.md) with superpowers-grade prompts.

**Architecture:** Lightweight VS Code extension that copies 9 `.agent.md` files to user profile on activation. All skill logic lives in markdown prompts, not TypeScript. Workflow chaining via native handoffs.

**Tech Stack:** VS Code Extension API (minimal), Custom Agents (.agent.md), YAML frontmatter, Markdown prompts

---

## 1. Architecture Overview

### Before (v1.0 — TypeScript Chat Participant)

```
Extension (~2000 LOC TypeScript)
├── participant.ts      — Chat Participant handler + routing
├── router.ts           — 3-tier routing (slash/keyword/LLM)
├── skills/*.ts         — 9 skills (each calls model.sendRequest)
├── state/session.ts    — Session state management
├── tools/index.ts      — ToolKit (files/git/terminal)
├── welcome.ts          — Welcome + help messages
├── followups.ts        — Workflow chaining
├── errors.ts           — Error boundary
└── esbuild.js          — Bundler
```

**Problems:**
- No System role in VS Code LanguageModelChatMessage API
- System prompt sent as User message → LLM doesn't follow instructions
- Complex TypeScript code for what is essentially prompt orchestration
- Manual tool implementation duplicating VS Code built-in capabilities

### After (v2.0 — Custom Agents)

```
Extension (~40 LOC TypeScript)
├── extension.ts        — Copy agents on activate, cleanup on deactivate
├── agents/             — 9 .agent.md files
│   ├── superpower-brainstorm.agent.md
│   ├── superpower-plan.agent.md
│   ├── superpower-execute.agent.md
│   ├── superpower-verify.agent.md
│   ├── superpower-finish.agent.md
│   ├── superpower-tdd.agent.md
│   ├── superpower-debug.agent.md
│   ├── superpower-review.agent.md
│   └── superpower-respond.agent.md
└── package.json        — Minimal manifest
```

**Benefits:**
- Full system prompt support (markdown body IS the system prompt)
- Built-in tools (search, read, edit, execute, web)
- Native handoffs between agents
- ~98% less TypeScript code
- Prompt-first: iterate on prompts without recompiling

## 2. Agent Naming & Workflow Chain

### Naming Convention
All agents prefixed `superpower-` to avoid collisions with user agents.

### Primary Workflow (via handoffs)

```
superpower-brainstorm
  └─ handoff → superpower-plan

superpower-plan
  └─ handoff → superpower-execute

superpower-execute
  └─ handoff → superpower-verify

superpower-verify
  ├─ handoff → superpower-finish (pass)
  └─ handoff → superpower-debug (fail)

superpower-finish
  └─ handoff → superpower-review

superpower-review
  └─ handoff → superpower-respond
```

### Standalone Entry Points (usable anytime)
- `superpower-tdd` — Independent TDD cycle
- `superpower-debug` — Independent debugging

### Tools Per Agent (Least Privilege)

| Agent | tools | Rationale |
|-------|-------|-----------|
| brainstorm | `['search', 'read', 'web']` | Research only, no modifications |
| plan | `['search', 'read', 'web', 'agent']` | Research + subagent investigation |
| execute | `['search', 'read', 'edit', 'execute', 'agent']` | Full implementation |
| verify | `['search', 'read', 'execute']` | Read + run tests only |
| finish | `['search', 'read', 'execute']` | Git operations, PR creation |
| tdd | `['search', 'read', 'edit', 'execute']` | Write tests + implement |
| debug | `['search', 'read', 'edit', 'execute']` | Diagnose + fix |
| review | `['search', 'read', 'agent']` | Analyze code, dispatch subagent |
| respond | `['search', 'read', 'edit', 'execute']` | Understand feedback + implement fixes |

## 3. Extension Lifecycle (extension.ts)

```typescript
// ~40 lines total
activate(context):
  1. Resolve user profile agents directory (platform-specific)
  2. Copy all 9 .agent.md files from extension's agents/ to profile dir
  3. Register dispose handler to cleanup files on deactivation

deactivate():
  1. Remove all 9 superpower-*.agent.md files from profile dir
```

**Platform paths:**
- macOS: `~/Library/Application Support/Code/User/agents/`
- Linux: `~/.config/Code/User/agents/`
- Windows: `%APPDATA%/Code/User/agents/`

**Edge cases:**
- If file already exists → overwrite (extension update)
- If directory doesn't exist → create recursively
- If cleanup fails → silent (user can manually delete)

## 4. Prompt Design Pattern

Every agent follows this unified template, based on superpowers quality bar:

```markdown
---
name: superpower-<name>
description: <keyword-rich, max 1024 chars>
tools: [<least-privilege tool set>]
handoffs:
  - label: <next step button>
    agent: superpower-<next>
    prompt: <pre-filled text>
    send: false
---

# <Skill Name>

## Overview
<2-3 sentence purpose>

<HARD-GATE>
<Absolute constraint that cannot be violated>
</HARD-GATE>

## The Iron Law
```
<One unbreakable rule in code block>
```

## Checklist
1. **Step name** — description
2. ...

## Process Flow
```dot
digraph { ... }
```

## The Process
### Step N: <Name>
<Detailed instructions with code examples>

## Good vs Bad Examples
<Good> ... </Good>
<Bad> ... </Bad>

## Red Flags — STOP
<Self-check signals when going off track>

## Common Rationalizations
| Excuse | Reality |
|--------|---------|
...

## Verification Checklist
- [ ] item
...

## Integration
**Hands off to:** superpower-<next>
**Called by:** superpower-<prev>
```

### Key Prompt Design Principles (from superpowers analysis):

1. **Iron Law** — Every skill has ONE non-negotiable rule in a code block
2. **HARD-GATE** — Prevents skipping phases (brainstorm must complete before plan)
3. **Anti-rationalization tables** — Preempt common LLM excuses to skip steps
4. **Red Flags** — Self-check signals: "If you're thinking X, STOP"
5. **Good/Bad examples** — Concrete code showing desired vs undesired behavior
6. **Verification Checklist** — Must verify before claiming completion
7. **Single terminal state** — Each agent has exactly ONE handoff target
8. **Dot flowcharts** — Visual process flow for complex multi-phase skills

## 5. Package.json Changes

### Remove
- `contributes.chatParticipants` — No longer a Chat Participant
- `contributes.commands` — No save commands needed
- `extensionDependencies: github.copilot-chat` — Works with any Copilot

### Keep/Add
- `activationEvents: ["onStartupFinished"]` — Copy agents on startup
- Minimal `engines.vscode` requirement

### Dependencies to Remove
- All build-time deps except basic vscode types
- esbuild (no bundle needed, extension is trivial)
- mocha, ts-node (no TypeScript skills to test)

## 6. Files to Delete

```
src/participant.ts
src/router.ts
src/skills/*.ts (all 9 + types.ts + registry.ts)
src/state/session.ts
src/state/history.ts
src/tools/index.ts
src/welcome.ts
src/followups.ts
src/errors.ts
esbuild.js
test/ (entire directory)
.mocharc.json
tsconfig.test.json
test/tsconfig-setup.js
```

## 7. Files to Create

```
agents/superpower-brainstorm.agent.md
agents/superpower-plan.agent.md
agents/superpower-execute.agent.md
agents/superpower-verify.agent.md
agents/superpower-finish.agent.md
agents/superpower-tdd.agent.md
agents/superpower-debug.agent.md
agents/superpower-review.agent.md
agents/superpower-respond.agent.md
src/extension.ts (rewrite — 40 lines)
```

## 8. Testing Strategy

Since the extension code is trivial (~40 lines of file copy), testing shifts to:

1. **Manual integration test:** Install extension → verify 9 agents appear in Copilot Chat
2. **Prompt quality test:** Invoke each agent → verify it follows the prompt correctly
3. **Handoff test:** Complete a brainstorm → verify Plan handoff button appears
4. **Cleanup test:** Uninstall extension → verify agent files removed

No unit tests needed for the extension itself.

## 9. Migration & Publishing

1. Increment version to 2.0.0 (breaking change)
2. Update README with new usage (agents, not @superpower)
3. Update CHANGELOG
4. Rebuild VSIX (tiny — just .md files + minimal JS)
5. Upload to Marketplace
6. Push to GitHub

## 10. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| User profile agents dir varies by platform | Detect via VS Code API or environment |
| Agent name collision | `superpower-` prefix |
| VS Code custom agents API changes | Markdown format is stable, low risk |
| Prompt too long for token budget | Keep each SKILL.md < 500 lines, use references for examples |
| User has older VS Code without agent support | Set minimum engine version in package.json |
