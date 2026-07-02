// ─────────────────────────────────────────────
// tronWeb 实例工厂 — 客户端 TronLink / 服务端私钥双模式
// ─────────────────────────────────────────────
// 客户端: 从 window.tronLink.tronWeb 获取（用户 TronLink 浏览器扩展）
// 服务端: 从 TRON_PRIVATE_KEY 环境变量构造（settle 用 owner 私钥签名）
// ─────────────────────────────────────────────

import { TronWeb } from "tronweb";

export const FULL_HOST =
  process.env.NEXT_PUBLIC_TRON_FULL_HOST || "https://api.shasta.trongrid.io";

/** 浏览器端: 从 TronLink 拿 tronWeb 实例。未安装/未连接时返回 null。 */
export function getClientTronWeb(): TronWeb | null {
  if (typeof window === "undefined") return null;
  const tw = (window as any).tronLink?.tronWeb ?? (window as any).tronWeb;
  return tw ?? null;
}

/** 服务端: 从环境变量私钥构造 tronWeb 实例。无私钥时返回 null。 */
export function getServerTronWeb(): TronWeb | null {
  const pk = process.env.TRON_PRIVATE_KEY;
  if (!pk) return null;
  return new TronWeb({ fullHost: FULL_HOST, privateKey: pk });
}

/** 检测浏览器是否安装了 TronLink。 */
export function isTronLinkInstalled(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean((window as any).tronLink || (window as any).tronWeb)
  );
}

/** 检测 TronLink 是否已连接（已授权账户）。 */
export function isTronLinkConnected(): boolean {
  const tw = getClientTronWeb();
  return tw !== null && typeof tw.defaultAddress?.base58 === "string";
}

/** 获取已连接的 TronLink 地址（base58），未连接时返回 null。 */
export function getConnectedAddress(): string | null {
  const tw = getClientTronWeb();
  const addr = tw?.defaultAddress?.base58;
  return typeof addr === "string" ? addr : null;
}
