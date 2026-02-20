import * as vscode from 'vscode';

/**
 * Cached language model reference
 */
let cachedModel: vscode.LanguageModelChat | undefined;

/**
 * Get the preferred language model for chat interactions.
 * Prefers Copilot GPT-4o, falls back to any available model.
 * Result is cached after first successful selection.
 */
export async function getModel(): Promise<vscode.LanguageModelChat | undefined> {
  if (cachedModel) {
    return cachedModel;
  }

  // Try to get Copilot GPT-4o first
  const copilotModels = await vscode.lm.selectChatModels({
    vendor: 'copilot',
    family: 'gpt-4o'
  });

  if (copilotModels.length > 0) {
    cachedModel = copilotModels[0];
    return cachedModel;
  }

  // Fallback to any available model
  const allModels = await vscode.lm.selectChatModels();
  if (allModels.length > 0) {
    cachedModel = allModels[0];
    return cachedModel;
  }

  return undefined;
}

/**
 * Send a complete LM request and return the full response text.
 * Does not stream output.
 */
export async function sendLmRequest(
  systemPrompt: string,
  userMessage: string,
  token: vscode.CancellationToken
): Promise<string> {
  const model = await getModel();
  if (!model) {
    throw new Error('No language model available');
  }

  const messages = [
    vscode.LanguageModelChatMessage.User(systemPrompt),
    vscode.LanguageModelChatMessage.User(userMessage)
  ];

  const response = await model.sendRequest(messages, {}, token);

  let fullText = '';
  for await (const chunk of response.text) {
    fullText += chunk;
  }

  return fullText;
}

/**
 * Stream an LM request and write each chunk to the provided stream.
 * Outputs markdown-formatted text as it arrives.
 */
export async function streamLmRequest(
  systemPrompt: string,
  userMessage: string,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const model = await getModel();
  if (!model) {
    stream.markdown('❌ No language model available');
    return;
  }

  const messages = [
    vscode.LanguageModelChatMessage.User(systemPrompt),
    vscode.LanguageModelChatMessage.User(userMessage)
  ];

  const response = await model.sendRequest(messages, {}, token);

  for await (const chunk of response.text) {
    stream.markdown(chunk);
  }
}
