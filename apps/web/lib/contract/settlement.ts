// ─────────────────────────────────────────────
// ResolveSettlement 合约封装 — buyShares / sellShares / settle / getPoolState / claimFees
// ─────────────────────────────────────────────
// buyShares / sellShares: 客户端 TronLink 签名（用户用自己的钱包交易）
// createMarket: 客户端 TronLink 签名（创建者支付 L USDD 流动性 + 10 USDD 创建费）
// settle / settleSimulated / claimMarketFees: 服务端 owner 私钥签名
// getMarket / getPoolState: 只读查询（客户端/服务端均可）
// ─────────────────────────────────────────────

import { getClientTronWeb, getServerTronWeb } from "./tronweb";
import { SETTLEMENT_ADDRESS, SETTLEMENT_ABI, AIRBAG_ENABLED } from "@/lib/constants";
import type { Outcome } from "@/lib/types";

export interface ChainResult {
  txHash: string;
  simulated: boolean;
}

// ── 编码工具 ───────────────────────────────────────────

/** 市场 id（字符串）→ bytes32（keccak256 哈希）。 */
function marketIdToBytes32(marketId: string): string {
  // 使用 TextEncoder + 简单 keccak-like 编码，退化为直接传递
  // TronWeb 服务端实例有内置 sha3，客户端 TronLink 也有
  const tw = getClientTronWeb() || getServerTronWeb();
  if (tw && typeof (tw as any).sha3 === "function") {
    return (tw as any).sha3(marketId);
  }
  // fallback: 用 Web Crypto API 的 SHA-256 作为 bytes32 编码
  // 这仅用于紧急兜底，正常情况下 TronLink 已提供 sha3
  return marketId;
}

