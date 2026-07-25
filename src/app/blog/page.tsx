import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { STORE_NAME } from "@/utils/storeConfig";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: `Blog — ${STORE_NAME}`,
  description: `Baca artikel dan tips terbaru seputar produk rumah tangga dan perawatan dari ${STORE_NAME}.`,
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: blogData } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "page_blog")
    .maybeSingle();

  const blog = (blogData?.value as {
    articles?: { slug: string; title: string; excerpt: string; emoji: string }[];
  }) || {};

  const articles = blog.articles || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-500 mt-1">Tips dan artikel seputar produk rumah tangga</p>
        </div>

        {articles.length > 0 ? (
          <div className="grid gap-4">
            {articles.map((article) => (
              <div
                key={article.slug}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 block"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl shrink-0">{article.emoji || "📝"}</span>
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{article.title}</h2>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{article.excerpt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <span className="text-5xl block mb-3">📝</span>
            <p className="font-semibold text-gray-900">Belum ada artikel</p>
            <p className="text-sm text-gray-500 mt-1">Belum ada artikel blog yang diterbitkan.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
