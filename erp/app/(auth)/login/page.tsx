"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Button, Input, Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn({ email, password });
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      {/* Лого */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-orange-400 flex items-center justify-center shadow-sm">
          <span className="text-white font-black text-base leading-none">U</span>
        </div>
        <div>
          <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Budget</span>
          <span className="text-xs font-semibold text-orange-400 ml-1.5 px-1.5 py-0.5 bg-orange-50 dark:bg-orange-950/30 rounded-md">ERP</span>
        </div>
      </div>

      <Card>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-5">Вхід</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@company.com"
            required
            autoComplete="email"
          />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <Button type="submit" fullWidth loading={loading}>
            Увійти
          </Button>
        </form>
        <p className="text-xs text-neutral-400 text-center mt-4">
          Використовуй ті ж дані що й на{" "}
          <a href="https://ubudget.net" className="text-orange-400 hover:underline">ubudget.net</a>
        </p>
      </Card>
    </div>
  );
}
