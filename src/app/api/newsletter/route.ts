import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// T-53: simpan subscriber newsletter dari sisi server.
// Upsert langsung dari browser ke store_settings PASTI ditolak RLS
// (policy write admin-only) dan sebelumnya tetap ditampilkan sukses.
// Penulisan memakai service-role di server; RLS tidak dilemahkan.
// Catatan: read-modify-write tidak atomik — window race diterima utk
// traffic newsletter (dokumen di plan.md T-53).
export async function POST(request: NextRequest) {
  try {
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 10, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    // Guard env — bila service-role belum diset, jangan janjikan sukses palsu
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Newsletter belum tersedia. Silakan coba lagi nanti." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Masukkan alamat email yang valid." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: existing, error: readError } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "subscribed_emails")
      .maybeSingle();
    if (readError) {
      console.error("[Newsletter] Read error:", readError);
      return NextResponse.json(
        { error: "Gagal menyimpan langganan. Silakan coba lagi." },
        { status: 500 }
      );
    }

    const raw = (existing?.value as { emails?: unknown } | null)?.emails;
    const current: string[] = Array.isArray(raw)
      ? raw.filter((e): e is string => typeof e === "string")
      : [];

    if (current.includes(email)) {
      return NextResponse.json({ success: true, message: "Email ini sudah terdaftar." });
    }

    const { error: upsertError } = await admin
      .from("store_settings")
      .upsert(
        {
          key: "subscribed_emails",
          value: { emails: [...current, email] },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    if (upsertError) {
      console.error("[Newsletter] Upsert error:", upsertError);
      return NextResponse.json(
        { error: "Gagal menyimpan langganan. Silakan coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Terima kasih! Anda berhasil berlangganan newsletter kami.",
    });
  } catch (error) {
    console.error("[API POST Newsletter]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
