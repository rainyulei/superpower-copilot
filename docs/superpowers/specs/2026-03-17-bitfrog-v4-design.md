# BitFrog v4.0 Design Spec

## Goal

将 Superpower Copilot v3.1 重构为 BitFrog v4.0，实现：

1. **品牌重塑** — Superpower Copilot → BitFrog，统一 bit-frog 品牌线
2. **架构迁移** — VS Code Extension → Agent Plugin 模式（VS Code 1.110+ Preview）
3. **Agent 精简** — 13 个独立 agent → 7 个精简入口 + 1 个主路由
4. **原生能力集成** — handoffs、askQuestions、Agent Hooks、子代理上下文隔离
5. **中国哲学融入** — 每个 agent 用东方哲学思维模型重构内部决策逻辑
6. **借鉴 Superpowers v5.0.2** — 子代理协作模式、两阶段 review、状态协议

---

## Architecture

### 整体架构

```
@bitfrog（主路由 Chat Participant）
│  ├── 意图识别：/command → session state → LM 分类
│  ├── handoffs：流程自动流转（send: false，用户主动点击）
│  └── askQuestions：原生内联用户交互
│
├── bitfrog-brainstorm（道 — 探索）
│     内含：批判性追问、ui-design 自动触发
│
├── bitfrog-plan（谋 — 规划）
│     内含：依赖映射（原 context agent）、bite-sized 拆解
│
├── bitfrog-execute（行 — 执行）
│     内含：TDD（原 tdd agent）、verify（原 verify agent）、状态协议
│
├── bitfrog-debug（诊 — 诊断）
│     内含：望闻问切四诊法、自闭环修复
│
├── bitfrog-review（省 — 审查）
│     内含：两阶段 review、respond（原 respond agent）、finish（原 finish agent）
│
├── bitfrog-mentor（授 — 引导）
│     内含：学习路径可视化、hint 分级
│
└── bitfrog-ui-design（形 — 设计）
      内含：JTBD、旅程图、brainstorm 自动触发
```

### Agent Plugin 文件结构

```
bitfrog/
├── .github/
│   └── plugin.json                    # Plugin 元数据
│
├── agents/
│   ├── bitfrog.agent.md                   # 主路由
│   ├── bitfrog-brainstorm.agent.md
│   ├── bitfrog-plan.agent.md
│   ├── bitfrog-execute.agent.md
│   ├── bitfrog-debug.agent.md
│   ├── bitfrog-review.agent.md
│   ├── bitfrog-mentor.agent.md
│   └── bitfrog-ui-design.agent.md
│
├── hooks/
│   └── hooks.json                     # Agent Hooks 配置
│
├── docs/
│   └── specs/
│
├── README.md
├── readme-zh.md
└── LICENSE
```

### 从 v3.1 移除的组件

- `src/` 目录（全部 TypeScript 代码）
- `package.json`（VS Code extension manifest）
- `tsconfig.json`、`eslint.config.mjs`
- `dist/` 编译输出
- `.vsix` 打包
- `src/webview/`（sidebar webview，被 askQuestions 替代）
- `src/tools/options.ts`（options tool，被 askQuestions 替代）

---

## Agent Consolidation

### 合并映射

| v3.1 Agent | v4.0 归属 | 处理方式 |
|-----------|----------|---------|
| brainstorm | bitfrog-brainstorm | 保留，吸收 think 的批判性追问能力 |
| plan | bitfrog-plan | 保留，吸收 context 的依赖映射能力 |
| execute | bitfrog-execute | 保留，吸收 tdd + verify |
| debug | bitfrog-debug | 保留，独立入口，自闭环 |
| review | bitfrog-review | 保留，吸收 respond + finish |
| mentor | bitfrog-mentor | 保留，重构为透明化学习引导 |
| ui-design | bitfrog-ui-design | 保留，由 brainstorm 自动触发 |
| think | 移除 | 批判性追问能力并入 brainstorm |
| context | 移除 | 依赖映射能力并入 plan |
| tdd | 移除 | TDD 流程并入 execute |
| verify | 移除 | 验证步骤并入 execute 和 review |
| respond | 移除 | 反馈回应并入 review |
| finish | 移除 | 收尾流程并入 review |

### Agent 职责原则

1. **自闭环** — 每个 agent 能独立完成自己职责范围内的事，不强制依赖其他 agent
2. **超出范围才 handoff** — 只有当问题超出当前 agent 的职责边界时，才提示 handoff
3. **不强制回主路由** — 完成就是完成，用户下一轮自然回到 @bitfrog

---

## Handoffs Flow

### 主流程链

```
brainstorm ──[进入计划]──▶ plan
plan ──[开始执行]──▶ execute
execute ──[代码审查]──▶ review
review ──[完成] or [下一轮]──▶ (结束)
```

### Handoff 配置

