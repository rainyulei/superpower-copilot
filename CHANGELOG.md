# Changelog

All notable changes to BitFrog Copilot will be documented in this file.

## [4.0.0] - 2026-03-17

### BREAKING CHANGES
- Renamed from **Superpower Copilot** to **BitFrog Copilot**
- Consolidated 13 agents to **7+1** (main router + 7 specialized agents)
- Removed sidebar webview — replaced by native `askQuestions` carousel
- Removed custom Chat Participant TypeScript code — pure `.agent.md` prompt routing

### Added
- **BitFrog Philosophy System** — 5 Chinese philosophy principles integrated into all agents
  - 中庸之道 (Meta: appropriate degree)
  - 格物致知 (Investigate essence)
  - 知行合一 (Knowledge-action unity)
  - 辨证论治 (Diagnose before treating)
  - 阴阳互生 + 三省吾身 (Holistic awareness + three-level reflection)
- **Main router** (`@bitfrog`) with decision-tree intent classification
- **Handoff workflow** — brainstorm → plan → execute → review with user-controlled flow
- **Agent Plugin support** (`.github/plugin.json`) for dual-channel distribution
- **New pixel frog logo** with AI neural network elements
- Native `vscode/askQuestions` for all agent interactions

### Removed
- 6 agents merged into others: think → brainstorm, context → plan, tdd + verify → execute, respond + finish → review
- `src/webview/` — sidebar webview (300+ lines)
- `src/tools/options.ts` — custom options tool
- `src/participant/` — TypeScript Chat Participant + router
- `src/utils/lm.ts` — LM request utility

### Changed
- `src/extension.ts` — minimal agent file copier (~60 lines, down from ~1,500)
- `package.json` — renamed, simplified, removed webview/tool contributions
- All agent prompts rewritten with philosophy-driven internal motivation
