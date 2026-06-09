import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  isSupported,
  localeForCountry,
  localeFromAcceptLanguage,
  type SupportedLocale,
} from "./locales";

export const LOCALE_COOKIE = "resolve_locale";
export const COUNTRY_COOKIE = "resolve_country";

/**
 * Resolves the active locale on the server in priority order:
 *
 *   1. User's explicit cookie selection (set by the LanguageSelector)
 *   2. IP-derived country (Vercel's `x-vercel-ip-country` header, free on
 *      Vercel deployments) → mapped to a curated language
 *   3. Browser `Accept-Language` header
 *   4. Hard default (English)
 */
export async function getServerLocale(): Promise<{
  locale: SupportedLocale;
  country: string | null;
  source: "cookie" | "geo" | "accept-language" | "default";
}> {
  const ck = await cookies();
  const hdr = await headers();

  const fromCookie = ck.get(LOCALE_COOKIE)?.value;
  if (isSupported(fromCookie)) {
    return {
      locale: fromCookie,
      country: hdr.get("x-vercel-ip-country") ?? ck.get(COUNTRY_COOKIE)?.value ?? null,
      source: "cookie",
    };
  }

  const country =
    hdr.get("x-vercel-ip-country") ?? ck.get(COUNTRY_COOKIE)?.value ?? null;
  if (country) {
    return { locale: localeForCountry(country), country, source: "geo" };
  }

  const fromHeader = localeFromAcceptLanguage(hdr.get("accept-language"));
  if (fromHeader) return { locale: fromHeader, country, source: "accept-language" };

  return { locale: DEFAULT_LOCALE, country, source: "default" };
}
