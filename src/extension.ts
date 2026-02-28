import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { OptionsTool } from './tools/options';
import { OptionsViewProvider } from './webview/optionsViewProvider';

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

    // 4. Register sidebar webview
    const optionsProvider = new OptionsViewProvider(context.extensionUri);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        OptionsViewProvider.viewType,
        optionsProvider,
        { webviewOptions: { retainContextWhenHidden: true } }
      )
    );

    // 5. Register language model tools (connected to sidebar provider)
    const optionsTool = new OptionsTool();
    optionsTool.setProvider(optionsProvider);
    context.subscriptions.push(
      vscode.lm.registerTool('superpower-copilot_options', optionsTool)
    );

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

// DO NOT clean up files or settings in deactivate().
// VS Code calls deactivate() on extension UPDATE before the new version activates,
// which would delete agent files and break registration.
// Cleanup only happens via vscode:uninstall script (src/uninstall.ts).
export function deactivate() {}
