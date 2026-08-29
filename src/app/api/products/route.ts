import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/products";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 120, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("categorySlug") || undefined;
    const subCategory = searchParams.get("subCategory") || undefined;
    const search = searchParams.get("search") || undefined;
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const sort = (searchParams.get("sort") as "newest" | "popular" | "price_asc" | "price_desc") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "20"), 1), 100);

    const result = await getProducts({
      categorySlug,
      subCategory,
      search,
      minPrice,
      maxPrice,
      sort,
      page,
      pageSize,
    });

    // Public cache headers
return NextResponse.json(result, {
  headers: { "Cache-Control": "public, max-age=60, s-maxage=120" },
});
  } catch (error) {
    console.error("[API GET Public Products]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
