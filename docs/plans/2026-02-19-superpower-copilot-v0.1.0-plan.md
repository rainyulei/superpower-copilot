# Superpower Copilot v0.1.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the VS Code extension framework and implement the first 2 skills (brainstorming + writing-plans), enabling `@superpower /brainstorm` and `@superpower /plan` in Copilot Chat.

**Architecture:** Single VS Code Extension with one Chat Participant (`@superpower`). Skills are TypeScript classes implementing a shared `Skill` interface. A 3-tier router handles slash commands, keyword matching, and LLM classification. State is managed via `SessionState` backed by `chatContext.history` and `workspaceState`.

**Tech Stack:** TypeScript 5.x, VS Code Extension API (^1.96), esbuild, Mocha

---

### Task 1: Scaffold Extension Project

**Files:**
- Create: `superpower-copilot/package.json`
- Create: `superpower-copilot/tsconfig.json`
- Create: `superpower-copilot/.vscode/launch.json`
- Create: `superpower-copilot/.vscodeignore`
- Create: `superpower-copilot/.gitignore`
- Create: `superpower-copilot/esbuild.js`
- Create: `superpower-copilot/src/extension.ts`

**Step 1: Create project directory**

```bash
mkdir -p superpower-copilot/.vscode superpower-copilot/src
```

**Step 2: Create package.json**

```json
{
  "name": "superpower-copilot",
  "displayName": "Superpower Copilot",
  "description": "Structured development workflows for GitHub Copilot Chat",
  "version": "0.1.0",
  "publisher": "rainlei",
  "license": "MIT",
  "engines": {
    "vscode": "^1.96.0"
  },
  "categories": ["AI", "Chat"],
  "keywords": ["copilot", "agent", "tdd", "code-review", "debugging", "workflow"],
  "main": "./dist/extension.js",
  "activationEvents": [],
  "extensionDependencies": [
    "github.copilot-chat"
  ],
  "contributes": {
    "chatParticipants": [
      {
        "id": "superpower.agent",
        "name": "superpower",
        "fullName": "Superpower Copilot",
        "description": "Structured dev workflows: brainstorm, plan, TDD, debug, review",
        "isSticky": true,
        "commands": [
          { "name": "brainstorm", "description": "Explore ideas and design before implementation" },
          { "name": "plan", "description": "Create a step-by-step implementation plan" }
        ]
      }
    ],
    "configuration": {
      "title": "Superpower Copilot",
      "properties": {
        "superpower.plansDirectory": {
          "type": "string",
          "default": "docs/plans",
          "description": "Directory for saving plan and design documents"
        }
      }
    }
  },
  "scripts": {
    "compile": "node esbuild.js",
    "watch": "node esbuild.js --watch",
    "lint": "eslint src/",
    "test": "vscode-test",
    "package": "vsce package",
    "publish": "vsce publish"
  },
  "devDependencies": {
    "@types/vscode": "^1.96.0",
    "@types/mocha": "^10.0.9",
    "@types/node": "^22.0.0",
    "@vscode/test-cli": "^0.0.10",
    "@vscode/test-electron": "^2.4.1",
    "@vscode/vsce": "^3.0.0",
    "esbuild": "^0.24.0",
    "eslint": "^9.0.0",
    "typescript": "^5.7.0"
  }
}
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "Node16",
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "out",
    "rootDir": "src",
    "sourceMap": true,
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "Node16",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", "dist", "test"]
}
```

**Step 4: Create esbuild.js**

```javascript
const esbuild = require('esbuild');
const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  sourcemap: true,
  minify: false,
};

if (isWatch) {
  esbuild.context(buildOptions).then(ctx => {
    ctx.watch();
    console.log('Watching for changes...');
  });
} else {
  esbuild.build(buildOptions).then(() => {
    console.log('Build complete');
  });
}
```

**Step 5: Create .vscode/launch.json**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}/superpower-copilot"],
      "outFiles": ["${workspaceFolder}/superpower-copilot/dist/**/*.js"],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

**Step 6: Create .vscodeignore**

```
.vscode/**
src/**
test/**
out/**
node_modules/**
.gitignore
tsconfig.json
esbuild.js
**/*.map
```

**Step 7: Create .gitignore**

```
node_modules/
dist/
out/
*.vsix
```

**Step 8: Create minimal extension.ts placeholder**

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // TODO: register participant in Task 5
}

export function deactivate() {}
```

**Step 9: Install dependencies and verify build**

```bash
cd superpower-copilot && npm install && npm run compile
```

Expected: Build succeeds, `dist/extension.js` created.

**Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold superpower-copilot extension project"
```

---

### Task 2: Implement Skill Types and Registry

**Files:**
- Create: `superpower-copilot/src/skills/types.ts`
- Create: `superpower-copilot/src/skills/registry.ts`
- Create: `superpower-copilot/test/unit/registry.test.ts`

**Step 1: Write the failing test for SkillRegistry**

