# Chat Participant Feedback UI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `@superpower` Chat Participant to the VS Code extension with interactive feedback UI (questions with followup options, action buttons, agent handoff), coexisting with existing agent.md files.

**Architecture:** Single Chat Participant (`superpower.router`) with LM-based intent routing to sub-handlers. State managed via `ChatResult.metadata`. VS Code LM API for intent classification and agent responses.

**Tech Stack:** TypeScript, VS Code Chat Participant API (`vscode.chat`), VS Code Language Model API (`vscode.lm`), existing agent.md coexistence.

---

## Task 1: Create types module

**Files:**
- Create: `src/participant/types.ts`

**Step 1: Create the types file**

```typescript
// src/participant/types.ts
import * as vscode from 'vscode';

export type HandlerName = 'brainstorm' | 'plan';

export interface PendingState {
  question: string;
  step: number;
  context: Record<string, unknown>;
}

export interface SessionState {
  handler: HandlerName;
  pendingState?: PendingState;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface SubHandler {
  handle(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    state: SessionState | undefined
  ): Promise<vscode.ChatResult>;

  provideFollowups(
    result: vscode.ChatResult,
    context: vscode.ChatContext,
    token: vscode.CancellationToken
  ): vscode.ChatFollowup[];
}

export interface RouteResult {
  handler: HandlerName;
  confidence: number;
}
```

**Step 2: Verify compilation**

Run: `cd /Users/rainlei/holiday/powerfull_copolit && npx tsc --noEmit src/participant/types.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/participant/types.ts
git commit -m "feat: add Chat Participant type definitions"
```

---

## Task 2: Create LM API utility wrapper

**Files:**
- Create: `src/utils/lm.ts`

**Step 1: Create the LM utility**

```typescript
// src/utils/lm.ts
import * as vscode from 'vscode';

let cachedModel: vscode.LanguageModelChat | undefined;

export async function getModel(): Promise<vscode.LanguageModelChat> {
  if (cachedModel) {
    return cachedModel;
  }
  const models = await vscode.lm.selectChatModels({
    vendor: 'copilot',
    family: 'gpt-4o'
  });
  if (models.length === 0) {
    // Fallback: try any available model
    const allModels = await vscode.lm.selectChatModels();
    if (allModels.length === 0) {
      throw new Error('No language models available. Please ensure GitHub Copilot is active.');
    }
    cachedModel = allModels[0];
    return cachedModel;
  }
  cachedModel = models[0];
  return cachedModel;
}

export async function sendLmRequest(
  systemPrompt: string,
  userMessage: string,
  token: vscode.CancellationToken
): Promise<string> {
  const model = await getModel();
  const messages = [
    vscode.LanguageModelChatMessage.User(systemPrompt),
    vscode.LanguageModelChatMessage.User(userMessage),
  ];
  const response = await model.sendRequest(messages, {}, token);
  let result = '';
  for await (const part of response.text) {
    result += part;
  }
  return result;
}

export async function streamLmRequest(
  systemPrompt: string,
  userMessage: string,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<string> {
  const model = await getModel();
  const messages = [
    vscode.LanguageModelChatMessage.User(systemPrompt),
    vscode.LanguageModelChatMessage.User(userMessage),
  ];
  const response = await model.sendRequest(messages, {}, token);
  let result = '';
  for await (const part of response.text) {
    result += part;
    stream.markdown(part);
  }
  return result;
}
```

**Step 2: Verify compilation**

Run: `cd /Users/rainlei/holiday/powerfull_copolit && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/utils/lm.ts
git commit -m "feat: add LM API utility wrapper"
```

---

## Task 3: Create router module

**Files:**
- Create: `src/participant/router.ts`

**Step 1: Create the router**

```typescript
// src/participant/router.ts
import * as vscode from 'vscode';
import { HandlerName, RouteResult, SessionState } from './types';
import { sendLmRequest } from '../utils/lm';

const CLASSIFICATION_PROMPT = `You are a router that classifies user messages to the correct agent.
Available agents:
- brainstorm: exploring ideas, designing features, architecture, requirements analysis, "I want to build X"
- plan: creating implementation plans, step-by-step breakdowns, "how to implement X"

Respond with ONLY a JSON object, no markdown:
{"agent": "brainstorm" or "plan", "confidence": 0.0 to 1.0}

If the message doesn't clearly match any agent, set confidence below 0.5.`;

export function routeByCommand(command: string | undefined): HandlerName | undefined {
  if (!command) return undefined;
  const map: Record<string, HandlerName> = {
    brainstorm: 'brainstorm',
    plan: 'plan',
  };
  return map[command];
}

