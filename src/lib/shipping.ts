// ─── Shipping Data Layer — RajaOngkir V2 (Komerce) + flat fallback ──────────
// T-54: SATU sumber logika ongkir (dipakai /api/shipping/* dan /api/orders).
// Bila RAJAONGKIR_API_KEY + settings.shipping.origin_area_id tersedia →
// ongkir real per kurir (harga presisi subdistrict). Bila tidak → tarif flat
// dari settings (graceful degradation, pola Xendit/notify).
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

const RAJAONGKIR_BASE =
  process.env.RAJAONGKIR_BASE_URL || "https://rajaongkir.komerce.id/api/v1";

const DEFAULT_FLAT_RATE = 12000;
const DEFAULT_FREE_SHIPPING_MIN = 100000;

// ── Cache persisten (T-57) — kuota key RajaOngkir hanya 100 hit/hari ───────
// Tabel shipping_cache = server-only (RLS on tanpa policy, hanya service-role).
// Tanpa SUPABASE_SERVICE_ROLE_KEY cache nonaktif → langsung ke API (tetap
// benar, hanya boros kuota).
const COST_CACHE_TTL = 24 * 60 * 60 * 1000; // tarif stabil dalam sehari
const DEST_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // daftar area ~statis
const CACHE_PRUNE_AFTER = 30 * 24 * 60 * 60 * 1000;

function cacheEnabled(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function cacheGet(key: string, ttlMs: number): Promise<unknown | null> {
  if (!cacheEnabled()) return null;
  try {
    const admin = createAdminClient();
    const cutoff = new Date(Date.now() - ttlMs).toISOString();
    const { data } = await admin
      .from("shipping_cache")
      .select("value")
      .eq("cache_key", key)
      .gte("created_at", cutoff)
      .maybeSingle();
    return (data as { value: unknown } | null)?.value ?? null;
  } catch (err) {
    console.warn("[ShippingCache] get failed:", err);
    return null;
  }
}

async function cachePut(key: string, value: unknown): Promise<void> {
  if (!cacheEnabled()) return;
  try {
    const admin = createAdminClient();
    await admin.from("shipping_cache").upsert(
      { cache_key: key, value, created_at: new Date().toISOString() },
      { onConflict: "cache_key" }
    );
    // best-effort prune entri yang sangat lama
    const cutoff = new Date(Date.now() - CACHE_PRUNE_AFTER).toISOString();
    await admin.from("shipping_cache").delete().lt("created_at", cutoff);
  } catch (err) {
    console.warn("[ShippingCache] put failed:", err);
  }
}

// Kode kurir RajaOngkir utk nama display di settings
const COURIER_CODES: Record<string, string> = {
  JNE: "jne",
  "J&T Express": "jnt",
  SiCepat: "sicepat",
  Anteraja: "anteraja",
  POS: "pos",
  TIKI: "tiki",
};

export interface ShippingService {
  name: string; // label layanan, mis. "REG"
  code: string; // kode unik utk select di UI: `${courier_code}:${service}`
  etd: string;
  price: number;
  courier_code: string;
  service_code: string;
}

export interface ShippingOption {
  courier: string; // nama kurir utk display, mis. "JNE"
  logo: string;
  services: ShippingService[];
}

export interface ShippingSettings {
  couriers: { name: string; code: string }[];
  flat_rate: number;
  free_shipping: boolean;
  free_shipping_min: number;
  origin_city: string;
  origin_area_id: string;
}

export function isRajaOngkirEnabled(originAreaId?: string | null): boolean {
  return Boolean(process.env.RAJAONGKIR_API_KEY) && Boolean(originAreaId);
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "shipping")
    .maybeSingle();
  const value = (data?.value ?? {}) as Record<string, unknown>;
  const courierNames =
    Array.isArray(value.couriers) && value.couriers.length > 0
      ? (value.couriers as string[])
      : ["JNE"];
  return {
    couriers: courierNames.map((name) => ({
      name,
      code: COURIER_CODES[name] ?? name.toLowerCase().replace(/\s+/g, ""),
    })),
    flat_rate:
      Number(value.flat_rate) > 0 ? Number(value.flat_rate) : DEFAULT_FLAT_RATE,
    free_shipping: value.free_shipping !== false,
    free_shipping_min:
      Number(value.free_shipping_min) > 0
        ? Number(value.free_shipping_min)
        : DEFAULT_FREE_SHIPPING_MIN,
    origin_city: typeof value.origin_city === "string" ? value.origin_city : "",
    origin_area_id:
      typeof value.origin_area_id === "string" ? value.origin_area_id : "",
  };
}

export function isFreeShipping(settings: ShippingSettings, subtotal: number): boolean {
  return settings.free_shipping && subtotal >= settings.free_shipping_min;
}

