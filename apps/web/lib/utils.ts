import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(n: number, opts?: { compact?: boolean }) {
  if (opts?.compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPct(n: number, decimals = 0) {
  return `${(n * 100).toFixed(decimals)}%`;
}

export function formatRelative(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = date.getTime() - Date.now();
  const sec = Math.round(diff / 1000);
  const abs = Math.abs(sec);
  if (abs < 60) return `${sec >= 0 ? "in" : ""} ${abs}s ${sec < 0 ? "ago" : ""}`.trim();
  const min = Math.round(sec / 60);
  if (Math.abs(min) < 60) return `${min >= 0 ? "in" : ""} ${Math.abs(min)}m ${min < 0 ? "ago" : ""}`.trim();
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 48) return `${hr >= 0 ? "in" : ""} ${Math.abs(hr)}h ${hr < 0 ? "ago" : ""}`.trim();
  const day = Math.round(hr / 24);
  return `${day >= 0 ? "in" : ""} ${Math.abs(day)}d ${day < 0 ? "ago" : ""}`.trim();
}

export function shortAddr(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
