# Superpower Copilot v1.0.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish UX, add comprehensive tests, and prepare for VS Code Marketplace release — making Superpower Copilot production-ready.

**Architecture:** Builds on v0.4.0 (all 9 skills implemented). Adds: welcome/help UX, follow-up buttons for workflow chaining, error boundaries, ESLint config, integration test suite, Marketplace packaging (README, icon, CI/CD, .vscodeignore, CHANGELOG).

**Tech Stack:** TypeScript 5.x, VS Code Extension API (^1.96), esbuild, Mocha + @vscode/test-electron, ESLint 9, GitHub Actions, vsce

**Prerequisites:** v0.4.0 complete — superpower-copilot/ with 9 registered skills, participant handler, router, tools, session state.

---

### Task 1: Add ESLint Configuration

**Files:**
- Create: `superpower-copilot/eslint.config.mjs`
- Modify: `superpower-copilot/package.json`

**Step 1: Write the ESLint flat config**

```javascript
// eslint.config.mjs
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['dist/', 'out/', 'node_modules/', '*.js', 'test/'],
  }
);
```

**Step 2: Install ESLint dependencies**

```bash
cd superpower-copilot && npm install --save-dev @eslint/js typescript-eslint
```

**Step 3: Run lint and fix any issues**

```bash
cd superpower-copilot && npx eslint src/
```

Expected: Either passes clean, or reports fixable issues.

**Step 4: Fix lint errors if any**

Address any reported issues. Common fixes: unused imports, missing type annotations.

**Step 5: Commit**

```bash
git add superpower-copilot/eslint.config.mjs superpower-copilot/package.json superpower-copilot/package-lock.json
git commit -m "chore: add ESLint flat config with TypeScript rules"
```

---

### Task 2: Implement Welcome Message and Help Command

**Files:**
- Create: `superpower-copilot/src/welcome.ts`
- Create: `superpower-copilot/test/unit/welcome.test.ts`
- Modify: `superpower-copilot/src/participant.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/welcome.test.ts
import * as assert from 'assert';
import { getWelcomeMessage, getHelpMessage, getSkillSummaries } from '../../src/welcome';

describe('Welcome & Help', () => {
  it('should return welcome message with extension name', () => {
    const msg = getWelcomeMessage();
    assert.ok(msg.includes('Superpower Copilot'));
  });

  it('should return welcome message with getting started hint', () => {
    const msg = getWelcomeMessage();
    assert.ok(msg.includes('/brainstorm'));
  });

  it('should return help message with all 9 commands', () => {
    const msg = getHelpMessage();
    assert.ok(msg.includes('/brainstorm'));
    assert.ok(msg.includes('/plan'));
    assert.ok(msg.includes('/execute'));
    assert.ok(msg.includes('/verify'));
    assert.ok(msg.includes('/finish'));
    assert.ok(msg.includes('/tdd'));
    assert.ok(msg.includes('/debug'));
    assert.ok(msg.includes('/review'));
    assert.ok(msg.includes('/respond'));
  });

  it('should return help with workflow chaining info', () => {
    const msg = getHelpMessage();
    assert.ok(msg.includes('brainstorm → plan → execute → verify → finish'));
  });

  it('should return skill summaries as array of 9', () => {
    const summaries = getSkillSummaries();
    assert.strictEqual(summaries.length, 9);
    assert.ok(summaries.every(s => s.id && s.name && s.oneLiner));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/welcome.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement welcome.ts**

```typescript
// src/welcome.ts

export interface SkillSummary {
  id: string;
  name: string;
  command: string;
  oneLiner: string;
}

const SKILL_SUMMARIES: SkillSummary[] = [
  { id: 'brainstorm', name: 'Brainstorming', command: '/brainstorm', oneLiner: 'Explore ideas and design before coding' },
  { id: 'plan', name: 'Writing Plans', command: '/plan', oneLiner: 'Create step-by-step implementation plans' },
  { id: 'execute', name: 'Executing Plans', command: '/execute', oneLiner: 'Execute plans in batches of 3 tasks' },
  { id: 'verify', name: 'Verification', command: '/verify', oneLiner: 'Verify claims with fresh evidence' },
  { id: 'finish', name: 'Finish Branch', command: '/finish', oneLiner: 'Merge, PR, keep, or discard branch' },
  { id: 'tdd', name: 'TDD', command: '/tdd', oneLiner: 'Red → Green → Refactor cycle' },
  { id: 'debug', name: 'Debugging', command: '/debug', oneLiner: 'Systematic root-cause analysis' },
  { id: 'review', name: 'Code Review', command: '/review', oneLiner: 'Structured code review with severity ratings' },
  { id: 'respond', name: 'Review Response', command: '/respond', oneLiner: 'Process review feedback with technical rigor' },
];

