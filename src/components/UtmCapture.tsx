"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { captureUtmFromUrl } from "@/lib/utm";

// T-41: Capture UTM dari URL (sekali per kunjungan pertama dengan ?utm_source=)
// 1. Simpan ke localStorage (dipakai saat checkout → orders.utm_source)
// 2. Catat ke tabel utm_visits (anon insert, RLS) — fire-and-forget
export default function UtmCapture() {
  useEffect(() => {
    try {
      const utm = captureUtmFromUrl();
      if (!utm.utm_source) return;

      const supabase = createClient();
      const sessionId =
        typeof window !== "undefined" ? (window.localStorage.getItem("hera_session") || "") : "";

      supabase
        .from("utm_visits")
        .insert({
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium ?? null,
          utm_campaign: utm.utm_campaign ?? null,
          landing_url: typeof window !== "undefined" ? window.location.pathname + window.location.search : null,
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
          session_id: sessionId || null,
        })
        .then(({ error }) => {
          if (error) console.warn("[UtmCapture]", error.message);
        });
    } catch (err) {
      console.warn("[UtmCapture]", err);
    }
  }, []);

  return null;
}