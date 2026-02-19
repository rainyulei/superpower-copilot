// src/skills/code-review-request.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are a thorough code reviewer conducting structured reviews of code changes.

## Review Process Phases

### Phase: GATHER
- Collect git diff output (both staged and unstaged changes)
- List all changed files
- Review recent commit history
- Understand the context of changes
- Move to ANALYZE when you have gathered all necessary context

### Phase: ANALYZE
Review code changes across these dimensions:

**Code Quality**
- Clarity, readability, maintainability
- Naming conventions, code style
- DRY principle, code duplication
- Comments and documentation

**Architecture**
- Design patterns usage
- Separation of concerns
- Module dependencies
- Scalability considerations

**Testing**
- Test coverage for new code
- Edge cases handled
- Error scenarios tested
- Test quality and clarity

**Requirements**
- Feature completeness
- Business logic correctness
- User experience considerations
- Performance implications

Move to REPORT after completing analysis across all dimensions.

### Phase: REPORT
Provide structured review output:

### Strengths
- List positive aspects of the changes (2-4 bullet points)

### Issues

#### Critical
Issues that MUST be fixed before merge:
- [file:line] Description of critical issue

#### Important
Issues that SHOULD be fixed:
- [file:line] Description of important issue

#### Minor
Nice-to-have improvements:
- [file:line] Description of minor issue

### Assessment
**Verdict:** [APPROVE / REQUEST CHANGES / REJECT]
- Summary of overall assessment
- Recommendation for next steps

Current phase: {{phase}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  gather: {
    signals: [
      /\b(reviewing.*changes|analyzing.*code|analyzing.*quality|code quality)/i,
      /^##\s*(code quality|architecture|testing|analysis)/im,
      /\b(开始分析|开始审查)/i,
    ],
    next: 'analyze',
  },
  analyze: {
    signals: [
      /###\s*Strengths/i,
      /###\s*Issues/i,
      /####.*Critical/i,
      /####.*Important/i,
      /\b(review complete|审查完成)/i,
    ],
    next: 'report',
  },
};

export const codeReviewRequestSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'review',
  name: 'Code Review Request',
  description: 'Request structured code review on recent changes',
  keywords: ['review', 'code review', '审查', '检查代码', 'check code', 'review changes'],
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
    const phase = session.get<string>('phase') ?? 'gather';

    // Gather git context on first entry
    if (phase === 'gather' && !session.get('gitContextGathered')) {
      try {
        const [diff, diffStaged, status, log, branch] = await Promise.all([
          tools.git.diff(),
          tools.git.diffStaged(),
          tools.git.status(),
          tools.git.log(10),
          tools.git.currentBranch(),
        ]);

        session.set('reviewContext', {
          diff,
          diffStaged,
          status,
          recentCommits: log,
          currentBranch: branch,
        });
      } catch {
        session.set('reviewContext', {
          diff: '',
          diffStaged: '',
          status: 'Error gathering git context',
          recentCommits: [],
          currentBranch: 'unknown',
        });
      }
      session.set('gitContextGathered', true);
    }

    // Build messages
    const messages: vscode.LanguageModelChatMessage[] = [];

    // System prompt with current phase
    messages.push(
      vscode.LanguageModelChatMessage.User(
        SYSTEM_PROMPT.replace('{{phase}}', phase)
      )
    );

    // Review context
    const reviewCtx = session.get<object>('reviewContext');
    if (reviewCtx) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Review context:\n${JSON.stringify(reviewCtx, null, 2)}`
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

    // On report phase: transition to respond skill
    if (newPhase === 'report') {
      return {
        nextSkill: 'respond',
        metadata: { skillId: 'review', reviewOutput: fullResponse },
      };
    }

    return { metadata: { skillId: 'review' } };
  },
};
