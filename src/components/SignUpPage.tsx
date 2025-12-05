import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Form validasyonu
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      
      if (error) {
        setError(error.message || 'Kayıt olurken bir hata oluştu');
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError('Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
        marginLeft: '50px' // Navbar için boşluk
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '3rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white',
            fontWeight: 'bold'
          }}>
            ✓
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Kayıt Başarılı!
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: '1rem',
            marginBottom: '1rem'
          }}>
            E-posta adresinize doğrulama linki gönderildi. Lütfen e-postanızı kontrol edin.
          </p>
          <p style={{
            color: '#9ca3af',
            fontSize: '0.875rem'
          }}>
            Giriş sayfasına yönlendiriliyorsunuz...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      marginLeft: '50px' // Navbar için boşluk
    }}>
      {/* Background Animation */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        animation: 'float 20s ease-in-out infinite'
      }} />
      
      <div style={{
        maxWidth: '450px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '3rem 2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white',
            fontWeight: 'bold'
          }}>
            L
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            Hesap Oluştur
          </h2>
          <p style={{
            color: '#6b7280',
            margin: '0.5rem 0 0',
            fontSize: '1rem'
          }}>
            Looksy'ye katılın
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="fullName" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Ad Soyad
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="Adınız ve soyadınız"
              value={formData.fullName}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none',
                background: '#f9fafb'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#f093fb';
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240, 147, 251, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              E-posta Adresi
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="ornek@email.com"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none',
                background: '#f9fafb'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#f093fb';
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240, 147, 251, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none',
                background: '#f9fafb'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#f093fb';
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240, 147, 251, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label htmlFor="confirmPassword" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Şifre Tekrar
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                outline: 'none',
                background: '#f9fafb'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#f093fb';
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240, 147, 251, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                background: '#ef4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                !
              </div>
              <div>
                <h4 style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#dc2626'
                }}>
                  Kayıt Hatası
                </h4>
                <p style={{
                  margin: '0.25rem 0 0',
                  fontSize: '0.875rem',
                  color: '#b91c1c'
                }}>
                  {error}
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading 
                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: loading ? 0.7 : 1,
              boxShadow: loading 
                ? 'none' 
                : '0 10px 25px -5px rgba(240, 147, 251, 0.4)',
              transform: loading ? 'none' : 'translateY(0)',
              marginBottom: '1.5rem'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(240, 147, 251, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(240, 147, 251, 0.4)';
              }
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Kayıt Olunuyor...
              </div>
            ) : (
              'Hesap Oluştur'
            )}
          </button>

          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ color: '#6b7280', margin: '0 0 1rem', fontSize: '0.875rem' }}>
              Zaten hesabınız var mı?{' '}
              <Link
                to="/login"
                style={{
                  color: '#f093fb',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'color 0.3s ease',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  display: 'inline-block',
                  background: 'rgba(240, 147, 251, 0.1)',
                  border: '1px solid rgba(240, 147, 251, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f5576c';
                  e.currentTarget.style.background = 'rgba(240, 147, 251, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#f093fb';
                  e.currentTarget.style.background = 'rgba(240, 147, 251, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Giriş Yap
              </Link>
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link
              to="/"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              Ana sayfaya dön
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;
