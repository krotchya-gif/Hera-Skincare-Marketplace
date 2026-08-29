"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatRp } from "@/utils/format";
import { createClient } from "@/utils/supabase/client";

interface CustomerProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: "aktif" | "nonaktif" | "diblokir";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

function CustomerDetailModal({
  customer,
  onClose,
  onStatusChange,
}: {
  customer: CustomerProfile;
  onClose: () => void;
  onStatusChange: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [customerOrders, setCustomerOrders] = useState<{ order_number: string; total: number; status: string; created_at: string }[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("orders")
          .select("order_number, total, status, created_at")
          .eq("user_id", customer.id)
          .order("created_at", { ascending: false })
          .limit(5);
        setCustomerOrders(data ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [customer.id]);

  const handleToggleStatus = async () => {
    const nextStatus = customer.status === "diblokir" ? "aktif" : "diblokir";
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/customers/${customer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (res.ok) {
          onStatusChange();
          onClose();
        }
      } catch (error) {
        console.error("Failed to update customer status", error);
      }
    });
  };

  const initials = (customer.name || customer.email || "C").substring(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                {initials}
              </div>
              <div>
                <h2 className="font-bold text-lg">{customer.name || "Pelanggan"}</h2>
                <p className="text-green-200 text-sm">{customer.email || "-"}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 text-xs">No. HP</span>
              <span className="font-medium text-xs">{customer.phone || "-"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 text-xs">Bergabung</span>
              <span className="font-medium text-xs">{new Date(customer.created_at).toLocaleDateString("id-ID")}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 text-xs">Status</span>
              <StatusBadge status={customer.status} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleToggleStatus}
              disabled={isPending}
              className={`flex-1 font-semibold py-2.5 rounded-xl text-xs border transition-colors ${
                customer.status === "diblokir"
                  ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                  : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              {customer.status === "diblokir" ? "Aktifkan Akun" : "Blokir Akun"}
            </button>
          </div>

          {/* Order History */}
          <div className="pt-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Riwayat Belanja</h4>
            {ordersLoading ? (
              <div className="text-center py-4"><div className="w-5 h-5 border-2 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" /></div>
            ) : customerOrders.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Belum ada transaksi.</p>
            ) : (
              <div className="space-y-2">
                {customerOrders.map((o, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div>
                      <p className="text-xs font-medium text-gray-900 font-mono">#{o.order_number}</p>
                      <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString("id-ID")}</p>
                    </div>
                    <span className="text-xs font-semibold text-green-700">{formatRp(o.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0,
  });

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerTotals, setCustomerTotals] = useState<Record<string, number>>({});
  const [, startTransition] = useTransition();

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: Math.min(10, 100).toString(),
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data ?? []);
        setTotalCount(data.count ?? 0);
        if (data.stats) {
          setStats(data.stats);
        }
        // Fetch total spent for displayed customers
        if (data.data?.length > 0) {
          const ids = data.data.map((c: CustomerProfile) => c.id);
          const supabase = createClient();
          const { data: orders } = await supabase
            .from("orders")
            .select("user_id, total")
            .in("user_id", ids)
            .eq("payment_status", "lunas");
          const totals: Record<string, number> = {};
          for (const o of orders ?? []) {
            totals[o.user_id] = (totals[o.user_id] || 0) + (o.total || 0);
          }
          setCustomerTotals(totals);
        }
      }
    } catch {
      console.error("Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    startTransition(() => {
      fetchCustomers();
    });
  }, [fetchCustomers]);

  const handleToggleBlock = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "diblokir" ? "aktif" : "diblokir";
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/customers/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (res.ok) {
          fetchCustomers();
        }
      } catch (error) {
        console.error("Failed to update status", error);
      }
    });
  };

  const totalPages = Math.ceil(totalCount / 10);

  const headerStats = [
    { label: "Total Pelanggan", value: stats.total.toLocaleString(), icon: "users", color: "bg-blue-50 text-blue-700" },
    { label: "Pelanggan Baru (Est. Bln Ini)", value: stats.newThisMonth.toLocaleString(), icon: "user-plus", color: "bg-green-50 text-green-700" },
    { label: "Pelanggan Aktif", value: stats.active.toLocaleString(), icon: "check", color: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Manajemen Pelanggan</h2>
        <p className="text-sm text-gray-500 mt-0.5">Kelola dan pantau semua pelanggan marketplace</p>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {headerStats.map((s) => (
          <div key={s.label} className={`${s.color} rounded-2xl p-5 flex items-center gap-4`}>
            <CategoryIcon name={s.icon} className="w-7 h-7" />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm font-medium opacity-80">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Cari nama atau email pelanggan..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Pelanggan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">No. HP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Bergabung</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Total Belanja</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">Tidak ada pelanggan ditemukan.</td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const initials = (customer.name || customer.email || "C").substring(0, 2).toUpperCase();
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-xs">{customer.name || "Pelanggan"}</p>
                            <p className="text-gray-400 text-xs">{customer.email || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-gray-600">{customer.phone || "-"}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-gray-500">{new Date(customer.created_at).toLocaleDateString("id-ID")}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold text-gray-900">{customerTotals[customer.id] ? formatRp(customerTotals[customer.id]) : "-"}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={customer.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            id={`btn-customer-detail-${customer.id}`}
                            onClick={() => setSelectedCustomer(customer)}
                            className="text-green-600 hover:text-green-700 text-xs font-semibold hover:underline"
                          >
                            Detail
                          </button>
                          <span className="text-gray-200 mx-1">|</span>
                          <button
                            onClick={() => handleToggleBlock(customer.id, customer.status)}
                            className={`text-xs font-semibold ${customer.status === "diblokir" ? "text-green-500 hover:text-green-600" : "text-red-400 hover:text-red-600"}`}
                          >
                            {customer.status === "diblokir" ? "Aktifkan" : "Blokir"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">Menampilkan {customers.length} dari {totalCount} pelanggan</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold ${currentPage === i + 1 ? "bg-green-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onStatusChange={fetchCustomers}
        />
      )}
    </div>
  );
}
