// src/tools/git.ts
import * as cp from 'child_process';
import * as vscode from 'vscode';

export class GitOps {
  private get cwd(): string {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
  }

  private exec(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cp.exec(command, { cwd: this.cwd }, (error, stdout, stderr) => {
        if (error) reject(new Error(stderr || error.message));
        else resolve(stdout.trim());
      });
    });
  }

  async log(count: number): Promise<string[]> {
    const output = await this.exec(`git log --oneline -${count}`);
    return output ? output.split('\n') : [];
  }

  async diff(): Promise<string> {
    return this.exec('git diff');
  }

  async diffStaged(): Promise<string> {
    return this.exec('git diff --staged');
  }

  async stage(paths: string[]): Promise<void> {
    await this.exec(`git add ${paths.map(p => `"${p}"`).join(' ')}`);
  }

  async commit(message: string): Promise<void> {
    await this.exec(`git commit -m "${message.replace(/"/g, '\\"')}"`);
  }

  async currentBranch(): Promise<string> {
    return this.exec('git branch --show-current');
  }

  async status(): Promise<string> {
    return this.exec('git status --short');
  }
}
