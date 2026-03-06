/**
 * @file app/(app)/settings/page.tsx
 * @description Сторінка налаштувань з 5 табами:
 * Профіль, Вигляд, Сім'я, Сповіщення, Безпека & Дані.
 *
 * Рефакторинг: замінено локальні Toggle/Input/Select/Icon
 * на компоненти з @/components/ui
 */

"use client";

import { useState } from "react";
import { Icon, icons, Input, Select, Toggle, ToggleRow, Card, Button, Badge } from "@/components/ui";

type Tab = "profile" | "appearance" | "family" | "notifications" | "security";

// ─── Section ──────────────────────────────────────────────────

/**
 * Секція з заголовком і опціональним описом.
 * Обгортає Card з відступами.
 */
function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-5">
      <div>
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      {children}
    </Card>
  );
}

// ─── 1. Профіль ───────────────────────────────────────────────

function ProfileTab() {
  const [name, setName]               = useState("Ігор Стефанів");
  const [email]                       = useState("igor@example.com");
  const [phone, setPhone]             = useState("+380 99 123 45 67");
  const [birthday, setBirthday]       = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <Section title="Особисті дані">
        {/* Аватар */}
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
          <Input label="Повне ім'я" value={name} onChange={e => setName(e.target.value)} placeholder="Ім'я Прізвище" />
          <Input label="Дата народження" type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email" type="email" value={email} readOnly hint="Email не можна змінити" />
          <Input label="Телефон" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+380..." />
        </div>

        <Button>Зберегти зміни</Button>
      </Section>

      <Section title="Зміна пароля">
        <Input label="Поточний пароль" type={showPassword ? "text" : "password"} placeholder="••••••••" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Новий пароль" type={showPassword ? "text" : "password"} placeholder="Мінімум 8 символів" />
          <Input label="Підтвердити пароль" type={showPassword ? "text" : "password"} placeholder="Повторіть пароль" />
        </div>
        <div className="flex items-center justify-between">
          <ToggleRow label="Показати пароль" checked={showPassword} onChange={setShowPassword} />
          <Button>Змінити пароль</Button>
        </div>
      </Section>
    </div>
  );
}

// ─── 2. Вигляд ────────────────────────────────────────────────

