// ФАЙЛ: app/(admin)/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/auth";
import { getUsersWithEmails } from "../actions/admin-users";
import { useAdminRole } from "../layout";
import { can } from "@/lib/permissions";

interface UserRow {
  id: string; full_name: string | null; email: string; role: string;
  created_at: string; updated_at: string; last_sign_in_at: string | null;
}
type StatusKey = "all" | "new" | "active" | "loyal" | "inactive" | "blocked";

const GRADES: Record<string, string> = {
  user:"User", supporter:"Supporter", backer:"Backer", partner:"Partner",
  investor:"Investor", board_member:"Board Member", admin:"Admin", superadmin:"Superadmin", blocked:"Заблокований",
};

function getStatus(u: UserRow): StatusKey {
  if (u.role === "blocked") return "blocked";
  const daysOld = (Date.now() - new Date(u.created_at).getTime()) / 86400000;
  // Використовуємо last_sign_in_at (реальний останній вхід), а не updated_at профілю
  const lastSeen = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : new Date(u.created_at).getTime();
  const daysIdle = (Date.now() - lastSeen) / 86400000;
  if (daysOld < 14) return "new";
  if (daysOld > 180 && daysIdle < 30) return "loyal";
  if (daysIdle < 30) return "active";
  return "inactive";
}

const ST: Record<StatusKey, { cls: string; dot: string; label: string }> = {
  all:      { cls: "",                                dot: "bg-neutral-300", label: "—"            },
  new:      { cls: "bg-blue-100 text-blue-700",       dot: "bg-blue-400",    label: "Новий"        },
  active:   { cls: "bg-green-100 text-green-700",     dot: "bg-green-400",   label: "Активний"     },
  loyal:    { cls: "bg-amber-100 text-amber-700",     dot: "bg-amber-400",   label: "Лояльний"     },
  inactive: { cls: "bg-neutral-100 text-neutral-500", dot: "bg-neutral-300", label: "Неактивний"   },
  blocked:  { cls: "bg-red-100 text-red-600",         dot: "bg-red-500",     label: "Заблокований" },
};

