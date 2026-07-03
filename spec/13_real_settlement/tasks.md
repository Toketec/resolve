# Spec 13: 任务跟踪

## 任务项

| # | 任务 | 文件 | 状态 | Done 检查条件 |
|:-:|------|------|:----:|---------------|
| T01 | 合约新增 `settleBatch()` 函数 | `apps/contracts/ResolveSettlement.sol` | ⬜ | Solc 编译通过；包含 `settleBatch(marketId, outcome, winners[], payouts[])` |
| T02 | 编译 + 重新部署到 Shasta 测试网 | `apps/contracts/scripts/deploy.js` + 终端 | ⬜ | 新合约地址在 Tronscan 上可见；编译产物写入 `build/` |
| T03 | 更新 ABI + 合约地址到前端常量 | `apps/web/lib/constants.ts` | ⬜ | `SETTLEMENT_ADDRESS` 指向新合约；`SETTLEMENT_ABI` 含 `settleBatch` 条目 |
| T04 | 合约封装 `settleBatch()` | `apps/web/lib/contract/settlement.ts` | ⬜ | 函数签名正确；`feeLimit` 设为 `10_000_000_000`；import 无错误 |
| T05 | 服务端 USDD 余额查询函数（若不存在） | `apps/web/lib/contract/usdd.ts` | ⬜ | `balanceOf(addr)` 返回 `bigint`；可在服务端调用 |
| T06 | 重写 settle API：赢家分配计算 | `apps/web/app/api/settle/route.ts` | ⬜ | 非气囊模式下返回 `{ txHash, paidOut: true, winners: N, totalPayout }`；气囊模式不变 |
| T07 | 前端去掉 "airbag" 标签 | `apps/web/components/oracle-deliberation.tsx` | ⬜ | 显示 "Settled · YES" 而非 "Settled (airbag) · YES" |
| T08 | 类型检查 + 构建 | `pnpm typecheck && pnpm build` | ⬜ | 零错误零警告 |
| T09 | 手动验收 | 浏览器 + Tronscan + terminal | ⬜ | 按 check.md 完成所有验收步骤 |
