// ─── Dynamic Sitemap.xml Route Handler ─────────────────────────
// Supports both:
//   1. Custom uploaded sitemap (from admin SEO settings)
//   2. Auto-generated sitemap (from DB products & categories)
// ────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function getBaseUrl(request: Request): string {
  // Priority 1: env var
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  // Priority 2: x-forwarded-host header (Vercel/NGINX)
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) return `https://${forwarded}`;
  // Priority 3: host header
  const host = request.headers.get("host");
  if (host) return `https://${host}`;
  // Fallback
  return "http://localhost:3000";
}

function generateSitemapXml(entries: { url: string; lastModified: Date; changeFrequency: string; priority: number }[]): string {
  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastModified.toISOString().split("T")[0]}</lastmod>
    <changefreq>${e.changeFrequency}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/** Validate that a string looks like safe XML (no HTML/script injection) */
function isValidXmlContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed.startsWith("<?xml") && !trimmed.startsWith("<")) return false;
  // Reject if it contains HTML/script tags
  if (/<\s*(script|iframe|object|embed|form|input|button|style|meta|link|applet)\b/i.test(trimmed)) return false;
  // Try to parse as XML (basic structural check)
  try {
    // Simple structural validation: must have at least one open/close tag pair
    const hasOpenClose = /<(\w+)[^>]*>[\s\S]*<\/\1>/.test(trimmed);
    if (!hasOpenClose) return false;
  } catch {
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  const BASE_URL = getBaseUrl(request);

  // 1) Check for custom uploaded sitemap
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "seo")
      .single();

    const customContent = (data?.value as Record<string, unknown>)?.sitemap_xml_content as string | null;
    if (customContent?.trim() && isValidXmlContent(customContent)) {
      return new NextResponse(customContent, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }
  } catch {
    // Fall through to dynamic
  }

  // 2) Auto-generate dynamic sitemap
  try {
    const supabase = await createClient();

    // T-56.2: halaman privat/transaksional tidak masuk sitemap
    const staticPages = [
      { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    ];

    const [{ data: categories }, { data: products }] = await Promise.all([
      supabase.from("categories").select("slug, created_at").eq("is_active", true),
      supabase.from("products").select("slug, updated_at").eq("is_active", true),
    ]);

    const categoryPages = (categories || []).map((cat) => ({
      url: `${BASE_URL}/kategori/${cat.slug}`,
      lastModified: new Date(cat.created_at || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const productPages = (products || []).map((prod) => ({
      url: `${BASE_URL}/produk/${prod.slug}`,
      lastModified: new Date(prod.updated_at || new Date()),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    const xml = generateSitemapXml([...staticPages, ...categoryPages, ...productPages]);
    return new NextResponse(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("[Sitemap Generation Error]", error);
    return new NextResponse("Sitemap generation failed", { status: 500 });
  }
}
