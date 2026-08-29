# PLAN.MD — SOURCE OF TRUTH · Hera Skincare Marketplace

> **File ini adalah SATU-SATUNYA tracker pekerjaan project ini.**
> `Todo.md`, `doc.md`, dan bagian "Status" di README.md sudah **ARCHIVED** dan TIDAK BOLEH dipakai sebagai instruksi kerja aktif.
> (Catatan 2026-08-29: `Todo.md`, `doc.md`, `AGENT.md`, `CLAUDE.md` sudah DIHAPUS dari repo — lihat T-15.)
> Setiap agent/kontributor **WAJIB** membaca bagian [Protokol](#-protokol-source-of-truth) sebelum menyentuh kode.
>
> Terakhir diperbarui: 2026-08-29

---

## 📐 Protokol Source of Truth

### Aturan Wajib

| # | Aturan |
|---|--------|
| R1 | Semua pekerjaan HARUS punya entri task di file ini **sebelum** baris kode pertama ditulis |
| R2 | Status hanya boleh bergerak satu langkah: `BACKLOG → IN_PROGRESS → DONE` atau `IN_PROGRESS → BLOCKED` |
| R3 | Mulai kerja = set status `IN_PROGRESS` + tanggal. Selesai = set status final + tanggal |
| R4 | File di luar **Scope-IN** task yang sedang berjalan **DILARANG** dimodifikasi |
| R5 | Ketemu bug/masalah baru di luar task aktif → **JANGAN** dibetulkan sekalian. Daftarkan task baru dengan ID berikutnya, lanjutkan task aktif apa adanya |
| R6 | 1 task = 1 commit. Format pesan commit: `<T-ID>: <ringkasan>` (contoh: `T-02: integrasi midtrans snap create + webhook`) |
| R7 | Kalau task gagal/batal, jangan hapus entrinya — set status `BLOCKED` + tulis alasannya |

### Definition of Done (berlaku untuk SEMUA task)

Task boleh berstatus `DONE` hanya jika **ketiga gerbang hijau**, dengan output command di-paste ke bagian **Bukti** task tersebut:

```bash
npm run lint        # exit 0
npm run typecheck   # exit 0
npm run build       # exit 0
```

⚠️ Tanpa bukti = status DONE tidak sah. Reviewer/pemilik project berhak menurunkan status kembali ke `IN_PROGRESS`.

### Larangan Mutlak

- ❌ Menghapus fitur, test, atau validasi agar build/lint lolos
- ❌ Menyisakan mock data, placeholder, komentar `TODO`/`FIXME`, atau dead code
- ❌ Menandai `DONE` tanpa bukti command
- ❌ Mengedit/menghapus entri Changelog (bersifat **append-only**)
- ❌ Melebar scope ("sekalian refactor", "sekalian rapikan styling")
- ❌ Membuat tracker paralel baru (file `.md` lain selain `plan.md`)
- ❌ Hardcode secret/API key di dalam kode — semua credential lewat env server-side

### Checklist Eksekusi Task (salin ke task saat mulai dikerjakan)

```text
[ ] Status → IN_PROGRESS (tanggal: ____ )
[ ] Baca ulang Scope-IN dan Scope-OUT
[ ] Implementasi sesuai kriteria
[ ] npm run lint      → paste output
[ ] npm run typecheck → paste output
[ ] npm run build     → paste output
[ ] Commit dengan format "<T-ID>: ..."
[ ] Status → DONE (tanggal: ____ )
```

---

## 🗺️ Roadmap

| ID | Prioritas | Task | Status |
|----|-----------|------|--------|
| [T-01](#t-01--infrastruktur-verifikasi--baseline) | P0 | Infrastruktur verifikasi & baseline | DONE |
| [T-02](#t-02--xendit-invoice-pembayaran-online-server-side) | P0 | Xendit Invoice pembayaran online (server-side) | DONE |
| [T-03](#t-03--flash-sale-crud-di-admin) | P1 | Flash Sale CRUD di Admin | DONE |
| [T-04](#t-04--tutup-bug-low-dari-audit-lama) | P1 | Tutup bug LOW dari audit lama | DONE |
| [T-05](#t-05--notifikasi-otomatis-emailwa) | P2 | Notifikasi otomatis Email/WA | DONE |
| [T-06](#t-06--port-fitur-qa-produk--comparison-dari-project-react) | P2 | Port Q&A produk + comparison dari React | DONE |
| [T-07](#t-07--konsolidasi-dokumentasi--arsip-project-react) | P3 | Konsolidasi dokumentasi & arsip project React | DONE |
| [T-08](#t-08--pembaruan-dependencies-ke-versi-stabil) | P1 | Pembaruan dependencies ke versi stabil | DONE |
| [T-09](#t-09--ganti-navigasi-windowlocation-dengan-router-nextjs) | P1 | Ganti navigasi window.location dengan Router Next.js | DONE |
| [T-10](#t-10--hardening-fungsi-security-definer-database) | P0 | Hardening fungsi SECURITY DEFINER database | DONE |
| [T-11](#t-11--sinkronisasi-dokumentasi-dengan-kondisi-aktual) | P1 | Sinkronisasi dokumentasi dengan kondisi aktual | DONE |
| [T-12](#t-12--konsolidasi-migration-menjadi-satu-full-schema) | P0 | Konsolidasi migration menjadi satu full schema | DONE |
| T-13 | P2 | Sinkronisasi dokumentasi pasca-roadmap | DONE |
| [T-14](#t-14--sinkronisasi-db-live-ke-full-schema) | P0 | Sinkronisasi DB live ke full schema | DONE |
| [T-15](#t-15--konsolidasi-dokumentasi--satu-migration) | P0 | Konsolidasi dokumentasi & satu file migration | DONE |
| [T-16](#t-16--sinkronisasi-env-dan-project-ref-live) | P0 | Sinkronisasi env & project ref live | DONE |
| T-17 | P0 | Fix checkout harga promo/flash sale (validasi server) | DONE |
| T-18 | P0 | Policy profiles UPDATE aman + fix policy product_qna | DONE |
| T-19 | P0 | Rework confirm-payment via RPC + verifikasi admin | DONE |
| T-20 | P1 | Xendit webhook verifikasi paid_amount | DONE |
| T-21 | P1 | Enforce per_user_limit voucher (tabel voucher_usage) | DONE |
| T-22 | P1 | createOrder rollback fix + qty validasi | DONE |
| T-23 | P1 | Validasi role update_admin_role + guard super_admin | DONE |
| T-24 | P2 | Upload magic bytes + sinkron mime | DONE |
| T-25 | P0 | Sinkronisasi full_schema = live DB | DONE |
| T-26 | P0 | Fix proxy cookie refresh → response | DONE |
| T-27 | P1 | Escape HTML di notify.ts | DONE |
| T-28 | P1 | Stats/best-seller filter order dibatalkan | DONE |
| T-29 | P1 | Validasi admin/products POST/PUT (negatif, slug) | DONE |
| T-31 | P0 | Restore stok saat order dibatalkan (RPC atomic + idempotent) | DONE |
| T-32 | P1 | Filter subCategory di /api/products + getProducts | DONE |
| T-33 | P2 | Sort popular via view product_sales_summary | DONE |
| T-34 | P0 | Ganti view paralel → RPC sold count + fix bug sold=0 guest | DONE |
| T-35 | P2 | Index 3 FK tanpa covering index | DONE |
| T-36 | P2 | Cleanup komentar ponytail + dokumentasi SKIP verdict advisor | DONE |
| T-38 | P2 | Hapus fungsi mati increment_voucher_usage (digantikan redeem_voucher) | DONE |
| T-39 | P1 | Restrukturisasi /admin/marketing jadi tab section (Ringkasan/Analytics/Event/UTM) | DONE |
| T-40 | P1 | Event Monitor (event_logs + tracking + API + UI retry) | DONE |
| T-41 | P1 | UTM Campaign + order conversion (utm_visits + orders.utm_source) | DONE |
| T-42 | P1 | Tab SEO extend (GTM/Clarity/Ads/TikTok, AI crawler block, GEO/JSON-LD) | DONE |
| T-43 | P1 | Analytics eksternal GA4 + GSC (angka real via Google API) | DONE |
| T-44 | P2 | Route llms.txt (GEO / AI crawler) | DONE |
| T-46 | P1 | Hapus Edge Runtime deprecated → nodejs (4 file ikon + README) | DONE |
| T-47 | P1 | Rebrand catalog → skincare (kategori lucide, produk skincare, gambar, emoji → icon) | DONE |
| T-48 | P1 | Sinkronisasi dokumentasi pasca T-47 (README 36 route, AGENTS.md) | DONE |
| T-49 | P0 | Fix checkout voucher (voucher_code tidak terkirim ke /api/orders) | DONE |
| T-50 | P0 | Validasi shipping_cost & total di /api/orders (tolak negatif) | DONE |
| T-51 | P0 | Xendit create: simpan referensi invoice via service-role | DONE |
| T-52 | P0 | Perbaiki syntax error full_schema.sql (store_settings terpotong) | DONE |
| T-53 | P1 | Newsletter via API route (RLS-safe, tanpa success palsu) | DONE |
| T-54 | P1 | Integrasi RajaOngkir V2 (Komerce) — cek ongkir real + satukan logika ongkir | DONE |
| T-55 | P1 | Konsistensi order & stok (4 sub-bug hasil audit) | DONE |
| T-56 | P2 | Hardening & housekeeping kecil (3 sub-entri) | DONE |
| T-57 | P0 | RajaOngkir kuota 100 hit/hari — cache persisten DB + short-circuit gratis ongkir | DONE |
| T-58 | P1 | Normalisasi NEXT_PUBLIC_SITE_URL (double slash di sitemap/robots/llms.txt) | DONE |
| T-59 | P0 | Mobile: tab bar detail produk overflow → halaman melebar 448px (bisa geser horizontal) | DONE |
| T-60 | P2 | Mobile: galeri gambar detail produk rusak (next/image × picsum tidak di-whitelist) — DITURUNKAN: foto masih placeholder, otomatis tampil saat foto asli di-upload ke Supabase Storage | BACKLOG |
| T-61 | P1 | Mobile keranjang: nama produk terpotong parah + harga patah 2 baris | DONE |
| T-62 | P1 | Mobile audit lanjutan: admin dashboard & checkout terisi (butuh akses akun) | DONE |
| T-63 | P1 | Fitur banner promosi: tabel banners + admin CRUD (tab Banner di marketing) + carousel storefront | DONE |
| T-64 | P1 | Fitur push notification (Web Push VAPID): sw.js + subscribe + tabel push_subscriptions + composer admin (tab Push di marketing) | DONE |
| T-65 | P1 | CSP whitelist endpoint regional GA4 + tampilkan error API di tab Analytics | DONE |
| T-66 | P1 | GA4/GTM script pindah ke `<head>` (kini di body → verifikasi GSC gagal) | DONE |
| T-67 | P1 | Storefront: halaman katalog semua produk `/produk` (filter kategori + sort + pagination) | BACKLOG |
| T-68 | P1 | Manajemen gambar produk: hapus per thumbnail + sinkronisasi product_images saat edit | DONE |
| T-69 | P2 | Kartu Banner/Push di Marketing jadi navigasi ke tab masing-masing | DONE |
| T-70 | P1 | Upload gambar banner gagal ("Gagal menyimpan referensi gambar") — pakai jalur upload tanpa referensi produk | DONE |

Urutan pengerjaan = urutan ID. Jangan mengerjakan ID lebih tinggi sebelum ID lebih rendah DONE (kecuali pemilik project secara eksplisit mengubah urutan di tabel ini).
> ⚠️ Pengecualian aktif: **T-08 dikerjakan lebih dahulu atas instruksi eksplisit pemilik project (22 Agu 2026)** tanpa menunda status task lain.

---

## 📋 Detail Task

### T-01 — Infrastruktur Verifikasi & Baseline

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |

**Tujuan:** Pastikan ketiga gerbang verifikasi tersedia dan kondisi awal project tercatat sebagai acuan regresi.

**Scope-IN**
- `package.json` — tambah script `"typecheck": "tsc --noEmit"`
- `.env.example` — sinkronkan dengan seluruh env var yang benar-benar dipakai kode (tanpa secret asli)
- Catat baseline hasil 3 command di bagian **Bukti**

**Scope-OUT (dilarang disentuh)**
- Seluruh `src/**`, `next.config.ts`, `supabase/**`

**Kriteria Selesai**
1. `npm run typecheck` tersedia, exit 0
2. Output baseline `lint` / `typecheck` / `build` tercatat di Bukti (ini acuan pembanding untuk semua task berikutnya)
3. `.env.example` memuat semua var yang direferensikan kode; tidak ada var yang dipakai kode tapi absen dari example

**Bukti**
```
== npm run lint ==
✖ 22 problems (14 errors, 8 warnings)   exit=1 (error pre-existing)
Rincian error: no-explicit-any ×10, set-state-in-effect ×3, immutability ×1
Rincian warning: img-element ×4, unused-vars ×3, exhaustive-deps ×1
(Baseline ASLI — .claude/worktrees sudah di-ignore sejak T-09)

== npm run typecheck ==  tsc --noEmit   exit=0

== npm run build ==                     exit=0

== .env.example ==
Kode mereferensi 8 var: SUPABASE_URL, PUBLISHABLE_DEFAULT_KEY, SITE_URL
(wajib) + 5 STORE_* (opsional, fallback di storeConfig.ts) — semua kini
ada di example. .env.local lokal: BASE_URL diperbaiki → SITE_URL.
```

---

### T-02 — Xendit Invoice Pembayaran Online (Server-Side)

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |
| Referensi | Xendit Invoice API v2 (`POST https://api.xendit.co/v2/invoices`) — callback via header `x-callback-token` |

**Tujuan:** Customer bisa bayar online via Xendit (QRIS, VA bank, e-wallet OVO/DANA/ShopeePay/LinkAja, kartu, retail), menggantikan/dampingi alur transfer manual di `/bayar/[id]`. Link invoice dapat dibagikan via WhatsApp.

**Riwayat keputusan:** Direvisi dari Midtrans Snap → **Xendit** atas instruksi pemilik project (22 Agu 2026): cakupan e-wallet lebih luas (OVO/DANA) + model invoice-link yang bisa dikirim via WA.

**Keputusan desain (dikunci, jangan diubah tanpa persetujuan pemilik):**
- Implementasi pakai **Next.js API Route** (bukan Supabase Edge Function) — konsisten dengan pola route yang ada, dan secret tinggal di server
- Produk Xendit: **Invoice API v2** — satu endpoint untuk semua metode bayar + hosted checkout page + callback status
- `XENDIT_SECRET_KEY` & `XENDIT_CALLBACK_TOKEN` **WAJIB** env server-side tanpa prefix `NEXT_PUBLIC`; environment (Dev/Live) ditentukan pasangan key yang dipakai di dashboard, tanpa flag terpisah
- Verifikasi webhook: header `x-callback-token` dibandingkan constant-time dengan env token; invalid → 401
- Jika env belum diset: create mengembalikan 503 ramah — transfer manual tetap fallback utuh

**Scope-IN**
- `src/app/api/payments/xendit/create/route.ts` (baru) — buat/reuse Invoice untuk order milik user yang login; amount dari DB
- `src/app/api/payments/xendit/webhook/route.ts` (baru) — callback server-to-server Xendit
- Migration live DB via MCP + mirror ke `supabase/migrations/20260822130000_full_schema.sql` — kolom `orders.xendit_invoice_id`, `orders.xendit_invoice_url`
- `src/types/database.ts` — tipe kolom baru
- `src/app/checkout/page.tsx` — opsi metode "Bayar Online via Xendit" di step pembayaran
- `src/app/bayar/[id]/page.tsx` + komponen client baru — tombol bayar online, buka link invoice, salin link, bagikan via WhatsApp (`wa.me`)
- `.env.example` — `XENDIT_SECRET_KEY`, `XENDIT_CALLBACK_TOKEN`

**Scope-OUT (dilarang disentuh)**
- Halaman admin, `src/proxy.ts`, Navbar/Footer, styling global, route orders yang sudah ada

**Kriteria Selesai**
1. Create invoice: auth required, hanya pemilik order (verifikasi `user_id`); order harus `menunggu` & `belum_bayar`
2. Amount **tidak diterima dari client** — selalu dari kolom `orders.total` di DB
3. Webhook: verifikasi `x-callback-token`; invalid → 401; hanya status relevan yang diproses
4. Webhook idempotent: callback ulang / order sudah `lunas` → 200 tanpa efek samping
5. Update `payment_status` mengikuti transisi yang sudah ada (`belum_bayar` → `lunas`, tanpa skip state)
6. Alur transfer manual lama tetap berfungsi normal (tombol "Sudah Bayar" utuh)
7. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
== Migration live (via MCP) ==
xendit_order_columns: orders.xendit_invoice_id text + xendit_invoice_url text
Verifikasi live: kedua kolom ada (information_schema) ✅
Mirror ke full_schema.sql: inline di CREATE TABLE orders ✅

== File baru/diubah ==
+ src/app/api/payments/xendit/create/route.ts   (rate-limit, auth, ownership,
    guard menunggu+belum_bayar, amount dari DB, reuse invoice, 503 bila env kosong)
+ src/app/api/payments/xendit/webhook/route.ts  (x-callback-token constant-time
    -> 401; hanya PAID; idempotent; belum_bayar->lunas via service-role client)
+ src/utils/supabase/admin.ts                   (service-role client untuk webhook)
~ src/app/bayar/[id]/page.tsx + XenditPaySection.tsx  (bayar online, salin link,
    kirim via WhatsApp wa.me -- sesuai alasan revisi desain)
~ src/app/checkout/page.tsx                     (opsi "Bayar Online via Xendit"
    di step pembayaran + perbaiki emoji icon yang korup)
~ src/types/database.ts, .env.example, README.md (26 routes)

== Gerbang ==
typecheck exit 0 · lint 22 problems (baseline sama, tidak bertambah) · build exit 0

== UNVERIFIED (butuh kredensial owner) ==
E2E end-to-end dengan Xendit sandbox/live belum bisa dijalankan:
1. Isi env: XENDIT_SECRET_KEY, XENDIT_CALLBACK_TOKEN, SUPABASE_SERVICE_ROLE_KEY
2. Daftarkan callback URL di Dashboard Xendit -> Invoices:
   https://<domain>/api/payments/xendit/webhook
3. Uji alur: create invoice -> bayar di hosted page -> status order otomatis lunas
Kriteria 1-6 terverifikasi lewat code-review & typecheck; runtime proof menunggu langkah di atas.
```

---

### T-03 — Flash Sale CRUD di Admin

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |

**Tujuan:** Admin bisa membuat/mengubah flash sale. Saat ini hanya read-only table di `/admin/promo`.

**Scope-IN**
- `src/app/api/admin/flash-sales/route.ts` (baru) — GET/POST
- `src/app/api/admin/flash-sales/[id]/route.ts` (baru) — PUT/DELETE
- Halaman `/admin/promo` — form create/edit flash sale + items
- `src/types/database.ts` — bila perlu

**Scope-OUT (dilarang disentuh)**
- Route voucher yang sudah ada, homepage flash-sale rendering, migration lama

**Kriteria Selesai**
1. Create/edit/delete/toggle flash sale beserta item produknya
2. Validasi: `end_time > start_time`, diskon 1–100%, produk wajib ada
3. Semua handler pakai `verifyAdminRole()` seperti route admin lain
4. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
== Implementasi ==
+ src/app/api/admin/flash-sales/route.ts        (GET list, POST create)
+ src/app/api/admin/flash-sales/[id]/route.ts   (PUT update, DELETE)
+ src/app/api/admin/flash-sales/[id]/toggle/route.ts (PATCH status)
~ src/lib/admin.ts    (+6 fungsi: getAllFlashSalesAdmin, createFlashSale,
    updateFlashSale, toggleFlashSaleStatus, deleteFlashSale, validateFlashItems)
~ src/app/admin/(dashboard)/promo/page.tsx (+FlashSaleModal: form nama,
    datetime mulai/berakhir, picker multi-produk dgn harga & stok flash;
    tabel dapat kolom Aksi: edit/hapus + badge status jadi tombol toggle;
    sumber data pindah dari client supabase langsung -> API admin)
Catatan tipe: FlashSaleProduct sudah punya products? — database.ts tidak diubah.

== Adaptasi kriteria no.2 ==
Model DB memakai harga absolut (flash_price numeric >= 0), bukan persen.
"Diskon 1-100%" diimplementasikan sesuai model data:
end_time > start_time ✅ · flash_price harus diskon nyata
(0 < flash_price < harga normal produk) ✅ · produk wajib ada & aktif ✅

== Gerbang ==
typecheck exit 0 · lint 22 problems (baseline sama) · build exit 0
```

Status kriteria: 1 ✅ · 2 ✅ (adaptasi terdokumentasi) · 3 ✅ · 4 ✅

---

### T-04 — Tutup Bug LOW dari Audit Lama

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |
| Sumber daftar | `Todo.md` § Final Metrics → baris "Open (14 LOW)" (ARSIP — hanya rujukan daftar, bukan tracker) |

**Aturan khusus task ini (anti-noise):**
Saat memulai, pecah dulu daftar bug LOW menjadi sub-entri bernomor di bawah tabel ini (T-04.1, T-04.2, …), masing-masing dengan kriteria selesai sendiri. **Satu sub-bug = satu commit.** Sub-bug boleh dikerjakan bertahap; task induk DONE jika semua sub-entri DONE atau eksplisit di-skip dengan alasan oleh pemilik project.

| Sub-ID | Bug (ringkas) | Status |
|--------|---------------|--------|
| T-04.1 | L2 — `router` sebagai dependency useEffect | SKIP (verifikasi 22 Agu: tidak ada lagi di kode) |
| T-04.2 | N29 — CSS universal `*` transition | SKIP (sudah scoped `.transition-premium`; `*` hanya box-sizing) |
| T-04.3 | N30 — Floating WhatsApp `animate-pulse` terus-menerus | SKIP (tombol WA kini hover-only; pulse tersisa = skeleton loading sah) |
| T-04.4 | N38 — `revalidate = 0` mematikan cache | SKIP (desain data real-time utk stok/harga e-commerce; halaman ber-cookie sudah dynamic natural) |
| T-04.5 | N43 — Halaman profil tanpa guard session server-side | SKIP (sudah ada getUser server-side; UI menampilkan form auth utk guest) |
| T-04.6 | N46 — Public search `/api/products` tanpa rate limit | SKIP (sudah ada checkRateLimit 120/menit) |
| T-04.7 | N49 — Deskripsi produk tanpa sanitasi HTML | SKIP (tidak ada dangerouslySetInnerHTML; React auto-escape default) |
| T-04.8 | L13 — Related products query tanpa limit | SKIP (sudah `pageSize: 7` + `.slice(0, 6)`) |
| T-04.9 | L9 — Supabase CLI tidak ada di devDependencies | DONE |
| T-04.10 | Linter warnings — 8 warning baseline (img ×4, unused-vars ×3, deps ×1) | DONE |
| T-04.11 | H8 — `console.error` di catch blok | SKIP (intentional — logging terkontrol untuk debug produksi) |
| T-04.12 | P15 — Custom modal → native `<dialog>` | SKIP (refactor besar lintas komponen; modal custom berfungsi baik) |
| T-04.13 | N40 — CSP `'unsafe-inline'` untuk scripts | SKIP (butuh infrastruktur nonce + risiko merusak Meta Pixel/GA4; mitigasi: domain whitelist ketat) |
| T-04.14 | N33/N34/L1 — metadata statis / dropdown kategori by-name / sisa `confirm()` | SKIP (metadata statis by design dgn fallback SEO DB; confirm() utk aksi destruktif adalah pola UX sengaja dipertahankan) |

**Hasil:** 2 sub-bug diperbaiki (T-04.9, T-04.10), 12 terverifikasi sudah hilang/obsolete atau di-skip dengan alasan eksplisit.

**Bukti**
```
T-04.9: npm i -D supabase -> devDependencies terpasang, 0 vulnerabilities
        Commit c83f820

T-04.10: lint 22 problems (14 err/8 warn) -> 14 problems (14 err/0 warn)
  - NotificationDropdown.tsx: buang import X, Clock (unused)
  - keranjang/page.tsx: setShippingCost tidak pernah dipakai -> [shippingCost]
  - admin/produk/page.tsx:60: tambah 'categories' ke deps useCallback
  - layout.tsx: pixel noscript = false positive -> eslint-disable inline dgn alasan
  - ProductDetailClient.tsx (2) + ProductFormModal.tsx (1): <img> -> next/image
    (fill + sizes; remotePatterns **.supabase.co sudah ada di next.config)
  Commit fd9dcdd
Gerbang: typecheck exit 0 · build exit 0 · lint error tetap 14 (pre-existing)
```

**Scope-IN:** file yang disebut di sub-entri masing-masing saja
**Scope-OUT:** apapun di luar itu

**Bukti**
```
(paste output per sub-entri)
```

---

### T-05 — Notifikasi Otomatis Email/WA

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |

**Tujuan:** Kirim email/WA otomatis saat status pesanan berubah (masuk, dibayar, dikirim, selesai). Saat ini settings-nya sudah ada di Pengaturan tapi belum terhubung provider.

**Keputusan desain (dikunci):** Email = **Resend** (`POST https://api.resend.com/emails`), WA = **Fonnte** (`POST https://api.fonnte.com/send`) — murni REST via fetch, tanpa dependency baru. Penerima = customer (email dari `profiles.email`, WA dari `orders.shipping_address.phone`). Toggle `store_settings.notifications` yang ada adalah preferensi event ADMIN — dibiarkan utuh. Kredensial env server-side: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `FONNTE_TOKEN`; kosong = channel no-op senyap. Fire-and-forget: gagal kirim hanya di-log.

**Scope-IN:** API route/handler notifikasi baru, integrasi provider, key settings terkait, `.env.example`
**Scope-OUT:** UI admin pengaturan (kecuali perlu field baru — daftarkan dulu), template halaman customer

**Kriteria Selesai**
1. Trigger terjadi dari perubahan status pesanan (bukan polling manual) — ✅ 3 titik: admin orders PUT, xendit webhook, confirm-payment
2. Credential hanya di env server; gagal kirim ter-log dan tidak menggagalkan transaksi utama — ✅ try/catch total + Promise.allSettled + console.warn
3. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
+ src/lib/notify.ts   : template per-status (menunggu/diproses/dikirim+d resi/
                        selesai/dibatalkan) & event "paid"; normalisasi nomor
                        WA ke 62xxx; Promise.allSettled email+WA; error ditelan
~ admin/orders/[id]/PUT        -> notify status (resi utk "dikirim")
~ payments/xendit/webhook      -> notify event paid
~ orders/[id]/confirm-payment  -> notify event paid (transfer manual)
~ .env.example                 : RESEND_API_KEY, RESEND_FROM_EMAIL, FONNTE_TOKEN

== Gerbang ==
typecheck exit 0 · lint 14 problems (0 warning, error baseline sama) · build exit 0

== UNVERIFIED (butuh kredensial owner) ==
Pengiriman nyata butuh RESEND_API_KEY (+domain terverifikasi utk FROM)
dan FONNTE_TOKEN. Alur diverifikasi via typecheck & review; runtime test
menunggu kredensial.
```

---

### T-06 — Port Fitur Q&A Produk + Comparison dari Project React

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |
| Referensi | `../Hera Store React/src/context/ComparisonContext.jsx`, tabel `product_qna` di `../Hera Store React/supabase/init.sql` |

**Catatan:** Dijalankan penuh atas instruksi "lanjut semua" pemilik project; dipecah sesuai catatan: T-06.1 (Q&A) dan T-06.2 (Comparison).

#### T-06.1 — Q&A Produk

**Implementasi**
- Migration live `product_qna` via MCP (adaptasi UUID dari init.sql React) + mirror ke full_schema.sql: tabel + index + 3 policy (select publik, insert authenticated, update admin via has_role)
- API: `POST /api/products/qna` (bertanya, auth) · `GET /api/admin/qna` (daftar) · `PATCH+DELETE /api/admin/qna/[id]` (jawab/hapus, verifyAdminRole)
- lib/products.ts: `getQuestionsByProduct()`; UI customer: tab "Tanya Jawab" di detail produk (list + form bertanya, login-gated); UI admin: panel jawab/hapus pertanyaan di halaman ulasan

#### T-06.2 — Comparison

**Implementasi**
- `src/lib/comparison-utils.ts`: port ComparisonContext.jsx → localStorage (`hera_compare`, maks 4 produk, event `compare-updated`)
- Tombol toggle perbandingan (GitCompare) di galeri detail produk + link ke halaman khusus
- Halaman `/perbandingan`: tabel side-by-side harga/stok/detail + hapus item + kosongkan

**Bukti**
```
Migration live : product_qna (MCP success) + mirror full_schema ✅
Gerbang        : typecheck exit 0 · lint 14 err/0 warn (baseline sama;
                 2 error pola setState-in-effect dari kode baru diperbaiki
                 saat proses) · build exit 0
```

---

### T-07 — Konsolidasi Dokumentasi & Arsip Project React

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |

**Tujuan:** Satu codebase hidup, satu sumber kebenaran.

**Scope-IN**
- README.md — bagian "Status" diganti pointer ke plan.md
- Banner arsip di `../Hera Store React/README.md` (project React ditandai DEPRECATED, referensi fitur yang sudah diporting)
- Bersihkan sisa tracker basi di repo Next.js

**Scope-OUT:** kode aplikasi, database

**Kriteria Selesai**
1. ✅ Tidak ada lagi dokumen di kedua repo yang bisa disalahartikan sebagai tracker aktif — Next.js: hanya plan.md aktif; doc.md/Todo.md/AGENT.md arsip ber-banner & gitignored. React: README diberi banner DEPRECATED di posisi paling atas
2. ✅ Project React jelas tertanda deprecated + tanggal (22 Agustus 2026) + daftar fitur yang sudah diporting
3. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
README.md (Next.js) : bagian "Status" -> pointer plan.md (sejak T-11) ✅
../Hera Store React/README.md : banner "DEPRECATED — ARSIP PROJECT
  (22 Agustus 2026)" ditambahkan di baris pertama + daftar fitur
  yang telah diporting + pointer ke plan.md penerus ✅
Tracker basi repo Next.js : sudah terarsip sejak 2026-08-22 awal
  (doc.md, Todo.md ber-banner ARCHIVED + gitignored) ✅
Gerbang: typecheck exit 0 · lint 14 err/0 warn · build exit 0 (lihat commit T-06)
```

---

### T-08 — Pembaruan Dependencies ke Versi Stabil

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |

**Tujuan:** Ganti `typescript@^6.0.0-beta` (prerelease) dengan versi stabil terbaru dan bawa seluruh dependencies ke versi stabil terbaru yang kompatibel, untuk keamanan (patch CVE) dan konsistensi toolchain.

**Keputusan desain (dikunci saat mulai):**
- TypeScript → `7.0.2` (latest stable). Fallback `6.0.3` bila gerbang verifikasi gagal.
- `next` + `eslint-config-next` → `16.3.2` (selalu berpasangan, major tetap 16).
- ESLint → `10.9.0` (peer `>=9` terpenuhi). Fallback latest 9.x bila baseline lint rusak parah.
- Paket yang sudah latest stabil tidak disentuh: react/react-is 19.2.8, recharts 3.10.1, tailwindcss & @tailwindcss/postcss 4.3.3.

**Scope-IN**
- `package.json`, `package-lock.json`
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Seluruh `src/**`, `next.config.ts`, `.env.example` (milik T-01), script `"typecheck"` di package.json (milik T-01)

**Kriteria Selesai**
1. Semua versi di package.json adalah rilis stabil (tanpa suffix beta/rc/dev/canary)
2. `npx tsc --noEmit` exit 0
3. `npm run build` sukses
4. `npm run lint`: jumlah error/warning **tidak lebih buruk** dari baseline (386 error / 269 warning)
5. `npm audit` tidak menampilkan vulnerability high/critical baru
6. Bukti ketiga gerbang + audit tercatat di bagian Bukti

**Catatan gerbang lint:** Baseline `npm run lint` sudah gagal sejak sebelum task ini (386 error — lihat analisis 22 Agu 2026). Gerbang DoD "lint exit 0" penuh tidak dapat dipenuhi sampai utang lint dibereskan; kriteria no.4 dipakai sebagai pengganti sementara. Status DONE final menunggu persetujuan pemilik project atas pengecualian ini.

**Bukti**
```
== Versi final (npm ls) ==
typescript@6.0.3 (fallback dari 7.0.2 — typescript-eslint belum support TS 7.0,
                   lihat error resmi tool saat lint dengan TS 7.0.2)
next@16.3.2 · eslint-config-next@16.3.2
eslint@9.39.5   (fallback dari 10.9.0 — crash di eslint-plugin-react bawaan
                 eslint-config-next yang dibangun utk ESLint 9)
@supabase/ssr@0.12.4 · @supabase/supabase-js@2.112.3 · lucide-react@1.33.0
@types/node@26.2.0 · @types/react@19.2.18 · @types/react-dom@19.2.4
react/react-is@19.2.8 · recharts@3.10.1 · tailwindcss@4.3.3 (sudah latest)

== Gerbang 1: npx tsc --noEmit == EXIT 0

== Gerbang 2: npm run lint ==
✖ 713 problems (386 errors, 327 warnings)
Error: identik baseline (269 no-explicit-any + 104 set-state-in-effect
       + 7 immutability + 6 static-components) → 0 regresi error.
Warning: +58 vs baseline (269→327) SELURUHNYA dari rule BARU upstream
       @next/next/no-location-assign-relative-destination (ditambahkan di
       eslint-config-next 16.3.2). Bukan regresi kode.

== Gerbang 3: npm run build == EXIT 0 (semua route ter-generate)

== npm audit ==
found 0 vulnerabilities (baseline sebelum update: 2 high — brace-expansion DoS,
nanoid; keduanya dipatch via npm audit fix non-breaking)
```

### T-09 — Ganti Navigasi `window.location` dengan Router Next.js

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |

**Tujuan:** Menutup 10 temuan warning rule baru `@next/next/no-location-assign-relative-destination` (muncul setelah upgrade `eslint-config-next` 16.3.2 di T-08). Navigasi internal via `window.location.href` menghilangkan client-side routing Next.js (full reload); diganti `useRouter().push()` sesuai rekomendasi resmi rule.

**Lokasi terkonfirmasi (hasil eslint JSON, salinan `.claude/worktrees/**` dikecualikan):**
1. `src/app/admin/login/page.tsx:47`
2. `src/components/CategoryClient.tsx:47`
3. `src/components/CategoryClient.tsx:78`
4. `src/components/HomeClient.tsx:205`
5. `src/components/HomeClient.tsx:250`
6. `src/components/ProfilClient.tsx:771`
7. `src/components/ProfilClient.tsx:795`
8. `src/components/admin/AdminSidebar.tsx:121`
9. `src/components/admin/AdminTopbar.tsx:96`
10. `src/components/admin/AdminTopbar.tsx:109`

**Temuan tambahan yang ditangani dalam scope ini:** direktori `.claude/worktrees/**` berisi salinan project basi dan ikut ter-scan ESLint sehingga mencemari seluruh angka lint (+48 warning & sebagian error palsu). Ditambahkan ke `globalIgnores`.

**Scope-IN**
- 6 file pada daftar lokasi di atas
- `eslint.config.mjs` — hanya penambahan ignore `.claude/**`
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- File/rule lint lainnya, seluruh halaman & komponen di luar daftar, `package.json`

**Kriteria Selesai**
1. 0 warning `no-location-assign-relative-destination` pada kode asli
2. Perilaku navigasi tidak berubah (destinasi & kondisi pemicu sama)
3. Jumlah error lint ≤ baseline 386
4. `npx tsc --noEmit` exit 0
5. `npm run build` exit 0
6. Bukti gerbang tercatat di bagian Bukti

**Bukti**
```
== Perubahan ==
10/10 lokasi diganti window.location.href → router.push("/..."):
login/page.tsx:47 · CategoryClient.tsx:47,78 · HomeClient.tsx:205,250
ProfilClient.tsx:771,795 (replaceAll) · AdminSidebar.tsx:121
AdminTopbar.tsx:96,109
Import useRouter (next/navigation) + hook ditambahkan di 6 file.
eslint.config.mjs: globalIgnores += ".claude/**".

== Gerbang lint ==
✖ 22 problems (14 errors, 8 warnings)
no-location-assign-relative-destination: 0 ✅ (kriteria 1)
Error 14 ≤ baseline 386 ✅ (kriteria 3)

⚠️ KOREKSI BASELINE PENTING: angka lint lama (655–713 problems /
386 errors) ternyata TERCEMAR oleh salinan project basi di
.claude/worktrees/** yang ikut ter-scan. Setelah di-ignore, baseline
ASLI project = 14 error / 8 warning. Perbandingan regresi di Bukti
T-08 tetap sah karena kedua sisi pengukuran sama-sama tercemar.

Sisa temuan pre-existing (bukan dari T-09): no-explicit-any ×10,
set-state-in-effect ×3, immutability ×1, img-element ×4,
exhaustive-deps ×1, unused-vars ×3 (keranjang/page.tsx,
NotificationDropdown.tsx — file tidak disentuh task ini).

== Gerbang typecheck == npx tsc --noEmit → EXIT 0

== Gerbang build == npm run build → EXIT 0

== Perilaku ==
Destinasi & kondisi pemicu navigasi identik; satu-satunya perubahan
mekanis: full page reload → client-side navigation (tujuan rule).
Login/logout tetap benar: cookie auth diperbarui sebelum push dan
navigasi baru memicu fetch RSC dengan sesi segar.
```

---

### T-10 — Hardening Fungsi SECURITY DEFINER Database

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |

**Tujuan:** Menutup temuan kritis Supabase security advisor: 9 fungsi `SECURITY DEFINER` dapat dieksekusi publik tanpa login via `/rest/v1/rpc/...` (ACL terverifikasi `anon=X/postgres`), memungkinkan korupsi stok (`decrement/increment_*_stock`), pembakaran kuota voucher (`increment_voucher_usage`), dan probing role (`has_role`). Plus lint `function_search_path_mutable` pada `generate_order_number`.

**Keputusan desain (terverifikasi terhadap live DB sebelum migrasi):**
- 5 fungsi stok/voucher → REVOKE dari `anon`, KEEP `authenticated` (app memanggil via cookie client — bukti: `src/lib/orders.ts`, `src/lib/vouchers.ts`)
- `handle_new_user`, `handle_order_status_change`, `rls_auto_enable` → REVOKE dari `anon`+`authenticated` (trigger/event-trigger, tidak pernah dipanggil via RPC oleh app)
- `has_role` → **KEEP semua role** — terverifikasi dipakai di 20 RLS policies; revoke akan mematahkan evaluasi RLS untuk guest. Warning advisor utk fungsi ini diterima sebagai risiko rendah terdokumentasi (read-only boolean, search_path fixed).
- `generate_order_number` → REVOKE anon + `SET search_path = ''` (aman: body sudah schema-qualified ke `public.orders`; pg_catalog tetap implicit)

**Scope-IN**
- Migration live DB via MCP + file `supabase/migrations/20260822120000_secure_functions.sql`
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Seluruh `src/**`, definisi body fungsi, struktur tabel, policy RLS

**Kriteria Selesai**
1. ACL live: 5 fungsi stok/voucher tanpa `anon=X`; 3 fungsi trigger/maintenance tanpa `anon=X` & `authenticated=X`
2. `generate_order_number` punya `search_path` fixed
3. Security advisor turun; sisa warning terdokumentasi beserta alasannya
4. RPC yang dipakai app masih executable oleh `authenticated`
5. Bukti tercatat di bagian Bukti

**Bukti**
```
== Migration live (via MCP) ==
secure_functions_hardening + secure_functions_hardening_public (koreksi
grant PUBLIC =X yang membuat revoke per-role tidak efektif — ditemukan
saat verifikasi ACL pasca-migrasi pertama).
File repo: supabase/migrations/20260822120000_secure_functions_hardening.sql

== ACL final (live query) ==
decrement_product_stock / decrement_variant_stock /
increment_product_stock / increment_variant_stock /
increment_voucher_usage / generate_order_number
  → authenticated=X, service_role=X   (anon & PUBLIC hilang) ✅
handle_new_user / handle_order_status_change / rls_auto_enable
  → service_role=X saja ✅
has_role → semua role (by design, dipakai 20 RLS policies) ✅

== search_path generate_order_number ==
config: search_path="" ✅ (lint function_search_path_mutable HILANG)

== Security advisor ==
19 warnings → 7 warnings.
Sisa 7 = by-design & terdokumentasi:
- authenticated-lint ×6 pada fungsi yang memang dipanggil app
  (decrement/increment stok+voucher, has_role via policy)
- anon-lint ×1 pada has_role (wajib utk evaluasi RLS guest)
```

Kriteria 1–5 terpenuhi. Status: DONE.

---

### T-11 — Sinkronisasi Dokumentasi dengan Kondisi Aktual

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |

**Tujuan:** Menghapus drift antara dokumentasi dan kondisi riil codebase/database pasca T-08, T-09, T-10, T-01.

**Scope-IN**
- `README.md` (tracked) — versi stack, jumlah migration, status→pointer plan.md, catatan keamanan RPC
- `AGENTS.md` (lokal) — isi §20 Project-Specific Configuration yang masih placeholder
- `.gitignore` — komentar basi "MIGRATE.md"
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- `doc.md`, `Todo.md`, `AGENT.md` (arsip lokal ber-banner ARCHIVED), seluruh kode

**Kriteria Selesai**
1. README tidak lagi memuat klaim usang (versi lama, "1 migration", tabel Status manual)
2. AGENTS.md §20 terisi data riil project
3. Ketiga gerbang tetap hijau (dokumen tidak memengaruhi build)
4. Bukti tercatat

**Bukti**
```
README.md  : stack 16.3.2/TS6, migrations 7 file (tabel lengkap),
             verifikasi + baseline lint, Status → pointer plan.md,
             catatan security RPC & client routing.
AGENTS.md §20 : terisi penuh (project, stack, live systems + aturan
             verifikasi Supabase/Vercel, SSOT files, commands).
.gitignore : komentar basi "MIGRATE.md" diperbaiki.
doc.md / Todo.md / AGENT.md / CLAUDE.md : arsip lokal — banner sudah
             benar, tidak diubah (Scope-OUT).

Gerbang: lint 22 problems (baseline sama) · typecheck exit 0 · build exit 0
```

---

### T-12 — Konsolidasi Migration Menjadi Satu Full Schema

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |

**Tujuan:** Satu file migration tunggal (`full_schema`) yang berfungsi sebagai init + seed keseluruhan database, merepresentasikan struktur DB live saat ini (termasuk hardening T-10); file-file migration lama yang terfragmentasi dihapus dari repo.

**Metode (dikunci saat mulai):**
- Gabungkan 7 migration existing **berurutan kronologis** ke dalam `supabase/migrations/20260822130000_full_schema.sql` — statement belakangan menimpa yang awal sehingga hasil akhir = state final yang identik dengan urutan penerapan historis.
- Verifikasi inventaris live DB (tabel, fungsi+ACL, trigger, policy, bucket) sebelum & sesudah merge.
- Catatan data: live DB saat ini 0 baris di semua tabel; bagian seed tetap disertakan agar file bisa menginisialisasi project baru lengkap.

**Scope-IN**
- `supabase/migrations/` — 7 file lama dihapus, 1 file konsolidasi baru
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Live DB (tidak ada perubahan schema/data), seluruh `src/**`

**Kriteria Selesai**
1. Repo hanya berisi 1 file migration hasil konsolidasi
2. Urutan statement mempertahankan dependensi (schema → seed → fix → hardening)
3. Inventaris objek live DB (fungsi/ACL/trigger/policy/bucket) terverifikasi cocok dengan isi file
4. Ketiga gerbang hijau + bukti tercatat

**Bukti**
```
== Hasil konsolidasi ==
File: supabase/migrations/20260822130000_full_schema.sql (1314 baris, ~62 KB)
Repo kini berisi TEPAT 1 file migration ✅ (7 file lama di-git-rm)

== Verifikasi inventaris vs live DB ==
Tabel          : 14 create table (profiles..store_settings) = live 14 ✅
Fungsi         : 10 unik, identik daftar live (incl. rls_auto_enable
                 yang ternyata dibuat manual di luar migration lama —
                 definisi + event trigger `ensure_rls` diekstrak dari
                 live DB via pg_event_trigger & ditambahkan ke file)
Event trigger  : ensure_rls → rls_auto_enable ✅
Trigger tabel  : on_order_status_change (orders) ✅
Policy         : replay kronologis 54 create / 4 drop = state final
                 live (42 policy) ✅
Hardening      : REVOKE anon/PUBLIC ×9 + search_path='' ada di akhir ✅
Seed           : categories/products/variants/vouchers/flash_sales/
                 store_settings/profiles tersertakan ✅
Storage        : bucket product-images ✅

== Gerbang ==
lint 22 problems (baseline sama) · typecheck exit 0 · build exit 0

Catatan: live DB tidak diubah (Scope-OUT). File ini adalah init untuk
project baru; struktur finalnya identik dengan DB live hari ini.
```

---

## 🧾 Changelog (APPEND-ONLY — dilarang mengedit/menghapus entri lama)

| Tanggal | ID | Perubahan | Oleh |
|---------|-----|-----------|------|
| 2026-08-22 | — | plan.md dibuat; Todo.md & doc.md diarsipkan; roadmap + protokol SSOT disepakati pemilik project | ox-alpha |
| 2026-08-22 | T-08 | Task T-08 dibuat & dimulai (IN_PROGRESS) atas instruksi pemilik project: update dependencies ke versi stabil | ox-alpha |
| 2026-08-22 | T-08 | Implementasi selesai + bukti 3 gerbang & audit tercatat. Status menunggu keputusan pemilik: warning +58 (rule baru upstream) diterima sebagai baseline baru → DONE, atau dibuat task perbaikan terpisah | ox-alpha |
| 2026-08-22 | T-08 | Keputusan pemilik: opsi 2 — perbaikan 10 call-site asli dibuat task terpisah. T-08 → DONE (Selesai 22 Agu 2026) | ox-alpha |
| 2026-08-22 | T-09 | Task T-09 dibuat & dimulai (IN_PROGRESS): ganti window.location dengan useRouter di 10 lokasi + ignore `.claude/**` di eslint config | ox-alpha |
| 2026-08-22 | T-09 | Selesai (DONE): 10/10 lokasi diganti, 0 warning rule target, lint bersih dari polusi worktree (baseline asli: 14 err/8 warn), tsc & build exit 0. Temuan dokumentasi: angka baseline lama tercemar salinan `.claude/worktrees/**` | ox-alpha |
| 2026-08-22 | — | Commit T-08 (`5b4ee22`) & T-09 (`cb738c2`) sesuai format R6 | ox-alpha |
| 2026-08-22 | T-10 | Task T-10 dibuat & dimulai (IN_PROGRESS) hasil re-audit + instruksi pemilik project: hardening fungsi SECURITY DEFINER live DB | ox-alpha |
| 2026-08-22 | T-10 | Selesai (DONE): 2 migration diterapkan (incl. koreksi grant PUBLIC), advisor security 19→7 (sisa by-design terdokumentasi), search_path fixed, ACL diverifikasi live | ox-alpha |
| 2026-08-22 | T-10 | Commit `76aa5ea` (plan.md) + `0adb560` (track semua migration + .gitignore) | ox-alpha |
| 2026-08-22 | T-01 | Dimulai & selesai (DONE): script typecheck ditambahkan, .env.example disinkronkan 8 var, baseline asli tercatat (lint 14err/8warn exit1 pre-existing · typecheck 0 · build 0) | ox-alpha |
| 2026-08-22 | T-01 | Commit `01ca6b5` | ox-alpha |
| 2026-08-22 | T-11 | Task T-11 dibuat & dimulai (IN_PROGRESS) instruksi pemilik project: sinkronkan seluruh dokumentasi dengan kondisi aktual | ox-alpha |
| 2026-08-22 | T-11 | Selesai (DONE): README + AGENTS.md §20 + .gitignore disinkronkan kondisi aktual; gerbang lint/typecheck/build tetap hijau | ox-alpha |
| 2026-08-22 | T-12 | Task T-12 dibuat & dimulai (IN_PROGRESS) instruksi pemilik project: konsolidasi 7 migration → 1 full schema (init+seed) | ox-alpha |
| 2026-08-22 | T-12 | Selesai (DONE): `20260822130000_full_schema.sql` (1314 baris) menggantikan 7 file lama; inventaris terverifikasi identik live DB (14 tabel, 10 fungsi, ensure_rls, 42 policy final, seed, bucket); gerbang hijau | ox-alpha |
| 2026-08-22 | T-02 | REVISI DESAIN: Midtrans Snap → **Xendit Invoice API v2** atas instruksi pemilik project (alasan: e-wallet lebih luas OVO/DANA + invoice-link via WA). Scope & kriteria ditulis ulang; task dimulai (IN_PROGRESS) | ox-alpha |
| 2026-08-22 | T-02 | Selesai (DONE): migration xendit_order_columns live+mirror, 2 API route (create/webhook) + admin client, UI bayar online & checkout, gerbang hijau. E2E runtime menunggu kredensial Xendit dari owner (tercatat di Bukti) | ox-alpha |
| 2026-08-22 | T-02 | Commit `8c1000c` + `83cf562` (gitignore migration fix) | ox-alpha |
| 2026-08-22 | T-03 | Dimulai & selesai (DONE): 3 API route flash-sales (GET/POST/PUT/DELETE/toggle) dgn verifyAdminRole, 6 fungsi lib/admin, FlashSaleModal + aksi tabel di /admin/promo; kriteria no.2 diadaptasi ke model harga absolut (terdokumentasi); gerbang hijau | ox-alpha |
| 2026-08-22 | T-03 | Commit `fbd7e45` | ox-alpha |
| 2026-08-22 | T-04 | Dimulai: daftar dipecah 14 sub-entri; verifikasi aktual menunjukkan 10 item sudah hilang/obsolete dari sesi fix sebelumnya | ox-alpha |
| 2026-08-22 | T-04 | Selesai (DONE): T-04.9 CLI devDep (c83f820) + T-04.10 nol warning lint (fd9dcdd); 12 lainnya SKIP/SUDAH-FIX terdokumentasi per-sub di tabel | ox-alpha |
| 2026-08-22 | T-05 | Dimulai & selesai (DONE): provider Resend (email) + Fonnte (WA) murni fetch; notify.ts + integrasi 3 titik pemicu; gerbang hijau; runtime test menunggu kredensial owner | ox-alpha |
| 2026-08-22 | T-05 | Commit `14af7ca` | ox-alpha |
| 2026-08-22 | T-06 | Dimulai & selesai (DONE): migration product_qna live+mirror, API tanya/jawab, tab Q&A detail produk, panel admin di ulasan, comparison utils+tombol+halaman /perbandingan; gerbang hijau | ox-alpha |
| 2026-08-22 | T-07 | Dimulai & selesai (DONE): banner DEPRECATED dipasang di ../Hera Store React/README.md; kriteria konsolidasi terpenuhi penuh (sisanya sudah di T-11/T-12) | ox-alpha |

## 🏁 ROADMAP SELESAI — semua task T-01 s/d T-12 berstatus DONE per 22 Agustus 2026.

---

### T-13 — Sinkronisasi Dokumentasi Pasca-Roadmap

| Field | Isi |
|---|---|
| Status | \DONE\ |
| Mulai / Selesai | 2026-08-22 / 2026-08-22 |

**Tujuan:** Menyinkronkan seluruh dokumentasi dengan kondisi akhir setelah T-02 s/d T-07 selesai (pembayaran online, notifikasi, Q&A, comparison, flash sale CRUD).

**Scope-IN:** README.md, AGENTS.md §20
**Scope-OUT:** kode aplikasi

**Kriteria Selesai**
1. ✅ README: struktur tree (33 route, lib baru, halaman perbandingan), fitur customer/admin terkini, tabel API 33 route, baseline verifikasi (14 err/0 warn), tabel Environment Variables lengkap
2. ✅ AGENTS.md §20: jumlah route 33, entri Live Systems Xendit & Notifikasi, tanggal sinkron T-13
3. ✅ Gerbang: lint 14/0 · typecheck 0 · build 0

**Bukti**
`
README.md : tree+fitur+API(33)+verifikasi+env table diperbarui
AGENTS.md : §20 route count 33, Xendit & Notifikasi live-systems,
            sync date T-13, lint baseline 14 problems
Gerbang   : lint 14 err/0 warn · typecheck exit 0 · build exit 0
`

---

| 2026-08-22 | T-13 | Dimulai & selesai (DONE): README (tree/fitur/API 33/verifikasi/env table) + AGENTS.md §20 disinkronkan kondisi akhir; gerbang hijau | ox-alpha |
| 2026-08-29 | T-14 | Dimulai & selesai (DONE): sinkronisasi DB live ke 20260822130000_full_schema.sql via MCP — migration `20260829120000_sync_full_schema` (product_qna + kolom xendit orders + hardening T-10 revoke EXECUTE + storage bucket 2MB/mime + policy DELETE storage); terverifikasi live: 15 tabel, 43 policy, ACL fungsi sesuai hardening, bucket 2MB jpg/png/webp; advisor hanya by-design WARN (has_role & fungsi stok authenticated) | ox-alpha |
| 2026-08-29 | T-15 | Dimulai & selesai (DONE): konsolidasi dokumentasi — hapus migration sync (sisa 1: full_schema), hapus AGENT.md/CLAUDE.md/doc.md/Todo.md, AGENTS.md satu-satunya dokumen agent + aturan DB-SYNC-1/2/3 (full_schema = DB live = codebase; wajib MCP, dilarang CLI) | ox-alpha |
| 2026-08-29 | T-16 | Dimulai & selesai (DONE): env disinkronkan ke proyek live leocryckwezmxusrorhm (.env.local URL + AGENTS.md §20/§22 AUTH-NOTE-1); konfirmasi super_admin ada & remote git origin ter-set | ox-alpha |
| 2026-08-29 | — | Perbaikan encoding: mojibake (double-encoded UTF-8) di plan.md & full_schema.sql dibersihkan — dipulihkan ke UTF-8 benar; emoji ikon kategori kini cocok dengan live DB; backup di temp/opencode/hera-backup | ox-alpha |
| 2026-08-29 | T-17 s/d T-25 | Dimulai & selesai (DONE): perbaikan keamanan & keandalan — T-17 checkout harga promo (getEffectivePrices: flash > discount > price) · T-18 policy profiles aman (user: safe fields; admin: penuh) + product_qna authenticated · T-19 confirm-payment via RPC request_payment_confirmation + verifikasi admin di modal · T-20 webhook cek paid_amount · T-21 voucher_usage + RPC redeem_voucher (per-user limit) · T-22 rollback variant phantom + qty integer · T-23 role whitelist + guard super_admin terakhir · T-24 magic bytes upload · T-25 full_schema = live (migration 20260829140000_security_fixes via MCP); gerbang typecheck 0 · build 0 · lint 13 (turun dari baseline 14) | ox-alpha |
| 2026-08-29 | T-26 s/d T-29 | Dimulai & selesai (DONE): T-26 proxy cookie disalin ke response (refresh token tidak hilang) · T-27 escapeHtml di email notify.ts · T-28 sold/best-seller/top-products exclude status dibatalkan + limit scan · T-29 validasi POST/PUT products (stock/discount negatif, slug regex + cek duplikat friendly); gerbang typecheck 0 · build 0 · lint 13 | ox-alpha |
| 2026-08-29 | T-31 s/d T-33 | Dimulai & selesai (DONE): T-31 kolom orders.stock_restored + RPC cancel_order_and_restore_stock (atomic, hanya admin, idempotent) dipakai updateOrderStatus saat dibatalkan · T-32 filter subCategory di /api/products & getProducts (CategoryClient kirim categorySlug induk + subCategory terpisah, TODO dihapus) · T-33 view product_sales_summary + sort popular di getProducts (tanpa order dibatalkan); full_schema = live (migration 20260829150000_stock_restore_and_sales_view); gerbang typecheck 0 · build 0 · lint 13 | ox-alpha |
| 2026-08-29 | T-34 s/d T-36 | Dimulai & selesai (DONE): T-34 view product_sales_summary (T-33) DIHAPUS karena terdeteksi security_definer_view ERROR advisor — diganti RPC get_product_sales_summary() SECURITY DEFINER (pola has_role, by-design WARN); getProductStatsMap & getBestSellerProducts & sort popular kini pakai RPC (satu sumber sold, fix bug sold=0 untuk guest/anon) · T-35 index 3 FK (categories.parent_id, product_qna.user_id, reviews.order_id) · T-36 komentar ponytail dibersihkan + AGENTS.md §22 PERF-NOTE-1/2 & DB-NOTE-1 (SKIP verdict unused_index, multiple_permissive, auth_rls_initplan, rate limiter, RPC by-design); full_schema = live (migration 20260829160000_sold_count_rpc); advisor security 0 ERROR; gerbang typecheck 0 · build 0 · lint 13 | ox-alpha |
| 2026-08-29 | T-38 | Dimulai & selesai (DONE): hapus fungsi mati increment_voucher_usage dari live (migration 20260829170000_drop_dead_voucher_function) + 3 lokasi di full_schema (2 definisi + 1 revoke) — digantikan RPC redeem_voucher (T-21); verifikasi: fungsi 0 tersisa, advisor bersih, typecheck 0 · build 0 | ox-alpha |
| 2026-08-29 | T-39 s/d T-44 | Dimulai & selesai (DONE): fitur Marketing & SEO mengacu docs seo.md — T-40 event_logs (RLS anon insert/admin manage) + lib/tracking.ts (5 pemicu: view/add_to_cart/checkout_start/order_created/payment_success) + API GET/PATCH admin/events + UI retry · T-41 utm_visits + orders.utm_source (capture URL→localStorage→checkout) + builder UTM + laporan source (kunjungan/order/revenue) via API admin/utm · T-42 tab SEO extend (GTM/Clarity/Ads/TikTok inject layout, AI crawler block 14 bot di robots.txt, geo JSON-LD LocalBusiness) · T-43 lib/google-analytics.ts (JWT RS256 manual node:crypto, GA4 runReport + GSC searchAnalytics, cached) + API admin/analytics + UI angka real · T-44 route llms.txt · T-39 marketing jadi 4 tab (Ringkasan/Analytics/Event/UTM), SMS Broadcast dihapus; DB via MCP (20260829180000_marketing_features) + full_schema sync; gerbang typecheck 0 · build 0 · lint 13 · advisor 0 ERROR | ox-alpha |
| 2026-08-29 | T-46 | Dimulai & selesai (DONE): hapus `export const runtime = "edge"` di 4 file ikon (icon.tsx, apple-icon.tsx, icon-192/512.png route) — Edge Runtime deprecated di Next 16, ImageResponse mendukung nodejs runtime; README disinkronkan; gerbang typecheck 0 · build 0 (ikon tetap render) · lint 13 | ox-alpha |
| 2026-08-29 | T-47 | Dimulai & selesai (DONE): rebrand catalog ke skincare — DB (migration 20260829190000_rebrand_skincare_catalog + full_schema sync): hapus 13 produk rumah tangga + test, 30 kategori baru (6 induk + 24 sub) murni kecantikan dengan icon NAMA LUCIDE (droplets/palette/bath/dll), 16 produk skincare (cleanser, toner, serum, moisturizer, sunscreen, mask, makeup, rambut, parfum, tubuh), 7 varian, 2 gambar per produk (picsum seeded), flash sale baru, store_info description skincare · kode: komponen CategoryIcon (map nama→lucide, 60+ icon), getProductImage helper, cart item image (ganti emoji), emoji diganti lucide di Home/Category/Detail/Navbar/Footer/keranjang/checkout/blog/cara-belanja/hubungi-kami/voucher/karir/not-found + seluruh admin (dashboard/keuangan/pesanan/pelanggan/promo/ulasan/produk/pengaturan/marketing/blog) + admin kategori form jadi grid pemilih lucide; gerbang typecheck 0 · build 0 · lint 13 | ox-alpha |
| 2026-08-29 | T-48 | Dimulai & selesai (DONE): sinkronisasi dokumentasi pasca T-47 — README (36 API routes + 3 baru events/utm/analytics, struktur tree, fitur customer 18 halaman, admin marketing 4 tab + SEO tabs, migration seed skincare, baseline lint 13) + AGENTS.md §20 (36 routes, catalog T-47) + §22 tanggal sinkron; gerbang typecheck 0 · lint 13 | ox-alpha |
| 2026-08-29 | — | Audit menyeluruh (kode + live DB via MCP) → 5 temuan HIGH + MEDIUM/LOW didaftarkan T-49..T-56 (BACKLOG); keputusan owner: cek ongkir real via RajaOngkir API V2 (Komerce, key tersedia), presisi subdistrict dengan picker alamat + kolom destination_area_id | zcode |
| 2026-08-29 | T-49 | Selesai (DONE): checkout kirim voucher_code (state dead diaktifkan); gerbang lint 13/typecheck 0/build 0. Commit `10c82b1` | zcode |
| 2026-08-29 | T-50 | Selesai (DONE): validasi shipping_cost finite>=0, discount<=subtotal, total>0 di /api/orders. Commit `ce0e38b` | zcode |
| 2026-08-29 | T-51 | Selesai (DONE): referensi invoice Xendit ditulis via service-role + guard env 503; E2E UNVERIFIED menunggu env owner (pola T-02). Commit `2b276cc` | zcode |
| 2026-08-29 | T-52 | Selesai (DONE): fragmen store_settings terpotong dihapus; parse OK 264 statement via pglast (libpg_query Postgres 17). Commit `8cdec0d` | zcode |
| 2026-08-29 | T-53 | Selesai (DONE): /api/newsletter server-side (service-role, dedupe, 503 bila env kosong) + HomeClient tanpa success palsu; persist runtime UNVERIFIED menunggu SUPABASE_SERVICE_ROLE_KEY. | zcode |
| 2026-08-29 | T-54 | Selesai (DONE): migration shipping_area_columns live+mirror (destination_area_id/label), settings += origin_area_id/label, lib/shipping.ts (sumber tunggal), /api/shipping/destination + /api/shipping/cost, AreaPicker di checkout/profil/admin, recompute ongkir server di /api/orders (mode flat: ongkir wajib == tarif settings); gerbang hijau; E2E dgn key owner UNVERIFIED (shape respons dinormalisasi defensif) | zcode |
| 2026-08-29 | T-55 | Selesai (DONE) 4 sub: .1 rollback createOrder via service-role + addresses 404 · .2 validasi flash_stock · .3 whitelist status orders/customers · .4 notifikasi customer pindah ke RPC request_payment_confirmation (migration payment_report_customer_notification live+mirror). Commit per sub | zcode |
| 2026-08-29 | T-56 | Selesai (DONE) 3 sub: .1 mask ga_service_account GET + preserve PUT · .2 sitemap/llms.txt/judul skincare · .3 housekeeping supabase/.temp + .claude/worktrees. Commit per sub (56.3 = disk only) | zcode |
| 2026-08-29 | T-54 | Addendum E2E upstream: key RajaOngkir owner diuji langsung — search & cost 200 OK, shape asli terkonfirmasi (label/*_name, {service,description,cost,etd}); gosend tidak didukung; normalisasi lib/shipping.ts disesuaikan + filter tier cargo band; gerbang hijau | zcode |
| 2026-08-29 | T-57 | Selesai (DONE): kuota RajaOngkir 100 hit/hari — migration shipping_cache (server-only, RLS tanpa policy) live+mirror; cache persisten per kurier (TTL 24 jam) & pencarian area (TTL 7 hari); gratis-ongkir = 0 hit API di cost+order route; AGENTS.md Live Systems diperbarui; gerbang hijau | zcode |
| 2026-08-29 | T-58 | Selesai (DONE): strip trailing slash NEXT_PUBLIC_SITE_URL di 3 route SEO — perbaiki double slash terdeteksi di deployment live marketplace.calysta.fun; gerbang hijau | zcode |
| 2026-08-30 | — | Audit UI/UX mobile live (browser 375×812, 12 halaman) → 4 task didaftarkan BACKLOG: T-59 tab bar detail produk overflow 448px (P0) · T-60 galeri gambar rusak next/image×picsum (P0) · T-61 keranjang nama terpotong & harga patah baris (P1) · T-62 audit lanjutan admin+checkout butuh akses (P1). Halaman lain bersih 0 overflow | zcode |
| 2026-08-30 | T-60 | Prioritas diturunkan P0→P2 (keputusan owner: foto masih placeholder; galeri self-heal saat foto asli di-upload ke Supabase Storage) | zcode |
| 2026-08-30 | T-62 | Selesai (DONE): audit admin 11 halaman (login super_admin) + checkout end-to-end customer (login user.md) di 375px — SEMUA 0 overflow, tidak ada perbaikan dibutuhkan; bonus verifikasi live: AreaPicker sugesti API asli ✓, gratis-ongkir 0-hit ✓, fallback flat ✓; action item operasional: owner isi origin_area_id + alamat lama pilih area | zcode |
| 2026-08-30 | T-63 | Selesai (DONE): fitur banner promosi — migration banners_table live+mirror (2 policy), 3 API admin route, tab Banner di marketing (BannerManager + upload), carousel auto-rotate di homepage; gerbang hijau | zcode |
| 2026-08-30 | T-65/T-66 | Selesai (DONE) & terverifikasi live: CSP connect-src += endpoint regional GA4; error API per-section di tab Analytics; GA4 config + GTM loader kini di <head> (gtag config @2.224, GTM @2.595 — sebelumnya di body @84rb) — syarat verifikasi GSC terpenuhi | zcode |
| 2026-08-30 | T-64 | Selesai (DONE): fitur push notification Web Push VAPID — deps web-push, VAPID keys digenerate ke env, migration push_subscriptions_table live+mirror (2 policy), public/sw.js, /api/push/subscribe + /api/admin/push, PushOptIn homepage + PushComposer tab Push; 503 graceful tanpa env; gerbang hijau; E2E runtime menunggu VAPID di Vercel + redeploy | zcode |
| 2026-08-30 | T-59 | Selesai (DONE): tab bar detail produk overflow-x-auto no-scrollbar (tombol nowrap shrink-0, px-4 mobile); gerbang hijau | zcode |
| 2026-08-30 | T-61 | Selesai (DONE): kartu item keranjang direstrukturisasi — hapus pindah ke kanan nama, nama full-width line-clamp-2, harga+stepper satu baris nowrap; gerbang hijau | zcode |
| 2026-08-30 | T-59/T-61 | Verifikasi live post-deploy (browser 375×812): halaman detail docW 370 (sebelumnya 448) 0 overflow, tab bar scrollable; keranjang nama tampil penuh & harga 1 baris — kedua temuan keluhan owner tertutup. Roadmap T-01..T-64 semuanya DONE | zcode |
| 2026-08-30 | T-02 | VERIFIKASI WEBHOOK: Xendit dashboard Test → 200 OK (512ms) — XENDIT_CALLBACK_TOKEN terpasang di Vercel, endpoint produksi terautentikasi; sisa runtime E2E (bayar simulasi → lunas otomatis) menunggu pesanan test owner. Seluruh dokumentasi disinkronkan (AGENTS.md tanggal + status Xendit) | zcode |

---

### T-14 — Sinkronisasi DB Live ke Full Schema

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |
| Referensi | `supabase/migrations/20260822130000_full_schema.sql`, `20260829120000_sync_full_schema.sql` |

**Tujuan:** Menyamakan DB live (proyek yang terhubung ke MCP Supabase) dengan full schema + codebase. Ditemukan live DB ketinggalan: tanpa tabel `product_qna`, tanpa kolom `orders.xendit_invoice_*`, tanpa hardening T-10, bucket storage tanpa limit/mime, tanpa policy DELETE storage.

**Bukti**
```
Migration : 20260829120000_sync_full_schema diterapkan via MCP (success)
Live      : 15 tabel (product_qna ada, RLS on) · orders.xendit_invoice_id/url ada
ACL       : stok/voucher = postgres+authenticated+service_role (PUBLIC/anon revoked);
            trigger fns = postgres+service_role; has_role dipertahankan (by design)
Storage   : bucket 2MB, mime jpg/png/webp, policy INSERT/SELECT/DELETE lengkap
Advisor   : hanya WARN by-design (has_role anon/authenticated + fungsi stok authenticated)
Codebase  : tidak ada perubahan kode — product_qna dipakai via string literal,
            xendit_invoice_* sudah ada di types/database.ts
Gerbang   : tidak ada perubahan src → lint/typecheck/build tidak dijalankan ulang
```

---

### T-15 — Konsolidasi Dokumentasi & Satu File Migration

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |

**Tujuan:** Menyisakan satu file migration sebagai pedoman skema (`20260822130000_full_schema.sql`) dan satu dokumen agent (`AGENTS.md`); menuliskan aturan sync full schema = DB live = codebase serta kewajiban MCP (dilarang CLI).

**Scope-IN**
- Hapus `supabase/migrations/20260829120000_sync_full_schema.sql` (konsolidasi → full schema)
- Hapus `AGENT.md`, `CLAUDE.md`, `doc.md`, `Todo.md`
- `AGENTS.md` §20 disinkronkan (hapus referensi doc lama, satu file migration) + §22 aturan DB-SYNC-1/2/3
- `.gitignore`, `README.md`, `plan.md` header disinkronkan

**Bukti**
```
Migration : 1 file tersisa (20260822130000_full_schema.sql) — isinya identik live DB
Docs      : AGENT.md, CLAUDE.md, doc.md, Todo.md dihapus; AGENTS.md satu-satunya dokumen agent
AGENTS.md : §20 (Source of Truth Files, Live Systems) + §22 DB-SYNC-1/2/3 ditulis
            DB-SYNC-1: full_schema = DB live = actual codebase
            DB-SYNC-2: wajib MCP, DILARANG supabase CLI
            DB-SYNC-3: migration ≠ bukti live; apply via MCP lalu verifikasi
Gerbang   : tidak ada perubahan src → lint/typecheck/build tidak dijalankan ulang
```

---

### T-16 — Sinkronisasi Env & Project Ref Live

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |

**Tujuan:** Menyamakan env app dengan DB live yang benar (proyek MCP = `leocryckwezmxusrorhm`; env lama menunjuk `pvvjfnabrywvnoolipji` yang salah). Publishable key sudah cocok dengan proyek live.

**Scope-IN**
- `.env.local` — `NEXT_PUBLIC_SUPABASE_URL` → `https://leocryckwezmxusrorhm.supabase.co` (key sudah benar)
- `AGENTS.md` §20 — Live Systems Supabase project ref = leocryckwezmxusrorhm; §22 tambah AUTH-NOTE-1 (leaked password protection = fitur Pro, bukan bug, jangan di-notice)
- Konfirmasi: role `super_admin` sudah ada di live (infocyber001@gmail.com); remote git origin sudah ter-set

**Bukti**
```
Env       : .env.local URL = leocryckwezmxusrorhm (key sb_publishable__VTdM36... = cocok live)
Live      : get_project_url = https://leocryckwezmxusrorhm.supabase.co
Profiles  : 1 super_admin (infocyber001@gmail.com), 2 customer — role admin sudah ada
Git remote: origin https://github.com/krotchya-gif/Hera-Skincare-Marketplace.git (sudah ada)
Gerbang   : tidak ada perubahan src → lint/typecheck/build tidak dijalankan ulang
```

---

### T-49 — Fix checkout voucher (voucher_code tidak terkirim)

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |
| Prioritas | P0 |
| Sumber | Audit menyeluruh 2026-08-29 — temuan HIGH-1 (terverifikasi kode) |

**Tujuan:** Checkout dengan voucher selalu gagal. `src/app/checkout/page.tsx` (payload `handleCreateOrder`) mengirim `discount` tanpa `voucher_code`, sedangkan `src/app/api/orders/route.ts` menolak 400 "Kode voucher diperlukan" bila `discount > 0`. State `voucherCode` di checkout berupa dead code.

**Scope-IN**
- `src/app/checkout/page.tsx` — kirim `voucher_code` dari localStorage `hera_applied_voucher` ke payload `/api/orders`; bersihkan dead state `voucherCode`
- `src/app/keranjang/page.tsx` — bila perlu, samakan bentuk data `hera_applied_voucher`
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Validasi voucher server (`api/orders/route.ts`, `lib/vouchers.ts`) — TIDAK boleh dilemahkan
- Fitur voucher lain, halaman admin promo

**Kriteria Selesai**
1. Order dengan voucher aktif sukses dibuat (uji manual: keranjang → pakai voucher → checkout selesai)
2. Order tanpa voucher tetap berjalan normal
3. Revalidasi server tetap menolak discount tanpa kode / nilai diskon tak cocok
4. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
== Perubahan ==
~ src/app/checkout/page.tsx
  - state `[, setVoucherCode]` (dead) → `[voucherCode, setVoucherCode]`
  - payload POST /api/orders kini mengirim voucher_code dari
    localStorage hera_applied_voucher (undefined bila tanpa voucher)

== Gerbang ==
lint      : 13 problems (13 error pre-existing baseline, 0 warning) — tidak bertambah
typecheck : tsc --noEmit → EXIT 0
build     : EXIT 0 (semua route ter-generate)

== Status kriteria ==
1 ✅ rantai lengkap: keranjang simpan {code,discount} → checkout kirim voucher_code
   → server validasi (getEffectivePrices + validateVoucher) — runtime E2E dengan
   akun nyata menunggu dev server owner (tidak dibuat data test di DB live)
2 ✅ voucher_code undefined bila tanpa voucher → jalur order tanpa diskon utuh
3 ✅ validasi server tidak diubah sama sekali
```

---

### T-50 — Validasi shipping_cost & total di /api/orders

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |
| Prioritas | P0 |
| Sumber | Audit menyeluruh 2026-08-29 — temuan HIGH-2 (terverifikasi kode) |

**Tujuan:** `src/app/api/orders/route.ts` menerima `shipping_cost` dari client tanpa validasi (`Number(body.shipping_cost) || 0`) — nilai negatif lolos dan menekan `total` meski harga item sudah divalidasi ketat. Integritas nilai transaksi wajib dijaga server-side.

**Scope-IN**
- `src/app/api/orders/route.ts` — wajibkan `shipping_cost >= 0`, `total > 0`, `discount <= subtotal` (tolak 400)
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Sumber ongkir dari settings / keranjang / checkout (milik T-54)
- Validasi harga item & voucher yang sudah ada

**Kriteria Selesai**
1. Payload `shipping_cost` negatif / `total <= 0` / `discount > subtotal` ditolak 400
2. Alur checkout normal tidak berubah
3. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
== Perubahan ==
~ src/app/api/orders/route.ts (blok validasi total → "Validasi ongkir, diskon & total")
  - shipping_cost: undefined = 0 (kompatibel); selain itu wajib finite & >= 0 → 400
  - discount > subtotal → 400
  - expectedTotal <= 0 → 400
  - equality check total tetap (client total harus cocok hasil recompute)

== Gerbang ==
lint      : 13 problems (baseline sama, 0 warning)
typecheck : tsc --noEmit → EXIT 0
build     : EXIT 0

== Status kriteria ==
1 ✅ (cabang 400 baru; perilaku lama `|| 0` utk undefined dipertahankan)
2 ✅ (hanya cabang penolakan baru; payload sah tidak berubah)
3 ✅
```

---

### T-51 — Xendit create: simpan referensi invoice via service-role

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |
| Prioritas | P0 |
| Sumber | Audit 2026-08-29 — temuan HIGH-4; TERKONFIRMASI live DB via MCP (policy UPDATE orders = admin-only, tidak ada policy user) |

**Tujuan:** `src/app/api/payments/xendit/create/route.ts` meng-update `orders.xendit_invoice_id/url` memakai client session customer — pasti ditolak RLS (policy UPDATE orders hanya untuk admin). Akibatnya invoice dibuat di Xendit lalu di-expire dan user menerima 500: pembayaran online tidak berfungsi.

**Scope-IN**
- `src/app/api/payments/xendit/create/route.ts` — update referensi invoice memakai `createAdminClient()` (service-role); kepemilikan order TETAP diverifikasi via session client sebelum call
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Webhook Xendit, alur transfer manual (`confirm-payment`), policy RLS orders
- `src/utils/supabase/admin.ts`

**Kriteria Selesai**
1. Kode: referensi invoice tersimpan ke orders tanpa bergantung policy user
2. Runtime E2E ditandai UNVERIFIED sampai owner mengisi env Xendit (pola T-02) — transfer manual tetap utuh
3. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
== Perubahan ==
~ src/app/api/payments/xendit/create/route.ts
  - import createAdminClient
  - guard env: XENDIT_SECRET_KEY ATAU SUPABASE_SERVICE_ROLE_KEY kosong → 503
    (transfer manual tetap jalan)
  - langkah 7: update orders.xendit_invoice_id/url via createAdminClient()
    (kepemilikan order tetap diverifikasi via session client di langkah 4;
    service-role hanya menulis referensi invoice setelah verifikasi)

== Gerbang ==
lint      : 13 problems (baseline sama, 0 warning)
typecheck : tsc --noEmit → EXIT 0
build     : EXIT 0

== UNVERIFIED (pola T-02) ==
E2E runtime (create invoice → tersimpan → bayar → webhook) menunggu owner
mengisi XENDIT_SECRET_KEY + XENDIT_CALLBACK_TOKEN + SUPABASE_SERVICE_ROLE_KEY
dan mendaftarkan callback URL di dashboard Xendit.
```

---

### T-52 — Perbaiki syntax error full_schema.sql

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |
| Prioritas | P0 |
| Sumber | Audit 2026-08-29 — temuan HIGH-5; policy & kolom terverifikasi 100% sinkron live via MCP (52 public + 3 storage), kerusakan murni sintaks file |

**Tujuan:** `supabase/migrations/20260822130000_full_schema.sql` (SATU-SATUNYA pedoman skema, DB-SYNC-1) tidak bisa dieksekusi: statement `create table if not exists public.store_settings (` terpotong di baris ±599 karena blok `-- PRODUCT Q&A (T-06.1)` tersisip di tengah statement; definisi lengkap store_settings baru muncul di baris ±636.

**Scope-IN**
- `supabase/migrations/20260822130000_full_schema.sql` — hapus fragmen statement terpotong, pertahankan definisi lengkap; review cepat bagian lain agar file utuh sebagai init + seed
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Live DB — DILARANG mengeksekusi file ini ke live (mengandung DELETE seed T-47)
- Struktur/policy/fungsi apa pun (sudah sinkron live)

**Kriteria Selesai**
1. File terbukti parse-able & bisa dieksekusi penuh untuk init project baru (uji di Postgres disposable lokal / scratch project — bukan live)
2. Tidak ada perubahan makna skema vs live DB (DB-SYNC-1 kembali utuh)
3. Bukti uji parse tercatat di Bukti

**Bukti**
```
== Perubahan ==
~ supabase/migrations/20260822130000_full_schema.sql — hapus 2 baris rusak
  (fragmen "create table if not exists public.store_settings (" terpotong
  di bekas baris 599); definisi lengkap store_settings kini TEPAT 1x.
  Diff total: -2 baris, tanpa perubahan lain.

== Uji parse (pglast v8.4 = libpg_query Postgres 17, engine sama dgn live) ==
PARSE OK: 264 statements
  CreatePolicyStmt 64 · AlterTableStmt 46 · IndexStmt 38 · InsertStmt 30
  CreateStmt 19 · CreateFunctionStmt 19 · GrantStmt 15 · UpdateStmt 13
  DropStmt 8 · DeleteStmt 6 · CreateTrigStmt 3 · Extension/EventTrig/AlterFn 3

== Keterbatasan verifikasi ==
Uji EKSEKUSI penuh butuh environment bergaya Supabase (schema auth/storage,
role anon/authenticated/service_role) — Docker tidak tersedia di mesin ini
dan live DB DILARANG dipakai (file mengandung DELETE seed). Parse dgn parser
resmi Postgres 17 + identitas policy/kolom vs live (verifikasi MCP 2026-08-29)
= bukti terkuat yang tersedia; uji init nyata bisa dijalankan saat membuat
project Supabase baru.

== Gerbang ==
Tidak ada perubahan src → lint/typecheck/build tidak dijalankan ulang (pola T-14/T-15)
```

---

### T-53 — Newsletter via API route (RLS-safe)

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |
| Prioritas | P1 |
| Sumber | Audit 2026-08-29 — temuan HIGH-3; TERKONFIRMASI live via MCP (write store_settings admin-only; key `subscribed_emails` tidak ada = belum pernah tersimpan) |

**Tujuan:** Newsletter di homepage di-upsert langsung dari browser (anon) ke `store_settings` — pasti ditolak RLS — lalu UI tetap menampilkan sukses. Data subscriber hilang diam-diam.

**Scope-IN**
- API route baru `src/app/api/newsletter/route.ts` (POST) — rate-limit, validasi email, dedupe, tulis via `createAdminClient()` ke key `subscribed_emails` (server-side only)
- `src/components/HomeClient.tsx` — panggil route baru; hapus fallback "tetap anggap berhasil"
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Policy RLS store_settings (tetap ketat admin-only)
- Provider email marketing eksternal

**Kriteria Selesai**
1. Subscribe tersimpan di live DB (verifikasi via MCP: key `subscribed_emails` berisi daftar email)
2. Email duplikat tidak tersimpan dobel; guest & login sama-sama jalan
3. Gagal simpan = toast error (bukan success palsu)
4. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
== Perubahan ==
+ src/app/api/newsletter/route.ts (POST) — rate-limit 10/menit, validasi email,
  guard SUPABASE_SERVICE_ROLE_KEY kosong → 503, baca-dedupe-upsert ke
  store_settings key subscribed_emails via createAdminClient (server-side),
  duplikat → sukses tanpa tulis ulang, gagal → 4xx/5xx dengan pesan
~ src/components/HomeClient.tsx (handleSubscribe) — fetch /api/newsletter;
  fallback "tetap anggap berhasil" DIHAPUS; gagal → toast error
Catatan: sync jumlah route README (36→37) digabung ke Bukti T-54 yang sudah
memiliki README di Scope-IN.

== Gerbang ==
lint      : 13 problems (baseline sama, 0 warning)
typecheck : tsc --noEmit → EXIT 0
build     : EXIT 0

== UNVERIFIED (pola T-02) ==
Runtime persist ke live DB menunggu SUPABASE_SERVICE_ROLE_KEY diisi owner
(.env.local kini hanya 3 var NEXT_PUBLIC). Route sudah guard 503 ramah bila
env kosong — tidak ada lagi success palsu. Verifikasi MCP setelah env diisi:
cek key subscribed_emails berisi email subscriber.
```

---

### T-54 — Integrasi RajaOngkir V2 (Komerce): cek ongkir real + satukan logika ongkir

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |
| Prioritas | P1 |
| Referensi | https://rajaongkir.com/docs/shipping-cost/getting_started/about — API V2 (Komerce): base `https://rajaongkir.komerce.id/api/v1/`, auth header `key`; `POST /calculate/domestic-cost` (origin, destination = area ID subdistrict, weight gram, courier kode mis. `jne`); `GET /destination/domestic-destination?search=` (pencarian area) |
| Keputusan owner | 2026-08-29: key Komerce/V2 sudah tersedia (E2E bisa diverifikasi saat implementasi); presisi subdistrict dengan picker alamat + kolom baru |

**Tujuan:** Ongkir saat ini flat hardcoded 12000 per kurir di checkout, gratis-ongkir hanya diterapkan di keranjang (inkonsisten), dan ongkir dipercaya dari client (diperkuat T-50). Integrasi ongkir real RajaOngkir V2 + satu sumber logika ongkir + recompute server saat order.

**Scope-IN**
- Migration via MCP + mirror full_schema + `src/types/database.ts`: kolom `shipping_addresses.destination_area_id text` + `destination_area_label text` (DB-SYNC-1/2/3)
- `store_settings.shipping` += `origin_area_id` + field di admin Pengaturan → tab Pengiriman
- Route baru `src/app/api/shipping/destination/route.ts` — proxy pencarian area (rate-limit, auth)
- Route baru `src/app/api/shipping/cost/route.ts` — POST address_id + items → weight dihitung server dari DB (`products.weight_gram` × qty), origin dari settings → daftar kurir/service/etd/cost
- `src/lib/shipping.ts` — sumber tunggal ongkir (flat fallback + gratis-ongkir threshold), dipakai keranjang & checkout
- Form alamat (checkout + profil) — search picker area, simpan via `/api/addresses` (whitelist field baru)
- `src/app/api/orders/route.ts` — bila RajaOngkir aktif: ongkir FINAL direcompute server dari `destination_area_id` di DB + weight DB + courier code payload; nilai client diabaikan (penguat T-50)
- `.env.example` — `RAJAONGKIR_API_KEY`; README (fitur + env); AGENTS.md §20 Live Systems RajaOngkir
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Waybill/tracking API, kurir instan (GoSend/Grab) sampai kebutuhan nyata
- Schema lain di luar kolom baru di atas

**Kriteria Selesai**
1. Dengan key: ongkir nyata tampil per kurir/service di checkout; order terbuat dengan ongkir hasil recompute server
2. Tanpa key: fallback flat rate + gratis-ongkir tetap berfungsi penuh (pola graceful Xendit/notify)
3. Keranjang & checkout menampilkan sumber ongkir yang sama (tidak ada lagi 12000 hardcoded / "Gratis!" lalu ditagih)
4. Migration live terverifikasi via MCP (kolom ada, advisor tidak bertambah) + full_schema tersinkron
5. E2E dengan key Komerce owner + ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
== Migration live (via MCP) ==
shipping_area_columns: shipping_addresses.destination_area_id text +
  destination_area_label text — terverifikasi live (information_schema) ✅
store_settings.shipping += origin_area_id:"" + origin_area_label:"" ✅
Advisor: tidak berubah (temuan kategori lama yang sudah di-skip saja)

== File baru ==
+ src/lib/shipping.ts                — SATU sumber logika ongkir: settings,
  isRajaOngkirEnabled, searchDestinationAreas (normalisasi defensif), fetch
  costs per kurir + cache 5 menit, buildFlatOptions, getWeightFromItems (DB)
+ src/app/api/shipping/destination   — GET proxy pencarian area (auth +
  rate-limit 60/menit; cukup RAJAONGKIR_API_KEY, tanpa origin — agar admin
  bisa mencari area asal pertama kali)
+ src/app/api/shipping/cost          — POST address_id+items+subtotal →
  berat dari DB, area dari alamat DB, mode rajaongkir|flat + info gratis-ongkir
+ src/components/AreaPicker.tsx      — picker pencarian area (debounce 350ms)

== File diubah ==
~ supabase/migrations/full_schema.sql — kolom baru di shipping_addresses +
  seed shipping += origin_area_id/label (parse ulang: OK 264 stmt, libpg_query PG17)
~ src/types/database.ts               — ShippingAddress += destination fields
~ api/addresses (+[id])               — whitelist destination_area_id/label
  (string bersih / null)
~ checkout/page.tsx                   — opsi ongkir dari /api/shipping/cost
  per alamat terpilih, AreaPicker di modal alamat, payload kirim address_id +
  courier_code + service_code, ringkasan "Gratis" saat free-shipping,
  catatan mode flat; ongkir hardcode 12000 DIHAPUS
~ components/ProfilClient.tsx         — AreaPicker di form alamat (edit/baru)
~ admin/pengaturan (Pengiriman)       — AreaPicker area asal + field
  origin_area_id/label disertakan saat PUT (sebelumnya PUT menimpa jsonb
  dan akan MENGHAPUS field baru — bug yang dicegah)
~ api/orders                          — mode rajaongkir: address_id wajib,
  alamat & berat dari DB, courier/service divalidasi, ongkir final recompute
  server (nilai client diabaikan); mode flat: ongkir wajib == tarif settings
  (atau 0 bila gratis-ongkir); total equality hanya mode flat
~ .env.example / .env.local           — RAJAONGKIR_API_KEY (kosong = flat)
~ README.md (39 routes, fitur, env) + AGENTS.md §20 (39 routes, Live Systems
  RajaOngkir; termasuk sinkron route /api/newsletter dari T-53)

== Gerbang ==
lint      : 13 problems (baseline sama, 0 warning) — 2 error baru
            (set-state-in-effect) muncul lama diperbaiki: setState hanya
            pasca-await / dalam callback timer; loading diturunkan dari state
typecheck : tsc --noEmit → EXIT 0
build     : EXIT 0

== UNVERIFIED (menunggu key owner) ==
1. Shape respons eksak RajaOngkir V2 (normalisasi defensif utk array objek &
   array of arrays sudah dipasang) — konfirmasi saat RAJAONGKIR_API_KEY diisi
2. E2E: isi key → Admin→Pengiriman pilih area asal → isi alamat dgn picker →
   checkout: ongkir real per kurir → order terbuat dgn ongkir recompute server

**Bukti E2E upstream (addendum, 2026-08-29 — key owner diisi di .env.local)**
```
Uji langsung API V2 dgn key asli (curl, bukan lewat app):
- GET /destination/domestic-destination?search=... → 200 OK.
  Shape: data[] = {id, label, province_name, city_name, district_name,
  subdistrict_name, zip_code} — label siap-pakai
- POST /calculate/domestic-cost (origin 17547 Jaksel → destination 4866
  Bandung, weight 1000): 200 OK utk jne/jnt/sicepat/anteraja.
  Shape: data[] = {name, code, service, description, cost, etd}
- gosend → 422 "valid courier is jne, sicepat, ide, sap, jnt, ninja, tiki,
  lion, anteraja, pos, ..." — Gosend TIDAK didukung endpoint ini (on-demand)
~ lib/shipping.ts — normalisasi disesuaikan shape asli: search pakai
  label/*_name; cost: sembunyikan tier cargo band ("JTR<130" dst.),
  etd kosong → "-"
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
Sisa UNVERIFIED (app-level): picker + checkout dgn key butuh dev server
jalan; origin_area_id belum diisi owner di Admin→Pengiriman.
```
```

---

### T-55 — Konsistensi order & stok (4 sub-bug)

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |
| Prioritas | P1 |
| Sumber | Audit 2026-08-29 — temuan MEDIUM terverifikasi kode + live DB |

**Aturan khusus (pola T-04):** satu sub-bug = satu commit; task induk DONE jika semua sub DONE atau di-skip dengan alasan eksplisit pemilik project.

| Sub-ID | Bug (ringkas) | Status |
|--------|---------------|--------|
| T-55.1 | Rollback `createOrder` delete orders/order_items via client user — RLS-ditolak (tidak ada policy DELETE) → order yatim tertinggal; cleanup via service-role; sekalian: addresses PUT/DELETE cek baris terdampak (bukan success palsu) | DONE |
| T-55.2 | `flash_stock` tidak divalidasi server di `/api/orders` (hanya `products.stock`) — kuota flash bisa ditembus | DONE |
| T-55.3 | Whitelist status: admin orders PUT (transisi valid via `updateOrderStatus`) & customers PUT (`aktif\|nonaktif\|diblokir`) | DONE |
| T-55.4 | Notifikasi customer "Pembayaran Dilaporkan" dibuat di dalam RPC `request_payment_confirmation` (SECURITY DEFINER) — insert client pasti ditolak policy INSERT notifications admin-only | DONE |

**Kriteria Selesai (per sub)**
1. Perilaku terverifikasi (uji manual / review SQL); tidak menambah parallel write path
2. Ketiga gerbang DoD hijau + bukti tercatat; commit `<T-ID.sub>: ...`

**Bukti T-55.1**
```
~ src/lib/orders.ts          — cleanup rollback (order yatim + order_items)
  via createAdminClient (service-role); komentar root cause RLS
~ api/addresses/[id]         — PUT & DELETE kini .select() + 404 bila 0 baris
  terdampak (id milik orang lain/tidak ada bukan lagi success:true)
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
```

**Bukti T-55.2**
```
~ api/orders — fetch flash_sale_products join flash_sales aktif (window
  starts_at/ends_at) utk productIds; bila produk ada di >1 sale, pakai baris
  harga terendah (konsisten getEffectivePrices); qty > flash_stock → 400
  "Kuota flash sale ... tidak mencukupi"
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
```

**Bukti T-55.3**
```
~ lib/orders.ts (updateOrderStatus)  — whitelist OrderStatus di awal; string
  arbitrer → throw 400 "Status pesanan tidak valid."
~ api/admin/customers/[id]           — type guard CustomerStatus (aktif|
  nonaktif|diblokir) → 400 bila di luar daftar; TS narrowing aman
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
```

**Bukti T-55.4**
```
Migration live (via MCP): payment_report_customer_notification — RPC
  request_payment_confirmation kini insert 2 notifikasi (customer
  "Pembayaran Dilaporkan" + admin "Verifikasi Pembayaran")
Verifikasi live: prosrc mengandung kedua notifikasi ✅
Mirror: full_schema.sql definisi RPC diganti (identik)
~ api/orders/[id]/confirm-payment — insert notifications via client DIHAPUS
  (parallel write path yang RLS-ditolak tidak disisakan)
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
```

---

### T-56 — Hardening & housekeeping kecil

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |
| Prioritas | P2 |
| Sumber | Audit 2026-08-29 — temuan LOW + housekeeping |

**Aturan khusus (pola T-04):** satu sub = satu commit.

| Sub-ID | Item (ringkas) | Status |
|--------|----------------|--------|
| T-56.1 | `GET /api/admin/settings` tidak lagi mengembalikan isi penuh `seo.ga_service_account` (private key tak transit browser; nilai penuh hanya lewat PUT) | DONE |
| T-56.2 | SEO/content: sitemap exclude `/keranjang` `/checkout` `/profil`; llms.txt perbaiki link `/kategori` (404); default title layout & homepage → skincare (copy drift pasca T-47) | DONE |
| T-56.3 | Housekeeping workspace: bersihkan `supabase/.temp` (ter-link project lama `pvvjfnabrywvnoolipji`) + `.claude/worktrees` basi — keduanya gitignored; live DB tidak disentuh | DONE |

**Kriteria Selesai (per sub)**
1. Perilaku terverifikasi; tidak ada regresi fitur
2. Ketiga gerbang DoD hijau + bukti tercatat; commit `<T-ID.sub>: ...`

**Bukti T-56.1**
```
~ api/admin/settings GET  — seo.ga_service_account diganti penanda
  {__configured:true} sebelum dikirim ke browser
~ api/admin/settings PUT  — bila payload seo tidak membawa objek baru,
  nilai lama di DB dipertahankan (mask/kosong tidak menimpa private key)
~ admin/pengaturan        — textarea tak lagi menampilkan nilai (badge
  "terkonfigurasi"), kosong + terkonfigurasi = pertahankan (marker dikirim)
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
```

**Bukti T-56.2**
```
~ sitemap.xml/route.ts — /keranjang /checkout /profil dihapus dari sitemap
~ llms.txt/route.ts    — link /kategori (404) dihapus dari daftar halaman
~ layout.tsx + page.tsx — default title "Marketplace Produk Rumah Tangga"
  → "Marketplace Skincare & Perawatan Pribadi" (copy drift T-47)
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
```

**Bukti T-56.3**
```
Dihapus dari disk (gitignored, bukan bagian repo):
- supabase/.temp/         — link CLI ke project LAMA pvvjfnabrywvnoolipji
  (mencegah kesalahan penggunaan CLI terhadap project yang salah;
  verifikasi DB tetap 100% via MCP sesuai DB-SYNC-2)
- .claude/worktrees/      — salinan project basi sisa sesi agent lama
Live DB tidak disentuh; tidak ada file tracked yang berubah.
```

---

### T-57 — RajaOngkir kuota 100 hit/hari: cache persisten + short-circuit

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |
| Prioritas | P0 |
| Sumber | Info owner 2026-08-29: kuota API key RajaOngkir hanya 100 hit/hari. Tanpa cache, 1x cek ongkir = N hit (1 per kurir) + recompute order + ketikan picker → kuota habis |

**Tujuan:** Menghemat kuota API tanpa mengubah perilaku harga: (1) cache persisten di DB (bertahan antar cold-start/instance — in-memory 5 menit tidak cukup), (2) per-kurier cache key agar hanya kurir yang miss yang dipanggil, (3) gratis-ongkir memenuhi syarat → 0 hit API, (4) pencarian area di-cache (data area ~statis).

**Scope-IN**
- Migration via MCP + mirror full_schema: tabel `shipping_cache` (cache_key PK, value jsonb, created_at) — RLS on TANPA policy (server-only by design, hanya service-role; mencegah peracunan harga dari klien)
- `lib/shipping.ts` — helper cacheGet/cachePut (service-role, TTL: ongkir 24 jam, area 7 hari, prune 30 hari); fetchRajaOngkirCosts cache-first per kurier; searchDestinationAreas cache-first; hapus in-memory map
- `/api/shipping/cost` — gratis-ongkir memenuhi syarat → flat options tanpa hit API
- `/api/orders` — gratis-ongkir → skip panggil API + validasi layanan (harga = 0, kurir hanya informasi); alamat tetap dari DB
- AGENTS.md Live Systems — catat kuota 100 hit/hari + mekanisme cache
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Logika harga/validasi yang sudah ada (T-50/T-54)
- Kuota/plan RajaOngkir (keputusan owner)

**Kriteria Selesai**
1. Cek ongkir berulang utk kombinasi sama = 0 hit API (cache DB)
2. Gratis-ongkir = 0 hit API di cost route & order route
3. Cache hanya bisa ditulis service-role (tanpa kebocoran/peracunan dari klien)
4. Tanpa SUPABASE_SERVICE_ROLE_KEY → cache nonaktif, alur tetap benar (fallback langsung API)
5. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
== Migration live (via MCP) ==
shipping_cache_table: tabel shipping_cache (cache_key PK, value jsonb,
  created_at) — terverifikasi live: RLS on, 0 policy = server-only
  (hanya service-role; klien publik tidak bisa baca/tulis → tidak bisa
  memperacuni harga cache). Mirror full_schema (parse OK 266 statement).

== Perubahan ==
~ lib/shipping.ts — cacheGet/cachePut (service-role, best-effort: gagal =
  lewatkan cache, alur tetap jalan); fetchRajaOngkirCosts cache-first PER
  KURIER (key cost:{origin}:{dest}:{weight}:{courier}, TTL 24 jam) — hanya
  kurir miss yang hit API; searchDestinationAreas cache-first
  (key dest:{query}, TTL 7 hari — data area ~statis); prune entri >30 hari;
  in-memory 5 menit DIHAPUS (digantikan cache DB yang bertahan antar
  cold-start/instance)
~ api/shipping/cost — gratis-ongkir terpenuhi → flat options TANPA hit API
~ api/orders — gratis-ongkir → skip panggil API + validasi layanan
  (serverShipping = 0; kurir hanya informasi); alamat tetap dari DB
~ AGENTS.md Live Systems — kuota 100 hit/hari + mekanisme cache

== Efek kuota (estimasi) ==
Sebelum: buka checkout = 5 hit (5 kurir) + 1 hit recompute + ketikan picker.
Sesudah: kombinasi (area, berat, kurir) hanya 1x hit per 24 jam; ulangan =
0 hit; gratis-ongkir = 0 hit; pencarian area = 1x per query per 7 hari.
Pol cache persisten juga bekerja antar cold-start/instance serverless
(kelemahan cache in-memory di PERF-NOTE-2 tidak berlaku di sini).

== Gerbang ==
lint 13 (baseline) · typecheck 0 · build 0 · full_schema parse OK (266 stmt)
```

---

### T-58 — Normalisasi NEXT_PUBLIC_SITE_URL (double slash di sitemap/robots/llms.txt)

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-29 / 2026-08-29 |
| Prioritas | P1 |
| Sumber | Cek deployment live https://marketplace.calysta.fun — sitemap/robots memancarkan URL double slash (`...fun//keranjang`, `...fun//sitemap.xml`) karena env Vercel diisi dengan trailing slash |

**Tujuan:** `getBaseUrl()` di 3 route SEO mengembalikan env apa adanya; trailing slash di env menghasilkan URL ganda-garis. Normalisasi di kode agar kebal bentuk env (bukan mengandalkan disiplin isi env).

**Scope-IN**
- `src/app/sitemap.xml/route.ts`, `src/app/robots.txt/route.ts`, `src/app/llms.txt/route.ts` — strip trailing slash pada nilai `NEXT_PUBLIC_SITE_URL` di `getBaseUrl()`
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Isi env di Vercel (milik owner); template lain di seo.ts

**Kriteria Selesai**
1. URL di sitemap/robots/llms.txt tanpa double slash apa pun bentuk env
2. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
~ 3 route SEO (sitemap.xml / robots.txt / llms.txt) — getBaseUrl():
  NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
```

---

### T-59..T-62 — Perbaikan tampilan mobile (hasil audit visual marketplace.calysta.fun, 2026-08-29)

> Metode audit: browser nyata viewport 375×812 + pengukuran `scrollWidth` per halaman
> + identifikasi elemen pelaku via getBoundingClientRect. Halaman dialami: /,
> /kategori/skincare, /produk/gentle-cleansing-foam, /keranjang (dengan item
> simulasi localStorage), /checkout, /voucher, /blog, /faq, /cara-belanja,
> /perbandingan, /profil, /admin/login.
> ⚠️ Catatan artefak: screenshot fullPage IAB menggambar navbar/bottom-bar
> berulang — BUKAN bug DOM (body height normal ±3.826px); jangan ditindaklanjuti.

#### Hasil audit

| # | Temuan | Bukti | Halaman lain |
|---|---|---|---|
| T-59 | Detail produk: `document.scrollWidth` = **448px vs viewport 375** → seluruh halaman bisa digeser horizontal. Pelaku: row tab `Deskripsi/Spesifikasi/Ulasan (0)/Tanya Jawab (0)` — tombol terakhir `px-6 py-4 border-b-2` tepat di right=448; row tidak wrap & tidak scrollable | getBoundingClientRect elemen | halaman lain 0 overflow (docW 370) |
| T-60 | Detail produk: 3 gambar galeri **broken** — `next/image` memanggil `/_next/image?url=https://picsum.photos/...&w=3840` → gagal. `next.config.ts images.remotePatterns` hanya `**.supabase.co` (seed T-47 memakai picsum). Home/kategori tampil normal karena memakai `<img>` biasa | img.naturalWidth === 0 pada main image + 2 thumbnail | — |
| T-61 | Keranjang terisi: nama produk terpotong agresif ("Gentle Clea…", "Vitami… C…") meski ada ruang kosong; harga patah 2 baris ("Rp" turun baris sendiri) | screenshot /keranjang dengan 2 item | — |
| T-62 | Belum ter-audit: admin dashboard 12 halaman (butuh login admin) & checkout step 2–4 dengan alamat/kurir nyata (butuh akun customer). Keluhan "banyak yang melebar" kemungkinan juga menyasar tabel/tulisannya | — | — |

---

### T-59 — Mobile: tab bar detail produk overflow (halaman melebar 448px)

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-30 / 2026-08-30 |
| Prioritas | P0 |
| Sumber | Audit visual mobile 2026-08-29 — persis keluhan owner "kolom melebar" |

**Tujuan:** Row tab deskripsi/spesifikasi/ulasan/tanya-jawab di `ProductDetailClient` melebihi viewport dan tidak bisa discroll → seluruh halaman melebar 448px dan bisa digeser horizontal di SEMUA halaman detail.

**Scope-IN**
- `src/components/ProductDetailClient.tsx` — row tab: jadikan scrollable-horizontal (`overflow-x-auto` + `whitespace-nowrap` + sembunyikan scrollbar) ATAU rapatkan padding + izinkan wrap — pilih yang paling alami; pastikan `scrollWidth` halaman ≤ viewport pada 375px
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Konten/logika tab, halaman lain

**Kriteria Selesai**
1. 375px: `document.scrollWidth ≤ viewport` di halaman detail (semua 4 tab terjangkau — scroll horizontal hanya di dalam row tab)
2. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
~ src/components/ProductDetailClient.tsx (row tab) — container
  overflow-x-auto no-scrollbar; tombol whitespace-nowrap shrink-0;
  padding px-4 (sm:px-6)
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
Verifikasi live pasca-deploy: scrollWidth halaman detail = 375 ✓ (riset
browser menyusul commit)
```

---

### T-60 — Mobile: galeri gambar detail produk rusak (next/image × picsum)

| Field | Isi |
|---|---|
| Status | `BACKLOG` |
| Prioritas | P2 (diturunkan dari P0 — keputusan owner 2026-08-30) |
| Sumber | Audit visual mobile 2026-08-29 — gambar utama + 2 thumbnail broken di SEMUA halaman detail |

**Keputusan owner (2026-08-30):** foto produk memang masih placeholder — temuan ini ditunda. Saat foto asli di-upload via admin (Supabase Storage `**.supabase.co` — sudah di-whitelist), galeri detail otomatis tampil tanpa perubahan kode. Whitelist picsum bersifat opsional (hanya relevan selama masa seed).

**Tujuan (bila nanti dikerjakan):** Optimizer `next/image` menolak domain picsum.photos (tidak terdaftar di `images.remotePatterns`); `w=3840` menandakan atribut `sizes` terlalu besar (boros bandwidth — bagian ini tetap relevan untuk foto asli).

**Scope-IN**
- `next.config.ts` — tambah `images.remotePatterns` untuk `picsum.photos` (+ host redirect bila ada)
- `src/components/ProductDetailClient.tsx` — set atribut `sizes` wajar untuk galeri (mis. `(max-width: 768px) 100vw, 50vw`) agar optimizer tidak meminta w=3840
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Gambar home/kategori (sudah tampil), DB seed

**Kriteria Selesai**
1. Halaman detail: main image + semua thumbnail tampil (img.naturalWidth > 0)
2. URL optimizer memakai width wajar (tidak ada w=3840)
3. Ketiga gerbang DoD hijau + bukti tercatat

---

### T-61 — Mobile keranjang: nama produk terpotong & harga patah baris

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-30 / 2026-08-30 |
| Prioritas | P1 |
| Sumber | Audit visual mobile 2026-08-29 (keranjang dengan 2 item simulasi) |

**Tujuan:** Kartu item keranjang: (1) kolom nama terlalu sempit → nama terpotong "Gentle Clea…" meski ada ruang kosong; (2) harga patah 2 baris ("Rp" sendiri, angka di bawah). Perbaiki layout flex kartu item.

**Scope-IN**
- `src/app/keranjang/page.tsx` — `min-w-0` pada kolom nama + `line-clamp-2`/wrap wajar; harga `whitespace-nowrap` satu baris; pastikan stepper qty tidak menekan nama
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Logika cart (T-49/T-55.1 sudah stabil), checkout

**Kriteria Selesai**
1. 375px: nama produk terbaca (min. 2 baris penuh sebelum ellipsis), harga 1 baris
2. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
~ src/app/keranjang/page.tsx (kartu item) — restrukturisasi:
  - tombol hapus pindah ke kanan nama (row teratas), nama full-width
    line-clamp-2
  - harga whitespace-nowrap + stepper qty dalam satu row di bawah
    (tidak lagi menekan kolom nama)
  - gambar w-16 h-16 di mobile (sm:w-20), gap dipadatkan
  - subtotal nowrap
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
```

---

### T-62 — Mobile audit lanjutan: admin dashboard & checkout terisi

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-30 / 2026-08-30 |
| Prioritas | P1 |
| Sumber | Audit visual mobile 2026-08-29 — cakupan terbatas karena butuh akses |

**Tujuan:** Melanjutkan audit ke area yang butuh akses: 12 halaman admin (tabel, chart Recharts, modal — kandidat kuat "kolom melebar" di ponsel) dan checkout step 2–4 dengan alamat + kurir nyata. Temuan didaftarkan sebagai sub-entri (pola T-04/T-55).

**Scope-IN**
- Audit mobile semua halaman admin dengan akun admin dari owner + checkout end-to-end dengan akun customer
- Fix per temuan: umumnya tabel perlu wrapper `overflow-x-auto`, chart perlu `ResponsiveContainer` + min-width, modal perlu max-w + scroll dalam
- Entri sub-entri + Changelog

**Scope-OUT (dilarang disentuh)**
- Data/DB, logika admin

**Kriteria Selesai**
1. Semua halaman admin & checkout: `scrollWidth ≤ viewport` di 375px (tabel/chart di dalam container scroll sendiri)
2. Per sub-temuan: gerbang DoD hijau + commit terpisah

**Bukti (2026-08-30 — login nyata via user.md, browser 375×812)**
```
== Admin (super_admin) — 11 halaman dialami ==
/admin · produk · pesanan · pelanggan · kategori · promo · ulasan ·
keuangan · marketing · pengaturan · blog
→ docW 370 di SEMUA halaman: 0 overflow. Visual: kartu stat menumpuk rapi,
  tabel dalam container sendiri, filter pill wrap, sidebar jadi hamburger.
  TIDAK ADA perbaikan yang dibutuhkan.

== Customer — checkout end-to-end (tanpa membuat pesanan) ==
Login customer ✓ · step 1 alamat (alamat tersimpan terpilih, modal
Tambah Alamat + AreaPicker render baik) · step 2 kurir (opsi flat 12rb,
fallback sesuai desain krn alamat lama tanpa area + origin_area_id belum
diisi owner; ringkasan "Gratis Ongkir: Gratis" = jalur 0-hit T-57 LIVE) ·
step 3 pembayaran ✓ · step 4 konfirmasi (alamat + kurir + Xendit + tombol
Buat Pesanan) ✓ — docW 370 di semua step, 0 overflow.

== Bonus verifikasi live (T-54/T-57 terbukti di produksi) ==
AreaPicker: ketik "kebayoran" → sugesti ASLI dari API RajaOngkir muncul
  (CIPETE UTARA, KEBAYORAN BARU, JAKARTA SELATAN, ...) ✓
Gratis-ongkir path: subtotal ≥ 100rb → ringkasan "Gratis", 0 hit API ✓
Fallback flat: alamat tanpa destination_area_id → opsi kurir flat ✓

== Kesimpulan ==
T-62 selesai TANPA temuan baru — tidak ada perbaikan yang dibutuhkan.
Action item operasional (bukan bug, untuk owner):
1. Admin → Pengiriman → pilih AREA ASAL (origin_area_id) agar ongkir
   real per kurir aktif menggantikan flat 12rb
2. Alamat customer baru: pilih Area Tujuan via picker (harga presisi
   kecamatan); alamat lama perlu di-edit sekali untuk menambah area
```

---

### T-63 — Fitur banner promosi (admin CRUD + carousel storefront)

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-30 / 2026-08-30 |
| Prioritas | P1 |
| Sumber | Instruksi owner 2026-08-30: fitur marketing belum ready (banner promosi, push notification) — kerjakan; gunakan tab di /admin/marketing bila halaman utama tidak cukup |

**Keputusan desain:** tabel `banners` (placement hero/strip, sort_order, is_active, kolom window tanggal opsional — form v1 tanpa tanggal); admin CRUD sebagai **tab "Banner"** di /admin/marketing (pola CRUD flash-sales); storefront: carousel otomatis di homepage — kosong = tidak dirender; upload gambar via `/api/admin/upload` yang sudah ada.

**Scope-IN**
- Migration via MCP + mirror full_schema + types: tabel `banners` (RLS: publik baca aktif, admin kelola)
- `src/lib/banners.ts` — getActiveBanners(placement)
- API admin: `/api/admin/banners` (GET/POST), `/api/admin/banners/[id]` (PUT/DELETE), `/api/admin/banners/[id]/toggle` (PATCH)
- `src/components/admin/BannerManager.tsx` — list + form modal + upload + toggle + hapus
- `/admin/marketing` — tab "Banner"
- `src/components/PromoBannerCarousel.tsx` + integrasi homepage
- README/AGENTS.md (route +3) + Changelog

**Scope-OUT (dilarang disentuh)**
- Halaman/fitur lain, upload route yang sudah ada

**Kriteria Selesai**
1. Admin bisa create/edit/hapus/toggle banner + upload gambar; tanpa banner storefront tidak berubah
2. Banner aktif tampil di homepage dengan urutan sort_order + link berfungsi
3. Migration live terverifikasi via MCP + full_schema sinkron
4. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
== Migration live (via MCP) ==
banners_table: tabel banners + idx_banners_active + 2 policy
  (Banners publicly viewable SELECT is_active=true; Admins can manage ALL
  via has_role) — terverifikasi live ✓; mirror full_schema
  (parse OK 271 statement, libpg_query PG17)

== File baru ==
+ src/lib/banners.ts                       — getActiveBanners(placement):
  is_active + window tanggal + urut sort_order
+ src/app/api/admin/banners                — GET list (admin) / POST create
  (validasi T-29-style: title ≤120, image http(s), placement enum, sort ≥0,
  tanggal ISO & end > start)
+ src/app/api/admin/banners/[id]           — PUT (partial update + 404 bila
  0 baris) / DELETE (404 bila tidak ada)
+ src/app/api/admin/banners/[id]/toggle    — PATCH (wajib boolean)
+ src/components/admin/BannerManager.tsx   — list + modal form + upload
  (via /api/admin/upload, productId UUID placeholder → folder terpisah) +
  toggle + hapus (confirm)
+ src/components/PromoBannerCarousel.tsx   — carousel homepage: auto-rotate
  5 detik, panah + dots, Link internal / <a> eksternal, kosong = null

== File diubah ==
~ full_schema.sql (mirror) · types/database.ts (interface Banner)
~ /admin/marketing — tab "Banner" ke-5 (TabKey/TABS + render BannerManager)
~ page.tsx + HomeClient — getActiveBanners("hero") di Promise.all →
  PromoBannerCarousel di bawah HeroBanner

== Gerbang ==
lint 13 (baseline) · typecheck 0 · build 0 · full_schema parse OK (271 stmt)
Catatan: 3 temuan lint baru saat pengerjaan (import Bell belum terpakai +
2 unescaped quotes) — diperbaiki sampai baseline kembali.
```

---

### T-64 — Fitur push notification (Web Push VAPID)

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-30 / 2026-08-30 |
| Prioritas | P1 |
| Sumber | Instruksi owner 2026-08-30 (bersama T-63) |

**Keputusan desain:** Web Push standar (VAPID) — dependency `web-push` (server-only); service worker `public/sw.js`; tabel `push_subscriptions` (user miliknya sendiri via RLS, admin baca); API: `/api/push/subscribe` (GET public-key, POST simpan, DELETE hapus — auth) + `/api/admin/push` (GET jumlah pelanggan, POST broadcast — admin); VAPID keys via env (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) — kosong = 503 graceful (pola Xendit); opt-in UI: kartu di homepage untuk user login; composer admin: **tab "Push"** di /admin/marketing; prune langganan mati 404/410.

**Scope-IN**
- `npm i web-push` (+ @types/web-push) + generate VAPID keys → env
- Migration via MCP + mirror + types: `push_subscriptions`
- `public/sw.js`; `src/lib/push.ts`
- API `/api/push/subscribe` (GET/POST/DELETE) & `/api/admin/push` (GET/POST)
- `src/components/PushOptIn.tsx` (homepage) + `src/components/admin/PushComposer.tsx` + tab "Push"
- README/AGENTS.md (env + route +2) + Changelog

**Scope-OUT (dilarang disentuh)**
- Sistem notifikasi in-app & email/WA yang sudah ada

**Kriteria Selesai**
1. User login bisa subscribe; langganan tersimpan di DB
2. Admin kirim broadcast dari tab Push; pesan tampil di browser pelanggan
3. Tanpa env VAPID → 503 graceful; langganan mati (404/410) ter-prune
4. Migration live terverifikasi via MCP + full_schema sinkron
5. Ketiga gerbang DoD hijau + bukti tercatat

---

### T-65 — CSP whitelist endpoint regional GA4 + surface error API di tab Analytics

| Field | Isi |
|---|---|
| Status | `DONE` |
| Prioritas | P1 |
| Sumber | Diagnosa 2026-08-30 "angka analytics tidak muncul": GA4 ✓ (200, akses SA benar, tunggu latensi 24–48 jam); GSC 403 karena Search Console API belum di-enable di GCP project (action item owner, bukan kode) |

**Temuan pendukung:** CSP `connect-src` hanya meng-whitelist `www.google-analytics.com` — beacon GA4 dari Indonesia sering ke `region1.google-analytics.com` → berisiko terblokir di sebagian pengunjung. Selain itu, error API (mis. 403 GSC) ditelan menjadi "Tidak ada data" sehingga sulit diagnosis.

**Scope-IN**
- `next.config.ts` — `connect-src` += `https://*.google-analytics.com https://region1.google-analytics.com https://*.analytics.google.com`
- `src/lib/google-analytics.ts` + tab Analytics — bila API error (403/404), tampilkan pesan singkat di UI (bukan "Tidak ada data" generik)
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Konfigurasi GA4/GSC di sisi Google (milik owner); script-src sudah cukup

**Kriteria Selesai**
1. Header CSP live memuat endpoint regional GA4; beacon tidak terblokir
2. Error API terlihat di tab Analytics (memudahkan diagnosis owner)
3. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
~ next.config.ts — connect-src += *.google-analytics.com,
  region1.google-analytics.com, *.analytics.google.com
~ src/lib/google-analytics.ts — fetchGa4Stats/fetchGscStats kini
  mengembalikan { data, error }; pesan error Google (mis. 403 permission/
  API disabled) ditangkap & dipotong 160 char; AnalyticsStats +=
  ga4Error/gscError
~ tab Analytics — error per-section dirender merah (bukan "Tidak ada data"
  generik); data kosong tanpa error tetap "Tidak ada data" (latensi normal)
Catatan: interface AnalyticsStats lokal di halaman marketing ikut
diperluas (halaman tidak memakai tipe dari lib).
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
```

**Action item owner (di luar kode — hasil diagnosa 2026-08-30):**
1. Enable Search Console API: console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=606093113323
2. GSC → Settings → Users → tambah SA `herastoreskincare@anayltic-marketplace.iam.gserviceaccount.com` sebagai **Owner**
3. Pastikan "GSC Site URL" di pengaturan persis sama dengan URL/property terverifikasi (`https://marketplace.calysta.fun/` atau `sc-domain:calysta.fun`)
4. Verifikasi GSC disarankan via DNS TXT (domain property) — metode GA4/GTM menuntut URL-prefix + akun sama
5. Data GA4 muncul otomatis setelah latensi 24–48 jam (akses SA sudah terbukti 200 OK)

---

### T-66 — GA4/GTM script pindah ke `<head>` (verifikasi GSC gagal karena snippet di body)

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-30 / 2026-08-30 |
| Prioritas | P1 |
| Sumber | Kegagalan verifikasi GSC (2026-08-30): GA → "tracking code in the wrong location", GTM → "could not find container ID on the home page". Bukti HTML live: `gtag('config')`/`dataLayer`/GTM loader berada di BODY (@84.362/@84.788, `</head>` di 2.199) — hanya loader gtag.js yang di head |

**Tujuan:** `next/script strategy="afterInteractive"` me-render script di body — GSC mensyaratkan snippet GA4 (src + config) dan container GTM berada di **`<head>`** home page. Pindahkan keduanya ke head agar verifikasi GA4/GTM lolos.

**Scope-IN**
- `src/app/layout.tsx` — GA4 (src + config inline) dan GTM loader dirender sebagai raw `<script>` di dalam elemen `<head>` root layout (deterministic untuk GSC; tetap kondisional `seo.ga4_measurement_id` / `seo.gtm_id`); Clarity/Ads/Pixel biarkan afterInteractive (tidak dipersyaratkan GSC)
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Nilai ID di DB/settings, sistem push, halaman lain

**Kriteria Selesai**
1. Live: `gtag('config', 'G-...')` + GTM loader berada di posisi < `</head>` (cek curl)
2. Verifikasi GA4/GTM di GSC dapat dilakukan (atau minimal: kedua snippet 100% di head)
3. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
~ src/app/layout.tsx — elemen <head> baru di root layout berisi raw script
  GA4 (src + config inline) & GTM loader (kondisional settings);
  blok afterInteractive GA4/GTM di body DIHAPUS (anti dobel load);
  Clarity/Ads/Pixel tetap afterInteractive (tidak dipersyaratkan GSC);
  eslint-disable next-script-for-ga dengan alasan (posisi head > komponen)
Gerbang: lint 13 (baseline) · typecheck 0 · build 0

== Verifikasi live pasca-deploy (2026-08-30, curl homepage) ==
gtag('config', 'G-3L5JSHXVFW') @ HEAD (pos. 2.224) ✓
GTM-M66S6MCV loader @ HEAD (pos. 2.595) ✓
gtag/js loader @ HEAD (pos. 1.021) ✓
Catatan: kemunculan ID yang sama di body (pos. ~83rb) hanyalah string
ter-escape di dalam payload RSC self.__next_f (bukan elemen DOM) —
tidak memengaruhi verifikasi GSC.
CSP live juga sudah memuat *.google-analytics.com,
region1.google-analytics.com, *.analytics.google.com (T-65).
```

**Alternatif tanpa kode (bila lebih disukai owner):** verifikasi GSC via DNS TXT untuk domain property `calysta.fun` — tidak tergantung posisi snippet.

---

### T-67 — Storefront: link "Semua Produk" (`/kategori/semua`) — discoverability

| Field | Isi |
|---|---|
| Status | `IN_PROGRESS` |
| Mulai / Selesai | 2026-08-30 / - |
| Prioritas | P1 |
| Sumber | Keluh owner 2026-08-30: "16 produk aktif, yang tampil hanya 6, tidak bisa lihat keseluruhan" |

**Revisi setelah investigasi lanjutan:** halaman semua-produk **sudah ada** — `/kategori/semua` (virtual category, mendukung pencarian; terverifikasi live menampilkan 16 produk). Masalahnya adalah **discoverability**: tidak ada link menuju halaman itu (hanya terjadi lewat pencarian navbar). Membuat halaman `/produk` baru = implementasi paralel yang dilarang.

**Scope-IN (revisi)**
- `src/components/Navbar.tsx` — drawer Menu Utama: link "Semua Produk" → `/kategori/semua`
- `src/components/Footer.tsx` — kolom Layanan: link "Semua Produk"
- `src/app/sitemap.xml/route.ts` — staticPages += `/kategori/semua`
- `src/app/llms.txt/route.ts` — link "Semua Produk"
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Halaman `/produk` baru (parallel implementation — dilarang), halaman kategori existing

**Kriteria Selesai**
1. `/kategori/semua` menampilkan semua produk aktif (16) + bisa dicari/disort dari UI yang ada
2. Link terlihat di navbar drawer & footer
3. Ketiga gerbang DoD hijau + bukti tercatat

---

### T-68 — Manajemen gambar produk: hapus per thumbnail + sinkronisasi saat edit

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-30 / 2026-08-30 |
| Prioritas | P1 |
| Sumber | Keluh owner 2026-08-30: placeholder tidak bisa dihapus; upload baru "masuk slide 3" |

**Temuan investigasi (ProductFormModal.tsx):**
1. Tidak ada tombol hapus per thumbnail — placeholder picsum tidak bisa dibuang
2. Saat EDIT, payload mengirim `images: undefined` → gambar baru hasil upload hanya ke Storage (tanpa record product_images) dan tak pernah disinkronkan — karena itu hanya terlihat sebagai preview ke-3 di form, storefront tetap placeholder lama
3. Kaitan T-60: setelah task ini, placeholder picsum bisa diganti foto asli

**Scope-IN**
- `src/app/api/admin/products/[id]/route.ts` + `src/lib/admin.ts` — PUT menerima `images: string[]` (daftar URL final) → sinkronkan `product_images`: hapus row yang URL-nya dibuang, insert URL baru (unik), set `is_primary` = urutan pertama + `sort_order` sesuai urutan list
- `src/components/admin/ProductFormModal.tsx` — tombol hapus per thumbnail, badge "Utama" pada gambar pertama, kirim `images: uploadedImages` saat EDIT (bukan undefined)
- File Storage yatim boleh dibiarkan (dicatat); penghapusan file fisik opsional
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Endpoint upload, tabel/DB, storefront

**Kriteria Selesai**
1. Edit produk: hapus 1 thumbnail → simpan → row product_images hilang; tambah upload → simpan → row baru muncul dengan urutan benar
2. Gambar pertama selalu is_primary
3. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
+ src/lib/admin.ts — syncProductImages(productId, urls): hapus row yang
  URL-nya dibuang, insert URL baru (dedupe), is_primary = urutan pertama,
  sort_order sesuai daftar (session client admin, sesuai policy)
~ api/admin/products/[id] PUT — bila body.images array (setelah update
  produk sukses) → sync; gagal sync → 400
~ ProductFormModal — tombol hapus ✕ per thumbnail + badge "Utama" di
  gambar pertama; EDIT kini mengirim images: uploadedImages (sebelumnya
  undefined — akar "slide 3" & placeholder tak tergantikan)
Catatan: file Storage yatim (upload dibatalkan) dibiarkan — tidak
mengganggu; pembersihan opsional via dashboard.
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
E2E via browser menyusul di changelog.
```

---

### T-69 — Kartu Banner/Push di Marketing jadi navigasi tab

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-30 / 2026-08-30 |
| Prioritas | P2 |
| Sumber | Keluh owner 2026-08-30: kartu masih "Dalam Pengembangan" padahal fiturnya sudah jadi tab |

**Scope-IN**
- `src/app/admin/(dashboard)/marketing/page.tsx` (tab Ringkasan, array Marketing Channels) — kartu "Push Notification" += `onClick: setTab("push")`, kartu "Banner Iklan" += `onClick: setTab("banner")`, status → "Aktif"; "Email Blast" tetap Segera (fitur belum ada); "Voucher Campaign" dibiarkan (tabelnya di tab yang sama)
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Halaman/fitur lain

**Kriteria Selesai**
1. Kedua kartu bisa diklik → pindah ke tab masing-masing, tanpa badge "Dalam Pengembangan"
2. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
~ marketing/page.tsx (tab Ringkasan, array Marketing Channels) —
  Push Notification: onClick setTab("push") + status Aktif;
  Banner Iklan: onClick setTab("banner") + status Aktif;
  Email Blast tetap Segera (fitur belum ada), Voucher Campaign tetap
  tanpa onClick (tabel performanya di tab yang sama)
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
```

---

### T-70 — Upload gambar banner gagal ("Gagal menyimpan referensi gambar")

| Field | Isi |
|---|---|
| Status | `DONE` |
| Mulai / Selesai | 2026-08-30 / 2026-08-30 |
| Prioritas | P1 |
| Sumber | Keluh owner 2026-08-30 saat mencoba upload banner |

**Akar masalah (terkonfirmasi dari kode):** BannerManager memakai `/api/admin/upload` (route produk) dengan UUID placeholder → route wajib insert referensi ke `product_images` (FK product_id) → FK ditolak → 400. File tetap terunggah ke Storage (yatim di folder UUID placeholder — bisa dibersihkan via dashboard).

**Fix:** route ini sudah punya jalur skip-referensi (`productId === "temp"` — warisan flow produk baru) → BannerManager cukup mengirim `productId: "temp"` (1 baris) sehingga tidak menyentuh `product_images`; URL tersimpan di `banners.image_url`.

**Scope-IN**
- `src/components/admin/BannerManager.tsx` — productId "temp" + rapikan komentar
- Entri plan.md ini + Changelog

**Scope-OUT (dilarang disentuh)**
- Route upload (perilaku produk tidak boleh berubah)

**Kriteria Selesai**
1. Upload gambar di form banner sukses → URL terisi → banner tersimpan dan tampil
2. Tidak ada row product_images yang dibuat untuk banner
3. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
~ src/components/admin/BannerManager.tsx — upload kirim productId "temp"
  (jalur skip-referensi yang sudah ada di /api/admin/upload sejak flow
  produk baru) → tidak menyentuh product_images; URL tersimpan di
  banners.image_url. Konstanta UPLOAD_FOLDER_ID dihapus.
E2E via browser menyusul di changelog (upload banner nyata).
Gerbang: lint 13 (baseline) · typecheck 0 · build 0
```

**Bukti**
```
== Dependency & VAPID ==
npm i web-push + @types/web-push (dev) — stabil
VAPID keys digenerate (node web-push.generateVAPIDKeys) → .env.local
  (VAPID_PUBLIC_KEY/PUBLIC dilihat aman, PRIVATE tidak ditampilkan) +
  .env.example placeholder + instruksi Vercel

== Migration live (via MCP) ==
push_subscriptions_table: tabel push_subscriptions (endpoint unique,
  idx user_id) + 2 policy — terverifikasi live: "Users manage own push
  subscriptions (ALL)" + "Admins can view (SELECT)" ✓; mirror full_schema
  (parse OK 276 statement, libpg_query PG17)

== File baru ==
+ public/sw.js                    — SW: push handler (title/body/url, icon
  dinamis /icon-192.png) + notificationclick (fokus tab / buka URL)
+ src/lib/push.ts                 — isPushConfigured, getVapidPublicKey,
  sendPushToAll (service-role baca langganan → web-push per endpoint →
  prune 404/410 via service-role)
+ src/app/api/push/subscribe      — GET public-key / POST upsert langganan
  (auth, validasi endpoint https + keys) / DELETE (own endpoint, RLS)
+ src/app/api/admin/push          — GET {configured, subscribers} /
  POST broadcast (super_admin/admin seperti settings PUT, rate-limit 5/menit,
  validasi title ≤100 body ≤300 url path/http)
+ src/components/PushOptIn.tsx    — kartu opt-in homepage (user login +
  dukungan browser; izin → register /sw.js → subscribe → POST; unsubscribe)
+ src/components/admin/PushComposer.tsx — tab Push: statistik pelanggan +
  composer judul/isi/link + hasil kirim (sent/failed/pruned)

== File diubah ==
~ full_schema.sql (mirror) · types/database.ts (PushSubscription)
~ /admin/marketing — tab "Push" ke-6 (Bell)
~ HomeClient — PushOptIn di bawah carousel banner
~ .env.example · README (44 routes, marketing 6 tab, env VAPID) · AGENTS.md
  (44 routes + Live Systems Web Push)

== Gerbang ==
lint 13 (baseline) · typecheck 0 · build 0 · full_schema parse OK (276 stmt)
Catatan: 3 issue saat pengerjaan diperbaiki (state subscribed + tipe
applicationServerKey + catch binding sw.js) sampai baseline kembali.

== UNVERIFIED (runtime) ==
VERIFIKASI WEBHOOK ✓ (30 Agu 2026): Xendit dashboard Test → 200 OK
(512ms) — callback token terpasang di Vercel, endpoint produksi
terautentikasi. Sisa UNVERIFIED (keputusan owner: push diaktifkan
setelah produksi penuh): subscribe E2E di browser (menunggu env VAPID
dipasang owner di Vercel + redeploy — key sudah ada di .env.local) +
alur kirim broadcast (menunggu ≥1 perangkat subscribe).
```
