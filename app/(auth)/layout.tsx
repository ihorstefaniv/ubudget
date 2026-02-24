import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      {/* Мінімальний хедер */}
      <header className="h-16 flex items-center px-8">
        <Link
          href="/"
          className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 hover:text-orange-400 transition-colors duration-200"
        >
          <span className="text-orange-400">U</span>Budget
        </Link>
      </header>

      {/* Центрований контент */}
      <main className="flex-1 flex items-center justify-center px-4">
        {children}
      </main>

      <footer className="h-12 flex items-center justify-center">
        <p className="text-xs text-neutral-400">© 2026 UBudget</p>
      </footer>
    </div>
  );
}