# Spec 10: 执行计划

## 架构

```
packages/db/migrations/00002_add_agents.sql  ←── 唯一编辑点 (规范数据)
                                │
                                ├── 运行时：API 查 DB → mappers 映射 → 返回给前端
                                │
                                └── 开发/预览：mock/agents.ts (最接近渲染层，仅一处)
```

**原则**：除 SQL 之外，TypeScript 中只有最接近渲染层的 `mock/agents.ts` 一处存在 agent 数据定义。任何其他文件（mappers、API 路由、shared）都不应二次定义或引用常量。

## 步骤

### Step 1: 检查 SQL migration (T01)

检查 `packages/db/migrations/00002_add_agents.sql` 中的 INSERT 语句是否包含 6 个 Agent 的完整数据。补充 `weight`、`role_label`、`tier` 等字段。

### Step 2: 删除 mappers.ts 中的兜底数据 (T02)

从 `apps/web/lib/mappers.ts` 中：

- **删除** `FALLBACK_AGENTS` 常量数组
- **删除** `agentFallback()` 函数
- **删除** `deriveStance()` 函数（stance 已由 SQL 提供）
- **删除** 内联的 `KIND_FROM_ROLE` 定义（UI 层 mock 自己有）
- **删除** 基于 `hashString` 的统计派生逻辑
- **保留** `derive8004Id()`、`hashString()`（其他映射场景还在用）

`mappers.ts` 只保留**纯映射函数**，不再兜底或硬编码 agent 数据。

### Step 3: 检查 mock/agents.ts 数据一致性 (T03)

确认 `apps/web/lib/mock/agents.ts` 中的 6 个 Agent 数据字段与 SQL migration 一致（id、callsign、name、role、roleLabel、stance、weight、modelHint 等）。不作重构，仅验证。

### Step 4: 检查 API 路由引用 (T04)

查找所有引用 `FALLBACK_AGENTS` 或 `agentFallback` 的 API 路由文件，改为查询 DB：

```bash
grep -r "FALLBACK_AGENTS\|agentFallback" apps/web/app/api/
```

API 层不再兜底，数据来自 DB 查询。如果 DB 查询返回空 → 返回空（不属于兜底场景）。

### Step 5: 验证 (T05)

```bash
pnpm typecheck
pnpm build
```
