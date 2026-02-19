# Superpower Copilot v0.2.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add executing-plans, verification, and finish-branch skills to complete the brainstorm → plan → execute → verify → finish workflow loop.

**Architecture:** Three new skills following the same Skill interface from v0.1.0. Each implements `handle()` and `detectPhase()`. Executing-plans introduces batch execution with pause-for-feedback. Verification enforces evidence-before-claims gate. Finish-branch provides 4 structured options for branch completion. All wire into the existing participant handler and router.

**Tech Stack:** TypeScript 5.x, VS Code Extension API (^1.96), esbuild, Mocha. Builds on v0.1.0 codebase.

**Prerequisites:** v0.1.0 complete — superpower-copilot/ project with working extension, SkillRegistry, SessionState, SkillRouter, ToolKit, brainstorming skill, writing-plans skill, and participant handler.

---

### Task 1: Register new commands in package.json

**Files:**
- Modify: `superpower-copilot/package.json`

**Step 1: Add 3 new slash commands to chatParticipants**

In `package.json`, locate the `contributes.chatParticipants[0].commands` array and add:

```json
{ "name": "execute", "description": "Execute an implementation plan step by step" },
{ "name": "verify", "description": "Verify work before claiming completion" },
{ "name": "finish", "description": "Finish development branch (merge, PR, or discard)" }
```

The full commands array should now have 5 entries: brainstorm, plan, execute, verify, finish.

**Step 2: Bump version to 0.2.0**

Change `"version": "0.1.0"` to `"version": "0.2.0"`.

**Step 3: Verify build**

```bash
cd superpower-copilot && npm run compile
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add superpower-copilot/package.json
git commit -m "chore: register execute, verify, finish commands for v0.2.0"
```

---

### Task 2: Implement Executing Plans Skill

**Files:**
- Create: `superpower-copilot/src/skills/executing-plans.ts`
- Create: `superpower-copilot/test/unit/executing-plans.test.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/executing-plans.test.ts
import * as assert from 'assert';
import { executingPlansSkill } from '../../src/skills/executing-plans';

describe('ExecutingPlansSkill', () => {
  it('should have correct id', () => {
    assert.strictEqual(executingPlansSkill.id, 'execute');
  });

  it('should have keywords for routing', () => {
    assert.ok(executingPlansSkill.keywords.includes('execute'));
    assert.ok(executingPlansSkill.keywords.includes('执行'));
  });

  it('should detect phase transition from load to batch', () => {
    const result = executingPlansSkill.detectPhase(
      'Starting batch 1 of 3. Executing Task 1...',
      'load'
    );
    assert.strictEqual(result, 'batch');
  });

  it('should detect phase transition from batch to verify-batch', () => {
    const result = executingPlansSkill.detectPhase(
      'Batch complete. Verification results:\n✅ Tests pass\n✅ Build succeeds',
      'batch'
    );
    assert.strictEqual(result, 'verify-batch');
  });

  it('should detect phase transition from verify-batch to done', () => {
    const result = executingPlansSkill.detectPhase(
      'All tasks complete. All verifications passed.',
      'verify-batch'
    );
    assert.strictEqual(result, 'done');
  });

  it('should not transition without signal', () => {
    const result = executingPlansSkill.detectPhase(
      'Reading the plan file now...',
      'load'
    );
    assert.strictEqual(result, 'load');
  });

  it('should enforce batch-of-3 in system prompt', () => {
    assert.ok(executingPlansSkill.systemPrompt.includes('batch of 3'));
  });

  it('should enforce STOP conditions in system prompt', () => {
    assert.ok(executingPlansSkill.systemPrompt.includes('STOP'));
  });

  it('should suggest verify as next skill', () => {
    // The system prompt should mention verification as next step
    assert.ok(executingPlansSkill.systemPrompt.includes('verify'));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/executing-plans.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement executing-plans.ts**

```typescript
// src/skills/executing-plans.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are a plan executor that implements coding tasks step by step with rigorous verification.

