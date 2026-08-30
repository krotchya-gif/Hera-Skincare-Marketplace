import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { STORE_NAME } from "@/utils/storeConfig";
import { createClient } from "@/utils/supabase/server";
import { FileText } from "lucide-react";
import { optimizeImageUrl, BLOG_COVER } from "@/lib/image";

export const metadata = {
  title: `Blog — ${STORE_NAME}`,
  description: `Baca artikel dan tips terbaru seputar skincare dan perawatan dari ${STORE_NAME}.`,
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: blogData } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "page_blog")
    .maybeSingle();

  const blog = (blogData?.value as {
    articles?: { slug: string; title: string; excerpt: string; emoji: string; image_url?: string; tags?: string[] }[];
  }) || {};

  const articles = blog.articles || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-500 mt-1">Tips dan artikel seputar skincare</p>
        </div>

        {articles.length > 0 ? (
          <div className="grid gap-4">
            {articles.map((article) => (
              <div
                key={article.slug}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 block"
              >
                <div className="flex items-start gap-4">
                  {article.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- gambar dari storage/cdn
                    <img
                      src={optimizeImageUrl(article.image_url, BLOG_COVER) ?? undefined}
                      alt={article.title}
                      className="w-24 h-14 sm:w-32 sm:h-18 rounded-xl object-cover border border-gray-100 shrink-0"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{article.title}</h2>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{article.excerpt}</p>
                    {Array.isArray(article.tags) && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {article.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center bg-green-50 text-green-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-900">Belum ada artikel</p>
            <p className="text-sm text-gray-500 mt-1">Belum ada artikel blog yang diterbitkan.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
