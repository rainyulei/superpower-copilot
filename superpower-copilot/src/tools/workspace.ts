// src/tools/workspace.ts
import * as vscode from 'vscode';
import { WorkspaceSummary } from '../skills/types';

export class WorkspaceOps {
  async getSummary(): Promise<WorkspaceSummary> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (!root) {
      return { name: 'unknown', rootFiles: [], projectType: 'unknown' };
    }

    const entries = await vscode.workspace.fs.readDirectory(root);
    const fileNames = entries.map(([name]) => name);

    let projectType = 'unknown';
    if (fileNames.includes('package.json')) projectType = 'node';
    else if (fileNames.includes('Cargo.toml')) projectType = 'rust';
    else if (fileNames.includes('pyproject.toml') || fileNames.includes('setup.py')) projectType = 'python';
    else if (fileNames.includes('go.mod')) projectType = 'go';
    else if (fileNames.includes('pom.xml') || fileNames.includes('build.gradle')) projectType = 'java';

    return {
      name: root.path.split('/').pop() ?? 'unknown',
      rootFiles: fileNames,
      projectType,
    };
  }
}
