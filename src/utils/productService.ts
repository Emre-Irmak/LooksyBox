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
    console.log('🖼️ Images data:', data.images, 'Type:', typeof data.images);
    console.log('🖼️ Image URL:', data.image_url);

    if (error) {
      console.error('❌ Ürün çekilirken hata:', error);
      return null;
    }

    if (!data) {
      console.log('❌ Veri bulunamadı');
      return null;
    }

    // Kullanıcı bilgisini profiles tablosundan çek
    let creatorProfile = null;
    if (data.created_by) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .eq('id', data.created_by)
          .single();
        
        if (!profileError && profileData) {
          creatorProfile = profileData;
          console.log('👤 Creator profile bulundu:', creatorProfile);
        } else {
          console.log('⚠️ Creator profile bulunamadı. created_by:', data.created_by, 'Error:', profileError);
        }
      } catch (profileErr) {
        console.error('❌ Profil çekilirken hata:', profileErr);
      }
    }

    // Hashtags'i parse et (string veya array olabilir)
    let hashtagsArray: string[] = [];
    if (data.hashtags) {
      if (typeof data.hashtags === 'string') {
        // Eğer string ise, virgül veya boşluk ile ayrılmış olabilir
        hashtagsArray = data.hashtags
          .split(/[,\s]+/)
          .map(tag => tag.trim().replace(/^#/, '')) // Başındaki # işaretini kaldır
          .filter(tag => tag.length > 0);
      } else if (Array.isArray(data.hashtags)) {
        hashtagsArray = data.hashtags.map(tag => 
          typeof tag === 'string' ? tag.replace(/^#/, '') : String(tag)
        );
      }
    }

    // Images'ı parse et
    let imagesArray: string[] = [];
    if (data.images) {
      if (typeof data.images === 'string') {
        try {
          const parsed = JSON.parse(data.images);
          if (Array.isArray(parsed)) {
            imagesArray = parsed.map((item: any) => {
              // Eğer obje formatındaysa {url: "..."} şeklinde
              if (typeof item === 'object' && item !== null && item.url) {
                return item.url;
              }
              // Eğer string ise direkt kullan
              return typeof item === 'string' ? item : String(item);
            });
          } else {
            imagesArray = [data.images];
          }
        } catch {
          imagesArray = [data.images];
        }
      } else if (Array.isArray(data.images)) {
        // Array ise, her elemanı kontrol et
        imagesArray = data.images.map((item: any) => {
          // Eğer obje formatındaysa {url: "..."} şeklinde
          if (typeof item === 'object' && item !== null && item.url) {
            return item.url;
          }
          // Eğer string ise direkt kullan
          return typeof item === 'string' ? item : String(item);
        });
      }
    }
    
    // Eğer images yoksa veya boşsa image_url'i kullan
    if (imagesArray.length === 0) {
      if (data.image_url) {
        imagesArray = [data.image_url];
      }
    }
    
    // imageUrl'i de set et (her zaman bir değer olmalı)
    const primaryImageUrl = imagesArray.length > 0 ? imagesArray[0] : data.image_url || '';
    
    console.log('🖼️ Parsed images array:', imagesArray);
    console.log('🖼️ Primary image URL:', primaryImageUrl);

    // Specs'i parse et
    let specsObj: { [key: string]: string } = {};
    if (data.specs) {
      if (typeof data.specs === 'string') {
        try {
          specsObj = JSON.parse(data.specs);
        } catch {
          // Eğer parse edilemezse boş obje bırak
        }
      } else if (typeof data.specs === 'object') {
        specsObj = data.specs;
      }
    }

    // Veritabanı verilerini Product interface'ine uygun hale getir
    const product: Product = {
      id: data.id,
      title: data.title,
      imageUrl: primaryImageUrl,
      images: imagesArray.length > 0 ? imagesArray : undefined,
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
      store: data.store || data.brand, // store kolonunu öncelikle kullan, yoksa brand
      brand: data.brand,
      likes: data.like_count || 0,
      productLink: data.product_link || data.affiliate_url,
      affiliateLink: data.affiliate_url,
      shareDate: data.created_at || data.share_date,
      hashtags: hashtagsArray,
      specs: Object.keys(specsObj).length > 0 ? specsObj : undefined,
      coverImageIndex: data.cover_image_index,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by,
      // Kullanıcı bilgisini profiles tablosundan çek
      user: creatorProfile ? {
        // UUID'yi hash'leyip number'a çevir (basit hash fonksiyonu)
        id: creatorProfile.id ? 
          Array.from(creatorProfile.id.replace(/-/g, '')).reduce((acc, char) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0) % 1000000 : 0,
        name: creatorProfile.full_name || creatorProfile.email || 'Bilinmeyen Kullanıcı',
        avatar: creatorProfile.avatar_url || getRandomAvatar(),
        verified: true // Profil varsa verified olarak işaretle
      } : (data.created_by ? {
        // Eğer creator bilgisi yoksa ama created_by varsa, fallback kullan
        id: 0,
        name: 'Bilinmeyen Kullanıcı',
        avatar: getRandomAvatar(),
        verified: false
      } : undefined)
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

// Kullanıcıya göre ürünleri çek
export const fetchProductsByUser = async (userId: string): Promise<Product[]> => {
  try {
    console.log('🔄 Kullanıcı ürünleri yükleniyor, User ID:', userId);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Kullanıcı ürünleri çekilirken hata:', error);
      throw error;
    }

    // Images parse fonksiyonu
    const parseImages = (imagesData: any): string[] => {
      if (!imagesData) return [];
      
      if (typeof imagesData === 'string') {
        try {
          const parsed = JSON.parse(imagesData);
          if (Array.isArray(parsed)) {
            return parsed.map((item: any) => {
              if (typeof item === 'object' && item !== null && item.url) {
                return item.url;
              }
              return typeof item === 'string' ? item : String(item);
            });
          }
          return [imagesData];
        } catch {
          return [imagesData];
        }
      } else if (Array.isArray(imagesData)) {
        return imagesData.map((item: any) => {
          if (typeof item === 'object' && item !== null && item.url) {
            return item.url;
          }
          return typeof item === 'string' ? item : String(item);
        });
      }
      return [];
    };

    const products: Product[] = (data || []).map((item: any) => {
      const imagesArray = parseImages(item.images);
      const primaryImageUrl = imagesArray.length > 0 ? imagesArray[0] : item.image_url || '';
      
      return {
        id: item.id,
        title: item.title,
        imageUrl: primaryImageUrl,
        images: imagesArray.length > 0 ? imagesArray : undefined,
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
        store: item.store || item.brand,
        brand: item.brand,
        likes: item.like_count || 0,
        productLink: item.product_link || item.affiliate_url,
        affiliateLink: item.affiliate_url,
        shareDate: item.created_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: item.created_by
      };
    });

    console.log(`✅ ${products.length} kullanıcı ürünü yüklendi`);
    return products;
  } catch (error) {
    console.error('Kullanıcı ürünleri çekilirken hata:', error);
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
