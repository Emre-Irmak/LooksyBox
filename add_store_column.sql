-- Products tablosuna store kolonu ekleme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Store kolonu ekle
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS store TEXT;

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
AND column_name = 'store';



