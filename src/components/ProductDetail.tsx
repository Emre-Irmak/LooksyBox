import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import ProductStatsModal from './ProductStatsModal';
import { trackProductView } from '../utils/productStatsUtils';
import { fetchProductById, fetchAllProducts } from '../utils/productService';
import type { Product } from '../types/Product';

interface ProductDetailProps {
  favoriteProducts: number[];
  likedProducts?: number[];
  onToggleFavorite: (productId: number) => void;
  onToggleLike?: (productId: number) => void;
  onAddToCart: (productId: number) => void;
  sharedProducts?: any[];
  onProductUpdate?: (productId: number, updatedProduct: any) => void;
}

// Benzer ürünleri bulma fonksiyonu
const findSimilarProducts = (currentProduct: Product, allProducts: Product[], limit: number = 8): Product[] => {
  if (!currentProduct) return [];
  
  const similarProducts = allProducts
    .filter(p => p.id !== currentProduct.id) // Mevcut ürünü hariç tut
    .map(p => {
      let score = 0;
      
      // Kategori eşleşmesi (en yüksek puan)
      if (p.category === currentProduct.category) score += 4;
      
      // Alt kategori eşleşmesi
      if (p.subcategory === currentProduct.subcategory) score += 3;
      
      // Sezon eşleşmesi
      if (p.season === currentProduct.season) score += 2;
      
      // Mağaza eşleşmesi
      if (p.store === currentProduct.store) score += 1;
      
      // Fiyat aralığı benzerliği (yakın fiyatlı ürünler)
      if (currentProduct.price && p.price) {
        const currentPrice = parseFloat(currentProduct.price.replace(/[^\d]/g, ''));
        const productPrice = parseFloat(p.price.replace(/[^\d]/g, ''));
        if (currentPrice > 0 && productPrice > 0) {
          const priceDiff = Math.abs(currentPrice - productPrice) / currentPrice;
          if (priceDiff < 0.3) score += 2; // %30'dan az fark
          else if (priceDiff < 0.5) score += 1; // %50'den az fark
        }
      }
      
      // Rating benzerliği (yakın rating'li ürünler)
      if (currentProduct.rating && p.rating) {
        const ratingDiff = Math.abs(currentProduct.rating - p.rating);
        if (ratingDiff < 0.5) score += 1; // 0.5'ten az fark
      }
      
      return { product: p, score };
    })
    .filter(item => item.score > 0) // En az 1 puan alan ürünler
    .sort((a, b) => b.score - a.score) // Puana göre sırala
    .slice(0, limit) // İlk N ürünü al
    .map(item => item.product);
  
  return similarProducts;
};