export function routeByState(
  context: vscode.ChatContext
): SessionState | undefined {
  const lastResponse = context.history
    .filter((h): h is vscode.ChatResponseTurn => h instanceof vscode.ChatResponseTurn)
    .at(-1);
  if (!lastResponse?.result?.metadata) return undefined;
  const meta = lastResponse.result.metadata as Record<string, unknown>;
  if (meta['handler'] && meta['pendingState']) {
    return meta as unknown as SessionState;
  }
  return undefined;
}

export async function routeByLm(
  prompt: string,
  token: vscode.CancellationToken
): Promise<RouteResult> {
  try {
    const raw = await sendLmRequest(CLASSIFICATION_PROMPT, prompt, token);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as { agent: string; confidence: number };
    const agent = parsed.agent as HandlerName;
    if (agent === 'brainstorm' || agent === 'plan') {
      return { handler: agent, confidence: parsed.confidence };
    }
  } catch {
    // Classification failed, return low confidence
  }
  return { handler: 'brainstorm', confidence: 0 };
}
```

**Step 2: Verify compilation**

Run: `cd /Users/rainlei/holiday/powerfull_copolit && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/participant/router.ts
git commit -m "feat: add intent router with command/state/LM classification"
```

---

## Task 4: Create brainstorm sub-handler

**Files:**
- Create: `src/participant/handlers/brainstorm.ts`

**Step 1: Create the brainstorm handler**

```typescript
// src/participant/handlers/brainstorm.ts
import * as vscode from 'vscode';
import { SubHandler, SessionState, PendingState } from '../types';
import { streamLmRequest } from '../../utils/lm';

const BRAINSTORM_SYSTEM = `You are a brainstorming assistant that helps users explore ideas and design solutions.

Your job:
1. Understand what the user wants to build
2. Ask ONE clarifying question at a time
3. Once you understand enough, propose 2-3 approaches with trade-offs
4. Help refine the chosen approach into a design

Rules:
- Ask only ONE question per response
- End every response with a clear question for the user
- When proposing approaches, number them clearly (1, 2, 3)
- Keep responses concise — no more than 200 words
- When the design is complete, say "DESIGN_COMPLETE" at the very end`;

interface BrainstormContext {
  topic?: string;
  answers: Array<{ question: string; answer: string }>;
  phase: 'exploring' | 'proposing' | 'refining' | 'complete';
}

function buildPrompt(state: SessionState | undefined, userMessage: string): string {
  const ctx = (state?.pendingState?.context ?? {}) as Partial<BrainstormContext>;
  const history = ctx.answers ?? [];

  let prompt = '';
  if (history.length > 0) {
    prompt += 'Previous conversation:\n';
    for (const qa of history) {
      prompt += `Q: ${qa.question}\nA: ${qa.answer}\n`;
    }
    prompt += '\n';
  }
  prompt += `User says: ${userMessage}`;
  return prompt;
}

export class BrainstormHandler implements SubHandler {
  async handle(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    state: SessionState | undefined
  ): Promise<vscode.ChatResult> {
    stream.progress('Brainstorming...');

    const prompt = buildPrompt(state, request.prompt);
    const response = await streamLmRequest(BRAINSTORM_SYSTEM, prompt, stream, token);

    const isComplete = response.includes('DESIGN_COMPLETE');

    const prevCtx = (state?.pendingState?.context ?? {}) as Partial<BrainstormContext>;
    const answers = [...(prevCtx.answers ?? [])];
    if (state?.pendingState?.question) {
      answers.push({ question: state.pendingState.question, answer: request.prompt });
    }

    const step = (state?.pendingState?.step ?? 0) + 1;

    const newState: SessionState = {
      handler: 'brainstorm',
      pendingState: {
        question: request.prompt,
        step,
        context: {
          topic: prevCtx.topic ?? request.prompt,
          answers,
          phase: isComplete ? 'complete' : (step > 3 ? 'refining' : 'exploring'),
        } as unknown as Record<string, unknown>,
      },
      history: [
        ...(state?.history ?? []),
        { role: 'user' as const, content: request.prompt },
        { role: 'assistant' as const, content: response.slice(0, 200) },
      ],
    };

    return { metadata: newState as unknown as Record<string, unknown> };
  }

