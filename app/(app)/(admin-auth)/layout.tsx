// ФАЙЛ: app/(admin-auth)/layout.tsx
// Обгортка для сторінки логіну — без sidebar, noindex для SEO

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}