import { useState, useEffect } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface ProductStats {
  productId: number;
  title: string;
  uploadDate: string;
  likes: number;
  clicks: number;
  siteVisits: number;
  cartAdds: number;
  views: number;
  shares: number;
}

interface ProductStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductStats | null;
}

const ProductStatsModal = ({ isOpen, onClose, product }: ProductStatsModalProps) => {
  const { isDarkMode } = useDarkMode();
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  useEffect(() => {
    if (product && isOpen) {
      // Rastgele istatistikler oluştur (her açılışta aynı olması için productId kullan)
      const generateRandomStats = (productId: number) => {
        // Deterministik rastgele sayı üretici (aynı productId için aynı sonuç)
        const seed = productId * 12345;
        const random = (seed: number) => {
          const x = Math.sin(seed) * 10000;
          return x - Math.floor(x);
        };
        
        return {
          clicks: Math.floor(random(seed) * 50) + 10,
          siteVisits: Math.floor(random(seed + 1) * 100) + 20,
          cartAdds: Math.floor(random(seed + 2) * 30) + 5,
          views: Math.floor(random(seed + 3) * 200) + 50,
          shares: Math.floor(random(seed + 4) * 20) + 2
        };
      };
      
      const randomStats = generateRandomStats(product.productId);
      setStats({
        ...product,
        ...randomStats
      });
    }
  }, [product, isOpen]);

  if (!isOpen || !stats) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUploadDaysAgo = (dateString: string) => {
    const uploadDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - uploadDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const uploadDaysAgo = getUploadDaysAgo(stats.uploadDate);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: isDarkMode ? '#1f2937' : 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f9fafb' : '#111827'
            }}>
              📊 Ürün İstatistikleri
            </h2>
            <p style={{
              margin: '0.5rem 0 0 0',
              fontSize: '0.875rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              {stats.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              padding: '0.5rem',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6';
              e.currentTarget.style.color = isDarkMode ? '#f9fafb' : '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = isDarkMode ? '#9ca3af' : '#6b7280';
            }}
          >
            ×
          </button>
        </div>

        {/* İstatistik Kartları */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {/* Yüklenme Tarihi */}
          <div style={{
            backgroundColor: isDarkMode ? '#374151' : '#f8fafc',
            padding: '1rem',
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>
              📅
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f9fafb' : '#111827',
              marginBottom: '0.25rem'
            }}>
              {uploadDaysAgo} gün
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              önce yüklendi
            </div>
          </div>

          {/* Beğeni Sayısı */}
          <div style={{
            backgroundColor: isDarkMode ? '#374151' : '#fef2f2',
            padding: '1rem',
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#fecaca'}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>
              ❤️
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f9fafb' : '#dc2626',
              marginBottom: '0.25rem'
            }}>
              {stats.likes}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              beğeni
            </div>
          </div>

          {/* Tıklanma Sayısı */}
          <div style={{
            backgroundColor: isDarkMode ? '#374151' : '#eff6ff',
            padding: '1rem',
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#bfdbfe'}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>
              👆
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f9fafb' : '#2563eb',
              marginBottom: '0.25rem'
            }}>
              {stats.clicks}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              tıklama
            </div>
          </div>

          {/* Site Ziyareti */}
          <div style={{
            backgroundColor: isDarkMode ? '#374151' : '#f0fdf4',
            padding: '1rem',
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#bbf7d0'}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>
              🌐
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f9fafb' : '#16a34a',
              marginBottom: '0.25rem'
            }}>
              {stats.siteVisits}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              site ziyareti
            </div>
          </div>

          {/* Sepete Eklenme */}
          <div style={{
            backgroundColor: isDarkMode ? '#374151' : '#fefce8',
            padding: '1rem',
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#fde047'}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>
              🛒
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f9fafb' : '#ca8a04',
              marginBottom: '0.25rem'
            }}>
              {stats.cartAdds}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              sepete eklendi
            </div>
          </div>

          {/* Görüntülenme */}
          <div style={{
            backgroundColor: isDarkMode ? '#374151' : '#f3e8ff',
            padding: '1rem',
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#d8b4fe'}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>
              👁️
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: isDarkMode ? '#f9fafb' : '#9333ea',
              marginBottom: '0.25rem'
            }}>
              {stats.views}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              görüntülenme
            </div>
          </div>
        </div>

        {/* Detaylı Bilgiler */}
        <div style={{
          backgroundColor: isDarkMode ? '#374151' : '#f8fafc',
          padding: '1.5rem',
          borderRadius: '12px',
          border: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: isDarkMode ? '#f9fafb' : '#111827'
          }}>
            📈 Detaylı Analiz
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <div style={{
                fontSize: '0.875rem',
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                marginBottom: '0.25rem'
              }}>
                Yüklenme Tarihi
              </div>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isDarkMode ? '#f9fafb' : '#111827'
              }}>
                {formatDate(stats.uploadDate)}
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '0.875rem',
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                Ürün Skoru
                <button
                  onClick={() => setShowScoreInfo(!showScoreInfo)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Skor hesaplama formülü"
                >
                  <svg width="14" height="14" fill={isDarkMode ? '#9ca3af' : '#6b7280'} viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                </button>
              </div>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#f9fafb' : '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {(() => {
                  // Ürün skoru hesaplama: (Tıklanma + Sepete eklenme + Beğeni x2 + Site ziyareti x3) / Geçen gün sayısı
                  const daysSinceUpload = uploadDaysAgo;
                  const score = daysSinceUpload > 0 
                    ? ((stats.clicks + stats.cartAdds + (stats.likes * 2) + (stats.siteVisits * 3)) / daysSinceUpload)
                    : 0;
                  
                  // Skor renk belirleme
                  let scoreColor = '#6b7280'; // Varsayılan gri
                  if (score >= 50) scoreColor = '#16a34a'; // Yeşil - çok iyi
                  else if (score >= 25) scoreColor = '#ca8a04'; // Sarı - iyi
                  else if (score >= 10) scoreColor = '#dc2626'; // Kırmızı - orta
                  
                  return (
                    <>
                      <span style={{ color: scoreColor }}>
                        {score.toFixed(1)}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: isDarkMode ? '#9ca3af' : '#6b7280'
                      }}>
                        puan
                      </span>
                    </>
                  );
                })()}
              </div>
              
              {/* Skor Açıklaması */}
              {showScoreInfo && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: isDarkMode ? '#374151' : '#f8fafc',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#4b5563' : '#e2e8f0'}`,
                  fontSize: '0.8rem',
                  lineHeight: '1.5'
                }}>
                  <div style={{
                    fontWeight: '600',
                    color: isDarkMode ? '#f9fafb' : '#111827',
                    marginBottom: '0.5rem'
                  }}>
                    📊 Skor Hesaplama Formülü:
                  </div>
                  <div style={{
                    color: isDarkMode ? '#d1d5db' : '#6b7280',
                    marginBottom: '0.5rem'
                  }}>
                    <strong>(Tıklanma + Sepete eklenme + Beğeni × 2 + Site ziyareti × 3) ÷ Geçen gün sayısı</strong>
                  </div>
                  <div style={{
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    fontSize: '0.75rem'
                  }}>
                    • <strong>Tıklanma:</strong> 1x ağırlık<br/>
                    • <strong>Sepete eklenme:</strong> 1x ağırlık<br/>
                    • <strong>Beğeni:</strong> 2x ağırlık<br/>
                    • <strong>Site ziyareti:</strong> 3x ağırlık<br/>
                    • <strong>Zaman faktörü:</strong> Günlük ortalama hesaplama
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: isDarkMode ? '#4b5563' : '#6b7280',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#6b7280' : '#4b5563';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#4b5563' : '#6b7280';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductStatsModal;
