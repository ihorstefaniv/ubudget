"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth";

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const MODULES = [
  { id: "budget", label: "Особистий бюджет", desc: "Доходи, витрати, категорії", default: true },
  { id: "household", label: "Сімейний бюджет", desc: "Спільний бюджет з родиною" },
  { id: "collections", label: "Колекції", desc: "Нумізматика, антикваріат, мистецтво" },
  { id: "crypto", label: "Крипто & Метали", desc: "Bitcoin, золото, срібло" },
];

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return "Пароль — мінімум 8 символів";
  if (!/[A-Z]/.test(pwd)) return "Пароль повинен містити хоча б одну велику літеру";
  if (!/[0-9]/.test(pwd)) return "Пароль повинен містити хоча б одну цифру";
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>(["budget"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  function toggleModule(id: string) {
    if (id === "budget") return; // budget завжди увімкнений
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    const result = await signUp({ email, password, fullName });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          {step === 1 ? "Створити акаунт" : "Обери модулі"}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {step === 1 ? (
            <>
              Вже є акаунт?{" "}
              <Link href="/login" className="text-orange-400 hover:text-orange-500 font-medium transition-colors">
                Увійти
              </Link>
            </>
          ) : (
            "Можна змінити пізніше в налаштуваннях"
          )}
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-8 shadow-sm">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                s <= step
                  ? "bg-orange-400 text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
              }`}>
                {s < step ? <IconCheck /> : s}
              </div>
              {s < 2 && (
                <div className={`h-px flex-1 w-8 transition-colors duration-300 ${
                  step > s ? "bg-orange-400" : "bg-neutral-100 dark:bg-neutral-800"
                }`} />
              )}
            </div>
          ))}
          <span className="text-xs text-neutral-400 ml-1">Крок {step} з 2</span>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step 1 — дані */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Ім'я
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ігор Коваленко"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-sm focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-sm focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Мін. 8 символів, велика літера, цифра"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-sm focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950 transition-all"
              />
            </div>

            <button
              onClick={() => {
                if (!fullName || !email) {
                  setError("Заповни всі поля.");
                  return;
                }
                const pwdError = validatePassword(password);
                if (pwdError) { setError(pwdError); return; }
                setError("");
                setStep(2);
              }}
              className="w-full py-2.5 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors duration-200 text-sm shadow-lg shadow-orange-100 dark:shadow-orange-950/30 mt-2"
            >
              Далі →
            </button>
          </div>
        )}

        {/* Step 2 — модулі */}
        {step === 2 && (
          <div className="space-y-3">
            {MODULES.map(({ id, label, desc, default: isDefault }) => {
              const active = selectedModules.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleModule(id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                    active
                      ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30"
                      : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors duration-200 ${
                    active
                      ? "bg-orange-400 border-orange-400 text-white"
                      : "border-neutral-300 dark:border-neutral-600"
                  }`}>
                    {active && <IconCheck />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {label}
                      {isDefault && (
                        <span className="ml-2 text-[10px] font-normal text-orange-400 uppercase tracking-wide">
                          базовий
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{desc}</p>
                  </div>
                </button>
              );
            })}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-sm font-medium hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
              >
                ← Назад
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 disabled:opacity-50 transition-colors duration-200 text-sm shadow-lg shadow-orange-100 dark:shadow-orange-950/30"
              >
                {loading ? "Створюємо..." : "Готово!"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}