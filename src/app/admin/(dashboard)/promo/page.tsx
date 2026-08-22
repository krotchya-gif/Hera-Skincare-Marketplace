"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, X, RefreshCcw, Check, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { STORE_NAME } from "@/utils/storeConfig";
import { formatRp } from "@/utils/format";
import type { Voucher, FlashSale } from "@/types/database";

function VoucherModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "nominal">("percent");
  const [value, setValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [quota, setQuota] = useState("");
  const [unlimitedQuota, setUnlimitedQuota] = useState(false);
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const generateCode = () => {
    // Generate kode 8 karakter secara crypto-safe
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    const code = Array.from(array, (byte) => chars[byte % chars.length]).join("");
    setCode(`${STORE_NAME.replace(/\s+/g, "").toUpperCase().slice(0, 5)}${code}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value) {
      setMessage({ type: "error", text: "Kode voucher dan nilai diskon wajib diisi!" });
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          code: code.toUpperCase().trim(),
          type: discountType,
          value: parseFloat(value),
          min_purchase: parseFloat(minPurchase) || 0,
          quota: unlimitedQuota ? null : parseInt(quota) || null,
          per_user_limit: parseInt(perUserLimit) || 1,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          is_active: true,
        };

        const res = await fetch("/api/admin/vouchers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal membuat voucher");
        }

        setMessage({ type: "success", text: "Voucher berhasil dibuat!" });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } catch (error) {
        setMessage({ type: "error", text: error instanceof Error ? error.message : "Terjadi kesalahan." });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-semibold text-gray-900">Buat Voucher Baru</h2>
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
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Kode Voucher *</label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 uppercase"
                placeholder="CONTOH: HERA15"
                required
              />
              <button
                type="button"
                onClick={generateCode}
                className="flex items-center gap-1.5 border border-gray-200 px-3 py-2.5 rounded-xl text-xs text-gray-600 hover:bg-gray-50"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipe Diskon</label>
            <div className="flex gap-2">
              {(["percent", "nominal"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setDiscountType(t)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${discountType === t ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {t === "percent" ? "Persentase %" : "Nominal Rp"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nilai Diskon *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{discountType === "percent" ? "%" : "Rp"}</span>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Min. Pembelian (Rp)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                <input
                  type="number"
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-600">Kuota Penggunaan</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <div onClick={() => setUnlimitedQuota(!unlimitedQuota)} className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${unlimitedQuota ? "bg-green-500" : "bg-gray-200"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${unlimitedQuota ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-xs text-gray-500">Tidak Terbatas</span>
              </label>
            </div>
            {!unlimitedQuota && (
              <input
                type="number"
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                placeholder="500"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Batas per User</label>
            <select
              value={perUserLimit}
              onChange={(e) => setPerUserLimit(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 bg-white"
            >
              <option value="1">1x</option>
              <option value="3">3x</option>
              <option value="10">10x</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Berlaku Mulai</label>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Berlaku Sampai</label>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50">Batal</button>
          <button type="submit" disabled={isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
            {isPending ? "Menyimpan..." : "Simpan Voucher"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Konversi ISO -> format "YYYY-MM-DDTHH:mm" untuk input datetime-local
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface FlashItemRow {
  product_id: string;
  flash_price: string;
  flash_stock: string;
}

function FlashSaleModal({
  sale,
  onClose,
  onSuccess,
}: {
  sale: FlashSale | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(sale?.name ?? "");
  const [startsAt, setStartsAt] = useState(sale ? toLocalInput(sale.starts_at) : "");
  const [endsAt, setEndsAt] = useState(sale ? toLocalInput(sale.ends_at) : "");
  const [items, setItems] = useState<FlashItemRow[]>(
    sale?.flash_sale_products?.length
      ? sale.flash_sale_products.map((p) => ({
          product_id: p.product_id,
          flash_price: String(p.flash_price),
          flash_stock: String(p.flash_stock),
        }))
      : [{ product_id: "", flash_price: "", flash_stock: "" }]
  );
  const [productOptions, setProductOptions] = useState<{ id: string; name: string; price: number }[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/admin/products?pageSize=100");
        if (!res.ok) return;
        const json = await res.json();
        setProductOptions(
          ((json.data ?? []) as { id: string; name: string; price: number }[]).map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
          }))
        );
      } catch (e) {
        console.error("Failed to fetch products", e);
      }
    };
    loadProducts();
  }, []);

  const updateItem = (index: number, patch: Partial<FlashItemRow>) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim()) return setMessage({ type: "error", text: "Nama event wajib diisi." });
    if (!startsAt || !endsAt) return setMessage({ type: "error", text: "Waktu mulai & berakhir wajib diisi." });
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return setMessage({ type: "error", text: "Format waktu tidak valid." });
    if (end <= start) return setMessage({ type: "error", text: "Waktu berakhir harus setelah waktu mulai." });

    const filled = items.filter((i) => i.product_id);
    if (filled.length === 0) return setMessage({ type: "error", text: "Minimal satu produk wajib dipilih." });
    for (const item of filled) {
      if (Number(item.flash_price) <= 0)
        return setMessage({ type: "error", text: "Harga flash harus lebih besar dari 0." });
      if (!Number.isInteger(Number(item.flash_stock)) || Number(item.flash_stock) < 0)
        return setMessage({ type: "error", text: "Stok flash harus berupa angka >= 0." });
    }

    const payload = {
      name: name.trim(),
      starts_at: startsAt,
      ends_at: endsAt,
      items: filled.map((i) => ({
        product_id: i.product_id,
        flash_price: Number(i.flash_price),
        flash_stock: Number(i.flash_stock),
      })),
    };

    startTransition(async () => {
      try {
        const res = await fetch(sale ? `/api/admin/flash-sales/${sale.id}` : "/api/admin/flash-sales", {
          method: sale ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal menyimpan flash sale");
        }
        setMessage({ type: "success", text: sale ? "Flash sale diperbarui!" : "Flash sale berhasil dibuat!" });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } catch (error) {
        setMessage({ type: "error", text: error instanceof Error ? error.message : "Terjadi kesalahan." });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-semibold text-gray-900">{sale ? "Edit Flash Sale" : "Buat Flash Sale Baru"}</h2>
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
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama Event *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
              placeholder="CONTOH: Flash Sale Gajian"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Mulai *</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Berakhir *</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-600">Produk &amp; Harga Flash *</label>
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, { product_id: "", flash_price: "", flash_stock: "" }])}
                className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Produk
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => {
                const selected = item.product_id ? productOptions.find((p) => p.id === item.product_id) : null;
                return (
                  <div key={index} className="flex gap-2 items-start bg-gray-50/60 rounded-xl p-2 border border-gray-100">
                    <select
                      value={item.product_id}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const opt = productOptions.find((p) => p.id === pid);
                        updateItem(index, { product_id: pid, flash_price: opt && !item.flash_price ? String(opt.price) : item.flash_price });
                      }}
                      className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-green-400 bg-white"
                    >
                      <option value="">Pilih produk...</option>
                      {productOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — Rp {p.price.toLocaleString("id-ID")}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.flash_price}
                      onChange={(e) => updateItem(index, { flash_price: e.target.value })}
                      className={`w-24 border rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-green-400 ${
                        selected && Number(item.flash_price) >= selected.price ? "border-red-300 bg-red-50" : "border-gray-200"
                      }`}
                      placeholder="Harga flash"
                      title={selected ? `Harga normal: Rp ${selected.price.toLocaleString("id-ID")}` : ""}
                    />
                    <input
                      type="number"
                      min="0"
                      value={item.flash_stock}
                      onChange={(e) => updateItem(index, { flash_stock: e.target.value })}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-green-400"
                      placeholder="Stok"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="w-8 h-8 shrink-0 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50">Batal</button>
          <button type="submit" disabled={isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
            {isPending ? "Menyimpan..." : "Simpan Flash Sale"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PromotionsPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [isFlashLoading, setIsFlashLoading] = useState(true);
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [editingFlash, setEditingFlash] = useState<FlashSale | null>(null);
  const [, startTransition] = useTransition();

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/vouchers");
      if (res.ok) {
        const data = await res.json();
        setVouchers(data ?? []);
      }
    } catch {
      console.error("Failed to fetch vouchers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startTransition(() => {
      fetchVouchers();
    });
  }, []);

  // Fetch flash sales via API admin (T-03)
  const fetchFlashSales = async () => {
    setIsFlashLoading(true);
    try {
      const res = await fetch("/api/admin/flash-sales");
      if (res.ok) {
        const data = await res.json();
        setFlashSales(data ?? []);
      }
    } catch (e) {
      console.error("Failed to fetch flash sales", e);
    } finally {
      setIsFlashLoading(false);
    }
  };

  useEffect(() => {
    startTransition(() => {
      fetchFlashSales();
    });
  }, []);

  const handleToggleFlashStatus = async (id: string, currentActive: boolean) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/flash-sales/${id}/toggle`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !currentActive }),
        });
        if (res.ok) {
          fetchFlashSales();
        }
      } catch (error) {
        console.error("Failed to toggle flash status", error);
      }
    });
  };

  const handleDeleteFlash = async (sale: FlashSale) => {
    if (!confirm(`Hapus flash sale "${sale.name}" beserta semua produknya?`)) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/flash-sales/${sale.id}`, { method: "DELETE" });
        if (res.ok) {
          fetchFlashSales();
        }
      } catch (error) {
        console.error("Failed to delete flash sale", error);
      }
    });
  };

  const handleToggleVoucherStatus = async (id: string, currentActive: boolean) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/vouchers/${id}/toggle`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !currentActive }),
        });
        if (res.ok) {
          fetchVouchers();
        }
      } catch (error) {
        console.error("Failed to toggle status", error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Promo & Diskon</h2>
        <p className="text-sm text-gray-500 mt-0.5">Kelola voucher dan promo</p>
      </div>

      {/* Voucher Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">🏷️ Kode Voucher</h3>
          <button id="btn-create-voucher" onClick={() => setShowVoucherModal(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow-sm">
            <Plus className="w-4 h-4" /> Buat Voucher
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Kode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tipe</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nilai</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Min. Belanja</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Digunakan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Berakhir Pada</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">Belum ada voucher terdaftar.</td>
                  </tr>
                ) : (
                  vouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg">{v.code}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600">{v.type === "percent" ? "Persentase" : "Nominal"}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-gray-900">
                        {v.type === "percent" ? `${v.value}%` : formatRp(v.value)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 hidden md:table-cell">{formatRp(v.min_purchase)}</td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs text-gray-700">{v.used_count} / {v.quota === null ? "∞" : v.quota}</div>
                        {v.quota !== null && (
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min((v.used_count / v.quota) * 100, 100)}%` }} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 hidden lg:table-cell">
                        {v.ends_at ? new Date(v.ends_at).toLocaleDateString("id-ID") : "Selamanya"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block ${v.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {v.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleVoucherStatus(v.id, v.is_active)}
                          className={`text-xs font-semibold hover:underline ${v.is_active ? "text-red-500" : "text-green-500"}`}
                        >
                          {v.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showVoucherModal && (
        <VoucherModal
          onClose={() => setShowVoucherModal(false)}
          onSuccess={fetchVouchers}
        />
      )}

      {/* Flash Sale Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">🔥 Flash Sale</h3>
            <p className="text-xs text-gray-400">Daftar event flash sale</p>
          </div>
          <button
            onClick={() => {
              setEditingFlash(null);
              setShowFlashModal(true);
            }}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Flash Sale
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Nama Event</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Mulai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Berakhir</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Produk</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isFlashLoading ? (
                <tr><td colSpan={6} className="text-center py-8"><div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" /></td></tr>
              ) : flashSales.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada flash sale.</td></tr>
              ) : (
                flashSales.map((fs) => (
                  <tr key={fs.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5"><span className="font-medium text-gray-900 text-xs">{fs.name}</span></td>
                    <td className="px-4 py-3.5"><span className="text-xs text-gray-600">{new Date(fs.starts_at).toLocaleDateString("id-ID")}</span></td>
                    <td className="px-4 py-3.5"><span className="text-xs text-gray-600">{new Date(fs.ends_at).toLocaleDateString("id-ID")}</span></td>
                    <td className="px-4 py-3.5"><span className="text-xs text-gray-600">{fs.flash_sale_products?.length ?? 0} produk</span></td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleFlashStatus(fs.id, fs.is_active)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer ${fs.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {fs.is_active ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingFlash(fs);
                            setShowFlashModal(true);
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-blue-500"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFlash(fs)}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showFlashModal && (
        <FlashSaleModal
          sale={editingFlash}
          onClose={() => setShowFlashModal(false)}
          onSuccess={fetchFlashSales}
        />
      )}
    </div>
  );
}
