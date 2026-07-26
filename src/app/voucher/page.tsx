import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VoucherCard from "@/components/VoucherCard";

export default async function VoucherPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: vouchers } = user ? await supabase
    .from("vouchers")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false }) : { data: null };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Voucher Saya</h1>
          <p className="text-sm text-gray-500">Kumpulan promo dan diskon untuk belanja hemat</p>
        </div>

        {!user ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <span className="text-5xl block mb-3">🔒</span>
            <p className="font-semibold text-gray-900">Login untuk melihat voucher</p>
            <p className="text-sm text-gray-500 mt-1">Silakan masuk akun untuk mengakses promo dan diskon.</p>
          </div>
        ) : (!vouchers || vouchers.length === 0) ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <span className="text-5xl block mb-3">🏷️</span>
            <p className="font-semibold text-gray-900">Belum ada voucher</p>
            <p className="text-sm text-gray-500 mt-1">Nantikan promo menarik dari Hera Skincare</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vouchers.map((v) => (
              <VoucherCard key={v.id} code={v.code} type={v.type} value={v.value} min_purchase={v.min_purchase} quota={v.quota} used_count={v.used_count} ends_at={v.ends_at} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
