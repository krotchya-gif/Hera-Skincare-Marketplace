"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Bagaimana cara berbelanja di Hera Store?",
    a: "Cukup pilih produk yang diinginkan, tambahkan ke keranjang, lalu lanjut ke checkout. Isi alamat pengiriman dan pilih metode pembayaran. Setelah pesanan berhasil, kami akan memprosesnya.",
  },
  {
    q: "Apa saja metode pembayaran yang tersedia?",
    a: "Kami menerima Transfer Bank (BCA, Mandiri, BRI), GoPay, OVO, DANA, ShopeePay, Virtual Account, dan COD (Bayar di Tempat).",
  },
  {
    q: "Berapa lama waktu pengiriman?",
    a: "Estimasi pengiriman bervariasi tergantung kurir yang dipilih: Reguler (3-5 hari), Express (1-2 hari), atau Same Day (hari ini juga).",
  },
  {
    q: "Apakah ada biaya pengiriman?",
    a: "Kami memberikan gratis ongkir untuk pembelian minimal Rp 100.000. Untuk pembelian di bawah itu, biaya pengiriman disesuaikan dengan kurir dan lokasi tujuan.",
  },
  {
    q: "Bagaimana cara mengembalikan barang?",
    a: "Pengembalian barang dapat dilakukan dalam 7 hari setelah barang diterima. Pastikan barang masih dalam kondisi baik dan belum digunakan. Hubungi customer service kami untuk proses lebih lanjut.",
  },
  {
    q: "Apakah produk di Hera Store original?",
    a: "Ya, semua produk yang kami jual adalah 100% original dan berkualitas. Kami bekerja sama dengan distributor resmi untuk memastikan keaslian produk.",
  },
  {
    q: "Bagaimana cara melacak pesanan?",
    a: "Anda dapat melacak pesanan melalui halaman Profil > Pesanan Saya. Kami juga akan mengirimkan nomor resi setelah pesanan dikirim.",
  },
  {
    q: "Apakah saya bisa membatalkan pesanan?",
    a: "Pesanan dapat dibatalkan selama status masih 'Menunggu Pembayaran'. Jika sudah dibayar, silakan hubungi customer service kami.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ</h1>
          <p className="text-sm text-gray-500 mt-1">Pertanyaan yang sering diajukan</p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-gray-900 pr-4">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
