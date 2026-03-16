# BitFrog v4.0 Phase 0 + Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate VS Code Agent Plugin API capabilities, then build the core BitFrog agent system (7+1 agents with handoffs) on confirmed stable APIs.

**Architecture:** Agent Plugin mode (if validated) or VS Code Extension fallback. Pure `.agent.md` files with YAML frontmatter handoffs. Main router `@bitfrog` with 7 sub-agents. No sidebar webview — use native askQuestions or plain text interaction.

**Tech Stack:** VS Code 1.110+, GitHub Copilot, `.agent.md` format, YAML frontmatter, JSON (plugin.json / hooks.json)

**Spec:** `docs/superpowers/specs/2026-03-17-bitfrog-v4-design.md`

---

## File Structure

### New files to create

```
bitfrog/                                  # New repo or branch
├── .github/
│   └── plugin.json                       # Agent Plugin manifest (Phase 0 验证)
├── agents/
│   ├── bitfrog.agent.md                  # 主路由 agent
│   ├── bitfrog-brainstorm.agent.md       # 探索设计
│   ├── bitfrog-plan.agent.md             # 规划拆解
│   ├── bitfrog-execute.agent.md          # 执行实现
│   ├── bitfrog-debug.agent.md            # 诊断修复
│   ├── bitfrog-review.agent.md           # 审查收尾
│   ├── bitfrog-mentor.agent.md           # 学习引导
│   └── bitfrog-ui-design.agent.md        # UX 研究
├── hooks/
│   └── hooks.json                        # Agent Hooks (Phase 0 验证)
├── README.md
└── LICENSE
```

### Existing files to reference (v3.1 source)

```
agents/superpower-brainstorm.agent.md     # 合并 think 能力
agents/superpower-plan.agent.md           # 合并 context 能力
agents/superpower-execute.agent.md        # 合并 tdd + verify
agents/superpower-debug.agent.md          # 独立保留
agents/superpower-review.agent.md         # 合并 respond + finish
agents/superpower-mentor.agent.md         # 重构
agents/superpower-ui-design.agent.md      # 保留
agents/superpower-think.agent.md          # 提取批判性追问能力 → brainstorm
agents/superpower-context.agent.md        # 提取依赖映射能力 → plan
agents/superpower-tdd.agent.md            # 提取 TDD 流程 → execute
agents/superpower-verify.agent.md         # 提取验证步骤 → execute/review
agents/superpower-respond.agent.md        # 提取反馈回应 → review
agents/superpower-finish.agent.md         # 提取收尾流程 → review
```

---

## Chunk 1: Phase 0 — Minimal Viable Validation

Phase 0 的目标是用最小代码验证 5 个关键 API 能力，确定 Phase 1 走哪条技术路径。

### Task 1: 创建验证用最小 Agent Plugin 结构

**Files:**
- Create: `bitfrog/.github/plugin.json`
- Create: `bitfrog/agents/test-router.agent.md`
- Create: `bitfrog/agents/test-worker.agent.md`

- [ ] **Step 1: 创建新目录**

```bash
mkdir -p bitfrog/.github bitfrog/agents
```

- [ ] **Step 2: 创建 plugin.json**

```json
{
  "name": "bitfrog-test",
  "version": "0.0.1",
  "description": "BitFrog API validation test plugin",
  "agents": ["agents/*.agent.md"]
}
```

