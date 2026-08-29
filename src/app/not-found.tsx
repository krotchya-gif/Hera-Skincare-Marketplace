import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <SearchX className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-gray-500 mb-6">Halaman yang kamu cari mungkin telah dipindah atau dihapus.</p>
        <Link href="/" className="inline-block bg-green-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-green-700">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
