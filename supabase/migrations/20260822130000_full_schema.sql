

-- ============================================================================
-- HERA SKINCARE MARKETPLACE — FULL SCHEMA (INIT + SEED)
-- ============================================================================
-- SATU-SATUNYA file migration project ini. Hasil konsolidasi kronologis
-- 7 migration lama (T-12, 2026-08-22) — merepresentasikan DB live:
--   1. full_schema      : tabel, RLS dasar, fungsi, trigger, storage
--   2. seed_data        : kategori, produk, varian, voucher, flash sale
--   3. notifications    : tabel + policy notifikasi
--   4. fix_security     : perbaikan RLS & SECURITY DEFINER
--   5. additional_fixes : constraint & index tambahan
--   6. voucher_code     : kolom orders.voucher_code + index
--   7. hardening        : revoke EXECUTE anon/PUBLIC + search_path fix
-- Statement belakangan menimpa yang awal -> hasil akhir = state live.
-- Terapkan via Supabase MCP (apply_migration) — DILARANG pakai supabase CLI (DB-SYNC-2).
-- Verifikasi live: list_tables / execute_sql / get_advisors.
-- ============================================================================


-- ============================================================
-- [BAGIAN] 20260621000001_full_schema.sql
-- ============================================================

-- =============================================
-- HERA SKINCARE MARKETPLACE — Full Schema
-- Consolidated migration: tables, RLS, functions, triggers, storage, seed
-- Includes all fixes from migrations 2–6 merged into a single file
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  email text,
  phone text,
  role text not null default 'customer' check (role in ('super_admin', 'admin', 'operator', 'finance', 'customer')),
  status text not null default 'aktif' check (status in ('aktif', 'nonaktif', 'diblokir')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper function to check roles while bypassing RLS to avoid infinite recursion
create or replace function public.has_role(user_id uuid, roles text[])
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id
    and role = any(roles)
  );
end;
$$;

alter table public.profiles enable row level security;

create policy "Profiles are viewable by admins" on public.profiles
  for select to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']));

create policy "Users can view own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- T-18: User hanya boleh mengubah kolom aman (name/phone/avatar_url/updated_at).
-- role/status/email tidak bisa diubah sendiri (subquery membaca nilai lama).
create policy "Users can update own profile (safe fields)" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
    and status = (select status from public.profiles where id = auth.uid())
    and email is not distinct from (select email from public.profiles where id = auth.uid())
  );

-- T-18: Admin (super_admin/admin) boleh update penuh (blokir customer, ubah role)
create policy "Admins can update profiles" on public.profiles
  for update to authenticated
  using (public.has_role(auth.uid(), array['super_admin'::text, 'admin'::text]))
  with check (public.has_role(auth.uid(), array['super_admin'::text, 'admin'::text]));

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- CATEGORIES (hierarchical via parent_id)
-- =============================================
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  icon text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Categories are publicly viewable" on public.categories
  for select to authenticated, anon using (true);

create policy "Admins can manage categories" on public.categories
  for all to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin']));

-- =============================================
-- PRODUCTS
-- =============================================
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sku text unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  brand text,
  price numeric not null default 0 check (price >= 0),
  discount_price numeric check (discount_price >= 0),
  stock int not null default 0 check (stock >= 0),
  unit text default 'pcs',
  weight_gram int,
  dimension_p numeric, dimension_l numeric, dimension_t numeric,
  is_active boolean default true,
  meta_title text, meta_description text, slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_is_active on public.products(is_active);

alter table public.products enable row level security;

create policy "Products are publicly viewable" on public.products
  for select to authenticated, anon using (true);

create policy "Admins can manage products" on public.products
  for all to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator']));

-- =============================================
-- PRODUCT IMAGES
-- =============================================
create table if not exists public.product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  is_primary boolean default false,
  sort_order int default 0
);

create index if not exists idx_product_images_product_id on public.product_images(product_id);

alter table public.product_images enable row level security;
create policy "Product images are publicly viewable" on public.product_images for select to authenticated, anon using (true);
create policy "Admins can manage product images" on public.product_images for all to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator']));

-- =============================================
-- PRODUCT VARIANTS
-- =============================================
create table if not exists public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price numeric not null default 0,
  stock int not null default 0,
  sku text
);

create index if not exists idx_product_variants_product_id on public.product_variants(product_id);

-- CHECK constraints for variants
alter table public.product_variants drop constraint if exists product_variants_price_check;
alter table public.product_variants add constraint product_variants_price_check check (price >= 0);
alter table public.product_variants drop constraint if exists product_variants_stock_check;
alter table public.product_variants add constraint product_variants_stock_check check (stock >= 0);

alter table public.product_variants enable row level security;
create policy "Variants are publicly viewable" on public.product_variants for select to authenticated, anon using (true);
create policy "Admins can manage variants" on public.product_variants for all to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator']));

-- =============================================
-- ORDERS
-- =============================================
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'menunggu' check (status in ('menunggu', 'diproses', 'dikirim', 'selesai', 'dibatalkan')),
  payment_method text,
  payment_status text not null default 'belum_bayar' check (payment_status in ('belum_bayar', 'lunas', 'gagal')),
  shipping_method text,
  tracking_number text,
  shipping_address jsonb,
  subtotal numeric not null default 0,
  shipping_cost numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null default 0,
  notes text,
  voucher_code text,
  xendit_invoice_id text,
  xendit_invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_voucher_code on public.orders(voucher_code);

alter table public.orders enable row level security;

create policy "Admins can view all orders" on public.orders
  for select to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']));

create policy "Users can view own orders" on public.orders
  for select to authenticated
  using (user_id = auth.uid());

create policy "Admins can update orders" on public.orders
  for update to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator']));

create policy "Authenticated users can create orders" on public.orders
  for insert to authenticated
  with check (user_id = auth.uid());

-- Auto increment voucher usage count (atomic) — T-38: DIHAPUS,
-- digantikan RPC redeem_voucher (T-21, quota + per-user limit).
-- ============================================================

-- Auto-generate order number with HS prefix
create or replace function public.generate_order_number()
returns text language plpgsql as $$
declare
  v_number text;
  v_count int;
begin
  loop
    v_number := 'HS' || to_char(now(), 'YYMM') || lpad(floor(random() * 99999)::text, 5, '0');
    select count(*) into v_count from public.orders where order_number = v_number;
    exit when v_count = 0;
  end loop;
  return v_number;
end;
$$;

-- Atomic stock decrement/increment functions
create or replace function public.decrement_product_stock(pid uuid, qty int)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.products set stock = stock - qty, updated_at = now()
  where id = pid and stock >= qty;
  return found;
end;
$$;

create or replace function public.decrement_variant_stock(vid uuid, qty int)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.product_variants set stock = stock - qty
  where id = vid and stock >= qty;
  return found;
end;
$$;

