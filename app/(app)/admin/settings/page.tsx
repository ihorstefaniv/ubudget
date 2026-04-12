// ФАЙЛ: app/(admin)/settings/page.tsx
// URL: /admin/settings
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/auth";
import { useAdminRole, } from "../layout";
import { isSuperAdmin } from "@/lib/permissions";

const Icon = ({ d, cls = "w-4 h-4" }: { d: string; cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cls}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ic = {
  save:    "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4",
  warn:    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  check:   "M5 13l4 4L19 7",
  tg:      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z",
  bell:    "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  flag:    "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
  globe:   "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  lock:    "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
};

// ─── Toggle ───────────────────────────────────────────────────
function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!on)} disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${on ? "bg-orange-500" : "bg-neutral-200"} disabled:opacity-50`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

// ─── Section ─────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-neutral-100">
        <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center">
          <Icon d={icon} cls="w-3.5 h-3.5 text-neutral-600" />
        </div>
        <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const inp = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-400 transition-colors bg-white";

interface Settings {
  maintenance_mode:   boolean;
  maintenance_msg:    string;
  tg_bot_token:       string;
  tg_chat_id:         string;
  tg_notify_tickets:  boolean;
  tg_notify_users:    boolean;
  feature_blog:       boolean;
  feature_household:  boolean;
  feature_investments:boolean;
  feature_collections:boolean;
  feature_tools:      boolean;
  site_name:          string;
  support_email:      string;
}

const DEFAULTS: Settings = {
  maintenance_mode: false, maintenance_msg: "Сайт тимчасово на технічному обслуговуванні. Повернемось скоро!",
  tg_bot_token: "", tg_chat_id: "", tg_notify_tickets: true, tg_notify_users: false,
  feature_blog: true, feature_household: false, feature_investments: true,
  feature_collections: false, feature_tools: true,
  site_name: "UBudget", support_email: "",
};

const FEATURES = [
  { key: "feature_blog",         label: "Блог",                desc: "Публічний блог на /blog"                      },
  { key: "feature_investments",  label: "Інвестиції",          desc: "Модуль /investments для всіх користувачів"     },
  { key: "feature_household",    label: "Сімейний бюджет",     desc: "Модуль /household (в розробці)"                },
  { key: "feature_collections",  label: "Колекції",            desc: "Модуль колекціонування (в розробці)"           },
  { key: "feature_tools",        label: "Інструменти",         desc: "Калькулятори та інші утиліти (/tools)"         },
] as const;

export default function AdminSettingsPage() {
  const role = useAdminRole();

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [tgTest, setTgTest]     = useState<"idle" | "loading" | "ok" | "error">("idle");

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      const map = Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]));
      setSettings(s => ({
        ...s,
        ...Object.fromEntries(
          Object.keys(DEFAULTS).map(k => [k, map[k] !== undefined
            ? (typeof DEFAULTS[k as keyof Settings] === "boolean" ? map[k] === "true" : map[k])
            : DEFAULTS[k as keyof Settings]])
        ),
      }));
    }
    setLoading(false);
  }

  async function saveAll() {
    setSaving(true);
    const supabase = createClient();
    const rows = Object.entries(settings).map(([key, value]) => ({
      key, value: String(value), updated_at: new Date().toISOString(),
    }));
    await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function testTelegram() {
    setTgTest("loading");
    try {
      const res = await fetch(`https://api.telegram.org/bot${settings.tg_bot_token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: settings.tg_chat_id, text: "✅ UBudget Admin: тест підключення успішний!" }),
      });
      setTgTest(res.ok ? "ok" : "error");
    } catch { setTgTest("error"); }
    setTimeout(() => setTgTest("idle"), 3000);
  }

  function set<K extends keyof Settings>(key: K, val: Settings[K]) {
    setSettings(s => ({ ...s, [key]: val }));
  }

  const isSuperadmin = isSuperAdmin(role);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Налаштування сайту</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Глобальні параметри UBudget</p>
        </div>
        <button onClick={saveAll} disabled={saving || !isSuperadmin}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50">
          <Icon d={saved ? ic.check : ic.save} />
          {saved ? "Збережено!" : saving ? "Збереження..." : "Зберегти"}
        </button>
      </div>

      {!isSuperadmin && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <Icon d={ic.warn} cls="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">Тільки superadmin може змінювати налаштування</p>
        </div>
      )}

      {/* Загальне */}
      <Section title="Загальне" icon={ic.globe}>
        <Row label="Назва сайту" desc="Відображається в заголовках і листах">
          <input value={settings.site_name} onChange={e => set("site_name", e.target.value)}
            className="w-48 px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-orange-400 bg-white" disabled={!isSuperadmin} />
        </Row>
        <Row label="Email підтримки" desc="support@... — відправник листів">
          <input type="email" value={settings.support_email} onChange={e => set("support_email", e.target.value)}
            placeholder="support@ubudget.app"
            className="w-48 px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-orange-400 bg-white" disabled={!isSuperadmin} />
        </Row>
      </Section>

      {/* Maintenance */}
      <Section title="Режим обслуговування" icon={ic.lock}>
        <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${settings.maintenance_mode ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
          <span className={`w-2 h-2 rounded-full ${settings.maintenance_mode ? "bg-red-500" : "bg-green-500"}`} />
          {settings.maintenance_mode ? "⚠️ Сайт зараз НА ПАУЗІ — нові відвідувачі бачать заглушку" : "Сайт працює нормально"}
        </div>
        <Row label="Maintenance mode" desc="Закриває сайт для незареєстрованих користувачів">
          <Toggle on={settings.maintenance_mode} onChange={v => set("maintenance_mode", v)} disabled={!isSuperadmin} />
        </Row>
        {settings.maintenance_mode && (
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">Повідомлення на заглушці</label>
            <textarea value={settings.maintenance_msg} onChange={e => set("maintenance_msg", e.target.value)}
              rows={2} className={inp + " resize-none"} disabled={!isSuperadmin} />
          </div>
        )}
      </Section>

      {/* Feature flags */}
      <Section title="Feature Flags" icon={ic.flag}>
        <p className="text-xs text-neutral-400 -mt-2">Вмикає/вимикає модулі для всіх користувачів одночасно</p>
        {FEATURES.map(({ key, label, desc }) => (
          <Row key={key} label={label} desc={desc}>
            <Toggle
              on={settings[key as keyof Settings] as boolean}
              onChange={v => set(key as keyof Settings, v as Settings[keyof Settings])}
              disabled={!isSuperadmin}
            />
          </Row>
        ))}
      </Section>

      {/* Telegram */}
      <Section title="Telegram сповіщення" icon={ic.tg}>
        <p className="text-xs text-neutral-400 -mt-2">
          Щоб підключити: створи бота через @BotFather, отримай token і chat_id
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">Bot Token</label>
            <input type="password" value={settings.tg_bot_token} onChange={e => set("tg_bot_token", e.target.value)}
              placeholder="123456789:AAB..." className={inp} disabled={!isSuperadmin} />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">Chat ID</label>
            <input value={settings.tg_chat_id} onChange={e => set("tg_chat_id", e.target.value)}
              placeholder="-100123456789" className={inp} disabled={!isSuperadmin} />
          </div>
          <Row label="Сповіщення про нові тикети" desc="Бот надсилає повідомлення при новому зверненні">
            <Toggle on={settings.tg_notify_tickets} onChange={v => set("tg_notify_tickets", v)} disabled={!isSuperadmin} />
          </Row>
          <Row label="Сповіщення про нових юзерів" desc="Бот надсилає повідомлення при реєстрації">
            <Toggle on={settings.tg_notify_users} onChange={v => set("tg_notify_users", v)} disabled={!isSuperadmin} />
          </Row>
          {settings.tg_bot_token && settings.tg_chat_id && isSuperadmin && (
            <button onClick={testTelegram} disabled={tgTest === "loading"}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all border ${
                tgTest === "ok"    ? "bg-green-50 border-green-200 text-green-700" :
                tgTest === "error" ? "bg-red-50 border-red-200 text-red-600"      :
                "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              }`}>
              {tgTest === "loading" ? "Надсилання..." : tgTest === "ok" ? "✓ Тест успішний!" : tgTest === "error" ? "✗ Помилка — перевір token/chat_id" : "Надіслати тестове повідомлення"}
            </button>
          )}
        </div>
      </Section>

      {/* Небезпечна зона */}
      {isSuperadmin && (
        <Section title="Небезпечна зона" icon={ic.warn}>
          <p className="text-xs text-neutral-400 -mt-2">Ці дії незворотні</p>
          <div className="space-y-2">
            <button className="w-full py-2.5 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
              [ Очистити кеш сайту ]
            </button>
            <button className="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all"
              onClick={() => confirm("Видалити всі чернетки блогу?")}>
              [ Видалити всі чернетки блогу ]
            </button>
          </div>
        </Section>
      )}
    </div>
  );
}