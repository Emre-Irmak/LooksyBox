import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { extractOriginalLinkFromAffiliate, trackAffiliateClick } from '../utils/affiliateUtils';

const AffiliateRedirect = () => {
  const { userId, productId } = useParams<{ userId: string; productId: string }>();
  const navigate = useNavigate();
  const [, setIsRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        if (!userId || !productId) {
          setError('Geçersiz affiliate link');
          setIsRedirecting(false);
          return;
        }

        // Affiliate tıklamayı kaydet
        trackAffiliateClick(userId, parseInt(productId));

        // Orijinal linki al
        const currentUrl = window.location.href;
        const originalLink = extractOriginalLinkFromAffiliate(currentUrl);

        if (originalLink) {
          // 0.5 saniye bekle (hızlı yönlendirme)
          setTimeout(() => {
            window.location.href = originalLink;
          }, 500);
        } else {
          setError('Ürün linki bulunamadı');
          setIsRedirecting(false);
        }
      } catch (err) {
        console.error('Yönlendirme hatası:', err);
        setError('Yönlendirme sırasında bir hata oluştu');
        setIsRedirecting(false);
      }
    };

    handleRedirect();
  }, [userId, productId]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            ❌
          </div>
          <h2 style={{
            color: '#ef4444',
            marginBottom: '1rem',
            fontSize: '1.5rem'
          }}>
            Hata
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          🔗
        </div>
        <h2 style={{
          color: '#059669',
          marginBottom: '1rem',
          fontSize: '1.5rem'
        }}>
          Hızlı Yönlendirme...
        </h2>
        <p style={{
          color: '#6b7280',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Ürün sayfasına yönlendiriliyorsunuz. Sadece birkaç saniye...
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            animation: 'bounce 1s infinite'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            animation: 'bounce 1s infinite 0.1s'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            animation: 'bounce 1s infinite 0.2s'
          }}></div>
        </div>
        <p style={{
          fontSize: '0.875rem',
          color: '#9ca3af'
        }}>
          Bu işlem birkaç saniye sürebilir...
        </p>
      </div>

      <style>
        {`
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
          
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default AffiliateRedirect;
