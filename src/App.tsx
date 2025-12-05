import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { DarkModeProvider, useDarkMode } from './contexts/DarkModeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// CSS animasyonları
const globalStyles = `
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }
  
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  
  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInRight {
    0% {
      opacity: 0;
      transform: translateX(30px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

// Global stilleri ekle
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = globalStyles;
  document.head.appendChild(styleSheet);
}
import ModernNavbar from './components/ModernNavbar';
import ProductGrid from './components/ProductGrid';
import ProductDetail from './components/ProductDetail';
import SearchResults from './components/SearchResults';
import FavoritesPage from './components/FavoritesPage';
import CartPage from './components/CartPage';
import NotificationsPage from './components/NotificationsPage';
import UserProfile from './components/UserProfile';
import ShareProductPage from './components/ShareProductPage';
import EditProductPage from './components/EditProductPage';
import AffiliateRedirect from './components/AffiliateRedirect';
import LogoAnimation from './components/LogoAnimation';
import Toast from './components/Toast';
import SettingsPage from './components/SettingsPage';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';
import AccountManagementPage from './components/AccountManagementPage';
import ErrorBoundaryComponent from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';
import { toggleProductLike, getLikedProducts } from './utils/likeUtils';
import { fetchAllProducts, fetchProductsByCategory } from './utils/productService';
import type { Product } from './types/Product';


function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, themeMode, toggleDarkMode } = useDarkMode();
  const { user, favorites, cartItems, toggleFavorite, addToCart, removeFromCart, updateCartQuantity, connectionStatus } = useAuth();
  // URL'den kategori bilgisini al
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('category') || 'all';
  });
  const [likedProducts, setLikedProducts] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [sharedProducts, setSharedProducts] = useState<unknown[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false
  });
  const [showLogoAnimation, setShowLogoAnimation] = useState(false);
  const [clearFiltersTrigger, setClearFiltersTrigger] = useState(0);
  const [showConnectionWarning, setShowConnectionWarning] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  // URL değişikliklerini dinle ve kategoriyi güncelle
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const categoryFromUrl = urlParams.get('category') || 'all';
    if (categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [location.search, selectedCategory]);

  // Basit sayfa yenileme kontrolü
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🔄 Sayfa cache\'den yüklendi');
      } else {
        console.log('🔄 Sayfa yeniden yüklendi');
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  // Bağlantı durumu değişikliklerini izle
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      console.log('❌ Bağlantı kesildi');
      setShowConnectionWarning(true);
      
      // Bağlantı kesildiğinde ürünleri yeniden yükle
      setTimeout(() => {
        console.log('🔄 Bağlantı kesildi, ürünler yeniden yükleniyor...');
        // Ürünleri yeniden yükle
        const loadProducts = async () => {
          try {
            let fetchedProducts: Product[] = [];
            
            if (selectedCategory === 'all') {
              fetchedProducts = await fetchAllProducts();
            } else {
              fetchedProducts = await fetchProductsByCategory(selectedCategory);
            }
            
            if (fetchedProducts.length > 0) {
              setProducts(fetchedProducts);
              setShowConnectionWarning(false);
              console.log(`📦 ${fetchedProducts.length} ürün yeniden yüklendi`);
            }
          } catch (err) {
            console.error('Ürünler yeniden yüklenirken hata:', err);
          }
        };
        
        loadProducts();
      }, 3000); // 3 saniye bekle
    } else if (connectionStatus === 'connected') {
      console.log('✅ Bağlantı kuruldu');
      setShowConnectionWarning(false);
    }
  }, [connectionStatus, selectedCategory]);

  // Auth durumu değişikliklerini izle
  useEffect(() => {
    if (user && connectionStatus === 'disconnected') {
      setShowAuthWarning(true);
      // 5 saniye sonra uyarıyı gizle
      setTimeout(() => {
        setShowAuthWarning(false);
      }, 5000);
    } else if (user && connectionStatus === 'connected') {
      setShowAuthWarning(false);
    }
  }, [user, connectionStatus]);

  // Paylaşılan ürünleri yükle (localStorage'dan)
  useEffect(() => {
    const savedSharedProducts = localStorage.getItem('sharedProducts');
    if (savedSharedProducts) {
      const parsedProducts = JSON.parse(savedSharedProducts);
      setSharedProducts(parsedProducts);
    } else {
      setSharedProducts([]);
    }
  }, []);

  // Ürünleri yükle - güvenilir versiyon
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let fetchedProducts: Product[] = [];
        
        // Retry mekanizması ile ürün yükleme
        const maxRetries = 3;
        let retryCount = 0;
        
        while (retryCount < maxRetries && fetchedProducts.length === 0) {
          try {
            if (selectedCategory === 'all') {
              fetchedProducts = await fetchAllProducts();
            } else {
              fetchedProducts = await fetchProductsByCategory(selectedCategory);
            }
            
            if (fetchedProducts.length > 0) {
              break; // Başarılı yükleme
            }
          } catch (err) {
            console.error(`Ürün yükleme denemesi ${retryCount + 1} başarısız:`, err);
            retryCount++;
            
            if (retryCount < maxRetries) {
              // 2 saniye bekle ve tekrar dene
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        if (fetchedProducts.length > 0) {
          setProducts(fetchedProducts);
          console.log(`📦 ${fetchedProducts.length} ürün yüklendi (kategori: ${selectedCategory})`);
        } else {
          setError('Ürünler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
          setProducts([]);
        }
      } catch (err) {
        console.error('Ürünler yüklenirken hata:', err);
        setError('Ürünler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [selectedCategory]);

  // Beğenilen ürünleri yükle
  useEffect(() => {
    const loadLikedProducts = async () => {
      if (user) {
        try {
          const liked = await getLikedProducts();
          setLikedProducts(liked);
        } catch (error) {
          console.error('Beğenilen ürünler yüklenirken hata:', error);
        }
      } else {
        setLikedProducts([]);
      }
    };

    loadLikedProducts();
  }, [user]);

  // Location değişikliğinde masonry layout'u yeniden hesapla
  useEffect(() => {
    const recalculateLayout = () => {
      // Ana sayfaya döndüğünde masonry layout'u yeniden hesapla
      if (location.pathname === '/') {
        setTimeout(() => {
          const gridContainer = document.querySelector('.grid-container');
          if (gridContainer) {
            const gridItems = gridContainer.querySelectorAll('.grid-item');
            const rowHeight = 10;
            
            gridItems.forEach((item) => {
              const element = item as HTMLElement;
              const height = element.offsetHeight;
              const rowSpan = Math.ceil(height / rowHeight);
              element.style.setProperty('--row-span', rowSpan.toString());
            });
          }
        }, 100);
      }
    };

    recalculateLayout();
  }, [location.pathname]);

  const handleCategoryChange = useCallback((category: string) => {
    console.log('🔄 handleCategoryChange çağrıldı:', category);
    console.log('Önceki kategori:', selectedCategory);
    setSelectedCategory(category);
    console.log('📝 Kategori güncellendi:', category);
    
    // URL'yi güncelle
    const url = new URL(window.location.href);
    if (category === 'all') {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', category);
    }
    navigate(url.pathname + url.search, { replace: true });
    
    // Ana sayfa kategorisine geçişte filtreleri temizle
    if (category === 'all') {
      setClearFiltersTrigger(prev => prev + 1);
      console.log('🧹 Ana sayfa kategorisi için filtre temizleme tetikleyicisi artırıldı');
    }
  }, [selectedCategory, navigate]);


  const handleAddToCart = useCallback(async (productId: number) => {
    if (!user) {
      showToast('Sepete ürün eklemek için giriş yapmanız gerekiyor', 'error');
      navigate('/login');
      return;
    }

    try {
      await addToCart(productId);
      const product = products.find(p => p.id === productId);
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0) + 1;
      showToast(
        `${product?.title || 'Ürün'} sepete eklendi! Sepetinizde ${totalItems} ürün var.`,
        'success'
      );
    } catch (error) {
      showToast('Ürün sepete eklenirken bir hata oluştu', 'error');
    }
  }, [user, addToCart, cartItems, navigate]);

  const handleRemoveFromCart = useCallback(async (productId: number) => {
    if (!user) return;
    
    try {
      await removeFromCart(productId);
    } catch (error) {
      showToast('Ürün sepetten çıkarılırken bir hata oluştu', 'error');
    }
  }, [user, removeFromCart]);

  const handleUpdateCartQuantity = useCallback(async (productId: number, quantity: number) => {
    if (!user) return;
    
    try {
      await updateCartQuantity(productId, quantity);
    } catch (error) {
      showToast('Sepet güncellenirken bir hata oluştu', 'error');
    }
  }, [user, updateCartQuantity]);

  const handleToggleLike = useCallback(async (productId: number) => {
    console.log('🔥 handleToggleLike çağrıldı!', { productId, user: !!user });
    
    if (!user) {
      console.log('❌ Kullanıcı yok, login sayfasına yönlendiriliyor');
      showToast('Beğeni işlemi için giriş yapmanız gerekiyor', 'error');
      navigate('/login');
      return;
    }

    try {
      console.log('📡 toggleProductLike çağrılıyor...');
      const result = await toggleProductLike(productId, user);
      if (result.success) {
        // Beğeni durumunu güncelle
        setLikedProducts(prev => {
          if (result.liked) {
            return [...prev, productId];
          } else {
            return prev.filter(id => id !== productId);
          }
        });
        
        const product = products.find(p => p.id === productId);
        showToast(
          result.liked 
            ? `${product?.title || 'Ürün'} beğenildi! ❤️` 
            : `${product?.title || 'Ürün'} beğenisi kaldırıldı`,
          'success'
        );
      } else {
        showToast(result.message || 'Beğeni işlemi sırasında hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Beğeni hatası:', error);
      showToast('Beğeni işlemi sırasında hata oluştu', 'error');
    }
  }, [user, navigate]);

  const handleProductUpdate = (productId: number, updatedProduct: unknown) => {
    // Paylaşılan ürünleri güncelle
    const updatedSharedProducts = sharedProducts.map((product: unknown) => {
      const p = product as { id: number };
      return p.id === productId ? updatedProduct : product;
    });
    setSharedProducts(updatedSharedProducts);
    localStorage.setItem('sharedProducts', JSON.stringify(updatedSharedProducts));
  };

  const clearSharedProducts = () => {
    setSharedProducts([]);
    localStorage.removeItem('sharedProducts');
    showToast('Paylaşılan ürünler temizlendi!', 'success');
  };

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      message,
      type,
      isVisible: true
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);


  const handleLogoClick = useCallback(() => {
    console.log('🖱️ Logo tıklandı!');
    console.log('Mevcut kategori:', selectedCategory);
    setShowLogoAnimation(true);
    // Kategoriyi sıfırla
    setSelectedCategory('all');
    console.log('📝 Kategori "all" olarak ayarlandı');
    
    // URL'den kategori parametresini kaldır
    const url = new URL(window.location.href);
    url.searchParams.delete('category');
    navigate(url.pathname + url.search, { replace: true });
    
    // Filtreleri temizleme tetikleyicisini artır
    setClearFiltersTrigger(prev => prev + 1);
    console.log('🧹 Filtre temizleme tetikleyicisi artırıldı');
    // Animasyon başladığında sayfayı yukarı kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory, navigate]);

  const handleLogoAnimationComplete = useCallback(() => {
    setShowLogoAnimation(false);
    // Ana sayfaya yönlendir ve en başa scroll yap
    navigate('/');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }, [navigate]);

  // Memoized styles
  const containerStyle = useMemo(() => ({
    minHeight: '100vh', 
    backgroundColor: themeMode === 'pink' ? '#fef7f7' : isDarkMode ? '#111827' : 'white',
    color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
    transition: 'all 0.3s ease'
  }), [themeMode, isDarkMode]);

  return (
    <div style={containerStyle}>
        <ModernNavbar 
        selectedCategory={selectedCategory} 
        onCategoryChange={handleCategoryChange}
        favoriteProducts={favorites}
        cartItems={cartItems}
        onLogoClick={handleLogoClick}
        user={user}
      />
      
      {/* Bağlantı durumu göstergesi */}
      <ConnectionStatus />
      
      {/* Bağlantı Uyarısı */}
      {showConnectionWarning && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: isDarkMode 
            ? 'rgba(239, 68, 68, 0.95)' 
            : 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'slideInDown 0.3s ease-out',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            background: 'white',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }} />
          Bağlantı sorunu tespit edildi, ürünler yeniden yükleniyor...
        </div>
      )}
      
      {/* Auth Uyarısı */}
      {showAuthWarning && (
        <div style={{
          position: 'fixed',
          top: '140px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: isDarkMode 
            ? 'rgba(245, 158, 11, 0.95)' 
            : 'rgba(245, 158, 11, 0.95)',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'slideInDown 0.3s ease-out',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            background: 'white',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }} />
          Hesap bağlantısı kesildi, lütfen sayfayı yenileyin...
        </div>
      )}
      
      {/* Gelişmiş hata yakalama */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '0.5rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          zIndex: 1000
        }}>
          Dev Mode: Bağlantı izleme aktif
        </div>
      )}
      
           <div style={{ marginLeft: '50px', marginTop: '60px' }}>
        <Routes>
            <Route 
              path="/" 
              element={
                <ProductGrid 
                  products={[...products, ...(sharedProducts as Product[])]} 
                  selectedCategory={selectedCategory}
                  favoriteProducts={favorites}
                  likedProducts={likedProducts}
                  onToggleFavorite={toggleFavorite}
                  onToggleLike={handleToggleLike}
                  onAddToCart={handleAddToCart}
                  onClearSharedProducts={clearSharedProducts}
                  clearFiltersTrigger={clearFiltersTrigger}
                  loading={loading}
                  error={error}
                />
              } 
            />
          <Route 
            path="/product/:id" 
            element={
                <ProductDetail 
                  favoriteProducts={favorites}
                  likedProducts={likedProducts}
                  onToggleFavorite={toggleFavorite}
                  onToggleLike={handleToggleLike}
                  onAddToCart={handleAddToCart}
                  sharedProducts={sharedProducts}
                  onProductUpdate={handleProductUpdate}
                />
            } 
          />
          <Route 
            path="/search" 
            element={
              <SearchResults 
                favoriteProducts={favorites}
                onToggleFavorite={toggleFavorite}
              />
            } 
          />
          <Route 
            path="/favorites" 
            element={
              <FavoritesPage 
                favoriteProducts={favorites}
                likedProducts={likedProducts}
                onToggleFavorite={toggleFavorite}
                onAddToCart={handleAddToCart}
              />
            } 
          />
          <Route 
            path="/cart" 
            element={
              <CartPage 
                cartItems={cartItems}
                onRemoveFromCart={handleRemoveFromCart}
                onUpdateQuantity={handleUpdateCartQuantity}
              />
            } 
          />
          <Route 
            path="/notifications" 
            element={<NotificationsPage />} 
          />
          <Route 
            path="/account" 
            element={
              <ErrorBoundaryComponent>
                <AccountManagementPage />
              </ErrorBoundaryComponent>
            } 
          />
          <Route 
            path="/login" 
            element={<LoginPage />} 
          />
          <Route 
            path="/signup" 
            element={<SignUpPage />} 
          />
          <Route 
            path="/settings" 
            element={
              <SettingsPage 
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
              />
            } 
          />
          <Route 
            path="/user/:userId" 
            element={<UserProfile />} 
          />
            <Route 
              path="/share-product" 
              element={
                <ShareProductPage 
                  onProductShared={(newProduct: unknown) => {
                    const updatedSharedProducts = [...sharedProducts, newProduct];
                    // Beğenilme sayısına göre sırala
                    updatedSharedProducts.sort((a: unknown, b: unknown) => {
                      const aLikes = (a as { likes?: number }).likes || 0;
                      const bLikes = (b as { likes?: number }).likes || 0;
                      return bLikes - aLikes;
                    });
                    setSharedProducts(updatedSharedProducts);
                    localStorage.setItem('sharedProducts', JSON.stringify(updatedSharedProducts));
                  }}
                />
              } 
            />
            <Route 
              path="/edit-product/:id" 
              element={
                <EditProductPage 
                  sharedProducts={sharedProducts}
                  onProductUpdate={handleProductUpdate}
                />
              } 
            />
          <Route 
            path="/affiliate/:userId/:productId" 
            element={<AffiliateRedirect />} 
          />
          </Routes>
        </div>
        
          
          {/* Logo Animation */}
          <LogoAnimation
            isVisible={showLogoAnimation}
            onComplete={handleLogoAnimationComplete}
          />
          
          {/* Toast Notification */}
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={toast.isVisible}
            onClose={hideToast}
            duration={4000}
          />
          
        </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}

// Error boundary ekle
class ErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if ((this.state as { hasError: boolean }).hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1>Bir hata oluştu</h1>
          <p>Lütfen sayfayı yenileyin.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App;
