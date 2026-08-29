// ─── Shipping Data Layer — RajaOngkir V2 (Komerce) + flat fallback ──────────
// T-54: SATU sumber logika ongkir (dipakai /api/shipping/* dan /api/orders).
// Bila RAJAONGKIR_API_KEY + settings.shipping.origin_area_id tersedia →
// ongkir real per kurir (harga presisi subdistrict). Bila tidak → tarif flat
// dari settings (graceful degradation, pola Xendit/notify).
import { createClient } from "@/utils/supabase/server";

const RAJAONGKIR_BASE =
  process.env.RAJAONGKIR_BASE_URL || "https://rajaongkir.komerce.id/api/v1";

const DEFAULT_FLAT_RATE = 12000;
const DEFAULT_FREE_SHIPPING_MIN = 100000;

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
  const json = (await rajaOngkirFetch(
    `/destination/domestic-destination?search=${encodeURIComponent(q)}&limit=${limit}&offset=0`
  )) as { data?: unknown } | null;
  const data = json?.data;
  if (!Array.isArray(data)) return [];
  // Respons V2 bisa berupa array objek atau array of arrays — normalisasi
  // defensif; bentuk eksak akan dikonfirmasi saat E2E dengan key owner.
  return data
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
        [r.subdistrict, r.district, r.city, r.province]
          .filter((v): v is string => typeof v === "string" && v.length > 0)
          .join(", ") || String(id);
      return { id: String(id), label };
    })
    .filter((a): a is AreaOption => a !== null);
}

// Cache ongkir 5 menit (pola google-analytics.ts) — hemat kuota per tier
const costCache = new Map<string, { at: number; options: ShippingOption[] }>();
const COST_CACHE_TTL = 5 * 60 * 1000;

export async function fetchRajaOngkirCosts(
  originAreaId: string,
  destAreaId: string,
  weightGram: number,
  couriers: { name: string; code: string }[]
): Promise<ShippingOption[]> {
  const cacheKey = `${originAreaId}|${destAreaId}|${weightGram}|${couriers
    .map((c) => c.code)
    .join(",")}`;
  const cached = costCache.get(cacheKey);
  if (cached && Date.now() - cached.at < COST_CACHE_TTL) return cached.options;

  const weight = Math.max(1000, Math.round(weightGram)); // minimum chargeable 1 kg
  const options: ShippingOption[] = [];
  for (const courier of couriers) {
    if (!courier.code) continue;
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
    const data = json?.data;
    const rows: unknown[] = Array.isArray(data)
      ? data
      : data && typeof data === "object"
        ? (Object.values(data as Record<string, unknown>).flat() as unknown[])
        : [];
    const services: ShippingService[] = [];
    for (const row of rows) {
      const r = (typeof row === "object" && row !== null ? row : {}) as Record<string, unknown>;
      const serviceCode = String(r.service ?? r.service_code ?? r.code ?? "").trim();
      const price = Number(r.cost ?? r.price ?? r.shipping_cost ?? 0);
      if (!serviceCode || !Number.isFinite(price) || price <= 0) continue;
      services.push({
        name: String(r.description ?? r.service_name ?? serviceCode),
        code: `${courier.code}:${serviceCode}`,
        etd: String(r.etd ?? r.estimated_delivery ?? "-"),
        price,
        courier_code: courier.code,
        service_code: serviceCode,
      });
    }
    if (services.length > 0) {
      options.push({ courier: courier.name, logo: courier.name.charAt(0), services });
    }
  }
  costCache.set(cacheKey, { at: Date.now(), options });
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
