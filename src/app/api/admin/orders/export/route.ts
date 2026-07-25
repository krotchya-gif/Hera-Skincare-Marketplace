// ─── Export Orders as CSV ──────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, type OrderFilters } from "@/lib/orders";
import { verifyAdminRole, handleAdminError } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

const MAX_EXPORT_ROWS = 5000;

export async function GET(request: NextRequest) {
  try {
    await verifyAdminRole();

    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 5, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const status = searchParams.get("status") as OrderFilters["status"] || undefined;
    const search = searchParams.get("search") || undefined;

    // Validasi parameter date wajib
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "Parameter dateFrom dan dateTo wajib diisi. Batasi export berdasarkan rentang tanggal." },
        { status: 400 }
      );
    }

    // Hitung perkiraan jumlah data dalam range
    const previewRes = await getAllOrders({ dateFrom, dateTo, status, search, page: 1, pageSize: 1 });
    const estimatedCount = previewRes.count || 0;

    if (estimatedCount > MAX_EXPORT_ROWS) {
      return NextResponse.json(
        {
          error: `Data dalam rentang tanggal yang dipilih terlalu banyak (${estimatedCount.toLocaleString("id-ID")} baris). Maksimal ${MAX_EXPORT_ROWS.toLocaleString("id-ID")} baris per export. Persempit rentang tanggal dan coba lagi.`,
          maxRows: MAX_EXPORT_ROWS,
          estimatedRows: estimatedCount,
        },
        { status: 400 }
      );
    }

    const CHUNK_SIZE = 500;
    const firstPage = await getAllOrders({ dateFrom, dateTo, status, search, page: 1, pageSize: CHUNK_SIZE });
    const totalCount = firstPage.count;
    const totalPages = Math.ceil(Math.min(totalCount, MAX_EXPORT_ROWS) / CHUNK_SIZE);

    let allOrders = [...firstPage.data];
    for (let page = 2; page <= totalPages; page++) {
      const chunk = await getAllOrders({ dateFrom, dateTo, status, search, page, pageSize: CHUNK_SIZE });
      allOrders = [...allOrders, ...chunk.data];
    }

    // Batasi ke MAX_EXPORT_ROWS
    if (allOrders.length > MAX_EXPORT_ROWS) {
      allOrders = allOrders.slice(0, MAX_EXPORT_ROWS);
    }

    const headers = [
      "No. Pesanan",
      "Tanggal",
      "Pelanggan",
      "Status",
      "Pembayaran",
      "Subtotal",
      "Ongkir",
      "Diskon",
      "Total",
      "Metode Pembayaran",
      "Kurir",
      "No. Resi",
    ].join(",");

    const rows = allOrders.map((order) =>
      [
        order.order_number,
        new Date(order.created_at).toLocaleDateString("id-ID"),
        `"${order.profiles?.name || "Pelanggan"}"`,
        order.status,
        order.payment_status,
        order.subtotal,
        order.shipping_cost,
        order.discount,
        order.total,
        `"${order.payment_method || ""}"`,
        `"${order.shipping_method || ""}"`,
        `"${order.tracking_number || ""}"`,
      ].join(",")
    );

    const csv = "\uFEFF" + [headers, ...rows].join("\n"); // BOM for UTF-8 Excel

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    return handleAdminError(error);
  }
}
