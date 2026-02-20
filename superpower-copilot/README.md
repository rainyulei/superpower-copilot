# Superpower Copilot

[中文文档](readme-zh.md)

**13 structured AI workflow agents for GitHub Copilot Chat**

Superpower Copilot brings disciplined, process-driven development workflows to GitHub Copilot through VS Code's [Custom Agents](https://code.visualstudio.com/docs/copilot/chat/chat-agents) feature. Each agent enforces a specific development practice — from brainstorming and planning to TDD, debugging, and code review — so you can work with the same rigor that professional engineering teams demand.

## Why This Exists

GitHub Copilot is powerful, but it lacks opinionated development workflows. Without structure, AI-assisted coding can lead to:

- Skipping design and jumping straight to implementation
- Writing code without tests, or tests after the fact
- Debugging by guessing instead of systematic root-cause analysis
- Claiming work is "done" without verification

Superpower Copilot solves this by providing 13 agents, each with a rigorous system prompt (200-300 lines) that enforces best practices. The agents are inspired by the [Superpowers](https://github.com/cline/superpowers) skill framework and the [awesome-copilot](https://github.com/github/awesome-copilot) community, adapted for GitHub Copilot's agent architecture.

## The 13 Agents

### Core Workflow Chain

| Agent | Purpose |
|-------|---------|
| `superpower-brainstorm` — Explore Ideas & Design | Explore ideas, clarify requirements, produce design documents |
| `superpower-plan` — Step-by-Step Plan | Break designs into bite-sized, testable implementation tasks |
| `superpower-execute` — Execute Plans | Execute plans step by step in batches with review checkpoints |
| `superpower-verify` — Evidence Before Claims | Run all verification commands before claiming completion |
| `superpower-finish` — Merge, PR, or Discard | Structured options for completing a development branch |

### Discipline Agents (use anytime)

| Agent | Purpose |
|-------|---------|
| `superpower-tdd` — Red-Green-Refactor | Test-Driven Development with strict cycle discipline |
| `superpower-debug` — Root Cause First | 4-phase systematic debugging: investigate before fixing |
| `superpower-review` — Code Review | Structured review against plan and requirements |
| `superpower-respond` — Address Feedback | Process review feedback with technical rigor |

### New: Thinking & Design Agents

| Agent | Purpose |
|-------|---------|
| `superpower-ui-design` — UX Research | Jobs-to-be-Done analysis, user journey mapping, flow specs |
| `superpower-think` — Challenge Assumptions | Socratic questioning — only asks Why, never gives answers |
| `superpower-mentor` — Guided Learning | Teach through hints and questions, not direct answers |
| `superpower-context` — Dependency Mapping | Map affected files and ripple effects before multi-file changes |

## Recommended Workflow

The agents are designed to work as a chain. Each agent knows about the others and suggests handoffs:

```
brainstorm → plan → execute → verify → finish
     ↓          ↓                ↓
 ui-design   context    tdd / debug (as needed)
                                 ↓
                        review → respond

    think / mentor — use anytime to challenge thinking
```

**Full feature workflow:**

1. `superpower-brainstorm` — Explore the problem, ask questions, produce a design doc
2. `superpower-ui-design` — If the feature has UI, do UX research first
3. `superpower-context` — Map dependencies before multi-file changes
4. `superpower-plan` — Turn the design into a step-by-step implementation plan
5. `superpower-execute` — Implement the plan in batches of 3 tasks
6. `superpower-verify` — Run tests, linter, build — evidence before claims
7. `superpower-finish` — Merge locally, create PR, or keep branch

**Standalone agents** (use anytime):

- `superpower-tdd` — When building any new functionality
- `superpower-debug` — When something breaks
- `superpower-review` — Before merging
- `superpower-respond` — When processing review feedback
- `superpower-think` — When you need to challenge your assumptions
- `superpower-mentor` — When learning a codebase or teaching someone

## Installation

1. Install **Superpower Copilot** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=rainlei.superpower-copilot)
2. The extension copies 13 agent files to `~/.superpower-copilot/agents/` and registers them globally
3. Open Copilot Chat and select any `superpower-*` agent from the dropdown

## Requirements

- VS Code 1.99.0 or higher
- GitHub Copilot with Custom Agents support

## Usage

1. Open Copilot Chat panel: `Ctrl+Alt+I` (Windows/Linux) / `Cmd+Alt+I` (Mac)
2. Click the agent dropdown at the top of the chat panel
3. Select a `superpower-*` agent from the list
4. Type your request and send

