"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { STORE_NAME } from "@/utils/storeConfig";
import { createClient } from "@/utils/supabase/client";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Leaf,
  Menu,
  X,
  ChevronDown,
  Package,
  Bell,
  LogOut,
  ChevronRight,
  Home,
  Tag,
  Flame,
} from "lucide-react";

export default function Navbar({ hideBottomBar = false }: { hideBottomBar?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [waNumber, setWaNumber] = useState("6281234567890");
  const [authLoading, setAuthLoading] = useState(true);

  interface NavbarCategory {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    products?: { count: number }[];
  }

  const [navCategories, setNavCategories] = useState<NavbarCategory[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchNavbarCategories = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug, icon, products(count)")
          .eq("is_active", true)
          .is("parent_id", null)
          .order("sort_order");

        if (!error && data) {
          setNavCategories(data as unknown as NavbarCategory[]);
        }
      } catch (err) {
        console.error("Failed to load navbar categories from DB", err);
      }
    };
    fetchNavbarCategories();
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/kategori/semua?search=${encodeURIComponent(q)}`);
  };
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setCategoryOpen(false);
  }, [pathname]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        // Fetch WhatsApp number from store settings
        const { data: waSetting } = await supabase
          .from("store_settings")
          .select("value")
          .eq("key", "whatsapp_number")
          .maybeSingle();
        if (waSetting?.value) {
          setWaNumber(waSetting.value as string);
        }
        if (currentUser) {
          setUser(currentUser);
          // Logged in: check if role is admin
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single();

          if (profile && ["super_admin", "admin", "operator", "finance"].includes(profile.role)) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }

          updateCartCount();
          updateWishlistCount();
        } else {
          setUser(null);
          setIsAdmin(false);
          updateCartCount();
          updateWishlistCount();
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    const updateCartCount = () => {
      try {
        const cartStr = localStorage.getItem("hera_cart");
        if (cartStr) {
          const cart = JSON.parse(cartStr);
          if (Array.isArray(cart)) {
            const total = cart.reduce((sum, item: { quantity?: number }) => sum + (item.quantity || 1), 0);
            setCartCount(total);
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
      setCartCount(0);
    };

    const updateWishlistCount = () => {
      try {
        const wishStr = localStorage.getItem("hera_wishlist");
        if (wishStr) {
          const wish = JSON.parse(wishStr);
          if (Array.isArray(wish)) {
            setWishlistCount(wish.length);
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
      setWishlistCount(0);
    };

    checkUser();

    window.addEventListener("storage", updateCartCount);
    window.addEventListener("storage", updateWishlistCount);
    window.addEventListener("cart-updated", updateCartCount);
    window.addEventListener("wishlist-updated", updateWishlistCount);
    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("storage", updateWishlistCount);
      window.removeEventListener("cart-updated", updateCartCount);
      window.removeEventListener("wishlist-updated", updateWishlistCount);
    };
  }, []);

  const navLinks = [
    { label: "Flash Sale", href: "/#flash-sale" },
    { label: "Promo", href: "/#promo" },
    { label: "Terlaris", href: "/#terlaris" },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-45 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_3px_rgba(5,150,105,0.06)] border-b border-white/50"
            : "bg-white shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* MOBILE HEADER (2 Rows on mobile/tablet) */}
          <div className="md:hidden flex flex-col pt-2.5 pb-2">
            {/* Top Row: Logo & Actions */}
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 shrink-0 group">
                <div className="w-8.5 h-8.5 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-emerald-700 text-sm leading-none tracking-tight">
                    {STORE_NAME}
                  </p>
                  <p className="text-[8px] text-gray-400 font-semibold tracking-wider uppercase leading-none mt-0.5">
                    Official
                  </p>
                </div>
              </Link>

              {/* Action Buttons */}
              <div className="flex items-center gap-0.5">
                <Link
                  href="/profil?tab=wishlist"
                  className="relative w-9.5 h-9.5 flex items-center justify-center text-gray-400 active:text-rose-500 rounded-xl active:bg-rose-50 transition-all duration-200"
                >
                  <Heart className="w-[19px] h-[19px]" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[15px] h-3.5 bg-gradient-to-br from-rose-500 to-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold px-1 shadow-sm">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profil"
                  className="relative w-9.5 h-9.5 flex items-center justify-center text-gray-400 active:text-emerald-600 rounded-xl active:bg-emerald-50 transition-all duration-200"
                >
                  <Bell className="w-[19px] h-[19px]" />
                </Link>
                <Link
                  href="/keranjang"
                  className="relative w-9.5 h-9.5 flex items-center justify-center text-gray-400 active:text-emerald-600 rounded-xl active:bg-emerald-50 transition-all duration-200"
                >
                  <ShoppingCart className="w-[19px] h-[19px]" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[15px] h-3.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full text-white text-[9px] flex items-center justify-center font-bold px-1 shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </Link>
                {/* Hamburger button */}
                <button
                  id="navbar-mobile-menu-toggle"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="w-9.5 h-9.5 flex items-center justify-center text-gray-500 active:text-emerald-600 rounded-xl active:bg-emerald-50 transition-all duration-200"
                  aria-label="Menu"
                >
                  <Menu className="w-5.5 h-5.5" />
                </button>
              </div>
            </div>

            {/* Bottom Row: Full-width Search Bar */}
            <div className="mt-2 pb-1">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  id="navbar-search-mobile"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                    searchTimeoutRef.current = setTimeout(() => {
                      const q = value.trim();
                      if (q) {
                        router.push(`/kategori/semua?search=${encodeURIComponent(q)}`);
                      }
                    }, 300);
                  }}
                  placeholder="Cari produk, kategori, atau merek..."
                  className="w-full bg-gray-50 border border-gray-200/80 rounded-full py-2 pl-4 pr-11 text-xs focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:bg-white placeholder:text-gray-400 transition-all duration-200"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-7.5 h-7.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-sm"
                  aria-label="Cari"
                >
                  <Search className="w-3.5 h-3.5 text-white" />
                </button>
              </form>
            </div>
          </div>

          {/* DESKTOP HEADER (Standard 1 Row on desktop) */}
          <div className="hidden md:flex items-center gap-3 py-3.5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:shadow-emerald-200 transition-all duration-300">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-emerald-700 text-base leading-tight tracking-tight">
                  {STORE_NAME}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight font-medium tracking-wider uppercase">
                  Official
                </p>
              </div>
            </Link>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 mx-3 relative">
              <input
                id="navbar-search-desktop"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                  searchTimeoutRef.current = setTimeout(() => {
                    const q = value.trim();
                    if (q) {
                      router.push(`/kategori/semua?search=${encodeURIComponent(q)}`);
                    }
                  }, 300);
                }}
                placeholder="Cari produk, kategori, atau merek..."
                className="w-full bg-gray-50/80 border border-gray-200/80 rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:bg-white placeholder:text-gray-400 transition-all duration-200"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Search className="w-4 h-4 text-white" />
              </button>
            </form>

            {/* Right icons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href="/profil?tab=wishlist"
                className="relative w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-all duration-200"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-gradient-to-br from-rose-500 to-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold px-1 shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profil"
                className="relative w-10 h-10 flex items-center justify-center text-gray-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200"
              >
                <Bell className="w-5 h-5" />
              </Link>
              <Link
                href="/keranjang"
                className="relative w-10 h-10 flex items-center justify-center text-gray-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full text-white text-[10px] flex items-center justify-center font-bold px-1 shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
              {authLoading ? (
                <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse border border-gray-200/50" />
              ) : user ? (
                <Link
                  href="/profil"
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 border border-white"
                >
                  {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                </Link>
              ) : (
                <Link
                  href="/profil"
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 border-t border-gray-100/80 py-2">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                pathname === "/"
                  ? "text-emerald-700 bg-emerald-50 shadow-sm"
                  : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/70"
              }`}
            >
              Beranda
            </Link>

            <div className="w-px h-4 bg-gray-200/60 mx-1" />

            {/* Category Dropdown */}
            <div className="relative">
              <button
                id="navbar-category-dropdown"
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap transition-all duration-200"
              >
                <Menu className="w-4 h-4" /> Kategori{" "}
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-300 ${
                    categoryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {categoryOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100/80 py-2 z-50 animate-scale-in">
                  {navCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/kategori/${cat.slug}`}
                      onClick={() => setCategoryOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50/70 group transition-all duration-200"
                    >
                      <span className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg group-hover:bg-emerald-100 transition-colors duration-200">
                        <CategoryIcon name={cat.icon} className="w-4 h-4 text-gray-600 group-hover:text-emerald-700 transition-colors" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-emerald-700 transition-colors">
                          {cat.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {cat.products && cat.products[0] ? cat.products[0].count : 0} produk
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-gray-200/60 mx-1" />

            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  pathname === link.href
                    ? "text-emerald-700 bg-emerald-50 shadow-sm"
                    : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/70"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isAdmin && (
              <div className="ml-auto">
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 border border-emerald-200/80 transition-all duration-200 hover:shadow-sm"
                >
                  ⚙️ Admin Panel
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Overlay for category dropdown (Desktop only) */}
      {categoryOpen && (
        <div className="fixed inset-0 z-40 hidden md:block" onClick={() => setCategoryOpen(false)} />
      )}

      {/* PREMIUM SLIDE-IN HAMBURGER DRAWER (Mobile) */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer Body */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-[290px] max-w-[85vw] bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer Header with Close & User Info */}
          <div className="p-5 border-b border-gray-100 flex flex-col gap-4 relative">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-full transition-colors"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo inside drawer */}
            <div className="flex items-center gap-2">
              <div className="w-7.5 h-7.5 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-sm">
                <Leaf className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-emerald-700 text-sm tracking-tight">{STORE_NAME}</span>
            </div>

            {/* Profile Section */}
            <div className="pt-2">
              {authLoading ? (
                <div className="flex items-center gap-3 animate-pulse bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
                  <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ) : user ? (
                <div className="flex items-center gap-3 bg-emerald-50/20 rounded-2xl p-4 border border-emerald-100/30">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base shadow-sm border border-white shrink-0">
                    {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-gray-800 truncate">{user.email}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                      {isAdmin ? "Admin" : "Pelanggan"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] text-gray-500 font-medium leading-normal">
                    Silakan masuk untuk berbelanja dengan lebih mudah dan cepat.
                  </p>
                  <Link
                    href="/profil"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-center text-xs shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                  >
                    Masuk / Daftar Akun
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links inside Drawer */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 no-scrollbar">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-2.5 mb-2">
              Menu Utama
            </p>

            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                pathname === "/"
                  ? "bg-emerald-50 text-emerald-700 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4 text-emerald-600" />
                <span>Beranda</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            {/* T-67: katalog semua produk */}
            <Link
              href="/kategori/semua"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                pathname === "/kategori/semua"
                  ? "bg-emerald-50 text-emerald-700 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Semua Produk</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </Link>

            {navLinks.map((link) => {
              const Icon = link.label === "Flash Sale" ? Flame : link.label === "Promo" ? Tag : Leaf;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-emerald-600" />
                    <span>{link.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              );
            })}

            <div className="h-px bg-gray-100 my-4" />

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-2.5 mb-2">
              Kategori Populer
            </p>
            {navCategories.slice(0, 5).map((cat) => (
              <Link
                key={cat.slug}
                href={`/kategori/${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-700 transition-all duration-200"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 flex items-center justify-center"><CategoryIcon name={cat.icon} className="w-4 h-4" /></span>
                  <span>{cat.name}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-45" />
              </Link>
            ))}
          </div>

          {/* Drawer Footer with Admin Link & Logout */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 shadow-sm hover:bg-emerald-100 transition-all duration-200 w-full"
              >
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Admin Panel</span>
              </Link>
            )}

            {user && (
              <button
                onClick={async () => {
                  localStorage.removeItem("hera_cart");
                  localStorage.removeItem("hera_wishlist");
                  localStorage.removeItem("hera_checkout_items");
                  localStorage.removeItem("hera_applied_voucher");
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-all duration-200 w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR (Always fixed relative to viewport, placed outside header) */}
      {!hideBottomBar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-45 bg-white/90 backdrop-blur-xl border-t border-gray-200/60 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around py-1.5">
            {[
              { href: "/", label: "Beranda", icon: Home },
              { href: "/voucher", label: "Voucher", icon: Tag },
              { href: "/keranjang", label: "Keranjang", icon: ShoppingCart, badge: cartCount },
              { href: "/profil", label: "Profil", icon: User },
            ].map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 relative active:scale-95 ${
                  pathname === tab.href ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                <span
                  className={`${
                    pathname === tab.href ? "scale-110" : ""
                  } transition-transform duration-200`}
                >
                  <tab.icon className="w-5 h-5" />
                </span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-0.5 right-1.5 min-w-[16px] h-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full text-white text-[9px] flex items-center justify-center font-bold px-1 shadow-sm">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                ) : null}
                <span
                  className={`text-[10px] font-medium ${
                    pathname === tab.href ? "text-emerald-600" : ""
                  }`}
                >
                  {tab.label}
                </span>
                {pathname === tab.href && (
                  <div className="absolute -bottom-1.5 w-5 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* FLOATING WHATSAPP BUTTON (Always fixed relative to viewport, placed outside header) */}
      {!hideBottomBar && (
        <a
          href={`https://wa.me/${waNumber}?text=Halo%20Hera%20Store%2C%20saya%20ingin%20bertanya`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-3.5 md:bottom-6 md:right-6 z-45 flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white pl-2.5 pr-3 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:shadow-emerald-200/50 transition-all duration-300 hover:scale-105 group"
        >
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className="text-[11px] md:text-xs font-semibold whitespace-nowrap">
            Hubungi Admin
          </span>
        </a>
      )}
    </>
  );
}
