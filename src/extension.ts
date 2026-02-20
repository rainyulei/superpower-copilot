import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const AGENTS_DIR = 'agents';
const SETTING_KEY = 'chat.agentFilesLocations';
const GLOBAL_AGENTS_DIR = '~/.superpower-copilot/agents';

export function activate(context: vscode.ExtensionContext) {
  const sourceDir = path.join(context.extensionPath, AGENTS_DIR);
  const homeDir = process.env['HOME'] || '';
  const targetDir = path.join(homeDir, '.superpower-copilot', 'agents');

  // Copy agent files to ~/.superpower-copilot/agents/
  fs.mkdirSync(targetDir, { recursive: true });
  const agentFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.agent.md'));
  for (const file of agentFiles) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
  }

  // Register ~/... path in chat.agentFilesLocations (~ prefix = global/user level)
  registerAgentsPath(GLOBAL_AGENTS_DIR);

  vscode.window.showInformationMessage(
    `Superpower Copilot: ${agentFiles.length} agents registered.`
  );

  context.subscriptions.push({
    dispose() {
      // Cleanup agent files
      for (const file of agentFiles) {
        try { fs.unlinkSync(path.join(targetDir, file)); } catch {}
      }
      unregisterAgentsPath(GLOBAL_AGENTS_DIR);
    }
  });
}

function registerAgentsPath(agentsPath: string): void {
  const config = vscode.workspace.getConfiguration();
  const current = config.get<Record<string, boolean>>(SETTING_KEY) || {};
  if (!current[agentsPath]) {
    config.update(SETTING_KEY, { ...current, [agentsPath]: true }, vscode.ConfigurationTarget.Global);
  }
}

function unregisterAgentsPath(agentsPath: string): void {
  const config = vscode.workspace.getConfiguration();
  const current = config.get<Record<string, boolean>>(SETTING_KEY) || {};
  const updated = { ...current };
  delete updated[agentsPath];
  config.update(SETTING_KEY, updated, vscode.ConfigurationTarget.Global);
}

export function deactivate() {}
