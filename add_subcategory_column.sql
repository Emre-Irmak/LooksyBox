-- Products tablosuna subcategory kolonu ekleme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Subcategory kolonu ekle
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- RLS'yi devre dışı bırak
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Kolonun başarıyla eklendiğini kontrol et
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'subcategory';