  provideFollowups(
    result: vscode.ChatResult,
    _context: vscode.ChatContext,
    _token: vscode.CancellationToken
  ): vscode.ChatFollowup[] {
    const meta = result.metadata as unknown as SessionState | undefined;
    if (!meta?.pendingState) return [];

    const ctx = meta.pendingState.context as unknown as BrainstormContext;

    if (ctx.phase === 'complete') {
      return [
        { prompt: '/plan Create implementation plan based on this design', label: 'Create Implementation Plan', command: 'plan' },
        { prompt: 'I want to revise the design', label: 'Revise Design' },
      ];
    }

    if (ctx.phase === 'proposing' || meta.pendingState.step > 2) {
      return [
        { prompt: 'Option 1', label: 'Option 1' },
        { prompt: 'Option 2', label: 'Option 2' },
        { prompt: 'Option 3', label: 'Option 3' },
        { prompt: 'I have a different idea', label: 'Other' },
      ];
    }

    // Exploring phase — no pre-set followups, let user type
    return [];
  }
}
```

**Step 2: Verify compilation**

Run: `cd /Users/rainlei/holiday/powerfull_copolit && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/participant/handlers/brainstorm.ts
git commit -m "feat: add brainstorm sub-handler with multi-turn state"
```

---

## Task 5: Create plan sub-handler

**Files:**
- Create: `src/participant/handlers/plan.ts`

**Step 1: Create the plan handler**

```typescript
// src/participant/handlers/plan.ts
import * as vscode from 'vscode';
import { SubHandler, SessionState } from '../types';
import { streamLmRequest } from '../../utils/lm';

const PLAN_SYSTEM = `You are an implementation planning assistant. Create step-by-step implementation plans.

Your job:
1. Take a design or feature description
2. Break it into concrete, bite-sized implementation tasks
3. Each task should be specific: file to create/modify, what to add, how to test

Rules:
- Number each task clearly
- Include file paths when possible
- Keep tasks small (each 2-5 minutes of work)
- Suggest a TDD approach: write test → implement → verify
- At the end, ask if the user wants to adjust the plan`;

export class PlanHandler implements SubHandler {
  async handle(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    state: SessionState | undefined
  ): Promise<vscode.ChatResult> {
    stream.progress('Creating implementation plan...');

    // Gather context from brainstorm history if available
    let planContext = request.prompt;
    if (state?.history && state.history.length > 0) {
      const summary = state.history
        .map(h => `${h.role}: ${h.content}`)
        .join('\n');
      planContext = `Previous brainstorm context:\n${summary}\n\nUser request: ${request.prompt}`;
    }

    await streamLmRequest(PLAN_SYSTEM, planContext, stream, token);

    return {
      metadata: {
        handler: 'plan',
        pendingState: {
          question: 'plan_review',
          step: 1,
          context: {},
        },
        history: [
          ...(state?.history ?? []),
          { role: 'user', content: request.prompt },
        ],
      },
    };
  }

  provideFollowups(
    _result: vscode.ChatResult,
    _context: vscode.ChatContext,
    _token: vscode.CancellationToken
  ): vscode.ChatFollowup[] {
    return [
      { prompt: 'Looks good, save this plan', label: 'Approve Plan' },
      { prompt: 'Adjust the plan', label: 'Adjust' },
      { prompt: 'Add more detail to the tasks', label: 'More Detail' },
    ];
  }
}
```

**Step 2: Verify compilation**

Run: `cd /Users/rainlei/holiday/powerfull_copolit && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/participant/handlers/plan.ts
git commit -m "feat: add plan sub-handler"
```

---

## Task 6: Create main participant registration

**Files:**
- Create: `src/participant/index.ts`

**Step 1: Create the participant entry point**

```typescript
// src/participant/index.ts
import * as vscode from 'vscode';
import { HandlerName, SubHandler, SessionState } from './types';
import { routeByCommand, routeByState, routeByLm } from './router';
import { BrainstormHandler } from './handlers/brainstorm';
import { PlanHandler } from './handlers/plan';

const handlers: Record<HandlerName, SubHandler> = {
  brainstorm: new BrainstormHandler(),
  plan: new PlanHandler(),
};

const CONFIDENCE_THRESHOLD = 0.7;

