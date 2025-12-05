-- Acil RLS devre dışı bırakma
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- RLS'yi devre dışı bırak
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Kontrol et
SELECT 
    'RLS devre dışı' as status,
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';
