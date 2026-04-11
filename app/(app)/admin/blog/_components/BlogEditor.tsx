// ФАЙЛ: app/(app)/admin/blog/_components/BlogEditor.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/auth";

const BLOG_CATEGORIES = ["Бюджет","Інвестиції","Кредити","Заощадження","Поради","Інше"];

interface PostForm {
  title: string; slug: string; excerpt: string; content: string;
  status: "draft" | "published"; meta_title: string; meta_desc: string;
  category: string; cover_url: string;
}
const EMPTY: PostForm = {
  title: "", slug: "", excerpt: "", content: "", status: "draft",
  meta_title: "", meta_desc: "", category: "", cover_url: "",
};

// ─── Icons ────────────────────────────────────────────────────
const Icon = ({ d, cls = "w-4 h-4" }: { d: string; cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cls}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ic = {
  back:   "M10 19l-7-7m0 0l7-7m-7 7h18",
  eye:    "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  bold:   "M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z",
  italic: "M19 4h-9M14 20H5M15 4L9 20",
  link:   "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  image:  "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  quote:  "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  code:   "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  list:   "M4 6h16M4 10h16M4 14h16M4 18h16",
  olist:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  hr:     "M5 12h14",
};

function slugify(str: string) {
  const map: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",є:"ye",ж:"zh",з:"z",и:"y",і:"i",ї:"yi",
    й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
    х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"yu",я:"ya",
  };
  return str.toLowerCase().split("").map(c => map[c] ?? c).join("")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

function ToolBtn({ icon, label, onClick, active }: { icon?: string; label?: string; onClick: () => void; active?: boolean }) {
  return (
    <button type="button" onMouseDown={e => { e.preventDefault(); onClick(); }} title={label}
      className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors min-w-[28px] flex items-center justify-center
        ${active ? "bg-neutral-200 text-neutral-900" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"}`}>
      {icon ? <Icon d={icon} cls="w-3.5 h-3.5" /> : label}
    </button>
  );
}

// Escape raw HTML entities before markdown transformation to prevent XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Allow only http/https/relative links — blocks javascript: and data: URIs
function safeHref(href: string): string {
  return /^https?:\/\/|^\//.test(href) ? href : "#";
}

function renderMd(md: string): string {
  const safe = escapeHtml(md);
  return safe
    .replace(/^# (.+)$/gm,   '<h1 class="text-2xl font-bold mt-6 mb-2">$1</h1>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-1">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`{3}([\s\S]+?)`{3}/g, '<pre class="bg-neutral-100 rounded-xl p-4 text-sm font-mono overflow-x-auto my-3"><code>$1</code></pre>')
    .replace(/`(.+?)`/g,       '<code class="bg-neutral-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^&gt; (.+)$/gm,  '<blockquote class="border-l-4 border-orange-400 pl-4 text-neutral-500 italic my-2">$1</blockquote>')
    .replace(/^---$/gm,        '<hr class="border-neutral-200 my-4" />')
    .replace(/^- (.+)$/gm,     '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, text, href) => `<a href="${safeHref(href)}" class="text-orange-500 underline">${text}</a>`)
    .replace(/!\[(.+?)\]\((.+?)\)/g, (_, alt, src) => {
      const safeSrc = safeHref(src);
      return `<img src="${safeSrc}" alt="${alt}" class="rounded-xl max-w-full my-3" />`;
    })
    .split("\n\n").map(p => {
      if (p.match(/^<(h[1-3]|pre|blockquote|hr|li|ul|ol)/)) return p;
      if (p.trim() === "") return "";
      return `<p class="mb-3 leading-relaxed">${p.replace(/\n/g, "<br>")}</p>`;
    }).join("\n");
}

const inp = "w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-400 transition-colors bg-white";
const lbl = "text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block";

export default function BlogEditor({ postId }: { postId?: string }) {
  const router    = useRouter();
  const isEdit    = !!postId;
  const taRef     = useRef<HTMLTextAreaElement>(null);

  const [form, setForm]           = useState<PostForm>(EMPTY);
  const [loading, setLoading]     = useState(isEdit);
  const [saving, setSaving]       = useState(false);
  const [preview, setPreview]     = useState(false);
  const [autoSlug, setAutoSlug]   = useState(!isEdit);
  const [savedMsg, setSavedMsg]   = useState("");
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (!isEdit) return;
    createClient().from("posts").select("*").eq("id", postId).single().then(({ data }) => {
      if (data) setForm({
        title:      data.title      ?? "",
        slug:       data.slug       ?? "",
        excerpt:    data.excerpt    ?? "",
        content:    data.content    ?? "",
        status:     data.status     ?? "draft",
        meta_title: data.meta_title ?? "",
        meta_desc:  data.meta_desc  ?? "",
        category:   data.category   ?? "",
        cover_url:  data.cover_url  ?? "",
      });
      setLoading(false);
    });
  }, [postId, isEdit]);

  useEffect(() => {
    const words = form.content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [form.content]);

  function set(key: keyof PostForm, val: string) {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === "title" && autoSlug) next.slug = slugify(val);
      return next;
    });
  }

  const insertMd = useCallback((before: string, after = "", placeholder = "") => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const selected = value.slice(s, e) || placeholder;
    const newVal   = value.slice(0, s) + before + selected + after + value.slice(e);
    set("content", newVal);
    setTimeout(() => {
      ta.focus();
      const ns = s + before.length;
      const ne = ns + selected.length;
      ta.selectionStart = ns;
      ta.selectionEnd   = ne;
    }, 0);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;
    if (e.key === "Tab") { e.preventDefault(); insertMd("  "); }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") { e.preventDefault(); insertMd("**", "**", "жирний текст"); }
      if (e.key === "i") { e.preventDefault(); insertMd("*", "*", "курсив"); }
      if (e.key === "s") { e.preventDefault(); save(); }
    }
    if (e.key === "Enter") {
      const { selectionStart, value } = ta;
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const line      = value.slice(lineStart, selectionStart);
      const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s/);
      if (listMatch) {
        e.preventDefault();
        const [, indent, marker] = listMatch;
        const nextMarker = /\d+/.test(marker) ? `${parseInt(marker) + 1}.` : marker;
        insertMd(`\n${indent}${nextMarker} `);
      }
    }
  }

  async function save(publish?: boolean) {
    if (!form.title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title:        form.title,
      slug:         form.slug,
      excerpt:      form.excerpt,
      content:      form.content,
      meta_title:   form.meta_title,
      meta_desc:    form.meta_desc,
      category:     form.category || null,
      cover_url:    form.cover_url || null,
      status:       publish ? "published" : form.status,
      published_at: publish ? new Date().toISOString() : (form.status === "published" ? undefined : null),
      updated_at:   new Date().toISOString(),
    };
    if (isEdit) {
      await supabase.from("posts").update(payload).eq("id", postId);
      if (publish) setForm(f => ({ ...f, status: "published" }));
      setSaving(false); setSavedMsg("✓ Збережено"); setTimeout(() => setSavedMsg(""), 2000);
    } else {
      const { data } = await supabase.from("posts").insert({ ...payload, created_at: new Date().toISOString() }).select().single();
      if (data) router.replace(`/admin/blog/${data.id}`);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  const readingTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Topbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/blog")} className="p-2 rounded-xl hover:bg-neutral-200 text-neutral-500 transition-colors">
            <Icon d={ic.back} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">{isEdit ? "Редагування" : "Нова стаття"}</h1>
            <p className="text-xs text-neutral-400">
              {form.status === "published" ? "✓ Опубліковано" : "Чернетка"} · {wordCount} слів · ~{readingTime} хв читання
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all ${preview ? "bg-neutral-900 border-neutral-900 text-white" : "border-neutral-200 text-neutral-600 hover:bg-neutral-100"}`}>
            <Icon d={ic.eye} />
            {preview ? "Редагувати" : "Перегляд"}
          </button>
          <button onClick={() => save()} disabled={saving}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-all disabled:opacity-50">
            {savedMsg || (saving ? "..." : "Зберегти")}
          </button>
          {form.status !== "published" ? (
            <button onClick={() => save(true)} disabled={saving}
              className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50">
              Опублікувати
            </button>
          ) : (
            <button onClick={() => { setForm(f => ({ ...f, status: "draft" })); save(); }}
              className="px-4 py-2 rounded-xl bg-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-300 transition-all">
              В чернетки
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        {/* Editor column */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
            <div>
              <label className={lbl}>Заголовок *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)}
                placeholder="Введіть заголовок..." className={inp + " text-base font-medium"} />
            </div>
            <div>
              <label className={lbl}>
                Slug · <span className="normal-case font-normal text-neutral-400 text-xs">
                  /blog/<span className="text-orange-500">{form.slug || "url-statti"}</span>
                </span>
              </label>
              <input value={form.slug} onChange={e => { setAutoSlug(false); set("slug", e.target.value); }}
                placeholder="url-statti" className={inp + " font-mono text-sm"} />
            </div>
            <div>
              <label className={lbl}>Короткий опис (excerpt)</label>
              <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)}
                placeholder="Короткий опис для карток і SEO..." rows={2} className={inp + " resize-none"} />
            </div>
          </div>

          {/* Main editor */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            {!preview && (
              <div className="flex items-center gap-0.5 px-3 py-2 border-b border-neutral-100 flex-wrap bg-neutral-50/50">
                <ToolBtn label="H1" onClick={() => insertMd("# ", "", "Заголовок 1")} />
                <ToolBtn label="H2" onClick={() => insertMd("## ", "", "Заголовок 2")} />
                <ToolBtn label="H3" onClick={() => insertMd("### ", "", "Заголовок 3")} />
                <div className="w-px h-4 bg-neutral-200 mx-1" />
                <ToolBtn icon={ic.bold}   label="Жирний"       onClick={() => insertMd("**", "**", "жирний текст")} />
                <ToolBtn icon={ic.italic} label="Курсив"       onClick={() => insertMd("*", "*", "курсив")} />
                <ToolBtn icon={ic.code}   label="Код"          onClick={() => insertMd("`", "`", "код")} />
                <div className="w-px h-4 bg-neutral-200 mx-1" />
                <ToolBtn icon={ic.list}   label="Список"       onClick={() => insertMd("- ", "", "пункт")} />
                <ToolBtn icon={ic.olist}  label="Нумерований"  onClick={() => insertMd("1. ", "", "пункт")} />
                <ToolBtn icon={ic.quote}  label="Цитата"       onClick={() => insertMd("> ", "", "цитата")} />
                <div className="w-px h-4 bg-neutral-200 mx-1" />
                <ToolBtn icon={ic.link}   label="Посилання"    onClick={() => insertMd("[", "](url)", "текст")} />
                <ToolBtn icon={ic.image}  label="Зображення"   onClick={() => insertMd("![", "](url)", "alt текст")} />
                <ToolBtn label="```"                           onClick={() => insertMd("```\n", "\n```", "код")} />
                <ToolBtn icon={ic.hr}     label="Розділювач"   onClick={() => insertMd("\n---\n")} />
                <div className="flex-1" />
                <span className="text-[10px] text-neutral-400 pr-1">Ctrl+B · Ctrl+I · Ctrl+S</span>
              </div>
            )}
            {preview ? (
              <div className="p-6 min-h-96 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMd(form.content) || '<p class="text-neutral-400">Немає контенту для перегляду</p>' }} />
            ) : (
              <textarea ref={taRef} value={form.content}
                onChange={e => set("content", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={"Починайте писати...\n\n## Використовуйте Markdown\n\n**Жирний** або *курсив*, `код`, > цитата\n\n- список\n- пунктів"}
                className="w-full p-5 text-sm font-mono leading-relaxed text-neutral-800 placeholder-neutral-300 focus:outline-none resize-none bg-white min-h-[480px]"
                style={{ tabSize: 2 }}
              />
            )}
            <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-100 bg-neutral-50/50 text-[10px] text-neutral-400">
              <span>{wordCount} слів · ~{readingTime} хв читання · {form.content.length} символів</span>
              <span>Markdown · Tab = відступ</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Status */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
            <p className={lbl}>Статус публікації</p>
            <div className="flex gap-2">
              {(["draft", "published"] as const).map(s => (
                <button key={s} type="button" onClick={() => set("status", s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    form.status === s
                      ? s === "published" ? "bg-green-500 text-white" : "bg-neutral-800 text-white"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}>
                  {s === "published" ? "✓ Опублікувати" : "Чернетка"}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-2">
            <p className={lbl}>Категорія</p>
            <select value={form.category} onChange={e => set("category", e.target.value)}
              className={inp}>
              <option value="">— Без категорії —</option>
              {BLOG_CATEGORIES.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Cover */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-2">
            <p className={lbl}>Обкладинка</p>
            <input
              value={form.cover_url}
              placeholder="https://... (URL зображення)"
              className={inp + " text-xs"}
              onChange={e => set("cover_url", e.target.value)}
            />
            {form.cover_url && (
              <img src={form.cover_url} alt="preview" className="w-full rounded-xl object-cover aspect-video mt-2" />
            )}
            <p className="text-[10px] text-neutral-400">Рекомендовано: 1200×630px</p>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
            <p className={lbl}>SEO</p>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Meta title</label>
              <input value={form.meta_title} onChange={e => set("meta_title", e.target.value)}
                placeholder={form.title || "Meta title..."} className={inp} />
              <p className={`text-[10px] mt-1 ${form.meta_title.length > 60 ? "text-red-500" : "text-neutral-400"}`}>
                {form.meta_title.length}/60
              </p>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Meta description</label>
              <textarea value={form.meta_desc} onChange={e => set("meta_desc", e.target.value)}
                placeholder={form.excerpt || "Meta description..."} rows={3} className={inp + " resize-none"} />
              <p className={`text-[10px] mt-1 ${form.meta_desc.length > 160 ? "text-red-500" : "text-neutral-400"}`}>
                {form.meta_desc.length}/160
              </p>
            </div>
          </div>

          {/* Google preview */}
          {(form.title || form.meta_desc) && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-4">
              <p className={lbl}>Google Preview</p>
              <div className="mt-2 space-y-0.5 border border-neutral-100 rounded-xl p-3">
                <p className="text-sm text-blue-600 font-medium truncate leading-snug">
                  {form.meta_title || form.title}
                </p>
                <p className="text-xs text-green-700">ubudget.app › blog › {form.slug || "..."}</p>
                <p className="text-xs text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
                  {form.meta_desc || form.excerpt || "Опис статті..."}
                </p>
              </div>
            </div>
          )}

          {/* Markdown cheatsheet */}
          <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-4">
            <p className={lbl}>Markdown шпаргалка</p>
            <div className="space-y-1 text-xs text-neutral-500 font-mono">
              {[
                "# H1  ## H2  ### H3",
                "**жирний**  *курсив*",
                "`код`  ```блок```",
                "- список  1. нумер",
                "> цитата  --- лінія",
                "[текст](url)",
                "![alt](url зображення)",
              ].map(ex => (
                <div key={ex} className="px-2 py-1 bg-white rounded-lg border border-neutral-100">{ex}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}