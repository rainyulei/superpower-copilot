import * as vscode from 'vscode';
import { HandlerName, SubHandler } from './types';
import { routeByCommand, routeByState, routeByLm } from './router';
import { BrainstormHandler } from './handlers/brainstorm';
import { PlanHandler } from './handlers/plan';

/**
 * Map of all available sub-handlers
 */
const handlers: Record<HandlerName, SubHandler> = {
  brainstorm: new BrainstormHandler(),
  plan: new PlanHandler()
};

/**
 * Confidence threshold for LM-based routing
 * If confidence is below this, we ask the user to clarify their intent
 */
const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Main chat handler that routes requests to appropriate sub-handlers
 */
async function chatHandler(
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<vscode.ChatResult> {
  // Step 1: Route by explicit command
  const commandHandler = routeByCommand(request.command);
  if (commandHandler) {
    return await handlers[commandHandler].handle(request, context, stream, token, undefined);
  }

  // Step 2: Route by session state (pending interactions)
  const state = routeByState(context);
  if (state?.handler && state.pendingState) {
    return await handlers[state.handler].handle(request, context, stream, token, state);
  }

  // Step 3: Route by LM classification
  try {
    const routeResult = await routeByLm(request.prompt, token);
    if (routeResult.confidence >= CONFIDENCE_THRESHOLD) {
      return await handlers[routeResult.handler].handle(request, context, stream, token, undefined);
    }

    // Step 4: Low confidence fallback - ask user to clarify
    stream.markdown(
      '🤔 I\'m not sure which assistant would be best for your request.\n\n' +
      'Please choose:\n' +
      '- **/brainstorm** - Explore ideas and design solutions\n' +
      '- **/plan** - Create step-by-step implementation plans\n\n' +
      'Or click one of the suggestions below.'
    );

    return {
      metadata: {
        handler: 'unknown',
        needsSelection: true
      }
    };
  } catch (error) {
    // On routing error, fall back to asking for clarification
    stream.markdown(
      '❌ Unable to route your request.\n\n' +
      'Please use an explicit command:\n' +
      '- **/brainstorm** - Explore ideas and design solutions\n' +
      '- **/plan** - Create step-by-step implementation plans'
    );

    return {
      metadata: {
        handler: 'unknown',
        needsSelection: true,
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Follow-up provider that delegates to sub-handlers or provides selection options
 */
function followupProvider(
  result: vscode.ChatResult,
  context: vscode.ChatContext,
  token: vscode.CancellationToken
): vscode.ChatFollowup[] {
  const metadata = result.metadata as Record<string, unknown> | undefined;

  // If user needs to select a handler, provide selection options
  if (metadata?.needsSelection) {
    return [
      {
        prompt: '/brainstorm Explore ideas and design',
        label: 'Brainstorm & Design',
        command: 'brainstorm'
      },
      {
        prompt: '/plan Create implementation plan',
        label: 'Implementation Plan',
        command: 'plan'
      }
    ];
  }

  // Delegate to the appropriate handler's followup provider
  const handlerName = metadata?.handler as HandlerName | undefined;
  if (handlerName && handlers[handlerName]) {
    return handlers[handlerName].provideFollowups(result, context, token);
  }

  return [];
}

/**
 * Register the chat participant with VS Code
 */
export function registerParticipant(context: vscode.ExtensionContext): void {
  const participant = vscode.chat.createChatParticipant('superpower.router', chatHandler);

  // Set icon
  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');

  // Set followup provider
  participant.followupProvider = {
    provideFollowups: followupProvider
  };

  // Register for cleanup
  context.subscriptions.push(participant);
}
