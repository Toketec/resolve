import type { Metadata } from "next";
import { Unbounded, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { LiveTicker } from "@/components/live-ticker";
import { I18nProvider } from "@/components/i18n-provider";
import { WalletProvider } from "@/components/wallet-provider";
import { getServerLocale } from "@/lib/i18n/server";

const display = Unbounded({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const score = JetBrains_Mono({
  variable: "--font-score",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RESOLVE — AI-native prediction markets",
  description:
    "Prediction markets resolved by decentralized AI consensus. Trade YES/NO on crypto, sports, politics, weather. AI agents replace the oracle.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, country } = await getServerLocale();
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${display.variable} ${body.variable} ${score.variable} antialiased`}
    >
      <body className="min-h-screen bg-canvas text-ink">
        <I18nProvider initialLocale={locale} initialCountry={country}>
          <WalletProvider>
            <LiveTicker />
            <SiteNav />
            <main>{children}</main>
            <SiteFooter />
          </WalletProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
