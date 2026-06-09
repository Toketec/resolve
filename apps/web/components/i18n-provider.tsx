"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Cookies from "js-cookie";
import {
  DEFAULT_LOCALE,
  isSupported,
  type SupportedLocale,
} from "@/lib/i18n/locales";
import { MESSAGES, type MessageKey } from "@/lib/i18n/messages";

const LOCALE_COOKIE = "resolve_locale";

interface I18nContext {
  locale: SupportedLocale;
  country: string | null;
  setLocale: (l: SupportedLocale) => void;
  t: (key: MessageKey) => string;
  dir: "ltr" | "rtl";
}

const RTL_LOCALES: SupportedLocale[] = ["ar"];

const Ctx = createContext<I18nContext | null>(null);

export function I18nProvider({
  children,
  initialLocale,
  initialCountry,
}: {
  children: React.ReactNode;
  initialLocale: SupportedLocale;
  initialCountry: string | null;
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);
  const [country, setCountry] = useState<string | null>(initialCountry);

  // Sync to cookie + html dir + lang attribute on locale change.
  useEffect(() => {
    Cookies.set(LOCALE_COOKIE, locale, { expires: 365, sameSite: "lax" });
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
    }
  }, [locale]);

  // Client-side detection fallback when there's no Vercel geo header.
  useEffect(() => {
    if (country || typeof navigator === "undefined") return;
    const navLang = navigator.language;
    const region = navLang.split("-")[1]?.toUpperCase();
    if (region) setCountry(region);
    if (!Cookies.get(LOCALE_COOKIE)) {
      const base = navLang.split("-")[0].toLowerCase();
      if (isSupported(base) && base !== locale) setLocaleState(base);
    }
  }, [country, locale]);

  const setLocale = useCallback((l: SupportedLocale) => {
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: MessageKey) => {
      const fromLocale = MESSAGES[locale]?.[key];
      if (fromLocale) return fromLocale;
      return MESSAGES[DEFAULT_LOCALE]?.[key] ?? key;
    },
    [locale],
  );

  const value = useMemo<I18nContext>(
    () => ({
      locale,
      country,
      setLocale,
      t,
      dir: RTL_LOCALES.includes(locale) ? "rtl" : "ltr",
    }),
    [locale, country, setLocale, t],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used within <I18nProvider>");
  return v;
}

/** Server-safe convenience for components that only need t() inside client code. */
export function useT() {
  return useI18n().t;
}
