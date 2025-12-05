-- Tüm RLS'yi zorla devre dışı bırakma
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Tüm tablolar için RLS'yi devre dışı bırak
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Kontrol et
SELECT 
    'Tüm RLS devre dışı' as status,
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'products', 'user_saved_items', 'cart_items', 'product_likes', 'product_reviews', 'notifications');
