# 1_dev_finish_core_api — Core API Routes & Data Layer

## 解决的问题

当前前端直接从 `lib/mock/` 导入硬编码的 mock 数据（markets、agents、trades、positions）。
这种模式使未来替换为真实后端时产生大量耦合改动。
此规格创建一组 Next.js API Route Handlers 和一个最小内存数据层，将数据访问从前端解耦到服务端。

## 工作边界

- ✅ 创建 `/api/*` route handlers（resolve、buy、settle、price、markets、agents、positions）
- ✅ 创建单例内存数据层（`lib/store.ts`），持有 market、agent、trade、position 数据
- ✅ 迁移 mock 数据到 store，route handlers 从 store 读取
- ❌ 不实现真实 TronLink 签名/合约调用（那是 spec 2 & 4）
- ❌ 不实现真实 Claude API 调用（那是 spec 3）
- ❌ 不使用数据库（PostgreSQL/Redis 等），只用内存对象

## 依赖项

- 前置: `packages/shared` 中的类型定义（已有）
- 前置: `apps/web/lib/mock/` 中的数据（已有，需要迁移）
- 后置: spec 5（integration）依赖此 spec 的 API 接口

## 验收标准

1. `GET /api/markets` 返回所有 8 个市场数据
2. `GET /api/markets/[slug]` 返回单个市场详情
3. `GET /api/markets/[slug]/resolve` 返回 `/packages/ai` 的 mock AIConsensus
4. `POST /api/buy` 接受请求体 + 返回 mock Position
5. `POST /api/settle` 接受请求体 + 返回 mock txHash
6. `GET /api/agents` 返回 6 个 Agent
7. `GET /api/agents/[id]` 返回单个 Agent
8. `GET /api/price/[symbol]` 返回 mock 行情数据
9. `pnpm typecheck` 通过
10. `pnpm build` 通过
11. 前端 `next dev` 启动后所有路由可访问（浏览器或 curl）

## 边界与约束

- Mock 数据内容不变，仍在内存中，但通过 API 路由暴露而非直接 import
- API 路由路径不与未来真实路径冲突（未来真实调用只需替换 handler 实现）
- 保持向后兼容 —— 所有 handler 返回与当前 mock 形状相同的数据
