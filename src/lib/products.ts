// ─── Product Data Layer — Supabase queries ────────────────────────────────────
import { createClient } from "@/utils/supabase/server";
import type { Product, Category, Review, ProductFilters, PaginatedResult } from "@/types/database";

// ─── Batch Rating & Sold Helper ────────────────────────────────
// Returns a map of productId -> { average, count, sold }
export async function getProductStatsMap(productIds: string[]): Promise<Record<string, { average: number; count: number; sold: number }>> {
  if (productIds.length === 0) return {};
  const supabase = await createClient();
  const map: Record<string, { average: number; count: number; sold: number }> = {};

  // Get ratings from reviews
  const { data: ratings } = await supabase
    .from("reviews")
    .select("product_id, rating")
    .in("product_id", productIds)
    .eq("is_visible", true);

  // Get sold counts from order_items
  const { data: soldData } = await supabase
    .from("order_items")
    .select("product_id, qty")
    .in("product_id", productIds);

  // Aggregate ratings
  const ratingSums: Record<string, { total: number; count: number }> = {};
  for (const r of ratings ?? []) {
    if (!ratingSums[r.product_id]) ratingSums[r.product_id] = { total: 0, count: 0 };
    ratingSums[r.product_id].total += r.rating;
    ratingSums[r.product_id].count += 1;
  }

  // Aggregate sold
  const soldSums: Record<string, number> = {};
  for (const s of soldData ?? []) {
    if (s.product_id) soldSums[s.product_id] = (soldSums[s.product_id] ?? 0) + s.qty;
  }

  for (const id of productIds) {
    const rs = ratingSums[id];
    map[id] = {
      average: rs ? Math.round((rs.total / rs.count) * 10) / 10 : 0,
      count: rs?.count ?? 0,
      sold: soldSums[id] ?? 0,
    };
  }

  return map;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("[getCategories]", error);
    return [];
  }
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data;
}

export async function getSubcategoriesOfCategory(parentId: string): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("parent_id", parentId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("[getSubcategoriesOfCategory]", error);
    return [];
  }
  return data ?? [];
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedResult<Product>> {
  const supabase = await createClient();
  const {
    categorySlug,
    search,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    pageSize = 20,
  } = filters;

  let query = supabase
    .from("products")
    .select(
      `*, categories!products_category_id_fkey(id, name, slug, icon), product_images(id, url, is_primary, sort_order)`,
      { count: "exact" }
    )
    .eq("is_active", true);

  // Filter by category slug (hierarchical)
  if (categorySlug) {
    const cat = await getCategoryBySlug(categorySlug);
    if (cat) {
      const { data: subcats } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", cat.id)
        .eq("is_active", true);

      if (subcats && subcats.length > 0) {
        const catIds = [cat.id, ...subcats.map((s) => s.id)];
        query = query.in("category_id", catIds);
      } else {
        query = query.eq("category_id", cat.id);
      }
    }
  }

  // Search
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // Price range
  if (minPrice !== undefined) query = query.gte("price", minPrice);
  if (maxPrice !== undefined) query = query.lte("price", maxPrice);

  // Sort
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("[getProducts]", error);
    return { data: [], count: 0, page, pageSize, totalPages: 0 };
  }

  // ponytail: safe cast — Supabase row shape matches Product type
  return {
    data: (data as unknown as Product[]) ?? [],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `*, categories!products_category_id_fkey(id, name, slug, icon), product_images(id, url, is_primary, sort_order), product_variants(id, name, price, stock, sku)`
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("[getProductBySlug]", error);
    return null;
  }
  return data as unknown as Product;
}

export async function getFlashSaleProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("flash_sale_products")
    .select(`
      flash_price,
      flash_stock,
      flash_sales!inner(id, is_active, starts_at, ends_at),
      products(*, categories!products_category_id_fkey(id, name, slug), product_images(url, is_primary))
    `)
    .eq("flash_sales.is_active", true)
    .gte("flash_sales.ends_at", now)
    .lte("flash_sales.starts_at", now)
    .limit(10);

  if (error || !data) {
    console.error("[getFlashSaleProducts] Error:", error);
    return [];
  }
  return (data as unknown as {
    flash_price: number;
    flash_stock: number;
    products: unknown;
  }[]).map((d) => ({
    ...(d.products as Product),
    discount_price: Number(d.flash_price),
    flash_stock: d.flash_stock,
  }));
}

export async function getActiveFlashSaleEnd(): Promise<string | null> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("flash_sales")
    .select("ends_at")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("ends_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.ends_at ?? null;
}

export async function getPromoProducts(limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *, 
      categories!products_category_id_fkey(id, name, slug, icon), 
      product_images(url, is_primary)
    `)
    .eq("is_active", true)
    .not("discount_price", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getPromoProducts] Error:", error);
    return [];
  }
  return (data as unknown as Product[]) ?? [];
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`*, categories!products_category_id_fkey(id, name, slug), product_images(url, is_primary)`)
    .in("id", ids)
    .eq("is_active", true);

  if (error) return [];
  return (data as unknown as Product[]) ?? [];
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(`*, profiles(id, name, avatar_url)`)
    .eq("product_id", productId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return [];
  return (data as unknown as Review[]) ?? [];
}

export async function getProductRatingSummary(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("is_visible", true);

  if (error || !data || data.length === 0) {
    return { average: 0, count: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
  let sum = 0;
  for (const r of data) {
    breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1;
    sum += r.rating;
  }

  return {
    average: Math.round((sum / data.length) * 10) / 10,
    count: data.length,
    breakdown,
  };
}

// ─── Best Sellers (by order items count) ─────────────────────────────────────

export async function getBestSellerProducts(limit = 8): Promise<Product[]> {
  const supabase = await createClient();

  // Aggregate by product_id using raw query with sum
  const { data: orderData } = await supabase
    .from("order_items")
    .select("product_id, qty")
    .not("product_id", "is", null);

  if (!orderData || orderData.length === 0) {
    // Fallback: just return newest active products
    const { data } = await supabase
      .from("products")
      .select(`*, categories!products_category_id_fkey(id, name, slug), product_images(url, is_primary)`)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as unknown as Product[]) ?? [];
  }

  // Aggregate by product_id (count total qty per product)
  const counts: Record<string, number> = {};
  for (const row of orderData) {
    if (row.product_id) counts[row.product_id] = (counts[row.product_id] ?? 0) + row.qty;
  }
  const topIds = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  return getProductsByIds(topIds);
}
