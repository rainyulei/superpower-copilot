# Superpower Copilot v0.3.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add TDD and Systematic Debugging skills, enabling `@superpower /tdd` and `@superpower /debug` in Copilot Chat.

**Architecture:** Two new skills following the Skill interface from v0.1.0. TDD enforces the Red-Green-Refactor cycle with an Iron Law. Debugging enforces 4-phase root cause investigation. Both integrate with the existing participant handler and router.

**Tech Stack:** TypeScript 5.x, VS Code Extension API (^1.96), esbuild, Mocha. Builds on v0.2.0 codebase.

**Prerequisites:** v0.2.0 complete — superpower-copilot/ with 5 registered skills (brainstorm, plan, execute, verify, finish), participant handler, router, tools, session state.

---

### Task 1: Register new commands in package.json

**Files:**
- Modify: `superpower-copilot/package.json`

**Step 1: Add 2 new slash commands to chatParticipants**

In `package.json`, locate `contributes.chatParticipants[0].commands` array and add:

```json
{ "name": "tdd", "description": "Test-driven development: red-green-refactor cycle" },
{ "name": "debug", "description": "Systematic debugging: find root cause before fixing" }
```

The full commands array should now have 7 entries: brainstorm, plan, execute, verify, finish, tdd, debug.

**Step 2: Bump version to 0.3.0**

Change `"version": "0.2.0"` to `"version": "0.3.0"`.

**Step 3: Verify build**

```bash
cd superpower-copilot && npm run compile
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add superpower-copilot/package.json
git commit -m "chore: register tdd and debug commands for v0.3.0"
```

---

### Task 2: Implement TDD Skill

