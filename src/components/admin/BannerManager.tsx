"use client";

// T-63: manajemen banner promosi — tab "Banner" di /admin/marketing.
// CRUD via /api/admin/banners* (pola flash-sales); upload gambar via
// /api/admin/upload yang sudah ada (magic-bytes verified).
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { Plus, Pencil, Trash2, Loader2, ImagePlus } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  image_url_mobile: string | null;
  link_url: string | null;
  placement: "hero" | "strip";
  sort_order: number;
  is_active: boolean;
}

interface BannerForm {
  title: string;
  subtitle: string;
  image_url: string;
  image_url_mobile: string;
  link_url: string;
  placement: "hero" | "strip";
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM: BannerForm = {
  title: "",
  subtitle: "",
  image_url: "",
  image_url_mobile: "",
  link_url: "",
  placement: "hero",
  sort_order: 0,
  is_active: true,
};

// T-70: upload banner memakai jalur "temp" pada /api/admin/upload —
// TANPA referensi product_images (UUID placeholder akan ditolak FK).
// URL gambar tersimpan di banners.image_url, bukan di tabel produk.
const UPLOAD_NO_REF = "temp";

// T-78/T-79: catatan ukuran per posisi — WAJIB sinkron dengan rasio frame di
// BannerCarousel.tsx (hero: 16:5/4:3; strip: 11:2/2:1). Frame DIKUNCI
// aspect-ratio sehingga catatan ini = patokan presisi (tidak kepotong/peyang).
const PLACEMENT_NOTES: Record<
  "hero" | "strip",
  { label: string; desktop: string; mobile: string }
> = {
  hero: {
    label: "Hero (atas)",
    desktop: "±1600×500 px (rasio 16:5)",
    mobile: "±800×600 px (rasio 4:3)",
  },
  strip: {
    label: "Promo (bawah)",
    desktop: "±1600×290 px (rasio 11:2)",
    mobile: "±800×400 px (rasio 2:1)",
  },
};

export default function BannerManager() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM);

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/banners");
      if (res.ok) setBanners(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (b: Banner) => {
    setEditId(b.id);
    setForm({
      title: b.title,
      subtitle: b.subtitle || "",
      image_url: b.image_url,
      image_url_mobile: b.image_url_mobile || "",
      link_url: b.link_url || "",
      placement: b.placement,
      sort_order: b.sort_order,
      is_active: b.is_active,
    });
    setShowForm(true);
  };

  const handleUpload = async (file: File, target: "desktop" | "mobile") => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", UPLOAD_NO_REF);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Gagal upload gambar");
      }
      if (target === "mobile") setForm((f) => ({ ...f, image_url_mobile: data.url }));
      else setForm((f) => ({ ...f, image_url: data.url }));
      toast("success", "Gambar terunggah.");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(editId ? `/api/admin/banners/${editId}` : "/api/admin/banners", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Gagal menyimpan banner");
      toast("success", editId ? "Banner diperbarui." : "Banner dibuat.");
      setShowForm(false);
      fetchBanners();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Gagal menyimpan banner");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (b: Banner) => {
    const res = await fetch(`/api/admin/banners/${b.id}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !b.is_active }),
    });
    if (res.ok) fetchBanners();
    else toast("error", "Gagal mengubah status banner.");
  };

  const handleDelete = async (b: Banner) => {
    if (!confirm(`Hapus banner "${b.title}"?`)) return;
    const res = await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("success", "Banner dihapus.");
      fetchBanners();
    } else toast("error", "Gagal menghapus banner.");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-sm text-gray-400 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat banner...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">Banner Promosi</h3>
          <p className="text-xs text-gray-400">
            Carousel beranda: <span className="font-medium text-gray-500">Hero (atas)</span> ukuran besar 16:5/4:3 ·
            <span className="font-medium text-gray-500"> Promo (bawah)</span> ramping 11:2/2:1 (iklan produk baru dll). Kosong = section tidak dirender.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Banner
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-400">
          Belum ada banner. Gunakan tombol Banner di kanan atas untuk membuat promosi pertama.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari storage/cdn */}
              <img src={b.image_url} alt={b.title} className="w-20 h-12 rounded-lg object-cover shrink-0" loading="lazy" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm truncate">{b.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${b.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {b.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">{b.placement}</span>
                </div>
                {b.subtitle && <p className="text-xs text-gray-500 truncate">{b.subtitle}</p>}
                <p className="text-[11px] text-gray-400 truncate">
                  urutan {b.sort_order}
                  {b.link_url ? ` · ${b.link_url}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleToggle(b)} className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg ${b.is_active ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-700"}`}>
                  {b.is_active ? "Matikan" : "Aktifkan"}
                </button>
                <button onClick={() => openEdit(b)} className="p-2 text-gray-400 hover:text-green-600" aria-label={`Edit ${b.title}`}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(b)} className="p-2 text-gray-400 hover:text-red-500" aria-label={`Hapus ${b.title}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editId ? "Edit Banner" : "Banner Baru"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600" aria-label="Tutup">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Judul *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subjudul</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Gambar Desktop * <span className="text-gray-400 font-normal">— {PLACEMENT_NOTES[form.placement].desktop}</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    {uploading ? "Mengunggah..." : "Pilih Gambar"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f, "desktop");
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {form.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element -- preview dari storage/cdn
                    <img src={form.image_url} alt="preview desktop" className="w-16 h-10 rounded-lg object-cover" />
                  )}
                </div>
                {form.image_url && <p className="text-[10px] text-gray-400 mt-1 truncate">{form.image_url}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Gambar Mobile <span className="text-gray-400 font-normal">— {PLACEMENT_NOTES[form.placement].mobile}</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    Pilih Gambar
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f, "mobile");
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {form.image_url_mobile && (
                    // eslint-disable-next-line @next/next/no-img-element -- preview dari storage/cdn
                    <img src={form.image_url_mobile} alt="preview mobile" className="w-16 h-10 rounded-lg object-cover" />
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Opsional — kosongkan untuk memakai gambar desktop di semua perangkat.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Link Tujuan (opsional)</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                  placeholder="/kategori/skincare atau https://..."
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Penempatan</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                    value={form.placement}
                    onChange={(e) => setForm({ ...form, placement: e.target.value as BannerForm["placement"] })}
                  >
                    <option value="hero">Hero (atas) — 16:5 / 4:3</option>
                    <option value="strip">Promo (bawah) — 11:2 / 2:1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Urutan</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                    value={form.is_active ? "1" : "0"}
                    onChange={(e) => setForm({ ...form, is_active: e.target.value === "1" })}
                  >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving || uploading} className="flex-1 bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
