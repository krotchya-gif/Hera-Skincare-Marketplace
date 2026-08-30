// ─── Product Data Layer — Supabase queries ────────────────────────────────────
import { createClient } from "@/utils/supabase/server";
import { attachProfiles } from "@/lib/profiles";
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

  // Get sold counts via RPC (T-34) — bypass RLS terkontrol sehingga
  // guest (anon) juga mendapat angka terjual yang benar.
  const soldMap = await getSoldCountMap();

  // Aggregate ratings
  const ratingSums: Record<string, { total: number; count: number }> = {};
  for (const r of ratings ?? []) {
    if (!ratingSums[r.product_id]) ratingSums[r.product_id] = { total: 0, count: 0 };
    ratingSums[r.product_id].total += r.rating;
    ratingSums[r.product_id].count += 1;
  }

  for (const id of productIds) {
    const rs = ratingSums[id];
    map[id] = {
      average: rs ? Math.round((rs.total / rs.count) * 10) / 10 : 0,
      count: rs?.count ?? 0,
      sold: soldMap.get(id) ?? 0,
    };
  }

  return map;
}

// T-34: Satu-satunya sumber angka terjual (sold).
// RPC SECURITY DEFINER — ekspos agregat (product_id, sold) tanpa data order.
export async function getSoldCountMap(): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_product_sales_summary");
  if (error) {
    console.error("[getSoldCountMap]", error);
    return new Map();
  }
  const rows = (data ?? []) as { product_id: string; sold: number }[];
  return new Map(rows.map((r) => [r.product_id, Number(r.sold)]));
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
    subCategory,
    search,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    pageSize = 20,
  } = filters;

  // T-32: Pilih scope kategori — subCategory lebih spesifik daripada categorySlug
  let scopeCategoryId: string | null = null;
  let scopeIds: Set<string> | null = null;
  if (subCategory) {
    const sub = await getCategoryBySlug(subCategory);
    if (sub) scopeCategoryId = sub.id;
  } else if (categorySlug) {
    const cat = await getCategoryBySlug(categorySlug);
    if (cat) {
      const { data: subcats } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", cat.id)
        .eq("is_active", true);

      if (subcats && subcats.length > 0) {
        // Induk dengan subkategori: tampilkan semua produk induk + subkategori
        const catIds = [cat.id, ...subcats.map((s) => s.id)];
        const { data: productsInScope } = await supabase
          .from("products")
          .select("id")
          .in("category_id", catIds)
          .eq("is_active", true);
        scopeIds = new Set((productsInScope ?? []).map((p) => p.id as string));
      } else {
        scopeCategoryId = cat.id;
      }
    }
  }

  // T-34: Sort "popular" — via RPC sold map (view lama dihapus; tanpa order dibatalkan)
  if (sort === "popular") {
    // Langkah 1: ambil semua id produk yang cocok filter (tanpa pagination)
    let idQuery = supabase
      .from("products")
      .select("id")
      .eq("is_active", true);

    if (scopeCategoryId) idQuery = idQuery.eq("category_id", scopeCategoryId);
    if (scopeIds && scopeIds.size > 0) idQuery = idQuery.in("id", [...scopeIds]);
    if (search) idQuery = idQuery.ilike("name", `%${search}%`);
    if (minPrice !== undefined) idQuery = idQuery.gte("price", minPrice);
    if (maxPrice !== undefined) idQuery = idQuery.lte("price", maxPrice);

    const { data: allIds, error: idError } = await idQuery;
    if (idError) {
      console.error("[getProducts popular ids]", idError);
      return { data: [], count: 0, page, pageSize, totalPages: 0 };
    }

    // Langkah 2: urutkan di JS berdasarkan sold (desc), produk tanpa penjualan di akhir
    const soldMap = await getSoldCountMap();
    const sortedIds = (allIds ?? [])
      .map((p) => p.id as string)
      .sort((a, b) => (soldMap.get(b) ?? 0) - (soldMap.get(a) ?? 0));

    const from = (page - 1) * pageSize;
    const pageIds = sortedIds.slice(from, from + pageSize);

    // Langkah 3: fetch detail produk untuk id halaman ini
    const { data: pageProducts, error: pageError } = await supabase
      .from("products")
      .select(
        `*, categories!products_category_id_fkey(id, name, slug, icon), product_images(id, url, is_primary, sort_order)`
      )
      .in("id", pageIds);

    if (pageError) {
      console.error("[getProducts popular detail]", pageError);
      return { data: [], count: 0, page, pageSize, totalPages: 0 };
    }

    // Pertahankan urutan sortedIds
    const byId = new Map((pageProducts ?? []).map((p) => [p.id, p]));
    const ordered = pageIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);

    return {
      data: (ordered as unknown as Product[]) ?? [],
      count: sortedIds.length,
      page,
      pageSize,
      totalPages: Math.ceil(sortedIds.length / pageSize),
    };
  }

  let query = supabase
    .from("products")
    .select(
      `*, categories!products_category_id_fkey(id, name, slug, icon), product_images(id, url, is_primary, sort_order)`,
      { count: "exact" }
    )
    .eq("is_active", true);

  if (scopeCategoryId) {
    query = query.eq("category_id", scopeCategoryId);
  }
  if (scopeIds && scopeIds.size > 0) {
    query = query.in("id", [...scopeIds]);
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

// T-17: Harga efektif per produk dari sisi server untuk validasi checkout.
// Prioritas: flash_price (flash sale aktif) > discount_price > price.
export async function getEffectivePrices(
  productIds: string[]
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const map = new Map<string, number>();

  if (productIds.length === 0) return map;

  const { data: products } = await supabase
    .from("products")
    .select("id, price, discount_price")
    .in("id", productIds);

  for (const p of (products as { id: string; price: number; discount_price: number | null }[] | null) ?? []) {
    const hasDiscount =
      p.discount_price !== null && Number(p.discount_price) < Number(p.price);
    map.set(p.id, hasDiscount ? Number(p.discount_price) : Number(p.price));
  }

  const { data: flashItems } = await supabase
    .from("flash_sale_products")
    .select(
      "product_id, flash_price, flash_sales!inner(is_active, starts_at, ends_at)"
    )
    .in("product_id", productIds)
    .eq("flash_sales.is_active", true)
    .lte("flash_sales.starts_at", now)
    .gte("flash_sales.ends_at", now);

  for (const f of (flashItems as { product_id: string; flash_price: number }[] | null) ?? []) {
    map.set(f.product_id, Number(f.flash_price));
  }

  return map;
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
    .select(`*`)
    .eq("product_id", productId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return [];
  const rows = await attachProfiles(supabase, (data as { user_id?: string | null }[]) ?? []);
  return (rows as unknown as Review[]) ?? [];
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

  // T-34: Satu sumber sold via RPC (bypass RLS terkontrol — guest ikut terbaca)
  const soldMap = await getSoldCountMap();
  if (soldMap.size === 0) {
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
  const topIds = [...soldMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  return getProductsByIds(topIds);
}

// ─── Product Q&A (T-06.1) ───────────────────────────────────────────────────

export interface ProductQuestion {
  id: string;
  product_id: string;
  user_id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  helpful_count: number;
  created_at: string;
}

export async function getQuestionsByProduct(productId: string): Promise<ProductQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_qna")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getQuestionsByProduct]", error);
    return [];
  }
  return (data as ProductQuestion[]) ?? [];
}
