"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = "free" | "pro" | "business";

interface ApiKey {
  id: string;
  key: string;
  name: string;
  plan: Plan;
  is_active: boolean;
  requests_total: number;
  created_at: string;
  last_used_at: string | null;
}

type EndpointStatus = "checking" | "ok" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────

const OUR_APIS = [
  {
    method: "GET",
    path: "/api/nbu-rates",
    title: "Курси валют НБУ",
    description: "Офіційні курси USD, EUR, PLN, GBP, CHF від НБУ. Кешується щодня о 9:00. Без авторизації.",
    example: `curl https://ubudget.net/api/nbu-rates`,
    response: `{
  "USD": 41.80,
  "EUR": 45.20,
  "PLN": 10.35,
  "GBP": 52.10,
  "CHF": 46.50,
  "date": "2026-05-08",
  "source": "cache"
}`,
    public: true,
  },
  {
    method: "GET",
    path: "/api/fuel-prices",
    title: "Ціни на пальне",
    description: "Середні ціни на пальне по Україні (A-95, ДП, Газ). Дані по мережах і регіонах. Кешується щодня о 4:00.",
    example: `curl https://ubudget.net/api/fuel-prices`,
    response: `{
  "updatedAt": "08.05.2026",
  "source": "cache",
  "averages": { "A-95": 52.18, "ДП": 53.41, "Газ": 28.30 },
  "stations": [...],
  "regions": [...]
}`,
    public: true,
  },
];

const EXTERNAL_APIS = [
  {
    name: "НБУ Exchange API",
    url: "bank.gov.ua/NBU_Exchange",
    description: "Офіційний API Нацбанку. Безкоштовний, без ключів. Курси оновлюються щодня.",
    risk: "low",
    checkUrl: "/api/nbu-rates",
  },
  {
    name: "vseazs.com",
    url: "vseazs.com",
    description: "Скрапінг сторінки з цінами на пальне. Нестабільний — може зламатись при зміні верстки.",
    risk: "high",
    checkUrl: "/api/fuel-prices",
  },
];

