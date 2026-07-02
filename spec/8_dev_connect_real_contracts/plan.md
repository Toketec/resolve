# 8_dev_connect_real_contracts — Implementation Plan

## 步骤概览

```
步 1: lib/contract/tronweb.ts       — tronWeb 实例工厂（客户端/服务端双模式）
步 2: lib/contract/usdd.ts          — approve/balanceOf/allowance 封装
步 3: lib/contract/settlement.ts     — buyShares/settle/settleSimulated/getMarket 封装
步 4: api/buy/route.ts 重构          — 去掉 mock txHash，仅做持久化
步 5: api/settle/route.ts 重构       — tronWeb 服务端签名 + 真实 settle/settleSimulated
步 6: TradePanel buy 流程改造        — 连接 TronLink → approve → buyShares → POST 记录
步 7: 验证                           — 全流程端到端测试
```

---

## Step 1: 创建 tronWeb 实例工厂

**文件**: `apps/web/lib/contract/tronweb.ts`

**职责**:
- `getClientTronWeb()` — 从 `window.tron.tronWeb` 取浏览器端实例（buy 用）
- `getServerTronWeb()` — 从 `process.env.TRON_PRIVATE_KEY` 构造服务端实例（settle 用）
- `isTronLinkInstalled()` — 判断浏览器是否有 TronLink

```typescript
// 核心逻辑
import { TronWeb } from "tronweb";

const FULL_HOST = process.env.NEXT_PUBLIC_TRON_FULL_HOST || "https://api.shasta.trongrid.io";

/** 浏览器端: 从 TronLink 拿 tronWeb 实例。未安装/未连接时返回 null。 */
export function getClientTronWeb(): TronWeb | null {
  if (typeof window === "undefined") return null;
  const tw = (window as any).tron?.tronWeb;
  return tw ?? null;
}

/** 服务端: 从环境变量私钥构造 tronWeb 实例。无私钥时返回 null。 */
export function getServerTronWeb(): TronWeb | null {
  const pk = process.env.TRON_PRIVATE_KEY;
  if (!pk) return null;
  return new TronWeb({ fullHost: FULL_HOST, privateKey: pk });
}

export function isTronLinkInstalled(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).tron?.tronWeb);
}

export function isTronLinkConnected(): boolean {
  const tw = getClientTronWeb();
  return tw !== null && Boolean(tw.defaultAddress?.base58);
}

export function getConnectedAddress(): string | null {
  const tw = getClientTronWeb();
  return tw?.defaultAddress?.base58 ?? null;
}
```

---

## Step 2: 创建 USDD TRC-20 封装

**文件**: `apps/web/lib/contract/usdd.ts`

**职责**:
- `approve(settlementAddress, amount)` — 授权结算合约使用用户 USDD
- `balanceOf(address)` — 查 USDD 余额
- `allowance(owner, spender)` — 查授权额度
- 支持客户端 TronLink 和服务端双模式

```typescript
// 核心逻辑
import { getClientTronWeb, getServerTronWeb } from "./tronweb";
import { USDD_ADDRESS, USDD_ABI, USDD_DECIMALS } from "@/lib/constants";

function getContract(server = false) {
  const tw = server ? getServerTronWeb() : getClientTronWeb();
  if (!tw) throw new Error("TronWeb 不可用");
  return tw.contract(USDD_ABI, USDD_ADDRESS);
}

/** 授权结算合约使用 amount（最小单位）。 */
export async function approveUSDD(spender: string, amountSun: bigint): Promise<string> {
  const tw = getClientTronWeb();
  if (!tw) throw new Error("TronLink 未安装/未连接");
  const contract = await tw.contract(USDD_ABI, USDD_ADDRESS);
  const tx = await contract.approve(spender, amountSun).send();
  return tx;
}

export async function balanceOf(address: string): Promise<bigint> {
  const contract = await getContract(false);
  const bal = await contract.balanceOf(address).call();
  return BigInt(bal);
}
```

---

## Step 3: 创建 Settlement 合约封装

**文件**: `apps/web/lib/contract/settlement.ts`

**职责**:
- `buyShares(marketId, side, amount, walletAddress)` — 客户端签名，返回 txHash
- `createMarket(marketId, liquidity)` — 服务端/owner 创建市场
- `settle(marketId, outcome, winner, payout)` — 服务端/owner，真实转账
- `settleSimulated(marketId, outcome)` — 服务端/owner，标记结算不转账
- `getMarket(marketId)` — 只读查询市场状态

