# Superpower Copilot v0.4.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add code-review-request and code-review-receive skills, completing all 9 skills and enabling `@superpower /review` and `@superpower /respond` in Copilot Chat.

**Architecture:** Two new skills following the Skill interface. Review-request gathers git diff and runs structured analysis. Review-receive processes feedback with anti-performative constraints. Both integrate into the existing participant handler.

**Tech Stack:** TypeScript 5.x, VS Code Extension API (^1.96), esbuild, Mocha. Builds on v0.3.0 codebase.

**Prerequisites:** v0.3.0 complete — superpower-copilot/ with 7 registered skills, participant handler, router, tools, session state.

---

### Task 1: Register new commands in package.json

**Files:**
- Modify: `superpower-copilot/package.json`

**Step 1: Add 2 new slash commands**

In `package.json`, locate `contributes.chatParticipants[0].commands` and add:

```json
{ "name": "review", "description": "Request structured code review on recent changes" },
{ "name": "respond", "description": "Process code review feedback with technical rigor" }
```

The full commands array should now have 9 entries.

**Step 2: Bump version to 0.4.0**

Change `"version": "0.3.0"` to `"version": "0.4.0"`.

**Step 3: Verify build**

```bash
cd superpower-copilot && npm run compile
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add superpower-copilot/package.json
git commit -m "chore: register review and respond commands for v0.4.0"
```

---

### Task 2: Implement Code Review Request Skill

**Files:**
- Create: `superpower-copilot/src/skills/code-review-request.ts`
- Create: `superpower-copilot/test/unit/code-review-request.test.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/code-review-request.test.ts
import * as assert from 'assert';
import { codeReviewRequestSkill } from '../../src/skills/code-review-request';

describe('CodeReviewRequestSkill', () => {
  it('should have correct id', () => {
    assert.strictEqual(codeReviewRequestSkill.id, 'review');
  });

  it('should have keywords for routing', () => {
    assert.ok(codeReviewRequestSkill.keywords.includes('review'));
    assert.ok(codeReviewRequestSkill.keywords.includes('审查'));
  });

  it('should detect phase transition from gather to analyze', () => {
    const result = codeReviewRequestSkill.detectPhase(
      'Reviewing the changes across 5 files. Analyzing code quality:',
      'gather'
    );
    assert.strictEqual(result, 'analyze');
  });

  it('should detect phase transition from analyze to report', () => {
    const result = codeReviewRequestSkill.detectPhase(
      '### Strengths\n- Clean separation of concerns\n### Issues\n#### Critical',
      'analyze'
    );
    assert.strictEqual(result, 'report');
  });

  it('should not transition without signal', () => {
    const result = codeReviewRequestSkill.detectPhase(
      'Collecting git diff and changed files...',
      'gather'
    );
    assert.strictEqual(result, 'gather');
  });

  it('should include severity categories in system prompt', () => {
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('Critical'));
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('Important'));
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('Minor'));
  });

  it('should include review dimensions in system prompt', () => {
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('security'));
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('performance'));
  });

  it('should require file:line references in system prompt', () => {
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('file'));
    assert.ok(codeReviewRequestSkill.systemPrompt.includes('line'));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/code-review-request.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement code-review-request.ts**

```typescript
// src/skills/code-review-request.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are a thorough code reviewer analyzing changes for production readiness.

## Review Process

### Phase: GATHER
- Collect git diff (staged + unstaged)
- List all changed files with line counts
- Identify related test files
- Check recent commits for context
- Move to ANALYZE when diff is collected

### Phase: ANALYZE
Review the changes across these dimensions:

**Code Quality:**
- Clean separation of concerns?
- Proper error handling?
- Type safety?
- DRY principle followed?
- Edge cases handled?

**Architecture:**
- Sound design decisions?
- Scalability considerations?
- Performance implications?
- Security concerns (injection, XSS, secrets)?

**Testing:**
- Tests actually test logic (not mocks)?
- Edge cases covered?
- All tests passing?

**Requirements:**
- Implementation matches intent?
- No scope creep?
- Breaking changes documented?

Move to REPORT when analysis is complete.

