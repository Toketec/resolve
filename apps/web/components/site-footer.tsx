"use client";

import Link from "next/link";
import { useI18n } from "./i18n-provider";

export function SiteFooter() {
  const { locale, t } = useI18n();
  const isZh = locale === "zh";
  const whitepaperHref = isZh
    ? "https://app.notion.com/p/RESOLVE-AI-3919d182044c80b4b8c7e678bd4554f4"
    : "https://app.notion.com/p/RESOLVE-AI-Native-Prediction-Markets-3919d182044c80489b8aebe35f1d4ad0";
  const aiConsensusHref = isZh
    ? "https://app.notion.com/p/3929d182044c8185b1c1f75186db193b"
    : "https://app.notion.com/p/3929d182044c818c8feec416f63216c2";
  const disputeModeHref = isZh
    ? "https://app.notion.com/p/3929d182044c81dea710ef5850570512"
    : "https://app.notion.com/p/3929d182044c810ba731e2d53f15dd7c";
  const registryHref = isZh
    ? "https://app.notion.com/p/3929d182044c81ea929bd69a3e75d7a2"
    : "https://app.notion.com/p/3929d182044c8176b31ee2bcea3976fd";
  const privacyHref = isZh
    ? "https://app.notion.com/p/3929d182044c8102b155c2e409a7d93d"
    : "https://app.notion.com/p/3929d182044c81b9992eff4052732b5c";
  return (
    <footer className="mt-12 border-t-2 border-ink bg-raised">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <Col title={t("footer.product")} tone="text-royal-700" items={[
            { href: "/markets", label: t("nav.markets") },
            { href: "/agents", label: t("nav.agents") },
            { href: "/create", label: t("nav.create") },
            { href: "/portfolio", label: t("nav.portfolio") },
          ]} />
          <Col title={t("footer.protocol")} tone="text-pitch-700" items={[
            { href: aiConsensusHref, label: t("footer.aiConsensus"), external: true },
            { href: disputeModeHref, label: t("footer.disputeMode"), external: true },
            { href: registryHref, label: t("footer.registry"), external: true },
            { href: whitepaperHref, label: t("footer.whitepaper"), external: true },
          ]} />
          <Col title={t("footer.ecosystem")} tone="text-crowd-700" items={[
            { href: "https://www.htx.com/", label: "HTX ecosystem", external: true },
            { href: "https://b.ai/", label: "B.AI compute", external: true },
            { href: "https://htxdao-1.gitbook.io/htx-genesis-hackathon", label: "Genesis hackathon", external: true },
          ]} />
          <Col title={t("footer.team")} tone="text-magenta-700" items={[
            { href: "https://x.com/resolvemarket", label: t("footer.xTwitter"), external: true },
            { href: privacyHref, label: t("footer.privacy"), external: true },
          ]} />
        </div>

        <div className="mt-12 border-t-2 border-ink pt-8">
          <div className="relative">
            <h2 className="font-display select-none text-[clamp(72px,16vw,240px)] font-black uppercase leading-[0.84] tracking-[-0.04em] text-ink">
              RESOLVE
            </h2>
            <span
              aria-hidden
              className="pointer-events-none absolute -right-2 top-3 size-6 rounded-full border-2 border-ink bg-pitch-500 sm:size-10"
            />
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-md text-sm font-medium text-ink/70">{t("footer.tagline")}</p>
            <p className="font-score text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
              HTX Genesis Hackathon · 2026 · v0.1
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

type ColItem = { href: string; label: string; external?: boolean };

function Col({
  title,
  tone,
  items,
}: {
  title: string;
  tone: string;
  items: ColItem[];
}) {
  return (
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${tone}`}>{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm font-semibold text-ink/80">
        {items.map((i) => (
          <li key={i.label}>
            {i.external ? (
              <a href={i.href} target="_blank" rel="noopener noreferrer" className="hover:text-ink">{i.label}</a>
            ) : (
              <Link href={i.href} className="hover:text-ink">{i.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
