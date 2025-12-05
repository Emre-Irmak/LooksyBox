-- Telefon numarası güncelleme izinlerini düzeltme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Profiles tablosunda phone kolonu var mı kontrol et
-- Eğer yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;
END $$;

-- 2. RLS politikalarını kontrol et ve gerekirse devre dışı bırak
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Profiles tablosu için güncelleme izinlerini kontrol et
-- Eğer gerekirse, tüm kullanıcıların kendi profillerini güncelleyebilmesi için policy ekle
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. Profiles tablosu için okuma izinlerini kontrol et
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 5. RLS'yi tekrar etkinleştir
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Test için mevcut kullanıcının telefon numarasını kontrol et
-- Bu sorgu çalışırsa telefon güncelleme çalışacak demektir
SELECT id, email, phone FROM profiles WHERE id = auth.uid();

-- 7. Telefon numarası güncelleme testi (isteğe bağlı)
-- UPDATE profiles SET phone = '+905411032227' WHERE id = auth.uid();
