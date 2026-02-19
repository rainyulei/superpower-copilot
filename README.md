# Superpower Copilot

**Structured development workflows for GitHub Copilot Chat**

Superpower Copilot enhances GitHub Copilot Chat with disciplined software development workflows. It provides 9 specialized skills that guide you through ideation, planning, implementation, testing, debugging, code review, and deployment—ensuring quality at every step.

## ✨ Features

### 🎨 Brainstorm
**Explore ideas and design before implementation**

Use `/brainstorm` to think through your feature or task before writing code. Explores requirements, edge cases, design alternatives, and creates a clear mental model before diving into implementation.

**When to use:**
- Starting a new feature
- Unclear requirements
- Multiple implementation approaches possible
- Need to explore design trade-offs

**Example:**
```
@superpower /brainstorm
I need to add user authentication to the app
```

### 📋 Plan
**Create a step-by-step implementation plan**

Use `/plan` to break down complex tasks into actionable, ordered steps. Creates detailed implementation plans that can be executed systematically, reducing cognitive load and ensuring nothing is missed.

**When to use:**
- Multi-step implementations
- Architectural changes
- Need a roadmap before coding
- Want to validate approach before executing

**Example:**
```
@superpower /plan
Add OAuth2 login with Google and GitHub providers
```

### ⚙️ Execute
**Execute an implementation plan step by step**

Use `/execute` to work through a written plan methodically. Follows plans created by `/plan`, executing each step with verification before moving forward.

**When to use:**
- Have a written plan ready
- Complex multi-file changes
- Want structured implementation
- Need progress tracking

**Example:**
```
@superpower /execute
Execute the OAuth2 implementation plan we created
```

### ✅ Verify
**Verify work before claiming completion**

Use `/verify` to confirm your implementation works as expected. Runs tests, checks compilation, validates outputs, and ensures quality standards are met before marking work complete.

**When to use:**
- Before committing code
- After implementing a feature
- Before creating a PR
- Want confidence in your changes

**Example:**
```
@superpower /verify
Verify the authentication feature is working correctly
```

### 🏁 Finish
**Finish development branch (merge, PR, or discard)**

Use `/finish` to complete your work properly. Guides you through creating commits, pull requests, merging to main, or cleaning up abandoned branches.

**When to use:**
- Feature is complete and verified
- Ready to integrate changes
- Need to create a PR
- Want to clean up branches

**Example:**
```
@superpower /finish
Ready to merge the authentication feature
```

### 🔴 TDD
**Test-driven development: red-green-refactor cycle**

Use `/tdd` to practice rigorous test-driven development. Guides you through writing failing tests first, implementing just enough code to pass, then refactoring with confidence.

**When to use:**
- Building new functionality
- Want high test coverage
- Need design feedback from tests
- Practicing TDD discipline

**Example:**
```
@superpower /tdd
Implement a shopping cart with add/remove/checkout operations
```

### 🐛 Debug
**Systematic debugging: find root cause before fixing**

Use `/debug` to investigate issues methodically. Uses scientific debugging: form hypotheses, gather evidence, isolate root causes, then apply minimal fixes.

**When to use:**
- Tests are failing
- Unexpected behavior
- Production issues
- Need to understand why, not just fix

**Example:**
```
@superpower /debug
Users report checkout fails with empty cart error
```

### 👀 Review
**Request structured code review on recent changes**

Use `/review` to get thorough code review on your work. Analyzes recent commits, checks for bugs, security issues, design problems, test coverage, and provides actionable feedback.

**When to use:**
- Before creating a PR
- After completing a feature
- Want quality feedback
- Need fresh eyes on code

**Example:**
```
@superpower /review
Review my authentication implementation
```

### 💬 Respond
**Process code review feedback with technical rigor**

Use `/respond` to handle code review comments professionally. Analyzes feedback, verifies it's technically sound, implements changes, and documents decisions.

**When to use:**
- Received PR comments
- Need to address review feedback
- Want to verify suggestions
- Implementing reviewer requests

**Example:**
```
@superpower /respond
Address the security concerns in the code review
```

## 🔄 Workflow Chaining

Skills can chain together naturally:

```
/brainstorm → /plan → /execute → /verify → /review → /respond → /finish
                ↓
               /tdd or /debug (as needed)
```

Follow-up buttons appear after each skill to guide you to the next logical step.

## 🌐 Language Support

Superpower Copilot supports both **English** and **简体中文 (Simplified Chinese)**.

**English examples:**
- "I have a bug to fix"
- "Let's write tests first"
- "Time to brainstorm this feature"

**Chinese examples (中文示例):**
- "我需要调试这个问题" (I need to debug this issue)
- "让我们写一个计划" (Let's write a plan)
- "我想进行代码审查" (I want to do a code review)

## 📦 Requirements

- **VS Code**: Version 1.96.0 or higher
- **GitHub Copilot Chat**: Active subscription required

## 🚀 Usage

1. Install the extension from VS Code Marketplace
2. Open a workspace/project
3. Open GitHub Copilot Chat
4. Type `@superpower` followed by a command or natural language:

```
@superpower /brainstorm
@superpower I need help with a bug
@superpower 让我们写个计划
```

The extension intelligently routes your requests to the appropriate skill based on keywords and context.

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with discipline. Shipped with confidence. 🚀**
