// ФАЙЛ: app/(landing)/blog/[slug]/page.tsx
import CommentsSection from "./CommentsSection";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string;
  meta_title: string | null;
  meta_desc: string | null;
};

type Comment = {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

function supabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getPost(slug: string): Promise<Post | null> {
  const { data } = await supabasePublic()
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

async function getRelated(post: Post): Promise<Post[]> {
  const { data } = await supabasePublic()
    .from("posts")
    .select("id, title, slug, excerpt, cover_url, category, published_at, created_at, meta_title")
    .eq("status", "published")
    .neq("id", post.id)
    .limit(3);
  return (data ?? []) as Post[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Не знайдено" };
  return {
    title: post.meta_title || post.title + " — UBudget",
    description: post.meta_desc || post.excerpt || undefined,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_desc || post.excerpt || undefined,
      images: post.cover_url ? [post.cover_url] : [],
      type: "article",
      publishedTime: post.published_at || post.created_at,
    },
  };
}

// Escape raw HTML entities to prevent XSS before markdown transformation
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

// Simple markdown to HTML renderer
function renderContent(md: string): string {
  const safe = escapeHtml(md);
  return safe
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, text, href) => `<a href="${safeHref(href)}">${text}</a>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hbuplai])/gm, "")
    .split("\n\n").map(p =>
      p.startsWith("<") ? p : `<p>${p}</p>`
    ).join("\n");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function ReadingTime({ content }: { content: string }) {
  const words = content.trim().split(/\s+/).length;
  const mins  = Math.max(1, Math.round(words / 200));
  return <span>{mins} хв читання</span>;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelated(post);
  const date    = post.published_at || post.created_at;

  return (
    <article className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-8">
        <Link href="/" className="hover:text-orange-500 transition-colors">Головна</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-orange-500 transition-colors">Блог</Link>
        {post.category && (
          <>
            <span>/</span>
            <Link href={`/blog?cat=${encodeURIComponent(post.category)}`} className="hover:text-orange-500 transition-colors">
              {post.category}
            </Link>
          </>
        )}
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">

        {/* Main content */}
        <div>
          {/* Header */}
          <header className="mb-8">
            {post.category && (
              <Link href={`/blog?cat=${encodeURIComponent(post.category)}`}
                className="inline-block px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-500 text-xs font-bold mb-4 uppercase tracking-wider hover:bg-orange-100 transition-colors">
                {post.category}
              </Link>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-neutral-100 leading-tight mb-4">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-neutral-400 pb-6 border-b border-neutral-100 dark:border-neutral-800">
              <span>{formatDate(date)}</span>
              {post.content && (
                <>
                  <span>·</span>
                  <ReadingTime content={post.content} />
                </>
              )}
            </div>
          </header>

          {/* Cover */}
          {post.cover_url && (
            <div className="rounded-2xl overflow-hidden mb-10 aspect-[16/9] bg-neutral-100 dark:bg-neutral-800">
              <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Content */}
          {post.content ? (
            <div
              className="prose prose-neutral dark:prose-invert max-w-none
                prose-headings:font-black prose-headings:text-neutral-900 dark:prose-headings:text-neutral-100
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-neutral-600 dark:prose-p:text-neutral-300 prose-p:leading-relaxed prose-p:mb-5
                prose-strong:text-neutral-900 dark:prose-strong:text-neutral-100 prose-strong:font-bold
                prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-4 prose-blockquote:border-orange-400 prose-blockquote:bg-orange-50 dark:prose-blockquote:bg-orange-950/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
                prose-code:bg-neutral-100 dark:prose-code:bg-neutral-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-orange-600 dark:prose-code:text-orange-400 prose-code:before:content-none prose-code:after:content-none
                prose-ul:space-y-1 prose-li:text-neutral-600 dark:prose-li:text-neutral-300
                prose-img:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
            />
          ) : (
            <p className="text-neutral-400 italic">Вміст відсутній</p>
          )}

          {/* Share */}
          <div className="mt-12 pt-8 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-sm font-semibold text-neutral-500 mb-3">Поділитись</p>
            <div className="flex gap-2">
              <a href={`https://t.me/share/url?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ubudget.app"}/blog/${post.slug}`)}&text=${encodeURIComponent(post.title)}`}
                target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[#229ED9] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                Telegram
              </a>
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ubudget.app"}/blog/${post.slug}`)}&text=${encodeURIComponent(post.title)}`}
                target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:opacity-90 transition-opacity">
                X / Twitter
              </a>
              <Link href="/blog" className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-sm font-medium hover:border-orange-300 hover:text-orange-500 transition-colors">
                ← Всі статті
              </Link>
            </div>
          </div>

          {/* Comments */}
          <CommentsSection postId={post.id} />
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">

            {/* Article info */}
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-5 border border-orange-100 dark:border-orange-900/30">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3">Про статтю</p>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Дата</dt>
                  <dd className="text-neutral-700 dark:text-neutral-300 font-medium text-right">
                    {formatDate(date)}
                  </dd>
                </div>
                {post.category && (
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Категорія</dt>
                    <dd className="text-neutral-700 dark:text-neutral-300 font-medium">{post.category}</dd>
                  </div>
                )}
                {post.content && (
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Час читання</dt>
                    <dd className="text-neutral-700 dark:text-neutral-300 font-medium">
                      <ReadingTime content={post.content} />
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Читайте також</p>
                <div className="space-y-4">
                  {related.map(r => (
                    <Link key={r.id} href={`/blog/${r.slug}`}
                      className="group flex gap-3 items-start">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                        {r.cover_url
                          ? <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/20 flex items-center justify-center"><span className="text-xl">📝</span></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">{r.title}</p>
                        <p className="text-xs text-neutral-400 mt-1">{formatDate(r.published_at || r.created_at)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-neutral-900 dark:bg-neutral-800 rounded-2xl p-5 text-center">
              <p className="text-2xl mb-2">☕</p>
              <p className="text-sm font-bold text-white mb-1">Підтримай проект</p>
              <p className="text-xs text-neutral-400 mb-4">Якщо стаття була корисною — пригости кавою 🙂</p>
              <a href="https://buymeacoffee.com" target="_blank" rel="noopener noreferrer"
                className="block w-full py-2.5 rounded-xl bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 transition-colors">
                ☕ Buy me a coffee
              </a>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}