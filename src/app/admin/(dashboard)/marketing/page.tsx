"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Megaphone,
  Mail,
  BarChart3,
  MessageSquare,
  Gift,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Activity,
  Link2,
  Users,
  UserCheck,
  Tag,
  TrendingUp,
  Wallet,
  ShoppingBag,
  UserPlus,
  Image as ImageIcon,
  Bell,
} from "lucide-react";
import type { Voucher, EventLog, UtmVisit } from "@/types/database";
import { getEventLabel } from "@/lib/tracking";
import { buildUtmLink } from "@/lib/utm";
import BannerManager from "@/components/admin/BannerManager";
import PushComposer from "@/components/admin/PushComposer";

// T-39/T-63/T-64: Halaman Marketing — tab (Ringkasan / Analytics / Event Monitor / UTM / Banner / Push)
type TabKey = "ringkasan" | "analytics" | "events" | "utm" | "banner" | "push";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "ringkasan", label: "Ringkasan", icon: <Gift className="w-3.5 h-3.5" /> },
  { key: "analytics", label: "Analytics", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { key: "events", label: "Event Monitor", icon: <Activity className="w-3.5 h-3.5" /> },
  { key: "utm", label: "UTM Campaign", icon: <Link2 className="w-3.5 h-3.5" /> },
  { key: "banner", label: "Banner", icon: <ImageIcon className="w-3.5 h-3.5" /> },
  { key: "push", label: "Push", icon: <Bell className="w-3.5 h-3.5" /> },
];

interface FinanceData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalDiscount: number;
  dailyData: Array<{ day: string; pendapatan: number; pesanan: number }>;
}

interface OrderStats {
  todayCount: number;
  menunggu: number;
  diproses: number;
  dikirim: number;
  selesai: number;
  dibatalkan: number;
}

interface AnalyticsStats {
  configured: boolean;
  ga4?: { users: number | null; sessions: number | null; views: number | null } | null;
  gsc?: { clicks: number | null; impressions: number | null; ctr: number | null; position: number | null } | null;
  error?: string | null;
  ga4Error?: string | null;
  gscError?: string | null;
}

