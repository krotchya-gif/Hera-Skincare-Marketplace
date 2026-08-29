// ─── Push Notification Layer — Web Push VAPID (T-64) ─────────────────────────
// Server-side only. Env wajib: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT (mailto:/https:). Kosong = fitur 503 graceful (pola Xendit).
import webpush from "web-push";
import { createAdminClient } from "@/utils/supabase/admin";

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  );
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY || "";
}

let configured = false;

function ensureWebPush(): boolean {
  if (!isPushConfigured()) return false;
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT as string,
      process.env.VAPID_PUBLIC_KEY as string,
      process.env.VAPID_PRIVATE_KEY as string
    );
    configured = true;
  }
  return true;
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Kirim broadcast ke semua langganan; langganan mati (404/410) di-prune.
// Prune memakai service-role (tabel RLS user-own; prune adalah tugas server).
export async function sendPushToAll(
  title: string,
  body: string,
  url: string
): Promise<{ sent: number; failed: number; pruned: number }> {
  if (!ensureWebPush()) {
    throw new Error("PUSH_NOT_CONFIGURED");
  }
  const admin = createAdminClient();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");
  if (error) throw error;

  let sent = 0;
  let failed = 0;
  let pruned = 0;
  const payload = JSON.stringify({ title, body, url });

  for (const row of (subs ?? []) as PushSubscriptionRow[]) {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        payload
      );
      sent += 1;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        // langganan kedaluwarsa — bersihkan
        await admin.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
        pruned += 1;
      } else {
        failed += 1;
      }
    }
  }
  return { sent, failed, pruned };
}
