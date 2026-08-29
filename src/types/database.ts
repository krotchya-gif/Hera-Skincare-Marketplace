// ─── Database Types — Hera Skincare (matches Supabase schema) ────────────────

export type UserRole = "super_admin" | "admin" | "operator" | "finance" | "customer";
export type UserStatus = "aktif" | "nonaktif" | "diblokir";
export type OrderStatus = "menunggu" | "diproses" | "dikirim" | "selesai" | "dibatalkan";
export type PaymentStatus = "belum_bayar" | "lunas" | "gagal";
export type VoucherType = "percent" | "nominal";

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category_id: string | null;
  brand: string | null;
  price: number;
  discount_price: number | null;
  stock: number;
  unit: string;
  weight_gram: number | null;
  dimension_p: number | null;
  dimension_l: number | null;
  dimension_t: number | null;
  is_active: boolean;
  slug: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  // joined
  categories?: Category | null;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  stock: number;
  sku: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  payment_method: string | null;
  payment_status: PaymentStatus;
  shipping_method: string | null;
  tracking_number: string | null;
  shipping_address: ShippingAddress | null;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  notes: string | null;
  voucher_code: string | null;
  xendit_invoice_id: string | null;
  xendit_invoice_url: string | null;
  utm_source: string | null;
  created_at: string;
  updated_at: string;
  // joined
  profiles?: Pick<Profile, "id" | "name" | "email" | "phone"> | null;
  order_items?: OrderItem[];
}

// T-40: Event log marketing (pola docs seo.md)
export interface EventLog {
  id: string;
  event_name: string;
  label: string | null;
  page: string | null;
  value: Record<string, unknown> | null;
  status: "sent" | "pending" | "failed";
  provider: string | null;
  created_at: string;
}

// T-41: Kunjungan UTM (pola docs seo.md)
export interface UtmVisit {
  id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_url: string | null;
  referrer: string | null;
  session_id: string | null;
  created_at: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_sku: string | null;
  qty: number;
  price: number;
  subtotal: number;
  // joined
  products?: Pick<Product, "id" | "name" | "slug"> | null;
}

export interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: number;
  min_purchase: number;
  quota: number | null;
  used_count: number;
  per_user_limit: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FlashSale {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  banner_url: string | null;
  is_active: boolean;
  created_at: string;
  flash_sale_products?: FlashSaleProduct[];
}

export interface FlashSaleProduct {
  id: string;
  flash_sale_id: string;
  product_id: string;
  flash_price: number;
  flash_stock: number;
  products?: Product | null;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  order_id: string | null;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
  // joined
  profiles?: Pick<Profile, "id" | "name" | "avatar_url"> | null;
  products?: Pick<Product, "id" | "name" | "slug"> | null;
}

export interface StoreSettings {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface SeoSettings {
  meta_pixel_id: string | null;
  ga4_measurement_id: string | null;
  default_title: string | null;
  default_description: string | null;
  default_keywords: string | null;
  robots_txt_content: string | null;
  sitemap_xml_content: string | null;
}

// ─── Utility types ────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductFilters {
  categorySlug?: string;
  subCategory?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isFlashSale?: boolean;
  sort?: "newest" | "popular" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalCustomers: number;
  customersChange: number;
  totalProductsSold: number;
  productsSoldChange: number;
  recentOrders: Order[];
  topProducts: { product_name: string; total_qty: number; total_revenue: number }[];
  salesChart: { date: string; total: number }[];
  categoryChart: { name: string; value: number }[];
  ordersByStatus: Record<OrderStatus, number>;
}
