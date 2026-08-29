"use client";

import { useState, useEffect } from "react";
import { STORE_NAME } from "@/utils/storeConfig";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PromoBannerCarousel from "@/components/PromoBannerCarousel";
import PushOptIn from "@/components/PushOptIn";
import type { Banner } from "@/types/database";
import { useToast } from "@/components/Toast";
import { createClient } from "@/utils/supabase/client";
import {
  Leaf,
  Truck,
  Shield,
  Headphones,
  BadgeCheck,
  ChevronRight,
  Star,
  Zap,
  Heart,
  X,
  ArrowRight,
  Droplets,
  Sparkles,
  Flower2,
  Package,
  Tag,
} from "lucide-react";
import type { Product, Category } from "@/types/database";
import { CategoryIcon } from "@/components/CategoryIcon";

import { formatRp } from "@/utils/format";
import { addToCart, getWishlist, toggleWishlist } from "@/lib/cart-utils";
import { getProductImage } from "@/lib/product-image";

export function getProductEmoji(slug: string | null, categoryIcon?: string | null): string {
  // T-47: emoji dihapus — fallback menggunakan icon Lucide kategori
  return categoryIcon || "circle";
}

// ─── Countdown Timer ─────────────────────────────────────────────
function useCountdown(targetDate: string | null) {
  const calcRemaining = () => {
    if (!targetDate) return { h: 0, m: 0, s: 0 };
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0 };
    return {
      h: Math.floor(diff / (1000 * 60 * 60)),
      m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      s: Math.floor((diff % (1000 * 60)) / 1000),
    };
  };

  const [time, setTime] = useState(calcRemaining);

  useEffect(() => {
    const t = setInterval(() => {
      setTime(calcRemaining());
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  return time;
}

// ─── Hero Banner ──────────────────────────────────────────────────
function HeroBanner() {
  return (
    <section className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 relative overflow-hidden">
      {/* Animated decorative circles */}
      <div className="absolute top-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-white/[0.04] rounded-full translate-x-1/3 -translate-y-1/3 animate-float-slow" />
      <div className="absolute bottom-0 left-1/4 w-24 sm:w-32 md:w-48 h-24 sm:h-32 md:h-48 bg-white/[0.04] rounded-full translate-y-1/2 animate-float-delayed" />
      <div className="absolute top-1/2 right-1/4 w-16 md:w-24 h-16 md:h-24 bg-emerald-500/10 rounded-full animate-float" />

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-16 flex flex-col md:flex-row items-center gap-6 md:gap-12 relative z-10">
        <div className="flex-1 text-center md:text-left animate-fade-in-up">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-emerald-200/90 text-xs sm:text-sm font-medium tracking-wide">{STORE_NAME}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3 sm:mb-4 tracking-tight">
            Solusi Produk<br />
            <span className="text-gradient-premium">Berkualitas</span>
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm md:text-base mb-5 sm:mb-6 max-w-md mx-auto md:mx-0 leading-relaxed">
            Temukan produk kecantikan & perawatan kulit premium — skincare, makeup, dan perawatan tubuh pilihan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Link
              href="/kategori/semua"
              className="relative overflow-hidden bg-white text-emerald-700 font-bold px-6 py-3 sm:py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-sm inline-flex items-center justify-center gap-2 group"
            >
              <span className="relative z-10">Belanja Sekarang</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-0.5 transition-transform duration-200" />
              {/* Shine sweep effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-emerald-100/60 to-transparent skew-x-12" />
            </Link>
            <Link
              href="/#promo"
              className="border-2 border-white/30 text-white font-semibold px-6 py-3 sm:py-3.5 rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm backdrop-blur-sm text-center"
            >
              Lihat Promo →
            </Link>
          </div>
        </div>

        <div className="flex gap-3 md:gap-4 shrink-0 animate-fade-in-up delay-200">
          {[<Droplets key="d" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />, <Sparkles key="s" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />, <Flower2 key="f" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />].map((icon, i) => (
            <div
              key={i}
              className={`bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 md:p-6 border border-white/15 shadow-xl hover:bg-white/15 transition-all duration-300 ${i === 1 ? "-translate-y-3 md:-translate-y-5" : ""}`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <span className="block mb-2 text-white/90">{icon}</span>
              <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-white/80 to-emerald-200 rounded-full transition-all duration-1000"
                  style={{ width: `${70 - i * 15}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trust Bar ────────────────────────────────────────────────────
function TrustBar() {
  const items = [
    { icon: <Truck className="w-5 h-5 text-emerald-600" />, title: "Gratis Ongkir", sub: "Min. belanja tertentu" },
    { icon: <BadgeCheck className="w-5 h-5 text-emerald-600" />, title: "Garansi Produk", sub: "100% Original" },
    { icon: <Shield className="w-5 h-5 text-emerald-600" />, title: "Pembayaran Aman", sub: "Dijamin aman" },
    { icon: <Headphones className="w-5 h-5 text-emerald-600" />, title: "Support 24/7", sub: "Siap membantu" },
  ];
  return (
    <section className="bg-white/80 backdrop-blur-sm border-b border-gray-100/60 py-4 sm:py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {items.map((item, i) => (
            <div
              key={item.title}
              className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-emerald-50/50 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center shrink-0 animate-glow-pulse border border-emerald-100/50">
                {item.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-[11px] sm:text-xs md:text-sm leading-tight">{item.title}</p>
                <p className="text-gray-400 text-[10px] sm:text-xs leading-tight mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Product Card ─────────────────────────────────────────────────
function ProductCard({
  product,
  showDiscount = false,
  stats,
}: {
  product: Product;
  showDiscount?: boolean;
  stats?: { average: number; count: number; sold: number };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [wished, setWished] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return getWishlist().includes(product.id);
  });
  const [added, setAdded] = useState(false);

  const emoji = getProductEmoji(product.slug, product.categories?.icon);
  const image = getProductImage(product);
  const finalPrice = product.discount_price ?? product.price;
  const hasDiscount = !!product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discount_price!) / product.price) * 100) : 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast("info", "Silakan masuk (login) terlebih dahulu untuk berbelanja.");
        router.push("/profil");
        return;
      }

      addToCart(
        {
          id: product.id,
          name: product.name,
          price: product.discount_price ?? product.price,
          image: image ?? undefined,
          stock: product.stock,
          slug: product.slug ?? undefined,
          originalPrice: product.discount_price ? product.price : null,
        },
        1
      );
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Link href={`/produk/${product.slug}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden card-premium group cursor-pointer">
        {/* Image area — T-47: gambar produk, fallback icon Lucide */}
        <div className="relative aspect-square bg-gradient-to-br from-emerald-50/80 via-green-50/60 to-teal-50/40 flex items-center justify-center">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- gambar produk dari storage/cdn
            <img
              src={image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <CategoryIcon name={emoji} className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-emerald-600/70 group-hover:scale-110 transition-transform duration-500" />
          )}

          {showDiscount && hasDiscount && (
            <span className="absolute top-2 left-2 animate-shimmer-glow text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg shadow-sm">
              -{discountPercent}%
            </span>
          )}

          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  toast("info", "Silakan masuk (login) terlebih dahulu untuk menambahkan wishlist.");
                  router.push("/profil");
                  return;
                }

                const nextWished = !wished;
                setWished(nextWished);
                toggleWishlist(product.id);
              } catch (err) {
                console.error(err);
              }
            }}
            className={`absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-90 ${
              wished ? "bg-gradient-to-br from-rose-500 to-red-500 text-white" : "bg-white/90 backdrop-blur-sm text-gray-400 hover:text-rose-500 hover:bg-white"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${wished ? "fill-current" : ""}`} />
          </button>

          <button
            onClick={handleAdd}
            className={`absolute bottom-2 left-2 right-2 py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${added
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md opacity-100"
                : "bg-white/90 backdrop-blur-sm text-emerald-700 border border-emerald-200/60 md:opacity-0 md:group-hover:opacity-100 opacity-100 hover:bg-emerald-50"
              }`}
          >
            {added ? "✓ Ditambahkan!" : "+ Keranjang"}
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-3.5">
          <p className="font-medium text-gray-900 text-xs sm:text-[13px] leading-snug line-clamp-2 mb-1.5">
            {product.name}
          </p>
          <div className="flex items-center gap-1 mb-1.5">
            <Star className="w-3 h-3 text-amber-400 fill-current" />
            <span className="text-[10px] sm:text-xs text-gray-500">
              {stats && stats.count > 0 ? `${stats.average} · ${stats.sold.toLocaleString("id-ID")} terjual` : "Produk Baru"}
            </span>
          </div>
          <div>
            <p className="font-bold text-emerald-700 text-sm sm:text-[15px]">
              {formatRp(finalPrice)}
            </p>
            {hasDiscount && (
              <p className="text-gray-400 text-[10px] sm:text-xs line-through">
                {formatRp(product.price)}
              </p>
            )}
          </div>
          {product.categories && (
            <span className="mt-1.5 inline-block bg-gray-50 text-gray-500 text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-gray-100">
              {product.categories.name}
            </span>
          )}
          <p className="text-gray-400 text-[10px] sm:text-xs mt-1.5 flex items-center gap-1">
            <span className="text-emerald-500"><Package className="w-3.5 h-3.5 inline-block" /></span> Gratis Ongkir
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── Section Header ───────────────────────────────────────────────
function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-5 sm:mb-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 sm:h-7 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-emerald-600 text-xs md:text-sm font-semibold hover:text-emerald-700 transition-colors duration-200 group">
          Lihat Semua <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      )}
    </div>
  );
}

