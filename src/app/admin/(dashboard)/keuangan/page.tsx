"use client";

import { useState, useEffect, useTransition } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { Download, Wallet, CheckCircle2, BarChart3, Gift } from "lucide-react";

const periods = ["Hari Ini", "7 Hari", "30 Hari", "Bulan Ini", "Tahun Ini", "Custom"];

const formatRupiah = (v: number) => {
  if (v >= 1000000) return `Rp ${(v / 1000000).toFixed(1)}jt`;
  if (v >= 1000) return `Rp ${(v / 1000).toFixed(0)}rb`;
  return `Rp ${v}`;
};

interface FinanceData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalDiscount: number;
  dailyData: Array<{ day: string; pendapatan: number; pesanan: number }>;
  monthCompare: Array<{ week: string; bulanIni: number; bulanLalu: number }>;
  paymentData: Array<{ name: string; value: number; color: string; amount: string }>;
  transactions: Array<{
    id: string;
    date: string;
    customer: string;
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
    payStatus: string;
  }>;
}

export default function FinancePage() {
  const [activePeriod, setActivePeriod] = useState("30 Hari");
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/finance");
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || res.statusText);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("[Fetch Finance Data]", err);
      const message = err instanceof Error ? err.message : "Gagal memuat data keuangan";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startTransition(() => {
      fetchFinanceData();
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        <p className="text-sm font-medium text-gray-500 font-sans animate-pulse">Memuat laporan keuangan...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-500 text-3xl">⚠️</div>
        <p className="text-sm font-medium text-red-600 font-sans">{error || "Data tidak ditemukan"}</p>
        <button onClick={fetchFinanceData} className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors">
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Laporan Keuangan</h2>
          <p className="text-sm text-gray-500 mt-0.5">Pantau pendapatan dan transaksi</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs hover:bg-gray-50 font-medium">
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs hover:bg-gray-50 font-medium">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2 items-center">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activePeriod === p ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {p}
            </button>
          ))}
          {activePeriod === "Custom" && (
            <div className="flex gap-2 ml-2">
              <input type="date" className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-500 focus:outline-none focus:border-green-400" />
              <span className="text-gray-400 self-center text-xs">–</span>
              <input type="date" className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-500 focus:outline-none focus:border-green-400" />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Pendapatan Bersih" value={`Rp ${data.totalRevenue.toLocaleString("id-ID")}`} change="12.5%" changeType="up" icon={<Wallet className="w-5 h-5" />} iconBg="bg-green-50" />
        <StatCard title="Pesanan Selesai" value={data.totalOrders.toString()} change="8.2%" changeType="up" icon={<CheckCircle2 className="w-5 h-5" />} iconBg="bg-blue-50" />
        <StatCard title="Rata-rata Pesanan" value={`Rp ${data.avgOrderValue.toLocaleString("id-ID")}`} change="3.1%" changeType="up" icon={<BarChart3 className="w-5 h-5" />} iconBg="bg-purple-50" />
        <StatCard title="Total Diskon" value={`Rp ${data.totalDiscount.toLocaleString("id-ID")}`} change="18.0%" changeType="up" icon={<Gift className="w-5 h-5" />} iconBg="bg-orange-50" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Bar Chart — Daily Revenue */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Pendapatan Harian</h3>
          <p className="text-xs text-gray-400 mb-4">7 hari terakhir</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={formatRupiah} tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={65} />
              <Tooltip
                formatter={(v, name) => [name === "pendapatan" ? `Rp ${Number(v).toLocaleString("id-ID")}` : v, name === "pendapatan" ? "Pendapatan" : "Pesanan"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="pendapatan" fill="#16A34A" radius={[6, 6, 0, 0]} />
              <Bar dataKey="pesanan" fill="#BFDBFE" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart — Month Comparison */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Perbandingan Bulanan</h3>
          <p className="text-xs text-gray-400 mb-4">Bulan ini vs bulan lalu</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthCompare} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={formatRupiah} tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={65} />
              <Tooltip
                formatter={(v, name) => [`Rp ${Number(v).toLocaleString("id-ID")}`, name === "bulanIni" ? "Bulan Ini" : "Bulan Lalu"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
              />
              <Line type="monotone" dataKey="bulanIni" stroke="#16A34A" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="bulanLalu" stroke="#D1D5DB" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              <Legend formatter={(v) => v === "bulanIni" ? "Bulan Ini" : "Bulan Lalu"} wrapperStyle={{ fontSize: "11px" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table + Payment Method Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Transactions Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Riwayat Transaksi</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">No. Pesanan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Pelanggan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Subtotal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">#{t.id}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{t.date}</td>
                    <td className="px-4 py-3.5 text-xs font-medium text-gray-900">{t.customer}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-600">Rp {t.subtotal.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-gray-900">Rp {t.total.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={t.payStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-3 text-xs font-bold text-green-600">
                    Rp {data.transactions.reduce((a, t) => a + t.total, 0).toLocaleString("id-ID")}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Metode Pembayaran</h3>
          <p className="text-xs text-gray-400 mb-4">Distribusi bulan ini</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data.paymentData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {data.paymentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, "Porsi"]} contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {data.paymentData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="flex-1 text-xs text-gray-600 truncate">{item.name}</span>
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-900">{item.value}%</span>
                  <p className="text-xs text-gray-400">{item.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
