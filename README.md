# Hera Skincare Marketplace

Full-stack marketplace untuk produk skincare & perawatan pribadi. **Next.js 16** + **Supabase**.

## Tech Stack

- **Framework**: Next.js 16.3.2 (App Router + Turbopack)
- **Language**: TypeScript 6.0 (strict)
- **Styling**: Tailwind CSS 4 + Poppins
- **Database**: Supabase PostgreSQL + RLS
- **Auth**: Supabase SSR (cookie-based)
- **Storage**: Supabase Storage (bucket `product-images`)
- **Charts**: Recharts
- **Icons**: Lucide React
- **DB Tooling**: Supabase MCP (DILARANG pakai supabase CLI — DB-SYNC-2)

## Struktur Project

```
marketplace/
├── src/
│   ├── app/
│   │   ├── page.tsx, layout.tsx, not-found.tsx
│   │   ├── manifest.ts     # Dynamic PWA Manifest
│   │   ├── icon.tsx         # Dynamic Favicon (32x32)
│   │   ├── apple-icon.tsx   # Dynamic Apple Touch Icon (180x180)
│   │   ├── icon-192.png/    # Dynamic PWA icon route
│   │   ├── icon-512.png/    # Dynamic PWA icon route
│   │   ├── tentang-kami/, karir/, blog/, hubungi-kami/, faq/, cara-belanja/, pengembalian-barang/
│   │   ├── kategori/[slug]/, produk/[slug]/, keranjang/, checkout/, profil/
│   │   ├── bayar/[id]/, voucher/, perbandingan/          # perbandingan = T-06.2
│   │   ├── admin/ (login + 12 dashboard pages)
│   │   ├── llms.txt/, sitemap.xml/, robots.txt/
│   │   └── api/ (44 route handlers)
│   │   ├── admin/blog/     # Blog CRUD (terpisah dari Pengaturan)
│   ├── components/
│   │   ├── Navbar.tsx, Footer.tsx, Toast.tsx, ErrorBoundary.tsx
│   │   ├── *Client.tsx (Home, Category, ProductDetail, Profil)
│   │   ├── CategoryIcon.tsx  # Render icon Lucide dinamis dari nama (T-47)
│   │   ├── UtmCapture.tsx    # Capture UTM dari URL (T-41)
│   │   ├── ProductQnA.tsx  # Q&A produk (T-06.1)
│   │   ├── VoucherCard.tsx
│   │   └── admin/ (Shell, Sidebar, Topbar, Dashboard, StatCard, StatusBadge,
│   │                ProductFormModal, OrderDetailModal, NotificationDropdown)
│   ├── lib/        (products, orders, admin, auth-utils, vouchers, rate-limit,
│   │                cart-utils, comparison-utils, notify, seo, tracking,
│   │                utm, google-analytics, product-image, ai-crawlers,
│   │                shipping, banners, push)
│   ├── types/      (database.ts)
│   └── utils/      (format, storeConfig, order-status, supabase client/server/admin)
│   └── proxy.ts    # Next.js 16 Proxy (menggantikan middleware.ts)
├── supabase/migrations/ (1 file — full schema konsolidasi)
```

## Fitur

