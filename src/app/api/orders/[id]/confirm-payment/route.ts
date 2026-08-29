import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendOrderStatusNotification } from "@/lib/notify";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

// T-19: Customer TIDAK menandai payment_status = 'lunas' sendiri.
// Melapor "sudah bayar" via RPC -> notifikasi admin -> admin yang verifikasi.
// RPC SECURITY DEFINER memvalidasi kepemilikan order & status di sisi DB.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 5, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const { id } = await params;
    const supabase = await createClient();

    // 1. Verifikasi session user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Silakan masuk (login) terlebih dahulu." },
        { status: 401 }
      );
    }

    // 2. Validasi kepemilikan order (via SELECT dengan policy user)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (order.user_id !== user.id) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    // 3. Validasi status pembayaran
    if (order.payment_status === "lunas") {
      return NextResponse.json(
        { error: "Pembayaran pesanan ini sudah dikonfirmasi sebelumnya." },
        { status: 400 }
      );
    }

    // 4. Lapor ke admin via RPC (bukan self-mark lunas)
    const { data: reported, error: rpcError } = await supabase
      .rpc("request_payment_confirmation", { p_order_id: id });

    if (rpcError || !reported) {
      console.error("[Confirm Payment RPC]", rpcError);
      return NextResponse.json(
        { error: "Gagal melaporkan pembayaran. Silakan coba lagi." },
        { status: 500 }
      );
    }

    // 5. Notifikasi in-app ke customer (non-fatal bila gagal)
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        type: "payment",
        title: "Pembayaran Dilaporkan",
        message: `Pembayaran untuk pesanan #${order.order_number} telah dilaporkan dan sedang diverifikasi admin.`,
        link: `/profil?tab=pesanan`,
      });

    if (notifError) {
      console.warn("[Confirm Payment] Notif insert error:", notifError.message);
    }

    // 6. Email/WA ke customer (fire-and-forget — tidak memengaruhi response)
    await sendOrderStatusNotification(
      {
        order_number: order.order_number,
        user_id: order.user_id,
        status: order.status,
        tracking_number: order.tracking_number,
        shipping_address: order.shipping_address,
      },
      "paid"
    );

    return NextResponse.json({
      success: true,
      message: "Pembayaran berhasil dilaporkan. Admin akan memverifikasi pembayaran Anda.",
    });
  } catch (error) {
    console.error("[API POST Confirm Payment]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}