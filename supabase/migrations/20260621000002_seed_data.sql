-- =============================================
-- HERA STORE MARKETPLACE — Seed Data
-- Consolidated seed: categories, products, variants, vouchers, flash sales, settings
-- =============================================

-- =============================================
-- 1. MAIN CATEGORIES (6 parent categories)
-- =============================================
insert into public.categories (name, slug, icon, sort_order) values
  ('Perawatan Tubuh', 'perawatan-tubuh', '🧴', 1),
  ('Perawatan Rumah', 'perawatan-rumah', '🧹', 2),
  ('Kesehatan', 'kesehatan', '💊', 3),
  ('Kecantikan', 'kecantikan', '💄', 4),
  ('Elektronik', 'elektronik', '🔌', 5),
  ('Lainnya', 'lainnya', '📦', 6)
on conflict (slug) do nothing;

-- =============================================
-- 2. SUBCATEGORIES (6 per parent = 36 subcategories)
-- =============================================
-- Perawatan Tubuh subcategories
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, parent.id, sub.sort_order
FROM public.categories parent
CROSS JOIN (VALUES
  ('Sabun Mandi', 'sabun-mandi', '🧼', 1), ('Shampoo', 'shampoo', '🧴', 2),
  ('Kondisioner', 'kondisioner', '💆', 3), ('Losion', 'losion', '🧴', 4),
  ('Parfum', 'parfum', '✨', 5), ('Deodoran', 'deodoran', '💨', 6)
) AS sub(name, slug, icon, sort_order)
WHERE parent.slug = 'perawatan-tubuh'
ON CONFLICT (slug) DO NOTHING;

-- Perawatan Rumah subcategories
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, parent.id, sub.sort_order
FROM public.categories parent
CROSS JOIN (VALUES
  ('Pembersih Lantai', 'pembersih-lantai', '🧹', 1), ('Pembersih Dapur', 'pembersih-dapur', '🍽️', 2),
  ('Pembersih Kaca', 'pembersih-kaca', '🪟', 3), ('Pewangi', 'pewangi', '🌸', 4),
  ('Deterjen', 'deterjen', '👕', 5), ('Pel & Sapu', 'pel-sapu', '🧹', 6)
) AS sub(name, slug, icon, sort_order)
WHERE parent.slug = 'perawatan-rumah'
ON CONFLICT (slug) DO NOTHING;

-- Kesehatan subcategories
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, parent.id, sub.sort_order
FROM public.categories parent
CROSS JOIN (VALUES
  ('Vitamin', 'vitamin', '💊', 1), ('Suplemen', 'suplemen', '🌿', 2),
  ('P3K', 'p3k', '🩹', 3), ('Masker', 'masker', '😷', 4),
  ('Hand Sanitizer', 'hand-sanitizer', '🧼', 5), ('Termometer', 'termometer', '🌡️', 6)
) AS sub(name, slug, icon, sort_order)
WHERE parent.slug = 'kesehatan'
ON CONFLICT (slug) DO NOTHING;

-- Kecantikan subcategories
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, parent.id, sub.sort_order
FROM public.categories parent
CROSS JOIN (VALUES
  ('Skincare', 'skincare', '🧴', 1), ('Sunscreen', 'sunscreen', '☀️', 2),
  ('Serum', 'serum', '🧪', 3), ('Pelembap', 'pelembap', '🧴', 4),
  ('Masker Wajah', 'masker-wajah', '🎭', 5), ('Pembersih Wajah', 'pembersih-wajah', '🧼', 6)
) AS sub(name, slug, icon, sort_order)
WHERE parent.slug = 'kecantikan'
ON CONFLICT (slug) DO NOTHING;

