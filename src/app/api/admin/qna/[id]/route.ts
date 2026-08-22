import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

// T-06.1: Admin/operator menjawab pertanyaan produk
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminRole();
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 30, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const { id } = await params;
    const body = await request.json();
    const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
    if (!answer) {
      return NextResponse.json({ error: "Jawaban tidak boleh kosong." }, { status: 400 });
    }

    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase
      .from("product_qna")
      .update({ answer, answered_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[QnA Answer]", error);
      return NextResponse.json({ error: "Gagal menyimpan jawaban." }, { status: 500 });
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
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.from("product_qna").delete().eq("id", id);

    if (error) {
      console.error("[QnA Delete]", error);
      return NextResponse.json({ error: "Gagal menghapus pertanyaan." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAdminError(error);
  }
}
