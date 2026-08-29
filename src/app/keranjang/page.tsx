"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatRp } from "@/utils/format";
import { createClient } from "@/utils/supabase/client";
import { Trash2,
  Plus,
  Minus,
  Tag,
  ChevronRight,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Shield,
  Package,
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface LocalCartItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  quantity: number;
  image: string | null;
  variant: string | null;
  stock: number;
  slug: string | null;
}

export default function KeranjangPage() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<LocalCartItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [freeShippingMin, setFreeShippingMin] = useState(50000);
  const [freeShippingActive, setFreeShippingActive] = useState(true);
  const [shippingCost] = useState(12000);
  const [, startTransition] = useTransition();

  // Load cart and settings on mount
  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
    try {
      const cartStr = localStorage.getItem("hera_cart");
      if (cartStr) {
        const cart = JSON.parse(cartStr);
        if (Array.isArray(cart)) {
          startTransition(() => {
            setCartItems(cart);
            setCheckedItems(cart.map((item) => item.id));
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Fetch shipping settings from public store_settings table
    const loadSettings = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("store_settings")
          .select("*")
          .in("key", ["shipping"]);
        if (data) {
          const shipping = data.find(d => d.key === "shipping")?.value as any;
          if (shipping?.free_shipping_min) setFreeShippingMin(shipping.free_shipping_min);
          if (shipping?.free_shipping === false) setFreeShippingActive(false);
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    loadSettings();
  }, []);

  // Cleanup checkout data when cart becomes empty
  useEffect(() => {
    if (mounted && cartItems.length === 0) {
      localStorage.removeItem("hera_checkout_items");
      localStorage.removeItem("hera_applied_voucher");
    }
  }, [mounted, cartItems.length]);

  // Save cart to storage helper
  const saveCartToStorage = (updatedCart: LocalCartItem[]) => {
    localStorage.setItem("hera_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const allChecked = checkedItems.length === cartItems.length;

  const toggleAll = () => {
    if (allChecked) setCheckedItems([]);
    else setCheckedItems(cartItems.map((i) => i.id));
  };

  const toggleItem = (id: string) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const updateQty = (id: string, delta: number) => {
    const updated = cartItems.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, Math.min(item.stock || 99, item.quantity + delta)) }
        : item
    );
    setCartItems(updated);
    saveCartToStorage(updated);
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    setCheckedItems((prev) => prev.filter((i) => i !== id));
    saveCartToStorage(updated);
  };

  // Calculations
  const selectedItems = cartItems.filter((item) => checkedItems.includes(item.id));
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const applyVoucher = async () => {
    if (!voucherCode) return;
    setIsValidating(true);
    setVoucherError("");
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherCode, total: subtotal }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setAppliedVoucher(data.voucher.code);
          setDiscountValue(data.discount);
          setVoucherError("");
        } else {
          setVoucherError(data.message);
          setAppliedVoucher(null);
          setDiscountValue(0);
        }
      } else {
        throw new Error();
      }
    } catch {
      setVoucherError("Kode voucher tidak valid atau sudah kadaluarsa");
      setAppliedVoucher(null);
      setDiscountValue(0);
    } finally {
      setIsValidating(false);
    }
  };

  const ongkir = (freeShippingActive && subtotal >= freeShippingMin) ? 0 : shippingCost;
  const diskon = appliedVoucher ? discountValue : 0;
  const total = subtotal + ongkir - diskon;

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast("error", "Pilih minimal satu produk sebelum checkout");
      return;
    }
    localStorage.setItem("hera_checkout_items", JSON.stringify(selectedItems));
    localStorage.setItem("hera_applied_voucher", JSON.stringify({
      code: appliedVoucher,
      discount: discountValue
    }));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-gray-400 py-16">Memuat keranjang...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">Beranda</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Keranjang Belanja</span>
        </nav>

        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-green-600" /> Keranjang Belanja
        </h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Keranjang Kosong</h2>
            <p className="text-gray-500 text-sm mb-6">
              Yuk, tambahkan produk favoritmu ke keranjang!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" /> Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Select All */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-green-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Pilih Semua ({cartItems.length} produk)
                  </span>
                </label>
                {checkedItems.length > 0 && (
                  <button
                    onClick={() => {
                      cartItems
                        .filter((i) => checkedItems.includes(i.id))
                        .forEach((i) => removeItem(i.id));
                    }}
                    className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Dipilih
                  </button>
                )}
              </div>

              {/* Items */}
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                    checkedItems.includes(item.id) ? "border-green-200" : "border-gray-100"
                  }`}
                >
                  <div className="p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
                    <input
                      type="checkbox"
                      checked={checkedItems.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="w-4 h-4 mt-1 accent-green-600 cursor-pointer shrink-0"
                    />

                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 rounded-xl overflow-hidden shrink-0">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- gambar produk dari storage/cdn
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl text-green-600/40">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* T-61: nama dapat lebar penuh (hapus pindah ke kanan nama),
                        harga + stepper satu baris di bawah — tidak saling menekan */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
                          {item.name}
                        </p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                          aria-label={`Hapus ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {item.variant && (
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full mt-1">
                          {item.variant}
                        </span>
                      )}
                      {item.originalPrice && (
                        <p className="text-xs text-gray-400 line-through mt-1">
                          {formatRp(item.originalPrice)}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <p className="text-base font-bold text-green-700 whitespace-nowrap">
                          {formatRp(item.price)}
                        </p>
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-9 h-8 flex items-center justify-center text-sm font-semibold text-gray-900 border-x border-gray-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        Subtotal:{" "}
                        <span className="font-semibold text-gray-700 whitespace-nowrap">
                          {formatRp(item.price * item.quantity)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              {/* Voucher */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-600" /> Kode Voucher
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(""); }}
                    placeholder="Masukkan kode voucher"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                  />
                  <button
                    onClick={applyVoucher}
                    disabled={isValidating}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isValidating ? "..." : "Pakai"}
                  </button>
                </div>
                {voucherError && (
                  <p className="text-xs text-red-500 mt-2">{voucherError}</p>
                )}
                {appliedVoucher && (
                  <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-green-700 font-medium">
                      ✓ Voucher {appliedVoucher} berhasil diterapkan! Hemat {formatRp(diskon)}
                    </p>
                    <button
                      onClick={() => { setAppliedVoucher(null); setVoucherCode(""); setDiscountValue(0); }}
                      className="text-xs text-red-500"
                    >
                      Hapus
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">Coba voucher dari database (contoh: HERA15)</p>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h3>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal ({selectedItems.length} produk)
                    </span>
                    <span className="font-medium text-gray-900">{formatRp(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> Ongkos Kirim
                    </span>
                    <span className={`font-medium ${ongkir === 0 ? "text-green-600" : "text-gray-900"}`}>
                      {ongkir === 0 ? "Gratis!" : formatRp(ongkir)}
                    </span>
                  </div>
                  {diskon > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Diskon Voucher</span>
                      <span className="font-medium text-red-500">-{formatRp(diskon)}</span>
                    </div>
                  )}
                  {ongkir === 0 && subtotal > 0 && (
                    <div className="bg-green-50 text-green-700 text-xs px-3 py-2 rounded-lg">
                      🎉 Kamu mendapat gratis ongkir!
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-green-700">{formatRp(total)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={handleCheckout}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors ${
                    selectedItems.length === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Lanjut ke Checkout
                  <ChevronRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center gap-1 mt-3 justify-center">
                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs text-gray-400">Pembayaran 100% aman & terenkripsi</p>
                </div>
              </div>

              {/* Continue shopping */}
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-green-700 hover:bg-green-50 border border-green-200 transition-colors"
              >
                ← Lanjut Belanja
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
