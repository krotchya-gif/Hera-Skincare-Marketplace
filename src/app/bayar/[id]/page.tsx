import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ConfirmPaymentButton from "./ConfirmPaymentButton";
import XenditPaySection from "./XenditPaySection";

export default async function BayarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Session guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/profil?redirect=/bayar/" + id);
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order || order.status !== "menunggu") notFound();

  // Verify ownership
  if (order.user_id !== user.id) notFound();

  // Fetch bank account from store_settings
  const { data: paymentSettings } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "payment")
    .single();

  const bankAccount = (paymentSettings?.value as { bank_account?: { bank: string; number: string; owner: string } } | null)?.bank_account ?? null;

  const sudahLunas = order.payment_status === "lunas";

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Simple header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <Link href="/profil?tab=pesanan" className="text-sm text-green-600 font-medium">← Kembali</Link>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">{sudahLunas ? "✅" : "💰"}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {sudahLunas ? "Pembayaran Diterima" : "Pembayaran"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {sudahLunas ? "Terima kasih! Pesanan akan segera diproses." : "Selesaikan pembayaran sebelum batas waktu"}
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">No. Pesanan</span>
              <span className="font-semibold text-gray-900 font-mono">#{order.order_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Bayar</span>
              <span className="font-bold text-green-700 text-lg">Rp {order.total.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {!sudahLunas && (
            <XenditPaySection orderId={order.id} orderNumber={order.order_number} />
          )}

          {!sudahLunas && bankAccount && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Transfer ke:</h3>
              <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bank</span>
                  <span className="font-semibold text-gray-900">{bankAccount.bank}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">No. Rekening</span>
                  <span className="font-semibold text-gray-900 font-mono">{bankAccount.number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Atas Nama</span>
                  <span className="font-semibold text-gray-900">{bankAccount.owner}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Setelah transfer, klik tombol &quot;Sudah Bayar&quot; untuk konfirmasi.
              </p>
            </div>
          )}
          {!sudahLunas && !bankAccount && (
            <p className="text-xs text-gray-400 mt-2">Info rekening belum tersedia. Hubungi admin untuk detail pembayaran.</p>
          )}

          <div className="mt-6 space-y-3">
            {!sudahLunas && (
              <ConfirmPaymentButton orderId={order.id} orderNumber={order.order_number} />
            )}

            <Link
              href="/profil?tab=pesanan"
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors ${
                sudahLunas
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {sudahLunas ? "Lihat Status Pesanan" : "Nanti Saja"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