**Files:**
- Create: `superpower-copilot/src/skills/tdd.ts`
- Create: `superpower-copilot/test/unit/tdd.test.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/tdd.test.ts
import * as assert from 'assert';
import { tddSkill } from '../../src/skills/tdd';

describe('TddSkill', () => {
  it('should have correct id', () => {
    assert.strictEqual(tddSkill.id, 'tdd');
  });

  it('should have keywords for routing', () => {
    assert.ok(tddSkill.keywords.includes('tdd'));
    assert.ok(tddSkill.keywords.includes('test'));
    assert.ok(tddSkill.keywords.includes('测试'));
  });

  it('should detect phase transition from understand to red', () => {
    const result = tddSkill.detectPhase(
      'Writing the failing test:\n```typescript\ntest(\'should reject empty\',',
      'understand'
    );
    assert.strictEqual(result, 'red');
  });

  it('should detect phase transition from red to verify-red', () => {
    const result = tddSkill.detectPhase(
      'Now run the test to confirm it fails:\n```bash\nnpm test',
      'red'
    );
    assert.strictEqual(result, 'verify-red');
  });

  it('should detect phase transition from verify-red to green', () => {
    const result = tddSkill.detectPhase(
      'Test fails as expected with "function not defined". Writing minimal implementation:',
      'verify-red'
    );
    assert.strictEqual(result, 'green');
  });

  it('should detect phase transition from green to verify-green', () => {
    const result = tddSkill.detectPhase(
      'Run the test again to verify it passes:\n```bash\nnpm test',
      'green'
    );
    assert.strictEqual(result, 'verify-green');
  });

  it('should detect phase transition from verify-green to refactor', () => {
    const result = tddSkill.detectPhase(
      'All tests pass. Now let us refactor:\n- Extract helper',
      'verify-green'
    );
    assert.strictEqual(result, 'refactor');
  });

  it('should detect cycle back from refactor to red', () => {
    const result = tddSkill.detectPhase(
      'Refactoring complete, all tests still green. Next failing test:',
      'refactor'
    );
    assert.strictEqual(result, 'red');
  });

  it('should not transition without signal', () => {
    const result = tddSkill.detectPhase(
      'Let me understand what you want to implement.',
      'understand'
    );
    assert.strictEqual(result, 'understand');
  });

  it('should enforce Iron Law in system prompt', () => {
    assert.ok(tddSkill.systemPrompt.includes('NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST'));
  });

  it('should enforce delete-and-start-over in system prompt', () => {
    assert.ok(tddSkill.systemPrompt.includes('Delete it'));
  });

  it('should enforce one-behavior-per-test in system prompt', () => {
    assert.ok(tddSkill.systemPrompt.includes('one behavior'));
  });

  it('should enforce no mocks unless unavoidable in system prompt', () => {
    assert.ok(tddSkill.systemPrompt.includes('mock'));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/tdd.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement tdd.ts**

```typescript
// src/skills/tdd.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are a strict TDD coach enforcing the Red-Green-Refactor cycle.

## THE IRON LAW
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.

Write code before the test? Delete it. Start over.
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete
Implement fresh from tests. Period.

Violating the letter of the rules is violating the spirit of the rules.

## Red-Green-Refactor Cycle

### Phase: UNDERSTAND
- Understand what feature or fix the user wants
- Identify the test file location and framework (detect from project)
- Move to RED when the behavior to test is clear

### Phase: RED — Write Failing Test
- Write ONE minimal test for one behavior
- Requirements:
  - Test one behavior only ("and" in name? Split it)
  - Clear name describing behavior
  - Use real code, no mock unless unavoidable
  - Shows desired API (test IS the design)
- Move to VERIFY-RED after writing test

### Phase: VERIFY-RED — Watch It Fail
- MANDATORY. NEVER skip.
- Run the test command
- Confirm:
  - Test FAILS (not errors from typos)
  - Failure message is expected ("function not defined", "expected X got Y")
  - Fails because feature is MISSING, not because of bugs in test
- If test passes: you're testing existing behavior. Fix the test.
- If test errors: fix error, re-run until it fails correctly.
- Move to GREEN only after seeing correct failure

### Phase: GREEN — Minimal Code
- Write the SIMPLEST code to make the test pass
- Don't add features beyond what the test requires
- Don't refactor other code
- Don't "improve" beyond the test
- Don't add configurability, options, or flexibility not tested
- Move to VERIFY-GREEN after writing implementation

### Phase: VERIFY-GREEN — Watch It Pass
- MANDATORY.
- Run the FULL test suite
- Confirm:
  - The new test passes
  - ALL other tests still pass
  - Output is pristine (no errors, no warnings)
- If new test fails: fix CODE, not test
- If other tests fail: fix NOW, don't defer
- Move to REFACTOR only after all green

### Phase: REFACTOR — Clean Up
- Only after green:
  - Remove duplication
  - Improve names
  - Extract helpers
- Keep tests GREEN throughout. Run after each change.
- Don't add behavior. Only restructure.
- After refactoring, cycle back: is there another behavior to test?
  - Yes → back to RED with next failing test
  - No → done

## Common Rationalizations (ALL mean DELETE and START OVER)
- "Too simple to test" → Simple code breaks. Test takes 30 seconds.
- "I'll test after" → Tests passing immediately prove nothing.
- "Keep as reference" → You'll adapt it. That's testing after. Delete.
- "Need to explore first" → Fine. Throw away exploration, start with TDD.
- "TDD will slow me down" → TDD faster than debugging.

## Good Tests
- One behavior per test
- Clear name: "rejects empty email", NOT "test1"
- Real code, no mocks unless unavoidable
- Test the API, not the implementation

Current phase: {{phase}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  understand: {
    signals: [
      /writing.*(?:the|a).*(?:failing|first).*test/i,
      /```(?:typescript|javascript|python|rust|go)/i,
      /test\s*\(/i,
      /describe\s*\(/i,
      /it\s*\(/i,
    ],
    next: 'red',
  },
  red: {
    signals: [
      /run.*test/i,
      /verify.*fail/i,
      /watch it fail/i,
      /```bash/i,
      /npm test|pytest|cargo test|go test/i,
    ],
    next: 'verify-red',
  },
  'verify-red': {
    signals: [
      /fail.*as expected/i,
      /writing.*(?:minimal|simplest).*(?:code|implementation)/i,
      /now.*implement/i,
      /GREEN/,
      /make.*test pass/i,
    ],
    next: 'green',
  },
  green: {
    signals: [
      /run.*test.*again/i,
      /verify.*pass/i,
      /watch it pass/i,
      /run.*(?:full|all).*test/i,
    ],
    next: 'verify-green',
  },
  'verify-green': {
    signals: [
      /all.*test.*pass/i,
      /refactor/i,
      /clean.*up/i,
      /REFACTOR/,
    ],
    next: 'refactor',
  },
  refactor: {
    signals: [
      /next.*(?:failing|test|behavior)/i,
      /another.*test/i,
      /RED/,
      /next feature/i,
    ],
    next: 'red',
  },
};

export const tddSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'tdd',
  name: 'Test-Driven Development',
  description: 'Enforce red-green-refactor TDD cycle for features and bugfixes',
  keywords: ['tdd', 'test', 'test-driven', '测试', '红绿', 'red green', 'failing test', 'unit test'],
  systemPrompt: SYSTEM_PROMPT,

  detectPhase(response: string, currentPhase: string): string {
    const rule = PHASE_TRANSITIONS[currentPhase];
    if (!rule) return currentPhase;
    if (rule.signals.some(re => re.test(response))) return rule.next;
    return currentPhase;
  },

  async handle(ctx: SkillContext): Promise<SkillResult> {
    const { request, chatContext, stream, model, token, session, tools } = ctx;

    const phase = session.get<string>('phase') ?? 'understand';
    const cycleCount = session.get<number>('cycleCount') ?? 0;

    // Detect test framework on first entry
    if (!session.get('contextGathered')) {
      try {
        const summary = await tools.workspace.getSummary();
        let testFramework = 'unknown';
        const rootFiles = summary.rootFiles;
        if (rootFiles.includes('jest.config.js') || rootFiles.includes('jest.config.ts')) testFramework = 'jest';
        else if (rootFiles.includes('vitest.config.ts')) testFramework = 'vitest';
        else if (rootFiles.includes('.mocharc.yml') || rootFiles.includes('.mocharc.json')) testFramework = 'mocha';
        else if (rootFiles.includes('pytest.ini') || rootFiles.includes('conftest.py')) testFramework = 'pytest';
        else if (rootFiles.includes('Cargo.toml')) testFramework = 'cargo test';
        else if (summary.projectType === 'node') testFramework = 'jest/vitest (detect from package.json)';

        session.set('tddContext', { summary, testFramework });
      } catch {
        session.set('tddContext', { testFramework: 'unknown' });
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

    // Test framework context
    const tddCtx = session.get<object>('tddContext');
    if (tddCtx) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Project test context:\n${JSON.stringify(tddCtx, null, 2)}`
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
      // Track cycle count (each return to red = new cycle)
      if (newPhase === 'red' && phase === 'refactor') {
        session.set('cycleCount', cycleCount + 1);
      }
    }

    return { metadata: { skillId: 'tdd', phase: newPhase, cycleCount } };
  },
};
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/tdd.test.ts --require ts-node/register
```

Expected: 12 tests PASS.

**Step 5: Commit**

```bash
git add src/skills/tdd.ts test/unit/tdd.test.ts
git commit -m "feat: implement TDD skill with red-green-refactor cycle enforcement"
```

---

### Task 3: Implement Systematic Debugging Skill

**Files:**
- Create: `superpower-copilot/src/skills/debugging.ts`
- Create: `superpower-copilot/test/unit/debugging.test.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/debugging.test.ts
import * as assert from 'assert';
import { debuggingSkill } from '../../src/skills/debugging';

describe('DebuggingSkill', () => {
  it('should have correct id', () => {
    assert.strictEqual(debuggingSkill.id, 'debug');
  });

  it('should have keywords for routing', () => {
    assert.ok(debuggingSkill.keywords.includes('debug'));
    assert.ok(debuggingSkill.keywords.includes('bug'));
    assert.ok(debuggingSkill.keywords.includes('调试'));
  });

  it('should detect phase transition from root-cause to pattern', () => {
    const result = debuggingSkill.detectPhase(
      'Found similar working code in src/services/auth.ts. Comparing patterns:',
      'root-cause'
    );
    assert.strictEqual(result, 'pattern');
  });

  it('should detect phase transition from pattern to hypothesis', () => {
    const result = debuggingSkill.detectPhase(
      'Hypothesis: The error is caused by missing null check in the parser because the input can be undefined when API returns 204.',
      'pattern'
    );
    assert.strictEqual(result, 'hypothesis');
  });

  it('should detect phase transition from hypothesis to implement', () => {
    const result = debuggingSkill.detectPhase(
      'Hypothesis confirmed. Creating a failing test to reproduce the bug:',
      'hypothesis'
    );
    assert.strictEqual(result, 'implement');
  });

  it('should not transition without signal', () => {
    const result = debuggingSkill.detectPhase(
      'Reading the error message carefully...',
      'root-cause'
    );
    assert.strictEqual(result, 'root-cause');
  });

  it('should enforce Iron Law in system prompt', () => {
    assert.ok(debuggingSkill.systemPrompt.includes('NO FIXES WITHOUT ROOT CAUSE INVESTIGATION'));
  });

  it('should enforce 3-fix architectural stop in system prompt', () => {
    assert.ok(debuggingSkill.systemPrompt.includes('3'));
    assert.ok(debuggingSkill.systemPrompt.includes('architecture'));
  });

  it('should enforce one-variable-at-a-time in system prompt', () => {
    assert.ok(debuggingSkill.systemPrompt.includes('one variable'));
  });

  it('should enforce failing test before fix in system prompt', () => {
    assert.ok(debuggingSkill.systemPrompt.includes('failing test'));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/debugging.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement debugging.ts**

```typescript
// src/skills/debugging.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are a systematic debugging coach. You NEVER guess fixes — you find root causes.

## THE IRON LAW
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.

If you haven't completed Phase 1, you CANNOT propose fixes.
Violating the letter of this process is violating the spirit of debugging.

## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase: ROOT-CAUSE — Investigate Before Fixing

BEFORE attempting ANY fix:

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - Read stack traces COMPLETELY
   - Note line numbers, file paths, error codes
   - They often contain the exact solution

2. **Reproduce Consistently**
   - Can you trigger it reliably? What are exact steps?
   - If not reproducible → gather more data, don't guess

3. **Check Recent Changes**
   - git diff, recent commits
   - New dependencies, config changes
   - Environmental differences

4. **Gather Evidence in Multi-Component Systems**
   - For EACH component boundary: log what enters and exits
   - Run once to find WHERE it breaks
   - Then investigate that specific component

5. **Trace Data Flow Backward**
   - Where does the bad value originate?
   - What called this with bad value?
   - Keep tracing up until you find the source
   - Fix at SOURCE, not at symptom

Move to PATTERN when you understand WHAT is happening and WHERE.

### Phase: PATTERN — Find Working Examples

1. **Find Working Examples** in same codebase
2. **Read Reference Implementation COMPLETELY** (don't skim)
3. **Identify Differences** — list every difference, however small
4. **Understand Dependencies** — what config, env, assumptions?

Move to HYPOTHESIS when you can explain WHY it's different.

### Phase: HYPOTHESIS — Scientific Method

1. **Form Single Hypothesis**
   - State clearly: "I think X is the root cause because Y"
   - Be specific, not vague

2. **Test Minimally**
   - Make the SMALLEST possible change to test
   - Change one variable at a time
   - Don't fix multiple things at once

3. **Verify**
   - Did it work? Yes → IMPLEMENT
   - Didn't work? Form NEW hypothesis (back to top of this phase)
   - DON'T add more fixes on top

Move to IMPLEMENT when hypothesis is confirmed.

### Phase: IMPLEMENT — Fix Root Cause

1. **Create failing test case first**
   - Simplest possible reproduction
   - Use @superpowers:test-driven-development for proper test
   - MUST have failing test before fixing

2. **Implement Single Fix**
   - Address root cause ONLY
   - ONE change at a time
   - No "while I'm here" improvements

3. **Verify Fix**
   - Test passes? Other tests still pass? Issue resolved?

4. **If Fix Doesn't Work — COUNT YOUR ATTEMPTS**
   - Attempts < 3: Return to ROOT-CAUSE, re-analyze
   - Attempts >= 3: STOP. Question the architecture.
     - Each fix reveals new problems in different places? = WRONG ARCHITECTURE
     - Discuss with user before attempting more fixes
     - This is NOT a failed hypothesis — this is a wrong design

## Red Flags (ALL mean STOP → Return to ROOT-CAUSE)
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- Proposing solutions before tracing data flow
- "One more fix attempt" when already tried 2+

Current phase: {{phase}}
Fix attempts: {{attempts}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  'root-cause': {
    signals: [
      /(?:found|located).*(?:similar|working).*(?:code|example|implementation)/i,
      /comparing.*(?:pattern|working|reference)/i,
      /pattern analysis/i,
      /looking at.*working.*example/i,
    ],
    next: 'pattern',
  },
  pattern: {
    signals: [
      /hypothesis/i,
      /I think.*(?:root cause|because|caused by)/i,
      /the (?:root cause|issue|problem) is/i,
      /根因/i,
    ],
    next: 'hypothesis',
  },
  hypothesis: {
    signals: [
      /(?:hypothesis|theory).*confirmed/i,
      /creating.*failing test/i,
      /writing.*test.*reproduc/i,
      /implement.*fix/i,
      /confirmed.*now/i,
    ],
    next: 'implement',
  },
};

export const debuggingSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'debug',
  name: 'Systematic Debugging',
  description: 'Find root cause before fixing: investigate, analyze patterns, hypothesize, then fix',
  keywords: ['debug', 'bug', 'error', 'crash', 'fix', '调试', '报错', '崩溃', 'broken', 'failing', 'issue'],
  systemPrompt: SYSTEM_PROMPT,

  detectPhase(response: string, currentPhase: string): string {
    const rule = PHASE_TRANSITIONS[currentPhase];
    if (!rule) return currentPhase;
    if (rule.signals.some(re => re.test(response))) return rule.next;
    return currentPhase;
  },

  async handle(ctx: SkillContext): Promise<SkillResult> {
    const { request, chatContext, stream, model, token, session, tools } = ctx;

    const phase = session.get<string>('phase') ?? 'root-cause';
    const fixAttempts = session.get<number>('fixAttempts') ?? 0;

    // Gather debug context on first entry
    if (!session.get('contextGathered')) {
      try {
        const summary = await tools.workspace.getSummary();
        const gitStatus = await tools.git.status();
        const recentCommits = await tools.git.log(10);
        const diff = await tools.git.diff();
        session.set('debugContext', { summary, gitStatus, recentCommits, diff });
      } catch {
        session.set('debugContext', {});
      }
      session.set('contextGathered', true);
    }

    // Build messages
    const messages: vscode.LanguageModelChatMessage[] = [];

    const promptWithState = SYSTEM_PROMPT
      .replace('{{phase}}', phase)
      .replace('{{attempts}}', String(fixAttempts));

    messages.push(vscode.LanguageModelChatMessage.User(promptWithState));

    // Debug context
    const debugCtx = session.get<object>('debugContext');
    if (debugCtx) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Debug context (git status, recent commits, diff):\n${JSON.stringify(debugCtx, null, 2)}`
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

    // Track fix attempts in implement phase
    if (phase === 'implement' && /fix.*(?:didn't|doesn't|failed|not work)/i.test(fullResponse)) {
      const newAttempts = fixAttempts + 1;
      session.set('fixAttempts', newAttempts);

      if (newAttempts >= 3) {
        stream.markdown('\n\n---\n⚠️ **3+ fix attempts failed.** This likely indicates an architectural problem, not a simple bug. Consider redesigning the approach rather than attempting another fix.\n');
      }
    }

    // On implement complete, suggest verify
    if (newPhase === 'implement' && /(?:fix.*verified|test.*pass|issue.*resolved)/i.test(fullResponse)) {
      return {
        nextSkill: 'verify',
        metadata: { skillId: 'debug', fixAttempts },
      };
    }

    return { metadata: { skillId: 'debug', phase: newPhase, fixAttempts } };
  },
};
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/debugging.test.ts --require ts-node/register
```

Expected: 10 tests PASS.

**Step 5: Commit**

```bash
git add src/skills/debugging.ts test/unit/debugging.test.ts
git commit -m "feat: implement systematic debugging skill with 4-phase root cause investigation"
```

---

### Task 4: Register New Skills in Participant Handler

**Files:**
- Modify: `superpower-copilot/src/participant.ts`

**Step 1: Add imports**

At the top of `src/participant.ts`, add:

```typescript
import { tddSkill } from './skills/tdd';
import { debuggingSkill } from './skills/debugging';
```

**Step 2: Register in constructor**

After existing `this.registry.register()` calls, add:

```typescript
this.registry.register(tddSkill);
this.registry.register(debuggingSkill);
```

**Step 3: Verify build**

```bash
cd superpower-copilot && npm run compile
```

Expected: Build succeeds, no type errors.

**Step 4: Run all unit tests**

```bash
cd superpower-copilot && npx mocha 'test/unit/**/*.test.ts' --require ts-node/register
```

Expected: All tests pass (~78 total: existing 56 + tdd 12 + debugging 10).

**Step 5: Commit**

```bash
git add src/participant.ts
git commit -m "feat: register TDD and debugging skills in participant handler"
```

---

### Task 5: Integration Tests for v0.3.0

**Files:**
- Modify: `superpower-copilot/test/integration/participant.test.ts`

**Step 1: Update integration test to verify 7 commands**

Add to the existing integration test:

```typescript
test('All 7 slash commands should be available', () => {
  const ext = vscode.extensions.getExtension('rainlei.superpower-copilot');
  const commands = ext!.packageJSON.contributes.chatParticipants[0].commands;
  const commandNames = commands.map((c: any) => c.name);
  assert.strictEqual(commandNames.length, 7);
  assert.ok(commandNames.includes('brainstorm'));
  assert.ok(commandNames.includes('plan'));
  assert.ok(commandNames.includes('execute'));
  assert.ok(commandNames.includes('verify'));
  assert.ok(commandNames.includes('finish'));
  assert.ok(commandNames.includes('tdd'));
  assert.ok(commandNames.includes('debug'));
});
```

**Step 2: Run integration tests**

```bash
cd superpower-copilot && npx vscode-test
```

Expected: All integration tests pass.

**Step 3: Run full test suite**

```bash
cd superpower-copilot && npm run compile && npx mocha 'test/unit/**/*.test.ts' --require ts-node/register
```

Expected: Build succeeds, all ~78 unit tests pass.

**Step 4: Commit and tag**

```bash
git add test/integration/
git commit -m "test: add v0.3.0 integration tests for tdd and debug commands"
git tag v0.3.0
```

---

## Execution Options

Plan complete and saved to `docs/plans/2026-02-19-superpower-copilot-v0.3.0-plan.md`.

**1. Subagent-Driven (this session)** — Dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?
