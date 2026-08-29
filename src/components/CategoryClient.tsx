"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/components/Toast";
import { getProductEmoji } from "@/components/HomeClient";
import { createClient } from "@/utils/supabase/client";
import { addToCart, getWishlist, toggleWishlist } from "@/lib/cart-utils";
import {
  ChevronRight,
  Heart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { Category, Product, PaginatedResult } from "@/types/database";

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga: Rendah ke Tinggi" },
  { value: "price_desc", label: "Harga: Tinggi ke Rendah" },
];


function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { toast } = useToast();
  const [wished, setWished] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return getWishlist().includes(product.id);
  });
  const [added, setAdded] = useState(false);

  const emoji = getProductEmoji(product.slug, product.categories?.icon);
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
          emoji: emoji,
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

  const handleWishlist = async (e: React.MouseEvent) => {
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
  };

  return (
    <Link href={`/produk/${product.slug}`} className="block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer">
        <div className="relative aspect-square bg-green-50 flex items-center justify-center">
          <span className="text-5xl md:text-6xl">{emoji}</span>

          {hasDiscount && (
            <span className="absolute top-2 left-2 animate-shimmer-glow text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discountPercent}%
            </span>
          )}

          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all ${
              wished ? "bg-red-500 text-white" : "bg-white text-gray-400 hover:text-red-500"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${wished ? "fill-current" : ""}`} />
          </button>

          <button
            onClick={handleAdd}
            className={`absolute bottom-2 left-2 right-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              added
                ? "bg-green-600 text-white opacity-100"
                : "bg-white text-green-700 border border-green-200 md:opacity-0 md:group-hover:opacity-100 opacity-100"
            }`}
          >
            {added ? "✓ Ditambahkan!" : "+ Keranjang"}
          </button>
        </div>

        <div className="p-3">
          <p className="font-medium text-gray-900 text-xs leading-snug line-clamp-2 mb-1">
            {product.name}
          </p>
          <div className="flex items-center gap-1 mb-1.5">
            {hasDiscount && <span className="text-xs text-red-500 font-semibold">-{discountPercent}%</span>}
          </div>
          <div>
            <p className="font-bold text-green-700 text-sm">Rp {finalPrice.toLocaleString("id-ID")}</p>
            {hasDiscount && (
              <p className="text-gray-400 text-xs line-through">
                Rp {product.price.toLocaleString("id-ID")}
              </p>
            )}
          </div>
          <p className="text-gray-400 text-xs mt-1">📍 Jakarta Selatan</p>
          <p className="text-gray-400 text-xs">📦 Gratis Ongkir</p>
        </div>
      </div>
    </Link>
  );
}

interface CategoryClientProps {
  category: Category;
  initialResult: PaginatedResult<Product>;
  slug: string;
  searchQuery?: string;
  subcategories: Category[];
}

export default function CategoryClient({ category, initialResult, slug, searchQuery: initialSearch = "", subcategories }: CategoryClientProps) {
  const description = "Semua produk terbaik untuk kesegaran harianmu.";
  const subCategories = subcategories || [];

  const [products, setProducts] = useState<Product[]>(initialResult.data);
  const [totalCount, setTotalCount] = useState(initialResult.count);
  const [totalPages, setTotalPages] = useState(initialResult.totalPages);

  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const searchTerm = initialSearch;
  const [sortBy, setSortBy] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);

  const fetchFilteredProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        categorySlug: slug,
        sort: sortBy,
        page: page.toString(),
        pageSize: "8",
        ...(priceMin && { minPrice: priceMin }),
        ...(priceMax && { maxPrice: priceMax }),
        ...(searchTerm && { search: searchTerm }),
        // T-32: subCategory didukung API — filter tepat ke subkategori
        ...(selectedSub && { subCategory: selectedSub }),
      });

      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const result: PaginatedResult<Product> = await res.json();
        setProducts(result.data);
        setTotalCount(result.count);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch filtered products", error);
    }
  }, [selectedSub, slug, sortBy, page, priceMin, priceMax, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilteredProducts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchFilteredProducts]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600 transition-colors">Beranda</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 md:p-8 text-white mb-6 flex items-center gap-6">
          <span className="text-5xl md:text-6xl">{category.icon || "📦"}</span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{category.name}</h1>
            <p className="text-green-100 text-sm max-w-lg">{description}</p>
            <p className="text-green-200 text-xs mt-2">{totalCount} produk tersedia</p>
          </div>
        </div>

        {/* Sub-category chips */}
        {subCategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
            <button
              onClick={() => { setSelectedSub(null); setPage(1); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedSub
                  ? "bg-green-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-green-400"
              }`}
            >
              Semua
            </button>
            {subCategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => { setSelectedSub(sub.slug === selectedSub ? null : sub.slug); setPage(1); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedSub === sub.slug
                    ? "bg-green-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-green-400"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar Filter — desktop */}
          <aside className="hidden lg:block w-60 shrink-0 space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Filter
              </h3>

              {/* Sort */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Urutkan</p>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Rentang Harga</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => { setPriceMin(e.target.value); setPage(1); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                  />
                  <input
                    type="number"
                    placeholder="Maks"
                    value={priceMax}
                    onChange={(e) => { setPriceMax(e.target.value); setPage(1); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                  />
                </div>
              </div>

              <button
                onClick={() => { setPriceMin(""); setPriceMax(""); setSortBy("newest"); setPage(1); }}
                className="w-full text-sm text-gray-500 hover:text-red-500 transition-colors text-center"
              >
                Reset Filter
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{totalCount}</span> produk ditemukan
              </p>
              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <button
                  onClick={() => setShowFilter(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-green-400"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Filter
                </button>
                {/* Desktop sort */}
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-sm text-gray-500">Urutkan:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400"
                  >
                    {sortOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {products.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <span className="text-5xl block mb-3">🔍</span>
                <p className="text-gray-900 font-semibold mb-1">Produk tidak ditemukan</p>
                <p className="text-gray-500 text-sm">Coba ubah filter pencarian Anda</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-green-400 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Sebelumnya
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === i + 1
                        ? "bg-green-600 text-white"
                        : "border border-gray-200 text-gray-600 hover:border-green-400"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-green-400 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Selanjutnya →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilter(false)} />
          <div className="relative ml-auto w-80 h-full bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Filter Produk</h3>
              <button onClick={() => setShowFilter(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-5">
              {/* Sort */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Urutkan</p>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {/* Price */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Rentang Harga</p>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={priceMin} onChange={(e) => { setPriceMin(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <input type="number" placeholder="Maks" value={priceMax} onChange={(e) => { setPriceMax(e.target.value); setPage(1); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <button
                onClick={() => { setShowFilter(false); }}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-sm"
              >
                Terapkan Filter
              </button>
              <button
                onClick={() => { setPriceMin(""); setPriceMax(""); setSortBy("newest"); setShowFilter(false); setPage(1); }}
                className="w-full text-sm text-gray-500 hover:text-red-500 text-center"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