create or replace function public.increment_product_stock(pid uuid, qty int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.products set stock = stock + qty, updated_at = now()
  where id = pid;
end;
$$;

create or replace function public.increment_variant_stock(vid uuid, qty int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.product_variants set stock = stock + qty
  where id = vid;
end;
$$;

-- =============================================
-- ORDER ITEMS
-- =============================================
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  product_sku text,
  qty int not null default 1,
  price numeric not null,
  subtotal numeric not null
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);
create index if not exists idx_order_items_variant_id on public.order_items(variant_id);

-- CHECK constraints
alter table public.order_items drop constraint if exists order_items_qty_check;
alter table public.order_items add constraint order_items_qty_check check (qty > 0);
alter table public.order_items drop constraint if exists order_items_price_check;
alter table public.order_items add constraint order_items_price_check check (price >= 0);

alter table public.order_items enable row level security;
create policy "Admins can view order items" on public.order_items for select to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']));
create policy "Users can view own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders where id = order_id and user_id = auth.uid()));
create policy "Users can insert own order items" on public.order_items for insert to authenticated
  with check (
    exists (
      select 1 from public.orders
      where id = order_id and user_id = auth.uid()
    )
    or
    public.has_role(auth.uid(), array['super_admin', 'admin', 'operator'])
  );

-- =============================================
-- SHIPPING ADDRESSES
-- =============================================
create table if not exists public.shipping_addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Rumah',
  name text not null,
  phone text not null,
  address text not null,
  city text not null,
  province text not null,
  postal_code text not null,
  is_default boolean default false,
  destination_area_id text,
  destination_area_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipping_addresses_user_id on public.shipping_addresses(user_id);

alter table public.shipping_addresses enable row level security;

create policy "Users can view own addresses"
  on public.shipping_addresses for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own addresses"
  on public.shipping_addresses for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own addresses"
  on public.shipping_addresses for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own addresses"
  on public.shipping_addresses for delete to authenticated
  using (user_id = auth.uid());

create policy "Admins can view all addresses"
  on public.shipping_addresses for select to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator']));

-- =============================================
-- VOUCHERS
-- =============================================
create table if not exists public.vouchers (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  type text not null check (type in ('percent', 'nominal')),
  value numeric not null,
  min_purchase numeric default 0,
  quota int,
  used_count int default 0,
  per_user_limit int default 1,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

alter table public.vouchers enable row level security;
create policy "Active vouchers viewable by authenticated" on public.vouchers
  for select to authenticated using (is_active = true);
create policy "Admins can manage vouchers" on public.vouchers for all to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin']));

-- =============================================
-- FLASH SALES
-- =============================================
create table if not exists public.flash_sales (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  banner_url text,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists public.flash_sale_products (
  id uuid primary key default uuid_generate_v4(),
  flash_sale_id uuid not null references public.flash_sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  flash_price numeric not null,
  flash_stock int not null default 0
);

create index if not exists idx_flash_sale_products_sale_id on public.flash_sale_products(flash_sale_id);
create index if not exists idx_flash_sale_products_product_id on public.flash_sale_products(product_id);

-- CHECK constraints for flash sale products
alter table public.flash_sale_products drop constraint if exists flash_sale_products_price_check;
alter table public.flash_sale_products add constraint flash_sale_products_price_check check (flash_price >= 0);
alter table public.flash_sale_products drop constraint if exists flash_sale_products_stock_check;
alter table public.flash_sale_products add constraint flash_sale_products_stock_check check (flash_stock >= 0);

alter table public.flash_sales enable row level security;
create policy "Flash sales publicly viewable" on public.flash_sales for select to authenticated, anon using (true);
create policy "Admins manage flash sales" on public.flash_sales for all to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin']));

alter table public.flash_sale_products enable row level security;
create policy "Flash sale products publicly viewable" on public.flash_sale_products for select to authenticated, anon using (true);
create policy "Admins manage flash sale products" on public.flash_sale_products for all to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin']));

-- =============================================
-- REVIEWS
-- =============================================
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_visible boolean default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_reviews_user_id on public.reviews(user_id);

alter table public.reviews enable row level security;
create policy "Visible reviews publicly viewable" on public.reviews
  for select to authenticated, anon using (is_visible = true);
create policy "Admins can view all reviews" on public.reviews for select to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin']));
create policy "Admins can manage reviews" on public.reviews for update to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin']));
create policy "Users can create reviews" on public.reviews for insert to authenticated
  with check (user_id = auth.uid());

-- =============================================
-- NOTIFICATIONS
-- =============================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'info' check (type in ('order', 'payment', 'review', 'system', 'info')),
  title text not null,
  message text,
  link text,
  is_read boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(is_read) where is_read = false;

alter table public.notifications enable row level security;

create policy "Admins can view all notifications"
  on public.notifications for select to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']));

create policy "Admins can update notifications"
  on public.notifications for update to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']));

create policy "Admins can insert notifications"
  on public.notifications for insert to authenticated
  with check (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']));

create policy "Users can view own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own notifications"
  on public.notifications for delete to authenticated
  using (user_id = auth.uid());

create policy "Admins can delete notifications"
  on public.notifications for delete to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin']));

-- Auto-create notification when order status changes
create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_title text;
  v_message text;
  v_type text := 'order';
begin
  if NEW.status = 'diproses' then
    v_title := 'Pesanan Diproses';
    v_message := 'Pesanan ' || NEW.order_number || ' sedang diproses.';
  elsif NEW.status = 'dikirim' then
    v_title := 'Pesanan Dikirim';
    v_message := 'Pesanan ' || NEW.order_number || ' telah dikirim.' || case when NEW.tracking_number is not null then ' Resi: ' || NEW.tracking_number else '' end;
  elsif NEW.status = 'selesai' then
    v_title := 'Pesanan Selesai';
    v_message := 'Pesanan ' || NEW.order_number || ' telah selesai. Terima kasih!';
  elsif NEW.status = 'dibatalkan' then
    v_title := 'Pesanan Dibatalkan';
    v_message := 'Pesanan ' || NEW.order_number || ' telah dibatalkan.';
  else
    return NEW;
  end if;

  -- Notify the order owner
  if NEW.user_id is not null then
    insert into public.notifications (user_id, type, title, message, link)
    values (NEW.user_id, 'order', v_title, v_message, '/profil?tab=pesanan');
  end if;

  -- Notify all admins
  insert into public.notifications (user_id, type, title, message, link)
  select p.id, 'order', 'Pesanan ' || NEW.status, 'Pesanan ' || NEW.order_number || ' status: ' || NEW.status, '/admin/pesanan'
  from public.profiles p
  where p.role in ('super_admin', 'admin', 'operator')
    and p.id != NEW.user_id;

  return NEW;
end;
$$;

drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
  after update of status on public.orders
  for each row
  when (OLD.status is distinct from NEW.status)
  execute procedure public.handle_order_status_change();

-- =============================================
-- STORE SETTINGS (key-value)
-- =============================================
-- ============================================================
-- PRODUCT Q&A (T-06.1)
-- ============================================================

create table if not exists public.product_qna (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text,
  answered_at timestamptz,
  helpful_count int not null default 0 check (helpful_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_product_qna_product on public.product_qna(product_id);

alter table public.product_qna enable row level security;

create policy "QnA publicly viewable"
  on public.product_qna for select using (true);

create policy "Authenticated users can ask questions"
  on public.product_qna for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Admins can answer questions"
  on public.product_qna for update to authenticated
  using (
    public.has_role(auth.uid(), array['super_admin'::text, 'admin'::text, 'operator'::text])
  )
  with check (
    public.has_role(auth.uid(), array['super_admin'::text, 'admin'::text, 'operator'::text])
  );

create table if not exists public.store_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;
create policy "Settings publicly readable" on public.store_settings for select to authenticated, anon using (true);
create policy "Admins can manage settings" on public.store_settings for all to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin']));

-- =============================================
-- STORAGE: Product Images Bucket
-- =============================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, '{image/jpeg,image/png,image/webp}')
on conflict (id) do update set public = true;

create policy "Admin can upload product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = any(array['super_admin', 'admin', 'operator'])
  )
);

create policy "Public can view product images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');

create policy "Admin can delete product images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = any(array['super_admin', 'admin', 'operator'])
  )
);

-- =============================================
-- SEED DATA
-- =============================================

insert into public.categories (name, slug, icon, sort_order) values
  ('Perawatan Tubuh', 'perawatan-tubuh', '🧴', 1),
  ('Perawatan Rumah', 'perawatan-rumah', '🧹', 2),
  ('Kesehatan', 'kesehatan', '💊', 3),
  ('Kecantikan', 'kecantikan', '💄', 4),
  ('Elektronik', 'elektronik', '🔌', 5),
  ('Lainnya', 'lainnya', '📦', 6)
on conflict (slug) do nothing;

WITH main_cats AS (SELECT id, slug FROM public.categories WHERE parent_id IS NULL)
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, main_cats.id, sub.sort_order
FROM main_cats
CROSS JOIN (VALUES
  ('perawatan-tubuh', 'Sabun Mandi', 'sabun-mandi', '🧼', 1),
  ('perawatan-tubuh', 'Shampoo', 'shampoo', '🧴', 2),
  ('perawatan-tubuh', 'Kondisioner', 'kondisioner', '💆', 3),
  ('perawatan-tubuh', 'Losion', 'losion', '🧴', 4),
  ('perawatan-tubuh', 'Parfum', 'parfum', '✨', 5),
  ('perawatan-tubuh', 'Deodoran', 'deodoran', '💨', 6),
  ('perawatan-rumah', 'Pembersih Lantai', 'pembersih-lantai', '🧹', 1),
  ('perawatan-rumah', 'Pembersih Dapur', 'pembersih-dapur', '🍽️', 2),
  ('perawatan-rumah', 'Pembersih Kaca', 'pembersih-kaca', '🪟', 3),
  ('perawatan-rumah', 'Pewangi', 'pewangi', '🌸', 4),
  ('perawatan-rumah', 'Deterjen', 'deterjen', '👕', 5),
  ('perawatan-rumah', 'Pel & Sapu', 'pel-sapu', '🧹', 6),
  ('kesehatan', 'Vitamin', 'vitamin', '💊', 1),
  ('kesehatan', 'Suplemen', 'suplemen', '🌿', 2),
  ('kesehatan', 'P3K', 'p3k', '🩹', 3),
  ('kesehatan', 'Masker', 'masker', '😷', 4),
  ('kesehatan', 'Hand Sanitizer', 'hand-sanitizer', '🧼', 5),
  ('kesehatan', 'Termometer', 'termometer', '🌡️', 6),
  ('kecantikan', 'Skincare', 'skincare', '🧴', 1),
  ('kecantikan', 'Sunscreen', 'sunscreen', '☀️', 2),
  ('kecantikan', 'Serum', 'serum', '🧪', 3),
  ('kecantikan', 'Pelembap', 'pelembap', '🧴', 4),
  ('kecantikan', 'Masker Wajah', 'masker-wajah', '🎭', 5),
  ('kecantikan', 'Pembersih Wajah', 'pembersih-wajah', '🧼', 6),
  ('elektronik', 'Charger', 'charger', '🔌', 1),
  ('elektronik', 'Kabel', 'kabel', '🔌', 2),
  ('elektronik', 'Power Bank', 'power-bank', '🔋', 3),
  ('elektronik', 'Speaker', 'speaker', '🔊', 4),
  ('elektronik', 'Lampu', 'lampu', '💡', 5),
  ('elektronik', 'Baterai', 'baterai', '🔋', 6),
  ('lainnya', 'Alat Tulis', 'alat-tulis', '✏️', 1),
  ('lainnya', 'Perlengkapan Bayi', 'perlengkapan-bayi', '🍼', 2),
  ('lainnya', 'Hewan Peliharaan', 'hewan-peliharaan', '🐱', 3),
  ('lainnya', 'Olahraga', 'olahraga', '⚽', 4)
) AS sub(parent_slug, name, slug, icon, sort_order)
WHERE main_cats.slug = sub.parent_slug
ON CONFLICT (slug) DO NOTHING;

WITH sub_cats AS (SELECT id, slug FROM public.categories WHERE parent_id IS NOT NULL)
INSERT INTO public.products (name, slug, sku, description, category_id, brand, price, discount_price, stock, unit, weight_gram, is_active)
SELECT p.name, p.slug, p.sku, p.description, sub_cats.id, p.brand, p.price, p.discount_price, p.stock, p.unit, p.weight_gram, true
FROM sub_cats, (VALUES
  ('sabun-mandi', 'Sabun Cair Hera Skincare Premium', 'sabun-cair-hera-skincare', 'SAB-001',
   'Sabun cair premium dengan formula lembut yang menjaga kelembapan kulit. Mengandung aloe vera dan vitamin E.',
   'Hera Skincare', 31000, 25000, 150, 'botol', 520),
  ('pembersih-lantai', 'Pembersih Lantai Super Harum', 'pembersih-lantai-harum', 'PLH-001',
   'Pembersih lantai dengan formula anti bakteri yang ampuh membersihkan noda membandel.', 'Hera Skincare', 35000, 28000, 200, 'botol', 1050),
  ('hand-sanitizer', 'Hand Sanitizer Antibacterial 500ml', 'hand-sanitizer-500ml', 'HAN-001',
   'Hand sanitizer dengan kandungan alkohol 70% yang efektif membunuh 99.9% kuman dan bakteri.', 'Hera Skincare', 25000, 18000, 300, 'botol', 520),
  ('pembersih-dapur', 'Sabun Cuci Piring Anti Lemak 800ml', 'sabun-cuci-piring', 'SCP-001',
   'Sabun cuci piring dengan formula super konsentrat yang ampuh membersihkan lemak.', 'Hera Skincare', 20000, 16000, 180, 'botol', 820),
  ('pewangi', 'Pewangi Ruangan Premium Aroma Spa', 'pewangi-ruangan-premium', 'PWR-001',
   'Pewangi ruangan premium dengan aroma spa yang menenangkan. Tahan lama hingga 30 hari.', 'Hera Skincare', 28000, 22000, 120, 'botol', 200),
  ('kondisioner', 'Kondisioner Rambut Silk Smooth 350ml', 'kondisioner-rambut', 'KRB-001',
   'Kondisioner rambut dengan protein sutra yang membuat rambut lembut, berkilau, dan mudah diatur.', 'Hera Skincare', 35000, NULL, 95, 'botol', 380),
  ('pembersih-kaca', 'Pembersih Kaca & Cermin Anti Streak', 'pembersih-kaca', 'PKC-001',
   'Pembersih kaca formula anti bekas (streak-free) yang membuat kaca dan cermin kinclong.', 'Hera Skincare', 19000, NULL, 210, 'botol', 520),
  ('losion', 'Losion Tubuh Aloe Vera & Vitamin E', 'losion-tubuh-aloe', 'LTA-001',
   'Losion tubuh dengan kandungan aloe vera segar dan vitamin E yang melembapkan dan melembutkan kulit.', 'Hera Skincare', 32000, NULL, 130, 'botol', 270),
  ('vitamin', 'Vitamin C 500mg Effervescent 20 Tablet', 'vitamin-c-500mg', 'VIT-001',
   'Suplemen Vitamin C 500mg dalam bentuk effervescent yang mudah dikonsumsi.', 'Hera Skincare', 45000, NULL, 450, 'box', 100),
  ('deterjen', 'Deterjen Pakaian Bubuk 1kg Anti Kusam', 'deterjen-pakaian', 'DET-001',
   'Deterjen pakaian bubuk dengan formula enzim aktif yang ampuh mengangkat noda membandel.', 'Hera Skincare', 38000, NULL, 280, 'pak', 1050),
  ('sunscreen', 'Sunscreen SPF 50+ PA++++ Daily Protection', 'sunscreen-spf50', 'SUN-001',
   'Sunscreen ringan SPF 50+ PA++++ dengan formula water-resistant.', 'Hera Skincare', 55000, NULL, 85, 'tube', 80),
  ('suplemen', 'Minyak Kayu Putih Murni 60ml', 'minyak-kayu-putih', 'MKP-001',
   'Minyak kayu putih murni 100% alami tanpa campuran bahan kimia.', 'Hera Skincare', 28000, NULL, 320, 'botol', 80)
) AS p(cat_slug, name, slug, sku, description, brand, price, discount_price, stock, unit, weight_gram)
WHERE sub_cats.slug = p.cat_slug
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_variants (product_id, name, price, stock, sku)
SELECT p.id, v.name, v.price, v.stock, v.sku
FROM public.products p, (VALUES
  ('sabun-cair-hera-skincare', 'Fresh', 25000, 50, 'SAB-001-F'),
  ('sabun-cair-hera-skincare', 'Lemon', 25000, 60, 'SAB-001-L'),
  ('sabun-cair-hera-skincare', 'Rose', 25000, 40, 'SAB-001-R'),
  ('pembersih-lantai-harum', 'Lavender', 28000, 80, 'PLH-001-LA'),
  ('pembersih-lantai-harum', 'Citrus', 28000, 70, 'PLH-001-C'),
  ('pembersih-lantai-harum', 'Pine', 28000, 50, 'PLH-001-P'),
  ('pewangi-ruangan-premium', 'Lavender', 22000, 40, 'PWR-001-LA'),
  ('pewangi-ruangan-premium', 'Jasmine', 22000, 50, 'PWR-001-J'),
  ('pewangi-ruangan-premium', 'Ocean', 22000, 30, 'PWR-001-O'),
  ('vitamin-c-500mg', 'Jeruk', 45000, 150, 'VIT-001-J'),
  ('vitamin-c-500mg', 'Lemon', 45000, 150, 'VIT-001-L'),
  ('vitamin-c-500mg', 'Stroberi', 45000, 150, 'VIT-001-S')
) AS v(product_slug, name, price, stock, sku)
WHERE p.slug = v.product_slug
ON CONFLICT DO NOTHING;

INSERT INTO public.vouchers (code, type, value, min_purchase, quota, per_user_limit, ends_at, is_active)
VALUES
  ('HERA15', 'percent', 15, 50000, 500, 1, NOW() + INTERVAL '30 days', true),
  ('HERA10', 'percent', 10, 30000, 1000, 2, NOW() + INTERVAL '60 days', true),
  ('GRATIS5K', 'nominal', 5000, 25000, 200, 1, NOW() + INTERVAL '14 days', true),
  ('NEWUSER20', 'percent', 20, 100000, 100, 1, NOW() + INTERVAL '90 days', true),
  ('BELANJA50K', 'nominal', 10000, 50000, NULL, 3, NOW() + INTERVAL '30 days', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.flash_sales (name, starts_at, ends_at, is_active)
VALUES ('Flash Sale Hari Ini', NOW(), NOW() + INTERVAL '3 hours', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.flash_sale_products (flash_sale_id, product_id, flash_price, flash_stock)
SELECT fs.id, p.id, p.discount_price, 50
FROM public.flash_sales fs, public.products p
WHERE fs.name = 'Flash Sale Hari Ini'
  AND p.discount_price IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.store_settings (key, value) VALUES
  ('store_info', '{"name": "Hera Skincare", "email": "info@heraskincare.com", "phone": "+6281234567890", "city": "Jakarta Selatan", "description": "Marketplace produk rumah tangga premium.", "address": "Alamat Gudang Hera Skincare", "operational_hours": {"start": "08:00", "end": "21:00", "days": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]}, "social_media": {"instagram": "", "tiktok": "", "facebook": ""}}'::jsonb),
  ('shipping', '{"free_shipping": true, "free_shipping_min": 100000, "couriers": ["JNE", "J&T Express", "SiCepat", "Gosend", "Anteraja"], "origin_city": "Jakarta Selatan", "origin_area_id": "", "origin_area_label": ""}'::jsonb),
  ('payment', '{"methods": ["Transfer Bank (BCA, Mandiri, BRI)", "GoPay", "OVO", "Dana", "ShopeePay", "Virtual Account", "COD (Bayar di Tempat)"], "payment_timeout_hours": 24, "bank_account": {"bank": "BCA", "owner": "Hera Skincare", "number": "1234567890"}}'::jsonb),
  ('notifications', '{"email": {"Pesanan baru masuk": true, "Pembayaran diterima": true, "Stok produk menipis (< 10 item)": true, "Ulasan baru masuk": true}, "wa": {"Pesanan baru masuk": true, "Pembayaran diterima": true, "Stok produk menipis (< 10 item)": false, "Ulasan baru masuk": false}}'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- [BAGIAN] 20260621000002_seed_data.sql
-- ============================================================

-- =============================================
-- HERA STORE MARKETPLACE — Seed Data
-- Consolidated seed: categories, products, variants, vouchers, flash sales, settings
-- =============================================

-- =============================================
-- 1. MAIN CATEGORIES (6 parent categories)
-- =============================================
insert into public.categories (name, slug, icon, sort_order) values
  ('Perawatan Tubuh', 'perawatan-tubuh', '🧴', 1),
  ('Perawatan Rumah', 'perawatan-rumah', '🧹', 2),
  ('Kesehatan', 'kesehatan', '💊', 3),
  ('Kecantikan', 'kecantikan', '💄', 4),
  ('Elektronik', 'elektronik', '🔌', 5),
  ('Lainnya', 'lainnya', '📦', 6)
on conflict (slug) do nothing;

-- =============================================
-- 2. SUBCATEGORIES (6 per parent = 36 subcategories)
-- =============================================
-- Perawatan Tubuh subcategories
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, parent.id, sub.sort_order
FROM public.categories parent
CROSS JOIN (VALUES
  ('Sabun Mandi', 'sabun-mandi', '🧼', 1), ('Shampoo', 'shampoo', '🧴', 2),
  ('Kondisioner', 'kondisioner', '💆', 3), ('Losion', 'losion', '🧴', 4),
  ('Parfum', 'parfum', '✨', 5), ('Deodoran', 'deodoran', '💨', 6)
) AS sub(name, slug, icon, sort_order)
WHERE parent.slug = 'perawatan-tubuh'
ON CONFLICT (slug) DO NOTHING;

-- Perawatan Rumah subcategories
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, parent.id, sub.sort_order
FROM public.categories parent
CROSS JOIN (VALUES
  ('Pembersih Lantai', 'pembersih-lantai', '🧹', 1), ('Pembersih Dapur', 'pembersih-dapur', '🍽️', 2),
  ('Pembersih Kaca', 'pembersih-kaca', '🪟', 3), ('Pewangi', 'pewangi', '🌸', 4),
  ('Deterjen', 'deterjen', '👕', 5), ('Pel & Sapu', 'pel-sapu', '🧹', 6)
) AS sub(name, slug, icon, sort_order)
WHERE parent.slug = 'perawatan-rumah'
ON CONFLICT (slug) DO NOTHING;

-- Kesehatan subcategories
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, parent.id, sub.sort_order
FROM public.categories parent
CROSS JOIN (VALUES
  ('Vitamin', 'vitamin', '💊', 1), ('Suplemen', 'suplemen', '🌿', 2),
  ('P3K', 'p3k', '🩹', 3), ('Masker', 'masker', '😷', 4),
  ('Hand Sanitizer', 'hand-sanitizer', '🧼', 5), ('Termometer', 'termometer', '🌡️', 6)
) AS sub(name, slug, icon, sort_order)
WHERE parent.slug = 'kesehatan'
ON CONFLICT (slug) DO NOTHING;

-- Kecantikan subcategories
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, parent.id, sub.sort_order
FROM public.categories parent
CROSS JOIN (VALUES
  ('Skincare', 'skincare', '🧴', 1), ('Sunscreen', 'sunscreen', '☀️', 2),
  ('Serum', 'serum', '🧪', 3), ('Pelembap', 'pelembap', '🧴', 4),
  ('Masker Wajah', 'masker-wajah', '🎭', 5), ('Pembersih Wajah', 'pembersih-wajah', '🧼', 6)
) AS sub(name, slug, icon, sort_order)
WHERE parent.slug = 'kecantikan'
ON CONFLICT (slug) DO NOTHING;

-- Elektronik subcategories
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, parent.id, sub.sort_order
FROM public.categories parent
CROSS JOIN (VALUES
  ('Charger', 'charger', '🔌', 1), ('Kabel', 'kabel', '🔌', 2),
  ('Power Bank', 'power-bank', '🔋', 3), ('Speaker', 'speaker', '🔊', 4),
  ('Lampu', 'lampu', '💡', 5), ('Baterai', 'baterai', '🔋', 6)
) AS sub(name, slug, icon, sort_order)
WHERE parent.slug = 'elektronik'
ON CONFLICT (slug) DO NOTHING;

-- Lainnya subcategories
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, parent.id, sub.sort_order
FROM public.categories parent
CROSS JOIN (VALUES
  ('Alat Tulis', 'alat-tulis', '✏️', 1), ('Perlengkapan Bayi', 'perlengkapan-bayi', '🍼', 2),
  ('Hewan Peliharaan', 'hewan-peliharaan', '🐱', 3), ('Olahraga', 'olahraga', '⚽', 4)
) AS sub(name, slug, icon, sort_order)
WHERE parent.slug = 'lainnya'
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 3. PRODUCTS (12 seed products with correct prices)
-- =============================================
WITH cat AS (SELECT id, slug FROM public.categories)
INSERT INTO public.products (name, slug, sku, description, category_id, brand, price, discount_price, stock, unit, weight_gram, is_active)
SELECT p.name, p.slug, p.sku, p.description, cat.id, p.brand, p.price, p.discount_price, p.stock, p.unit, p.weight_gram, true
FROM cat, (VALUES
  ('Sabun Cair Hera Store Premium', 'sabun-cair-hera-store', 'SAB-001',
   'Sabun cair premium dengan formula lembut yang menjaga kelembapan kulit. Mengandung aloe vera dan vitamin E untuk kulit sehat dan lembut sepanjang hari.',
   'perawatan-tubuh', 'Hera Store', 31000, 25000, 150, 'botol', 520),

  ('Pembersih Lantai Super Harum', 'pembersih-lantai-harum', 'PLH-001',
   'Pembersih lantai dengan formula anti bakteri yang ampuh membersihkan noda membandel. Mengharumkan ruangan dengan aroma segar tahan lama.',
   'perawatan-rumah', 'Hera Store', 35000, 28000, 200, 'botol', 1050),

  ('Hand Sanitizer Antibacterial 500ml', 'hand-sanitizer-500ml', 'HAN-001',
   'Hand sanitizer dengan kandungan alkohol 70% yang efektif membunuh 99.9% kuman dan bakteri.',
   'kesehatan', 'Hera Store', 25000, 18000, 300, 'botol', 520),

  ('Sabun Cuci Piring Anti Lemak 800ml', 'sabun-cuci-piring', 'SCP-001',
   'Sabun cuci piring dengan formula super konsentrat yang ampuh membersihkan lemak dan sisa makanan.',
   'perawatan-rumah', 'Hera Store', 20000, 16000, 180, 'botol', 820),

  ('Pewangi Ruangan Premium Aroma Spa', 'pewangi-ruangan-premium', 'PWR-001',
   'Pewangi ruangan premium dengan aroma spa yang menenangkan. Tahan lama hingga 30 hari dengan teknologi slow release.',
   'perawatan-rumah', 'Hera Store', 28000, 22000, 120, 'botol', 200),

  ('Kondisioner Rambut Silk Smooth 350ml', 'kondisioner-rambut', 'KRB-001',
   'Kondisioner rambut dengan protein sutra yang membuat rambut lembut, berkilau, dan mudah diatur.',
   'perawatan-tubuh', 'Hera Store', 35000, NULL, 95, 'botol', 380),

  ('Pembersih Kaca & Cermin Anti Streak', 'pembersih-kaca', 'PKC-001',
   'Pembersih kaca formula anti bekas (streak-free) yang membuat kaca dan cermin kinclong tanpa meninggalkan bekas sapuan.',
   'perawatan-rumah', 'Hera Store', 19000, NULL, 210, 'botol', 520),

  ('Losion Tubuh Aloe Vera & Vitamin E', 'losion-tubuh-aloe', 'LTA-001',
   'Losion tubuh dengan kandungan aloe vera segar dan vitamin E yang melembapkan dan melembutkan kulit.',
   'perawatan-tubuh', 'Hera Store', 32000, NULL, 130, 'botol', 270),

  ('Vitamin C 500mg Effervescent 20 Tablet', 'vitamin-c-500mg', 'VIT-001',
   'Suplemen Vitamin C 500mg dalam bentuk effervescent yang mudah dikonsumsi. Mendukung daya tahan tubuh dan kesehatan kulit.',
   'kesehatan', 'Hera Store', 45000, NULL, 450, 'box', 100),

  ('Deterjen Pakaian Bubuk 1kg Anti Kusam', 'deterjen-pakaian', 'DET-001',
   'Deterjen pakaian bubuk dengan formula enzim aktif yang ampuh mengangkat noda membandel tanpa merusak serat kain.',
   'perawatan-rumah', 'Hera Store', 38000, NULL, 280, 'pak', 1050),

  ('Sunscreen SPF 50+ PA++++ Daily Protection', 'sunscreen-spf50', 'SUN-001',
   'Sunscreen ringan SPF 50+ PA++++ dengan formula water-resistant yang melindungi dari sinar UVA dan UVB.',
   'kecantikan', 'Hera Store', 55000, NULL, 85, 'tube', 80),

  ('Minyak Kayu Putih Murni 60ml', 'minyak-kayu-putih', 'MKP-001',
   'Minyak kayu putih murni 100% alami tanpa campuran bahan kimia. Membantu meredakan masuk angin, mual, dan pegal-pegal.',
   'kesehatan', 'Hera Store', 28000, NULL, 320, 'botol', 80)
) AS p(name, slug, sku, description, category_slug, brand, price, discount_price, stock, unit, weight_gram)
WHERE cat.slug = p.category_slug
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 4. ASSIGN SUBCATEGORIES TO PRODUCTS
-- =============================================
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'sabun-mandi') WHERE slug = 'sabun-cair-hera-store';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'pembersih-lantai') WHERE slug = 'pembersih-lantai-harum';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'hand-sanitizer') WHERE slug = 'hand-sanitizer-500ml';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'pembersih-dapur') WHERE slug = 'sabun-cuci-piring';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'pewangi') WHERE slug = 'pewangi-ruangan-premium';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'kondisioner') WHERE slug = 'kondisioner-rambut';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'pembersih-kaca') WHERE slug = 'pembersih-kaca';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'losion') WHERE slug = 'losion-tubuh-aloe';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'vitamin') WHERE slug = 'vitamin-c-500mg';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'deterjen') WHERE slug = 'deterjen-pakaian';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'sunscreen') WHERE slug = 'sunscreen-spf50';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'suplemen') WHERE slug = 'minyak-kayu-putih';

