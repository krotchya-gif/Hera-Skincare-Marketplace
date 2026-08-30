// ─── Shared: attach profiles ke rows yang FK-nya ke auth.users ───────────────
// PostgREST TIDAK bisa meng-embed `profiles(...)` dari tabel yang FK-nya
// menunjuk ke auth.users (orders, reviews, product_qna) — tidak ada relasi FK
// langsung (PGRST200). Solusi tunggal: fetch profiles bulk + tempel per baris.
import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface AttachedProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export async function attachProfiles<T extends { user_id?: string | null }>(
  supabase: SupabaseClient,
  rows: T[]
): Promise<(T & { profiles: AttachedProfile | null })[]> {
  const ids = [...new Set(rows.map((r) => r.user_id).filter((x): x is string => !!x))];
  if (ids.length === 0) return rows.map((r) => ({ ...r, profiles: null }));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, phone, avatar_url")
    .in("id", ids);

  const map = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({
    ...r,
    profiles: r.user_id ? (map.get(r.user_id) ?? null) : null,
  }));
}