import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

// T-06.1: Customer mengajukan pertanyaan produk (auth required)
export async function POST(request: NextRequest) {
  try {
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 10, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan masuk (login) untuk bertanya." }, { status: 401 });
    }

    const body = await request.json();
    const productId = typeof body?.product_id === "string" ? body.product_id : "";
    const question = typeof body?.question === "string" ? body.question.trim() : "";

    if (!productId || !question) {
      return NextResponse.json({ error: "Pertanyaan tidak boleh kosong." }, { status: 400 });
    }
    if (question.length > 500) {
      return NextResponse.json({ error: "Pertanyaan maksimal 500 karakter." }, { status: 400 });
    }

    // Pastikan produk ada
    const { data: product } = await supabase.from("products").select("id").eq("id", productId).single();
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    const { error } = await supabase.from("product_qna").insert({
      product_id: productId,
      user_id: user.id,
      question,
    });

    if (error) {
      console.error("[QnA Ask]", error);
      return NextResponse.json({ error: "Gagal mengirim pertanyaan." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API POST QnA]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
