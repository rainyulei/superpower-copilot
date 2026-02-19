// src/skills/types.ts
import * as vscode from 'vscode';

export interface ToolKit {
  files: {
    read(uri: vscode.Uri): Promise<string>;
    write(uri: vscode.Uri, content: string): Promise<void>;
    exists(uri: vscode.Uri): Promise<boolean>;
    listDir(uri: vscode.Uri): Promise<string[]>;
  };
  git: {
    log(count: number): Promise<string[]>;
    diff(): Promise<string>;
    diffStaged(): Promise<string>;
    stage(paths: string[]): Promise<void>;
    commit(message: string): Promise<void>;
    currentBranch(): Promise<string>;
    status(): Promise<string>;
  };
  terminal: {
    run(command: string): Promise<{ stdout: string; exitCode: number }>;
  };
  workspace: {
    getSummary(): Promise<WorkspaceSummary>;
  };
}

export interface WorkspaceSummary {
  name: string;
  rootFiles: string[];
  projectType: string;
}

export interface SessionState {
  get<T>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  transfer(fromSkill: string, toSkill: string, key: string): void;
  activate(skillId: string): void;
  serialize(): Record<string, unknown>;
}

export interface SkillContext {
  request: vscode.ChatRequest;
  chatContext: vscode.ChatContext;
  stream: vscode.ChatResponseStream;
  token: vscode.CancellationToken;
  model: vscode.LanguageModelChat;
  session: SessionState;
  tools: ToolKit;
}

export interface SkillResult {
  nextSkill?: string;
  metadata?: Record<string, unknown>;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  systemPrompt: string;
  handle(ctx: SkillContext): Promise<SkillResult>;
}