### Phase: REPORT
Output a structured review report:

### Strengths
[What's well done — be specific with file:line references]

### Issues

#### 🔴 Critical (Must Fix)
[Bugs, security issues, data loss risks, broken functionality]

#### 🟡 Important (Should Fix)
[Architecture problems, missing error handling, test gaps]

#### 💡 Minor (Nice to Have)
[Code style, optimization, documentation improvements]

**For each issue include:**
- file:line reference
- What's wrong
- Why it matters
- How to fix (if not obvious)

### Assessment
**Ready to merge?** [Yes / No / With fixes]
**Reasoning:** [1-2 sentence technical assessment]

## Rules
- Categorize by ACTUAL severity — not everything is Critical
- Be SPECIFIC — file:line, not vague statements
- Explain WHY issues matter
- Acknowledge strengths
- Give a clear verdict
- Never say "looks good" without actually reviewing
- Never mark nitpicks as Critical

Current phase: {{phase}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  gather: {
    signals: [
      /reviewing.*changes/i,
      /analyzing.*(?:code|quality|architecture)/i,
      /code quality/i,
      /let me analyze/i,
    ],
    next: 'analyze',
  },
  analyze: {
    signals: [
      /###\s*Strengths/i,
      /###\s*Issues/i,
      /####.*Critical/i,
      /review report/i,
    ],
    next: 'report',
  },
};

export const codeReviewRequestSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'review',
  name: 'Code Review Request',
  description: 'Request structured code review on recent changes with severity-categorized feedback',
  keywords: ['review', 'code review', '审查', '检查代码', 'check code', 'review changes'],
  systemPrompt: SYSTEM_PROMPT,

  detectPhase(response: string, currentPhase: string): string {
    const rule = PHASE_TRANSITIONS[currentPhase];
    if (!rule) return currentPhase;
    if (rule.signals.some(re => re.test(response))) return rule.next;
    return currentPhase;
  },

  async handle(ctx: SkillContext): Promise<SkillResult> {
    const { request, chatContext, stream, model, token, session, tools } = ctx;

    const phase = session.get<string>('phase') ?? 'gather';

    // Gather git context on first entry
    if (phase === 'gather' && !session.get('contextGathered')) {
      try {
        const diff = await tools.git.diff();
        const diffStaged = await tools.git.diffStaged();
        const status = await tools.git.status();
        const log = await tools.git.log(5);
        const branch = await tools.git.currentBranch();
        session.set('reviewContext', {
          diff: diff || diffStaged || '(no changes)',
          status,
          recentCommits: log,
          branch,
        });
      } catch {
        session.set('reviewContext', { diff: '(unable to get diff)' });
      }
      session.set('contextGathered', true);
    }

    // Build messages
    const messages: vscode.LanguageModelChatMessage[] = [];

    messages.push(
      vscode.LanguageModelChatMessage.User(
        SYSTEM_PROMPT.replace('{{phase}}', phase)
      )
    );

    // Inject review context
    const reviewCtx = session.get<object>('reviewContext');
    if (reviewCtx) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Code changes to review:\n${JSON.stringify(reviewCtx, null, 2)}`
        )
      );
    }

    // Conversation history
    for (const turn of chatContext.history) {
      if (turn instanceof vscode.ChatRequestTurn) {
        messages.push(vscode.LanguageModelChatMessage.User(turn.prompt));
      } else if (turn instanceof vscode.ChatResponseTurn) {
        const text = turn.response
          .filter((r): r is vscode.ChatResponseMarkdownPart => r instanceof vscode.ChatResponseMarkdownPart)
          .map(r => r.value.value)
          .join('');
        if (text) {
          messages.push(vscode.LanguageModelChatMessage.Assistant(text));
        }
      }
    }

    messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

    // Call LLM
    const response = await model.sendRequest(messages, {}, token);

    let fullResponse = '';
    for await (const chunk of response.text) {
      stream.markdown(chunk);
      fullResponse += chunk;
    }

    // Phase transition
    const newPhase = this.detectPhase(fullResponse, phase);
    if (newPhase !== phase) {
      session.set('phase', newPhase);
    }

    // On report complete: suggest respond
    if (newPhase === 'report') {
      return {
        nextSkill: 'respond',
        metadata: { skillId: 'review', report: fullResponse },
      };
    }

    return { metadata: { skillId: 'review' } };
  },
};
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/code-review-request.test.ts --require ts-node/register
```

Expected: 8 tests PASS.

**Step 5: Commit**

```bash
git add src/skills/code-review-request.ts test/unit/code-review-request.test.ts
git commit -m "feat: implement code-review-request skill with severity-categorized output"
```

---

### Task 3: Implement Code Review Receive Skill

**Files:**
- Create: `superpower-copilot/src/skills/code-review-receive.ts`
- Create: `superpower-copilot/test/unit/code-review-receive.test.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/code-review-receive.test.ts
import * as assert from 'assert';
import { codeReviewReceiveSkill } from '../../src/skills/code-review-receive';

describe('CodeReviewReceiveSkill', () => {
  it('should have correct id', () => {
    assert.strictEqual(codeReviewReceiveSkill.id, 'respond');
  });

  it('should have keywords for routing', () => {
    assert.ok(codeReviewReceiveSkill.keywords.includes('respond'));
    assert.ok(codeReviewReceiveSkill.keywords.includes('feedback'));
  });

  it('should detect phase transition from read to understand', () => {
    const result = codeReviewReceiveSkill.detectPhase(
      'Let me restate the requirements: The reviewer is asking to add input validation at the API boundary.',
      'read'
    );
    assert.strictEqual(result, 'understand');
  });

  it('should detect phase transition from understand to evaluate', () => {
    const result = codeReviewReceiveSkill.detectPhase(
      'Checking against the codebase: src/api/handler.ts does not validate input. The suggestion is technically correct.',
      'understand'
    );
    assert.strictEqual(result, 'evaluate');
  });

  it('should detect phase transition from evaluate to implement', () => {
    const result = codeReviewReceiveSkill.detectPhase(
      'Implementing fix for item 1: Adding validation to handler.ts',
      'evaluate'
    );
    assert.strictEqual(result, 'implement');
  });

  it('should not transition without signal', () => {
    const result = codeReviewReceiveSkill.detectPhase(
      'Reading through the review feedback...',
      'read'
    );
    assert.strictEqual(result, 'read');
  });

  it('should forbid performative agreement in system prompt', () => {
    const prompt = codeReviewReceiveSkill.systemPrompt;
    assert.ok(prompt.includes('absolutely right'));
    assert.ok(prompt.includes('Great point'));
  });

  it('should enforce verify-before-implement in system prompt', () => {
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('verify'));
  });

  it('should enforce one-at-a-time implementation in system prompt', () => {
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('one'));
  });

  it('should include pushback guidance in system prompt', () => {
    assert.ok(codeReviewReceiveSkill.systemPrompt.includes('push back'));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/code-review-receive.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement code-review-receive.ts**

```typescript
// src/skills/code-review-receive.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are a disciplined developer processing code review feedback with technical rigor.

## THE CORE PRINCIPLE
Technical evaluation, not emotional performance.
Verify before implementing. Ask before assuming. Technical correctness over social comfort.

## FORBIDDEN RESPONSES — NEVER USE THESE
- "You're absolutely right!"
- "Great point!"
- "Excellent feedback!"
- "Thanks for catching that!"
- "Thanks for [anything]"
- ANY gratitude expression
- "Let me implement that now" (before verification)

Instead: restate the technical requirement, ask clarifying questions, or just start working.

## CORRECT RESPONSES
- "Fixed. [Brief description of what changed]"
- "Good catch — [specific issue]. Fixed in [location]."
- [Just fix it and show in the code]
- "Checking against codebase: [finding]"

## Workflow Phases

### Phase: READ
- Read the COMPLETE feedback without reacting
- Identify all individual items/issues
- Note severity of each (Critical, Important, Minor)
- Move to UNDERSTAND when all items catalogued

### Phase: UNDERSTAND
- For each item, restate the requirement in your own words
- If ANY item is unclear: STOP. Ask for clarification on unclear items FIRST.
  Do NOT implement items you understand while ignoring unclear ones.
  Items may be related — partial understanding = wrong implementation.
- Move to EVALUATE when all items understood

### Phase: EVALUATE
- For each item, verify against codebase reality:
  1. Is it technically correct for THIS codebase?
  2. Does it break existing functionality?
  3. Is there a reason for the current implementation?
  4. Does reviewer have full context?
- Categorize each item:
  - AGREE: technically sound, implement it
  - PUSHBACK: technically wrong, breaks things, YAGNI, or lacks context
  - CLARIFY: need more information
- Move to IMPLEMENT when evaluation complete

### Phase: IMPLEMENT
- Order: blocking issues → simple fixes → complex fixes
- Implement one item at a time
- Test each fix individually
- Verify no regressions after each fix
- Report what was done for each item

## When to push back
- Suggestion breaks existing functionality
- Reviewer lacks full context
- Violates YAGNI (unused feature — grep codebase to check)
- Technically incorrect for this stack
- Conflicts with prior architectural decisions

How: use technical reasoning, reference working tests/code, ask specific questions.

## YAGNI Check
IF reviewer suggests "implementing properly" or adding features:
  1. Grep codebase for actual usage
  2. If unused: "This isn't called anywhere. Remove it (YAGNI)?"
  3. If used: then implement properly

## Gracefully Correcting Pushback
If you pushed back and were wrong:
- "Checked [X] and it does [Y]. Implementing now."
- NOT: long apology, defending why you pushed back

Current phase: {{phase}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  read: {
    signals: [
      /restat.*requirement/i,
      /let me.*understand/i,
      /the reviewer.*asking/i,
      /item.*(?:1|2|3)/i,
      /catalogu/i,
    ],
    next: 'understand',
  },
  understand: {
    signals: [
      /checking.*(?:against|codebase)/i,
      /verify.*(?:against|technically)/i,
      /technically correct/i,
      /evaluat/i,
    ],
    next: 'evaluate',
  },
  evaluate: {
    signals: [
      /implementing.*(?:fix|item|change)/i,
      /fix.*(?:item|issue)/i,
      /starting.*implement/i,
      /Fixed\./i,
    ],
    next: 'implement',
  },
};

export const codeReviewReceiveSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'respond',
  name: 'Code Review Receive',
  description: 'Process code review feedback with technical rigor — verify before implementing, push back when wrong',
  keywords: ['respond', 'feedback', 'review feedback', '反馈', 'address review', 'fix review'],
  systemPrompt: SYSTEM_PROMPT,

  detectPhase(response: string, currentPhase: string): string {
    const rule = PHASE_TRANSITIONS[currentPhase];
    if (!rule) return currentPhase;
    if (rule.signals.some(re => re.test(response))) return rule.next;
    return currentPhase;
  },

  async handle(ctx: SkillContext): Promise<SkillResult> {
    const { request, chatContext, stream, model, token, session, tools } = ctx;

    const phase = session.get<string>('phase') ?? 'read';

    // Load review report from handoff if available
    if (phase === 'read' && !session.get('contextGathered')) {
      const handoff = session.get<string>('handoff');
      if (handoff) {
        session.set('reviewReport', handoff);
      }

      // Also gather current codebase state for verification
      try {
        const summary = await tools.workspace.getSummary();
        const status = await tools.git.status();
        session.set('codebaseContext', { summary, status });
      } catch {
        // ignore
      }
      session.set('contextGathered', true);
    }

    // Build messages
    const messages: vscode.LanguageModelChatMessage[] = [];

    messages.push(
      vscode.LanguageModelChatMessage.User(
        SYSTEM_PROMPT.replace('{{phase}}', phase)
      )
    );

    // Inject review report from previous skill
    const reviewReport = session.get<string>('reviewReport');
    if (reviewReport) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Review report to process:\n${reviewReport}`
        )
      );
    }

    // Codebase context
    const codeCtx = session.get<object>('codebaseContext');
    if (codeCtx) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Current codebase state:\n${JSON.stringify(codeCtx, null, 2)}`
        )
      );
    }

    // Conversation history
    for (const turn of chatContext.history) {
      if (turn instanceof vscode.ChatRequestTurn) {
        messages.push(vscode.LanguageModelChatMessage.User(turn.prompt));
      } else if (turn instanceof vscode.ChatResponseTurn) {
        const text = turn.response
          .filter((r): r is vscode.ChatResponseMarkdownPart => r instanceof vscode.ChatResponseMarkdownPart)
          .map(r => r.value.value)
          .join('');
        if (text) {
          messages.push(vscode.LanguageModelChatMessage.Assistant(text));
        }
      }
    }

    messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

    // Call LLM
    const response = await model.sendRequest(messages, {}, token);

    let fullResponse = '';
    for await (const chunk of response.text) {
      stream.markdown(chunk);
      fullResponse += chunk;
    }

    // Phase transition
    const newPhase = this.detectPhase(fullResponse, phase);
    if (newPhase !== phase) {
      session.set('phase', newPhase);
    }

    // On implement complete: suggest verify
    if (newPhase === 'implement' && /all.*(?:items|fixes|issues).*(?:done|addressed|complete)/i.test(fullResponse)) {
      return {
        nextSkill: 'verify',
        metadata: { skillId: 'respond' },
      };
    }

    return { metadata: { skillId: 'respond' } };
  },
};
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/code-review-receive.test.ts --require ts-node/register
```

Expected: 10 tests PASS.

**Step 5: Commit**

```bash
git add src/skills/code-review-receive.ts test/unit/code-review-receive.test.ts
git commit -m "feat: implement code-review-receive skill with anti-performative constraints"
```

---

### Task 4: Register New Skills in Participant Handler

**Files:**
- Modify: `superpower-copilot/src/participant.ts`

**Step 1: Add imports**

At the top of `src/participant.ts`, add:

```typescript
import { codeReviewRequestSkill } from './skills/code-review-request';
import { codeReviewReceiveSkill } from './skills/code-review-receive';
```

**Step 2: Register in constructor**

After existing `this.registry.register()` calls, add:

```typescript
this.registry.register(codeReviewRequestSkill);
this.registry.register(codeReviewReceiveSkill);
```

**Step 3: Verify build**

```bash
cd superpower-copilot && npm run compile
```

Expected: Build succeeds.

**Step 4: Run all unit tests**

```bash
cd superpower-copilot && npx mocha 'test/unit/**/*.test.ts' --require ts-node/register
```

Expected: All tests pass (~96 total).

**Step 5: Commit**

```bash
git add src/participant.ts
git commit -m "feat: register code-review-request and code-review-receive in participant"
```

---

### Task 5: Integration Tests + Final v0.4.0 Verification

**Files:**
- Modify: `superpower-copilot/test/integration/participant.test.ts`

**Step 1: Update integration test to verify all 9 commands**

```typescript
test('All 9 slash commands should be available', () => {
  const ext = vscode.extensions.getExtension('rainlei.superpower-copilot');
  const commands = ext!.packageJSON.contributes.chatParticipants[0].commands;
  const commandNames = commands.map((c: any) => c.name);
  assert.strictEqual(commandNames.length, 9);
  assert.ok(commandNames.includes('brainstorm'));
  assert.ok(commandNames.includes('plan'));
  assert.ok(commandNames.includes('execute'));
  assert.ok(commandNames.includes('verify'));
  assert.ok(commandNames.includes('finish'));
  assert.ok(commandNames.includes('tdd'));
  assert.ok(commandNames.includes('debug'));
  assert.ok(commandNames.includes('review'));
  assert.ok(commandNames.includes('respond'));
});
```

**Step 2: Run all tests**

```bash
cd superpower-copilot && npm run compile && npx mocha 'test/unit/**/*.test.ts' --require ts-node/register
```

Expected: Build succeeds, all ~96 unit tests pass.

**Step 3: Commit and tag**

```bash
git add test/integration/
git commit -m "test: add v0.4.0 integration tests — all 9 skills registered"
git tag v0.4.0
```

---

## Execution Options

Plan complete and saved to `docs/plans/2026-02-19-superpower-copilot-v0.4.0-plan.md`.

**1. Subagent-Driven (this session)** — Dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?
