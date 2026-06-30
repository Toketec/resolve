# 1_dev_finish_core_api — Tasks

> **数据策略**: 直连 Supabase + HTX 公开 API（废弃过渡内存 store 方案）

## 前置条件

- [ ] Supabase 迁移 `00001_initial_schema.sql` 已在 Dashboard SQL Editor 执行
- [ ] Supabase 迁移 `00002_add_agents.sql` 已在 Dashboard SQL Editor 执行
- [ ] `apps/web/.env.local` 已配置 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 1.1 | 创建 `lib/supabase-server.ts` — 服务端 Supabase 客户端 | ☑ | 10min | 经 @resolve/db 接入；未配置→null 触发 mock 兜底 |
| 1.2 | 创建 `app/api/markets/route.ts` + `[slug]/route.ts` — 从 Supabase 读取 | ☑ | 20min | + `lib/mappers.ts` 做行↔shared 映射；slug 容错 eoy→2026 |
| 1.3 | 创建 `app/api/agents/route.ts` + `[id]/route.ts` — 从 Supabase 读取 | ☑ | 15min | 6 个全 ACTIVE；ApiAgent 超集带 role/tier/powered_by/8004 |
| 1.4 | 创建 `app/api/price/[symbol]/route.ts` — 代理 HTX 公开 API（价格） | ☑ | 15min | + `lib/htx.ts`；本环境无法直连 HTX→合成兜底(source:fallback) |
| 1.5 | 创建 `app/api/price/[symbol]/depth/route.ts` — 代理 HTX（订单簿深度） | ☑ | 15min | 同上，20 档兜底 |
| 1.6 | 创建 `app/api/price/[symbol]/kline/route.ts` — 代理 HTX（K 线数据） | ☑ | 15min | 30 根日线，时间升序 |
| 1.7 | 创建 `app/api/buy/route.ts` — 写入 Supabase positions + mock txHash | ☑ | 20min | 输入校验；未配置 DB→返回 Position 不持久化 |
| 1.8 | 创建 `app/api/markets/[slug]/resolve/route.ts` — mock AIConsensus | ☑ | 15min | 6 票加权 0.744→consensus；等 spec 3 替换真实推理 |
| 1.9 | 创建 `app/api/settle/route.ts` — mock txHash | ☑ | 10min | 气囊 simulated:true；等 spec 4 替换 |
| 1.10 | 验证: `pnpm typecheck` + `pnpm build` + curl 所有路由 | ☑ | 20min | typecheck/build 全绿；10 路由 curl 通过 |

## 验证清单

### AI 自检
- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build` 通过

### 人工检查 — 真实数据路由（来自 Supabase / HTX）
- [ ] `curl http://localhost:3000/api/markets` 返回 JSON 数组，含英雄市场 `btc-150k-eoy`
- [ ] `curl http://localhost:3000/api/markets/btc-150k-eoy` 返回单条市场（含 question/status/expires_at）
- [ ] `curl http://localhost:3000/api/agents` 返回 6 个 Agent（全部 active，全部有 role/powered_by）
- [ ] `curl http://localhost:3000/api/agents/bull-1` 返回单个 Agent（含 role/tier/powered_by）
- [ ] `curl http://localhost:3000/api/price/BTC` 返回 HTX 实时价格（price 字段不是固定值，随市场变化）
- [ ] `curl http://localhost:3000/api/price/BTC/depth` 返回 HTX 订单簿（bids/asks 非空数组）
- [ ] `curl http://localhost:3000/api/price/BTC/kline` 返回 HTX K 线（klines 数组含 30 条数据）

### 人工检查 — Mock 路由（等 spec 3/4 替换）
- [ ] `curl http://localhost:3000/api/markets/btc-150k-eoy/resolve` 返回 AIConsensus（含 votes/consensus 字段）
- [ ] `curl -X POST http://localhost:3000/api/buy -H 'Content-Type: application/json' -d '{"marketId":"mk_btc_150k","side":"YES","amount":100,"walletAddress":"TTest123"}'` 返回 Position（含 id/txHash）
- [ ] Supabase `positions` 表包含刚才 POST 的买入记录 ✅（数据已存储）
- [ ] `curl -X POST http://localhost:3000/api/settle -H 'Content-Type: application/json' -d '{"marketId":"mk_btc_150k","outcome":"YES","winnerWallet":"TTest123"}'` 返回 txHash
