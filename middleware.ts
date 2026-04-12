import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAtLeastAdmin } from "@/lib/permissions";

const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/register",
  "/blog",
  "/free",
  "/tools",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/feedback",
  "/demo",
  "/api/geocode",
  "/api/route",
];

// Admin login page — доступна без ролі (щоб адмін міг залогінитись)
const ADMIN_AUTH_PATHS = ["/admin-login"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // ── Незалогінений → /login (крім публічних та admin-login) ──
  if (!user && !isPublicPath(pathname) && !ADMIN_AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Залогінений на /login або /register → /dashboard ────────
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── /admin/* — потрібна роль admin або superadmin ────────────
  if (pathname.startsWith("/admin") && !ADMIN_AUTH_PATHS.includes(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin-login", request.url));
    }

    // Запитуємо роль з profiles (тільки для /admin шляхів)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!isAtLeastAdmin(profile?.role)) {
      // Залогінений юзер без прав адміна → на головну
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};