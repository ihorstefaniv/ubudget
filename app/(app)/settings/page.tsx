"use client";

import { useState, useEffect } from "react";
import { Icon, icons, Input, Select, Toggle, ToggleRow, Card, Button, Badge } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type Tab = "profile" | "appearance" | "notifications" | "security";

// ─── Section ──────────────────────────────────────────────────
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
  const supabase = createClient();

  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [phone, setPhone]             = useState("");
  const [birthday, setBirthday]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [pwdMsg, setPwdMsg]           = useState("");
  const [pwdSaving, setPwdSaving]     = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles").select("full_name, phone, birthday").eq("id", data.user.id).single();
      if (profile) {
        setName(profile.full_name ?? "");
        setPhone(profile.phone ?? "");
        setBirthday(profile.birthday ?? "");
      }
    });
  }, []);

  async function handleSaveProfile() {
    setSaving(true); setSaveMsg("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setSaving(false); return; }
    const { error } = await supabase.from("profiles")
      .update({ full_name: name.trim(), phone: phone.trim(), birthday: birthday || null })
      .eq("id", data.user.id);
    setSaveMsg(error ? `Помилка: ${error.message}` : "Збережено");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  async function handleChangePassword() {
    if (!newPwd || newPwd !== confirmPwd) { setPwdMsg("Паролі не збігаються"); return; }
    if (newPwd.length < 8) { setPwdMsg("Мінімум 8 символів"); return; }
    setPwdSaving(true); setPwdMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setPwdMsg(error ? "Помилка: " + error.message : "Пароль змінено");
    setPwdSaving(false);
    if (!error) { setNewPwd(""); setConfirmPwd(""); }
    setTimeout(() => setPwdMsg(""), 4000);
  }

  return (
    <div className="space-y-4">
      <Section title="Особисті дані">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-500 text-2xl font-bold shrink-0">
            {name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{name || "Ім'я не задано"}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{email}</p>
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
        <div className="flex items-center gap-3">
          <Button onClick={handleSaveProfile} disabled={saving}>{saving ? "Збереження..." : "Зберегти зміни"}</Button>
          {saveMsg && <span className={`text-sm ${saveMsg === "Збережено" ? "text-green-500" : "text-red-500"}`}>{saveMsg}</span>}
        </div>
      </Section>

      <Section title="Зміна пароля">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Новий пароль" type={showPassword ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Мінімум 8 символів" />
          <Input label="Підтвердити пароль" type={showPassword ? "text" : "password"} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Повторіть пароль" />
        </div>
        <div className="flex items-center justify-between">
          <ToggleRow label="Показати пароль" checked={showPassword} onChange={setShowPassword} />
          <div className="flex items-center gap-3">
            {pwdMsg && <span className={`text-sm ${pwdMsg.startsWith("Помилка") ? "text-red-500" : "text-green-500"}`}>{pwdMsg}</span>}
            <Button onClick={handleChangePassword} disabled={pwdSaving}>{pwdSaving ? "Збереження..." : "Змінити пароль"}</Button>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ─── 2. Вигляд ────────────────────────────────────────────────
type Modules = { budget: boolean; household: boolean; envelopes: boolean; investments: boolean; credits: boolean };

function AppearanceTab() {
  const supabase = createClient();
  const [theme, setTheme]               = useState<"light" | "dark" | "system">("system");
  const [currency, setCurrency]         = useState("UAH");
  const [envelopeMode, setEnvelopeMode] = useState(false);
  const [modules, setModules]           = useState<Modules>({
    budget: true, household: true, envelopes: true, investments: true, credits: true,
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    // Тема з localStorage
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
    else setTheme("system");

    // Профільні налаштування з БД
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles").select("currency, modules, envelope_mode").eq("id", data.user.id).single();
      if (profile) {
        if (profile.currency) setCurrency(profile.currency);
        if (profile.modules)  setModules({ ...modules, ...profile.modules });
        setEnvelopeMode(profile.envelope_mode ?? false);
      }
    });
  }, []);

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

  async function saveProfile() {
    setSaving(true); setSaveMsg("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setSaving(false); return; }
    const { error } = await supabase.from("profiles")
      .update({ currency, modules, envelope_mode: envelopeMode }).eq("id", data.user.id);
    setSaveMsg(error ? `Помилка: ${error.message}` : "Збережено");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  const moduleList: { key: keyof Modules; label: string; desc: string; required?: boolean }[] = [
    { key: "budget",      label: "Бюджет",             desc: "Планування план/факт по категоріях", required: true },
    { key: "credits",     label: "Кредити & Депозити", desc: "Кредити, розстрочки, депозити" },
    { key: "investments", label: "Інвестиції",          desc: "Акції, облігації, ETF" },
    { key: "envelopes",   label: "Конверти",            desc: "Метод конвертів для розподілу бюджету" },
    { key: "household",   label: "Сімейний бюджет",    desc: "Спільний бюджет з родиною" },
  ];

  const themeOptions = [
    { val: "light",  label: "Світла",   icon: icons.sun },
    { val: "dark",   label: "Темна",    icon: icons.moon },
    { val: "system", label: "Системна", icon: icons.settings },
  ];

  return (
    <div className="space-y-4">
      <Section title="Тема оформлення">
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(({ val, label, icon }) => (
            <button key={val} onClick={() => applyTheme(val as typeof theme)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === val ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30"
                : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"}`}>
              <Icon d={icon} className={`w-5 h-5 ${theme === val ? "text-orange-400" : "text-neutral-400"}`} />
              <span className={`text-sm font-medium ${theme === val ? "text-orange-500" : "text-neutral-600 dark:text-neutral-400"}`}>{label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Базова валюта" desc="Всі суми відображаються в цій валюті">
        <Select label="Валюта" value={currency} onChange={e => setCurrency(e.target.value)}
          options={[
            { value: "UAH", label: "₴ UAH — Гривня" },
            { value: "USD", label: "$ USD — Долар" },
            { value: "EUR", label: "€ EUR — Євро" },
          ]} />
      </Section>

      <Section title="Бюджетування">
        <ToggleRow
          label="Метод конвертів"
          desc="Розподіл доходу на обов'язкові + тижневі конверти. План у Бюджеті береться з конвертів."
          checked={envelopeMode}
          onChange={v => setEnvelopeMode(v)}
        />
      </Section>

      <Section title="Модулі" desc="Увімкніть або вимкніть розділи — вони зникнуть з навігації">
        <div className="space-y-4 divide-y divide-neutral-50 dark:divide-neutral-800">
          {moduleList.map(({ key, label, desc, required }, i) => (
            <div key={key} className={i > 0 ? "pt-4" : ""}>
              <ToggleRow
                label={label}
                desc={required ? `${desc} · обов'язковий` : desc}
                checked={modules[key]}
                onChange={v => !required && setModules(m => ({ ...m, [key]: v }))}
                disabled={required}
              />
            </div>
          ))}
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <Button onClick={saveProfile} disabled={saving}>{saving ? "Збереження..." : "Зберегти"}</Button>
        {saveMsg && <span className={`text-sm ${saveMsg === "Збережено" ? "text-green-500" : "text-red-500"}`}>{saveMsg}</span>}
      </div>
    </div>
  );
}

// ─── 3. Сповіщення ────────────────────────────────────────────
type NotifState = {
  weekly: boolean; monthly: boolean; tips: boolean;
  payments: boolean; noIncome: boolean; budgetOver: boolean; goals: boolean;
};

function NotificationsTab() {
  const supabase = createClient();
  const [notif, setNotif] = useState<NotifState>({
    weekly: true, monthly: true, tips: false,
    payments: true, noIncome: true, budgetOver: true, goals: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles").select("notifications").eq("id", data.user.id).single();
      if (profile?.notifications) setNotif(n => ({ ...n, ...profile.notifications }));
    });
  }, []);

  async function save() {
    setSaving(true); setSaveMsg("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setSaving(false); return; }
    const { error } = await supabase.from("profiles")
      .update({ notifications: notif }).eq("id", data.user.id);
    setSaveMsg(error ? `Помилка: ${error.message}` : "Збережено");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  const toggle = (key: keyof NotifState) => setNotif(s => ({ ...s, [key]: !s[key] }));

  return (
    <div className="space-y-4">
      <Section title="Email розсилка" desc="Фінансові звіти на вашу пошту">
        <div className="space-y-4 divide-y divide-neutral-50 dark:divide-neutral-800">
          <ToggleRow label="Щотижневий звіт"    desc="Підсумок тижня щонеділі"            checked={notif.weekly}   onChange={() => toggle("weekly")} />
          <div className="pt-4"><ToggleRow label="Щомісячний звіт"   desc="Детальний звіт в кінці місяця"      checked={notif.monthly}  onChange={() => toggle("monthly")} /></div>
          <div className="pt-4"><ToggleRow label="Поради та лайфхаки" desc="Корисні фінансові поради"          checked={notif.tips}     onChange={() => toggle("tips")} /></div>
        </div>
      </Section>

      <Section title="Нагадування" desc="Сповіщення про важливі події">
        <div className="space-y-4 divide-y divide-neutral-50 dark:divide-neutral-800">
          <ToggleRow label="Платежі та кредити"   desc="Нагадування перед датою платежу"          checked={notif.payments}   onChange={() => toggle("payments")} />
          <div className="pt-4"><ToggleRow label="Дні без доходу"      desc="Якщо дохід не вносився більше 30 днів"  checked={notif.noIncome}   onChange={() => toggle("noIncome")} /></div>
          <div className="pt-4"><ToggleRow label="Перевищення бюджету" desc="Коли витрати перевищують план"          checked={notif.budgetOver} onChange={() => toggle("budgetOver")} /></div>
          <div className="pt-4"><ToggleRow label="Прогрес цілей"       desc="Щомісячний звіт по фінансових цілях"   checked={notif.goals}      onChange={() => toggle("goals")} /></div>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "Збереження..." : "Зберегти"}</Button>
        {saveMsg && <span className={`text-sm ${saveMsg === "Збережено" ? "text-green-500" : "text-red-500"}`}>{saveMsg}</span>}
        <span className="text-xs text-neutral-400">Налаштування зберігаються для майбутньої системи сповіщень</span>
      </div>
    </div>
  );
}

// ─── 4. Безпека & Дані ────────────────────────────────────────
function SecurityTab() {
  const supabase = createClient();
  const [resetInput, setResetInput] = useState("");
  const [showReset, setShowReset]   = useState(false);
  const [resetting, setResetting]   = useState(false);
  const [resetMsg, setResetMsg]     = useState("");

  async function handleReset() {
    if (resetInput !== "ОБНУЛИТИ") return;
    setResetting(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setResetting(false); return; }
    const uid = data.user.id;

    try {
      // Видаляємо всі дані юзера по всіх таблицях
      await Promise.all([
        supabase.from("transactions").delete().eq("user_id", uid),
        supabase.from("accounts").delete().eq("user_id", uid),
        supabase.from("budgets").delete().eq("user_id", uid),
        supabase.from("credits").delete().eq("user_id", uid),
        supabase.from("envelope_settings").delete().eq("user_id", uid),
        supabase.from("envelope_weeks").delete().eq("user_id", uid),
        supabase.from("envelope_income_sources").delete().eq("user_id", uid),
      ]);
      // Категорії (merchants і subcategories каскадно)
      await supabase.from("merchants").delete().in("category_id",
        (await supabase.from("categories").select("id").eq("user_id", uid)).data?.map(c => c.id) ?? []
      );
      await supabase.from("subcategories").delete().eq("user_id", uid);
      await supabase.from("categories").delete().eq("user_id", uid);

      setResetMsg("Дані видалено");
      setShowReset(false);
      setResetInput("");
    } catch {
      setResetMsg("Помилка при видаленні");
    }
    setResetting(false);
    setTimeout(() => setResetMsg(""), 5000);
  }

  return (
    <div className="space-y-4">
      <Section title="Сесії та доступ" desc="Управління активними сесіями">
        <div className="py-6 text-center">
          <p className="text-sm text-neutral-400">Лог активних сесій буде доступний незабаром</p>
          <button onClick={() => supabase.auth.signOut()}
            className="mt-3 text-sm text-red-400 hover:text-red-500 font-medium transition-colors">
            Завершити всі сесії
          </button>
        </div>
      </Section>

      <Section title="Небезпечна зона">
        {resetMsg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${resetMsg === "Дані видалено" ? "bg-green-50 dark:bg-green-950/20 text-green-600" : "bg-red-50 dark:bg-red-950/20 text-red-600"}`}>
            {resetMsg}
          </div>
        )}
        {!showReset ? (
          <button onClick={() => setShowReset(true)}
            className="w-full py-2.5 rounded-xl border-2 border-red-200 dark:border-red-900/50 text-red-500 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            Обнулити фінансові дані
          </button>
        ) : (
          <div className="space-y-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
            <div className="flex items-start gap-3">
              <Icon d={icons.warn} className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Увага! Незворотна дія</p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                  Буде видалено: всі транзакції, рахунки, бюджети, кредити, категорії, конверти. Профіль залишиться.
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-red-600 dark:text-red-400">
                Введіть <span className="font-bold">ОБНУЛИТИ</span> для підтвердження
              </label>
              <Input value={resetInput} onChange={e => setResetInput(e.target.value)} placeholder="ОБНУЛИТИ" />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => { setShowReset(false); setResetInput(""); }}>
                Скасувати
              </Button>
              <Button variant="danger" fullWidth disabled={resetInput !== "ОБНУЛИТИ" || resetting}
                onClick={handleReset}>
                {resetting ? "Видалення..." : "Обнулити"}
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
  { id: "profile",       label: "Профіль",    icon: icons.user },
  { id: "appearance",    label: "Вигляд",     icon: icons.sun },
  { id: "notifications", label: "Сповіщення", icon: icons.warn },
  { id: "security",      label: "Безпека",    icon: icons.lock },
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

      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl overflow-x-auto">
        {tabs.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === id
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}>
            <Icon d={icon} className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "profile"       && <ProfileTab />}
        {activeTab === "appearance"    && <AppearanceTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "security"      && <SecurityTab />}
      </div>
    </div>
  );
}
