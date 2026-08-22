"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatRp } from "@/utils/format";
import { getCompare, removeFromCompare, clearCompare, type CompareItem } from "@/lib/comparison-utils";

export default function PerbandinganPage() {
  const [items, setItems] = useState<CompareItem[] | null>(null);

  useEffect(() => {
    const refresh = () => setItems(getCompare());
    // defer agar tidak setState sinkron di dalam effect (react-hooks rule)
    const t = setTimeout(refresh, 0);
    window.addEventListener("compare-updated", refresh);
    return () => {
      clearTimeout(t);
      window.removeEventListener("compare-updated", refresh);
    };
  }, []);

  if (items === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="text-gray-400 py-16 text-center">Memuat...</p>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Bandingkan Produk</h1>
          {items.length > 0 && (
            <button
              onClick={() => clearCompare()}
              className="text-xs font-semibold text-red-500 hover:text-red-600"
            >
              Kosongkan semua
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-sm text-gray-400 mb-4">
              Belum ada produk untuk dibandingkan. Tambahkan hingga 4 produk dari halaman detail produk.
            </p>
            <Link
              href="/"
              className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 w-36">Produk</th>
                  {items.map((item) => (
                    <th key={item.id} className="px-4 py-3 text-left align-top">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-800">{item.name}</span>
                        <button
                          onClick={() => removeFromCompare(item.id)}
                          className="w-6 h-6 shrink-0 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400"
                          title="Hapus dari perbandingan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-500">Harga</td>
                  {items.map((item) => (
                    <td key={item.id} className="px-4 py-3">
                      {item.discount_price ? (
                        <div>
                          <span className="text-sm font-bold text-green-700">{formatRp(item.discount_price)}</span>
                          <span className="block text-[11px] text-gray-400 line-through">{formatRp(item.price)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-gray-800">{formatRp(item.price)}</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-500">Stok</td>
                  {items.map((item) => (
                    <td key={item.id} className="px-4 py-3">
                      <span className={`text-xs ${!item.stock || item.stock <= 0 ? "text-red-500" : "text-gray-600"}`}>
                        {!item.stock || item.stock <= 0 ? "Habis" : `${item.stock} tersedia`}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-500">Detail</td>
                  {items.map((item) => (
                    <td key={item.id} className="px-4 py-3">
                      {item.slug ? (
                        <Link href={`/produk/${item.slug}`} className="text-xs font-semibold text-green-600 hover:underline">
                          Lihat produk
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