export function getSkillSummaries(): SkillSummary[] {
  return SKILL_SUMMARIES;
}

export function getWelcomeMessage(): string {
  return `# 👋 Welcome to Superpower Copilot!

Structured development workflows for GitHub Copilot Chat.

**Quick start:** Try \`@superpower /brainstorm\` to explore an idea, or \`@superpower /tdd\` to start a TDD cycle.

Type \`@superpower /help\` to see all available commands.`;
}

export function getHelpMessage(): string {
  const skillList = SKILL_SUMMARIES
    .map(s => `- **\`${s.command}\`** — ${s.oneLiner}`)
    .join('\n');

  return `# Superpower Copilot — Commands

${skillList}

## Workflow Chaining

\`\`\`
brainstorm → plan → execute → verify → finish
                                 ↑
              tdd ──────────────┘
              debug ────────────┘
              review → respond → verify
\`\`\`

All skills can be used independently. Follow-up buttons suggest the next step.

**Tip:** You can also just describe what you need — smart routing will pick the right skill.`;
}
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/welcome.test.ts --require ts-node/register
```

Expected: 5 tests PASS.

**Step 5: Wire into participant handler**

In `superpower-copilot/src/participant.ts`, add help command handling. At the top, add import:

```typescript
import { getWelcomeMessage, getHelpMessage } from './welcome';
```

In the `handleRequest` method, before routing, add:

```typescript
// Handle /help command
if (request.command === 'help') {
  stream.markdown(getHelpMessage());
  return { metadata: { skillId: 'help' } };
}

// Show welcome on empty first message
if (!request.prompt.trim() && chatContext.history.length === 0) {
  stream.markdown(getWelcomeMessage());
  return { metadata: { skillId: 'welcome' } };
}
```

Also add the help command to `package.json` contributes:

```json
{ "name": "help", "description": "Show all available commands and workflows" }
```

**Step 6: Verify build**

```bash
cd superpower-copilot && npm run compile
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
git add src/welcome.ts test/unit/welcome.test.ts src/participant.ts package.json
git commit -m "feat: add welcome message and /help command with all 9 skills listed"
```

---

### Task 3: Add Follow-Up Buttons for Workflow Chaining

**Files:**
- Create: `superpower-copilot/src/followups.ts`
- Create: `superpower-copilot/test/unit/followups.test.ts`
- Modify: `superpower-copilot/src/participant.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/followups.test.ts
import * as assert from 'assert';
import { getFollowUps } from '../../src/followups';

