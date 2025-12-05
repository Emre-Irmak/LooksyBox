import { useState, useEffect } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface Notification {
  id: number;
  type: 'campaign' | 'update' | 'news' | 'order' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

const NotificationsPage = () => {
  const { isDarkMode } = useDarkMode();
  
  // Component mount olduğunda scroll pozisyonunu sıfırla
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'campaign',
      title: 'Büyük İndirim Kampanyası!',
      message: 'Seçili ürünlerde %50\'ye varan indirimler başladı! Kaçırma, sınırlı süre.',
      timestamp: '2 saat önce',
      isRead: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'update',
      title: 'Uygulama Güncellemesi',
      message: 'Looksy uygulaması yeni özelliklerle güncellendi. Daha hızlı ve kullanışlı deneyim için güncellemeyi unutma!',
      timestamp: '1 gün önce',
      isRead: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'news',
      title: 'Yeni Koleksiyon Geldi!',
      message: 'Sonbahar koleksiyonu ile tanış! Trend parçalar ve özel tasarımlar seni bekliyor.',
      timestamp: '2 gün önce',
      isRead: true,
      priority: 'medium'
    },
    {
      id: 4,
      type: 'order',
      title: 'Siparişin Hazırlanıyor',
      message: 'Siparişin #12345 başarıyla alındı ve hazırlanıyor. Kargo takip numarası: TR123456789',
      timestamp: '3 gün önce',
      isRead: true,
      priority: 'high'
    },
    {
      id: 5,
      type: 'system',
      title: 'Güvenlik Bildirimi',
      message: 'Hesabın için yeni bir giriş tespit edildi. Eğer bu sen değilsen, hemen şifreni değiştir.',
      timestamp: '1 hafta önce',
      isRead: true,
      priority: 'high'
    },
    {
      id: 6,
      type: 'campaign',
      title: 'Özel Ödeme Seçenekleri',
      message: 'Artık taksitli ödeme seçenekleri mevcut! 3, 6 ve 12 taksit seçenekleri ile alışveriş yap.',
      timestamp: '1 hafta önce',
      isRead: true,
      priority: 'low'
    },
    {
      id: 7,
      type: 'news',
      title: 'Tasarımcı Röportajı',
      message: 'Ünlü moda tasarımcısı ile özel röportajımız yayında! Moda dünyasından son haberler.',
      timestamp: '2 hafta önce',
      isRead: true,
      priority: 'low'
    },
    {
      id: 8,
      type: 'update',
      title: 'Yeni Özellik: Favori Listeler',
      message: 'Artık favori ürünlerini kategorilere ayırabilirsin! "İş için", "Günlük" gibi listeler oluştur.',
      timestamp: '2 hafta önce',
      isRead: true,
      priority: 'medium'
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'unread' | 'campaign' | 'update' | 'news'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'campaign':
        return '🎉';
      case 'update':
        return '📱';
      case 'news':
        return '🌟';
      case 'order':
        return '📦';
      case 'system':
        return '🔒';
      default:
        return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ 
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: isDarkMode ? '#111827' : 'transparent',
      minHeight: '100vh',
      color: isDarkMode ? '#f9fafb' : '#1f2937'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: isDarkMode ? '2px solid rgba(75, 85, 99, 0.3)' : '2px solid #e5e7eb'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: isDarkMode ? '#f9fafb' : '#1f2937',
            margin: 0
          }}>
            Bildirimler
          </h1>
          <p style={{
            color: isDarkMode ? '#d1d5db' : '#6b7280',
            margin: '0.5rem 0 0 0'
          }}>
            {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              backgroundColor: isDarkMode ? '#1e40af' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
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
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'all', label: 'Tümü', count: notifications.length },
          { key: 'unread', label: 'Okunmamış', count: unreadCount },
          { key: 'campaign', label: 'Kampanyalar', count: notifications.filter(n => n.type === 'campaign').length },
          { key: 'update', label: 'Güncellemeler', count: notifications.filter(n => n.type === 'update').length },
          { key: 'news', label: 'Haberler', count: notifications.filter(n => n.type === 'news').length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            style={{
              backgroundColor: filter === tab.key 
                ? (isDarkMode ? '#1e40af' : '#3b82f6') 
                : (isDarkMode ? '#374151' : '#f3f4f6'),
              color: filter === tab.key 
                ? 'white' 
                : (isDarkMode ? '#d1d5db' : '#374151'),
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (filter !== tab.key) {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#4b5563' : '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== tab.key) {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6';
              }
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                backgroundColor: filter === tab.key 
                  ? 'rgba(255,255,255,0.2)' 
                  : (isDarkMode ? '#6b7280' : '#d1d5db'),
                color: filter === tab.key 
                  ? 'white' 
                  : (isDarkMode ? '#9ca3af' : '#6b7280'),
                padding: '0.125rem 0.5rem',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: isDarkMode ? '#9ca3af' : '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3>Bildirim bulunamadı</h3>
            <p>Seçili filtrelere uygun bildirim bulunmuyor.</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              style={{
                backgroundColor: notification.isRead 
                  ? (isDarkMode ? '#1f2937' : '#ffffff') 
                  : (isDarkMode ? '#374151' : '#f8fafc'),
                border: isDarkMode 
                  ? '1px solid rgba(75, 85, 99, 0.3)' 
                  : '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isDarkMode ? '#60a5fa' : '#3b82f6';
                e.currentTarget.style.boxShadow = isDarkMode 
                  ? '0 4px 12px rgba(96, 165, 250, 0.2)' 
                  : '0 4px 12px rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDarkMode 
                  ? 'rgba(75, 85, 99, 0.3)' 
                  : '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={() => markAsRead(notification.id)}
            >
              {/* Priority Indicator */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getPriorityColor(notification.priority)
              }} />

              {/* Notification Content */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                  fontSize: '1.5rem',
                  flexShrink: 0
                }}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: isDarkMode ? '#f9fafb' : '#1f2937',
                      margin: 0,
                      lineHeight: 1.4
                    }}>
                      {notification.title}
                    </h3>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        fontSize: '0.875rem'
                      }}>
                        {notification.timestamp}
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isDarkMode ? '#6b7280' : '#9ca3af',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#fef2f2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = isDarkMode ? '#6b7280' : '#9ca3af';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <p style={{
                    color: isDarkMode ? '#d1d5db' : '#4b5563',
                    lineHeight: 1.5,
                    margin: 0
                  }}>
                    {notification.message}
                  </p>
                  
                  {!notification.isRead && (
                    <div style={{
                      marginTop: '0.75rem',
                      display: 'inline-block',
                      backgroundColor: isDarkMode ? '#1e40af' : '#3b82f6',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      Yeni
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;