const PLANS: {
  key: Plan;
  label: string;
  price: string;
  limit: string;
  sla: string;
  color: string;
  features: string[];
}[] = [
  {
    key: "free",
    label: "Free",
    price: "Безкоштовно",
    limit: "100 запитів/день",
    sla: "—",
    color: "bg-neutral-100 text-neutral-700",
    features: ["Курси валют", "Ціни на пальне", "Rate limit: 100/день"],
  },
  {
    key: "pro",
    label: "Pro",
    price: "$5 / місяць",
    limit: "10 000 запитів/день",
    sla: "99.9%",
    color: "bg-orange-100 text-orange-700",
    features: ["Всі Free API", "Пріоритетний кеш", "Email підтримка", "Webhook при оновленні"],
  },
  {
    key: "business",
    label: "Business",
    price: "$20 / місяць",
    limit: "Безліміт",
    sla: "99.99%",
    color: "bg-blue-100 text-blue-700",
    features: ["Всі Pro API", "Кастомні endpoint-и", "SLA договір", "Slack підтримка", "Доступ до isторії 1 рік"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genKey(): string {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  const hex = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
  return `ubk_${hex}`;
}

function maskKey(key: string): string {
  if (key.length < 12) return key;
  return key.slice(0, 10) + "••••••••••••" + key.slice(-4);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
}

function planBadge(plan: Plan) {
  return PLANS.find(p => p.key === plan)?.color ?? "";
}

// ─── Status indicator ─────────────────────────────────────────────────────────

function StatusDot({ status }: { status: EndpointStatus }) {
  if (status === "checking") return <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />;
  if (status === "ok")       return <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />;
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors px-2 py-1 rounded-lg hover:bg-neutral-100">
      {copied ? "✓ скопійовано" : "копіювати"}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApiPage() {
  const [tab, setTab]       = useState<"our" | "keys" | "external" | "monetize">("our");
  const [keys, setKeys]     = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [statuses, setStatuses]       = useState<Record<string, EndpointStatus>>({});
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [revealedKey, setRevealedKey]   = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId]   = useState<string | null>(null);

  const supabase = createClient();

  const loadKeys = useCallback(async () => {
    setLoadingKeys(true);
    const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
    setKeys(data ?? []);
    setLoadingKeys(false);
  }, [supabase]);

  // Check statuses for all external+our endpoints
  useEffect(() => {
    const checkAll = async () => {
      const endpoints = [
        ...OUR_APIS.map(a => a.path),
        ...EXTERNAL_APIS.map(a => a.checkUrl),
      ];
      const init: Record<string, EndpointStatus> = {};
      endpoints.forEach(p => { init[p] = "checking"; });
      setStatuses(init);

      await Promise.allSettled(
        endpoints.map(async (path) => {
          try {
            const res = await fetch(path, { signal: AbortSignal.timeout(5000) });
            setStatuses(prev => ({ ...prev, [path]: res.ok ? "ok" : "error" }));
          } catch {
            setStatuses(prev => ({ ...prev, [path]: "error" }));
          }
        })
      );
    };
    checkAll();
    loadKeys();
  }, [loadKeys]);

  function copyKey(key: ApiKey) {
    navigator.clipboard.writeText(key.key);
    setCopiedKeyId(key.id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  }

  async function toggleKey(key: ApiKey) {
    await supabase.from("api_keys").update({ is_active: !key.is_active }).eq("id", key.id);
    loadKeys();
  }

  async function deleteKey(id: string) {
    if (!confirm("Видалити ключ?")) return;
    await supabase.from("api_keys").delete().eq("id", id);
    loadKeys();
  }

  const tabs = [
    { key: "our",      label: "Наші API",      count: OUR_APIS.length },
    { key: "keys",     label: "Ключі доступу", count: keys.length },
    { key: "external", label: "Залежності",    count: EXTERNAL_APIS.length },
    { key: "monetize", label: "Монетизація",   count: null },
  ] as const;

  // Revenue estimate
  const proCount      = keys.filter(k => k.plan === "pro" && k.is_active).length;
  const businessCount = keys.filter(k => k.plan === "business" && k.is_active).length;
  const monthlyRevenue = proCount * 5 + businessCount * 20;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">API</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Управління ендпоінтами, ключами доступу та монетизацією</p>
        </div>
        {tab === "keys" && (
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Новий ключ
          </button>
        )}
        {tab === "monetize" && monthlyRevenue > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 text-right">
            <p className="text-xs text-green-600 font-medium">Потенційний дохід</p>
            <p className="text-lg font-bold text-green-700">${monthlyRevenue}/міс</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {t.label}
            {t.count !== null && (
              <span className={`ml-1.5 text-xs px-1.5 rounded-full ${
                tab === t.key ? "bg-neutral-100 text-neutral-600" : "bg-neutral-200 text-neutral-500"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OUR APIS ── */}
      {tab === "our" && (
        <div className="space-y-4">
          {OUR_APIS.map(api => (
            <div key={api.path} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-md">
                    {api.method}
                  </span>
                  <code className="text-sm font-mono text-neutral-800">{api.path}</code>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    api.public ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                  }`}>
                    {api.public ? "публічний" : "приватний"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status={statuses[api.path] ?? "checking"} />
                  <span className="text-xs text-neutral-400">
                    {statuses[api.path] === "ok" ? "онлайн" : statuses[api.path] === "error" ? "помилка" : "перевірка…"}
                  </span>
                </div>
              </div>

              <div className="px-6 pb-2">
                <p className="text-sm text-neutral-600">{api.description}</p>
              </div>

              <div className="px-6 pb-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-neutral-500">Приклад запиту</span>
                    <CopyBtn text={api.example} />
                  </div>
                  <pre className="bg-neutral-950 text-green-400 text-xs rounded-xl p-3 overflow-x-auto font-mono leading-relaxed">
                    {api.example}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-neutral-500">Приклад відповіді</span>
                    <CopyBtn text={api.response} />
                  </div>
                  <pre className="bg-neutral-950 text-blue-300 text-xs rounded-xl p-3 overflow-x-auto font-mono leading-relaxed">
                    {api.response}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── API KEYS ── */}
      {tab === "keys" && (
        <div className="space-y-4">
          {loadingKeys ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : keys.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-100 text-center py-12 text-neutral-400 text-sm">
              Ключів ще немає — натисніть «Новий ключ»
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500">Назва</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500">Ключ</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500">Тариф</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500">Запитів</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500">Створено</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500">Статус</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {keys.map(k => (
                    <tr key={k.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-neutral-800">{k.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-neutral-500">
                            {revealedKey === k.id ? k.key : maskKey(k.key)}
                          </code>
                          <button
                            onClick={() => setRevealedKey(revealedKey === k.id ? null : k.id)}
                            className="text-xs text-neutral-300 hover:text-neutral-500 transition-colors"
                          >
                            {revealedKey === k.id ? "сховати" : "показати"}
                          </button>
                          <button
                            onClick={() => copyKey(k)}
                            className="text-xs text-neutral-300 hover:text-neutral-600 transition-colors"
                          >
                            {copiedKeyId === k.id ? "✓" : "копіювати"}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${planBadge(k.plan)}`}>
                          {k.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-neutral-600">
                        {k.requests_total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{fmtDate(k.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleKey(k)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${
                            k.is_active ? "bg-green-500" : "bg-neutral-200"
                          }`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            k.is_active ? "translate-x-[18px]" : "translate-x-0.5"
                          }`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteKey(k.id)}
                          className="text-xs text-neutral-300 hover:text-red-400 transition-colors"
                        >
                          видалити
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Note about enforcement */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-700">
            <span className="font-semibold">Наступний крок:</span> додати middleware у Next.js що перевіряє
            {" "}<code className="bg-orange-100 px-1 rounded">Authorization: Bearer ubk_...</code> header і
            інкрементує <code className="bg-orange-100 px-1 rounded">requests_total</code> — після цього API ключі стануть робочими.
          </div>
        </div>
      )}

      {/* ── EXTERNAL DEPS ── */}
      {tab === "external" && (
        <div className="space-y-3">
          {EXTERNAL_APIS.map(api => (
            <div key={api.name} className="bg-white rounded-2xl border border-neutral-100 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-neutral-900 text-sm">{api.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      api.risk === "low"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}>
                      {api.risk === "low" ? "стабільний" : "крихкий"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono mb-2">{api.url}</p>
                  <p className="text-sm text-neutral-600">{api.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <StatusDot status={statuses[api.checkUrl] ?? "checking"} />
                  <span className="text-xs text-neutral-400">
                    {statuses[api.checkUrl] === "ok" ? "онлайн" : statuses[api.checkUrl] === "error" ? "помилка" : "перевірка…"}
                  </span>
                </div>
              </div>
              {api.risk === "high" && (
                <div className="mt-3 bg-red-50 rounded-lg px-3 py-2 text-xs text-red-600">
                  Рекомендація: замінити на офіційне API або додати alert якщо скрапінг зламається.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── MONETIZE ── */}
      {tab === "monetize" && (
        <div className="space-y-5">
          {/* Revenue calculator */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <h3 className="font-semibold text-neutral-900 mb-4">Калькулятор доходу</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Free клієнти", value: keys.filter(k => k.plan === "free").length, price: 0 },
                { label: "Pro клієнти", value: proCount, price: 5 },
                { label: "Business клієнти", value: businessCount, price: 20 },
              ].map(s => (
                <div key={s.label} className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-neutral-900">{s.value}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
                  {s.price > 0 && (
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      ${s.value * s.price}/міс
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between items-center">
              <span className="text-sm text-neutral-600">Загальний дохід/місяць</span>
              <span className="text-xl font-bold text-green-600">${monthlyRevenue}</span>
            </div>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <div key={plan.key} className="bg-white rounded-2xl border border-neutral-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${plan.color}`}>
                    {plan.label}
                  </span>
                  <span className="text-sm font-semibold text-neutral-700">{plan.price}</span>
                </div>
                <p className="text-xs text-neutral-400 mb-1">{plan.limit}</p>
                {plan.sla !== "—" && (
                  <p className="text-xs text-neutral-400 mb-3">SLA {plan.sla}</p>
                )}
                <ul className="space-y-1.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-neutral-600">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Roadmap */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <h3 className="font-semibold text-neutral-900 mb-3">Що треба для запуску</h3>
            <div className="space-y-2">
              {[
                { done: true,  text: "Публічні API ендпоінти (nbu-rates, fuel-prices)" },
                { done: true,  text: "Таблиця api_keys в БД" },
                { done: false, text: "Middleware перевірки Bearer токена + rate limiting" },
                { done: false, text: "Сторінка для самостійної реєстрації та отримання ключа" },
                { done: false, text: "Stripe інтеграція для Pro/Business підписки" },
                { done: false, text: "Дашборд використання для клієнта (запити/день, ліміти)" },
                { done: false, text: "Webhook-и при оновленні курсів/цін" },
                { done: false, text: "Документація на окремому поддомені (api.ubudget.net)" },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    item.done ? "bg-green-500 text-white" : "border-2 border-neutral-200"
                  }`}>
                    {item.done ? "✓" : ""}
                  </span>
                  <span className={`text-sm ${item.done ? "text-neutral-400 line-through" : "text-neutral-700"}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Key Modal */}
      {showKeyModal && (
        <NewKeyModal
          onSave={async (name, plan) => {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from("api_keys").insert({
              key: genKey(),
              name,
              plan,
              created_by: user?.id ?? null,
            });
            setShowKeyModal(false);
            loadKeys();
          }}
          onClose={() => setShowKeyModal(false)}
        />
      )}
    </div>
  );
}

// ─── New Key Modal ────────────────────────────────────────────────────────────

function NewKeyModal({ onSave, onClose }: {
  onSave: (name: string, plan: Plan) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<Plan>("free");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), plan);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Новий API ключ</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Назва (клієнт / проект)</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="наприклад: MyApp Production"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-900 bg-white focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Тариф</label>
            <select
              value={plan}
              onChange={e => setPlan(e.target.value as Plan)}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-900 bg-white focus:outline-none focus:border-orange-400"
            >
              {PLANS.map(p => (
                <option key={p.key} value={p.key}>{p.label} — {p.price}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-neutral-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
            Скасувати
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "Створення..." : "Створити ключ"}
          </button>
        </div>
      </div>
    </div>
  );
}
