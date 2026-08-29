import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

// T-63: update & hapus banner (pola admin [id] lain).
const PLACEMENTS = ["hero", "strip"];

function cleanString(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminRole();
    const { allowed } = checkRateLimit(getRateLimitKey(request), 20, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title || title.length > 120) {
        return NextResponse.json({ error: "Judul wajib diisi (maks. 120 karakter)." }, { status: 400 });
      }
      update.title = title;
    }
    if (body.subtitle !== undefined) update.subtitle = cleanString(body.subtitle, 200);
    if (body.image_url !== undefined) {
      const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
      if (!/^https?:\/\//i.test(imageUrl)) {
        return NextResponse.json({ error: "URL gambar harus http(s)." }, { status: 400 });
      }
      update.image_url = imageUrl;
    }
    if (body.image_url_mobile !== undefined) {
      const m = typeof body.image_url_mobile === "string" ? body.image_url_mobile.trim() : "";
      update.image_url_mobile = /^https?:\/\//i.test(m) ? m : null; // T-75
    }
    if (body.link_url !== undefined) update.link_url = cleanString(body.link_url, 300);
    if (body.placement !== undefined) {
      if (!PLACEMENTS.includes(String(body.placement))) {
        return NextResponse.json({ error: "Placement tidak valid." }, { status: 400 });
      }
      update.placement = body.placement;
    }
    if (body.sort_order !== undefined) {
      const n = Number(body.sort_order);
      update.sort_order = Number.isInteger(n) && n >= 0 ? n : 0;
    }
    if (body.is_active !== undefined) update.is_active = body.is_active === true;
    if (body.starts_at !== undefined || body.ends_at !== undefined) {
      const iso = (v: unknown): string | null =>
        typeof v === "string" && v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null;
      const s = body.starts_at !== undefined ? iso(body.starts_at) : undefined;
      const e = body.ends_at !== undefined ? iso(body.ends_at) : undefined;
      if (s !== undefined) update.starts_at = s;
      if (e !== undefined) update.ends_at = e;
      if (s && e && e < s) {
        return NextResponse.json({ error: "Tanggal selesai harus setelah tanggal mulai." }, { status: 400 });
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("banners")
      .update(update)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminRole();
    const { allowed } = checkRateLimit(getRateLimitKey(request), 20, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });

    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase.from("banners").delete().eq("id", id).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Banner tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAdminError(error);
  }
}
