-- Products tablosunun ID sequence'ini düzeltme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Önce mevcut en yüksek ID'yi göster
SELECT 'Mevcut en yüksek ID:' as info, COALESCE(MAX(id), 0) as max_id FROM products;

-- Sequence'in mevcut değerini göster (last_value kullanarak)
SELECT 
  'Sequence mevcut değeri:' as info, 
  last_value as current_seq
FROM products_id_seq;

-- Sequence'i mevcut en yüksek ID'den 1 fazlasına ayarla (false = nextval bu değeri kullanacak)
DO $$
DECLARE
  max_id INTEGER;
  new_seq_value BIGINT;
BEGIN
  -- Mevcut en yüksek ID'yi bul
  SELECT COALESCE(MAX(id), 0) INTO max_id FROM products;
  
  -- Sequence'i max_id + 1'e ayarla
  new_seq_value := max_id + 1;
  PERFORM setval('products_id_seq', new_seq_value, false);
  
  RAISE NOTICE 'Sequence products_id_seq değeri % olarak ayarlandı', new_seq_value;
END $$;

-- Sequence'in düzgün çalıştığını kontrol et
SELECT 
  'Kontrol - Sequence son değeri:' as info,
  last_value as current_value
FROM products_id_seq;

-- Bir sonraki ID'yi test et (gerçekten kullanmayacak, sadece test)
SELECT 
  'Test - Bir sonraki ID:' as info,
  nextval('products_id_seq') as next_value;

-- Test için kullandığımız değeri geri al
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 0) FROM products) + 1, false);

