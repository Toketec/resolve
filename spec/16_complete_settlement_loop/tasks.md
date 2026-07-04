# Spec 16: 任务跟踪

## 任务项

| # | 任务 | 文件/命令 | 状态 | Done 检查条件 |
|:-:|------|----------|:----:|---------------|
| T00 | owner 地址 TRX 余额 ≥ 10 | Shasta Faucet 或转账 | ⬜ | `tw.trx.getBalance("TLVn5Sa9Y3f...")` ≥ 10 TRX |
| T01 | owner 地址 USDD 余额 ≥ (流动性+10) | MockUSDD mint 或转入 | ⬜ | `usddBalanceOf("TLVn5Sa9Y3f...")` ≥ 需要金额 |
| T02 | owner 地址 approve USDD 给合约 | `approve(SETTLEMENT_ADDRESS, 总额)` | ⬜ | `usddAllowance(owner, SETTLEMENT_ADDRESS)` ≥ 需要金额 |
| T03 | settlement.ts 新增 `createMarketAsOwner()` 服务端函数 | `apps/web/lib/contract/settlement.ts` | ⬜ | 函数签名正确；使用 `getServerTronWeb()`；返回 txHash 字符串 |
| T04 | 新建 `POST /api/markets/create-chain` 端点 | `apps/web/app/api/markets/create-chain/route.ts` | ⬜ | POST 返回 txHash；getMarket() 确认 exists=true；幂等保护 |
| T05 | 前端创建市场流程串联 create/page.tsx | `apps/web/app/create/page.tsx` | ⬜ | 创建市场时自动调 create-chain API；不依赖 TronLink 的 createMarket |
| T06 | 关闭气囊模式 | `.env.local` → `NEXT_PUBLIC_AIRBAG_ENABLED=false` | ⬜ | 设置为 false |
| T07 | 创建测试市场（端到端） | 浏览器操作 | ⬜ | 市场在 DB 中存在 + 链上 `getMarket().exists=true` |
| T08 | 2 个钱包分别买 YES（金额不等） | TronLink + 浏览器 | ⬜ | DB positions 表 2 条记录；合约 USDD 余额增加 |
| T09 | 触发结算 | 浏览器 Settle 按钮 | ⬜ | settleBatch() 返回 SUCCESS txHash；按钮显示 "Settled·YES" |
| T10 | Tronscan 验证交易 | shasta.tronscan.org | ⬜ | tx 状态 SUCCESS，method=settleBatch |
| T11 | 验证赢家到账 | Tronscan 查钱包 USDD | ⬜ | 各赢家按比例收到 USDD（A:20% B:80% 等） |
| T12 | 验证合约 USDD 余额减少 | `usddBalanceOf(SETTLEMENT_ADDRESS)` | ⬜ | 余额减少额 = 所有赢家到账金额之和 |
| T13 | 边界：重复结算防护 | 已结算市场再点 Settle | ⬜ | 合约返回 "Resolve: settled"，API 500 |
| T14 | 边界：合约余额不足 | 转出部分 USDD 后触发结算 | ⬜ | API 返回 500 + "Insufficient contract balance" |

## 进度

- 当前阶段: 📋 规划完成，等待实施

## 完成标准

当以下全部满足时 Spec 16 验收通过：

```
✅ 链上创建市场成功（getMarket().exists=true）
✅ 用户买入后 positions 表有数据
✅ 6 Agent 共识达成
✅ settleBatch 交易链上 SUCCESS
✅ 赢家钱包收到 USDD
✅ 合约余额减少 = 赢家收到金额之和
✅ 重复结算被保护
```
