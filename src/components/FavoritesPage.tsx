import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { products } from '../data/products';
import FavoriteProductCard from './FavoriteProductCard';

interface FavoritesPageProps {
  favoriteProducts: number[];
  likedProducts: number[];
  onToggleFavorite: (productId: number) => void;
  onToggleLike?: (productId: number) => void;
  onAddToCart?: (productId: number) => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ 
  favoriteProducts, 
  likedProducts,
  onToggleFavorite,
  onToggleLike,
  onAddToCart
}) => {
  const { isDarkMode, themeMode } = useDarkMode();
  
  // Component mount olduğunda scroll pozisyonunu sıfırla
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const savedProductsList = products.filter(product => 
    favoriteProducts.includes(product.id)
  );

  if (savedProductsList.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: themeMode === 'pink' 
          ? 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)'
          : isDarkMode 
          ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            backgroundColor: themeMode === 'pink' ? 'rgba(254, 247, 247, 0.95)' : isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '2rem',
            padding: '3rem 2rem',
            boxShadow: themeMode === 'pink' ? '0 25px 50px -12px rgba(236, 72, 153, 0.3)' : isDarkMode ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(10px)',
            border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ 
              margin: '0 auto', 
              height: '8rem', 
              width: '8rem', 
              color: themeMode === 'pink' ? '#ec4899' : '#ef4444',
              marginBottom: '2rem'
            }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937', 
              marginBottom: '1rem',
              background: themeMode === 'pink' 
                ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Kaydedilen ürün yok
            </h2>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1.125rem',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              Henüz kaydettiğiniz ürün bulunmuyor. Kaydettiğiniz ürünler burada görünecek!
            </p>
            <Link 
              to="/" 
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
                boxShadow: '0 10px 25px -5px rgba(102, 126, 234, 0.4)'
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
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Alışverişe Başla
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: themeMode === 'pink' 
        ? 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)'
        : isDarkMode 
        ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2rem 0'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '3rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: themeMode === 'pink' ? 'rgba(254, 247, 247, 0.9)' : isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            padding: '1.5rem 2rem',
            borderRadius: '2rem',
            boxShadow: themeMode === 'pink' ? '0 10px 25px -5px rgba(236, 72, 153, 0.2)' : isDarkMode ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0
              }}>
                Kaydedilenler
              </h1>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '1.125rem',
                margin: '0.5rem 0 0 0'
              }}>
                {savedProductsList.length} ürün kaydedildi
              </p>
            </div>
          </div>
        </div>

        {/* Ürünler Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {savedProductsList.map((product) => (
            <div key={product.id} style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '1.5rem',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              width: '100%',
              maxWidth: '320px',
              justifySelf: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 25px 50px -10px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.1)';
            }}
            >
              <FavoriteProductCard
                product={product}
                isFavorite={favoriteProducts.includes(product.id)}
                isLiked={likedProducts.includes(product.id)}
                onToggleFavorite={onToggleFavorite}
                onToggleLike={onToggleLike}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>

        {/* Alt Bilgi */}
        <div style={{
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '2rem',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '1rem',
            margin: 0
          }}>
            💾 Kaydettiğiniz ürünleri burada görebilir ve istediğiniz zaman sepete ekleyebilirsiniz
          </p>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;