const formatRupiah = (v: number) => {
  if (v >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}jt`;
  if (v >= 1000) return `Rp ${(v / 1000).toFixed(0)}rb`;
  return `Rp ${v}`;
};

export default function MarketingPage() {
  const [tab, setTab] = useState<TabKey>("ringkasan");
  const [loading, setLoading] = useState(true);
  const [customerCount, setCustomerCount] = useState(0);
  const [activeCustomerCount, setActiveCustomerCount] = useState(0);
  const [newCustomerCount, setNewCustomerCount] = useState(0);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [utmVisits, setUtmVisits] = useState<UtmVisit[]>([]);
  const [, startTransition] = useTransition();

  // UTM builder state
  const [utmForm, setUtmForm] = useState({ source: "", medium: "", campaign: "", base: "" });
  const [builtUrl, setBuiltUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchMarketingData = async () => {
    try {
      const [resCust, resVouch] = await Promise.all([
        fetch("/api/admin/customers"),
        fetch("/api/admin/vouchers"),
      ]);

      if (resCust.ok) {
        const custData = await resCust.json();
        setCustomerCount(custData.stats?.total || 0);
        setActiveCustomerCount(custData.stats?.active || 0);
        setNewCustomerCount(custData.stats?.newThisMonth || 0);
      }

      if (resVouch.ok) {
        const vouchData = await resVouch.json();
        setVouchers(vouchData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Lazy-load data per tab (pola docs seo.md)
  useEffect(() => {
    if (tab === "analytics" && !finance) {
      fetch("/api/admin/finance")
        .then((r) => (r.ok ? r.json() : null))
        .then(setFinance)
        .catch(() => setFinance(null));
      fetch("/api/admin/orders")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setOrderStats(d?.stats || null))
        .catch(() => setOrderStats(null));
      fetch("/api/admin/analytics")
        .then((r) => (r.ok ? r.json() : null))
        .then(setAnalytics)
        .catch(() => setAnalytics(null));
    }
    if (tab === "events" && events.length === 0) {
      fetch("/api/admin/events")
        .then((r) => (r.ok ? r.json() : []))
        .then(setEvents)
        .catch(() => setEvents([]));
    }
    if (tab === "utm" && utmVisits.length === 0) {
      fetch("/api/admin/utm")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) {
            setUtmVisits(d.visits || []);
          }
        })
        .catch(() => setUtmVisits([]));
    }
  }, [tab, finance, events.length, utmVisits.length]);

  useEffect(() => {
    startTransition(() => {
      fetchMarketingData();
    });
  }, []);

  const activeVouchers = vouchers.filter((v) => v.is_active).length;
  const totalVoucherUses = vouchers.reduce((sum, v) => sum + (v.used_count || 0), 0);

  // UTM builder
  const handleBuildUtm = () => {
    const base = utmForm.base.trim() || "https://heraskincare.com";
    const url = buildUtmLink(base, {
      utm_source: utmForm.source.trim() || undefined,
      utm_medium: utmForm.medium.trim() || undefined,
      utm_campaign: utmForm.campaign.trim() || undefined,
    });
    setBuiltUrl(url);
    setCopied(false);
  };

  const copyUtm = async () => {
    try {
      await navigator.clipboard.writeText(builtUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleRetryEvent = async (id: string) => {
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "sent" as const } : e)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
        <p className="text-sm font-medium text-gray-500 font-sans">Memuat data marketing...</p>
      </div>
    );
  }

  // ─── Laporan UTM per source (dari /api/admin/utm) ─────────────
  const utmRows = utmVisits as unknown as Array<{
    source: string;
    visits: number;
    orders: number;
    revenue: number;
  }>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Marketing</h2>
        <p className="text-sm text-gray-500 mt-0.5">Kelola kampanye, analytics, event, dan UTM secara terpadu</p>
      </div>

      {/* Tab bar (pola seperti /admin/pengaturan) */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === t.key ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: RINGKASAN ─────────────────────────────────────── */}
      {tab === "ringkasan" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Pelanggan", value: customerCount.toLocaleString(), icon: <Users className="w-6 h-6" />, color: "border-blue-100 bg-blue-50/30" },
              { label: "Pelanggan Aktif", value: activeCustomerCount.toLocaleString(), icon: <UserCheck className="w-6 h-6" />, color: "border-green-100 bg-green-50/30" },
              { label: "Voucher Aktif", value: activeVouchers.toString(), icon: <Tag className="w-6 h-6" />, color: "border-yellow-100 bg-yellow-50/30" },
              { label: "Total Penggunaan Voucher", value: totalVoucherUses.toString(), icon: <TrendingUp className="w-6 h-6" />, color: "border-purple-100 bg-purple-50/30" },
            ].map((s) => (
              <div key={s.label} className={`border border-gray-100 rounded-2xl p-5 shadow-sm bg-white ${s.color}`}>
                <span className="text-green-600 block mb-2">{s.icon}</span>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Marketing Channels */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              { name: "Email Blast", icon: <Mail className="w-5 h-5" />, desc: "Kirim newsletter & promosi ke pelanggan", status: "Segera", color: "text-blue-600 bg-blue-50" },
              { name: "Push Notification", icon: <MessageSquare className="w-5 h-5" />, desc: "Notifikasi langsung ke perangkat pelanggan", status: "Aktif", color: "text-purple-600 bg-purple-50", onClick: () => setTab("push") },
              { name: "Banner Iklan", icon: <Megaphone className="w-5 h-5" />, desc: "Kelola banner promosi di homepage", status: "Aktif", color: "text-orange-600 bg-orange-50", onClick: () => setTab("banner") },
              { name: "Event Monitor", icon: <Activity className="w-5 h-5" />, desc: "Riwayat event konversi & retry pengiriman", status: "Aktif", color: "text-indigo-600 bg-indigo-50", onClick: () => setTab("events") },
              { name: "UTM Campaign", icon: <Link2 className="w-5 h-5" />, desc: "Builder link UTM + laporan per source", status: "Aktif", color: "text-teal-600 bg-teal-50", onClick: () => setTab("utm") },
              { name: "Voucher Campaign", icon: <Gift className="w-5 h-5" />, desc: "Buat kampanye voucher massal", status: "Aktif", color: "text-green-600 bg-green-50" },
            ].map((ch) => (
              <button
                key={ch.name}
                onClick={ch.onClick}
                disabled={!ch.onClick}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between text-left ${ch.onClick ? "cursor-pointer" : "cursor-default"}`}
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ch.color} mb-3`}>
                    {ch.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{ch.name}</h3>
                  <p className="text-xs text-gray-500 mb-4">{ch.desc}</p>
                </div>
                <div>
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                    ch.status === "Segera" ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"
                  }`}>
                    {ch.status === "Segera" ? "Dalam Pengembangan" : "Aktif"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Voucher Campaign Performance Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Performa Kampanye Voucher</h3>
              <p className="text-xs text-gray-400 mt-0.5">Analisis konversi penggunaan kode voucher aktif</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Kode</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nilai Diskon</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Min. Belanja</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Kebutuhan / Penggunaan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vouchers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-sm text-gray-400">Belum ada kampanye voucher dibuat.</td>
                    </tr>
                  ) : (
                    vouchers.map((v) => {
                      const quotaVal = v.quota ?? 0;
                      const usedVal = v.used_count ?? 0;
                      const pct = quotaVal > 0 ? Math.min(100, Math.round((usedVal / quotaVal) * 100)) : 0;
                      return (
                        <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                              {v.code}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs font-medium text-gray-900">
                            {v.type === "percent" ? `${v.value}%` : `Rp ${v.value.toLocaleString("id-ID")}`}
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-500">
                            Rp {v.min_purchase.toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-4">
                            <div className="w-full max-w-[150px]">
                              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                <span>{usedVal} terpakai</span>
                                <span>{quotaVal > 0 ? `${quotaVal} kuota` : "∞"}</span>
                              </div>
                              {quotaVal > 0 ? (
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-green-600 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              ) : (
                                <span className="text-[10px] text-green-600 font-medium">Aktif Tanpa Batas</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              v.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {v.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── TAB: ANALYTICS ─────────────────────────────────────── */}
      {tab === "analytics" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Pendapatan", value: finance ? formatRupiah(finance.totalRevenue) : "—", icon: <Wallet className="w-6 h-6" /> },
              { label: "Pesanan", value: finance ? finance.totalOrders.toLocaleString() : "—", icon: <ShoppingBag className="w-6 h-6" /> },
              { label: "Rata-rata Pesanan", value: finance ? formatRupiah(finance.avgOrderValue) : "—", icon: <BarChart3 className="w-6 h-6" /> },
              { label: "Pelanggan Baru Bulan Ini", value: newCustomerCount.toLocaleString(), icon: <UserPlus className="w-6 h-6" /> },
            ].map((s) => (
              <div key={s.label} className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-white">
                <span className="text-green-600 block mb-2">{s.icon}</span>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Pendapatan 7 hari (bar chart sederhana tanpa recharts — pakai bar div) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-1">Pendapatan 7 Hari</h3>
              <p className="text-xs text-gray-400 mb-4">Pendapatan per hari (order lunas)</p>
              {finance?.dailyData ? (
                <div className="flex items-end gap-2 h-40">
                  {finance.dailyData.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-gray-400 font-medium">{formatRupiah(d.pendapatan)}</span>
                      <div
                        className="w-full bg-green-500 rounded-t-md transition-all"
                        style={{
                          height: `${Math.max(4, (d.pendapatan / Math.max(...finance.dailyData.map((x) => x.pendapatan), 1)) * 100)}%`,
                        }}
                      />
                      <span className="text-[9px] text-gray-500">{d.day}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-10 text-center">Belum ada data pendapatan.</p>
              )}
            </div>

            {/* Ringkasan status pesanan */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Ringkasan Status Pesanan</h3>
              {orderStats ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Menunggu", value: orderStats.menunggu, color: "bg-yellow-100 text-yellow-700" },
                    { label: "Diproses", value: orderStats.diproses, color: "bg-blue-100 text-blue-700" },
                    { label: "Dikirim", value: orderStats.dikirim, color: "bg-purple-100 text-purple-700" },
                    { label: "Selesai", value: orderStats.selesai, color: "bg-green-100 text-green-700" },
                    { label: "Dibatalkan", value: orderStats.dibatalkan, color: "bg-red-100 text-red-700" },
                    { label: "Hari Ini", value: orderStats.todayCount, color: "bg-gray-100 text-gray-700" },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl px-4 py-3 ${s.color}`}>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-[10px] font-semibold opacity-80">{s.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-10 text-center">Belum ada data pesanan.</p>
              )}
            </div>
          </div>

          {/* Google Analytics + Search Console real (T-43) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-1">Google Analytics (GA4)</h3>
              <p className="text-xs text-gray-400 mb-4">7 hari terakhir — angka real via Google API</p>
              {!analytics ? (
                <p className="text-sm text-gray-400 py-6 text-center">Memuat...</p>
              ) : !analytics.configured ? (
                <p className="text-xs text-gray-400 py-6 text-center">
                  Belum dikonfigurasi. Isi service account di Pengaturan → SEO.
                </p>
              ) : analytics.error ? (
                <p className="text-xs text-red-500 py-6 text-center">{analytics.error}</p>
              ) : analytics.ga4Error ? (
                <p className="text-xs text-red-500 py-6 text-center break-words">{analytics.ga4Error}</p>
              ) : analytics.ga4 ? (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Users", value: analytics.ga4.users ?? 0 },
                    { label: "Sessions", value: analytics.ga4.sessions ?? 0 },
                    { label: "Page Views", value: analytics.ga4.views ?? 0 },
                  ].map((m) => (
                    <div key={m.label} className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                      <p className="text-xl font-bold text-gray-900">{m.value.toLocaleString()}</p>
                      <p className="text-[10px] font-semibold text-gray-500">{m.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">Tidak ada data GA4.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-1">Search Console (GSC)</h3>
              <p className="text-xs text-gray-400 mb-4">7 hari terakhir — klik, impresi, CTR, posisi</p>
              {!analytics ? (
                <p className="text-sm text-gray-400 py-6 text-center">Memuat...</p>
              ) : !analytics.configured ? (
                <p className="text-xs text-gray-400 py-6 text-center">
                  Belum dikonfigurasi. Isi service account di Pengaturan → SEO.
                </p>
              ) : analytics.error ? (
                <p className="text-xs text-red-500 py-6 text-center">{analytics.error}</p>
              ) : analytics.gscError ? (
                <p className="text-xs text-red-500 py-6 text-center break-words">{analytics.gscError}</p>
              ) : analytics.gsc ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Klik", value: analytics.gsc.clicks ?? 0 },
                    { label: "Impresi", value: analytics.gsc.impressions ?? 0 },
                    { label: "CTR", value: analytics.gsc.ctr != null ? `${(analytics.gsc.ctr * 100).toFixed(1)}%` : "—" },
                    { label: "Posisi", value: analytics.gsc.position != null ? analytics.gsc.position.toFixed(1) : "—" },
                  ].map((m) => (
                    <div key={m.label} className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                      <p className="text-xl font-bold text-gray-900">{m.value}</p>
                      <p className="text-[10px] font-semibold text-gray-500">{m.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">Tidak ada data GSC.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── TAB: EVENT MONITOR ─────────────────────────────────── */}
      {tab === "events" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Event Monitor</h3>
              <p className="text-xs text-gray-400 mt-0.5">100 event terakhir dari halaman publik (view produk, keranjang, checkout, order, payment)</p>
            </div>
            <button
              onClick={() => {
                fetch("/api/admin/events")
                  .then((r) => (r.ok ? r.json() : []))
                  .then(setEvents)
                  .catch(() => setEvents([]));
              }}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-gray-50"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Label</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Halaman</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Waktu</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-sm text-gray-400">
                      Belum ada event. Kunjungi halaman publik untuk mulai mencatat.
                    </td>
                  </tr>
                ) : (
                  events.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-xs font-semibold text-gray-900">{getEventLabel(e.event_name)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{e.label || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{e.page || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(e.created_at).toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          e.status === "sent" ? "bg-green-100 text-green-700"
                          : e.status === "failed" ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {e.status !== "sent" && (
                          <button
                            onClick={() => handleRetryEvent(e.id)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg border border-green-200"
                          >
                            <RefreshCw className="w-3 h-3" /> Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB: UTM CAMPAIGN ──────────────────────────────────── */}
      {tab === "utm" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Builder */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-1">Builder Link UTM</h3>
            <p className="text-xs text-gray-400 mb-4">Generate link campaign dengan parameter UTM</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Base URL</label>
                <input
                  value={utmForm.base}
                  onChange={(e) => setUtmForm({ ...utmForm, base: e.target.value })}
                  type="text"
                  placeholder="https://heraskincare.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Source *</label>
                  <input
                    value={utmForm.source}
                    onChange={(e) => setUtmForm({ ...utmForm, source: e.target.value })}
                    type="text"
                    placeholder="instagram"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Medium</label>
                  <input
                    value={utmForm.medium}
                    onChange={(e) => setUtmForm({ ...utmForm, medium: e.target.value })}
                    type="text"
                    placeholder="social"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Campaign</label>
                  <input
                    value={utmForm.campaign}
                    onChange={(e) => setUtmForm({ ...utmForm, campaign: e.target.value })}
                    type="text"
                    placeholder="promo-ramadhan"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  />
                </div>
              </div>
              <button
                onClick={handleBuildUtm}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Generate Link
              </button>
              {builtUrl && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                  <a
                    href={builtUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs text-green-700 font-mono truncate hover:underline"
                  >
                    {builtUrl}
                  </a>
                  <button
                    onClick={copyUtm}
                    className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-100 px-2 py-1.5 rounded-lg border border-gray-200"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Tersalin" : "Salin"}
                  </button>
                  <a href={builtUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-600">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Laporan per source */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Laporan UTM per Source</h3>
              <p className="text-xs text-gray-400 mt-0.5">Kunjungan, order, dan revenue per source campaign</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Kunjungan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Order</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {utmRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-sm text-gray-400">
                        Belum ada kunjungan dengan parameter UTM. Gunakan builder di atas untuk membuat link campaign.
                      </td>
                    </tr>
                  ) : (
                    utmRows.map((row) => (
                      <tr key={row.source} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                            {row.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900">{row.visits.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900">{row.orders.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-green-700">Rp {row.revenue.toLocaleString("id-ID")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: BANNER PROMOSI (T-63) ─────────────────────────── */}
      {tab === "banner" && (
        <BannerManager />
      )}

      {/* ─── TAB: PUSH NOTIFICATION (T-64) ──────────────────────── */}
      {tab === "push" && (
        <PushComposer />
      )}
    </div>
  );
}