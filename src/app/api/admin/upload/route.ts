// ─── File Upload API — Supabase Storage ─────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    await verifyAdminRole();
    // Rate limiting
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 10, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;

    if (!file || !productId) {
      return NextResponse.json({ error: "File dan productId wajib diisi" }, { status: 400 });
    }

    // T-24: Verifikasi tipe via magic bytes — jangan percaya file.type client
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipe file tidak didukung. Gunakan JPEG, PNG, atau WebP." }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 });
    }

    // Magic bytes: pastikan konten sesuai deklarasi (cegah polyglot/mismatch)
    const buffer = Buffer.from(await file.arrayBuffer());
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";

    const declaredIsJpeg = file.type === "image/jpeg" && isJpeg;
    const declaredIsPng = file.type === "image/png" && isPng;
    const declaredIsWebp = file.type === "image/webp" && isWebp;
    if (!declaredIsJpeg && !declaredIsPng && !declaredIsWebp) {
      return NextResponse.json({ error: "Konten file tidak sesuai dengan tipe yang dideklarasikan." }, { status: 400 });
    }

    const supabase = await createClient();
    const safeProductId = productId.replace(/[^a-fA-F0-9-]/g, "");
    const fileExt = file.name.split(".").pop();
    const fileName = `${safeProductId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[Upload Error]", uploadError);
      return NextResponse.json({ error: "Gagal mengupload file: " + uploadError.message }, { status: 400 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    const isTemp = productId === "temp";
    let count = 0;

    if (!isTemp) {
      // Check if this is the first image (set as primary)
      const { count: fetchedCount } = await supabase
        .from("product_images")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId);
      
      count = fetchedCount ?? 0;

      // Save to product_images table
      const { error: dbError } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          url: publicUrl,
          is_primary: count === 0, // first image = primary
          sort_order: count,
        });

      if (dbError) {
        console.error("[DB Insert Error]", dbError);
        return NextResponse.json({ error: "Gagal menyimpan referensi gambar" }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      is_primary: count === 0,
    });
  } catch (error) {
    return handleAdminError(error);
  }
}
