import { NextRequest, NextResponse } from "next/server";
import { validateVoucher } from "@/lib/vouchers";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Check user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    // Rate limiting
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 10, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit." },
        {
          status: 429,
          headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" },
        }
      );
    }

    const { code, total } = await request.json();

    if (!code || total === undefined) {
      return NextResponse.json({ error: "Kode voucher dan total belanja wajib diisi." }, { status: 400 });
    }

    const result = await validateVoucher(code, total);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API POST Validate Voucher]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
