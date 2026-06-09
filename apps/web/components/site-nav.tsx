"use client";

import Link from "next/link";
import { LanguageSelector } from "./language-selector";
import { useT } from "./i18n-provider";

export function SiteNav() {
  const t = useT();
  const links = [
    { href: "/markets", label: t("nav.markets") },
    { href: "/agents", label: t("nav.agents") },
    { href: "/create", label: t("nav.create") },
    { href: "/portfolio", label: t("nav.portfolio") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5"
          aria-label="RESOLVE — home"
        >
          <span className="relative flex size-9 items-center justify-center rounded-lg border-2 border-ink bg-ink text-canvas shadow-stamp-sm">
            <span className="font-display text-sm font-black">R</span>
            <span className="pulse-dot absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-ink bg-pitch-500" />
          </span>
          <span className="font-display text-lg font-black uppercase tracking-tight text-ink">
            RESOLVE
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink/70 transition hover:bg-raised hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSelector />
          <button
            type="button"
            className="hidden items-center gap-2 rounded-full border-2 border-ink bg-pitch-500 px-4 py-2 text-sm font-bold uppercase tracking-[0.06em] text-ink shadow-stamp-sm transition hover:-translate-y-0.5 hover:shadow-stamp sm:inline-flex"
          >
            {t("nav.connectWallet")}
          </button>
        </div>
      </div>
    </header>
  );
}
