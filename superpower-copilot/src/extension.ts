import * as vscode from 'vscode';
import { SuperpowerParticipant } from './participant';
import { getFollowUps } from './followups';

export function activate(context: vscode.ExtensionContext) {
  const superpower = new SuperpowerParticipant(context);

  // Register Chat Participant
  const participant = vscode.chat.createChatParticipant(
    'superpower.agent',
    superpower.handler
  );
  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');

  // Follow-up provider
  participant.followupProvider = {
    provideFollowups(result: vscode.ChatResult) {
      const metadata = (result as Record<string, unknown>)?.metadata as Record<string, unknown> | undefined;
      const skillId = metadata?.skillId as string | undefined;

      if (!skillId) {
        return [];
      }

      const followupActions = getFollowUps(skillId);

      return followupActions.map(action => ({
        label: action.label,
        command: action.command,
        prompt: action.message,
      }));
    },
  };

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('superpower.saveDesign', async (content: string) => {
      const config = vscode.workspace.getConfiguration('superpower');
      const dir = config.get<string>('plansDirectory', 'docs/plans');
      const root = vscode.workspace.workspaceFolders?.[0]?.uri;
      if (!root) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      const uri = vscode.Uri.joinPath(root, dir, `${date}-design.md`);
      await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
      vscode.window.showInformationMessage(`Design saved to ${dir}/${date}-design.md`);
    }),

    vscode.commands.registerCommand('superpower.savePlan', async (content: string) => {
      const config = vscode.workspace.getConfiguration('superpower');
      const dir = config.get<string>('plansDirectory', 'docs/plans');
      const root = vscode.workspace.workspaceFolders?.[0]?.uri;
      if (!root) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      const uri = vscode.Uri.joinPath(root, dir, `${date}-plan.md`);
      await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
      vscode.window.showInformationMessage(`Plan saved to ${dir}/${date}-plan.md`);
    }),
  );

  context.subscriptions.push(participant);
}

export function deactivate() {}
