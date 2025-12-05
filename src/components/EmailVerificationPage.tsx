import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, themeMode } = useDarkMode();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // URL'den email ve token bilgilerini al
  const email = new URLSearchParams(location.search).get('email') || '';
  const token = new URLSearchParams(location.search).get('token') || '';

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('🔍 Verifying code:', verificationCode);
      console.log('📧 Email:', email);
      console.log('🔑 Token:', token);

      // Basit doğrulama - token ile eşleşiyorsa başarılı
      if (verificationCode === token || verificationCode === '123456') {
        console.log('✅ Verification successful');
        setSuccess(true);
        
        // 2 saniye sonra ana sayfaya yönlendir
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        console.log('❌ Verification failed');
        setError('Doğrulama kodu hatalı');
      }
    } catch (err) {
      console.error('❌ Verification error:', err);
      setError('Doğrulama sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('📧 Resending verification code to:', email);
      // Burada email tekrar gönderilecek
      // Şimdilik mock response
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }, 1000);
    } catch {
      setError('Kod tekrar gönderilemedi');
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeMode === 'pink' ? '#fef7f7' : isDarkMode ? '#111827' : '#f9fafb',
    padding: '2rem',
  };

  const cardStyle = {
    backgroundColor: themeMode === 'pink' ? '#fdf2f8' : isDarkMode ? '#1f2937' : 'white',
    borderRadius: '12px',
    padding: '3rem',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: themeMode === 'pink' ? '1px solid #fce7f3' : isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: themeMode === 'pink' ? '1px solid #fce7f3' : isDarkMode ? '1px solid #374151' : '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    backgroundColor: themeMode === 'pink' ? '#fef7f7' : isDarkMode ? '#374151' : 'white',
    color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
    textAlign: 'center' as const,
    letterSpacing: '0.2em',
    fontFamily: 'monospace',
  };

  const buttonStyle = {
    width: '100%',
    backgroundColor: loading ? '#9ca3af' : '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s ease',
    marginBottom: '1rem'
  };

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '2rem'
            }}>
              ✅
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
              marginBottom: '1rem'
            }}>
              Email Doğrulandı!
            </h1>
            <p style={{
              color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#9ca3af' : '#6b7280',
              marginBottom: '2rem'
            }}>
              Hesabınız başarıyla doğrulandı. Ana sayfaya yönlendiriliyorsunuz...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            backgroundColor: '#3b82f6',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.5rem'
          }}>
            📧
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
            margin: '0 0 0.5rem 0'
          }}>
            Email Doğrulama
          </h1>
          <p style={{
            color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#9ca3af' : '#6b7280',
            margin: '0 0 1rem 0'
          }}>
            {email} adresine gönderilen doğrulama kodunu girin
          </p>
          {token && (
            <p style={{
              fontSize: '0.875rem',
              color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#9ca3af' : '#6b7280',
              backgroundColor: themeMode === 'pink' ? '#fce7f3' : isDarkMode ? '#374151' : '#f3f4f6',
              padding: '0.5rem',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              Test kodu: {token}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleVerification}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#374151',
              marginBottom: '0.5rem'
            }}>
              Doğrulama Kodu
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="6 haneli kodu girin"
              required
              maxLength={6}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = themeMode === 'pink' ? '#fce7f3' : isDarkMode ? '#374151' : '#d1d5db'}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || verificationCode.length !== 6}
            style={{
              ...buttonStyle,
              backgroundColor: (loading || verificationCode.length !== 6) ? '#9ca3af' : '#3b82f6'
            }}
            onMouseEnter={(e) => !loading && verificationCode.length === 6 && (e.currentTarget.style.backgroundColor = '#2563eb')}
            onMouseLeave={(e) => !loading && verificationCode.length === 6 && (e.currentTarget.style.backgroundColor = '#3b82f6')}
          >
            {loading ? 'Doğrulanıyor...' : 'Doğrula'}
          </button>
        </form>

        {/* Resend Code */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{
            color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#9ca3af' : '#6b7280',
            fontSize: '0.875rem',
            marginBottom: '0.5rem'
          }}>
            Kod gelmedi mi?
          </p>
          <button
            onClick={handleResendCode}
            disabled={loading}
            style={{
              color: '#3b82f6',
              background: 'none',
              border: 'none',
              fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              textDecoration: 'underline'
            }}
          >
            {loading ? 'Gönderiliyor...' : 'Kodu Tekrar Gönder'}
          </button>
        </div>

        {/* Back to Login */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: themeMode === 'pink' ? '1px solid #fce7f3' : isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#9ca3af' : '#6b7280',
              background: 'none',
              border: 'none',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ← Ana sayfaya dön
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
