import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import type { Product } from '../types/Product';

interface FavoriteProductCardProps {
  product: Product;
  isFavorite?: boolean;
  isLiked?: boolean;
  onToggleFavorite?: (productId: number) => void;
  onToggleLike?: (productId: number) => void;
  onAddToCart?: (productId: number) => void;
}

const FavoriteProductCard = ({ product, isFavorite, isLiked, onToggleFavorite, onToggleLike, onAddToCart }: FavoriteProductCardProps) => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  
  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(product.id);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleLike) {
      onToggleLike(product.id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product.id);
    }
  };
  
  return (
    <div 
      onClick={handleClick}
      style={{ 
        cursor: 'pointer',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        backgroundColor: isDarkMode ? '#1f2937' : 'white',
        boxShadow: isDarkMode 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s ease',
        marginBottom: '1rem',
        width: '100%',
        position: 'relative',
        border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(229, 231, 235, 0.5)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = isDarkMode 
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = isDarkMode 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      }}
    >
      <img
        src={product.imageUrl}
        alt={product.title}
        style={{
          width: '100%',
          height: '200px',
          objectFit: 'cover',
          display: 'block'
        }}
        loading="lazy"
      />
      
      {/* Butonlar */}
      <div style={{
        position: 'absolute',
        top: '0.5rem',
        right: '0.5rem',
        display: 'flex',
        gap: '0.5rem'
      }}>
        {/* Beğeni butonu */}
        {onToggleLike && (
          <button
            onClick={handleLikeClick}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '2.5rem',
              height: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg 
              width="20" 
              height="20" 
              fill={isLiked ? "#10b981" : "#9ca3af"} 
              viewBox="0 0 24 24"
            >
              <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.776zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.833 0-1.612.453-1.918 1.227z"/>
            </svg>
          </button>
        )}

        {/* Favori butonu */}
        {onToggleFavorite && (
          <button
            onClick={handleFavoriteClick}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '2.5rem',
              height: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg 
              width="20" 
              height="20" 
              fill={isFavorite ? "#10b981" : "#9ca3af"} 
              viewBox="0 0 24 24"
            >
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Ürün bilgileri */}
      <div style={{ 
        padding: '1rem',
        backgroundColor: isDarkMode ? '#1f2937' : 'transparent'
      }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          color: isDarkMode ? '#f9fafb' : '#111827',
          marginBottom: '0.5rem',
          lineHeight: '1.4'
        }}>
          {product.title}
        </h3>
        
        {product.description && (
          <p style={{ 
            fontSize: '0.875rem', 
            color: isDarkMode ? '#d1d5db' : '#6b7280',
            marginBottom: '0.75rem',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.description}
          </p>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              fontSize: '1.125rem', 
              fontWeight: 'bold', 
              color: isDarkMode ? '#f9fafb' : '#111827' 
            }}>
              {product.price}
            </span>
            {product.originalPrice && (
              <span style={{ 
                fontSize: '0.875rem', 
                color: isDarkMode ? '#6b7280' : '#9ca3af',
                textDecoration: 'line-through'
              }}>
                {product.originalPrice}
              </span>
            )}
          </div>
          
          {product.discount && (
            <span style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {product.discount}
            </span>
          )}
        </div>

        {/* Sepete ekle butonu */}
        {onAddToCart && (
          <button
            onClick={handleAddToCart}
            style={{
              width: '100%',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            Sepete Ekle
          </button>
        )}
      </div>
    </div>
  );
};

export default FavoriteProductCard;

