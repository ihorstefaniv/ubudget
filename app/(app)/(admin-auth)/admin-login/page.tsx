"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);

    const supabase = createClient();
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });

    if (authErr || !data.user) {
      setError("Невірний email або пароль");
      setLoading(false); return;
    }

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", data.user.id).single();

    if (!profile || !["admin", "superadmin"].includes(profile.role ?? "")) {
      await supabase.auth.signOut();
      setError("Доступ заборонено");
      setLoading(false); return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-black text-lg">U</span>
          </div>
          <h1 className="text-xl font-bold text-white">Ubudget Admin</h1>
          <p className="text-sm text-white/40 mt-1">Вхід для адміністраторів</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" required autoComplete="email"
            className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-500 transition-colors"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Пароль" required autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-orange-500 transition-colors"
          />
          {error && <p className="text-red-400 text-xs px-1">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50">
            {loading ? "Вхід..." : "Увійти"}
          </button>
        </form>

        <p className="text-center text-xs text-white/20 mt-8">
          Тільки для авторизованого персоналу
        </p>
      </div>
    </div>
  );
}