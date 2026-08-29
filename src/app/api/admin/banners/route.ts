import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

// T-63: CRUD banner promosi — GET semua (termasuk nonaktif), POST buat baru.
// Validasi mengikuti pola T-29 (tanpa nilai negatif, enum placement, panjang wajar).

interface BannerPayload {
  title?: unknown;
  subtitle?: unknown;
  image_url?: unknown;
  image_url_mobile?: unknown;
  link_url?: unknown;
  placement?: unknown;
  sort_order?: unknown;
  is_active?: unknown;
  starts_at?: unknown;
  ends_at?: unknown;
}

function sanitize(body: BannerPayload): Record<string, unknown> | { error: string } {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
  if (!title || title.length > 120) {
    return { error: "Judul wajib diisi (maks. 120 karakter)." };
  }
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    return { error: "URL gambar wajib diisi dan harus http(s)." };
  }
  const placement = body.placement === "strip" ? "strip" : "hero";
  const sortOrderRaw = Number(body.sort_order);
  const sortOrder = Number.isInteger(sortOrderRaw) && sortOrderRaw >= 0 ? sortOrderRaw : 0;

  const out: Record<string, unknown> = {
    title,
    subtitle:
      typeof body.subtitle === "string" && body.subtitle.trim()
        ? body.subtitle.trim().slice(0, 200)
        : null,
    image_url: imageUrl,
    // T-75: layout mobile opsional — kosong = fallback gambar desktop
    image_url_mobile:
      typeof body.image_url_mobile === "string" && /^https?:\/\//i.test(body.image_url_mobile.trim())
        ? body.image_url_mobile.trim()
        : null,
    link_url:
      typeof body.link_url === "string" && body.link_url.trim()
        ? body.link_url.trim().slice(0, 300)
        : null,
    placement,
    sort_order: sortOrder,
    is_active: body.is_active !== false,
  };

  const iso = (v: unknown): string | null =>
    typeof v === "string" && v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null;
  const startsAt = iso(body.starts_at);
  const endsAt = iso(body.ends_at);
  if (startsAt && endsAt && endsAt < startsAt) {
    return { error: "Tanggal selesai harus setelah tanggal mulai." };
  }
  out.starts_at = startsAt;
  out.ends_at = endsAt;
  return out;
}

export async function GET(request: NextRequest) {
  try {
    await verifyAdminRole();
    const { allowed } = checkRateLimit(getRateLimitKey(request), 30, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdminRole();
    const { allowed } = checkRateLimit(getRateLimitKey(request), 20, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });

    const body = (await request.json()) as BannerPayload;
    const clean = sanitize(body);
    if ("error" in clean) {
      return NextResponse.json({ error: clean.error }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("banners")
      .insert({ ...clean, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return handleAdminError(error);
  }
}
