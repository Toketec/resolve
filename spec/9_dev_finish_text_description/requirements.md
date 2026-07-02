# Spec 9: 文字描述统一优化 — 3 → 6 Agent 架构对齐

> **目标**: 将项目中所有仍描述「3 个 Agent」的文字、图标、布局更新为「6 Agent 2+2+2 (BULL/BEAR/NEUT)」正确表述
> **优先级**: P0（评委/用户第一眼看到的就是这些文字）
> **估计工时**: 4-6h（含 i18n 多语言）

---

## 1. 背景

项目已从最初 3 Agent 设计（BULL-1/BEAR-1/NEUT-1）升级为完整的 **6 Agent 设计**：

| 立场 | Agent | 专注领域 | 数据源 | 权重 |
|:----:|:-----:|---------|-------|:---:|
| **BULL** (看多→YES) | BULL-1 | 交易所预言机 | HTX行情+订单簿 | 1.0 |
| | BULL-2 | 技术预言机 | TEE/L2基础面 | 0.8 |
| **BEAR** (看空→NO) | BEAR-1 | 媒体预言机 | 新闻舆情+监管 | 0.8 |
| | BEAR-2 | 监管预言机 | 全球监管政策 | 0.8 |
| **NEUT** (中立→数据驱动) | NEUT-1 | 链上预言机 | 链上数据+鲸鱼 | 0.9 |
| | NEUT-2 | 宏观预言机 | 宏观+地缘 | 0.9 |

但前端代码和 i18n 大部分仍说「3 个 Agent / Three agents / 三个 AI 预言机」。需要系统性修复。

---

## 2. 扫描发现 — 全部不一致汇总

### Layer A: 类型定义系统（跨切片基础设施）

| # | 文件 | 行 | 问题 | 严重度 |
|:-:|------|:--:|------|:------:|
| A1 | `packages/shared/src/index.ts` | L14 | `AgentKind` 含 `sports-feed`/`weather-feed`/`election-monitor` — 不属于我们设计 | 🔴 致命 |
| A2 | `packages/shared/src/index.ts` | L16-18 | `Agent` 类型缺少 `tier: "BULL"\|"BEAR"\|"NEUT"` 和 `weight: number` | 🟡 中 |
| A3 | `packages/shared/src/index.ts` | L21-24 | `AgentVote` 类型缺少 `tier: "BULL"\|"BEAR"\|"NEUT"` 和 `weight: number` | 🟡 中 |
| A4 | `apps/web/lib/types.ts` | L42-48 | 同 A1（与 shared 重复定义） | 🔴 致命 |
| A5 | `apps/web/lib/types.ts` | L50-63 | 同 A2（无 tier/weight） | 🟡 中 |
| A6 | `apps/web/lib/types.ts` | L65-72 | 同 A3（无 tier/weight） | 🟡 中 |
| A7 | `apps/web/lib/mappers.ts` | L114-120 | `ApiAgent` 已有 `tier: "active"\|"standby"` 但这不是 BULL/BEAR/NEUT，需新增立场字段 | 🟡 中 |

### Layer B: Mock 数据（前端兜底 — 影响全部 UI 渲染）

| # | 文件 | 行 | 问题 | 严重度 |
|:-:|------|:--:|------|:------:|
| B1 | `apps/web/lib/mock/agents.ts` | L49-93 | Agent 5-6（`Field Reporter`/`Atmosphere`/`Ballot Watch`）不属于 2+2+2 设计 | 🔴 致命 |
| B2 | `apps/web/lib/mock/agents.ts` | L3-98 | 全部 6 个 Agent 缺少 BULL/BEAR/NEUT 层级标签和 callsign 命名（应改为 BULL-1/BEAR-1 等） | 🔴 致命 |
| B3 | `apps/web/lib/mock/markets.ts` | L205 | `buildConsensus()` 用 `MOCK_AGENTS.slice(0, 4)` — 应改为 6 | 🔴 致命 |
| B4 | `apps/web/lib/mock/markets.ts` | L241 | `MOCK_AGENTS.slice(0, 4)` — 同上 | 🔴 致命 |
| B5 | `apps/web/lib/mock/markets.ts` | L38, L208 | `resolutionCriteria` 和 consensus 中 threshold 写 0.75 — 架构设计为 0.65 | 🟡 中 |

### Layer C: i18n 多语言文案（共 11 种语言）

