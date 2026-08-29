import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

// T-40: Event Monitor — daftar event terakhir + retry (pola docs seo.md)

export async function GET(request: NextRequest) {
  try {
    await verifyAdminRole();
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 30, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100"), 1), 500);

    const supabase = await createClient();
    let query = supabase
      .from("event_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && ["sent", "pending", "failed"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[Admin Events]", error);
      return NextResponse.json({ error: "Gagal memuat event." }, { status: 400 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    return handleAdminError(error);
  }
}

// Retry event: ubah status failed/pending -> sent
export async function PATCH(request: NextRequest) {
  try {
    await verifyAdminRole();
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 20, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const body = await request.json();
    const { id } = body;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID event wajib diisi." }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("event_logs")
      .update({ status: "sent" })
      .eq("id", id);

    if (error) {
      console.error("[Admin Events Retry]", error);
      return NextResponse.json({ error: "Gagal mengubah status event." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAdminError(error);
  }
}