async function chatHandler(
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<vscode.ChatResult> {
  // 1. Route by slash command
  const commandRoute = routeByCommand(request.command);
  if (commandRoute) {
    return handlers[commandRoute].handle(request, context, stream, token, undefined);
  }

  // 2. Route by pending state (multi-turn continuation)
  const existingState = routeByState(context);
  if (existingState) {
    return handlers[existingState.handler].handle(
      request, context, stream, token, existingState
    );
  }

  // 3. Route by LM classification
  try {
    stream.progress('Understanding your request...');
    const route = await routeByLm(request.prompt, token);
    if (route.confidence >= CONFIDENCE_THRESHOLD) {
      return handlers[route.handler].handle(request, context, stream, token, undefined);
    }
  } catch {
    // LM classification failed, fall through to manual selection
  }

  // 4. Low confidence — ask user to choose
  stream.markdown(
    "I'm not sure which workflow fits best. What would you like to do?\n\n" +
    "Choose a follow-up below, or just describe what you need in more detail.\n"
  );

  return {
    metadata: { handler: 'unknown', needsSelection: true },
  };
}

function followupProvider(
  result: vscode.ChatResult,
  context: vscode.ChatContext,
  token: vscode.CancellationToken
): vscode.ChatFollowup[] {
  const meta = result.metadata as Record<string, unknown> | undefined;
  if (!meta) return [];

  // Low confidence: show agent selection
  if (meta['needsSelection']) {
    return [
      { prompt: '/brainstorm Let me explore this idea', label: 'Brainstorm & Design', command: 'brainstorm' },
      { prompt: '/plan Create an implementation plan', label: 'Implementation Plan', command: 'plan' },
    ];
  }

  // Delegate to sub-handler
  const handlerName = meta['handler'] as HandlerName;
  if (handlerName && handlers[handlerName]) {
    return handlers[handlerName].provideFollowups(result, context, token);
  }

  return [];
}

export function registerParticipant(context: vscode.ExtensionContext): void {
  const participant = vscode.chat.createChatParticipant(
    'superpower.router',
    chatHandler
  );

  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');

  participant.followupProvider = {
    provideFollowups: followupProvider,
  };

  context.subscriptions.push(participant);
}
```

**Step 2: Verify compilation**

Run: `cd /Users/rainlei/holiday/powerfull_copolit && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/participant/index.ts
git commit -m "feat: add main participant with routing and followup provider"
```

---

## Task 7: Integrate participant into extension.ts

**Files:**
- Modify: `src/extension.ts`

**Step 1: Add participant registration to activate()**

Add import at top of `src/extension.ts`:
```typescript
import { registerParticipant } from './participant';
```

Add at the end of the `try` block in `activate()`, after the success message (line 40):
```typescript
    // 4. Register Chat Participant
    registerParticipant(context);
```

**Step 2: Verify compilation**

Run: `cd /Users/rainlei/holiday/powerfull_copolit && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/extension.ts
git commit -m "feat: integrate Chat Participant into extension activation"
```

---

## Task 8: Update package.json with chatParticipants contribution

**Files:**
- Modify: `package.json`

**Step 1: Add chatParticipants to contributes**

Replace the empty `"contributes": {}` with:
```json
"contributes": {
  "chatParticipants": [
    {
      "id": "superpower.router",
      "fullName": "Superpower",
      "name": "superpower",
      "description": "AI workflow assistant — brainstorm ideas, create plans, with interactive feedback",
      "isSticky": true,
      "commands": [
        {
          "name": "brainstorm",
          "description": "Explore ideas and design solutions"
        },
        {
          "name": "plan",
          "description": "Create step-by-step implementation plan"
        }
      ]
    }
  ]
}
```

**Step 2: Verify JSON is valid**

Run: `cd /Users/rainlei/holiday/powerfull_copolit && node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

**Step 3: Commit**

```bash
git add package.json
git commit -m "feat: register chatParticipant and slash commands in package.json"
```

---

## Task 9: Build and verify

**Files:**
- None (verification only)

**Step 1: Full compilation**

Run: `cd /Users/rainlei/holiday/powerfull_copolit && npm run compile`
Expected: No errors, `dist/` directory updated

**Step 2: Package extension**

Run: `cd /Users/rainlei/holiday/powerfull_copolit && npx vsce package --no-dependencies`
Expected: `.vsix` file created successfully

**Step 3: Verify dist structure**

Run: `ls dist/participant/ dist/utils/`
Expected:
```
dist/participant/:
index.js  router.js  types.js  handlers/

dist/utils/:
lm.js
```

**Step 4: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: resolve build issues"
```

---

## Task 10: Bump version and final commit

**Files:**
- Modify: `package.json` (version bump)

**Step 1: Bump version**

Change `"version": "2.3.1"` to `"version": "3.0.0"` (major version for new Chat Participant API feature).

**Step 2: Final commit**

```bash
git add package.json
git commit -m "release: v3.0.0 — add @superpower Chat Participant with interactive feedback UI"
```

---

## Summary

| Task | What | Dependencies |
|------|------|-------------|
| 1 | Type definitions | None |
| 2 | LM API wrapper | None |
| 3 | Router module | Task 1, 2 |
| 4 | Brainstorm handler | Task 1, 2 |
| 5 | Plan handler | Task 1, 2 |
| 6 | Participant registration | Task 3, 4, 5 |
| 7 | Extension.ts integration | Task 6 |
| 8 | package.json update | None |
| 9 | Build & verify | Task 7, 8 |
| 10 | Version bump & release | Task 9 |

Tasks 1, 2, 8 are independent and can run in parallel.
Tasks 3, 4, 5 depend on 1+2 and can run in parallel with each other.
Tasks 6 → 7 → 9 → 10 are sequential.
