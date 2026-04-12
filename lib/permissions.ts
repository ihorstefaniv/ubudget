/**
 * Permission system for UBudget.
 *
 * Roles (least → most powerful):
 *   user       — regular app user, no admin access
 *   admin      — admin panel, blog/tickets/users (read), basic settings
 *   superadmin — everything: terminal, user export, role assignment, extended dashboards
 */

export type Role = "user" | "admin" | "superadmin";

export const ALL_ROLES: Role[] = ["user", "admin", "superadmin"];

// ─── Default permission matrix ────────────────────────────────
// Each permission lists the roles that have it by default.

const DEFAULT_PERMISSIONS = {
  // Admin panel
  accessAdmin:          ["admin", "superadmin"],

  // Users section
  viewUsers:            ["admin", "superadmin"],
  exportUsers:          ["superadmin"],
  assignRoles:          ["superadmin"],
  createUser:           ["superadmin"],

  // Blog
  manageBlog:           ["admin", "superadmin"],

  // Tickets
  manageTickets:        ["admin", "superadmin"],

  // Monitor / terminal
  viewMonitor:          ["superadmin"],

  // Dashboards
  viewExtendedStats:    ["superadmin"],

  // Settings
  viewBasicSettings:    ["admin", "superadmin"],
  viewAdvancedSettings: ["superadmin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof DEFAULT_PERMISSIONS;

/** Human-readable labels shown in the permissions table UI */
export const PERMISSION_LABELS: Record<Permission, { label: string; group: string }> = {
  accessAdmin:          { label: "Доступ до адмінки",          group: "Адмінка" },
  viewUsers:            { label: "Перегляд користувачів",       group: "Користувачі" },
  exportUsers:          { label: "Експорт юзерів (.csv)",       group: "Користувачі" },
  assignRoles:          { label: "Призначення ролей",           group: "Користувачі" },
  createUser:           { label: "Створення користувача",       group: "Користувачі" },
  manageBlog:           { label: "Управління блогом",           group: "Контент" },
  manageTickets:        { label: "Управління тикетами",         group: "Контент" },
  viewMonitor:          { label: "Термінал / Моніторинг",       group: "Система" },
  viewExtendedStats:    { label: "Розширена статистика",        group: "Система" },
  viewBasicSettings:    { label: "Базові налаштування",         group: "Система" },
  viewAdvancedSettings: { label: "Розширені налаштування",      group: "Система" },
};

// ─── Runtime matrix type ──────────────────────────────────────
// Stored in site_settings as JSON under key "permissions_matrix".
// Partial — missing keys fall back to DEFAULT_PERMISSIONS.

export type PermissionMatrix = Partial<Record<Permission, Partial<Record<Role, boolean>>>>;

/**
 * Builds the full resolved matrix by merging defaults with DB overrides.
 * Returns a plain object you can pass to canFrom().
 */
export function resolveMatrix(overrides: PermissionMatrix = {}): Record<Permission, Record<Role, boolean>> {
  const result = {} as Record<Permission, Record<Role, boolean>>;
  for (const perm of Object.keys(DEFAULT_PERMISSIONS) as Permission[]) {
    result[perm] = {} as Record<Role, boolean>;
    for (const role of ALL_ROLES) {
      const override = overrides[perm]?.[role];
      result[perm][role] = override !== undefined
        ? override
        : (DEFAULT_PERMISSIONS[perm] as readonly string[]).includes(role);
    }
  }
  return result;
}

/**
 * Creates a can() function bound to a resolved matrix.
 * Use this in components that have loaded the matrix from DB.
 *
 * @example
 *   const can = canFrom(matrix);
 *   if (can("viewMonitor")) { ... }
 */
export function canFrom(matrix: Record<Permission, Record<Role, boolean>>, role: Role) {
  return (permission: Permission): boolean => matrix[permission]?.[role] ?? false;
}

// ─── Static helpers (use hardcoded defaults, safe for middleware) ─

/**
 * Quick check using hardcoded defaults.
 * Safe to use in middleware (no DB access needed).
 * Use canFrom() in components that need live DB overrides.
 */
export function can(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (DEFAULT_PERMISSIONS[permission] as readonly string[]).includes(role);
}

/** Convenience: is this role at least "admin"? */
export function isAtLeastAdmin(role: string | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

/** Convenience: is this role "superadmin"? */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === "superadmin";
}
