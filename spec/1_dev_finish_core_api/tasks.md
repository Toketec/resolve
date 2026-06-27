# 1_dev_finish_core_api — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 1.1 | 创建 `lib/store.ts`，导入所有 mock 数据构建单例 store | ☐ | 45min | 从 mock/index.ts、markets.ts、agents.ts、positions.ts 导入 |
| 1.2 | 创建 `app/api/markets/route.ts` — GET 返回市场列表 | ☐ | 15min | 支持 ?category= 过滤参数 |
| 1.3 | 创建 `app/api/markets/[slug]/route.ts` — GET 返回市场详情 | ☐ | 15min |  |
| 1.4 | 创建 `app/api/markets/[slug]/resolve/route.ts` — GET 返回 consensus | ☐ | 20min | 调用 packages/ai 的 resolveMarket |
| 1.5 | 创建 `app/api/agents/route.ts` + `app/api/agents/[id]/route.ts` | ☐ | 15min |  |
| 1.6 | 创建 `app/api/buy/route.ts` — POST 返回 mock Position | ☐ | 15min |  |
| 1.7 | 创建 `app/api/settle/route.ts` — POST 返回 mock txHash | ☐ | 15min |  |
| 1.8 | 创建 `app/api/price/[symbol]/route.ts` — GET 返回 mock 行情 | ☐ | 15min |  |
| 1.9 | 验证: `pnpm typecheck` + `pnpm build` + curl 所有路由 | ☐ | 15min |  |

## 验证清单

- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过
- [ ] `curl http://localhost:3000/api/markets | head -c 200` 返回 JSON
- [ ] `curl http://localhost:3000/api/markets/btc-150k-2026` 返回单条市场
- [ ] `curl http://localhost:3000/api/markets/btc-150k-2026/resolve` 返回 AIConsensus
- [ ] `curl http://localhost:3000/api/agents` 返回 6 个 Agent
- [ ] `curl -X POST http://localhost:3000/api/buy -H 'Content-Type: application/json' -d '{"marketId":"mk_btc_150k","side":"YES","amountUSDT":100}'` 返回 Position
- [ ] `curl http://localhost:3000/api/price/BTC` 返回行情数据
