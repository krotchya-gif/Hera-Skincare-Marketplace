import { NextRequest, NextResponse } from "next/server";
import { updateProduct, deleteProduct, syncProductImages } from "@/lib/admin";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { createClient } from "@/utils/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminRole();
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 20, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });
    const { id } = await params;
    const body = await request.json();

    // T-29: validasi angka — stock & harga tidak boleh negatif, diskon < harga
    if (body.stock !== undefined && body.stock !== null && body.stock !== "") {
      const stock = Number(body.stock);
      if (isNaN(stock) || !Number.isInteger(stock) || stock < 0) {
        return NextResponse.json({ error: "Stok harus bilangan bulat tidak negatif." }, { status: 400 });
      }
    }
    if (body.price !== undefined && body.price !== null && body.price !== "") {
      const price = Number(body.price);
      if (isNaN(price) || price <= 0) {
        return NextResponse.json({ error: "Harga produk harus lebih besar dari 0." }, { status: 400 });
      }
    }
    if (body.discount_price !== undefined && body.discount_price !== null && body.discount_price !== "") {
      const discountPrice = Number(body.discount_price);
      if (isNaN(discountPrice) || discountPrice < 0) {
        return NextResponse.json({ error: "Harga diskon tidak boleh negatif." }, { status: 400 });
      }
      if (body.price !== undefined && body.price !== null && body.price !== "" && discountPrice >= Number(body.price)) {
        return NextResponse.json({ error: "Harga diskon harus lebih kecil dari harga normal." }, { status: 400 });
      }
    }
    if (body.slug !== undefined && body.slug !== null && body.slug !== "") {
      if (typeof body.slug !== "string" || !/^[a-z0-9-]+$/.test(body.slug)) {
        return NextResponse.json({ error: "Slug hanya boleh huruf kecil, angka, dan tanda strip." }, { status: 400 });
      }
      const supabase = await createClient();
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("slug", body.slug)
        .neq("id", id)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ error: "Slug sudah dipakai produk lain." }, { status: 400 });
      }
    }

    const success = await updateProduct(id, body);
    if (!success) {
      return NextResponse.json({ error: "Gagal mengupdate produk" }, { status: 400 });
    }

    // T-68: sinkronisasi gambar produk (daftar URL final dari form edit).
    // Sebelumnya images tidak pernah dikirim saat edit → gambar baru hanya
    // tersimpan di Storage tanpa record product_images.
    if (Array.isArray(body.images)) {
      const urls = body.images.filter((u: unknown): u is string => typeof u === "string");
      const synced = await syncProductImages(id, urls);
      if (!synced) {
        return NextResponse.json(
          { error: "Produk terupdate namun gagal menyinkronkan gambar." },
          { status: 400 }
        );
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminRole();
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 20, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });
    const { id } = await params;
    const success = await deleteProduct(id);
    if (!success) {
      return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAdminError(error);
  }
}
