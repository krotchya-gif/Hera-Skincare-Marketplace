-- Migration 6: Add voucher_code tracking to orders

alter table public.orders add column if not exists voucher_code text;

create index if not exists idx_orders_voucher_code on public.orders(voucher_code);

-- Ensure admins can see voucher_code via existing policies