function AppearanceTab() {
  const [theme, setTheme]   = useState<"light" | "dark" | "system">("system");
  const [currency, setCurrency] = useState("UAH");
  const [modules, setModules] = useState({
    budget: true, household: false, collections: false, crypto: false, envelopes: false,
  });

  /** Застосовує тему і зберігає в localStorage */
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
    { key: "budget",      label: "Особистий бюджет", desc: "Доходи, витрати, категорії",      required: true },
    { key: "household",   label: "Сімейний бюджет",  desc: "Спільний бюджет з родиною" },
    { key: "envelopes",   label: "Конверти",          desc: "Розподіл бюджету по конвертах" },
    { key: "collections", label: "Колекції",          desc: "Нумізматика, антикваріат, мистецтво" },
    { key: "crypto",      label: "Крипто & Метали",   desc: "Bitcoin, золото, срібло" },
  ];

  const themeOptions = [
    { val: "light",  label: "Світла",   icon: icons.sun },
    { val: "dark",   label: "Темна",    icon: icons.moon },
    { val: "system", label: "Системна", icon: icons.settings },
  ];

  return (
    <div className="space-y-4">
      <Section title="Тема оформлення" desc="Визначає зовнішній вигляд додатку">
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(({ val, label, icon }) => (
            <button key={val} onClick={() => applyTheme(val as typeof theme)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === val
                  ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30"
                  : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"
              }`}>
              <Icon d={icon} className={`w-5 h-5 ${theme === val ? "text-orange-400" : "text-neutral-400"}`} />
              <span className={`text-sm font-medium ${theme === val ? "text-orange-500" : "text-neutral-600 dark:text-neutral-400"}`}>{label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Базова валюта" desc="Всі суми відображаються в цій валюті">
        <Select
          label="Валюта"
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          options={[
            { value: "UAH", label: "₴ UAH — Гривня" },
            { value: "USD", label: "$ USD — Долар" },
            { value: "EUR", label: "€ EUR — Євро" },
          ]}
        />
      </Section>

      <Section title="Модулі" desc="Увімкніть або вимкніть розділи додатку">
        <div className="space-y-4 divide-y divide-neutral-50 dark:divide-neutral-800">
          {moduleList.map(({ key, label, desc, required }) => (
            <div key={key} className="pt-4 first:pt-0">
              <ToggleRow
                label={label}
                desc={required ? `${desc} · обов'язковий` : desc}
                checked={modules[key as keyof typeof modules]}
                onChange={v => !required && setModules(m => ({ ...m, [key]: v }))}
                disabled={required}
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── 3. Сім'я ─────────────────────────────────────────────────

function FamilyTab() {
  const [mode, setMode]             = useState<"solo" | "family">("solo");
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied]         = useState(false);

  const members = [
    { name: "Ігор Стефанів",  email: "igor@example.com",  role: "Власник",     status: "active"  },
    { name: "Софія Стефанів", email: "sofia@example.com", role: "Член сім'ї",  status: "pending" },
  ];

  function copyLink() {
    navigator.clipboard.writeText("https://ubudget.app/invite/abc123xyz");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const modeOptions = [
    { val: "solo",   label: "Соло",     desc: "Тільки ви",            icon: icons.user },
    { val: "family", label: "Сімейний", desc: "Ви + члени сім'ї",     icon: icons.home },
  ];

  return (
    <div className="space-y-4">
      <Section title="Режим використання">
        <div className="grid grid-cols-2 gap-3">
          {modeOptions.map(({ val, label, desc, icon }) => (
            <button key={val} onClick={() => setMode(val as typeof mode)}
              className={`flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                mode === val
                  ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30"
                  : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"
              }`}>
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
            <Input label="Email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.com" />
            <Button fullWidth>Надіслати запрошення</Button>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-xs font-medium text-neutral-500 mb-2">Або поділіться посиланням</p>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-500 truncate">
                  ubudget.app/invite/abc123xyz
                </div>
                <Button variant={copied ? "secondary" : "secondary"} onClick={copyLink}>
                  {copied ? "✓ Скопійовано" : "Копіювати"}
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Члени сім'ї">
            <div className="space-y-1">
              {members.map(m => (
                <div key={m.email} className="flex items-center justify-between py-2.5 border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
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
                    <Badge color={m.status === "active" ? "green" : "amber"}>
                      {m.status === "active" ? "Активний" : "Очікує"}
                    </Badge>
                    {m.role !== "Власник" && (
                      <Button variant="ghost" size="sm">
                        <Icon d={icons.close} className="w-3.5 h-3.5" />
                      </Button>
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

// ─── 4. Сповіщення ────────────────────────────────────────────

function NotificationsTab() {
  const [email, setEmail]         = useState({ weekly: true, monthly: true, tips: false });
  const [reminders, setReminders] = useState({ payments: true, noIncome: true, budgetOver: true, goals: false });

  return (
    <div className="space-y-4">
      <Section title="Email розсилка" desc="Фінансові звіти на вашу пошту">
        <div className="space-y-4 divide-y divide-neutral-50 dark:divide-neutral-800">
          <ToggleRow label="Щотижневий звіт"    desc="Підсумок тижня щонеділі"              checked={email.weekly}   onChange={v => setEmail(s => ({ ...s, weekly: v }))} />
          <div className="pt-4"><ToggleRow label="Щомісячний звіт"   desc="Детальний звіт в кінці місяця"          checked={email.monthly}  onChange={v => setEmail(s => ({ ...s, monthly: v }))} /></div>
          <div className="pt-4"><ToggleRow label="Поради та лайфхаки" desc="Корисні фінансові поради"              checked={email.tips}     onChange={v => setEmail(s => ({ ...s, tips: v }))} /></div>
        </div>
      </Section>

      <Section title="Нагадування" desc="Сповіщення про важливі події">
        <div className="space-y-4 divide-y divide-neutral-50 dark:divide-neutral-800">
          <ToggleRow label="Платежі та кредити"    desc="Нагадування перед датою платежу"                  checked={reminders.payments}   onChange={v => setReminders(s => ({ ...s, payments: v }))} />
          <div className="pt-4"><ToggleRow label="Дні без доходу"       desc="Якщо дохід не вносився більше 30 днів"   checked={reminders.noIncome}   onChange={v => setReminders(s => ({ ...s, noIncome: v }))} /></div>
          <div className="pt-4"><ToggleRow label="Перевищення бюджету"  desc="Коли витрати перевищують план"           checked={reminders.budgetOver} onChange={v => setReminders(s => ({ ...s, budgetOver: v }))} /></div>
          <div className="pt-4"><ToggleRow label="Прогрес цілей"        desc="Щомісячний звіт по фінансових цілях"    checked={reminders.goals}      onChange={v => setReminders(s => ({ ...s, goals: v }))} /></div>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button>Зберегти</Button>
      </div>
    </div>
  );
}

// ─── 5. Безпека & Дані ────────────────────────────────────────

function SecurityTab() {
  const [resetInput, setResetInput] = useState("");
  const [showReset, setShowReset]   = useState(false);
  const [inviteValue, setInviteValue] = useState("");

  const logs = [
    { action: "Вхід",         device: "Chrome · Windows", location: "Стрий, UA",  time: "Сьогодні, 14:23" },
    { action: "Вхід",         device: "Safari · iPhone",  location: "Львів, UA",  time: "Вчора, 09:41" },
    { action: "Зміна пароля", device: "Chrome · Windows", location: "Стрий, UA",  time: "3 дні тому" },
  ];

  const actions = [
    { action: "Додав рахунок",     detail: "Monobank · Дебетова",   time: "Сьогодні, 13:10", type: "add" },
    { action: "Змінив баланс",     detail: "Готівка · Гаманець",    time: "Сьогодні, 11:45", type: "edit" },
    { action: "Видалив транзакцію",detail: "Сільпо · -840 грн",     time: "Вчора, 18:22",    type: "delete" },
    { action: "Додав ціль",        detail: "Подорож до Туреччини",  time: "Вчора, 10:05",    type: "add" },
  ];

  const actionColors = {
    add:    "green" as const,
    edit:   "blue"  as const,
    delete: "red"   as const,
  };
  const actionLabels = { add: "Додав", edit: "Змінив", delete: "Видалив" };

  return (
    <div className="space-y-4">
      {/* Лог входів */}
      <Section title="Лог активності" desc="Останні входи у ваш акаунт">
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <Icon d={log.action === "Вхід" ? icons.logout : icons.lock} className="w-3.5 h-3.5 text-neutral-400" />
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
          {actions.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
              <div className="flex items-center gap-3">
                <Badge color={actionColors[a.type as keyof typeof actionColors]}>
                  {actionLabels[a.type as keyof typeof actionLabels]}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{a.action}</p>
                  <p className="text-xs text-neutral-400">{a.detail}</p>
                </div>
              </div>
              <span className="text-xs text-neutral-400 shrink-0 ml-2">{a.time}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Запросити друга */}
      <Section title="Запросити друга" desc="Поділіться UBudget з друзями">
        <div className="flex gap-2">
          <Input value={inviteValue} onChange={e => setInviteValue(e.target.value)} placeholder="Email або телефон" />
          <Button>Запросити</Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
          <span className="text-xs text-neutral-400">або</span>
          <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-400 truncate">
            ubudget.app/ref/igor123
          </div>
          <Button variant="secondary">Копіювати</Button>
        </div>
      </Section>

      {/* Небезпечна зона */}
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
              <Icon d={icons.warn} className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Увага!</p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                  Буде видалено всі рахунки, транзакції, бюджети та цілі. Профіль залишиться.
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-red-600 dark:text-red-400">
                Введіть <span className="font-bold">ОБНУЛИТИ</span> для підтвердження
              </label>
              <Input
                value={resetInput}
                onChange={e => setResetInput(e.target.value)}
                placeholder="ОБНУЛИТИ"
                className="border-red-200 dark:border-red-800 focus:border-red-400"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => { setShowReset(false); setResetInput(""); }}>
                Скасувати
              </Button>
              <Button variant="danger" fullWidth disabled={resetInput !== "ОБНУЛИТИ"}>
                Обнулити
              </Button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Tabs config ──────────────────────────────────────────────

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "profile",       label: "Профіль",     icon: icons.user },
  { id: "appearance",    label: "Вигляд",      icon: icons.sun },
  { id: "family",        label: "Сім'я",       icon: icons.home },
  { id: "notifications", label: "Сповіщення",  icon: icons.warn },
  { id: "security",      label: "Безпека",     icon: icons.lock },
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

      {/* Таби */}
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

      {/* Контент табу */}
      <div>
        {activeTab === "profile"       && <ProfileTab />}
        {activeTab === "appearance"    && <AppearanceTab />}
        {activeTab === "family"        && <FamilyTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "security"      && <SecurityTab />}
      </div>
    </div>
  );
}