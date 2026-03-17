# BitFrog Copilot

[English](README.md)

**7+1 个 AI 开发代理，融合中国哲学底层思维，为 GitHub Copilot 提供有深度的开发工作流。**

## 为什么用哲学而不是规则？

大多数 AI 编码 agent 用**硬规则**来强制纪律：铁律、硬门禁、封堵借口列表。这有效，但我们发现它有局限性。

当你用"你必须做 X"和"你不能做 Y"去强制 LLM 时，模型遵守了字面要求，但错过了精神。它在打勾而不是在理解。结果看起来正确但感觉机械。

**中国哲学提供了另一种方式：** 不从外面约束行为，而是从内部塑造 agent 的思维方式。一个真正理解测试价值的 agent 会自然地写测试——不需要铁律。

本项目深受 Jesse Vincent 的 [Superpowers](https://github.com/obra/superpowers) 启发。我们感谢它的基础理念和工作流设计。BitFrog 在那个基础上，用哲学思维模型替换了外在约束——不是因为规则有错，而是因为我们相信**理解比遵从更深**。

## 安装

**VS Code Marketplace：**
Extensions 搜索 "BitFrog Copilot" → 安装

**Agent Plugin：**
Extensions 侧边栏 → Agent Plugins → 搜索 "bitfrog-copilot"

## 代理

| 代理 | 职责 | 核心哲学 |
|------|------|---------|
| **@bitfrog** | 主路由 | 辨证路由 — 辨清意图再指路 |
| **@bitfrog-brainstorm** | 探索设计 | 格物致知 — 穷究本质再论方案 |
| **@bitfrog-plan** | 规划拆解 | 格物 + 辨证 — 先侦察地形再制定计划 |
| **@bitfrog-execute** | 执行开发 | 知行合一 — 知道该写测试就写 |
| **@bitfrog-debug** | 诊断修复 | 辨证论治 — 先辨本质层次再选策略 |
| **@bitfrog-review** | 审查收尾 | 三省吾身 — 自省、互省、终省 |
| **@bitfrog-mentor** | 学习引导 | 格物致知作为过程 — 引导，不直接给答案 |
| **@bitfrog-ui-design** | UX 研究 | 先理解用户真实需求，再设计界面 |

## 思维准则

五条准则驱动所有 BitFrog agent（详见 `bitfrog-philosophy.md`）：

**元准则：中庸之道** — 每个行为都有恰当的度。过犹不及。这不是"找中间值"——而是在具体场景中判断什么是"刚好"。

**核心准则：**
1. **格物致知** — 先穷究事物本质再行动。用户可能不知道自己真正要什么。
2. **知行合一** — 知和行不可分。如果你跳过了你知道该做的事，你并不真的知道。
3. **辨证论治** — 同一个症状可能有不同根因。先辨清问题层次再选修复策略。

**协作准则：**
4. **阴阳互生** — 各司其职，心怀全局。
5. **三省吾身** — 质量来自反省思维过程，不来自打勾。

### 为什么不直接用规则？

| 规则驱动（外在约束） | 哲学驱动（内在驱动） |
|-------------------|-------------------|
| "你必须写测试" | Agent 理解测试的价值 → 自然地写 |
| "你必须做根因分析" | Agent 理解治标不治本会制造更多问题 |
| 列 11 条借口逐条封堵 | 理解到位时，借口不会产生 |
| 检查清单：✅ / ❌ | 反省："我的思维过程对吗？" |
| 找最优解 | 找**恰当**解 |

## 工作流

```
brainstorm → plan → execute → review
                       ↕
                     debug
```

每个箭头是一个 **handoff 按钮**，点击即可流转。`debug` 和 `mentor` 可以随时独立使用。

## 语言

所有 agent 自动支持 **English** 和 **简体中文**。

## 致谢

BitFrog Copilot 受 Jesse Vincent 的 [Superpowers](https://github.com/obra/superpowers) 启发。工作流结构、skill 架构和许多基础概念源自该项目。感谢它提供的开源基础。

## 许可证

MIT

---

*BitFrog Copilot 是 [BitFrog](https://github.com/rainyulei) 产品家族的一部分。*
