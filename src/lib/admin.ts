// ─── Admin Data Layer — Supabase queries ─────────────────────────────────────
import { createClient } from "@/utils/supabase/server";
import type { Profile, Product, Review, Voucher, DashboardStats, OrderStatus, Category } from "@/types/database";

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  // Revenue this vs last month
  const [{ data: thisMonthOrders }, { data: lastMonthOrders }] = await Promise.all([
    supabase.from("orders").select("total, created_at").gte("created_at", thisMonthStart).eq("payment_status", "lunas"),
    supabase.from("orders").select("total, created_at").gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd).eq("payment_status", "lunas"),
  ]);

  const thisRevenue = thisMonthOrders?.reduce((s, o) => s + (o.total ?? 0), 0) ?? 0;
  const lastRevenue = lastMonthOrders?.reduce((s, o) => s + (o.total ?? 0), 0) ?? 0;
  const revenueChange = lastRevenue > 0 ? Math.round(((thisRevenue - lastRevenue) / lastRevenue) * 100) : 0;

  // Total orders
  const [{ count: thisOrderCount }, { count: lastOrderCount }] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", thisMonthStart),
    supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
  ]);

  const ordersChange = (lastOrderCount ?? 0) > 0
    ? Math.round((((thisOrderCount ?? 0) - (lastOrderCount ?? 0)) / (lastOrderCount ?? 1)) * 100)
    : 0;

  // Customers
  const [{ count: thisCustomerCount }, { count: lastCustomerCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer").gte("created_at", thisMonthStart),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer").gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
  ]);

  const { count: totalCustomers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer");
  const customersChange = (lastCustomerCount ?? 0) > 0
    ? Math.round((((thisCustomerCount ?? 0) - (lastCustomerCount ?? 0)) / (lastCustomerCount ?? 1)) * 100)
    : 0;

  // Products sold (filtered by this month for dashboard relevance)
  // Note: order_items doesn't have created_at, so we join through orders
  const [{ data: thisMonthOrdersForItems }, { data: lastMonthOrdersForItems }] = await Promise.all([
    supabase.from("orders").select("order_items(qty)").gte("created_at", thisMonthStart),
    supabase.from("orders").select("order_items(qty)").gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
  ]);
  const thisProductsSold = thisMonthOrdersForItems?.reduce((sum, o) => {
    const items = (o as unknown as { order_items?: { qty: number }[] })?.order_items ?? [];
    return sum + items.reduce((s, i) => s + (i.qty ?? 0), 0);
  }, 0) ?? 0;
  const lastProductsSold = lastMonthOrdersForItems?.reduce((sum, o) => {
    const items = (o as unknown as { order_items?: { qty: number }[] })?.order_items ?? [];
    return sum + items.reduce((s, i) => s + (i.qty ?? 0), 0);
  }, 0) ?? 0;
  const productsSoldChange = lastProductsSold > 0 ? Math.round(((thisProductsSold - lastProductsSold) / lastProductsSold) * 100) : 0;

  // Recent orders
  const { data: recentOrders } = await supabase
    .from("orders")
    .select(`*, profiles(id, name, email), order_items(product_name, qty, price)`)
    .order("created_at", { ascending: false })
    .limit(5);

  // Top products (filtered by last 3 months for performance)
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
  const { data: topOrdersRaw } = await supabase
    .from("orders")
    .select("order_items(product_name, qty, subtotal)")
    .gte("created_at", threeMonthsAgo);
  const topProductsRaw = topOrdersRaw?.flatMap((o) =>
    (o as unknown as { order_items?: { product_name: string; qty: number; subtotal: number }[] })?.order_items ?? []
  ) ?? [];

  const productMap: Record<string, { total_qty: number; total_revenue: number }> = {};
  for (const item of topProductsRaw ?? []) {
    if (!productMap[item.product_name]) productMap[item.product_name] = { total_qty: 0, total_revenue: 0 };
    productMap[item.product_name].total_qty += item.qty ?? 0;
    productMap[item.product_name].total_revenue += item.subtotal ?? 0;
  }
  const topProducts = Object.entries(productMap)
    .map(([product_name, stats]) => ({ product_name, ...stats }))
    .sort((a, b) => b.total_qty - a.total_qty)
    .slice(0, 5);

  // Sales chart (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: chartOrders } = await supabase
    .from("orders")
    .select("total, created_at")
    .gte("created_at", thirtyDaysAgo)
    .eq("payment_status", "lunas");

  const salesByDate: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    salesByDate[d.toISOString().split("T")[0]] = 0;
  }
  for (const o of chartOrders ?? []) {
    const date = o.created_at.split("T")[0];
    if (salesByDate[date] !== undefined) salesByDate[date] += o.total ?? 0;
  }
  const salesChart = Object.entries(salesByDate).map(([date, total]) => ({ date, total }));

  // Category chart (filtered by this month)
  const { data: catOrdersRaw } = await supabase
    .from("orders")
    .select("order_items(subtotal, products!inner(categories!inner(name)))")
    .gte("created_at", thisMonthStart);
  const catChartData = catOrdersRaw?.flatMap((o) =>
    (o as unknown as { order_items?: { subtotal: number; products?: { categories?: { name: string } } }[] })?.order_items ?? []
  ) ?? [];

  const catMap: Record<string, number> = {};
  for (const item of catChartData ?? []) {
    const catName = (item as Record<string, unknown> & { products?: { categories?: { name?: string } } })?.products?.categories?.name ?? "Lainnya";
    catMap[catName] = (catMap[catName] ?? 0) + ((item.subtotal as number) ?? 0);
  }
  const categoryChart = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Orders by status
  const { data: allOrderStatuses } = await supabase.from("orders").select("status");
  const ordersByStatus = { menunggu: 0, diproses: 0, dikirim: 0, selesai: 0, dibatalkan: 0 } as Record<OrderStatus, number>;
  for (const o of allOrderStatuses ?? []) {
    if (o.status in ordersByStatus) ordersByStatus[o.status as OrderStatus]++;
  }

  return {
    totalRevenue: thisRevenue,
    revenueChange,
    totalOrders: thisOrderCount ?? 0,
    ordersChange,
    totalCustomers: totalCustomers ?? 0,
    customersChange,
    totalProductsSold: thisProductsSold,
    productsSoldChange,
    recentOrders: (recentOrders as unknown[]) ?? [],
    topProducts,
    salesChart,
    categoryChart,
    ordersByStatus,
  } as DashboardStats;
}

