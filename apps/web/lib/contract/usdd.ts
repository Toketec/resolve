// ─────────────────────────────────────────────
// USDD TRC-20 封装 — approve / balanceOf / allowance
// ─────────────────────────────────────────────
// 客户端 TronLink 签名: approve（授权结算合约使用用户 USDD）
// 只读查询: balanceOf / allowance（客户端优先，回退到只读 RPC）
// ─────────────────────────────────────────────

import { getClientTronWeb, getReadOnlyTronWeb } from "./tronweb";
import { USDD_ADDRESS, USDD_ABI, USDD_DECIMALS } from "@/lib/constants";

// ── 金额转换 ───────────────────────────────────────────

/** 将人类可读的 USDD 数量转为最小单位（sun，6 位精度）。 */
export function usddToSun(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDD_DECIMALS));
}

/** 将最小单位（sun）转回人类可读的 USDD 数量。 */
export function sunToUsdd(amountSun: bigint): number {
  return Number(amountSun) / 10 ** USDD_DECIMALS;
}

// ── 合约操作 ───────────────────────────────────────────

/**
 * 授权结算合约使用用户 USDD（客户端 TronLink 签名）。
 * 返回 txHash。
 */
export async function approveUSDD(
  spender: string,
  amountSun: bigint,
): Promise<string> {
  const tw = getClientTronWeb();
  if (!tw) throw new Error("TronLink 未安装/未连接，无法授权 USDD");
  const from = tw.defaultAddress?.base58;
  // TronLink 注入的 tronWeb 使用 .contract(ABI).at(ADDRESS) 模式
  const c = await tw.contract(USDD_ABI as any).at(USDD_ADDRESS);
  const txHash: string = await c
    .approve(spender, String(amountSun))
    .send({ feeLimit: 1_000_000_000, callValue: 0, ...(from ? { from } : {}) });
  return txHash;
}

/** 查询地址的 USDD 余额（最小值 sun）。优先客户端，回退到只读 RPC。 */
export async function usddBalanceOf(address: string): Promise<bigint> {
  const tw = getClientTronWeb() || getReadOnlyTronWeb();
  const c = await tw.contract(USDD_ABI as any).at(USDD_ADDRESS);
  const bal: string = await c.balanceOf(address).call();
  return BigInt(bal);
}

/** 查询授权额度（owner 授权给 spender 的 USDD 数量，sun）。优先客户端，回退到只读 RPC。 */
export async function usddAllowance(
  owner: string,
  spender: string,
): Promise<bigint> {
  const tw = getClientTronWeb() || getReadOnlyTronWeb();
  const c = await tw.contract(USDD_ABI as any).at(USDD_ADDRESS);
  const allowance: string = await c.allowance(owner, spender).call();
  return BigInt(allowance);
}
