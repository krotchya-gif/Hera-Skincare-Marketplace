import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyAdminRole } from "@/lib/auth-utils";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

function getWeekOfMonth(date: Date): number {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeek = startOfMonth.getDay(); // 0=Sun, 1=Mon, ...
  const adjustedDate = date.getDate() + dayOfWeek - 1; // Adjust so Monday is start
  return Math.floor(adjustedDate / 7);
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rlKey = getRateLimitKey(request);
    const { allowed } = checkRateLimit(rlKey, 30, 60000);
    if (!allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi." }, { status: 429 });

    const supabase = await createClient();

    // Verify admin role via helper
    await verifyAdminRole();

    // ─── Pagination: month/year query params ────────────────────────────
    const { searchParams } = new URL(request.url);
    const now = new Date();

    // Default: last 12 months
    let year = parseInt(searchParams.get("year") || String(now.getFullYear()));
    let month = parseInt(searchParams.get("month") || "0"); // 0 = all months in the year

    if (isNaN(year)) year = now.getFullYear();
    if (isNaN(month)) month = 0;

    // Build date range
    let dateFrom: string, dateTo: string;
    if (month > 0 && month <= 12) {
      // Specific month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      dateFrom = startDate.toISOString().split("T")[0];
      dateTo = endDate.toISOString().split("T")[0];
    } else {
      // Whole year — limit to 1 year back from now (or specified year)
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      dateFrom = startDate.toISOString().split("T")[0];
      dateTo = endDate.toISOString().split("T")[0];
    }

    // ─── Fetch orders in range ─────────────────────────────────────────
    const query = supabase
      .from("orders")
      .select("*")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo)
      .order("created_at", { ascending: false });

    const { data: orders, error } = await query;

    if (error || !orders) {
      console.error("[Finance API] Query error:", error);
      return NextResponse.json({ error: "Gagal memuat data pesanan" }, { status: 400 });
    }

    // ─── Calculate total stats ──────────────────────────────────────────
    const paidOrders = orders.filter(o => o.payment_status === "lunas");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalOrders = paidOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const totalDiscount = orders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);

    // ─── Daily data (last 7 days in range) ─────────────────────────────
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const rangeEnd = dateTo ? new Date(dateTo) : new Date();
    const dailyData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(rangeEnd);
      d.setDate(d.getDate() - (6 - i));
      const dateString = d.toISOString().split("T")[0];
      const dayName = days[d.getDay()];

      const dayOrders = paidOrders.filter(o => o.created_at.startsWith(dateString));
      const revenue = dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      return {
        day: dayName,
        pendapatan: revenue,
        pesanan: dayOrders.length,
      };
    });

    // ─── Monthly comparison (current month weeks vs previous month weeks) ──
    const selectedDate = month > 0 ? new Date(year, month - 1) : now;
    const thisYear = selectedDate.getFullYear();
    const thisMonth = selectedDate.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const monthCompare = Array.from({ length: 4 }).map((_, i) => {
      const weekNum = i + 1;

      const thisMonthOrders = paidOrders.filter(o => {
        const od = new Date(o.created_at);
        return od.getFullYear() === thisYear && od.getMonth() === thisMonth && getWeekOfMonth(od) === i;
      });
      const lastMonthOrders = paidOrders.filter(o => {
        const od = new Date(o.created_at);
        return od.getFullYear() === lastMonthYear && od.getMonth() === lastMonth && getWeekOfMonth(od) === i;
      });

      return {
        week: `Mg ${weekNum}`,
        bulanIni: thisMonthOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
        bulanLalu: lastMonthOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
      };
    });

    // ─── Payment method distribution ────────────────────────────────────
    const payMap: Record<string, number> = {};
    orders.forEach(o => {
      if (o.payment_method) {
        payMap[o.payment_method] = (payMap[o.payment_method] || 0) + 1;
      }
    });
    const totalWithPayment = Object.values(payMap).reduce((s, v) => s + v, 0);
    const colors = ["#16A34A", "#22D3EE", "#FBBF24", "#A78BFA", "#F43F5E"];
    const paymentData = Object.entries(payMap).map(([name, count], i) => {
      const percentage = totalWithPayment > 0 ? Math.round((count / totalWithPayment) * 100) : 0;
      const amount = orders
        .filter(o => o.payment_method === name && o.payment_status === "lunas")
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      return {
        name,
        value: percentage,
        color: colors[i % colors.length],
        amount: `Rp ${amount.toLocaleString("id-ID")}`,
      };
    });

    // ─── Transactions list (latest 10 in range) ────────────────────────
    const transactions = orders.slice(0, 10).map(o => {
      const shippingAddr = o.shipping_address as { name?: string } | null;
      return {
        id: o.order_number,
        date: new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        customer: shippingAddr?.name || "Pelanggan",
        subtotal: Number(o.subtotal) || 0,
        shipping: Number(o.shipping_cost) || 0,
        discount: Number(o.discount) || 0,
        total: Number(o.total) || 0,
        payStatus: o.payment_status,
      };
    });

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalDiscount,
      dailyData,
      monthCompare,
      paymentData,
      transactions,
      // Metadata for pagination
      meta: {
        year,
        month,
        dateFrom,
        dateTo,
        totalOrdersInRange: orders.length,
        paidOrdersInRange: paidOrders.length,
      },
    });
  } catch (error) {
    console.error("[API GET Finance]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
