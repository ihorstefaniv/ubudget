// ФАЙЛ: app/(landing)/blog/page.tsx
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Блог — UBudget",
  description: "Поради з особистих фінансів, бюджетування та інвестицій від команди UBudget",
  openGraph: {
    title: "Блог — UBudget",
    description: "Поради з особистих фінансів, бюджетування та інвестицій",
    type: "website",
  },
};

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string;
  meta_title: string | null;
};

const CATEGORIES = ["Всі", "Бюджет", "Інвестиції", "Кредити", "Заощадження", "Поради"];

function supabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getPosts(): Promise<Post[]> {
  const { data } = await supabasePublic()
    .from("posts")
    .select("id, title, slug, excerpt, cover_url, category, published_at, created_at, meta_title")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const date = post.published_at || post.created_at;
  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="group block relative overflow-hidden rounded-3xl bg-neutral-900 dark:bg-neutral-800 min-h-[420px] flex flex-col justify-end">
        {post.cover_url ? (
          <img src={post.cover_url} alt={post.title} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/30 via-orange-600/20 to-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="relative p-8 md:p-10">
          {post.category && (
            <span className="inline-block px-3 py-1 rounded-full bg-orange-400 text-white text-xs font-bold mb-4 uppercase tracking-wider">
              {post.category}
            </span>
          )}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight group-hover:text-orange-300 transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-neutral-300 text-sm leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
          )}
          <p className="text-neutral-500 text-xs">{formatDate(date)}</p>
        </div>
      </Link>
    );
  }
  return (
    <Link href={`/blog/${post.slug}`} className="group block bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-lg hover:shadow-orange-50 dark:hover:shadow-none transition-all duration-300">
      {post.cover_url && (
        <div className="aspect-[16/9] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      {!post.cover_url && (
        <div className="aspect-[16/9] bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 flex items-center justify-center">
          <span className="text-4xl opacity-30">📝</span>
        </div>
      )}
      <div className="p-5">
        {post.category && (
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-500 text-[10px] font-bold mb-2.5 uppercase tracking-wider">
            {post.category}
          </span>
        )}
        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 leading-snug mb-2 group-hover:text-orange-500 transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>
        )}
        <p className="text-neutral-400 text-xs">{formatDate(date)}</p>
      </div>
    </Link>
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const params   = await searchParams;
  const allPosts = await getPosts();
  const q   = params.q?.toLowerCase() ?? "";
  const cat = params.cat ?? "Всі";

  const posts = allPosts.filter(p => {
    const matchCat = cat === "Всі" || p.category === cat;
    const matchQ   = !q || p.title.toLowerCase().includes(q) || (p.excerpt ?? "").toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const featured = posts[0];
  const rest     = posts.slice(1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Журнал</p>
        <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-neutral-100 mb-4 leading-tight">
          Блог UBudget
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-xl">
          Поради з бюджетування, інвестицій та особистих фінансів українською
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <form method="GET" className="flex-1 relative">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Пошук статей..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-orange-400 transition-colors text-sm"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {params.cat && <input type="hidden" name="cat" value={params.cat} />}
        </form>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(catItem => (
            <Link key={catItem} href={`/blog?${q ? `q=${encodeURIComponent(q)}&` : ""}cat=${encodeURIComponent(catItem)}`}
              className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                cat === catItem
                  ? "bg-orange-400 text-white shadow-sm shadow-orange-200 dark:shadow-none"
                  : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-orange-300 hover:text-orange-500"
              }`}>
              {catItem}
            </Link>
          ))}
        </div>
      </div>

      {/* Empty */}
      {posts.length === 0 && (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-neutral-500 dark:text-neutral-400">
            {q || cat !== "Всі" ? "Нічого не знайдено — спробуй інший запит" : "Публікацій ще немає"}
          </p>
          {(q || cat !== "Всі") && (
            <Link href="/blog" className="mt-4 inline-block text-orange-500 text-sm hover:underline">
              Скинути фільтри
            </Link>
          )}
        </div>
      )}

      {/* Featured */}
      {featured && !q && cat === "Всі" && (
        <div className="mb-8">
          <PostCard post={featured} featured />
        </div>
      )}

      {/* Grid */}
      {(q || cat !== "Всі" ? posts : rest).length > 0 && (
        <>
          {!q && cat === "Всі" && rest.length > 0 && (
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Всі статті</p>
              <p className="text-xs text-neutral-400">{allPosts.length} публікацій</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(q || cat !== "Всі" ? posts : rest).map(p => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}