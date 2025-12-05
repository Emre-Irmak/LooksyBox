import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ftwteybptjxclpaswyxg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0d3RleWJwdGp4Y2xwYXN3eXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjQ3OTAsImV4cCI6MjA3NDY0MDc5MH0.jlQ4F3DIBgBtZ7WdjdH7NQSHuDGpDMO4Sh3NfNbrcus'

// Supabase'in default storage'ını kullan - custom storage karmaşıklık yaratıyor

// Global Supabase client instance - sadece bir kez oluştur
const supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development',
    // Session süresini uzat
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Storage getItem hatası:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Storage setItem hatası:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Storage removeItem hatası:', error);
        }
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'looksy-app'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export const supabase = supabaseInstance;

// Bağlantı durumu kontrolü için yardımcı fonksiyonlar
export const checkConnection = async () => {
  try {
    console.log('🔍 Bağlantı testi yapılıyor...');
    
    // Timeout ile bağlantı testi
    const connectionPromise = supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Bağlantı timeout')), 5000)
    );
    
    const result = await Promise.race([connectionPromise, timeoutPromise]);
    const { error } = result as any;
    
    if (error) {
      console.error('❌ Bağlantı testi başarısız:', error);
      return { connected: false, error };
    }
    
    console.log('✅ Bağlantı testi başarılı');
    return { connected: true, error: null };
  } catch (error) {
    console.error('❌ Bağlantı testi hatası:', error);
    return { connected: false, error };
  }
};

// Basit session kontrolü
export const checkSession = async () => {
  try {
    console.log('🔍 Session kontrolü yapılıyor...');
    
    // Timeout ile session kontrolü
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session timeout')), 3000)
    );
    
    const result = await Promise.race([sessionPromise, timeoutPromise]);
    const { data: { session }, error } = result as any;
    
    if (error) {
      console.error('❌ Session kontrolü başarısız:', error);
      return { valid: false, session: null, error };
    }
    
    if (session?.user) {
      console.log('✅ Session geçerli:', session.user.id);
      return { valid: true, session, error: null };
    } else {
      console.log('❌ Session bulunamadı');
      return { valid: false, session: null, error: null };
    }
  } catch (error) {
    console.error('❌ Session kontrolü hatası:', error);
    return { valid: false, session: null, error };
  }
};

// Retry mekanizması ile database işlemi
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`İşlem başarısız (deneme ${i + 1}/${maxRetries}):`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

// Session yenileme yardımcı fonksiyonu
export const refreshSession = async () => {
  try {
    console.log('🔄 Session yenileniyor...');
    
    // Timeout ile session yenileme
    const refreshPromise = supabase.auth.refreshSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session refresh timeout')), 5000)
    );
    
    const result = await Promise.race([refreshPromise, timeoutPromise]);
    const { error } = result as any;
    
    if (error) {
      console.error('❌ Session yenileme hatası:', error);
      return false;
    }
    console.log('✅ Session başarıyla yenilendi');
    return true;
  } catch (error) {
    console.error('❌ Session yenileme hatası:', error);
    return false;
  }
};

