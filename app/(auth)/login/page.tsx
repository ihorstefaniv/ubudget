"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth";

function IconEye({ show }: { show: boolean }) {
  return show ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" d="M3.98 8.223A10.5 10.5 0 0112 5.25c4.418 0 8.007 2.73 9.5 6.622a10.5 10.5 0 01-4.293 5.27M6.53 6.53A10.5 10.5 0 002.5 11.872" />
      <path strokeLinecap="round" d="M12 12a3 3 0 100-6 3 3 0 000 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn({ email, password });

    if (result.error) {
      setError("Невірний email або пароль");
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
          Вхід до UBudget
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Немає акаунту?{" "}
          <Link href="/register" className="text-orange-400 hover:text-orange-500 font-medium transition-colors">
            Зареєструватись
          </Link>
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-8 space-y-5 shadow-sm">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-sm focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950 transition-all"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Пароль
            </label>
            <Link href="/forgot-password" className="text-xs text-neutral-400 hover:text-orange-400 transition-colors">
              Забули пароль?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-sm focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              <IconEye show={showPassword} />
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="w-full py-2.5 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm shadow-lg shadow-orange-100 dark:shadow-orange-950/30"
        >
          {loading ? "Входимо..." : "Увійти"}
        </button>
      </div>
    </div>
  );
}