-- Elektronik subcategories
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, parent.id, sub.sort_order
FROM public.categories parent
CROSS JOIN (VALUES
  ('Charger', 'charger', '🔌', 1), ('Kabel', 'kabel', '🔌', 2),
  ('Power Bank', 'power-bank', '🔋', 3), ('Speaker', 'speaker', '🔊', 4),
  ('Lampu', 'lampu', '💡', 5), ('Baterai', 'baterai', '🔋', 6)
) AS sub(name, slug, icon, sort_order)
WHERE parent.slug = 'elektronik'
ON CONFLICT (slug) DO NOTHING;

-- Lainnya subcategories
INSERT INTO public.categories (name, slug, icon, parent_id, sort_order)
SELECT sub.name, sub.slug, sub.icon, parent.id, sub.sort_order
FROM public.categories parent
CROSS JOIN (VALUES
  ('Alat Tulis', 'alat-tulis', '✏️', 1), ('Perlengkapan Bayi', 'perlengkapan-bayi', '🍼', 2),
  ('Hewan Peliharaan', 'hewan-peliharaan', '🐱', 3), ('Olahraga', 'olahraga', '⚽', 4)
) AS sub(name, slug, icon, sort_order)
WHERE parent.slug = 'lainnya'
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 3. PRODUCTS (12 seed products with correct prices)
-- =============================================
WITH cat AS (SELECT id, slug FROM public.categories)
INSERT INTO public.products (name, slug, sku, description, category_id, brand, price, discount_price, stock, unit, weight_gram, is_active)
SELECT p.name, p.slug, p.sku, p.description, cat.id, p.brand, p.price, p.discount_price, p.stock, p.unit, p.weight_gram, true
FROM cat, (VALUES
  ('Sabun Cair Hera Store Premium', 'sabun-cair-hera-store', 'SAB-001',
   'Sabun cair premium dengan formula lembut yang menjaga kelembapan kulit. Mengandung aloe vera dan vitamin E untuk kulit sehat dan lembut sepanjang hari.',
   'perawatan-tubuh', 'Hera Store', 31000, 25000, 150, 'botol', 520),

  ('Pembersih Lantai Super Harum', 'pembersih-lantai-harum', 'PLH-001',
   'Pembersih lantai dengan formula anti bakteri yang ampuh membersihkan noda membandel. Mengharumkan ruangan dengan aroma segar tahan lama.',
   'perawatan-rumah', 'Hera Store', 35000, 28000, 200, 'botol', 1050),

  ('Hand Sanitizer Antibacterial 500ml', 'hand-sanitizer-500ml', 'HAN-001',
   'Hand sanitizer dengan kandungan alkohol 70% yang efektif membunuh 99.9% kuman dan bakteri.',
   'kesehatan', 'Hera Store', 25000, 18000, 300, 'botol', 520),

  ('Sabun Cuci Piring Anti Lemak 800ml', 'sabun-cuci-piring', 'SCP-001',
   'Sabun cuci piring dengan formula super konsentrat yang ampuh membersihkan lemak dan sisa makanan.',
   'perawatan-rumah', 'Hera Store', 20000, 16000, 180, 'botol', 820),

  ('Pewangi Ruangan Premium Aroma Spa', 'pewangi-ruangan-premium', 'PWR-001',
   'Pewangi ruangan premium dengan aroma spa yang menenangkan. Tahan lama hingga 30 hari dengan teknologi slow release.',
   'perawatan-rumah', 'Hera Store', 28000, 22000, 120, 'botol', 200),

  ('Kondisioner Rambut Silk Smooth 350ml', 'kondisioner-rambut', 'KRB-001',
   'Kondisioner rambut dengan protein sutra yang membuat rambut lembut, berkilau, dan mudah diatur.',
   'perawatan-tubuh', 'Hera Store', 35000, NULL, 95, 'botol', 380),

  ('Pembersih Kaca & Cermin Anti Streak', 'pembersih-kaca', 'PKC-001',
   'Pembersih kaca formula anti bekas (streak-free) yang membuat kaca dan cermin kinclong tanpa meninggalkan bekas sapuan.',
   'perawatan-rumah', 'Hera Store', 19000, NULL, 210, 'botol', 520),

  ('Losion Tubuh Aloe Vera & Vitamin E', 'losion-tubuh-aloe', 'LTA-001',
   'Losion tubuh dengan kandungan aloe vera segar dan vitamin E yang melembapkan dan melembutkan kulit.',
   'perawatan-tubuh', 'Hera Store', 32000, NULL, 130, 'botol', 270),

  ('Vitamin C 500mg Effervescent 20 Tablet', 'vitamin-c-500mg', 'VIT-001',
   'Suplemen Vitamin C 500mg dalam bentuk effervescent yang mudah dikonsumsi. Mendukung daya tahan tubuh dan kesehatan kulit.',
   'kesehatan', 'Hera Store', 45000, NULL, 450, 'box', 100),

  ('Deterjen Pakaian Bubuk 1kg Anti Kusam', 'deterjen-pakaian', 'DET-001',
   'Deterjen pakaian bubuk dengan formula enzim aktif yang ampuh mengangkat noda membandel tanpa merusak serat kain.',
   'perawatan-rumah', 'Hera Store', 38000, NULL, 280, 'pak', 1050),

  ('Sunscreen SPF 50+ PA++++ Daily Protection', 'sunscreen-spf50', 'SUN-001',
   'Sunscreen ringan SPF 50+ PA++++ dengan formula water-resistant yang melindungi dari sinar UVA dan UVB.',
   'kecantikan', 'Hera Store', 55000, NULL, 85, 'tube', 80),

  ('Minyak Kayu Putih Murni 60ml', 'minyak-kayu-putih', 'MKP-001',
   'Minyak kayu putih murni 100% alami tanpa campuran bahan kimia. Membantu meredakan masuk angin, mual, dan pegal-pegal.',
   'kesehatan', 'Hera Store', 28000, NULL, 320, 'botol', 80)
) AS p(name, slug, sku, description, category_slug, brand, price, discount_price, stock, unit, weight_gram)
WHERE cat.slug = p.category_slug
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 4. ASSIGN SUBCATEGORIES TO PRODUCTS
-- =============================================
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'sabun-mandi') WHERE slug = 'sabun-cair-hera-store';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'pembersih-lantai') WHERE slug = 'pembersih-lantai-harum';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'hand-sanitizer') WHERE slug = 'hand-sanitizer-500ml';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'pembersih-dapur') WHERE slug = 'sabun-cuci-piring';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'pewangi') WHERE slug = 'pewangi-ruangan-premium';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'kondisioner') WHERE slug = 'kondisioner-rambut';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'pembersih-kaca') WHERE slug = 'pembersih-kaca';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'losion') WHERE slug = 'losion-tubuh-aloe';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'vitamin') WHERE slug = 'vitamin-c-500mg';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'deterjen') WHERE slug = 'deterjen-pakaian';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'sunscreen') WHERE slug = 'sunscreen-spf50';
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'suplemen') WHERE slug = 'minyak-kayu-putih';

