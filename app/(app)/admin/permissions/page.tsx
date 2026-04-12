// ФАЙЛ: app/(app)/admin/permissions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/auth";
import { useAdminRole } from "../layout";
import {
  ALL_ROLES, PERMISSION_LABELS, resolveMatrix, isSuperAdmin,
  type Permission, type Role, type PermissionMatrix,
} from "@/lib/permissions";

const Icon = ({ d, cls = "w-4 h-4" }: { d: string; cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cls}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ic = {
  save:  "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4",
  check: "M5 13l4 4L19 7",
  warn:  "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  reset: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
};

const ROLE_LABELS: Record<Role, { label: string; color: string; bg: string }> = {
  user:       { label: "User",       color: "text-neutral-600", bg: "bg-neutral-100" },
  admin:      { label: "Admin",      color: "text-blue-600",    bg: "bg-blue-50" },
  superadmin: { label: "Superadmin", color: "text-orange-600",  bg: "bg-orange-50" },
};

// Group permissions by their group label
const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS) as Permission[];
const GROUPS = [...new Set(PERMISSION_KEYS.map(p => PERMISSION_LABELS[p].group))];

// ─── Toggle cell ──────────────────────────────────────────────

function PermCell({ enabled, locked, onChange }: {
  enabled: boolean;
  locked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => onChange(!enabled)}
      title={locked ? "Тільки superadmin може змінювати" : enabled ? "Вимкнути" : "Увімкнути"}
      className={`w-full flex items-center justify-center py-3 transition-all ${
        locked ? "cursor-not-allowed opacity-60" : "hover:bg-neutral-50 cursor-pointer"
      }`}
    >
      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
        enabled
          ? "bg-orange-100 text-orange-500"
          : "bg-neutral-100 text-neutral-300"
      }`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
          {enabled
            ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          }
        </svg>
      </span>
    </button>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function PermissionsPage() {
  const role    = useAdminRole();
  const canEdit = isSuperAdmin(role);

  const [overrides, setOverrides] = useState<PermissionMatrix>({});
  const [matrix, setMatrix]       = useState(() => resolveMatrix({}));
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [dirty, setDirty]         = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "permissions_matrix")
      .single();

    const loaded: PermissionMatrix = data?.value ? JSON.parse(data.value) : {};
    setOverrides(loaded);
    setMatrix(resolveMatrix(loaded));
    setLoading(false);
  }

  function toggle(perm: Permission, r: Role) {
    if (!canEdit) return;
    const current = matrix[perm][r];
    const next = !current;

    // Update overrides
    setOverrides(prev => ({
      ...prev,
      [perm]: { ...(prev[perm] ?? {}), [r]: next },
    }));

    // Update resolved matrix
    setMatrix(prev => ({
      ...prev,
      [perm]: { ...prev[perm], [r]: next },
    }));

    setDirty(true);
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("site_settings").upsert(
      { key: "permissions_matrix", value: JSON.stringify(overrides), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    setSaving(false);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2500);
  }

  async function resetToDefaults() {
    if (!confirm("Скинути всі права до стандартних значень?")) return;
    setOverrides({});
    setMatrix(resolveMatrix({}));
    setDirty(true);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Права доступу</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Матриця прав по ролях</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-all"
            >
              <Icon d={ic.reset} />
              Скинути
            </button>
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50"
            >
              <Icon d={saved ? ic.check : ic.save} />
              {saved ? "Збережено!" : saving ? "Збереження..." : "Зберегти"}
            </button>
          </div>
        )}
      </div>

      {/* Warning for non-superadmin */}
      {!canEdit && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <Icon d={ic.warn} cls="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">Тільки superadmin може змінювати права доступу</p>
        </div>
      )}

      {/* Unsaved changes banner */}
      {dirty && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
          <p className="text-sm text-blue-700 flex-1">Є незбережені зміни</p>
          <button onClick={save} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Зберегти →
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {ALL_ROLES.map(r => (
          <span key={r} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${ROLE_LABELS[r].bg} ${ROLE_LABELS[r].color}`}>
            {ROLE_LABELS[r].label}
          </span>
        ))}
        <span className="text-xs text-neutral-400 ml-2">
          Зміни зберігаються в БД та використовуються при перезавантаженні
        </span>
      </div>

      {/* Permission matrix — grouped */}
      <div className="space-y-4">
        {GROUPS.map(group => {
          const groupPerms = PERMISSION_KEYS.filter(p => PERMISSION_LABELS[p].group === group);

          return (
            <div key={group} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
              {/* Group header */}
              <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{group}</p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider w-[55%]">
                        Дозвіл
                      </th>
                      {ALL_ROLES.map(r => (
                        <th key={r} className="py-3 text-center w-[15%]">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_LABELS[r].bg} ${ROLE_LABELS[r].color}`}>
                            {ROLE_LABELS[r].label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {groupPerms.map(perm => (
                      <tr key={perm} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-neutral-800">
                            {PERMISSION_LABELS[perm].label}
                          </p>
                          <p className="text-xs text-neutral-400 font-mono mt-0.5">{perm}</p>
                        </td>
                        {ALL_ROLES.map(r => (
                          <td key={r} className="text-center p-0">
                            <PermCell
                              enabled={matrix[perm][r]}
                              locked={!canEdit}
                              onChange={() => toggle(perm, r)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <p className="text-xs text-neutral-400 pb-4">
        ⚠️ Middleware-перевірки (захист роутів) використовують захардкоджені defaults з <code className="font-mono bg-neutral-100 px-1 rounded">lib/permissions.ts</code> для продуктивності.
        Зміни тут впливають на UI-рівень адмінки.
      </p>
    </div>
  );
}
