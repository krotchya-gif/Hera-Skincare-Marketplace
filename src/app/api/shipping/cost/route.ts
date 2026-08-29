import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import {
  buildFlatOptions,
  fetchRajaOngkirCosts,
  getShippingSettings,
  getWeightFromItems,
  isFreeShipping,
  isRajaOngkirEnabled,
} from "@/lib/shipping";

// T-54: hitung opsi ongkir untuk alamat + item keranjang (dipakai checkout).
// Berat SELALU dihitung server dari DB (products.weight_gram × qty) — nilai
// dari client tidak pernah dipercaya. Mode "flat" dipakai bila RajaOngkir
// belum dikonfigurasi atau ketersediaan alamat/area memadai tidak terpenuhi.
export async function POST(request: NextRequest) {
  try {
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 30, 60000);
    if (!allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Silakan masuk (login) terlebih dahulu." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const addressId = typeof body?.address_id === "string" ? body.address_id : "";
    const rawItems: { product_id?: unknown; qty?: unknown }[] = Array.isArray(body?.items)
      ? body.items
      : [];
    const items = rawItems.map((i) => ({
      product_id: typeof i.product_id === "string" ? i.product_id : "",
      qty: Number.isInteger(i.qty) && Number(i.qty) > 0 ? Number(i.qty) : 0,
    }));
    const subtotal = Number(body?.subtotal) || 0;

    const settings = await getShippingSettings();
    const free = {
      enabled: settings.free_shipping,
      min: settings.free_shipping_min,
      subtotal,
      qualifies: isFreeShipping(settings, subtotal),
    };

    let destinationAreaId: string | null = null;
    if (addressId) {
      const { data: addr } = await supabase
        .from("shipping_addresses")
        .select("destination_area_id")
        .eq("id", addressId)
        .eq("user_id", user.id)
        .maybeSingle();
      destinationAreaId = (addr as { destination_area_id?: string } | null)?.destination_area_id ?? null;
    }

    let options = buildFlatOptions(settings);
    let mode: "flat" | "rajaongkir" = "flat";

    const weight = await getWeightFromItems(items);
    if (isRajaOngkirEnabled(settings.origin_area_id) && destinationAreaId && weight) {
      const realOptions = await fetchRajaOngkirCosts(
        settings.origin_area_id,
        destinationAreaId,
        weight,
        settings.couriers
      );
      // API gagal / tidak ada layanan → fallback flat agar checkout tetap jalan
      if (realOptions.length > 0) {
        options = realOptions;
        mode = "rajaongkir";
      }
    }

    return NextResponse.json({ mode, options, free_shipping: free });
  } catch (error) {
    console.error("[API POST Shipping Cost]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
