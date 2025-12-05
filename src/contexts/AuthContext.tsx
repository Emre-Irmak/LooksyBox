import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { supabase, checkConnection, getCurrentSession, refreshSession, monitorConnection, saveSessionToStorage, getSessionFromStorage, clearSessionFromStorage } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  favorites: number[];
  likedProducts: number[];
  cartItems: { productId: number; quantity: number }[];
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  toggleFavorite: (productId: number) => Promise<void>;
  toggleLike: (productId: number) => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateCartQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  reconnect: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [likedProducts, setLikedProducts] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<{ productId: number; quantity: number }[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');

  // Auth durumu kontrolü - session'ı da kontrol et
  const checkConnectionStatus = useCallback(async () => {
    try {
      // Son kontrol zamanını kaydet
      (window as any).lastConnectionCheck = Date.now();
      
      const { connected, error } = await checkConnection();
      if (connected) {
        setConnectionStatus('connected');
        console.log('✅ Bağlantı durumu: Bağlı');
        
        // Auth session'ını da kontrol et
        if (user?.id) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
              console.log('🔄 Auth session kopmuş, yeniden bağlanıyor...');
              // Session kopmuşsa kullanıcıyı temizle
              setUser(null);
              setProfile(null);
              setFavorites([]);
              setLikedProducts([]);
              setCartItems([]);
              clearSessionFromStorage();
            }
          } catch (authError) {
            console.error('Auth session kontrolü hatası:', authError);
          }
        }
      } else {
        console.warn('Bağlantı sorunu:', error);
        setConnectionStatus('disconnected');
        // Sadece gerçekten bağlantı sorunu varsa yeniden bağlanmayı dene
        if (connectionStatus === 'connected') {
          console.log('🔄 Bağlantı kesildi, yeniden bağlanma deneniyor...');
          setTimeout(() => {
            reconnect();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Bağlantı kontrolü hatası:', error);
      setConnectionStatus('disconnected');
    }
  }, [connectionStatus, user?.id]);

  // Akıllı otomatik yeniden bağlanma - gereksiz denemeleri önler
  const reconnect = useCallback(async () => {
    // Eğer zaten yeniden bağlanıyorsa, tekrar deneme
    if (connectionStatus === 'reconnecting') {
      console.log('🔄 Zaten yeniden bağlanıyor, atlanıyor...');
      return false;
    }

    setConnectionStatus('reconnecting');
    
    try {
      console.log('🔄 Yeniden bağlanma başlatılıyor...');
      
      // 1. Önce session'ı yenile
      let sessionRefreshed = await refreshSession();
      if (!sessionRefreshed) {
        console.log('🔄 İlk session yenileme başarısız, tekrar deneniyor...');
        // 2 saniye bekle ve tekrar dene
        await new Promise(resolve => setTimeout(resolve, 2000));
        sessionRefreshed = await refreshSession();
      }

      if (!sessionRefreshed) {
        console.log('🔄 Session yenileme başarısız, agresif yeniden bağlanma deneniyor...');
        // Agresif yeniden bağlanma
        try {
          await supabase.auth.refreshSession();
          sessionRefreshed = true;
        } catch (error) {
          console.error('❌ Agresif yeniden bağlanma başarısız:', error);
        }
      }

      if (!sessionRefreshed) {
        throw new Error('Session yenilenemedi');
      }

      // 2. Bağlantıyı test et
      const { connected } = await checkConnection();
      if (connected) {
        setConnectionStatus('connected');
        console.log('✅ Bağlantı başarıyla kuruldu');
        
        // 3. Eğer kullanıcı varsa verilerini yenile
        if (user?.id) {
          console.log('🔄 Kullanıcı verileri yenileniyor...');
          try {
            // Profil verilerini yükle
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (!profileError && profileData) {
              setProfile(profileData);
            }

            // Kullanıcı verilerini paralel yükle
            const [favoritesResult, likesResult, cartResult] = await Promise.allSettled([
              supabase.from('user_saved_items').select('product_id').eq('user_id', user.id),
              supabase.from('product_likes').select('product_id').eq('user_id', user.id),
              supabase.from('cart_items').select('product_id, quantity').eq('user_id', user.id)
            ]);

            // Favoriler
            if (favoritesResult.status === 'fulfilled' && !favoritesResult.value.error) {
              const favoriteIds = favoritesResult.value.data?.map((f: any) => f.product_id) || [];
              setFavorites(favoriteIds);
            }

            // Beğenilen ürünler
            if (likesResult.status === 'fulfilled' && !likesResult.value.error) {
              const likedIds = likesResult.value.data?.map((l: any) => l.product_id) || [];
              setLikedProducts(likedIds);
            }

            // Sepet
            if (cartResult.status === 'fulfilled' && !cartResult.value.error) {
              const cartItems = cartResult.value.data?.map((item: any) => ({
                productId: item.product_id,
                quantity: item.quantity
              })) || [];
              setCartItems(cartItems);
            }

            console.log('✅ Kullanıcı verileri başarıyla yenilendi');
          } catch (error) {
            console.error('❌ Kullanıcı verileri yenileme hatası:', error);
            // Veri yenileme hatası bağlantıyı etkilemez
          }
        }
        
        return true;
      } else {
        throw new Error('Bağlantı kurulamadı');
      }
    } catch (error) {
      console.error('❌ Yeniden bağlanma hatası:', error);
      setConnectionStatus('disconnected');
      return false;
    }
  }, [user?.id, connectionStatus]);

  // Auth bağlantı izleme - session durumunu da kontrol et
  useEffect(() => {
    const interval = setInterval(checkConnectionStatus, 120000); // 2 dakikada bir kontrol
    const cleanup = monitorConnection();
    
    // Sayfa görünürlük değişikliklerini dinle
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Sayfa tekrar görünür oldu');
        // Sadece uzun süre görünmez kaldıysa kontrol et
        const timeSinceLastCheck = Date.now() - (window as any).lastConnectionCheck || 0;
        if (timeSinceLastCheck > 5 * 60 * 1000) { // 5 dakikadan fazla
          console.log('🔄 Uzun süre görünmez kaldı, bağlantı kontrol ediliyor...');
          checkConnectionStatus();
        }
      }
    };
    
    // Auth session durumunu periyodik kontrol et
    const authCheckInterval = setInterval(async () => {
      if (user?.id) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            console.log('🔄 Auth session kopmuş, kullanıcı verileri temizleniyor...');
            setUser(null);
            setProfile(null);
            setFavorites([]);
            setLikedProducts([]);
            setCartItems([]);
            clearSessionFromStorage();
          }
        } catch (error) {
          console.error('Auth session kontrolü hatası:', error);
        }
      }
    }, 60000); // Her dakika kontrol et
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      clearInterval(authCheckInterval);
      cleanup();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkConnectionStatus, user?.id]);


  // Basit session kontrolü
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Auth başlatılıyor...');
        
        // Önce localStorage'dan session'ı kontrol et
        const storedSession = getSessionFromStorage();
        if (storedSession?.user) {
          setUser(storedSession.user);
          // Loading'i hemen kapat - çok hızlı yükleme
          if (isMounted) setLoading(false);
          
          // Veri yükleme işlemlerini arka planda başlat - kullanıcı beklemez
          setTimeout(() => {
            Promise.all([
              loadUserProfile(storedSession.user.id),
              loadUserData(storedSession.user.id)
            ]).catch(error => {
              console.error('Veri yükleme hatası:', error);
            });
          }, 0);
        } else {
          // localStorage'da session yoksa Supabase'den kontrol et
          const session = await getCurrentSession();
          if (session?.user) {
            setUser(session.user);
            saveSessionToStorage(session);
            // Loading'i hemen kapat - çok hızlı yükleme
            if (isMounted) setLoading(false);
            
            // Veri yükleme işlemlerini arka planda başlat - kullanıcı beklemez
            setTimeout(() => {
              Promise.all([
                loadUserProfile(session.user.id),
                loadUserData(session.user.id)
              ]).catch(error => {
                console.error('Veri yükleme hatası:', error);
              });
            }, 0);
          } else {
            if (isMounted) setLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Auth başlatma hatası:', error);
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // 200ms timeout - çok hızlı yükleme
    timeoutId = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 200);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (!isMounted) return;
        
        console.log('=== AUTH STATE CHANGED ===');
        console.log('Event:', event);
        console.log('Session user ID:', session?.user?.id);
        
        if (event === 'SIGNED_OUT' && session === null) {
          console.log('🚪 Kullanıcı çıkış yaptı, tüm veriler temizleniyor...');
          setUser(null);
          setProfile(null);
          setFavorites([]);
          setLikedProducts([]);
          setCartItems([]);
          clearSessionFromStorage();
          setLoading(false);
          return;
        }
        
        // Session timeout durumunu kontrol et
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token yenilendi, session güncelleniyor...');
          if (session?.user) {
            saveSessionToStorage(session);
          }
          return;
        }
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('✅ Kullanıcı giriş yaptı, veriler yükleniyor...');
          // Session'ı localStorage'a kaydet
          saveSessionToStorage(session);
          
          try {
            await loadUserProfile(session.user.id);
            await loadUserData(session.user.id);
          } catch (error) {
            console.error('❌ Veri yükleme hatası:', error);
            // Hata durumunda varsayılan profil oluştur
            const defaultProfile = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || '',
              phone: '',
              avatar_url: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setProfile(defaultProfile);
          }
        } else {
          // Çıkış yapıldığında state'leri temizle
          console.log('=== ÇIKIŞ YAPILDI, STATE\'LER TEMİZLENİYOR ===');
          setProfile(null);
          setFavorites([]);
          setLikedProducts([]);
          setCartItems([]);
          clearSessionFromStorage();
        }
        
        setLoading(false);
        console.log('=== AUTH STATE CHANGE TAMAMLANDI ===');
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Cache'den profil verilerini al - daha uzun süre sakla
  const getCachedProfile = (userId: string) => {
    try {
      const cached = localStorage.getItem(`profile_${userId}`);
      if (cached) {
        const data = JSON.parse(cached);
        // Cache 1 saatten eski değilse kullan (çok daha uzun süre)
        if (Date.now() - data.timestamp < 60 * 60 * 1000) {
          console.log('📦 Profil verileri cache\'den yüklendi');
          return data.profile;
        }
      }
    } catch (error) {
      console.error('Cache okuma hatası:', error);
    }
    return null;
  };

  // Profil verilerini cache'e kaydet
  const setCachedProfile = (userId: string, profile: any) => {
    try {
      localStorage.setItem(`profile_${userId}`, JSON.stringify({
        profile,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Cache kaydetme hatası:', error);
    }
  };

  // Kullanıcı profilini yükle - cache ile optimize edilmiş versiyon
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      // Önce cache'den kontrol et
      const cachedProfile = getCachedProfile(userId);
      if (cachedProfile) {
        setProfile(cachedProfile);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        // Profil bulunamadıysa varsayılan profil oluştur
        const defaultProfile = {
          id: userId,
          email: '',
          full_name: '',
          phone: '',
          avatar_url: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(defaultProfile);
        setCachedProfile(userId, defaultProfile);
        return;
      }
      
      setProfile(data);
      setCachedProfile(userId, data);
    } catch (error) {
      // Hata durumunda varsayılan profil oluştur
      const defaultProfile = {
        id: userId,
        email: '',
        full_name: '',
        phone: '',
        avatar_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProfile(defaultProfile);
      setCachedProfile(userId, defaultProfile);
    }
  }, []);

  // Gereksiz retry mekanizması kaldırıldı - basit yükleme kullan

  // Cache'den kullanıcı verilerini al - daha uzun süre sakla
  const getCachedUserData = (userId: string) => {
    try {
      const cached = localStorage.getItem(`userData_${userId}`);
      if (cached) {
        const data = JSON.parse(cached);
        // Cache 30 dakikadan eski değilse kullan (daha uzun süre)
        if (Date.now() - data.timestamp < 30 * 60 * 1000) {
          console.log('📦 Kullanıcı verileri cache\'den yüklendi');
          return data.userData;
        }
      }
    } catch (error) {
      console.error('Cache okuma hatası:', error);
    }
    return null;
  };

  // Kullanıcı verilerini cache'e kaydet
  const setCachedUserData = (userId: string, userData: any) => {
    try {
      localStorage.setItem(`userData_${userId}`, JSON.stringify({
        userData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Cache kaydetme hatası:', error);
    }
  };

  // Kullanıcı verilerini yükle (favoriler, sepet) - cache ile optimize edilmiş versiyon
  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Önce cache'den kontrol et
      const cachedData = getCachedUserData(userId);
      if (cachedData) {
        setFavorites(cachedData.favorites || []);
        setLikedProducts(cachedData.likedProducts || []);
        setCartItems(cachedData.cartItems || []);
        return;
      }

      // Tüm verileri paralel olarak yükle - çok daha hızlı
      const [favoritesResult, likesResult, cartResult] = await Promise.allSettled([
        supabase
          .from('user_saved_items')
          .select('product_id')
          .eq('user_id', userId),
        supabase
          .from('product_likes')
          .select('product_id')
          .eq('user_id', userId),
        supabase
          .from('cart_items')
          .select('product_id, quantity')
          .eq('user_id', userId)
      ]);

      let favorites: number[] = [];
      let likedProducts: number[] = [];
      let cartItems: { productId: number; quantity: number }[] = [];

      // Favoriler
      if (favoritesResult.status === 'fulfilled' && !favoritesResult.value.error) {
        favorites = favoritesResult.value.data?.map((f: any) => f.product_id) || [];
        setFavorites(favorites);
      } else {
        setFavorites([]);
      }

      // Beğenilen ürünler
      if (likesResult.status === 'fulfilled' && !likesResult.value.error) {
        likedProducts = likesResult.value.data?.map((l: any) => l.product_id) || [];
        setLikedProducts(likedProducts);
      } else {
        setLikedProducts([]);
      }

      // Sepet
      if (cartResult.status === 'fulfilled' && !cartResult.value.error) {
        cartItems = cartResult.value.data?.map((item: any) => ({
          productId: item.product_id,
          quantity: item.quantity
        })) || [];
        setCartItems(cartItems);
      } else {
        setCartItems([]);
      }

      // Cache'e kaydet
      setCachedUserData(userId, {
        favorites,
        likedProducts,
        cartItems
      });
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setFavorites([]);
      setLikedProducts([]);
      setCartItems([]);
    }
  }, []);

  // Kayıt ol
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Giriş yap
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Çıkış yapma - localStorage ile uyumlu
  const signOut = async () => {
    try {
      console.log('🚪 Çıkış yapılıyor...');
      
      // Önce state'leri temizle
      setUser(null);
      setProfile(null);
      setFavorites([]);
      setLikedProducts([]);
      setCartItems([]);
      
      // localStorage'dan session'ı temizle
      clearSessionFromStorage();
      
      // Cache'i temizle
      if (user?.id) {
        localStorage.removeItem(`profile_${user.id}`);
        localStorage.removeItem(`userData_${user.id}`);
      }
      
      // Supabase'den çıkış yap
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Çıkış hatası:', error);
        // Hata olsa bile localStorage temizlendi, devam et
      }
      
      console.log('✅ Çıkış başarılı');
    } catch (error) {
      console.error('❌ Çıkış yaparken hata:', error);
      // Hata olsa bile localStorage temizlendi, devam et
    }
  };

  // Profil verilerini yenile
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadUserProfile(user.id);
    }
  }, [user?.id]);

  // Kaydedilen ürünleri yönet
  const toggleFavorite = useCallback(async (productId: number) => {
    if (!user) {
      console.log('❌ Kullanıcı giriş yapmamış');
      return;
    }

    try {
      const isFavorite = favorites.includes(productId);
      console.log('🔄 Kaydetme toggle:', { productId, isFavorite, userId: user.id });
      
      // Tüm ürünler için veritabanı kullan (retry ile)
      if (isFavorite) {
        // Kaydedilenlerden çıkar
        console.log('🗑️ Kaydedilenlerden çıkarılıyor...');
        const { error } = await supabase
          .from('user_saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) {
          console.error('❌ Kaydetme çıkarma hatası:', error);
        } else {
          console.log('✅ Kaydedilenlerden çıkarıldı');
          setFavorites(prev => prev.filter(id => id !== productId));
          // Cache'i güncelle
          if (user?.id) {
            const cachedData = getCachedUserData(user.id);
            if (cachedData) {
              setCachedUserData(user.id, {
                ...cachedData,
                favorites: cachedData.favorites.filter((id: number) => id !== productId)
              });
            }
          }
        }
      } else {
        // Kaydedilenlere ekle
        console.log('💾 Kaydedilenlere ekleniyor...');
        const { data, error } = await supabase
          .from('user_saved_items')
          .insert({
            user_id: user.id,
            product_id: productId,
          })
          .select();

        if (error) {
          console.error('❌ Kaydetme ekleme hatası:', error);
          console.error('❌ Hata detayı:', {
            message: (error as any).message,
            details: (error as any).details,
            hint: (error as any).hint,
            code: (error as any).code
          });
        } else {
          console.log('✅ Kaydedilenlere eklendi:', data);
          setFavorites(prev => [...prev, productId]);
          // Cache'i güncelle
          if (user?.id) {
            const cachedData = getCachedUserData(user.id);
            if (cachedData) {
              setCachedUserData(user.id, {
                ...cachedData,
                favorites: [...cachedData.favorites, productId]
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error toggling saved item:', error);
    }
  }, [user, favorites]);

  // Beğenilen ürünleri yönet
  const toggleLike = useCallback(async (productId: number) => {
    if (!user) return;

    try {
      const isLiked = likedProducts.includes(productId);
      
      if (isLiked) {
        // Beğeniden çıkar
        const { error } = await supabase
          .from('product_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (!error) {
          setLikedProducts(prev => prev.filter(id => id !== productId));
        }
      } else {
        // Beğeni ekle
        const { error } = await supabase
          .from('product_likes')
          .insert({
            user_id: user.id,
            product_id: productId,
          })
          .select();

        if (!error) {
          setLikedProducts(prev => [...prev, productId]);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [user, likedProducts]);

  // Sepete ürün ekle
  const addToCart = useCallback(async (productId: number, quantity: number = 1) => {
    if (!user) return;

    try {
      const existingItem = cartItems.find(item => item.productId === productId);
      
      if (existingItem) {
        // Mevcut ürünün miktarını artır
        const newQuantity = existingItem.quantity + quantity;
        await updateCartQuantity(productId, newQuantity);
      } else {
        // Yeni ürün ekle
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
          })
          .select();

        if (!error) {
          setCartItems(prev => [...prev, { productId, quantity }]);
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  }, [user, cartItems]);

  // Sepetten ürün çıkar
  const removeFromCart = useCallback(async (productId: number) => {
    if (!user) return;

    try {
      // Tüm ürünler için veritabanı kullan
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (!error) {
        setCartItems(prev => prev.filter(item => item.productId !== productId));
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  }, [user]);

  // Sepet miktarını güncelle
  const updateCartQuantity = useCallback(async (productId: number, quantity: number) => {
    if (!user) return;

    try {
      // Tüm ürünler için veritabanı kullan
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (!error) {
        setCartItems(prev => 
          prev.map(item => 
            item.productId === productId 
              ? { ...item, quantity }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    }
  }, [user, removeFromCart]);

  // Sepeti temizle
  const clearCart = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (!error) {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }, [user]);

  // Context value'yu memoize et - gereksiz re-renderları önle
  const value: AuthContextType = useMemo(() => ({
    user,
    profile,
    loading,
    favorites,
    likedProducts,
    cartItems,
    connectionStatus,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    toggleFavorite,
    toggleLike,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    reconnect,
  }), [
    user,
    profile,
    loading,
    favorites,
    likedProducts,
    cartItems,
    connectionStatus,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    toggleFavorite,
    toggleLike,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    reconnect,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};