import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus, getOrderById } from "@/lib/orders";
import { sendOrderStatusNotification } from "@/lib/notify";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminRole();
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 30, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    return handleAdminError(error);
  }
}

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
    const { status, tracking_number, payment_status } = await request.json();

    // T-19: Verifikasi pembayaran manual oleh admin (belum_bayar/gagal -> lunas)
    if (payment_status) {
      const supabase = await createClient();
      const allowedPaymentStatuses = ["lunas", "gagal", "belum_bayar"];
      if (!allowedPaymentStatuses.includes(payment_status)) {
        return NextResponse.json({ error: "Status pembayaran tidak valid." }, { status: 400 });
      }
      const { error: payError } = await supabase
        .from("orders")
        .update({ payment_status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (payError) {
        console.error("[Admin Orders] Payment status update error:", payError);
        return NextResponse.json({ error: "Gagal memperbarui status pembayaran." }, { status: 400 });
      }
    }

    if (status) {
      const success = await updateOrderStatus(id, status, tracking_number);
      if (!success) {
        return NextResponse.json({ error: "Gagal mengupdate pesanan" }, { status: 400 });
      }
    }

    // T-05: notifikasi customer (fire-and-forget — kegagalan tidak memengaruhi response)
    const updated = await getOrderById(id);
    if (updated) {
      await sendOrderStatusNotification({
        order_number: updated.order_number,
        user_id: updated.user_id,
        status: updated.status,
        tracking_number: updated.tracking_number,
        shipping_address: updated.shipping_address,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAdminError(error);
  }
}
