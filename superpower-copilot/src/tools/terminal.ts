// src/tools/terminal.ts
import * as cp from 'child_process';
import * as vscode from 'vscode';

export class TerminalOps {
  async run(command: string): Promise<{ stdout: string; exitCode: number }> {
    const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    return new Promise((resolve) => {
      cp.exec(command, { cwd, timeout: 60000 }, (error, stdout, stderr) => {
        resolve({
          stdout: (stdout + stderr).trim(),
          exitCode: error ? (error.code ?? 1) : 0,
        });
      });
    });
  }
}
