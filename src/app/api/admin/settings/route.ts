import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyAdminRole } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 30, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const supabase = await createClient();

    // Verify admin role via helper
    await verifyAdminRole();

    // Fetch all store settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("store_settings")
      .select("*");

    if (settingsError) {
      return NextResponse.json({ error: "Gagal memuat pengaturan toko" }, { status: 400 });
    }

    // Fetch all admin profiles
    const { data: adminsData, error: adminsError } = await supabase
      .from("profiles")
      .select("id, name, email, role, created_at")
      .in("role", ["super_admin", "admin", "operator", "finance"]);

    if (adminsError) {
      return NextResponse.json({ error: "Gagal memuat data admin" }, { status: 400 });
    }

    // Format settings into a key-value map
    const settingsMap = (settingsData || []).reduce<Record<string, unknown>>((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    // Ensure default settings are returned if not set in DB
    const finalSettings: Record<string, unknown> = {
      ...settingsMap, // include all stored keys (pages, etc.)
      store_info: (settingsMap["store_info"] as Record<string, unknown> | undefined) || {
        name: "Hera Skincare",
        email: "info@heraskincare.com",
        phone: "+6281234567890",
        city: "Jakarta Selatan",
        description: "Marketplace produk rumah tangga premium.",
        address: "Alamat Gudang Hera Skincare",
        operational_hours: { start: "08:00", end: "21:00", days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] },
        social_media: { instagram: "", tiktok: "", facebook: "" }
      },
      shipping: (settingsMap["shipping"] as Record<string, unknown> | undefined) || {
        free_shipping: true,
        free_shipping_min: 100000,
        couriers: ["JNE", "J&T Express", "SiCepat", "Gosend", "Anteraja"],
        origin_city: "Jakarta Selatan"
      },
      payment: (settingsMap["payment"] as Record<string, unknown> | undefined) || {
        methods: ["Transfer Bank (BCA, Mandiri, BRI)", "GoPay", "OVO", "Dana", "ShopeePay", "Virtual Account", "COD (Bayar di Tempat)"],
        payment_timeout_hours: 24,
        bank_account: { bank: "BCA", owner: "Hera Skincare", number: "1234567890" }
      },
      seo: (settingsMap["seo"] as Record<string, unknown> | undefined) || {
        meta_pixel_id: "",
        ga4_measurement_id: "",
        default_title: "",
        default_description: "",
        default_keywords: "",
        robots_txt_content: "",
        sitemap_xml_content: "",
      },
      notifications: (settingsMap["notifications"] as Record<string, unknown> | undefined) || {
        email: {
          "Pesanan baru masuk": true,
          "Pembayaran diterima": true,
          "Stok produk menipis (< 10 item)": true,
          "Ulasan baru masuk": true,
          "Pertanyaan Q&A baru": true
        },
        wa: {
          "Pesanan baru masuk": true,
          "Pembayaran diterima": true,
          "Stok produk menipis (< 10 item)": false,
          "Ulasan baru masuk": false,
          "Pertanyaan Q&A baru": false
        }
      }
    };

    return NextResponse.json({
      settings: finalSettings,
      admins: adminsData || []
    });
  } catch (error) {
    console.error("[API GET Settings]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 20, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const supabase = await createClient();

    // Verify admin role via helper
    const { userId: adminUserId } = await verifyAdminRole();

    // Extra role check — only super_admin/admin can modify settings
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", adminUserId)
      .single();
    if (!profile || !["super_admin", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden. Hanya admin yang dapat mengubah pengaturan." }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "update_admin_role") {
      const { email, role } = body;
      if (!email || !role) {
        return NextResponse.json({ error: "Email dan Role wajib diisi" }, { status: 400 });
      }

      // Check if profile exists
      const { data: targetProfile, error: getProfileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (getProfileError || !targetProfile) {
        return NextResponse.json({ error: "Email tidak terdaftar sebagai customer di Hera Skincare. Minta mereka untuk mendaftar akun terlebih dahulu." }, { status: 400 });
      }

      // Map role display values to database keys if needed
      let dbRole = role.toLowerCase().replace(" ", "_");
      if (dbRole === "finance_(readonly)") dbRole = "finance";

      const { error } = await supabase
        .from("profiles")
        .update({ role: dbRole })
        .eq("id", targetProfile.id);

      if (error) {
        return NextResponse.json({ error: "Gagal memperbarui role admin" }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "remove_admin") {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: "ID admin wajib diisi" }, { status: 400 });
      }

      // Revert role back to 'customer'
      const { error } = await supabase
        .from("profiles")
        .update({ role: "customer" })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: "Gagal menghapus admin" }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    // Default: update store_settings key
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json({ error: "Key and Value are required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("store_settings")
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      });

    if (error) {
      return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API PUT Settings]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
