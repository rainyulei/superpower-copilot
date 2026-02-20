// Runs when the extension is uninstalled (via package.json "vscode:uninstall")
// No VS Code API available — only Node.js built-ins
import * as path from 'path';
import * as fs from 'fs';

const homeDir = process.env['HOME'] || process.env['USERPROFILE'] || '';
const targetDir = path.join(homeDir, '.superpower-copilot', 'agents');
const parentDir = path.join(homeDir, '.superpower-copilot');

try {
  if (fs.existsSync(targetDir)) {
    for (const file of fs.readdirSync(targetDir)) {
      if (file.endsWith('.agent.md')) {
        fs.unlinkSync(path.join(targetDir, file));
      }
    }
    try { fs.rmdirSync(targetDir); } catch {}
    try { fs.rmdirSync(parentDir); } catch {}
  }
  console.log('Superpower Copilot: Cleaned up agent files.');
} catch (err) {
  console.error('Superpower Copilot: Cleanup failed —', err);
}
