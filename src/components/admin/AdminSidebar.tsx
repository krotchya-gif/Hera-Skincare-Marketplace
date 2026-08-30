"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Tag,
  DollarSign,
  Gift,
  Star,
  Megaphone,
  Settings,
  LogOut,
  Leaf,
  ChevronRight,
  X,
  FileText,
  ExternalLink,
} from "lucide-react";
import { STORE_NAME, STORE_URL } from "@/utils/storeConfig";

const navItems = [
  {
    group: "Menu Utama",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Produk", href: "/admin/produk", icon: Package },
      { label: "Pesanan", href: "/admin/pesanan", icon: ClipboardList },
      { label: "Pelanggan", href: "/admin/pelanggan", icon: Users },
      { label: "Kategori", href: "/admin/kategori", icon: Tag },
      { label: "Blog", href: "/admin/blog", icon: FileText },
    ],
  },
  {
    group: "Keuangan & Marketing",
    items: [
      { label: "Keuangan", href: "/admin/keuangan", icon: DollarSign },
      { label: "Promo & Diskon", href: "/admin/promo", icon: Gift },
      { label: "Ulasan", href: "/admin/ulasan", icon: Star },
      { label: "Marketing", href: "/admin/marketing", icon: Megaphone },
    ],
  },
  {
    group: "Sistem",
    items: [
      { label: "Pengaturan", href: "/admin/pengaturan", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [adminName, setAdminName] = useState("Super Admin");
  const [adminEmail, setAdminEmail] = useState("");

  // Fetch real user data from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAdminEmail(user.email ?? "");
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", user.id)
            .single();
          if (profile?.name) {
            setAdminName(profile.name);
          } else {
            setAdminName(user.email?.split("@")[0] ?? "Admin");
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data user", err);
      }
    };
    fetchUser();
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click / escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <aside
      ref={sidebarRef}
      className={`
        bg-gray-900 flex flex-col h-full shadow-2xl
        w-64 shrink-0
      `}
    >
      {/* Logo Header */}
      <div className="p-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/50">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">
              {STORE_NAME}
            </p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
        {/* Close button — only visible on mobile */}
        <button
          id="btn-sidebar-close"
          onClick={onClose}
          className="lg:hidden w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          aria-label="Tutup menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((group) => (
          <div key={group.group}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-3 py-2 mt-3 first:mt-1">
              {group.group}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium group transition-all ${
                    active
                      ? "bg-green-600 text-white shadow-md shadow-green-900/40"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom — Admin Profile */}
      <div className="p-3 border-t border-gray-800">
        <a
          id="btn-view-website"
          href={STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors mb-2"
        >
          <ExternalLink size={16} />
          <span>Lihat Website</span>
        </a>
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-800 mb-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {adminName}
            </p>
            <p className="text-gray-400 text-xs truncate">
              {adminEmail || "Memuat..."}
            </p>
          </div>
        </div>
        <button
          id="btn-admin-logout"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:flex h-full">
        {sidebarContent}
      </div>

      {/* Mobile sidebar — slide-out drawer */}
      {/* Backdrop overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Drawer */}
        <div
          className={`absolute left-0 top-0 h-full transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi admin"
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
