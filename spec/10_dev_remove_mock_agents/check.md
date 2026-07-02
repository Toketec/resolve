# Spec 10: 验收方案

## 1. AI 自检

```bash
cd /home/wst1/王圣滔/C主要项目/resolve
pnpm typecheck
pnpm build
```

## 2. 人工检查

| # | 操作 | 预期结果 |
|:--|------|---------|
| 1 | `grep -r "MOCK_AGENTS\|FALLBACK_AGENTS\|agentRowToAgent\|KIND_FROM_ROLE" apps/web/` | 无结果 |
| 2 | `grep -r "mock/agents" apps/web/` | 无结果 |
| 3 | 访问 `/agents` 页面 | 6 个 Agent 卡片正常渲染，描述、名字、图标正确 |
| 4 | 对比 agents 页面描述与 `prompts.ts` 的 identity 描述 | 语义一致，措辞对齐 |
| 5 | 访问 `/api/agents` 接口 | 返回 JSON 数组，6 个 Agent，字段完整 |

## 3. 错误恢复

- 如 `@resolve/shared` 的 import 在 web 层失败，确认 `next.config.ts` 的 `transpilePackages` 包含 `@resolve/shared`

## 4. 加分项

- [ ] `apps/web/lib/types.ts` 中 `Agent`、`AgentKind` 类型统一引用 `@resolve/shared`，不再重复定义
