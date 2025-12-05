import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, isVisible, onClose, duration = 3000 }: ToastProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300); // Fade out animasyonu için
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '1rem',
      right: '1rem',
      zIndex: 9999,
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: '300px',
      maxWidth: '400px',
      transform: isAnimating ? 'translateX(0)' : 'translateX(100%)',
      opacity: isAnimating ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(16, 185, 129, 0.95)',
          color: 'white'
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(239, 68, 68, 0.95)',
          color: 'white'
        };
      case 'info':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(59, 130, 246, 0.95)',
          color: 'white'
        };
      default:
        return baseStyles;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        );
      case 'error':
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        );
      case 'info':
        return (
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        );
    }
  };

  return (
    <div style={getToastStyles()}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        flexShrink: 0
      }}>
        {getIcon()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          marginBottom: '0.25rem'
        }}>
          {type === 'success' ? 'Başarılı!' : 
           type === 'error' ? 'Hata!' : 'Bilgi'}
        </div>
        <div style={{
          fontSize: '0.875rem',
          opacity: 0.9
        }}>
          {message}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '0.25rem',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
};

export default Toast;