interface HomeClientProps {
  categories: Category[];
  flashSaleProducts: Product[];
  bestSellerProducts: Product[];
  promoProducts: Product[];
  flashSaleEnd?: string | null;
  productStats?: Record<string, { average: number; count: number; sold: number }>;
  banners: Banner[];
  allProducts: Product[];
}

export default function HomeClient({ categories, flashSaleProducts, bestSellerProducts, promoProducts, flashSaleEnd, productStats = {}, banners = [], allProducts = [] }: HomeClientProps) {
  const { toast } = useToast();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [emailSubscribe, setEmailSubscribe] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const countdown = useCountdown(flashSaleEnd ?? null);

  const handleSubscribe = async () => {
    if (!emailSubscribe.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailSubscribe.trim())) {
      toast("error", "Masukkan alamat email yang valid.");
      return;
    }
    setSubscribeStatus("loading");
    try {
      // T-53: simpan via API server — upsert langsung dari browser ke
      // store_settings ditolak RLS (write admin-only)
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailSubscribe.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSubscribeStatus("error");
        toast("error", (data as { error?: string } | null)?.error ?? "Gagal berlangganan. Silakan coba lagi.");
        return;
      }
      setSubscribeStatus("success");
      setEmailSubscribe("");
      toast("success", "Terima kasih! Anda berhasil berlangganan newsletter kami.");
      setTimeout(() => setSubscribeStatus("idle"), 3000);
    } catch (err) {
      console.error("[Email Subscribe] Error:", err);
      setSubscribeStatus("error");
      toast("error", "Gagal berlangganan. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-slate-50 pb-20 md:pb-0">
      <Navbar />

      {/* T-67 addendum: quick-nav section unggulan (Flash Sale / Promo Terbatas / Semua Produk) */}
      <nav aria-label="Navigasi cepat" className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex gap-2 overflow-x-auto no-scrollbar">
          <a
            href="#flash-sale"
            className="flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 text-xs font-semibold hover:bg-yellow-100 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" /> Flash Sale
          </a>
          <a
            href="#promo"
            className="flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full bg-red-50 text-red-600 border border-red-100 text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" /> Promo Terbatas
          </a>
          <Link
            href="/kategori/semua"
            className="flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-100 text-xs font-semibold hover:bg-green-100 transition-colors"
          >
            <Package className="w-3.5 h-3.5" /> Semua Produk
          </Link>
        </div>
      </nav>

      <HeroBanner />

      {/* T-63: carousel banner promosi (tidak dirender bila tidak ada banner) */}
      <PromoBannerCarousel banners={banners} />

      {/* T-64: opt-in push notification (hanya user login + browser mendukung) */}
      <PushOptIn />

      <TrustBar />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-12">

        {/* Kategori Populer */}
        <section className="animate-fade-in-up">
          <SectionHeader title="Kategori Populer" subtitle="Temukan produk sesuai kebutuhanmu" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {categories.slice(0, 6).map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/kategori/${cat.slug}`}
                className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 group animate-scale-in"
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
              >
                <span className="text-emerald-600/80 group-hover:scale-110 transition-transform duration-300"><CategoryIcon name={cat.icon} className="w-7 h-7 sm:w-8 sm:h-8" /></span>
                <p className="text-[10px] sm:text-xs font-medium text-gray-700 text-center leading-tight group-hover:text-emerald-700 transition-colors duration-200">
                  {cat.name}
                </p>
                <p className="text-[9px] sm:text-xs text-gray-400 group-hover:text-emerald-500 transition-colors duration-200">Lihat detail</p>
              </Link>
            ))}
          </div>
          {categories.length > 6 && (
            <button
              onClick={() => setShowAllCategories(true)}
              className="mt-3 sm:mt-4 w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-2xl border-2 border-dashed border-emerald-300/60 text-emerald-700 font-medium text-xs sm:text-sm hover:bg-emerald-50 hover:border-emerald-400/60 transition-all duration-300 active:scale-[0.99]"
            >
              Tampilkan Semua Kategori ({categories.length})
            </button>
          )}
        </section>

        {/* All Categories Modal */}
        {showAllCategories && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowAllCategories(false)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-5 sm:p-6 z-10 animate-scale-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">Semua Kategori</h3>
                <button onClick={() => setShowAllCategories(false)} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors duration-200">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/kategori/${cat.slug}`}
                    onClick={() => setShowAllCategories(false)}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50/80 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all duration-200 active:scale-95"
                  >
                    <span className="text-emerald-600/70"><CategoryIcon name={cat.icon} className="w-7 h-7" /></span>
                    <p className="text-xs font-medium text-gray-700 text-center">{cat.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Flash Sale */}
        {flashSaleProducts.length > 0 && (
          <section id="flash-sale" className="scroll-mt-20 animate-fade-in-up delay-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md shadow-red-200/50">
                    <Zap className="w-4 h-4 text-white fill-current" />
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight">Flash Sale</h2>
                </div>
                <span className="text-gray-400 text-[10px] sm:text-xs hidden sm:block">Berakhir dalam</span>
                <div className="flex items-center gap-1">
                  {[countdown.h, countdown.m, countdown.s].map((val, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="bg-gradient-to-b from-gray-800 to-gray-900 text-white font-mono font-bold text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 py-1 rounded-lg shadow-sm">
                        {String(val).padStart(2, "0")}
                      </span>
                      {i < 2 && <span className="text-gray-400 font-bold text-xs sm:text-sm">:</span>}
                    </span>
                  ))}
                </div>
              </div>
              <Link href="/kategori/semua?sort=popular" className="flex items-center gap-1 text-red-500 text-[10px] sm:text-xs md:text-sm font-semibold hover:text-red-600 transition-colors duration-200 group">
                Lihat Semua <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
            </div>

            <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible snap-x snap-mandatory no-scrollbar">
              {flashSaleProducts.map((product) => (
                <div key={product.id} className="min-w-[140px] sm:min-w-[160px] md:min-w-0 snap-start">
                  <ProductCard product={product} showDiscount stats={productStats[product.id]} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Promo Utama */}
        {promoProducts && promoProducts.length > 0 && (
          <section id="promo" className="scroll-mt-20 animate-fade-in-up delay-300">
            <SectionHeader title="Promo Terbatas" subtitle="Diskon spesial khusus minggu ini" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
              {promoProducts.map((product) => (
                <ProductCard key={product.id} product={product} showDiscount stats={productStats[product.id]} />
              ))}
            </div>
          </section>
        )}

        {/* Best Sellers */}
        <section id="terlaris" className="scroll-mt-20 animate-fade-in-up delay-300">
          <SectionHeader title="Produk Terlaris" subtitle="Pilihan favorit ribuan pelanggan" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
            {bestSellerProducts.map((product) => (
              <ProductCard key={product.id} product={product} stats={productStats[product.id]} />
            ))}
          </div>
        </section>

        {/* T-72: Semua Produk */}
        <section id="semua-produk" className="scroll-mt-20 animate-fade-in-up delay-300">
          <SectionHeader title="Semua Produk" subtitle="Katalog lengkap — terbaru lebih dulu" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
            {allProducts.map((product) => (
              <ProductCard key={product.id} product={product} stats={productStats[product.id]} />
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/kategori/semua"
              className="inline-flex items-center gap-1.5 border-2 border-green-500 text-green-700 font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-green-50 transition-colors"
            >
              Lihat Semua →
            </Link>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="animate-fade-in-up delay-200">
          <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/[0.05] rounded-full translate-x-1/4 -translate-y-1/4 animate-float-slow" />
            <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-emerald-500/10 rounded-full -translate-x-1/4 translate-y-1/4 animate-float-delayed" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 tracking-tight">Daftar Sekarang & Dapatkan Promo!</h3>
                <p className="text-emerald-200/80 text-xs sm:text-sm">Voucher diskon 15% untuk pembelian pertamamu.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                <input
                  type="email"
                  placeholder="Masukkan emailmu..."
                  value={emailSubscribe}
                  onChange={(e) => setEmailSubscribe(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubscribe(); }}
                  className="bg-white/10 border border-white/20 text-white placeholder-emerald-300/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white/15 focus:border-white/30 w-full sm:w-56 backdrop-blur-sm transition-all duration-200"
                />
                <button
                  onClick={handleSubscribe}
                  disabled={subscribeStatus === "loading"}
                  className="relative overflow-hidden bg-white text-emerald-700 font-bold px-5 py-3 rounded-xl text-sm hover:bg-emerald-50 transition-all duration-300 whitespace-nowrap disabled:opacity-60 shadow-lg hover:shadow-xl group active:scale-95"
                >
                  <span className="relative z-10">
                    {subscribeStatus === "loading" ? "Mendaftarkan..." : subscribeStatus === "success" ? "✓ Terdaftar!" : "Daftar Gratis"}
                  </span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-emerald-100/60 to-transparent skew-x-12" />
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}
