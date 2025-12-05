import { useEffect, useState } from 'react';
import logoImage from '../assets/LooksyLogo.png';

interface LogoAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

const LogoAnimation = ({ isVisible, onComplete }: LogoAnimationProps) => {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    if (!isVisible) return;

    // Animasyon sırası: giriş -> bekle -> çıkış
    const enterTimer = setTimeout(() => {
      setAnimationPhase('hold');
    }, 300);

    const holdTimer = setTimeout(() => {
      setAnimationPhase('exit');
    }, 1000);

    const exitTimer = setTimeout(() => {
      onComplete();
    }, 800);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: animationPhase === 'enter' 
          ? 'scale(0.5) translateY(50px)' 
          : animationPhase === 'hold' 
          ? 'scale(1) translateY(0)' 
          : 'scale(0.8) translateY(-30px)',
        opacity: animationPhase === 'exit' ? 0 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Logo */}
        <div style={{
          width: '200px',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          border: '3px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'visible',
          animation: 'glow 2s ease-in-out infinite'
        }}>
          {/* Glow effect */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
            borderRadius: '50%',
            animation: 'spin 3s linear infinite',
            zIndex: 0
          }} />
          
          {/* Inner glow */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '80%',
            height: '80%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'pulse 2s ease-in-out infinite',
            zIndex: 0
          }} />
          
          <img 
            src={logoImage} 
            alt="Looksy Logo" 
            style={{
              width: animationPhase === 'enter' 
                ? '100px' 
                : animationPhase === 'hold' 
                ? '450px' 
                : '300px',
              height: animationPhase === 'enter' 
                ? '100px' 
                : animationPhase === 'hold' 
                ? '450px' 
                : '300px',
              objectFit: 'contain',
              zIndex: 2,
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))'
            }}
          />
        </div>

        {/* Loading text */}
        <div style={{
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: '600',
          textAlign: 'center',
          opacity: animationPhase === 'hold' ? 1 : 0,
          transition: 'opacity 0.3s ease',
          marginBottom: '1rem'
        }}>
          LooksyBox
        </div>

        {/* Loading dots */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          opacity: animationPhase === 'hold' ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: 'white',
                borderRadius: '50%',
                animation: `pulse 1.5s ease-in-out infinite ${index * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { 
              opacity: 0.3;
              transform: scale(0.8);
            }
            50% { 
              opacity: 1;
              transform: scale(1.2);
            }
          }
          
          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1);
            }
            50% {
              box-shadow: 0 0 30px rgba(255, 255, 255, 0.6), 0 0 60px rgba(255, 255, 255, 0.3);
            }
          }
        `}
      </style>
    </div>
  );
};

export default LogoAnimation;
