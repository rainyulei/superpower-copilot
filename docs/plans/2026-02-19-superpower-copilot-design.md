# Superpower Copilot — Design Document

**Date**: 2026-02-19
**Status**: Approved

## Goal

Build a VS Code Extension published to the Marketplace that registers a `@superpower` Chat Participant in GitHub Copilot Chat, providing 9 structured development workflow skills.

## Architecture: Pure Chat Participant (Approach A)

Single VS Code Extension, one Chat Participant, all skills implemented in TypeScript. No MCP Server for v1.

```
superpower-copilot/
├── .vscode/
│   └── launch.json
├── src/
│   ├── extension.ts              ← Entry: register participant + commands
│   ├── participant.ts            ← Chat handler orchestration
│   ├── router.ts                 ← Natural language → skill matching
│   ├── skills/
│   │   ├── types.ts              ← Skill interface definition
│   │   ├── registry.ts           ← Skill registry
│   │   ├── brainstorming.ts
│   │   ├── writing-plans.ts
│   │   ├── executing-plans.ts
│   │   ├── tdd.ts
│   │   ├── debugging.ts
│   │   ├── code-review-request.ts
│   │   ├── code-review-receive.ts
│   │   ├── verification.ts
│   │   └── finish-branch.ts
│   ├── tools/
│   │   ├── files.ts              ← File read/write via vscode.workspace.fs
│   │   ├── git.ts                ← Git operations via built-in git extension
│   │   ├── terminal.ts           ← Shell command execution
│   │   └── workspace.ts          ← Workspace info gathering
│   └── state/
│       ├── session.ts            ← Per-skill execution state
│       └── history.ts            ← Cross-turn conversation history
├── test/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
└── README.md
```

## Tech Stack

- TypeScript 5.x
- VS Code Extension API (`@types/vscode` ^1.96)
- `@vscode/chat-extensions-utils`
- esbuild (bundler)
- Mocha + `@vscode/test-electron` (testing)

## Skill Interface

```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  systemPrompt: string;
  handle(ctx: SkillContext): Promise<SkillResult>;
}

interface SkillResult {
  nextSkill?: string;       // Workflow chaining
  metadata?: Record<string, unknown>;
}

interface SkillContext {
  request: vscode.ChatRequest;
  chatContext: vscode.ChatContext;
  stream: vscode.ChatResponseStream;
  token: vscode.CancellationToken;
  model: vscode.LanguageModelChat;
  session: SessionState;
  tools: ToolKit;
}
```

## Routing

Three-tier routing strategy:

| Tier | Method | Latency | Example |
|------|--------|---------|---------|
| 0 | Slash command | 0ms | `@superpower /tdd` → TDD directly |
| 1 | Keyword matching | ~1ms | "找 bug" → debugging |
| 2 | LLM classification | ~500ms | "最近改的代码质量怎么样" → code-review |

Fallback: `brainstorm` (most general entry point).

## 9 Skills Design

### 1. Brainstorming (`/brainstorm`)

**Phases**: explore → approach → design → complete

- One question at a time, prefer multiple choice
- NEVER write code until design approved
- Propose 2-3 approaches with trade-offs
- Present design section by section, get approval after each
- Output: design doc to `docs/plans/`
- Next: `plan`

### 2. Writing Plans (`/plan`)

**Phases**: analyze → decompose → write → complete

- Each step is ONE action (2-5 minutes)
- Every task MUST include exact file paths and complete code
- Each task follows: write test → run → implement → verify → commit
- Assume zero codebase knowledge
- Apply DRY, YAGNI, TDD
- Output: `docs/plans/YYYY-MM-DD-<topic>-plan.md`
- Next: `execute`

### 3. Executing Plans (`/execute`)

**Phases**: load → batch(3) → verify-batch → next-or-done

- Execute in batches of 3 tasks
- STOP immediately on: blocker, plan gaps, verification failure
- Report after each batch with verification output
- Wait for user feedback before next batch
- Next: `verify`

