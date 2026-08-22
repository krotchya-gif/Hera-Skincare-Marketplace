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
