import LandingHeader from "@/components/LandingHeader";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 min-h-screen flex flex-col">
      <LandingHeader />

      {/* Main */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-100 dark:border-neutral-800 py-6">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs text-neutral-400 text-center">© 2026 UBudget</p>
        </div>
      </footer>
    </div>
  );
}