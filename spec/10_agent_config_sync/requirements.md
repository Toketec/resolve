# Spec 10: Agent 配置同步机制 — 统一 5 份分散的 Agent 定义

## 解决什么问题

当前 6 个 Agent 的定义分布在 **5 份不同的拷贝**中，且已经出现信息飘移：

```
packages/ai/src/prompts.ts           ← AI 层 — 6 个 AGENT_PROFILES（含完整 system prompt）
apps/web/lib/mock/agents.ts          ← UI 层 — MOCK_AGENTS
apps/web/lib/mappers.ts              ← API 层 — FALLBACK_AGENTS + agentRowToAgent
packages/db/migrations/00002_add_agents.sql  ← DB 层 — SQL INSERT（从未执行）
packages/shared/src/index.ts         ← 类型层 — 只有接口无实例
```

**已发现的漂移**（对比 docs/ 中的规范设计）：
- **modelHint 全错**：mock 写 "Claude 4.7 · GPT-5"，权威 docs 说 "Claude Sonnet 4"
- **description 不一致**：bull-2 mock 多了 "Supplements BULL-1…"，bear-1 混入 "macro risks"（应属 NEUT-2），mappers/SQL 缺词
- **统计字段**：mock 精确定义 6 组值，mappers 用 hash 派生不匹配
- **KIND_FROM_ROLE 映射**：未明确设计意图

**设计方案**：
1. 以 docs/（whitepaper + judge-qa + dev-execution-spec）中的 Agent 设计为**规范**
2. 创建 `@resolve/shared/agents.ts` 作为**唯一编辑点**，存放 6 个 Agent 的规范配置
3. mock/agents.ts、mappers.ts 从规范配置派生
4. 创建 DB seeding 脚本推送至 Supabase agents 表

## 规范配置来源

| 字段 | 来源 |
|------|------|
| 名字、role、roleLabel、立场、权重 | `docs/whitepaper.md` §4.2 Agent Taxonomy |
| 分析视角（description） | 同上 analytical lens 列 |
| 模型分配 | `docs/ENG/judge-qa.md` 模型分配表 |
| 统计字段（uptime/resolutions 等） | 沿用当前 mock/agents.ts 的精确值 |
| 架构设计 | `docs/ENG/architecture-overview.md` §2.3 |
| role 设计 | `docs/ENG/dev-execution-spec.md` Agent 池表格 |

详见 `spec/10_agent_config_sync/canonical-design.md`

## 依赖项

- `packages/shared/` — 新建 `packages/shared/src/agents.ts`
- `packages/db/src/data.ts` — 已有 `listAgents()` / `getAgentById()`（保留）
- `packages/db/migrations/00002_add_agents.sql` — 保留不动
- `apps/web/lib/mock/agents.ts` — 改为引用规范配置
- `apps/web/lib/mappers.ts` — `FALLBACK_AGENTS` 改为引用规范配置

## 边界说明

- **不做**：修改 prompts.ts 中 AGENT_PROFILES 的 system prompt 内容
- **不做**：修改 agent 权重和投票逻辑
- **不做**：新的 UI 页面或视觉改动
- **不做**：修改 SQL migration 文件
- **不做**：prompts.ts 的 identity 描述与 UI description 强制统一（AI prompt 可以更详细）

## 工作流

```
开发者修改 @resolve/shared/agents.ts  ←── 唯一编辑点
  → mock/agents.ts、mappers.ts 自动同步（编译时）
  → pnpm seed:agents 推送至 Supabase（运行时）
```
