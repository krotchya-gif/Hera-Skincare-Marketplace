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
    const allowedFields = ["label", "name", "phone", "address", "city", "province", "postal_code", "is_default"];
    const sanitizedBody: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) sanitizedBody[key] = body[key];
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

    const { error } = await supabase
      .from("shipping_addresses")
      .update({ ...sanitizedBody, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
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

    const { error } = await supabase
      .from("shipping_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API DELETE Address]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
