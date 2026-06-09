import { NextResponse, type NextRequest } from "next/server";
import { COUNTRY_COOKIE } from "@/lib/i18n/server";

/**
 * Captures the IP-derived country code from Vercel's geo header into a
 * cookie so server components can read it consistently — and so the
 * LanguageSelector can show "auto-detected: 🇮🇩 Indonesia" on first load.
 *
 * On non-Vercel environments (`vercel dev` / pure local), the header is
 * absent and we leave the cookie alone. The selector falls back to
 * `navigator.language` on the client.
 */
export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const country = req.headers.get("x-vercel-ip-country");
  if (country && req.cookies.get(COUNTRY_COOKIE)?.value !== country) {
    res.cookies.set(COUNTRY_COOKIE, country, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