注意：`plugin.json` 的确切格式需参照 [Agent plugins in VS Code](https://code.visualstudio.com/docs/copilot/customization/agent-plugins) 文档确认。如果格式不同，按文档调整。

- [ ] **Step 3: 创建 test-router.agent.md（最小主路由）**

```markdown
---
name: test-router
description: >
  Test router agent. Routes user requests to appropriate sub-agents.
tools: ['codebase', 'readFile']
handoffs:
  - label: Go to Worker
    agent: test-worker
    prompt: Handle this task based on the context above.
    send: false
---

# Test Router

You are a test router. When the user asks you anything:
1. Acknowledge their request
2. Suggest they use the "Go to Worker" handoff button below

Always respond in both English and 中文.
```

- [ ] **Step 4: 创建 test-worker.agent.md（最小子 agent）**

```markdown
---
name: test-worker
description: >
  Test worker agent. Handles tasks routed from the test router.
tools: ['codebase', 'readFile', 'editFiles']
handoffs:
  - label: Back to Router
    agent: test-router
    prompt: Task completed. Here's what was done.
    send: false
---

# Test Worker

You are a test worker. Execute the task given to you and report results.
When done, suggest the user click "Back to Router" if they have more tasks.
```

- [ ] **Step 5: Commit**

```bash
git add bitfrog/
git commit -m "feat: add minimal agent plugin for API validation"
```

---

### Task 2: 验证 Agent Plugin 注册

- [ ] **Step 1: 在 VS Code 中安装测试 plugin**

打开 VS Code，按 `Ctrl+Shift+X`，搜索 `@agentPlugins`。
尝试通过本地路径安装：

```
文件 → 首选项 → 设置 → 搜索 "chat.plugins"
或使用命令面板：> Chat: Install Plugin from Local Folder
选择 bitfrog/ 目录
```

如果不支持本地安装，尝试：
```bash
# 将 bitfrog/ 推到一个 test repo
cd bitfrog && git init && git add . && git commit -m "init"
# 然后用 repo URL 安装
```

- [ ] **Step 2: 验证 agent 是否出现在下拉框**

在 Copilot Chat 中检查：
- `test-router` 是否出现在 agent 选择下拉框？
- `test-worker` 是否出现？

- [ ] **Step 3: 记录结果**

创建 `bitfrog/docs/validation-results.md`：

```markdown
# Phase 0 Validation Results

## Test 1: Agent Plugin Registration
- Date: YYYY-MM-DD
- VS Code version: x.x.x
- Result: PASS / FAIL
- Notes: [详细记录]
```

- [ ] **Step 4: 如果 Plugin 模式失败，测试 fallback**

如果 Agent Plugin 不工作，将 `.agent.md` 文件放到 `.github/agents/` 目录测试标准 custom agent 注册：

```bash
mkdir -p .github/agents
cp bitfrog/agents/test-router.agent.md .github/agents/
cp bitfrog/agents/test-worker.agent.md .github/agents/
```

重启 VS Code，检查 agent 是否出现。

---

### Task 3: 验证 Handoffs

- [ ] **Step 1: 选择 test-router 发送一条消息**

在 Copilot Chat 中选择 `test-router`，输入：
```
Help me with a coding task
```

- [ ] **Step 2: 检查 handoff 按钮**

回复完成后，检查：
- 是否出现 "Go to Worker" 按钮？
- 按钮是否可点击？
- 点击后是否切换到 `test-worker`？
- prompt 是否预填充？

- [ ] **Step 3: 测试反向 handoff**

在 `test-worker` 中完成一个回复，检查：
- "Back to Router" 按钮是否出现？
- 点击是否正确切换回 `test-router`？

- [ ] **Step 4: 记录结果**

更新 `bitfrog/docs/validation-results.md`：

```markdown
## Test 2: Handoffs
- Result: PASS / FAIL
- Forward handoff (router → worker): PASS / FAIL
- Reverse handoff (worker → router): PASS / FAIL
- Prompt pre-fill works: YES / NO
- Notes: [详细记录]
```

---

### Task 4: 验证 askQuestions

- [ ] **Step 1: 修改 test-router 添加 askQuestions 测试**

在 `test-router.agent.md` 的 prompt 中添加：

```markdown
When the user first messages you, ask them a question using the question carousel:
- Present 3 options: "Option A: Design first", "Option B: Code first", "Option C: Debug"
- Wait for their selection before proceeding
```

- [ ] **Step 2: 测试交互**

向 `test-router` 发送消息，观察：
- 是否出现 carousel 选项卡？
- 用户选择后 agent 是否能获取选择结果？
- 是否支持多选？
- 是否支持自由文本输入？

- [ ] **Step 3: 记录能力边界**

更新 `bitfrog/docs/validation-results.md`：

```markdown
## Test 3: askQuestions
- Carousel appears: YES / NO
- Single select works: YES / NO
- Multi select works: YES / NO
- Free text works: YES / NO
- Sub-agent can ask questions: YES / NO（在 test-worker 中也测试）
- Notes: [详细记录，特别是和 v3.1 sidebar 的能力差距]
```

---

### Task 5: 验证 Agent Hooks

- [ ] **Step 1: 创建 hooks 配置**

```bash
mkdir -p bitfrog/hooks
```

创建 `bitfrog/hooks/hooks.json`：

```json
{
  "hooks": [
    {
      "event": "session-start",
      "command": "echo 'BitFrog session started'"
    }
  ]
}
```

- [ ] **Step 2: 安装/更新 plugin 并测试**

重新加载 VS Code，开始新的 Copilot Chat session。
检查：
- hook 是否被触发？
- 输出是否可见？

- [ ] **Step 3: 记录结果**

更新 `bitfrog/docs/validation-results.md`：

```markdown
## Test 4: Agent Hooks
- hooks.json detected: YES / NO
- session-start fires: YES / NO
- Notes: [详细记录]
```

---

### Task 6: 验证纯 Prompt 路由

- [ ] **Step 1: 增强 test-router 的路由 prompt**

更新 `test-router.agent.md`：

```markdown
---
name: test-router
description: >
  Test router that classifies user intent and routes to appropriate agent.
tools: ['codebase', 'readFile']
handoffs:
  - label: Start Coding
    agent: test-worker
    prompt: Execute the coding task described above.
    send: false
---

# Test Router

You are an intent classifier. When the user sends a message:

1. Classify their intent:
   - If they want to BUILD something → suggest "Start Coding" handoff
   - If they want to DEBUG something → say "I would route to debug agent"
   - If they want to LEARN something → say "I would route to mentor agent"

2. Explain your classification reasoning briefly

3. If classification is ambiguous, ask ONE clarifying question

Test messages to try:
- "Fix this bug in my auth code" → should classify as DEBUG
- "Help me build a REST API" → should classify as BUILD
- "How does this middleware work?" → should classify as LEARN
```

- [ ] **Step 2: 测试 3 种意图分类**

发送以下消息并记录分类准确率：

1. `Fix this bug in my auth code` → 期望：DEBUG
2. `Help me build a REST API` → 期望：BUILD
3. `How does this middleware work?` → 期望：LEARN
4. `Review my code changes` → 期望：REVIEW
5. `I want to refactor the database layer` → 期望：BUILD 或 PLAN

- [ ] **Step 3: 记录结果**

更新 `bitfrog/docs/validation-results.md`：

```markdown
## Test 5: Pure Prompt Routing
- Classification accuracy: X/5
- Ambiguous cases handled: YES / NO
- Handoff suggestion correct: YES / NO
- Notes: [哪些场景分类不准确？]
```

---

### Task 7: 汇总验证结果 & 决策

- [ ] **Step 1: Review 所有测试结果**

阅读 `bitfrog/docs/validation-results.md` 中所有 5 项测试。

- [ ] **Step 2: 做出技术路径决策**

根据结果填写决策：

```markdown
## Phase 1 Technical Decisions

### Plugin Mode
- [ ] Agent Plugin 可用 → Phase 1 使用 plugin.json 模式
- [ ] Agent Plugin 不可用 → Phase 1 退回 VS Code Extension + .github/agents/

### User Interaction
- [ ] askQuestions 能力足够 → 移除 sidebar webview
- [ ] askQuestions 能力不足 → 保留轻量 webview 或接受纯文本交互

### Routing
- [ ] 纯 prompt 路由准确率 ≥ 80% → 不需要 TypeScript router
- [ ] 纯 prompt 路由准确率 < 80% → 保留 participant/router.ts

### Hooks
- [ ] Hooks 可用 → 使用 hooks.json 注入 BitFrog 上下文
- [ ] Hooks 不可用 → 在每个 agent prompt 中内嵌上下文
```

- [ ] **Step 3: Commit 验证结果**

```bash
git add bitfrog/docs/validation-results.md
git commit -m "docs: record Phase 0 API validation results and decisions"
```

---

## Chunk 2: Phase 1 — Core Agent Construction

基于 Phase 0 的验证结果，构建 7+1 个 BitFrog agent。以下假设使用 Agent Plugin 模式（如果 Plugin 不可用，将 `.agent.md` 放到 `.github/agents/` 并保留轻量 TypeScript extension）。

### Task 8: 创建主路由 bitfrog.agent.md

**Files:**
- Create: `agents/bitfrog.agent.md`
- Reference: `agents/superpower-brainstorm.agent.md` (路由模式参考)
- Reference: `src/participant/router.ts` (路由逻辑参考)

- [ ] **Step 1: 编写主路由 agent**

```markdown
---
name: bitfrog
description: >
  BitFrog main router. Classifies user intent and routes to the appropriate
  specialized agent via handoffs. Use this as your default entry point.
  Keywords: help, start, what, how, build, fix, review, learn, design
tools: ['codebase', 'textSearch', 'fileSearch', 'readFile', 'listDirectory', 'usages', 'searchResults', 'changes', 'problems']
handoffs:
  - label: "探索设计 (Brainstorm)"
    agent: bitfrog-brainstorm
    prompt: "Help me explore and design this idea based on the context above."
    send: false
  - label: "规划任务 (Plan)"
    agent: bitfrog-plan
    prompt: "Create an implementation plan based on the context above."
    send: false
  - label: "执行开发 (Execute)"
    agent: bitfrog-execute
    prompt: "Execute the implementation plan discussed above."
    send: false
  - label: "诊断问题 (Debug)"
    agent: bitfrog-debug
    prompt: "Help me diagnose and fix this issue based on the context above."
    send: false
  - label: "代码审查 (Review)"
    agent: bitfrog-review
    prompt: "Review the code changes discussed above."
    send: false
  - label: "学习引导 (Mentor)"
    agent: bitfrog-mentor
    prompt: "Help me learn and understand this based on the context above."
    send: false
  - label: "UX 研究 (UI Design)"
    agent: bitfrog-ui-design
    prompt: "Help me research and design the user experience for this feature."
    send: false
---

# BitFrog — 主路由

你是 BitFrog 的主路由代理。你的职责是理解用户意图，引导他们到最合适的专业代理。

## 意图识别

分析用户的消息，判断他们的核心需求：

| 用户意图 | 关键信号 | 路由目标 |
|---------|---------|---------|
| 探索新想法、设计功能 | "我想做..."、"帮我设计..."、"有个想法" | → 探索设计 (Brainstorm) |
| 拆解任务、制定计划 | "帮我规划..."、"怎么拆分..."、有明确设计文档 | → 规划任务 (Plan) |
| 写代码、实现功能 | "帮我实现..."、"开始编码"、有明确计划 | → 执行开发 (Execute) |
| 修 bug、排查问题 | "报错了..."、"不工作..."、"为什么..." | → 诊断问题 (Debug) |
| 审查代码、检查质量 | "review..."、"检查一下..."、有 PR 或 diff | → 代码审查 (Review) |
| 学习、理解代码 | "解释一下..."、"怎么理解..."、"学习..." | → 学习引导 (Mentor) |
| UI/UX 设计、用户研究 | "界面设计..."、"用户体验..."、"交互..." | → UX 研究 (UI Design) |

## 工作方式

1. **理解意图** — 阅读用户消息，判断属于上述哪个类别
2. **简短确认** — 用 1-2 句话确认你的理解
3. **推荐路由** — 建议用户点击对应的 handoff 按钮
4. **模糊意图** — 如果不确定，问 ONE 个澄清问题

## 规则

- 不要自己执行任务（不写代码、不做设计、不做审查）
- 你的价值是**准确路由**，不是**直接回答**
- 回复简短，不超过 3-4 句话
- 同时支持中文和 English

## 状态协议

- NEEDS_CONTEXT → 意图不明确，问澄清问题
- DONE → 已推荐路由，等待用户点击 handoff
```

- [ ] **Step 2: 在 VS Code 中验证注册**

确认 `bitfrog` 出现在 Copilot Chat agent 下拉框中。

- [ ] **Step 3: 测试意图分类**

发送 5 条不同意图的消息，验证路由准确率。

- [ ] **Step 4: Commit**

```bash
git add agents/bitfrog.agent.md
git commit -m "feat: add bitfrog main router agent"
```

---

### Task 9: 创建 bitfrog-brainstorm.agent.md

**Files:**
- Create: `agents/bitfrog-brainstorm.agent.md`
- Reference: `agents/superpower-brainstorm.agent.md` (主体)
- Reference: `agents/superpower-think.agent.md` (批判性追问能力)

- [ ] **Step 1: 合并 brainstorm + think 能力，编写新 agent**

从 `superpower-brainstorm.agent.md` 开始，做以下修改：

1. 重命名：`superpower-brainstorm` → `bitfrog-brainstorm`
2. 移除 `superpower_options` 工具依赖 — 改为纯文本选项呈现（或 askQuestions，取决于 Phase 0 结果）
3. 从 `superpower-think.agent.md` 提取批判性追问技巧，加入为可选模式
4. 更新 handoffs：只保留 → `bitfrog-plan` 和 → `bitfrog-ui-design`
5. 更新 Related Agents 引用为 bitfrog-* 命名
6. 添加状态协议（DONE/NEEDS_CONTEXT/BLOCKED）

关键 prompt 结构：

```markdown
---
name: bitfrog-brainstorm
description: >
  Explore ideas, challenge assumptions, and design solutions before implementation.
  Collaborative design through clarifying questions, approach proposals, and iterative refinement.
  Keywords: brainstorm, design, explore, idea, feature, requirement, think, challenge, assume
tools: ['codebase', 'textSearch', 'fileSearch', 'readFile', 'listDirectory', 'usages', 'searchResults', 'changes', 'problems', 'editFiles', 'createFile', 'createDirectory', 'fetch', 'githubRepo']
handoffs:
  - label: "进入计划 (Create Plan)"
    agent: bitfrog-plan
    prompt: "Create an implementation plan based on the approved design above."
    send: false
  - label: "UX 研究 (UI Design Research)"
    agent: bitfrog-ui-design
    prompt: "Conduct UX research for the feature designed above."
    send: false
---
```

正文保留 brainstorm 的核心流程（探索上下文 → 澄清问题 → 提出方案 → 呈现设计），但：
- 将 `#superpower_options` 替换为纯文本选项格式（A/B/C/D）
- 在"提出方案"阶段加入批判性追问："在定案之前，让我挑战一下这个方案的假设..."
- 使用 5 Whys 技巧（从 think agent 移植）作为可选深入模式

- [ ] **Step 2: 验证 agent 注册和 handoff**

在 Copilot Chat 中选择 `bitfrog-brainstorm`，发送一条设计请求，验证：
- Agent 正常响应
- 完成后出现 "进入计划" handoff 按钮

- [ ] **Step 3: Commit**

```bash
git add agents/bitfrog-brainstorm.agent.md
git commit -m "feat: add bitfrog-brainstorm agent (merged with think capabilities)"
```

---

### Task 10: 创建 bitfrog-plan.agent.md

**Files:**
- Create: `agents/bitfrog-plan.agent.md`
- Reference: `agents/superpower-plan.agent.md` (主体)
- Reference: `agents/superpower-context.agent.md` (依赖映射能力)

- [ ] **Step 1: 合并 plan + context 能力，编写新 agent**

从 `superpower-plan.agent.md` 开始，做以下修改：

1. 重命名：`superpower-plan` → `bitfrog-plan`
2. 从 `superpower-context.agent.md` 提取依赖映射流程，作为 plan 的**前置步骤**
3. 更新 handoffs：→ `bitfrog-execute`
4. 更新文件输出路径：`.github/superpower/plan/` → `docs/plans/`
5. 添加状态协议
6. 保留 bite-sized 任务粒度（2-5 分钟/步）

关键 prompt 结构：

```markdown
---
name: bitfrog-plan
description: >
  Map dependencies, analyze impact, and create bite-sized implementation plans.
  First maps the codebase context, then breaks the design into executable TDD tasks.
  Keywords: plan, implement, task, break, decompose, dependency, context, map, sequence
tools: ['codebase', 'textSearch', 'fileSearch', 'readFile', 'listDirectory', 'usages', 'searchResults', 'changes', 'problems', 'editFiles', 'createFile', 'createDirectory', 'runInTerminal', 'terminalLastCommand', 'getTerminalOutput']
handoffs:
  - label: "开始执行 (Start Execution)"
    agent: bitfrog-execute
    prompt: "Execute the implementation plan created above."
    send: false
  - label: "返回探索 (Back to Brainstorm)"
    agent: bitfrog-brainstorm
    prompt: "The plan revealed issues that need design reconsideration."
    send: false
---
```

正文的工作流程变为：
1. **侦察阶段（原 context agent）** — 映射主要文件、追踪依赖、识别涟漪效应、发现模式
2. **呈现 Context Map** — 给用户审批
3. **规划阶段（原 plan agent）** — 拆解为 bite-sized TDD 任务
4. **保存计划** — 到 `docs/plans/YYYY-MM-DD-<topic>-plan.md`

- [ ] **Step 2: 验证注册和 handoff**

- [ ] **Step 3: Commit**

```bash
git add agents/bitfrog-plan.agent.md
git commit -m "feat: add bitfrog-plan agent (merged with context mapping)"
```

---

### Task 11: 创建 bitfrog-execute.agent.md

**Files:**
- Create: `agents/bitfrog-execute.agent.md`
- Reference: `agents/superpower-execute.agent.md` (主体)
- Reference: `agents/superpower-tdd.agent.md` (TDD 流程)
- Reference: `agents/superpower-verify.agent.md` (验证步骤)

- [ ] **Step 1: 合并 execute + tdd + verify，编写新 agent**

从 `superpower-execute.agent.md` 开始：

1. 重命名 → `bitfrog-execute`
2. 从 `superpower-tdd.agent.md` 提取 Red-Green-Refactor 铁律，作为执行的**默认模式**
3. 从 `superpower-verify.agent.md` 提取验证步骤，作为每个任务完成后的**自动收尾**
4. Handoffs：→ `bitfrog-review`（正常完成）、→ `bitfrog-debug`（遇到 bug）
5. 添加状态协议（包括 DONE_WITH_CONCERNS）

```markdown
---
name: bitfrog-execute
description: >
  Execute implementation plans task-by-task with TDD discipline and verification.
  Follows Red-Green-Refactor cycle. Verifies after each task. Reports progress in batches.
  Keywords: execute, implement, code, build, run, test, tdd, develop, write
tools: ['codebase', 'textSearch', 'fileSearch', 'readFile', 'listDirectory', 'usages', 'searchResults', 'changes', 'problems', 'editFiles', 'createFile', 'createDirectory', 'runInTerminal', 'terminalLastCommand', 'getTerminalOutput', 'runTests', 'testFailure', 'agent', 'playwright/*']
handoffs:
  - label: "代码审查 (Code Review)"
    agent: bitfrog-review
    prompt: "Review the implementation completed above."
    send: false
  - label: "诊断问题 (Debug)"
    agent: bitfrog-debug
    prompt: "Help debug the issue encountered during execution above."
    send: false
  - label: "返回计划 (Back to Plan)"
    agent: bitfrog-plan
    prompt: "Execution revealed the plan needs adjustment."
    send: false
---
```

- [ ] **Step 2: 验证注册和 handoff**

- [ ] **Step 3: Commit**

```bash
git add agents/bitfrog-execute.agent.md
git commit -m "feat: add bitfrog-execute agent (merged with TDD + verify)"
```

---

### Task 12: 创建 bitfrog-debug.agent.md

**Files:**
- Create: `agents/bitfrog-debug.agent.md`
- Reference: `agents/superpower-debug.agent.md`

- [ ] **Step 1: 改造 debug agent**

从 `superpower-debug.agent.md` 开始：

1. 重命名 → `bitfrog-debug`
2. 保留核心 4 阶段诊断流程
3. 加入自闭环修复能力（诊断 + 修复 + 验证一条龙）
4. 加入职责边界判断（小修自己做，大重构 handoff）
5. Handoffs：→ `bitfrog-brainstorm`（架构问题）、→ `bitfrog-plan`（需要重构）

```markdown
---
name: bitfrog-debug
description: >
  Systematic debugging: diagnose root cause, fix, and verify. Self-contained for small fixes.
  Hands off to brainstorm/plan when issues require architectural changes.
  Keywords: debug, fix, bug, error, crash, fail, broken, issue, diagnose, trace
tools: ['codebase', 'textSearch', 'fileSearch', 'readFile', 'listDirectory', 'usages', 'searchResults', 'changes', 'problems', 'editFiles', 'createFile', 'createDirectory', 'runInTerminal', 'terminalLastCommand', 'getTerminalOutput', 'runTests', 'testFailure', 'playwright/*']
handoffs:
  - label: "需要重新设计 (Needs Redesign)"
    agent: bitfrog-brainstorm
    prompt: "Debugging revealed an architectural issue that needs design rethinking."
    send: false
  - label: "需要重构计划 (Needs Refactoring Plan)"
    agent: bitfrog-plan
    prompt: "The fix requires multi-file refactoring that needs a proper plan."
    send: false
---
```

正文加入职责边界：

```markdown
## 职责边界

自己修复（自闭环）：
- 改几行代码修 bug
- 加缺失的 null check
- 修复逻辑错误
- 修复后自动运行测试验证

Handoff（交给别人）：
- 发现是架构设计问题 → handoff 到 brainstorm
- 需要大规模重构（5+ 文件）→ handoff 到 plan
```

- [ ] **Step 2: 验证注册和 handoff**

- [ ] **Step 3: Commit**

```bash
git add agents/bitfrog-debug.agent.md
git commit -m "feat: add bitfrog-debug agent (self-contained with boundary handoffs)"
```

---

### Task 13: 创建 bitfrog-review.agent.md

**Files:**
- Create: `agents/bitfrog-review.agent.md`
- Reference: `agents/superpower-review.agent.md` (主体)
- Reference: `agents/superpower-respond.agent.md` (反馈回应)
- Reference: `agents/superpower-finish.agent.md` (收尾流程)

- [ ] **Step 1: 合并 review + respond + finish，编写新 agent**

1. 重命名 → `bitfrog-review`
2. 内嵌两阶段 review（spec 合规 → 代码质量）
3. 从 respond 提取：反馈回应能力（验证后实现，技术正确性 > 社交舒适度）
4. 从 finish 提取：收尾选项（merge / PR / keep / discard）
5. 最多 5 轮迭代

```markdown
---
name: bitfrog-review
description: >
  Two-phase code review (spec compliance + code quality), respond to feedback,
  and complete the development cycle with merge/PR/keep/discard options.
  Keywords: review, check, quality, merge, pr, finish, complete, feedback, respond
tools: ['codebase', 'textSearch', 'fileSearch', 'readFile', 'listDirectory', 'usages', 'searchResults', 'changes', 'problems', 'editFiles', 'createFile', 'createDirectory', 'runInTerminal', 'terminalLastCommand', 'getTerminalOutput', 'runTests', 'testFailure', 'agent', 'playwright/*']
handoffs:
  - label: "设计有缺陷 (Design Issue Found)"
    agent: bitfrog-brainstorm
    prompt: "Code review revealed a design flaw that needs reconsideration."
    send: false
  - label: "继续执行 (Continue Execution)"
    agent: bitfrog-execute
    prompt: "Review complete with changes requested. Continue implementation."
    send: false
---
```

- [ ] **Step 2: 验证注册和 handoff**

- [ ] **Step 3: Commit**

```bash
git add agents/bitfrog-review.agent.md
git commit -m "feat: add bitfrog-review agent (merged review + respond + finish)"
```

---

### Task 14: 创建 bitfrog-mentor.agent.md

**Files:**
- Create: `agents/bitfrog-mentor.agent.md`
- Reference: `agents/superpower-mentor.agent.md`

- [ ] **Step 1: 重构 mentor agent**

从 `superpower-mentor.agent.md` 开始：

1. 重命名 → `bitfrog-mentor`
2. 保留核心能力（hint 分级、不给直接答案）
3. 新增**学习路径透明化**：每次交互后告知用户"你在学什么、当前进度、下一步"
4. 无 handoffs（独立 agent）

```markdown
---
name: bitfrog-mentor
description: >
  Guided learning through hints and questions, not direct answers.
  Transparent learning path: shows what you're learning, progress, and next steps.
  Keywords: mentor, teach, learn, guide, explain, understand, hint, grow, help me understand
tools: ['codebase', 'textSearch', 'fileSearch', 'readFile', 'listDirectory', 'usages', 'searchResults', 'changes', 'problems', 'fetch', 'githubRepo']
---
```

新增的学习路径透明化模板：

```markdown
## 学习路径透明化

每次交互结束时，附上简短的学习状态：

---
📚 **学习状态**
- **主题**: [当前学习的核心概念]
- **已掌握**: [用户已经理解的部分]
- **当前挑战**: [正在攻克的难点]
- **下一步**: [建议的下一个学习方向]
---
```

- [ ] **Step 2: 验证注册**

- [ ] **Step 3: Commit**

```bash
git add agents/bitfrog-mentor.agent.md
git commit -m "feat: add bitfrog-mentor agent (with learning path transparency)"
```

---

### Task 15: 创建 bitfrog-ui-design.agent.md

**Files:**
- Create: `agents/bitfrog-ui-design.agent.md`
- Reference: `agents/superpower-ui-design.agent.md`

- [ ] **Step 1: 迁移 ui-design agent**

从 `superpower-ui-design.agent.md` 开始：

1. 重命名 → `bitfrog-ui-design`
2. 更新 handoff → `bitfrog-plan`
3. 更新文件输出路径
4. 更新 Related Agents 引用

```markdown
---
name: bitfrog-ui-design
description: >
  UX/UI design research: Jobs-to-be-Done analysis, user journey mapping,
  flow specs, and accessibility requirements. Understand users before designing.
  Keywords: ui, ux, design, user, journey, persona, flow, wireframe, accessibility, interface
tools: ['codebase', 'textSearch', 'fileSearch', 'readFile', 'listDirectory', 'usages', 'searchResults', 'changes', 'problems', 'editFiles', 'createFile', 'createDirectory', 'fetch', 'githubRepo', 'playwright/*']
handoffs:
  - label: "创建实现计划 (Create Plan)"
    agent: bitfrog-plan
    prompt: "Create an implementation plan based on the UX research and flow specs above."
    send: false
  - label: "返回探索 (Back to Brainstorm)"
    agent: bitfrog-brainstorm
    prompt: "UX research revealed we need to rethink the feature design."
    send: false
---
```

- [ ] **Step 2: 验证注册和 handoff**

- [ ] **Step 3: Commit**

```bash
git add agents/bitfrog-ui-design.agent.md
git commit -m "feat: add bitfrog-ui-design agent"
```

---

### Task 16: 创建 plugin.json 和 hooks.json（正式版）

**Files:**
- Create: `.github/plugin.json` (如果 Phase 0 验证通过)
- Create: `hooks/hooks.json`

- [ ] **Step 1: 创建正式 plugin.json**

```json
{
  "name": "bitfrog",
  "version": "4.0.0",
  "description": "BitFrog — Structured AI development agents for GitHub Copilot. 7+1 agents with handoff workflows, Chinese philosophy-inspired thinking models.",
  "author": "rainlei",
  "license": "MIT",
  "repository": "https://github.com/rainyulei/bitfrog",
  "agents": ["agents/*.agent.md"],
  "hooks": ["hooks/hooks.json"]
}
```

注意：格式需根据 Phase 0 验证结果调整。

- [ ] **Step 2: 创建正式 hooks.json**

```json
{
  "hooks": [
    {
      "event": "session-start",
      "command": "echo 'BitFrog v4.0 — 7+1 agents ready. Use @bitfrog to start or select a specific agent.'"
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add .github/plugin.json hooks/hooks.json
git commit -m "feat: add plugin manifest and hooks configuration"
```

---

### Task 17: 端到端流程验证

- [ ] **Step 1: 完整 handoff 链测试**

在 VS Code 中执行完整流程：

1. 选择 `@bitfrog`，发送 "I want to build a simple todo list API"
2. 验证路由到 brainstorm → 点击 "进入计划" handoff
3. 验证到 plan → 点击 "开始执行" handoff
4. 验证到 execute → 点击 "代码审查" handoff
5. 验证到 review

记录每一步是否成功。

- [ ] **Step 2: 独立入口测试**

1. 直接选择 `bitfrog-debug`，发送 "My API returns 500 error"
2. 验证 debug 能独立工作，不依赖其他 agent
3. 直接选择 `bitfrog-mentor`，发送 "Help me understand middleware"
4. 验证 mentor 独立工作

- [ ] **Step 3: 下拉框检查**

确认 Copilot Chat 下拉框中只出现 8 个 agent：
1. bitfrog（主路由）
2. bitfrog-brainstorm
3. bitfrog-plan
4. bitfrog-execute
5. bitfrog-debug
6. bitfrog-review
7. bitfrog-mentor
8. bitfrog-ui-design

- [ ] **Step 4: 记录并提交结果**

```bash
# 更新 validation-results.md 添加 Phase 1 端到端测试结果
git add docs/
git commit -m "docs: record Phase 1 end-to-end validation results"
```

---

### Task 18: 创建 README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: 编写 README**

包含：
- BitFrog 简介
- 安装方式（Agent Plugin 安装命令）
- 8 个 agent 的简表
- 流程链示意图
- 中英文双语

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add BitFrog README"
```

---

## Summary

| Phase | Tasks | 说明 |
|-------|-------|------|
| Phase 0 | Task 1-7 | API 能力验证，决定技术路径 |
| Phase 1 | Task 8-18 | 构建 7+1 agents + plugin 配置 + 端到端验证 |

**Phase 0 完成后的决策门禁：** 必须根据验证结果更新后续 task 的具体实现方式，再继续 Phase 1。

**Phase 1 完成后：** 进入 Phase 2（Preview API 集成）和 Phase 3（中国哲学 prompt 深层重构），每个 phase 单独规划。
