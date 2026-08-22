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
REVOKE EXECUTE ON FUNCTION public.increment_voucher_usage(uuid) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_order_status_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM anon, PUBLIC;
ALTER FUNCTION public.generate_order_number() SET search_path = '';
