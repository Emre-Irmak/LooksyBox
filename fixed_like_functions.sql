-- Düzeltilmiş beğeni sistemi SQL fonksiyonları
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Beğeni ekleme fonksiyonu (düzeltilmiş)
CREATE OR REPLACE FUNCTION add_product_like(
    p_user_id UUID,
    p_product_id INTEGER
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    new_like_count INTEGER;
BEGIN
    -- Beğeni ekle (eğer zaten beğenilmemişse)
    INSERT INTO product_likes (user_id, product_id)
    VALUES (p_user_id, p_product_id)
    ON CONFLICT (user_id, product_id) DO NOTHING;
    
    -- Güncel beğeni sayısını al
    SELECT COUNT(*) INTO new_like_count
    FROM product_likes 
    WHERE product_id = p_product_id;
    
    -- Products tablosundaki like_count'u güncelle
    UPDATE products 
    SET like_count = new_like_count
    WHERE id = p_product_id;
    
    -- Sonucu döndür
    result := json_build_object(
        'success', true,
        'message', 'Ürün beğenildi',
        'like_count', new_like_count
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', 'Beğeni eklenirken hata oluştu: ' || SQLERRM
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Beğeni çıkarma fonksiyonu (düzeltilmiş)
CREATE OR REPLACE FUNCTION remove_product_like(
    p_user_id UUID,
    p_product_id INTEGER
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    new_like_count INTEGER;
BEGIN
    -- Beğeniyi çıkar
    DELETE FROM product_likes 
    WHERE user_id = p_user_id AND product_id = p_product_id;
    
    -- Güncel beğeni sayısını al
    SELECT COUNT(*) INTO new_like_count
    FROM product_likes 
    WHERE product_id = p_product_id;
    
    -- Products tablosundaki like_count'u güncelle
    UPDATE products 
    SET like_count = new_like_count
    WHERE id = p_product_id;
    
    -- Sonucu döndür
    result := json_build_object(
        'success', true,
        'message', 'Beğeni kaldırıldı',
        'like_count', new_like_count
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', 'Beğeni kaldırılırken hata oluştu: ' || SQLERRM
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Kullanıcının ürünü beğenip beğenmediğini kontrol etme fonksiyonu
CREATE OR REPLACE FUNCTION check_user_like(
    p_user_id UUID,
    p_product_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    like_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM product_likes 
        WHERE user_id = p_user_id AND product_id = p_product_id
    ) INTO like_exists;
    
    RETURN like_exists;
END;
$$ LANGUAGE plpgsql;

-- 4. Ürün beğeni durumunu toggle etme fonksiyonu (düzeltilmiş)
CREATE OR REPLACE FUNCTION toggle_product_like(
    p_user_id UUID,
    p_product_id INTEGER
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    like_exists BOOLEAN;
    new_like_count INTEGER;
BEGIN
    -- Kullanıcının bu ürünü beğenip beğenmediğini kontrol et
    SELECT EXISTS(
        SELECT 1 FROM product_likes 
        WHERE user_id = p_user_id AND product_id = p_product_id
    ) INTO like_exists;
    
    IF like_exists THEN
        -- Beğeniyi kaldır
        DELETE FROM product_likes 
        WHERE user_id = p_user_id AND product_id = p_product_id;
    ELSE
        -- Beğeni ekle
        INSERT INTO product_likes (user_id, product_id)
        VALUES (p_user_id, p_product_id);
    END IF;
    
    -- Güncel beğeni sayısını al
    SELECT COUNT(*) INTO new_like_count
    FROM product_likes 
    WHERE product_id = p_product_id;
    
    -- Products tablosundaki like_count'u güncelle
    UPDATE products 
    SET like_count = new_like_count
    WHERE id = p_product_id;
    
    -- Sonucu döndür
    result := json_build_object(
        'success', true,
        'liked', NOT like_exists,
        'like_count', new_like_count,
        'message', CASE 
            WHEN like_exists THEN 'Beğeni kaldırıldı'
            ELSE 'Ürün beğenildi'
        END
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', 'Beğeni işlemi sırasında hata oluştu: ' || SQLERRM
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql;
