import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendOrderStatusNotification } from "@/lib/notify";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

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

    // 2. Ambil data order
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

    // 3. Validasi kepemilikan order
    if (order.user_id !== user.id) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    // 4. Validasi status pembayaran
    if (order.payment_status === "lunas") {
      return NextResponse.json(
        { error: "Pembayaran pesanan ini sudah dikonfirmasi sebelumnya." },
        { status: 400 }
      );
    }

    // 5. Update payment_status = "lunas"
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "lunas",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("[Confirm Payment] Update error:", updateError);
      return NextResponse.json(
        { error: "Gagal mengonfirmasi pembayaran. Silakan coba lagi." },
        { status: 500 }
      );
    }

    // 6. Trigger notifikasi
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        type: "payment",
        title: "Pembayaran Dikonfirmasi",
        message: `Pembayaran untuk pesanan #${order.order_number} telah dikonfirmasi. Pesanan akan segera diproses.`,
        link: `/profil?tab=pesanan`,
      });

    if (notifError) {
      console.warn("[Confirm Payment] Notif insert error:", notifError.message);
      // Non-fatal — notifikasi gagal, tapi konfirmasi tetap berhasil
    }

    // T-05: Email/WA ke customer (fire-and-forget — tidak memengaruhi response)
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
      message: "Pembayaran berhasil dikonfirmasi. Pesanan akan segera diproses.",
    });
  } catch (error) {
    console.error("[API POST Confirm Payment]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
