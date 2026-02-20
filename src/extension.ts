import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const AGENTS_DIR = 'agents';

export function activate(context: vscode.ExtensionContext) {
  const sourceDir = path.join(context.extensionPath, AGENTS_DIR);
  const targetDir = getProfileAgentsDir();

  // Ensure target directory exists
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy all agent files
  const agentFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.agent.md'));
  for (const file of agentFiles) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
  }

  vscode.window.showInformationMessage(
    `Superpower Copilot: ${agentFiles.length} agents installed.`
  );

  // Cleanup on deactivation
  context.subscriptions.push({
    dispose() {
      for (const file of agentFiles) {
        try { fs.unlinkSync(path.join(targetDir, file)); } catch {}
      }
    }
  });
}

function getProfileAgentsDir(): string {
  const portablePath = process.env['VSCODE_PORTABLE'];
  if (portablePath) {
    return path.join(portablePath, 'user-data', 'User', 'agents');
  }

  switch (process.platform) {
    case 'darwin':
      return path.join(
        process.env['HOME'] || '',
        'Library', 'Application Support', 'Code', 'User', 'agents'
      );
    case 'win32':
      return path.join(
        process.env['APPDATA'] || '',
        'Code', 'User', 'agents'
      );
    default: // linux
      return path.join(
        process.env['HOME'] || '',
        '.config', 'Code', 'User', 'agents'
      );
  }
}

export function deactivate() {}
