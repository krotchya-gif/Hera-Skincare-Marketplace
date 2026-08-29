import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

// T-71: gambar latar hero beranda — settings key `hero` di store_settings
// (diisi via Admin → Pengaturan → Informasi Toko). Kosong = gradient bawaan.
// SELECT store_settings publik (policy "Settings publicly readable"); URL di luar
// http(s) dianggap tidak ada agar key rusak tidak merusak render.
export interface HeroSettings {
  image_url: string | null;
}

export const getHeroSettings = cache(async (): Promise<HeroSettings> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "hero")
    .maybeSingle();

  const v = data?.value as Record<string, unknown> | null;
  const url =
    typeof v?.image_url === "string" && /^https?:\/\//i.test(v.image_url)
      ? v.image_url
      : null;
  return { image_url: url };
});
