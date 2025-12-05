import { useDarkMode } from '../contexts/DarkModeContext';

interface SettingsPageProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const SettingsPage = ({ isDarkMode }: SettingsPageProps) => {
  const { themeMode, setThemeMode } = useDarkMode();
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
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '0 1rem' 
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: themeMode === 'pink' ? 'rgba(254, 247, 247, 0.95)' : isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: themeMode === 'pink' 
            ? '0 20px 40px -10px rgba(236, 72, 153, 0.2)' 
            : isDarkMode 
            ? '0 20px 40px -10px rgba(0, 0, 0, 0.3)' 
            : '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: themeMode === 'pink' 
            ? '1px solid rgba(249, 168, 212, 0.3)' 
            : isDarkMode 
            ? '1px solid rgba(75, 85, 99, 0.3)' 
            : '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
            marginBottom: '0.5rem',
            background: themeMode === 'pink'
              ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
              : isDarkMode 
              ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            ⚙️ Ayarlar
          </h1>
          <p style={{
            color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#6b7280',
            fontSize: '1.125rem'
          }}>
            Uygulamanızı kişiselleştirin
          </p>
        </div>

        {/* Theme Selector */}
        <div style={{
          backgroundColor: themeMode === 'pink' ? 'rgba(254, 247, 247, 0.95)' : isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: themeMode === 'pink' 
            ? '0 20px 40px -10px rgba(236, 72, 153, 0.2)' 
            : isDarkMode 
            ? '0 20px 40px -10px rgba(0, 0, 0, 0.3)' 
            : '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: themeMode === 'pink' 
            ? '1px solid rgba(249, 168, 212, 0.3)' 
            : isDarkMode 
            ? '1px solid rgba(75, 85, 99, 0.3)' 
            : '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
            marginBottom: '1rem'
          }}>
            🎨 Tema Seçimi
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {/* Light Theme */}
            <div
              onClick={() => setThemeMode('light')}
              style={{
                padding: '1.5rem',
                backgroundColor: themeMode === 'light' 
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'transparent',
                borderRadius: '1rem',
                border: themeMode === 'light' 
                  ? '2px solid #3b82f6'
                  : (themeMode === 'pink' ? '1px solid #f9a8d4' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb'),
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (themeMode !== 'light') {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (themeMode !== 'light') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#f3f4f6',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                marginBottom: '1rem'
              }}>
                ☀️
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
                marginBottom: '0.25rem'
              }}>
                Aydınlık Tema
              </h3>
              <p style={{
                color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#6b7280',
                fontSize: '0.875rem'
              }}>
                Parlak ve temiz görünüm
              </p>
            </div>

            {/* Dark Theme */}
            <div
              onClick={() => setThemeMode('dark')}
              style={{
                padding: '1.5rem',
                backgroundColor: themeMode === 'dark' 
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'transparent',
                borderRadius: '1rem',
                border: themeMode === 'dark' 
                  ? '2px solid #3b82f6'
                  : (themeMode === 'pink' ? '1px solid #f9a8d4' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb'),
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (themeMode !== 'dark') {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (themeMode !== 'dark') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#374151',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                marginBottom: '1rem'
              }}>
                🌙
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
                marginBottom: '0.25rem'
              }}>
                Karanlık Tema
              </h3>
              <p style={{
                color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#6b7280',
                fontSize: '0.875rem'
              }}>
                Gözlerinizi yormayan tema
              </p>
            </div>

            {/* Pink Theme */}
            <div
              onClick={() => setThemeMode('pink')}
              style={{
                padding: '1.5rem',
                backgroundColor: themeMode === 'pink' 
                  ? 'rgba(236, 72, 153, 0.1)'
                  : 'transparent',
                borderRadius: '1rem',
                border: themeMode === 'pink' 
                  ? '2px solid #ec4899'
                  : (isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb'),
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (themeMode !== 'pink') {
                  e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (themeMode !== 'pink') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                marginBottom: '1rem'
              }}>
                💖
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
                marginBottom: '0.25rem'
              }}>
                Pembe Tema
              </h3>
              <p style={{
                color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#d1d5db' : '#6b7280',
                fontSize: '0.875rem'
              }}>
                Yumuşak ve romantik görünüm
              </p>
            </div>
          </div>
        </div>

        {/* Diğer Ayarlar */}
        <div style={{
          backgroundColor: themeMode === 'pink' ? 'rgba(254, 247, 247, 0.95)' : isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: themeMode === 'pink' 
            ? '0 20px 40px -10px rgba(236, 72, 153, 0.2)' 
            : isDarkMode 
            ? '0 20px 40px -10px rgba(0, 0, 0, 0.3)' 
            : '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: themeMode === 'pink' 
            ? '1px solid rgba(249, 168, 212, 0.3)' 
            : isDarkMode 
            ? '1px solid rgba(75, 85, 99, 0.3)' 
            : '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
            marginBottom: '1rem'
          }}>
            Gelecek Özellikler
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {[
              { icon: '🔔', title: 'Bildirim Ayarları', desc: 'Push bildirimleri' },
              { icon: '🌍', title: 'Dil Seçimi', desc: 'Çoklu dil desteği' },
              { icon: '📱', title: 'Tema Özelleştirme', desc: 'Renk paleti seçimi' },
              { icon: '🔒', title: 'Gizlilik Ayarları', desc: 'Veri koruma' },
              { icon: '🎨', title: 'Font Boyutu', desc: 'Okunabilirlik ayarları' },
              { icon: '⚡', title: 'Performans', desc: 'Hız optimizasyonu' }
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  backgroundColor: themeMode === 'pink' ? 'rgba(252, 231, 243, 0.5)' : isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(243, 244, 246, 0.5)',
                  borderRadius: '0.75rem',
                  border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(229, 231, 235, 0.5)',
                  transition: 'all 0.3s ease',
                  cursor: 'not-allowed',
                  opacity: 0.6
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themeMode === 'pink' ? 'rgba(252, 231, 243, 0.7)' : isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(243, 244, 246, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = themeMode === 'pink' ? 'rgba(252, 231, 243, 0.5)' : isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(243, 244, 246, 0.5)';
                }}
              >
                <div style={{
                  fontSize: '1.5rem',
                  marginBottom: '0.5rem'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
                  marginBottom: '0.25rem'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '0.75rem',
                  color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#9ca3af' : '#6b7280'
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
