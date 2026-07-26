"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProductEmoji } from "@/components/HomeClient";
import { createClient } from "@/utils/supabase/client";
import {
  ChevronRight,
  Star,
  Heart,
  ShoppingCart,
  Truck,
  Shield,
  Minus,
  Plus,
  Share2,
  Store,
  Package,
} from "lucide-react";
import type { Product, Review } from "@/types/database";

import { formatRp } from "@/utils/format";
import { addToCart, getWishlist, toggleWishlist } from "@/lib/cart-utils";
import { useToast } from "@/components/Toast";

interface ProductDetailClientProps {
  product: Product;
  reviews: Review[];
  ratingSummary: {
    average: number;
    count: number;
    breakdown: Record<number, number>;
  };
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  reviews,
  ratingSummary,
  relatedProducts,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"deskripsi" | "spesifikasi" | "ulasan">("deskripsi");
  const [quantity, setQuantity] = useState(1);
  
  // Resolve variants
  const hasVariants = product.product_variants && product.product_variants.length > 0;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.product_variants && product.product_variants.length > 0
      ? product.product_variants[0].id
      : null
  );

  const currentVariant = useMemo(() => {
    if (!product.product_variants || product.product_variants.length === 0) return null;
    return product.product_variants.find((v) => v.id === selectedVariantId) || null;
  }, [product.product_variants, selectedVariantId]);

  const [wished, setWished] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return getWishlist().includes(product.id);
  });
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  // Images resolution
  const imageList = product.product_images && product.product_images.length > 0
    ? product.product_images.map((img) => img.url)
    : [getProductEmoji(product.slug, product.categories?.icon)];

  const maxStock = currentVariant ? currentVariant.stock : product.stock;
  const displayPrice = currentVariant ? currentVariant.price : (product.discount_price ?? product.price);
  const displayOriginalPrice = currentVariant ? null : (product.discount_price ? product.price : null);
  const hasDiscount = !currentVariant && !!product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discount_price!) / product.price) * 100) : 0;

  // Construct specs table
  const specifications = [
    { label: "SKU", value: product.sku || "-" },
    { label: "Merek / Brand", value: product.brand || "Hera Skincare" },
    { label: "Satuan", value: product.unit || "pcs" },
    { label: "Berat Bersih", value: product.weight_gram ? `${product.weight_gram} g` : "-" },
    {
      label: "Dimensi (P x L x T)",
      value: product.dimension_p
        ? `${product.dimension_p} x ${product.dimension_l} x ${product.dimension_t} cm`
        : "-",
    },
  ];

  const handleAddToCart = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast("info", "Silakan masuk (login) terlebih dahulu untuk berbelanja.");
        router.push("/profil");
        return;
      }

      const variantName = currentVariant ? currentVariant.name : null;
      const variantId = currentVariant ? currentVariant.id : null;
      const itemPrice = currentVariant ? currentVariant.price : (product.discount_price ?? product.price);

      addToCart(
        {
          id: product.id,
          name: product.name,
          price: itemPrice,
          emoji: imageList[0].startsWith("http") ? "🧴" : imageList[0],
          stock: maxStock,
          slug: product.slug ?? undefined,
          originalPrice: currentVariant ? null : (product.discount_price ? product.price : null),
        },
        quantity,
        variantName,
        variantId
      );

      setAddedToCart(true);
      toast("success", `Berhasil menambahkan ${product.name} ke keranjang.`);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-0">
      <Navbar hideBottomBar={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
          <Link href="/" className="hover:text-green-600">Beranda</Link>
          <ChevronRight className="w-4 h-4" />
          {product.categories && (
            <>
              <Link href={`/kategori/${product.categories.slug}`} className="hover:text-green-600">
                {product.categories.name}
              </Link>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* Main Product Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-8">
          {/* Left: Gallery */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 aspect-square flex items-center justify-center mb-3 relative overflow-hidden shadow-sm">
              {imageList[activeImage].startsWith("http") ? (
                <img src={imageList[activeImage]} alt={product.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-8xl md:text-9xl">{imageList[activeImage]}</span>
              )}
              {hasDiscount && (
                <span className="absolute top-4 left-4 animate-shimmer-glow text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                  -{discountPercent}%
                </span>
              )}
              <button
                onClick={async () => {
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
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${
                  wished ? "bg-red-500 text-white" : "bg-white text-gray-400 hover:text-red-500"
                }`}
              >
                <Heart className={`w-5 h-5 ${wished ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2">
              {imageList.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-2xl bg-white overflow-hidden transition-all ${
                    activeImage === i ? "border-green-500 shadow-sm" : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  {img.startsWith("http") ? (
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    img
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                <Store className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm text-green-700 font-medium">Hera Skincare Official</span>
              <span className="text-xs text-gray-400">• Jakarta Selatan</span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 leading-snug">
              {product.name}
            </h1>

            {/* Rating & reviews */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(ratingSummary.average || 4.8)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-1 font-semibold text-gray-900">{ratingSummary.average || 4.8}</span>
              </div>
              <span className="text-sm text-gray-500">
                ({ratingSummary.count} ulasan)
              </span>
              <span className="text-sm text-gray-500">10+ terjual</span>
            </div>

            {/* Price */}
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-green-700">
                  {formatRp(displayPrice)}
                </span>
                {displayOriginalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatRp(displayOriginalPrice)}
                  </span>
                )}
                {hasDiscount && (
                  <span className="animate-shimmer-glow text-white text-sm font-bold px-2 py-0.5 rounded-lg shadow-sm">
                    Hemat {discountPercent}%
                  </span>
                )}
              </div>
              <p className="text-xs text-green-600 mt-1">✓ Harga sudah termasuk PPN</p>
            </div>

            {/* Variants */}
            {hasVariants && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Pilih Varian:{" "}
                  <span className="text-green-700">{currentVariant?.name}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.product_variants!.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { setSelectedVariantId(opt.id); setQuantity(1); }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                        selectedVariantId === opt.id
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600 hover:border-green-300"
                      }`}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-4">
              <p className="text-sm font-semibold text-gray-700">Jumlah:</p>
              <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 h-10 flex items-center justify-center font-semibold text-gray-900 text-sm border-x border-gray-200">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-400">Stok: {maxStock} pcs</span>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                  addedToCart
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-green-500 text-green-700 hover:bg-green-50"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {addedToCart ? "✓ Ditambahkan!" : "+ Keranjang"}
              </button>
              <Link
                href="/checkout"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Beli Sekarang
              </Link>
            </div>

            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
              <Share2 className="w-4 h-4" /> Bagikan Produk
            </button>

            {/* Shipping info */}
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <div className="flex items-start gap-3">
                <Truck className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Pengiriman ke Jakarta</p>
                  <p className="text-xs text-gray-500">Estimasi tiba 2-5 hari kerja · Gratis Ongkir min. Rp 50.000</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Garansi Produk Original</p>
                  <p className="text-xs text-gray-500">Uang kembali jika produk tidak sesuai</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Berat: {product.weight_gram || 500}g</p>
                  <p className="text-xs text-gray-500">Dikemas dengan aman & rapi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
          <div className="flex border-b border-gray-100">
            {(["deskripsi", "spesifikasi", "ulasan"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-semibold capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? "text-green-700 border-green-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                {tab === "ulasan"
                  ? `Ulasan (${ratingSummary.count})`
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "deskripsi" && (
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                <p>{product.description || "Tidak ada deskripsi produk."}</p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: "✅", label: "100% Original" },
                    { icon: "🏭", label: "Produk Indonesia" },
                    { icon: "🔬", label: "Dermatologi Tested" },
                    { icon: "🌿", label: "Bahan Alami" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "spesifikasi" && (
              <div className="space-y-0">
                {specifications.map((spec, i) => (
                  <div
                    key={spec.label}
                    className={`flex items-start py-3 gap-4 ${
                      i < specifications.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <span className="w-36 shrink-0 text-sm text-gray-500">{spec.label}</span>
                    <span className="text-sm font-medium text-gray-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "ulasan" && (
              <div className="space-y-6">
                <div className="flex gap-8 items-center">
                  <div className="text-center shrink-0">
                    <p className="text-5xl font-bold text-gray-900">{ratingSummary.average || 4.8}</p>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(ratingSummary.average || 4.8) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{ratingSummary.count} ulasan</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = ratingSummary.breakdown[stars] ?? 0;
                      const pct = ratingSummary.count > 0 ? (count / ratingSummary.count) * 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-6 text-right">{stars}★</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">Belum ada ulasan untuk produk ini.</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center font-bold text-xs text-green-700">
                              {(review.profiles?.name || "User").charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{review.profiles?.name || "Pelanggan Hera"}</p>
                              <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString("id-ID")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Produk Serupa</h2>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
              {relatedProducts.map((p) => {
                const pEmoji = getProductEmoji(p.slug, p.categories?.icon);
                return (
                  <div key={p.id} className="min-w-[160px] md:min-w-[200px] snap-start">
                    <Link href={`/produk/${p.slug}`}>
                      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <div className="aspect-square bg-green-50 flex items-center justify-center">
                          <span className="text-4xl">{pEmoji}</span>
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">{p.name}</p>
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-500">{ratingSummary.average}</span>
                          </div>
                          <p className="text-sm font-bold text-green-700">{formatRp(p.price)}</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Mobile Sticky Product Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/60 py-2.5 px-4 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex items-center gap-3">
        {/* WhatsApp Chat Button */}
        <a
          href={`https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(product.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all duration-200"
          aria-label="Hubungi Admin via WhatsApp"
        >
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>

        {/* Add To Cart */}
        <button
          onClick={handleAddToCart}
          className={`flex-1 h-11 flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs border-2 transition-all ${
            addedToCart
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-green-500 text-green-700 active:bg-green-50/50 bg-white"
          }`}
        >
          <ShoppingCart className="w-4.5 h-4.5" />
          {addedToCart ? "✓ Sukses!" : "+ Keranjang"}
        </button>

        {/* Buy Now */}
        <button
          onClick={async () => {
            // First add to cart, then redirect to checkout
            await handleAddToCart();
            router.push("/checkout");
          }}
          className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md active:scale-95 transition-all duration-200"
        >
          Beli Sekarang
        </button>
      </div>
    </div>
  );
}
