// T-47: Helper gambar produk — aman dipakai di client & server (tanpa supabase)
export function getProductImage(product: {
  product_images?: { url: string; is_primary: boolean }[] | null;
}): string | null {
  const primary = product.product_images?.find((img) => img.is_primary);
  if (primary?.url) return primary.url;
  return product.product_images?.[0]?.url ?? null;
}