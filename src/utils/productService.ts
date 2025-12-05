import { supabase } from '../lib/supabase';
import type { Product } from '../types/Product';

// Cache'den ürünleri al
const getCachedProducts = (): Product[] | null => {
  try {
    const cached = localStorage.getItem('cached_products');
    if (cached) {
      const data = JSON.parse(cached);
      // Cache 10 dakikadan eski değilse kullan
      if (Date.now() - data.timestamp < 10 * 60 * 1000) {
        console.log('📦 Ürünler cache\'den yüklendi');
        return data.products;
      }
    }
  } catch (error) {
    console.error('Cache okuma hatası:', error);
  }
  return null;
};

// Ürünleri cache'e kaydet
const setCachedProducts = (products: Product[]) => {
  try {
    localStorage.setItem('cached_products', JSON.stringify({
      products,
      timestamp: Date.now()
    }));
    console.log('💾 Ürünler cache\'e kaydedildi');
  } catch (error) {
    console.error('Cache kaydetme hatası:', error);
  }
};

// Veritabanından tüm ürünleri çek - cache ile optimize edilmiş
export const fetchAllProducts = async (): Promise<Product[]> => {
  try {
    // Önce cache'den kontrol et
    const cachedProducts = getCachedProducts();
    if (cachedProducts) {
      return cachedProducts;
    }

    console.log('🔄 Veritabanından ürünler yükleniyor...');
    
    // Timeout ile bağlantı testi
    const connectionPromise = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Bağlantı timeout')), 10000)
    );
    
    const result = await Promise.race([connectionPromise, timeoutPromise]);
    const { data, error } = result as any;

    if (error) {
      console.error('Ürünler çekilirken hata:', error);
      throw error;
    }

    // Veritabanı verilerini Product interface'ine uygun hale getir
    const products: Product[] = data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      imageUrl: item.image_url,
      images: item.images || [item.image_url],
      price: item.price ? `₺${item.price}` : undefined,
      originalPrice: item.original_price ? `₺${item.original_price}` : undefined,
      discount: item.discount,
      category: item.category,
      subcategory: item.subcategory,
      season: item.season,
      description: item.description,
      features: item.features || [],
      rating: item.rating,
      reviews: item.review_count,
      store: item.brand,
      likes: item.like_count || 0,
      productLink: item.affiliate_url,
      shareDate: item.share_date,
      // Rastgele kullanıcı bilgisi ekle (şimdilik)
      user: {
        id: Math.floor(Math.random() * 15) + 1,
        name: getRandomUserName(),
        avatar: getRandomAvatar(),
        verified: Math.random() > 0.3
      }
    })) || [];

    // Cache'e kaydet
    setCachedProducts(products);
    console.log(`✅ ${products.length} ürün veritabanından yüklendi ve cache'e kaydedildi`);
    return products;
  } catch (error) {
    console.error('Ürünler çekilirken hata:', error);
    // Hata durumunda cache'den dene
    const cachedProducts = getCachedProducts();
    if (cachedProducts) {
      console.log('📦 Hata durumunda cache\'den ürünler yüklendi');
      return cachedProducts;
    }
    return [];
  }
};

// ID'ye göre tek ürün çek - cache ile optimize edilmiş
export const fetchProductById = async (id: number): Promise<Product | null> => {
  try {
    console.log('🔍 fetchProductById çağrıldı, ID:', id);
    
    // Timeout ile bağlantı testi
    const connectionPromise = supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Bağlantı timeout')), 8000)
    );
    
    const result = await Promise.race([connectionPromise, timeoutPromise]);
    const { data, error } = result as any;

    console.log('📊 Supabase response:', { data, error });

    if (error) {
      console.error('❌ Ürün çekilirken hata:', error);
      return null;
    }

    if (!data) {
      console.log('❌ Veri bulunamadı');
      return null;
    }

    // Veritabanı verilerini Product interface'ine uygun hale getir
    const product: Product = {
      id: data.id,
      title: data.title,
      imageUrl: data.image_url,
      images: data.images || [data.image_url],
      price: data.price ? `₺${data.price}` : undefined,
      originalPrice: data.original_price ? `₺${data.original_price}` : undefined,
      discount: data.discount,
      category: data.category,
      subcategory: data.subcategory,
      season: data.season,
      description: data.description,
      features: data.features || [],
      rating: data.rating,
      reviews: data.review_count,
      store: data.brand,
      likes: data.like_count || 0,
      productLink: data.affiliate_url,
      shareDate: data.share_date,
      // Rastgele kullanıcı bilgisi ekle (şimdilik)
      user: {
        id: Math.floor(Math.random() * 15) + 1,
        name: getRandomUserName(),
        avatar: getRandomAvatar(),
        verified: Math.random() > 0.3
      }
    };

    return product;
  } catch (error) {
    console.error('Ürün çekilirken hata:', error);
    return null;
  }
};

