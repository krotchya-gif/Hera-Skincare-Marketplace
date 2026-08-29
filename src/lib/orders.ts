// ─── Orders Data Layer — Supabase queries ────────────────────────────────────
import { createClient } from "@/utils/supabase/server";
import { validateVoucher, redeemVoucher } from "@/lib/vouchers";
import type { Order, OrderStatus, ShippingAddress } from "@/types/database";

// ─── User orders ──────────────────────────────────────────────────────────────

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`*, order_items(*, products(id, name, slug))`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getOrdersByUser]", error);
    return [];
  }
  return (data as unknown as Order[]) ?? [];
}

// ─── Admin: all orders ────────────────────────────────────────────────────────

export interface OrderFilters {
  status?: OrderStatus | "semua";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export async function getAllOrders(filters: OrderFilters = {}) {
  const supabase = await createClient();
  const { status, search, dateFrom, dateTo, page = 1, pageSize = 20 } = filters;

  let query = supabase
    .from("orders")
    .select(
      `*, profiles(id, name, email, phone), order_items(id, product_name, qty, price, subtotal)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status && status !== "semua") {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(`order_number.ilike.%${search}%,profiles.name.ilike.%${search}%`);
  }
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error("[getAllOrders]", error);
    return { data: [], count: 0, page, pageSize, totalPages: 0 };
  }

  return {
    data: (data as unknown as Order[]) ?? [],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`*, profiles(id, name, email, phone), order_items(*, products(id, name, slug))`)
    .eq("id", orderId)
    .single();

  if (error) return null;
  return data as unknown as Order;
}

// ─── Create order ─────────────────────────────────────────────────────────────

export interface CreateOrderPayload {
  user_id: string;
  shipping_address: ShippingAddress;
  shipping_method: string;
  shipping_cost: number;
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  voucher_code?: string;
  items: {
    product_id: string;
    variant_id?: string;
    product_name: string;
    product_sku?: string;
    qty: number;
    price: number;
    subtotal: number;
  }[];
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order | null> {
  const supabase = await createClient();

  // Generate order number via DB function
  const { data: orderNumData } = await supabase.rpc("generate_order_number");
  const orderNumber = orderNumData ?? `HS${Date.now()}`;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: payload.user_id,
      status: "menunggu",
      payment_method: payload.payment_method,
      payment_status: "belum_bayar",
      shipping_method: payload.shipping_method,
      shipping_cost: payload.shipping_cost,
      shipping_address: payload.shipping_address,
      subtotal: payload.subtotal,
      discount: payload.discount,
      total: payload.total,
      notes: payload.notes ?? null,
      voucher_code: payload.voucher_code ?? null,
    })
    .select()
    .single();

  if (error || !order) {
    console.error("[createOrder]", error);
    return null;
  }

  // Insert order items
  const items = payload.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    variant_id: item.variant_id ?? null,
    product_name: item.product_name,
    product_sku: item.product_sku ?? null,
    qty: item.qty,
    price: item.price,
    subtotal: item.subtotal,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(items);
  if (itemsError) {
    console.error("[createOrder items]", itemsError);
    // Cleanup: delete orphaned order if items failed
    await supabase.from("orders").delete().eq("id", order.id);
    return null;
  }

  // Kurangi stock untuk setiap item (atomic via RPC)
  // Rollback: restore hanya item yang BENAR-BENAR ter-decrement
  const decremented: { product_id: string; variant_id?: string; qty: number }[] = [];
  try {
    for (const item of payload.items) {
      const { data: success, error: stockError } = await supabase
        .rpc("decrement_product_stock", { pid: item.product_id, qty: item.qty });

      if (stockError || !success) {
        throw new Error(`Stok tidak mencukupi untuk ${item.product_name}`);
      }
      decremented.push({ product_id: item.product_id, variant_id: item.variant_id, qty: item.qty });

      // Decrement variant stock if variant_id is present
      if (item.variant_id) {
        const { data: varSuccess, error: varStockError } = await supabase
          .rpc("decrement_variant_stock", { vid: item.variant_id, qty: item.qty });
        if (varStockError || !varSuccess) {
          throw new Error(`Gagal mengurangi stok varian untuk ${item.product_name}`);
        }
      }
    }
  } catch (stockErr) {
    console.error("[createOrder] Stock decrement failed, rolling back:", stockErr);
    // Rollback hanya item yang sudah ter-decrement (hindari stok phantom)
    for (const dp of decremented) {
      await supabase.rpc("increment_product_stock", { pid: dp.product_id, qty: dp.qty });
      if (dp.variant_id) {
        await supabase.rpc("increment_variant_stock", { vid: dp.variant_id, qty: dp.qty });
      }
    }
    // Delete orphaned order & items
    await supabase.from("order_items").delete().eq("order_id", order.id);
    await supabase.from("orders").delete().eq("id", order.id);
    return null;
  }

  // Redeem voucher via RPC atomic (quota + per-user limit) — gagal tidak membatalkan order
  if (payload.voucher_code && payload.discount > 0) {
    const voucherResult = await validateVoucher(payload.voucher_code, payload.subtotal, payload.user_id);
    if (voucherResult.valid && voucherResult.voucher) {
      await redeemVoucher(voucherResult.voucher.id);
    }
  }

  return order as unknown as Order;
}

// ─── Update order status ──────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string
): Promise<boolean> {
  const supabase = await createClient();

  // Get current order status
  const { data: currentOrder, error: fetchError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (fetchError || !currentOrder) {
    console.error("[updateOrderStatus fetch]", fetchError);
    throw { status: 404, message: "Pesanan tidak ditemukan" };
  }

  const currentStatus = currentOrder.status as OrderStatus;

  if (currentStatus === status) return true;

  // Validate status transition
  if (currentStatus === "selesai") {
    throw { status: 400, message: "Pesanan yang sudah selesai tidak dapat diubah statusnya." };
  }
  if (currentStatus === "dibatalkan") {
    throw { status: 400, message: "Pesanan yang sudah dibatalkan tidak dapat diubah statusnya." };
  }

  if (status === "diproses" && currentStatus !== "menunggu") {
    throw { status: 400, message: "Hanya pesanan dengan status 'Menunggu' yang dapat diproses." };
  }
  if (status === "dikirim" && currentStatus !== "diproses") {
    throw { status: 400, message: "Hanya pesanan dengan status 'Diproses' yang dapat dikirim." };
  }
  if (status === "selesai" && currentStatus !== "dikirim") {
    throw { status: 400, message: "Hanya pesanan dengan status 'Dikirim' yang dapat diselesaikan." };
  }

  // T-31: Pembatalan order via RPC — restore stok atomic + idempotent
  if (status === "dibatalkan") {
    const { data: cancelled, error: cancelError } = await supabase
      .rpc("cancel_order_and_restore_stock", { p_order_id: orderId });
    if (cancelError) {
      console.error("[updateOrderStatus cancel RPC]", cancelError);
      return false;
    }
    return cancelled === true;
  }

  const updatePayload: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (trackingNumber) updatePayload.tracking_number = trackingNumber;

  const { error } = await supabase.from("orders").update(updatePayload).eq("id", orderId);

  if (error) {
    console.error("[updateOrderStatus]", error);
    return false;
  }
  return true;
}

// ─── Order stats ──────────────────────────────────────────────────────────────

export async function getOrderStats() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("orders")
    .select("status, total, created_at");

  if (!data) return { todayCount: 0, menunggu: 0, dikirim: 0, selesai: 0 };

  const todayOrders = data.filter((o) => o.created_at.startsWith(today));
  const byStatus = (s: string) => data.filter((o) => o.status === s).length;

  return {
    todayCount: todayOrders.length,
    menunggu: byStatus("menunggu"),
    diproses: byStatus("diproses"),
    dikirim: byStatus("dikirim"),
    selesai: byStatus("selesai"),
    dibatalkan: byStatus("dibatalkan"),
  };
}
