# Phase 0 Validation Results

## Test 1: Agent Plugin Registration
- Date:
- VS Code version:
- Plugin mode works:
- .github/agents/ mode works:
- Notes:

## Test 2: Handoffs
- Forward handoff (router → worker):
- Reverse handoff (worker → router):
- Prompt pre-fill works:
- Notes:

## Test 3: askQuestions
- Carousel appears:
- Single select works:
- Multi select works:
- Free text works:
- Sub-agent can ask questions:
- Notes:

## Test 4: Agent Hooks
- hooks.json detected:
- session-start fires:
- Notes:

## Test 5: Pure Prompt Routing
- Classification accuracy: /5
- Ambiguous cases handled:
- Handoff suggestion correct:
- Notes:

---

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
