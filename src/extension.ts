import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const AGENTS_SOURCE_DIR = '.github/agents';
const SETTING_KEY = 'chat.agentFilesLocations';
const GLOBAL_AGENTS_DIR = '~/.bitfrog-copilot/agents';

function getTargetDir(): string {
  const homeDir = process.env['HOME'] || process.env['USERPROFILE'] || '';
  return path.join(homeDir, '.bitfrog-copilot', 'agents');
}

export function activate(context: vscode.ExtensionContext) {
  const sourceDir = path.join(context.extensionPath, AGENTS_SOURCE_DIR);
  const targetDir = getTargetDir();

  try {
    // 1. Clean old agent files
    if (fs.existsSync(targetDir)) {
      for (const file of fs.readdirSync(targetDir)) {
        if (file.endsWith('.agent.md') || file.endsWith('.md')) {
          try { fs.unlinkSync(path.join(targetDir, file)); } catch {}
        }
      }
    }

    // 2. Copy fresh agent files + philosophy doc
    fs.mkdirSync(targetDir, { recursive: true });
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
    }

    // 3. Register path in VS Code settings
    registerAgentsPath();

    vscode.window.showInformationMessage(
      `BitFrog Copilot: ${files.filter(f => f.endsWith('.agent.md')).length} agents activated.`
    );
  } catch (err) {
    vscode.window.showErrorMessage(
      `BitFrog Copilot: Failed to register agents — ${err}`
    );
  }
}

async function registerAgentsPath(): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  const current = config.get<Record<string, boolean>>(SETTING_KEY) || {};
  await config.update(
    SETTING_KEY,
    { ...current, [GLOBAL_AGENTS_DIR]: true },
    vscode.ConfigurationTarget.Global
  );
}

export function deactivate() {}
