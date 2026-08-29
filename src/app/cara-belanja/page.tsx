import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { STORE_NAME } from "@/utils/storeConfig";
import { Search, ShoppingCart, ClipboardList, MapPin, Truck, CreditCard, CheckCircle2, PackageCheck } from "lucide-react";

export const metadata = {
  title: `Cara Belanja — ${STORE_NAME}`,
  description: `Panduan lengkap cara berbelanja di ${STORE_NAME}. Mudah, aman, dan cepat.`,
};

const steps = [
  { number: 1, icon: <Search className="w-5 h-5" />, title: "Cari Produk", desc: "Gunakan fitur pencarian atau jelajahi kategori untuk menemukan produk yang Anda butuhkan." },
  { number: 2, icon: <ShoppingCart className="w-5 h-5" />, title: "Tambahkan ke Keranjang", desc: "Pilih varian (jika ada), atur jumlah, lalu klik 'Tambah ke Keranjang'." },
  { number: 3, icon: <ClipboardList className="w-5 h-5" />, title: "Checkout", desc: "Buka halaman keranjang, pilih produk yang ingin dibeli, lalu klik 'Lanjut ke Checkout'." },
  { number: 4, icon: <MapPin className="w-5 h-5" />, title: "Isi Alamat", desc: "Masukkan atau pilih alamat pengiriman yang sudah tersimpan." },
  { number: 5, icon: <Truck className="w-5 h-5" />, title: "Pilih Kurir", desc: "Pilih layanan pengiriman sesuai kebutuhan (Reguler, Express, atau Same Day)." },
  { number: 6, icon: <CreditCard className="w-5 h-5" />, title: "Pilih Pembayaran", desc: "Pilih metode pembayaran yang tersedia: Transfer Bank, E-Wallet, atau COD." },
  { number: 7, icon: <CheckCircle2 className="w-5 h-5" />, title: "Konfirmasi & Bayar", desc: "Periksa kembali pesanan Anda, lalu klik 'Buat Pesanan'. Lakukan pembayaran sesuai instruksi." },
  { number: 8, icon: <PackageCheck className="w-5 h-5" />, title: "Terima Pesanan", desc: "Pesanan akan diproses dan dikirim. Anda bisa melacak status pesanan di halaman Profil." },
];

export default function CaraBelanjaPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cara Belanja</h1>
          <p className="text-sm text-gray-500 mt-1">Panduan lengkap berbelanja di {STORE_NAME}</p>
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.number} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0 text-green-600">
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-green-600">Langkah {step.number}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-green-50 rounded-2xl border border-green-100 p-5 text-center">
          <p className="text-sm text-green-700 font-medium">
            Siap berbelanja?{" "}
            <Link href="/" className="underline hover:text-green-800">Mulai sekarang</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
