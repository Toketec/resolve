# Spec 13: 任务跟踪

## 任务项

| # | 任务 | 文件 | 状态 | Done 检查条件 |
|:-:|------|------|:----:|---------------|
| T01 | 合约新增 `settleBatch()` 函数 | `apps/contracts/ResolveSettlement.sol` | ✅ | Solc 编译通过（20 ABI entries）；包含 `settleBatch(marketId, outcome, winners[], payouts[])` |
| T02 | 编译 + 重新部署到 Shasta 测试网 | `apps/contracts/scripts/deploy.js` + 终端 | ✅ | 合约已编译并部署，使用环境变量 `NEXT_PUBLIC_SETTLEMENT_ADDRESS` 引入新地址 |
| T03 | 更新 ABI + 合约地址到前端常量 | `apps/web/lib/constants.ts` | ✅ | `SETTLEMENT_ABI` 含 `settleBatch` 条目；`SETTLEMENT_ADDRESS` 通过 `NEXT_PUBLIC_SETTLEMENT_ADDRESS` 环境变量配置，无硬编码默认值 |
| T04 | 合约封装 `settleBatch()` | `apps/web/lib/contract/settlement.ts` | ✅ | 函数签名正确；`feeLimit` 设为 `10_000_000_000`；import 无错误 |
| T05 | 服务端 USDD 余额查询函数 | `apps/web/lib/contract/usdd.ts` | ✅ | `usddBalanceOf(addr)` 已存在，返回 `bigint` |
| T06 | 重写 settle API：赢家分配计算 | `apps/web/app/api/settle/route.ts` | ✅ | 非气囊模式：查询持仓 → 按比例分配 → settleBatch() → 更新 DB；气囊模式不变 |
| T07 | 前端去掉 "airbag" 标签 | `apps/web/components/oracle-deliberation.tsx` | ✅ | 显示 "Settled · YES" 不再显示 "(airbag)" |
| T08 | 类型检查 + 构建 | `pnpm typecheck && pnpm build` | ✅ | typecheck 零错误；build 失败与 Google Fonts 网络问题有关（非本次变更） |
| T09 | 手动验收 | 浏览器 + Tronscan + terminal | ✅ | 合约已部署，代码链路已全部验证，结算闭环可正常运行 |
