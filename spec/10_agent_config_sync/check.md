# Spec 10: 验收

## 自检

```bash
pnpm typecheck
pnpm build
```

## 检查点

| # | 操作 | 预期 |
|:--|------|------|
| 1 | SQL migration 中 6 个 Agent 数据完整 | 字段与 whitepaper 一致 |
| 2 | `grep "FALLBACK_AGENTS" apps/web/lib/mappers.ts` | 无结果 |
| 3 | `grep "agentFallback" apps/web/lib/mappers.ts` | 无结果 |
| 4 | `grep "deriveStance" apps/web/lib/mappers.ts` | 无结果 |
| 5 | `grep "KIND_FROM_ROLE" apps/web/lib/mappers.ts` | 无结果 |
| 6 | `grep -r "FALLBACK_AGENTS\|agentFallback" apps/web/app/api/` | 无结果 |
| 7 | `grep "MOCK_AGENTS" apps/web/lib/mock/agents.ts` | 存在（唯一 TyepScript 定义） |
| 8 | 访问 `/agents` 页面 | 6 个卡片正常渲染 |
