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
