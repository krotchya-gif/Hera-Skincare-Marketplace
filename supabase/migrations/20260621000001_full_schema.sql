-- =============================================
-- HERA STORE MARKETPLACE — Full Schema
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

create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

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

-- Auto increment voucher usage count (atomic)
create or replace function public.increment_voucher_usage(voucher_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.vouchers set used_count = used_count + 1 where id = voucher_id;
end;
$$;

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
  ('shipping', '{"free_shipping": true, "free_shipping_min": 100000, "couriers": ["JNE", "J&T Express", "SiCepat", "Gosend", "Anteraja"], "origin_city": "Jakarta Selatan"}'::jsonb),
  ('payment', '{"methods": ["Transfer Bank (BCA, Mandiri, BRI)", "GoPay", "OVO", "Dana", "ShopeePay", "Virtual Account", "COD (Bayar di Tempat)"], "payment_timeout_hours": 24, "bank_account": {"bank": "BCA", "owner": "Hera Skincare", "number": "1234567890"}}'::jsonb),
  ('notifications', '{"email": {"Pesanan baru masuk": true, "Pembayaran diterima": true, "Stok produk menipis (< 10 item)": true, "Ulasan baru masuk": true}, "wa": {"Pesanan baru masuk": true, "Pembayaran diterima": true, "Stok produk menipis (< 10 item)": false, "Ulasan baru masuk": false}}'::jsonb)
ON CONFLICT (key) DO NOTHING;
