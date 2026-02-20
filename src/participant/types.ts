import * as vscode from 'vscode';

/**
 * Supported handler names for chat participant commands
 */
export type HandlerName = 'brainstorm' | 'plan';

/**
 * State for pending user interactions (e.g., waiting for answers to questions)
 */
export interface PendingState {
  question: string;
  step: number;
  context: Record<string, unknown>;
}

/**
 * Session state maintained across chat interactions
 */
export interface SessionState {
  handler: HandlerName;
  pendingState?: PendingState;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * Handler interface for chat participant sub-commands
 */
export interface SubHandler {
  /**
   * Handle a chat request for this command
   */
  handle(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    state?: SessionState
  ): Promise<vscode.ChatResult>;

  /**
   * Provide follow-up suggestions after handling a request
   */
  provideFollowups(
    result: vscode.ChatResult,
    context: vscode.ChatContext,
    token: vscode.CancellationToken
  ): vscode.ChatFollowup[];
}

/**
 * Result of routing a request to a handler
 */
export interface RouteResult {
  handler: HandlerName;
  confidence: number;
}
