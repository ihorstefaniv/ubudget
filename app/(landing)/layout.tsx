import type { Metadata } from "next";
import Link from "next/link";
import LandingHeader from "@/components/LandingHeader";

export const metadata: Metadata = {
  metadataBase: new URL("https://ubudget.app"),
  title: {
    default: "UBudget — Фінансовий трекер для особистого бюджету",
    template: "%s | UBudget",
  },
  description: "Простий фінансовий трекер для особистого бюджету. Рахунки, бюджет, конверти, кредити, Health Score. Безкоштовно. Без реклами.",
  keywords: ["фінансовий трекер", "особистий бюджет", "облік витрат", "витрати", "кредити", "депозити"],
  authors: [{ name: "UBudget" }],
  openGraph: { type: "website", locale: "uk_UA", siteName: "UBudget" },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-neutral-100 dark:border-neutral-800 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
          <div className="grid sm:grid-cols-3 gap-10">
            <div className="space-y-3">
              <p className="text-lg font-semibold">
                <span className="text-orange-400">U</span>
                <span className="text-neutral-900 dark:text-neutral-100">Budget</span>
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Простий фінансовий трекер для особистого бюджету. Зроблено з ♥ в Україні.
              </p>
            </div>

            <nav aria-label="Продукт">
              <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">Продукт</p>
              <ul className="space-y-2 text-sm">
                {[
                  { label: "Функціонал", href: "#features" },
                  { label: "Демо",       href: "/accounts" },
                  { label: "Реєстрація", href: "/register" },
                  { label: "Увійти",     href: "/login" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-neutral-600 dark:text-neutral-400 hover:text-orange-400 transition-colors duration-150">{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Підтримка">
              <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">Підтримка</p>
              <ul className="space-y-2 text-sm">
                {[
                  { label: "FAQ",                    href: "/faq" },
                  { label: "Зворотній зв'язок",      href: "#" },
                  { label: "Конфіденційність",        href: "#" },
                  { label: "Умови використання",      href: "#" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-neutral-600 dark:text-neutral-400 hover:text-orange-400 transition-colors duration-150">{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-xs text-neutral-400 dark:text-neutral-500">© 2026 UBudget. Зроблено з ♥ в Україні.</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Версія 1.2 Beta</p>
          </div>
        </div>
      </footer>
    </div>
  );
}