-- Mock ürünleri veritabanına ekleme scripti
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- Önce mevcut mock verileri temizle (eğer varsa)
DELETE FROM products WHERE id BETWEEN 1 AND 104;

-- Mock ürünleri ekle
INSERT INTO products (id, title, description, price, original_price, image_url, category, brand, rating, review_count, affiliate_url) VALUES
(1, 'Kahverengi Polo Gömlek', 'Rahat ve şık polo gömlek', 89.99, 129.99, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', 'Erkek Giyim', 'Nike', 4.5, 23, 'https://www.trendyol.com/urun/1'),
(2, 'Siyah Deri Ceket', 'Klasik deri ceket', 299.99, 399.99, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop', 'Erkek Giyim', 'Zara', 4.8, 45, 'https://www.trendyol.com/urun/2'),
(3, 'Mavi Denim Gömlek', 'Denim gömlek', 79.99, 99.99, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=350&h=450&fit=crop', 'Erkek Giyim', 'H&M', 4.2, 18, 'https://www.trendyol.com/urun/3'),
(4, 'Gri Takım Elbise', 'Resmi takım elbise', 199.99, 249.99, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', 'Erkek Giyim', 'LC Waikiki', 4.6, 32, 'https://www.trendyol.com/urun/4'),
(5, 'Spor Ayakkabı', 'Rahat spor ayakkabı', 149.99, 199.99, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=320&h=400&fit=crop', 'Erkek Giyim', 'Adidas', 4.7, 67, 'https://www.trendyol.com/urun/5'),
(6, 'Beyaz Tişört', 'Temel beyaz tişört', 29.99, 39.99, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=250&h=300&fit=crop', 'Erkek Giyim', 'Uniqlo', 4.3, 28, 'https://www.trendyol.com/urun/6'),
(7, 'Kahverengi Deri Ayakkabı', 'Klasik deri ayakkabı', 179.99, 229.99, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=450&fit=crop', 'Erkek Giyim', 'Clarks', 4.4, 41, 'https://www.trendyol.com/urun/7'),
(8, 'Gri Sweatshirt', 'Rahat sweatshirt', 59.99, 79.99, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop', 'Erkek Giyim', 'Nike', 4.5, 35, 'https://www.trendyol.com/urun/8'),
(9, 'Sarı Mini Elbise', 'Yaz elbisesi', 89.99, 119.99, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=500&fit=crop', 'Kadın Giyim', 'Zara', 4.6, 52, 'https://www.trendyol.com/urun/9'),
(10, 'Siyah Klasik Elbise', 'Klasik siyah elbise', 129.99, 159.99, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop', 'Kadın Giyim', 'H&M', 4.7, 38, 'https://www.trendyol.com/urun/10'),
(11, 'Pembe Yaz Elbisesi', 'Yaz elbisesi', 79.99, 99.99, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=400&fit=crop', 'Kadın Giyim', 'Mango', 4.4, 29, 'https://www.trendyol.com/urun/11'),
(12, 'Mavi Denim Pantolon', 'Denim pantolon', 69.99, 89.99, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=350&h=500&fit=crop', 'Kadın Giyim', 'Levi''s', 4.3, 44, 'https://www.trendyol.com/urun/12'),
(13, 'Kırmızı Topuklu Ayakkabı', 'Topuklu ayakkabı', 119.99, 149.99, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=280&h=380&fit=crop', 'Kadın Giyim', 'Zara', 4.5, 36, 'https://www.trendyol.com/urun/13'),
(14, 'Siyah Deri Çanta', 'Deri çanta', 89.99, 119.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=250&h=350&fit=crop', 'Kadın Giyim', 'Michael Kors', 4.6, 48, 'https://www.trendyol.com/urun/14'),
(15, 'Beyaz Ruffled Takım', 'Ruffled takım', 149.99, 189.99, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=700&fit=crop', 'Kadın Giyim', 'H&M', 4.7, 42, 'https://www.trendyol.com/urun/15'),
(16, 'Krem Noktalı Elbise', 'Noktalı elbise', 99.99, 129.99, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop', 'Kadın Giyim', 'Zara', 4.4, 31, 'https://www.trendyol.com/urun/16'),
(17, 'Elegant Siyah Takım', 'Siyah takım', 179.99, 229.99, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop', 'Kadın Giyim', 'Mango', 4.8, 55, 'https://www.trendyol.com/urun/17'),
(18, 'Tropik Plaj Kıyafeti', 'Plaj kıyafeti', 69.99, 89.99, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=600&fit=crop', 'Kadın Giyim', 'H&M', 4.3, 27, 'https://www.trendyol.com/urun/18'),
(19, 'Krem Ruffled Elbise', 'Ruffled elbise', 109.99, 139.99, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=550&fit=crop', 'Kadın Giyim', 'Zara', 4.5, 39, 'https://www.trendyol.com/urun/19'),
(20, 'Mavi Gökyüzü Teması', 'Gökyüzü teması', 79.99, 99.99, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop', 'Kadın Giyim', 'Mango', 4.2, 33, 'https://www.trendyol.com/urun/20');

-- Daha fazla ürün eklemek için devam edebiliriz
-- Şimdilik ilk 20 ürünü ekledik, geri kalan ürünler için aynı şekilde devam edilebilir
