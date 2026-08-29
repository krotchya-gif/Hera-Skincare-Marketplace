// ─── Banners Data Layer — banner promosi storefront (T-63) ──────────────────
import { createClient } from "@/utils/supabase/server";
import type { Banner } from "@/types/database";

export type BannerPlacement = "hero" | "strip";

// Banner aktif + dalam window tanggal (bila diisi), urut sort_order.
// Dipakai server-side di homepage; tanpa banner → array kosong.
export async function getActiveBanners(
  placement: BannerPlacement = "hero"
): Promise<Banner[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("placement", placement)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getActiveBanners]", error);
    return [];
  }
  return (data as unknown as Banner[]) ?? [];
}
