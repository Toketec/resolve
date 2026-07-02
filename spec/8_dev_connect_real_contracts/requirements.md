# 8_dev_connect_real_contracts — 前端 ⇄ 真实合约调用集成

## 解决的问题

合约已部署到 Shasta 测试网（MockUSDD: `TYAw3pLComCus5SVxgGhxVbspqNj3PYDHY`, ResolveSettlement: `TRpc78jLEq2wsxuB1mCvqSahU47B73UoVV`），但：

1. **`POST /api/buy`** — txHash 是 `mock_tx_${Date.now()}`，没有真实链上调用
2. **`POST /api/settle`** — txHash 是 `mock_settle_${Date.now()}`，气囊模式也只是概念标记
3. **不存在** `lib/contract/` 封装层——TronLink + tronWeb 的合约交互没有统一的 TS 封装
4. **TradePanel** 的 Buy 按钮不触发真实合约 `buyShares()`

此规格实现前端（TronLink 浏览器环境）⇄ 真实合约的完整调用链，替换 mock txHash。

## 工作边界

### 买入流程（buyShares — 客户端签名）

用户通过 TronLink 授权：
1. ✅ 授权 USDD → `approve(settlement_address, amount)`
2. ✅ 调用合约 `buyShares(marketId, isYes, amount)` → 获取真实 txHash
3. ✅ POST txHash + 元数据到 `/api/buy` → 写入 Supabase `positions` 表
4. ✅ 无 TronLink / 未连接 → 提示连接，不走 mock 兜底（避免假成功）

### 结算流程（settle — 服务端签名）

部署者私钥（环境变量）签名：
1. ✅ 气囊模式（默认）→ 合约 `settleSimulated(marketId, outcome)` → 真实链上交易（标记结算，不转账）
2. ✅ 真实模式 → 合约 `settle(marketId, outcome, winner, payout)` → 真实链上赔付转账
3. ✅ 气囊/真实都由 `NEXT_PUBLIC_AIRBAG_ENABLED` 控制
4. ✅ `/api/settle` 不再返回 mock txHash，而是真实 tronWeb 构造的交易

### 封装层
1. ✅ 新建 `lib/contract/settlement.ts` — buyShares / settle / settleSimulated / getMarket 封装
2. ✅ 新建 `lib/contract/usdd.ts` — approve / balanceOf / allowance 封装
3. ✅ `lib/contract/tronweb.ts` — tronWeb 实例工厂（浏览器 TronLink / 服务端私钥两种模式）

### 排除
- ❌ 不改动现有的 mock 兜底数据（spec 1-6 已处理）
- ❌ 不实现 AMM 做市/订单簿
- ❌ 不处理卖出手续
- ❌ 不实现争议窗口

## 依赖项

- 前置: spec 4（合约部署）✅ 已完成（MockUSDD + ResolveSettlement 已部署到 Shasta）
- 前置: spec 5（Walking Skeleton）✅ buy/settle API 路由已存在
- 前置: spec 2（TronLink 钱包连接）✅ `useWallet()` 可用
- 外部: TronLink 浏览器扩展（用户浏览器需安装并切换到 Shasta 测试网）
- 外部: 部署者私钥在 `.env` 中（服务器端 settle 签名用）
- 外部: 合约已在 Shasta 上预注资 USDD（合约地址有余额）

## 验收标准

1. TronLink 已连接时 → TradePanel 中 Buy YES/NO → TronLink 弹出 approve + buyShares 签名 → 返回真实 txHash
2. txHash 可打开 `https://shasta.tronscan.org/#/transaction/<txHash>` 查看
3. `/api/settle` 气囊模式（默认）→ 调用 `settleSimulated()` → 链上真实交易（标记已结算，不转账）
4. `/api/settle` 真实模式（`AIRBAG_ENABLED=false`）→ 调用 `settle()` → 赢家地址收到 USDD
5. TronLink 未安装时 → Buy 按钮显示 "Please install TronLink" 提示
6. `lib/contract/settlement.ts` 被 buy/settle API 路由使用（不再直接 mock txHash）
7. `pnpm typecheck` + `pnpm build` 通过
8. 部署者私钥仅出现在 `.env` 中（不硬编码）

## 边界与约束

- buy 走**客户端签名**：因为用户需要用自己的 TronLink 钱包 approve USDD 和调用 buyShares
- settle 走**服务端签名**：因为只有 owner（部署地址）可以调用 settle/settleSimulated；私钥存环境变量
- buyShares 需要用户先 approve USDD（TRC-20 两步授权），approve 和 buy 可合并为一次签名流程
- USDD 合约精度为 6 位小数（`USDD_DECIMALS = 6`），所有金额需转成最小单位 sun
- tronWeb 客户端实例通过 `window.tron.tronWeb` 获取；服务端实例通过私钥构造
