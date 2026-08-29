import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { getAnalyticsStats } from "@/lib/google-analytics";

// T-43: Angka real GA4 + Search Console (server-side, readonly, cached).
// Kredensial service account TIDAK PERNAH keluar ke browser.
export async function GET(request: NextRequest) {
  try {
    await verifyAdminRole();
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 15, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const supabase = await createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "seo")
      .single();

    const seoValue = data?.value as Record<string, unknown> | null;

    const stats = await getAnalyticsStats({
      ga_service_account: (seoValue?.ga_service_account as Record<string, unknown> | null) ?? null,
      tracking_ga4_property_id: typeof seoValue?.tracking_ga4_property_id === "string" ? seoValue.tracking_ga4_property_id : null,
      tracking_gsc_site_url: typeof seoValue?.tracking_gsc_site_url === "string" ? seoValue.tracking_gsc_site_url : null,
    });

    return NextResponse.json(stats);
  } catch (error) {
    return handleAdminError(error);
  }
}