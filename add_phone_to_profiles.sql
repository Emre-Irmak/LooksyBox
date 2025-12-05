-- Profiles tablosuna telefon numarası ekleme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Profiles tablosuna phone kolonu ekle
ALTER TABLE profiles 
ADD COLUMN phone TEXT;

-- Phone kolonu için yorum ekle
COMMENT ON COLUMN profiles.phone IS 'Kullanıcının telefon numarası';

-- Mevcut veriler için telefon numarası güncelleme (isteğe bağlı)
-- UPDATE profiles SET phone = '+90 5XX XXX XX XX' WHERE id = 'user-uuid-here';

-- Telefon numarası formatını kontrol etmek için constraint ekle (isteğe bağlı)
-- ALTER TABLE profiles 
-- ADD CONSTRAINT phone_format_check 
-- CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$');

-- Updated_at trigger'ı zaten mevcut, telefon güncellemeleri otomatik olarak updated_at'i güncelleyecek

-- Test için örnek telefon numarası ekleme (isteğe bağlı)
-- UPDATE profiles SET phone = '+90 555 123 45 67' WHERE email = 'test@example.com';
