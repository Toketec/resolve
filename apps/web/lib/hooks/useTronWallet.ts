"use client";

// ─────────────────────────────────────────────
// useTronWallet — TronLink 钱包连接 Hook
// ─────────────────────────────────────────────
// TronLink 浏览器扩展注入 window.tronLink + window.tronWeb。
// 连接流程：检测 → tron_requestAccounts → 读地址 → 判定网络 → 监听变更。
// 不触碰任何私钥/助记词（TronLink 自管）。
// ─────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";

export type TronNetwork = "shasta" | "mainnet" | "nile" | "unknown";

export interface TronWalletState {
  installed: boolean;
  connected: boolean;
  connecting: boolean;
  address: string;
  network: TronNetwork;
  error: string | null;
}

// TronLink 注入对象的最小类型（避免引第三方依赖）
interface TronLinkProvider {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  tronWeb?: TronWebLike;
}
interface TronWebLike {
  defaultAddress?: { base58?: string | false };
  fullNode?: { host?: string };
  ready?: boolean;
}

declare global {
  interface Window {
    tronLink?: TronLinkProvider;
    tronWeb?: TronWebLike;
  }
}

const SHASTA_HOST = "shasta";
const NILE_HOST = "nile";
const WALLET_STORAGE_KEY = "resolve_wallet";
const WALLET_DISCONNECTED_KEY = "resolve_wallet_disconnected";

function detectNetwork(host?: string): TronNetwork {
  if (!host) return "unknown";
  const h = host.toLowerCase();
  if (h.includes(SHASTA_HOST)) return "shasta";
  if (h.includes(NILE_HOST)) return "nile";
  if (h.includes("trongrid.io") || h.includes("tronstack")) return "mainnet";
  return "unknown";
}

const INITIAL: TronWalletState = {
  installed: false,
  connected: false,
  connecting: false,
  address: "",
  network: "unknown",
  error: null,
};

/** 尝试从 localStorage 恢复上次连接的地址（仅读取，不标记 connected） */
function readSavedWallet(): { address: string; network: TronNetwork } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { address?: string; network?: string };
    if (saved?.address) {
      return { address: saved.address, network: (saved.network as TronNetwork) || "unknown" };
    }
  } catch {}
  return null;
}

function persistWallet(address: string, network: TronNetwork) {
  try { localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify({ address, network })); } catch {}
}

function clearSavedWallet() {
  try { localStorage.removeItem(WALLET_STORAGE_KEY); } catch {}
}

/** 用户是否主动断开过（即使 TronLink 仍授权，也不应自动重连） */
function isExplicitlyDisconnected(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(WALLET_DISCONNECTED_KEY) === "1"; } catch { return false; }
}

function markDisconnected() {
  try { localStorage.setItem(WALLET_DISCONNECTED_KEY, "1"); } catch {}
}

function clearDisconnectedFlag() {
  try { localStorage.removeItem(WALLET_DISCONNECTED_KEY); } catch {}
}

