import type { Position } from "@/lib/types";
import { MOCK_MARKETS } from "./markets";

export const MOCK_POSITIONS: Position[] = [
  pos("mk_btc_150k", "YES", 1240, 0.41),
  pos("mk_eth_etf_staking", "YES", 600, 0.32),
  pos("mk_apple_vp2", "NO", 320, 0.51),
  pos("mk_lakers", "YES", 880, 0.62),
  pos("mk_fed_rate", "YES", 720, 0.66),
  pos("mk_oscar_bp", "NO", 500, 0.44),
];

function pos(marketId: string, side: "YES" | "NO", shares: number, avgPrice: number): Position {
  const m = MOCK_MARKETS.find((mm) => mm.id === marketId)!;
  const currentPrice = side === "YES" ? m.yesPrice : 1 - m.yesPrice;
  return {
    id: `pos_${marketId}_${side}`,
    marketId,
    marketTitle: m.title,
    marketCategory: m.category,
    side,
    shares,
    avgPrice,
    currentPrice,
    status: m.status,
  };
}

export function portfolioStats(positions: Position[] = MOCK_POSITIONS) {
  const value = positions.reduce((acc, p) => acc + p.shares * p.currentPrice, 0);
  const cost = positions.reduce((acc, p) => acc + p.shares * p.avgPrice, 0);
  const pnl = value - cost;
  const open = positions.filter((p) => p.status === "live" || p.status === "resolving").length;
  return { value, cost, pnl, pnlPct: cost ? pnl / cost : 0, open };
}
