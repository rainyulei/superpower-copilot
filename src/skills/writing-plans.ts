// src/skills/writing-plans.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are an implementation planner that creates detailed, bite-sized plans for developers.

## Hard Rules
- Each step is ONE action taking 2-5 minutes
- Every task MUST include exact file paths (create/modify/test)
- Include COMPLETE code in the plan, never vague instructions like "add validation"
- Include exact commands with expected output for every verification step
- Assume the engineer has ZERO codebase knowledge
- Apply DRY, YAGNI, TDD, frequent commits

## Task Granularity (each is a separate step)
- "Write the failing test" — one step
- "Run it to make sure it fails" — one step
- "Implement the minimal code to make it pass" — one step
- "Run the tests and make sure they pass" — one step
- "Commit" — one step

## Plan Document Structure
Every plan MUST start with:

\`\`\`markdown
# [Feature] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans

**Goal:** [One sentence]
**Architecture:** [2-3 sentences]
**Tech Stack:** [Key technologies]
---
\`\`\`

## Task Structure
Each task must follow:

\`\`\`markdown
### Task N: [Component Name]

**Files:**
- Create: \`exact/path/to/file.ts\`
- Modify: \`exact/path/to/existing.ts:line-range\`
- Test: \`tests/exact/path/to/test.ts\`

**Step 1: Write the failing test**
[Complete test code]

**Step 2: Run test to verify it fails**
Run: \`exact command\`
Expected: FAIL with "specific error"

**Step 3: Write minimal implementation**
[Complete implementation code]

**Step 4: Run test to verify it passes**
Run: \`exact command\`
Expected: PASS

**Step 5: Commit**
\`\`\`

## Workflow Phases

### Phase: ANALYZE
- Read the design document or user description
- Identify the scope: which components, files, dependencies
- Move to DECOMPOSE when scope is clear

### Phase: DECOMPOSE
- Break into ordered tasks, each with clear inputs/outputs
- Identify dependencies between tasks
- Move to WRITE when task breakdown is approved

### Phase: WRITE
- Generate the full plan document following the template
- Every task has: files, failing test, implementation, verification, commit
- Move to COMPLETE when plan is written

### Phase: COMPLETE
- Save plan to docs/plans/YYYY-MM-DD-<feature>.md
- Offer execution options

Current phase: {{phase}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  analyze: {
    signals: [
      /\b(break.*down|decompos|task.*1|splitting|拆分|分解)/i,
      /###\s*Task\s*1/i,
    ],
    next: 'decompose',
  },
  decompose: {
    signals: [
      /^#\s+.*Implementation Plan/im,
      /\*\*For Claude:\*\*/i,
      /\*\*Goal:\*\*/i,
    ],
    next: 'write',
  },
  write: {
    signals: [
      /plan complete/i,
      /saved to.*docs\/plans/i,
      /计划.*完成/i,
    ],
    next: 'complete',
  },
};

export const writingPlansSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'plan',
  name: 'Writing Plans',
  description: 'Create detailed step-by-step implementation plans with TDD',
  keywords: ['plan', 'implementation', '计划', '规划', 'roadmap', 'steps', '步骤'],
  systemPrompt: SYSTEM_PROMPT,

  detectPhase(response: string, currentPhase: string): string {
    const rule = PHASE_TRANSITIONS[currentPhase];
    if (!rule) return currentPhase;
    if (rule.signals.some(re => re.test(response))) return rule.next;
    return currentPhase;
  },

  async handle(ctx: SkillContext): Promise<SkillResult> {
    const { request, chatContext, stream, model, token, session, tools } = ctx;

    const phase = session.get<string>('phase') ?? 'analyze';

    // If coming from brainstorm, load the design
    const handoff = session.get<string>('handoff');

    // Gather project context if not done
    if (!session.get('contextGathered')) {
      try {
        const summary = await tools.workspace.getSummary();
        session.set('projectContext', summary);
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

    // Inject design from brainstorm if available
    if (handoff) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Design document from brainstorming phase:\n${handoff}`
        )
      );
    }

    // Project context
    const projectCtx = session.get<object>('projectContext');
    if (projectCtx) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Project context:\n${JSON.stringify(projectCtx, null, 2)}`
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

    // On complete: save plan and offer execution
    if (newPhase === 'complete') {
      stream.button({
        command: 'superpower.savePlan',
        title: '💾 Save Plan',
        arguments: [fullResponse],
      });

      return {
        nextSkill: 'execute',
        metadata: { skillId: 'plan', plan: fullResponse },
      };
    }

    return { metadata: { skillId: 'plan' } };
  },
};
