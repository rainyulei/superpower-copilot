// src/tools/index.ts
import { ToolKit } from '../skills/types';
import { FileOps } from './files';
import { GitOps } from './git';
import { TerminalOps } from './terminal';
import { WorkspaceOps } from './workspace';

export function createToolKit(): ToolKit {
  return {
    files: new FileOps(),
    git: new GitOps(),
    terminal: new TerminalOps(),
    workspace: new WorkspaceOps(),
  };
}