// ─── Admin Products ───────────────────────────────────────────────────────────

export async function getAllProductsAdmin(filters: { search?: string; categoryId?: string; status?: string; page?: number; pageSize?: number } = {}) {
  const supabase = await createClient();
  const { search, categoryId, status, page = 1, pageSize = 20 } = filters;

  let query = supabase
    .from("products")
    .select(`*, categories!products_category_id_fkey(id, name, slug)`, { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("name", `%${search}%`);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (status === "aktif") query = query.eq("is_active", true);
  if (status === "nonaktif") query = query.eq("is_active", false);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) return { data: [], count: 0, totalPages: 0 };

  return {
    data: (data as unknown as Product[]) ?? [],
    count: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function createProduct(payload: Partial<Product> & { images?: string[] }): Promise<Product | null> {
  const supabase = await createClient();
  const { images, ...rest } = payload;
  const productAllowed = ["name", "sku", "description", "category_id", "brand", "price", "discount_price", "stock", "unit", "weight_gram", "dimension_p", "dimension_l", "dimension_t", "meta_title", "meta_description", "slug", "is_active"];
  const productData: Record<string, unknown> = {};
  for (const k of productAllowed) {
    if ((rest as Record<string, unknown>)[k] !== undefined) {
      productData[k] = (rest as Record<string, unknown>)[k];
    }
  }
  const { data, error } = await supabase.from("products").insert(productData).select().single();
  if (error || !data) { console.error("[createProduct]", error); return null; }

  if (images && images.length > 0) {
    const imagesToInsert = images.map((url, i) => ({
      product_id: data.id,
      url,
      is_primary: i === 0,
      sort_order: i,
    }));
    const { error: imgError } = await supabase.from("product_images").insert(imagesToInsert);
    if (imgError) {
      console.error("[createProduct images]", imgError);
    }
  }

  return data as unknown as Product;
}

export async function updateProduct(id: string, payload: Partial<Product>): Promise<boolean> {
  const supabase = await createClient();
  const allowed = ["name", "description", "category_id", "brand", "price", "discount_price", "stock", "unit", "weight_gram", "dimension_p", "dimension_l", "dimension_t", "meta_title", "meta_description", "slug", "is_active"];
  const sanitized: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) {
    if ((payload as Record<string, unknown>)[k] !== undefined) {
      sanitized[k] = (payload as Record<string, unknown>)[k];
    }
  }
  const { error } = await supabase.from("products").update(sanitized).eq("id", id);
  if (error) { console.error("[updateProduct]", error); return false; }
  return true;
}

export async function toggleProductStatus(id: string, isActive: boolean): Promise<boolean> {
  return updateProduct(id, { is_active: isActive } as Partial<Product>);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) { console.error("[deleteProduct]", error); return false; }
  return true;
}

// ─── Admin Customers ──────────────────────────────────────────────────────────

export async function getAllCustomers(filters: { search?: string; status?: string; page?: number; pageSize?: number } = {}) {
  const supabase = await createClient();
  const { search, status, page = 1, pageSize = 20 } = filters;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  if (status) query = query.eq("status", status);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) return { data: [], count: 0, totalPages: 0 };

  return {
    data: (data as Profile[]) ?? [],
    count: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function updateCustomerStatus(id: string, status: "aktif" | "nonaktif" | "diblokir"): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  if (error) { console.error("[updateCustomerStatus]", error); return false; }
  return true;
}

// ─── Admin Reviews ────────────────────────────────────────────────────────────

export async function getAllReviews(filters: { page?: number; pageSize?: number; isVisible?: boolean } = {}) {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, isVisible } = filters;

  let query = supabase
    .from("reviews")
    .select(`*, profiles(id, name, avatar_url), products(id, name, slug)`, { count: "exact" })
    .order("created_at", { ascending: false });

  if (isVisible !== undefined) query = query.eq("is_visible", isVisible);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) return { data: [], count: 0, totalPages: 0 };

  return {
    data: (data as unknown as Review[]) ?? [],
    count: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function toggleReviewVisibility(id: string, isVisible: boolean): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").update({ is_visible: isVisible }).eq("id", id);
  if (error) { console.error("[toggleReviewVisibility]", error); return false; }
  return true;
}

