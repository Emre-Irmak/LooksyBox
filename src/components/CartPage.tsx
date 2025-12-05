import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { productsWithUsers } from '../data/products';
import { createAffiliateLink } from '../utils/affiliateUtils';

interface CartItem {
  productId: number;
  quantity: number;
}

interface CartPageProps {
  cartItems: CartItem[];
  onRemoveFromCart: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

const CartPage: React.FC<CartPageProps> = ({ 
  cartItems, 
  onRemoveFromCart, 
  onUpdateQuantity 
}) => {
  const navigate = useNavigate();
  const { isDarkMode, themeMode } = useDarkMode();
  
  // Component mount olduğunda scroll pozisyonunu sıfırla
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cartProducts = cartItems.map(item => {
    const product = productsWithUsers.find(p => p.id === item.productId);
    return product ? { ...product, quantity: item.quantity } : null;
  }).filter(Boolean);

  const totalPrice = cartProducts.reduce((sum, product) => {
    const price = parseFloat(product!.price?.replace('₺', '').replace(',', '') || '0');
    return sum + (price * product!.quantity);
  }, 0);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (cartProducts.length === 0) {
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
              color: '#6366f1',
              marginBottom: '2rem'
            }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>image.png
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
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
              Sepetiniz boş
            </h2>
            <p style={{ 
              color: themeMode === 'pink' ? '#be185d' : '#6b7280', 
              fontSize: '1.125rem',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              Henüz sepetinizde ürün bulunmuyor. Hemen alışverişe başlayın ve favori ürünlerinizi keşfedin!
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
              backgroundColor: themeMode === 'pink' ? '#ec4899' : '#6366f1',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
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
                Sepetim
              </h1>
              <p style={{ 
                color: themeMode === 'pink' ? '#be185d' : '#6b7280', 
                fontSize: '1.125rem',
                margin: '0.5rem 0 0 0'
              }}>
                {totalItems} ürün sepetinizde
              </p>
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Sepet Ürünleri */}
          <div>
            <div style={{ 
              backgroundColor: themeMode === 'pink' ? 'rgba(254, 247, 247, 0.95)' : isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderRadius: '1.5rem', 
              boxShadow: themeMode === 'pink' ? '0 20px 40px -10px rgba(236, 72, 153, 0.2)' : isDarkMode ? '0 20px 40px -10px rgba(0, 0, 0, 0.3)' : '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              overflow: 'hidden',
              border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : '1px solid rgba(229, 231, 235, 0.5)',
                background: themeMode === 'pink' 
                  ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
                  </svg>
                  Sepet Ürünleri
                </h2>
              </div>
              <div>
                {cartProducts.map((product, index) => (
                  <div 
                    key={product!.id} 
                    onClick={() => navigate(`/product/${product!.id}`)}
                    style={{ 
                      padding: '2rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1.5rem', 
                      borderBottom: index < cartProducts.length - 1 
                        ? (themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(229, 231, 235, 0.5)') 
                        : 'none',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = themeMode === 'pink' ? 'rgba(236, 72, 153, 0.1)' : isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(99, 102, 241, 0.05)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = themeMode === 'pink' ? '0 10px 25px -5px rgba(236, 72, 153, 0.2)' : isDarkMode ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ 
                      flexShrink: 0,
                      position: 'relative'
                    }}>
                      <img
                        src={product!.imageUrl}
                        alt={product!.title}
                        style={{ 
                          height: '6rem', 
                          width: '6rem', 
                          objectFit: 'cover', 
                          borderRadius: '1rem',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      {product!.discount && (
                        <div style={{
                          position: 'absolute',
                          top: '-0.5rem',
                          right: '-0.5rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                          {product!.discount}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '600', 
                        color: isDarkMode ? '#f9fafb' : '#111827', 
                        marginBottom: '0.5rem',
                        lineHeight: '1.4'
                      }}>
                        {product!.title}
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: isDarkMode ? '#d1d5db' : '#6b7280', 
                        marginBottom: '1rem',
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {product!.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: 'bold', 
                          color: isDarkMode ? '#60a5fa' : '#6366f1'
                        }}>
                          {product!.price}
                        </span>
                        {product!.originalPrice && (
                          <span style={{ 
                            fontSize: '1rem', 
                            color: isDarkMode ? '#6b7280' : '#9ca3af',
                            textDecoration: 'line-through'
                          }}>
                            {product!.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      {/* Miktar Kontrolü */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem',
                        backgroundColor: isDarkMode ? '#374151' : '#f8fafc',
                        padding: '0.5rem',
                        borderRadius: '1rem',
                        border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e2e8f0'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateQuantity(product!.id, product!.quantity - 1);
                          }}
                          style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            backgroundColor: isDarkMode ? '#3b82f6' : '#6366f1',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#4f46e5';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#6366f1';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <svg style={{ height: '1rem', width: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '600', 
                          color: isDarkMode ? '#f9fafb' : '#111827', 
                          minWidth: '2rem', 
                          textAlign: 'center'
                        }}>
                          {product!.quantity}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateQuantity(product!.id, product!.quantity + 1);
                          }}
                          style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            backgroundColor: isDarkMode ? '#3b82f6' : '#6366f1',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#4f46e5';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#6366f1';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <svg style={{ height: '1rem', width: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Sil Butonu */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromCart(product!.id);
                        }}
                        style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '50%',
                          backgroundColor: isDarkMode ? '#374151' : '#fef2f2',
                          color: isDarkMode ? '#fca5a5' : '#dc2626',
                          border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #fecaca',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#fef2f2';
                          e.currentTarget.style.color = isDarkMode ? '#fca5a5' : '#dc2626';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <svg style={{ height: '1rem', width: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      
                      {/* Siteye Git Butonu */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginTop: '0.5rem'
                      }}>
                        {(product!.productLink || product!.affiliateLink) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Affiliate link varsa onu kullan, yoksa yeni oluştur
                              let linkToOpen = product!.affiliateLink;
                              if (!linkToOpen && product!.productLink) {
                                linkToOpen = createAffiliateLink(product!.productLink, product!.id);
                              }
                              if (linkToOpen) {
                                window.open(linkToOpen, '_blank');
                              }
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              minWidth: '120px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#2563eb';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b82f6';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                            Siteye Git
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sipariş Özeti */}
          <div>
            <div style={{ 
              backgroundColor: themeMode === 'pink' ? 'rgba(254, 247, 247, 0.95)' : isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderRadius: '1.5rem', 
              boxShadow: themeMode === 'pink' ? '0 20px 40px -10px rgba(236, 72, 153, 0.2)' : isDarkMode ? '0 20px 40px -10px rgba(0, 0, 0, 0.3)' : '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              position: 'sticky', 
              top: '2rem',
              overflow: 'hidden',
              border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ 
                padding: '2rem', 
                borderBottom: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : '1px solid rgba(229, 231, 235, 0.5)',
                background: themeMode === 'pink' 
                  ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Sipariş Özeti
                </h2>
              </div>
              <div style={{ padding: '2rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem 0',
                  borderBottom: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #f1f5f9'
                }}>
                  <span style={{ fontSize: '1rem', color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#9ca3af' : '#64748b', fontWeight: '500' }}>Ürün Sayısı:</span>
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#111827' }}>{totalItems}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem 0',
                  borderBottom: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #f1f5f9'
                }}>
                  <span style={{ fontSize: '1rem', color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#9ca3af' : '#64748b', fontWeight: '500' }}>Kargo:</span>
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: themeMode === 'pink' ? '#10b981' : isDarkMode ? '#10b981' : '#059669' }}>Ücretsiz</span>
                </div>
                <div style={{ 
                  padding: '1.5rem 0',
                  borderTop: themeMode === 'pink' ? '2px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '2px solid rgba(75, 85, 99, 0.3)' : '2px solid #e2e8f0',
                  marginTop: '1rem'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    color: isDarkMode ? '#f9fafb' : '#111827'
                  }}>
                    <span>Toplam:</span>
                    <span style={{
                      background: themeMode === 'pink' 
                        ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      ₺{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <button style={{
                  width: '100%',
                  marginTop: '2rem',
                  background: themeMode === 'pink' 
                    ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '1rem 2rem',
                  borderRadius: '1rem',
                  fontWeight: '600',
                  fontSize: '1.125rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: themeMode === 'pink' ? '0 10px 25px -5px rgba(236, 72, 153, 0.4)' : '0 10px 25px -5px rgba(102, 126, 234, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = themeMode === 'pink' 
                    ? '0 20px 40px -5px rgba(236, 72, 153, 0.6)' 
                    : isDarkMode 
                    ? '0 20px 40px -5px rgba(102, 126, 234, 0.8)' 
                    : '0 20px 40px -5px rgba(102, 126, 234, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = themeMode === 'pink' 
                    ? '0 10px 25px -5px rgba(236, 72, 153, 0.4)' 
                    : isDarkMode 
                    ? '0 10px 25px -5px rgba(102, 126, 234, 0.6)' 
                    : '0 10px 25px -5px rgba(102, 126, 234, 0.4)';
                }}
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
                  </svg>
                  Siparişi Tamamla
                </button>
                <Link 
                  to="/" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: 'auto',
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    textAlign: 'center',
                    color: themeMode === 'pink' ? '#ec4899' : '#6366f1',
                    fontWeight: '600',
                    fontSize: '1.125rem',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    borderRadius: '0.5rem',
                    border: '2px solid #e2e8f0',
                    alignSelf: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#6366f1';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                  Alışverişe Devam Et
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
