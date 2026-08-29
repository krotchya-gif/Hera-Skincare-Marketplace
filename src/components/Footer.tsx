import Link from "next/link";
import { Leaf, Camera, Music2, ThumbsUp, CreditCard, Landmark, Smartphone, Banknote } from "lucide-react";
import { STORE_NAME } from "@/utils/storeConfig";

export default function Footer() {
  const columns = [
    {
      title: "Layanan",
      links: [
        { label: "Tentang Kami", href: "/tentang-kami" },
        { label: "Karir", href: "/karir" },
        { label: "Blog", href: "/blog" },
        { label: "Hubungi Kami", href: "/hubungi-kami" },
      ],
    },
    {
      title: "Bantuan",
      links: [
        { label: "FAQ", href: "/faq" },
        { label: "Cara Belanja", href: "/cara-belanja" },
        { label: "Pengembalian Barang", href: "/pengembalian-barang" },
        { label: "Lacak Pesanan", href: "/profil?tab=pesanan" },
      ],
    },
    {
      title: "Kategori",
      links: [
        { label: "Skincare", href: "/kategori/skincare" },
        { label: "Makeup", href: "/kategori/makeup" },
        { label: "Perawatan Rambut", href: "/kategori/perawatan-rambut" },
        { label: "Parfum", href: "/kategori/parfum" },
      ],
    },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white pt-10 sm:pt-12 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-emerald-500/30 transition-all duration-300">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight">{STORE_NAME}</span>
            </Link>
            <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
              Marketplace skincare &amp; kecantikan premium. Kualitas terjamin, harga
              terjangkau.
            </p>
            <div className="flex gap-2 mt-4">
              {[
                { icon: <Camera className="w-4 h-4" />, label: "Instagram" },
                { icon: <Music2 className="w-4 h-4" />, label: "TikTok" },
                { icon: <ThumbsUp className="w-4 h-4" />, label: "Facebook" },
              ].map((sm, i) => (
                <button
                  key={i}
                  aria-label={sm.label}
                  className="w-9 h-9 bg-gray-800/80 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-emerald-500 hover:to-emerald-600 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-emerald-500/20 border border-gray-700/50 hover:border-transparent"
                >
                  {sm.icon}
                </button>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-semibold text-sm mb-3 sm:mb-4 text-white/90">{col.title}</h3>
              <ul className="space-y-2 sm:space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-400 text-xs hover:text-emerald-400 transition-all duration-200 hover:translate-x-0.5 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800/60 pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-[10px] sm:text-xs">
            © {new Date().getFullYear()} {STORE_NAME}. Hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-[10px] sm:text-xs">Metode Pembayaran:</span>
            {[<CreditCard key="c" className="w-4 h-4" />, <Landmark key="l" className="w-4 h-4" />, <Smartphone key="s" className="w-4 h-4" />, <Banknote key="b" className="w-4 h-4" />].map((icon, i) => (
              <div key={i} className="bg-gray-800/60 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-gray-700/40 hover:border-emerald-500/30 transition-all duration-200">
                {icon}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}