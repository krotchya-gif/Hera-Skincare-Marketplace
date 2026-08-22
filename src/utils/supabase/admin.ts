/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";

// Client service-role untuk konteks TANPA session user (webhook server-to-server).
// HANYA boleh dipakai di server; key tidak pernah sampai ke browser.
//
// Project memakai tipe database manual (src/types/database.ts), bukan generated
// Database types — tanpa cast, operasi write supabase-js v2 ter-infer `never`.
let cached: any = null;

export function createAdminClient(): any {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing admin environment variables (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
