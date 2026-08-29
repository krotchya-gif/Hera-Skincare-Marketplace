"use client";

// T-64: kartu opt-in push notification di homepage — hanya tampil untuk user
// yang login & browser mendukung. Subscribe = izin notifikasi + service worker
// + POST /api/push/subscribe. Nonaktif = unsubscribe + DELETE.
import { useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/Toast";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type Mode = "loading" | "hidden" | "offering" | "subscribed";

export default function PushOptIn() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
          if (!cancelled) setMode("hidden");
          return;
        }
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setMode("hidden");
          return;
        }
        const registration = await navigator.serviceWorker.getRegistration();
        const existing = registration ? await registration.pushManager.getSubscription() : null;
        if (!cancelled) setMode(existing ? "subscribed" : "offering");
      } catch {
        if (!cancelled) setMode("hidden");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast("error", "Izin notifikasi ditolak di browser.");
        return;
      }
      const keyRes = await fetch("/api/push/subscribe");
      if (!keyRes.ok) {
        const d = await keyRes.json().catch(() => null);
        throw new Error(d?.error || "Push belum tersedia.");
      }
      const { publicKey } = (await keyRes.json()) as { publicKey: string };
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const subJson = sub.toJSON();
      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subJson),
      });
      if (!saveRes.ok) {
        const d = await saveRes.json().catch(() => null);
        throw new Error(d?.error || "Gagal menyimpan langganan.");
      }
      setMode("subscribed");
      toast("success", "Notifikasi berhasil diaktifkan!");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Gagal mengaktifkan notifikasi.");
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const sub = registration ? await registration.pushManager.getSubscription() : null;
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, { method: "DELETE" });
      }
      setMode("offering");
      toast("success", "Notifikasi dimatikan.");
    } catch {
      toast("error", "Gagal mematikan notifikasi.");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "loading" || mode === "hidden") return null;
  const subscribed = mode === "subscribed";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-2">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
          <BellRing className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Notifikasi Promo &amp; Pesanan</p>
          <p className="text-xs text-gray-500">
            {subscribed
              ? "Aktif — kamu akan menerima pemberitahuan di perangkat ini."
              : "Dapatkan kabar flash sale & update pesanan lewat notifikasi browser."}
          </p>
        </div>
        <button
          type="button"
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={busy}
          className={`shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 ${
            subscribed ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : subscribed ? "Nonaktifkan" : "Aktifkan"}
        </button>
      </div>
    </section>
  );
}