const ProductDetail = ({ favoriteProducts, likedProducts = [], onToggleFavorite, onToggleLike, onAddToCart, sharedProducts = [] }: ProductDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useDarkMode();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleShowStats = () => {
    setShowStatsModal(true);
    if (product) {
      trackProductView(product.id);
    }
  };

  const handleCloseStats = () => {
    setShowStatsModal(false);
  };

  // Ürünü ve benzer ürünleri yükle
  useEffect(() => {
    const loadProductData = async () => {
      if (!id) {
        console.log('❌ Product ID bulunamadı');
        return;
      }
      
      console.log('🔄 Ürün yükleniyor, ID:', id);
      setLoading(true);
      setError(null);
      
      try {
        // Ana ürünü yükle
        console.log('📦 fetchProductById çağrılıyor...');
        const productData = await fetchProductById(parseInt(id));
        console.log('📦 Veritabanından ürün verisi:', productData);
        console.log('❤️ Beğeni sayısı (like_count):', productData?.likes);
        
        if (!productData) {
          console.log('❌ Ürün bulunamadı');
          setError('Ürün bulunamadı');
          setLoading(false);
          return;
        }
        
        setProduct(productData);
        console.log('✅ Ürün state\'e set edildi');
        
        // Benzer ürünler için tüm ürünleri yükle
        console.log('📦 Benzer ürünler için tüm ürünler yükleniyor...');
        const allProductsData = await fetchAllProducts();
        setAllProducts([...allProductsData, ...sharedProducts]);
        console.log('✅ Benzer ürünler yüklendi:', allProductsData.length);
        
      } catch (err) {
        console.error('❌ Ürün yüklenirken hata:', err);
        setError('Ürün yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
        console.log('🏁 Loading tamamlandı');
      }
    };

    loadProductData();
  }, [id, sharedProducts]);
  
  const isFavorite = product ? favoriteProducts.includes(product.id) : false;
  const isLiked = product ? likedProducts.includes(product.id) : false;
  
  // Benzer ürünleri bul
  const similarProducts = product ? findSimilarProducts(product, allProducts, 8) : [];
  
  // Çoklu fotoğraf desteği
  const productImages = product?.images || [product?.imageUrl].filter(Boolean);
  const currentImage = productImages[selectedImageIndex];

  // Component mount olduğunda ve route değiştiğinde scroll pozisyonunu sıfırla
  useEffect(() => {
    // Anında scroll'u sıfırla (smooth animasyon olmadan)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, id]); // Route veya ürün ID değiştiğinde scroll'u sıfırla
  
  // Loading state
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          margin: '0 auto', 
          padding: '0 1rem',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '2rem',
            padding: '3rem 2rem',
            boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(10px)',
            border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'inline-block',
              width: '60px',
              height: '60px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '2rem'
            }}></div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: isDarkMode ? '#f9fafb' : '#1f2937', 
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Ürün Yükleniyor...
            </h1>
            <p style={{ 
              color: isDarkMode ? '#d1d5db' : '#6b7280', 
              fontSize: '1.125rem',
              marginBottom: '2rem'
            }}>
              Lütfen bekleyin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          margin: '0 auto', 
          padding: '0 1rem',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '2rem',
            padding: '3rem 2rem',
            boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(10px)',
            border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ 
              margin: '0 auto', 
              height: '8rem', 
              width: '8rem', 
              color: '#ef4444',
              marginBottom: '2rem'
            }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: isDarkMode ? '#f9fafb' : '#1f2937', 
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Bir Hata Oluştu
            </h1>
            <p style={{ 
              color: isDarkMode ? '#d1d5db' : '#6b7280', 
              fontSize: '1.125rem',
              marginBottom: '2rem'
            }}>
              {error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          margin: '0 auto', 
          padding: '0 1rem',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '2rem',
            padding: '3rem 2rem',
            boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(10px)',
            border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ 
              margin: '0 auto', 
              height: '8rem', 
              width: '8rem', 
              color: '#ef4444',
              marginBottom: '2rem'
            }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: isDarkMode ? '#f9fafb' : '#1f2937', 
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Ürün Bulunamadı
            </h1>
            <p style={{ 
              color: isDarkMode ? '#d1d5db' : '#6b7280', 
              fontSize: '1.125rem',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              Aradığınız ürün mevcut değil. Lütfen ana sayfaya dönerek diğer ürünleri inceleyin.
            </p>
            <button 
              onClick={() => {
                navigate('/');
                // Scroll pozisyonunu geri yükle
                setTimeout(() => {
                  const savedPosition = localStorage.getItem('scrollPosition');
                  if (savedPosition) {
                    window.scrollTo(0, parseInt(savedPosition));
                    localStorage.removeItem('scrollPosition');
                  }
                }, 100);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem 2rem',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '1rem',
                color: 'white',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 25px -5px rgba(102, 126, 234, 0.4)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 20px 40px -5px rgba(102, 126, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(102, 126, 234, 0.4)';
              }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: isDarkMode 
        ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '0.25rem 0'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>

        {/* Product Detail */}
        <div style={{ 
          backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '1.5rem', 
          boxShadow: isDarkMode ? '0 20px 40px -10px rgba(0, 0, 0, 0.3)' : '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
          position: 'relative',
          border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Geri Butonu - Sol Üst Köşe */}
          <button 
            onClick={() => {
              navigate(-1);
            }}
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              color: isDarkMode ? '#60a5fa' : '#6366f1',
              border: isDarkMode ? '2px solid rgba(75, 85, 99, 0.3)' : '2px solid #e5e7eb',
              padding: '0.5rem',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontSize: '1.5rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 20,
              width: '2.5rem',
              height: '2.5rem',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6';
              e.currentTarget.style.borderColor = isDarkMode ? '#6b7280' : '#d1d5db';
              e.currentTarget.style.color = isDarkMode ? '#93c5fd' : '#4f46e5';
              e.currentTarget.style.transform = 'translateX(-2px)';
              e.currentTarget.style.boxShadow = isDarkMode ? '0 8px 20px rgba(0, 0, 0, 0.4)' : '0 8px 20px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)';
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb';
              e.currentTarget.style.color = isDarkMode ? '#60a5fa' : '#6366f1';
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0',
            minHeight: '300px'
          }}>
            {/* Product Image */}
            <div style={{ 
              background: isDarkMode 
                ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' 
                : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              position: 'relative'
            }}>
               {/* Mağaza Badge - Fotoğrafın Üstünde Orta */}
               <div style={{
                 position: 'absolute',
                 top: '2rem',
                 left: '50%',
                 transform: 'translateX(-50%)',
                 backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                 backdropFilter: 'blur(10px)',
                 color: isDarkMode ? '#f9fafb' : '#1f2937',
                 padding: '0.75rem 1.5rem',
                 borderRadius: '1.5rem',
                 fontSize: '0.875rem',
                 fontWeight: '600',
                 boxShadow: isDarkMode ? '0 8px 20px -5px rgba(0, 0, 0, 0.3)' : '0 8px 20px -5px rgba(0, 0, 0, 0.1)',
                 border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem',
                 zIndex: 10
               }}>
                 <div style={{
                   width: '1rem',
                   height: '1rem',
                   backgroundColor: '#10b981',
                   borderRadius: '50%',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}>
                   <div style={{
                     width: '0.5rem',
                     height: '0.5rem',
                     backgroundColor: 'white',
                     borderRadius: '50%'
                   }} />
                 </div>
                 {product.store || 'Trendyol'}
               </div>

              <img
                src={currentImage}
                alt={product.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain',
                  borderRadius: '1rem',
                  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)'
                }}
              />
              
              {/* Çoklu fotoğraf navigasyonu */}
              {productImages.length > 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  padding: '0.5rem',
                  borderRadius: '1rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  {productImages.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '0.5rem',
                        border: selectedImageIndex === index ? '2px solid #6366f1' : '2px solid transparent',
                        background: `url(${image}) center/cover`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                  ))}
                </div>
              )}
              {product.discount && (
                <div style={{
                  position: 'absolute',
                  top: '2rem',
                  right: '2rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}>
                  {product.discount} İndirim
                </div>
              )}
            </div>

            {/* Product Info */}
            <div style={{ 
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <h1 style={{ 
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    color: 'white',
                    lineHeight: '1.2',
                    margin: 0,
                    flex: 1
                  }}>
                    {product.title}
                  </h1>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    marginLeft: '1rem'
                  }}>
                    {/* İstatistik Simgesi */}
                    <button
                      onClick={handleShowStats}
                      style={{
                        backgroundColor: 'rgba(139, 92, 246, 0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '2.5rem',
                        height: '2.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.8)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)';
                      }}
                      title="Ürün İstatistikleri"
                    >
                      📊
                    </button>

                    {/* Beğeni sayısı */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '1rem',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <svg 
                        width="16" 
                        height="16" 
                        fill="#ef4444" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                      </svg>
                      <span style={{ 
                        color: 'white', 
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {product.likes || 0}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => onToggleFavorite(product.id)}
                      style={{
                        backgroundColor: isFavorite ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                        color: isFavorite ? 'white' : 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '3rem',
                        height: '3rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isFavorite ? '#dc2626' : 'rgba(255, 255, 255, 0.3)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isFavorite ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <svg 
                        width="24" 
                        height="24" 
                        fill={isFavorite ? 'currentColor' : 'none'} 
                        stroke={isFavorite ? 'none' : 'currentColor'} 
                        viewBox="0 0 24 24"
                        style={{ strokeWidth: isFavorite ? 0 : 2 }}
                      >
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                      </svg>
                    </button>

                    {/* Beğeni Butonu */}
                    {onToggleLike && (
                      <button
                        onClick={() => onToggleLike(product.id)}
                        style={{
                          backgroundColor: isLiked ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                          color: isLiked ? 'white' : 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '3rem',
                          height: '3rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          flexShrink: 0,
                          backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isLiked ? '#dc2626' : 'rgba(255, 255, 255, 0.3)';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isLiked ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <svg 
                          width="24" 
                          height="24" 
                          fill={isLiked ? 'currentColor' : 'none'} 
                          stroke={isLiked ? 'none' : 'currentColor'} 
                          viewBox="0 0 24 24"
                          style={{ strokeWidth: isLiked ? 0 : 2 }}
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Kullanıcı Bilgileri */}
                {product.user && (
                  <div 
                    onClick={() => navigate(`/user/${product.user.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '0.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      padding: '1rem 1.5rem',
                      borderRadius: '1.5rem',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <img
                      src={product.user.avatar}
                      alt={product.user.name}
                      style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: 'white'
                        }}>
                          {product.user.name}
                        </span>
                        {product.user.verified && (
                          <div style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            backgroundColor: '#10b981',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                          }}>
                            <svg width="10" height="10" fill="white" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        <span style={{
                          fontSize: '0.875rem',
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontWeight: '500'
                        }}>
                          Bu ürünü paylaştı
                        </span>
                        {product.shareDate && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontWeight: '400'
                          }}>
                            {new Date(product.shareDate).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {product.category && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {product.category}
                    </span>
                    {product.subcategory && (
                      <span style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '1rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        backdropFilter: 'blur(10px)'
                      }}>
                        {product.subcategory}
                      </span>
                    )}
                    {product.season && (
                      <span style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '1rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        backdropFilter: 'blur(10px)'
                      }}>
                        {product.season}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                {product.price && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                      <span style={{ 
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#fbbf24'
                      }}>
                        {product.price}
                      </span>
                      {product.originalPrice && (
                        <span style={{ 
                          fontSize: '1.25rem',
                          color: 'rgba(255, 255, 255, 0.7)',
                          textDecoration: 'line-through'
                        }}>
                          {product.originalPrice}
                        </span>
                      )}
                    </div>
                    {product.rating && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.125rem' }}>
                          {[...Array(5)].map((_, i) => (
                            <span key={i} style={{ 
                              color: i < Math.floor(product.rating!) ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)',
                              fontSize: '1.5rem'
                            }}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1rem' }}>
                          {product.rating} ({product.reviews} değerlendirme)
                        </span>
                      </div>
                    )}
                    
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <h3 style={{ 
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '0.25rem'
                }}>
                  Ürün Açıklaması
                </h3>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: '1.6',
                  fontSize: '1rem'
                }}>
                  {product.description || "Bu ürün, yüksek kaliteli malzemelerden üretilmiş olup, modern tasarımı ile dikkat çekmektedir. Günlük kullanım için ideal olan bu ürün, hem şık hem de fonksiyonel özellikler sunmaktadır."}
                </p>
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <h3 style={{ 
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '0.25rem'
                }}>
                  Özellikler
                </h3>
                <ul style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: '1.6',
                  paddingLeft: '1.5rem'
                }}>
                  {(product.features || [
                    "Yüksek kaliteli malzeme",
                    "Modern ve şık tasarım", 
                    "Günlük kullanım için ideal",
                    "Kolay bakım",
                    "Uzun ömürlü"
                  ]).map((feature: string, index: number) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div style={{ 
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                {(product.affiliateLink || product.productLink) && (
                  <button
                    onClick={() => window.open(product.affiliateLink || product.productLink, '_blank')}
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '1rem 2rem',
                      borderRadius: '1rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      flex: '1',
                      minWidth: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px -5px rgba(139, 92, 246, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(139, 92, 246, 0.4)';
                    }}
                  >
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    Siteye Git
                  </button>
                )}
                
                {/* Düzenle Butonu */}
                <button
                  onClick={() => navigate(`/edit-product/${product.id}`)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '1rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    flex: '1',
                    minWidth: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px -5px rgba(16, 185, 129, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(16, 185, 129, 0.4)';
                  }}
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Ürünü Düzenle
                </button>
                
                <button 
                  onClick={() => onAddToCart(product.id)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '1rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    flex: '1',
                    minWidth: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px -5px rgba(16, 185, 129, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(16, 185, 129, 0.4)';
                  }}
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
                  </svg>
                  Sepete Ekle
                </button>
                
              </div>
            </div>
          </div>
        </div>

        {/* Benzer Ürünler Bölümü */}
        {similarProducts.length > 0 && (
          <div style={{ 
            marginTop: '1.5rem',
            backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '1.5rem', 
            boxShadow: isDarkMode ? '0 20px 40px -10px rgba(0, 0, 0, 0.3)' : '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            padding: '1.5rem',
            border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px -5px rgba(102, 126, 234, 0.4)',
                position: 'relative'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#667eea'
                }}>
                  ✓
                </div>
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: isDarkMode ? '#f9fafb' : '#1f2937',
                  margin: 0,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Benzer Ürünler
                </h2>
                <p style={{
                  color: isDarkMode ? '#d1d5db' : '#6b7280',
                  fontSize: '1rem',
                  margin: '0.25rem 0 0 0'
                }}>
                  Bu ürünle benzer özelliklere sahip diğer ürünler
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {similarProducts.map((similarProduct) => (
                <div
                  key={similarProduct.id}
                  onClick={() => {
                    console.log('Benzer ürüne tıklandı:', similarProduct.id);
                    navigate(`/product/${similarProduct.id}`);
                  }}
                  style={{
                    backgroundColor: isDarkMode ? '#1f2937' : 'white',
                    borderRadius: '1.5rem',
                    padding: '1.5rem',
                    boxShadow: isDarkMode ? '0 8px 25px -5px rgba(0, 0, 0, 0.3)' : '0 8px 25px -5px rgba(0, 0, 0, 0.1)',
                    border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    zIndex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = isDarkMode ? '0 20px 40px -5px rgba(0, 0, 0, 0.4)' : '0 20px 40px -5px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isDarkMode ? '0 8px 25px -5px rgba(0, 0, 0, 0.3)' : '0 8px 25px -5px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = isDarkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb';
                  }}
                >
                  {/* Ürün Resmi */}
                  <div style={{
                    position: 'relative',
                    marginBottom: '1rem',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    backgroundColor: '#f8fafc'
                  }}>
                    <img
                      src={similarProduct.imageUrl}
                      alt={similarProduct.title}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                    
                    {/* İndirim Badge */}
                    {similarProduct.discount && (
                      <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                      }}>
                        {similarProduct.discount}
                      </div>
                    )}

                    {/* Favori Butonu */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleFavorite(similarProduct.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        left: '0.75rem',
                        backgroundColor: favoriteProducts.includes(similarProduct.id) ? '#ef4444' : 'rgba(255, 255, 255, 0.9)',
                        color: favoriteProducts.includes(similarProduct.id) ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '50%',
                        width: '2.5rem',
                        height: '2.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = favoriteProducts.includes(similarProduct.id) ? '#dc2626' : 'white';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = favoriteProducts.includes(similarProduct.id) ? '#ef4444' : 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        fill={favoriteProducts.includes(similarProduct.id) ? 'currentColor' : 'none'} 
                        stroke={favoriteProducts.includes(similarProduct.id) ? 'none' : 'currentColor'} 
                        viewBox="0 0 24 24"
                        style={{ strokeWidth: favoriteProducts.includes(similarProduct.id) ? 0 : 2 }}
                      >
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                      </svg>
                    </button>

                    {/* Beğeni Butonu */}
                    {onToggleLike && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleLike(similarProduct.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          backgroundColor: likedProducts.includes(similarProduct.id) ? '#ef4444' : 'rgba(255, 255, 255, 0.9)',
                          color: likedProducts.includes(similarProduct.id) ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '50%',
                          width: '2.5rem',
                          height: '2.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = likedProducts.includes(similarProduct.id) ? '#dc2626' : 'white';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = likedProducts.includes(similarProduct.id) ? '#ef4444' : 'rgba(255, 255, 255, 0.9)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          fill={likedProducts.includes(similarProduct.id) ? 'currentColor' : 'none'} 
                          stroke={likedProducts.includes(similarProduct.id) ? 'none' : 'currentColor'} 
                          viewBox="0 0 24 24"
                          style={{ strokeWidth: likedProducts.includes(similarProduct.id) ? 0 : 2 }}
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Ürün Bilgileri */}
                  <div>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#f9fafb' : '#1f2937',
                      margin: '0 0 0.5rem 0',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {similarProduct.title}
                    </h3>

                    {/* Kategori ve Sezon */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap'
                    }}>
                      {similarProduct.category && (
                        <span style={{
                          backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                          color: isDarkMode ? '#d1d5db' : '#374151',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {similarProduct.category}
                        </span>
                      )}
                      {similarProduct.season && (
                        <span style={{
                          backgroundColor: isDarkMode ? '#1e40af' : '#e0f2fe',
                          color: isDarkMode ? '#93c5fd' : '#0369a1',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {similarProduct.season}
                        </span>
                      )}
                    </div>

                    {/* Fiyat */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem'
                    }}>
                      {similarProduct.price && (
                        <span style={{
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          color: isDarkMode ? '#f9fafb' : '#1f2937'
                        }}>
                          {similarProduct.price}
                        </span>
                      )}
                      {similarProduct.originalPrice && (
                        <span style={{
                          fontSize: '0.875rem',
                          color: isDarkMode ? '#6b7280' : '#9ca3af',
                          textDecoration: 'line-through'
                        }}>
                          {similarProduct.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    {similarProduct.rating && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', gap: '0.125rem' }}>
                          {[...Array(5)].map((_, i) => (
                            <span key={i} style={{ 
                              color: i < Math.floor(similarProduct.rating!) ? '#fbbf24' : '#e5e7eb',
                              fontSize: '0.875rem'
                            }}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span style={{ 
                          color: isDarkMode ? '#9ca3af' : '#6b7280', 
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {similarProduct.rating} ({similarProduct.reviews} değerlendirme)
                        </span>
                      </div>
                    )}

                    {/* Mağaza */}
                    {similarProduct.store && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          width: '1rem',
                          height: '1rem',
                          backgroundColor: '#10b981',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            width: '0.5rem',
                            height: '0.5rem',
                            backgroundColor: 'white',
                            borderRadius: '50%'
                          }} />
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          fontWeight: '500'
                        }}>
                          {similarProduct.store}
                        </span>
                      </div>
                    )}

                    {/* Sepete Ekle Butonu */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddToCart(similarProduct.id);
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
                      </svg>
                      Sepete Ekle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Modal */}
        {showStatsModal && product && (
          <ProductStatsModal
            isOpen={showStatsModal}
            onClose={handleCloseStats}
            product={{
              productId: product.id,
              title: product.title,
              uploadDate: product.shareDate || new Date().toISOString(),
              likes: product.likes || 0,
              clicks: 0, // Modal'da rastgele oluşturulacak
              siteVisits: 0, // Modal'da rastgele oluşturulacak
              cartAdds: 0, // Modal'da rastgele oluşturulacak
              views: 0, // Modal'da rastgele oluşturulacak
              shares: 0 // Modal'da rastgele oluşturulacak
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
