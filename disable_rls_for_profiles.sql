-- Profiles tablosu için RLS'yi devre dışı bırakma
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut RLS durumunu kontrol et
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    'Mevcut RLS durumu' as status
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Profiles tablosu için RLS'yi devre dışı bırak
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. RLS'nin devre dışı olduğunu doğrula
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    'RLS devre dışı' as status
FROM pg_tables 
WHERE tablename = 'profiles';

-- 4. Test sorgusu - telefon güncelleme çalışıyor mu?
SELECT 
    'RLS devre dışı, telefon güncelleme test edilebilir' as status,
    id, 
    email, 
    phone 
FROM profiles 
WHERE id = auth.uid();

-- 5. Tüm kullanıcıların profillerini göster (RLS devre dışı olduğu için)
SELECT 
    'Tüm profiller görüntülenebilir' as status,
    COUNT(*) as total_profiles
FROM profiles;
