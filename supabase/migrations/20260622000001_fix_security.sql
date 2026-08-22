-- =============================================
-- HERA STORE — Security & Performance Fixes
-- Applied: 22 June 2026
-- Fixes: C6, C7, C8, C9, H5, H6, M12
-- =============================================

-- C6: Fix order_items insert policy — only allow order owner or admin
drop policy if exists "Auth users can insert order items" on public.order_items;

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

-- C8: Fix increment_voucher_usage — add missing search_path
create or replace function public.increment_voucher_usage(voucher_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.vouchers set used_count = used_count + 1 where id = voucher_id;
end;
$$;

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
