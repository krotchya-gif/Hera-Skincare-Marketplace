"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/components/Toast";
import {
  User as UserIcon,
  Package,
  Heart,
  MapPin,
  Settings,
  ChevronRight,
  Truck,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  LogOut,
  ShoppingBag,
  ShoppingCart,
  Plus,
  X,
} from "lucide-react";
import type { Order, Profile } from "@/types/database";

interface ShippingAddress {
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

import { formatRp } from "@/utils/format";
import { STATUS_CONFIG } from "@/utils/order-status";

// ─── Address Manager ───────────────────────────────────────────
function AddressManager() {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "Rumah", name: "", phone: "", address: "", city: "", province: "", postal_code: "", is_default: false,
  });
  const [saving, setSaving] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) setAddresses(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openNew = () => {
    setEditId(null);
    setForm({ label: "Rumah", name: "", phone: "", address: "", city: "", province: "", postal_code: "", is_default: false });
    setShowForm(true);
  };

  const openEdit = (addr: ShippingAddress) => {
    setEditId(addr.id);
    setForm({ label: addr.label, name: addr.name, phone: addr.phone, address: addr.address, city: addr.city, province: addr.province, postal_code: addr.postal_code, is_default: addr.is_default });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editId ? `/api/addresses/${editId}` : "/api/addresses";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setShowForm(false); fetchAddresses(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus alamat ini?")) return;
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (res.ok) fetchAddresses();
  };

  if (loading) return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center text-sm text-gray-400">Memuat alamat...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-lg">📍 Alamat Pengiriman</h2>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" /> Tambah Alamat
        </button>
      </div>

      {addresses.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Belum ada alamat tersimpan.</p>
        </div>
      )}

      <div className="space-y-3">
        {addresses.map((addr) => (
          <div key={addr.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 text-sm">{addr.label}</span>
                {addr.is_default && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Utama</span>}
              </div>
              <p className="text-sm font-medium text-gray-800">{addr.name} &middot; {addr.phone}</p>
              <p className="text-sm text-gray-600 mt-0.5">{addr.address}</p>
              <p className="text-sm text-gray-500">{addr.city}, {addr.province} {addr.postal_code}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(addr)} className="text-xs text-green-600 font-semibold hover:underline">Edit</button>
              <button onClick={() => handleDelete(addr.id)} className="text-xs text-red-500 font-semibold hover:underline">Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editId ? "Edit Alamat" : "Tambah Alamat Baru"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {["Rumah", "Kantor", "Lainnya"].map((l) => (
                  <button key={l} onClick={() => setForm({ ...form, label: l })}
                    className={`py-2 rounded-xl text-xs font-semibold border ${form.label === l ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{l}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nama Penerima</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">No. HP</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Alamat Lengkap</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-none" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Kota</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Provinsi</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Kode Pos</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="accent-green-600" />
                <span className="text-sm text-gray-600">Jadikan alamat utama</span>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  menunggu: <Clock className="w-4 h-4" />,
  diproses: <RefreshCw className="w-4 h-4" />,
  dikirim: <Truck className="w-4 h-4" />,
  selesai: <CheckCircle className="w-4 h-4" />,
  dibatalkan: <XCircle className="w-4 h-4" />,
};

const ORDER_TABS = [
  { id: "semua", label: "Semua" },
  { id: "menunggu", label: "Menunggu Bayar" },
  { id: "diproses", label: "Diproses" },
  { id: "dikirim", label: "Dikirim" },
  { id: "selesai", label: "Selesai" },
  { id: "dibatalkan", label: "Dibatalkan" },
];

interface ProfilClientProps {
  initialUser: { id: string; email: string; name?: string } | null;
  initialProfile: Profile | null;
  orders: Order[];
}

export default function ProfilClient({ initialUser, initialProfile, orders }: ProfilClientProps) {
  const { toast } = useToast();
  const [user] = useState(initialUser);
  const [profile, setProfile] = useState(initialProfile);
  const [activeTab, setActiveTab] = useState<"overview" | "pesanan" | "wishlist" | "alamat" | "pengaturan">("overview");
  const [orderStatusTab, setOrderStatusTab] = useState<string>("semua");

  // Auth form states
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Profile update states
  const [profileName, setProfileName] = useState(initialProfile?.name || "");
  const [profilePhone, setProfilePhone] = useState(initialProfile?.phone || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileSuccess(false);
    setProfileError("");

    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("profiles")
        .update({
          name: profileName,
          phone: profilePhone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);

      if (err) {
        setProfileError(err.message);
      } else {
        setProfileSuccess(true);
        // Update local profile state
        setProfile((prev) => prev ? { ...prev, name: profileName, phone: profilePhone } : null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui profil.";
      setProfileError(message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthLoading(true);
    const supabase = createClient();

    if (authMode === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError("Email atau password salah.");
      } else {
        window.location.reload();
      }
    } else {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      if (err) {
        setError(err.message);
      } else {
        toast("success", "Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi.");
        setAuthMode("login");
      }
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem("hera_cart");
    localStorage.removeItem("hera_wishlist");
    localStorage.removeItem("hera_checkout_items");
    localStorage.removeItem("hera_applied_voucher");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  const filteredOrders = orderStatusTab === "semua"
    ? orders
    : orders.filter((o) => o.status === orderStatusTab);

  interface SidebarItem {
    id: "overview" | "pesanan" | "wishlist" | "alamat" | "pengaturan";
    label: string;
    icon: React.ReactNode;
    count?: number;
  }

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Ringkasan Akun", icon: <UserIcon className="w-4 h-4" /> },
    { id: "pesanan", label: "Pesanan Saya", icon: <Package className="w-4 h-4" />, count: orders.length },
    { id: "wishlist", label: "Wishlist", icon: <Heart className="w-4 h-4" /> },
    { id: "alamat", label: "Alamat Tersimpan", icon: <MapPin className="w-4 h-4" /> },
    { id: "pengaturan", label: "Pengaturan Akun", icon: <Settings className="w-4 h-4" /> },
  ];

  // Unauthenticated UI (Auth Form)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
              {authMode === "login" ? "Masuk ke Akun Anda" : "Daftar Akun Baru"}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                    placeholder="Budi Santoso"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                  placeholder="budi@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {authLoading ? "Memproses..." : authMode === "login" ? "Masuk" : "Daftar"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              {authMode === "login" ? (
                <p>
                  Belum punya akun?{" "}
                  <button onClick={() => setAuthMode("signup")} className="text-green-600 font-semibold hover:underline">
                    Daftar di Sini
                  </button>
                </p>
              ) : (
                <p>
                  Sudah punya akun?{" "}
                  <button onClick={() => setAuthMode("login")} className="text-green-600 font-semibold hover:underline">
                    Masuk di Sini
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const displayName = profile?.name || user.name || user.email.split("@")[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6">
        {/* Breadcrumb - desktop only */}
        <nav className="hidden md:flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">Beranda</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Akun Saya</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - desktop only */}
          <aside className="hidden md:block w-60 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
                <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <rect width="56" height="56" rx="16" fill="#DCFCE7" />
                    <text x="28" y="28" textAnchor="middle" dominantBaseline="central" fill="#16A34A" fontSize="22" fontWeight="bold" fontFamily="sans-serif">
                      {displayName.charAt(0).toUpperCase()}
                    </text>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-sm truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("pengaturan")}
                  className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-green-700 hover:bg-green-50 py-1.5 rounded-lg transition-colors border border-transparent hover:border-green-200"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-1 text-xs text-red-500 hover:bg-red-50 py-1.5 rounded-lg transition-colors"
                >
                  <LogOut className="w-3 h-3" /> Keluar
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors border-l-2 ${
                    activeTab === item.id
                      ? "text-green-700 bg-green-50 border-green-500"
                      : "text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-300"
                  }`}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.count !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeTab === item.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Mobile Profile */}
          <div className="md:hidden w-full space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <defs>
                      <linearGradient id="avatar-grad-m" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#4ADE80" />
                        <stop offset="100%" stopColor="#16A34A" />
                      </linearGradient>
                    </defs>
                    <rect width="64" height="64" rx="16" fill="url(#avatar-grad-m)" />
                    <text x="32" y="32" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="26" fontWeight="bold" fontFamily="sans-serif">
                      {displayName.charAt(0).toUpperCase()}
                    </text>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900 text-base truncate">{displayName}</h2>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Aktif
                    </span>
                    <span className="text-xs text-gray-400">{orders.length} pesanan</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setActiveTab("pengaturan")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profil
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-4 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              <button onClick={() => setActiveTab("pesanan")} className="flex flex-col items-center gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-3 hover:border-green-200 transition-colors">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-[10px] font-medium text-gray-600">Pesanan</span>
                {orders.length > 0 && <span className="text-[10px] font-bold text-blue-600 -mt-0.5">{orders.length}</span>}
              </button>
              <button onClick={() => setActiveTab("wishlist")} className="flex flex-col items-center gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-3 hover:border-red-200 transition-colors">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-[10px] font-medium text-gray-600">Wishlist</span>
              </button>
              <button onClick={() => setActiveTab("alamat")} className="flex flex-col items-center gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-3 hover:border-green-200 transition-colors">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-[10px] font-medium text-gray-600">Alamat</span>
              </button>
              <button onClick={() => setActiveTab("pengaturan")} className="flex flex-col items-center gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-3 hover:border-gray-300 transition-colors">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-gray-500" />
                </div>
                <span className="text-[10px] font-medium text-gray-600">Setting</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* Desktop stats — hidden on mobile (already in header) */}
                <div className="hidden md:grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                    <p className="text-3xl font-bold text-green-700">{orders.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Total Pesanan</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                    <p className="text-xl font-bold text-green-700">{formatRp(orders.reduce((s, o) => s + o.total, 0))}</p>
                    <p className="text-sm text-gray-500 mt-1">Total Belanja</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                    <p className="text-3xl font-bold text-green-700">0</p>
                    <p className="text-sm text-gray-500 mt-1">Wishlist</p>
                  </div>
                </div>

                {/* Recent orders */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Pesanan Terbaru</h3>
                    <button onClick={() => setActiveTab("pesanan")} className="text-sm text-green-600 font-medium hover:text-green-700">
                      Lihat Semua →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {orders.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Belum ada transaksi.</p>
                    ) : (
                      orders.slice(0, 2).map((order) => {
                        const statusConf = STATUS_CONFIG[order.status] || { label: order.status, color: "text-gray-600 bg-gray-50" };
                        const statusIcon = STATUS_ICONS[order.status] || null;
                        const firstItem = order.order_items?.[0];
                        return (
                          <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div>
                              <span className="text-2xl">🧴</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 font-mono">#{order.order_number}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {firstItem?.product_name || "Produk"} {order.order_items && order.order_items.length > 1 ? `+ ${order.order_items.length - 1}` : ""}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusConf.color}`}>
                                {statusIcon} {statusConf.label}
                              </span>
                              <p className="text-xs font-bold text-gray-900 mt-1">{formatRp(order.total)}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Profile info — desktop only (already in mobile header) */}
                <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Informasi Akun</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Nama Lengkap", value: displayName },
                      { label: "Email", value: user.email },
                      { label: "No. HP", value: profile?.phone || "-" },
                    ].map((info) => (
                      <div key={info.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-500">{info.label}</span>
                        <span className="text-sm font-medium text-gray-900">{info.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pesanan Tab */}
            {activeTab === "pesanan" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex overflow-x-auto border-b border-gray-100">
                    {ORDER_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setOrderStatusTab(tab.id)}
                        className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                          orderStatusTab === tab.id
                            ? "text-green-700 border-green-600"
                            : "text-gray-500 border-transparent hover:text-gray-700"
                        }`}
                      >
                        {tab.label}
                        <span className="ml-1.5 text-xs">
                          ({tab.id === "semua"
                            ? orders.length
                            : orders.filter((o) => o.status === tab.id).length})
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                      <div className="p-12 text-center">
                        <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Tidak ada pesanan</p>
                      </div>
                    ) : (
                      filteredOrders.map((order) => {
                        const statusConf = STATUS_CONFIG[order.status] || { label: order.status, color: "text-gray-600 bg-gray-50" };
                        const statusIcon = STATUS_ICONS[order.status] || null;
                        return (
                          <div key={order.id} className="p-4 md:p-5">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-sm font-mono font-semibold text-gray-900">#{order.order_number}</p>
                                <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("id-ID")}</p>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConf.color}`}>
                                {statusIcon} {statusConf.label}
                              </span>
                            </div>

                            <div className="space-y-2 mb-3">
                              {order.order_items?.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <span className="text-xl">🧴</span>
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-800">{item.product_name}</p>
                                    <p className="text-xs text-gray-500">x{item.qty} · {formatRp(item.price)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {order.tracking_number && (
                              <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                                <Truck className="w-3.5 h-3.5" />
                                <span>{order.shipping_method || "Regular"} · No. Resi: {order.tracking_number}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div>
                                <span className="text-xs text-gray-500">Total Pesanan: </span>
                                <span className="text-sm font-bold text-green-700">{formatRp(order.total)}</span>
                              </div>
                            </div>
                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                              {order.status === "menunggu" && (
                                <Link
                                  href={`/bayar/${order.id}`}
                                  className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors"
                                >
                                  Bayar Sekarang
                                </Link>
                              )}
                              {order.status === "diproses" && (
                                <button
                                  onClick={() => toast("info", "Pesanan sedang diproses. Kami akan mengirimkan nomor resi segera.")}
                                  className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
                                >
                                  Lacak Pesanan
                                </button>
                              )}
                              {order.status === "dikirim" && (
                                <>
                                  <button
                                    onClick={() => toast("info", `Nomor resi: ${order.tracking_number || "Belum tersedia"}`)}
                                    className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
                                  >
                                    Lacak
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm("Konfirmasi bahwa pesanan sudah diterima?")) {
                                        try {
                                          const supabase = createClient();
                                          await supabase.from("orders").update({ status: "selesai", updated_at: new Date().toISOString() }).eq("id", order.id).eq("user_id", user.id);
                                          window.location.reload();
                                        } catch (e) { console.error(e); }
                                      }
                                    }}
                                    className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors"
                                  >
                                    Konfirmasi Terima
                                  </button>
                                </>
                              )}
                              {order.status === "selesai" && (
                                <>
                                  <Link
                                    href={`/produk/${order.order_items?.[0]?.products?.slug || ""}`}
                                    className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors"
                                  >
                                    Beri Ulasan
                                  </Link>
                                  <button
                                    onClick={() => {
                                      if (order.order_items?.[0]) {
                                        try {
                                          const cart = JSON.parse(localStorage.getItem("hera_cart") || "[]");
                                          cart.push({
                                            id: order.order_items[0].product_id,
                                            name: order.order_items[0].product_name,
                                            price: order.order_items[0].price,
                                            quantity: 1,
                                          });
                                          localStorage.setItem("hera_cart", JSON.stringify(cart));
                                          window.dispatchEvent(new Event("cart-updated"));
                                          window.location.href = "/keranjang";
                                        } catch (e) { console.error(e); }
                                      }
                                    }}
                                    className="flex items-center gap-1.5 border border-green-600 text-green-700 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-green-50 transition-colors"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" /> Beli Lagi
                                  </button>
                                </>
                              )}
                              {order.status === "dibatalkan" && (
                                <button
                                  onClick={() => {
                                    if (order.order_items?.[0]) {
                                      try {
                                        const cart = JSON.parse(localStorage.getItem("hera_cart") || "[]");
                                        cart.push({
                                          id: order.order_items[0].product_id,
                                          name: order.order_items[0].product_name,
                                          price: order.order_items[0].price,
                                          quantity: 1,
                                        });
                                        localStorage.setItem("hera_cart", JSON.stringify(cart));
                                        window.dispatchEvent(new Event("cart-updated"));
                                        window.location.href = "/keranjang";
                                      } catch (e) { console.error(e); }
                                    }
                                  }}
                                  className="flex items-center gap-1.5 border border-green-600 text-green-700 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-green-50 transition-colors"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" /> Beli Lagi
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Wishlist kosong.</p>
              </div>
            )}

            {/* Alamat Tab */}
            {activeTab === "alamat" && <AddressManager />}

            {/* Pengaturan Tab */}
            {activeTab === "pengaturan" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
                  <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    ⚙️ Edit Profil & Akun
                  </h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Email (Tidak dapat diubah)
                      </label>
                      <input
                        type="email"
                        value={user!.email}
                        disabled
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        required
                        placeholder="Nama Lengkap Anda"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Nomor HP / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                      />
                    </div>

                    {profileError && (
                      <p className="text-red-500 text-xs font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                        ⚠️ {profileError}
                      </p>
                    )}

                    {profileSuccess && (
                      <p className="text-green-600 text-xs font-semibold bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                        ✓ Profil berhasil diperbarui!
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={updatingProfile}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2 animate-pulse-once"
                    >
                      {updatingProfile ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        "Simpan Perubahan"
                      )}
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
                  <h3 className="font-bold text-gray-900 text-base mb-3">Tindakan Lain</h3>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Keluar dari Akun
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
