import ISO6391 from "iso-639-1";

/**
 * Languages we ship a curated selector for. Each maps to ISO 639-1.
 * We pre-resolve native names through `iso-639-1` so the dropdown is
 * fully localised without us hand-typing them.
 */
export const SUPPORTED_LOCALES = [
  "en",
  "zh",
  "es",
  "fr",
  "de",
  "ja",
  "ko",
  "pt",
  "ru",
  "ar",
  "hi",
  "id",
  "vi",
  "tr",
  "it",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

export interface LocaleMeta {
  code: SupportedLocale;
  name: string;        // English name (e.g. "Chinese")
  nativeName: string;  // Native script (e.g. "中文")
  flag: string;        // Representative flag emoji
}

const FLAG_BY_LOCALE: Record<SupportedLocale, string> = {
  en: "🇺🇸",
  zh: "🇨🇳",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  ja: "🇯🇵",
  ko: "🇰🇷",
  pt: "🇧🇷",
  ru: "🇷🇺",
  ar: "🇸🇦",
  hi: "🇮🇳",
  id: "🇮🇩",
  vi: "🇻🇳",
  tr: "🇹🇷",
  it: "🇮🇹",
};

export const LOCALES: LocaleMeta[] = SUPPORTED_LOCALES.map((code) => ({
  code,
  name: ISO6391.getName(code) || code.toUpperCase(),
  nativeName: ISO6391.getNativeName(code) || code.toUpperCase(),
  flag: FLAG_BY_LOCALE[code],
}));

/**
 * Country code → preferred locale. Sourced from the dominant business
 * language each ISO-3166-1 alpha-2 country code maps to. We keep this
 * deliberately small and high-confidence — anything not listed falls back
 * to `en`. Hand-curated rather than pulled from `country-language` because
 * that package gives multiple results per country (e.g. India → en, hi)
 * and we want a single deterministic choice.
 */
const COUNTRY_TO_LOCALE: Record<string, SupportedLocale> = {
  US: "en", GB: "en", CA: "en", AU: "en", NZ: "en", IE: "en", SG: "en", PH: "en", ZA: "en", NG: "en", KE: "en",
  CN: "zh", TW: "zh", HK: "zh", MO: "zh",
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es", EC: "es", UY: "es", PY: "es", BO: "es", CR: "es", PA: "es", DO: "es", CU: "es", GT: "es", HN: "es", SV: "es", NI: "es", PR: "es",
  FR: "fr", BE: "fr", LU: "fr", MC: "fr", CI: "fr", SN: "fr", CM: "fr", MA: "fr", DZ: "fr", TN: "fr",
  DE: "de", AT: "de", CH: "de", LI: "de",
  JP: "ja",
  KR: "ko", KP: "ko",
  PT: "pt", BR: "pt", AO: "pt", MZ: "pt",
  RU: "ru", BY: "ru", KZ: "ru", KG: "ru", UA: "ru",
  SA: "ar", AE: "ar", EG: "ar", QA: "ar", KW: "ar", BH: "ar", OM: "ar", JO: "ar", IQ: "ar", LB: "ar", LY: "ar", SD: "ar", YE: "ar", SY: "ar",
  IN: "hi", NP: "hi",
  ID: "id",
  VN: "vi",
  TR: "tr",
  IT: "it", SM: "it", VA: "it",
};

export function localeForCountry(country: string | null | undefined): SupportedLocale {
  if (!country) return DEFAULT_LOCALE;
  return COUNTRY_TO_LOCALE[country.toUpperCase()] ?? DEFAULT_LOCALE;
}

/**
 * Parse an HTTP Accept-Language header like `en-US,en;q=0.9,fr;q=0.7`
 * and return the highest-q supported locale.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): SupportedLocale | null {
  if (!header) return null;
  const parts = header.split(",").map((p) => {
    const [tag, qStr] = p.trim().split(";q=");
    const lang = tag.split("-")[0].toLowerCase();
    const q = qStr ? Number(qStr) : 1;
    return { lang, q };
  });
  parts.sort((a, b) => b.q - a.q);
  for (const { lang } of parts) {
    if ((SUPPORTED_LOCALES as readonly string[]).includes(lang)) {
      return lang as SupportedLocale;
    }
  }
  return null;
}

export function isSupported(code: string | null | undefined): code is SupportedLocale {
  return !!code && (SUPPORTED_LOCALES as readonly string[]).includes(code);
}
