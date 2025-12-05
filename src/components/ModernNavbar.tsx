import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import logoImage from '../assets/LooksyLogo.png';
import NavbarButton from './NavbarButton';
import SearchBar from './SearchBar';

interface ModernNavbarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  favoriteProducts?: number[];
  cartItems?: {productId: number, quantity: number}[];
  onLogoClick?: () => void;
  user?: any;
}

const ModernNavbar = React.memo(({ selectedCategory, onCategoryChange, favoriteProducts = [], cartItems = [], onLogoClick, user }: ModernNavbarProps) => {
  const navigate = useNavigate();
  const { isDarkMode, themeMode, toggleDarkMode } = useDarkMode();
  const [showCategories, setShowCategories] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Detaylı kategoriler
  const categories = [
    { id: 'all', name: 'Tümü', icon: '🏠', subcategories: [] },
    { 
      id: 'Kadın Giyim', 
      name: 'Kadın', 
      icon: '👗', 
      subcategories: [
        { id: 'Elbise', name: 'Elbise' },
        { id: 'Üst Giyim', name: 'Üst Giyim' },
        { id: 'Alt Giyim', name: 'Alt Giyim' },
        { id: 'Ayakkabı', name: 'Ayakkabı' },
        { id: 'Çanta', name: 'Çanta' },
        { id: 'Aksesuar', name: 'Aksesuar' }
      ]
    },
    { 
      id: 'Erkek Giyim', 
      name: 'Erkek', 
      icon: '👔', 
      subcategories: [
        { id: 'Üst Giyim', name: 'Üst Giyim' },
        { id: 'Alt Giyim', name: 'Alt Giyim' },
        { id: 'Ayakkabı', name: 'Ayakkabı' },
        { id: 'Aksesuar', name: 'Aksesuar' },
        { id: 'Saat', name: 'Saat' }
      ]
    },
    { 
      id: 'Anne & Çocuk', 
      name: 'Anne & Çocuk', 
      icon: '👶', 
      subcategories: [
        { id: 'Bebek Giyim', name: 'Bebek Giyim' },
        { id: 'Çocuk Giyim', name: 'Çocuk Giyim' },
        { id: 'Hamile Giyim', name: 'Hamile Giyim' }
      ]
    },
    { 
      id: 'Ev & Yaşam', 
      name: 'Ev & Yaşam', 
      icon: '🏠', 
      subcategories: [
        { id: 'Mobilya', name: 'Mobilya' },
        { id: 'Dekorasyon', name: 'Dekorasyon' },
        { id: 'Mutfak', name: 'Mutfak' },
        { id: 'Banyo', name: 'Banyo' }
      ]
    },
    { 
      id: 'Süpermarket', 
      name: 'Süpermarket', 
      icon: '🛒', 
      subcategories: [
        { id: 'Gıda', name: 'Gıda' },
        { id: 'İçecek', name: 'İçecek' },
        { id: 'Temizlik', name: 'Temizlik' },
        { id: 'Kişisel Bakım', name: 'Kişisel Bakım' }
      ]
    },
    { 
      id: 'Elektronik', 
      name: 'Elektronik', 
      icon: '📱', 
      subcategories: [
        { id: 'Telefon & Tablet', name: 'Telefon & Tablet' },
        { id: 'Bilgisayar', name: 'Bilgisayar' },
        { id: 'TV & Ses', name: 'TV & Ses' },
        { id: 'Küçük Ev Aletleri', name: 'Küçük Ev Aletleri' }
      ]
    },
    { 
      id: 'Spor & Outdoor', 
      name: 'Spor & Outdoor', 
      icon: '⚽', 
      subcategories: [
        { id: 'Spor Giyim', name: 'Spor Giyim' },
        { id: 'Fitness', name: 'Fitness' },
        { id: 'Outdoor', name: 'Outdoor' },
        { id: 'Spor Malzemeleri', name: 'Spor Malzemeleri' }
      ]
    }
  ];


  const totalCartItems = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.quantity, 0), 
    [cartItems]
  );

  // Click outside to close categories
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setShowCategories(false);
        setExpandedCategories([]);
      }
    };

    if (showCategories) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategories]);

  const toggleCategoryExpansion = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      // Eğer bu kategori zaten açıksa, kapat
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      // Değilse, sadece bu kategoriyi aç (diğerlerini kapat)
      return [categoryId];
    });
  }, []);

  // Memoized styles
  const sidebarStyle = useMemo(() => ({
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '50px',
    height: '100vh',
    background: themeMode === 'pink' 
      ? 'linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%)'
      : isDarkMode 
      ? 'linear-gradient(180deg, #1f2937 0%, #111827 100%)'
      : 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '0.75rem 0',
    gap: '0.75rem',
    zIndex: 1000,
    boxShadow: themeMode === 'pink'
      ? '4px 0 20px rgba(236, 72, 153, 0.15)'
      : isDarkMode 
      ? '4px 0 20px rgba(0, 0, 0, 0.3)'
      : '4px 0 20px rgba(0, 0, 0, 0.08)',
    borderRight: themeMode === 'pink'
      ? '1px solid #f9a8d4'
      : isDarkMode 
      ? '1px solid rgba(75, 85, 99, 0.3)'
      : '1px solid rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-start' as const,
    transition: 'all 0.3s ease'
  }), [themeMode, isDarkMode]);

  const topNavbarStyle = useMemo(() => ({
    position: 'fixed' as const,
    top: 0,
    left: '50px',
    right: '8px',
    height: '60px',
    backgroundColor: themeMode === 'pink' ? '#fef7f7' : isDarkMode ? '#1f2937' : 'white',
    borderBottom: themeMode === 'pink' ? '1px solid #f9a8d4' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    padding: '0 0 0 1rem',
    gap: '1rem',
    zIndex: 999,
    transition: 'all 0.3s ease'
  }), [themeMode, isDarkMode]);

  return (
    <>
      <style>
        {`
          .tooltip-container:hover .tooltip {
            opacity: 1 !important;
            visibility: visible !important;
          }
        `}
      </style>
      {/* Sol Dikey Sidebar - Modern tasarım */}
      <div style={sidebarStyle}>
        {/* Looksy Logo */}
        <div 
          onClick={() => {
            if (onLogoClick) {
              onLogoClick();
            } else {
              navigate('/');
              window.location.reload();
            }
          }}
          style={{ 
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}>
          <img 
            src={logoImage} 
            alt="Looksy Logo" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Üst Butonlar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Ana Sayfa */}
          <NavbarButton
            onClick={() => {
              console.log('🏠 Ana sayfa simgesi tıklandı!');
              onCategoryChange('all');
              console.log('📝 onCategoryChange("all") çağrıldı');
              navigate('/');
              setTimeout(() => {
                const savedPosition = localStorage.getItem('scrollPosition');
                if (savedPosition) {
                  window.scrollTo(0, parseInt(savedPosition));
                  localStorage.removeItem('scrollPosition');
                }
              }, 100);
            }}
            icon={
              <svg width="24" height="24" fill={themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#374151'} viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            }
            tooltip="Ana Sayfa"
            themeMode={themeMode}
            isDarkMode={isDarkMode}
          />

        {/* Arama */}
        <NavbarButton
          onClick={() => {
            // Arama çubuğuna odaklan - bu SearchBar component'inde handle edilecek
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
          }}
          icon={
            <svg width="24" height="24" fill={themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#374151'} viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          }
          tooltip="Arama"
          themeMode={themeMode}
          isDarkMode={isDarkMode}
        />

        {/* Kategoriler */}
        <NavbarButton
          onClick={() => setShowCategories(!showCategories)}
          icon={
            <svg width="24" height="24" fill={themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#374151'} viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          }
          tooltip="Kategoriler"
          isActive={showCategories}
          themeMode={themeMode}
          isDarkMode={isDarkMode}
        />

        {/* Ürün Paylaş */}
        <div style={{ position: 'relative' }} className="tooltip-container">
          <button 
            onClick={() => navigate('/share-product')}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="20" fill={themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#374151'} viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          
          {/* Tooltip */}
          <div style={{
            position: 'absolute',
            left: '50px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.2s ease',
            zIndex: 1001,
            pointerEvents: 'none'
          }}
          className="tooltip"
          >
            Ürün Paylaş
          </div>
        </div>

        {/* Favoriler */}
        <div style={{ position: 'relative' }} className="tooltip-container">
          <button 
            onClick={() => navigate('/favorites')}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="20" fill={themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#374151'} viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
            {favoriteProducts.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '14px',
                height: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 'bold'
              }}>
                {favoriteProducts.length}
              </div>
            )}
          </button>
          
          {/* Tooltip */}
          <div style={{
            position: 'absolute',
            left: '50px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.2s ease',
            zIndex: 1001,
            pointerEvents: 'none'
          }}
          className="tooltip"
          >
            Kaydedilenler
          </div>
        </div>

        {/* Sepet */}
        <div style={{ position: 'relative' }} className="tooltip-container">
          <button 
            onClick={() => navigate('/cart')}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="20" fill={themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#374151'} viewBox="0 0 24 24">
              <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            {totalCartItems > 0 && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '14px',
                height: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 'bold'
              }}>
                {totalCartItems}
              </div>
            )}
          </button>
          
          {/* Tooltip */}
          <div style={{
            position: 'absolute',
            left: '50px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.2s ease',
            zIndex: 1001,
            pointerEvents: 'none'
          }}
          className="tooltip"
          >
            Sepet
          </div>
        </div>

        {/* Bildirimler */}
        <div style={{ position: 'relative' }} className="tooltip-container">
          <button
            onClick={() => navigate('/notifications')}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="20" fill={themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#374151'} viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            <div style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '6px',
              height: '6px'
            }} />
          </button>
          
          {/* Tooltip */}
          <div style={{
            position: 'absolute',
            left: '50px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.2s ease',
            zIndex: 1001,
            pointerEvents: 'none'
          }}
          className="tooltip"
          >
            Bildirimler
          </div>
        </div>

        {/* Mesajlar */}
        <div style={{ position: 'relative' }} className="tooltip-container">
          <button
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="20" fill={themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#374151'} viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </button>
          
          {/* Tooltip */}
          <div style={{
            position: 'absolute',
            left: '50px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.2s ease',
            zIndex: 1001,
            pointerEvents: 'none'
          }}
          className="tooltip"
          >
            Mesajlar
          </div>
        </div>
      </div>

        {/* Üst Navbar */}
      <div style={topNavbarStyle}>
        {/* Arama Çubuğu */}
        <SearchBar themeMode={themeMode} isDarkMode={isDarkMode} />

        {/* Kategoriler Dropdown */}
        {showCategories && (
          <div ref={categoriesRef} style={{
            position: 'fixed',
            top: '60px',
            left: '50px',
            width: '240px',
            height: '60vh',
            backgroundColor: themeMode === 'pink' ? '#fef7f7' : isDarkMode ? '#1f2937' : 'white',
            borderRadius: '8px',
            boxShadow: themeMode === 'pink' ? '0 10px 15px -3px rgba(236, 72, 153, 0.2), 0 4px 6px -2px rgba(236, 72, 153, 0.1)' : isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: themeMode === 'pink' ? '1px solid #f9a8d4' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb',
            zIndex: 1002,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: themeMode === 'pink' ? '1px solid #f9a8d4' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb',
              backgroundColor: themeMode === 'pink' ? '#fdf2f8' : isDarkMode ? '#374151' : '#f8fafc'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '0.875rem',
                fontWeight: '600',
                color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#374151'
              }}>
                Kategoriler
              </h3>
            </div>
            
            <div style={{
              maxHeight: '50vh',
              overflowY: 'auto',
              padding: '0.5rem 0',
              flex: 1
            }}>
              {categories.map((category) => (
                <div key={category.id}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <button
                      onClick={() => {
                        onCategoryChange(category.id);
                        setShowCategories(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        border: 'none',
                        backgroundColor: selectedCategory === category.id 
                          ? (themeMode === 'pink' ? '#fce7f3' : isDarkMode ? '#1e40af' : '#dbeafe') 
                          : 'transparent',
                        color: selectedCategory === category.id 
                          ? (themeMode === 'pink' ? '#be185d' : isDarkMode ? '#60a5fa' : '#1d4ed8') 
                          : (themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#374151'),
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: selectedCategory === category.id ? '600' : '500',
                        transition: 'all 0.2s ease',
                        borderLeft: selectedCategory === category.id ? (themeMode === 'pink' ? '3px solid #ec4899' : '3px solid #3b82f6') : '3px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCategory !== category.id) {
                          e.currentTarget.style.backgroundColor = themeMode === 'pink' ? '#fce7f3' : isDarkMode ? '#374151' : '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategory !== category.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{category.icon}</span>
                      <span style={{ flex: 1 }}>{category.name}</span>
                    </button>
                    
                    {category.subcategories.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategoryExpansion(category.id);
                        }}
                        style={{
                          padding: '0.25rem',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#6b7280',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                          e.currentTarget.style.color = '#374151';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6b7280';
                        }}
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                          style={{
                            transform: expandedCategories.includes(category.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Alt kategoriler */}
                  {category.subcategories.length > 0 && expandedCategories.includes(category.id) && (
                    <div style={{
                      paddingLeft: '1.5rem',
                      backgroundColor: themeMode === 'pink' ? '#fdf2f8' : isDarkMode ? '#374151' : '#f8fafc'
                    }}>
                      {category.subcategories.map((subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => {
                            onCategoryChange(subcategory.id);
                            setShowCategories(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.375rem 0.75rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: themeMode === 'pink' ? '#ec4899' : isDarkMode ? '#9ca3af' : '#6b7280',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '400',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = themeMode === 'pink' ? '#fce7f3' : isDarkMode ? '#4b5563' : '#e5e7eb';
                            e.currentTarget.style.color = themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#374151';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = themeMode === 'pink' ? '#ec4899' : isDarkMode ? '#9ca3af' : '#6b7280';
                          }}
                        >
                          <span style={{ fontSize: '0.75rem' }}>•</span>
                          <span>{subcategory.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        </div>

        {/* Alt Butonlar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2rem', position: 'absolute', bottom: '2rem' }}>
          {/* Theme Toggle */}
          <div style={{ position: 'relative' }} className="tooltip-container">
            <button
              onClick={toggleDarkMode}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = themeMode === 'pink' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {themeMode === 'light' && (
                <svg width="24" height="24" fill="#374151" viewBox="0 0 24 24">
                  <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -6.56 -12.437a5 5 0 0 0 2.33 -6.5 7.5 7.5 0 0 0 -4.083 6.5z"/>
                </svg>
              )}
              {themeMode === 'dark' && (
                <svg width="24" height="24" fill="#d1d5db" viewBox="0 0 24 24">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
                </svg>
              )}
              {themeMode === 'pink' && (
                <svg width="24" height="24" fill="#be185d" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              )}
            </button>
            
            {/* Tooltip */}
            <div style={{
              position: 'absolute',
              left: '50px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: '#1f2937',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              opacity: 0,
              visibility: 'hidden',
              transition: 'all 0.2s ease',
              zIndex: 1001,
              pointerEvents: 'none'
            }}
            className="tooltip"
            >
              {themeMode === 'light' ? 'Karanlık Mod' : themeMode === 'dark' ? 'Pembe Mod' : 'Açık Mod'}
            </div>
          </div>

          {/* Kullanıcı Menüsü */}
          {user ? (
            <div style={{ position: 'relative' }} className="tooltip-container">
              <button
                onClick={() => navigate('/account')}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeMode === 'pink' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="24" height="24" fill={themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#374151'} viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </button>
              
              {/* Tooltip */}
              <div style={{
                position: 'absolute',
                left: '50px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#1f2937',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                opacity: 0,
                visibility: 'hidden',
                transition: 'all 0.2s ease',
                zIndex: 1001,
                pointerEvents: 'none'
              }}
              className="tooltip"
              >
                Hesap Yönetimi
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }} className="tooltip-container">
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeMode === 'pink' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="24" height="24" fill={themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#374151'} viewBox="0 0 24 24">
                  <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
                </svg>
              </button>
              
              {/* Tooltip */}
              <div style={{
                position: 'absolute',
                left: '50px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#1f2937',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                opacity: 0,
                visibility: 'hidden',
                transition: 'all 0.2s ease',
                zIndex: 1001,
                pointerEvents: 'none'
              }}
              className="tooltip"
              >
                Giriş Yap
              </div>
            </div>
          )}

          {/* Ayarlar */}
        <div style={{ position: 'relative' }} className="tooltip-container">
          <button
            onClick={() => navigate('/settings')}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = themeMode === 'pink' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="24" height="24" fill={themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#374151'} viewBox="0 0 24 24">
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5M19.43 12.97c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.4-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.12.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1s.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
            </svg>
          </button>
          
          {/* Tooltip */}
          <div style={{
            position: 'absolute',
            right: '50px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.2s ease',
            zIndex: 1001,
            pointerEvents: 'none'
          }}
          className="tooltip"
          >
            Ayarlar
          </div>
        </div>
        </div>
      </div>
    </>
  );
});

ModernNavbar.displayName = 'ModernNavbar';

export default ModernNavbar;