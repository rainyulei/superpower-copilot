import * as vscode from 'vscode';
import { SubHandler, SessionState } from '../types';
import { getModel } from '../../utils/lm';

/**
 * System prompt for brainstorming assistant
 */
const BRAINSTORM_SYSTEM = `You are a brainstorming assistant that helps explore ideas and design solutions.

Rules:
- Ask ONE question per response to understand requirements and constraints
- End each response with a clear question
- When you have enough information, propose 2-3 numbered approaches
- Keep responses under 200 words
- When the design is complete and user has chosen an approach, output 'DESIGN_COMPLETE' at the very end`;

/**
 * Internal context for brainstorm session
 */
interface BrainstormContext extends Record<string, unknown> {
  topic?: string;
  answers: Array<{ question: string; answer: string }>;
  phase: 'exploring' | 'proposing' | 'refining' | 'complete';
}

/**
 * Type guard to check if context is BrainstormContext
 */
function isBrainstormContext(context: Record<string, unknown>): context is BrainstormContext {
  return (
    typeof context === 'object' &&
    context !== null &&
    'answers' in context &&
    Array.isArray(context.answers) &&
    'phase' in context &&
    typeof context.phase === 'string'
  );
}

/**
 * Build prompt from session state and current user message
 */
function buildPrompt(state: SessionState | undefined, userMessage: string): string {
  if (!state?.pendingState?.context) {
    return userMessage;
  }

  const context = state.pendingState.context;
  if (!isBrainstormContext(context)) {
    return userMessage;
  }

  if (context.answers.length === 0) {
    return userMessage;
  }

  // Build prompt with Q&A history
  let prompt = 'Previous conversation:\n';
  for (const qa of context.answers) {
    prompt += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
  }
  prompt += `Current message: ${userMessage}`;

  return prompt;
}

/**
 * Handler for brainstorm command
 */
export class BrainstormHandler implements SubHandler {
  async handle(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    state?: SessionState
  ): Promise<vscode.ChatResult> {
    stream.progress('Brainstorming...');

    // Build prompt from state and current message
    const userMessage = request.prompt;
    const prompt = buildPrompt(state, userMessage);

    // Get model and stream response
    const model = await getModel();
    if (!model) {
      stream.markdown('❌ No language model available');
      return { metadata: undefined };
    }

    const messages = [
      vscode.LanguageModelChatMessage.User(BRAINSTORM_SYSTEM),
      vscode.LanguageModelChatMessage.User(prompt)
    ];

    const response = await model.sendRequest(messages, {}, token);

    // Accumulate response text while streaming
    let fullText = '';
    for await (const chunk of response.text) {
      fullText += chunk;
      stream.markdown(chunk);
    }

    // Extract previous context
    const prevContextRaw = state?.pendingState?.context;
    const prevContext: BrainstormContext =
      prevContextRaw && isBrainstormContext(prevContextRaw)
        ? prevContextRaw
        : {
            answers: [],
            phase: 'exploring' as const
          };

    // Detect DESIGN_COMPLETE signal
    const isComplete = fullText.includes('DESIGN_COMPLETE');

    // Extract the question from the response (last line that ends with '?')
    const lines = fullText.split('\n').filter(l => l.trim());
    let currentQuestion = '';
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.endsWith('?')) {
        currentQuestion = line;
        break;
      }
    }

    // Update answers array with previous Q&A
    const answers = [...prevContext.answers];
    if (state?.pendingState?.question && userMessage) {
      answers.push({
        question: state.pendingState.question,
        answer: userMessage
      });
    }

    // Determine phase
    const step = (state?.pendingState?.step || 0) + 1;
    let phase: BrainstormContext['phase'];
    if (isComplete) {
      phase = 'complete';
    } else if (step > 3) {
      phase = 'refining';
    } else {
      phase = 'exploring';
    }

    // Build new context
    const newContext: BrainstormContext = {
      topic: prevContext.topic || userMessage,
      answers,
      phase
    };

    // Build history
    const history = state?.history || [];
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: fullText }
    );

    // Create session state
    const sessionState: SessionState = {
      handler: 'brainstorm',
      pendingState: {
        question: currentQuestion,
        step,
        context: newContext
      },
      history
    };

    return {
      metadata: sessionState
    };
  }

  provideFollowups(
    result: vscode.ChatResult,
    _context: vscode.ChatContext,
    _token: vscode.CancellationToken
  ): vscode.ChatFollowup[] {
    const state = result.metadata as SessionState | undefined;
    if (!state?.pendingState?.context) {
      return [];
    }

    const contextRaw = state.pendingState.context;
    if (!isBrainstormContext(contextRaw)) {
      return [];
    }

    const phase = contextRaw.phase;
    const step = state.pendingState.step;

    // Complete phase: offer handoff to plan or revision
    if (phase === 'complete') {
      return [
        {
          prompt: '/plan Create implementation plan',
          label: 'Create Implementation Plan',
          command: 'plan'
        },
        {
          prompt: 'I want to revise the design',
          label: 'Revise Design'
        }
      ];
    }

    // Proposing or refining phase: offer numbered options
    if (phase === 'proposing' || step > 2) {
      return [
        { prompt: 'Option 1', label: 'Option 1' },
        { prompt: 'Option 2', label: 'Option 2' },
        { prompt: 'Option 3', label: 'Option 3' },
        { prompt: 'I have a different idea', label: 'Other' }
      ];
    }

    // Exploring phase: no followups
    return [];
  }
}
