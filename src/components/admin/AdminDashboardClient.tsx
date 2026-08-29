"use client";

import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { STORE_NAME } from "@/utils/storeConfig";
import { formatRupiah } from "@/utils/format";
import {
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
} from "recharts";
import { ArrowUpRight, Wallet, Package, Users, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import type { DashboardStats } from "@/types/database";

const CATEGORY_COLORS = ["#16A34A", "#22D3EE", "#FBBF24", "#A78BFA", "#EC4899", "#3B82F6"];

const formatRpFull = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

interface AdminDashboardClientProps {
  stats: DashboardStats;
}

export default function AdminDashboardClient({ stats }: AdminDashboardClientProps) {
  const chartPeriod = "30 Hari";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-green-200 text-sm font-medium mb-1">
            Selamat datang kembali 👋
          </p>
          <h2 className="text-2xl font-bold mb-1">Dashboard Admin</h2>
          <p className="text-green-100 text-sm">
            {STORE_NAME} — Live Overview
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Pendapatan"
          value={formatRupiah(stats.totalRevenue)}
          change={`${stats.revenueChange}%`}
          changeType={stats.revenueChange >= 0 ? "up" : "down"}
          icon={<Wallet className="w-5 h-5" />}
          iconBg="bg-green-50"
        />
        <StatCard
          title="Total Pesanan"
          value={stats.totalOrders.toLocaleString()}
          change={`${stats.ordersChange}%`}
          changeType={stats.ordersChange >= 0 ? "up" : "down"}
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Total Pelanggan"
          value={stats.totalCustomers.toLocaleString()}
          change={`${stats.customersChange}%`}
          changeType={stats.customersChange >= 0 ? "up" : "down"}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-purple-50"
        />
        <StatCard
          title="Produk Terjual"
          value={stats.totalProductsSold.toLocaleString()}
          change={`${stats.productsSoldChange}%`}
          changeType={stats.productsSoldChange >= 0 ? "up" : "down"}
          icon={<BarChart3 className="w-5 h-5" />}
          iconBg="bg-orange-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Line Chart — Sales 30 Days */}
        <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-900">Grafik Penjualan</h3>
              <p className="text-xs text-gray-400 mt-0.5">{chartPeriod} Terakhir</p>
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${stats.revenueChange >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {stats.revenueChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />} {stats.revenueChange >= 0 ? "Naik" : "Turun"} {Math.abs(stats.revenueChange)}%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={stats.salesChart}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(val) => {
                  const parts = val.split("-");
                  return parts.length === 3 ? `${parseInt(parts[2])} / ${parseInt(parts[1])}` : val;
                }}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tickFormatter={formatRupiah}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip
                formatter={(value: unknown) => [
                  formatRpFull(Number(value)),
                  "Penjualan",
                ]}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#16A34A"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#16A34A" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — Category */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Penjualan per Kategori</h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribusi nominal pendapatan</p>
          </div>
          {stats.categoryChart.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-gray-400">Belum ada data penjualan.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={stats.categoryChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.categoryChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown) => [formatRpFull(Number(value)), "Pendapatan"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto">
                {stats.categoryChart.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                    />
                    <span className="flex-1 text-gray-600 truncate">{item.name}</span>
                    <span className="font-semibold text-gray-900">{formatRupiah(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Orders + Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Orders Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">Pesanan Terbaru</h3>
              <p className="text-xs text-gray-400">5 pesanan terakhir masuk</p>
            </div>
            <Link
              href="/admin/pesanan"
              className="flex items-center gap-1 text-green-600 text-xs font-semibold hover:text-green-700"
            >
              Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    No. Pesanan
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                    Pelanggan
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">
                    Produk
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                    Total
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-sm text-gray-400">Belum ada pesanan terbaru.</td>
                  </tr>
                ) : (
                  stats.recentOrders.map((order) => {
                    const firstItem = order.order_items && order.order_items[0];
                    const itemsText = firstItem
                      ? `${firstItem.product_name}${order.order_items!.length > 1 ? ` + ${order.order_items!.length - 1} produk` : ""}`
                      : "-";

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">
                            #{order.order_number}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-medium text-gray-900 text-xs">
                              {order.profiles?.name || "Pelanggan"}
                            </p>
                            <p className="text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString("id-ID")}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <p className="text-xs text-gray-600 max-w-[140px] truncate" title={itemsText}>
                            {itemsText}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-gray-900 text-xs">
                            {formatRpFull(order.total)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={order.status} />
                            {order.payment_status === "belum_bayar" && (
                              <span className="text-[10px] bg-yellow-100 text-yellow-700 font-semibold px-1.5 py-0.5 rounded-full">Belum Bayar</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/admin/pesanan`}
                            className="text-green-600 hover:text-green-700 text-xs font-semibold hover:underline"
                          >
                            Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Produk Terlaris</h3>
            <p className="text-xs text-gray-400">Berdasarkan unit terjual</p>
          </div>
          <div className="space-y-3">
            {stats.topProducts.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-400">Belum ada data produk terjual.</p>
            ) : (
              stats.topProducts.map((product, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={product.product_name}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${rank === 1
                          ? "bg-yellow-100 text-yellow-700"
                          : rank === 2
                            ? "bg-gray-100 text-gray-600"
                            : rank === 3
                              ? "bg-orange-50 text-orange-600"
                              : "bg-gray-50 text-gray-500"
                        }`}
                    >
                      {rank}
                    </div>
                    <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {product.product_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {product.total_qty.toLocaleString("id-ID")} terjual
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-green-600">
                        {formatRupiah(product.total_revenue)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
