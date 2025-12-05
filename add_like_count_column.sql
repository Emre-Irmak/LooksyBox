-- Products tablosuna like_count kolonu ekleme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Products tablosuna like_count kolonu ekle
ALTER TABLE products ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- 2. Mevcut ürünlerin beğeni sayılarını güncelle (product_likes tablosundan)
UPDATE products 
SET like_count = (
    SELECT COUNT(*) 
    FROM product_likes 
    WHERE product_likes.product_id = products.id
);

-- 3. Kolonun başarıyla eklendiğini kontrol et
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'like_count';

-- 4. Güncellenmiş beğeni sayılarını kontrol et
SELECT 
    id,
    title,
    like_count
FROM products 
ORDER BY like_count DESC 
LIMIT 10;
