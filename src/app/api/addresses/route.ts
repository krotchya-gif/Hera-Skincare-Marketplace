// ─── Addresses API — List & Create ─────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 20, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("shipping_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("[API GET Addresses]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { label, name, phone, address, city, province, postal_code, is_default } = body;
    // T-54: area tujuan RajaOngkir (opsional) — dipakai untuk ongkir presisi
    const destination_area_id =
      typeof body.destination_area_id === "string" && body.destination_area_id.trim()
        ? body.destination_area_id.trim().slice(0, 100)
        : null;
    const destination_area_label =
      typeof body.destination_area_label === "string" && body.destination_area_label.trim()
        ? body.destination_area_label.trim().slice(0, 200)
        : null;

    if (!name?.trim() || !phone?.trim() || !address?.trim() || !city?.trim() || !province?.trim() || !postal_code?.trim()) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    if (phone && !/^[0-9+\-\s]{8,15}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: "Format nomor telepon tidak valid." }, { status: 400 });
    }

    // If setting as default, unset others first
    if (is_default) {
      await supabase
        .from("shipping_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { data, error } = await supabase
      .from("shipping_addresses")
      .insert({
        user_id: user.id,
        label: label || "Rumah",
        name,
        phone,
        address,
        city,
        province,
        postal_code,
        is_default: is_default ?? false,
        destination_area_id,
        destination_area_label,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API POST Address]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
