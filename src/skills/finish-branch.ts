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
