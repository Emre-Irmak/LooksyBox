-- Veritabanı şemasını mock verilerle uyumlu hale getirme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Mevcut products tablosunu güncelle
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS original_price_text TEXT,
ADD COLUMN IF NOT EXISTS discount TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS season TEXT,
ADD COLUMN IF NOT EXISTS features TEXT[],
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS store TEXT;

-- Price alanını TEXT olarak değiştir (mevcut verileri korumak için)
-- Önce yeni bir sütun ekle
ALTER TABLE products ADD COLUMN price_text TEXT;

-- Mevcut price değerlerini price_text'e kopyala
UPDATE products SET price_text = price::TEXT WHERE price IS NOT NULL;

-- Eski price sütununu sil ve yenisini price olarak yeniden adlandır
ALTER TABLE products DROP COLUMN IF EXISTS price;
ALTER TABLE products RENAME COLUMN price_text TO price;

-- Aynı işlemi original_price için yap
ALTER TABLE products ADD COLUMN original_price_text TEXT;
UPDATE products SET original_price_text = original_price::TEXT WHERE original_price IS NOT NULL;
ALTER TABLE products DROP COLUMN IF EXISTS original_price;
ALTER TABLE products RENAME COLUMN original_price_text TO original_price;

-- RLS'yi devre dışı bırak (eğer aktifse)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
