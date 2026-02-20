# Superpower Copilot

**9 AI workflow agents for GitHub Copilot: brainstorm, plan, execute, verify, finish, TDD, debug, review, respond**

Superpower Copilot provides 9 specialized workflow agents as Custom Agents for GitHub Copilot. Each agent has a complete system prompt with rigorous processes, examples, and anti-patterns to ensure high-quality software development.

## ✨ The 9 Agents

### 🎨 @superpower-brainstorm
**Explore ideas and design before implementation**

Turn ideas into fully formed designs through collaborative dialogue. Asks clarifying questions, proposes approaches with trade-offs, presents design sections for approval, and saves design documents.

**When to use:**
- Starting any new feature or change
- Unclear requirements
- Multiple implementation approaches possible
- Need to explore design trade-offs

**Handoff:** Transitions to `@superpower-plan` when design is approved

---

### 📋 @superpower-plan
**Create a step-by-step implementation plan**

Breaks down designs into bite-sized, actionable tasks. Every task includes exact file paths, complete code blocks, exact commands with expected output. Each step has embedded TDD instructions.

**When to use:**
- Have an approved design
- Multi-step implementations
- Need a roadmap before coding

**Handoff:** Transitions to `@superpower-execute` when plan is ready

---

### ⚙️ @superpower-execute
**Execute an implementation plan step by step**

Follows the plan exactly with no improvisation. Works in batches of 3 tasks, reports progress for review, runs tests after each task. Stops and asks when stuck instead of guessing.

**When to use:**
- Have a written plan file
- Complex multi-file changes
- Want structured implementation

**Handoff:** Transitions to `@superpower-verify` when all tasks complete

---

### ✅ @superpower-verify
**Verify work before claiming completion**

Runs every verification command BEFORE claiming any status. Tests → linter → build → requirements check. Provides evidence, never claims "should work" or "seems fine".

**When to use:**
- After implementing a feature
- Before committing code
- Before creating a PR

**Handoff:** Transitions to `@superpower-finish` (pass) or `@superpower-debug` (fail)

---

### 🏁 @superpower-finish
**Finish development branch (merge, PR, or discard)**

Verifies tests pass, determines base branch, presents 4 options: merge locally, create PR, keep as-is, or discard. Executes choice and cleans up.

**When to use:**
- Feature is complete and verified
- Ready to integrate changes
- Need to create a PR

**Handoff:** Optionally transitions to `@superpower-review` for final review

---

### 🔴 @superpower-tdd
**Test-driven development: red-green-refactor cycle**

Enforces the Red-Green-Refactor discipline. Write failing test → verify it fails → write minimal code → verify it passes → refactor. Includes good/bad examples and anti-rationalization tables.

**When to use:**
- Building new functionality
- Want high test coverage
- Practicing TDD discipline

**No handoff** (standalone, reusable anytime)

---

### 🐛 @superpower-debug
**Systematic debugging: find root cause before fixing**

4 phases: Root Cause Investigation → Pattern Analysis → Hypothesis Testing → Implementation. Phase 1 MUST complete before proposing any fix. Stops after 3 failed fixes to question architecture.

**When to use:**
- Tests are failing
- Unexpected behavior
- Production issues

**No handoff** (standalone, reusable anytime)

---

### 👀 @superpower-review
**Request structured code review on recent changes**

Gets git diff, analyzes against plan/requirements, categorizes issues (Critical/Important/Minor), provides structured report with line references. Checks correctness, security, edge cases, test coverage, DRY/YAGNI.

**When to use:**
- Before creating a PR
- After completing a feature
- Want quality feedback

**Handoff:** Transitions to `@superpower-respond` to address feedback

---

### 💬 @superpower-respond
**Process code review feedback with technical rigor**

READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT. Never says "you're absolutely right" performatively. Pushes back when feedback breaks functionality, lacks context, or violates YAGNI.

**When to use:**
- Received PR comments
- Need to address review feedback
- Want to verify suggestions

**No handoff** (terminal agent in review chain)

---

## 🔄 Workflow Chain

```
@superpower-brainstorm → @superpower-plan → @superpower-execute → @superpower-verify → @superpower-finish → @superpower-review → @superpower-respond
                                 ↓
                         @superpower-tdd or @superpower-debug (as needed)
```

Each agent includes handoff buttons to guide you to the next logical step.

## 🌐 Language Support

All agents support both **English** and **简体中文 (Simplified Chinese)**.

## 📦 Requirements

- **VS Code**: Version 1.99.0 or higher
- **GitHub Copilot**: Active subscription with Custom Agents feature

## 🚀 Installation & Usage

1. Install **Superpower Copilot** from VS Code Marketplace
2. On activation, 9 `.agent.md` files are copied to your VS Code user profile
3. Agents are auto-registered and appear in Copilot Chat
4. Use agents by name:

```
@superpower-brainstorm I need to add user authentication
@superpower-tdd Implement a shopping cart
@superpower-debug Why is checkout failing?
```

The agents will guide you through their processes step by step.

## 🎯 Key Features

- **Superpowers-grade prompts**: Each agent has 200-300 lines of rigorous instructions
- **Hard gates**: Agents enforce discipline (e.g., no code without design, no fixes without root cause)
- **Built-in tools**: search, read, edit, execute, agent (for handoffs)
- **Good/Bad examples**: Every agent shows what to do and what NOT to do
- **Anti-rationalization tables**: Preempt common excuses for skipping process
- **Native workflow chaining**: Handoff buttons connect agents seamlessly

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with discipline. Shipped with confidence. 🚀**
