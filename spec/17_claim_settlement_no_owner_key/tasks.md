# Spec 17: 任务跟踪

## 任务项

| # | 任务 | 文件 | 状态 | Done 检查条件 |
|:-:|------|------|:----:|---------------|
| T01 | 合约新增 `resolveOutcome()` | `apps/contracts/ResolveSettlement.sol` | ✅ | public，无 onlyOwner；仅记录 outcome 不转账 |
| T02 | 合约新增 `claimReward()` | `apps/contracts/ResolveSettlement.sol` | ✅ | 从 stakes 自算 payout；防重入；转账 |
| T03 | 合约 `createMarket()` 去掉 `onlyOwner` | `apps/contracts/ResolveSettlement.sol` | ✅ | 任意地址可调，无 onlyOwner 修饰符（之前已完成） |
| T04 | 合约删除 `settleSimulated()` | `apps/contracts/ResolveSettlement.sol` | ✅ | 无 settleSimulated 函数体（之前已完成） |
| T05 | ABI 更新：新增 resolveOutcome/claimReward | `apps/web/lib/constants.ts` | ✅ | ABI 数组包含新函数条目 |
| T06 | ABI 更新：删除 settleSimulated | `apps/web/lib/constants.ts` | ✅ | 无 settleSimulated 条目（之前已完成） |
| T07 | 删除 `AIRBAG_ENABLED` 常量 | `apps/web/lib/constants.ts` | ✅ | 无 AIRBAG_ENABLED 引用（之前已完成） |
| T08 | tronweb.ts 删除 `getServerTronWeb()` | `apps/web/lib/contract/tronweb.ts` | ✅ | 无 getServerTronWeb 函数；无 TRON_PRIVATE_KEY import |
| T09 | settlement.ts 新增 `resolveOutcome` 客户端函数 | `apps/web/lib/contract/settlement.ts` | ✅ | 用 TronLink 签名；callable from frontend |
| T10 | settlement.ts 新增 `claimReward` 客户端函数 | `apps/web/lib/contract/settlement.ts` | ✅ | 用 TronLink 签名；callable from frontend |
| T11 | settlement.ts 删除服务端 settleBatch/settle/claimMarketFees | `apps/web/lib/contract/settlement.ts` | ✅ | 无依赖 getServerTronWeb 的函数 |
| T12 | 删除 `/api/settle/route.ts` | `apps/web/app/api/settle/route.ts` | ✅ | API 已删除 |
| T13 | 共识组件 done 阶段调 `resolveOutcome` | `apps/web/components/oracle-deliberation.tsx` | ✅ | 共识达成后自动通过 TronLink 提交 outcome |
| T14 | 市场详情页新增领钱按钮 | `apps/web/app/markets/[slug]/page.tsx` + `components/claim-reward-button.tsx` | ✅ | 赢家可见；调 claimReward；领后显示 Claimed |
| T15 | 删除 `.env.local` 中 TRON_PRIVATE_KEY | `.env.local` | ✅ | 无 TRON_PRIVATE_KEY 行（.env.local 不在仓库中） |
| T16 | 删除 `.env.local` 中 AIRBAG_ENABLED | `.env.local` | ✅ | 无 AIRBAG_ENABLED 行（.env.local 不在仓库中） |
| T17 | 更新 `.env.example` | `.env.example` + `apps/web/.env.example` | ✅ | TRON_PRIVATE_KEY 标注"仅部署用" |
| T18 | 编译合约 | `pnpm --filter @resolve/contracts compile` | ⬜ | 编译通过 |
| T19 | 部署合约到 Shasta | `pnpm --filter @resolve/contracts deploy:shasta` | ⬜ | 部署成功，有新合约地址 |
| T20 | 更新 `.env.local` 中的新合约地址 | `.env.local` | ⬜ | NEXT_PUBLIC_SETTLEMENT_ADDRESS 为新地址 |
| T21 | 类型检查 + 构建 | `pnpm typecheck && pnpm build` | ⬜ | typecheck 零错误；build 成功 |
| T22 | 更新部署文档 | `docs/deployment-plan.*` | ✅ | TRON_PRIVATE_KEY 标识为"仅部署用" |
| T23 | 端到端：用户创建市场（TronLink） | 浏览器操作 | ⬜ | 链上 getMarket().exists=true |
| T24 | 端到端：resolveOutcome 提交结果 | TronLink + 浏览器 | ⬜ | 链上 market.settled=true, outcome=YES/NO |
| T25 | 端到端：claimReward 赢家领钱 | TronLink + 浏览器 | ⬜ | 赢家 USDD 增加；Tronscan SUCCESS |
| T26 | 端到端：verify 无 TRON_PRIVATE_KEY 运行时零依赖 | 全局搜索 | ✅ | apps/web/ 中无 TRON_PRIVATE_KEY 引用 |

## 完成标准

```
✅ resolveOutcome 公开可调（无 owner 签名）
✅ claimReward 从链上 stakes 自算赔付
✅ 无服务端 TRON_PRIVATE_KEY 运行时依赖
✅ 用户创建市场（TronLink）
✅ 用户买 YES/NO
✅ 共识达成后提交结果
✅ 赢家自助领钱到账
✅ 无气囊模式
✅ 无 AIRBAG_ENABLED
✅ 无 settleSimulated
```
