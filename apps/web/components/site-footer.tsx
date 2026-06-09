"use client";

import Link from "next/link";
import { useT } from "./i18n-provider";

export function SiteFooter() {
  const t = useT();
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
            { href: "#", label: t("footer.aiConsensus") },
            { href: "#", label: t("footer.disputeMode") },
            { href: "#", label: t("footer.registry") },
            { href: "#", label: t("footer.whitepaper") },
          ]} />
          <Col title={t("footer.ecosystem")} tone="text-crowd-700" items={[
            { href: "#", label: "HTX ecosystem" },
            { href: "#", label: "B.AI compute" },
            { href: "#", label: "Genesis hackathon" },
          ]} />
          <Col title={t("footer.company")} tone="text-magenta-700" items={[
            { href: "#", label: t("footer.about") },
            { href: "#", label: t("footer.docs") },
            { href: "#", label: t("footer.terms") },
            { href: "#", label: t("footer.privacy") },
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
              HTX Genesis Hackathon · 2026 · v0.1 mock
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Col({
  title,
  tone,
  items,
}: {
  title: string;
  tone: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${tone}`}>{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm font-semibold text-ink/80">
        {items.map((i) => (
          <li key={i.label}>
            <Link href={i.href} className="hover:text-ink">{i.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
