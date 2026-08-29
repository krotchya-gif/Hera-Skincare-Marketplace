import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { searchDestinationAreas } from "@/lib/shipping";

// T-54: proxy pencarian area tujuan (RajaOngkir V2 / Komerce).
// API key tidak pernah sampai ke browser — semua call lewat server.
// Cukup API key env (TANPA origin_area_id) — admin perlu pencarian ini
// untuk mengisi area asal pertama kali.
export async function GET(request: NextRequest) {
  try {
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 60, 60000);
    if (!allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.RAJAONGKIR_API_KEY) {
      return NextResponse.json({ error: "Pencarian area belum tersedia." }, { status: 503 });
    }

    const search = new URL(request.url).searchParams.get("search") ?? "";
    const areas = await searchDestinationAreas(search);
    return NextResponse.json({ areas });
  } catch (error) {
    console.error("[API GET Shipping Destination]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
