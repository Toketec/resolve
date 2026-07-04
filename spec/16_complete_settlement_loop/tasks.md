# Spec 16: 任务跟踪

## 任务项

| # | 任务 | 文件 | 状态 | Done 检查条件 |
|:-:|------|------|:----:|---------------|
| T01 | 合约 `createMarket()` 去掉 `onlyOwner` | `apps/contracts/ResolveSettlement.sol` | ⬜ | 任意地址可调用，无 require(msg.sender == owner) |
| T02 | 合约删除 `settleSimulated()` 函数 | `apps/contracts/ResolveSettlement.sol` | ⬜ | 函数体和声明全部移除 |
| T03 | ABI 删除 `settleSimulated` 条目 | `apps/web/lib/constants.ts` | ⬜ | SETTLEMENT_ABI 中无 settleSimulated |
| T04 | constants.ts 删除 `AIRBAG_ENABLED` | `apps/web/lib/constants.ts` | ⬜ | AIRBAG_ENABLED 常量和引用全部删除 |
| T05 | settlement.ts 删除 `settleSimulated()` + `isAirbag()` | `apps/web/lib/contract/settlement.ts` | ⬜ | 无 settleSimulated 函数；无 isAirbag 函数 |
| T06 | `/api/settle/route.ts` 删除气囊分支，仅保留真实结算 | `apps/web/app/api/settle/route.ts` | ⬜ | 无 isAirbag() 判断；仅有 settleBatch 路径 |
| T07 | 共识后自动触发结算 | `apps/web/components/oracle-deliberation.tsx` | ⬜ | done 阶段自动调 handleSettle()；无手动按钮 |
| T08 | DEV 模式随机投票 | `packages/ai/src/llm.ts` | ⬜ | mockAnswer() 使用 Math.random() 而非固定值 |
| T09 | 编译合约 | `pnpm --filter @resolve/contracts compile` | ⬜ | 编译通过 |
| T10 | 部署合约到 Shasta | `pnpm --filter @resolve/contracts deploy:shasta` | ⬜ | 部署成功，有新合约地址 |
| T11 | 更新 `.env.local` 中的新合约地址 | `.env.local` | ⬜ | NEXT_PUBLIC_SETTLEMENT_ADDRESS 为新地址 |
| T12 | 类型检查 + 构建 | `pnpm typecheck && pnpm build` | ⬜ | typecheck 零错误；build 成功 |
| T13 | 端到端：用户创建市场（TronLink） | 浏览器操作 | ⬜ | 链上 getMarket().exists=true |
| T14 | 端到端：双钱包买 YES | TronLink + 浏览器 | ⬜ | DB positions 表 2 条记录 |
| T15 | 端到端：Force resolve (dev=1) → 随机投票 | 浏览器 | ⬜ | 6 Agent 投票浮现。重复执行应看到不同结果 |
| T16 | 端到端：自动结算 → 赢家到账 | 浏览器 + Tronscan | ⬜ | tx SUCCESS；赢家 USDD 增加 |

## 完成标准

```
✅ 任何用户可创建链上市场（createMarket 非 onlyOwner）
✅ 用户可买卖 YES/NO
✅ 到期/DEV 触发 AI 共识
✅ 共识后自动 settleBatch → 真实转账
✅ 赢家 USDD 到账（Tronscan 可查）
✅ 无气囊模式
✅ DEV 模式下随机投票（可重复走通）
```
