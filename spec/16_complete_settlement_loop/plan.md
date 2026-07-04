# Spec 16: 执行计划

## 架构图

```
┌──────────────────────────────────────────────────────────────────┐
│  Phase 1: 链上创建市场                                            │
│                                                                   │
│  create/page.tsx          POST /api/markets/create-chain         │
│  (前端表单)                      │  (新增端点)                     │
│       │                          │                                │
│       │ 提交市场信息               │ 服务端 owner 签名              │
│       ├──────────────────────────►│ createMarket(mid, liquidity)  │
│       │                          ├──────────────────────────────►│ 合约
│       │                          │◄──── txHash ──────────────────│
│       │◄── {id, txHash} ────────┤                                │
│       │                          │ DB 写入 markets 行             │
│       │                          │                                │
│                                                                   │
│  Phase 2: 交易 → 持仓                                            │
│                                                                   │
│  用户 TronLink                   合约                              │  DB
│       │                          │                               │
│       ├── buyShares() ──────────►│                               │
│       │                          ├── USDD 转入合约 ───────────── │
│       │                          │── stakes 记录                  │
│       │                          │                               │
│       │                          │           ◄── POST /api/buy ──┤
│       │                          │           ── DB 写入 position ►│
│                                                                   │
│  Phase 3: 真实结算                                                │
│                                                                   │
│  Settle 按钮              POST /api/settle                      │
│       │                          │                                │
│       ├── {marketId, outcome} ──►│                                │
│       │                          │① listPositionsByMarket()      │
│       │                          │② 筛赢家                        │
│       │                          │③ usddBalanceOf(SETTLEMENT)    │
│       │                          │④ 计算分摊                      │
│       │                          │⑤ settleBatch() ──────────────►│ 合约
│       │                          │◄── txHash ────────────────────│── 循环转账 USDD
│       │◄── {txHash, paidOut:true}│                                │ 到赢家钱包
│       │                          │⑥ updateMarket() — DB          │
│       │                          │                                │
│  Phase 4: 验证                                                    │
│                                                                   │
│  Tronscan 查 txHash → SUCCESS ✅                                 │
│  赢家查钱包 USDD → 余额增加 ✅                                   │
└──────────────────────────────────────────────────────────────────┘
```

## 执行步骤

### Step 0: 前置准备 — owner 地址 TRX + USDD

在开始编码前，先确保 owner 地址有足够的链上资源。

**owner 地址**：`TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ`（对应 `.env.local` 中的私钥）

**需要准备**：

```
① TRX ≥ 10（支付交易能量费）
   从 Shasta Faucet 领取：https://shasta.trongrid.io/faucet
   或从其他地址转账

② USDD ≥ (流动性金额 + 10 USDD 创建费 per market)
   使用 MockUSDD 合约给自己 mint：
   curl -X POST https://api.shasta.trongrid.io/wallet/triggersmartcontract \
     -d '{
       "contract_address":"TQAajpcg31edfttbuzvhWu7Vymy3LZLeZK",
       "function_selector":"mint(address,uint256)",
       "parameter": 以 owner 地址和金额编码 ,
       "owner_address":"TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ"
     }'

③ owner 地址 approve USDD 给合约地址
   授权 ResolveSettlement 合约可以使用 owner 的 USDD：
   tw.contract(USDD_ABI).at(USDD_ADDRESS).approve(SETTLEMENT_ADDRESS, 总金额).send(...)
```

> 如果 MockUSDD 没有 `mint` 函数，改用 Shasta 原生 USDD 或通过其他方式注入。

### Step 1: settlement.ts — 新增服务端 `createMarketAsOwner` 函数

**文件**: `apps/web/lib/contract/settlement.ts`

在已有的 `createMarket`（客户端 TronLink 版本）下方或服务端操作区新增：

```typescript
/**
 * 服务端创建链上市场（owner 私钥签名）。
 * 合约内部从 owner 拉取 (liquiditySun + 10 USDD 创建费)。
 * 注意：owner 地址必须先 approve USDD 给合约地址。
 * 返回 txHash。
 */
export async function createMarketAsOwner(
  marketId: string,
  liquiditySun: bigint,
): Promise<string> {
  const tw = getServerTronWeb();
  if (!tw) throw new Error("服务端 TronWeb 未配置（缺少 TRON_PRIVATE_KEY）");

  const c = tw.contract(SETTLEMENT_ABI as any, SETTLEMENT_ADDRESS);
  const mid = marketIdToBytes32(marketId);
  const txHash: string = await (c as any)
    .createMarket(mid, String(liquiditySun))
    .send({ feeLimit: 1_000_000_000, callValue: 0 });
  return txHash;
}
```

### Step 2: 新增服务端 `createMarket` API 端点

**文件**: `apps/web/app/api/markets/create-chain/route.ts`（新建）

