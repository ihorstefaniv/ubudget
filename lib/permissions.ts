/**
 * Permission system for UBudget.
 *
 * Roles (least → most powerful):
 *   user       — regular app user, no admin access
 *   admin      — admin panel, blog/tickets/users (read), basic settings
 *   superadmin — everything: terminal, user export, role assignment, extended dashboards
 */

export type Role = "user" | "admin" | "superadmin";

// Each permission lists the roles that have it.
const PERMISSIONS = {
  // Admin panel access
  accessAdmin:          ["admin", "superadmin"],

  // Users section
  viewUsers:            ["admin", "superadmin"],
  exportUsers:          ["superadmin"],              // Export .csv button
  assignRoles:          ["superadmin"],              // Change user role/grade
  createUser:           ["superadmin"],              // Create user button

  // Blog
  manageBlog:           ["admin", "superadmin"],

  // Tickets
  manageTickets:        ["admin", "superadmin"],

  // Monitor / terminal
  viewMonitor:          ["superadmin"],

  // Dashboards
  viewExtendedStats:    ["superadmin"],              // Advanced metrics / raw counts

  // Settings
  viewBasicSettings:    ["admin", "superadmin"],
  viewAdvancedSettings: ["superadmin"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Returns true if the given role has the given permission.
 * Passes safely — unknown roles always return false.
 */
export function can(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

/** Convenience: is this role at least "admin"? */
export function isAtLeastAdmin(role: string | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

/** Convenience: is this role "superadmin"? */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === "superadmin";
}
