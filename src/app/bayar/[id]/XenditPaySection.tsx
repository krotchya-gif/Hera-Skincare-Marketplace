"use client";

import { useState } from "react";

interface XenditPaySectionProps {
  orderId: string;
  orderNumber: string;
}

export default function XenditPaySection({ orderId, orderNumber }: XenditPaySectionProps) {
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const waShareHref = invoiceUrl
    ? `https://wa.me/?text=${encodeURIComponent(
        `Halo, saya ingin menyelesaikan pembayaran pesanan #${orderNumber} - Hera Skincare. Link pembayaran: ${invoiceUrl}`
      )}`
    : "#";

  const handleCreateInvoice = async () => {
    setPhase("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/payments/xendit/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat tagihan.");
      if (!data.invoiceUrl) throw new Error("Link pembayaran tidak tersedia.");

      setInvoiceUrl(data.invoiceUrl);
      setPhase("ready");
      window.open(data.invoiceUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  const handleCopyLink = async () => {
    if (!invoiceUrl) return;
    try {
      await navigator.clipboard.writeText(invoiceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMsg("Gagal menyalin link. Salin manual dari alamat browser.");
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4">
      <h3 className="font-semibold text-gray-900 text-sm mb-1">Bayar Online via Xendit</h3>
      <p className="text-xs text-gray-400 mb-3">
        QRIS, e-wallet (GoPay, OVO, DANA, ShopeePay), VA bank, kartu, &amp; retail.
      </p>

      {phase !== "ready" && (
        <button
          onClick={handleCreateInvoice}
          disabled={phase === "loading"}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
        >
          {phase === "loading" ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Membuat tagihan...
            </>
          ) : (
            "⚡ Bayar Online Sekarang"
          )}
        </button>
      )}

      {phase === "ready" && invoiceUrl && (
        <div className="space-y-2">
          <a
            href={invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Buka Halaman Pembayaran
          </a>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? "✓ Tersalin" : "Salin Link"}
            </button>
            <a
              href={waShareHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
            >
              Kirim via WhatsApp
            </a>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Setelah membayar, status pesanan diperbarui otomatis (mungkin perlu beberapa detik).
          </p>
        </div>
      )}

      {phase === "error" && errorMsg && (
        <p className="text-xs text-red-500 mt-2">{errorMsg}</p>
      )}
    </div>
  );
}
