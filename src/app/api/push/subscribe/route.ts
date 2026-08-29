import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push";

// T-64: langganan Web Push milik user yang login.
// GET    → kirim VAPID public key (auth)
// POST   → simpan/perbarui langganan { endpoint, keys: { p256dh, auth } }
// DELETE → hapus langganan berdasarkan endpoint (?endpoint=)

export async function GET(request: NextRequest) {
  try {
    const { allowed } = checkRateLimit(getRateLimitKey(request), 30, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!isPushConfigured()) {
      return NextResponse.json({ error: "Push notification belum tersedia." }, { status: 503 });
    }
    return NextResponse.json({ publicKey: getVapidPublicKey() });
  } catch (error) {
    console.error("[API GET Push Subscribe]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { allowed } = checkRateLimit(getRateLimitKey(request), 10, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Silakan masuk (login) terlebih dahulu." }, { status: 401 });
    if (!isPushConfigured()) {
      return NextResponse.json({ error: "Push notification belum tersedia." }, { status: 503 });
    }

    const body = await request.json().catch(() => null);
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
    const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : "";
    const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : "";
    const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

    if (!endpoint.startsWith("https://") || !p256dh || !auth) {
      return NextResponse.json({ error: "Data langganan tidak valid." }, { status: 400 });
    }

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent,
      },
      { onConflict: "endpoint" }
    );
    if (error) {
      console.error("[API POST Push Subscribe]", error);
      return NextResponse.json({ error: "Gagal menyimpan langganan." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API POST Push Subscribe]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { allowed } = checkRateLimit(getRateLimitKey(request), 10, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const endpoint = new URL(request.url).searchParams.get("endpoint") ?? "";
    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint wajib diisi." }, { status: 400 });
    }
    // RLS: user hanya bisa menghapus baris miliknya sendiri
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API DELETE Push Subscribe]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
