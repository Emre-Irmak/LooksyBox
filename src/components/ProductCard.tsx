import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import type { Product } from '../types/Product';

interface ProductCardProps {
  product: Product;
  isFavorite?: boolean;
  isLiked?: boolean;
  onToggleFavorite?: (productId: number) => void;
  onToggleLike?: (productId: number) => void;
  onAddToCart?: (productId: number) => void;
}

const ProductCard = React.memo(({ product, isFavorite, isLiked, onToggleFavorite, onToggleLike, onAddToCart }: ProductCardProps) => {
  const navigate = useNavigate();
  const { isDarkMode, themeMode } = useDarkMode();
  
  const handleClick = useCallback(() => {
    // Mevcut scroll pozisyonunu sakla
    localStorage.setItem('scrollPosition', window.scrollY.toString());
    navigate(`/product/${product.id}`);
  }, [navigate, product.id]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(product.id);
    }
  }, [onToggleFavorite, product.id]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product.id);
    }
  }, [onAddToCart, product.id]);
  
  return (
    <div 
      onClick={handleClick}
      style={{ 
        cursor: 'pointer',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        backgroundColor: themeMode === 'pink' ? '#fef7f7' : isDarkMode ? '#1f2937' : 'white',
        boxShadow: themeMode === 'pink' 
          ? '0 4px 6px -1px rgba(236, 72, 153, 0.2), 0 2px 4px -1px rgba(236, 72, 153, 0.1)'
          : isDarkMode 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s ease',
        marginBottom: '1rem', // Tüm ürünler için aynı dikey mesafe
        width: '100%',
        position: 'relative',
        minHeight: 'auto', // Sabit yükseklik kaldırıldı
        display: 'flex',
        flexDirection: 'column',
        border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(229, 231, 235, 0.5)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = themeMode === 'pink' 
          ? '0 10px 15px -3px rgba(236, 72, 153, 0.3), 0 4px 6px -2px rgba(236, 72, 153, 0.2)'
          : isDarkMode 
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        
        // Alt overlay (başlık ve fiyat)
        const overlay = e.currentTarget.querySelector('.product-overlay') as HTMLElement;
        if (overlay) {
          overlay.style.transform = 'translateY(0)';
          overlay.style.opacity = '1';
        }
        
        // Üst overlay (mağaza)
        const storeOverlay = e.currentTarget.querySelector('.store-overlay') as HTMLElement;
        if (storeOverlay) {
          storeOverlay.style.transform = 'translateY(0)';
          storeOverlay.style.opacity = '1';
          storeOverlay.style.pointerEvents = 'auto';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = themeMode === 'pink' 
          ? '0 4px 6px -1px rgba(236, 72, 153, 0.2), 0 2px 4px -1px rgba(236, 72, 153, 0.1)'
          : isDarkMode 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        
        // Alt overlay (başlık ve fiyat)
        const overlay = e.currentTarget.querySelector('.product-overlay') as HTMLElement;
        if (overlay) {
          overlay.style.transform = 'translateY(100%)';
          overlay.style.opacity = '0';
        }
        
        // Üst overlay (mağaza)
        const storeOverlay = e.currentTarget.querySelector('.store-overlay') as HTMLElement;
        if (storeOverlay) {
          storeOverlay.style.transform = 'translateY(-100%)';
          storeOverlay.style.opacity = '0';
          storeOverlay.style.pointerEvents = 'none';
        }
      }}
    >
      
      <img
        src={product.imageUrl}
        alt={product.title}
        style={{
          width: '100%',
          height: 'auto',
          objectFit: 'cover',
          display: 'block'
        }}
        loading="lazy"
      />

      {/* Mağaza Badge - Üstten */}
      <div 
        className="store-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: isDarkMode 
            ? 'linear-gradient(rgba(0, 0, 0, 0.9), transparent)'
            : 'linear-gradient(rgba(0, 0, 0, 0.8), transparent)',
          color: 'white',
          padding: '1rem 1rem 1.5rem 1rem',
          transform: 'translateY(-100%)',
          transition: 'all 0.3s ease',
          opacity: 0,
          pointerEvents: 'none'
        }}
      >
        <button 
          onClick={(e) => {
            console.log('Mağaza butonu tıklandı:', product.store, 'Link:', product.affiliateLink || product.productLink);
            e.preventDefault();
            e.stopPropagation();
            const linkToOpen = product.affiliateLink || product.productLink;
            if (linkToOpen) {
              console.log('Link açılıyor:', linkToOpen);
              window.open(linkToOpen, '_blank');
            } else {
              console.log('Link bulunamadı');
            }
            return false;
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 1rem',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            width: 'fit-content',
            margin: '0 auto',
            cursor: (product.affiliateLink || product.productLink) ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            pointerEvents: 'auto',
            zIndex: 20,
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
          onMouseEnter={(e) => {
            if (product.affiliateLink || product.productLink) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (product.affiliateLink || product.productLink) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <div style={{
            width: '0.75rem',
            height: '0.75rem',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '0.375rem',
              height: '0.375rem',
              backgroundColor: 'white',
              borderRadius: '50%'
            }} />
          </div>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'white'
          }}>
            {product.store || 'Trendyol'}
          </span>
          {(product.affiliateLink || product.productLink) && (
            <svg 
              width="12" 
              height="12" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              style={{ marginLeft: '0.25rem' }}
            >
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          )}
        </button>
      </div>
      
      {/* Hover Overlay - Başlık ve Fiyat */}
      <div 
        className="product-overlay"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: isDarkMode 
            ? 'linear-gradient(transparent, rgba(0, 0, 0, 0.9))'
            : 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
          color: 'white',
          padding: '1.5rem 1rem 1rem 1rem',
          transform: 'translateY(100%)',
          transition: 'all 0.3s ease',
          opacity: 0,
          pointerEvents: 'none'
        }}
      >
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.3',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {product.title}
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <span style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#fbbf24'
          }}>
            {product.price}
          </span>
          {product.originalPrice && (
            <span style={{
              fontSize: '0.875rem',
              color: '#d1d5db',
              textDecoration: 'line-through'
            }}>
              {product.originalPrice}
            </span>
          )}
          {product.discount && (
            <span style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {product.discount}
            </span>
          )}
        </div>
      </div>
      




      {/* Beğeni Sırası Numarası - Sol Üst */}
      {product.popularityRank && (
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          left: '0.5rem',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          borderRadius: '50%',
          width: '2rem',
          height: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}>
          #{product.popularityRank}
        </div>
      )}



      {/* Favori butonu */}
      {onToggleFavorite && (
        <button
          onClick={handleFavoriteClick}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '2.5rem',
            height: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            zIndex: 10,
            opacity: 0, // Başlangıçta görünmez
            transform: 'scale(0.8)' // Başlangıçta küçük
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'scale(0.8)';
          }}
        >
          <svg 
            width="20" 
            height="20" 
            fill={isFavorite ? "#10b981" : "#9ca3af"} 
            viewBox="0 0 24 24"
          >
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
        </button>
      )}

      {/* Beğeni sayısı */}
      {product.likes !== undefined && product.likes > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '0.5rem',
          left: onAddToCart ? '7rem' : '0.5rem',
          backgroundColor: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '0.25rem 0.5rem',
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          opacity: 0,
          transform: 'translateY(10px)',
          transition: 'all 0.3s ease',
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0';
          e.currentTarget.style.transform = 'translateY(10px)';
        }}
        >
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          {product.likes}
        </div>
      )}

      {/* Sepete ekle butonu */}
      {onAddToCart && (
        <button
          onClick={handleAddToCart}
          style={{
            position: 'absolute',
            bottom: '0.5rem',
            right: '0.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            opacity: 0,
            transform: 'translateY(10px)',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.opacity = '0';
            e.currentTarget.style.transform = 'translateY(10px)';
          }}
        >
          Sepete Ekle
        </button>
      )}


      {/* Kullanıcı Bilgileri */}
      {product.user && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/user/${product.user?.id}`);
          }}
          style={{
            position: 'absolute',
            bottom: '0.5rem',
            left: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 0.75rem',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            opacity: 0,
            transform: 'translateY(10px)',
            transition: 'all 0.3s ease',
            zIndex: 10,
            maxWidth: 'calc(100% - 1rem)',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0';
            e.currentTarget.style.transform = 'translateY(10px)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
          }}
        >
          <img
            src={product.user.avatar}
            alt={product.user.name}
            style={{
              width: '1.5rem',
              height: '1.5rem',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid white'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#374151',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '80px'
            }}>
              {product.user.name}
            </span>
            {product.user.verified && (
              <div style={{
                width: '0.75rem',
                height: '0.75rem',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="8" height="8" fill="white" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
