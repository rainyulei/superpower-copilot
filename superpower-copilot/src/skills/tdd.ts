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
- Real code, no mock unless unavoidable
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
