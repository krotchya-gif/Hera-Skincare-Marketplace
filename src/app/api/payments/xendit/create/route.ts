import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

// T-02: Buat / pakai-ulang Xendit Invoice untuk satu order milik user yang login.
// Amount SELALU dari DB (orders.total) — angka dari client tidak pernah dipercaya.
export async function POST(request: NextRequest) {
  try {
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 10, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi." },
        { status: 429 }
      );
    }

    // 1. Guard konfigurasi — transfer manual tetap jalan bila env kosong
    // T-51: service-role key juga wajib (langkah 7 menulis via admin client)
    const secret = process.env.XENDIT_SECRET_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret || !serviceKey) {
      return NextResponse.json(
        { error: "Pembayaran online belum tersedia. Silakan gunakan transfer manual." },
        { status: 503 }
      );
    }

    // 2. Validasi payload
    const body = await request.json().catch(() => null);
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";
    if (!orderId) {
      return NextResponse.json({ error: "orderId wajib diisi." }, { status: 400 });
    }

    // 3. Session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Silakan masuk (login) terlebih dahulu." },
        { status: 401 }
      );
    }

    // 4. Order + kepemilikan + guard status
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order || order.user_id !== user.id) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }
    if (order.status !== "menunggu") {
      return NextResponse.json(
        { error: "Pesanan ini sudah diproses dan tidak dapat dibayar ulang." },
        { status: 400 }
      );
    }
    if (order.payment_status === "lunas") {
      return NextResponse.json({ error: "Pesanan ini sudah lunas." }, { status: 400 });
    }

    // 5. Reuse invoice yang belum terbayar (idempotent dari sisi user)
    if (order.xendit_invoice_url && order.xendit_invoice_id) {
      return NextResponse.json({
        invoiceUrl: order.xendit_invoice_url,
        reused: true,
      });
    }

    // 6. Buat invoice Xendit
    const externalId = `${order.order_number}-${Date.now()}`;
    let res: Response;
    try {
      res = await fetch("https://api.xendit.co/v2/invoices", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          external_id: externalId,
          amount: Math.round(Number(order.total)),
          currency: "IDR",
          description: `Pembayaran pesanan #${order.order_number} - Hera Skincare`,
          ...(user.email ? { payer_email: user.email } : {}),
          invoice_duration: 86400,
        }),
      });
    } catch (err) {
      console.error("[Xendit Create] Network error:", err);
      return NextResponse.json(
        { error: "Gagal menghubungi penyedia pembayaran. Silakan coba lagi." },
        { status: 502 }
      );
    }

    if (!res.ok) {
      console.error("[Xendit Create] API error:", res.status, await res.text());
      return NextResponse.json(
        { error: "Gagal membuat tagihan pembayaran. Silakan coba lagi." },
        { status: 502 }
      );
    }

    const invoice = (await res.json()) as { id?: string; invoice_url?: string };
    if (!invoice.id || !invoice.invoice_url) {
      console.error("[Xendit Create] Respon tidak lengkap:", JSON.stringify(invoice));
      return NextResponse.json(
        { error: "Respon tidak valid dari penyedia pembayaran." },
        { status: 502 }
      );
    }

    // 7. Simpan referensi invoice ke order
    // T-51: policy UPDATE orders = admin-only (by design) — tulis referensi
    // invoice via service-role; kepemilikan order sudah diverifikasi langkah 4.
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from("orders")
      .update({
        xendit_invoice_id: invoice.id,
        xendit_invoice_url: invoice.invoice_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("[Xendit Create] Update error:", updateError);
      // T-17: Batalkan invoice di Xendit agar tidak menjadi invoice yatim yang bisa dibayar
      try {
        await fetch(`https://api.xendit.co/v2/invoices/${invoice.id}/expire`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
            "Content-Type": "application/json",
          },
        });
      } catch (expireErr) {
        console.error("[Xendit Create] Gagal expire invoice yatim:", expireErr);
      }
      return NextResponse.json(
        { error: "Tagihan dibuat namun gagal disimpan. Silakan coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoiceUrl: invoice.invoice_url });
  } catch (error) {
    console.error("[API POST Xendit Create]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