export async function getReviewStats() {
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("rating, is_visible");
  if (!data) return { average: 0, total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
  let sum = 0;
  for (const r of data) { breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1; sum += r.rating; }

  return { average: data.length > 0 ? Math.round((sum / data.length) * 10) / 10 : 0, total: data.length, breakdown };
}

// ─── Admin Vouchers ───────────────────────────────────────────────────────────

export async function getAllVouchers(): Promise<Voucher[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("vouchers").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return (data as Voucher[]) ?? [];
}

export async function createVoucher(payload: Partial<Voucher>): Promise<Voucher | null> {
  const supabase = await createClient();
  const allowed = ["code", "type", "value", "min_purchase", "quota", "per_user_limit", "starts_at", "ends_at", "is_active"];
  const voucherData: Record<string, unknown> = {};
  for (const k of allowed) {
    if ((payload as Record<string, unknown>)[k] !== undefined) {
      voucherData[k] = (payload as Record<string, unknown>)[k];
    }
  }
  const { data, error } = await supabase.from("vouchers").insert(voucherData).select().single();
  if (error) { console.error("[createVoucher]", error); return null; }
  return data as Voucher;
}

export async function toggleVoucherStatus(id: string, isActive: boolean): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("vouchers").update({ is_active: isActive }).eq("id", id);
  if (error) { console.error("[toggleVoucherStatus]", error); return false; }
  return true;
}

// ─── Admin Categories ──────────────────────────────────────────

export async function getAllCategoriesAdmin(): Promise<(Category & { product_count?: number })[]> {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select(`*, products(count)`)
    .order("sort_order");

  if (error) {
    console.error("[getAllCategoriesAdmin]", error);
    return [];
  }

  return (categories || []).map((cat) => {
    const productsData = (cat as unknown as { products: { count: number }[] | null }).products;
    return {
      ...(cat as unknown as Category),
      product_count: productsData?.[0]?.count ?? 0,
    };
  });
}

export async function createCategory(payload: Partial<Category>): Promise<Category | null> {
  const supabase = await createClient();
  const allowed = ["name", "slug", "icon", "parent_id", "sort_order", "is_active"];
  const categoryData: Record<string, unknown> = {};
  for (const k of allowed) {
    if ((payload as Record<string, unknown>)[k] !== undefined) {
      categoryData[k] = (payload as Record<string, unknown>)[k];
    }
  }
  const { data, error } = await supabase.from("categories").insert(categoryData).select().single();
  if (error) { console.error("[createCategory]", error); return null; }
  return data as Category;
}

export async function updateCategory(id: string, payload: Partial<Category>): Promise<boolean> {
  const supabase = await createClient();
  const allowed = ["name", "slug", "icon", "parent_id", "sort_order", "is_active"];
  const sanitized: Record<string, unknown> = {};
  for (const k of allowed) {
    if ((payload as Record<string, unknown>)[k] !== undefined) {
      sanitized[k] = (payload as Record<string, unknown>)[k];
    }
  }
  const { error } = await supabase.from("categories").update(sanitized).eq("id", id);
  if (error) { console.error("[updateCategory]", error); return false; }
  return true;
}

// ponytail: soft-delete (set is_active = false), not hard delete
export async function softDeleteCategory(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ is_active: false }).eq("id", id);
  if (error) { console.error("[softDeleteCategory]", error); return false; }
  return true;
}