- 所有 handoff 使用 `send: false` — 显示按钮，用户主动点击才跳转
- 用户点击后自动切换到目标 agent，prompt 预填充
- 不点击则留在当前对话，不强制流转

### 超出范围 Handoff

```
debug 发现架构问题 ──▶ brainstorm
debug 需要大规模重构 ──▶ plan
execute 遇到复杂 bug ──▶ debug
review 发现设计缺陷 ──▶ brainstorm
```

---

## Sub-Agent Collaboration

### 状态协议

```
DONE                → 任务完成，显示 handoff 按钮
DONE_WITH_CONCERNS  → 完成但有隐患，先告知用户再继续
NEEDS_CONTEXT       → 缺少信息，用 askQuestions 向用户提问
BLOCKED             → 超出职责范围，建议 handoff 到其他 agent
```

### 上下文隔离

当 agent 内部需要 spawn 子任务时：
- 只传递：当前任务的描述 + 相关文件路径 + 验收标准
- 不传递：整个 session 历史、其他任务的内容
- 子代理完成后报告状态

### 两阶段 Review（内嵌在 review agent）

```
阶段 1：Spec 合规检查
    "这个改动是否符合 plan 的要求？"
    ├── 通过 → 进入阶段 2
    └── 不通过 → 指出偏差，要求修正

阶段 2：代码质量检查
    "代码质量、可维护性、安全性如何？"
    ├── 通过 → DONE
    └── 不通过 → 指出问题，最多 5 轮迭代
```

---

## User Interaction

### askQuestions 替代 sidebar webview

| 方面 | v3.1 sidebar | v4.0 askQuestions |
|------|-------------|-------------------|
| 用户体验 | 需要看侧边栏 | 内联在对话流中 |
| 维护成本 | ~300 行 HTML/CSS/JS | 零自定义代码 |
| 子代理支持 | 不支持 | 原生支持 |
| 可中断性 | 必须先回答 | 可以发消息跳过/重定向 |

### Agent Hooks

```json
{
  "session-start": "注入 BitFrog 上下文（可用 agents、流程说明）",
  "agent-complete": "记录 agent 执行结果",
  "error": "捕获异常，提供恢复建议"
}
```

---

## Chinese Philosophy Integration

### 方法论

**不是表层翻译，是思维模型替换。** 每个 agent 用一个中国哲学框架重新组织其内部决策逻辑。

### 哲学映射

| Agent | 哲学框架 | 核心理念 | 思维差异 |
|-------|---------|---------|---------|
| brainstorm | 道家·无为 | 不预设答案，顺势引导 | 不急于收敛，允许发散 |
| plan | 兵法·谋略 | 谋定而后动 | 先侦察再部署 |
| execute | 儒家·知行合一 | 知而不行非真知 | 测试（知）→ 代码（行）→ 验证（合一）|
| debug | 中医·望闻问切 | 整体辨证，不头痛医头 | 整体归纳法 vs 西方排除法 |
| review | 儒家·三省吾身 | 自省而后省人 | 先 spec 自省再质量审察 |
| mentor | 禅宗·棒喝 | 不说破，点到即止 | hint 分级如禅机 |
| ui-design | 道家·形神兼备 | 先明"神"再塑"形" | 先理解真实需求再设计界面 |

### 落地节奏

1. 技术骨架先行 — 主路由、handoffs、plugin 结构
2. 每个 agent prompt 单独设计 — 逐个深入讨论哲学框架映射
3. 不强求 — 如果某个 agent 用哲学框架反而别扭，就不硬套

---

## API Status & Fallback

### 当前 API 能力状态

