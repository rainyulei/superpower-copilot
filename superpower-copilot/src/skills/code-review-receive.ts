// src/skills/code-review-receive.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are receiving and processing code review feedback with technical rigor and anti-performative constraints.

## FORBIDDEN Responses (These indicate performative agreement, NOT technical engagement)
NEVER use these phrases:
- "You are absolutely right!"
- "Great point!"
- "Excellent feedback!"
- "Thanks for catching that!"
- Any gratitude expression ("thank you", "thanks", "appreciate")
- "Let me implement that now" (before verification)

## CORRECT Response Patterns
Use these direct, evidence-based patterns:
- "Fixed. [description of what changed]"
- "Good catch — [issue]. Fixed in [location]."
- "Checking against codebase: [finding]"
- "Pushback: [reason with evidence]"

## Workflow Phases

### Phase: READ
- Read the complete review feedback
- Identify all review items (Critical, Important, Minor)
- Note severity of each item
- Catalog file locations and line numbers
- Move to UNDERSTAND once all items are catalogued

### Phase: UNDERSTAND
- Restate each requirement to confirm understanding
- Ask clarification questions if the reviewer's intent is unclear
- Verify you understand what the reviewer is asking for
- Do NOT assume — if unclear, ask
- Move to EVALUATE once requirements are clear

### Phase: EVALUATE
Verify each suggestion against the codebase:
- Is it technically correct?
- Will it break existing functionality?
- Is there a reason for the current implementation?
- Does the reviewer have full context?

Categorize each item as:
- **AGREE**: Suggestion is technically correct and improves code
- **PUSHBACK**: Suggestion has issues (document why with evidence)
- **CLARIFY**: Need more information before deciding

Push back when:
- Suggestion breaks existing functionality (show test/usage that would break)
- Reviewer lacks context (cite code/docs that explain current design)
- Violates YAGNI principle (grep codebase, show feature isn't used)
- Technically incorrect (show counter-example or documentation)
- Conflicts with architecture (cite architectural constraints)

YAGNI check: Before implementing any "add feature X" suggestion, grep the codebase to verify X is actually used. If zero usage, push back.

Move to IMPLEMENT after categorizing all items.

### Phase: IMPLEMENT
Address items one at a time:
1. Pick one item (Critical first, then Important, then Minor)
2. Make the specific change
3. Test the change (run relevant tests, verify behavior)
4. Verify no regressions (check related functionality still works)
5. Only then move to next item

NEVER batch changes. One item at a time. Test between items.

When all items are addressed in IMPLEMENT phase, return nextSkill: 'verify'

Current phase: {{phase}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  read: {
    signals: [
      /restat.*requirement/i,
      /the reviewer.*asking/i,
      /catalogu/i,
      /unclear.*intent/i,
      /需要.*明确/i,
    ],
    next: 'understand',
  },
  understand: {
    signals: [
      /checking.*against.*codebase/i,
      /technically correct/i,
      /evaluat/i,
      /verifying.*against/i,
      /检查.*代码库/i,
    ],
    next: 'evaluate',
  },
  evaluate: {
    signals: [
      /implementing.*fix/i,
      /implementing.*item/i,
      /Fixed\./i,
      /Good catch/i,
      /addressed.*item/i,
      /实施.*修复/i,
    ],
    next: 'implement',
  },
};

export const codeReviewReceiveSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'respond',
  name: 'Code Review Receive',
  description: 'Receive and process code review feedback with anti-performative constraints',
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

    // Restore or init phase
    const phase = session.get<string>('phase') ?? 'read';

    // Load review report from session handoff on first entry
    if (phase === 'read' && !session.get('reviewLoaded')) {
      // Check if code-review-request skill transferred data
      const reviewOutput = session.get<string>('reviewOutput');
      if (reviewOutput) {
        session.set('reviewReport', reviewOutput);
      }
      session.set('reviewLoaded', true);
    }

    // Gather codebase context on first entry
    if (!session.get('codebaseContextGathered')) {
      try {
        const [summary, status] = await Promise.all([
          tools.workspace.getSummary(),
          tools.git.status(),
        ]);
        session.set('codebaseContext', { summary, status });
      } catch {
        session.set('codebaseContext', {});
      }
      session.set('codebaseContextGathered', true);
    }

    // Build messages
    const messages: vscode.LanguageModelChatMessage[] = [];

    // System prompt with current phase
    messages.push(
      vscode.LanguageModelChatMessage.User(
        SYSTEM_PROMPT.replace('{{phase}}', phase)
      )
    );

    // Review report if available
    const reviewReport = session.get<string>('reviewReport');
    if (reviewReport) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Review feedback to process:\n${reviewReport}`
        )
      );
    }

    // Codebase context
    const codebaseCtx = session.get<object>('codebaseContext');
    if (codebaseCtx) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Current codebase state:\n${JSON.stringify(codebaseCtx, null, 2)}`
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

    // Current user input
    messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

    // Call LLM
    const response = await model.sendRequest(messages, {}, token);

    let fullResponse = '';
    for await (const chunk of response.text) {
      stream.markdown(chunk);
      fullResponse += chunk;
    }

    // Detect phase transition
    const newPhase = this.detectPhase(fullResponse, phase);
    if (newPhase !== phase) {
      session.set('phase', newPhase);
    }

    // Check if all items addressed in implement phase
    const allItemsAddressed = newPhase === 'implement' && /all items? (addressed|completed|fixed)/i.test(fullResponse);

    if (allItemsAddressed) {
      return {
        nextSkill: 'verify',
        metadata: { skillId: 'respond' },
      };
    }

    return { metadata: { skillId: 'respond' } };
  },
};
