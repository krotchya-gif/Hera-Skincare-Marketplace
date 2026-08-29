// ─── Event Tracking Helper (T-40, pola docs seo.md) ─────────────────────────
// Non-blocking: kegagalan tidak pernah memengaruhi alur utama.
// Dipanggil dari halaman publik (client) — INSERT via RLS anon.
import { createClient } from "@/utils/supabase/client";

export type TrackableEvent =
  | "view_product"
  | "add_to_cart"
  | "checkout_start"
  | "order_created"
  | "payment_success";

const EVENT_LABELS: Record<TrackableEvent, string> = {
  view_product: "Lihat Produk",
  add_to_cart: "Tambah ke Keranjang",
  checkout_start: "Mulai Checkout",
  order_created: "Pesanan Dibuat",
  payment_success: "Pembayaran Sukses",
};

export function getEventLabel(name: string): string {
  return EVENT_LABELS[name as TrackableEvent] ?? name;
}

/**
 * Catat event marketing (fire-and-forget).
 * @param eventName nama event (lihat TrackableEvent)
 * @param label label opsional (produk/nomor order, dll.)
 * @param value data tambahan opsional (JSON)
 */
export async function trackEvent(
  eventName: TrackableEvent | string,
  label?: string,
  value?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("event_logs").insert({
      event_name: eventName,
      label: label ?? null,
      page: typeof window !== "undefined" ? window.location.pathname : null,
      value: value ?? null,
      status: "sent",
      provider: "internal",
    });
  } catch (err) {
    // Non-blocking — jangan pernah menggagalkan alur utama
    console.warn("[trackEvent]", err);
  }
}