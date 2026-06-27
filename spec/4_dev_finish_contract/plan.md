# 4_dev_finish_contract — Implementation Plan

## Step 1: 结算合约编写

**文件**: `apps/contracts/ResolveSettlement.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ResolveSettlement {
    address public owner;           // 预注资者
    mapping(bytes32 => Market) public markets;  // marketId => Market
    mapping(bytes32 => mapping(address => bool)) public buyers;

    struct Market {
        bool exists;
        bool settled;
        bytes8 outcome;  // "YES" | "NO" 编码为 bytes8
        uint256 totalLiquidity;
    }

    // 管理员注资 + 创建市场
    function createMarket(bytes32 marketId, uint256 liquidity) external;
    // 用户买入（附 USDD 转账）
    function buyShares(bytes32 marketId) external payable;
    // 管理员结算（由 AI 共识触发）
    function settle(bytes32 marketId, bytes8 outcome, address payable winner) external onlyOwner;
    // 安全气囊: 标记为已结算但不真转账
    function settleSimulated(bytes32 marketId, bytes8 outcome) external onlyOwner;
}
```

## Step 2: 部署到 Shasta 测试网

使用 tronbox 或 hardhat-tron 部署:

```bash
# 编译
pnpm --filter @resolve/contracts compile

# 部署到 Shasta
pnpm --filter @resolve/contracts deploy --network shasta
```

记录合约地址 → 用在后续集成中。

## Step 3: 前端合约调用封装

**文件**: `apps/web/lib/contract/settlement.ts`

```
export async function buyShares(marketId, side, amount, walletAddress): Promise<{ txHash, shares }>
export async function settle(marketId, outcome, winnerWallet): Promise<{ txHash, simulated }>
export async function settleSimulated(marketId, outcome): Promise<{ txHash, simulated: true }>
```

使用 tronWeb 实例（通过 TronLink 注入的 window.tron）与合约交互。

## Step 4: 气囊按钮

- 当 A-06 气囊模式开启时，`settle()` 调用 `settleSimulated()`
- 气囊模式下 UI 显示同样的成功效果，但链上不实际转账
- 气囊模式由 .env 变量控制: `NEXT_PUBLIC_AIRBAG_ENABLED=true`

## Step 5: x402 支付（简化版）

在 `resolve()` 流程中嵌入一次 x402 微支付调用:
- 使用 `@bankofai/x402` 包（如果可用）
- 或模拟一个 HTTP POST 到 B.AI API 端点演示概念
- 此功能是加分项，不阻塞英雄镜头

## Step 6: 验证

```
# 部署验证
tronbox migrate --network shasta --reset

# 调用测试
node scripts/test-contract.js
```

## 注意事项

- Shasta 测试币从 https://shasta.tronex.io/ 或官方水龙头获取
- USDD 在 Shasta 测试网是 TRC-20 代币，合约地址固定
- 私钥放 `.env`，绝不在代码中硬编码
- 合约只有 owner 可以 call settle() — owner 是我们的部署地址
- 预注资合约: 创建市场时 owner 存入 USDD，赢家取走

## 关键文件

| 文件 | 操作 |
|------|------|
| `apps/contracts/ResolveSettlement.sol` | [新建] 结算合约 |
| `apps/contracts/scripts/deploy.ts` | [新建] 部署脚本 |
| `apps/contracts/tronbox.js` | [新建] tronbox 配置 |
| `apps/web/lib/contract/settlement.ts` | [新建] 合约调用封装 |
| `apps/web/lib/constants.ts` | [新建] 合约地址等常量 |
