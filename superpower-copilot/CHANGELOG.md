# Changelog

All notable changes to the Superpower Copilot extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-20

### 🚨 BREAKING CHANGES

**Complete architecture migration from Chat Participant to Custom Agents**

- **Removed:** `@superpower` Chat Participant with slash commands (`/brainstorm`, `/plan`, etc.)
- **Added:** 9 independent Custom Agents (`@superpower-brainstorm`, `@superpower-plan`, etc.)
- **Migration:** Instead of `@superpower /brainstorm`, use `@superpower-brainstorm`

### Changed

#### Architecture
- **From:** TypeScript Chat Participant with router + skills + tools + state management
- **To:** 9 `.agent.md` files with complete system prompts, minimal extension copies files
- **Extension:** Reduced from 100+ KB to <10 KB (only copies agents to user profile on activation)

#### Agents (Custom Agents, not Chat Participant commands)
- Each skill is now a fully independent agent with 200-300 line system prompt
- **@superpower-brainstorm** - Explore ideas and design before implementation
- **@superpower-plan** - Create step-by-step implementation plans
- **@superpower-execute** - Execute implementation plans systematically
- **@superpower-verify** - Verify work before claiming completion
- **@superpower-finish** - Complete development branches (merge, PR, cleanup)
- **@superpower-tdd** - Test-driven development with red-green-refactor
- **@superpower-debug** - Systematic debugging: root cause before fixing
- **@superpower-review** - Request structured code review on recent changes
- **@superpower-respond** - Process code review feedback with technical rigor

#### Agent Features (built into YAML frontmatter)
- **Tools:** `search`, `read`, `edit`, `execute`, `agent` (native Copilot tools)
- **Handoffs:** Native workflow transitions between agents (e.g., brainstorm → plan)
- **Hard Gates:** Enforced discipline (no code without design, no fixes without investigation)
- **Examples:** Good/Bad code patterns in every agent
- **Anti-patterns:** Tables of common rationalizations to prevent process shortcuts

#### Prompts Quality
- **Superpowers-grade prompts:** Each agent matches claude.ai /superpowers skill quality
- **Process flows:** Dot graph diagrams showing exact workflow steps
- **Red flags:** Lists of thoughts that indicate you're about to skip process
- **Integration sections:** Clear handoff points and terminal conditions

### Removed

#### TypeScript Implementation
- ❌ `src/participant.ts` - Chat participant handler
- ❌ `src/router.ts` - Skill routing logic
- ❌ `src/skills/` - Individual skill implementations
- ❌ `src/state/` - Session and history management
- ❌ `src/tools/` - File/git/terminal/workspace tools
- ❌ `src/welcome.ts` - Welcome message
- ❌ `src/followups.ts` - Follow-up suggestions
- ❌ `src/errors.ts` - Error handling
- ❌ `test/` - All unit and integration tests
- ❌ `esbuild.js` - Build configuration (replaced with direct `tsc`)
- ❌ `.mocharc.json` - Test configuration
- ❌ `tsconfig.test.json` - Test TypeScript config

