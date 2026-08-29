// ─── Voucher Validation — Supabase ───────────────────────────────────────────
import { createClient } from "@/utils/supabase/server";
import type { Voucher } from "@/types/database";

export interface VoucherValidationResult {
  valid: boolean;
  voucher?: Voucher;
  discount?: number;
  message: string;
}

export async function validateVoucher(
  code: string,
  cartTotal: number,
  userId?: string
): Promise<VoucherValidationResult> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: voucher, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (error || !voucher) {
    return { valid: false, message: "Kode voucher tidak ditemukan atau tidak aktif." };
  }

  // Check validity period
  if (voucher.starts_at && voucher.starts_at > now) {
    return { valid: false, message: "Voucher belum berlaku." };
  }
  if (voucher.ends_at && voucher.ends_at < now) {
    return { valid: false, message: "Voucher sudah kadaluarsa." };
  }

  // Check minimum purchase
  if (cartTotal < (voucher.min_purchase ?? 0)) {
    const minStr = `Rp ${voucher.min_purchase?.toLocaleString("id-ID")}`;
    return { valid: false, message: `Minimum pembelian ${minStr} untuk menggunakan voucher ini.` };
  }

  // Check quota
  if (voucher.quota !== null && (voucher.used_count ?? 0) >= voucher.quota) {
    return { valid: false, message: "Kuota voucher sudah habis." };
  }

  // T-21: Check per-user limit
  if (userId && (voucher.per_user_limit ?? 1) > 0) {
    const { data: usage } = await supabase
      .from("voucher_usage")
      .select("used_count")
      .eq("voucher_id", voucher.id)
      .eq("user_id", userId)
      .maybeSingle();

    const usedByUser = (usage?.used_count ?? 0);
    if (usedByUser >= (voucher.per_user_limit ?? 1)) {
      return { valid: false, message: "Kamu sudah menggunakan voucher ini. Batas pemakaian per pengguna tercapai." };
    }
  }

  // Calculate discount
  let discount = 0;
  if (voucher.type === "percent") {
    discount = Math.round((cartTotal * voucher.value) / 100);
  } else {
    discount = voucher.value;
  }

  // Cap discount at cart total
  discount = Math.min(discount, cartTotal);

  return {
    valid: true,
    voucher: voucher as Voucher,
    discount,
    message: `Voucher berhasil! Hemat Rp ${discount.toLocaleString("id-ID")}`,
  };
}

export async function redeemVoucher(voucherId: string): Promise<boolean> {
  const supabase = await createClient();
  // T-21: RPC atomic — quota + per-user limit + catat usage per user
  const { data: success, error } = await supabase.rpc("redeem_voucher", {
    p_voucher_id: voucherId,
  });
  if (error) {
    console.error("[redeemVoucher RPC]", error);
    return false;
  }
  return success === true;
}