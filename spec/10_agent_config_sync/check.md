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
| 1 | 确认 `packages/shared/src/agents.ts` 存在，6 个 Agent 字段完整 | 每个 Agent 含 id/callsign/name/role/roleLabel/tier/stance/description/provider/modelHint/weight/sortOrder/uptimePct/resolutions/accuracyPct/avgConfidence/region |
| 2 | 确认 `agents.ts` 的 description、modelHint、权重与 canonical-design.md 完全一致 | 逐字段校对无差异 |
| 3 | `grep -n "MOCK_AGENTS" apps/web/lib/mock/agents.ts` | `MOCK_AGENTS` 从 `AGENT_META.map()` 派生，不再是硬编码 |
| 4 | `grep -n "FALLBACK_AGENTS" apps/web/lib/mappers.ts` | `FALLBACK_AGENTS` 从 `AGENT_META.map()` 派生，`agentFallback()` 已删除 |
| 5 | `grep -n "agentFallback\|hashString.*seed\|seed % 60" apps/web/lib/mappers.ts` | 无结果（哈希派生统计的逻辑已替换） |
| 6 | `grep -n "KIND_FROM_ROLE" apps/web/lib/mappers.ts` | 引用自 `@resolve/shared`，不再有内联定义 |
| 7 | 访问 `/agents` 页面 | 6 个 Agent 卡片正常渲染，描述、名字、图标正确 |
| 8 | 访问 `/api/agents` 接口 | 返回 JSON 数组，6 个 Agent，modelHint 为 "Claude Sonnet 4" / "B.AI（主推）" |
| 9 | 对比 API 返回的统计字段与原 mock 值 | 完全一致（uptimePct/resolutions 等与 T01 规范表相同） |

## 3. 错误恢复

| 错误 | 恢复措施 |
|------|---------|
| `pnpm typecheck` 报类型不兼容 | 确认 `AGENT_META.map()` 产生的对象与 `Agent` / `ApiAgent` 类型逐字段匹配 |
| `@resolve/shared` 编译失败 | 确认 `agents.ts` 中无循环依赖，所有 import 正确 |
| `mock/agents.ts` 渲染后统计值变化 | 对比 `AGENT_META` 中统计字段与原 mock 精确值，修正 `agents.ts` |
| mappers 中其他函数依赖旧 `hashString()` | `derive8004Id()`、`marketRowToMarket()` 等仍可用 `hashString()`，保留该函数 |

## 4. 加分项

- [ ] DB seeding 脚本可独立运行，Supabase 未配置时优雅退出
- [ ] `KIND_FROM_ROLE` 在 `@resolve/shared` 中与 `AGENT_META` 一同导出，其他文件不再内联定义
