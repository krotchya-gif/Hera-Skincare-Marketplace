import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

// T-41: UTM report — kunjungan (utm_visits) + order conversion per source
export async function GET(request: NextRequest) {
  try {
    await verifyAdminRole();
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 30, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "200"), 1), 1000);

    const supabase = await createClient();

    const [{ data: visits }, { data: orders }] = await Promise.all([
      supabase
        .from("utm_visits")
        .select("utm_source, utm_medium, utm_campaign, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("orders")
        .select("utm_source, total, payment_status")
        .not("utm_source", "is", null),
    ]);

    // Agregasi kunjungan per source
    const visitBySource: Record<string, { visits: number }> = {};
    for (const v of (visits ?? []) as { utm_source: string | null }[]) {
      const source = v.utm_source || "langsung";
      if (!visitBySource[source]) visitBySource[source] = { visits: 0 };
      visitBySource[source].visits += 1;
    }

    // Agregasi order per source (hanya lunas untuk revenue)
    const orderBySource: Record<string, { orders: number; revenue: number }> = {};
    for (const o of (orders ?? []) as { utm_source: string; total: number; payment_status: string }[]) {
      const source = o.utm_source || "langsung";
      if (!orderBySource[source]) orderBySource[source] = { orders: 0, revenue: 0 };
      orderBySource[source].orders += 1;
      if (o.payment_status === "lunas") {
        orderBySource[source].revenue += Number(o.total) || 0;
      }
    }

    const sources = new Set([...Object.keys(visitBySource), ...Object.keys(orderBySource)]);
    const rows = [...sources]
      .map((source) => ({
        source,
        visits: visitBySource[source]?.visits ?? 0,
        orders: orderBySource[source]?.orders ?? 0,
        revenue: orderBySource[source]?.revenue ?? 0,
      }))
      .sort((a, b) => b.visits - a.visits);

    return NextResponse.json({ visits: rows });
  } catch (error) {
    return handleAdminError(error);
  }
}