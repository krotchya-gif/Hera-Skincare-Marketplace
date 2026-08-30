"use client";

import { useState, useEffect } from "react";
import { Plus, Save, Loader2, FileText } from "lucide-react";
import { useToast } from "@/components/Toast";

interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  emoji: string;
  image_url: string;
  tags: string[];
}

// T-83: input tag (chips) — ketik + Enter/koma untuk menambah
function TagInput({ tags, onTagsChange }: { tags: string[]; onTagsChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) onTagsChange([...tags, t]);
    setInput("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map((tag, i) => (
          <span key={`${tag}-${i}`} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-medium px-2 py-1 rounded-full">
            #{tag}
            <button
              type="button"
              onClick={() => onTagsChange(tags.filter((_, j) => j !== i))}
              className="hover:text-red-500 leading-none"
              aria-label={`Hapus tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        placeholder="Ketik tag lalu Enter (contoh: skincare, tips)"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
      />
    </div>
  );
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
      setArticles(
        (blogData?.articles || []).map((a) => ({
          ...a,
          image_url: a.image_url || "",
          tags: Array.isArray(a.tags) ? a.tags : [],
        }))
      );
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
    setArticles([...articles, { slug: "", title: "", excerpt: "", emoji: "file", image_url: "", tags: [] }]);
  };

  const removeArticle = (index: number) => {
    setArticles(articles.filter((_, i) => i !== index));
  };

  const updateArticle = (index: number, field: keyof BlogArticle, value: string) => {
    const updated = [...articles];
    updated[index] = { ...updated[index], [field]: value };
    setArticles(updated);
  };

  // T-83: upload gambar cover via jalur "temp" (pola banner — tanpa referensi produk)
  const [uploading, setUploading] = useState(false);
  const uploadCover = async (index: number, file: File) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", "temp");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengupload gambar cover");
      updateArticle(index, "image_url", json.url);
      toast("success", "Gambar cover terunggah.");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
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
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ikon</label>
                  <input
                    value={article.emoji}
                    onChange={(e) => updateArticle(i, "emoji", e.target.value)}
                    placeholder="(opsional)"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Gambar Cover (opsional) <span className="text-gray-400 font-normal">— ±800×450 px (rasio 16:9), JPEG/PNG/WebP maks 2MB</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className={`inline-flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 shrink-0 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {article.image_url ? "Ganti Gambar" : "Upload Gambar"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadCover(i, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {article.image_url && (
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari storage/cdn */}
                        <img src={article.image_url} alt="Preview cover" className="w-20 h-11 rounded-lg object-cover border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => updateArticle(i, "image_url", "")}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tag / Keyword (opsional)</label>
                  <TagInput tags={article.tags} onTagsChange={(t) => {
                    const updated = [...articles];
                    updated[i] = { ...updated[i], tags: t };
                    setArticles(updated);
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
