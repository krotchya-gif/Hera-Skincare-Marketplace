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

/** Validate robots.txt content — no HTML/script injection */
function isValidRobotsContent(content: string): boolean {
  const trimmed = content.trim();
  // Must be plain text — reject if it contains HTML/script tags
  if (/<\s*(script|iframe|object|embed|form|input|button|style|meta|link|applet|html|body|div)\b/i.test(trimmed)) return false;
  // Must start with a robots.txt-valid line (User-agent, Allow, Disallow, Sitemap, #)
  if (!/^(User-agent|Allow|Disallow|Sitemap|#|Crawl-delay|Host)\s*:/im.test(trimmed)) return false;
  return true;
}

export async function GET(request: Request) {
  const BASE_URL = getBaseUrl(request);

  let aiBlocked: string[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "seo")
      .single();

    const customContent = (data?.value as Record<string, unknown>)?.robots_txt_content as string | null;
    aiBlocked = Array.isArray((data?.value as Record<string, unknown>)?.ai_crawlers_block)
      ? ((data?.value as Record<string, unknown>)?.ai_crawlers_block as unknown[]).filter((x): x is string => typeof x === "string")
      : [];

    if (customContent?.trim() && isValidRobotsContent(customContent)) {
      return new NextResponse(customContent, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  } catch {
    // Fall through to default
  }

  // T-42: AI crawler block (GEO) — Disallow per bot yang dicentang
  const aiLines = aiBlocked.length > 0
    ? [...aiBlocked.map((bot) => `User-agent: ${bot}\nDisallow: /`), ""]
    : [];

  const defaultContent = [
    "User-agent: *",
    "Allow: /",
    "",
    ...aiLines,
    `Sitemap: ${BASE_URL}/sitemap.xml`,
  ].join("\n");

  return new NextResponse(defaultContent, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
