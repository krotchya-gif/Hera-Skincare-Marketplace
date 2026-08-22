import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

// T-06.1: Daftar semua pertanyaan produk (untuk halaman admin ulasan/Q&A)
export async function GET(request: NextRequest) {
  try {
    await verifyAdminRole();
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 30, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_qna")
      .select(`*, products(id, name), profiles(email)`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[QnA Admin List]", error);
      return NextResponse.json({ error: "Gagal memuat pertanyaan." }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (error) {
    return handleAdminError(error);
  }
}
