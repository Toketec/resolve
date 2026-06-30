// ─────────────────────────────────────────────
// 结算合约前端封装 — TronLink (window.tronWeb)
// ─────────────────────────────────────────────
// buyShares / settle / settleSimulated。
// 气囊模式（AIRBAG_ENABLED 或合约未部署）→ 返回模拟 txHash，不触链。
// 不引第三方 SDK：直接用 TronLink 注入的 tronWeb 实例。
// ─────────────────────────────────────────────

import {
  SETTLEMENT_ADDRESS,
  SETTLEMENT_ABI,
  USDD_ADDRESS,
  USDD_ABI,
  USDD_DECIMALS,
  AIRBAG_ENABLED,
} from "@/lib/constants";
import type { Outcome } from "@/lib/types";

export interface ChainResult {
  txHash: string;
  simulated: boolean;
}

// 最小 tronWeb 形状
interface TronWebLike {
  contract: (abi?: unknown) => { at: (addr: string) => Promise<TronContract> };
  toBigNumber?: (v: number | string) => unknown;
  sha3?: (v: string) => string;
}
interface TronContract {
  [method: string]: (...args: unknown[]) => { send: (opts?: Record<string, unknown>) => Promise<string> };
}

function getTronWeb(): TronWebLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { tronWeb?: TronWebLike; tronLink?: { tronWeb?: TronWebLike } };
  return w.tronLink?.tronWeb ?? w.tronWeb ?? null;
}

/** 市场 id → bytes32（用 tronWeb.sha3 哈希字符串）。 */
function marketIdToBytes32(tronWeb: TronWebLike, marketId: string): string {
  if (tronWeb.sha3) return tronWeb.sha3(marketId);
  // 退路：右填充（仅在 sha3 不可用时）
  return marketId;
}

/** "YES"/"NO" → bytes8（ASCII 编码，右填充到 8 字节）。浏览器安全，不用 Buffer。 */
function outcomeToBytes8(outcome: Outcome): string {
  let hex = "";
  for (let i = 0; i < outcome.length; i++) {
    hex += outcome.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return "0x" + hex.padEnd(16, "0");
}

function amountToUnits(amount: number): string {
  return BigInt(Math.round(amount * 10 ** USDD_DECIMALS)).toString();
}

function mockTx(prefix: string): ChainResult {
  return { txHash: `${prefix}_${Date.now().toString(16)}`, simulated: true };
}

/** 是否处于气囊/未部署模式（不触链）。 */
export function isAirbag(): boolean {
  return AIRBAG_ENABLED || !SETTLEMENT_ADDRESS;
}

/**
 * 买入：先 approve USDD，再调 buyShares。
 * 气囊/未部署或无 tronWeb → 返回模拟 txHash。
 */
export async function buyShares(
  marketId: string,
  side: Outcome,
  amount: number,
): Promise<ChainResult> {
  const tronWeb = getTronWeb();
  if (isAirbag() || !tronWeb || !SETTLEMENT_ADDRESS || !USDD_ADDRESS) {
    return mockTx("sim_buy");
  }
  const units = amountToUnits(amount);
  // 1) approve
  const usdd = await tronWeb.contract(USDD_ABI as unknown).at(USDD_ADDRESS);
  await usdd.approve(SETTLEMENT_ADDRESS, units).send();
  // 2) buyShares
  const c = await tronWeb.contract(SETTLEMENT_ABI as unknown).at(SETTLEMENT_ADDRESS);
  const txHash = await c
    .buyShares(marketIdToBytes32(tronWeb, marketId), side === "YES", units)
    .send({ feeLimit: 100_000_000 });
  return { txHash, simulated: false };
}

/**
 * 结算：气囊 → settleSimulated；否则 settle 向赢家赔付。
 */
export async function settle(
  marketId: string,
  outcome: Outcome,
  winner: string,
  payout = 0,
): Promise<ChainResult> {
  const tronWeb = getTronWeb();
  if (isAirbag() || !tronWeb || !SETTLEMENT_ADDRESS) {
    return mockTx("sim_settle");
  }
  const c = await tronWeb.contract(SETTLEMENT_ABI as unknown).at(SETTLEMENT_ADDRESS);
  const mid = marketIdToBytes32(tronWeb, marketId);
  const out8 = outcomeToBytes8(outcome);
  const txHash = await c
    .settle(mid, out8, winner, payout > 0 ? amountToUnits(payout) : 0)
    .send({ feeLimit: 100_000_000 });
  return { txHash, simulated: false };
}

/** 显式调用气囊结算（标记已结算但不转账）。 */
export async function settleSimulated(marketId: string, outcome: Outcome): Promise<ChainResult> {
  const tronWeb = getTronWeb();
  if (!tronWeb || !SETTLEMENT_ADDRESS) return mockTx("sim_settle");
  const c = await tronWeb.contract(SETTLEMENT_ABI as unknown).at(SETTLEMENT_ADDRESS);
  const txHash = await c
    .settleSimulated(marketIdToBytes32(tronWeb, marketId), outcomeToBytes8(outcome))
    .send({ feeLimit: 100_000_000 });
  return { txHash, simulated: true };
}
