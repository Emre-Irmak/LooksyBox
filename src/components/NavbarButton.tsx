import React from 'react';

interface NavbarButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  tooltip: string;
  isActive?: boolean;
  badge?: number;
  themeMode: 'light' | 'dark' | 'pink';
  isDarkMode: boolean;
  className?: string;
}

const NavbarButton: React.FC<NavbarButtonProps> = React.memo(({
  onClick,
  icon,
  tooltip,
  isActive = false,
  badge,
  themeMode,
  isDarkMode,
  className = ''
}) => {
  const buttonStyle = React.useMemo(() => ({
    width: '40px',
    height: '40px',
    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    border: 'none',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative' as const
  }), [isActive]);

  const tooltipStyle = React.useMemo(() => ({
    position: 'absolute' as const,
    left: '50px',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: '#1f2937',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap' as const,
    opacity: 0,
    visibility: 'hidden' as const,
    transition: 'all 0.2s ease',
    zIndex: 1001,
    pointerEvents: 'none' as const
  }), []);

  const badgeStyle = React.useMemo(() => ({
    position: 'absolute' as const,
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
  }), []);

  return (
    <div style={{ position: 'relative' }} className={`tooltip-container ${className}`}>
      <button
        onClick={onClick}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {icon}
        {badge && badge > 0 && (
          <div style={badgeStyle}>
            {badge}
          </div>
        )}
      </button>
      
      <div style={tooltipStyle} className="tooltip">
        {tooltip}
      </div>
    </div>
  );
});

NavbarButton.displayName = 'NavbarButton';

export default NavbarButton;