新增 `POST /api/markets/create-chain` 端点，接收：

```typescript
interface CreateChainBody {
  marketId: string;      // 如 "mk_btc_150k"
  liquiditySun: string;  // 流动性（USDD sun），如 "1000000" = 1 USDD
}
```

逻辑：

```typescript
import { createMarket, getMarket } from "@/lib/contract/settlement";

export async function POST(req: Request) {
  // 1. 解析 body
  // 2. 前置检查：owner 地址 TRX 余额 ≥ 1 TRX（能量费）
  // 3. 调 contract.settle 的 createMarket(marketId, liquiditySun)
  // 4. 验证 createMarket 返回 txHash
  // 5. 调 getMarket() 确认 m.exists = true
  // 6. 返回 { txHash, marketId, exists: true }
}
```

> ⚠️ `createMarket` 当前是 `onlyOwner`，用服务端 owner 私钥签名没问题。如果想让用户也能自己创建，可以后续改合约去掉 `onlyOwner`，但当前先保持统一由平台创建。

### Step 3: 市场创建流程串联

**文件**: `apps/web/app/create/page.tsx`

修改创建流程：前端填入流动性金额后，不再直接调 `createMarket()` via TronLink（因 `onlyOwner` 会失败），改为：

```
用户填表单 → 前端 POST /api/markets (DB写入)
  → 前端 POST /api/markets/create-chain (链上创建)
  → 更新 DB markets 行的 onchain_tx_hash 字段
```

**流程图（简化）：**

```typescript
// 当前（有 bug）:
// createMarket(slug, amountSun) via TronLink → 因 onlyOwner 回滚 ❌
// POST /api/markets (DB) → 市场写入但链上没有

// 修复后:
// POST /api/markets (DB写入) ✅
// POST /api/markets/create-chain (owner签名链上创建) ✅
// → 链上 market.exists = true → 结算不再回滚 ✅
```

### Step 4: 市场创建后验证链上存在

**终端验证**：

```bash
# 使用 tronweb 脚本或 curl 调 Shasta RPC
# getMarket(marketId_hash) 应返回 exists=true
```

写好验证脚本（`scripts/verify-market.ts`），可复用。

### Step 5: 关闭气囊，配置真实结算

**文件**: `.env.local`

```diff
- NEXT_PUBLIC_AIRBAG_ENABLED=true
+ NEXT_PUBLIC_AIRBAG_ENABLED=false
```

重启 dev server 后生效。

### Step 6: 端到端真实结算测试

1. 通过创建页面创建一个测试市场
   - 自动调 `create-chain` → 链上创建成功 ✅
2. 用两个不同钱包（通过 TronLink 切换账户）分别买 YES，金额不同
   - DB positions 表出现 2 条记录
   - 合约 USDD 余额增加
3. 到期到达（或 `?dev=1` force resolve）
4. 共识达成 → votes 浮现
5. 点 "Settle on-chain"
6. 观察：
   - 按钮变为 "Settled · YES" + txHash
   - 服务端日志打印分配明细
7. Tronscan 查 txHash → method=`settleBatch`，状态 `SUCCESS` ✅
8. 两个赢家钱包查询 USDD → 按比例到账 ✅

### Step 6: 补全 DB 字段跟踪链上状态

**文件**: `apps/web/app/api/markets/create-chain/route.ts`

创建成功后，在 DB `markets` 表中记录：

```typescript
await updateMarket(marketId, {
  onchain_status: "active",
  onchain_tx_hash: txHash,
  onchain_liquidity: liquiditySun,
});
```

如果 DB `markets` 表还没有 `onchain_status` 字段，先在 Supabase 中加列（可选，不阻塞核心流程）。

## 关键考虑

### owner 地址 TRX 余额

`createMarket` 调用本身不消耗 TRX（只有 USDD transferFrom），但交易需要**能量（Energy）**，需要 owner 地址持有足够 TRX（冻结或燃烧）。建议 owner 地址在 Shasta faucet 领至少 10 TRX。

### 创建费

合约 `createMarket` 从 owner 拉取 `liquidity + 10 USDD`（创建费）。owner 地址需要在合约部署时已有 USDD 余额，或通过其他方式注入。

如果 owner 没有 USDD，可：
1. 先用 MockUSDD 给 owner mint 足够的 USDD
2. 或者部署时 owner 地址通过 Shasta faucet 领 USDD

### 幂等保护

`POST /api/markets/create-chain` 应先调 `getMarket()` 检查 `m.exists`，如果已存在则直接返回已有 txHash，不重复创建。

### 合约 balance 管理

用户 buy 的 USDD 会进入合约地址。真实结算时 `settleBatch` 从合约余额转账。如果合约余额不足，API 会返回 500 + "Insufficient contract balance"。
