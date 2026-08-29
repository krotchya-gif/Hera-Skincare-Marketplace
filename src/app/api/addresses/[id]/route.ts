// ─── Addresses API — Update & Delete ───────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 10, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Whitelist field yang diizinkan (cegah mass assignment)
    const allowedFields = ["label", "name", "phone", "address", "city", "province", "postal_code", "is_default", "destination_area_id", "destination_area_label"];
    const sanitizedBody: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) sanitizedBody[key] = body[key];
    }
    // T-54: area tujuan hanya boleh string bersih atau null
    for (const key of ["destination_area_id", "destination_area_label"]) {
      if (key in sanitizedBody) {
        const v = sanitizedBody[key];
        sanitizedBody[key] =
          typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null;
      }
    }

    // Validate phone format
    if (sanitizedBody.phone && !/^[0-9+\-\s]{8,15}$/.test(String(sanitizedBody.phone).replace(/\s/g, ''))) {
      return NextResponse.json({ error: "Format nomor telepon tidak valid." }, { status: 400 });
    }

    // If setting as default, unset others first
    if (sanitizedBody.is_default) {
      await supabase
        .from("shipping_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .neq("id", id);
    }

    // T-55.1: cek baris terdampak — id asing/tidak ada = 404, bukan success palsu
    const { data, error } = await supabase
      .from("shipping_addresses")
      .update({ ...sanitizedBody, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Alamat tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("[API PUT Address]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 10, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // T-55.1: cek baris terdampak — id asing/tidak ada = 404, bukan success palsu
    const { data, error } = await supabase
      .from("shipping_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Alamat tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API DELETE Address]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
