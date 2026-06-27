# 1_dev_finish_core_api — Core API Routes & Data Layer

## 解决的问题

当前前端直接从 `lib/mock/` 导入硬编码的 mock 数据（markets、agents、trades、positions）。
这种模式使未来替换为真实后端时产生大量耦合改动。
此规格创建一组 Next.js API Route Handlers 和一个基于 Supabase PostgreSQL 的数据层（`packages/db/`），将数据访问从前端解耦到服务端。

## 工作边界

- ✅ 创建 `/api/*` route handlers（resolve、buy、settle、price、markets、agents、positions）
- ✅ 创建 `packages/db/` 数据层（Supabase client + types + schema + data access functions）
- ✅ 创建 Supabase 迁移 SQL（markets / positions / agent_consensus / agent_votes 四表）
- ❌ 不实现真实 TronLink 签名/合约调用（那是 spec 2 & 4）
- ❌ 不实现真实 Claude API 调用（那是 spec 3）
- ❌ 暂不连接真实 Supabase 数据库（开发阶段用 packages/db 定义即可）

## 依赖项

- 前置: `packages/shared` 中的类型定义（已有）
- 前置: `packages/db` 包（Supabase client + data layer）
- 后置: spec 5（integration）依赖此 spec 的 API 接口

## 验收标准

1. `packages/db/` 编译通过（`pnpm typecheck`）
2. Supabase 迁移 SQL 可执行到 Supabase 项目
3. `GET /api/markets` 返回市场数据
4. `GET /api/markets/[slug]/resolve` 返回 `/packages/ai` 的 mock AIConsensus
5. `POST /api/buy` 接受请求体 + 返回 Position
6. `POST /api/settle` 接受请求体 + 返回 txHash
7. `GET /api/agents` 返回 6 个 Agent
8. `GET /api/price/[symbol]` 返回行情数据
9. `pnpm typecheck` 通过
10. `pnpm build` 通过
11. 前端 `next dev` 启动后所有路由可访问（浏览器或 curl）

## 边界与约束

- API 路由数据源从 Supabase PostgreSQL 读取（开发阶段先 mock 实现）
- Mock 策略：后端返回真实数据，前端 DataFiller 补充 null/空值
- API 路由路径不与未来真实路径冲突（未来真实调用只需替换 handler 实现）
- 保持向后兼容 —— 所有 handler 返回与当前 mock 形状相同的数据
- **架构背景**: 详见 [架构设计](../architecture-overview.md)。部署于 Vercel Serverless，使用 Next.js API Routes + Supabase 后端
- **HTX生态**: `GET /api/price/:symbol` 需预留真实 HTX API 调用的代理路径（未来可直接 -> `api.htx.com/market/detail/merged`）
- **域名**: 使用 `resolve-prediction.vercel.app`（Vercel 默认子域名），零ICP备案
