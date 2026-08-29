// ─── Google Analytics / Search Console — angka real (T-43) ───────────────────
// Pola mengacu docs seo.md:
//   JWT service account (RS256) -> OAuth token -> GA4 Data API + GSC API.
//   Scope readonly, hasil di-cache in-memory (per instance serverless).
//   Kredensial TIDAK PERNAH keluar ke browser — hanya angka agregat.
//
// Implementasi JWT memakai node:crypto (RS256) — TANPA dependency tambahan.
import { createPrivateKey, sign } from "node:crypto";

export interface GaServiceAccount {
  client_email?: string;
  private_key?: string;
  token_uri?: string;
}

export interface AnalyticsStats {
  configured: boolean;
  ga4?: {
    users: number | null;
    sessions: number | null;
    views: number | null;
    activeUsers7d: number | null;
  } | null;
  gsc?: {
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    position: number | null;
  } | null;
  error?: string | null;
}

// ─── JWT RS256 (manual, tanpa library) ────────────────────────────────────────

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(serviceAccount: GaServiceAccount, scope: string): string | null {
  const { client_email, private_key, token_uri } = serviceAccount;
  if (!client_email || !private_key || !token_uri) return null;

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: client_email,
    scope,
    aud: token_uri,
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claim))}`;

  try {
    const key = createPrivateKey(private_key);
    const signature = sign("RSA-SHA256", Buffer.from(signingInput), key);
    return `${signingInput}.${base64UrlEncode(signature)}`;
  } catch (err) {
    console.error("[GA JWT sign]", err);
    return null;
  }
}

async function getAccessToken(serviceAccount: GaServiceAccount): Promise<string | null> {
  const jwt = signJwt(serviceAccount, "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly");
  if (!jwt) return null;

  try {
    const res = await fetch(serviceAccount.token_uri!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
    if (!res.ok) {
      console.error("[GA Token]", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    console.error("[GA Token network]", err);
    return null;
  }
}

// ─── GA4 Data API (runReport) ────────────────────────────────────────────────

async function fetchGa4Stats(
  accessToken: string,
  propertyId: string
): Promise<{ users: number; sessions: number; views: number } | null> {
  try {
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          metrics: [
            { name: "totalUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
          ],
        }),
      }
    );
    if (!res.ok) {
      console.error("[GA4 runReport]", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      rows?: { metricValues?: { value?: string }[] }[];
    };
    const row = data.rows?.[0]?.metricValues;
    if (!row || row.length < 3) return null;
    return {
      users: Number(row[0].value ?? 0),
      sessions: Number(row[1].value ?? 0),
      views: Number(row[2].value ?? 0),
    };
  } catch (err) {
    console.error("[GA4 runReport network]", err);
    return null;
  }
}

// ─── Search Console API (searchAnalytics) ────────────────────────────────────

async function fetchGscStats(
  accessToken: string,
  siteUrl: string
): Promise<{ clicks: number; impressions: number; ctr: number; position: number } | null> {
  try {
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
          dimensions: [],
          rowLimit: 1,
        }),
      }
    );
    if (!res.ok) {
      console.error("[GSC searchAnalytics]", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      rows?: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }[];
    };
    const row = data.rows?.[0];
    if (!row) {
      return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    }
    return {
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number(row.ctr ?? 0),
      position: Number(row.position ?? 0),
    };
  } catch (err) {
    console.error("[GSC searchAnalytics network]", err);
    return null;
  }
}

// ─── Public API (cache in-memory) ────────────────────────────────────────────

const cache: { data: AnalyticsStats | null; at: number } = { data: null, at: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit

export async function getAnalyticsStats(
  seo: {
    ga_service_account?: Record<string, unknown> | null;
    tracking_ga4_property_id?: string | null;
    tracking_gsc_site_url?: string | null;
  }
): Promise<AnalyticsStats> {
  const serviceAccount = seo.ga_service_account as GaServiceAccount | null;
  const propertyId = seo.tracking_ga4_property_id;
  const gscSiteUrl = seo.tracking_gsc_site_url;

  if (!serviceAccount || !propertyId) {
    return { configured: false };
  }

  // Cache hit
  if (cache.data && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.data;
  }

  const accessToken = await getAccessToken(serviceAccount);
  if (!accessToken) {
    const result: AnalyticsStats = {
      configured: true,
      error: "Gagal mendapatkan token Google API. Periksa konfigurasi service account.",
    };
    cache.data = result;
    cache.at = Date.now();
    return result;
  }

  const [ga4, gsc] = await Promise.all([
    fetchGa4Stats(accessToken, propertyId),
    gscSiteUrl ? fetchGscStats(accessToken, gscSiteUrl) : null,
  ]);

  const result: AnalyticsStats = {
    configured: true,
    ga4: ga4
      ? {
          users: ga4.users,
          sessions: ga4.sessions,
          views: ga4.views,
          activeUsers7d: ga4.users,
        }
      : null,
    gsc: gsc ?? null,
  };

  cache.data = result;
  cache.at = Date.now();
  return result;
}