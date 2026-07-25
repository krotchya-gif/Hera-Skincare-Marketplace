import { NextRequest, NextResponse } from "next/server";
import { createOrder, type CreateOrderPayload } from "@/lib/orders";
import { createClient } from "@/utils/supabase/server";
import { validateVoucher } from "@/lib/vouchers";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 10, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit." },
        {
          status: 429,
          headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" },
        }
      );
    }

    const body = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Silakan masuk (login) terlebih dahulu untuk membuat pesanan." }, { status: 401 });
    }

    // ── Validasi input dasar ──────────────────────────────────
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Pesanan harus memiliki minimal satu item." }, { status: 400 });
    }

    // ── Fetch harga & stok real dari DB ───────────────────────
    const productIds = [...new Set(body.items.map((item: any) => item.product_id))];
    const { data: dbProducts, error: productError } = await supabase
      .from("products")
      .select("id, price, stock, name")
      .in("id", productIds);

    if (productError || !dbProducts) {
      return NextResponse.json({ error: "Gagal memuat data produk." }, { status: 400 });
    }

    const productMap = new Map<string, { id: string; price: number; stock: number; name: string }>(
      dbProducts.map((p: any) => [p.id, p])
    );

    // Fetch variant data if any items have variant_id
    const variantIds = body.items.filter((i: any) => i.variant_id).map((i: any) => i.variant_id);
    let variantMap = new Map<string, { id: string; product_id: string; price: number; stock: number }>();
    if (variantIds.length > 0) {
      const { data: dbVariants } = await supabase
        .from("product_variants")
        .select("id, product_id, price, stock")
        .in("id", variantIds);
      if (dbVariants) {
        variantMap = new Map(dbVariants.map((v: any) => [v.id, v]));
      }
    }

    // ── Validasi setiap item ──────────────────────────────────
    let calculatedSubtotal = 0;
    for (const item of body.items) {
      const dbProduct = productMap.get(item.product_id);
      if (!dbProduct) {
        return NextResponse.json({ error: `Produk "${item.product_name}" tidak ditemukan.` }, { status: 400 });
      }

      if (item.variant_id) {
        const dbVariant = variantMap.get(item.variant_id);
        if (!dbVariant) {
          return NextResponse.json({ error: `Varian produk "${dbProduct.name}" tidak ditemukan.` }, { status: 400 });
        }
        if (dbVariant.product_id !== item.product_id) {
          return NextResponse.json({ error: `Varian tidak sesuai dengan produk "${dbProduct.name}".` }, { status: 400 });
        }
        // Validasi harga variant
        if (Number(dbVariant.price) !== Number(item.price)) {
          return NextResponse.json({
            error: `Harga varian "${dbProduct.name}" tidak sesuai. Silakan refresh halaman.`,
          }, { status: 400 });
        }
        // Validasi stok variant
        if ((dbVariant.stock ?? 0) < item.qty) {
          return NextResponse.json({
            error: `Stok varian "${dbProduct.name}" tidak mencukupi. Tersedia: ${dbVariant.stock}, diminta: ${item.qty}.`,
          }, { status: 400 });
        }
        calculatedSubtotal += Number(dbVariant.price) * item.qty;
      } else {
        // Validasi harga produk (tanpa varian)
        if (Number(dbProduct.price) !== Number(item.price)) {
          return NextResponse.json({
            error: `Harga produk "${dbProduct.name}" tidak sesuai. Silakan refresh halaman.`,
          }, { status: 400 });
        }

        // Validasi stok produk
        if ((dbProduct.stock ?? 0) < item.qty) {
          return NextResponse.json({
            error: `Stok "${dbProduct.name}" tidak mencukupi. Tersedia: ${dbProduct.stock}, diminta: ${item.qty}.`,
          }, { status: 400 });
        }

        calculatedSubtotal += Number(dbProduct.price) * item.qty;
      }
    }

    // ── Validasi subtotal ─────────────────────────────────────
    if (Number(body.subtotal) !== calculatedSubtotal) {
      return NextResponse.json({ error: "Subtotal tidak valid." }, { status: 400 });
    }

    // ── Validasi voucher ──────────────────────────────────────
    const calculatedDiscount = Number(body.discount) || 0;

    if (calculatedDiscount > 0) {
      if (!body.voucher_code) {
        return NextResponse.json({ error: "Kode voucher diperlukan untuk menggunakan diskon." }, { status: 400 });
      }
      const voucherResult = await validateVoucher(body.voucher_code, calculatedSubtotal);
      if (!voucherResult.valid) {
        return NextResponse.json({ error: voucherResult.message }, { status: 400 });
      }
      if (Number(voucherResult.discount) !== calculatedDiscount) {
        return NextResponse.json({ error: "Nilai diskon tidak sesuai dengan voucher." }, { status: 400 });
      }
    }

    // ── Validasi total ────────────────────────────────────────
    const shippingCost = Number(body.shipping_cost) || 0;
    const expectedTotal = calculatedSubtotal + shippingCost - calculatedDiscount;
    if (Number(body.total) !== expectedTotal) {
      return NextResponse.json({ error: "Total pesanan tidak valid." }, { status: 400 });
    }

    // ── Buat pesanan ──────────────────────────────────────────
    const payload: CreateOrderPayload = {
      user_id: user.id,
      shipping_address: body.shipping_address,
      shipping_method: body.shipping_method,
      shipping_cost: shippingCost,
      payment_method: body.payment_method,
      subtotal: calculatedSubtotal,
      discount: calculatedDiscount,
      total: expectedTotal,
      notes: body.notes || "",
      voucher_code: body.voucher_code || undefined,
      items: body.items.map((item: any) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        qty: item.qty,
        price: Number(item.price),
        subtotal: Number(item.price) * item.qty,
      })),
    };

    const order = await createOrder(payload);
    if (!order) {
      return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 400 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[API POST Public Order]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