## Hard Rules
- Execute tasks in a batch of 3, then STOP and report results
- Follow each plan step EXACTLY — do not skip verifications
- STOP IMMEDIATELY when any of these occur:
  - A blocker is encountered mid-batch
  - Critical gap found in the plan
  - An instruction is unclear or ambiguous
  - A verification step fails
- After each batch, report:
  1. What was completed (with verification output)
  2. Any issues encountered
  3. What comes next
- Wait for user feedback before starting the next batch
- NEVER start implementation on main/master without explicit user consent

## Workflow Phases

### Phase: LOAD
- Read the plan file (from handoff or user-provided path)
- Review the plan critically — identify any concerns BEFORE starting
- List all tasks and their dependencies
- Move to BATCH when ready to execute

### Phase: BATCH
- Execute up to 3 tasks sequentially
- For each task:
  1. Announce which task you're starting
  2. Follow each step exactly as written
  3. Run all verification commands
  4. Report pass/fail for each verification
- Move to VERIFY-BATCH after completing 3 tasks (or hitting end/blocker)

### Phase: VERIFY-BATCH
- Summarize batch results:
  - ✅ Tasks completed successfully
  - ❌ Tasks that failed (with error details)
  - ⚠️ Issues discovered
- If more tasks remain: ask user to continue
- If all tasks done: move to DONE

### Phase: DONE
- All tasks executed and verified
- Summarize total work done
- Suggest running verify skill for final check

Current phase: {{phase}}
Current batch: {{batch}}
Total tasks: {{total}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  load: {
    signals: [
      /starting batch/i,
      /executing task/i,
      /开始执行/i,
      /batch 1/i,
    ],
    next: 'batch',
  },
  batch: {
    signals: [
      /batch complete/i,
      /verification result/i,
      /批次.*完成/i,
      /completed.*task/i,
    ],
    next: 'verify-batch',
  },
  'verify-batch': {
    signals: [
      /all tasks complete/i,
      /全部.*完成/i,
      /no more tasks/i,
      /plan fully executed/i,
    ],
    next: 'done',
  },
};

export const executingPlansSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'execute',
  name: 'Executing Plans',
  description: 'Execute an implementation plan step by step in batches with verification',
  keywords: ['execute', 'run', 'implement', '执行', '运行', '实施', 'start plan'],
  systemPrompt: SYSTEM_PROMPT,

  detectPhase(response: string, currentPhase: string): string {
    const rule = PHASE_TRANSITIONS[currentPhase];
    if (!rule) return currentPhase;
    if (rule.signals.some(re => re.test(response))) return rule.next;
    return currentPhase;
  },

  async handle(ctx: SkillContext): Promise<SkillResult> {
    const { request, chatContext, stream, model, token, session, tools } = ctx;

    const phase = session.get<string>('phase') ?? 'load';
    const batchNum = session.get<number>('batchNum') ?? 1;
    const totalTasks = session.get<number>('totalTasks') ?? 0;

    // Load plan from handoff or try to find plan file
    if (phase === 'load' && !session.get('planLoaded')) {
      const handoff = session.get<string>('handoff');
      if (handoff) {
        session.set('planContent', handoff);
      } else {
        // Try to find most recent plan file
        try {
          const config = vscode.workspace.getConfiguration('superpower');
          const dir = config.get<string>('plansDirectory', 'docs/plans');
          const root = vscode.workspace.workspaceFolders?.[0]?.uri;
          if (root) {
            const planDir = vscode.Uri.joinPath(root, dir);
            const files = await tools.files.listDir(planDir);
            const planFiles = files.filter(f => f.includes('plan.md')).sort().reverse();
            if (planFiles.length > 0) {
              const planUri = vscode.Uri.joinPath(planDir, planFiles[0]);
              const content = await tools.files.read(planUri);
              session.set('planContent', content);
              session.set('planFile', planFiles[0]);
            }
          }
        } catch {
          // Will ask user for plan
        }
      }
      session.set('planLoaded', true);
    }

    // Build messages
    const messages: vscode.LanguageModelChatMessage[] = [];

    const promptWithState = SYSTEM_PROMPT
      .replace('{{phase}}', phase)
      .replace('{{batch}}', String(batchNum))
      .replace('{{total}}', String(totalTasks));

    messages.push(vscode.LanguageModelChatMessage.User(promptWithState));

    // Inject plan content
    const planContent = session.get<string>('planContent');
    if (planContent) {
      messages.push(
        vscode.LanguageModelChatMessage.User(`Implementation plan:\n${planContent}`)
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
      if (newPhase === 'batch' || (phase === 'verify-batch' && newPhase !== 'done')) {
        session.set('batchNum', batchNum + 1);
      }
    }

    // On done: suggest verify
    if (newPhase === 'done') {
      return {
        nextSkill: 'verify',
        metadata: { skillId: 'execute' },
      };
    }

    return { metadata: { skillId: 'execute' } };
  },
};
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/executing-plans.test.ts --require ts-node/register
```

Expected: 9 tests PASS.

**Step 5: Commit**

```bash
git add src/skills/executing-plans.ts test/unit/executing-plans.test.ts
git commit -m "feat: implement executing-plans skill with batch execution"
```

---

### Task 3: Implement Verification Skill

**Files:**
- Create: `superpower-copilot/src/skills/verification.ts`
- Create: `superpower-copilot/test/unit/verification.test.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/verification.test.ts
import * as assert from 'assert';
import { verificationSkill } from '../../src/skills/verification';

