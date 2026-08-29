"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Edit, Trash2, X, Check, AlertCircle, RefreshCw } from "lucide-react";
import { CategoryIcon, SUGGESTED_ICONS, CATEGORY_ICON_NAMES } from "@/components/CategoryIcon";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  product_count?: number;
}

function CategoryFormModal({
  onClose,
  onSuccess,
  editCategory,
}: {
  onClose: () => void;
  onSuccess: () => void;
  editCategory?: CategoryItem | null;
}) {
  const [name, setName] = useState(editCategory?.name || "");
  const [slug, setSlug] = useState(editCategory?.slug || "");
  const [icon, setIcon] = useState(editCategory?.icon || "");
  const [sortOrder, setSortOrder] = useState(editCategory?.sort_order?.toString() || "0");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const autoSlug = (val: string) => {
    if (editCategory) return; // don't auto-generate when editing
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: "error", text: "Nama kategori wajib diisi!" });
      return;
    }

    setIsPending(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        icon: icon.trim() || null,
        sort_order: parseInt(sortOrder) || 0,
        is_active: true,
      };

      const url = editCategory ? `/api/admin/categories/${editCategory.id}` : "/api/admin/categories";
      const method = editCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan kategori");

      setMessage({ type: "success", text: editCategory ? "Kategori berhasil diupdate!" : "Kategori berhasil dibuat!" });
      setTimeout(() => { onSuccess(); onClose(); }, 1000);
    } catch {
      setMessage({ type: "error", text: "Gagal menyimpan. Coba lagi." });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{editCategory ? "Edit Kategori" : "Tambah Kategori Baru"}</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama Kategori *</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); autoSlug(e.target.value); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
              placeholder="Perawatan Tubuh"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Slug URL</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
              placeholder="perawatan-tubuh"
            />
            <p className="text-[10px] text-gray-400 mt-1">Auto-generate dari nama jika dikosongkan</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Icon (Lucide)</label>
            <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 mb-2">
              {CATEGORY_ICON_NAMES.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                    icon === iconName
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600"
                  }`}
                  title={iconName}
                >
                  <CategoryIcon name={iconName} className="w-4 h-4" />
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mb-1">Disarankan:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                    icon === iconName
                      ? "bg-green-600 text-white border-green-600"
                      : "border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600"
                  }`}
                >
                  <CategoryIcon name={iconName} className="w-3 h-3" />
                  {iconName}
                </button>
              ))}
            </div>
            {icon && (
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                Terpilih: <CategoryIcon name={icon} className="w-4 h-4 text-green-600" />
                <span className="font-mono text-[10px]">{icon}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Urutan</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
              placeholder="0"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50">
            Batal
          </button>
          <button type="submit" disabled={isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
            {isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data ?? []);
      }
    } catch {
      console.error("Failed to fetch categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startTransition(() => {
      fetchCategories();
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Nonaktifkan kategori ini? Produk dalam kategori ini tidak akan terhapus.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (res.ok) fetchCategories();
    } catch {
      console.error("Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manajemen Kategori</h2>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} kategori terdaftar</p>
        </div>
        <button
          id="btn-add-category"
          onClick={() => { setEditCategory(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Kategori
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
                <div className="w-16 h-8 bg-gray-100 rounded-lg" />
              </div>
              <div className="h-5 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <span className="text-5xl block mb-3">📂</span>
          <p className="text-gray-900 font-semibold mb-1">Belum ada kategori</p>
          <p className="text-gray-500 text-sm">Tambahkan kategori produk pertama Anda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories
            .filter((c) => c.is_active)
            .map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-700">
                    <CategoryIcon name={cat.icon} className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      id={`btn-edit-cat-${cat.id}`}
                      onClick={() => { setEditCategory(cat); setShowModal(true); }}
                      className="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-gray-400 flex items-center justify-center"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-delete-cat-${cat.id}`}
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center disabled:opacity-40"
                    >
                      {deletingId === cat.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">/{cat.slug}</p>
                <p className="text-sm text-green-600 font-semibold mt-2">{cat.product_count ?? 0} produk</p>
              </div>
            ))}
        </div>
      )}

      {showModal && (
        <CategoryFormModal
          onClose={() => { setShowModal(false); setEditCategory(null); }}
          onSuccess={fetchCategories}
          editCategory={editCategory}
        />
      )}
    </div>
  );
}