| # | 文件 | Key | 现在写的 | 应该写 | 影响语言 | 严重度 |
|:-:|------|:---:|---------|-------|:-------:|:------:|
| C1 | `messages.ts` | `hero.subtitleBold` | "Three AI oracles." / "三个 AI 预言机" / "Tres oráculos" (所有语言) | "Six AI oracles, three stances." / 六个 AI 预言机三种立场 | 11/11 | 🔴 致命 |
| C2 | `messages.ts` | `how.titleA` | "Three agents." / "三个智能体" (所有语言) | "Six agents, two per stance." / 六个智能体每组两个 | 11/11 | 🔴 致命 |
| C3 | `messages.ts` | `oracle.a*` | "Oracle A — Exchanges" / "Reads the source." | 改为描述 BULL 组（BULL-1+BULL-2） | 11/11 | 🔴 致命 |
| C4 | `messages.ts` | `oracle.b*` | "Oracle B — Newswire" / "Reads the world." | 改为描述 BEAR 组（BEAR-1+BEAR-2） | 11/11 | 🔴 致命 |
| C5 | `messages.ts` | `oracle.c*` | "Oracle C — On-chain" / "Reads the chain." | 改为描述 NEUT 组（NEUT-1+NEUT-2） | 11/11 | 🔴 致命 |
| C6 | `messages.ts` | `bento.networkTitle` | "Six oracles. Always on." ✅ 正确 | ✅ 保留 | — | ✅ OK |
| C7 | `messages.ts` | `hero.subtitle` | "the agents read the wires, the chain, and the APIs" | 需更新为 6 agent 三立场描述 | 11/11 | 🟡 中 |

### Layer D: 前端页面 / 组件

| # | 文件 | 位置 | 问题 | 严重度 |
|:-:|------|:----:|------|:------:|
| D1 | `app/agents/page.tsx` | L208 | `{...} / 4` → 应为 `/ 6` | 🟡 中 |
| D2 | `app/agents/page.tsx` | L1-252 | 整个页面无 BULL/BEAR/NEUT 分类分组可视化 | 🟡 中 |
| D3 | `app/agents/page.tsx` | L24-30 | `TONE_BY_INDEX` 6 色已可用，但缺 BULL/BEAR/NEUT 分组标签 | 🟢 低 |
| D4 | `app/page.tsx` | L153-177 | 首页"Pillars"显示 3 个大卡片（Oracle A/B/C）→ 应描述为 6 个 Agent 三组 | 🟡 中 |
| D5 | `app/markets/[slug]/page.tsx` | L162 | `threshold 0.75` 默认值 → 应为 0.65 | 🟡 中 |
| D6 | `components/consensus-meter.tsx` | L82 | votes grid `grid-cols-2 sm:grid-cols-4`（4 列放 6 个不平衡）→ 建议 `grid-cols-3` | 🟢 低 |
| D7 | `components/oracle-deliberation.tsx` | L24-26 | `WEIGHT` map 已用 `bull-1`/`bear-1`/`neut-2` 等 ID ✅ 正确 | — | ✅ OK |

### Layer E: 项目根文档

| # | 文件 | 问题 | 严重度 |
|:-:|------|------|:------:|
| E1 | `README.md` | "The Agent Trinity" 标题 + 3 列 Agent 表 — 需更新为 6 Agent 2+2+2 | 🟡 中 |
| E2 | `README.md` | 架构图仅画 3 个 Agent | 🟢 低 |

### Layer F: packages/ai 核心逻辑

| # | 文件 | 问题 | 严重度 |
|:-:|------|------|:------:|
| F1 | `packages/ai/src/prompts.ts` | ✅ 已正确包含全部 6 个 Agent profile (BULL-1/2, BEAR-1/2, NEUT-1/2) | ✅ OK |
| F2 | `packages/ai/src/consensus.ts` | ✅ `ROLE_WEIGHTS` 和 `DEFAULT_THRESHOLD=0.65` 正确 | ✅ OK |
| F3 | `packages/ai/src/index.ts` | ✅ `resolveMarket()` 使用 `AGENT_PROFILES.map` 遍历全部 6 个 | ✅ OK |

---

## 3. 边界说明

- **不包括** packages/ai 中的 LLM prompt（已正确）
- **不包括** consensus.ts 权重数学（已正确）
- **不包括** 合约、数据库 schema、API routes 的业务逻辑（无文本问题）
- **不包括** 白皮书或 docs 文档（白皮书是新写，单独任务）
