# Split Tickets — 任务分解与批量 Dispatch

## 当前团队

你有 4 个 Worker 可用。用 `legion-status` 查看实时状态。

## Ticket 结构

每个 ticket 通过 `legion-dispatch` 提交：

```
legion-dispatch <worker_id> -t "<title>" -c "<context>" -k "<criteria>" [--after N,M] [--plan "<structure plan>"] "<prompt>"
```

| 字段 | CLI 标志 | 必填 | 说明 |
|------|----------|------|------|
| worker_id | 位置参数 1 | 是 | 分配给哪个 worker（1-4） |
| title | -t | 是 | 任务目标，描述此 ticket 要完成什么 |
| context | -c | 是 | 技术上下文 + 整体 plan 摘要 |
| criteria | -k | 是 | 可验证的成功标准 |
| after | --after | 否 | 依赖的 ticket IDs，逗号分隔 |
| plan | --plan | 否 | 文件夹规划：文件路径、目录约定、前序 ticket 建立的结构 |
| prompt | 最后位置参数 | 是 | 完整任务描述 |

## 字段写作要点

### title (-t) — 任务目标
描述此 ticket 的核心交付物。
- 好: "Implement user authentication API"、"Add SQLite persistence layer"
- 差: "Auth" / "Work on stuff"

### context (-c) — 技术上下文 + plan 概述
应包含：
- **整体 plan**：当前在做什么、目标是什么、此 ticket 在整体中的位置
- **技术栈**：语言、框架、版本
- **项目结构**：相关目录和文件
- **已有代码**：可复用的接口、类型、函数
- **约束**：性能要求、兼容性、不能用的依赖等
- 注意：不要包含工作目录路径，Worker 有自己的 worktree

### criteria (-k) — 成功标准
每条标准必须可验证：命令输出、文件存在、API 返回值。
- 好: "cargo test passes, POST /login returns 200 with JWT, invalid password returns 401"
- 差: "works correctly" / "good code quality"

### prompt (最后参数) — 完整实现指导
Worker 执行任务的全部信息，无需回来问问题。
- 具体要创建/修改哪些文件
- API 设计、数据结构、关键逻辑
- 边界情况处理

## 分解流程

### Step 1: 分析任务范围
- 理解用户需求的完整边界
- 识别独立的功能模块和文件组

### Step 2: 规划 ticket 划分
每个 ticket 应该：
- 一个 worker 能独立完成
- 操作的文件尽量不与其他 ticket 重叠
- 有明确的输入/输出边界
- 有可独立验证的 success criteria

### Step 2.5: 文件夹规划 (Structure Plan)

为每个 ticket 编写 `--plan` 参数，确保 Worker 对项目结构有一致理解：

**规划内容：**
- 此 ticket 要创建/修改的文件路径（精确到文件名）
- 目录结构约定（import 风格、模块组织方式）
- 前序 ticket 已建立的文件/约定（递进式累积）
- 与整体 plan 的关系（此 ticket 在架构中的位置）

**递进式累积原则：**
- Ticket 1 的 plan: 定义基础目录结构
- Ticket 2 的 plan: 包含 ticket 1 建立的结构 + 本 ticket 新增的文件
- Ticket 3 的 plan: 包含 ticket 1+2 的结构 + 本 ticket 新增的文件

**示例：**
```
--plan "Files: src/db/schema.rs (new), src/db/mod.rs (modify). Convention: use crate::db::Schema for imports. This is the data layer foundation — ticket 2 will build API on top of these types."
```

### Step 3: 识别依赖关系 (DAG)
- ticket B 读取 ticket A 创建的文件 → B --after A
- ticket C 需要 A 和 B 的输出 → C --after A,B
- 完全无关的 ticket → 无 --after（并行执行）
- 原则：最小化依赖，最大化并行

### Step 4: 分配 worker
- 用 `legion-status` 查看当前 worker 状态
- 无依赖的 ticket 分配给不同 worker（并行）
- Worker 完成任务后会自动接新任务，无需等待

### Step 5: 批量 dispatch
列出所有 dispatch 命令，确认后逐个执行：
```
legion-dispatch 1 -t "..." -c "..." -k "..." --plan "Files: src/db/schema.rs (new). Base data layer." "..."
legion-dispatch 2 -t "..." -c "..." -k "..." --after 1 --plan "Files: src/api/routes.rs (new). Depends on schema from ticket 1: use crate::db::Schema." "..."
legion-dispatch 3 -t "..." -c "..." -k "..." --after 1,2 --plan "Files: src/ui/app.rs (modify). Uses API from ticket 2 and types from ticket 1." "..."
```

## 分解原则

1. **文件边界优先**：不同 ticket 尽量操作不同文件/目录
2. **先基础后上层**：DB schema → API → UI → Tests
3. **最小依赖**：能并行就并行，只在必要时用 --after
4. **Context 要充分**：宁多勿少，Worker 看不到你的上下文
5. **Criteria 要可测**：每条标准必须能用命令验证
