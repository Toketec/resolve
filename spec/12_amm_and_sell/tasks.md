# Spec 12: 任务跟踪

## 任务项

| # | 任务 | 文件 | 状态 | Done 检查条件 |
|:-:|------|------|:----:|---------------|
| T01 | 合约重写（AMM + buyShares + sellShares + fee + createMarket） | `apps/contracts/ResolveSettlement.sol` | ✅ | 编译通过；buyShares/sellShares 皆可调用；fee 转入 feePool |
| T02 | 合约部署脚本更新 | `apps/contracts/scripts/deploy.js` | ✅ | 成功部署到 Shasta 测试网 |
| T03 | DB 迁移：trades 表 + positions 表余额化 | `packages/db/migrations/00003_amm_schema.sql` | ✅ | SQL 在执行后 trades/positions 满足新 schema |
| T04 | DB 数据层：insertTrade / updatePosition / listTradesByMarket | `packages/db/src/data.ts` | ✅ | 函数类型检查通过 |
| T05 | 合约封装：sellShares / createMarket / claimFees / getPoolState | `apps/web/lib/contract/settlement.ts` | ✅ | 函数签名正常，导入无错误 |
| T06 | API: POST /api/sell（新建） | `apps/web/app/api/sell/route.ts` | ✅ | `curl -X POST ...` 返回成功 + positions 余额更新 |
| T07 | API: GET /api/trades?market=xxx 扩展 | `apps/web/app/api/trades/route.ts` | ✅ | 按 marketId 过滤返回正确 trades |
| T08 | TradePanel: Sell tab + AMM 价格显示 | `apps/web/components/trade-panel.tsx` | ✅ | 可切换 Buy/Sell；Sell 显示持仓+卖出估算 |
| T09 | Recent Trades 改为 API 调用 | `apps/web/app/markets/[slug]/page.tsx` | ✅ | 调 `/api/markets/[slug]/trades` 从 trades 表读取 |
| T10 | 创建市场加 10 USDD 创建费 | `apps/web/app/create/page.tsx` | ✅ | 部署时 approve 总需（流动性+10 USDD）；Review 预览显示创建费 |
| T11 | `pnpm typecheck` + `pnpm build` | — | ✅ | 零错误零警告 |
| T12 | 手动验收 | 浏览器 + Tronscan | ✅ | 按 check.md 完成 |
