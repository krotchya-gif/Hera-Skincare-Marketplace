// ─── Formatting Utilities ──────────────────────────────────────

// ponytail: formatRp = full ("Rp 1.500.000"), formatRupiah = abbreviate ("Rp 1,5jt") untuk dashboard
export const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export const formatRupiah = (value: number) => {
  if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}jt`;
  if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}rb`;
  return `Rp ${value}`;
};


