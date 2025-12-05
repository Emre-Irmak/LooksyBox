    -- Ürün paylaşma için gerekli yeni kolonları ekleme
    -- Bu dosyayı Supabase SQL Editor'da çalıştırın

    -- 1. Hashtags kolonu ekle
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS hashtags TEXT;

    -- 2. Product link kolonu ekle (orijinal ürün linki, affiliate_url'den ayrı)
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS product_link TEXT;

    -- 3. Specs kolonu ekle (ürün özellikleri - key-value formatında)
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS specs JSONB;

    -- 4. Cover image index kolonu ekle (hangi fotoğrafın kapak olduğu)
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS cover_image_index INTEGER DEFAULT 0;

    -- 5. Images kolonunu TEXT[]'den JSONB[]'e dönüştür
    -- Önce images kolonunun var olup olmadığını kontrol et ve yoksa oluştur
    DO $$
    BEGIN
    -- Eğer images kolonu yoksa, önce TEXT[] olarak oluştur
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'images'
    ) THEN
        ALTER TABLE products ADD COLUMN images TEXT[];
    END IF;
    END $$;

    -- Mevcut images verilerini korumak için geçici bir kolon oluştur
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS images_backup TEXT[];

    -- Mevcut images verilerini backup'a kopyala (eğer varsa)
    UPDATE products 
    SET images_backup = images 
    WHERE images IS NOT NULL;

    -- Yeni JSONB[] kolonu ekle
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS images_new JSONB[];

    -- Mevcut TEXT[] verilerini JSONB[] formatına dönüştür
    -- Her URL'i {url: "..."} formatına çevir
    UPDATE products 
    SET images_new = (
    SELECT COALESCE(
        array_agg(
        jsonb_build_object('url', url)
        ),
        ARRAY[]::jsonb[]
    )
    FROM unnest(COALESCE(images_backup, ARRAY[]::text[])) AS url
    )
    WHERE images_backup IS NOT NULL;

    -- Eski images kolonunu sil
    ALTER TABLE products 
    DROP COLUMN IF EXISTS images;

    -- Yeni images kolonunu images olarak yeniden adlandır
    ALTER TABLE products 
    RENAME COLUMN images_new TO images;

    -- Backup kolonunu sil
    ALTER TABLE products 
    DROP COLUMN IF EXISTS images_backup;

    -- RLS'yi devre dışı bırak (yeni kolonlar için de)
    ALTER TABLE products DISABLE ROW LEVEL SECURITY;

    -- Kolonların başarıyla eklendiğini kontrol et
    SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name IN ('hashtags', 'product_link', 'specs', 'images', 'cover_image_index')
    ORDER BY column_name;