export function useTronWallet() {
  // 初始化时从 localStorage 恢复上次的地址/网络，等 provider 就绪后再确认 connected 状态
  const [state, setState] = useState<TronWalletState>(() => {
    const saved = readSavedWallet();
    if (saved) return { ...INITIAL, address: saved.address, network: saved.network };
    return INITIAL;
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restoredRef = useRef(false);

  // 读取当前注入的 tronWeb 地址 + 网络（连接后用）
  const syncFromProvider = useCallback(() => {
    if (typeof window === "undefined") return;
    const tronWeb = window.tronLink?.tronWeb ?? window.tronWeb;
    const base58 = tronWeb?.defaultAddress?.base58;
    const host = tronWeb?.fullNode?.host;
    if (base58 && typeof base58 === "string") {
      const network = detectNetwork(host);
      setState((s) => ({
        ...s,
        connected: true,
        address: base58,
        network,
        error: null,
      }));
      persistWallet(base58, network);
    } else {
      setState((s) => ({ ...s, connected: false, address: "" }));
      clearSavedWallet();
    }
  }, []);

  // 检测扩展是否安装（注入可能延迟，轮询几次）
  useEffect(() => {
    if (typeof window === "undefined") return;
    let tries = 0;
    const check = () => {
      const installed = Boolean(window.tronLink || window.tronWeb);
      if (installed) {
        setState((s) => ({ ...s, installed: true }));
        // 用户主动断开过 → 不自动恢复，等待用户手动 Connect
        if (isExplicitlyDisconnected()) return true;
        // 若已授权（tronWeb ready），自动反映已连接状态
        const tronWeb = window.tronLink?.tronWeb ?? window.tronWeb;
        if (tronWeb?.defaultAddress?.base58) syncFromProvider();
        return true;
      }
      return false;
    };
    if (!check()) {
      const id = setInterval(() => {
        tries += 1;
        if (check() || tries > 10) clearInterval(id);
      }, 400);
      return () => clearInterval(id);
    }
  }, [syncFromProvider]);

  // 从 localStorage 恢复连接状态（处理 provider 注入慢于第一轮检测窗口的情况）
  useEffect(() => {
    if (typeof window === "undefined" || restoredRef.current) return;
    const saved = readSavedWallet();
    if (!saved || isExplicitlyDisconnected()) return;

    restoredRef.current = true;
    let tries = 0;
    const id = setInterval(() => {
      tries++;
      const tronWeb = window.tronLink?.tronWeb ?? window.tronWeb;
      if (tronWeb?.defaultAddress?.base58) {
        clearInterval(id);
        syncFromProvider();
      } else if (tries > 25) {
        // ~7.5s 超时 → provider 始终未就绪，清除残留数据
        clearInterval(id);
        clearSavedWallet();
        setState((s) => ({ ...s, connected: false, address: "" }));
      }
    }, 300);
    return () => clearInterval(id);
  }, [syncFromProvider]);

  // 监听账户/网络变更
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: MessageEvent) => {
      const msg = (e as MessageEvent<{ message?: { action?: string } }>).data?.message;
      if (!msg?.action) return;
      if (
        msg.action === "accountsChanged" ||
        msg.action === "setAccount" ||
        msg.action === "setNode" ||
        msg.action === "connect" ||
        msg.action === "disconnect"
      ) {
        if (msg.action === "disconnect") {
          markDisconnected();
          clearSavedWallet();
          setState((s) => ({ ...s, connected: false, address: "" }));
        } else {
          syncFromProvider();
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [syncFromProvider]);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    const provider = window.tronLink;
    if (!provider) {
      setState((s) => ({ ...s, error: "TronLink not installed" }));
      return;
    }
    // 用户重新连接 → 清除主动断开标记
    clearDisconnectedFlag();
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const res = (await provider.request({ method: "tron_requestAccounts" })) as
        | { code?: number; message?: string }
        | undefined;
      // code 200 = 授权成功；4001 = 用户拒绝
      if (res && typeof res.code === "number" && res.code !== 200) {
        throw new Error(res.message || `Authorization failed (code ${res.code})`);
      }
      // 给 tronWeb 注入留一点时间
      await new Promise((r) => setTimeout(r, 150));
      syncFromProvider();
      setState((s) => ({ ...s, connecting: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: err instanceof Error ? err.message : "Connection failed",
      }));
    }
  }, [syncFromProvider]);

  const disconnect = useCallback(() => {
    // TronLink 无编程式断开 API；清本地状态 + 标记主动断开，防止刷新后自动重连
    if (pollRef.current) clearInterval(pollRef.current);
    markDisconnected();
    clearSavedWallet();
    setState((s) => ({ ...INITIAL, installed: s.installed }));
  }, []);

  return { ...state, connect, disconnect };
}
