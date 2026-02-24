"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────
type Tab = "profile" | "appearance" | "family" | "notifications" | "security";

// ─── Helpers ──────────────────────────────────────────────────
const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${checked ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

function Input({ label, desc, ...props }: { label: string; desc?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      {desc && <p className="text-xs text-neutral-400">{desc}</p>}
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950 transition-all"
      />
    </div>
  );
}

function Select({ label, desc, children, ...props }: { label: string; desc?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      {desc && <p className="text-xs text-neutral-400">{desc}</p>}
      <select
        {...props}
        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all"
      >
        {children}
      </select>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-5">
      <div>
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</p>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────

// 1. Профіль
function ProfileTab() {
  const [name, setName] = useState("Ігор Стефанів");
  const [email] = useState("igor@example.com");
  const [phone, setPhone] = useState("+380 99 123 45 67");
  const [birthday, setBirthday] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <Section title="Особисті дані">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-500 text-2xl font-bold shrink-0">
            {name[0]}
          </div>
          <div>
            <button className="text-sm font-medium text-orange-400 hover:text-orange-500 transition-colors">
              Завантажити фото
            </button>
            <p className="text-xs text-neutral-400 mt-0.5">JPG, PNG до 5 МБ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Повне ім'я" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ім'я Прізвище" />
          <Input label="Дата народження" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email" type="email" value={email} readOnly className="opacity-60 cursor-not-allowed" />
          <Input label="Телефон" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380..." />
        </div>

        <button className="px-5 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">
          Зберегти зміни
        </button>
      </Section>

      <Section title="Зміна пароля">
        <Input label="Поточний пароль" type={showPassword ? "text" : "password"} placeholder="••••••••" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Новий пароль" type={showPassword ? "text" : "password"} placeholder="Мінімум 8 символів" />
          <Input label="Підтвердити пароль" type={showPassword ? "text" : "password"} placeholder="Повторіть пароль" />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-neutral-500 cursor-pointer">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="rounded" />
            Показати пароль
          </label>
          <button className="px-5 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">
            Змінити пароль
          </button>
        </div>
      </Section>
    </div>
  );
}

// 2. Вигляд & Функціонал
function AppearanceTab() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [currency, setCurrency] = useState("UAH");
  const [modules, setModules] = useState({
    budget: true,
    household: false,
    collections: false,
    crypto: false,
    envelopes: false,
  });

  function applyTheme(t: "light" | "dark" | "system") {
    setTheme(t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (t === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      localStorage.removeItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }

  const moduleList = [
    { key: "budget", label: "Особистий бюджет", desc: "Доходи, витрати, категорії", required: true },
    { key: "household", label: "Сімейний бюджет", desc: "Спільний бюджет з родиною" },
    { key: "envelopes", label: "Конверти", desc: "Розподіл бюджету по конвертах" },
    { key: "collections", label: "Колекції", desc: "Нумізматика, антикваріат, мистецтво" },
    { key: "crypto", label: "Крипто & Метали", desc: "Bitcoin, золото, срібло" },
  ];

  return (
    <div className="space-y-4">
      <Section title="Тема оформлення" desc="Визначає зовнішній вигляд додатку">
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: "light", label: "Світла", icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" },
            { val: "dark", label: "Темна", icon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" },
            { val: "system", label: "Системна", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          ].map(({ val, label, icon }) => (
            <button
              key={val}
              onClick={() => applyTheme(val as "light" | "dark" | "system")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === val
                  ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30"
                  : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"
              }`}
            >
              <Icon d={icon} className={`w-5 h-5 ${theme === val ? "text-orange-400" : "text-neutral-400"}`} />
              <span className={`text-sm font-medium ${theme === val ? "text-orange-500" : "text-neutral-600 dark:text-neutral-400"}`}>{label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Базова валюта" desc="Всі суми відображаються в цій валюті">
        <Select label="Валюта" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="UAH">₴ UAH — Гривня</option>
          <option value="USD">$ USD — Долар</option>
          <option value="EUR">€ EUR — Євро</option>
        </Select>
      </Section>

      <Section title="Модулі" desc="Увімкніть або вимкніть розділи додатку">
        <div className="space-y-4 divide-y divide-neutral-50 dark:divide-neutral-800">
          {moduleList.map(({ key, label, desc, required }) => (
            <div key={key} className="pt-4 first:pt-0">
              <ToggleRow
                label={label}
                desc={required ? `${desc} · обов'язковий` : desc}
                checked={modules[key as keyof typeof modules]}
                onChange={(v) => !required && setModules((m) => ({ ...m, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// 3. Сім'я
function FamilyTab() {
  const [mode, setMode] = useState<"solo" | "family">("solo");
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const members = [
    { name: "Ігор Стефанів", email: "igor@example.com", role: "Власник", status: "active" },
    { name: "Софія Стефанів", email: "sofia@example.com", role: "Член сім'ї", status: "pending" },
  ];

  function copyLink() {
    navigator.clipboard.writeText("https://ubudget.app/invite/abc123xyz");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <Section title="Режим використання">
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: "solo", label: "Соло", desc: "Тільки ви", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
            { val: "family", label: "Сімейний", desc: "Ви + члени сім'ї", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
          ].map(({ val, label, desc, icon }) => (
            <button
              key={val}
              onClick={() => setMode(val as "solo" | "family")}
              className={`flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                mode === val
                  ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30"
                  : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"
              }`}
            >
              <Icon d={icon} className={`w-5 h-5 ${mode === val ? "text-orange-400" : "text-neutral-400"}`} />
              <div>
                <p className={`text-sm font-semibold ${mode === val ? "text-orange-500" : "text-neutral-800 dark:text-neutral-200"}`}>{label}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {mode === "family" && (
        <>
          <Section title="Запросити члена сім'ї" desc="Вони отримають доступ до спільного сімейного бюджету">
            <div className="space-y-3">
              <Input
                label="Email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
              />
              <button className="w-full py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">
                Надіслати запрошення
              </button>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-xs font-medium text-neutral-500 mb-2">Або поділіться посиланням</p>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-500 truncate">
                  ubudget.app/invite/abc123xyz
                </div>
                <button
                  onClick={copyLink}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    copied
                      ? "bg-green-100 dark:bg-green-950/30 text-green-600"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {copied ? "✓ Скопійовано" : "Копіювати"}
                </button>
              </div>
            </div>
          </Section>

          <Section title="Члени сім'ї">
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.email} className="flex items-center justify-between py-2 border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-500 text-xs font-bold shrink-0">
                      {m.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{m.name}</p>
                      <p className="text-xs text-neutral-400">{m.email} · {m.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.status === "active"
                        ? "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400"
                        : "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                    }`}>
                      {m.status === "active" ? "Активний" : "Очікує"}
                    </span>
                    {m.role !== "Власник" && (
                      <button className="w-7 h-7 rounded-lg text-neutral-300 dark:text-neutral-700 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center transition-colors">
                        <Icon d="M6 18L18 6M6 6l12 12" className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

// 4. Сповіщення
function NotificationsTab() {
  const [email, setEmail] = useState({ weekly: true, monthly: true, tips: false });
  const [reminders, setReminders] = useState({
    payments: true,
    noIncome: true,
    budgetOver: true,
    goals: false,
  });

  return (
    <div className="space-y-4">
      <Section title="Email розсилка" desc="Фінансові звіти на вашу пошту">
        <div className="space-y-4 divide-y divide-neutral-50 dark:divide-neutral-800">
          <ToggleRow label="Щотижневий звіт" desc="Підсумок тижня щонеділі" checked={email.weekly} onChange={(v) => setEmail((s) => ({ ...s, weekly: v }))} />
          <div className="pt-4"><ToggleRow label="Щомісячний звіт" desc="Детальний звіт в кінці місяця" checked={email.monthly} onChange={(v) => setEmail((s) => ({ ...s, monthly: v }))} /></div>
          <div className="pt-4"><ToggleRow label="Поради та лайфхаки" desc="Корисні фінансові поради" checked={email.tips} onChange={(v) => setEmail((s) => ({ ...s, tips: v }))} /></div>
        </div>
      </Section>

      <Section title="Нагадування" desc="Сповіщення про важливі події">
        <div className="space-y-4 divide-y divide-neutral-50 dark:divide-neutral-800">
          <ToggleRow label="Платежі та кредити" desc="Нагадування перед датою платежу" checked={reminders.payments} onChange={(v) => setReminders((s) => ({ ...s, payments: v }))} />
          <div className="pt-4"><ToggleRow label="Дні без доходу" desc="Якщо дохід не вносився більше 30 днів" checked={reminders.noIncome} onChange={(v) => setReminders((s) => ({ ...s, noIncome: v }))} /></div>
          <div className="pt-4"><ToggleRow label="Перевищення бюджету" desc="Коли витрати перевищують план" checked={reminders.budgetOver} onChange={(v) => setReminders((s) => ({ ...s, budgetOver: v }))} /></div>
          <div className="pt-4"><ToggleRow label="Прогрес цілей" desc="Щомісячний звіт по фінансових цілях" checked={reminders.goals} onChange={(v) => setReminders((s) => ({ ...s, goals: v }))} /></div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button className="px-5 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">
          Зберегти
        </button>
      </div>
    </div>
  );
}

// 5. Безпека & Дані
function SecurityTab() {
  const [resetInput, setResetInput] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [inviteValue, setInviteValue] = useState("");

  const logs = [
    { action: "Вхід", device: "Chrome · Windows", location: "Стрий, UA", time: "Сьогодні, 14:23" },
    { action: "Вхід", device: "Safari · iPhone", location: "Львів, UA", time: "Вчора, 09:41" },
    { action: "Зміна пароля", device: "Chrome · Windows", location: "Стрий, UA", time: "3 дні тому" },
    { action: "Вхід", device: "Chrome · Windows", location: "Стрий, UA", time: "5 днів тому" },
  ];

  const actions = [
    { action: "Додав рахунок", detail: "Monobank · Дебетова", time: "Сьогодні, 13:10", type: "add" },
    { action: "Змінив баланс", detail: "Готівка · Гаманець", time: "Сьогодні, 11:45", type: "edit" },
    { action: "Видалив транзакцію", detail: "Сільпо · -840 грн", time: "Вчора, 18:22", type: "delete" },
    { action: "Додав ціль", detail: "Подорож до Туреччини", time: "Вчора, 10:05", type: "add" },
    { action: "Змінив бюджет", detail: "Продукти · 6 000 грн", time: "3 дні тому", type: "edit" },
  ];

  return (
    <div className="space-y-4">
      {/* Лог */}
      <Section title="Лог активності" desc="Останні входи у ваш акаунт">
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <Icon d={log.action === "Вхід" ? "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"} className="w-3.5 h-3.5 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{log.action}</p>
                  <p className="text-xs text-neutral-400">{log.device} · {log.location}</p>
                </div>
              </div>
              <span className="text-xs text-neutral-400 shrink-0 ml-2">{log.time}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Останні дії */}
      <Section title="Останні дії" desc="Що ви додавали, змінювали або видаляли">
        <div className="space-y-1">
          {actions.map((a, i) => {
            const colors = {
              add: "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400",
              edit: "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
              delete: "bg-red-100 dark:bg-red-950/30 text-red-500 dark:text-red-400",
            };
            const labels = { add: "Додав", edit: "Змінив", delete: "Видалив" };
            return (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 ${colors[a.type as keyof typeof colors]}`}>
                    {labels[a.type as keyof typeof labels]}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{a.action}</p>
                    <p className="text-xs text-neutral-400">{a.detail}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 shrink-0 ml-2">{a.time}</span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Запросити */}
      <Section title="Запросити друга" desc="Поділіться UBudget з друзями">
        <div className="flex gap-2">
          <input
            value={inviteValue}
            onChange={(e) => setInviteValue(e.target.value)}
            placeholder="Email або телефон"
            className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 transition-all"
          />
          <button className="px-4 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors">
            Запросити
          </button>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
          <span className="text-xs text-neutral-400">або</span>
          <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-400 truncate">
            ubudget.app/ref/igor123
          </div>
          <button className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            Копіювати
          </button>
        </div>
      </Section>

      {/* Обнулити */}
      <Section title="Небезпечна зона">
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="w-full py-2.5 rounded-xl border-2 border-red-200 dark:border-red-900/50 text-red-500 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            Обнулити фінансові дані
          </button>
        ) : (
          <div className="space-y-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
            <div className="flex items-start gap-3">
              <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Увага!</p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                  Буде видалено всі рахунки, транзакції, бюджети та цілі. Профіль залишиться. Сімейний бюджет з іншими учасниками не буде зачеплений.
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-red-600 dark:text-red-400">
                Введіть <span className="font-bold">ОБНУЛИТИ</span> для підтвердження
              </label>
              <input
                value={resetInput}
                onChange={(e) => setResetInput(e.target.value)}
                placeholder="ОБНУЛИТИ"
                className="w-full px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-red-400 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowReset(false); setResetInput(""); }}
                className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Скасувати
              </button>
              <button
                disabled={resetInput !== "ОБНУЛИТИ"}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
              >
                Обнулити
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── TABS CONFIG ──────────────────────────────────────────────
const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "profile", label: "Профіль", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "appearance", label: "Вигляд", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
  { id: "family", label: "Сім'я", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: "notifications", label: "Сповіщення", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { id: "security", label: "Безпека", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

// ─── PAGE ─────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Налаштування</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Керуйте своїм акаунтом та перевагами</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl overflow-x-auto">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === id
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <Icon d={icon} className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "appearance" && <AppearanceTab />}
        {activeTab === "family" && <FamilyTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "security" && <SecurityTab />}
      </div>
    </div>
  );
}