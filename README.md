# Hera Store Marketplace

Full-stack marketplace untuk produk rumah tangga dan perawatan pribadi. **Next.js 16** + **Supabase**.

## Tech Stack

- **Framework**: Next.js 16.2.9 (App Router + Turbopack)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS 4 + Poppins
- **Database**: Supabase PostgreSQL + RLS
- **Auth**: Supabase SSR (cookie-based)
- **Storage**: Supabase Storage (bucket `product-images`)
- **Charts**: Recharts
- **Icons**: Lucide React
- **CLI**: Supabase CLI

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
│   │   ├── bayar/[id]/, voucher/
│   │   ├── admin/ (login + 10 dashboard pages)
│   │   ├── sitemap.xml/, robots.txt/
│   │   └── api/ (24 route handlers)
│   ├── components/
│   │   ├── Navbar.tsx, Footer.tsx, Toast.tsx, ErrorBoundary.tsx
│   │   ├── *Client.tsx (Home, Category, ProductDetail, Profil)
│   │   ├── VoucherCard.tsx
│   │   └── admin/ (Shell, Sidebar, Topbar, Dashboard, StatCard, StatusBadge,
│   │                ProductFormModal, OrderDetailModal, NotificationDropdown)
│   ├── lib/        (products, orders, admin, auth-utils, vouchers, rate-limit, cart-utils, seo)
│   ├── types/      (database.ts)
│   └── utils/      (format, storeConfig, order-status, supabase client/server)
│   └── proxy.ts    # Next.js 16 Proxy (menggantikan middleware.ts)
├── supabase/migrations/ (6 files)
```

## Fitur

### Customer (15 halaman)
- **Homepage** — Hero, Kategori Populer, Flash Sale (countdown), Terlaris, Promo
- **Kategori** — Breadcrumb, sub-kategori, filter, pagination
- **Detail Produk** — Galeri, varian, qty, CTA, ulasan, rekomendasi
- **Keranjang** — Checkbox, qty, voucher, ringkasan
- **Checkout** — 5-step: Alamat → Pengiriman → Pembayaran → Konfirmasi → Selesai
- **Profil** — Tab pesanan, wishlist, alamat, edit profil, aksi per-status
- **Pembayaran** — Info rekening dari DB, konfirmasi bayar
- **Voucher** — Daftar voucher + copy code
- **7 halaman statis** — Tentang Kami, Karir, Blog, Hubungi Kami (WhatsApp + Maps), FAQ, Cara Belanja, Pengembalian Barang

### Mobile
- Bottom Tab Bar (fixed root layout), Floating WhatsApp, mobile-first responsive layout.
- **Sticky Product Action Bar** — Tombol checkout melayang di bagian bawah halaman detail produk mobile.

### Admin Dashboard (11 halaman)
- **Overview** — 4 KPI + LineChart 30 hari + PieChart
- **Produk** — CRUD + toggle status + upload foto, slide-out form modal
- **Pesanan** — Filter status/date, detail modal, update status + resi
- **Pelanggan** — Tabel + total belanja + riwayat + block/activate
- **Kategori** — Card grid + CRUD
- **Keuangan** — Filter period + BarChart + PieChart
- **Promo** — Voucher CRUD + Flash Sale (read-only)
- **Ulasan** — Rating summary + progress bar + toggle
- **Marketing** — Dashboard (placeholder)
- **Pengaturan** — 7 tabs: Info, Pengiriman, Pembayaran, Notifikasi, Admin, SEO, Halaman Statis
- **Login Admin Bento Grid** — Redesain premium bermotif bento grid dengan live server status metrics dan terminal logs.

### Infrastructure
- **Next.js 16 Proxy** — `src/proxy.ts` (JANGAN buat `middleware.ts`)
- **Dynamic SEO** — sitemap.xml, robots.txt, meta tags per-page, Meta Pixel & GA4
- **Web App PWA** — Registrasi manifest PWA dinamis, dynamic favicon generator, dynamic apple touch icon, serta dynamic routes 192px/512px menggunakan Next.js `ImageResponse` (edge runtime).
- **Security** — CSP + headers di `next.config.ts`, rate limiting, atomic stock, input validation
- **Auth** — proxy guard admin routes + `verifyAdminRole()` per-handler
- **Toast Notifications** — Integrasi custom toast menggantikan semua dialog `alert()` bawaan browser.

## API Routes (24)

| Route | Method | Auth | Deskripsi |
|-------|--------|------|-----------|
| `/api/products` | GET | Public | List produk (filter, sort, pagination) |
| `/api/orders` | POST | Required | Buat pesanan + validasi |
| `/api/orders/[id]/confirm-payment` | POST | Required | Konfirmasi bayar |
| `/api/vouchers/validate` | POST | Required | Validasi voucher |
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
| `/api/admin/orders/[id]` | GET/PUT | Admin | Detail + update status |
| `/api/admin/orders/export` | GET | Admin | Export CSV (filter: date, status, search) |
| `/api/admin/customers` | GET | Admin | List + stats |
| `/api/admin/customers/[id]` | PUT | Admin | Block/activate |
| `/api/admin/reviews` | GET | Admin | List + stats |
| `/api/admin/reviews/[id]/toggle` | PATCH | Admin | Toggle visibilitas |
| `/api/admin/vouchers` | GET/POST | Admin | CRUD voucher |
| `/api/admin/vouchers/[id]/toggle` | PATCH | Admin | Toggle status |
| `/api/admin/finance` | GET | Admin | Data keuangan |
| `/api/admin/settings` | GET/PUT | Admin | Store settings (semua key) |
| `/api/admin/upload` | POST | Admin | Upload foto produk |

## Cara Menjalankan

### 1. Environment
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Database
```bash
supabase db push    # Jalankan 6 migrations
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

## Migrations (6 files)

| File | Deskripsi |
|------|-----------|
| `20260621000001_full_schema.sql` | Semua tabel, RLS, functions, triggers, storage |
| `20260621000002_seed_data.sql` | Seed: kategori, produk, varian, voucher, flash sale, settings |
| `20260621000003_notifications.sql` | Tabel + trigger notifikasi |
| `20260622000001_fix_security.sql` | RLS fixes, CHECK constraints, indexes, atomic stock |
| `20260623000001_additional_fixes.sql` | Variant stock RPC |
| `20260624000001_voucher_code_order.sql` | Kolom `voucher_code` di orders + index |

## Status

| Area | Status |
|------|--------|
| Customer Pages | ✅ 15/15 |
| Admin Dashboard | ✅ 11/11 |
| API Routes | ✅ 24/24 |
| Build | ✅ 42 routes, 0 error |
| Bugs Fixed | ✅ 77/108 (17 skip, 14 LOW open) |
