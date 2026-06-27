# 4_dev_finish_contract — Settlement Contract & Chain Logic

## 解决的问题

英雄镜头的核心高潮是"AI 共识达成 → 链上自动赔付"。当前没有任何智能合约或链上逻辑。
此规格实现 TRON Shasta 测试网上的预注资结算合约、单边买入签名、以及链上赔付流程。

## 工作边界

- ✅ 编写 Solidity 结算合约（预注资模式，固定赔付）
- ✅ 部署到 TRON Shasta 测试网
- ✅ 合约预注资（存入 USDD 测试币）
- ✅ 单边买入签名/转账（TronLink 钱包 → 合约）
- ✅ settle() 函数 — 共识达成后向赢家地址转账
- ✅ 气囊机制 — 当测试网不稳定时可一键返回模拟 txHash
- ✅ 🆕 **B.AI 8004 Agent身份注册**（P0 ↑从P1）— 在B.AI注册Agent链上身份，展示HTX生态使用
- ✅ 🆕 **B.AI x402微支付集成**（P0 ↑从P2）— resolve()过程中触发x402支付，展示Agent经济自主性
- ❌ 不实现完整 AMM/订单簿/做市商
- ❌ 不处理买入卖出双向（只做买入）
- ❌ 不实现争议投票/LP 收益
- ❌ 不部署到 TRON 主网（仅在 Shasta 测试网）

## 依赖项

- 前置: spec 2（TronLink 连接）——需要钱包地址签名
- 后置: spec 5（integration）需要合约调用的前端集成
- 外部依赖: TRON Shasta 测试网 + 测试 USDD

## 验收标准

1. 结算合约部署到 Shasta，已验证可接收测试币
2. `buyShares()` 通过 TronLink 签名 → 调用合约 → 记录买入
3. `settle()` 调用 → 合约向赢家转账
4. 气囊模式: 调用 settle 返回模拟 txHash（合约不真调用）
5. 🆕 Agent 8004 身份已在 B.AI 注册并可查询
6. 🆕 resolve() 过程中触发 x402 支付并显示交易哈希
7. 合约代码开源在 `apps/contracts/`
8. 部署脚本可用（Hardhat 或 tronbox）
9. 无安全漏洞（不允许任意提款，仅预注资地址向赢家转账）
