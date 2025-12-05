import { useState, useEffect, useRef } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { users } from '../data/products';

interface SearchSuggestionsProps {
  query: string;
  searchType: 'products' | 'users';
  isVisible: boolean;
  selectedIndex: number;
  onSuggestionClick: (suggestion: string) => void;
  onKeyboardNavigation?: (direction: 'up' | 'down' | 'enter' | 'escape') => void;
  onSuggestionsCountChange?: (count: number) => void;
}

const SearchSuggestions = ({ query, searchType, isVisible, selectedIndex, onSuggestionClick, onSuggestionsCountChange }: SearchSuggestionsProps) => {
  const { isDarkMode } = useDarkMode();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // const [isLoading, setIsLoading] = useState(false);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Update refs array when suggestions change
  useEffect(() => {
    suggestionRefs.current = suggestionRefs.current.slice(0, suggestions.length);
  }, [suggestions.length]);

  // Akıllı algılama sistemi - Kısaltmalar ve benzer kelimeler
  const getSmartSuggestions = (query: string): string[] => {
    const smartMappings: { [key: string]: string[] } = {
      'el': ['elbise', 'eldiven', 'elektronik', 'elbise yazlık', 'elbise kışlık', 'elbise gece', 'elbise iş'],
      'ay': ['ayakkabı', 'ayakkabı spor', 'ayakkabı klasik', 'ayakkabı bot', 'ayakkabı sandalet'],
      'go': ['gömlek', 'gömlek erkek', 'gömlek kadın', 'gömlek beyaz', 'gömlek mavi'],
      'pa': ['pantolon', 'pantolon jean', 'pantolon kumaş', 'pantolon siyah', 'pantolon mavi'],
      'ti': ['tişört', 'tişört erkek', 'tişört kadın', 'tişört beyaz', 'tişört siyah'],
      'ka': ['kazak', 'kazak yün', 'kazak polar', 'kazak boğazlı', 'kazak düğmeli'],
      'ce': ['ceket', 'ceket deri', 'ceket kumaş', 'ceket blazer', 'ceket mont'],
      'mo': ['mont', 'mont kışlık', 'mont deri', 'mont kumaş', 'mont erkek'],
      'sp': ['spor', 'spor ayakkabı', 'spor kıyafet', 'spor çanta', 'spor saat'],
      'sa': ['saat', 'saat erkek', 'saat kadın', 'saat spor', 'saat klasik'],
      'ca': ['çanta', 'çanta el', 'çanta sırt', 'çanta deri', 'çanta spor'],
      'te': ['telefon', 'telefon kılıf', 'telefon aksesuar', 'telefon kablosu'],
      'la': ['laptop', 'laptop çanta', 'laptop stand', 'laptop kılıf'],
      'be': ['beyaz', 'beyaz elbise', 'beyaz gömlek', 'beyaz ayakkabı', 'beyaz tişört'],
      'si': ['siyah', 'siyah elbise', 'siyah gömlek', 'siyah ayakkabı', 'siyah tişört'],
      'ma': ['mavi', 'mavi elbise', 'mavi gömlek', 'mavi ayakkabı', 'mavi tişört'],
      'ki': ['kırmızı', 'kırmızı elbise', 'kırmızı gömlek', 'kırmızı ayakkabı', 'kırmızı tişört'],
      'ye': ['yeşil', 'yeşil elbise', 'yeşil gömlek', 'yeşil ayakkabı', 'yeşil tişört'],
      'sar': ['sarı', 'sarı elbise', 'sarı gömlek', 'sarı ayakkabı', 'sarı tişört'],
      'kah': ['kahverengi', 'kahverengi elbise', 'kahverengi gömlek', 'kahverengi ayakkabı', 'kahverengi tişört']
    };

    // Kısaltma kontrolü
    for (const [shortcut, suggestions] of Object.entries(smartMappings)) {
      if (query === shortcut) {
        return suggestions;
      }
    }

    return [];
  };

  // Son arattıkları ve en çok aratılanları getir
  const getRecentAndPopularSearches = (): string[] => {
    // Son arattıkları localStorage'dan al
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    
    // En çok aratılanlar (rastgele örnekler)
    const popularSearches = [
      'elbise', 'ayakkabı', 'gömlek', 'pantolon', 'tişört', 'kazak', 'ceket', 'mont',
      'spor ayakkabı', 'çanta', 'saat', 'takı', 'gözlük', 'şapka', 'eldiven', 'atkı',
      'beyaz elbise', 'siyah pantolon', 'mavi gömlek', 'kırmızı tişört', 'yeşil kazak',
      'deri ceket', 'yün mont', 'spor kıyafet', 'iş kıyafeti', 'gece elbisesi',
      'erkek giyim', 'kadın giyim', 'çocuk giyim', 'bebek giyim', 'unisex',
      'yazlık kıyafet', 'kışlık kıyafet', 'bahar kıyafet', 'sonbahar kıyafet',
      'klasik stil', 'modern stil', 'vintage stil', 'casual stil', 'formal stil'
    ];
    
    // Son arattıkları ve popüler aramaları birleştir
    const allSuggestions = [...recentSearches, ...popularSearches];
    
    // Tekrarları kaldır ve sınırla
    return [...new Set(allSuggestions)].slice(0, 8);
  };

  // Akıllı öneri sistemi
  const generateSuggestions = async (searchQuery: string): Promise<string[]> => {
    // Eğer arama çubuğu boşsa, son arattıkları ve popüler aramaları göster
    if (!searchQuery.trim()) {
      return getRecentAndPopularSearches();
    }

    const query = searchQuery.toLowerCase();
    
    // Önce akıllı algılama kontrolü yap
    const smartSuggestions = getSmartSuggestions(query);
    if (smartSuggestions.length > 0) {
      return smartSuggestions;
    }
    
    // Ürün önerileri
    const productSuggestions = [
      // Giyim kategorileri
      'elbise', 'elbise yazlık', 'elbise kışlık', 'elbise gece', 'elbise iş',
      'elbise beyaz', 'elbise siyah', 'elbise mavi', 'elbise kırmızı',
      'gömlek', 'gömlek erkek', 'gömlek kadın', 'gömlek beyaz', 'gömlek mavi',
      'gömlek siyah', 'gömlek kırmızı', 'gömlek mavi', 'gömlek yeşil',
      'pantolon', 'pantolon jean', 'pantolon kumaş', 'pantolon siyah', 'pantolon mavi',
      'pantolon beyaz', 'pantolon kırmızı', 'pantolon yeşil', 'pantolon kahverengi',
      'tişört', 'tişört erkek', 'tişört kadın', 'tişört beyaz', 'tişört siyah',
      'tişört mavi', 'tişört kırmızı', 'tişört yeşil', 'tişört sarı',
      'kazak', 'kazak yün', 'kazak polar', 'kazak boğazlı', 'kazak düğmeli',
      'kazak beyaz', 'kazak siyah', 'kazak mavi', 'kazak kırmızı',
      'ceket', 'ceket deri', 'ceket kumaş', 'ceket blazer', 'ceket mont',
      'ceket beyaz', 'ceket siyah', 'ceket mavi', 'ceket kırmızı',
      'mont', 'mont kışlık', 'mont deri', 'mont kumaş', 'mont erkek',
      'mont beyaz', 'mont siyah', 'mont mavi', 'mont kırmızı',
      'ayakkabı', 'ayakkabı spor', 'ayakkabı klasik', 'ayakkabı bot', 'ayakkabı sandalet',
      'ayakkabı beyaz', 'ayakkabı siyah', 'ayakkabı mavi', 'ayakkabı kırmızı',
      'çanta', 'çanta el', 'çanta sırt', 'çanta deri', 'çanta kumaş',
      'çanta beyaz', 'çanta siyah', 'çanta mavi', 'çanta kırmızı',
      
      // Aksesuar
      'saat', 'saat kol', 'saat duvar', 'saat dijital', 'saat analog',
      'takı', 'takı altın', 'takı gümüş', 'takı inci', 'takı elmas',
      'gözlük', 'gözlük güneş', 'gözlük numaralı', 'gözlük çerçeve',
      'şapka', 'şapka kışlık', 'şapka yazlık', 'şapka beyzbol', 'şapka kovboy',
      'eldiven', 'eldiven deri', 'eldiven yün', 'eldiven spor',
      'atkı', 'atkı yün', 'atkı ipek', 'atkı kışlık',
      'kemer', 'kemer deri', 'kemer metal', 'kemer plastik',
      
      // Renkler
      'siyah', 'beyaz', 'mavi', 'kırmızı', 'yeşil', 'sarı', 'mor', 'pembe',
      'kahverengi', 'gri', 'turuncu', 'lacivert', 'bordo', 'bej',
      'koyu', 'açık', 'pastel', 'parlak', 'mat',
      
      // Markalar (popüler)
      'nike', 'adidas', 'puma', 'converse', 'vans', 'new balance',
      'zara', 'h&m', 'mango', 'bershka', 'pull&bear', 'stradivarius',
      'lacoste', 'tommy hilfiger', 'calvin klein', 'levi\'s', 'diesel',
      
      // Özel durumlar
      'indirimli', 'fırsat', 'yeni', 'popüler', 'trend',
      'büyük beden', 'küçük beden', 'plus size', 'petite',
      'erkek', 'kadın', 'çocuk', 'bebek', 'unisex',
      
      // Çoklu kelime kombinasyonları
      'tişört beyaz', 'tişört siyah', 'tişört mavi', 'tişört kırmızı',
      'elbise beyaz', 'elbise siyah', 'elbise mavi', 'elbise kırmızı',
      'pantolon beyaz', 'pantolon siyah', 'pantolon mavi', 'pantolon kırmızı',
      'gömlek beyaz', 'gömlek siyah', 'gömlek mavi', 'gömlek kırmızı',
      'kazak beyaz', 'kazak siyah', 'kazak mavi', 'kazak kırmızı',
      'ceket beyaz', 'ceket siyah', 'ceket mavi', 'ceket kırmızı',
      'mont beyaz', 'mont siyah', 'mont mavi', 'mont kırmızı',
      'ayakkabı beyaz', 'ayakkabı siyah', 'ayakkabı mavi', 'ayakkabı kırmızı',
      'çanta beyaz', 'çanta siyah', 'çanta mavi', 'çanta kırmızı',
      
      // Renk + kategori kombinasyonları
      'beyaz tişört', 'siyah tişört', 'mavi tişört', 'kırmızı tişört',
      'beyaz elbise', 'siyah elbise', 'mavi elbise', 'kırmızı elbise',
      'beyaz pantolon', 'siyah pantolon', 'mavi pantolon', 'kırmızı pantolon',
      'beyaz gömlek', 'siyah gömlek', 'mavi gömlek', 'kırmızı gömlek',
      'beyaz kazak', 'siyah kazak', 'mavi kazak', 'kırmızı kazak',
      'beyaz ceket', 'siyah ceket', 'mavi ceket', 'kırmızı ceket',
      'beyaz mont', 'siyah mont', 'mavi mont', 'kırmızı mont',
      'beyaz ayakkabı', 'siyah ayakkabı', 'mavi ayakkabı', 'kırmızı ayakkabı',
      'beyaz çanta', 'siyah çanta', 'mavi çanta', 'kırmızı çanta',
      
      // Daha fazla kombinasyon
      'tişört erkek', 'tişört kadın', 'tişört çocuk',
      'elbise yazlık', 'elbise kışlık', 'elbise gece',
      'pantolon jean', 'pantolon kumaş', 'pantolon spor',
      'gömlek erkek', 'gömlek kadın', 'gömlek iş',
      'kazak yün', 'kazak polar', 'kazak boğazlı',
      'ceket deri', 'ceket kumaş', 'ceket blazer',
      'mont kışlık', 'mont deri', 'mont kumaş',
      'ayakkabı spor', 'ayakkabı klasik', 'ayakkabı bot',
      'çanta el', 'çanta sırt', 'çanta deri'
    ];

    // Kullanıcı önerileri
    const userSuggestions = users.map(user => user.name);

    let allSuggestions: string[] = [];
    
    // Arama türüne göre önerileri filtrele
    if (searchType === 'products') {
      allSuggestions = productSuggestions;
    } else {
      allSuggestions = userSuggestions;
    }

    // Basit ve etkili arama algoritması
    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
    
    // Tüm önerileri skorla
    const scoredSuggestions = allSuggestions.map(suggestion => {
      const suggestionLower = suggestion.toLowerCase();
      let score = 0;
      
      // 1. Tam eşleşme (en yüksek öncelik)
      if (suggestionLower === queryLower) {
        score = 1000;
      }
      // 2. Başlangıç eşleşmesi
      else if (suggestionLower.startsWith(queryLower)) {
        score = 800;
      }
      // 3. İçerik eşleşmesi
      else if (suggestionLower.includes(queryLower)) {
        score = 600;
      }
      // 4. Çoklu kelime eşleşmesi
      else if (queryWords.length > 1) {
        const matchingWords = queryWords.filter(word => suggestionLower.includes(word));
        if (matchingWords.length === queryWords.length) {
          score = 500; // Tüm kelimeler eşleşiyor
        } else if (matchingWords.length > 0) {
          score = 300; // Bazı kelimeler eşleşiyor
        }
      }
      // 5. Tek kelime için karakter bazlı eşleşme
      else if (queryWords.length === 1) {
        const word = queryWords[0];
        if (suggestionLower.includes(word)) {
          score = 400;
        } else {
          // Karakter bazlı eşleşme (typo tolerance)
          const matchingChars = word.split('').filter(char => suggestionLower.includes(char));
          if (matchingChars.length >= word.length * 0.7) { // %70 karakter eşleşmesi
            score = 200;
          }
        }
      }
      
      // Uzunluk bonusu (daha kısa öneriler öncelikli)
      if (score > 0) {
        score += Math.max(0, 50 - suggestion.length);
      }
      
      return { suggestion, score };
    });

    // Sadece eşleşen önerileri filtrele ve skora göre sırala
    return scoredSuggestions
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.suggestion)
      .slice(0, 8);
  };

  useEffect(() => {
    if (query.length >= 2) {
      // setIsLoading(true);
      const timer = setTimeout(async () => {
        const newSuggestions = await generateSuggestions(query);
        setSuggestions(newSuggestions);
        // setIsLoading(false);
        // Notify parent about suggestions count
        onSuggestionsCountChange?.(newSuggestions.length);
      }, 150); // Debounce

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      onSuggestionsCountChange?.(0);
    }
  }, [query, onSuggestionsCountChange]);

  // Handle Enter key when suggestion is selected
  useEffect(() => {
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        onSuggestionClick(suggestions[selectedIndex]);
      }
    };
    
    if (isVisible && suggestions.length > 0) {
      document.addEventListener('keydown', handleEnter);
      return () => document.removeEventListener('keydown', handleEnter);
    }
  }, [selectedIndex, suggestions, onSuggestionClick, isVisible]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  if (!isVisible || suggestions.length === 0) return null;

  // Akıllı algılama önerileri mi kontrol et (kullanılmıyor ama gelecekte kullanılabilir)
  // const isSmartSuggestion = getSmartSuggestions(query).length > 0;

  return (
    <div 
      style={{
        position: 'absolute',
        top: '100%',
        left: '80px',
        right: '0px',
        backgroundColor: isDarkMode ? '#1f2937' : 'white',
        border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        zIndex: 1000,
        marginTop: '0.25rem',
        maxHeight: '300px',
        overflowY: 'auto'
      }}>

      {/* Suggestions */}
      <div>
        {suggestions.map((suggestion, index) => {
          // Önerinin türünü belirle
          const isUserSuggestion = users.some(user => user.name === suggestion);
          const isRecentSearch = query.trim() === '' && index < 3; // İlk 3 öneri son arattıklar
          const isPopularSearch = query.trim() === '' && index >= 3; // Sonraki öneriler popüler aramalar
          
          let icon = '🛍️';
          let label = '';
          
          if (isUserSuggestion) {
            icon = '👤';
            label = 'Kullanıcı';
          } else if (isRecentSearch) {
            icon = '🕒';
            label = 'Son arattığın';
          } else if (isPopularSearch) {
            icon = '🔥';
            label = 'Popüler';
          } else {
            icon = '🛍️';
            label = 'Ürün';
          }
          
          const isSelected = selectedIndex === index;
          
          return (
            <button
              key={index}
              ref={(el) => { suggestionRefs.current[index] = el; }}
              onClick={() => onSuggestionClick(suggestion)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: isSelected 
                  ? (isDarkMode ? '#1e40af' : '#dbeafe')
                  : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                color: isSelected 
                  ? (isDarkMode ? '#60a5fa' : '#1d4ed8')
                  : (isDarkMode ? '#f9fafb' : '#374151'),
                borderBottom: isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #f3f4f6',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: isSelected ? '600' : '400'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '14px' }}>{icon}</span>
              <span style={{ flex: 1 }}>{suggestion}</span>
              {label && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  fontStyle: 'italic'
                }}>
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '0.5rem 1rem',
        borderTop: '1px solid #f3f4f6',
        backgroundColor: '#f9fafb',
        fontSize: '0.75rem',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        <span>💡 Yön tuşları ile gezin, Enter ile seç</span>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SearchSuggestions;

