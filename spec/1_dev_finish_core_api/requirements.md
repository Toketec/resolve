# 1_dev_finish_core_api — Core API Routes & Data Layer

## 解决的问题

当前前端直接从 `lib/mock/` 导入硬编码的 mock 数据（markets、agents、trades、positions）。
此规格创建一组 Next.js API Route Handlers，**直连真实数据源**（Supabase + HTX 公开 API），
将数据访问从前端解耦到服务端。

## 工作边界

- ✅ 创建 `/api/*` route handlers（markets、agents、price、resolve、buy、settle）
- ✅ **市场数据** — 从 Supabase `markets` 表读取（真实数据）
- ✅ **Agent 数据** — 从 Supabase `agents` 表读取（真实数据）
- ✅ **行情价格** — 直调 HTX 公开 API（真实数据，无需注册）
- ✅ **订单簿深度** — 直调 HTX 公开 API（新增加分项）
- ✅ **K 线数据** — 直调 HTX 公开 API（新增加分项）
- ✅ `POST /api/buy` — **数据层真实写入 Supabase `positions` 表**，链上签名部分 mock（等 spec 4）
- ✅ `POST /api/settle` — 返回 mock txHash（等 spec 4 合约部署）
- ✅ `GET .../resolve` — 返回 mock AIConsensus（等 spec 3 AI 推理）
- ✅ 新增迁移 `00002_add_agents.sql` — agents 表 + 6 个 Agent 种子数据
- ❌ 不创建过渡内存 store（之前方案已废弃）
- ❌ 不实现真实 TronLink 签名/合约调用（那是 spec 2 & 4）
- ❌ 不实现真实 Claude API 调用（那是 spec 3）

## 依赖项

- 前置: `packages/db` 包（Supabase client + data layer）✅ 已有
- 前置: Supabase 迁移 `00001_initial_schema.sql` 已执行 ✅
- 前置: Supabase 迁移 `00002_add_agents.sql` 需执行（新增 agents 表）
- 后置: spec 3 替换 resolve 为真实 Claude 推理
- 后置: spec 4 替换 buy/settle 为真实链上调用

## 验收标准

1. `packages/db/` 编译通过（`pnpm typecheck`）
2. Supabase 迁移 `00002_add_agents.sql` 可执行
3. `GET /api/markets` 返回 Supabase 中的真实市场数据（种子数据 btc-150k-eoy）
4. `GET /api/markets/[slug]` 返回单条市场
5. `GET /api/agents` 返回 6 个 Agent（3 active + 3 standby），含 role/tier/powered_by 字段
6. `GET /api/agents/[id]` 返回单个 Agent 详情
7. `GET /api/price/[symbol]` 返回 HTX 实时价格（非 mock）
8. `GET /api/price/[symbol]/depth` 返回 HTX 订单簿深度（非 mock）
9. `GET /api/price/[symbol]/kline` 返回 HTX K 线数据（非 mock）
10. `POST /api/buy` 写入 Supabase positions 表 + 返回 Position（txHash mock 填充）
11. `GET /api/markets/[slug]/resolve` 返回 mock AIConsensus
12. `POST /api/settle` 返回 mock txHash
13. `pnpm typecheck` 通过
14. `pnpm build` 通过
15. 所有路由可通过 curl 访问

## 边界与约束

- 市场/Agent 数据源：**Supabase PostgreSQL**（真实数据）
- 价格/深度/K线数据源：**HTX 公开 API**（真实数据，零注册）
- buy 的 `tx_hash` 字段在 spec 4 之前 mock 填充（数据已存 Supabase）
- resolve/settle 在 spec 3/4 之前返回 mock
- `packages/db/src/data.ts` 中的 CRUD 函数直接用于 API 路由（不经过中间 store）
- 所有 API 返回形状与 `@resolve/shared` 类型一致
- HTX API 代理：`/api/price/:symbol` → `api.htx.com/market/detail/merged`
