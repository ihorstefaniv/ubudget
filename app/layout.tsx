import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "UBudget",
  description: "Відстежуй витрати, рахунки, бюджет і інвестиції в одному місці",
  manifest: "/api/pwa-manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UBudget",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const BUILD_SHA = process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className={geist.variable} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/api/pwa-manifest" />
        <meta name="theme-color" content="#f97316" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}

        {/* ── PWA service worker ── */}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/api/sw', { scope: '/' }).catch(() => {});
          }
        `}</Script>

        {/* ── Бейдж версії білда (нижній правий кут) ── */}
        <div className="fixed bottom-2 right-2 z-50 pointer-events-none select-none">
          <span className="text-[10px] font-mono text-neutral-400/60 dark:text-neutral-600/60 tabular-nums">
            v{APP_VERSION} · {BUILD_SHA}
          </span>
        </div>

        {/* ── Google Analytics 4 ── */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
              });
            `}</Script>
          </>
        )}
      </body>
    </html>
  );
}
