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
