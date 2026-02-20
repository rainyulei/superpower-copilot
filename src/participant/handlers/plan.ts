import * as vscode from 'vscode';
import { SubHandler, SessionState } from '../types';
import { streamLmRequest } from '../../utils/lm';

/**
 * System prompt for implementation planning assistant
 */
const PLAN_SYSTEM = `You are an implementation planning assistant that breaks down features into concrete, bite-sized tasks.

Rules:
- Break the work into concrete, bite-sized tasks
- Number each task (1, 2, 3, etc.)
- Include specific file paths for each task
- Keep tasks small (2-5 minutes each)
- Suggest a TDD (Test-Driven Development) approach where appropriate
- After listing all tasks, ask the user if they want to adjust the plan

Output format:
1. [File path] - Brief description of what to do
2. [File path] - Brief description of what to do
...

Would you like to adjust this plan?`;

/**
 * Handler for plan command
 */
export class PlanHandler implements SubHandler {
  async handle(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    state?: SessionState
  ): Promise<vscode.ChatResult> {
    stream.progress('Creating implementation plan...');

    // Build enriched prompt with context
    let enrichedPrompt = request.prompt;

    // If there's history, prepend a summary
    if (state?.history && state.history.length > 0) {
      let contextSummary = 'Previous conversation context:\n';
      for (const entry of state.history) {
        contextSummary += `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.content}\n`;
      }
      contextSummary += '\n';
      enrichedPrompt = contextSummary + enrichedPrompt;
    }

    // Stream the plan from LM
    await streamLmRequest(PLAN_SYSTEM, enrichedPrompt, stream, token);

    // Build history
    const history = state?.history || [];
    history.push({ role: 'user', content: request.prompt });

    // Create session state
    const sessionState: SessionState = {
      handler: 'plan',
      pendingState: {
        question: 'plan_review',
        step: 1,
        context: {}
      },
      history
    };

    return {
      metadata: sessionState
    };
  }

  provideFollowups(
    _result: vscode.ChatResult,
    _context: vscode.ChatContext,
    _token: vscode.CancellationToken
  ): vscode.ChatFollowup[] {
    // Always return the same 3 options for plan review
    return [
      {
        prompt: 'Looks good, save this plan',
        label: 'Approve Plan'
      },
      {
        prompt: 'Adjust the plan',
        label: 'Adjust'
      },
      {
        prompt: 'Add more detail to the tasks',
        label: 'More Detail'
      }
    ];
  }
}
