// Stub: satisfies proxy.ts from repo root that Turbopack picks up during monorepo scan
export function isAtLeastAdmin(role: string | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}
