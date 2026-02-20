import * as vscode from 'vscode';
import { HandlerName, RouteResult, SessionState } from './types';
import { sendLmRequest } from '../utils/lm';

/**
 * Route based on explicit command string
 * Maps known command strings to their corresponding handler names
 *
 * @param command The command string from the chat request
 * @returns The handler name if matched, undefined otherwise
 */
export function routeByCommand(command: string | undefined): HandlerName | undefined {
  if (!command) {
    return undefined;
  }

  const commandMap: Record<string, HandlerName> = {
    'brainstorm': 'brainstorm',
    'plan': 'plan'
  };

  return commandMap[command];
}

/**
 * Route based on session state from chat context history
 * Looks for the last assistant response that contains handler metadata
 *
 * @param context The VS Code chat context containing conversation history
 * @returns The session state if found, undefined otherwise
 */
export function routeByState(context: vscode.ChatContext): SessionState | undefined {
  // Filter to get only ChatResponseTurn entries (assistant messages)
  const responseTurns = context.history.filter(
    turn => turn instanceof vscode.ChatResponseTurn
  ) as vscode.ChatResponseTurn[];

  // Check the most recent response turn for metadata
  if (responseTurns.length === 0) {
    return undefined;
  }

  const lastTurn = responseTurns[responseTurns.length - 1];
  const metadata = lastTurn.result?.metadata;

  // Check if metadata has both required properties for SessionState
  if (metadata && 'handler' in metadata && 'pendingState' in metadata) {
    return metadata as SessionState;
  }

  return undefined;
}

/**
 * Route based on LM classification of user intent
 * Uses an LLM to analyze the user message and determine the best handler
 *
 * @param prompt The user's message to classify
 * @param token Cancellation token
 * @returns Route result with handler name and confidence score
 */
export async function routeByLm(
  prompt: string,
  token: vscode.CancellationToken
): Promise<RouteResult> {
  const systemPrompt = `You are an intent classifier for a coding assistant.
Analyze the user's message and determine which agent should handle it.

Available agents:
- "brainstorm": For exploring ideas, discussing requirements, asking clarifying questions, and planning features before implementation
- "plan": For creating detailed implementation plans, breaking down tasks into steps, and organizing development work

Respond with ONLY valid JSON in this exact format:
{"agent": "brainstorm" | "plan", "confidence": 0.0-1.0}

Guidelines:
- Use "brainstorm" for open-ended questions, feature discussions, requirement gathering
- Use "plan" for creating structured implementation plans, step-by-step guides
- Confidence should reflect how well the message matches the agent's purpose
- Default to "brainstorm" for ambiguous requests`;

  try {
    const response = await sendLmRequest(systemPrompt, prompt, token);

    // Clean markdown code fences if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    // Parse the JSON response
    const parsed = JSON.parse(cleanedResponse) as { agent: string; confidence: number };

    // Validate the agent name
    const validAgents: HandlerName[] = ['brainstorm', 'plan'];
    const handler = validAgents.includes(parsed.agent as HandlerName)
      ? (parsed.agent as HandlerName)
      : 'brainstorm';

    return {
      handler,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0
    };
  } catch (error) {
    // On any error (parsing, LM failure, etc.), default to brainstorm with 0 confidence
    return {
      handler: 'brainstorm',
      confidence: 0
    };
  }
}