// Akıllı bağlantı durumu izleme - gereksiz kontrolleri önler
export const monitorConnection = () => {
  let isOnline = navigator.onLine;
  let reconnectAttempts = 0;
  let lastSuccessfulCheck = Date.now();
  let isChecking = false; // Kontrol sırasında tekrar kontrol etmeyi önle
  const maxReconnectAttempts = 3; // Daha az deneme
  const checkInterval = 60000; // 1 dakikada bir kontrol (çok daha az sık)
  // const maxIdleTime = 10 * 60 * 1000; // 10 dakika idle time - kullanılmıyor
  
  const handleOnline = () => {
    console.log('🌐 İnternet bağlantısı geri geldi');
    isOnline = true;
    reconnectAttempts = 0;
    lastSuccessfulCheck = Date.now();
  };
  
  const handleOffline = () => {
    console.log('❌ İnternet bağlantısı kesildi');
    isOnline = false;
  };
  
  // Sayfa görünürlük değişikliklerini dinle
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      console.log('👁️ Sayfa tekrar görünür oldu');
      lastSuccessfulCheck = Date.now();
      // Sadece uzun süre görünmez kaldıysa kontrol et
      const timeSinceLastCheck = Date.now() - lastSuccessfulCheck;
      if (timeSinceLastCheck > 5 * 60 * 1000) { // 5 dakikadan fazla
        console.log('🔄 Uzun süre görünmez kaldı, bağlantı kontrol ediliyor...');
        checkConnectionIfNeeded();
      }
    }
  };
  
  // Sadece gerektiğinde bağlantı kontrolü yap
  const checkConnectionIfNeeded = async () => {
    if (isChecking || !isOnline) return;
    
    isChecking = true;
    try {
      const { connected } = await checkConnection();
      if (connected) {
        lastSuccessfulCheck = Date.now();
        reconnectAttempts = 0;
        console.log('✅ Bağlantı sağlıklı');
      } else if (reconnectAttempts < maxReconnectAttempts) {
        console.log(`🔄 Bağlantı sorunu tespit edildi, yeniden bağlanma denemesi ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
        reconnectAttempts++;
        
        // Session'ı yenile
        const refreshed = await refreshSession();
        if (refreshed) {
          console.log('✅ Bağlantı yeniden kuruldu');
          reconnectAttempts = 0;
          lastSuccessfulCheck = Date.now();
        }
      } else {
        console.log('❌ Maksimum yeniden bağlanma denemesi aşıldı');
      }
    } catch (error) {
      console.error('Bağlantı kontrolü hatası:', error);
    } finally {
      isChecking = false;
    }
  };
  
  // İnternet bağlantısı olaylarını dinle
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Çok daha az sık kontrol et
  const checkIntervalId = setInterval(() => {
    if (!isOnline || isChecking) return;
    
    const timeSinceLastCheck = Date.now() - lastSuccessfulCheck;
    // Sadece gerçekten gerekli olduğunda kontrol et
    if (timeSinceLastCheck > checkInterval) {
      checkConnectionIfNeeded();
    }
  }, checkInterval);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(checkIntervalId);
  };
};

// Gelişmiş hata yönetimi
export const handleSupabaseError = (error: any, operation: string) => {
  console.error(`❌ ${operation} hatası:`, error);
  
  // Yaygın hata kodları
  if (error?.code === 'PGRST301') {
    console.log('🔄 Session süresi dolmuş, yenileniyor...');
    return { shouldRetry: true, shouldRefreshSession: true };
  }
  
  if (error?.code === 'PGRST116') {
    console.log('🔄 Bağlantı sorunu, yeniden denenecek...');
    return { shouldRetry: true, shouldRefreshSession: false };
  }
  
  if (error?.message?.includes('JWT')) {
    console.log('🔄 Token sorunu, session yenileniyor...');
    return { shouldRetry: true, shouldRefreshSession: true };
  }
  
  return { shouldRetry: false, shouldRefreshSession: false };
};

// Güvenilir session kontrolü
export const getCurrentSession = async () => {
  try {
    console.log('🔍 Session kontrolü yapılıyor...');
    
    // Timeout ile session kontrolü
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session timeout')), 5000)
    );
    
    const result = await Promise.race([sessionPromise, timeoutPromise]);
    const { data: { session }, error } = result as any;
    
    if (error) {
      console.error('❌ Session kontrolü hatası:', error);
      return null;
    }
    
    if (session?.user) {
      console.log('✅ Session geçerli:', session.user.id);
      return session;
    } else {
      console.log('❌ Session bulunamadı');
      return null;
    }
  } catch (error) {
    console.error('❌ Session kontrolü hatası:', error);
    return null;
  }
};

// Gereksiz - Supabase kendi session'ını yönetiyor

// Gereksiz - Supabase kendi session'ını yönetiyor

// localStorage Session Yönetimi
export const saveSessionToStorage = (session: any) => {
  try {
    if (session?.user) {
      const sessionData = {
        user: session.user,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        timestamp: Date.now()
      };
      localStorage.setItem('looksy-session', JSON.stringify(sessionData));
      console.log('💾 Session localStorage\'a kaydedildi');
    }
  } catch (error) {
    console.error('❌ Session kaydetme hatası:', error);
  }
};

export const getSessionFromStorage = () => {
  try {
    const sessionData = localStorage.getItem('looksy-session');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      // Session'ın 7 günden eski olmadığını kontrol et
      if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
        console.log('💾 Session localStorage\'dan yüklendi');
        return parsed;
      } else {
        console.log('❌ Session çok eski, temizleniyor');
        localStorage.removeItem('looksy-session');
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Session yükleme hatası:', error);
    return null;
  }
};

export const clearSessionFromStorage = () => {
  try {
    localStorage.removeItem('looksy-session');
    console.log('🗑️ Session localStorage\'dan temizlendi');
  } catch (error) {
    console.error('❌ Session temizleme hatası:', error);
  }
};
