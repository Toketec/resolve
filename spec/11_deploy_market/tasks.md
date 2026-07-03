# Spec 11: 任务跟踪

## 任务项

| # | 任务 | 文件 | 状态 | Done 检查条件 |
|:-:|------|------|:----:|---------------|
| T01 | 新增 `insertMarket()` | `packages/db/src/data.ts` | ✅ | 函数签名接受 slug/question/description/expires_at/settlement_tx_hash，返回 MarketRow，`pnpm typecheck` 通过 |
| T02 | 新增 POST /api/markets | `apps/web/app/api/markets/route.ts` | ✅ | `curl -X POST ...` 返回 201 + 新市场 JSON；字段验证失败返回 400；slug 重复返回 409；无 DB 返回 503 |
| T03 | 新增 `createMarket()` 合约封装 | `apps/web/lib/contract/settlement.ts` | ✅ | 函数存在（不要求测试网能实际签名）；导入无类型错误 |
| T04 | 前端按钮串联（先链后库） | `apps/web/app/create/page.tsx` | ✅ | 点击按钮 → 先上链确认 → 再 POST API 同步 DB → 成功跳转；用户拒绝签名不产生 DB 记录 |
| T05 | `pnpm typecheck` + `pnpm build` | — | ✅ | 零错误零警告 |
| T06 | 手动验收 | 浏览器 | ⬜ | 按 check.md 完成所有验收步骤无异常 |
