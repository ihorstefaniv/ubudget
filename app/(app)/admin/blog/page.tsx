// ФАЙЛ: app/(admin)/blog/page.tsx
// URL: /admin/blog — список всіх статей

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/auth";

interface Post {
  id: string; title: string; slug: string;
  status: "draft" | "published"; created_at: string;
  published_at: string | null; excerpt: string | null;
}

const Icon = ({ d, cls = "w-4 h-4" }: { d: string; cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cls}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ic = {
  plus:  "M12 4v16m8-8H4",
  edit:  "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  eye:   "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
};

export default function AdminBlogListPage() {
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"all" | "published" | "draft">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, status, created_at, published_at, excerpt")
      .order("created_at", { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  }

  async function deletePost(id: string) {
    if (!confirm("Видалити публікацію?")) return;
    setDeleting(id);
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", id);
    setPosts(p => p.filter(post => post.id !== id));
    setDeleting(null);
  }

  async function toggleStatus(post: Post) {
    const supabase  = createClient();
    const newStatus = post.status === "published" ? "draft" : "published";
    await supabase.from("posts").update({
      status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : null,
    }).eq("id", post.id);
    setPosts(p => p.map(pp => pp.id === post.id ? { ...pp, status: newStatus as Post["status"] } : pp));
  }

  const counts = {
    all: posts.length,
    published: posts.filter(p => p.status === "published").length,
    draft: posts.filter(p => p.status === "draft").length,
  };
  const filtered = posts.filter(p => filter === "all" || p.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Блог</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{posts.length} публікацій</p>
        </div>
        <Link href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:scale-95 transition-all">
          <Icon d={ic.plus} />
          Нова стаття
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
        {(["all", "published", "draft"] as const).map(key => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
            {key === "all" ? "Всі" : key === "published" ? "Опубліковані" : "Чернетки"}
            <span className={`ml-1.5 text-xs ${filter === key ? "text-orange-500" : "text-neutral-400"}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-400">
            <p className="text-2xl mb-2">📝</p>
            <p className="text-sm">Немає публікацій</p>
            <Link href="/admin/blog/new" className="text-orange-500 text-sm mt-2 block hover:underline">Створити першу →</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Заголовок</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider hidden sm:table-cell">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Статус</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider hidden md:table-cell">Дата</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map(post => (
                <tr key={post.id} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-neutral-900 truncate max-w-xs">{post.title}</p>
                    {post.excerpt && <p className="text-xs text-neutral-400 truncate max-w-xs mt-0.5">{post.excerpt}</p>}
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <code className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">/{post.slug}</code>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleStatus(post)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold hover:opacity-70 transition-all ${post.status === "published" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>
                      {post.status === "published" ? "Опубліковано" : "Чернетка"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-xs text-neutral-400">
                      {new Date(post.published_at || post.created_at).toLocaleDateString("uk-UA")}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {post.status === "published" && (
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors">
                          <Icon d={ic.eye} />
                        </a>
                      )}
                      <Link href={`/admin/blog/${post.id}`}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors">
                        <Icon d={ic.edit} />
                      </Link>
                      <button onClick={() => deletePost(post.id)} disabled={deleting === post.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors">
                        <Icon d={ic.trash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}