// ── RajaOngkir V2 (Komerce) ────────────────────────────────────────────────
// Key TIDAK PERNAH dikirim ke client — semua call lewat route server ini.
async function rajaOngkirFetch(path: string, init?: RequestInit): Promise<unknown | null> {
  const key = process.env.RAJAONGKIR_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${RAJAONGKIR_BASE}${path}`, {
      ...init,
      headers: { key, ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(
        `[RajaOngkir] ${path} HTTP ${res.status}:`,
        (await res.text()).slice(0, 300)
      );
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`[RajaOngkir] ${path} network error:`, err);
    return null;
  }
}

export interface AreaOption {
  id: string;
  label: string;
}

export async function searchDestinationAreas(
  query: string,
  limit = 10
): Promise<AreaOption[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  // T-57: hasil pencarian di-cache (data area ~statis) — hemat kuota harian
  const cacheKey = `dest:${q.toLowerCase()}`;
  const cached = await cacheGet(cacheKey, DEST_CACHE_TTL);
  if (Array.isArray(cached) && cached.length > 0) return cached as AreaOption[];

  const json = (await rajaOngkirFetch(
    `/destination/domestic-destination?search=${encodeURIComponent(q)}&limit=${limit}&offset=0`
  )) as { data?: unknown } | null;
  const data = json?.data;
  if (!Array.isArray(data)) return [];
  // Shape asli V2 (E2E 2026-08-29): data[] = {id, label, province_name,
  // city_name, district_name, subdistrict_name, zip_code}
  const areas = data
    .slice(0, limit)
    .map((row: unknown): AreaOption | null => {
      if (Array.isArray(row)) {
        const [id, province, , , district, , , subdistrict] = row as (string | number)[];
        if (!id) return null;
        return {
          id: String(id),
          label: [subdistrict ?? district, district, province]
            .filter(Boolean)
            .join(", "),
        };
      }
      const r = row as Record<string, unknown>;
      const id = r.id ?? r.subdistrict_id ?? r.area_id;
      if (!id) return null;
      const label =
        (typeof r.label === "string" && r.label.trim()) ||
        [r.subdistrict_name, r.district_name, r.city_name, r.province_name]
          .filter((v): v is string => typeof v === "string" && v.length > 0)
          .join(", ") ||
        String(id);
      return { id: String(id), label };
    })
    .filter((a): a is AreaOption => a !== null);
  if (areas.length > 0) await cachePut(cacheKey, areas);
  return areas;
}

// T-57: cache persisten per (origin, dest, weight, courier) — hanya kurir
// yang cache-nya miss yang memanggil API (kuota 100 hit/hari).
interface RajaOngkirCostRow {
  service?: string;
  description?: string;
  cost?: number;
  etd?: string;
}

export async function fetchRajaOngkirCosts(
  originAreaId: string,
  destAreaId: string,
  weightGram: number,
  couriers: { name: string; code: string }[]
): Promise<ShippingOption[]> {
  const weight = Math.max(1000, Math.round(weightGram)); // minimum chargeable 1 kg
  const options: ShippingOption[] = [];
  for (const courier of couriers) {
    if (!courier.code) continue;
    const cacheKey = `cost:${originAreaId}:${destAreaId}:${weight}:${courier.code}`;
    let rows = (await cacheGet(cacheKey, COST_CACHE_TTL)) as RajaOngkirCostRow[] | null;
    if (!Array.isArray(rows) || rows.length === 0) {
      const json = (await rajaOngkirFetch("/calculate/domestic-cost", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          origin: originAreaId,
          destination: destAreaId,
          weight: String(weight),
          courier: courier.code,
        }).toString(),
      })) as { data?: unknown } | null;
      // Shape asli (E2E 2026-08-29): data[] = {name, code, service,
      // description, cost, etd}
      rows = Array.isArray(json?.data) ? (json!.data as RajaOngkirCostRow[]) : [];
      if (rows.length > 0) await cachePut(cacheKey, rows);
    }
    const services: ShippingService[] = [];
    for (const r of rows) {
      const serviceCode = String(r.service ?? "").trim();
      const price = Number(r.cost ?? 0);
      if (!serviceCode || !Number.isFinite(price) || price <= 0) continue;
      // Tier cargo berbasis band berat (mis. "JTR<130", "JTR>200") tidak
      // relevan utk berat yang dihitung — sembunyikan dari opsi checkout.
      if (serviceCode.includes("<") || serviceCode.includes(">")) continue;
      services.push({
        name: String(r.description ?? serviceCode),
        code: `${courier.code}:${serviceCode}`,
        etd: String(r.etd ?? "").trim() || "-",
        price,
        courier_code: courier.code,
        service_code: serviceCode,
      });
    }
    if (services.length > 0) {
      options.push({ courier: courier.name, logo: courier.name.charAt(0), services });
    }
  }
  return options;
}

export function buildFlatOptions(settings: ShippingSettings): ShippingOption[] {
  return settings.couriers.map((courier) => ({
    courier: courier.name,
    logo: courier.name.charAt(0),
    services: [
      {
        name: "Regular",
        code: courier.name.toLowerCase().replace(/\s/g, "-"),
        etd: "2-5 hari",
        price: settings.flat_rate,
        courier_code: courier.code || courier.name.toLowerCase(),
        service_code: "REG",
      },
    ],
  }));
}

// Bobot total (gram) dari DB — berat dari client tidak pernah dipercaya
export async function getWeightFromItems(
  items: { product_id: string; qty: number }[]
): Promise<number | null> {
  const ids = [...new Set(items.map((i) => i.product_id))];
  if (ids.length === 0) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, weight_gram")
    .in("id", ids);
  if (error || !data) return null;
  const map = new Map(
    (data as { id: string; weight_gram: number | null }[]).map((p) => [
      p.id,
      Number(p.weight_gram) || 0,
    ])
  );
  let total = 0;
  for (const item of items) {
    const w = map.get(item.product_id);
    if (w === undefined) return null; // produk tidak ditemukan
    total += w * item.qty;
  }
  return total;
}
