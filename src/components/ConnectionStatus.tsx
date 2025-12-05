import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';

const ConnectionStatus: React.FC = () => {
  const { connectionStatus, reconnect } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [isReconnecting, setIsReconnecting] = React.useState(false);
  const [reconnectAttempts, setReconnectAttempts] = React.useState(0);
  const [lastError, setLastError] = React.useState<string | null>(null);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    setLastError(null);
    try {
      const success = await reconnect();
      if (success) {
        setReconnectAttempts(0);
        console.log('✅ Bağlantı başarıyla kuruldu');
      } else {
        setReconnectAttempts(prev => prev + 1);
        setLastError('Bağlantı kurulamadı');
      }
    } catch (error) {
      setReconnectAttempts(prev => prev + 1);
      setLastError('Bağlantı hatası oluştu');
      console.error('❌ Yeniden bağlanma hatası:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleForceRecovery = async () => {
    setIsReconnecting(true);
    setLastError(null);
    try {
      console.log('🚨 Manuel kurtarma başlatılıyor...');
      // Daha agresif kurtarma
      await new Promise(resolve => setTimeout(resolve, 1000));
      const success = await reconnect();
      if (success) {
        setReconnectAttempts(0);
        console.log('✅ Zorla kurtarma başarılı');
      } else {
        setReconnectAttempts(prev => prev + 1);
        setLastError('Zorla kurtarma başarısız');
      }
    } catch (error) {
      setReconnectAttempts(prev => prev + 1);
      setLastError('Zorla kurtarma hatası');
      console.error('❌ Zorla kurtarma hatası:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleNuclearOption = () => {
    console.log('💥 Sayfa yenileniyor...');
    // Cache'i temizle
    localStorage.removeItem('looksy-session');
    localStorage.removeItem('profile_' + (localStorage.getItem('looksy-session') ? JSON.parse(localStorage.getItem('looksy-session') || '{}').user?.id : ''));
    localStorage.removeItem('userData_' + (localStorage.getItem('looksy-session') ? JSON.parse(localStorage.getItem('looksy-session') || '{}').user?.id : ''));
    window.location.reload();
  };

  // Sadece gerçekten bağlantı sorunu varsa göster
  if (connectionStatus === 'connected') {
    return null; // Bağlantı varsa gösterme
  }

  // Çok sık gösterilmesini önle - sadece 5 saniyede bir güncelle
  const [showStatus, setShowStatus] = React.useState(false);
  
  React.useEffect(() => {
    if (connectionStatus === 'disconnected') {
      setShowStatus(true);
    } else if (connectionStatus === 'connected') {
      // Bağlantı kurulduğunda 2 saniye sonra gizle
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus]);

  if (!showStatus) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      background: isDarkMode 
        ? 'rgba(31, 41, 55, 0.95)' 
        : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '12px',
      padding: '1rem 1.5rem',
      border: isDarkMode 
        ? '1px solid rgba(75, 85, 99, 0.3)' 
        : '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: isDarkMode 
        ? '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
        : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      {connectionStatus === 'reconnecting' || isReconnecting ? (
        <>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{
            color: isDarkMode ? '#d1d5db' : '#374151',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Yeniden bağlanıyor...
          </span>
        </>
      ) : (
        <>
          <div style={{
            width: '12px',
            height: '12px',
            background: '#ef4444',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                color: isDarkMode ? '#d1d5db' : '#374151',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Bağlantı sorunu
              </span>
              {reconnectAttempts > 0 && (
                <span style={{
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  fontSize: '0.75rem',
                  background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  {reconnectAttempts} deneme
                </span>
              )}
            </div>
            {lastError && (
              <span style={{
                color: '#ef4444',
                fontSize: '0.75rem',
                fontStyle: 'italic'
              }}>
                {lastError}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              style={{
                padding: '0.25rem 0.75rem',
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: isReconnecting ? 'not-allowed' : 'pointer',
                opacity: isReconnecting ? 0.7 : 1,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isReconnecting) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isReconnecting) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {isReconnecting ? 'Bağlanıyor...' : 'Yeniden Bağlan'}
            </button>
            <button
              onClick={handleForceRecovery}
              disabled={isReconnecting}
              style={{
                padding: '0.25rem 0.75rem',
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: isReconnecting ? 'not-allowed' : 'pointer',
                opacity: isReconnecting ? 0.7 : 1,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isReconnecting) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isReconnecting) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {isReconnecting ? 'Kurtarılıyor...' : 'Zorla Kurtar'}
            </button>
            <button
              onClick={handleNuclearOption}
              disabled={isReconnecting}
              style={{
                padding: '0.25rem 0.75rem',
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #7c2d12 0%, #991b1b 100%)'
                  : 'linear-gradient(135deg, #7c2d12 0%, #991b1b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: isReconnecting ? 'not-allowed' : 'pointer',
                opacity: isReconnecting ? 0.7 : 1,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isReconnecting) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 45, 18, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isReconnecting) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {isReconnecting ? 'Yenileniyor...' : 'Nükleer Seçenek'}
            </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;
