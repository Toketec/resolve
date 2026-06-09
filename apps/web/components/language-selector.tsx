"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Globe, Search } from "lucide-react";
import { LOCALES, type SupportedLocale } from "@/lib/i18n/locales";
import { useI18n } from "./i18n-provider";
import { cn } from "@/lib/utils";

export function LanguageSelector() {
  const { locale, country, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  const filtered = useMemo(() => {
    if (!query.trim()) return LOCALES;
    const q = query.toLowerCase();
    return LOCALES.filter(
      (l) =>
        l.code.includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q),
    );
  }, [query]);

  function pick(code: SupportedLocale) {
    setLocale(code);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-ink shadow-stamp-sm transition hover:-translate-y-0.5 hover:shadow-stamp"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="size-3.5" />
        <span className="leading-none">{current.flag}</span>
        <span className="font-score text-[10px] tracking-wider text-muted">
          {current.code}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[300px] overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-stamp">
          <div className="border-b-2 border-ink bg-raised px-3 py-3">
            <div className="flex items-center justify-between">
              <p className="font-score text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                {t("selector.label")}
              </p>
              {country && (
                <p className="font-score text-[10px] font-bold text-muted">
                  {t("selector.geo")} · <span className="text-ink">{country}</span>
                </p>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg border-2 border-ink bg-card px-2.5 py-1.5">
              <Search className="size-3.5 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("selector.search")}
                className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted"
                autoFocus
              />
            </div>
          </div>

          <ul role="listbox" className="max-h-[300px] overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-xs font-semibold text-muted">No match.</li>
            )}
            {filtered.map((l) => {
              const active = l.code === locale;
              return (
                <li key={l.code}>
                  <button
                    type="button"
                    onClick={() => pick(l.code)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-raised",
                      active && "bg-raised",
                    )}
                    role="option"
                    aria-selected={active}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base leading-none">{l.flag}</span>
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold text-ink">{l.nativeName}</span>
                        <span className="font-score text-[10px] uppercase tracking-wider text-muted">
                          {l.name} · {l.code}
                        </span>
                      </span>
                    </span>
                    {active && (
                      <span className="flex size-5 items-center justify-center rounded-full border-2 border-ink bg-pitch-500">
                        <Check className="size-3 text-ink" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t-2 border-ink bg-raised px-3 py-2">
            <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
              {locale === "en" ? t("selector.default") : t("selector.saved")}
              <span className="mx-2 text-ink/30">·</span>
              {LOCALES.length} languages
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
