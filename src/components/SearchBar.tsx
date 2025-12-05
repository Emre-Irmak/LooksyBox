import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import SearchSuggestions from './SearchSuggestions';

interface SearchBarProps {
  themeMode: 'light' | 'dark' | 'pink';
  isDarkMode: boolean;
}

const SearchBar: React.FC<SearchBarProps> = React.memo(({ themeMode, isDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchType, setSearchType] = useState<'products' | 'users'>('products');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [suggestionsCount, setSuggestionsCount] = useState(0);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Son arattıkları localStorage'a kaydet
      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const newSearch = searchQuery.trim();
      
      // Aynı aramayı tekrar eklememek için önce kaldır
      const filteredSearches = recentSearches.filter((search: string) => search !== newSearch);
      
      // Yeni aramayı başa ekle
      const updatedSearches = [newSearch, ...filteredSearches].slice(0, 10);
      
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${searchType}`);
      setShowSuggestions(false);
      window.scrollTo(0, 0);
    }
  }, [searchQuery, searchType, navigate]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => {
            const maxSuggestions = suggestionsCount || 8;
            return prev < maxSuggestions - 1 ? prev + 1 : prev;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => Math.max(-1, prev - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0) {
            return;
          } else {
            handleSearch(e);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          searchInputRef.current?.blur();
          break;
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  }, [showSuggestions, suggestionsCount, selectedSuggestionIndex, handleSearch]);

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  }, [searchQuery.length]);

  // Arama sonuçları sayfasında mevcut arama terimini yükle
  React.useEffect(() => {
    if (location.pathname === '/search') {
      const query = searchParams.get('q') || '';
      const type = searchParams.get('type') || 'products';
      setSearchQuery(query);
      setSearchType(type as 'products' | 'users');
    } else {
      setSearchQuery('');
      setSearchType('products');
    }
  }, [location.pathname, searchParams]);

  // Click outside to close suggestions
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const searchBarStyle = useMemo(() => ({
    flex: 0.95,
    position: 'relative' as const
  }), []);

  const searchFormStyle = useMemo(() => ({
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }), []);

  const searchTypeButtonsStyle = useMemo(() => ({
    display: 'flex',
    backgroundColor: themeMode === 'pink' ? '#fdf2f8' : isDarkMode ? '#374151' : '#f9fafb',
    borderRadius: '12px',
    padding: '2px',
    border: themeMode === 'pink' ? '1px solid #f9a8d4' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #d1d5db'
  }), [themeMode, isDarkMode]);

  const searchInputStyle = useMemo(() => ({
    width: '100%',
    padding: '0.25rem 1rem 0.25rem 2.5rem',
    border: themeMode === 'pink' ? '1px solid #f9a8d4' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #d1d5db',
    borderRadius: '16px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: themeMode === 'pink' ? '#fdf2f8' : isDarkMode ? '#374151' : '#f9fafb',
    height: '28px',
    color: themeMode === 'pink' ? '#831843' : isDarkMode ? '#f9fafb' : '#1f2937',
    transition: 'all 0.3s ease'
  }), [themeMode, isDarkMode]);

  return (
    <div ref={searchContainerRef} style={searchBarStyle}>
      <form onSubmit={handleSearch}>
        <div style={searchFormStyle}>
          {/* Arama Türü Butonları */}
          <div style={searchTypeButtonsStyle}>
            <button
              type="button"
              onClick={() => setSearchType('products')}
              title="Ürün Ara"
              style={{
                padding: '0.25rem 0.5rem',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: searchType === 'products' 
                  ? (themeMode === 'pink' ? '#ec4899' : isDarkMode ? '#3b82f6' : '#3b82f6')
                  : 'transparent',
                color: searchType === 'products' 
                  ? 'white' 
                  : (themeMode === 'pink' ? '#831843' : isDarkMode ? '#9ca3af' : '#6b7280'),
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '24px'
              }}
            >
              🛍️
            </button>
            <button
              type="button"
              onClick={() => setSearchType('users')}
              title="Kullanıcı Ara"
              style={{
                padding: '0.25rem 0.5rem',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: searchType === 'users' 
                  ? (themeMode === 'pink' ? '#ec4899' : isDarkMode ? '#3b82f6' : '#3b82f6')
                  : 'transparent',
                color: searchType === 'users' 
                  ? 'white' 
                  : (themeMode === 'pink' ? '#831843' : isDarkMode ? '#9ca3af' : '#6b7280'),
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '24px'
              }}
            >
              👤
            </button>
          </div>

          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length >= 2) {
                  setShowSuggestions(true);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
              placeholder={
                searchType === 'products' ? 'Ürün ara...' : 'Kullanıcı ara...'
              }
              style={searchInputStyle}
            />
            <svg 
              width="16" 
              height="16" 
              fill={themeMode === 'pink' ? '#ec4899' : isDarkMode ? '#9ca3af' : '#6b7280'}
              viewBox="0 0 24 24"
              style={{ 
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            
            {/* Temizleme Butonu */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#6b7280' : '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#4b5563' : '#e5e7eb';
                }}
              >
                <svg
                  width="12"
                  height="12"
                  fill={isDarkMode ? '#9ca3af' : '#6b7280'}
                  viewBox="0 0 24 24"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </form>
      
      {/* Arama Önerileri */}
      {showSuggestions && (
        <SearchSuggestions
          query={searchQuery}
          searchType={searchType}
          isVisible={showSuggestions}
          selectedIndex={selectedSuggestionIndex}
          onSuggestionClick={(suggestion) => {
            setSearchQuery(suggestion);
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
            
            const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
            const filteredSearches = recentSearches.filter((search: string) => search !== suggestion);
            const updatedSearches = [suggestion, ...filteredSearches].slice(0, 10);
            localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
            
            navigate(`/search?q=${encodeURIComponent(suggestion)}&type=${searchType}`);
            window.scrollTo(0, 0);
          }}
          onKeyboardNavigation={(direction) => {
            if (direction === 'escape') {
              setShowSuggestions(false);
              setSelectedSuggestionIndex(-1);
              searchInputRef.current?.blur();
            }
          }}
          onSuggestionsCountChange={(count) => setSuggestionsCount(count)}
        />
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
