"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/components/Toast";
import { createClient } from "@/utils/supabase/client";
import { formatRp } from "@/utils/format";
import {
  ChevronRight,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  Plus,
  Check,
  Copy,
  X,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  emoji?: string | null;
  variantId?: string | null;
  variant?: string | null;
}

const STEPS = [
  { id: 1, label: "Alamat" },
  { id: 2, label: "Pengiriman" },
  { id: 3, label: "Pembayaran" },
  { id: 4, label: "Konfirmasi" },
  { id: 5, label: "Selesai" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<{ courier: string; logo: string; services: { name: string; code: string; etd: string; price: number }[] }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ group: string; icon: string; options: { code: string; name: string; logo: string }[] }[]>([]);

  const [orderNumber, setOrderNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const isSubmittingRef = useRef(false);

  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [, setVoucherCode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [, startTransition] = useTransition();

  // Address modal states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "Rumah",
    name: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    is_default: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });

    // Fetch saved addresses from API
    fetch("/api/addresses")
      .then((r) => r.ok ? r.json() : [])
      .then((addrs) => {
        startTransition(() => {
          setSavedAddresses(addrs);
          if (addrs.length > 0) {
            const defaultAddr = addrs.find((a: SavedAddress) => a.is_default) || addrs[0];
            setSelectedAddress(defaultAddr.id);
          }
        });
      })
      .catch(console.error);

    // Fetch shipping & payment settings from public store_settings
    const loadSettings = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("store_settings")
          .select("*")
          .in("key", ["shipping", "payment"]);
        if (data) {
          const shipping = data.find(d => d.key === "shipping")?.value as any;
          const payment = data.find(d => d.key === "payment")?.value as any;

          if (shipping?.couriers) {
            const couriers = shipping.couriers.map((name: string) => ({
              courier: name,
              logo: name.charAt(0),
              services: [{ name: "Regular", code: name.toLowerCase().replace(/\s/g, "-"), etd: "2-5 hari", price: 12000 }]
            }));
            startTransition(() => {
              setShippingOptions(couriers);
            });
          }
          if (payment?.methods) {
            const methods = [{
              group: "Pembayaran",
              icon: "💳",
              options: [
                {
                  code: "xendit",
                  name: "Bayar Online via Xendit (QRIS/E-Wallet/VA)",
                  logo: "⚡"
                },
                ...payment.methods.map((name: string) => ({
                  code: name.toLowerCase().replace(/[\s()]/g, "-"),
                  name,
                  logo: name.charAt(0)
                }))
              ]
            }];
            startTransition(() => {
              setPaymentMethods(methods);
            });
          }
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    loadSettings();

    try {
      const itemsStr = localStorage.getItem("hera_checkout_items");
      if (itemsStr) {
        const items = JSON.parse(itemsStr);
        if (Array.isArray(items) && items.length > 0) {
          startTransition(() => {
            setCheckoutItems(items);
            setSubtotal(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
          });
        } else {
          router.replace("/keranjang");
        }
      } else {
        router.replace("/keranjang");
      }

      const voucherStr = localStorage.getItem("hera_applied_voucher");
      if (voucherStr) {
        const voucher = JSON.parse(voucherStr);
        if (voucher && voucher.code) {
          startTransition(() => {
            setVoucherCode(voucher.code);
            setDiscount(voucher.discount || 0);
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNewAddress = () => {
    setAddressForm({
      label: "Rumah",
      name: "",
      phone: "",
      address: "",
      city: "",
      province: "",
      postal_code: "",
      is_default: false,
    });
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      if (res.ok) {
        setShowAddressForm(false);
        const addrs = await fetch("/api/addresses").then((r) => (r.ok ? r.json() : []));
        startTransition(() => {
          setSavedAddresses(addrs);
          if (addrs.length > 0) {
            const newest = addrs[addrs.length - 1];
            setSelectedAddress(newest.id);
          }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAddress(false);
    }
  };

  const address = savedAddresses.find((a: SavedAddress) => a.id === selectedAddress) ?? null;

  const shippingService = shippingOptions
    .flatMap((c) => c.services.map((s) => ({ ...s, courier: c.courier })))
    .find((s) => s.code === selectedShipping);

  const paymentMethod = paymentMethods
    .flatMap((g) => g.options.map((o) => ({ ...o, group: g.group })))
    .find((p) => p.code === selectedPayment);

  const ongkir = shippingService?.price ?? 0;
  const total = subtotal + ongkir - discount;

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canProceed = () => {
    if (step === 1) return selectedAddress !== null;
    if (step === 2) return selectedShipping !== null;
    if (step === 3) return selectedPayment !== null;
    return true;
  };

  const handleCreateOrder = async () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as Step);
      return;
    }

    if (isSubmittingRef.current || isSubmitting) return;
    if (!address) {
      toast("error", "Silakan pilih alamat pengiriman terlebih dahulu.");
      setIsSubmitting(false);
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const payload = {
        shipping_address: {
          name: address.name,
          phone: address.phone,
          address: address.address,
          city: address.city,
          province: address.province,
          postal_code: address.postal_code,
        },
        shipping_method: `${shippingService?.courier} ${shippingService?.name}`,
        shipping_cost: ongkir,
        payment_method: paymentMethod?.name || "Transfer",
        subtotal,
        discount,
        total,
        items: checkoutItems.map((item) => ({
          product_id: item.id, // REAL Supabase Product UUID!
          variant_id: item.variantId || null,
          product_name: item.name,
          qty: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal membuat pesanan");
      const order = await res.json();
      setOrderNumber(order.order_number);

      // Clean local storage cart items
      try {
        const cartStr = localStorage.getItem("hera_cart");
        if (cartStr) {
          let cart = JSON.parse(cartStr);
          if (Array.isArray(cart)) {
            cart = cart.filter((cartItem) => {
              const index = checkoutItems.findIndex(
                (checkoutItem) => checkoutItem.id === cartItem.id && checkoutItem.variant === cartItem.variant
              );
              return index === -1;
            });
            localStorage.setItem("hera_cart", JSON.stringify(cart));
            window.dispatchEvent(new Event("cart-updated"));
          }
        }
        localStorage.removeItem("hera_checkout_items");
        localStorage.removeItem("hera_applied_voucher");
      } catch (err) {
        console.error(err);
      }

      setStep(5);
    } catch (error) {
      console.error("Failed to create order", error);
      toast("error", "Gagal membuat pesanan. Silakan coba lagi.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-gray-400 py-16">Memuat halaman checkout...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">Beranda</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/keranjang" className="hover:text-green-600">Keranjang</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Checkout</span>
        </nav>

        {/* Stepper */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 mb-6">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step > s.id
                        ? "bg-green-600 text-white"
                        : step === s.id
                        ? "bg-green-600 text-white ring-4 ring-green-100"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <p
                    className={`text-xs mt-1 font-medium hidden sm:block ${
                      step >= s.id ? "text-green-700" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-1 md:mx-2 rounded-full transition-all ${
                      step > s.id ? "bg-green-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Step Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Alamat */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" /> Pilih Alamat Pengiriman
                </h2>
                <div className="space-y-3 mb-4">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddress === addr.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-green-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                        className="mt-1 accent-green-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">{addr.name}</span>
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            {addr.label}
                          </span>
                          {addr.is_default && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                              Utama
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{addr.phone}</p>
                        <p className="text-sm text-gray-700 mt-0.5">{addr.address}</p>
                        <p className="text-sm text-gray-500">
                          {addr.city}, {addr.province} {addr.postal_code}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={openNewAddress}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-green-300 text-green-700 font-medium text-sm hover:bg-green-50 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah Alamat Baru
                </button>
              </div>
            )}

            {/* Step 2: Pengiriman */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-green-600" /> Pilih Kurir & Layanan
                </h2>
                {address && (
                  <p className="text-sm text-gray-500 mb-4">
                    Dikirim ke: {address.address}, {address.city}
                  </p>
                )}

                <div className="space-y-4">
                  {shippingOptions.map((courier) => (
                    <div key={courier.courier} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                        <span className="text-lg">{courier.logo}</span>
                        <span className="font-semibold text-gray-800 text-sm">{courier.courier}</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {courier.services.map((service) => (
                          <label
                            key={service.code}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                              selectedShipping === service.code
                                ? "bg-green-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="shipping"
                              checked={selectedShipping === service.code}
                              onChange={() => setSelectedShipping(service.code)}
                              className="accent-green-600"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{service.name}</p>
                              <p className="text-xs text-gray-500">Estimasi {service.etd}</p>
                            </div>
                            <span
                              className={`text-sm font-semibold ${
                                selectedShipping === service.code ? "text-green-700" : "text-gray-700"
                              }`}
                            >
                              {formatRp(service.price)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Pembayaran */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" /> Pilih Metode Pembayaran
                </h2>

                <div className="space-y-4">
                  {paymentMethods.map((group) => (
                    <div key={group.group} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                        <span>{group.icon}</span>
                        <span className="font-semibold text-gray-800 text-sm">{group.group}</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {group.options.map((opt) => (
                          <label
                            key={opt.code}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                              selectedPayment === opt.code ? "bg-green-50" : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              checked={selectedPayment === opt.code}
                              onChange={() => setSelectedPayment(opt.code)}
                              className="accent-green-600"
                            />
                            <span className="text-xl">{opt.logo}</span>
                            <span className="text-sm font-medium text-gray-800">{opt.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Konfirmasi */}
            {step === 4 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-4">📋 Konfirmasi Pesanan</h2>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Produk yang Dipesan</p>
                  <div className="space-y-2">
                    {checkoutItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          {item.variant && (
                            <span className="text-xs text-gray-500">{item.variant}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">x{item.quantity}</p>
                          <p className="text-sm text-green-700 font-bold">{formatRp(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {address && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Alamat Pengiriman</p>
                        <p className="text-sm text-gray-600">{address.name} · {address.phone}</p>
                        <p className="text-sm text-gray-600">{address.address}, {address.city} {address.postal_code}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Truck className="w-4 h-4 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Kurir</p>
                      <p className="text-sm text-gray-600">
                        {shippingService?.courier} {shippingService?.name} · {shippingService?.etd}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <CreditCard className="w-4 h-4 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Pembayaran</p>
                      <p className="text-sm text-gray-600">{paymentMethod?.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Sukses */}
            {step === 5 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Pesanan Berhasil! 🎉
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  Terima kasih telah berbelanja di Hera Skincare. Pesananmu sedang diproses!
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-xs text-gray-500 mb-1">Nomor Pesanan</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-xl font-bold text-gray-900 font-mono">{orderNumber}</p>
                    <button
                      onClick={copyOrderNumber}
                      className="text-gray-400 hover:text-green-600 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-8 text-center">
                  <div className="bg-green-50 rounded-xl p-3">
                    <span className="text-2xl block mb-1">📦</span>
                    <p className="text-xs font-medium text-gray-700">Dikemas</p>
                    <p className="text-xs text-gray-500">Hari ini</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <span className="text-2xl block mb-1">🚚</span>
                    <p className="text-xs font-medium text-gray-700">Dikirim</p>
                    <p className="text-xs text-gray-500">Besok</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <span className="text-2xl block mb-1">🏠</span>
                    <p className="text-xs font-medium text-gray-700">Tiba</p>
                    <p className="text-xs text-gray-500">{shippingService?.etd ?? "2-5 hari"}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/profil?tab=pesanan"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors"
                  >
                    Lacak Pesanan
                  </Link>
                  <Link
                    href="/"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-green-500 text-green-700 font-bold text-sm hover:bg-green-50 transition-colors"
                  >
                    Belanja Lagi
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 5 && (
              <div className={`flex gap-3 mt-4 ${step === 1 ? "justify-end" : "justify-between"}`}>
                {step > 1 && (
                  <button
                    onClick={() => setStep((prev) => (prev - 1) as Step)}
                    className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    ← Kembali
                  </button>
                )}
                <button
                  onClick={handleCreateOrder}
                  disabled={!canProceed() || isSubmitting}
                  className={`px-8 py-3 rounded-xl text-sm font-bold transition-colors ${
                    canProceed()
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : step === 4 ? (
                    "✅ Buat Pesanan"
                  ) : (
                    "Lanjut →"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {step < 5 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-3">Ringkasan Pesanan</h3>

                <div className="space-y-2 mb-4">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 shrink-0">
                        {formatRp(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatRp(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ongkos Kirim</span>
                    <span className={`font-medium ${ongkir === 0 ? "text-green-600" : ""}`}>
                      {selectedShipping ? formatRp(ongkir) : "-"}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diskon Voucher</span>
                      <span className="font-medium text-red-500">-{formatRp(discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-green-700 text-lg">{formatRp(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddressForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddressForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Tambah Alamat Baru</h3>
              <button onClick={() => setShowAddressForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {["Rumah", "Kantor", "Lainnya"].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setAddressForm({ ...addressForm, label: l })}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      addressForm.label === l
                        ? "bg-green-600 text-white border-green-600"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama Penerima</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">No. HP</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Alamat Lengkap</label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-none"
                  rows={2}
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kota</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Provinsi</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kode Pos</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  className="accent-green-600"
                />
                <span className="text-sm text-gray-600">Jadikan alamat utama</span>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowAddressForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={savingAddress}
                className="flex-1 bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
              >
                {savingAddress ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
