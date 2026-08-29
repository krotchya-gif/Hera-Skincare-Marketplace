import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// T-44: llms.txt — file teks untuk AI crawler (GEO/LLMO).
// Pola mengacu docs seo.md: daftar halaman utama + deskripsi bisnis.
function getBaseUrl(request: Request): string {
  // Priority 1: env var (T-58: strip trailing slash — cegah URL double slash)
  if (process.env.NEXT_PUBLIC_SITE_URL)
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) return `https://${forwarded}`;
  const host = request.headers.get("host");
  if (host) return `https://${host}`;
  return "http://localhost:3000";
}

export async function GET(request: Request) {
  const BASE_URL = getBaseUrl(request);

  let storeName = "Hera Skincare";
  let storeDesc = "Marketplace skincare & perawatan pribadi";

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "store_info")
      .single();
    const info = data?.value as { name?: string; description?: string } | null;
    if (info?.name) storeName = info.name;
    if (info?.description) storeDesc = info.description;
  } catch {
    // fallback ke default
  }

  const content = [
    `# ${storeName}`,
    "",
    `> ${storeDesc}`,
    "",
    "## Halaman utama",
    `- [Beranda](${BASE_URL})`,
    // T-56.2: /kategori (index) tidak ada — daftar kategori hanya di bawah
    `- [Tentang Kami](${BASE_URL}/tentang-kami)`,
    `- [Cara Belanja](${BASE_URL}/cara-belanja)`,
    `- [FAQ](${BASE_URL}/faq)`,
    `- [Hubungi Kami](${BASE_URL}/hubungi-kami)`,
    `- [Pengembalian Barang](${BASE_URL}/pengembalian-barang)`,
    `- [Voucher](${BASE_URL}/voucher)`,
    "",
  ].join("\n");

  return new NextResponse(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}