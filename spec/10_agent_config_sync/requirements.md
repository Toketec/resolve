# Spec 10: Agent 配置同步机制 — 统一 6 份分散的 Agent 定义

## 解决什么问题

当前 6 个 Agent 的定义分布在 **5 份不同的拷贝**中，每次修改 Agent 名字、描述、模型配置都需要手动同步，极易遗漏：

```
packages/ai/src/prompts.ts           ← AI 层 — 6 个 AGENT_PROFILES（含完整 system prompt）
apps/web/lib/mock/agents.ts          ← UI 层 mock — MOCK_AGENTS 数组（名字/描述/统计）
apps/web/lib/mappers.ts              ← API 层 — FALLBACK_AGENTS 数组（名字/描述/DB 字段）
packages/db/migrations/00002_add_agents.sql  ← DB 层 — SQL INSERT（从未执行/过期）
packages/shared/src/index.ts         ← 类型层 — Agent 接口定义（无实例数据）
```

**核心问题**：修改一个 Agent（如把描述从 "Technical analysis agent..." 改为更准确的内容），需要改 4 处代码，且各层描述已经有飘移（对比 prompts.ts 的 identity 和 mock/agents.ts 的描述，措辞不同）。

**正确的方向**：6 个 Agent 是系统的架构级常量，应当：
1. **有一份确切的规范配置**（单源真理）
2. **数据库作为持久化存储**，方便后期调整和维护部分状态
3. **各层从同源拉数据**，而非各自维护拷贝

## 依赖项

- `packages/shared/` — 新建 `packages/shared/src/agents.ts` 规范配置文件
- `packages/db/src/data.ts` — 已有 `listAgents()` / `getAgentById()` 函数
- `packages/db/migrations/00002_add_agents.sql` — 已有 agent 表迁移，可以废弃或替换
- `apps/web/lib/mock/agents.ts` — 改为引用规范配置
- `apps/web/lib/mappers.ts` — `FALLBACK_AGENTS` 改为引用规范配置
- `apps/web/app/api/agents/route.ts` — 保持 DB → 规范配置的降级模式

## 边界说明

- **不做**：修改 AI 层 `prompts.ts` 中 `AGENT_PROFILES` 的 system prompt 内容（那些是 LLM 专用的长文本提示，不属于元数据配置）
- **不做**：修改 agent 权重和投票逻辑（0.8/0.9/1.0 的权重分配共识层已有）
- **不做**：新的 UI 页面或视觉样式改动
- **不做**：删除 mock 数据本身（保留 mock 目录结构，只删除 mock/agents.ts 中的冗余定义）
- **不做**：修改生产 SQL migration（现有 migration 保留不动）

## 设计原则

**单源真理在 `@resolve/shared`**，**持久化在 DB**，**各层从同源拉数据**：

```
@resolve/shared/agents.ts              ← 唯一编辑点
  ├── DB seeding script                ← 推送至 Supabase agents 表
  ├── @resolve/shared → mock/agents.ts ← 替换 MOCK_AGENTS
  ├── @resolve/shared → mappers.ts     ← 替换 FALLBACK_AGENTS
  └── prompts.ts → 引用 metadata       ← AI 层保留完整 prompt，基本元数据从 canonical 获取
```

工作流：
1. 开发者在 `@resolve/shared/agents.ts` 中修改 Agent 配置
2. 运行 `pnpm seed:agents` 将最新配置 upsert 到 DB
3. 生产环境 API 从 DB 读取；开发环境从信规范配置降级
