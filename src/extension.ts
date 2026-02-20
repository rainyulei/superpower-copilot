import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const AGENTS_DIR = 'agents';
const SETTING_KEY = 'chat.agentFilesLocations';
const GLOBAL_AGENTS_DIR = '~/.superpower-copilot/agents';

function getTargetDir(): string {
  const homeDir = process.env['HOME'] || process.env['USERPROFILE'] || '';
  return path.join(homeDir, '.superpower-copilot', 'agents');
}

export function activate(context: vscode.ExtensionContext) {
  const sourceDir = path.join(context.extensionPath, AGENTS_DIR);
  const targetDir = getTargetDir();

  try {
    // 1. Clean target directory — remove ALL old .agent.md files first
    if (fs.existsSync(targetDir)) {
      for (const file of fs.readdirSync(targetDir)) {
        if (file.endsWith('.agent.md')) {
          try { fs.unlinkSync(path.join(targetDir, file)); } catch {}
        }
      }
    }

    // 2. Create directory and copy fresh agent files
    fs.mkdirSync(targetDir, { recursive: true });
    const agentFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.agent.md'));
    for (const file of agentFiles) {
      fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
    }

    // 3. Force-register the path in settings (always write, don't skip)
    forceRegisterAgentsPath();

    vscode.window.showInformationMessage(
      `Superpower Copilot: ${agentFiles.length} agents activated.`
    );
  } catch (err) {
    vscode.window.showErrorMessage(
      `Superpower Copilot: Failed to register agents — ${err}`
    );
  }
}

async function forceRegisterAgentsPath(): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  const current = config.get<Record<string, boolean>>(SETTING_KEY) || {};
  // Always set — even if key exists, force it to true
  await config.update(
    SETTING_KEY,
    { ...current, [GLOBAL_AGENTS_DIR]: true },
    vscode.ConfigurationTarget.Global
  );
}

export function deactivate() {
  // Best-effort cleanup on deactivation
  try {
    const targetDir = getTargetDir();
    if (fs.existsSync(targetDir)) {
      for (const file of fs.readdirSync(targetDir)) {
        if (file.endsWith('.agent.md')) {
          try { fs.unlinkSync(path.join(targetDir, file)); } catch {}
        }
      }
      // Remove directory if empty
      try { fs.rmdirSync(targetDir); } catch {}
      try { fs.rmdirSync(path.dirname(targetDir)); } catch {}
    }
  } catch {}
}
