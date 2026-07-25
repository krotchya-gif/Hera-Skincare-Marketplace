"use client";

import { useState, useTransition } from "react";
import { X, Upload, RefreshCw, Check, AlertCircle } from "lucide-react";
import { STORE_NAME } from "@/utils/storeConfig";
import type { Product, Category } from "@/types/database";

export default function ProductFormModal({
  onClose,
  onSuccess,
  categories,
  editProduct,
}: {
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  editProduct?: Product | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: editProduct?.name ?? "",
    sku: editProduct?.sku ?? "",
    brand: editProduct?.brand ?? "",
    description: editProduct?.description ?? "",
    category_id: editProduct?.category_id ?? "",
    price: editProduct?.price?.toString() ?? "",
    discount_price: editProduct?.discount_price?.toString() ?? "",
    stock: editProduct?.stock?.toString() ?? "",
    unit: editProduct?.unit ?? "pcs",
    weight_gram: editProduct?.weight_gram?.toString() ?? "",
    slug: editProduct?.slug ?? "",
    is_active: editProduct?.is_active ?? true,
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>(editProduct?.product_images?.map((img) => img.url) ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = async (files: File[], productId: string) => {
    setIsUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          setUploadedImages((prev) => [...prev, data.url]);
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    setIsUploading(false);
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    if (editProduct?.id) {
      await uploadFiles(fileArray, editProduct.id);
    } else {
      setPendingFiles((prev) => [...prev, ...fileArray]);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    startTransition(async () => {
      try {
        const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const payload = {
          name: form.name,
          sku: form.sku || null,
          brand: form.brand || null,
          description: form.description || null,
          category_id: form.category_id || null,
          price: parseFloat(form.price) || 0,
          discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
          stock: parseInt(form.stock) || 0,
          unit: form.unit,
          weight_gram: form.weight_gram ? parseInt(form.weight_gram) : null,
          slug,
          is_active: isDraft ? false : form.is_active,
          images: editProduct ? undefined : uploadedImages,
        };

        const url = editProduct ? `/api/admin/products/${editProduct.id}` : `/api/admin/products`;
        const method = editProduct ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Gagal menyimpan produk");

        if (!editProduct && pendingFiles.length > 0) {
          const savedProduct = await res.clone().json();
          if (savedProduct?.id) {
            await uploadFiles(pendingFiles, savedProduct.id);
            setPendingFiles([]);
          }
        }

        setMessage({ type: "success", text: isDraft ? "Draft tersimpan!" : "Produk berhasil dipublish!" });
        setTimeout(() => { onSuccess(); onClose(); }, 1200);
      } catch {
        setMessage({ type: "error", text: "Gagal menyimpan. Coba lagi." });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white h-full w-full max-w-2xl shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {editProduct ? "Edit Produk" : "Tambah Produk Baru"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Informasi Dasar</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama Produk *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  placeholder="Masukkan nama produk"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">SKU</label>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    type="text"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                    placeholder="SCT-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Merek</label>
                  <input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    type="text"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                    placeholder={STORE_NAME}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Kategori *</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Deskripsi *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-none"
                  placeholder="Minimal 50 karakter..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Slug URL</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  type="text"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  placeholder="auto-generate dari nama produk"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Harga & Stok</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Harga Normal *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                  <input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    type="number"
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                    placeholder="25000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Harga Diskon</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                  <input
                    value={form.discount_price}
                    onChange={(e) => setForm({ ...form, discount_price: e.target.value })}
                    type="number"
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                    placeholder="20000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Stok *</label>
                <input
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  type="number"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Satuan</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
                >
                  <option>pcs</option>
                  <option>botol</option>
                  <option>pak</option>
                  <option>lusin</option>
                  <option>box</option>
                  <option>tube</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Pengiriman</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Berat (gram)</label>
                <input
                  value={form.weight_gram}
                  onChange={(e) => setForm({ ...form, weight_gram: e.target.value })}
                  type="number"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  placeholder="500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Foto Produk</h3>
            {uploadedImages.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {uploadedImages.map((url, i) => (
                  <div key={i} className="w-16 h-16 bg-green-50 rounded-xl border border-gray-200 overflow-hidden relative">
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <label className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-green-300 hover:bg-green-50/30 cursor-pointer transition-colors block">
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                {isUploading ? "Mengupload..." : pendingFiles.length > 0 ? `${pendingFiles.length} file menunggu upload...` : "Drag & drop foto di sini"}
              </p>
              <p className="text-xs text-gray-400 mt-1">Maks. 5 foto, maks. 2MB per foto (JPG, PNG, WebP)</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                disabled={isUploading}
                onChange={(e) => handleUploadFiles(e.target.files)}
              />
              <div className="mt-3 inline-block bg-white border border-gray-200 text-gray-600 text-xs font-medium px-4 py-2 rounded-lg hover:border-green-400 hover:text-green-600 cursor-pointer">
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading...
                  </span>
                ) : pendingFiles.length > 0 ? `${pendingFiles.length} file tertunda` : "Pilih File"}
              </div>
            </label>
            {pendingFiles.length > 0 && (
              <p className="text-[10px] text-green-600 mt-2">✓ File akan otomatis diupload setelah produk berhasil dipublish.</p>
            )}
            {pendingFiles.length === 0 && (
              <p className="text-[10px] text-gray-400 mt-2">
                ⚠️ Untuk produk baru, file akan diupload otomatis setelah produk berhasil dibuat.
              </p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50">
            Batal
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={isPending}
            className="px-5 border border-green-600 text-green-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-green-50 disabled:opacity-50"
          >
            Simpan Draft
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={isPending || !form.name || !form.price}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Publish Produk"}
          </button>
        </div>
      </div>
    </div>
  );
}
