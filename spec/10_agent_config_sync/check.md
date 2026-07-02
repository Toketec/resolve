# Spec 10: 验收

## 自检

```bash
pnpm typecheck
pnpm build
```

## 检查点

| # | 操作 | 预期 |
|:--|------|------|
| 1 | `agents.ts` 存在，6 Agent 字段完整 | 配置数据与 whitepaper/judge-qa 一致（SQL 镜像兜底） |
| 2 | `grep "MOCK_AGENTS" mock/agents.ts` | 第一行是 import，不再是硬编码 |
| 3 | `grep "FALLBACK_AGENTS" mappers.ts` | 从 `AGENT_META.map()` 派生 |
| 4 | `grep "agentFallback" mappers.ts` | 无结果 |
| 5 | `grep "KIND_FROM_ROLE" mappers.ts` | import 形式，非内联 |
| 6 | SQL migration 中 agent 数据完整 | INSERT 语句与 AGENT_META 一致 |
| 7 | 访问 `/api/agents` | 返回 6 个 Agent，modelHint = Claude Sonnet 4 / B.AI（主推） |
| 8 | 访问 `/agents` 页面 | 6 个卡片正常渲染，描述与 whitepaper 一致 |
