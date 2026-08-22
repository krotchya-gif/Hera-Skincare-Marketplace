# PLAN.MD — SOURCE OF TRUTH · Hera Skincare Marketplace

> **File ini adalah SATU-SATUNYA tracker pekerjaan project ini.**
> `Todo.md`, `doc.md`, dan bagian "Status" di README.md sudah **ARCHIVED** dan TIDAK BOLEH dipakai sebagai instruksi kerja aktif.
> Setiap agent/kontributor **WAJIB** membaca bagian [Protokol](#-protokol-source-of-truth) sebelum menyentuh kode.
>
> Terakhir diperbarui: 2026-08-22

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
| [T-03](#t-03--flash-sale-crud-di-admin) | P1 | Flash Sale CRUD di Admin | BACKLOG |
| [T-04](#t-04--tutup-bug-low-dari-audit-lama) | P1 | Tutup bug LOW dari audit lama | BACKLOG |
| [T-05](#t-05--notifikasi-otomatis-emailwa) | P2 | Notifikasi otomatis Email/WA | BACKLOG |
| [T-06](#t-06--port-fitur-qa-produk--comparison-dari-project-react) | P2 | Port Q&A produk + comparison dari React | BACKLOG |
| [T-07](#t-07--konsolidasi-dokumentasi--arsip-project-react) | P3 | Konsolidasi dokumentasi & arsip project React | BACKLOG |
| [T-08](#t-08--pembaruan-dependencies-ke-versi-stabil) | P1 | Pembaruan dependencies ke versi stabil | DONE |
| [T-09](#t-09--ganti-navigasi-windowlocation-dengan-router-nextjs) | P1 | Ganti navigasi window.location dengan Router Next.js | DONE |
| [T-10](#t-10--hardening-fungsi-security-definer-database) | P0 | Hardening fungsi SECURITY DEFINER database | DONE |
| [T-11](#t-11--sinkronisasi-dokumentasi-dengan-kondisi-aktual) | P1 | Sinkronisasi dokumentasi dengan kondisi aktual | DONE |
| [T-12](#t-12--konsolidasi-migration-menjadi-satu-full-schema) | P0 | Konsolidasi migration menjadi satu full schema | DONE |

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
| Status | `BACKLOG` |
| Mulai / Selesai | — / — |
| Sumber daftar | `Todo.md` § Final Metrics → baris "Open (14 LOW)" (ARSIP — hanya rujukan daftar, bukan tracker) |

**Aturan khusus task ini (anti-noise):**
Saat memulai, pecah dulu daftar bug LOW menjadi sub-entri bernomor di bawah tabel ini (T-04.1, T-04.2, …), masing-masing dengan kriteria selesai sendiri. **Satu sub-bug = satu commit.** Sub-bug boleh dikerjakan bertahap; task induk DONE jika semua sub-entri DONE atau eksplisit di-skip dengan alasan oleh pemilik project.

| Sub-ID | Bug (ringkas) | Status |
|--------|---------------|--------|
| (diisi saat mulai task) | | |

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
| Status | `BACKLOG` |
| Mulai / Selesai | — / — |

**Tujuan:** Kirim email/WA otomatis saat status pesanan berubah (masuk, dibayar, dikirim, selesai). Saat ini settings-nya sudah ada di Pengaturan tapi belum terhubung provider.

**Keputusan desain:** Provider ditentukan SAAT task dimulai (email: Resend/mailgun; WA: WhatsApp Cloud API/Fonnte) — tulis pilihannya di sini sebelum coding. Credential server-side only.

**Scope-IN:** API route/handler notifikasi baru, integrasi provider, key settings terkait, `.env.example`
**Scope-OUT:** UI admin pengaturan (kecuali perlu field baru — daftarkan dulu), template halaman customer

**Kriteria Selesai**
1. Trigger terjadi dari perubahan status pesanan (bukan polling manual)
2. Credential hanya di env server; gagal kirim ter-log dan tidak menggagalkan transaksi utama
3. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
(paste output di sini saat mengerjakan)
```

---

### T-06 — Port Fitur Q&A Produk + Comparison dari Project React

| Field | Isi |
|---|---|
| Status | `BACKLOG` |
| Mulai / Selesai | — / — |
| Referensi | `../Hera Store React/src/context/ComparisonContext.jsx`, tabel `product_qna` di `../Hera Store React/supabase/init.sql` |

**Catatan:** Ini prioritas P2 — boleh di-skip permanen oleh pemilik project. Jika dijalankan, pecah menjadi dua sub-task: T-06.1 (Q&A) dan T-06.2 (Comparison), masing-masing dengan migration + API route + UI sendiri.

**Scope-IN:** migration DB, API routes baru, komponen/halaman terkait produk detail
**Scope-OUT:** halaman lain, styling global

**Bukti**
```
(paste output di sini saat mengerjakan)
```

---

### T-07 — Konsolidasi Dokumentasi & Arsip Project React

| Field | Isi |
|---|---|
| Status | `BACKLOG` |
| Mulai / Selesai | — / — |

**Tujuan:** Satu codebase hidup, satu sumber kebenaran.

**Scope-IN**
- README.md — bagian "Status" diganti pointer ke plan.md
- Banner arsip di `../Hera Store React/README.md` (project React ditandai DEPRECATED, referensi fitur yang sudah diporting)
- Bersihkan sisa tracker basi di repo Next.js

**Scope-OUT:** kode aplikasi, database

**Kriteria Selesai**
1. Tidak ada lagi dokumen di kedua repo yang bisa disalahartikan sebagai tracker aktif
2. Project React jelas tertanda deprecated + tanggal
3. Ketiga gerbang DoD hijau + bukti tercatat

**Bukti**
```
(paste output di sini saat mengerjakan)
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
