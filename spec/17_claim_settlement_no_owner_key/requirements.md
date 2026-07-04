# Spec 17: Claim 式结算 — 消除 owner 私钥依赖

## 问题

当前结算架构要求服务端持有合约 `owner` 的 `TRON_PRIVATE_KEY` 来签名 `settleBatch()` 交易：

```
Agent 共识 → 后端调 settleBatch(winners[], payouts[]) → 需要 owner 私钥签名 → 转账
```

但 `owner` 私钥对整个合约有完全控制权（`claimMarketFees`、部署者权限），让它在运行时的 Next.js 服务端长期暴露，有安全隐患。且部署者需要手动设环境变量，体验差。

**核心矛盾**：合约第 50 行已经有 `stakes` 映射记录了每个用户的持仓，但 `settleBatch()` 却把赢家列表和赔付金额做成入参——等于"合约明明知道谁投了多少，却让别人算好了再告诉它"。这迫使 `settleBatch` 必须有 `onlyOwner` 防止滥用。

## 新方案：Claim 式结算

改成分两步，都不需要 owner：

```
Step 1: resolveOutcome(marketId, outcome)      ← 任何人可调，只记结果
Step 2: claimReward(marketId)                   ← 赢家自己调，合约自算赔付
```

**`resolveOutcome`**：只向合约写入市场的结果（YES/NO），不涉及转账。谁调用不重要——结果本身是公开的（AI 共识结果公开后，任何人都可以提交）。

**`claimReward`**：赢家自己调，合约根据链上记录自动计算赔付：

```
用户 A 的 YES 份额 = stakes[市场ID][A][YES] = 1000
总 YES 池          = yesSupply              = 5000
资金池             = liquidity              = 10 USDD (10_000_000 sun)
↓
A 应得 = 1000 / 5000 × 10 = 2 USDD
       = 10_000_000 * 1000 / 5000 = 2_000_000 sun
```

合约自算、自分钱，不需要任何人传参数，也就不需要 owner。

## 受益

| 方面 | 旧方案 | 新方案 |
|:----|:------|:------|
| **私钥** | 运行时服务端需 `TRON_PRIVATE_KEY` | 完全消除 |
| **结算方式** | 后端集中调 settleBatch | 赢家自助领钱（claim） |
| **owner 暴露** | owner 私钥在 Vercel 环境变量中长期存 | owner 仅部署时用，用完即弃 |
| **信任模型** | 平台需要被信任"在 settleBatch 时传正确参数" | 合约自验，无需信任任何人 |
| **安全性** | owner 私钥泄露 → 全合约失控 | 无单点私钥风险 |
| **前端依赖** | 服务端 API 才能触发转账 | 前端 TronLink 即可调 resolveOutcome，无服务器依赖 |

## 改动范围

| 层 | 文件 | 改动 |
|:--|:-----|:-----|
| 合约 | `apps/contracts/ResolveSettlement.sol` | 新增 `resolveOutcome` + `claimReward`；`settleBatch`/`settle` 改 public 或保留兼容 |
| 合约封装 | `apps/web/lib/contract/settlement.ts` | 删除 `settle`/`settleBatch`/`claimMarketFees` 的服务端签名版本；新增 `resolveOutcome` 和 `claimReward` 客户端函数 |
| TronWeb | `apps/web/lib/contract/tronweb.ts` | 删除 `getServerTronWeb()` 整个函数（不再需要服务端签名） |
| API 路由 | `apps/web/app/api/settle/route.ts` | 重写——不再调 settleBatch，改为触发 resolveOutcome（或无服务端组件） |
| 前端 | `apps/web/app/market/[slug]/page.tsx` | 新增领钱按钮（赢家手动 claim） |
| 前端 | 共识组件 | resolveOutcome 由共识组件或 API 触发 |
| 部署 | `docs/deployment-plan.*` | 更新：TRON_PRIVATE_KEY 仅用于部署，不再在 Vercel 环境变量中设置 |
| 常量 | `apps/web/lib/constants.ts` | 删除 `SETTLEMENT_ABI` 中废弃的函数 |

## 不改动

- `createMarket` — 已是 public（Spec 16 已去 onlyOwner），但当前合约还有 onlyOwner，部署新版本时一并去掉
- `buyShares`/`sellShares` — 客户端 TronLink 签名，正常工作
- `claimMarketFees` — owner 需要保留（平台抽成），这个可以 owner 自己手动调，不需要在运行时代码中

## 边界条件

- 已结算市场不能再次 resolve（`m.settled` 检查）
- 已 claim 过的用户不能重复领（stakes 清零或 tracking mapping）
- 无赢家持仓时 claim 返回空（无转账，无错误）
- `resolveOutcome` 可以被重复调（幂等：已 settled 的拒绝，相同的 outcome 不做事）
- claim 时合约 USDD 不足 → 转账失败回滚，不部分赔付
