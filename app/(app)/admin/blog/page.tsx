// ФАЙЛ: app/(app)/admin/blog/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/auth";

interface Post {
  id: string; title: string; slug: string;
  status: "draft" | "published"; created_at: string;
  published_at: string | null; excerpt: string | null;
}

interface Comment {
  id: string; post_id: string; author_name: string;
  content: string; approved: boolean; created_at: string;
  posts?: { title: string; slug: string }[] | null;
}

const Icon = ({ d, cls = "w-4 h-4" }: { d: string; cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cls}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ic = {
  plus:    "M12 4v16m8-8H4",
  edit:    "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash:   "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  eye:     "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  check:   "M5 13l4 4L19 7",
  comment: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
};

export default function AdminBlogListPage() {
  const [tab, setTab]           = useState<"posts" | "comments">("posts");
  const [posts, setPosts]       = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"all" | "published" | "draft">("all");
  const [cmtFilter, setCmtFilter] = useState<"pending" | "approved" | "all">("pending");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { loadPosts(); loadComments(); }, []);

  async function loadPosts() {
    const { data } = await createClient()
      .from("posts")
      .select("id, title, slug, status, created_at, published_at, excerpt")
      .order("created_at", { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  }

  async function loadComments() {
    const { data } = await createClient()
      .from("post_comments")
      .select("id, post_id, author_name, content, approved, created_at, posts(title, slug)")
      .order("created_at", { ascending: false });
    setComments(data ?? []);
  }

  async function deletePost(id: string) {
    if (!confirm("Видалити публікацію?")) return;
    setDeleting(id);
    await createClient().from("posts").delete().eq("id", id);
    setPosts(p => p.filter(x => x.id !== id));
    setDeleting(null);
  }

  async function toggleStatus(post: Post) {
    const next = post.status === "published" ? "draft" : "published";
    await createClient().from("posts").update({
      status: next,
      published_at: next === "published" ? new Date().toISOString() : null,
    }).eq("id", post.id);
    setPosts(p => p.map(x => x.id === post.id ? { ...x, status: next as Post["status"] } : x));
  }

  async function approveComment(id: string) {
    await createClient().from("post_comments").update({ approved: true }).eq("id", id);
    setComments(c => c.map(x => x.id === id ? { ...x, approved: true } : x));
  }

  async function deleteComment(id: string) {
    if (!confirm("Видалити коментар?")) return;
    await createClient().from("post_comments").delete().eq("id", id);
    setComments(c => c.filter(x => x.id !== id));
  }

  const filtered = posts.filter(p => filter === "all" || p.status === filter);
  const filteredCmts = comments.filter(c =>
    cmtFilter === "all" ? true : cmtFilter === "pending" ? !c.approved : c.approved
  );
  const pendingCount = comments.filter(c => !c.approved).length;

  const stats = {
    all: posts.length,
    published: posts.filter(p => p.status === "published").length,
    draft: posts.filter(p => p.status === "draft").length,
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Блог</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{stats.published} опубліковано · {stats.draft} чернеток</p>
        </div>
        <Link href="/admin/blog/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 active:scale-95 transition-all shadow-sm shadow-orange-200">
          <Icon d={ic.plus} /> Нова стаття
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab("posts")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "posts" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
          Статті ({stats.all})
        </button>
        <button onClick={() => setTab("comments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "comments" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
          <Icon d={ic.comment} cls="w-3.5 h-3.5" />
          Коментарі
          {pendingCount > 0 && (
            <span className="bg-orange-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
          )}
        </button>
      </div>

      {/* Posts tab */}
      {tab === "posts" && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          {/* Filter */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-neutral-100">
            {(["all", "published", "draft"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"
                }`}>
                {f === "all" ? `Всі (${stats.all})` : f === "published" ? `Опубліковано (${stats.published})` : `Чернетки (${stats.draft})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-400 text-sm">Публікацій ще немає</p>
              <Link href="/admin/blog/new" className="mt-3 inline-block text-orange-500 text-sm hover:underline">Створити першу →</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-50/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Стаття</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider hidden sm:table-cell">Slug</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Статус</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider hidden md:table-cell">Дата</th>
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
      )}

      {/* Comments tab */}
      {tab === "comments" && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          {/* Filter */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-neutral-100">
            {(["pending", "approved", "all"] as const).map(f => (
              <button key={f} onClick={() => setCmtFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  cmtFilter === f ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"
                }`}>
                {f === "pending" ? `На модерації (${comments.filter(c => !c.approved).length})`
                  : f === "approved" ? `Схвалені (${comments.filter(c => c.approved).length})`
                  : `Всі (${comments.length})`}
              </button>
            ))}
          </div>

          {filteredCmts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-400 text-sm">
                {cmtFilter === "pending" ? "Немає коментарів на модерації 🎉" : "Коментарів немає"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {filteredCmts.map(cmt => (
                <div key={cmt.id} className="px-5 py-4 hover:bg-neutral-50/50 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-orange-500">{cmt.author_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-semibold text-neutral-800">{cmt.author_name}</span>
                        <span className="text-xs text-neutral-400">
                          {new Date(cmt.created_at).toLocaleDateString("uk-UA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {cmt.approved
                          ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Схвалено</span>
                          : <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">На модерації</span>
                        }
                        {cmt.posts?.[0] && (
                          <a href={`/blog/${cmt.posts[0].slug}`} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 hover:text-orange-500 transition-colors truncate max-w-[160px]">
                            📄 {cmt.posts[0].title}
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 leading-relaxed">{cmt.content}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!cmt.approved && (
                        <button onClick={() => approveComment(cmt.id)}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-neutral-400 hover:text-green-600 transition-colors" title="Схвалити">
                          <Icon d={ic.check} />
                        </button>
                      )}
                      <button onClick={() => deleteComment(cmt.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors" title="Видалити">
                        <Icon d={ic.trash} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}