// Kategoriye göre ürünleri çek - cache ile optimize edilmiş
export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    // Önce cache'den kontrol et
    const cacheKey = `cached_products_${category}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      // Cache 5 dakikadan eski değilse kullan
      if (Date.now() - data.timestamp < 5 * 60 * 1000) {
        console.log(`📦 ${category} kategorisi ürünleri cache'den yüklendi`);
        return data.products;
      }
    }

    console.log(`🔄 ${category} kategorisi ürünleri veritabanından yükleniyor...`);
    
    // Timeout ile bağlantı testi
    const connectionPromise = supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Bağlantı timeout')), 10000)
    );
    
    const result = await Promise.race([connectionPromise, timeoutPromise]);
    const { data, error } = result as any;

    if (error) {
      console.error('Kategori ürünleri çekilirken hata:', error);
      throw error;
    }

    const products: Product[] = data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      imageUrl: item.image_url,
      images: item.images || [item.image_url],
      price: item.price ? `₺${item.price}` : undefined,
      originalPrice: item.original_price ? `₺${item.original_price}` : undefined,
      discount: item.discount,
      category: item.category,
      subcategory: item.subcategory,
      season: item.season,
      description: item.description,
      features: item.features || [],
      rating: item.rating,
      reviews: item.review_count,
      store: item.brand,
      likes: item.like_count || 0,
      productLink: item.affiliate_url,
      shareDate: item.share_date,
      user: {
        id: Math.floor(Math.random() * 15) + 1,
        name: getRandomUserName(),
        avatar: getRandomAvatar(),
        verified: Math.random() > 0.3
      }
    })) || [];

    // Cache'e kaydet
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        products,
        timestamp: Date.now()
      }));
      console.log(`💾 ${category} kategorisi ürünleri cache'e kaydedildi`);
    } catch (error) {
      console.error('Cache kaydetme hatası:', error);
    }

    console.log(`✅ ${products.length} ${category} kategorisi ürünü yüklendi`);
    return products;
  } catch (error) {
    console.error('Kategori ürünleri çekilirken hata:', error);
    // Hata durumunda cache'den dene
    const cacheKey = `cached_products_${category}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      console.log(`📦 Hata durumunda ${category} kategorisi cache'den yüklendi`);
      return data.products;
    }
    return [];
  }
};

// Arama fonksiyonu
export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Arama yapılırken hata:', error);
      throw error;
    }

    const products: Product[] = data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      imageUrl: item.image_url,
      images: item.images || [item.image_url],
      price: item.price ? `₺${item.price}` : undefined,
      originalPrice: item.original_price ? `₺${item.original_price}` : undefined,
      discount: item.discount,
      category: item.category,
      subcategory: item.subcategory,
      season: item.season,
      description: item.description,
      features: item.features || [],
      rating: item.rating,
      reviews: item.review_count,
      store: item.brand,
      likes: item.like_count || 0,
      productLink: item.affiliate_url,
      shareDate: item.share_date,
      user: {
        id: Math.floor(Math.random() * 15) + 1,
        name: getRandomUserName(),
        avatar: getRandomAvatar(),
        verified: Math.random() > 0.3
      }
    })) || [];

    return products;
  } catch (error) {
    console.error('Arama yapılırken hata:', error);
    return [];
  }
};

// Rastgele kullanıcı isimleri
const getRandomUserName = (): string => {
  const names = [
    "Ayşe Yılmaz", "Mehmet Kaya", "Zeynep Demir", "Ali Özkan", "Elif Şahin",
    "Can Arslan", "Selin Öztürk", "Emre Çelik", "Deniz Kılıç", "Berk Yıldız",
    "Ceren Aktaş", "Furkan Doğan", "Gizem Özkan", "Hakan Yılmaz", "İrem Kaya"
  ];
  return names[Math.floor(Math.random() * names.length)];
};

// Rastgele avatar URL'leri
const getRandomAvatar = (): string => {
  const avatars = [
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop&crop=face"
  ];
  return avatars[Math.floor(Math.random() * avatars.length)];
};
