// ─── UTM Campaign Helper (T-41, pola docs seo.md) ───────────────────────────
// Client-side: capture ?utm_* ke localStorage, kirim saat checkout.

const UTM_KEY = "hera_utm";

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

/** Baca UTM dari URL saat ini (sekali, lalu simpan). */
export function captureUtmFromUrl(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: UtmParams = {};
    const source = params.get("utm_source");
    const medium = params.get("utm_medium");
    const campaign = params.get("utm_campaign");
    if (source) {
      utm.utm_source = source;
      if (medium) utm.utm_medium = medium;
      if (campaign) utm.utm_campaign = campaign;
      localStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
    return utm;
  } catch {
    return {};
  }
}

/** Ambil UTM tersimpan (jika ada). */
export function getStoredUtm(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(UTM_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as UtmParams;
    return {
      utm_source: typeof parsed.utm_source === "string" ? parsed.utm_source : undefined,
      utm_medium: typeof parsed.utm_medium === "string" ? parsed.utm_medium : undefined,
      utm_campaign: typeof parsed.utm_campaign === "string" ? parsed.utm_campaign : undefined,
    };
  } catch {
    return {};
  }
}

/** Hapus UTM tersimpan (setelah order dibuat). */
export function clearStoredUtm(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(UTM_KEY);
  } catch {
    // ignore
  }
}

/** Builder link UTM — generate URL untuk dibagikan. */
export function buildUtmLink(
  baseUrl: string,
  utm: UtmParams
): string {
  const url = new URL(baseUrl);
  if (utm.utm_source) url.searchParams.set("utm_source", utm.utm_source);
  if (utm.utm_medium) url.searchParams.set("utm_medium", utm.utm_medium);
  if (utm.utm_campaign) url.searchParams.set("utm_campaign", utm.utm_campaign);
  return url.toString();
}