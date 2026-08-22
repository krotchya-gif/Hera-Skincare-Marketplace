// ─── Customer Notifications (T-05) ──────────────────────────────────────────
// Kirim Email (Resend) & WhatsApp (Fonnte) ke customer saat status pesanan
// berubah. Murni REST via fetch — tanpa dependency tambahan.
//
// Prinsip fire-and-forget: kegagalan kirim HANYA di-log dan tidak pernah
// menggagalkan transaksi utama (kriteria T-05 no.2).
// Kredensial murni env server-side; kosong = channel no-op senyap.

import { createAdminClient } from "@/utils/supabase/admin";

export interface NotifyOrderInfo {
  order_number: string;
  user_id: string | null;
  status: string;
  tracking_number?: string | null;
  shipping_address?: { phone?: string; name?: string } | null;
}

type NotifyEvent = "status" | "paid";

interface Template {
  subject: string;
  greeting: string;
  lines: string[];
}

function buildTemplate(status: string, tracking: string | null | undefined, event: NotifyEvent): Template {
  if (event === "paid") {
    return {
      subject: "Pembayaran Diterima",
      greeting: "Terima kasih, pembayaran Anda telah kami terima.",
      lines: ["Pesanan Anda akan segera kami proses dan dikemas."],
    };
  }

  switch (status) {
    case "menunggu":
      return {
        subject: "Pesanan Diterima — Menunggu Pembayaran",
        greeting: "Pesanan Anda telah kami terima.",
        lines: ["Silakan selesaikan pembayaran agar pesanan segera diproses."],
      };
    case "diproses":
      return {
        subject: "Pembayaran Diterima — Pesanan Diproses",
        greeting: "Pembayaran Anda telah kami terima.",
        lines: ["Pesanan sedang kami kemas dan akan segera diserahkan ke kurir."],
      };
    case "dikirim":
      return {
        subject: "Pesanan Dikirim",
        greeting: "Kabar baik! Pesanan Anda telah dikirim.",
        lines: tracking ? [`Nomor resi: ${tracking}`] : [],
      };
    case "selesai":
      return {
        subject: "Pesanan Selesai — Terima Kasih!",
        greeting: "Pesanan Anda telah selesai.",
        lines: ["Jangan lupa bagikan ulasan produknya ya. Sampai jumpa di pesanan berikutnya!"],
      };
    case "dibatalkan":
      return {
        subject: "Pesanan Dibatalkan",
        greeting: "Pesanan Anda telah dibatalkan.",
        lines: ["Jika ini tidak sesuai harapan Anda, hubungi kami melalui WhatsApp."],
      };
    default:
      return {
        subject: "Status Pesanan Diperbarui",
        greeting: "Status pesanan Anda diperbarui.",
        lines: [],
      };
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // belum dikonfigurasi -> no-op senyap
  const from = process.env.RESEND_FROM_EMAIL || "Hera Skincare <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) console.warn("[Notify Email] gagal:", res.status, await res.text());
  } catch (err) {
    console.warn("[Notify Email] network error:", err);
  }
}

async function sendWhatsApp(targetPhone: string, message: string): Promise<void> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) return;
  // Normalisasi ke format internasional 62xxx
  let target = targetPhone.replace(/[^0-9]/g, "");
  if (target.startsWith("0")) target = `62${target.slice(1)}`;
  if (!target.startsWith("62")) target = `62${target}`;
  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ target, message }),
    });
    if (!res.ok) console.warn("[Notify WA] gagal:", res.status, await res.text());
  } catch (err) {
    console.warn("[Notify WA] network error:", err);
  }
}

/**
 * Kirim notifikasi status/pembayaran ke customer.
 * AMAN dipanggil dari konteks mana pun (session maupun webhook):
 * pembacaan profil memakai service-role, error apa pun ditelan & di-log.
 */
export async function sendOrderStatusNotification(
  order: NotifyOrderInfo,
  event: NotifyEvent = "status"
): Promise<void> {
  try {
    const tpl = buildTemplate(order.status, order.tracking_number, event);

    // 1. Email customer dari profiles
    let email: string | null = null;
    if (order.user_id) {
      const supabase = createAdminClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", order.user_id)
        .single();
      email = (profile as { email?: string } | null)?.email ?? null;
    }

    // 2. Nomor WA dari alamat pengiriman
    const phone = order.shipping_address?.phone ?? null;

    const textLines = [
      `Halo${order.shipping_address?.name ? ` ${order.shipping_address.name}` : ""}!`,
      "",
      tpl.greeting,
      ...tpl.lines,
      "",
      `Pesanan: #${order.order_number}`,
      "",
      "— Hera Skincare",
    ];

    await Promise.allSettled([
      email
        ? sendEmail(
            email,
            `${tpl.subject} (#${order.order_number})`,
            `<div style="font-family:sans-serif;font-size:14px;line-height:1.6">${textLines
              .map((l) => `<p>${l}</p>`)
              .join("")}</div>`
          )
        : Promise.resolve(),
      phone ? sendWhatsApp(phone, textLines.join("\n")) : Promise.resolve(),
    ]);
  } catch (err) {
    // Tidak pernah throw — notifikasi tidak boleh menggagalkan alur utama
    console.warn("[Notify] gagal mengirim notifikasi:", err);
  }
}
