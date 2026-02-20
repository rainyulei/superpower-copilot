import * as vscode from 'vscode';
import { SubHandler, SessionState } from '../types';

/**
 * System prompt for brainstorming assistant
 */
const BRAINSTORM_SYSTEM = `You are a brainstorming assistant that helps explore ideas and design solutions.

Rules:
- Ask ONE question per response to help clarify the user's goals
- End each response with a clear question
- When you have enough information, propose 2-3 numbered approaches
- Keep responses under 200 words
- When the design is complete and the user has selected an approach, output 'DESIGN_COMPLETE' at the very end of your response

Your goal is to guide the user through exploring their idea and arriving at a concrete design approach.`;

/**
 * Internal context for brainstorm session
 */
interface BrainstormContext {
  topic?: string;
  answers: Array<{ question: string; answer: string }>;
  phase: 'exploring' | 'proposing' | 'refining' | 'complete';
}

/**
 * Build the prompt for the LM request based on session state
 */
function buildPrompt(state: SessionState | undefined, userMessage: string): string {
  if (!state?.pendingState?.context) {
    return userMessage;
  }

  const ctx = state.pendingState.context as unknown as BrainstormContext;

  // Build prompt with conversation history
  let prompt = '';

  if (ctx.topic) {
    prompt += `Topic: ${ctx.topic}\n\n`;
  }

  if (ctx.answers && ctx.answers.length > 0) {
    prompt += 'Previous conversation:\n';
    for (const qa of ctx.answers) {
      prompt += `Q: ${qa.question}\n`;
      prompt += `A: ${qa.answer}\n\n`;
    }
  }

  prompt += `Current message: ${userMessage}`;

  return prompt;
}

/**
 * Handler for brainstorm command - guides users through idea exploration
 */
export class BrainstormHandler implements SubHandler {
  async handle(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    state?: SessionState
  ): Promise<vscode.ChatResult> {
    stream.progress('Brainstorming...');

    const userMessage = request.prompt;
    const prompt = buildPrompt(state, userMessage);

    // Accumulate the response to detect DESIGN_COMPLETE
    let fullResponse = '';
    const model = await import('../../utils/lm').then(m => m.getModel());

    if (!model) {
      stream.markdown('❌ No language model available');
      return {
        metadata: {
          handler: 'brainstorm',
          pendingState: state?.pendingState,
          history: state?.history || []
        } as SessionState
      };
    }

    const messages = [
      vscode.LanguageModelChatMessage.User(BRAINSTORM_SYSTEM),
      vscode.LanguageModelChatMessage.User(prompt)
    ];

    const response = await model.sendRequest(messages, {}, token);

    for await (const chunk of response.text) {
      fullResponse += chunk;
      stream.markdown(chunk);
    }

    // Detect if design is complete
    const isComplete = fullResponse.includes('DESIGN_COMPLETE');

    // Extract or initialize context
    const prevContext = (state?.pendingState?.context as unknown as BrainstormContext) || {
      answers: [],
      phase: 'exploring' as const
    };

    // Update context with new Q&A
    const newAnswers = [...prevContext.answers];
    if (state?.pendingState?.question) {
      newAnswers.push({
        question: state.pendingState.question,
        answer: userMessage
      });
    }

    // Set topic from first message if not set
    const topic = prevContext.topic || (newAnswers.length === 0 ? userMessage : prevContext.topic);

    // Determine phase
    let phase: BrainstormContext['phase'];
    if (isComplete) {
      phase = 'complete';
    } else if ((state?.pendingState?.step || 0) > 3) {
      phase = 'refining';
    } else if ((state?.pendingState?.step || 0) > 2) {
      phase = 'proposing';
    } else {
      phase = 'exploring';
    }

    const newContext: BrainstormContext = {
      topic,
      answers: newAnswers,
      phase
    };

    // Update history
    const history = state?.history || [];
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: fullResponse }
    );

    // Extract the last question from the response for next turn
    const lines = fullResponse.split('\n').filter(l => l.trim());
    const lastLine = lines[lines.length - 1];
    const question = lastLine.includes('?') ? lastLine : 'Continue brainstorming';

    const newState: SessionState = {
      handler: 'brainstorm',
      pendingState: {
        question,
        step: (state?.pendingState?.step || 0) + 1,
        context: newContext as unknown as Record<string, unknown>
      },
      history
    };

    return {
      metadata: newState
    };
  }

  provideFollowups(
    result: vscode.ChatResult,
    _context: vscode.ChatContext,
    _token: vscode.CancellationToken
  ): vscode.ChatFollowup[] {
    const state = result.metadata as SessionState;
    const ctx = state?.pendingState?.context as unknown as BrainstormContext | undefined;

    if (!ctx) {
      return [];
    }

    // If design is complete, offer handoff to plan or revision
    if (ctx.phase === 'complete') {
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

    // If proposing or refining (step > 2), offer option selection
    if (ctx.phase === 'proposing' || ctx.phase === 'refining' || (state.pendingState?.step || 0) > 2) {
      return [
        {
          prompt: 'Option 1',
          label: 'Option 1'
        },
        {
          prompt: 'Option 2',
          label: 'Option 2'
        },
        {
          prompt: 'Option 3',
          label: 'Option 3'
        },
        {
          prompt: 'I have a different idea',
          label: 'Other'
        }
      ];
    }

    // During exploration phase, no follow-ups
    return [];
  }
}
