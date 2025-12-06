import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import ProductCard from './ProductCard';
import { supabase } from '../lib/supabase';
import { fetchProductsByUser } from '../utils/productService';
import type { Product } from '../types/Product';

interface User {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  email?: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const [user, setUser] = useState<User | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [sortedProducts, setSortedProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Component mount olduğunda scroll pozisyonunu sıfırla
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Kullanıcı profil bilgisini çek
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .eq('id', userId)
          .single();

        if (profileError || !profileData) {
          console.error('Kullanıcı profili bulunamadı:', profileError);
          setError('Kullanıcı bulunamadı');
          setLoading(false);
          return;
        }

        // Kullanıcı bilgisini set et
        setUser({
          id: profileData.id,
          name: profileData.full_name || profileData.email || 'Bilinmeyen Kullanıcı',
          avatar: profileData.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
          verified: true,
          email: profileData.email
        });

        // Kullanıcının paylaştığı ürünleri çek
        const products = await fetchProductsByUser(userId);
        setUserProducts(products);

      } catch (err) {
        console.error('Kullanıcı verileri yüklenirken hata:', err);
        setError('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  // Sıralama fonksiyonları
  const sortProducts = (products: any[], sortType: 'popular' | 'recent') => {
    if (sortType === 'popular') {
      return [...products].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      // Son paylaşılanlar - tarihi en yakın olan en başta
      return [...products].sort((a, b) => {
        const dateA = new Date(a.shareDate || '');
        const dateB = new Date(b.shareDate || '');
        return dateB.getTime() - dateA.getTime();
      });
    }
  };

  // Sıralama değiştiğinde ürünleri yeniden sırala
  useEffect(() => {
    if (userProducts.length > 0) {
      const sorted = sortProducts(userProducts, sortBy);
      setSortedProducts(sorted);
    }
  }, [userProducts, sortBy]);

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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '1.125rem',
        color: isDarkMode ? '#9ca3af' : '#6b7280',
        backgroundColor: isDarkMode ? '#111827' : 'transparent'
      }}>
        Yükleniyor...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4rem 2rem',
        color: isDarkMode ? '#9ca3af' : '#6b7280',
        backgroundColor: isDarkMode ? '#111827' : 'transparent',
        minHeight: '100vh'
      }}>
        <h2 style={{ color: isDarkMode ? '#f9fafb' : '#1f2937' }}>Kullanıcı bulunamadı</h2>
        <p>{error || 'Bu kullanıcı mevcut değil veya silinmiş olabilir.'}</p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .user-products-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            column-gap: 1rem;
            row-gap: 0.00000001rem;
            padding: 0;
            grid-auto-rows: 10px;
            align-items: start;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .grid-item {
            width: 100%;
            display: flex;
            flex-direction: column;
            grid-row-end: span var(--row-span, 1);
            break-inside: avoid;
          }
          
          @media (max-width: 1024px) {
            .user-products-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          
          @media (max-width: 768px) {
            .user-products-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (max-width: 480px) {
            .user-products-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
      <div style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: isDarkMode ? '#111827' : 'transparent',
        minHeight: '100vh'
      }}>
      {/* Kullanıcı Bilgileri */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        marginBottom: '2rem',
        padding: '2rem',
        backgroundColor: isDarkMode ? '#1f2937' : 'white',
        borderRadius: '1rem',
        boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb'
      }}>
        <img
          src={user.avatar}
          alt={user.name}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid #e5e7eb'
          }}
        />
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              color: isDarkMode ? '#f9fafb' : '#1f2937',
              margin: 0
            }}>
              {user.name}
            </h1>
            {user.verified && (
              <div style={{
                width: '1.5rem',
                height: '1.5rem',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}>
                <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
            )}
          </div>
          <p style={{
            fontSize: '1rem',
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            margin: 0
          }}>
            {userProducts.length} ürün paylaştı
          </p>
          {user.email && (
            <p style={{
              fontSize: '0.875rem',
              color: isDarkMode ? '#6b7280' : '#9ca3af',
              margin: '0.25rem 0 0 0'
            }}>
              {user.email}
            </p>
          )}
        </div>
      </div>

      {/* Ürünler */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: isDarkMode ? '#f9fafb' : '#1f2937',
            margin: 0
          }}>
            Paylaştığı Ürünler
          </h2>
          
          {/* Sıralama Seçenekleri */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            backgroundColor: '#f3f4f6',
            padding: '0.25rem',
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setSortBy('recent')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: sortBy === 'recent' ? '#3b82f6' : 'transparent',
                color: sortBy === 'recent' ? 'white' : '#6b7280',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (sortBy !== 'recent') {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (sortBy !== 'recent') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Son Paylaşılanlar
            </button>
            
            <button
              onClick={() => setSortBy('popular')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: sortBy === 'popular' ? '#3b82f6' : 'transparent',
                color: sortBy === 'popular' ? 'white' : '#6b7280',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (sortBy !== 'popular') {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (sortBy !== 'popular') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              En Beğenilenler
            </button>
          </div>
        </div>
        
        {userProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
            borderRadius: '0.75rem',
            border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '1.125rem', margin: 0, color: isDarkMode ? '#d1d5db' : '#6b7280' }}>
              Bu kullanıcı henüz ürün paylaşmamış.
            </p>
          </div>
        ) : (
          <div ref={gridRef} className="user-products-grid">
            {sortedProducts.map((product) => (
              <div key={product.id} className="grid-item">
                <ProductCard
                  product={product}
                  isFavorite={false}
                  onToggleFavorite={() => {}}
                  onAddToCart={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default UserProfile;
