import { NextRequest, NextResponse } from "next/server";
import { updateFlashSale, deleteFlashSale } from "@/lib/admin";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminRole();
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 20, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });
    const { id } = await params;
    const body = await request.json();

    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json({ error: "Nama event wajib diisi." }, { status: 400 });
    }
    if (!body.starts_at || !body.ends_at) {
      return NextResponse.json({ error: "Waktu mulai dan berakhir wajib diisi." }, { status: 400 });
    }
    const start = new Date(body.starts_at);
    const end = new Date(body.ends_at);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Format waktu tidak valid." }, { status: 400 });
    }
    if (end <= start) {
      return NextResponse.json({ error: "Waktu berakhir harus setelah waktu mulai." }, { status: 400 });
    }
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: "Minimal satu produk wajib dipilih." }, { status: 400 });
    }

    const result = await updateFlashSale(id, {
      name: body.name.trim(),
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      banner_url: typeof body.banner_url === "string" && body.banner_url.trim() !== "" ? body.banner_url.trim() : null,
      items: body.items,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
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
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 20, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });
    const { id } = await params;
    const success = await deleteFlashSale(id);
    if (!success) {
      return NextResponse.json({ error: "Gagal menghapus flash sale" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAdminError(error);
  }
}
