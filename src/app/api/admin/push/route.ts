import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { isPushConfigured, sendPushToAll } from "@/lib/push";

// T-64: broadcast push notification dari admin.
// GET  → jumlah langganan aktif
// POST → kirim { title, body, url } ke semua langganan (prune otomatis)

export async function GET(request: NextRequest) {
  try {
    await verifyAdminRole();
    const { allowed } = checkRateLimit(getRateLimitKey(request), 30, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });

    const supabase = await createClient();
    const { count, error } = await supabase
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({ configured: isPushConfigured(), subscribers: count ?? 0 });
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdminRole();
    const { allowed } = checkRateLimit(getRateLimitKey(request), 5, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });

    // sama seperti settings PUT: hanya super_admin/admin boleh broadcast
    const supabase = await createClient();
    const { userId: adminUserId } = await verifyAdminRole();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", adminUserId)
      .single();
    if (!profile || !["super_admin", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden. Hanya admin yang dapat mengirim push." }, { status: 403 });
    }

    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: "Push notification belum dikonfigurasi (env VAPID kosong)." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.body === "string" ? body.body.trim() : "";
    const url = typeof body.url === "string" && body.url.trim() ? body.url.trim() : "/";

    if (!title || title.length > 100) {
      return NextResponse.json({ error: "Judul wajib diisi (maks. 100 karakter)." }, { status: 400 });
    }
    if (!message || message.length > 300) {
      return NextResponse.json({ error: "Isi pesan wajib diisi (maks. 300 karakter)." }, { status: 400 });
    }
    if (!url.startsWith("/") && !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Link harus path internal (/...) atau URL http(s)." }, { status: 400 });
    }

    const result = await sendPushToAll(title, message, url);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "PUSH_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Push notification belum dikonfigurasi." }, { status: 503 });
    }
    return handleAdminError(error);
  }
}
