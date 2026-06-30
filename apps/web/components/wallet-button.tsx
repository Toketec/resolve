"use client";

// ─────────────────────────────────────────────
// WalletButton — 三态钱包 UI
//   未安装  → "Install TronLink →"（跳 Chrome 商店）
//   未连接  → "Connect wallet"（触发授权）
//   已连接  → T…xxxx + 网络标签 + 下拉（复制/断开）
// ─────────────────────────────────────────────

import { useState } from "react";
import { Check, Copy, LogOut, Wallet } from "lucide-react";
import { useWallet } from "./wallet-provider";
import { useT } from "./i18n-provider";
import { cn, shortAddr } from "@/lib/utils";

const TRONLINK_INSTALL_URL =
  "https://chromewebstore.google.com/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec";

const NETWORK_LABEL: Record<string, string> = {
  shasta: "Shasta",
  nile: "Nile",
  mainnet: "Mainnet",
  unknown: "Tron",
};

export function WalletButton() {
  const t = useT();
  const { installed, connected, connecting, address, network, error, connect, disconnect } =
    useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseBtn =
    "hidden items-center gap-2 rounded-full border-2 border-ink px-4 py-2 text-sm font-bold uppercase tracking-[0.06em] shadow-stamp-sm transition hover:-translate-y-0.5 hover:shadow-stamp sm:inline-flex";

  // 未安装
  if (!installed) {
    return (
      <a
        href={TRONLINK_INSTALL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseBtn, "bg-card text-ink")}
      >
        <Wallet className="size-4" strokeWidth={2.5} />
        Install TronLink →
      </a>
    );
  }

  // 已连接
  if (connected && address) {
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* clipboard 不可用时忽略 */
      }
    };
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className={cn(baseBtn, "bg-pitch-500 text-ink")}
        >
          <span className="pulse-dot size-2 rounded-full bg-ink" />
          <span className="font-score">{shortAddr(address)}</span>
          <span className="rounded-full border-2 border-ink bg-canvas px-1.5 py-0.5 text-[9px] leading-none">
            {NETWORK_LABEL[network] ?? "Tron"}
          </span>
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-hidden
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-stamp">
              <button
                type="button"
                onClick={copy}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-raised"
              >
                {copied ? <Check className="size-4 text-pitch-700" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy address"}
              </button>
              <button
                type="button"
                onClick={() => {
                  disconnect();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 border-t-2 border-ink px-4 py-2.5 text-left text-sm font-semibold text-magenta-700 transition hover:bg-raised"
              >
                <LogOut className="size-4" />
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // 已安装未连接
  return (
    <button
      type="button"
      onClick={connect}
      disabled={connecting}
      title={error ?? undefined}
      className={cn(
        baseBtn,
        "bg-pitch-500 text-ink",
        connecting && "cursor-wait opacity-70",
      )}
    >
      <Wallet className="size-4" strokeWidth={2.5} />
      {connecting ? "Connecting…" : t("nav.connectWallet")}
    </button>
  );
}
