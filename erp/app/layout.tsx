import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "UBudget ERP",
  description: "Управління бізнесом: склад, CRM, виробництво, фінанси",
};

const BUILD_SHA = process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={geist.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f97316" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <div className="fixed bottom-2 right-2 z-50 pointer-events-none select-none">
          <span className="text-[10px] font-mono text-neutral-400/60 dark:text-neutral-600/60 tabular-nums">
            v{APP_VERSION} · {BUILD_SHA}
          </span>
        </div>
      </body>
    </html>
  );
}
