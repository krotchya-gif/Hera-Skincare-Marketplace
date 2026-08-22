"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Menu } from "lucide-react";
import { STORE_NAME } from "@/utils/storeConfig";
import NotificationDropdown from "./NotificationDropdown";

const pageTitles: Record<string, { title: string; breadcrumb: string[] }> = {
  "/admin": { title: "Dashboard", breadcrumb: ["Admin", "Dashboard"] },
  "/admin/produk": { title: "Manajemen Produk", breadcrumb: ["Admin", "Produk"] },
  "/admin/pesanan": { title: "Manajemen Pesanan", breadcrumb: ["Admin", "Pesanan"] },
  "/admin/pelanggan": { title: "Manajemen Pelanggan", breadcrumb: ["Admin", "Pelanggan"] },
  "/admin/kategori": { title: "Manajemen Kategori", breadcrumb: ["Admin", "Kategori"] },
  "/admin/keuangan": { title: "Laporan Keuangan", breadcrumb: ["Admin", "Keuangan"] },
  "/admin/promo": { title: "Promo & Diskon", breadcrumb: ["Admin", "Promo"] },
  "/admin/ulasan": { title: "Manajemen Ulasan", breadcrumb: ["Admin", "Ulasan"] },
  "/admin/marketing": { title: "Marketing", breadcrumb: ["Admin", "Marketing"] },
  "/admin/pengaturan": { title: "Pengaturan Toko", breadcrumb: ["Admin", "Pengaturan"] },
};

interface AdminTopbarProps {
  onMenuToggle: () => void;
}

export default function AdminTopbar({ onMenuToggle }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const page = Object.entries(pageTitles).find(
    ([key]) =>
      pathname === key || (key !== "/admin" && pathname.startsWith(key + "/")) || (key !== "/admin" && pathname.startsWith(key))
  );
  // Fallback: match parent route for sub-routes like /admin/produk/tambah, /admin/pesanan/123
  const matchedPage = page ?? (() => {
    const parentKey = "/" + pathname.split("/").slice(1, 3).join("/");
    const entry = Object.entries(pageTitles).find(([k]) => k === parentKey);
    return entry ?? null;
  })();
  const { title, breadcrumb } = matchedPage?.[1] ?? {
    title: "Dashboard",
    breadcrumb: ["Admin"],
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shrink-0 shadow-sm z-30">
      {/* Left — Hamburger (mobile) + Title + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger button — only on mobile */}
        <button
          id="btn-hamburger-menu"
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm md:text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
          {/* Breadcrumb — hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300">/</span>}
                <span
                  className={
                    i === breadcrumb.length - 1
                      ? "text-green-600 font-medium"
                      : ""
                  }
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Search + Notifications + Avatar */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Search — hidden on small mobile */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                // Redirect to search results if needed
                router.push(`/admin/produk?search=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 w-40 lg:w-48"
          />
        </div>

        {/* Search icon on mobile */}
        <button
          className="md:hidden w-9 h-9 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100"
          onClick={() => {
            const q = prompt("Cari sesuatu di admin...");
            if (q && q.trim()) {
              router.push(`/admin/produk?search=${encodeURIComponent(q.trim())}`);
            }
          }}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">
              Super Admin
            </p>
            <p className="text-xs text-gray-400">{STORE_NAME}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