-- =============================================
-- 5. PRODUCT VARIANTS (12 variants across 4 products)
-- =============================================
INSERT INTO public.product_variants (product_id, name, price, stock, sku)
SELECT p.id, v.name, v.price, v.stock, v.sku
FROM public.products p, (VALUES
  ('sabun-cair-hera-store', 'Fresh', 25000, 50, 'SAB-001-F'),
  ('sabun-cair-hera-store', 'Lemon', 25000, 60, 'SAB-001-L'),
  ('sabun-cair-hera-store', 'Rose', 25000, 40, 'SAB-001-R'),
  ('pembersih-lantai-harum', 'Lavender', 28000, 80, 'PLH-001-LA'),
  ('pembersih-lantai-harum', 'Citrus', 28000, 70, 'PLH-001-C'),
  ('pembersih-lantai-harum', 'Pine', 28000, 50, 'PLH-001-P'),
  ('pewangi-ruangan-premium', 'Lavender', 22000, 40, 'PWR-001-LA'),
  ('pewangi-ruangan-premium', 'Jasmine', 22000, 50, 'PWR-001-J'),
  ('pewangi-ruangan-premium', 'Ocean', 22000, 30, 'PWR-001-O'),
  ('vitamin-c-500mg', 'Jeruk', 45000, 150, 'VIT-001-J'),
  ('vitamin-c-500mg', 'Lemon', 45000, 150, 'VIT-001-L'),
  ('vitamin-c-500mg', 'Stroberi', 45000, 150, 'VIT-001-S')
) AS v(product_slug, name, price, stock, sku)
WHERE p.slug = v.product_slug
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. VOUCHERS (5 active promo codes)
-- =============================================
INSERT INTO public.vouchers (code, type, value, min_purchase, quota, per_user_limit, ends_at, is_active)
VALUES
  ('HERA15', 'percent', 15, 50000, 500, 1, NOW() + INTERVAL '30 days', true),
  ('HERA10', 'percent', 10, 30000, 1000, 2, NOW() + INTERVAL '60 days', true),
  ('GRATIS5K', 'nominal', 5000, 25000, 200, 1, NOW() + INTERVAL '14 days', true),
  ('NEWUSER20', 'percent', 20, 100000, 100, 1, NOW() + INTERVAL '90 days', true),
  ('BELANJA50K', 'nominal', 10000, 50000, NULL, 3, NOW() + INTERVAL '30 days', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 7. FLASH SALE (active, 3-hour window)
-- =============================================
INSERT INTO public.flash_sales (name, starts_at, ends_at, is_active)
VALUES ('Flash Sale Hari Ini', NOW(), NOW() + INTERVAL '3 hours', true)
ON CONFLICT DO NOTHING;

-- Link discounted products to flash sale
INSERT INTO public.flash_sale_products (flash_sale_id, product_id, flash_price, flash_stock)
SELECT fs.id, p.id, p.discount_price, 50
FROM public.flash_sales fs, public.products p
WHERE fs.name = 'Flash Sale Hari Ini'
  AND p.discount_price IS NOT NULL
ON CONFLICT DO NOTHING;

-- =============================================
-- 8. STORE SETTINGS (default configuration)
-- =============================================
INSERT INTO public.store_settings (key, value) VALUES
  ('store_info', '{"name": "Hera Store", "email": "info@herastore.com", "phone": "+6281234567890", "city": "Jakarta Selatan", "description": "Marketplace produk rumah tangga premium.", "address": "Alamat Gudang Hera Store", "operational_hours": {"start": "08:00", "end": "21:00", "days": ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]}, "social_media": {"instagram": "", "tiktok": "", "facebook": ""}}'::jsonb),
  ('shipping', '{"free_shipping": true, "free_shipping_min": 100000, "couriers": ["JNE", "J&T Express", "SiCepat", "Gosend", "Anteraja"], "origin_city": "Jakarta Selatan"}'::jsonb),
  ('payment', '{"methods": ["Transfer Bank (BCA, Mandiri, BRI)", "GoPay", "OVO", "Dana", "ShopeePay", "Virtual Account", "COD (Bayar di Tempat)"], "payment_timeout_hours": 24, "bank_account": {"bank": "BCA", "owner": "PT Hera Store", "number": "1234567890"}}'::jsonb),
  ('notifications', '{"email": {"Pesanan baru masuk": true, "Pembayaran diterima": true, "Stok produk menipis (< 10 item)": true, "Ulasan baru masuk": true}, "wa": {"Pesanan baru masuk": true, "Pembayaran diterima": true, "Stok produk menipis (< 10 item)": false, "Ulasan baru masuk": false}}'::jsonb)
ON CONFLICT (key) DO NOTHING;
