import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

// T-42/T-43: Perluasan SeoSettings (pola docs seo.md)
export interface SeoSettings {
  meta_pixel_id: string | null;
  ga4_measurement_id: string | null;
  // T-42: tracking tambahan
  gtm_id: string | null;
  clarity_id: string | null;
  ads_id: string | null;
  tiktok_id: string | null;
  // T-42: GEO / AI crawler
  ai_crawlers_block: string[];
  geo_lat: string | null;
  geo_lng: string | null;
  // T-43: Google API real (kredensial server-side, tidak pernah keluar)
  ga_service_account: Record<string, unknown> | null;
  tracking_ga4_property_id: string | null;
  tracking_gsc_site_url: string | null;
  default_title: string | null;
  default_description: string | null;
  default_keywords: string | null;
  robots_txt_content: string | null;
  sitemap_xml_content: string | null;
}

const DEFAULT_SEO: SeoSettings = {
  meta_pixel_id: null,
  ga4_measurement_id: null,
  gtm_id: null,
  clarity_id: null,
  ads_id: null,
  tiktok_id: null,
  ai_crawlers_block: [],
  geo_lat: null,
  geo_lng: null,
  ga_service_account: null,
  tracking_ga4_property_id: null,
  tracking_gsc_site_url: null,
  default_title: null,
  default_description: null,
  default_keywords: null,
  robots_txt_content: null,
  sitemap_xml_content: null,
};

function normalizeSeo(v: unknown): SeoSettings {
  if (!v || typeof v !== "object") return DEFAULT_SEO;
  const o = v as Record<string, unknown>;
  return {
    meta_pixel_id: typeof o.meta_pixel_id === "string" ? o.meta_pixel_id : null,
    ga4_measurement_id: typeof o.ga4_measurement_id === "string" ? o.ga4_measurement_id : null,
    gtm_id: typeof o.gtm_id === "string" ? o.gtm_id : null,
    clarity_id: typeof o.clarity_id === "string" ? o.clarity_id : null,
    ads_id: typeof o.ads_id === "string" ? o.ads_id : null,
    tiktok_id: typeof o.tiktok_id === "string" ? o.tiktok_id : null,
    ai_crawlers_block: Array.isArray(o.ai_crawlers_block)
      ? (o.ai_crawlers_block as unknown[]).filter((x): x is string => typeof x === "string")
      : [],
    geo_lat: typeof o.geo_lat === "string" ? o.geo_lat : null,
    geo_lng: typeof o.geo_lng === "string" ? o.geo_lng : null,
    ga_service_account:
      o.ga_service_account && typeof o.ga_service_account === "object"
        ? (o.ga_service_account as Record<string, unknown>)
        : null,
    tracking_ga4_property_id: typeof o.tracking_ga4_property_id === "string" ? o.tracking_ga4_property_id : null,
    tracking_gsc_site_url: typeof o.tracking_gsc_site_url === "string" ? o.tracking_gsc_site_url : null,
    default_title: typeof o.default_title === "string" ? o.default_title : null,
    default_description: typeof o.default_description === "string" ? o.default_description : null,
    default_keywords: typeof o.default_keywords === "string" ? o.default_keywords : null,
    robots_txt_content: typeof o.robots_txt_content === "string" ? o.robots_txt_content : null,
    sitemap_xml_content: typeof o.sitemap_xml_content === "string" ? o.sitemap_xml_content : null,
  };
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
    return normalizeSeo(data.value);
  } catch {
    return DEFAULT_SEO;
  }
});