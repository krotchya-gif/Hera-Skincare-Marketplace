"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { X } from "lucide-react";
import { formatRp } from "@/utils/format";
import type { Order, OrderStatus } from "@/types/database";

export default function OrderDetailModal({
  orderId,
  onClose,
  onUpdateSuccess,
}: {
  orderId: string;
  onClose: () => void;
  onUpdateSuccess: () => void;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchOrderDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setTrackingNumberInput(data.tracking_number || "");
      }
    } catch {
      console.error("Failed to fetch order detail");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    startTransition(() => {
      fetchOrderDetail();
    });
  }, [fetchOrderDetail]);

  const handleUpdateStatus = async (status: OrderStatus) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            tracking_number: trackingNumberInput || undefined,
          }),
        });
        if (res.ok) {
          fetchOrderDetail();
          onUpdateSuccess();
        }
      } catch (error) {
        console.error("Failed to update status", error);
      }
    });
  };

  // T-19: Verifikasi pembayaran manual (admin menandai lunas setelah customer lapor)
  const handleVerifyPayment = async (paymentStatus: "lunas" | "gagal") => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_status: paymentStatus }),
        });
        if (res.ok) {
          fetchOrderDetail();
          onUpdateSuccess();
        }
      } catch (error) {
        console.error("Failed to verify payment", error);
      }
    });
  };

  if (isLoading || !order) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white h-full w-full max-w-xl shadow-2xl flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const timeline = [
    { label: "Pesanan dibuat", time: new Date(order.created_at).toLocaleString("id-ID"), done: true },
    { label: "Pembayaran diterima", time: order.payment_status === "lunas" ? "Lunas" : "", done: order.payment_status === "lunas" },
    { label: "Sedang diproses", time: order.status !== "menunggu" && order.status !== "dibatalkan" ? "Diproses" : "", done: order.status !== "menunggu" && order.status !== "dibatalkan" },
    { label: "Dikirim", time: order.tracking_number ? `Resi: ${order.tracking_number}` : "", done: !!order.tracking_number },
    { label: "Selesai", time: order.status === "selesai" ? "Selesai" : "", done: order.status === "selesai" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white h-full w-full max-w-xl shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-semibold text-gray-900">Detail Pesanan</h2>
            <p className="text-xs text-gray-400 font-mono">#{order.order_number}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString("id-ID")}</span>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">Timeline Pesanan</p>
            <div className="space-y-3">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step.done ? "bg-green-500" : "bg-gray-200"}`}>
                    {step.done ? <span className="text-white text-xs">✓</span> : <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${step.done ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                    {step.time && <p className="text-xs text-gray-400">{step.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">Info Pelanggan & Alamat</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama</span>
                <span className="font-medium text-gray-900">{order.profiles?.name || "Pelanggan"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{order.profiles?.email || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">No. HP</span>
                <span className="font-medium text-gray-900">{order.profiles?.phone || order.shipping_address?.phone || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Alamat</span>
                <span className="font-medium text-gray-900 text-right max-w-[250px]">
                  {order.shipping_address ? `${order.shipping_address.name}, ${order.shipping_address.phone}, ${order.shipping_address.address}, ${order.shipping_address.city}, ${order.shipping_address.province}, ${order.shipping_address.postal_code}` : "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">Produk</p>
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl shrink-0">🧴</div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.qty} · Satuan: {formatRp(item.price)}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{formatRp(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">Rincian Biaya</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatRp(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Ongkos Kirim ({order.shipping_method || "Regular"})</span>
                <span>{formatRp(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Diskon</span>
                <span className="text-green-600">- {formatRp(order.discount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{formatRp(order.total)}</span>
              </div>
            </div>
          </div>

            <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Pembayaran</p>
              <p className="text-xs text-gray-900 font-medium">{order.payment_method || "Transfer"}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                order.payment_status === "lunas"
                  ? "bg-green-100 text-green-700"
                  : order.payment_status === "gagal"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}>
                {order.payment_status === "lunas"
                  ? "Lunas"
                  : order.payment_status === "gagal"
                    ? "Gagal"
                    : "Belum Bayar"}
              </span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Pengiriman</p>
              <p className="text-xs text-gray-900 font-medium">{order.shipping_method || "JNE"}</p>
              {order.tracking_number ? (
                <p className="text-xs text-green-600 font-mono mt-1">✓ {order.tracking_number}</p>
              ) : order.status === "diproses" ? (
                <div className="mt-2">
                  <p className="text-[10px] text-orange-600 font-medium mb-1">⚠️ Resi wajib diisi sebelum kirim</p>
                  <input
                    value={trackingNumberInput}
                    onChange={(e) => setTrackingNumberInput(e.target.value)}
                    placeholder="Masukkan nomor resi pengiriman..."
                    className="w-full border-2 border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                    autoFocus
                  />
                </div>
              ) : order.status === "menunggu" ? (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-500 mb-1">Resi akan diinput saat pengiriman</p>
                  <input
                    value={trackingNumberInput}
                    onChange={(e) => setTrackingNumberInput(e.target.value)}
                    placeholder="Input no. resi (opsional)..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-1">-</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {/* T-19: Verifikasi pembayaran manual — hanya saat status belum lunas */}
            {order.payment_status !== "lunas" && order.payment_status !== "gagal" && (
              <button
                disabled={isPending}
                onClick={() => handleVerifyPayment("lunas")}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs disabled:opacity-50"
              >
                ✓ Verifikasi Pembayaran
              </button>
            )}
            {order.payment_status !== "lunas" && order.payment_status !== "gagal" && (
              <button
                disabled={isPending}
                onClick={() => handleVerifyPayment("gagal")}
                className="px-4 border border-red-200 text-red-600 font-semibold py-2.5 rounded-xl text-xs hover:bg-red-50 disabled:opacity-50"
              >
                Tolak
              </button>
            )}
            {order.status === "menunggu" && (
              <button
                disabled={isPending}
                onClick={() => handleUpdateStatus("diproses")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-xs disabled:opacity-50"
              >
                Proses Pesanan
              </button>
            )}
            {order.status === "diproses" && (
              <button
                disabled={isPending}
                onClick={() => handleUpdateStatus("dikirim")}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl text-xs disabled:opacity-50"
              >
                Kirim Pesanan (Gunakan Resi)
              </button>
            )}
            {order.status === "dikirim" && (
              <button
                disabled={isPending}
                onClick={() => handleUpdateStatus("selesai")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-xs disabled:opacity-50"
              >
                Selesaikan Pesanan
              </button>
            )}
            {order.status !== "selesai" && order.status !== "dibatalkan" && (
              <button
                disabled={isPending}
                onClick={() => handleUpdateStatus("dibatalkan")}
                className="px-4 border border-red-200 text-red-600 font-semibold py-2.5 rounded-xl text-xs hover:bg-red-50 disabled:opacity-50"
              >
                Batalkan
              </button>
            )}
            <button className="px-4 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-xs hover:bg-gray-50">
              Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
