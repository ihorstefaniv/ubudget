// ФАЙЛ: app/(landing)/blog/[slug]/CommentsSection.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

type Comment = {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
};

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [name, setName]         = useState("");
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase()
      .from("post_comments")
      .select("id, author_name, content, created_at")
      .eq("post_id", postId)
      .eq("approved", true)
      .order("created_at", { ascending: true });
    setComments(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [postId]);

  async function submit() {
    if (!name.trim() || !text.trim()) { setError("Заповніть ім'я та коментар"); return; }
    setSending(true);
    setError("");
    const { error: err } = await supabase()
      .from("post_comments")
      .insert({ post_id: postId, author_name: name.trim(), content: text.trim(), approved: false });
    setSending(false);
    if (err) { setError("Помилка. Спробуйте пізніше."); return; }
    setSuccess(true);
    setName("");
    setText("");
  }

  return (
    <div className="mt-12 pt-8 border-t border-neutral-100 dark:border-neutral-800">
      <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
        Коментарі {comments.length > 0 && <span className="text-neutral-400 font-normal text-base">({comments.length})</span>}
      </h2>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3 mb-8">
          {[1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />)}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4 mb-10">
          {comments.map(c => (
            <div key={c.id} className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-orange-500">
                    {c.author_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{c.author_name}</p>
                  <p className="text-xs text-neutral-400">{formatDate(c.created_at)}</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed pl-11">{c.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-neutral-400 text-sm mb-8">Коментарів ще немає — будьте першим!</p>
      )}

      {/* Add comment */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
        <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-4">Залишити коментар</p>

        {success ? (
          <div className="py-4 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Дякуємо! Ваш коментар буде опублікований після модерації.
            </p>
            <button onClick={() => setSuccess(false)} className="mt-3 text-sm text-orange-500 hover:underline">
              Написати ще
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ваше ім'я *"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-sm focus:outline-none focus:border-orange-400 transition-colors"
            />
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Ваш коментар *"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-sm focus:outline-none focus:border-orange-400 transition-colors resize-none"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-400">Коментарі проходять модерацію перед публікацією</p>
              <button
                onClick={submit}
                disabled={sending || !name.trim() || !text.trim()}
                className="px-5 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {sending ? "Надсилаємо..." : "Надіслати"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}