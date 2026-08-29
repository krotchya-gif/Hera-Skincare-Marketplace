import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

// T-63: toggle aktif/nonaktif banner (pola toggle flash-sales — wajib boolean)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminRole();
    const { allowed } = checkRateLimit(getRateLimitKey(request), 20, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });

    const { id } = await params;
    const body = await request.json();
    if (typeof body.is_active !== "boolean") {
      return NextResponse.json({ error: "is_active harus boolean." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("banners")
      .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Banner tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json(data[0]);
  } catch (error) {
    return handleAdminError(error);
  }
}
