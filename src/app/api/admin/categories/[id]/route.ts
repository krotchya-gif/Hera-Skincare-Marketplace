import { NextRequest, NextResponse } from "next/server";
import { updateCategory, softDeleteCategory } from "@/lib/admin";
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
    const success = await updateCategory(id, body);
    if (!success) {
      return NextResponse.json({ error: "Gagal mengupdate kategori" }, { status: 400 });
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
    const success = await softDeleteCategory(id);
    if (!success) {
      return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAdminError(error);
  }
}
