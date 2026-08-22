import type { Metadata } from "next";
import type { Product, PaginatedResult } from "@/types/database";
import ProductDetailClient from "@/components/ProductDetailClient";
import { getProductBySlug, getReviewsByProduct, getProductRatingSummary, getProducts, getQuestionsByProduct } from "@/lib/products";
import { getSeoSettings } from "@/lib/seo";
import { notFound } from "next/navigation";
import { STORE_NAME } from "@/utils/storeConfig";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 0;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const seo = await getSeoSettings();

  if (!product) {
    return { title: "Produk Tidak Ditemukan" };
  }

  return {
    title: product.meta_title || `${product.name} — ${STORE_NAME}`,
    description: product.meta_description || seo.default_description || `Beli ${product.name} harga terbaik di ${STORE_NAME}.`,
    keywords: seo.default_keywords || undefined,
    openGraph: {
      title: product.meta_title || product.name,
      description: product.meta_description || seo.default_description || undefined,
      type: "website",
    },
  };
}

export default async function ProdukDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [reviews, ratingSummary, relatedProductsResult, questions] = await Promise.all([
    getReviewsByProduct(product.id),
    getProductRatingSummary(product.id),
    product.categories?.slug
      ? getProducts({
          categorySlug: product.categories.slug,
          page: 1,
          pageSize: 7,
        })
      : Promise.resolve({ data: [], count: 0, page: 1, pageSize: 0, totalPages: 0 } as PaginatedResult<Product>),
    getQuestionsByProduct(product.id),
  ]);

  const relatedProducts = relatedProductsResult.data
    .filter((p) => p.id !== product.id)
    .slice(0, 6);

  return (
    <ProductDetailClient
      product={product}
      reviews={reviews}
      ratingSummary={ratingSummary}
      relatedProducts={relatedProducts}
      questions={questions}
    />
  );
}
