"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { MarketCard } from "@/components/market-card";
import { CATEGORIES, MOCK_MARKETS } from "@/lib/mock";
import { fetchMarkets } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Market, MarketStatus } from "@/lib/types";

type SortKey = "volume" | "trending" | "ending" | "new";
const SORTS: { id: SortKey; label: string }[] = [
  { id: "volume", label: "Volume" },
  { id: "trending", label: "Trending" },
  { id: "ending", label: "Ending" },
  { id: "new", label: "New" },
];
const STATUSES: { id: MarketStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "resolving", label: "Resolving" },
  { id: "resolved", label: "Resolved" },
];

export default function MarketsPage() {
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState<MarketStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("volume");
  const [q, setQ] = useState("");
  // 从 API 读取市场；失败回退 mock（视觉不变）
  const [markets, setMarkets] = useState<Market[]>(MOCK_MARKETS);

  useEffect(() => {
    let active = true;
    fetchMarkets()
      .then((m) => {
        if (active && Array.isArray(m) && m.length) setMarkets(m);
      })
      .catch(() => {
        /* 保持 mock 兜底 */
      });
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(() => {
    let m = markets.slice();
    if (cat !== "all") m = m.filter((x) => x.category === cat);
    if (status !== "all") m = m.filter((x) => x.status === status);
    if (q.trim()) {
      const qq = q.toLowerCase();
      m = m.filter((x) => x.title.toLowerCase().includes(qq));
    }
    m.sort((a, b) => {
      if (sort === "volume") return b.volumeUSD - a.volumeUSD;
      if (sort === "trending") return b.traders - a.traders;
      if (sort === "ending") return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return m;
  }, [markets, cat, status, sort, q]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Title row */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-magenta-700">
            All markets
          </span>
          <h1 className="font-display mt-2 text-5xl font-black uppercase tracking-tight text-ink sm:text-7xl">
            Markets{" "}
            <span className="font-score text-pitch-500">/ {items.length}</span>
          </h1>
        </div>

        <div className="flex w-full max-w-md items-center gap-2 rounded-full border-2 border-ink bg-card px-4 py-2.5 shadow-stamp-sm">
          <Search className="size-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search markets…"
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-muted"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 rounded-3xl border-2 border-ink bg-card p-4 shadow-stamp-sm">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "rounded-full border-2 border-ink px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] transition",
                cat === c.id
                  ? "bg-ink text-canvas"
                  : "bg-raised text-ink/70 hover:bg-card hover:text-ink",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-line pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                className={cn(
                  "rounded-full border-2 border-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition",
                  status === s.id ? "bg-pitch-500 text-ink" : "bg-card text-ink/65 hover:bg-raised",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-3.5 text-muted" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Sort</p>
            <div className="flex gap-1">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSort(s.id)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition",
                    sort === s.id ? "bg-ink text-canvas" : "text-ink/70 hover:text-ink",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((m) => (
          <MarketCard key={m.id} market={m} />
        ))}
        {items.length === 0 && (
          <div className="col-span-full rounded-3xl border-2 border-dashed border-ink/30 bg-raised p-16 text-center">
            <p className="font-score text-sm font-bold uppercase tracking-wider text-muted">
              No markets match your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