#### Extension Manifest
- ❌ `chatParticipants` contribution (no longer a Chat Participant)
- ❌ `commands` contribution (agents don't expose commands)
- ❌ `extensionDependencies` on `github.copilot-chat`
- ❌ `configuration` for plans directory (agents use built-in file tools)

### Added

#### Agent Files (9 total)
- `agents/superpower-brainstorm.agent.md` - Brainstorming workflow
- `agents/superpower-plan.agent.md` - Planning workflow
- `agents/superpower-execute.agent.md` - Execution workflow
- `agents/superpower-verify.agent.md` - Verification workflow
- `agents/superpower-finish.agent.md` - Branch completion workflow
- `agents/superpower-tdd.agent.md` - Test-driven development
- `agents/superpower-debug.agent.md` - Systematic debugging
- `agents/superpower-review.agent.md` - Code review request
- `agents/superpower-respond.agent.md` - Code review response

#### Extension (Minimal)
- `src/extension.ts` - 60 lines: copies `.agent.md` files to VS Code user profile
- `activationEvents: ["onStartupFinished"]` - Installs agents on VS Code startup

#### Build System
- **Direct TypeScript compilation:** `tsc -p ./` (no bundler)
- **Simplified dependencies:** Only `@types/node`, `@types/vscode`, `@vscode/vsce`, `typescript`

### Technical Details

#### File Locations
- **Source:** `agents/*.agent.md` (in extension directory)
- **Target:** `~/.config/Code/User/agents/` (Linux) or equivalent (macOS/Windows)
- **Cleanup:** Agent files removed from user profile on extension deactivation

#### Agent YAML Frontmatter Structure
```yaml
---
name: superpower-<skill>
description: One-line description with keywords for discoverability
tools: ['search', 'read', 'edit', 'execute', 'agent']
handoffs:
  - label: Next Step Name
    agent: superpower-next
    prompt: Transition message
    send: false
---
```

#### Extension Behavior
1. On activation: Copy all `agents/*.agent.md` to VS Code user agents directory
2. Show notification: "Superpower Copilot: 9 agents installed."
3. On deactivation: Remove agent files from user profile
4. No runtime behavior, no chat participant, no command palette entries

## [1.0.0] - 2025-02-19

### Added

#### Core Skills (9 total)
- **Brainstorming** (`/brainstorm`) - Explore ideas and design before implementation
- **Planning** (`/plan`) - Create step-by-step implementation plans
- **Execution** (`/execute`) - Execute implementation plans systematically
- **Verification** (`/verify`) - Verify work before claiming completion
- **Finish Branch** (`/finish`) - Complete development branches with merge, PR, or cleanup
- **TDD** (`/tdd`) - Test-driven development with red-green-refactor cycles
- **Debugging** (`/debug`) - Systematic debugging to find root causes before fixing
- **Code Review Request** (`/review`) - Request structured code review on recent changes
- **Code Review Response** (`/respond`) - Process code review feedback with technical rigor

#### Intelligence & Routing
- **Smart Routing** - Automatically routes user requests to appropriate skills
  - Keyword-based matching for common patterns
  - LLM-powered routing for ambiguous requests
  - Command-based explicit skill invocation (e.g., `/brainstorm`)

#### Workflow Features
- **Workflow Chaining** - Skills provide follow-up button suggestions
  - Natural progression: brainstorm → plan → execute → verify → review → finish
  - Context-aware next steps based on current skill state
- **Session State Management** - Persists skill state across chat sessions
- **History Parsing** - Analyzes chat history for skill continuity

#### User Experience
- **Welcome Message** - First-time guidance with available commands
- **Help Command** - List all available skills and usage examples
- **Error Handling** - Graceful error messages with recovery suggestions

#### Language Support
- **Chinese + English** - Full bilingual support
  - Chinese keywords: 调试, 想法, 计划, etc.
  - English keywords: debug, idea, plan, etc.
  - Natural language routing in both languages

#### Developer Experience
- **TypeScript Codebase** - Type-safe implementation
- **Modular Architecture** - Skills, tools, state management separation
- **Comprehensive Testing** - Unit and integration test coverage
- **ESBuild Bundling** - Fast compilation and packaging

### Infrastructure
- **Extension Icon** - 128x128 purple gradient brand identity
- **README Documentation** - Comprehensive marketplace documentation
- **.vscodeignore** - Optimized package size (excludes src, test, configs)
- **Package Metadata** - Complete VS Code Marketplace metadata

## [0.4.0] - 2025-02-19

### Added
- Initial skill implementations (9 skills)
- Basic routing and session management
- Tool integrations (files, git, terminal, workspace)

---

**Note:** v2.0 requires VS Code 1.99.0+ and GitHub Copilot subscription with Custom Agents feature.