-- =============================================
-- 5. PRODUCT VARIANTS (12 variants across 4 products)
-- =============================================
INSERT INTO public.product_variants (product_id, name, price, stock, sku)
SELECT p.id, v.name, v.price, v.stock, v.sku
FROM public.products p, (VALUES
  ('sabun-cair-hera-store', 'Fresh', 25000, 50, 'SAB-001-F'),
  ('sabun-cair-hera-store', 'Lemon', 25000, 60, 'SAB-001-L'),
  ('sabun-cair-hera-store', 'Rose', 25000, 40, 'SAB-001-R'),
  ('pembersih-lantai-harum', 'Lavender', 28000, 80, 'PLH-001-LA'),
  ('pembersih-lantai-harum', 'Citrus', 28000, 70, 'PLH-001-C'),
  ('pembersih-lantai-harum', 'Pine', 28000, 50, 'PLH-001-P'),
  ('pewangi-ruangan-premium', 'Lavender', 22000, 40, 'PWR-001-LA'),
  ('pewangi-ruangan-premium', 'Jasmine', 22000, 50, 'PWR-001-J'),
  ('pewangi-ruangan-premium', 'Ocean', 22000, 30, 'PWR-001-O'),
  ('vitamin-c-500mg', 'Jeruk', 45000, 150, 'VIT-001-J'),
  ('vitamin-c-500mg', 'Lemon', 45000, 150, 'VIT-001-L'),
  ('vitamin-c-500mg', 'Stroberi', 45000, 150, 'VIT-001-S')
) AS v(product_slug, name, price, stock, sku)
WHERE p.slug = v.product_slug
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. VOUCHERS (5 active promo codes)
-- =============================================
INSERT INTO public.vouchers (code, type, value, min_purchase, quota, per_user_limit, ends_at, is_active)
VALUES
  ('HERA15', 'percent', 15, 50000, 500, 1, NOW() + INTERVAL '30 days', true),
  ('HERA10', 'percent', 10, 30000, 1000, 2, NOW() + INTERVAL '60 days', true),
  ('GRATIS5K', 'nominal', 5000, 25000, 200, 1, NOW() + INTERVAL '14 days', true),
  ('NEWUSER20', 'percent', 20, 100000, 100, 1, NOW() + INTERVAL '90 days', true),
  ('BELANJA50K', 'nominal', 10000, 50000, NULL, 3, NOW() + INTERVAL '30 days', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 7. FLASH SALE (active, 3-hour window)
-- =============================================
INSERT INTO public.flash_sales (name, starts_at, ends_at, is_active)
VALUES ('Flash Sale Hari Ini', NOW(), NOW() + INTERVAL '3 hours', true)
ON CONFLICT DO NOTHING;

-- Link discounted products to flash sale
INSERT INTO public.flash_sale_products (flash_sale_id, product_id, flash_price, flash_stock)
SELECT fs.id, p.id, p.discount_price, 50
FROM public.flash_sales fs, public.products p
WHERE fs.name = 'Flash Sale Hari Ini'
  AND p.discount_price IS NOT NULL
ON CONFLICT DO NOTHING;

-- =============================================
-- 8. STORE SETTINGS (default configuration)
-- =============================================
INSERT INTO public.store_settings (key, value) VALUES
  ('store_info', '{"name": "Hera Store", "email": "info@herastore.com", "phone": "+6281234567890", "city": "Jakarta Selatan", "description": "Marketplace produk rumah tangga premium.", "address": "Alamat Gudang Hera Store", "operational_hours": {"start": "08:00", "end": "21:00", "days": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]}, "social_media": {"instagram": "", "tiktok": "", "facebook": ""}}'::jsonb),
  ('shipping', '{"free_shipping": true, "free_shipping_min": 100000, "couriers": ["JNE", "J&T Express", "SiCepat", "Gosend", "Anteraja"], "origin_city": "Jakarta Selatan", "origin_area_id": "", "origin_area_label": ""}'::jsonb),
  ('payment', '{"methods": ["Transfer Bank (BCA, Mandiri, BRI)", "GoPay", "OVO", "Dana", "ShopeePay", "Virtual Account", "COD (Bayar di Tempat)"], "payment_timeout_hours": 24, "bank_account": {"bank": "BCA", "owner": "PT Hera Store", "number": "1234567890"}}'::jsonb),
  ('notifications', '{"email": {"Pesanan baru masuk": true, "Pembayaran diterima": true, "Stok produk menipis (< 10 item)": true, "Ulasan baru masuk": true}, "wa": {"Pesanan baru masuk": true, "Pembayaran diterima": true, "Stok produk menipis (< 10 item)": false, "Ulasan baru masuk": false}}'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- [BAGIAN] 20260621000003_notifications.sql
-- ============================================================

-- =============================================
-- HERA STORE — Notifications System
-- =============================================

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'info' check (type in ('order', 'payment', 'review', 'system', 'info')),
  title text not null,
  message text,
  link text,
  is_read boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(is_read) where is_read = false;

alter table public.notifications enable row level security;

-- T-77: drop before re-create — duplikat section kronologis (0001 sudah
-- membuat policy ini di baris 517-534); tanpa drop, init project baru gagal
-- (ERROR: policy already exists). Versi final = create terakhir = live DB.
drop policy if exists "Admins can view all notifications" on public.notifications;
create policy "Admins can view all notifications"
  on public.notifications for select to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']));

-- Admins can update notifications (mark read)
drop policy if exists "Admins can update notifications" on public.notifications;
create policy "Admins can update notifications"
  on public.notifications for update to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']))
  with check (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']));

-- Admins can insert notifications
drop policy if exists "Admins can insert notifications" on public.notifications;
create policy "Admins can insert notifications"
  on public.notifications for insert to authenticated
  with check (true);

-- Users can view own notifications
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

-- Users can update own notifications
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Auto-create notification when order status changes
create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_title text;
  v_message text;
  v_type text := 'order';
begin
  if NEW.status = 'diproses' then
    v_title := 'Pesanan Diproses';
    v_message := 'Pesanan ' || NEW.order_number || ' sedang diproses.';
  elsif NEW.status = 'dikirim' then
    v_title := 'Pesanan Dikirim';
    v_message := 'Pesanan ' || NEW.order_number || ' telah dikirim.' || case when NEW.tracking_number is not null then ' Resi: ' || NEW.tracking_number else '' end;
  elsif NEW.status = 'selesai' then
    v_title := 'Pesanan Selesai';
    v_message := 'Pesanan ' || NEW.order_number || ' telah selesai. Terima kasih!';
  elsif NEW.status = 'dibatalkan' then
    v_title := 'Pesanan Dibatalkan';
    v_message := 'Pesanan ' || NEW.order_number || ' telah dibatalkan.';
  else
    return NEW;
  end if;

  -- Notify the order owner
  if NEW.user_id is not null then
    insert into public.notifications (user_id, type, title, message, link)
    values (NEW.user_id, 'order', v_title, v_message, '/profil?tab=pesanan');
  end if;

  -- Notify all admins
  insert into public.notifications (user_id, type, title, message, link)
  select p.id, 'order', 'Pesanan ' || NEW.status, 'Pesanan ' || NEW.order_number || ' status: ' || NEW.status, '/admin/pesanan'
  from public.profiles p
  where p.role in ('super_admin', 'admin', 'operator')
    and p.id != NEW.user_id;

  return NEW;
end;
$$;

drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
  after update of status on public.orders
  for each row
  when (OLD.status is distinct from NEW.status)
  execute procedure public.handle_order_status_change();


-- ============================================================
-- [BAGIAN] 20260622000001_fix_security.sql
-- ============================================================

-- =============================================
-- HERA STORE — Security & Performance Fixes
-- Applied: 22 June 2026
-- Fixes: C6, C7, C8, C9, H5, H6, M12
-- =============================================

-- C6: Fix order_items insert policy — only allow order owner or admin
drop policy if exists "Auth users can insert order items" on public.order_items;
-- T-77: drop before re-create — policy ini sudah dibuat di baris 348
-- (duplikat section kronologis); versi final = create di sini = live DB.
drop policy if exists "Users can insert own order items" on public.order_items;

create policy "Users can insert own order items"
  on public.order_items for insert to authenticated
  with check (
    exists (
      select 1 from public.orders
      where id = order_id and user_id = auth.uid()
    )
    or
    public.has_role(auth.uid(), array['super_admin', 'admin', 'operator'])
  );

-- C7: Fix notifications insert policy — restrict to admins
drop policy if exists "Admins can insert notifications" on public.notifications;

create policy "Admins can insert notifications"
  on public.notifications for insert to authenticated
  with check (public.has_role(auth.uid(), array['super_admin', 'admin', 'operator', 'finance']));

-- M12: Add DELETE policies for notifications
drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
  on public.notifications for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins can delete notifications" on public.notifications;
create policy "Admins can delete notifications"
  on public.notifications for delete to authenticated
  using (public.has_role(auth.uid(), array['super_admin', 'admin']));

-- C8: (T-38) increment_voucher_usage DIHAPUS — digantikan RPC redeem_voucher (T-21)

-- C9: Add atomic stock decrement function (used by orders.ts)
create or replace function public.decrement_product_stock(pid uuid, qty int)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.products set stock = stock - qty, updated_at = now()
  where id = pid and stock >= qty;
  return found;
end;
$$;

-- H5: Add missing CHECK constraints
alter table public.order_items drop constraint if exists order_items_qty_check;
alter table public.order_items add constraint order_items_qty_check check (qty > 0);

alter table public.order_items drop constraint if exists order_items_price_check;
alter table public.order_items add constraint order_items_price_check check (price >= 0);

alter table public.product_variants drop constraint if exists product_variants_price_check;
alter table public.product_variants add constraint product_variants_price_check check (price >= 0);

alter table public.product_variants drop constraint if exists product_variants_stock_check;
alter table public.product_variants add constraint product_variants_stock_check check (stock >= 0);

alter table public.flash_sale_products drop constraint if exists flash_sale_products_price_check;
alter table public.flash_sale_products add constraint flash_sale_products_price_check check (flash_price >= 0);

alter table public.flash_sale_products drop constraint if exists flash_sale_products_stock_check;
alter table public.flash_sale_products add constraint flash_sale_products_stock_check check (flash_stock >= 0);

-- H6: Add missing performance indexes
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);
create index if not exists idx_order_items_variant_id on public.order_items(variant_id);
create index if not exists idx_shipping_addresses_user_id on public.shipping_addresses(user_id);
create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create index if not exists idx_product_images_product_id on public.product_images(product_id);
create index if not exists idx_flash_sale_products_sale_id on public.flash_sale_products(flash_sale_id);
create index if not exists idx_flash_sale_products_product_id on public.flash_sale_products(product_id);


-- ============================================================
-- [BAGIAN] 20260623000001_additional_fixes.sql
-- ============================================================

-- =============================================
-- HERA STORE — Additional Bug Fixes
-- Applied: 23 June 2026
-- Fixes: variant stock management, order number uniqueness
-- =============================================

-- Add variant stock decrement function
create or replace function public.decrement_variant_stock(vid uuid, qty int)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.product_variants set stock = stock - qty
  where id = vid and stock >= qty;
  return found;
end;
$$;

-- Add variant/product stock increment function (for rollback)
create or replace function public.increment_product_stock(pid uuid, qty int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.products set stock = stock + qty, updated_at = now()
  where id = pid;
end;
$$;

create or replace function public.increment_variant_stock(vid uuid, qty int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.product_variants set stock = stock + qty
  where id = vid;
end;
$$;


-- ============================================================
-- [BAGIAN] 20260624000001_voucher_code_order.sql
-- ============================================================

-- Migration 6: Add voucher_code tracking to orders

alter table public.orders add column if not exists voucher_code text;

create index if not exists idx_orders_voucher_code on public.orders(voucher_code);

-- Ensure admins can see voucher_code via existing policies


-- ============================================================
-- [TAMBAHAN T-12] Auto-RLS event trigger
-- Objek ini dibuat manual di luar migration lama; diekstrak dari
-- live DB agar full_schema = db live.
-- ============================================================

create or replace function public.rls_auto_enable()
 returns event_trigger
 language plpgsql
 security definer
 set search_path to 'pg_catalog'
as $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

drop event trigger if exists ensure_rls;
create event trigger ensure_rls
  on ddl_command_end
  execute function public.rls_auto_enable();

-- ============================================================
-- [TAMBAHAN T-18/T-19/T-21] Keamanan & keandalan (2026-08-29)
-- Diterapkan via MCP sebagai migration `20260829140000_security_fixes`;
-- ditambahkan ke file agar full_schema = db live.
-- ============================================================

-- T-19: RPC lapor pembayaran manual (customer TIDAK self-mark lunas)
-- T-55.4: notifikasi "Pembayaran Dilaporkan" utk customer dibuat DI DALAM RPC
-- (policy INSERT notifications = admin-only; insert dari client pasti ditolak RLS)
create or replace function public.request_payment_confirmation(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then return false; end if;
  if v_order.user_id is distinct from auth.uid() then return false; end if;
  if v_order.payment_status <> 'belum_bayar' then return false; end if;

  -- notifikasi utk pemilik order
  if v_order.user_id is not null then
    insert into public.notifications (user_id, type, title, message, link)
    values (v_order.user_id, 'payment', 'Pembayaran Dilaporkan',
            'Pembayaran untuk pesanan ' || v_order.order_number || ' telah dilaporkan dan sedang diverifikasi admin.',
            '/profil?tab=pesanan');
  end if;

  -- notifikasi verifikasi utk admin
  insert into public.notifications (user_id, type, title, message, link)
  select p.id, 'payment', 'Verifikasi Pembayaran',
         'Pesanan ' || v_order.order_number || ' menunggu verifikasi pembayaran manual.',
         '/admin/pesanan'
  from public.profiles p
  where p.role in ('super_admin', 'admin', 'operator')
    and p.id <> v_order.user_id;

  return true;
end;
$$;

-- T-18: RPC konfirmasi terima (dikirim -> selesai, hanya pemilik order)
create or replace function public.confirm_order_received(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then return false; end if;
  if v_order.user_id is distinct from auth.uid() then return false; end if;
  if v_order.status <> 'dikirim' then return false; end if;

  update public.orders set status = 'selesai', updated_at = now()
  where id = p_order_id;
  return found;
end;
$$;

-- T-21: Penggunaan voucher per user
create table if not exists public.voucher_usage (
  id uuid primary key default uuid_generate_v4(),
  voucher_id uuid not null references public.vouchers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  used_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (voucher_id, user_id)
);

create index if not exists idx_voucher_usage_voucher_id on public.voucher_usage(voucher_id);
create index if not exists idx_voucher_usage_user_id on public.voucher_usage(user_id);

alter table public.voucher_usage enable row level security;

create policy "Users can view own voucher usage"
  on public.voucher_usage for select to authenticated
  using (user_id = auth.uid());

-- T-21: RPC redeem voucher atomic (quota + per-user limit + catat usage)
create or replace function public.redeem_voucher(p_voucher_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quota int;
  v_limit int;
  v_used int;
  v_user_used int;
begin
  select quota, per_user_limit, used_count
    into v_quota, v_limit, v_used
  from public.vouchers where id = p_voucher_id;
  if not found then return false; end if;

  if v_quota is not null and v_used >= v_quota then return false; end if;

  select used_count into v_user_used from public.voucher_usage
  where voucher_id = p_voucher_id and user_id = auth.uid();
  if found and v_user_used >= coalesce(v_limit, 1) then return false; end if;

  update public.vouchers set used_count = used_count + 1
  where id = p_voucher_id and (quota is null or used_count < quota);
  if not found then return false; end if;

  insert into public.voucher_usage (voucher_id, user_id, used_count)
  values (p_voucher_id, auth.uid(), 1)
  on conflict (voucher_id, user_id)
  do update set used_count = public.voucher_usage.used_count + 1,
                updated_at = now();

  return true;
end;
$$;

-- ============================================================
-- [BAGIAN] 20260822120000_secure_functions_hardening.sql
-- ============================================================

-- T-10: Hardening fungsi SECURITY DEFINER (diterapkan ke live DB via MCP
-- sebagai migration `secure_functions_hardening` + `secure_functions_hardening_public`).
--
-- Konteks: security advisor Supabase menandai 9 fungsi SECURITY DEFINER yang
-- executable oleh publik via /rest/v1/rpc/... Termasuk grant PUBLIC (=X) yang
-- membuat revoke per-role saja tidak efektif.
--
-- Keputusan:
--   * Fungsi stok/voucher  : app memanggil sebagai `authenticated` → revoke
--     anon + PUBLIC, keep authenticated & service_role.
--   * Trigger/event-trigger: tidak pernah dipanggil via RPC oleh app → revoke
--     anon, authenticated, dan PUBLIC.
--   * has_role             : TIDAK diubah — dipakai oleh 20 RLS policies;
--     revoke akan mematahkan evaluasi RLS untuk guest. Accepted risk.
--   * generate_order_number: revoke anon/PUBLIC + search_path fixed ('')
--     (body sudah schema-qualified; pg_catalog tetap implicit).

REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_product_stock(uuid, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_variant_stock(uuid, integer) FROM anon, PUBLIC;
-- (T-38) increment_voucher_usage dihapus — revoke-nya ikut dihapus

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_order_status_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM anon, PUBLIC;
ALTER FUNCTION public.generate_order_number() SET search_path = '';

-- T-18/T-19/T-21: Revoke fungsi baru dari anon/PUBLIC (keep authenticated & service_role)
REVOKE EXECUTE ON FUNCTION public.request_payment_confirmation(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.confirm_order_received(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_voucher(uuid) FROM anon, PUBLIC;

-- ============================================================
-- [TAMBAHAN T-31/T-33] Restore stok & sales summary (2026-08-29)
-- Diterapkan via MCP sebagai migration `20260829150000_stock_restore_and_sales_view`.
-- ============================================================

-- T-31: Penanda restore stok (idempotency guard)
alter table public.orders add column if not exists stock_restored boolean not null default false;

-- T-31: RPC cancel order + restore stok (atomic, hanya sekali, hanya admin)
create or replace function public.cancel_order_and_restore_stock(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return false; end if;

  if not public.has_role(auth.uid(), array['super_admin'::text, 'admin'::text, 'operator'::text]) then
    return false;
  end if;

  if v_order.status in ('selesai', 'dibatalkan') then return false; end if;
  if v_order.stock_restored then return false; end if;

  for v_item in
    select product_id, variant_id, qty
    from public.order_items
    where order_id = p_order_id
  loop
    if v_item.product_id is not null then
      update public.products set stock = stock + v_item.qty, updated_at = now()
      where id = v_item.product_id;
    end if;
    if v_item.variant_id is not null then
      update public.product_variants set stock = stock + v_item.qty
      where id = v_item.variant_id;
    end if;
  end loop;

  update public.orders
  set status = 'dibatalkan', stock_restored = true, updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

revoke execute on function public.cancel_order_and_restore_stock(uuid) from anon, public;
grant execute on function public.cancel_order_and_restore_stock(uuid) to authenticated;

-- ============================================================
-- [TAMBAHAN T-34/T-35] RPC sold count & index FK (2026-08-29)
-- Diterapkan via MCP sebagai migration `20260829160000_sold_count_rpc`.
-- T-34: view product_sales_summary (T-33) DIHAPUS — security_definer_view
-- ERROR di advisor. Diganti RPC SECURITY DEFINER (pola has_role, by-design
-- WARN yang diterima) agar guest (anon) juga mendapat angka terjual.
-- ============================================================

-- T-34: RPC sold count — ekspos agregat (product_id, sold), tanpa data order
create or replace function public.get_product_sales_summary()
returns table (product_id uuid, sold bigint)
language sql
security definer
set search_path = public
as $$
  select oi.product_id, coalesce(sum(oi.qty), 0) as sold
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status <> 'dibatalkan'
  group by oi.product_id;
$$;

revoke execute on function public.get_product_sales_summary() from public;
grant execute on function public.get_product_sales_summary() to anon, authenticated;

-- T-35: Index untuk FK tanpa covering index
create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_product_qna_user_id on public.product_qna(user_id);
create index if not exists idx_reviews_order_id on public.reviews(order_id);

-- ============================================================
-- [TAMBAHAN T-40/T-41] Event Monitor & UTM Campaign (2026-08-29)
-- Diterapkan via MCP sebagai migration `20260829180000_marketing_features`.
-- Pola mengacu docs seo.md (project lain): event_logs + utm_visits.
-- ============================================================

-- T-40: EVENT LOGS — riwayat event konversi marketing
create table if not exists public.event_logs (
  id uuid primary key default uuid_generate_v4(),
  event_name text not null,
  label text,
  page text,
  value jsonb,
  status text not null default 'sent' check (status in ('sent', 'pending', 'failed')),
  provider text default 'internal',
  created_at timestamptz not null default now()
);

create index if not exists idx_event_logs_created_at on public.event_logs(created_at desc);

alter table public.event_logs enable row level security;

create policy "Public can insert event logs"
  on public.event_logs for insert to anon, authenticated
  with check (true);

create policy "Admins can read event logs"
  on public.event_logs for select to authenticated
  using (public.has_role(auth.uid(), array['super_admin'::text, 'admin'::text, 'operator'::text, 'finance'::text]));

create policy "Admins can update event logs"
  on public.event_logs for update to authenticated
  using (public.has_role(auth.uid(), array['super_admin'::text, 'admin'::text, 'operator'::text]))
  with check (public.has_role(auth.uid(), array['super_admin'::text, 'admin'::text, 'operator'::text]));

-- T-41: UTM VISITS — kunjungan dengan parameter UTM
create table if not exists public.utm_visits (
  id uuid primary key default uuid_generate_v4(),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  landing_url text,
  referrer text,
  session_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_utm_visits_created_at on public.utm_visits(created_at desc);

alter table public.utm_visits enable row level security;

create policy "Public can insert utm visits"
  on public.utm_visits for insert to anon, authenticated
  with check (true);

create policy "Admins can read utm visits"
  on public.utm_visits for select to authenticated
  using (public.has_role(auth.uid(), array['super_admin'::text, 'admin'::text, 'operator'::text, 'finance'::text]));

-- T-41: ORDERS — simpan utm_source dari campaign
alter table public.orders add column if not exists utm_source text;
create index if not exists idx_orders_utm_source on public.orders(utm_source);

-- ============================================================
-- [TAMBAHAN T-47] Rebrand catalog → beauty skincare (2026-08-29)
-- Diterapkan via MCP sebagai migration `20260829190000_rebrand_skincare_catalog`.
-- Menimpa seed lama (produk rumah tangga + emoji) → state akhir = live DB.
-- Icon kategori = NAMA ICON LUCIDE (string), bukan emoji.
-- Gambar produk = picsum seeded (stabil & deterministik).
-- ============================================================

delete from public.flash_sale_products;
delete from public.flash_sales;
delete from public.product_images;
delete from public.product_variants;
delete from public.products;
delete from public.categories;

insert into public.categories (name, slug, icon, sort_order) values
  ('Skincare', 'skincare', 'droplets', 1),
  ('Makeup', 'makeup', 'palette', 2),
  ('Perawatan Rambut', 'perawatan-rambut', 'flower-2', 3),
  ('Parfum', 'parfum', 'sparkles', 4),
  ('Perawatan Tubuh', 'perawatan-tubuh', 'bath', 5),
  ('Alat & Aksesori', 'alat-aksesori', 'wand-2', 6)
on conflict (slug) do nothing;

with parents as (select id, slug from public.categories where parent_id is null)
insert into public.categories (name, slug, icon, parent_id, sort_order)
select sub.name, sub.slug, sub.icon, parents.id, sub.sort_order
from parents
cross join (values
  ('skincare', 'Pembersih Wajah', 'pembersih-wajah', 'droplet', 1),
  ('skincare', 'Toner', 'toner', 'glass-water', 2),
  ('skincare', 'Serum', 'serum', 'flask-conical', 3),
  ('skincare', 'Pelembap', 'pelembap', 'heart', 4),
  ('skincare', 'Sunscreen', 'sunscreen', 'sun', 5),
  ('skincare', 'Masker Wajah', 'masker-wajah', 'smile', 6),
  ('makeup', 'Foundation', 'foundation', 'paint-bucket', 1),
  ('makeup', 'Lipstick', 'lipstick', 'brush', 2),
  ('makeup', 'Eyeshadow', 'eyeshadow', 'eye', 3),
  ('makeup', 'Mascara', 'mascara', 'paintbrush', 4),
  ('perawatan-rambut', 'Shampoo', 'shampoo', 'shower-head', 1),
  ('perawatan-rambut', 'Kondisioner', 'kondisioner', 'feather', 2),
  ('perawatan-rambut', 'Hair Mask', 'hair-mask', 'layers', 3),
  ('perawatan-rambut', 'Hair Oil', 'hair-oil', 'leaf', 4),
  ('parfum', 'Eau de Parfum', 'eau-de-parfum', 'flower', 1),
  ('parfum', 'Eau de Toilette', 'eau-de-toilette', 'flower-2', 2),
  ('parfum', 'Roll-on', 'roll-on', 'wind', 3),
  ('perawatan-tubuh', 'Body Wash', 'body-wash', 'bath', 1),
  ('perawatan-tubuh', 'Body Lotion', 'body-lotion', 'hand', 2),
  ('perawatan-tubuh', 'Hand Cream', 'hand-cream', 'heart', 3),
  ('perawatan-tubuh', 'Deodorant', 'deodorant', 'wind', 4),
  ('alat-aksesori', 'Kuas Makeup', 'kuas-makeup', 'brush', 1),
  ('alat-aksesori', 'Sponge', 'sponge', 'circle', 2),
  ('alat-aksesori', 'Cermin', 'cermin', 'aperture', 3)
) as sub(parent_slug, name, slug, icon, sort_order)
where parents.slug = sub.parent_slug
on conflict (slug) do nothing;

with subcats as (select id, slug from public.categories where parent_id is not null)
insert into public.products (name, slug, sku, description, category_id, brand, price, discount_price, stock, unit, weight_gram, is_active)
select p.name, p.slug, p.sku, p.description, subcats.id, 'Hera Skincare', p.price, p.discount_price, p.stock, p.unit, p.weight_gram, true
from subcats, (values
  ('pembersih-wajah', 'Gentle Cleansing Foam', 'gentle-cleansing-foam', 'SKC-001',
   'Cleanser lembut dengan formula pH-balanced yang membersihkan tanpa membuat kulit kering. Mengandung centella asiatica.',
   45000, 39000, 120, 'tube', 120),
  ('toner', 'Hydrating Rose Toner', 'hydrating-rose-toner', 'SKC-002',
   'Toner wajah dengan rose water dan hyaluronic acid untuk hidrasi menyeluruh dan pori tampak halus.',
   65000, NULL, 90, 'botol', 200),
  ('serum', 'Vitamin C Brightening Serum', 'vitamin-c-brightening-serum', 'SKC-003',
   'Serum vitamin C 10% + ferulic acid untuk mencerahkan, meratakan warna kulit, dan melindungi dari radikal bebas.',
   120000, 99000, 80, 'botol', 50),
  ('pelembap', 'Aloe Vera Gel Moisturizer', 'aloe-vera-gel-moisturizer', 'SKC-004',
   'Gel pelembap ringan dengan aloe vera 92% — cepat meresap, cocok untuk kulit berminyak dan berjerawat.',
   75000, NULL, 110, 'botol', 150),
  ('sunscreen', 'Sunscreen SPF 50+ PA++++', 'sunscreen-spf50-plus', 'SKC-005',
   'Sunscreen gel ringan SPF 50+ PA++++ water-resistant dengan tekstur tidak lengket dan whitecast-free.',
   95000, 85000, 140, 'tube', 80),
  ('masker-wajah', 'Collagen Hydrating Sheet Mask', 'collagen-sheet-mask', 'SKC-006',
   'Sheet mask kolagen + niacinamide untuk kulit kenyal dan lembap instan. Isi 5 lembar.',
   18000, 15000, 200, 'box', 120),
  ('foundation', 'Dewy Glow Foundation', 'dewy-glow-foundation', 'MKP-001',
   'Foundation dengan finish dewy natural, coverage medium-buildable, infused dengan vitamin E.',
   145000, NULL, 60, 'botol', 90),
  ('lipstick', 'Velvet Matte Lipstick', 'velvet-matte-lipstick', 'MKP-002',
   'Lipstik matte velvet dengan tekstur ringan, pigmented, dan tahan lama hingga 8 jam.',
   89000, 79000, 95, 'tube', 30),
  ('eyeshadow', 'Smoky Eyeshadow Palette', 'smoky-eyeshadow-palette', 'MKP-003',
   'Palet eyeshadow 12 warna netral dengan finish matte dan shimmer yang mudah di-blend.',
   165000, NULL, 45, 'box', 180),
  ('mascara', 'Volumizing Mascara', 'volumizing-mascara', 'MKP-004',
   'Maskara waterproof dengan sikat curved untuk volume dan curl tanpa menggumpal.',
   105000, NULL, 70, 'tube', 25),
  ('shampoo', 'Silk Repair Shampoo', 'silk-repair-shampoo', 'HRB-001',
   'Shampoo dengan keratin dan silk protein untuk memperbaiki rambut rusak dan kering.',
   55000, NULL, 130, 'botol', 350),
  ('kondisioner', 'Smooth & Shine Conditioner', 'smooth-shine-conditioner', 'HRB-002',
   'Kondisioner dengan argan oil untuk rambut lembut, halus, dan berkilau tanpa terasa berat.',
   55000, 48000, 130, 'botol', 350),
  ('hair-oil', 'Argan Hair Elixir Oil', 'argan-hair-elixir-oil', 'HRB-003',
   'Hair oil argan 100% untuk ujung rambut bercabang, menutrisi dan memberi kilau sehat.',
   98000, NULL, 85, 'botol', 60),
  ('eau-de-parfum', 'Bloom Eau de Parfum', 'bloom-eau-de-parfum', 'PRF-001',
   'Parfum floral-fruity: peony, rose, dan white musk. Tahan lama hingga 12 jam. 50ml.',
   250000, NULL, 40, 'botol', 220),
  ('body-lotion', 'Shea Butter Body Lotion', 'shea-butter-body-lotion', 'TUB-001',
   'Body lotion shea butter + vitamin E untuk kulit tubuh lembap dan halus sepanjang hari.',
   68000, 59000, 100, 'botol', 300),
  ('body-wash', 'Refreshing Body Wash', 'refreshing-body-wash', 'TUB-002',
   'Body wash dengan ekstrak green tea dan menthol untuk kesegaran menyeluruh. 400ml.',
   42000, NULL, 150, 'botol', 420)
) as p(cat_slug, name, slug, sku, description, price, discount_price, stock, unit, weight_gram)
where subcats.slug = p.cat_slug
on conflict (slug) do nothing;

with prods as (select id, slug from public.products)
insert into public.product_variants (product_id, name, price, stock, sku)
select prods.id, v.name, v.price, v.stock, v.sku
from prods, (values
  ('vitamin-c-brightening-serum', '10ml', 52000, 40, 'SKC-003-10'),
  ('vitamin-c-brightening-serum', '30ml', 99000, 35, 'SKC-003-30'),
  ('dewy-glow-foundation', 'Shade 01 Fair', 145000, 20, 'MKP-001-F01'),
  ('dewy-glow-foundation', 'Shade 02 Natural', 145000, 22, 'MKP-001-F02'),
  ('dewy-glow-foundation', 'Shade 03 Tan', 145000, 18, 'MKP-001-F03'),
  ('silk-repair-shampoo', '200ml', 32000, 60, 'HRB-001-200'),
  ('silk-repair-shampoo', '400ml', 55000, 70, 'HRB-001-400')
) as v(product_slug, name, price, stock, sku)
where prods.slug = v.product_slug
on conflict do nothing;

with prods as (select id, slug from public.products)
insert into public.product_images (product_id, url, is_primary, sort_order)
select prods.id, 'https://picsum.photos/seed/' || prods.slug || '-1/800/800', true, 0
from prods
on conflict do nothing;

with prods as (select id, slug from public.products)
insert into public.product_images (product_id, url, is_primary, sort_order)
select prods.id, 'https://picsum.photos/seed/' || prods.slug || '-2/800/800', false, 1
from prods
on conflict do nothing;

insert into public.flash_sales (name, starts_at, ends_at, is_active)
values ('Flash Sale Skincare', now(), now() + interval '6 hours', true)
on conflict do nothing;

insert into public.flash_sale_products (flash_sale_id, product_id, flash_price, flash_stock)
select fs.id, p.id, p.discount_price, 30
from public.flash_sales fs, public.products p
where fs.name = 'Flash Sale Skincare'
  and p.discount_price is not null
on conflict do nothing;

-- T-47: store_info description disinkronkan ke tema skincare (state akhir = live)
update public.store_settings
set value = jsonb_set(value, '{description}', '"Marketplace skincare & perawatan pribadi premium."')
where key = 'store_info';

-- ============================================================
-- [TAMBAHAN T-57] Cache RajaOngkir (kuota 100 hit/hari)
-- Diterapkan via MCP sebagai migration `shipping_cache_table`.
-- SERVER-ONLY BY DESIGN: RLS on TANPA policy = deny anon/authenticated;
-- hanya service-role (bypass RLS) yang baca/tulis — mencegah peracunan
-- cache harga ongkir dari klien publik.
-- ============================================================

create table if not exists public.shipping_cache (
  cache_key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.shipping_cache enable row level security;

-- ============================================================
-- [TAMBAHAN T-63] Banner promosi storefront
-- Diterapkan via MCP sebagai migration `banners_table`.
-- ============================================================

create table if not exists public.banners (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subtitle text,
  image_url text not null,
  image_url_mobile text,
  link_url text,
  placement text not null default 'hero' check (placement in ('hero', 'strip')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_banners_active on public.banners(is_active, placement, sort_order);

alter table public.banners enable row level security;

create policy "Banners publicly viewable"
  on public.banners for select to authenticated, anon
  using (is_active = true);

create policy "Admins can manage banners"
  on public.banners for all to authenticated
  using (public.has_role(auth.uid(), array['super_admin'::text, 'admin'::text]))
  with check (public.has_role(auth.uid(), array['super_admin'::text, 'admin'::text]));

-- ============================================================
-- [TAMBAHAN T-64] Push notification (Web Push VAPID)
-- Diterapkan via MCP sebagai migration `push_subscriptions_table`.
-- RLS: user mengelola langganannya sendiri; admin hanya melihat (statistik);
-- pengiriman broadcast dilakukan server via service-role.
-- ============================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy "Users manage own push subscriptions"
  on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can view push subscriptions"
  on public.push_subscriptions for select to authenticated
  using (public.has_role(auth.uid(), array['super_admin'::text, 'admin'::text]));
