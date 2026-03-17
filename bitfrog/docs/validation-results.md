# Phase 0 + Phase 1 Validation Results

## Test 1: Agent Registration
- Date: 2026-03-17
- VS Code version: 1.111.0
- .github/agents/ mode: **PASS** — 所有 8 个 bitfrog agent 出现在下拉框
- Notes: 零 TypeScript 代码，纯 `.agent.md` 自动发现

## Test 2: Handoffs
- Forward handoff (bitfrog → brainstorm): **PASS**
- Prompt pre-fill: **PASS**
- Notes: 点击按钮后正确切换 agent，上下文传递正常

## Test 3: askQuestions
- Carousel UI: **PASS** — 需要在 tools 中声明 `vscode/askQuestions`
- Notes: 初次测试未出现 carousel 是因为 tools 列表缺少声明。添加后正常工作。

## Test 4: Pure Prompt Routing
- "我想做一个 REST API 来管理用户" → Brainstorm: **PASS**（修复决策树后）
- Notes: 初始路由表过于模糊，改为决策树后准确

## Test 5: Agent Hooks
- NOT TESTED — 优先级低

---

## 最终技术决策

| 决策项 | 结果 |
|--------|------|
| Agent 注册方式 | `.github/agents/` 自动发现，零代码 |
| 用户交互 | `vscode/askQuestions` carousel UI |
| 路由方式 | 纯 prompt 决策树，无需 TypeScript |
| 流程流转 | handoffs (`send: false`)，用户主动点击 |
| 原 sidebar webview | 可移除，askQuestions 完全替代 |
| 原 TypeScript 代码 | 可移除，纯 `.agent.md` 即可 |
