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

## Risk & Validation

### Agent Plugin Preview 风险

Agent Plugin 目前是 Preview 状态，需要先做最小可行验证：

1. 主路由 `bitfrog.agent.md` 能否正常注册和路由
2. handoffs 在 plugin 模式下是否正常工作
3. askQuestions 在 `.agent.md` 中是否可用
4. hooks 能否正常触发

### 验证策略

先创建一个最小 plugin（1 个主路由 + 2 个子 agent + 1 个 handoff），验证核心能力后再全面迁移。

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
