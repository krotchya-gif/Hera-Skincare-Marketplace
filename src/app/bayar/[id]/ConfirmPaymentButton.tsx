"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ConfirmPaymentButtonProps {
  orderId: string;
  orderNumber: string;
}

export default function ConfirmPaymentButton({ orderId, orderNumber }: ConfirmPaymentButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleConfirm = async () => {
    if (!confirm(`Konfirmasi pembayaran untuk pesanan #${orderNumber}?`)) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengonfirmasi pembayaran.");
      }

      setStatus("success");
      // Redirect ke halaman pesanan setelah 1 detik
      setTimeout(() => {
        router.push("/profil?tab=pesanan");
      }, 1000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleConfirm}
        disabled={status === "loading" || status === "success"}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors ${
          status === "success"
            ? "bg-green-100 text-green-700 border border-green-300"
            : "bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
        }`}
      >
        {status === "loading" ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Mengonfirmasi...
          </>
        ) : status === "success" ? (
          "✓ Pembayaran Dikonfirmasi"
        ) : (
          "Sudah Bayar"
        )}
      </button>

      {status === "error" && errorMsg && (
        <p className="text-xs text-red-500 text-center">{errorMsg}</p>
      )}
    </div>
  );
}