```typescript
// 核心逻辑
import { getClientTronWeb, getServerTronWeb } from "./tronweb";
import { SETTLEMENT_ADDRESS, SETTLEMENT_ABI, USDD_DECIMALS } from "@/lib/constants";

// ── 客户端（buy） ────────────────────────────
export async function buyShares(
  marketId: string,
  isYes: boolean,
  amountSun: bigint,
): Promise<{ txHash: string }> {
  const tw = getClientTronWeb();
  if (!tw) throw new Error("TronLink 未安装");
  const contract = await tw.contract(SETTLEMENT_ABI, SETTLEMENT_ADDRESS);
  const tx = await contract.buyShares(marketId, isYes, amountSun).send({
    feeLimit: 1_000_000_000,
    callValue: 0,
  });
  return { txHash: tx };
}

// ── 服务端（settle / owner only） ────────────
export async function settle(
  marketId: string,
  outcome: "YES" | "NO",
  winner: string,
  payoutSun: bigint,
): Promise<string> {
  const tw = getServerTronWeb();
  if (!tw) throw new Error("服务端 TronWeb 未配置（缺 TRON_PRIVATE_KEY）");
  const contract = await tw.contract(SETTLEMENT_ABI, SETTLEMENT_ADDRESS);
  const tx = await contract.settle(marketId, outcome, winner, payoutSun).send({
    feeLimit: 1_000_000_000,
    callValue: 0,
  });
  return tx;
}

export async function settleSimulated(
  marketId: string,
  outcome: "YES" | "NO",
): Promise<string> {
  const tw = getServerTronWeb();
  if (!tw) throw new Error("服务端 TronWeb 未配置");
  const contract = await tw.contract(SETTLEMENT_ABI, SETTLEMENT_ADDRESS);
  const tx = await contract.settleSimulated(marketId, outcome).send({
    feeLimit: 1_000_000_000,
    callValue: 0,
  });
  return tx;
}

export async function getMarket(marketId: string) {
  const tw = getServerTronWeb() || getClientTronWeb();
  if (!tw) throw new Error("TronWeb 不可用");
  const contract = await tw.contract(SETTLEMENT_ABI, SETTLEMENT_ADDRESS);
  return contract.getMarket(marketId).call();
}
```

---

## Step 4: 重构 /api/buy

**文件**: `apps/web/app/api/buy/route.ts`

**改动**:
- 去掉 `const txHash = \`mock_tx_${Date.now()}\``
- 买入逻辑改为：客户端先通过 TronLink 签名 → 拿到真实 txHash → POST 到此 API 做数据持久化
- 所以 `/api/buy` 不再做链上调用，只做 Supabase 写入 + 返回 txHash
- 校验: `txHash` 参数必须存在且非 mock 前缀（防止绕过）

**新接口**:
```typescript
// POST /api/buy — 记录一笔已完成的链上买入
interface BuyBody {
  marketId: string;
  side: "YES" | "NO";
  amount: number;
  walletAddress: string;
  txHash: string; // ← 真实的链上交易 hash
}
```

---

## Step 5: 重构 /api/settle

**文件**: `apps/web/app/api/settle/route.ts`

**改动**:
- 用 `AIRBAG_ENABLED` 判断走 `settleSimulated()` 还是 `settle()`
- 调用 `lib/contract/settlement.ts` 的对应方法
- 去掉 `mock_settle_` txHash
- 返回真实 txHash，`simulated` 标记保留

```typescript
import { settle, settleSimulated } from "@/lib/contract/settlement";

export async function POST(req: Request) {
  const { marketId, outcome, winnerWallet, payoutSun } = await req.json();
  const airbag = process.env.NEXT_PUBLIC_AIRBAG_ENABLED !== "false";

  let txHash: string;
  if (airbag) {
    txHash = await settleSimulated(marketId, outcome);
  } else {
    txHash = await settle(marketId, outcome, winnerWallet, payoutSun);
  }

  return Response.json({ marketId, outcome, txHash, paidOut: !airbag, simulated: airbag });
}
```

---

## Step 6: 改造 TradePanel buy 流程

**触发组件**: `app/markets/[slug]/page.tsx` 中的 TradePanel

**新流程**:
```
用户点击 Buy YES
  → 检查 TronLink 已安装 + 已连接
  → 检查 USDD 余额是否充足
  → 调用 approveUSDD(settlementAddress, amount)  // TronLink 弹出签名
  → 等待 approve 确认
  → 调用 buyShares(marketId, isYes, amount)      // TronLink 弹出签名
  → 拿到 txHash
  → POST /api/buy { marketId, side, amount, walletAddress, txHash }  // 持久化
  → 前端显示成功 + txHash 链接到 Tronscan
```

**错误处理**:
- TronLink 未安装 → "请安装 TronLink 浏览器扩展"
- approve 被拒绝 → "授权被用户取消"
- buyShares 被拒绝 → "买入交易被拒绝"
- 交易超时 → "交易处理中，请查看 TronLink 或 Tronscan 确认"

---

## Step 7: 验证

```bash
# 编译 + 类型检查
pnpm typecheck

# 构建
pnpm build

# 启动开发服务器
pnpm --filter @resolve/web dev
```

**手动验证**:
1. 浏览器安装 TronLink → 切换到 Shasta 测试网
2. 打开 localhost:3000 → 连接钱包
3. 在 TradePanel 选 YES → Buy → TronLink 弹出 approve → 确认
4. approve 确认后 → TronLink 弹出 buyShares → 确认
5. 前端显示成功 → txHash 可点开 Tronscan
6. /api/settle 返回真实 txHash（服务端）

---

## 关键文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/lib/contract/tronweb.ts` | **新建** | tronWeb 实例工厂 |
| `apps/web/lib/contract/usdd.ts` | **新建** | USDD approve/balanceOf |
| `apps/web/lib/contract/settlement.ts` | **新建** | buyShares/settle/settleSimulated |
| `apps/web/app/api/buy/route.ts` | **修改** | 去掉 mock txHash，校验真实 txHash |
| `apps/web/app/api/settle/route.ts` | **修改** | 调用真实合约方法 |
| `apps/web/app/markets/[slug]/page.tsx` | **修改** | TradePanel buy 流程接入合约 |
| `.env.example` | **修改** | 添加 TRON_PRIVATE_KEY 说明 |
