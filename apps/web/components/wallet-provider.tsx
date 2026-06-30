"use client";

// ─────────────────────────────────────────────
// WalletProvider — 全应用钱包状态 Context
// ─────────────────────────────────────────────
// 包装整个 app（在 layout.tsx 中）。通过 useTronWallet 管理连接状态，
// 暴露 useWallet() 供任意组件消费（nav 按钮、TradePanel 等）。
// ─────────────────────────────────────────────

import { createContext, useContext, type ReactNode } from "react";
import { useTronWallet } from "@/lib/hooks/useTronWallet";

type WalletContextValue = ReturnType<typeof useTronWallet>;

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useTronWallet();
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a <WalletProvider>");
  }
  return ctx;
}
