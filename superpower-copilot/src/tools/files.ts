// src/tools/files.ts
import * as vscode from 'vscode';

export class FileOps {
  async read(uri: vscode.Uri): Promise<string> {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return new TextDecoder().decode(bytes);
  }

  async write(uri: vscode.Uri, content: string): Promise<void> {
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
  }

  async exists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  async listDir(uri: vscode.Uri): Promise<string[]> {
    const entries = await vscode.workspace.fs.readDirectory(uri);
    return entries.map(([name]) => name);
  }
}
