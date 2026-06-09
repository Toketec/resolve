"use client";

import { MOCK_MARKETS } from "@/lib/mock";
import { formatPct } from "@/lib/utils";
import { useT } from "./i18n-provider";

export function LiveTicker() {
  const t = useT();
  const items = [...MOCK_MARKETS, ...MOCK_MARKETS];
  return (
    <div className="border-b-2 border-ink bg-ink text-canvas">
      <div className="mask-ticker relative h-8 overflow-hidden">
        <div className="animate-ticker flex h-8 items-center gap-10 whitespace-nowrap px-6">
          {items.map((m, i) => (
            <span key={`${m.id}-${i}`} className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="font-score text-[10px] font-bold uppercase tracking-[0.18em] text-canvas/55">
                {m.category}
              </span>
              <span className="text-canvas/95">{m.title.replace(/\?$/, "")}</span>
              <span
                className="font-score text-[11px] font-bold"
                style={{ color: m.yesPrice >= 0.5 ? "#00B14F" : "#FF2D6F" }}
              >
                {formatPct(m.yesPrice, 0)} YES
              </span>
              <span className="text-canvas/30">·</span>
            </span>
          ))}
          <span className="font-score text-[10px] font-bold uppercase tracking-[0.2em] text-pitch-500">
            ★ {t("ticker.live")} ★
          </span>
        </div>
      </div>
    </div>
  );
}