**Examples:**

| Agent | Example prompt |
|-------|---------------|
| `superpower-brainstorm` | "I need to add user authentication to my Express app" |
| `superpower-tdd` | "Implement a shopping cart with add/remove/total" |
| `superpower-debug` | "Why is the checkout endpoint returning 500?" |
| `superpower-think` | "Should we use microservices or a monolith?" |
| `superpower-ui-design` | "Design the onboarding flow for our mobile app" |
| `superpower-context` | "I need to refactor the auth module across multiple files" |
| `superpower-mentor` | "Help me understand how the middleware chain works" |

The agent will guide you through its process step by step. Each agent enforces gates — for example, `superpower-debug` will not let you propose fixes until root cause investigation is complete.

## What Makes These Agents Different

**Hard gates, not suggestions.** Each agent has explicit rules about what must happen before moving forward. The debug agent requires root cause analysis before fixes. The TDD agent requires a failing test before implementation code. The verify agent requires fresh command output before any completion claim.

**Anti-rationalization tables.** Every agent includes tables of common excuses ("it's too simple to test", "I'll write tests after") with rebuttals. This prevents the AI from taking shortcuts.

**Good and bad examples.** Agents show concrete examples of correct and incorrect behavior, so the AI understands the standard.

**Workflow handoffs.** Agents include handoff buttons that connect to the next logical step in the chain.

**Inter-agent awareness.** Each agent knows about the others and includes Related Agents references in its description, so Copilot can suggest the right agent for the next step.

## Best Practices

- **Start with brainstorm** for any non-trivial feature. Spending 10 minutes on design saves hours of rework.
- **Map context first** for multi-file changes. Use `superpower-context` before `superpower-plan`.
- **Do UX research** before building UI. Use `superpower-ui-design` to understand users first.
- **Use TDD for all new code.** The `superpower-tdd` agent enforces Red-Green-Refactor. If you didn't see the test fail, you don't know it tests the right thing.
- **Verify before claiming done.** The `superpower-verify` agent requires running commands and showing output. No "should work" or "looks correct".
- **Debug systematically.** When something breaks, resist the urge to guess. Use `superpower-debug` to trace root cause first.
- **Challenge your thinking.** Use `superpower-think` when a decision feels too easy — it will expose blind spots.
- **Review your own work.** Use `superpower-review` before creating a PR. It catches issues you missed.

## How It Works

On activation, the extension:

1. Copies 13 `.agent.md` files from the extension bundle to `~/.superpower-copilot/agents/`
2. Registers the path `~/.superpower-copilot/agents` in VS Code's `chat.agentFilesLocations` setting (user-level)
3. VS Code discovers the agents and adds them to the Copilot Chat dropdown

On deactivation, the extension cleans up the copied files and removes the setting entry.

### Agent Output Artifacts

Agents that produce documents (brainstorm, ui-design, context, plan) save their output to `.github/superpower/` in your workspace:

```
.github/superpower/
  brainstorm/YYYY-MM-DD-<topic>-design.md
  ux/[feature]-jtbd.md
  ux/[feature]-journey.md
  ux/[feature]-flow.md
  context/YYYY-MM-DD-<topic>-context-map.md
  plan/YYYY-MM-DD-<topic>-plan.md
```

Agents discover each other's artifacts automatically:
- `superpower-plan` reads from `brainstorm/` and `context/`
- `superpower-execute` reads from `plan/`
- `superpower-verify` and `superpower-review` read from `plan/`

### Playwright MCP (Optional)

For agents that interact with browsers (ui-design, debug, verify, execute, tdd, review), you can optionally configure the [Playwright MCP](https://github.com/anthropics/playwright-mcp) server. Add to your `.vscode/settings.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic-ai/playwright-mcp@latest"]
    }
  }
}
```

This enables browser automation tools (`playwright/*`) for UI testing, visual verification, and frontend debugging. If not configured, agents work normally without browser capabilities.

## Language Support

All agents support both English and Simplified Chinese.

## Credits

Inspired by the [Superpowers](https://github.com/cline/superpowers) skill framework and the [awesome-copilot](https://github.com/github/awesome-copilot) community collection. Adapted for GitHub Copilot's Custom Agents with native integration (tools, handoffs, agent references).

## License

MIT
