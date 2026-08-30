// T-88: Optimasi gambar via Supabase Image Transformation (render/image).
// URL storage `object/public/...` dikonversi ke `render/image/public/...`
// dengan resize + WebP on-the-fly (cache CDN Supabase). URL non-storage
// (picsum/eksternal) dikembalikan apa adanya.

const STORAGE_OBJECT_RE = /^(.+?)\/storage\/v1\/object\/public\/(.+)$/;

export interface ImageOpts {
  width: number;
  height?: number;
  resize?: "cover" | "contain";
  quality?: number;
}

export function optimizeImageUrl(
  url: string | null | undefined,
  opts: ImageOpts
): string | null {
  if (!url) return null;
  const m = url.match(STORAGE_OBJECT_RE);
  if (!m) return url;
  const params = new URLSearchParams();
  params.set("width", String(opts.width));
  if (opts.height) params.set("height", String(opts.height));
  if (opts.resize) params.set("resize", opts.resize);
  params.set("format", "webp");
  params.set("quality", String(opts.quality ?? 80));
  return `${m[1]}/storage/v1/render/image/public/${m[2].split("?")[0]}?${params.toString()}`;
}

// Ukuran frame aktual di layar (container max-w-7xl = 1232px konten):
// BannerCarousel hero = 16:5 desktop / 4:3 mobile; strip = 11:2 / 2:1.
export const BANNER_HERO = {
  desktop: { width: 1232, height: 385, resize: "cover" } as ImageOpts,
  mobile: { width: 800, height: 600, resize: "cover" } as ImageOpts,
};

export const BANNER_STRIP = {
  desktop: { width: 1232, height: 224, resize: "cover" } as ImageOpts,
  mobile: { width: 700, height: 350, resize: "cover" } as ImageOpts,
};

// Cover artikel blog (tampil 96–128px di layar) — 2x retina cukup.
export const BLOG_COVER: ImageOpts = { width: 480 };