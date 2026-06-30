# 4_dev_finish_contract — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 4.1 | 编写 `ResolveSettlement.sol` — 预注资结算合约 | ☑ | 3h | createMarket/buyShares/settle/settleSimulated/withdrawLiquidity；仅 owner，无任意提款 |
| 4.2 | 配置 tronbox + 部署脚本 | ☑ | 2h | `tronbox.js` + `scripts/deploy.js`(tronweb) + `scripts/compile.js`(solc) |
| 4.3 | 部署到 Shasta + 记录合约地址 | ◑ | 1h | 部署脚本就绪并连通 Shasta；钱包 0 TRX 未激活 → 需先去水龙头充值再部署 |
| 4.4 | 编写 `lib/contract/settlement.ts` — buyShares/settle 封装 | ☑ | 2h | tronWeb(window) 封装；浏览器安全编码；气囊兜底 |
| 4.5 | 编写 `lib/constants.ts` — 合约地址/ABI 定义 | ☑ | 15min | ABI 内联；地址走 ENV；含 USDD/Tronscan/气囊开关 |
| 4.6 | 气囊模式: settleSimulated() + ENV 控制 | ☑ | 30min | `NEXT_PUBLIC_AIRBAG_ENABLED`，默认 on，返回 simulated:true |
| 4.7 | x402 微支付简化实现 | ☑ | 1.5h | `lib/contract/x402.ts`；+ 6 Agent 8004 身份 ID(`derive8004Id`) |
| 4.8 | 验证: 合约编译 → 部署 → 手动测试 buy + settle | ◑ | 2h | 两合约 solc 编译通过；部署脚本本地验证(0 余额守卫)；真实 buy/settle 需充值后部署 |

> 附加：`MockUSDD.sol`（Shasta 自包含测试用 TRC-20）。真实部署只需给 `TR9ZD…Gkp` 充值测试 TRX 后跑 `pnpm --filter @resolve/contracts deploy:shasta`。

## 验证清单

- [ ] `ResolveSettlement.sol` 编译通过
- [ ] 合约部署到 Shasta 测试网，有 tx hash 可查
- [ ] 合约地址写入 `lib/constants.ts`
- [ ] 合约预注资 USDD 成功（Shasta 浏览器可查余额）
- [ ] `buyShares()` 通过 TronLink 签名 → 交易成功
- [ ] `settle()` 调用 → 赢家地址收到 USDD
- [ ] 气囊模式: `settleSimulated()` 返回 `{ txHash, simulated: true }`
- [ ] 没有私钥/助记词出现在代码中
