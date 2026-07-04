# Contracts 使用说明

## 编译

```bash
# 全部合约
node scripts/compile.js

# 单个合约
node scripts/compile.js MockUSDD
node scripts/compile.js ResolveSettlement
node scripts/compile.js AgentRegistry

# 多个合约
node scripts/compile.js MockUSDD ResolveSettlement
```

编译产物输出到 `build/<合约名>.json`。

## 部署

需要 TRON_PRIVATE_KEY 环境变量，且钱包有 Shasta 测试 TRX（[水龙头](https://shasta.tronex.io/)）。

```bash
# 单独部署任一合约
TRON_PRIVATE_KEY=... node scripts/deploy.js MockUSDD
TRON_PRIVATE_KEY=... node scripts/deploy.js ResolveSettlement
TRON_PRIVATE_KEY=... node scripts/deploy.js AgentRegistry

# 一键全部署（MockUSDD → ResolveSettlement → AgentRegistry）
TRON_PRIVATE_KEY=... node scripts/deploy.js all
```

部署 ResolveSettlement 需要先有 USDD 地址：

```bash
TRON_PRIVATE_KEY=... USDD_ADDRESS=Txxx... node scripts/deploy.js ResolveSettlement
```

## pnpm 快捷方式

```bash
pnpm compile                        # 编译全部
pnpm compile:MockUSDD               # 只编译 MockUSDD
pnpm compile:AgentRegistry          # 只编译 AgentRegistry

pnpm deploy:MockUSDD                # 部署 MockUSDD
pnpm deploy:ResolveSettlement       # 部署 ResolveSettlement
pnpm deploy:AgentRegistry           # 部署 AgentRegistry + 注册 6 Agent
pnpm deploy:all                     # 一键全部署
```

## 合约清单

| 合约 | 文件 | 用途 |
|------|------|------|
| `MockUSDD` | `MockUSDD.sol` | 测试 USDD 代币 |
| `ResolveSettlement` | `ResolveSettlement.sol` | AMM 交易 + 结算 |
| `AgentRegistry` | `AgentRegistry.sol` | Agent 链上身份注册表 |
