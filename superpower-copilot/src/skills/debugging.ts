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
