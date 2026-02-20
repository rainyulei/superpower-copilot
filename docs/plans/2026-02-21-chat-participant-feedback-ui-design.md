# Chat Participant Feedback UI Design

**Date:** 2026-02-21
**Status:** Approved

## Goal

Add a VS Code Chat Participant (`@superpower`) that provides interactive feedback UI — questions with selectable options, action buttons, and agent handoff — while coexisting with the existing 13 agent.md files.

## Architecture

### Overview

```
User → @superpower Chat Participant
         │
         ├─ Router (LM API intent classification)
         │   ├─ Slash command match (/brainstorm, /plan)
         │   ├─ Pending state continuation
         │   └─ LM-based intent → sub-handler
         │
         ├─ Sub-handlers
         │   ├─ brainstorm.ts
         │   └─ plan.ts
         │
         └─ Interaction Layer
             ├─ stream.markdown()    — streaming output
             ├─ stream.progress()    — progress indicator
             ├─ stream.button()      — action buttons
             ├─ followupProvider     — selectable options
             └─ stream.reference()   — file references

Existing 13 agent.md files continue to work independently.
```

### Coexistence Strategy

- `@superpower` is the new interactive Participant (TypeScript handler)
- `@superpower-brainstorm`, `@superpower-plan`, etc. remain as agent.md
- Users choose: `@superpower` for guided interactive experience, `@superpower-brainstorm` for direct agent access

## Routing Mechanism

### Priority Order

1. **Pending state**: If `metadata.pendingState` exists from previous turn, resume that sub-handler
2. **Slash command**: If user typed `/brainstorm`, `/plan`, etc., route directly
3. **LM intent classification**: Call VS Code LM API to classify user intent

### LM Classification

```typescript
const classificationPrompt = `Given the user message, classify which agent to use:
- brainstorm: exploring ideas, designing features, architecture discussion
- plan: creating implementation plans, step-by-step breakdowns
- unknown: unclear intent

User message: "${request.prompt}"
Respond with JSON: { "agent": "...", "confidence": 0.0-1.0 }`;
```

- Confidence > 0.7 → route directly
- Confidence <= 0.7 → present followup options for user to choose

## Interaction Patterns

### Pattern 1: Ask (multi-turn questions)

The Participant asks a question and provides selectable options via `followupProvider`. User clicks an option, triggering a new handler invocation. The handler reads `metadata.pendingState` to continue the conversation.

```typescript
// In handler: ask question, set pending state
stream.markdown("Which authentication method?\n");
return {
  metadata: {
    handler: 'brainstorm',
    pendingState: { question: 'auth_method', step: 2, context: { ... } }
  }
};

// In followupProvider: generate options from metadata
followups: [
  { prompt: 'OAuth 2.0', label: 'OAuth 2.0' },
  { prompt: 'JWT Token', label: 'JWT' },
]
```

### Pattern 2: Action (result + command buttons)

After completing an operation, show results with actionable buttons that execute VS Code commands.

```typescript
stream.markdown("## Analysis Complete\nFound 3 optimization opportunities...\n");
stream.button({ command: 'superpower.applyAll', title: 'Apply All Fixes' });
stream.button({ command: 'superpower.showDiff', title: 'View Diff' });
```

### Pattern 3: Handoff (agent switching)

After one agent's work completes, offer followups that route to a different sub-handler.

```typescript
// followups that switch to another handler
followups: [
  { prompt: '/plan Create implementation plan from this design', label: 'Create Plan' },
  { prompt: '/review Review this design', label: 'Request Review' },
]
```

## State Management

```typescript
interface SessionState {
  handler: string;           // active sub-handler name
  pendingState?: {
    question: string;        // ID of pending question
    step: number;            // current step in workflow
    context: Record<string, any>;  // accumulated context
  };
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}
```

State is stored in `ChatResult.metadata` and read from `ChatContext.history` on the next turn.

## LLM Integration

- Use `vscode.lm.selectChatModels()` to get available Copilot models
- Use `vscode.LanguageModelChat.sendRequest()` for:
  - Intent classification (router)
  - Generating brainstorm questions and responses
  - Creating plans
- Zero configuration — uses whatever model the user has via Copilot subscription

## MVP Scope

### Included

| Component | Details |
|-----------|---------|
| Router | Slash command routing + LM intent classification |
| Sub-handlers | brainstorm + plan (2 handlers) |
| Interaction patterns | Ask + Handoff |
| State management | metadata-based, per-conversation |
| Coexistence | agent.md files unchanged |

### Not Included (future)

- Action pattern (command button execution)
- Remaining 11 agent sub-handlers
- Persistent state storage
- Complex multi-agent orchestration
- Custom LLM provider support

## File Structure

```
src/
├── extension.ts              # Entry (keep agent.md registration + add Participant)
├── uninstall.ts              # Keep as-is
├── participant/
│   ├── index.ts              # Participant registration + followupProvider
│   ├── router.ts             # Intent classification + routing
│   ├── types.ts              # SessionState and other types
│   └── handlers/
│       ├── brainstorm.ts     # Brainstorm sub-handler
│       └── plan.ts           # Plan sub-handler
└── utils/
    └── lm.ts                 # VS Code LM API wrapper
```

## package.json Changes

```jsonc
{
  "contributes": {
    "chatParticipants": [{
      "id": "superpower.router",
      "fullName": "Superpower",
      "name": "superpower",
      "description": "AI workflow assistant with interactive feedback UI",
      "isSticky": true,
      "commands": [
        { "name": "brainstorm", "description": "Explore ideas & design" },
        { "name": "plan", "description": "Create implementation plan" }
      ]
    }]
  }
}
```

## Success Criteria

1. `@superpower` appears in VS Code chat
2. `/brainstorm` triggers multi-turn interactive questions with followup options
3. `/plan` creates a plan with handoff from brainstorm
4. LM-based routing works for natural language input
5. Low-confidence routing shows selectable options
6. Existing agent.md agents continue to work unchanged
