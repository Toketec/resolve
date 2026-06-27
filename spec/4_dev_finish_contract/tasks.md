# 4_dev_finish_contract — Tasks

## 任务列表

| ID | 任务 | 状态 | 工时 | 备注 |
|:--:|------|:----:|:----:|------|
| 4.1 | 编写 `ResolveSettlement.sol` — 预注资结算合约 | ☐ | 3h | 核心 solidity |
| 4.2 | 配置 tronbox + 部署脚本 | ☐ | 2h | 需 Shasta 测试网 |
| 4.3 | 部署到 Shasta + 记录合约地址 | ☐ | 1h | 需测试币 |
| 4.4 | 编写 `lib/contract/settlement.ts` — buyShares/settle 封装 | ☐ | 2h | 用 tronWeb |
| 4.5 | 编写 `lib/constants.ts` — 合约地址/ABI 定义 | ☐ | 15min | |
| 4.6 | 气囊模式: settleSimulated() + ENV 控制 | ☐ | 30min | |
| 4.7 | x402 微支付简化实现 | ☐ | 1.5h | 加分项 |
| 4.8 | 验证: 合约编译 → 部署 → 手动测试 buy + settle | ☐ | 2h | |

## 验证清单

- [ ] `ResolveSettlement.sol` 编译通过
- [ ] 合约部署到 Shasta 测试网，有 tx hash 可查
- [ ] 合约地址写入 `lib/constants.ts`
- [ ] 合约预注资 USDD 成功（Shasta 浏览器可查余额）
- [ ] `buyShares()` 通过 TronLink 签名 → 交易成功
- [ ] `settle()` 调用 → 赢家地址收到 USDD
- [ ] 气囊模式: `settleSimulated()` 返回 `{ txHash, simulated: true }`
- [ ] 没有私钥/助记词出现在代码中