const Icon = ({ d, cls = "w-4 h-4" }: { d: string; cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cls}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ic = {
  close:  "M6 18L18 6M6 6l12 12",
  export: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
  plus:   "M12 4v16m8-8H4",
  warn:   "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
};

const inp = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-400 transition-colors bg-white";

// ─── Create Modal ─────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm]   = useState({ full_name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      // API route — використовує admin SDK, без rate limit Supabase
      const res = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? `Помилка ${res.status}`); setLoading(false); return; }
      onCreated(); onClose();
    } catch { setError("Мережева помилка"); setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Новий користувач</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400">
            <Icon d={ic.close} />
          </button>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">Ім'я</label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Ім'я Прізвище" required className={inp} />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="email@example.com" required className={inp} />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">Пароль</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Мінімум 6 символів" required minLength={6} className={inp} />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">Роль</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm focus:outline-none focus:border-orange-400 transition-all appearance-none cursor-pointer">
              {Object.entries(GRADES).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
            </select>
          </div>

          {/* Підказка про email підтвердження */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <Icon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" cls="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600">Email буде одразу підтверджений. Користувач отримає пароль від вас особисто.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <Icon d={ic.warn} cls="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all">
              Скасувати
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50">
              {loading ? "Створення..." : "Створити"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── User Drawer ──────────────────────────────────────────────
function UserDrawer({ user, onClose, onUpdate, isSuperadmin }: {
  user: UserRow; onClose: () => void; onUpdate: (u: UserRow) => void; isSuperadmin: boolean;
}) {
  const [grade, setGrade]   = useState(user.role);
  const [saving, setSaving] = useState(false);
  const status  = getStatus(user);
  const daysOld = Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000);

  async function saveGrade(g: string) {
    setGrade(g);
    await createClient().from("profiles").update({ role: g }).eq("id", user.id);
    onUpdate({ ...user, role: g });
  }

  async function blockUser() {
    if (!confirm(`Заблокувати ${user.email}?`)) return;
    setSaving(true);
    await createClient().from("profiles").update({ role: "blocked" }).eq("id", user.id);
    onUpdate({ ...user, role: "blocked" });
    setSaving(false);
  }

  async function resetPassword() {
    setSaving(true);
    await createClient().auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    alert("Лист відправлено!");
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <div>
            <p className="text-xs text-neutral-400 font-mono">{user.id.slice(0, 8)}...</p>
            <h2 className="font-semibold text-neutral-900 text-sm mt-0.5">{user.email}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400">
            <Icon d={ic.close} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg shrink-0">
              {(user.full_name || user.email)[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-neutral-900">{user.full_name || "—"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${ST[status].dot}`} />
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ST[status].cls}`}>{ST[status].label}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-sm border border-neutral-100 rounded-xl p-4">
            {[
              ["Реєстрація",    new Date(user.created_at).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })],
              ["У системі",    `${daysOld} днів`],
              ["Останній вхід", user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })
                : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-neutral-400">{k}</span>
                <span className="text-neutral-900 font-medium">{v}</span>
              </div>
            ))}
          </div>

          {isSuperadmin && (
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Грейд / Роль</p>
              <select value={grade} onChange={e => saveGrade(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm focus:outline-none focus:border-orange-400 transition-all appearance-none cursor-pointer">
                {Object.entries(GRADES).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
              </select>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Дії</p>
            <div className="space-y-2">
              <button onClick={resetPassword} disabled={saving}
                className="w-full py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all disabled:opacity-50">
                [ Скинути пароль ]
              </button>
              <a href={`mailto:${user.email}`}
                className="w-full py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all block text-center">
                [ Написати email ]
              </a>
              {user.role !== "blocked" && isSuperadmin && (
                <button onClick={blockUser} disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 active:scale-95 transition-all disabled:opacity-50">
                  [ Заблокувати акаунт ]
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const role = useAdminRole();

  const [users, setUsers]           = useState<UserRow[]>([]);
  const [authTotal, setAuthTotal]   = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);
  const [loadErr, setLoadErr]       = useState("");
  const [filter, setFilter]         = useState<StatusKey>("all");
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<UserRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setLoadErr("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profiles, error: pErr }, authUsers] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role, created_at, updated_at").order("created_at", { ascending: false }),
        getUsersWithEmails(),
      ]);

      if (pErr) throw new Error(pErr.message);

      // Якщо SERVICE_ROLE_KEY не налаштований — authUsers буде []
      const emailMap       = new Map(authUsers.map((u: { id: string; email: string }) => [u.id, u.email]));
      const lastSignInMap  = new Map(authUsers.map((u: { id: string; last_sign_in_at: string | null }) => [u.id, u.last_sign_in_at]));

      // Загальна кількість з auth (точніша ніж profiles)
      if (authUsers.length > 0) setAuthTotal(authUsers.length);

      setUsers((profiles ?? []).map((p: { id: string; full_name: string | null; role: string; created_at: string; updated_at: string }) => ({
        ...p,
        email:            emailMap.get(p.id) ?? "(email недоступний — додай SERVICE_ROLE_KEY)",
        last_sign_in_at:  lastSignInMap.get(p.id) ?? null,
      })));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Невідома помилка";
      setLoadErr(msg);
    }
    setLoading(false);
  }

  function exportCSV() {
    const rows = filtered.map(u => [u.id, u.email, u.full_name ?? "", u.role, u.created_at].join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([["ID,Email,Ім'я,Роль,Дата", ...rows].join("\n")], { type: "text/csv;charset=utf-8;" }));
    a.download = "users.csv"; a.click();
  }

  const isSuperadmin = can(role, "assignRoles");

  const counts: Record<StatusKey, number> = {
    all:      users.length,
    new:      users.filter(u => getStatus(u) === "new").length,
    active:   users.filter(u => getStatus(u) === "active").length,
    loyal:    users.filter(u => getStatus(u) === "loyal").length,
    inactive: users.filter(u => getStatus(u) === "inactive").length,
    blocked:  users.filter(u => getStatus(u) === "blocked").length,
  };

  const filtered = users
    .filter(u => filter === "all" || getStatus(u) === filter)
    .filter(u => !search || u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()));

  const TABS: { key: StatusKey; label: string }[] = [
    { key: "all",      label: "Всі"          },
    { key: "new",      label: "Нові"         },
    { key: "active",   label: "Активні"      },
    { key: "loyal",    label: "Лояльні"      },
    { key: "inactive", label: "Неактивні"    },
    { key: "blocked",  label: "Заблоковані"  },
  ];

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Користувачі</h1>
            <p className="text-sm text-neutral-400 mt-0.5">{authTotal ?? users.length} в системі</p>
          </div>
          <div className="flex items-center gap-2">
            {isSuperadmin && (
              <button onClick={exportCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all">
                <Icon d={ic.export} />Export .csv
              </button>
            )}
            {can(role, "createUser") && (
              <button onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:scale-95 transition-all">
                <Icon d={ic.plus} />Додати
              </button>
            )}
          </div>
        </div>

        {/* SERVICE_ROLE_KEY warning */}
        {users.length > 0 && users[0].email.includes("SERVICE_ROLE_KEY") && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <Icon d={ic.warn} cls="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700">EMAIL-и не відображаються</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Додай <code className="bg-amber-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> в <code className="bg-amber-100 px-1 rounded">.env.local</code> — тоді email-и підвантажаться з auth.users
              </p>
            </div>
          </div>
        )}

        {/* Load error */}
        {loadErr && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <Icon d={ic.warn} cls="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{loadErr}</p>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-xs">
          <Icon d={ic.search} cls="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm placeholder-neutral-400 focus:outline-none focus:border-orange-400 transition-colors bg-white" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl w-fit flex-wrap">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
              {label}
              <span className={`ml-1.5 text-xs ${filter === key ? "text-orange-500" : "text-neutral-400"}`}>{counts[key]}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-3xl">👥</p>
              <p className="text-sm text-neutral-500">
                {search ? `Нікого не знайдено за "${search}"` : "Користувачів ще немає"}
              </p>
              <button onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium">
                <Icon d={ic.plus} />Додати першого
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Користувач</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Статус</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider hidden md:table-cell">Грейд</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider hidden md:table-cell">Активність</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.map(u => {
                  const s = getStatus(u);
                  return (
                    <tr key={u.id} onClick={() => setSelected(u)} className="hover:bg-neutral-50 cursor-pointer transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0">
                            {(u.full_name || u.email || "U")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">{u.full_name || "—"}</p>
                            <p className="text-xs text-neutral-400 truncate max-w-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${ST[s].dot}`} />
                          <span className="text-xs text-neutral-600">{ST[s].label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className={`text-xs font-semibold ${["admin","superadmin"].includes(u.role) ? "text-orange-600" : "text-neutral-500"}`}>
                          {GRADES[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-neutral-400">{new Date(u.updated_at).toLocaleDateString("uk-UA")}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={load} />}
      {selected && (
        <UserDrawer
          user={selected}
          onClose={() => setSelected(null)}
          onUpdate={u => { setUsers(us => us.map(uu => uu.id === u.id ? u : uu)); setSelected(u); }}
          isSuperadmin={isSuperadmin}
        />
      )}
    </>
  );
}