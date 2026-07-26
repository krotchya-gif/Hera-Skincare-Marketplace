"use client";

import { useState, useEffect } from "react";
import { Plus, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";

interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  emoji: string;
}

export default function BlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Gagal memuat data blog");
      const json = await res.json();
      const blogData = json.settings?.page_blog as { articles?: BlogArticle[] } | undefined;
      setArticles(blogData?.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const saveArticles = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "page_blog",
          value: { articles }
        })
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      toast("success", "Blog berhasil disimpan!");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const addArticle = () => {
    setArticles([...articles, { slug: "", title: "", excerpt: "", emoji: "📝" }]);
  };

  const removeArticle = (index: number) => {
    setArticles(articles.filter((_, i) => i !== index));
  };

  const updateArticle = (index: number, field: keyof BlogArticle, value: string) => {
    const updated = [...articles];
    updated[index] = { ...updated[index], [field]: value };
    setArticles(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={fetchArticles} className="mt-4 text-green-600 hover:underline text-sm font-semibold">
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blog / Artikel</h2>
          <p className="text-sm text-gray-500 mt-0.5">Kelola artikel blog yang tampil di halaman publik</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addArticle}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Artikel
          </button>
          <button
            onClick={saveArticles}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <span className="text-5xl block mb-3">📝</span>
          <p className="font-semibold text-gray-900">Belum ada artikel</p>
          <p className="text-sm text-gray-500 mt-1">Klik &quot;Tambah Artikel&quot; untuk mulai menulis.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Artikel #{i + 1}
                </span>
                <button
                  onClick={() => removeArticle(i)}
                  className="text-red-400 hover:text-red-600 text-xs font-semibold"
                >
                  Hapus
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
                  <input
                    value={article.slug}
                    onChange={(e) => updateArticle(i, "slug", e.target.value)}
                    placeholder="contoh: tips-belajar"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Emoji</label>
                  <input
                    value={article.emoji}
                    onChange={(e) => updateArticle(i, "emoji", e.target.value)}
                    placeholder="📝"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Judul</label>
                  <input
                    value={article.title}
                    onChange={(e) => updateArticle(i, "title", e.target.value)}
                    placeholder="Judul artikel"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ringkasan</label>
                <textarea
                  rows={2}
                  value={article.excerpt}
                  onChange={(e) => updateArticle(i, "excerpt", e.target.value)}
                  placeholder="Ringkasan artikel..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