```typescript
// test/unit/registry.test.ts
import * as assert from 'assert';
import { SkillRegistry } from '../../src/skills/registry';
import { Skill, SkillContext, SkillResult } from '../../src/skills/types';

function createMockSkill(id: string, keywords: string[] = []): Skill {
  return {
    id,
    name: id,
    description: `Mock ${id} skill`,
    keywords,
    systemPrompt: '',
    async handle(_ctx: SkillContext): Promise<SkillResult> {
      return {};
    },
  };
}

describe('SkillRegistry', () => {
  let registry: SkillRegistry;

  beforeEach(() => {
    registry = new SkillRegistry();
  });

  it('should register and retrieve a skill by id', () => {
    const skill = createMockSkill('brainstorm');
    registry.register(skill);
    assert.strictEqual(registry.get('brainstorm'), skill);
  });

  it('should return undefined for unknown skill id', () => {
    assert.strictEqual(registry.get('nonexistent'), undefined);
  });

  it('should return all registered skills', () => {
    registry.register(createMockSkill('a'));
    registry.register(createMockSkill('b'));
    assert.strictEqual(registry.all().length, 2);
  });

  it('should match skill by keyword', () => {
    registry.register(createMockSkill('debug', ['debug', 'bug', '调试']));
    registry.register(createMockSkill('brainstorm', ['idea', '想法']));
    assert.strictEqual(registry.match('I found a bug')?.id, 'debug');
    assert.strictEqual(registry.match('我有一个想法')?.id, 'brainstorm');
  });

  it('should return undefined when no keyword matches', () => {
    registry.register(createMockSkill('debug', ['debug']));
    assert.strictEqual(registry.match('hello world'), undefined);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/registry.test.ts --require ts-node/register
```

Expected: FAIL — modules not found.

**Step 3: Create types.ts**

```typescript
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
    stage(paths: string[]): Promise<void>;
    commit(message: string): Promise<void>;
    currentBranch(): Promise<string>;
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
```

**Step 4: Create registry.ts**

```typescript
// src/skills/registry.ts
import { Skill } from './types';

export class SkillRegistry {
  private skills = new Map<string, Skill>();

  register(skill: Skill): void {
    this.skills.set(skill.id, skill);
  }

  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  all(): Skill[] {
    return Array.from(this.skills.values());
  }

  match(prompt: string): Skill | undefined {
    const lower = prompt.toLowerCase();
    for (const skill of this.skills.values()) {
      for (const keyword of skill.keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          return skill;
        }
      }
    }
    return undefined;
  }
}
```

**Step 5: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/registry.test.ts --require ts-node/register
```

Expected: 5 tests PASS.

**Step 6: Commit**

```bash
git add src/skills/types.ts src/skills/registry.ts test/unit/registry.test.ts
git commit -m "feat: add Skill interface and SkillRegistry with keyword matching"
```

---

### Task 3: Implement SessionState

**Files:**
- Create: `superpower-copilot/src/state/session.ts`
- Create: `superpower-copilot/test/unit/session.test.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/session.test.ts
import * as assert from 'assert';
import { SessionStateImpl } from '../../src/state/session';

