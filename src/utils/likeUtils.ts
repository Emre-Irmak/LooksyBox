import { supabase, withRetry } from '../lib/supabase';

export interface LikeResult {
  success: boolean;
  message: string;
  liked?: boolean;
  like_count?: number;
}

/**
 * Ürün beğenme/beğenmeme işlemini toggle eder
 */
export const toggleProductLike = async (productId: number, currentUser?: any): Promise<LikeResult> => {
  try {
    console.log('🔄 Beğeni işlemi başlatılıyor, productId:', productId);
    
    console.log('🔍 Supabase client kontrol ediliyor...');
    console.log('Supabase URL:', supabase.supabaseUrl);
    
    console.log('👤 Kullanıcı durumu kontrol ediliyor...');
    
    let user;
    
    // Eğer currentUser parametresi verilmişse onu kullan
    if (currentUser) {
      user = currentUser;
      console.log('👤 Parametre olarak verilen kullanıcı kullanılıyor:', user);
    } else {
      // Önce mevcut session'ı kontrol edelim
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔑 Mevcut session:', session);
      
      if (session?.user) {
        user = session.user;
        console.log('👤 Session\'dan kullanıcı alındı:', user);
      } else {
        // Session yoksa getUser'ı dene
        console.log('🔍 Session yok, getUser deneniyor...');
        const { data: { user: fetchedUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('❌ Kullanıcı durumu hatası:', userError);
          return {
            success: false,
            message: 'Kullanıcı durumu kontrol edilemedi: ' + userError.message
          };
        }
        
        user = fetchedUser;
      }
    }
    
    console.log('👤 Kullanıcı durumu:', user ? 'Giriş yapılmış' : 'Giriş yapılmamış');
    console.log('👤 Kullanıcı ID:', user?.id);
    
    if (!user) {
      console.log('❌ Kullanıcı giriş yapmamış');
      return {
        success: false,
        message: 'Giriş yapmanız gerekiyor'
      };
    }

    console.log('📡 SQL fonksiyonu çağrılıyor...');
    console.log('📡 Parametreler:', { p_user_id: user.id, p_product_id: productId });
    
    // SQL fonksiyonunu çağır (retry ile)
    const { data, error } = await withRetry(async () => {
      const result = await supabase.rpc('toggle_product_like', {
        p_user_id: user.id,
        p_product_id: productId
      });
      
      if (result.error) {
        throw result.error;
      }
      return result;
    });

    console.log('📊 SQL fonksiyonu sonucu:', { data, error });
    console.log('📊 Error detayı:', error);
    console.log('📊 Data detayı:', data);

    if (error) {
      console.error('❌ Beğeni hatası:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      return {
        success: false,
        message: 'Beğeni işlemi sırasında hata oluştu: ' + error.message
      };
    }

    console.log('✅ Beğeni işlemi başarılı:', data);
    return data;
  } catch (error) {
    console.error('💥 Beklenmeyen hata:', error);
    console.error('💥 Hata detayı:', error);
    return {
      success: false,
      message: 'Beklenmeyen bir hata oluştu: ' + (error as Error).message
    };
  }
};

/**
 * Kullanıcının ürünü beğenip beğenmediğini kontrol eder
 */
export const checkUserLike = async (productId: number): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data, error } = await withRetry(async () => {
      const result = await supabase.rpc('check_user_like', {
        p_user_id: user.id,
        p_product_id: productId
      });
      
      if (result.error) {
        throw result.error;
      }
      return result;
    });

    if (error) {
      console.error('Beğeni kontrolü hatası:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Beğeni kontrolü hatası:', error);
    return false;
  }
};

/**
 * Ürün beğeni sayısını getirir
 */
export const getProductLikeCount = async (productId: number): Promise<number> => {
  try {
    const { data, error } = await withRetry(async () => {
      const result = await supabase
        .from('products')
        .select('like_count')
        .eq('id', productId)
        .single();
      
      if (result.error) {
        throw result.error;
      }
      return result;
    });

    if (error) {
      console.error('Beğeni sayısı getirme hatası:', error);
      return 0;
    }

    return data?.like_count || 0;
  } catch (error) {
    console.error('Beğeni sayısı getirme hatası:', error);
    return 0;
  }
};

/**
 * Birden fazla ürün için beğeni durumlarını getirir
 */
export const getMultipleProductLikes = async (productIds: number[]): Promise<Record<number, boolean>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || productIds.length === 0) {
      return {};
    }

    const { data, error } = await withRetry(async () => {
      const result = await supabase
        .from('product_likes')
        .select('product_id')
        .eq('user_id', user.id)
        .in('product_id', productIds);
      
      if (result.error) {
        throw result.error;
      }
      return result;
    });

    if (error) {
      console.error('Çoklu beğeni kontrolü hatası:', error);
      return {};
    }

    const likedProducts: Record<number, boolean> = {};
    productIds.forEach(id => {
      likedProducts[id] = false;
    });

    data?.forEach(like => {
      likedProducts[like.product_id] = true;
    });

    return likedProducts;
  } catch (error) {
    console.error('Çoklu beğeni kontrolü hatası:', error);
    return {};
  }
};

/**
 * Beğenilen ürünleri getirir
 */
export const getLikedProducts = async (): Promise<number[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await withRetry(async () => {
      const result = await supabase
        .from('product_likes')
        .select('product_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (result.error) {
        throw result.error;
      }
      return result;
    });

    if (error) {
      console.error('Beğenilen ürünler getirme hatası:', error);
      return [];
    }

    return data?.map(like => like.product_id) || [];
  } catch (error) {
    console.error('Beğenilen ürünler getirme hatası:', error);
    return [];
  }
};