/** "YES"/"NO" → bytes8（ASCII 编码，右填充到 8 字节）。 */
function outcomeToBytes8(outcome: Outcome): string {
  let hex = "";
  for (let i = 0; i < outcome.length; i++) {
    hex += outcome.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return "0x" + hex.padEnd(16, "0");
}

// ── 状态判断 ───────────────────────────────────────────

/** 是否处于气囊/未部署模式（不触链或走 settleSimulated）。 */
export function isAirbag(): boolean {
  return AIRBAG_ENABLED || !SETTLEMENT_ADDRESS;
}

// ── 客户端交易（TronLink 签名）─────────────────────

/**
 * 创建链上市场 + 注资流动性（客户端 TronLink 签名）。
 * 合约内部会从 creator 拉取 (liquiditySun + 10 USDD 创建费)。
 * 注意：需先调用 approveUSDD() 授权 (liquiditySun + 10_000_000) 后调用此方法。
 * 返回 txHash。
 */
export async function createMarket(
  marketId: string,
  liquiditySun: bigint,
): Promise<{ txHash: string }> {
  const tw = getClientTronWeb();
  if (!tw) throw new Error("TronLink 未安装/未连接");

  const from = tw.defaultAddress?.base58;
  const c = await tw.contract(SETTLEMENT_ABI as any).at(SETTLEMENT_ADDRESS);
  const mid = marketIdToBytes32(marketId);
  const txHash: string = await c
    .createMarket(mid, String(liquiditySun))
    .send({ feeLimit: 1_000_000_000, callValue: 0, ...(from ? { from } : {}) });
  return { txHash };
}

/**
 * 买入份额（用户 TronLink 签名）。
 * 注意：需要先调用 approveUSDD() 授权 USDD，然后调用此方法。
 * 返回 txHash。
 */
export async function buyShares(
  marketId: string,
  side: Outcome,
  amountSun: bigint,
): Promise<{ txHash: string }> {
  const tw = getClientTronWeb();
  if (!tw) throw new Error("TronLink 未安装/未连接，无法买入");

  const from = tw.defaultAddress?.base58;
  // TronLink 注入的 tronWeb 使用 .contract(ABI).at(ADDRESS) 模式
  const c = await tw.contract(SETTLEMENT_ABI as any).at(SETTLEMENT_ADDRESS);
  const mid = marketIdToBytes32(marketId);
  const isYes = side === "YES";
  const txHash: string = await c
    .buyShares(mid, isYes, String(amountSun))
    .send({ feeLimit: 1_000_000_000, callValue: 0, ...(from ? { from } : {}) });
  return { txHash };
}

/**
 * 卖出份额（用户 TronLink 签名）。
 * 注意：需要持仓份额充足（stakes 映射中记录）。
 * 合约内部会按 AMM 价格返还 USDD 并扣 0.1% 费。
 * 返回 txHash。
 */
export async function sellShares(
  marketId: string,
  side: Outcome,
  sharesSun: bigint,
): Promise<{ txHash: string }> {
  const tw = getClientTronWeb();
  if (!tw) throw new Error("TronLink 未安装/未连接，无法卖出");

  const from = tw.defaultAddress?.base58;
  const c = await tw.contract(SETTLEMENT_ABI as any).at(SETTLEMENT_ADDRESS);
  const mid = marketIdToBytes32(marketId);
  const isYes = side === "YES";
  const txHash: string = await c
    .sellShares(mid, isYes, String(sharesSun))
    .send({ feeLimit: 1_000_000_000, callValue: 0, ...(from ? { from } : {}) });
  return { txHash };
}

// ── 服务端结算（owner 私钥签名）────────────────────────

/**
 * 气囊结算：标记市场已结算，不进行真实转账。
 * 由服务端 owner 私钥签名，仅 API route 中可用。
 */
export async function settleSimulated(
  marketId: string,
  outcome: Outcome,
): Promise<string> {
  const tw = getServerTronWeb();
  if (!tw) throw new Error("服务端 TronWeb 未配置（缺少 TRON_PRIVATE_KEY）");
  // 服务端 tronweb npm 包 v6: .contract(ABI, ADDRESS)
  const c = tw.contract(SETTLEMENT_ABI as any, SETTLEMENT_ADDRESS);
  const mid = marketIdToBytes32(marketId);
  const out8 = outcomeToBytes8(outcome);
  const txHash: string = await (c as any)
    .settleSimulated(mid, out8)
    .send({ feeLimit: 1_000_000_000, callValue: 0 });
  return txHash;
}

/**
 * 真实结算：向赢家转账赔付。
 * 由服务端 owner 私钥签名，仅 API route 中可用。
 */
export async function settle(
  marketId: string,
  outcome: Outcome,
  winner: string,
  payoutSun: bigint,
): Promise<string> {
  const tw = getServerTronWeb();
  if (!tw) throw new Error("服务端 TronWeb 未配置（缺少 TRON_PRIVATE_KEY）");
  // 服务端 tronweb npm 包 v6: .contract(ABI, ADDRESS)
  const c = tw.contract(SETTLEMENT_ABI as any, SETTLEMENT_ADDRESS);
  const mid = marketIdToBytes32(marketId);
  const out8 = outcomeToBytes8(outcome);
  const txHash: string = await (c as any)
    .settle(mid, out8, winner, String(payoutSun))
    .send({ feeLimit: 1_000_000_000, callValue: 0 });
  return txHash;
}

// ── 只读查询 ───────────────────────────────────────────

/** 查询市场状态（exists, settled, outcome, liquidity, yesSupply, noSupply, feePool）。 */
export async function getMarket(marketId: string) {
  const tw = getServerTronWeb() || getClientTronWeb();
  if (!tw) throw new Error("TronWeb 不可用，无法查询市场");
  const c = await tw.contract(SETTLEMENT_ABI as any).at(SETTLEMENT_ADDRESS);
  const mid = marketIdToBytes32(marketId);
  return c.getMarket(mid).call();
}

/** 查询池状态（yesSupply, noSupply, yesPrice, noPrice, liquidity, feePool）。 */
export async function getPoolState(marketId: string): Promise<{
  yesSupply: bigint;
  noSupply: bigint;
  yesPrice: bigint;
  noPrice: bigint;
  liquidity: bigint;
  feePool: bigint;
}> {
  const tw = getServerTronWeb() || getClientTronWeb();
  if (!tw) throw new Error("TronWeb 不可用，无法查询池状态");
  const c = await tw.contract(SETTLEMENT_ABI as any).at(SETTLEMENT_ADDRESS);
  const mid = marketIdToBytes32(marketId);
  const result = await c.getPoolState(mid).call();

  // TronWeb 合约调用返回的可能是数组或对象
  const arr = Array.isArray(result) ? result : Object.values(result);
  return {
    yesSupply: BigInt(String(arr[0])),
    noSupply: BigInt(String(arr[1])),
    yesPrice: BigInt(String(arr[2])),
    noPrice: BigInt(String(arr[3])),
    liquidity: BigInt(String(arr[4])),
    feePool: BigInt(String(arr[5])),
  };
}

// ── 服务端费用提取 ────────────────────────────────────

/**
 * 提取指定市场的平台费（owner 私钥签名，仅服务端可用）。
 */
export async function claimMarketFees(marketId: string): Promise<string> {
  const tw = getServerTronWeb();
  if (!tw) throw new Error("服务端 TronWeb 未配置（缺少 TRON_PRIVATE_KEY）");
  const c = tw.contract(SETTLEMENT_ABI as any, SETTLEMENT_ADDRESS);
  const mid = marketIdToBytes32(marketId);
  const txHash: string = await (c as any)
    .claimMarketFees(mid)
    .send({ feeLimit: 1_000_000_000, callValue: 0 });
  return txHash;
}
