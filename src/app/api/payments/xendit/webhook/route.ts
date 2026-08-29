import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendOrderStatusNotification } from "@/lib/notify";

// T-02: Callback server-to-server Xendit Invoice.
// Tidak ada session user di sini -> pakai service-role client (RLS bypass).
// Idempotent: callback ulang / order sudah lunas -> 200 tanpa efek samping.

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

interface XenditInvoiceCallback {
  id?: string;
  external_id?: string;
  status?: string;
  paid_amount?: number;
  payment_method?: string;
  payment_channel?: string;
}

interface OrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  status?: string;
  tracking_number?: string | null;
  payment_status: string;
  total?: number;
  shipping_address?: { phone?: string; name?: string } | null;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi callback token (constant-time)
    const received = request.headers.get("x-callback-token") ?? "";
    const expected = process.env.XENDIT_CALLBACK_TOKEN ?? "";
    if (!expected || !received || !safeEqual(received, expected)) {
      return NextResponse.json({ error: "Invalid callback token." }, { status: 401 });
    }

    // 2. Parse payload
    const payload = (await request.json().catch(() => null)) as XenditInvoiceCallback | null;
    if (!payload?.id || !payload.status || !payload.external_id) {
      return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
    }

    // 3. Hanya event PAID yang diproses; lainnya di-ack agar tidak retry
    if (payload.status !== "PAID") {
      return NextResponse.json({ received: true, processed: false, reason: payload.status });
    }

    const supabase = createAdminClient();

    // 4. Cari order via invoice id; fallback ke order_number (external_id punya suffix timestamp)
    const { data: orderByInvoice } = await supabase
      .from("orders")
      .select("*")
      .eq("xendit_invoice_id", payload.id)
      .single();

    let order: OrderRow | null = (orderByInvoice as OrderRow | null) ?? null;
    if (!order) {
      const baseExternalId = payload.external_id.replace(/-[0-9a-z]+$/i, "");
      const { data: orderByNumber } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", baseExternalId)
        .single();
      order = (orderByNumber as OrderRow | null) ?? null;
    }

    if (!order) {
      // Acknowledge agar Xendit berhenti retry untuk order yang tak dikenal
      return NextResponse.json({ received: true, known: false });
    }

    // 5. Idempotency
    if (order.payment_status === "lunas") {
      return NextResponse.json({ received: true, idempotent: true });
    }

    // 5b. T-20: Verifikasi nominal — tolak pembayaran parsial (tidak dianggap lunas)
    const paidAmount = Number(payload.paid_amount ?? 0);
    if (paidAmount <= 0 || paidAmount < Number(order.total)) {
      console.warn(
        `[Xendit Webhook] Underpaid: invoice=${payload.id} order=${order.order_number} paid=${paidAmount} expected=${order.total}`
      );
      return NextResponse.json({ received: true, processed: false, reason: "underpaid" });
    }

    // 6. Transisi state: belum_bayar -> lunas (tanpa skip state)
    const channel = payload.payment_channel || payload.payment_method || "Xendit";
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "lunas",
        payment_method: `Xendit - ${channel}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("[Xendit Webhook] Update error:", updateError);
      // Return 500 agar Xendit retry — update belum berhasil
      return NextResponse.json({ error: "Gagal memperbarui pesanan." }, { status: 500 });
    }

    // 7. Notifikasi in-app + Email/WA customer (fire-and-forget)
    if (order.user_id) {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: order.user_id,
        type: "payment",
        title: "Pembayaran Diterima",
        message: `Pembayaran online untuk pesanan #${order.order_number} telah kami terima. Pesanan akan segera diproses.`,
        link: "/profil?tab=pesanan",
      });
      if (notifError) console.warn("[Xendit Webhook] Notif insert error:", notifError.message);
    }

    // T-40: event payment_success (fire-and-forget, service-role client)
    try {
      await supabase.from("event_logs").insert({
        event_name: "payment_success",
        label: order.order_number,
        page: "/bayar",
        value: { payment_status: "lunas", amount: Number(order.total) },
        status: "sent",
        provider: "xendit",
      });
    } catch (eventErr) {
      console.warn("[Xendit Webhook] Event log error:", eventErr);
    }

    await sendOrderStatusNotification(
      {
        order_number: order.order_number,
        user_id: order.user_id,
        status: order.status ?? "menunggu",
        tracking_number: null,
        shipping_address: order.shipping_address,
      },
      "paid"
    );

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error("[API POST Xendit Webhook]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
