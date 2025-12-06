import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { products } from '../data/products';
import AffiliateStats from './AffiliateStats';
import { supabase } from '../lib/supabase';

const AccountManagementPage: React.FC = React.memo(() => {
  const { user, profile, signOut, favorites, likedProducts, cartItems, refreshProfile, loading } = useAuth();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showLikedProducts, setShowLikedProducts] = useState(false);
  const [userStats, setUserStats] = useState({
    totalFavorites: 0,
    totalLikedProducts: 0,
    totalCartItems: 0,
    totalSharedProducts: 0,
    memberSince: '',
    lastLogin: '',
    profileCompleteness: 0
  });
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [sharedProducts, setSharedProducts] = useState<any[]>([]);
  const [showSharedProducts, setShowSharedProducts] = useState(false);
  const [loadingSharedProducts, setLoadingSharedProducts] = useState(false);
  

  // Kullanıcı istatistiklerini hesapla
  useEffect(() => {
    if (user) {
      const joinDate = new Date(user.created_at);
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
      
      // Profil tamamlanma yüzdesi hesapla
      let completeness = 0;
      if (user.email) completeness += 20;
      if (profile?.full_name) completeness += 20;
      if (profile?.phone) completeness += 20;
      if (profile?.avatar_url) completeness += 20;
      if (favorites.length > 0) completeness += 20;
      
      setUserStats({
        totalFavorites: favorites.length,
        totalLikedProducts: likedProducts.length,
        totalCartItems: cartItems.length,
        totalSharedProducts: sharedProducts.length,
        memberSince: joinDate.toLocaleDateString('tr-TR'),
        lastLogin: lastSignIn ? lastSignIn.toLocaleDateString('tr-TR') : 'Bilinmiyor',
        profileCompleteness: completeness
      });
    }
  }, [user, profile, favorites, cartItems, likedProducts, sharedProducts]);

  // Sayfa yüklendiğinde profil verilerini yenile
  useEffect(() => {
    if (user && !profile) {
      console.log('Profil verileri yenileniyor...');
      // Sadece bir kez çağır, sonsuz döngüyü önle
      const timeoutId = setTimeout(() => {
        refreshProfile();
      }, 1000); // 1 saniye bekle
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, profile, refreshProfile]);

  // Kullanıcının paylaştığı ürünleri çek
  useEffect(() => {
    const fetchSharedProducts = async () => {
      if (!user?.id) return;
      
      setLoadingSharedProducts(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Paylaşılan ürünler çekilirken hata:', error);
          setSharedProducts([]);
        } else {
          // Veritabanı verilerini Product formatına dönüştür
          const formattedProducts = (data || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            imageUrl: item.image_url,
            images: item.images || [item.image_url],
            price: item.price || undefined,
            originalPrice: item.original_price || undefined,
            discount: item.discount,
            category: item.category,
            subcategory: item.subcategory,
            description: item.description,
            store: item.store || item.brand,
            likes: item.like_count || 0,
            productLink: item.product_link || item.affiliate_url,
            shareDate: item.created_at,
            rating: item.rating || 0,
            reviews: item.review_count || 0
          }));
          setSharedProducts(formattedProducts);
        }
      } catch (error) {
        console.error('Paylaşılan ürünler çekilirken hata:', error);
        setSharedProducts([]);
      } finally {
        setLoadingSharedProducts(false);
      }
    };

    fetchSharedProducts();
  }, [user]);





  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      
      // Ek güvenlik: Tüm storage'ları manuel olarak temizle
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Cookies'leri temizle
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        });
        
      } catch (cleanupError) {
        console.warn('Manuel temizleme hatası:', cleanupError);
      }
      
      // Kısa bir bekleme ekleyelim
      setTimeout(() => {
        navigate('/');
      }, 100);
      
    } catch (error) {
      console.error('Çıkış yaparken hata:', error);
      setIsSigningOut(false);
    }
  };

  // Telefon numarası doğrulama fonksiyonu
  const validatePhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
    const phoneRegex = /^(\+90|0)?5[0-9]{9}$/;
    return phoneRegex.test(cleanPhone);
  };

  // Telefon numarası kaydetme
  const handleSavePhone = async () => {
    if (!phoneNumber.trim()) {
      setPhoneError('Telefon numarası gerekli');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError('Geçerli bir Türkiye telefon numarası girin (örn: +90 555 123 45 67)');
      return;
    }

    setIsSendingSMS(true);
    setPhoneError('');

    try {
      const cleanPhone = phoneNumber.replace(/\s/g, '').replace(/[^\d+]/g, '');
      
      const { error } = await supabase
        .from('profiles')
        .update({ phone: cleanPhone })
        .eq('id', user?.id);

      if (error) {
        setPhoneError(`Hata: ${error.message}`);
      } else {
        alert('Telefon numarası başarıyla kaydedildi!');
        setShowPhoneForm(false);
        setPhoneNumber('');
        setPhoneError('');
        await refreshProfile();
      }
    } catch (error) {
      setPhoneError('Bağlantı hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setIsSendingSMS(false);
    }
  };



  // Eğer kullanıcı giriş yapmamışsa login sayfasına yönlendir (loading tamamlandıktan sonra)
  useEffect(() => {
    // Sadece loading tamamlandıktan sonra ve kullanıcı yoksa yönlendir
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, navigate, loading]);

  // Loading durumunda çok minimal loading - neredeyse görünmez
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' 
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: '50px'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderTop: '2px solid white',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite'
        }} />
      </div>
    );
  }

  // Kullanıcı yoksa hiçbir şey render etme
  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode 
        ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' 
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundAttachment: 'fixed',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: '50px' // Navbar için boşluk
    }}>
      {/* Background Animation */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDarkMode 
          ? 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          : 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        animation: 'float 20s ease-in-out infinite'
      }} />
      
      <div style={{
        maxWidth: '800px',
        width: '100%',
        background: isDarkMode 
          ? 'rgba(31, 41, 55, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '3rem 2rem',
        boxShadow: isDarkMode 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
          : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: isDarkMode 
          ? '1px solid rgba(75, 85, 99, 0.3)' 
          : '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '3rem',
          animation: 'fadeInUp 0.8s ease-out'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            background: isDarkMode 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.3)'
          }}>
            ⚙️
                  </div>
          <h1 style={{ 
            color: isDarkMode ? '#f9fafb' : '#1f2937',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            textShadow: isDarkMode ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            Hesap Yönetimi
          </h1>
          <p style={{ 
            color: isDarkMode ? '#d1d5db' : '#6b7280',
            fontSize: '1.125rem'
          }}>
            Hesap bilgilerinizi yönetin ve ayarlarınızı düzenleyin
                    </p>
                  </div>

        {/* User Info Card */}
        <div style={{
          background: isDarkMode 
            ? 'rgba(31, 41, 55, 0.8)' 
            : 'rgba(255, 255, 255, 0.8)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          border: isDarkMode 
            ? '1px solid rgba(75, 85, 99, 0.3)' 
            : '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: isDarkMode 
            ? '0 20px 40px -12px rgba(0, 0, 0, 0.4)'
            : '0 20px 40px -12px rgba(0, 0, 0, 0.1)',
          animation: 'slideInRight 0.8s ease-out 0.2s both'
        }}>
          <h2 style={{
            color: isDarkMode ? '#f9fafb' : '#1f2937',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            Kullanıcı Bilgileri
          </h2>
          
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {/* Kullanıcı Adı */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: isDarkMode 
                ? 'rgba(55, 65, 81, 0.5)' 
                : 'rgba(249, 250, 251, 0.8)',
              borderRadius: '12px',
              border: isDarkMode 
                ? '1px solid rgba(75, 85, 99, 0.2)' 
                : '1px solid rgba(229, 231, 235, 0.5)'
            }}>
              <span style={{
                color: isDarkMode ? '#d1d5db' : '#6b7280',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                👤 Kullanıcı Adı:
              </span>
              <span style={{
                color: isDarkMode ? '#f9fafb' : '#1f2937',
                fontWeight: '600'
              }}>
                {profile?.full_name || 'Belirtilmemiş'}
              </span>
                  </div>

            {/* E-posta */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: isDarkMode 
                ? 'rgba(55, 65, 81, 0.5)' 
                : 'rgba(249, 250, 251, 0.8)',
              borderRadius: '12px',
              border: isDarkMode 
                ? '1px solid rgba(75, 85, 99, 0.2)' 
                : '1px solid rgba(229, 231, 235, 0.5)'
            }}>
              <span style={{
                color: isDarkMode ? '#d1d5db' : '#6b7280',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📧 E-posta:
              </span>
              <span style={{
                color: isDarkMode ? '#f9fafb' : '#1f2937',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}>
                {user.email}
              </span>
                  </div>

            {/* Telefon */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: isDarkMode 
                ? 'rgba(55, 65, 81, 0.5)' 
                : 'rgba(249, 250, 251, 0.8)',
              borderRadius: '12px',
              border: isDarkMode 
                ? '1px solid rgba(75, 85, 99, 0.2)' 
                : '1px solid rgba(229, 231, 235, 0.5)'
            }}>
              <span style={{
                color: isDarkMode ? '#d1d5db' : '#6b7280',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📱 Telefon:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {profile?.phone ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      color: isDarkMode ? '#10b981' : '#059669',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      ✅ {profile.phone}
                    </span>
                    <button
                      onClick={() => setShowPhoneForm(true)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'transparent',
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDarkMode ? '#374151' : '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Düzenle
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      fontWeight: '500',
                      fontSize: '0.875rem'
                    }}>
                      Belirtilmemiş
                    </span>
                    <button
                      onClick={() => setShowPhoneForm(true)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: isDarkMode 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      + Ekle
                    </button>
                </div>
                )}
              </div>
            </div>

            {/* Avatar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: isDarkMode 
                ? 'rgba(55, 65, 81, 0.5)' 
                : 'rgba(249, 250, 251, 0.8)',
              borderRadius: '12px',
              border: isDarkMode 
                ? '1px solid rgba(75, 85, 99, 0.2)' 
                : '1px solid rgba(229, 231, 235, 0.5)'
            }}>
              <span style={{
                color: isDarkMode ? '#d1d5db' : '#6b7280',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🖼️ Avatar:
              </span>
              <span style={{
                color: isDarkMode ? '#f9fafb' : '#1f2937',
                fontWeight: '600'
              }}>
                {profile?.avatar_url ? '✅ Yüklendi' : '❌ Yok'}
              </span>
            </div>

            {/* Üyelik Tarihi */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: isDarkMode 
                ? 'rgba(55, 65, 81, 0.5)' 
                : 'rgba(249, 250, 251, 0.8)',
              borderRadius: '12px',
              border: isDarkMode 
                ? '1px solid rgba(75, 85, 99, 0.2)' 
                : '1px solid rgba(229, 231, 235, 0.5)'
            }}>
              <span style={{
                color: isDarkMode ? '#d1d5db' : '#6b7280',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📅 Üyelik Tarihi:
              </span>
              <span style={{
                color: isDarkMode ? '#f9fafb' : '#1f2937',
                fontWeight: '600'
              }}>
                {userStats.memberSince}
              </span>
                    </div>

            {/* Son Giriş */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: isDarkMode 
                ? 'rgba(55, 65, 81, 0.5)' 
                : 'rgba(249, 250, 251, 0.8)',
              borderRadius: '12px',
              border: isDarkMode 
                ? '1px solid rgba(75, 85, 99, 0.2)' 
                : '1px solid rgba(229, 231, 235, 0.5)'
            }}>
              <span style={{
                color: isDarkMode ? '#d1d5db' : '#6b7280',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🕒 Son Giriş:
              </span>
              <span style={{
                color: isDarkMode ? '#f9fafb' : '#1f2937',
                fontWeight: '600'
              }}>
                {userStats.lastLogin}
              </span>
                    </div>
                  </div>
                </div>
                
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem',
          animation: 'slideInRight 0.8s ease-out 0.3s both'
        }}>
          {/* Beğenilen Ürün Sayısı */}
          <div style={{ 
            background: isDarkMode 
              ? 'rgba(31, 41, 55, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)',
            borderRadius: '15px',
            padding: '1.5rem',
            border: isDarkMode 
              ? '1px solid rgba(75, 85, 99, 0.3)' 
              : '1px solid rgba(255, 255, 255, 0.3)',
            textAlign: 'center',
            boxShadow: isDarkMode 
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onClick={() => setShowLikedProducts(!showLikedProducts)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = isDarkMode 
              ? '0 15px 35px -5px rgba(0, 0, 0, 0.4)'
              : '0 15px 35px -5px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDarkMode 
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👍</div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: isDarkMode ? '#10b981' : '#059669',
              marginBottom: '0.25rem'
            }}>
              {userStats.totalLikedProducts}
                    </div>
            <div style={{ 
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Beğenilen Ürün
            </div>
            <div style={{ 
              color: isDarkMode ? '#6b7280' : '#9ca3af',
              fontSize: '0.75rem',
              marginTop: '0.25rem',
              fontStyle: 'italic'
            }}>
              {showLikedProducts ? 'Gizlemek için tıklayın' : 'Görmek için tıklayın'}
            </div>
                </div>
                
          {/* Sepet Sayısı */}
          <div style={{ 
            background: isDarkMode 
              ? 'rgba(31, 41, 55, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)',
            borderRadius: '15px',
            padding: '1.5rem',
            border: isDarkMode 
              ? '1px solid rgba(75, 85, 99, 0.3)' 
              : '1px solid rgba(255, 255, 255, 0.3)',
            textAlign: 'center',
            boxShadow: isDarkMode 
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = isDarkMode 
              ? '0 15px 35px -5px rgba(0, 0, 0, 0.4)'
              : '0 15px 35px -5px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDarkMode 
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛒</div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: isDarkMode ? '#60a5fa' : '#3b82f6',
              marginBottom: '0.25rem'
            }}>
              {userStats.totalCartItems}
                    </div>
            <div style={{ 
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Sepet Ürünü
                    </div>
                  </div>

          {/* Profil Tamamlanma */}
          <div style={{ 
            background: isDarkMode 
              ? 'rgba(31, 41, 55, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)',
            borderRadius: '15px',
            padding: '1.5rem',
            border: isDarkMode 
              ? '1px solid rgba(75, 85, 99, 0.3)' 
              : '1px solid rgba(255, 255, 255, 0.3)',
            textAlign: 'center',
            boxShadow: isDarkMode 
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = isDarkMode 
              ? '0 15px 35px -5px rgba(0, 0, 0, 0.4)'
              : '0 15px 35px -5px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDarkMode 
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: userStats.profileCompleteness >= 80 ? '#10b981' : userStats.profileCompleteness >= 60 ? '#f59e0b' : '#ef4444',
              marginBottom: '0.25rem'
            }}>
              %{userStats.profileCompleteness}
            </div>
            <div style={{ 
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Profil Tamamlanma
                </div>
              </div>

          {/* Paylaşılan Ürünler */}
          <div style={{ 
            background: isDarkMode 
              ? 'rgba(31, 41, 55, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)',
            borderRadius: '15px',
            padding: '1.5rem',
            border: isDarkMode 
              ? '1px solid rgba(75, 85, 99, 0.3)' 
              : '1px solid rgba(255, 255, 255, 0.3)',
            textAlign: 'center',
            boxShadow: isDarkMode 
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onClick={() => setShowSharedProducts(!showSharedProducts)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = isDarkMode 
              ? '0 15px 35px -5px rgba(0, 0, 0, 0.4)'
              : '0 15px 35px -5px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDarkMode 
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛍️</div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: isDarkMode ? '#a78bfa' : '#7c3aed',
              marginBottom: '0.25rem'
            }}>
              {userStats.totalSharedProducts || 0}
            </div>
            <div style={{ 
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Paylaşılan Ürün
            </div>
            <div style={{ 
              color: isDarkMode ? '#6b7280' : '#9ca3af',
              fontSize: '0.75rem',
              marginTop: '0.25rem',
              fontStyle: 'italic'
            }}>
              {showSharedProducts ? 'Gizlemek için tıklayın' : 'Görmek için tıklayın'}
            </div>
          </div>
            </div>

        {/* Shared Products Section */}
        {showSharedProducts && (
          <div style={{ 
            marginBottom: '3rem',
            animation: 'fadeInUp 0.8s ease-out 0.4s both'
          }}>
            <h2 style={{ 
              color: isDarkMode ? '#f9fafb' : '#1f2937',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              Paylaştığım Ürünler
            </h2>
            
            {loadingSharedProducts ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                background: isDarkMode 
                  ? 'rgba(31, 41, 55, 0.5)' 
                  : 'rgba(255, 255, 255, 0.5)',
                borderRadius: '15px',
                border: isDarkMode 
                  ? '1px solid rgba(75, 85, 99, 0.3)' 
                  : '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '2px solid rgba(102, 126, 234, 0.3)',
                  borderTop: '2px solid #667eea',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }} />
                <p style={{
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  fontSize: '1rem',
                  marginTop: '1rem'
                }}>
                  Yükleniyor...
                </p>
              </div>
            ) : sharedProducts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                background: isDarkMode 
                  ? 'rgba(31, 41, 55, 0.5)' 
                  : 'rgba(255, 255, 255, 0.5)',
                borderRadius: '15px',
                border: isDarkMode 
                  ? '1px solid rgba(75, 85, 99, 0.3)' 
                  : '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  📦
                </div>
                <p style={{
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  fontSize: '1.125rem'
                }}>
                  Henüz paylaştığınız ürün yok
                </p>
                <p style={{
                  color: isDarkMode ? '#6b7280' : '#9ca3af',
                  fontSize: '0.875rem',
                  marginTop: '0.5rem'
                }}>
                  Paylaştığınız ürünler burada görünecek
                </p>
                <button
                  onClick={() => navigate('/share-product')}
                  style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem 2rem',
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  İlk Ürününü Paylaş
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {sharedProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    style={{
                      background: isDarkMode 
                        ? 'rgba(31, 41, 55, 0.8)' 
                        : 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '15px',
                      padding: '1rem',
                      border: isDarkMode 
                        ? '1px solid rgba(75, 85, 99, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = isDarkMode 
                        ? '0 15px 30px -5px rgba(0, 0, 0, 0.3)'
                        : '0 15px 30px -5px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '120px',
                      borderRadius: '10px',
                      marginBottom: '0.75rem',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: isDarkMode 
                          ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
                          : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem'
                      }}>
                        🛍️
                      </div>
                    </div>
                    <h3 style={{
                      color: isDarkMode ? '#f9fafb' : '#1f2937',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {product.title}
                    </h3>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.5rem'
                    }}>
                      <p style={{
                        color: isDarkMode ? '#60a5fa' : '#3b82f6',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        margin: 0
                      }}>
                        {product.price || 'Fiyat yok'}
                      </p>
                      {product.likes !== undefined && product.likes > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: isDarkMode ? '#ef4444' : '#dc2626',
                          fontSize: '0.75rem'
                        }}>
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          {product.likes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favorites Section */}
        {showLikedProducts && (
        <div style={{ 
          marginBottom: '3rem',
          animation: 'fadeInUp 0.8s ease-out 0.4s both'
        }}>
          <h2 style={{ 
            color: isDarkMode ? '#f9fafb' : '#1f2937',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            Beğenilenler
          </h2>
          
          {(() => {
            const likedProductsList = products.filter(product => likedProducts.includes(product.id));
            
            if (likedProductsList.length === 0) {
              return (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  background: isDarkMode 
                    ? 'rgba(31, 41, 55, 0.5)' 
                    : 'rgba(255, 255, 255, 0.5)',
                  borderRadius: '15px',
                  border: isDarkMode 
                    ? '1px solid rgba(75, 85, 99, 0.3)' 
                    : '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem'
                  }}>
                    ❤️
                  </div>
                  <p style={{
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    fontSize: '1.125rem'
                  }}>
                    Henüz beğendiğiniz ürün yok
                  </p>
                  <p style={{
                    color: isDarkMode ? '#6b7280' : '#9ca3af',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem'
                  }}>
                    Beğendiğiniz ürünler burada görünecek
                  </p>
                </div>
              );
            }

            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {likedProductsList.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      background: isDarkMode 
                        ? 'rgba(31, 41, 55, 0.8)' 
                        : 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '15px',
                      padding: '1rem',
                      border: isDarkMode 
                        ? '1px solid rgba(75, 85, 99, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = isDarkMode 
                        ? '0 15px 30px -5px rgba(0, 0, 0, 0.3)'
                        : '0 15px 30px -5px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '120px',
                      borderRadius: '10px',
                      marginBottom: '0.75rem',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        loading="lazy"
                        onError={(e) => {
                          // Resim yüklenemezse fallback göster
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: isDarkMode 
                          ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
                          : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem'
                      }}>
                        🛍️
                      </div>
                    </div>
                    <h3 style={{
                      color: isDarkMode ? '#f9fafb' : '#1f2937',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {product.title}
                    </h3>
                    <p style={{
                      color: isDarkMode ? '#60a5fa' : '#3b82f6',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      ₺{product.price}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
            </div>
        )}

        {/* Affiliate Stats */}
        <div style={{
          marginBottom: '3rem',
          animation: 'fadeInUp 0.8s ease-out 0.6s both'
        }}>
          <AffiliateStats />
                    </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gap: '1rem',
          animation: 'fadeInUp 0.8s ease-out 0.4s both'
        }}>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            style={{
              width: '100%',
              padding: '1rem',
              background: isSigningOut 
                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isSigningOut ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: isSigningOut ? 0.7 : 1,
              boxShadow: isSigningOut 
                ? 'none' 
                : '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!isSigningOut) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(239, 68, 68, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSigningOut) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(239, 68, 68, 0.4)';
              }
            }}
          >
            {isSigningOut ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Çıkış Yapılıyor...
              </>
            ) : (
              <>
                <span>🚪</span>
                Çıkış Yap
              </>
            )}
                </button>
              </div>
            </div>

      {/* Telefon Ekleme Modal */}
      {showPhoneForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: isDarkMode 
              ? 'rgba(31, 41, 55, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: isDarkMode 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: isDarkMode 
              ? '1px solid rgba(75, 85, 99, 0.3)' 
              : '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                color: isDarkMode ? '#f9fafb' : '#1f2937',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                margin: 0
              }}>
                📱 {profile?.phone ? 'Telefon Numarası Güncelle' : 'Telefon Numarası Ekle'}
              </h3>
              <button
                onClick={() => {
                  setShowPhoneForm(false);
                  setPhoneNumber('');
                  setPhoneError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            <div>
              {profile?.phone && (
                <div style={{
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  border: '1px solid #93c5fd',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📱</div>
                  <p style={{
                    color: '#1e40af',
                    fontSize: '0.875rem',
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    Mevcut telefon: <strong>{profile.phone}</strong>
                  </p>
                </div>
              )}
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isDarkMode ? '#d1d5db' : '#374151',
                  marginBottom: '0.5rem'
                }}>
                  {profile?.phone ? 'Yeni Telefon Numarası' : 'Telefon Numarası'}
                </label>
                <input
                  type="tel"
                  placeholder="+90 555 123 45 67"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
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
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {phoneError && (
                <div style={{
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#dc2626',
                  fontSize: '0.875rem'
                }}>
                  {phoneError}
                  </div>
              )}

              <button
                onClick={handleSavePhone}
                disabled={isSendingSMS}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: isSendingSMS 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isSendingSMS ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isSendingSMS ? 0.7 : 1
                }}
                >
                  {isSendingSMS ? 'Kaydediliyor...' : (profile?.phone ? 'Telefon Numarasını Güncelle' : 'Telefon Numarasını Kaydet')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AccountManagementPage.displayName = 'AccountManagementPage';

export default AccountManagementPage;