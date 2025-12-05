-- user_favorites tablosunu user_saved_items olarak yeniden adlandırma
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Önce tablo ismini değiştir
ALTER TABLE user_favorites RENAME TO user_saved_items;

-- 2. Yeni tablo ismini kontrol et
SELECT 
    schemaname, 
    tablename, 
    'Tablo başarıyla yeniden adlandırıldı' as status
FROM pg_tables 
WHERE tablename = 'user_saved_items';

-- 3. Tablo yapısını kontrol et
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_saved_items'
ORDER BY ordinal_position;

-- 4. Mevcut verileri kontrol et
SELECT 
    'Toplam kayıt sayısı' as info,
    COUNT(*) as count
FROM user_saved_items;

-- 5. RLS durumunu kontrol et (eğer aktifse)
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    'RLS durumu' as status
FROM pg_tables 
WHERE tablename = 'user_saved_items';

-- 6. RLS'yi devre dışı bırak (eğer aktifse)
ALTER TABLE user_saved_items DISABLE ROW LEVEL SECURITY;

-- 7. Son kontrol
SELECT 
    'user_favorites tablosu artık user_saved_items olarak adlandırıldı' as message,
    'Tablo başarıyla yeniden adlandırıldı' as status;
