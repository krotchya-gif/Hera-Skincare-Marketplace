import type { Metadata } from "next";
import CategoryClient from "@/components/CategoryClient";
import { getCategoryBySlug, getProducts, getSubcategoriesOfCategory } from "@/lib/products";
import { getSeoSettings } from "@/lib/seo";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string }>;
}

export const revalidate = 0;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const seo = await getSeoSettings();

  // Handle "semua" slug for search
  if (slug === "semua") {
    return {
      title: `Cari Produk — ${seo.default_title || "Hera Skincare"}`,
      description: seo.default_description || undefined,
    };
  }

  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { title: "Kategori Tidak Ditemukan" };
  }

  return {
    title: `${category.name} — ${seo.default_title || "Hera Skincare"}`,
    description: `Belanja produk ${category.name} terbaik di Hera Skincare. ${seo.default_description || ""}`,
    keywords: seo.default_keywords || undefined,
  };
}

export default async function KategoriPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { search } = await searchParams;

  // Handle "semua" slug for search results (from navbar search)
  if (slug === "semua") {
    const searchTerm = search || "";
    // "all" bukan UUID — ini virtual category untuk search result, tidak disimpan di DB
    const virtualCategory = {
      id: "all",
      name: searchTerm ? `Hasil Pencarian: "${searchTerm}"` : "Semua Produk",
      slug: "semua",
      icon: "search",
      parent_id: null,
      sort_order: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const initialResult = await getProducts({
      search: searchTerm || undefined,
      page: 1,
      pageSize: 20,
    });

    return (
      <CategoryClient
        category={virtualCategory}
        initialResult={initialResult}
        slug="semua"
        searchQuery={searchTerm}
        subcategories={[]}
      />
    );
  }

  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const [initialResult, subcategories] = await Promise.all([
    getProducts({ categorySlug: slug, page: 1, pageSize: 8 }),
    getSubcategoriesOfCategory(category.id),
  ]);

  return (
    <CategoryClient
      category={category}
      initialResult={initialResult}
      slug={slug}
      subcategories={subcategories}
    />
  );
}
