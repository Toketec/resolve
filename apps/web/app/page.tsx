"use client";

import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  Database,
  Globe2,
  Newspaper,
  ShieldCheck,
  Signal,
  Zap,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MarketCard } from "@/components/market-card";
import { CategoryChip } from "@/components/ui/category-chip";
import { ConsensusMeter } from "@/components/consensus-meter";
import { useT } from "@/components/i18n-provider";
import { MOCK_AGENTS, MOCK_MARKETS } from "@/lib/mock";
import { fetchMarkets, fetchAgents } from "@/lib/api-client";
import { cn, formatPct, formatUSD } from "@/lib/utils";
import type { Market } from "@/lib/types";

export default function LandingPage() {
  const t = useT();
  // 从 API 读取；失败回退 mock（视觉不变）
  const [markets, setMarkets] = useState<Market[]>(MOCK_MARKETS);
  const [agentCallsigns, setAgentCallsigns] = useState<string[]>(
    MOCK_AGENTS.slice(0, 6).map((a) => a.callsign),
  );

  useEffect(() => {
    let active = true;
    fetchMarkets()
      .then((m) => {
        if (active && Array.isArray(m) && m.length) setMarkets(m);
      })
      .catch(() => {});
    fetchAgents()
      .then((a) => {
        if (active && Array.isArray(a) && a.length) setAgentCallsigns(a.slice(0, 6).map((x) => x.callsign));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const featured = markets.filter((m) => m.status === "live").slice(0, 4);
  // 始终回退到 mock 的 resolving 市场，保证 Hero 第三张卡片永久展示
  const resolving =
    markets.find((m) => m.status === "resolving") ??
    MOCK_MARKETS.find((m) => m.status === "resolving");
  const totalVolume = markets.reduce((acc, m) => acc + m.volumeUSD, 0);
  const liveCount = markets.filter((m) => m.status === "live").length;

  return (
    <>
      {/* ============================= HERO ============================= */}
      <section className="relative">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pb-12 pt-8 sm:gap-10 sm:pb-20 sm:pt-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pb-24 lg:pt-16">
          <div className="flex flex-col gap-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-ink bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-ink shadow-stamp-sm">
              <span className="pulse-dot size-2 rounded-full bg-pitch-500" />
              {t("hero.eyebrow")}
            </div>

            <h1 className="font-display text-[14vw] font-black uppercase leading-[0.86] tracking-[-0.04em] text-ink sm:text-[6rem] lg:text-[8.5rem]">
              {t("hero.titlePart1")}
              <br />
              <span className="text-royal-500">{t("hero.titleAccentAI")}</span>{" "}
              <span className="text-pitch-500">{t("hero.titleAccentResolve")}</span>
              <br />
              {t("hero.titlePart2")}
            </h1>

            <p className="max-w-md text-base font-medium text-ink/75 sm:text-lg">
              <span className="font-bold text-ink">{t("hero.subtitleBold")}</span>{" "}
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/markets"
                className="group inline-flex items-center gap-2 rounded-full border-2 border-ink bg-pitch-500 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-stamp transition hover:-translate-y-0.5 hover:shadow-stamp-lg"
              >
                {t("hero.tradeMarkets")}
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/agents"
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-card px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-stamp-sm transition hover:-translate-y-0.5 hover:shadow-stamp"
              >
                {t("hero.meetOracles")}
              </Link>
            </div>

            <ul className="mt-2 grid grid-cols-1 gap-2 text-[11px] font-bold text-muted sm:grid-cols-3 sm:gap-3">
              <Trust>{t("hero.trustAttested")}</Trust>
              <Trust>{t("hero.trustNoKyc")}</Trust>
              <Trust>{t("hero.trustOnchain")}</Trust>
            </ul>

            <div className="mt-2 grid grid-cols-3 gap-3 border-t-2 border-ink pt-6">
              <Stat label={t("stats.volume")} value={formatUSD(totalVolume, { compact: true })} />
              <Stat label={t("stats.live")} value={liveCount.toString()} accent="text-pitch-700" />
              <Stat label={t("stats.resolutions")} value="19,351" accent="text-royal-700" />
            </div>
          </div>

          <HeroDeck resolving={resolving} />
        </div>
      </section>

      {/* ============================= ECOSYSTEM STRIP ============================= */}
      <section className="border-y-2 border-ink bg-ink text-canvas">
        <div className="mask-ticker overflow-hidden">
          <div className="animate-ticker flex items-center gap-12 whitespace-nowrap px-6 py-3.5 font-display text-lg font-black uppercase tracking-tight">
            {[
              "HTX ECOSYSTEM",
              "B.AI COMPUTE",
              "CLAUDE 4.7",
              "GPT-5",
              "PRIVY WALLETS",
              "USDD",
              "HTX ECOSYSTEM",
              "B.AI COMPUTE",
              "CLAUDE 4.7",
              "GPT-5",
              "PRIVY WALLETS",
              "USDD",
            ].map((p, i) => (
              <span key={i} className="flex items-center gap-12">
                <span>{p}</span>
                <span className="text-pitch-500">★</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= PILLARS ============================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        <header className="mb-10 flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700">
            {t("how.eyebrow")}
          </span>
          <h2 className="font-display max-w-3xl text-4xl font-black uppercase leading-[0.94] tracking-tight text-ink sm:text-6xl">
            <span className="text-cyan-700">{t("how.titleA")}</span>{" "}
            {t("how.titleB")}
          </h2>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <PillarCard
            eyebrow={t("oracle.aEyebrow")}
            title={t("oracle.aTitle")}
            body={t("oracle.aBody")}
            icon={<TrendingUp className="size-6" strokeWidth={2.5} />}
            bg="bg-pitch-500"
            ink="dark"
          />
          <PillarCard
            eyebrow={t("oracle.bEyebrow")}
            title={t("oracle.bTitle")}
            body={t("oracle.bBody")}
            icon={<TrendingDown className="size-6" strokeWidth={2.5} />}
            bg="bg-magenta-500"
            ink="light"
          />
          <PillarCard
            eyebrow={t("oracle.cEyebrow")}
            title={t("oracle.cTitle")}
            body={t("oracle.cBody")}
            icon={<Scale className="size-6" strokeWidth={2.5} />}
            bg="bg-royal-500"
            ink="light"
          />
        </div>
      </section>

      {/* ============================= FEATURED MARKETS ============================= */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:pb-24">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-magenta-700">
              {t("trending.eyebrow")}
            </span>
            <h2 className="font-display text-4xl font-black uppercase tracking-tight text-ink sm:text-6xl">
              {t("trending.titleA")}<br />
              <span className="text-magenta-500">{t("trending.titleB")}</span>
            </h2>
          </div>
          <Link
            href="/markets"
            className="group inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-[0.14em] text-ink hover:text-magenta-500"
          >
            {t("trending.browseAll")}
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {featured.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      </section>

      {/* ============================= WHY / BENTO ============================= */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:pb-24">
        <header className="mb-8 flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-700">
            {t("why.eyebrow")}
          </span>
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-ink sm:text-6xl">
            {t("why.title")}
          </h2>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
          <PosterTile
            big
            eyebrow={t("bento.networkEyebrow")}
            title={t("bento.networkTitle")}
            body={t("bento.networkBody")}
            tags={agentCallsigns}
          />
          <BentoTile
            bg="bg-card"
            ink="dark"
            eyebrow={t("bento.receiptsEyebrow")}
            title={t("bento.receiptsTitle")}
            body={t("bento.receiptsBody")}
            icon={<ShieldCheck className="size-5" strokeWidth={2.5} />}
          />
          <BentoTile
            bg="bg-goal-500"
            ink="dark"
            eyebrow={t("bento.speedEyebrow")}
            title={t("bento.speedTitle")}
            body={t("bento.speedBody")}
            icon={<Signal className="size-5" strokeWidth={2.5} />}
          />
          <BentoTile
            bg="bg-pitch-500"
            ink="dark"
            eyebrow={t("bento.coverageEyebrow")}
            title={t("bento.coverageTitle")}
            body={t("bento.coverageBody")}
            icon={<Globe2 className="size-5" strokeWidth={2.5} />}
          />
          <BentoTile
            bg="bg-magenta-500"
            ink="light"
            eyebrow={t("bento.disputeEyebrow")}
            title={t("bento.disputeTitle")}
            body={t("bento.disputeBody")}
            icon={<Zap className="size-5" strokeWidth={2.5} />}
          />
        </div>
      </section>

      {/* ============================= FINAL CTA ============================= */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:pb-32">
        <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-ink p-10 text-canvas shadow-stamp-lg sm:p-16">
          <span aria-hidden className="pointer-events-none absolute inset-0 opacity-30 pattern-dots-light" />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full border-2 border-canvas bg-pitch-500"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-10 right-32 hidden size-24 rounded-tl-full bg-goal-500 sm:block"
          />

          <div className="relative">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-pitch-500">
              {t("cta.eyebrow")}
            </span>
            <h2 className="font-display mt-4 max-w-3xl text-5xl font-black uppercase leading-[0.92] tracking-tight sm:text-7xl">
              {t("cta.titleA")}<br />
              <span className="text-pitch-500">{t("cta.titleB")}</span>
            </h2>
            <p className="mt-6 max-w-xl text-base font-medium text-canvas/80">
              {t("cta.body")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-full border-2 border-canvas bg-pitch-500 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-[6px_6px_0_0_#FAFAF5] transition hover:-translate-y-0.5"
              >
                {t("cta.create")}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/markets"
                className="inline-flex items-center gap-2 rounded-full border-2 border-canvas bg-transparent px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-canvas hover:bg-canvas/10"
              >
                {t("cta.browse")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Trust({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <CheckCircle2 className="size-3.5 text-pitch-500" strokeWidth={3} />
      <span className="text-ink">{children}</span>
    </li>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="font-score text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className={`font-display mt-1 text-2xl font-black tabular-nums ${accent ?? "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

function PillarCard({
  eyebrow,
  title,
  body,
  icon,
  bg,
  ink,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  bg: string;
  ink: "light" | "dark";
}) {
  const inkClass = ink === "light" ? "text-canvas" : "text-ink";
  const dimClass = ink === "light" ? "text-canvas/75" : "text-ink/70";
  return (
    <div
      className={cn(
        "group relative isolate flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-ink p-6 shadow-stamp transition hover:-translate-y-1 hover:shadow-stamp-lg sm:p-8",
        bg,
        inkClass,
      )}
      style={{ minHeight: 280 }}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 opacity-30",
          ink === "light" ? "pattern-stripes-light" : "pattern-stripes",
        )}
      />
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={cn("text-[10px] font-bold uppercase tracking-[0.22em]", dimClass)}>
            {eyebrow}
          </span>
          <span className="flex size-9 items-center justify-center rounded-full border-2 border-current">
            {icon}
          </span>
        </div>
        <h3 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-4xl">
          {title}
        </h3>
      </div>
      <p className={cn("mt-6 max-w-xs text-sm font-medium", dimClass)}>{body}</p>
    </div>
  );
}

function BentoTile({
  eyebrow,
  title,
  body,
  icon,
  bg,
  ink,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  bg: string;
  ink: "light" | "dark";
}) {
  const inkClass = ink === "light" ? "text-canvas" : "text-ink";
  const dimClass = ink === "light" ? "text-canvas/80" : "text-ink/70";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 border-ink p-6 shadow-stamp-sm transition hover:-translate-y-0.5 hover:shadow-stamp",
        bg,
        inkClass,
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("text-[10px] font-bold uppercase tracking-[0.22em]", dimClass)}>
          {eyebrow}
        </span>
        <span className="flex size-8 items-center justify-center rounded-full border-2 border-current">
          {icon}
        </span>
      </div>
      <h3 className="font-display mt-6 text-2xl font-black uppercase leading-[0.95] tracking-tight">
        {title}
      </h3>
      <p className={cn("mt-3 text-sm font-medium", dimClass)}>{body}</p>
    </div>
  );
}

function PosterTile({
  eyebrow,
  title,
  body,
  tags,
  big,
}: {
  eyebrow: string;
  title: string;
  body: string;
  tags: string[];
  big?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border-2 border-ink bg-indigo-500 p-6 text-canvas shadow-stamp transition hover:-translate-y-0.5 hover:shadow-stamp-lg sm:p-8",
        big && "md:col-span-1 md:row-span-2",
      )}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-30 pattern-dots-light" />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-pitch-500 opacity-90"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-6 right-14 size-24 rounded-tl-full bg-goal-500"
      />

      <div className="relative">
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-canvas/75">
          {eyebrow}
        </span>
        <h3 className="font-display mt-4 text-[clamp(36px,5vw,72px)] font-black uppercase leading-[0.9] tracking-tight">
          {title}
        </h3>
        <p className="mt-5 max-w-sm text-sm font-medium text-canvas/85">{body}</p>
        <div className="mt-8 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="font-score rounded-full border-2 border-canvas bg-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-canvas"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroDeck({ resolving }: { resolving?: (typeof MOCK_MARKETS)[number] }) {
  const t = useT();
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="relative h-[520px] sm:h-[560px]">
        <div
          className="animate-float absolute left-2 top-0 w-[72%] -rotate-[6deg] overflow-hidden rounded-3xl border-2 border-ink bg-pitch-500 p-5 text-ink shadow-stamp"
          style={{ animationDelay: "0s" }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 opacity-30 pattern-dots" />
          <span aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 size-32 rounded-full bg-goal-500" />
          <div className="relative">
            <p className="font-score text-[10px] font-bold uppercase tracking-[0.18em]">
              market · crypto
            </p>
            <h3 className="font-display mt-2 text-2xl font-black uppercase leading-[0.95] tracking-tight">
              BTC $150K
              <br />
              EOY?
            </h3>
            <p className="font-display mt-6 text-4xl font-black tabular-nums">68%</p>
            <p className="font-score text-[10px] font-bold uppercase tracking-wider text-ink/70">
              YES
            </p>
          </div>
        </div>

        <div
          className="animate-float absolute right-2 top-20 w-[70%] rotate-[4deg] overflow-hidden rounded-3xl border-2 border-ink bg-magenta-500 p-5 text-canvas shadow-stamp"
          style={{ animationDelay: "0.2s" }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 opacity-30 pattern-dots-light" />
          <span aria-hidden className="pointer-events-none absolute -bottom-12 -left-12 size-36 rounded-full bg-indigo-500" />
          <div className="relative">
            <p className="font-score text-[10px] font-bold uppercase tracking-[0.18em] text-canvas/80">
              market · politics
            </p>
            <h3 className="font-display mt-2 text-2xl font-black uppercase leading-[0.95] tracking-tight">
              2028 DEM
              <br />
              NOMINEE?
            </h3>
            <p className="font-display mt-6 text-4xl font-black tabular-nums">31%</p>
            <p className="font-score text-[10px] font-bold uppercase tracking-wider text-canvas/75">
              YES
            </p>
          </div>
        </div>

        {resolving && (
          <div
            className="animate-float absolute bottom-0 left-1/2 w-[88%] -translate-x-1/2 -rotate-[2deg] overflow-hidden rounded-3xl border-2 border-ink bg-card p-5 shadow-stamp-lg"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CategoryChip category={resolving.category} />
                <span className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
                  resolving
                </span>
              </div>
              <span className="pulse-dot inline-block size-2 rounded-full bg-goal-500" />
            </div>
            <h3 className="font-display mt-3 line-clamp-2 text-lg font-black uppercase leading-[0.95] tracking-tight">
              {resolving.title}
            </h3>
            <div className="mt-3">
              <ConsensusMeter consensus={resolving.consensus!} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border-2 border-ink bg-raised p-2.5">
                <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
                  YES @ {t("ticker.live")}
                </p>
                <p className="font-score text-base font-black" style={{ color: "#00B14F" }}>
                  {formatPct(resolving.yesPrice)}
                </p>
              </div>
              <div className="rounded-xl border-2 border-ink bg-raised p-2.5">
                <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
                  finalises
                </p>
                <p className="font-score text-base font-black text-ink">~ 42s</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
