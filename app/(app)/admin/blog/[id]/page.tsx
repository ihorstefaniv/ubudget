// ФАЙЛ: app/(admin)/blog/[id]/page.tsx
// URL: /admin/blog/[id] — редагування існуючої статті

import BlogEditor from "../_components/BlogEditor";

export default function AdminBlogEditPage({ params }: { params: { id: string } }) {
  return <BlogEditor postId={params.id} />;
}