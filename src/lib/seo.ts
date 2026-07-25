import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

export interface SeoSettings {
  meta_pixel_id: string | null;
  ga4_measurement_id: string | null;
  default_title: string | null;
  default_description: string | null;
  default_keywords: string | null;
  robots_txt_content: string | null;
  sitemap_xml_content: string | null;
}

const DEFAULT_SEO: SeoSettings = {
  meta_pixel_id: null,
  ga4_measurement_id: null,
  default_title: null,
  default_description: null,
  default_keywords: null,
  robots_txt_content: null,
  sitemap_xml_content: null,
};

function isSeoSettings(v: unknown): v is SeoSettings {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.meta_pixel_id === "string" || o.meta_pixel_id === null;
}

export const getSeoSettings = cache(async (): Promise<SeoSettings> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "seo")
      .single();

    if (!data?.value) return DEFAULT_SEO;

    if (isSeoSettings(data.value)) return data.value;
    return DEFAULT_SEO;
  } catch {
    return DEFAULT_SEO;
  }
});