### Customer (18 halaman)
- **Homepage** — Hero, Kategori Populer, Flash Sale (countdown), Terlaris, Promo
- **Kategori** — Breadcrumb, sub-kategori, filter, pagination
- **Detail Produk** — Galeri gambar, varian, qty, CTA, tab deskripsi/ulasan/**tanya jawab**, rekomendasi, tombol perbandingan
- **Perbandingan** — Bandingkan hingga 4 produk side-by-side (`/perbandingan`)
- **Keranjang** — Checkbox, qty, voucher, ringkasan
- **Checkout** — 5-step: Alamat → Pengiriman → Pembayaran → Konfirmasi → Selesai; UTM campaign tersimpan ke order; ongkir real via RajaOngkir V2 (Komerce) + gratis ongkir konsisten, fallback tarif flat
- **Profil** — Tab pesanan, wishlist, alamat, edit profil, aksi per-status
- **Pembayaran** — Info rekening dari DB, lapor bayar (verifikasi admin), **bayar online via Xendit** (QRIS/e-wallet/VA) + salin/kirim link invoice via WhatsApp
- **Voucher** — Daftar voucher + copy code
- **7 halaman statis** — Tentang Kami, Karir, Blog, Hubungi Kami (WhatsApp + Maps), FAQ, Cara Belanja, Pengembalian Barang
- **`llms.txt`** — file teks untuk AI crawler (GEO)

### Mobile
- Bottom Tab Bar (fixed root layout), Floating WhatsApp, mobile-first responsive layout.
- **Sticky Product Action Bar** — Tombol checkout melayang di bagian bawah halaman detail produk mobile.

### Admin Dashboard (12 halaman)
- **Overview** — 4 KPI + LineChart 30 hari + PieChart + badge status payment
- **Produk** — CRUD + toggle status + upload foto, slide-out form modal
- **Pesanan** — Filter status/date, detail modal, update status + resi + **verifikasi pembayaran manual** (lunas/gagal)
- **Pelanggan** — Tabel + total belanja + riwayat + block/activate
- **Kategori** — Card grid + CRUD + **pemilih icon Lucide**
- **Blog** — CRUD artikel blog (slug, title, excerpt, ikon)
- **Keuangan** — Filter period + BarChart + PieChart
- **Promo** — Voucher CRUD + **Flash Sale CRUD penuh** (create/edit/delete/toggle + items)
- **Ulasan** — Rating summary + progress bar + toggle + **panel jawab pertanyaan produk (Q&A)**
- **Marketing (6 tab)** — Ringkasan (KPI + performa voucher) · Analytics (pendapatan 7 hari, status pesanan, **angka real GA4 & Search Console**) · Event Monitor (100 event + retry) · UTM Campaign (builder link + laporan kunjungan/order/revenue per source) · Banner (CRUD banner promosi) · Push (broadcast Web Push)
- **Pengaturan** — 7 tabs: Info, Pengiriman, Pembayaran, Notifikasi, Admin, SEO (Meta Pixel, GA4, GTM, Clarity, Google Ads, TikTok, AI crawler block, GEO/JSON-LD, service account Google API), Halaman Statis
- **Login Admin Bento Grid** — Redesain premium bermotif bento grid dengan live server status metrics dan terminal logs.

### Infrastructure
- **Next.js 16 Proxy** — `src/proxy.ts` (JANGAN buat `middleware.ts`); cookie refresh disalin ke response
- **Dynamic SEO** — sitemap.xml, robots.txt (+ AI crawler block), llms.txt, meta tags per-page, Meta Pixel & GA4 & GTM & Clarity & Google Ads & TikTok, JSON-LD LocalBusiness
- **Web App PWA** — Registrasi manifest PWA dinamis, dynamic favicon generator, dynamic apple touch icon, serta dynamic routes 192px/512px menggunakan Next.js `ImageResponse` (nodejs runtime).
- **Security** — CSP + headers di `next.config.ts`, rate limiting, atomic stock, input validation, upload magic-bytes. Fungsi RPC `SECURITY DEFINER` sudah di-hardening: `EXECUTE` dicabut dari `anon`/`PUBLIC` (lihat bagian Hardening di `supabase/migrations/20260822130000_full_schema.sql`).
- **Auth** — proxy guard admin routes + `verifyAdminRole()` per-handler
- **Toast Notifications** — Integrasi custom toast menggantikan semua dialog `alert()` bawaan browser.
- **Payment Redirect** — Setelah konfirmasi bayar, customer otomatis redirect ke halaman pesanan.
- **Client Routing** — Navigasi internal memakai `useRouter().push()` (bukan `window.location.href`).
- **Pembayaran Online** — Xendit Invoice API v2 (QRIS/e-wallet/VA/kartu/retail) via route server-side; webhook `x-callback-token` verified + idempotent + cek `paid_amount`; alur transfer manual tetap utuh (customer lapor → admin verifikasi).
- **Notifikasi Otomatis** — Email (Resend) & WhatsApp (Fonnte) ke customer saat status pesanan berubah; fire-and-forget, nonaktif bila env kosong.
- **Push Notification (T-64)** — Web Push VAPID: opt-in di homepage (user login), service worker `public/sw.js`, broadcast dari tab Marketing → Push; prune langganan mati otomatis; nonaktif bila env kosong.
- **Banner Promosi (T-63)** — CRUD banner di tab Marketing → Banner, tampil sebagai carousel auto-rotate di homepage.
- **Event Tracking & UTM** — event_logs (5 pemicu) + utm_visits + orders.utm_source untuk atribusi kampanye.
- **Ikon** — Semua UI memakai icon Lucide (termasuk kategori — nama icon disimpan di DB, dirender via `CategoryIcon`).

## API Routes (44)

| Route | Method | Auth | Deskripsi |
|-------|--------|------|-----------|
| `/api/payments/xendit/create` | POST | Required | Buat/pakai-ulang Xendit Invoice untuk order milik user |
| `/api/payments/xendit/webhook` | POST | Callback token | Callback status pembayaran Xendit (server-to-server, cek paid_amount) |
| `/api/products/qna` | POST | Required | Ajukan pertanyaan produk |
| `/api/products` | GET | Public | List produk (filter kategori/subkategori, sort, pagination) |
| `/api/orders` | POST | Required | Buat pesanan + validasi (harga efektif promo/flash sale, UTM) |
| `/api/orders/[id]/confirm-payment` | POST | Required | Lapor bayar manual → notifikasi admin (bukan self-mark lunas) |
| `/api/vouchers/validate` | POST | Required | Validasi voucher (kuota + per-user limit) |
| `/api/addresses` | GET/POST | Required | CRUD alamat |
| `/api/addresses/[id]` | PUT/DELETE | Required | Update/hapus alamat |
| `/api/notifications` | GET | Required | Notifikasi |
| `/api/notifications/read-all` | PUT | Required | Tandai dibaca |
| `/api/admin/products` | GET/POST | Admin | CRUD produk |
| `/api/admin/products/[id]` | PUT/DELETE | Admin | Update/hapus |
| `/api/admin/products/[id]/toggle` | PATCH | Admin | Toggle status |
| `/api/admin/categories` | GET/POST | Admin | CRUD kategori |
| `/api/admin/categories/[id]` | PUT/DELETE | Admin | Update/hapus |
| `/api/admin/orders` | GET | Admin | List + stats |
| `/api/admin/orders/[id]` | GET/PUT | Admin | Detail + update status + verifikasi pembayaran |
| `/api/admin/orders/export` | GET | Admin | Export CSV (filter: date, status, search) |
| `/api/admin/customers` | GET | Admin | List + stats |
| `/api/admin/customers/[id]` | PUT | Admin | Block/activate |
| `/api/admin/reviews` | GET | Admin | List + stats |
| `/api/admin/reviews/[id]/toggle` | PATCH | Admin | Toggle visibilitas |
| `/api/admin/vouchers` | GET/POST | Admin | CRUD voucher |
| `/api/admin/vouchers/[id]/toggle` | PATCH | Admin | Toggle status |
| `/api/admin/flash-sales` | GET/POST | Admin | List & create flash sale + items |
| `/api/admin/flash-sales/[id]` | PUT/DELETE | Admin | Update/hapus flash sale |
| `/api/admin/flash-sales/[id]/toggle` | PATCH | Admin | Toggle status flash sale |
| `/api/admin/qna` | GET | Admin | Daftar semua pertanyaan produk |
| `/api/admin/qna/[id]` | PATCH/DELETE | Admin | Jawab/hapus pertanyaan |
| `/api/admin/finance` | GET | Admin | Data keuangan |
| `/api/admin/settings` | GET/PUT | Admin | Store settings (semua key) |
| `/api/admin/upload` | POST | Admin | Upload foto produk (magic-bytes verified) |
| `/api/admin/events` | GET/PATCH | Admin | Event monitor — daftar 100 event + retry (T-40) |
| `/api/admin/utm` | GET | Admin | Laporan UTM per source (kunjungan/order/revenue, T-41) |
| `/api/admin/analytics` | GET | Admin | Angka real GA4 + Search Console (T-43) |
| `/api/newsletter` | POST | Public (rate-limit) | Simpan subscriber newsletter (server-side, RLS-safe — T-53) |
| `/api/shipping/destination` | GET | Required | Pencarian area tujuan RajaOngkir V2 (proxy server — T-54) |
| `/api/shipping/cost` | POST | Required | Ongkir per kurir utk alamat+item; berat dari DB; fallback flat (T-54) |
| `/api/admin/banners` | GET/POST | Admin | CRUD banner promosi (T-63) |
| `/api/admin/banners/[id]` | PUT/DELETE | Admin | Update/hapus banner |
| `/api/admin/banners/[id]/toggle` | PATCH | Admin | Toggle status banner |
| `/api/push/subscribe` | GET/POST/DELETE | Required | Web Push: public key, simpan & hapus langganan (T-64) |
| `/api/admin/push` | GET/POST | Admin | Jumlah langganan + kirim broadcast push (T-64) |

## Cara Menjalankan

### 1. Environment
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Database
```bash
# DILARANG pakai supabase CLI. Perubahan skema WAJIB via Supabase MCP:
#   - apply_migration  → terapkan migration
#   - list_tables / execute_sql / get_advisors → verifikasi live
# Pedoman skema SATU-SATUNYA: supabase/migrations/20260822130000_full_schema.sql
```

### 3. Install & Run
```bash
npm install
npm run dev         # → localhost:3000
```

### 4. Setup Admin
```sql
UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com';
```
Login di `/admin/login`.

## Migration

**Satu file konsolidasi** — init + seed keseluruhan database, merepresentasikan DB live:

| File | Deskripsi |
|------|-----------|
| `supabase/migrations/20260822130000_full_schema.sql` | SATU-SATUNYA pedoman skema: tabel + RLS + fungsi + trigger + storage + seed + hardening RPC (hasil konsolidasi 7 migration lama, T-12). Seed terkini (T-47): 30 kategori kecantikan (icon Lucide), 16 produk skincare, 7 varian, gambar picsum, flash sale, voucher. Harus sinkron dengan live DB (DB-SYNC-1) |

Terapkan pada project baru via **Supabase MCP** (`apply_migration`) — DILARANG `supabase db push`/CLI (DB-SYNC-2).

## Verifikasi

| Command | Fungsi |
|---------|--------|
| `npm run lint` | ESLint (baseline: 13 problems — semua error pre-existing `no-explicit-any` dll., 0 warning) |
| `npm run typecheck` | `tsc --noEmit`, harus exit 0 |
| `npm run build` | Production build, harus exit 0 |

## Environment Variables

| Var | Wajib | Fungsi |
|-----|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` / `..._KEY` | ✅ | Supabase project |
| `NEXT_PUBLIC_SITE_URL` | ✅ | sitemap & robots |
| `SUPABASE_SERVICE_ROLE_KEY` | utk webhook | Service-role (server-side only) |
| `XENDIT_SECRET_KEY` / `XENDIT_CALLBACK_TOKEN` | opsional | Pembayaran online Xendit |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `FONNTE_TOKEN` | opsional | Notifikasi Email/WA |
| `RAJAONGKIR_API_KEY` | opsional | Ongkir real RajaOngkir V2/Komerce (T-54); kosong = tarif flat |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | opsional | Web Push notification (T-64); kosong = fitur nonaktif |
| `NEXT_PUBLIC_STORE_*` (5 var) | opsional | Fallback di `storeConfig.ts` |

## Status

Semua pekerjaan aktif dilacak di **[`plan.md`](plan.md)** (single source of truth — protokol task, Definition of Done, changelog). Riwayat audit lama: `doc.md` & `Todo.md` (arsip lokal — sudah dihapus 2026-08-29, lihat T-15).
