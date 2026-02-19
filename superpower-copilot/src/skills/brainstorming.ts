// src/skills/brainstorming.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are a product architect helping turn ideas into designs through collaborative dialogue.

## Hard Rules
- Ask ONE question at a time, prefer multiple choice when possible
- NEVER write code, scaffold projects, or take any implementation action
- Always propose 2-3 approaches with trade-offs before settling on one
- Scale detail to complexity: simple idea = short design, complex = thorough
- Get user approval after each design section before moving on

## Workflow Phases
Progress through these phases in order:

### Phase: EXPLORE
- Check project context (files, structure, tech stack)
- Ask clarifying questions one at a time about: purpose, constraints, success criteria
- Move to APPROACH when you understand WHAT to build

### Phase: APPROACH
- Propose 2-3 approaches with trade-offs
- Lead with your recommendation and explain why
- Move to DESIGN when user picks an approach

### Phase: DESIGN
- Present design section by section:
  1. Architecture overview
  2. Key components
  3. Data flow
  4. Error handling
  5. Testing strategy
- Ask "Does this section look right?" after each
- Move to COMPLETE when all sections approved

### Phase: COMPLETE
- Summarize the final design in a concise document
- Suggest saving to docs/plans/ directory
- Suggest creating an implementation plan as next step

Current phase: {{phase}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  explore: {
    signals: [
      /\b(approach|option|方案|建议.*种|propose|recommend)/i,
      /\*\*option [abc]\*\*/i,
      /here are.*(?:2|3|two|three).*(?:approach|option|way)/i,
    ],
    next: 'approach',
  },
  approach: {
    signals: [
      /\b(architecture|design|架构|组件|component|详细设计)/i,
      /^##\s+(architecture|design|overview)/im,
    ],
    next: 'design',
  },
  design: {
    signals: [
      /\b(summary|complete|总结|设计完成|final design)/i,
      /^##\s+summary/im,
      /design is.*complete/i,
    ],
    next: 'complete',
  },
};

export const brainstormingSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'brainstorm',
  name: 'Brainstorming',
  description: 'Explore ideas, clarify requirements, and design before implementation',
  keywords: ['brainstorm', 'idea', 'design', '想法', '设计', '构思', '头脑风暴', 'architect', '架构'],
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
    const phase = session.get<string>('phase') ?? 'explore';

    // Gather project context on first entry
    if (phase === 'explore' && !session.get('contextGathered')) {
      try {
        const summary = await tools.workspace.getSummary();
        const commits = await tools.git.log(5);
        session.set('projectContext', { summary, recentCommits: commits });
      } catch {
        session.set('projectContext', { summary: { name: 'unknown' }, recentCommits: [] });
      }
      session.set('contextGathered', true);
    }

    // Build messages
    const messages: vscode.LanguageModelChatMessage[] = [];

    // System prompt with current phase
    messages.push(
      vscode.LanguageModelChatMessage.User(
        SYSTEM_PROMPT.replace('{{phase}}', phase)
      )
    );

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

    // On complete: offer next actions
    if (newPhase === 'complete') {
      stream.button({
        command: 'superpower.saveDesign',
        title: '💾 Save Design Doc',
        arguments: [fullResponse],
      });

      return {
        nextSkill: 'plan',
        metadata: { skillId: 'brainstorm', design: fullResponse },
      };
    }

    return { metadata: { skillId: 'brainstorm' } };
  },
};