describe('SessionState', () => {
  let session: SessionStateImpl;

  beforeEach(() => {
    session = new SessionStateImpl();
  });

  it('should store and retrieve values for active skill', () => {
    session.activate('brainstorm');
    session.set('phase', 'explore');
    assert.strictEqual(session.get<string>('phase'), 'explore');
  });

  it('should isolate state between skills', () => {
    session.activate('brainstorm');
    session.set('phase', 'explore');
    session.activate('tdd');
    session.set('phase', 'red');
    assert.strictEqual(session.get<string>('phase'), 'red');
    session.activate('brainstorm');
    assert.strictEqual(session.get<string>('phase'), 'explore');
  });

  it('should return undefined for missing keys', () => {
    session.activate('brainstorm');
    assert.strictEqual(session.get('nonexistent'), undefined);
  });

  it('should transfer data between skills', () => {
    session.activate('brainstorm');
    session.set('design', { title: 'My Design' });
    session.transfer('brainstorm', 'plan', 'design');
    session.activate('plan');
    assert.deepStrictEqual(session.get('design'), { title: 'My Design' });
  });

  it('should serialize all skill states', () => {
    session.activate('brainstorm');
    session.set('phase', 'explore');
    session.activate('tdd');
    session.set('phase', 'red');
    const data = session.serialize();
    assert.strictEqual((data['brainstorm'] as any)['phase'], 'explore');
    assert.strictEqual((data['tdd'] as any)['phase'], 'red');
  });

  it('should restore from serialized data', () => {
    const data = {
      brainstorm: { phase: 'design' },
      tdd: { phase: 'green' },
    };
    const restored = SessionStateImpl.fromSerialized(data);
    restored.activate('brainstorm');
    assert.strictEqual(restored.get<string>('phase'), 'design');
    restored.activate('tdd');
    assert.strictEqual(restored.get<string>('phase'), 'green');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/session.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement session.ts**

```typescript
// src/state/session.ts
import { SessionState } from '../skills/types';

export class SessionStateImpl implements SessionState {
  private store = new Map<string, Map<string, unknown>>();
  private activeSkillId: string | null = null;

  activate(skillId: string): void {
    this.activeSkillId = skillId;
    if (!this.store.has(skillId)) {
      this.store.set(skillId, new Map());
    }
  }

  get<T>(key: string): T | undefined {
    if (!this.activeSkillId) return undefined;
    return this.store.get(this.activeSkillId)?.get(key) as T | undefined;
  }

  set(key: string, value: unknown): void {
    if (!this.activeSkillId) return;
    this.store.get(this.activeSkillId)!.set(key, value);
  }

  transfer(fromSkill: string, toSkill: string, key: string): void {
    const value = this.store.get(fromSkill)?.get(key);
    if (value !== undefined) {
      if (!this.store.has(toSkill)) {
        this.store.set(toSkill, new Map());
      }
      this.store.get(toSkill)!.set(key, value);
    }
  }

  serialize(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [skillId, state] of this.store) {
      result[skillId] = Object.fromEntries(state);
    }
    return result;
  }

  static fromSerialized(data: Record<string, unknown>): SessionStateImpl {
    const session = new SessionStateImpl();
    for (const [skillId, state] of Object.entries(data)) {
      session.store.set(skillId, new Map(Object.entries(state as Record<string, unknown>)));
    }
    return session;
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/session.test.ts --require ts-node/register
```

Expected: 6 tests PASS.

**Step 5: Commit**

```bash
git add src/state/session.ts test/unit/session.test.ts
git commit -m "feat: add SessionState with per-skill isolation and serialization"
```

---

### Task 4: Implement Router

**Files:**
- Create: `superpower-copilot/src/router.ts`
- Create: `superpower-copilot/test/unit/router.test.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/router.test.ts
import * as assert from 'assert';
import { SkillRouter } from '../../src/router';
import { SkillRegistry } from '../../src/skills/registry';
import { Skill, SkillContext, SkillResult } from '../../src/skills/types';

function createMockSkill(id: string, keywords: string[]): Skill {
  return {
    id, name: id,
    description: `${id} skill`,
    keywords,
    systemPrompt: '',
    async handle(_ctx: SkillContext): Promise<SkillResult> { return {}; },
  };
}

describe('SkillRouter', () => {
  let registry: SkillRegistry;
  let router: SkillRouter;

  beforeEach(() => {
    registry = new SkillRegistry();
    registry.register(createMockSkill('brainstorm', ['brainstorm', 'idea', '想法', '设计']));
    registry.register(createMockSkill('debug', ['debug', 'bug', '调试', '报错']));
    registry.register(createMockSkill('tdd', ['tdd', 'test-driven', '测试驱动']));
    router = new SkillRouter(registry);
  });

  it('should match by keyword for "I found a bug"', () => {
    const result = router.matchByKeyword('I found a bug');
    assert.strictEqual(result?.id, 'debug');
  });

  it('should match by keyword for Chinese input "我有一个想法"', () => {
    const result = router.matchByKeyword('我有一个想法');
    assert.strictEqual(result?.id, 'brainstorm');
  });

  it('should return undefined when no keyword matches', () => {
    const result = router.matchByKeyword('optimize the database');
    assert.strictEqual(result, undefined);
  });

  it('should fallback to brainstorm as default', () => {
    assert.strictEqual(router.defaultSkill.id, 'brainstorm');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/router.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement router.ts**

```typescript
// src/router.ts
import * as vscode from 'vscode';
import { SkillRegistry } from './skills/registry';
import { Skill } from './skills/types';

export class SkillRouter {
  constructor(private registry: SkillRegistry) {}

  get defaultSkill(): Skill {
    return this.registry.get('brainstorm')!;
  }

  matchByKeyword(prompt: string): Skill | undefined {
    return this.registry.match(prompt);
  }

  async route(
    prompt: string,
    model: vscode.LanguageModelChat,
    token: vscode.CancellationToken
  ): Promise<Skill> {
    // Tier 1: keyword matching
    const keywordMatch = this.matchByKeyword(prompt);
    if (keywordMatch) return keywordMatch;

    // Tier 2: LLM classification
    try {
      const skillList = this.registry.all()
        .map(s => `- ${s.id}: ${s.description}`)
        .join('\n');

      const messages = [
        vscode.LanguageModelChatMessage.User(
          `Given this user request: "${prompt}"\n` +
          `Which skill best matches? Pick exactly one from:\n${skillList}\n` +
          `Reply with ONLY the skill id, nothing else.`
        ),
      ];

      const response = await model.sendRequest(messages, {}, token);
      let text = '';
      for await (const chunk of response.text) {
        text += chunk;
      }

      const skillId = text.trim().toLowerCase();
      const matched = this.registry.get(skillId);
      if (matched) return matched;
    } catch {
      // LLM classification failed, fall through to default
    }

    // Tier 3: fallback
    return this.defaultSkill;
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/router.test.ts --require ts-node/register
```

Expected: 4 tests PASS.

**Step 5: Commit**

```bash
git add src/router.ts test/unit/router.test.ts
git commit -m "feat: add SkillRouter with keyword matching and LLM fallback"
```

---

### Task 5: Implement Tools Layer

**Files:**
- Create: `superpower-copilot/src/tools/files.ts`
- Create: `superpower-copilot/src/tools/git.ts`
- Create: `superpower-copilot/src/tools/terminal.ts`
- Create: `superpower-copilot/src/tools/workspace.ts`
- Create: `superpower-copilot/src/tools/index.ts`

**Step 1: Create files.ts**

```typescript
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
```

**Step 2: Create git.ts**

```typescript
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
```

**Step 3: Create terminal.ts**

```typescript
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
```

**Step 4: Create workspace.ts**

```typescript
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
```

**Step 5: Create index.ts (ToolKit factory)**

```typescript
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
```

**Step 6: Verify build succeeds**

```bash
cd superpower-copilot && npm run compile
```

Expected: Build succeeds, no type errors.

**Step 7: Commit**

```bash
git add src/tools/
git commit -m "feat: add tools layer (files, git, terminal, workspace)"
```

---

### Task 6: Implement Brainstorming Skill

**Files:**
- Create: `superpower-copilot/src/skills/brainstorming.ts`
- Create: `superpower-copilot/test/unit/brainstorming.test.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/brainstorming.test.ts
import * as assert from 'assert';
import { brainstormingSkill } from '../../src/skills/brainstorming';

describe('BrainstormingSkill', () => {
  it('should have correct id', () => {
    assert.strictEqual(brainstormingSkill.id, 'brainstorm');
  });

  it('should have keywords for routing', () => {
    assert.ok(brainstormingSkill.keywords.includes('brainstorm'));
    assert.ok(brainstormingSkill.keywords.includes('设计'));
    assert.ok(brainstormingSkill.keywords.includes('idea'));
  });

  it('should detect phase transition from explore to approach', () => {
    const result = brainstormingSkill.detectPhase(
      'Here are 3 possible approaches:\n**Option A (recommended):**',
      'explore'
    );
    assert.strictEqual(result, 'approach');
  });

  it('should detect phase transition from approach to design', () => {
    const result = brainstormingSkill.detectPhase(
      '## Architecture Overview\nThe system consists of...',
      'approach'
    );
    assert.strictEqual(result, 'design');
  });

  it('should detect phase transition from design to complete', () => {
    const result = brainstormingSkill.detectPhase(
      '## Summary\nThe design is now complete.',
      'design'
    );
    assert.strictEqual(result, 'complete');
  });

  it('should not transition when no signal detected', () => {
    const result = brainstormingSkill.detectPhase(
      'What is the primary use case for this tool?',
      'explore'
    );
    assert.strictEqual(result, 'explore');
  });

  it('should include HARD-GATE in system prompt', () => {
    assert.ok(brainstormingSkill.systemPrompt.includes('NEVER write code'));
  });

  it('should suggest plan as next skill', () => {
    assert.ok(brainstormingSkill.systemPrompt.includes('plan'));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/brainstorming.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement brainstorming.ts**

```typescript
// src/skills/brainstorming.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are a product architect helping turn ideas into designs through collaborative dialogue.

## Hard Rules
- Ask ONE question at a time, prefer multiple choice when possible
- NEVER write code, scaffold projects, or take any implementation action
- Always propose 2-3 approaches with trade-offs before settling on one
- Scale detail to complexity: simple idea = short design, complex = thorough
- Get user approval after each design section before moving on

## Workflow Phases
Progress through these phases in order:

### Phase: EXPLORE
- Check project context (files, structure, tech stack)
- Ask clarifying questions one at a time about: purpose, constraints, success criteria
- Move to APPROACH when you understand WHAT to build

### Phase: APPROACH
- Propose 2-3 approaches with trade-offs
- Lead with your recommendation and explain why
- Move to DESIGN when user picks an approach

### Phase: DESIGN
- Present design section by section:
  1. Architecture overview
  2. Key components
  3. Data flow
  4. Error handling
  5. Testing strategy
- Ask "Does this section look right?" after each
- Move to COMPLETE when all sections approved

### Phase: COMPLETE
- Summarize the final design in a concise document
- Suggest saving to docs/plans/ directory
- Suggest creating an implementation plan as next step

Current phase: {{phase}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  explore: {
    signals: [
      /\b(approach|option|方案|建议.*种|propose|recommend)/i,
      /\*\*option [abc]\*\*/i,
      /here are.*(?:2|3|two|three).*(?:approach|option|way)/i,
    ],
    next: 'approach',
  },
  approach: {
    signals: [
      /\b(architecture|design|架构|组件|component|详细设计)/i,
      /^##\s+(architecture|design|overview)/im,
    ],
    next: 'design',
  },
  design: {
    signals: [
      /\b(summary|complete|总结|设计完成|final design)/i,
      /^##\s+summary/im,
      /design is.*complete/i,
    ],
    next: 'complete',
  },
};

export const brainstormingSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'brainstorm',
  name: 'Brainstorming',
  description: 'Explore ideas, clarify requirements, and design before implementation',
  keywords: ['brainstorm', 'idea', 'design', '想法', '设计', '构思', '头脑风暴', 'architect', '架构'],
  systemPrompt: SYSTEM_PROMPT,

  detectPhase(response: string, currentPhase: string): string {
    const rule = PHASE_TRANSITIONS[currentPhase];
    if (!rule) return currentPhase;
    if (rule.signals.some(re => re.test(response))) return rule.next;
    return currentPhase;
  },

  async handle(ctx: SkillContext): Promise<SkillResult> {
    const { request, chatContext, stream, model, token, session, tools } = ctx;

    // Restore or init phase
    const phase = session.get<string>('phase') ?? 'explore';

    // Gather project context on first entry
    if (phase === 'explore' && !session.get('contextGathered')) {
      try {
        const summary = await tools.workspace.getSummary();
        const commits = await tools.git.log(5);
        session.set('projectContext', { summary, recentCommits: commits });
      } catch {
        session.set('projectContext', { summary: { name: 'unknown' }, recentCommits: [] });
      }
      session.set('contextGathered', true);
    }

    // Build messages
    const messages: vscode.LanguageModelChatMessage[] = [];

    // System prompt with current phase
    messages.push(
      vscode.LanguageModelChatMessage.User(
        SYSTEM_PROMPT.replace('{{phase}}', phase)
      )
    );

    // Project context
    const projectCtx = session.get<object>('projectContext');
    if (projectCtx) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Project context:\n${JSON.stringify(projectCtx, null, 2)}`
        )
      );
    }

    // Conversation history
    for (const turn of chatContext.history) {
      if (turn instanceof vscode.ChatRequestTurn) {
        messages.push(vscode.LanguageModelChatMessage.User(turn.prompt));
      } else if (turn instanceof vscode.ChatResponseTurn) {
        const text = turn.response
          .filter((r): r is vscode.ChatResponseMarkdownPart => r instanceof vscode.ChatResponseMarkdownPart)
          .map(r => r.value.value)
          .join('');
        if (text) {
          messages.push(vscode.LanguageModelChatMessage.Assistant(text));
        }
      }
    }

    // Current user input
    messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

    // Call LLM
    const response = await model.sendRequest(messages, {}, token);

    let fullResponse = '';
    for await (const chunk of response.text) {
      stream.markdown(chunk);
      fullResponse += chunk;
    }

    // Detect phase transition
    const newPhase = this.detectPhase(fullResponse, phase);
    if (newPhase !== phase) {
      session.set('phase', newPhase);
    }

    // On complete: offer next actions
    if (newPhase === 'complete') {
      stream.button({
        command: 'superpower.saveDesign',
        title: '💾 Save Design Doc',
        arguments: [fullResponse],
      });

      return {
        nextSkill: 'plan',
        metadata: { skillId: 'brainstorm', design: fullResponse },
      };
    }

    return { metadata: { skillId: 'brainstorm' } };
  },
};
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/brainstorming.test.ts --require ts-node/register
```

Expected: 8 tests PASS.

**Step 5: Commit**

```bash
git add src/skills/brainstorming.ts test/unit/brainstorming.test.ts
git commit -m "feat: implement brainstorming skill with phase detection"
```

---

### Task 7: Implement Writing Plans Skill

**Files:**
- Create: `superpower-copilot/src/skills/writing-plans.ts`
- Create: `superpower-copilot/test/unit/writing-plans.test.ts`

**Step 1: Write the failing test**

```typescript
// test/unit/writing-plans.test.ts
import * as assert from 'assert';
import { writingPlansSkill } from '../../src/skills/writing-plans';

describe('WritingPlansSkill', () => {
  it('should have correct id', () => {
    assert.strictEqual(writingPlansSkill.id, 'plan');
  });

  it('should have keywords for routing', () => {
    assert.ok(writingPlansSkill.keywords.includes('plan'));
    assert.ok(writingPlansSkill.keywords.includes('计划'));
  });

  it('should detect phase transition from analyze to decompose', () => {
    const result = writingPlansSkill.detectPhase(
      'Breaking this down into the following tasks:\n### Task 1',
      'analyze'
    );
    assert.strictEqual(result, 'decompose');
  });

  it('should detect phase transition from decompose to write', () => {
    const result = writingPlansSkill.detectPhase(
      '# Feature Implementation Plan\n> **For Claude:** REQUIRED',
      'decompose'
    );
    assert.strictEqual(result, 'write');
  });

  it('should detect phase transition from write to complete', () => {
    const result = writingPlansSkill.detectPhase(
      'Plan complete and saved to docs/plans/2026-02-19-feature.md',
      'write'
    );
    assert.strictEqual(result, 'complete');
  });

  it('should enforce bite-sized tasks in system prompt', () => {
    assert.ok(writingPlansSkill.systemPrompt.includes('2-5 minutes'));
  });

  it('should enforce TDD in system prompt', () => {
    assert.ok(writingPlansSkill.systemPrompt.includes('failing test'));
  });

  it('should enforce exact file paths in system prompt', () => {
    assert.ok(writingPlansSkill.systemPrompt.includes('exact file path'));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd superpower-copilot && npx mocha test/unit/writing-plans.test.ts --require ts-node/register
```

Expected: FAIL — module not found.

**Step 3: Implement writing-plans.ts**

```typescript
// src/skills/writing-plans.ts
import * as vscode from 'vscode';
import { Skill, SkillContext, SkillResult } from './types';

const SYSTEM_PROMPT = `You are an implementation planner that creates detailed, bite-sized plans for developers.

## Hard Rules
- Each step is ONE action taking 2-5 minutes
- Every task MUST include exact file paths (create/modify/test)
- Include COMPLETE code in the plan, never vague instructions like "add validation"
- Include exact commands with expected output for every verification step
- Assume the engineer has ZERO codebase knowledge
- Apply DRY, YAGNI, TDD, frequent commits

## Task Granularity (each is a separate step)
- "Write the failing test" — one step
- "Run it to make sure it fails" — one step
- "Implement the minimal code to make it pass" — one step
- "Run the tests and make sure they pass" — one step
- "Commit" — one step

## Plan Document Structure
Every plan MUST start with:

\`\`\`markdown
# [Feature] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans

**Goal:** [One sentence]
**Architecture:** [2-3 sentences]
**Tech Stack:** [Key technologies]
---
\`\`\`

## Task Structure
Each task must follow:

\`\`\`markdown
### Task N: [Component Name]

**Files:**
- Create: \`exact/path/to/file.ts\`
- Modify: \`exact/path/to/existing.ts:line-range\`
- Test: \`tests/exact/path/to/test.ts\`

**Step 1: Write the failing test**
[Complete test code]

**Step 2: Run test to verify it fails**
Run: \`exact command\`
Expected: FAIL with "specific error"

**Step 3: Write minimal implementation**
[Complete implementation code]

**Step 4: Run test to verify it passes**
Run: \`exact command\`
Expected: PASS

**Step 5: Commit**
\`\`\`

## Workflow Phases

### Phase: ANALYZE
- Read the design document or user description
- Identify the scope: which components, files, dependencies
- Move to DECOMPOSE when scope is clear

### Phase: DECOMPOSE
- Break into ordered tasks, each with clear inputs/outputs
- Identify dependencies between tasks
- Move to WRITE when task breakdown is approved

### Phase: WRITE
- Generate the full plan document following the template
- Every task has: files, failing test, implementation, verification, commit
- Move to COMPLETE when plan is written

### Phase: COMPLETE
- Save plan to docs/plans/YYYY-MM-DD-<feature>.md
- Offer execution options

Current phase: {{phase}}
`;

const PHASE_TRANSITIONS: Record<string, { signals: RegExp[]; next: string }> = {
  analyze: {
    signals: [
      /\b(break.*down|decompos|task.*1|splitting|拆分|分解)/i,
      /###\s*Task\s*1/i,
    ],
    next: 'decompose',
  },
  decompose: {
    signals: [
      /^#\s+.*Implementation Plan/im,
      /\*\*For Claude:\*\*/i,
      /\*\*Goal:\*\*/i,
    ],
    next: 'write',
  },
  write: {
    signals: [
      /plan complete/i,
      /saved to.*docs\/plans/i,
      /计划.*完成/i,
    ],
    next: 'complete',
  },
};

export const writingPlansSkill: Skill & { detectPhase: (response: string, currentPhase: string) => string } = {
  id: 'plan',
  name: 'Writing Plans',
  description: 'Create detailed step-by-step implementation plans with TDD',
  keywords: ['plan', 'implementation', '计划', '规划', 'roadmap', 'steps', '步骤'],
  systemPrompt: SYSTEM_PROMPT,

  detectPhase(response: string, currentPhase: string): string {
    const rule = PHASE_TRANSITIONS[currentPhase];
    if (!rule) return currentPhase;
    if (rule.signals.some(re => re.test(response))) return rule.next;
    return currentPhase;
  },

  async handle(ctx: SkillContext): Promise<SkillResult> {
    const { request, chatContext, stream, model, token, session, tools } = ctx;

    const phase = session.get<string>('phase') ?? 'analyze';

    // If coming from brainstorm, load the design
    const handoff = session.get<string>('handoff');

    // Gather project context if not done
    if (!session.get('contextGathered')) {
      try {
        const summary = await tools.workspace.getSummary();
        session.set('projectContext', summary);
      } catch {
        // ignore
      }
      session.set('contextGathered', true);
    }

    // Build messages
    const messages: vscode.LanguageModelChatMessage[] = [];

    messages.push(
      vscode.LanguageModelChatMessage.User(
        SYSTEM_PROMPT.replace('{{phase}}', phase)
      )
    );

    // Inject design from brainstorm if available
    if (handoff) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Design document from brainstorming phase:\n${handoff}`
        )
      );
    }

    // Project context
    const projectCtx = session.get<object>('projectContext');
    if (projectCtx) {
      messages.push(
        vscode.LanguageModelChatMessage.User(
          `Project context:\n${JSON.stringify(projectCtx, null, 2)}`
        )
      );
    }

    // Conversation history
    for (const turn of chatContext.history) {
      if (turn instanceof vscode.ChatRequestTurn) {
        messages.push(vscode.LanguageModelChatMessage.User(turn.prompt));
      } else if (turn instanceof vscode.ChatResponseTurn) {
        const text = turn.response
          .filter((r): r is vscode.ChatResponseMarkdownPart => r instanceof vscode.ChatResponseMarkdownPart)
          .map(r => r.value.value)
          .join('');
        if (text) {
          messages.push(vscode.LanguageModelChatMessage.Assistant(text));
        }
      }
    }

    messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

    // Call LLM
    const response = await model.sendRequest(messages, {}, token);

    let fullResponse = '';
    for await (const chunk of response.text) {
      stream.markdown(chunk);
      fullResponse += chunk;
    }

    // Phase transition
    const newPhase = this.detectPhase(fullResponse, phase);
    if (newPhase !== phase) {
      session.set('phase', newPhase);
    }

    // On complete: save plan and offer execution
    if (newPhase === 'complete') {
      stream.button({
        command: 'superpower.savePlan',
        title: '💾 Save Plan',
        arguments: [fullResponse],
      });

      return {
        nextSkill: 'execute',
        metadata: { skillId: 'plan', plan: fullResponse },
      };
    }

    return { metadata: { skillId: 'plan' } };
  },
};
```

**Step 4: Run test to verify it passes**

```bash
cd superpower-copilot && npx mocha test/unit/writing-plans.test.ts --require ts-node/register
```

Expected: 8 tests PASS.

**Step 5: Commit**

```bash
git add src/skills/writing-plans.ts test/unit/writing-plans.test.ts
git commit -m "feat: implement writing-plans skill with TDD-enforced plan generation"
```

---

### Task 8: Implement Participant Handler (Orchestration Layer)

**Files:**
- Create: `superpower-copilot/src/participant.ts`
- Modify: `superpower-copilot/src/extension.ts`

**Step 1: Implement participant.ts**

```typescript
// src/participant.ts
import * as vscode from 'vscode';
import { SkillRegistry } from './skills/registry';
import { SkillRouter } from './router';
import { SkillContext, Skill, SkillResult } from './skills/types';
import { SessionStateImpl } from './state/session';
import { createToolKit } from './tools/index';
import { brainstormingSkill } from './skills/brainstorming';
import { writingPlansSkill } from './skills/writing-plans';

export class SuperpowerParticipant {
  private registry: SkillRegistry;
  private router: SkillRouter;
  private toolkit = createToolKit();

  constructor(private context: vscode.ExtensionContext) {
    this.registry = new SkillRegistry();
    this.router = new SkillRouter(this.registry);

    // Register skills
    this.registry.register(brainstormingSkill);
    this.registry.register(writingPlansSkill);
  }

  handler: vscode.ChatRequestHandler = async (
    request, chatContext, stream, token
  ) => {
    // 1. Restore session
    const session = this.restoreSession(chatContext);

    // 2. Determine skill
    let skill: Skill;

    if (request.command) {
      const matched = this.registry.get(request.command);
      if (!matched) {
        stream.markdown(`Unknown command: /${request.command}. Available: ${this.registry.all().map(s => '/' + s.id).join(', ')}`);
        return {};
      }
      skill = matched;
    } else {
      const activeSkillId = session.get<string>('activeSkillId');
      const isFollowUp = this.isFollowUpTurn(chatContext);

      if (activeSkillId && isFollowUp) {
        skill = this.registry.get(activeSkillId) ?? await this.router.route(request.prompt, request.model, token);
      } else {
        skill = await this.router.route(request.prompt, request.model, token);
        stream.progress(`Using ${skill.name}...`);
      }
    }

    // 3. Activate session
    session.activate(skill.id);
    session.set('activeSkillId', skill.id);

    // 4. Execute skill
    const ctx: SkillContext = {
      request, chatContext, stream, token,
      model: request.model,
      session,
      tools: this.toolkit,
    };

    let result: SkillResult;
    try {
      result = await skill.handle(ctx);
    } catch (err) {
      stream.markdown(`\n\n⚠️ Error in ${skill.name}: ${err instanceof Error ? err.message : String(err)}`);
      return { metadata: { error: true } };
    }

    // 5. Persist session
    this.context.workspaceState.update(
      'superpower.session',
      session.serialize()
    );

    // 6. Handle skill chaining
    if (result.nextSkill && result.metadata) {
      const nextSkill = this.registry.get(result.nextSkill);
      if (nextSkill) {
        session.transfer(skill.id, nextSkill.id, 'handoff');
      }
    }

    return result;
  };

  private restoreSession(chatContext: vscode.ChatContext): SessionStateImpl {
    // Try to restore from workspaceState
    const persisted = this.context.workspaceState.get<Record<string, unknown>>('superpower.session');
    if (persisted) {
      return SessionStateImpl.fromSerialized(persisted);
    }
    return new SessionStateImpl();
  }

  private isFollowUpTurn(chatContext: vscode.ChatContext): boolean {
    const lastResponse = chatContext.history
      .filter((h): h is vscode.ChatResponseTurn => h instanceof vscode.ChatResponseTurn)
      .at(-1);

    if (!lastResponse) return false;
    const meta = lastResponse.result as Record<string, unknown> | undefined;
    return meta?.metadata != null && !(meta.metadata as Record<string, unknown>)?.error;
  }
}
```

**Step 2: Update extension.ts**

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { SuperpowerParticipant } from './participant';

export function activate(context: vscode.ExtensionContext) {
  const superpower = new SuperpowerParticipant(context);

  // Register Chat Participant
  const participant = vscode.chat.createChatParticipant(
    'superpower.agent',
    superpower.handler
  );
  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');

  // Follow-up provider
  participant.followupProvider = {
    provideFollowups(result: vscode.ChatResult) {
      const followups: vscode.ChatFollowup[] = [];
      const nextSkill = (result as Record<string, unknown>)?.nextSkill as string | undefined;

      const labels: Record<string, string> = {
        plan: '📝 Create Implementation Plan',
        execute: '▶️ Start Execution',
        verify: '✅ Verify Before Completion',
        finish: '🚀 Finish Branch',
        review: '🔍 Request Code Review',
      };

      if (nextSkill && labels[nextSkill]) {
        followups.push({
          label: labels[nextSkill],
          command: nextSkill,
          prompt: '',
        });
      }

      return followups;
    },
  };

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('superpower.saveDesign', async (content: string) => {
      const config = vscode.workspace.getConfiguration('superpower');
      const dir = config.get<string>('plansDirectory', 'docs/plans');
      const root = vscode.workspace.workspaceFolders?.[0]?.uri;
      if (!root) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      const uri = vscode.Uri.joinPath(root, dir, `${date}-design.md`);
      await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
      vscode.window.showInformationMessage(`Design saved to ${dir}/${date}-design.md`);
    }),

    vscode.commands.registerCommand('superpower.savePlan', async (content: string) => {
      const config = vscode.workspace.getConfiguration('superpower');
      const dir = config.get<string>('plansDirectory', 'docs/plans');
      const root = vscode.workspace.workspaceFolders?.[0]?.uri;
      if (!root) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      const uri = vscode.Uri.joinPath(root, dir, `${date}-plan.md`);
      await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
      vscode.window.showInformationMessage(`Plan saved to ${dir}/${date}-plan.md`);
    }),
  );

  context.subscriptions.push(participant);
}

export function deactivate() {}
```

**Step 3: Verify build succeeds**

```bash
cd superpower-copilot && npm run compile
```

Expected: Build succeeds, `dist/extension.js` created.

**Step 4: Commit**

```bash
git add src/participant.ts src/extension.ts
git commit -m "feat: implement participant handler with routing and skill orchestration"
```

---

### Task 9: Integration Test — Full E2E Flow

**Files:**
- Create: `superpower-copilot/test/integration/participant.test.ts`
- Create: `superpower-copilot/.vscode/settings.json`

**Step 1: Create integration test**

```typescript
// test/integration/participant.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Superpower Copilot Integration', () => {
  test('Extension should be activated', async () => {
    const ext = vscode.extensions.getExtension('rainlei.superpower-copilot');
    assert.ok(ext, 'Extension not found');
    await ext!.activate();
    assert.ok(ext!.isActive, 'Extension not active');
  });

  test('Chat participant should be registered', async () => {
    // Verify the participant exists by checking registered commands
    const commands = await vscode.commands.getCommands();
    assert.ok(
      commands.includes('superpower.saveDesign'),
      'saveDesign command not registered'
    );
    assert.ok(
      commands.includes('superpower.savePlan'),
      'savePlan command not registered'
    );
  });
});
```

**Step 2: Create test runner config**

```json
// .vscode/settings.json
{
  "mocha.require": ["ts-node/register"],
  "mocha.spec": "test/**/*.test.ts"
}
```

**Step 3: Run integration tests**

```bash
cd superpower-copilot && npx vscode-test
```

Expected: 2 tests PASS (extension activates, commands registered).

**Step 4: Commit**

```bash
git add test/integration/ .vscode/settings.json
git commit -m "test: add integration tests for extension activation and commands"
```

---

### Task 10: Manual E2E Verification

**Step 1: Launch extension in debug mode**

Press F5 in VS Code with the `superpower-copilot` folder open. A new VS Code window opens with the extension loaded.

**Step 2: Test @superpower /brainstorm**

In the Copilot Chat panel, type:
```
@superpower /brainstorm I want to build a CLI task manager
```

Expected:
- Agent responds with a question about the project (Phase: explore)
- Only ONE question at a time
- No code written

**Step 3: Test @superpower /plan**

```
@superpower /plan Create a REST API with Express
```

Expected:
- Agent asks about scope/requirements (Phase: analyze)
- Eventually produces a structured plan with Tasks, Steps, and exact commands

**Step 4: Test smart routing**

```
@superpower 我有一个想法，做一个日程管理工具
```

Expected: Routes to brainstorming skill (keyword match: "想法")

**Step 5: Test follow-up buttons**

After brainstorming completes, verify the "📝 Create Implementation Plan" button appears.

**Step 6: Document any issues found**

Create GitHub issues for any bugs discovered during manual testing.

**Step 7: Final commit**

```bash
git add -A
git commit -m "chore: v0.1.0 ready — framework + brainstorming + writing-plans"
git tag v0.1.0
```

---

## Execution Options

Plan complete and saved to `docs/plans/2026-02-19-superpower-copilot-v0.1.0-plan.md`.

**1. Subagent-Driven (this session)** — Dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?