| 能力 | 状态 | 文档链接 |
|------|------|---------|
| `.agent.md` 自定义 Agent | **Stable** | [Custom agents in VS Code](https://code.visualstudio.com/docs/copilot/customization/custom-agents) |
| `handoffs:` YAML 配置 | **Stable** | [Custom agents configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration) |
| Agent Plugin (`plugin.json`) | **Preview** (VS Code 1.110+) | [Agent plugins in VS Code](https://code.visualstudio.com/docs/copilot/customization/agent-plugins) |
| askQuestions carousel | **Stable** (已进入 VS Code 核心) | [VS Code Feb 2026 release](https://code.visualstudio.com/updates/v1_110) |
| Agent Hooks | **Preview** | [VS Code agent docs](https://code.visualstudio.com/docs/copilot/agents/overview) |

### 分层架构策略

根据 API 稳定性分层实施：

**第一层（基于 Stable API）：**
- 7+1 个 `.agent.md` 文件 + `handoffs:` 配置 — 这部分今天就能工作
- 如果 Agent Plugin 不可用，退回为 VS Code Extension，TypeScript 代码负责注册 agent 文件

**第二层（基于 Preview API，需验证）：**
- Agent Plugin 打包分发（`plugin.json`）— 如果可用则移除 TypeScript
- Agent Hooks — 如果可用则替代手动初始化

**第三层（需验证能力边界）：**
- askQuestions 替代 sidebar — 需验证是否支持 multi-select、grouped options
- 如果 askQuestions 能力不足，**Plan B**：保留轻量 webview 或接受纯文本选项交互

### 主路由实现策略

`bitfrog.agent.md` 作为主路由的实现方式取决于验证结果：

- **优选方案**：纯 prompt 路由 — `bitfrog.agent.md` 的 prompt 中包含意图识别指令，利用 LM 能力分流，handoffs 按钮引导用户到子 agent
- **备选方案**：保留轻量 TypeScript — 如果纯 prompt 路由不够可靠（如 command routing 和 state routing 需要程序化逻辑），保留 `participant/router.ts` 做路由，其余逻辑全在 `.agent.md` 中

### 子代理实现方式

本 spec 中的"子代理"指两种不同机制：

1. **Handoffs**（用户可见）— 流程间流转，用户点击按钮切换 agent。基于 Stable API。
2. **内部 scoped LM 调用**（用户不可见）— agent 内部发起独立 LM 请求处理子任务（如 review 的两阶段检查）。如需 TypeScript 支持，保留在备选方案中。

---

## Migration Path

### 版本策略

- v4.0 作为**新的 marketplace 条目**发布（`bit-frog`），不覆盖 `superpower-copilot`
- v3.1 保持现有 marketplace 条目，标记为 deprecated，README 引导用户迁移到 BitFrog
- 两者可以共存，不冲突

### 迁移检查清单

在删除 v3.1 旧代码之前，v4.0 必须达到以下功能对等：

- [ ] 7+1 个 agent 全部可用，能正确响应用户调用
- [ ] handoff 流程链正常工作（brainstorm → plan → execute → review）
- [ ] 用户交互体验不低于 v3.1（askQuestions 或备选方案）
- [ ] Agent 路由（command / context / LM 分类）准确率可接受
- [ ] 中英文双语支持正常

### 迁移时间线

1. **Phase 0**：最小可行验证（验证 API 能力）
2. **Phase 1**：基于 Stable API 构建核心（.agent.md + handoffs）
3. **Phase 2**：集成 Preview API（Plugin 打包、Hooks）— 视验证结果决定
4. **Phase 3**：中国哲学 prompt 逐个设计
5. **Phase 4**：发布 BitFrog v4.0，deprecate v3.1

---

## Risk & Validation

### Agent Plugin Preview 风险

Agent Plugin 目前是 Preview 状态，需要先做最小可行验证：

1. 主路由 `bitfrog.agent.md` 能否正常注册和路由
2. handoffs 在 plugin 模式下是否正常工作
3. askQuestions 是否支持 multi-select / grouped options / free text
4. hooks 能否正常触发
5. 纯 prompt 路由的意图识别准确率

### 验证策略

先创建一个最小 plugin（1 个主路由 + 2 个子 agent + 1 个 handoff），验证核心能力后再全面迁移。如果 Agent Plugin 不可用，退回 VS Code Extension 模式，仅使用 Stable API。

---

## Success Criteria

### 功能验收

- [ ] 用户选择 `@bitfrog` 后能被正确路由到对应 agent
- [ ] brainstorm → plan → execute → review handoff 链完整可用
- [ ] debug agent 能独立诊断 + 修复，不强制依赖其他 agent
- [ ] askQuestions（或备选方案）用户交互体验不低于 v3.1 sidebar
- [ ] 状态协议（DONE/BLOCKED/...）在所有 agent 中一致工作

### 用户体验验收

- [ ] 下拉框 agent 数量 ≤ 8（含主路由）
- [ ] 新用户无需阅读文档即可通过 @bitfrog 开始使用
- [ ] 中英文双语支持

---

## Borrowed from Superpowers v5.0.2

| 能力 | 借鉴方式 |
|------|---------|
| 子代理上下文隔离 | 直接采用，子代理只接收必要信息 |
| 两阶段 Review | 内嵌到 review agent |
| 状态协议（DONE/BLOCKED/...） | 所有 agent 统一使用 |
| Document Review Loop | brainstorm 和 plan 完成后自动审查 |
| Plan 粒度（2-5 分钟/任务） | plan agent 采用此标准 |

### 差异化

| 方面 | Superpowers | BitFrog |
|------|------------|---------|
| 哲学基础 | 西方工程思维 | 中国哲学 + 工程思维 |
| 交互方式 | 文本 + Visual Companion | 原生 askQuestions + handoffs |
| 平台定位 | 跨平台 | 专注 GitHub Copilot |
| Agent 协作 | 1% rule 强制触发 | 主路由自动分流 |
| Agent 数量 | 14 个全暴露 | 7+1 精简入口 |