### 4. TDD (`/tdd`)

**Phases**: understand → red → green → refactor → next

- **Iron Law**: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
- If code written before test: DELETE IT and start over
- Must WATCH test fail before writing implementation
- Write minimal code to pass, no more
- Cycle: red → green → refactor → repeat

### 5. Systematic Debugging (`/debug`)

**Phases**: root-cause → pattern → hypothesis → implement

- **Iron Law**: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
- Phase 1: Read errors completely, reproduce consistently, check recent changes
- Phase 2: Find working examples, compare working vs broken
- Phase 3: Form single hypothesis, test minimally
- Phase 4: Create failing test, implement single fix, verify
- 3+ failed fixes → STOP and question architecture

### 6. Code Review Request (`/review`)

**Phases**: gather → analyze → report

- Collect git diff, changed files, related tests
- Analyze by dimension: correctness, security, performance, readability, test coverage
- Output structured report with severity: 🔴 Critical / 🟡 Warning / 💡 Suggestion
- Critical: fix immediately. Important: fix before proceeding. Minor: note for later.

### 7. Code Review Receive (`/respond`)

**Phases**: read → understand → verify → evaluate → implement

- NEVER: "You're absolutely right!", "Great point!" (anti-pattern)
- Verify reviewer suggestions against codebase reality BEFORE implementing
- Push back when: breaks functionality, reviewer lacks context, violates YAGNI
- Implement one item at a time, test each individually

### 8. Verification (`/verify`)

**Phases**: identify → run → read → verify → claim

- **Iron Law**: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
- IDENTIFY: What command proves this claim?
- RUN: Execute the FULL command (fresh, complete)
- READ: Full output, check exit code, count failures
- VERIFY: Does output confirm the claim?
- ONLY THEN: Make the claim
- Forbidden words: "should", "probably", "seems to"

### 9. Finish Branch (`/finish`)

**Phases**: status → options → execute

- Run test suite first. If fails → STOP
- Present exactly 4 options:
  1. Merge back to base branch
  2. Push and create PR
  3. Keep branch as-is
  4. Discard (requires typed "discard" confirmation)
- NEVER force-push without explicit request
- Clean up worktree for options 1 & 4

## Workflow Chaining

```
brainstorm → plan → execute → verify → finish
                                 ↑
              tdd ──────────────┘
              debug ────────────┘
              review → respond → verify
```

All skills can be used independently. Chaining via follow-up buttons (non-mandatory).

## State Management

- **In-session**: `SessionState` class with per-skill namespaced `get/set`
- **Cross-turn**: `chatContext.history` for conversation continuity
- **Persistent**: `context.workspaceState` (vscode.Memento) for cross-session data
- **Inter-skill**: `session.transfer()` for handoff data (e.g., design → plan)

## Session Restoration

```
1. Check chatContext.history for last skill's metadata
2. Restore activeSkillId and phase from workspaceState
3. If follow-up turn → continue current skill
4. If new turn → route to appropriate skill
```

## User Interaction

```
@superpower /brainstorm 我想做一个任务管理系统    ← slash command
@superpower 帮我找出这个 bug                      ← smart routing → debug
@superpower                                       ← follow-up in current skill
[📝 Create Implementation Plan]                    ← follow-up button
```

## Build & Publish

- Bundler: esbuild
- Package: `vsce package` → `.vsix`
- Publish: `vsce publish` to VS Code Marketplace
- Debug: F5 → Extension Development Host
- CI: GitHub Actions for lint + test + publish

## Version Plan

| Version | Content |
|---------|---------|
| v0.1.0 | Framework + brainstorming + writing-plans |
| v0.2.0 | + executing-plans + verification + finish-branch |
| v0.3.0 | + TDD + debugging |
| v0.4.0 | + code-review-request + code-review-receive |
| v1.0.0 | Polish UX, full tests, Marketplace release |