describe('VerificationSkill', () => {
  it('should have correct id', () => {
    assert.strictEqual(verificationSkill.id, 'verify');
  });

  it('should have keywords for routing', () => {
    assert.ok(verificationSkill.keywords.includes('verify'));
    assert.ok(verificationSkill.keywords.includes('验证'));
  });

  it('should detect phase transition from identify to run', () => {
    const result = verificationSkill.detectPhase(
      'Running: npm test\n```',
      'identify'
    );
    assert.strictEqual(result, 'run');
  });

  it('should detect phase transition from run to read', () => {
    const result = verificationSkill.detectPhase(
      'Command output:\n```\n12 passing\n0 failing\nExit code: 0\n```',
      'run'
    );
    assert.strictEqual(result, 'read');
  });

  it('should detect phase transition from read to verify', () => {
    const result = verificationSkill.detectPhase(
      'Checking results against criteria:\n- ✅ All 12 tests pass\n- ✅ Exit code 0',
      'read'
    );
    assert.strictEqual(result, 'verify');
  });

  it('should detect phase transition from verify to claim', () => {
    const result = verificationSkill.detectPhase(
      'VERIFIED: All criteria met. Evidence confirms implementation is complete.',
      'verify'
    );
    assert.strictEqual(result, 'claim');
  });

  it('should enforce Iron Law in system prompt', () => {
    assert.ok(verificationSkill.systemPrompt.includes('NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION'));
  });

  it('should forbid speculative language in system prompt', () => {
    assert.ok(verificationSkill.systemPrompt.includes('should'));
    assert.ok(verificationSkill.systemPrompt.includes('probably'));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/verification.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement verification.ts**

```typescript
// src/skills/verification.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are a verification gate that ensures all claims are backed by fresh evidence.

## THE IRON LAW
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.
If you have not run a verification command in THIS conversation turn, you CANNOT claim anything passes.

## Forbidden Language
NEVER use these words when describing status:
- "should work", "should pass"
- "probably works", "probably passes"
- "seems to work", "seems fine"
- "likely passes"
These indicate GUESSING, not VERIFYING. Use only definitive language backed by command output.

## Workflow Phases (The Gate Function)

### Phase: IDENTIFY
- What claims need verification? (tests pass, build succeeds, feature works, etc.)
- For each claim, identify the EXACT command that proves it
- List all verification commands before running any
- Move to RUN when commands are identified

### Phase: RUN
- Execute each verification command FRESH and COMPLETE
- Do NOT truncate output
- Do NOT skip any command
- Do NOT rely on previous runs — run everything fresh NOW
- Move to READ when all commands have been executed

### Phase: READ
- Read FULL output of each command
- Check exit codes (0 = success, non-zero = failure)
- Count pass/fail for test suites
- Look for warnings, deprecations, and errors
- Move to VERIFY when all output has been read

### Phase: VERIFY
- For each claim, does the command output CONFIRM it?
- Match evidence to claim:
  - "Tests pass" → exit code 0 AND 0 failures in output
  - "Build succeeds" → exit code 0 AND no error in output
  - "Feature works" → specific behavioral evidence
- If ANY claim lacks evidence: state actual status with evidence
- If ALL claims confirmed: move to CLAIM

### Phase: CLAIM
- State each verified claim WITH its evidence:
  - "✅ Tests pass — 24 passing, 0 failing, exit code 0"
  - "✅ Build succeeds — compiled in 1.2s, exit code 0"
  - "❌ Lint fails — 3 errors in src/foo.ts, exit code 1"
- For failed claims: describe what actually happened

Current phase: {{phase}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  identify: {
    signals: [
      /running:/i,
      /executing.*command/i,
      /```\s*\n.*\$|```bash/i,
    ],
    next: 'run',
  },
  run: {
    signals: [
      /command output/i,
      /exit code/i,
      /output:/i,
      /passing|failing/i,
    ],
    next: 'read',
  },
  read: {
    signals: [
      /checking.*criteria/i,
      /checking.*result/i,
      /comparing.*evidence/i,
      /✅|❌/,
    ],
    next: 'verify',
  },
  verify: {
    signals: [
      /VERIFIED/i,
      /verification complete/i,
      /all criteria met/i,
      /验证完成/i,
    ],
    next: 'claim',
  },
};

export const verificationSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'verify',
  name: 'Verification',
  description: 'Verify work with fresh evidence before claiming completion',
  keywords: ['verify', 'check', 'confirm', '验证', '检查', '确认', 'done', 'complete'],
  systemPrompt: SYSTEM_PROMPT,

  detectPhase(response: string, currentPhase: string): string {
    const rule = PHASE_TRANSITIONS[currentPhase];
    if (!rule) return currentPhase;
    if (rule.signals.some(re => re.test(response))) return rule.next;
    return currentPhase;
  },

  async handle(ctx: SkillContext): Promise<SkillResult> {
    const { request, chatContext, stream, model, token, session, tools } = ctx;

    const phase = session.get<string>('phase') ?? 'identify';

    // Gather context for verification
    if (!session.get('contextGathered')) {
      try {
        const summary = await tools.workspace.getSummary();
        const gitStatus = await tools.git.status();
        const diff = await tools.git.diff();
        session.set('verifyContext', { summary, gitStatus, diff });
      } catch {
        session.set('verifyContext', {});
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

    // Inject verification context
    const verifyCtx = session.get<object>('verifyContext');
    if (verifyCtx) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Current project state:\n${JSON.stringify(verifyCtx, null, 2)}`
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

    // On claim complete: suggest finish
    if (newPhase === 'claim') {
      return {
        nextSkill: 'finish',
        metadata: { skillId: 'verify' },
      };
    }

    return { metadata: { skillId: 'verify' } };
  },
};
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/verification.test.ts --require ts-node/register
```

Expected: 8 tests PASS.

**Step 5: Commit**

```bash
git add src/skills/verification.ts test/unit/verification.test.ts
git commit -m "feat: implement verification skill with evidence-before-claims gate"
```

---

### Task 4: Implement Finish Branch Skill

**Files:**
- Create: `superpower-copilot/src/skills/finish-branch.ts`
- Create: `superpower-copilot/test/unit/finish-branch.test.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/finish-branch.test.ts
import * as assert from 'assert';
import { finishBranchSkill } from '../../src/skills/finish-branch';

describe('FinishBranchSkill', () => {
  it('should have correct id', () => {
    assert.strictEqual(finishBranchSkill.id, 'finish');
  });

  it('should have keywords for routing', () => {
    assert.ok(finishBranchSkill.keywords.includes('finish'));
    assert.ok(finishBranchSkill.keywords.includes('merge'));
  });

  it('should detect phase transition from status to options', () => {
    const result = finishBranchSkill.detectPhase(
      'All tests pass. Here are your options:\n1. Merge\n2. PR\n3. Keep\n4. Discard',
      'status'
    );
    assert.strictEqual(result, 'options');
  });

  it('should detect phase transition from options to execute', () => {
    const result = finishBranchSkill.detectPhase(
      'Executing option 2: Creating pull request...',
      'options'
    );
    assert.strictEqual(result, 'execute');
  });

  it('should not transition without signal', () => {
    const result = finishBranchSkill.detectPhase(
      'Running test suite...',
      'status'
    );
    assert.strictEqual(result, 'status');
  });

  it('should enforce exactly 4 options in system prompt', () => {
    assert.ok(finishBranchSkill.systemPrompt.includes('exactly 4 options'));
  });

  it('should require discard confirmation in system prompt', () => {
    assert.ok(finishBranchSkill.systemPrompt.includes('discard'));
  });

  it('should enforce test-first in system prompt', () => {
    assert.ok(finishBranchSkill.systemPrompt.includes('NEVER proceed with failing tests'));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/finish-branch.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement finish-branch.ts**

```typescript
// src/skills/finish-branch.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are a branch completion assistant that guides developers through finishing their work safely.

## Hard Rules
- NEVER proceed with failing tests — run tests first, stop if any fail
- NEVER force-push without explicit user request
- NEVER delete work without typed "discard" confirmation
- ALWAYS present exactly 4 options (no more, no less)
- ALWAYS verify tests pass before offering options
- For merges: pull latest base branch first, then merge, then verify tests again

## Workflow Phases

### Phase: STATUS
- Run the project's test suite (detect: npm test, cargo test, pytest, etc.)
- Check git status: current branch, number of commits ahead, remote tracking
- If tests FAIL: show failures, STOP, do not offer options
- If tests PASS: move to OPTIONS

### Phase: OPTIONS
- Determine base branch (main or master)
- Present exactly 4 options:

  **1. Merge back to [base-branch] locally**
  Pulls latest, merges your branch, verifies tests, deletes branch.

  **2. Push and create a Pull Request**
  Pushes branch to remote, creates PR with structured description.

  **3. Keep the branch as-is**
  No action taken. Branch remains for you to handle later.

  **4. Discard this work**
  ⚠️ Irreversible. Requires you to type "discard" to confirm.

- Wait for user to choose. Move to EXECUTE when chosen.

### Phase: EXECUTE
- Execute the chosen option precisely:

  **Option 1 (Merge):**
  1. git checkout [base-branch]
  2. git pull origin [base-branch]
  3. git merge [feature-branch]
  4. Run tests to verify merge didn't break anything
  5. git branch -d [feature-branch]

  **Option 2 (PR):**
  1. git push -u origin [feature-branch]
  2. Create PR with:
     ## Summary
     [bullet points of changes]
     ## Test Plan
     [verification checklist]

  **Option 3 (Keep):**
  1. Confirm: "Branch [name] kept as-is."

  **Option 4 (Discard):**
  1. Show what will be deleted (branch name, number of commits)
  2. Ask user to type "discard" to confirm
  3. Only after confirmation: git checkout [base-branch] && git branch -D [feature-branch]

Current phase: {{phase}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  status: {
    signals: [
      /here are your options/i,
      /option 1/i,
      /1\.\s*merge/i,
      /选项/i,
    ],
    next: 'options',
  },
  options: {
    signals: [
      /executing option/i,
      /creating pull request/i,
      /merging/i,
      /git checkout/i,
      /git push/i,
      /branch.*kept/i,
      /type.*discard/i,
    ],
    next: 'execute',
  },
};

export const finishBranchSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'finish',
  name: 'Finish Branch',
  description: 'Finish development branch with merge, PR, keep, or discard',
  keywords: ['finish', 'merge', 'pr', 'pull request', 'done', '完成', '合并', 'branch'],
  systemPrompt: SYSTEM_PROMPT,

  detectPhase(response: string, currentPhase: string): string {
    const rule = PHASE_TRANSITIONS[currentPhase];
    if (!rule) return currentPhase;
    if (rule.signals.some(re => re.test(response))) return rule.next;
    return currentPhase;
  },

  async handle(ctx: SkillContext): Promise<SkillResult> {
    const { request, chatContext, stream, model, token, session, tools } = ctx;

    const phase = session.get<string>('phase') ?? 'status';

    // Gather git context on first entry
    if (!session.get('contextGathered')) {
      try {
        const branch = await tools.git.currentBranch();
        const status = await tools.git.status();
        const log = await tools.git.log(10);
        const summary = await tools.workspace.getSummary();
        session.set('branchContext', { branch, status, log, summary });
      } catch {
        session.set('branchContext', {});
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

    // Inject branch context
    const branchCtx = session.get<object>('branchContext');
    if (branchCtx) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Branch context:\n${JSON.stringify(branchCtx, null, 2)}`
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

    return { metadata: { skillId: 'finish' } };
  },
};
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/finish-branch.test.ts --require ts-node/register
```

Expected: 8 tests PASS.

**Step 5: Commit**

```bash
git add src/skills/finish-branch.ts test/unit/finish-branch.test.ts
git commit -m "feat: implement finish-branch skill with 4 structured options"
```

---

### Task 5: Register New Skills in Participant Handler

**Files:**
- Modify: `superpower-copilot/src/participant.ts`

**Step 1: Add imports for new skills**

At the top of `src/participant.ts`, add:

```typescript
import { executingPlansSkill } from './skills/executing-plans';
import { verificationSkill } from './skills/verification';
import { finishBranchSkill } from './skills/finish-branch';
```

**Step 2: Register skills in constructor**

In the `SuperpowerParticipant` constructor, after the existing `this.registry.register()` calls, add:

```typescript
this.registry.register(executingPlansSkill);
this.registry.register(verificationSkill);
this.registry.register(finishBranchSkill);
```

**Step 3: Verify build**

```bash
cd superpower-copilot && npm run compile
```

Expected: Build succeeds, no type errors.

**Step 4: Run all existing tests**

```bash
cd superpower-copilot && npx mocha 'test/unit/**/*.test.ts' --require ts-node/register
```

Expected: All tests pass (registry 5 + session 6 + router 4 + brainstorming 8 + writing-plans 8 + executing-plans 9 + verification 8 + finish-branch 8 = 56 total).

**Step 5: Commit**

```bash
git add src/participant.ts
git commit -m "feat: register executing-plans, verification, finish-branch in participant"
```

---

### Task 6: Integration Test — v0.2.0 Workflow

**Files:**
- Modify: `superpower-copilot/test/integration/participant.test.ts`

**Step 1: Add integration tests for new skills**

Append to the existing test suite in `test/integration/participant.test.ts`:

```typescript
test('Execute command should be registered', async () => {
  const ext = vscode.extensions.getExtension('rainlei.superpower-copilot');
  await ext!.activate();
  // Verify the extension is active and has all 5 commands
  assert.ok(ext!.isActive);
});

test('All 5 slash commands should be available', () => {
  // This verifies package.json has all commands registered
  const ext = vscode.extensions.getExtension('rainlei.superpower-copilot');
  const commands = ext!.packageJSON.contributes.chatParticipants[0].commands;
  const commandNames = commands.map((c: any) => c.name);
  assert.ok(commandNames.includes('brainstorm'));
  assert.ok(commandNames.includes('plan'));
  assert.ok(commandNames.includes('execute'));
  assert.ok(commandNames.includes('verify'));
  assert.ok(commandNames.includes('finish'));
});
```

**Step 2: Run integration tests**

```bash
cd superpower-copilot && npx vscode-test
```

Expected: All integration tests pass.

**Step 3: Verify full build**

```bash
cd superpower-copilot && npm run compile && npx mocha 'test/unit/**/*.test.ts' --require ts-node/register
```

Expected: Build succeeds, all 56 unit tests pass.

**Step 4: Commit and tag**

```bash
git add test/integration/
git commit -m "test: add v0.2.0 integration tests for execute, verify, finish"
git tag v0.2.0
```

---

## Execution Options

Plan complete and saved to `docs/plans/2026-02-19-superpower-copilot-v0.2.0-plan.md`.

**1. Subagent-Driven (this session)** — Dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?
