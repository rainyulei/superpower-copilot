# Superpower Copilot

**9 structured AI workflow agents for GitHub Copilot Chat**

Superpower Copilot brings disciplined, process-driven development workflows to GitHub Copilot through VS Code's [Custom Agents](https://code.visualstudio.com/docs/copilot/chat/chat-agents) feature. Each agent enforces a specific development practice — from brainstorming and planning to TDD, debugging, and code review — so you can work with the same rigor that professional engineering teams demand.

## Why This Exists

GitHub Copilot is powerful, but it lacks opinionated development workflows. Without structure, AI-assisted coding can lead to:

- Skipping design and jumping straight to implementation
- Writing code without tests, or tests after the fact
- Debugging by guessing instead of systematic root-cause analysis
- Claiming work is "done" without verification

Superpower Copilot solves this by providing 9 agents, each with a rigorous system prompt (200-300 lines) that enforces best practices. The agents are inspired by the [Superpowers](https://github.com/cline/superpowers) skill framework and adapted for GitHub Copilot's agent architecture.

## The 9 Agents

| Agent | Purpose |
|-------|---------|
| `@superpower-brainstorm` | Explore ideas, clarify requirements, produce design documents |
| `@superpower-plan` | Break designs into bite-sized, testable implementation tasks |
| `@superpower-execute` | Execute plans step by step in batches with review checkpoints |
| `@superpower-verify` | Run all verification commands before claiming completion |
| `@superpower-finish` | Merge, create PR, keep branch, or discard — structured options |
| `@superpower-tdd` | Red-Green-Refactor cycle with strict discipline |
| `@superpower-debug` | 4-phase systematic debugging: root cause before fixes |
| `@superpower-review` | Structured code review against plan and requirements |
| `@superpower-respond` | Process review feedback with technical rigor, not blind agreement |

## Recommended Workflow

The agents are designed to work as a chain. Start from the left and move right:

```
brainstorm → plan → execute → verify → finish
                                 ↓
                         tdd / debug (as needed)
                                 ↓
                        review → respond
```

**Full feature workflow:**

1. `@superpower-brainstorm` — Explore the problem, ask questions, produce a design doc
2. `@superpower-plan` — Turn the design into a step-by-step implementation plan
3. `@superpower-execute` — Implement the plan in batches of 3 tasks
4. `@superpower-verify` — Run tests, linter, build — evidence before claims
5. `@superpower-finish` — Merge locally, create PR, or keep branch

**Standalone agents** (use anytime):

- `@superpower-tdd` — When building any new functionality
- `@superpower-debug` — When something breaks
- `@superpower-review` — Before merging
- `@superpower-respond` — When processing review feedback

## Installation

1. Install **Superpower Copilot** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=rainlei.superpower-copilot)
2. The extension copies 9 agent files to `~/.superpower-copilot/agents/` and registers them globally
3. Open Copilot Chat and select any `@superpower-*` agent from the dropdown

## Requirements

- VS Code 1.99.0 or higher
- GitHub Copilot with Custom Agents support

## Usage

Open Copilot Chat (Ctrl+Shift+I / Cmd+Shift+I) and type:

```
@superpower-brainstorm I need to add user authentication to my Express app
```

```
@superpower-tdd Implement a shopping cart with add/remove/total
```

```
@superpower-debug Why is the checkout endpoint returning 500?
```

The agent will guide you through its process step by step. Each agent enforces gates — for example, `@superpower-debug` will not let you propose fixes until root cause investigation is complete.

## What Makes These Agents Different

**Hard gates, not suggestions.** Each agent has explicit rules about what must happen before moving forward. The debug agent requires root cause analysis before fixes. The TDD agent requires a failing test before implementation code. The verify agent requires fresh command output before any completion claim.

**Anti-rationalization tables.** Every agent includes tables of common excuses ("it's too simple to test", "I'll write tests after") with rebuttals. This prevents the AI from taking shortcuts.

**Good and bad examples.** Agents show concrete examples of correct and incorrect behavior, so the AI understands the standard.

**Workflow handoffs.** Agents include handoff buttons that connect to the next logical step in the chain.

## Best Practices

- **Start with brainstorm** for any non-trivial feature. Spending 10 minutes on design saves hours of rework.
- **Use TDD for all new code.** The `@superpower-tdd` agent enforces Red-Green-Refactor. If you didn't see the test fail, you don't know it tests the right thing.
- **Verify before claiming done.** The `@superpower-verify` agent requires running commands and showing output. No "should work" or "looks correct".
- **Debug systematically.** When something breaks, resist the urge to guess. Use `@superpower-debug` to trace root cause first.
- **Review your own work.** Use `@superpower-review` before creating a PR. It catches issues you missed.

## How It Works

On activation, the extension:

1. Copies 9 `.agent.md` files from the extension bundle to `~/.superpower-copilot/agents/`
2. Registers the path `~/.superpower-copilot/agents` in VS Code's `chat.agentFilesLocations` setting (user-level)
3. VS Code discovers the agents and adds them to the Copilot Chat dropdown

On deactivation, the extension cleans up the copied files and removes the setting entry.

## Language Support

All agents support both English and Simplified Chinese.

## Credits

Inspired by the [Superpowers](https://github.com/cline/superpowers) skill framework. Adapted from shell-based skills to VS Code Custom Agents with native Copilot integration (tools, handoffs, agent references).

## License

MIT
