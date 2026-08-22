# Hera Skincare Marketplace

Full-stack marketplace untuk produk rumah tangga dan perawatan pribadi. **Next.js 16** + **Supabase**.

## Tech Stack

- **Framework**: Next.js 16.3.2 (App Router + Turbopack)
- **Language**: TypeScript 6.0 (strict)
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
│   │   ├── bayar/[id]/, voucher/, perbandingan/          # perbandingan = T-06.2
│   │   ├── admin/ (login + 12 dashboard pages)
│   │   ├── sitemap.xml/, robots.txt/
│   │   └── api/ (33 route handlers)
│   │   ├── admin/blog/     # Blog CRUD (terpisah dari Pengaturan)
│   ├── components/
│   │   ├── Navbar.tsx, Footer.tsx, Toast.tsx, ErrorBoundary.tsx
│   │   ├── *Client.tsx (Home, Category, ProductDetail, Profil)
│   │   ├── ProductQnA.tsx  # Q&A produk (T-06.1)
│   │   ├── VoucherCard.tsx
│   │   └── admin/ (Shell, Sidebar, Topbar, Dashboard, StatCard, StatusBadge,
│   │                ProductFormModal, OrderDetailModal, NotificationDropdown)
│   ├── lib/        (products, orders, admin, auth-utils, vouchers, rate-limit,
│   │                cart-utils, comparison-utils, notify, seo)
│   ├── types/      (database.ts)
│   └── utils/      (format, storeConfig, order-status, supabase client/server/admin)
│   └── proxy.ts    # Next.js 16 Proxy (menggantikan middleware.ts)
├── supabase/migrations/ (1 file — full schema konsolidasi)
```

## Fitur

### Customer (16 halaman)
- **Homepage** — Hero, Kategori Populer, Flash Sale (countdown), Terlaris, Promo
- **Kategori** — Breadcrumb, sub-kategori, filter, pagination
- **Detail Produk** — Galeri, varian, qty, CTA, tab deskripsi/ulasan/**tanya jawab**, rekomendasi, tombol perbandingan
- **Perbandingan** — Bandingkan hingga 4 produk side-by-side (`/perbandingan`)
- **Keranjang** — Checkbox, qty, voucher, ringkasan
- **Checkout** — 5-step: Alamat → Pengiriman → Pembayaran → Konfirmasi → Selesai
- **Profil** — Tab pesanan, wishlist, alamat, edit profil, aksi per-status
- **Pembayaran** — Info rekening dari DB, konfirmasi bayar, **bayar online via Xendit** (QRIS/e-wallet/VA) + salin/kirim link invoice via WhatsApp
- **Voucher** — Daftar voucher + copy code
- **7 halaman statis** — Tentang Kami, Karir, Blog, Hubungi Kami (WhatsApp + Maps), FAQ, Cara Belanja, Pengembalian Barang

### Mobile
- Bottom Tab Bar (fixed root layout), Floating WhatsApp, mobile-first responsive layout.
- **Sticky Product Action Bar** — Tombol checkout melayang di bagian bawah halaman detail produk mobile.

### Admin Dashboard (12 halaman)
- **Overview** — 4 KPI + LineChart 30 hari + PieChart + badge status payment
- **Produk** — CRUD + toggle status + upload foto, slide-out form modal
- **Pesanan** — Filter status/date, detail modal, update status + resi (input diperbesar)
- **Pelanggan** — Tabel + total belanja + riwayat + block/activate
- **Kategori** — Card grid + CRUD
- **Blog** — CRUD artikel blog (slug, title, excerpt, emoji) — terpisah dari Pengaturan
- **Keuangan** — Filter period + BarChart + PieChart
- **Promo** — Voucher CRUD + **Flash Sale CRUD penuh** (create/edit/delete/toggle + items)
- **Ulasan** — Rating summary + progress bar + toggle + **panel jawab pertanyaan produk (Q&A)**
- **Marketing** — Dashboard (placeholder)
- **Pengaturan** — 7 tabs: Info, Pengiriman, Pembayaran, Notifikasi, Admin, SEO, Halaman Statis (blog dihapus)
- **Login Admin Bento Grid** — Redesain premium bermotif bento grid dengan live server status metrics dan terminal logs.

### Infrastructure
- **Next.js 16 Proxy** — `src/proxy.ts` (JANGAN buat `middleware.ts`)
- **Dynamic SEO** — sitemap.xml, robots.txt, meta tags per-page, Meta Pixel & GA4
- **Web App PWA** — Registrasi manifest PWA dinamis, dynamic favicon generator, dynamic apple touch icon, serta dynamic routes 192px/512px menggunakan Next.js `ImageResponse` (edge runtime).
- **Security** — CSP + headers di `next.config.ts`, rate limiting, atomic stock, input validation. Fungsi RPC `SECURITY DEFINER` sudah di-hardening: `EXECUTE` dicabut dari `anon`/`PUBLIC` (lihat `supabase/migrations/20260822120000_secure_functions_hardening.sql`).
- **Auth** — proxy guard admin routes + `verifyAdminRole()` per-handler
- **Toast Notifications** — Integrasi custom toast menggantikan semua dialog `alert()` bawaan browser.
- **Payment Redirect** — Setelah konfirmasi bayar, customer otomatis redirect ke halaman pesanan.
- **Client Routing** — Navigasi internal memakai `useRouter().push()` (bukan `window.location.href`).
- **Pembayaran Online** — Xendit Invoice API v2 (QRIS/e-wallet/VA/kartu/retail) via route server-side; webhook `x-callback-token` verified + idempotent; alur transfer manual tetap utuh.
- **Notifikasi Otomatis** — Email (Resend) & WhatsApp (Fonnte) ke customer saat status pesanan berubah; fire-and-forget, nonaktif bila env kosong.

## API Routes (33)

| Route | Method | Auth | Deskripsi |
|-------|--------|------|-----------|
| `/api/payments/xendit/create` | POST | Required | Buat/pakai-ulang Xendit Invoice untuk order milik user |
| `/api/payments/xendit/webhook` | POST | Callback token | Callback status pembayaran Xendit (server-to-server) |
| `/api/products/qna` | POST | Required | Ajukan pertanyaan produk |
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
| `/api/admin/flash-sales` | GET/POST | Admin | List & create flash sale + items |
| `/api/admin/flash-sales/[id]` | PUT/DELETE | Admin | Update/hapus flash sale |
| `/api/admin/flash-sales/[id]/toggle` | PATCH | Admin | Toggle status flash sale |
| `/api/admin/qna` | GET | Admin | Daftar semua pertanyaan produk |
| `/api/admin/qna/[id]` | PATCH/DELETE | Admin | Jawab/hapus pertanyaan |
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
supabase db push    # menjalankan seluruh file di supabase/migrations/ secara urut
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
| `supabase/migrations/20260822130000_full_schema.sql` | Tabel + RLS + fungsi + trigger + storage + seed + hardening RPC (hasil konsolidasi 7 migration lama, T-12) |

Jalankan dengan `supabase db push` pada project baru.

## Verifikasi

| Command | Fungsi |
|---------|--------|
| `npm run lint` | ESLint (baseline: 14 problems — semua error pre-existing `no-explicit-any` dll., 0 warning) |
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
| `NEXT_PUBLIC_STORE_*` (5 var) | opsional | Fallback di `storeConfig.ts` |

## Status

Semua pekerjaan aktif dilacak di **[`plan.md`](plan.md)** (single source of truth — protokol task, Definition of Done, changelog). Riwayat audit lama: `doc.md` & `Todo.md` (arsip lokal).
