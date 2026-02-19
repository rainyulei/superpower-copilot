# Changelog

All notable changes to the Superpower Copilot extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - TBD

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

**Note:** This extension requires VS Code 1.96.0+ and GitHub Copilot Chat subscription.
