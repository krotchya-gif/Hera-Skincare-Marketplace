import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import { getCategories, getFlashSaleProducts, getBestSellerProducts, getPromoProducts, getActiveFlashSaleEnd, getProductStatsMap } from "@/lib/products";
import { getSeoSettings } from "@/lib/seo";
import { STORE_NAME } from "@/utils/storeConfig";

// Set dynamic runtime so that it fetches fresh data from DB on load
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  return {
    title: seo.default_title || `${STORE_NAME} — Marketplace Skincare & Perawatan Pribadi`,
    description: seo.default_description || undefined,
    keywords: seo.default_keywords || undefined,
  };
}

export default async function HomePage() {
  const [categories, flashSaleProducts, bestSellerProducts, promoProducts, flashSaleEnd] = await Promise.all([
    getCategories(),
    getFlashSaleProducts(),
    getBestSellerProducts(8),
    getPromoProducts(8),
    getActiveFlashSaleEnd(),
  ]);

  // Batch fetch rating & sold stats for all displayed products
  const allProductIds = [
    ...flashSaleProducts.map((p) => p.id),
    ...bestSellerProducts.map((p) => p.id),
    ...promoProducts.map((p) => p.id),
  ];
  const productStats = await getProductStatsMap([...new Set(allProductIds)]);

  return (
    <HomeClient
      categories={categories}
      flashSaleProducts={flashSaleProducts}
      bestSellerProducts={bestSellerProducts}
      promoProducts={promoProducts}
      flashSaleEnd={flashSaleEnd}
      productStats={productStats}
    />
  );
}