describe('FollowUps', () => {
  it('should suggest plan after brainstorm', () => {
    const followups = getFollowUps('brainstorm');
    assert.ok(followups.some(f => f.command === 'plan'));
  });

  it('should suggest execute after plan', () => {
    const followups = getFollowUps('plan');
    assert.ok(followups.some(f => f.command === 'execute'));
  });

  it('should suggest verify after execute', () => {
    const followups = getFollowUps('execute');
    assert.ok(followups.some(f => f.command === 'verify'));
  });

  it('should suggest finish after verify', () => {
    const followups = getFollowUps('verify');
    assert.ok(followups.some(f => f.command === 'finish'));
  });

  it('should suggest respond after review', () => {
    const followups = getFollowUps('review');
    assert.ok(followups.some(f => f.command === 'respond'));
  });

  it('should suggest verify after respond', () => {
    const followups = getFollowUps('respond');
    assert.ok(followups.some(f => f.command === 'verify'));
  });

  it('should suggest verify after tdd', () => {
    const followups = getFollowUps('tdd');
    assert.ok(followups.some(f => f.command === 'verify'));
  });

  it('should suggest verify after debug', () => {
    const followups = getFollowUps('debug');
    assert.ok(followups.some(f => f.command === 'verify'));
  });

  it('should return empty for finish', () => {
    const followups = getFollowUps('finish');
    assert.strictEqual(followups.length, 0);
  });

  it('should return empty for unknown skill', () => {
    const followups = getFollowUps('unknown');
    assert.strictEqual(followups.length, 0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/followups.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement followups.ts**

```typescript
// src/followups.ts

export interface FollowUp {
  command: string;
  label: string;
  message: string;
}

const WORKFLOW_CHAIN: Record<string, FollowUp[]> = {
  brainstorm: [
    { command: 'plan', label: '📝 Create Implementation Plan', message: '@superpower /plan' },
  ],
  plan: [
    { command: 'execute', label: '🚀 Execute Plan', message: '@superpower /execute' },
  ],
  execute: [
    { command: 'verify', label: '✅ Verify Results', message: '@superpower /verify' },
  ],
  verify: [
    { command: 'finish', label: '🏁 Finish Branch', message: '@superpower /finish' },
  ],
  finish: [],
  tdd: [
    { command: 'verify', label: '✅ Verify Results', message: '@superpower /verify' },
  ],
  debug: [
    { command: 'verify', label: '✅ Verify Fix', message: '@superpower /verify' },
  ],
  review: [
    { command: 'respond', label: '💬 Address Feedback', message: '@superpower /respond' },
  ],
  respond: [
    { command: 'verify', label: '✅ Verify Changes', message: '@superpower /verify' },
  ],
};

export function getFollowUps(skillId: string): FollowUp[] {
  return WORKFLOW_CHAIN[skillId] ?? [];
}
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/followups.test.ts --require ts-node/register
```

Expected: 10 tests PASS.

**Step 5: Wire into participant handler**

In `superpower-copilot/src/participant.ts`, add follow-up provider. Add import:

```typescript
import { getFollowUps } from './followups';
```

In the participant registration (inside `extension.ts` or `participant.ts` where the participant is created), register a follow-up provider:

```typescript
participant.followupProvider = {
  provideFollowups(result: vscode.ChatResult, _context, _token) {
    const skillId = result.metadata?.skillId as string | undefined;
    const nextSkill = result.metadata?.nextSkill as string | undefined;

    // Use explicit nextSkill from SkillResult if available
    const targetId = nextSkill ?? skillId;
    if (!targetId) return [];

    const followups = getFollowUps(nextSkill ? targetId : skillId ?? '');
    return followups.map(f => ({
      command: f.command,
      label: f.label,
      message: f.message,
    }));
  },
};
```

**Step 6: Verify build**

```bash
cd superpower-copilot && npm run compile
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
git add src/followups.ts test/unit/followups.test.ts src/participant.ts src/extension.ts
git commit -m "feat: add follow-up buttons for workflow chaining between skills"
```

---

### Task 4: Add Error Boundaries and User-Friendly Error Handling

**Files:**
- Create: `superpower-copilot/src/errors.ts`
- Create: `superpower-copilot/test/unit/errors.test.ts`
- Modify: `superpower-copilot/src/participant.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/errors.test.ts
import * as assert from 'assert';
import { formatUserError, isRecoverableError, ErrorCategory } from '../../src/errors';

describe('Error Handling', () => {
  it('should categorize model unavailable error', () => {
    const err = new Error('Model is not available');
    const result = formatUserError(err);
    assert.strictEqual(result.category, ErrorCategory.ModelUnavailable);
  });

  it('should categorize cancellation error', () => {
    const err = new Error('Request was cancelled');
    err.name = 'CancellationError';
    const result = formatUserError(err);
    assert.strictEqual(result.category, ErrorCategory.Cancelled);
  });

  it('should categorize git errors', () => {
    const err = new Error('fatal: not a git repository');
    const result = formatUserError(err);
    assert.strictEqual(result.category, ErrorCategory.GitError);
  });

  it('should provide user-friendly message', () => {
    const err = new Error('Model is not available');
    const result = formatUserError(err);
    assert.ok(result.userMessage.length > 0);
    assert.ok(!result.userMessage.includes('stack'));
  });

  it('should identify recoverable errors', () => {
    assert.ok(isRecoverableError(ErrorCategory.ModelUnavailable));
    assert.ok(!isRecoverableError(ErrorCategory.Cancelled));
  });

  it('should categorize unknown errors as internal', () => {
    const err = new Error('something weird happened');
    const result = formatUserError(err);
    assert.strictEqual(result.category, ErrorCategory.Internal);
  });

  it('should include retry hint for recoverable errors', () => {
    const err = new Error('Model is not available');
    const result = formatUserError(err);
    assert.ok(result.userMessage.includes('retry') || result.userMessage.includes('try again'));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/errors.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement errors.ts**

```typescript
// src/errors.ts

export enum ErrorCategory {
  ModelUnavailable = 'model_unavailable',
  Cancelled = 'cancelled',
  GitError = 'git_error',
  FileError = 'file_error',
  ToolError = 'tool_error',
  Internal = 'internal',
}

interface UserError {
  category: ErrorCategory;
  userMessage: string;
  technical: string;
}

const ERROR_PATTERNS: Array<{ test: (err: Error) => boolean; category: ErrorCategory; message: string }> = [
  {
    test: (err) => err.name === 'CancellationError' || /cancel/i.test(err.message),
    category: ErrorCategory.Cancelled,
    message: 'Request cancelled.',
  },
  {
    test: (err) => /model.*not.*available|no.*model/i.test(err.message),
    category: ErrorCategory.ModelUnavailable,
    message: '⚠️ Language model is not available. Please ensure GitHub Copilot is active and try again.',
  },
  {
    test: (err) => /fatal:.*git|not a git repository/i.test(err.message),
    category: ErrorCategory.GitError,
    message: '⚠️ Git error — this workspace may not be a git repository. Some features require git.',
  },
  {
    test: (err) => /ENOENT|file.*not.*found|no such file/i.test(err.message),
    category: ErrorCategory.FileError,
    message: '⚠️ File not found. Please check the file path and try again.',
  },
  {
    test: (err) => /command.*failed|exit code/i.test(err.message),
    category: ErrorCategory.ToolError,
    message: '⚠️ A tool command failed. Check the terminal output for details and try again.',
  },
];

export function formatUserError(err: Error): UserError {
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(err)) {
      return {
        category: pattern.category,
        userMessage: pattern.message,
        technical: err.message,
      };
    }
  }

  return {
    category: ErrorCategory.Internal,
    userMessage: `⚠️ Something went wrong. Please try again or report this issue.\n\n\`${err.message}\``,
    technical: err.message,
  };
}

export function isRecoverableError(category: ErrorCategory): boolean {
  return category === ErrorCategory.ModelUnavailable
    || category === ErrorCategory.ToolError
    || category === ErrorCategory.FileError;
}
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/errors.test.ts --require ts-node/register
```

Expected: 7 tests PASS.

**Step 5: Wrap participant handler with error boundary**

In `superpower-copilot/src/participant.ts`, import error utilities:

```typescript
import { formatUserError, ErrorCategory } from './errors';
```

Wrap the main `handleRequest` body in try/catch:

```typescript
async handleRequest(
  request: vscode.ChatRequest,
  chatContext: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<vscode.ChatResult> {
  try {
    // ... existing routing and skill handling logic ...
  } catch (err) {
    if (err instanceof Error) {
      const userErr = formatUserError(err);
      if (userErr.category === ErrorCategory.Cancelled) {
        return { metadata: { skillId: 'cancelled' } };
      }
      stream.markdown(userErr.userMessage);
      return { metadata: { skillId: 'error', error: userErr.category } };
    }
    stream.markdown('⚠️ An unexpected error occurred.');
    return { metadata: { skillId: 'error' } };
  }
}
```

**Step 6: Verify build**

```bash
cd superpower-copilot && npm run compile
```

Expected: Build succeeds.

**Step 7: Commit**

```bash
git add src/errors.ts test/unit/errors.test.ts src/participant.ts
git commit -m "feat: add error boundaries with user-friendly error messages"
```

---

### Task 5: Add History Module for Cross-Turn Context

**Files:**
- Create: `superpower-copilot/src/state/history.ts`
- Create: `superpower-copilot/test/unit/history.test.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/history.test.ts
import * as assert from 'assert';
import { HistoryParser } from '../../src/state/history';

describe('HistoryParser', () => {
  it('should extract last active skill from metadata', () => {
    const mockHistory = [
      { type: 'response', metadata: { skillId: 'brainstorm' } },
      { type: 'response', metadata: { skillId: 'plan' } },
    ];
    const parser = new HistoryParser();
    const lastSkill = parser.getLastActiveSkill(mockHistory as any);
    assert.strictEqual(lastSkill, 'plan');
  });

  it('should return undefined for empty history', () => {
    const parser = new HistoryParser();
    const lastSkill = parser.getLastActiveSkill([]);
    assert.strictEqual(lastSkill, undefined);
  });

  it('should extract last phase from metadata', () => {
    const mockHistory = [
      { type: 'response', metadata: { skillId: 'brainstorm', phase: 'design' } },
    ];
    const parser = new HistoryParser();
    const phase = parser.getLastPhase(mockHistory as any);
    assert.strictEqual(phase, 'design');
  });

  it('should count turns per skill', () => {
    const mockHistory = [
      { type: 'response', metadata: { skillId: 'brainstorm' } },
      { type: 'response', metadata: { skillId: 'brainstorm' } },
      { type: 'response', metadata: { skillId: 'plan' } },
    ];
    const parser = new HistoryParser();
    const counts = parser.getTurnCounts(mockHistory as any);
    assert.strictEqual(counts.get('brainstorm'), 2);
    assert.strictEqual(counts.get('plan'), 1);
  });

  it('should detect if currently in a skill session', () => {
    const mockHistory = [
      { type: 'response', metadata: { skillId: 'tdd' } },
    ];
    const parser = new HistoryParser();
    assert.ok(parser.isInSession(mockHistory as any));
  });

  it('should detect no session for empty history', () => {
    const parser = new HistoryParser();
    assert.ok(!parser.isInSession([]));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/history.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement history.ts**

```typescript
// src/state/history.ts

interface HistoryEntry {
  type: string;
  metadata?: Record<string, unknown>;
}

export class HistoryParser {
  getLastActiveSkill(history: HistoryEntry[]): string | undefined {
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i];
      if (entry.type === 'response' && entry.metadata?.skillId) {
        return entry.metadata.skillId as string;
      }
    }
    return undefined;
  }

  getLastPhase(history: HistoryEntry[]): string | undefined {
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i];
      if (entry.type === 'response' && entry.metadata?.phase) {
        return entry.metadata.phase as string;
      }
    }
    return undefined;
  }

  getTurnCounts(history: HistoryEntry[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const entry of history) {
      if (entry.type === 'response' && entry.metadata?.skillId) {
        const id = entry.metadata.skillId as string;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return counts;
  }

  isInSession(history: HistoryEntry[]): boolean {
    return this.getLastActiveSkill(history) !== undefined;
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/history.test.ts --require ts-node/register
```

Expected: 6 tests PASS.

**Step 5: Commit**

```bash
git add src/state/history.ts test/unit/history.test.ts
git commit -m "feat: add HistoryParser for cross-turn context tracking"
```

---

### Task 6: Create README.md for Marketplace

**Files:**
- Create: `superpower-copilot/README.md`

**Step 1: Write README**

```markdown
# Superpower Copilot

> Structured development workflows for GitHub Copilot Chat

Superpower Copilot adds 9 disciplined development skills to GitHub Copilot Chat, turning it into a structured development partner that follows proven methodologies like TDD, systematic debugging, and evidence-based verification.

## Features

### 🧠 Brainstorming (`/brainstorm`)
Explore ideas collaboratively — one question at a time, multiple choice where possible. Get a validated design before writing any code.

### 📝 Writing Plans (`/plan`)
Create step-by-step implementation plans with exact file paths, complete code, and test-first approach. Every step is one action (2-5 minutes).

### 🚀 Executing Plans (`/execute`)
Execute plans in batches of 3 tasks with verification checkpoints. Stops immediately on blockers or failures.

### ✅ Verification (`/verify`)
Evidence-based verification — no completion claims without fresh proof. Runs commands, checks output, confirms results.

### 🏁 Finish Branch (`/finish`)
Structured branch completion: merge, create PR, keep as-is, or discard. Runs tests first — won't proceed if they fail.

### 🔴 TDD (`/tdd`)
Strict Red → Green → Refactor cycle. No production code without a failing test first.

### 🔍 Debugging (`/debug`)
Systematic root-cause analysis. No fixes without investigation — read errors, find patterns, form hypotheses, verify fixes.

### 📋 Code Review (`/review`)
Structured code review with severity categories: 🔴 Critical / 🟡 Important / 💡 Minor. Includes file:line references and clear verdicts.

### 💬 Review Response (`/respond`)
Process review feedback with technical rigor — verify before implementing, push back when suggestions are wrong.

## Usage

```
@superpower /brainstorm I want to build a task management system
@superpower /tdd Let's implement the user model
@superpower /debug The login endpoint returns 500
@superpower /review Check my recent changes
```

You can also describe your need naturally — smart routing picks the right skill:

```
@superpower 帮我找出这个 bug
@superpower 最近改的代码质量怎么样
```

## Workflow

```
brainstorm → plan → execute → verify → finish
                                 ↑
              tdd ──────────────┘
              debug ────────────┘
              review → respond → verify
```

All skills work independently. Follow-up buttons suggest the next step.

## Requirements

- VS Code 1.96+
- GitHub Copilot Chat extension

## License

MIT
```

**Step 2: Verify the file renders correctly**

Open the README in VS Code preview to visually check formatting.

**Step 3: Commit**

```bash
git add superpower-copilot/README.md
git commit -m "docs: add README.md for Marketplace listing"
```

---

### Task 7: Add Extension Icon and .vscodeignore

**Files:**
- Create: `superpower-copilot/icon.png` (generate or use placeholder)
- Create: `superpower-copilot/.vscodeignore`
- Modify: `superpower-copilot/package.json`

**Step 1: Create .vscodeignore**

```
.vscode/**
src/**
test/**
node_modules/**
.mocharc.json
tsconfig.json
tsconfig.test.json
esbuild.js
eslint.config.mjs
.gitignore
**/*.ts
**/*.map
```

**Step 2: Add icon reference to package.json**

In `superpower-copilot/package.json`, add at top level:

```json
"icon": "icon.png"
```

**Step 3: Create a placeholder icon**

Generate a simple 128x128 PNG icon. Use a blue/purple gradient with a lightning bolt or star symbol. For now, create a minimal SVG converted to PNG, or use a placeholder:

```bash
cd superpower-copilot
# Create a simple placeholder - will be replaced with designed icon
convert -size 128x128 xc:'#6366f1' -fill white -font Helvetica-Bold -pointsize 48 -gravity center -annotate 0 'SP' icon.png 2>/dev/null || echo "Install ImageMagick or manually create icon.png (128x128 PNG)"
```

If ImageMagick is not available, create the icon manually: 128x128 PNG with purple (#6366F1) background and white "SP" text.

**Step 4: Verify package**

```bash
cd superpower-copilot && npx vsce ls
```

Expected: Lists files that will be included in the VSIX. Should NOT include src/, test/, node_modules/.

**Step 5: Commit**

```bash
git add superpower-copilot/.vscodeignore superpower-copilot/package.json superpower-copilot/icon.png
git commit -m "chore: add .vscodeignore and extension icon for Marketplace packaging"
```

---

### Task 8: Add CHANGELOG.md

**Files:**
- Create: `superpower-copilot/CHANGELOG.md`

**Step 1: Write CHANGELOG**

```markdown
# Changelog

All notable changes to Superpower Copilot will be documented in this file.

## [1.0.0] — 2026-02-19

### Added
- 9 structured development workflow skills for GitHub Copilot Chat
- **Brainstorming** (`/brainstorm`) — collaborative design exploration
- **Writing Plans** (`/plan`) — step-by-step implementation plans with TDD
- **Executing Plans** (`/execute`) — batch execution with verification checkpoints
- **Verification** (`/verify`) — evidence-based completion verification
- **Finish Branch** (`/finish`) — structured branch completion (merge/PR/keep/discard)
- **TDD** (`/tdd`) — strict Red → Green → Refactor cycle
- **Debugging** (`/debug`) — systematic root-cause analysis
- **Code Review** (`/review`) — severity-categorized code review
- **Review Response** (`/respond`) — rigorous review feedback processing
- Smart routing: natural language → skill matching (keyword + LLM)
- Workflow chaining with follow-up buttons
- Welcome message and `/help` command
- User-friendly error handling
- Chinese and English language support for routing
```

**Step 2: Commit**

```bash
git add superpower-copilot/CHANGELOG.md
git commit -m "docs: add CHANGELOG.md for v1.0.0"
```

---

### Task 9: Add GitHub Actions CI/CD Pipeline

**Files:**
- Create: `superpower-copilot/.github/workflows/ci.yml`
- Create: `superpower-copilot/.github/workflows/publish.yml`

**Step 1: Create CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci
        working-directory: superpower-copilot

      - name: Lint
        run: npm run lint
        working-directory: superpower-copilot

      - name: Build
        run: npm run compile
        working-directory: superpower-copilot

      - name: Unit Tests
        run: npx mocha 'test/unit/**/*.test.ts' --require ts-node/register
        working-directory: superpower-copilot

      - name: Package
        run: npx vsce package --no-dependencies
        working-directory: superpower-copilot
```

**Step 2: Create publish workflow**

```yaml
# .github/workflows/publish.yml
name: Publish

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci
        working-directory: superpower-copilot

      - name: Build
        run: npm run compile
        working-directory: superpower-copilot

      - name: Unit Tests
        run: npx mocha 'test/unit/**/*.test.ts' --require ts-node/register
        working-directory: superpower-copilot

      - name: Publish to Marketplace
        run: npx vsce publish --no-dependencies
        working-directory: superpower-copilot
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
```

**Step 3: Commit**

```bash
mkdir -p superpower-copilot/.github/workflows
git add superpower-copilot/.github/workflows/ci.yml superpower-copilot/.github/workflows/publish.yml
git commit -m "ci: add GitHub Actions for CI and Marketplace publishing"
```

---

### Task 10: Final Integration Verification and v1.0.0 Tag

**Files:**
- Modify: `superpower-copilot/package.json` (bump to 1.0.0)

**Step 1: Bump version to 1.0.0**

In `superpower-copilot/package.json`, change `"version"` to `"1.0.0"`.

**Step 2: Run full lint**

```bash
cd superpower-copilot && npx eslint src/
```

Expected: No errors.

**Step 3: Run full build**

```bash
cd superpower-copilot && npm run compile
```

Expected: Build succeeds.

**Step 4: Run all unit tests**

```bash
cd superpower-copilot && npx mocha 'test/unit/**/*.test.ts' --require ts-node/register
```

Expected: All tests pass (should be ~120+ total across all skills).

**Step 5: Package VSIX**

```bash
cd superpower-copilot && npx vsce package --no-dependencies
```

Expected: Creates `superpower-copilot-1.0.0.vsix` file.

**Step 6: Verify VSIX contents**

```bash
cd superpower-copilot && npx vsce ls
```

Expected: Lists dist/extension.js, package.json, README.md, CHANGELOG.md, icon.png, LICENSE. Does NOT include src/, test/, node_modules/.

**Step 7: Commit and tag**

```bash
git add superpower-copilot/package.json
git commit -m "release: bump version to 1.0.0 — all 9 skills, full tests, Marketplace ready"
git tag v1.0.0
```

---

## Summary

| Task | Description | New Tests |
|------|-------------|-----------|
| 1 | ESLint configuration | — |
| 2 | Welcome message + /help | 5 |
| 3 | Follow-up buttons for workflow chaining | 10 |
| 4 | Error boundaries | 7 |
| 5 | History module | 6 |
| 6 | README.md | — |
| 7 | Icon + .vscodeignore | — |
| 8 | CHANGELOG.md | — |
| 9 | GitHub Actions CI/CD | — |
| 10 | Final verification + v1.0.0 tag | — |

**Total new tests:** ~28
**Total estimated tests at v1.0.0:** ~120+

## Execution Options

Plan complete and saved to `docs/plans/2026-02-19-superpower-copilot-v1.0.0-plan.md`.

**1. Subagent-Driven (this session)** — Dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints
