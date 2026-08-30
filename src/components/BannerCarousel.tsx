"use client";

// T-78: carousel banner generik (refactor PromoBannerCarousel T-63).
// Dipakai 2× di homepage: placement "hero" (atas, 16:5/4:3) &
// "strip" (bawah, 11:2/2:1). Rasio frame DIKUNCI aspect-ratio agar
// catatan ukuran di admin = patokan presisi (tidak kepotong/peyang).
// Tanpa banner → tidak dirender (zero impact). Auto-rotate tiap 5 detik.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/types/database";
import { optimizeImageUrl, BANNER_HERO, BANNER_STRIP } from "@/lib/image";

export type BannerPlacement = "hero" | "strip";

// Rasio frame per posisi — WAJIB sinkron dengan catatan ukuran di
// BannerManager.tsx (Hero: 1600×500/16:5 & 800×600/4:3; Promo:
// 1600×290/11:2 & 800×400/2:1). T-79: promo diturunkan dari 16:5 → 11:2
// agar ramping seperti iklan (produk baru dll) & tidak "ketumpuk" dgn hero.
const RATIOS: Record<BannerPlacement, { mobile: string; desktop: string }> = {
  hero: { mobile: "aspect-[4/3]", desktop: "sm:aspect-[16/5]" },
  strip: { mobile: "aspect-[2/1]", desktop: "sm:aspect-[11/2]" },
};

export default function BannerCarousel({
  banners,
  placement,
}: {
  banners: Banner[];
  placement: BannerPlacement;
}) {
  const [index, setIndex] = useState(0);
  const count = banners.length;
  const ratio = RATIOS[placement];
  const size = placement === "hero" ? BANNER_HERO : BANNER_STRIP;

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;
  const banner = banners[Math.min(index, count - 1)];

  const content = (
    <>
      {/* T-75: dua layout — mobile (<640px) memakai gambar mobile bila ada,
          desktop (≥640px) memakai gambar desktop */}
      {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari storage/cdn */}
      <img
        src={optimizeImageUrl(banner.image_url_mobile || banner.image_url, size.mobile) ?? undefined}
        alt={banner.title}
        className={`w-full ${ratio.mobile} object-cover sm:hidden`}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- gambar dari storage/cdn */}
      <img
        src={optimizeImageUrl(banner.image_url, size.desktop) ?? undefined}
        alt={banner.title}
        className={`w-full ${ratio.desktop} object-cover hidden sm:block`}
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="text-base sm:text-lg font-bold drop-shadow">{banner.title}</h3>
        {banner.subtitle && <p className="text-xs sm:text-sm opacity-90 drop-shadow">{banner.subtitle}</p>}
      </div>
    </>
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-5" aria-label={placement === "hero" ? "Banner hero" : "Banner promosi"}>
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        {banner.link_url ? (
          banner.link_url.startsWith("/") ? (
            <Link href={banner.link_url} className="block relative">
              {content}
            </Link>
          ) : (
            <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block relative">
              {content}
            </a>
          )
        ) : (
          <div className="relative">{content}</div>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Banner sebelumnya"
              onClick={() => setIndex((i) => (i - 1 + count) % count)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 text-white flex items-center justify-center hover:bg-black/55 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Banner berikutnya"
              onClick={() => setIndex((i) => (i + 1) % count)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 text-white flex items-center justify-center hover:bg-black/55 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 right-3 flex gap-1.5">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Banner ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/45"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}