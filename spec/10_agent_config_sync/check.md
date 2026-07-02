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
| 1 | 确认 `packages/shared/src/agents.ts` 存在，6 个 Agent 字段完整 | 每个 Agent 有 id/callsign/name/role/roleLabel/tier/stance/description/provider/modelHint/weight/sortOrder |
| 2 | `grep -n "MOCK_AGENTS" apps/web/lib/mock/agents.ts` | 文件第一行是 `import { AGENT_META } from "@resolve/shared"`，`MOCK_AGENTS` 从 `AGENT_META` map 生成 |
| 3 | `grep -n "FALLBACK_AGENTS" apps/web/lib/mappers.ts` | `FALLBACK_AGENTS` 从 `AGENT_META` map 生成，不再有硬编码的 `agentFallback()` 函数 |
| 4 | 对比 `agents.ts` 中的 description 与 `prompts.ts` 中对应 Agent 的 identity 描述 | **语义一致**（身份角色匹配），AI prompt 可以更详细但不应矛盾 |
| 5 | 访问 `/agents` 页面 | 6 个 Agent 卡片正常渲染，名字、描述、图标与原 mock 一致 |
| 6 | 访问 `/api/agents` 接口 | 返回 JSON 数组，6 个 Agent，字段完整无变化 |
| 7 | 比对 `/api/agents` 返回的统计字段（uptimePct/resolutions 等）与原 mock 数据 | **确定性值不变**，UI 渲染不漂移 |
| 8 | `grep -r "AGENT_META" apps/web/` | mock/agents.ts 和 mappers.ts 引用到规范配置 |

## 3. 错误恢复

| 错误 | 恢复措施 |
|------|---------|
| `pnpm typecheck` 报错：`@resolve/shared` 缺少导出 | 确认 `index.ts` 已添加 `export { AGENT_META }` |
| `mock/agents.ts` 的 `MOCK_AGENTS` 类型不兼容 | 确认 `AGENT_META` map 出的对象与旧 `Agent` 类型逐字段匹配，缺的字段（kind/region/stats）手动补 |
| `mappers.ts` 统计字段值漂移 | 从旧 `FALLBACK_AGENTS` 逐 agent 提取统计值，写死到 `agentMetaToApiAgent` 中 |
| DB seeding 脚本执行失败 | Supabase 未配置时无法 seeding，脚本需优雅降级报错而非 crash |
| 其他文件引用 `MOCK_AGENTS` 但类型不一致 | 改为引用 `AGENT_META`，或通过 `MOCK_AGENTS.map()` 转换 |

## 4. 加分项

- [ ] DB seeding 脚本同时可作为 `pnpm sync:agents`：检查 DB 中的 agent 记录与规范配置是否一致，不一致则报告 diff
- [ ] `prompts.ts` 的 `AGENT_PROFILES` 从 `AGENT_META` 获取 id/callsign/role/temperament 元数据（仅 metadata，system prompt 仍保持独立）
