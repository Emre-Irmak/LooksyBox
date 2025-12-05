import React, { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import AdvancedFilters from './AdvancedFilters';
import ProductStatsModal from './ProductStatsModal';
import { useDarkMode } from '../contexts/DarkModeContext';
import { toggleProductLike } from '../utils/likeUtils';
// import { trackProductView } from '../utils/productStatsUtils';
import type { Product } from '../types/Product';
import './ProductGrid.css';

interface ProductGridProps {
  products: Product[];
  selectedCategory: string;
  favoriteProducts?: number[];
  likedProducts?: number[];
  onToggleFavorite?: (productId: number) => void;
  onToggleLike?: (productId: number) => void;
  onAddToCart?: (productId: number) => void;
  onClearSharedProducts?: () => void;
  clearFiltersTrigger?: number; // Filtreleri temizleme tetikleyicisi
  loading?: boolean;
  error?: string | null;
}

const ProductGrid = React.memo(({ products, selectedCategory, favoriteProducts = [], likedProducts = [], onToggleFavorite, onToggleLike, onAddToCart, onClearSharedProducts, clearFiltersTrigger, loading = false, error = null }: ProductGridProps) => {
  const { isDarkMode, themeMode } = useDarkMode();
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<string>(() => {
    // localStorage'dan sıralama seçimini yükle
    const savedSort = localStorage.getItem('productGridSortBy');
    return savedSort || 'popularity';
  });
  const gridRef = useRef<HTMLDivElement>(null);

  // const handleShowStats = (product: Product) => {
  //   setSelectedProduct(product);
  //   setShowStatsModal(true);
  //   // Ürün görüntülenme sayısını artır
  //   trackProductView(product.id);
  // };

  const handleCloseStats = () => {
    setShowStatsModal(false);
    setSelectedProduct(null);
  };

  // Beğeni toggle fonksiyonu
  const handleToggleLike = async (productId: number) => {
    try {
      const result = await toggleProductLike(productId);
      if (result.success && onToggleLike) {
        onToggleLike(productId);
      }
    } catch (error) {
      console.error('Beğeni hatası:', error);
    }
  };

  // Filtreleri temizleme fonksiyonu
  const clearAllFilters = () => {
    setAppliedFilters({});
    setShowFilters(false);
  };

  // Ana sayfaya dönüldüğünde filtreleri temizle
  useEffect(() => {
    if (selectedCategory === 'all') {
      clearAllFilters();
    }
  }, [selectedCategory]);

  // Logo tıklama tetikleyicisi
  useEffect(() => {
    if (clearFiltersTrigger && clearFiltersTrigger > 0) {
      clearAllFilters();
      
      // Logoya tıklandığında sıralama seçimini sıfırla
      setSortBy('popularity');
      localStorage.removeItem('productGridSortBy');
    }
  }, [clearFiltersTrigger]);

  // Sıralama seçimini localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('productGridSortBy', sortBy);
  }, [sortBy]);

  // Kategoriye göre ürünleri filtrele
  let filteredProducts = products;
  
  if (selectedCategory === 'all') {
    filteredProducts = products;
  } else if (selectedCategory === 'bestsellers') {
    // Çok satanlar - yüksek puanlı ürünler
    filteredProducts = products.filter(product => product.rating && product.rating >= 4.5);
  } else if (selectedCategory === 'flash') {
    // Flaş ürünler - indirimli ürünler
    filteredProducts = products.filter(product => product.discount);
  } else {
    // Normal kategori filtreleme - ana kategori ve alt kategori eşleştirmesi
    
    // Ana kategori-alt kategori eşleştirmesi
    const getParentCategory = (subcategory: string): string | null => {
      const categoryMap: Record<string, string> = {
        // Kadın Giyim alt kategorileri
        'Elbise': 'Kadın Giyim',
        'Çanta': 'Kadın Giyim',
        'Aksesuar': 'Kadın Giyim',
        
        // Erkek Giyim alt kategorileri
        'Saat': 'Erkek Giyim',
        
        // Diğer kategoriler
        'Bebek Giyim': 'Anne & Çocuk',
        'Çocuk Giyim': 'Anne & Çocuk',
        'Hamile Giyim': 'Anne & Çocuk',
        'Mobilya': 'Ev & Yaşam',
        'Dekorasyon': 'Ev & Yaşam',
        'Mutfak': 'Ev & Yaşam',
        'Banyo': 'Ev & Yaşam'
      };
      
      return categoryMap[subcategory] || null;
    };
    
    // Ortak alt kategoriler (hem kadın hem erkek için kullanılan)
    const isCommonSubcategory = (subcategory: string): boolean => {
      const commonSubcategories = ['Üst Giyim', 'Alt Giyim', 'Ayakkabı', 'Aksesuar'];
      return commonSubcategories.includes(subcategory);
    };
    
    // Alt kategori seçildiğinde hangi ana kategorilerin kabul edileceğini belirle
    const getAcceptedCategories = (subcategory: string): string[] => {
      if (isCommonSubcategory(subcategory)) {
        // Ortak alt kategoriler için hem kadın hem erkek kabul edilir
        // Hem "Kadın Giyim" hem "Kadın" hem "Erkek Giyim" hem "Erkek" kategorilerini kabul et
        return ['Kadın Giyim', 'Kadın', 'Erkek Giyim', 'Erkek'];
      } else {
        // Diğer alt kategoriler için sadece kendi ana kategorisi
        const parentCategory = getParentCategory(subcategory);
        return parentCategory ? [parentCategory] : [];
      }
    };
    
    filteredProducts = products.filter(product => {
      const categoryMatch = product.category === selectedCategory;
      const subcategoryMatch = product.subcategory === selectedCategory;
      
      // Alt kategori seçildiyse, hem alt kategori hem de ana kategori eşleşmeli
      let isMatch = false;
      if (subcategoryMatch) {
        const acceptedCategories = getAcceptedCategories(selectedCategory);
        // Hem alt kategori hem de ana kategori eşleşmeli
        isMatch = product.category ? acceptedCategories.includes(product.category) : false;
      } else {
        isMatch = categoryMatch;
      }
      
      return isMatch;
    });
  }

  // Gelişmiş filtreleri uygula
  if (Object.keys(appliedFilters).length > 0) {
    filteredProducts = filteredProducts.filter(product => {
      // Fiyat aralığı filtresi
      if (appliedFilters.priceRange) {
        const price = parseFloat(product.price?.replace('₺', '').replace(',', '') || '0');
        const { min, max } = appliedFilters.priceRange;
        if (price < min || price > max) return false;
      }

      // Mağaza filtresi
      if (appliedFilters.store && appliedFilters.store.length > 0) {
        if (!appliedFilters.store.includes(product.store)) return false;
      }

      // Değerlendirme filtresi
      if (appliedFilters.rating && product.rating) {
        const minRating = parseFloat(appliedFilters.rating.replace('+', ''));
        if (product.rating < minRating) return false;
      }

      // Alt kategori filtresi
      if (appliedFilters.subcategory && appliedFilters.subcategory.length > 0) {
        if (!appliedFilters.subcategory.includes(product.subcategory)) return false;
      }

      // Mevsim filtresi
      if (appliedFilters.season && appliedFilters.season.length > 0) {
        if (!appliedFilters.season.includes(product.season)) return false;
      }

      // Diğer filtreler...
      return true;
    });
  }

  // Sıralama fonksiyonu
  const sortProducts = (products: Product[], sortType: string) => {
    return [...products].sort((a, b) => {
      switch (sortType) {
        case 'price-low':
          const priceA = parseFloat(a.price?.replace(/[^\d]/g, '') || '0');
          const priceB = parseFloat(b.price?.replace(/[^\d]/g, '') || '0');
          return priceA - priceB;
        
        case 'price-high':
          const priceAHigh = parseFloat(a.price?.replace(/[^\d]/g, '') || '0');
          const priceBHigh = parseFloat(b.price?.replace(/[^\d]/g, '') || '0');
          return priceBHigh - priceAHigh;
        
        case 'date-new':
          const dateANew = new Date(a.shareDate || '').getTime();
          const dateBNew = new Date(b.shareDate || '').getTime();
          return dateBNew - dateANew;
        
        case 'date-old':
          const dateAOld = new Date(a.shareDate || '').getTime();
          const dateBOld = new Date(b.shareDate || '').getTime();
          return dateAOld - dateBOld;
        
        case 'popularity':
        default:
          return (b.likes || 0) - (a.likes || 0);
      }
    });
  };

  // Duplicate ID'leri kaldır (aynı ID'ye sahip ürünlerden sadece ilkini al)
  const uniqueProducts = filteredProducts.filter((product, index, self) => 
    index === self.findIndex((p) => p.id === product.id)
  );

  // Ürünleri sırala
  const sortedProducts = sortProducts(uniqueProducts, sortBy);

  // Masonry layout için row-span hesaplama
  useEffect(() => {
    const calculateRowSpans = () => {
      if (gridRef.current) {
        const gridItems = gridRef.current.querySelectorAll('.grid-item');
        const rowHeight = 10; // CSS'teki grid-auto-rows değeri
        
        gridItems.forEach((item) => {
          const element = item as HTMLElement;
          const height = element.offsetHeight;
          const rowSpan = Math.ceil(height / rowHeight);
          element.style.setProperty('--row-span', rowSpan.toString());
        });
      }
    };

    // Hemen hesapla
    calculateRowSpans();
    
    // Resize ve scroll olaylarında yeniden hesapla
    const handleResize = () => {
      setTimeout(calculateRowSpans, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    // Component mount olduğunda da hesapla
    const timer = setTimeout(calculateRowSpans, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      clearTimeout(timer);
    };
  }, [sortedProducts]);

  return (
    <div style={{ 
      maxWidth: '1280px', 
      margin: '0 auto', 
      padding: '2rem 1rem',
      backgroundColor: themeMode === 'pink' ? '#fef7f7' : isDarkMode ? '#111827' : 'white',
      color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
      transition: 'all 0.3s ease'
    }}>
      {/* Page Title */}
      <div style={{ 
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: themeMode === 'pink' ? 'rgba(254, 247, 247, 0.9)' : isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          padding: '0.5rem 1rem',
          borderRadius: '1.5rem',
          boxShadow: themeMode === 'pink' ? '0 10px 25px -5px rgba(236, 72, 153, 0.2)' : isDarkMode ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            backgroundColor: themeMode === 'pink' ? '#ec4899' : '#6366f1',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            {selectedCategory === 'bestsellers' ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ) : selectedCategory === 'flash' ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            ) : selectedCategory === 'Kadın Giyim' ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            ) : selectedCategory === 'Erkek Giyim' ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            ) : (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            )}
          </div>
          <div>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              background: isDarkMode 
                ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0
            }}>
              {selectedCategory === 'bestsellers' ? 'Favori Ürünler' :
             selectedCategory === 'flash' ? 'Flaş Ürünler' :
             selectedCategory === 'Kadın Giyim' ? 'Kadın Giyim' :
             selectedCategory === 'Erkek Giyim' ? 'Erkek Giyim' :
             'Öne Çıkan Ürünler'}
            </h1>
            <p style={{ 
              color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#6b7280', 
              fontSize: '0.875rem',
              margin: '0.25rem 0 0 0'
            }}>
              {selectedCategory === 'bestsellers' ? 'En yüksek puanlı ve favori ürünler' :
               selectedCategory === 'flash' ? 'Özel indirimli flaş ürünler' :
               selectedCategory === 'Kadın Giyim' ? 'Kadın giyim koleksiyonu' :
               selectedCategory === 'Erkek Giyim' ? 'Erkek giyim koleksiyonu' :
               'En popüler ve trend ürünleri keşfedin'}
            </p>
          </div>
        </div>
      </div>

      {/* Ürün Sayısı Göstergesi - Sadece filtreleme yapıldığında göster */}
      {Object.keys(appliedFilters).length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          padding: '0 0.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: themeMode === 'pink' ? 'rgba(254, 247, 247, 0.8)' : isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            padding: '0.5rem 1rem',
            borderRadius: '1rem',
            boxShadow: themeMode === 'pink' ? '0 4px 12px rgba(236, 72, 153, 0.15)' : isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.2)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: themeMode === 'pink' ? '#ec4899' : '#6366f1',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem'
            }}>
              📊
            </div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#f9fafb' : '#374151'
            }}>
              {sortedProducts.length} ürün bulundu
            </div>
          </div>
          
          {/* Filtre Durumu Göstergesi */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: themeMode === 'pink' ? 'rgba(236, 72, 153, 0.1)' : isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            padding: '0.5rem 1rem',
            borderRadius: '1rem',
            border: themeMode === 'pink' ? '1px solid rgba(236, 72, 153, 0.3)' : isDarkMode ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: themeMode === 'pink' ? '#ec4899' : '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem'
            }}>
              🔍
            </div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#60a5fa' : '#3b82f6'
            }}>
              Filtreler aktif
            </div>
          </div>
        </div>
      )}

      {/* Filtre ve Temizleme Butonları */}
      <div style={{ 
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem'
      }}>
        {onClearSharedProducts && (
          <button
            onClick={onClearSharedProducts}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '1rem',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'white',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.9)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
            </svg>
            Paylaşılan Ürünleri Temizle
          </button>
        )}
        
        <button
          onClick={() => setShowFilters(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: themeMode === 'pink' ? 'rgba(254, 247, 247, 0.9)' : isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '1rem',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: themeMode === 'pink' ? '#ec4899' : isDarkMode ? '#60a5fa' : '#3b82f6',
            transition: 'all 0.3s ease',
            boxShadow: themeMode === 'pink' ? '0 4px 6px -1px rgba(236, 72, 153, 0.2)' : isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = themeMode === 'pink' ? 'rgba(236, 72, 153, 0.1)' : isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = themeMode === 'pink' ? 'rgba(254, 247, 247, 0.9)' : isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 17h18v-2H3v2zm0-5h18V7H3v5zm0-7v2h18V5H3z"/>
          </svg>
          Gelişmiş Filtreler
          {Object.keys(appliedFilters).length > 0 && (
            <span style={{
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '1.25rem',
              height: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {Object.keys(appliedFilters).length}
            </span>
          )}
        </button>
      </div>

      {/* Sıralama Seçici */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '1.5rem',
        gap: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: themeMode === 'pink' ? 'rgba(254, 247, 247, 0.8)' : isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          padding: '0.5rem 1rem',
          borderRadius: '1rem',
          boxShadow: themeMode === 'pink' ? '0 4px 12px rgba(236, 72, 153, 0.15)' : isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.2)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.2)' : '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            width: '1.5rem',
            height: '1.5rem',
            backgroundColor: themeMode === 'pink' ? '#ec4899' : '#6366f1',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.75rem'
          }}>
            🔄
          </div>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#f9fafb' : '#374151'
          }}>
            Sırala:
          </span>
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            backgroundColor: themeMode === 'pink' ? 'rgba(254, 247, 247, 0.9)' : isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '1rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#f9fafb' : '#374151',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: themeMode === 'pink' ? '0 4px 12px rgba(236, 72, 153, 0.15)' : isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = themeMode === 'pink' ? '#ec4899' : '#3b82f6';
            e.target.style.boxShadow = themeMode === 'pink' ? '0 0 0 3px rgba(236, 72, 153, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = themeMode === 'pink' ? 'rgba(249, 168, 212, 0.3)' : isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(255, 255, 255, 0.3)';
            e.target.style.boxShadow = themeMode === 'pink' ? '0 4px 12px rgba(236, 72, 153, 0.15)' : isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
        >
          <option value="popularity">🔥 Popülerlik</option>
          <option value="price-low">💰 Fiyat (Düşük → Yüksek)</option>
          <option value="price-high">💰 Fiyat (Yüksek → Düşük)</option>
          <option value="date-new">📅 Tarih (Yeni → Eski)</option>
          <option value="date-old">📅 Tarih (Eski → Yeni)</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#6b7280'
        }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Ürünler yükleniyor...
          </h3>
          <p>Lütfen bekleyin.</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#ef4444'
        }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Bir hata oluştu
          </h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sayfayı Yenile
          </button>
        </div>
      )}

      {/* Pinterest Masonry Grid Layout */}
      {!loading && !error && (
        <div ref={gridRef} className="grid-container">
          {sortedProducts.map((product) => (
            <div key={product.id} className="grid-item">
              <ProductCard 
                product={product} 
                isFavorite={favoriteProducts.includes(product.id)}
                isLiked={likedProducts.includes(product.id)}
                onToggleFavorite={onToggleFavorite}
                onToggleLike={handleToggleLike}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Ürün bulunamadı mesajı */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#6b7280'
        }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Bu kategoride ürün bulunamadı
          </h3>
          <p>Farklı bir kategori seçmeyi deneyin.</p>
        </div>
      )}

      {/* Gelişmiş Filtreler Modal */}
      {showFilters && (
        <AdvancedFilters
          products={products}
          selectedCategory={selectedCategory}
          initialFilters={appliedFilters}
          onFiltersChange={(filters) => {
            setAppliedFilters(filters);
            setShowFilters(false);
          }}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Stats Modal */}
      {showStatsModal && selectedProduct && (
        <ProductStatsModal
          isOpen={showStatsModal}
          onClose={handleCloseStats}
          product={{
            productId: selectedProduct.id,
            title: selectedProduct.title,
            uploadDate: selectedProduct.shareDate || new Date().toISOString(),
            likes: selectedProduct.likes || 0,
            clicks: 0,
            siteVisits: 0,
            cartAdds: 0,
            views: 0,
            shares: 0
          }}
        />
      )}
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;
