import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from './ProductCard';
import AdvancedFilters from './AdvancedFilters';
import { productsWithUsers, users } from '../data/products';
import './ProductGrid.css';

interface SearchResultsProps {
  favoriteProducts: number[];
  onToggleFavorite: (productId: number) => void;
}

const SearchResults = ({ favoriteProducts, onToggleFavorite }: SearchResultsProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState(productsWithUsers);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>(() => {
    // localStorage'dan sıralama seçimini yükle
    const savedSort = localStorage.getItem('searchResultsSortBy');
    return savedSort || 'popularity';
  });
  const gridRef = useRef<HTMLDivElement>(null);
  
  const query = searchParams.get('q') || '';
  const searchType = searchParams.get('type') || 'all';

  // Sıralama fonksiyonu
  const sortProducts = (products: any[], sortType: string) => {
    return [...products].sort((a, b) => {
      switch (sortType) {
        case 'price-low':
          const priceA = parseFloat(a.price?.replace(/[^\d]/g, '') || '0');
          const priceB = parseFloat(b.price?.replace(/[^\d]/g, '') || '0');
          return priceA - priceB;
        
        case 'price-high':
          const priceAHigh = parseFloat(a.price?.replace(/[^\d]/g, '') || '0');
          const priceBHigh = parseFloat(b.price?.replace(/[^\d]/g, '') || '0');
          return priceBHigh - priceAHigh;
        
        case 'date-new':
          const dateANew = new Date(a.shareDate || '').getTime();
          const dateBNew = new Date(b.shareDate || '').getTime();
          return dateBNew - dateANew;
        
        case 'date-old':
          const dateAOld = new Date(a.shareDate || '').getTime();
          const dateBOld = new Date(b.shareDate || '').getTime();
          return dateAOld - dateBOld;
        
        case 'popularity':
        default:
          return (b.likes || 0) - (a.likes || 0);
      }
    });
  };

  // Akıllı algılama sistemi - Sadece mantıklı olmayan kelimeler için öneri
  const getSmartSuggestions = (searchQuery: string): string[] => {
    // Mantıklı kelimeler listesi (bu kelimeler için öneri çıkmaz)
    const validWords = [
      // Giyim kategorileri
      'elbise', 'ayakkabı', 'gömlek', 'pantolon', 'tişört', 'kazak', 'ceket', 'mont',
      'spor', 'saat', 'çanta', 'telefon', 'laptop', 'eldiven', 'elektronik',
      
      // Renkler
      'beyaz', 'siyah', 'mavi', 'kırmızı', 'yeşil', 'sarı', 'kahverengi', 'gri', 'pembe', 'mor',
      
      // Cinsiyet
      'erkek', 'kadın', 'unisex',
      
      // Mevsimler
      'yazlık', 'kışlık', 'gece', 'iş', 'günlük', 'resmi',
      
      // Malzemeler
      'deri', 'kumaş', 'pamuk', 'yün', 'polar', 'jean', 'keten',
      
      // Stiller
      'klasik', 'modern', 'vintage', 'casual', 'formal', 'sportif',
      
      // Aksesuarlar
      'kılıf', 'aksesuar', 'kablo', 'stand', 'kıyafet', 'giyim',
      
      // Kısaltmalar (bunlar da mantıklı)
      'el', 'ay', 'go', 'pa', 'ti', 'ka', 'ce', 'mo', 'sp', 'sa', 'ca', 'te', 'la',
      'be', 'si', 'ma', 'ki', 'ye', 'sar', 'kah'
    ];

    // Eğer tam kelime mantıklıysa öneri çıkarma
    if (validWords.includes(searchQuery.toLowerCase())) {
      return [];
    }

    // Mantıklı olmayan kelimeler için en yakın öneriler
    const query = searchQuery.toLowerCase();
    
    // "ayak" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('ayak') && !validWords.includes(query)) {
      return ['ayakkabı', 'ayakkabı spor', 'ayakkabı klasik', 'ayakkabı bot', 'ayakkabı sandalet'];
    }
    
    // "el" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('el') && !validWords.includes(query)) {
      return ['elbise', 'elbise yazlık', 'elbise kışlık', 'elbise gece', 'elbise iş'];
    }
    
    // "göm" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('göm') && !validWords.includes(query)) {
      return ['gömlek', 'gömlek erkek', 'gömlek kadın', 'gömlek beyaz', 'gömlek mavi'];
    }
    
    // "pan" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('pan') && !validWords.includes(query)) {
      return ['pantolon', 'pantolon jean', 'pantolon kumaş', 'pantolon siyah', 'pantolon mavi'];
    }
    
    // "tiş" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('tiş') && !validWords.includes(query)) {
      return ['tişört', 'tişört erkek', 'tişört kadın', 'tişört beyaz', 'tişört siyah'];
    }
    
    // "kaz" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('kaz') && !validWords.includes(query)) {
      return ['kazak', 'kazak yün', 'kazak polar', 'kazak boğazlı', 'kazak düğmeli'];
    }
    
    // "cek" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('cek') && !validWords.includes(query)) {
      return ['ceket', 'ceket deri', 'ceket kumaş', 'ceket blazer', 'ceket mont'];
    }
    
    // "mon" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('mon') && !validWords.includes(query)) {
      return ['mont', 'mont kışlık', 'mont deri', 'mont kumaş', 'mont erkek'];
    }
    
    // "spo" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('spo') && !validWords.includes(query)) {
      return ['spor', 'spor ayakkabı', 'spor kıyafet', 'spor çanta', 'spor saat'];
    }
    
    // "saa" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('saa') && !validWords.includes(query)) {
      return ['saat', 'saat erkek', 'saat kadın', 'saat spor', 'saat klasik'];
    }
    
    // "çan" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('çan') && !validWords.includes(query)) {
      return ['çanta', 'çanta el', 'çanta sırt', 'çanta deri', 'çanta spor'];
    }
    
    // "tel" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('tel') && !validWords.includes(query)) {
      return ['telefon', 'telefon kılıf', 'telefon aksesuar', 'telefon kablosu'];
    }
    
    // "lap" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('lap') && !validWords.includes(query)) {
      return ['laptop', 'laptop çanta', 'laptop stand', 'laptop kılıf'];
    }
    
    // "bey" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('bey') && !validWords.includes(query)) {
      return ['beyaz', 'beyaz elbise', 'beyaz gömlek', 'beyaz ayakkabı', 'beyaz tişört'];
    }
    
    // "siy" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('siy') && !validWords.includes(query)) {
      return ['siyah', 'siyah elbise', 'siyah gömlek', 'siyah ayakkabı', 'siyah tişört'];
    }
    
    // "mav" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('mav') && !validWords.includes(query)) {
      return ['mavi', 'mavi elbise', 'mavi gömlek', 'mavi ayakkabı', 'mavi tişört'];
    }
    
    // "kır" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('kır') && !validWords.includes(query)) {
      return ['kırmızı', 'kırmızı elbise', 'kırmızı gömlek', 'kırmızı ayakkabı', 'kırmızı tişört'];
    }
    
    // "yeş" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('yeş') && !validWords.includes(query)) {
      return ['yeşil', 'yeşil elbise', 'yeşil gömlek', 'yeşil ayakkabı', 'yeşil tişört'];
    }
    
    // "sar" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('sar') && !validWords.includes(query)) {
      return ['sarı', 'sarı elbise', 'sarı gömlek', 'sarı ayakkabı', 'sarı tişört'];
    }
    
    // "kah" ile başlayan mantıklı olmayan kelimeler
    if (query.startsWith('kah') && !validWords.includes(query)) {
      return ['kahverengi', 'kahverengi elbise', 'kahverengi gömlek', 'kahverengi ayakkabı', 'kahverengi tişört'];
    }

    return [];
  };

  // Kullanıcı arama algoritması
  const searchUsers = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUserResults([]);
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      const filteredUsers = users.filter(user => {
        const searchTerm = searchQuery.toLowerCase().trim();
        const userName = user.name.toLowerCase();
        
        return userName.includes(searchTerm) || 
               searchTerm.split('').every(char => userName.includes(char));
      });

      setUserResults(filteredUsers);
      setIsLoading(false);
      // Kullanıcı arama sonuçları yüklendiğinde sayfayı en üste kaydır
      window.scrollTo(0, 0);
    }, 300);
  };

  // Yeni gelişmiş arama algoritması
  const searchProducts = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults(productsWithUsers);
      return;
    }

    setIsLoading(true);
    
    // Simüle edilmiş arama gecikmesi
    setTimeout(() => {
      const searchTerm = searchQuery.toLowerCase().trim();
      const searchWords = searchTerm.split(' ').filter(word => word.length > 1); // 1 karakterden uzun kelimeler
      
      // Her ürün için skor hesapla
      const scoredProducts = productsWithUsers.map(product => {
        const productTitle = product.title.toLowerCase();
        const productCategory = product.category?.toLowerCase() || '';
        const productSubcategory = product.subcategory?.toLowerCase() || '';
        const productDescription = product.description?.toLowerCase() || '';
        
        let totalScore = 0;
        let hasMatch = false;
        
        // TEK KELİME ARAMASI: Geniş arama (beyaz → içinde beyaz olan her şey)
        if (searchWords.length === 1) {
          const word = searchWords[0];
          let wordScore = 0;
          
          // 1. BAŞLIKTA EŞLEŞME (En yüksek öncelik - 100 puan)
          if (productTitle.includes(word)) {
            // Tam eşleşme bonusu
            if (productTitle === word) {
              wordScore += 100;
            }
            // Başlangıçta eşleşme bonusu
            else if (productTitle.startsWith(word)) {
              wordScore += 80;
            }
            // İçerikte eşleşme
            else {
              wordScore += 60;
            }
            hasMatch = true;
          }
          
          // 2. KATEGORİ/ALT KATEGORİDE EŞLEŞME (Yüksek öncelik - 50 puan)
          if (productCategory.includes(word)) {
            wordScore += 50;
            hasMatch = true;
          }
          if (productSubcategory.includes(word)) {
            wordScore += 50;
            hasMatch = true;
          }
          
          // 3. AÇIKLAMADA EŞLEŞME (Orta öncelik - 20 puan)
          if (productDescription.includes(word)) {
            wordScore += 20;
            hasMatch = true;
          }
          
          totalScore = wordScore;
        }
        // ÇOKLU KELİME ARAMASI: Esnek arama (ayakkabı beyaz saat → en az 1 kelime eşleşmeli)
        else {
          // En az 1 kelime eşleşmeli (tüm kelimeler değil)
          const matchingWords = searchWords.filter(word => {
            return productTitle.includes(word) || 
                   productCategory.includes(word) || 
                   productSubcategory.includes(word) || 
                   productDescription.includes(word);
          });
          
          // En az 1 kelime eşleşiyorsa ürünü dahil et
          if (matchingWords.length > 0) {
            hasMatch = true;
            
            // Eşleşen kelime sayısına göre bonus puan
            const matchRatio = matchingWords.length / searchWords.length;
            const matchBonus = Math.floor(matchRatio * 100); // %100 eşleşme = 100 bonus puan
            
            // Her eşleşen kelime için skor hesapla
            matchingWords.forEach(word => {
              let wordScore = 0;
              
              // 1. BAŞLIKTA EŞLEŞME (En yüksek öncelik - 100 puan)
              if (productTitle.includes(word)) {
                // Tam eşleşme bonusu
                if (productTitle === word) {
                  wordScore += 100;
                }
                // Başlangıçta eşleşme bonusu
                else if (productTitle.startsWith(word)) {
                  wordScore += 80;
                }
                // İçerikte eşleşme
                else {
                  wordScore += 60;
                }
              }
              
              // 2. KATEGORİ/ALT KATEGORİDE EŞLEŞME (Yüksek öncelik - 50 puan)
              if (productCategory.includes(word)) {
                wordScore += 50;
              }
              if (productSubcategory.includes(word)) {
                wordScore += 50;
              }
              
              // 3. AÇIKLAMADA EŞLEŞME (Orta öncelik - 20 puan)
              if (productDescription.includes(word)) {
                wordScore += 20;
              }
              
              totalScore += wordScore;
            });
            
            // Eşleşme oranı bonusu
            totalScore += matchBonus;
            
            // Tam arama terimi eşleşmesi bonusu (ekstra 50 puan)
            if (productTitle.includes(searchTerm)) {
              totalScore += 50;
            }
            if (productCategory.includes(searchTerm) || productSubcategory.includes(searchTerm)) {
              totalScore += 30;
            }
            if (productDescription.includes(searchTerm)) {
              totalScore += 10;
            }
          }
        }
        
        return {
          product,
          score: totalScore,
          hasMatch
        };
      });
      
      // Sadece eşleşen ürünleri filtrele ve skora göre sırala
      let filteredProducts = scoredProducts
        .filter(item => item.hasMatch)
        .sort((a, b) => {
          // Önce skora göre sırala
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          // Aynı skorda beğeni sayısına göre sırala
          return (b.product.likes || 0) - (a.product.likes || 0);
        })
        .map(item => item.product);

      // Gelişmiş filtreleri uygula
      if (Object.keys(appliedFilters).length > 0) {
        filteredProducts = filteredProducts.filter(product => {
          // Fiyat aralığı filtresi
          if (appliedFilters.priceRange) {
            const price = parseFloat(product.price?.replace('₺', '').replace(',', '') || '0');
            const { min, max } = appliedFilters.priceRange;
            if (price < min || price > max) return false;
          }

          // Mağaza filtresi
          if (appliedFilters.store && appliedFilters.store.length > 0) {
            if (!appliedFilters.store.includes(product.store)) return false;
          }

          // Alt kategori filtresi
          if (appliedFilters.subcategory && appliedFilters.subcategory.length > 0) {
            if (!appliedFilters.subcategory.includes(product.subcategory)) return false;
          }

          // Mevsim filtresi
          if (appliedFilters.season && appliedFilters.season.length > 0) {
            if (!appliedFilters.season.includes(product.season)) return false;
          }

          // Beden filtresi
          if (appliedFilters.size && appliedFilters.size.length > 0) {
            // Bu örnekte beden bilgisi yok, gerçek uygulamada product.size olabilir
            // if (!appliedFilters.size.includes(product.size)) return false;
          }

          // Kumaş filtresi
          if (appliedFilters.fabric && appliedFilters.fabric.length > 0) {
            // if (!appliedFilters.fabric.includes(product.fabric)) return false;
          }

          // Marka filtresi
          if (appliedFilters.brand && appliedFilters.brand.length > 0) {
            // if (!appliedFilters.brand.includes(product.brand)) return false;
          }

          return true;
        });
      }

      // Eğer sonuç bulunamazsa, akıllı fallback arama yap
      if (filteredProducts.length === 0) {
        // İlk kelimeyi kullanarak fallback arama yap
        const firstWord = searchWords[0];
        if (firstWord) {
          const fallbackProducts = productsWithUsers.filter(product => {
            const productTitle = product.title.toLowerCase();
            const productCategory = product.category?.toLowerCase() || '';
            const productSubcategory = product.subcategory?.toLowerCase() || '';
            const productDescription = product.description?.toLowerCase() || '';
            
            return productTitle.includes(firstWord) || 
                   productCategory.includes(firstWord) || 
                   productSubcategory.includes(firstWord) || 
                   productDescription.includes(firstWord);
          });
          
          if (fallbackProducts.length > 0) {
            setSearchResults(fallbackProducts.slice(0, 12));
          } else {
            // Hiç sonuç bulunamazsa, popüler ürünleri göster
            const popularProducts = [...productsWithUsers]
              .sort((a, b) => (b.likes || 0) - (a.likes || 0))
              .slice(0, 8);
            setSearchResults(popularProducts);
          }
        } else {
          // Hiç kelime yoksa, popüler ürünleri göster
          const popularProducts = [...productsWithUsers]
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, 8);
          setSearchResults(popularProducts);
        }
      } else {
        setSearchResults(filteredProducts);
      }
      
      setIsLoading(false);
      // Arama sonuçları yüklendiğinde sayfayı en üste kaydır
      window.scrollTo(0, 0);
    }, 300);
  };

  useEffect(() => {
    if (searchType === 'users') {
      searchUsers(query);
      // Kullanıcı araması için ürün sonuçlarını temizle
      setSearchResults([]);
    } else {
      searchProducts(query);
      // Ürün araması için kullanıcı sonuçlarını temizle
      setUserResults([]);
      
      // Yeni arama yapıldığında sıralama seçimini sıfırla
      if (query && query.trim()) {
        setSortBy('popularity');
        localStorage.removeItem('searchResultsSortBy');
        console.log('🔄 Yeni arama yapıldı, sıralama sıfırlandı:', query);
      }
    }
  }, [query, searchType]);

  useEffect(() => {
    if (searchType === 'products') {
      searchProducts(query);
    }
  }, [appliedFilters, searchType]);

  // Masonry layout için row-span hesaplama
  useEffect(() => {
    if (gridRef.current && searchResults.length > 0) {
      // Kısa bir gecikme ile hesaplama yap (DOM render'ı tamamlanması için)
      const timer = setTimeout(() => {
        const gridItems = gridRef.current?.querySelectorAll('.grid-item');
        if (gridItems) {
          const rowHeight = 10; // CSS'teki grid-auto-rows değeri
          
          gridItems.forEach((item) => {
            const element = item as HTMLElement;
            if (element.offsetHeight > 0) {
              const height = element.offsetHeight;
              const rowSpan = Math.ceil(height / rowHeight);
              element.style.setProperty('--row-span', rowSpan.toString());
            }
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [searchResults]);

  // Sıralama değiştiğinde masonry layout'u yeniden hesapla
  useEffect(() => {
    const calculateRowSpans = () => {
      if (gridRef.current) {
        const gridItems = gridRef.current.querySelectorAll('.grid-item');
        const rowHeight = 10; // CSS'teki grid-auto-rows değeri
        
        gridItems.forEach((item) => {
          const element = item as HTMLElement;
          const height = element.offsetHeight;
          const rowSpan = Math.ceil(height / rowHeight);
          element.style.setProperty('--row-span', rowSpan.toString());
        });
      }
    };

    // Sıralama değiştiğinde layout'u yeniden hesapla
    const timer = setTimeout(calculateRowSpans, 200);
    
    return () => clearTimeout(timer);
  }, [sortBy]);

  // Sıralama değiştiğinde grid container'ı yeniden oluştur
  const [gridKey, setGridKey] = useState(0);
  
  useEffect(() => {
    setGridKey(prev => prev + 1);
  }, [sortBy]);

  // Sıralama seçimini localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('searchResultsSortBy', sortBy);
    console.log('💾 Arama sıralama seçimi kaydedildi:', sortBy);
  }, [sortBy]);

  return (
    <div style={{ padding: '2rem 1rem', marginLeft: '50px' }}>
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto' 
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: '#111827', 
                marginBottom: '0.5rem',
                margin: '0 0 0.5rem 0'
              }}>
                {query ? `"${query}" için arama sonuçları` : 'Arama Sonuçları'}
              </h1>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '1rem',
                margin: 0
              }}>
                {isLoading ? 'Aranıyor...' : 
                  searchType === 'users' ? `${userResults.length} kullanıcı bulundu` :
                  `${searchResults.length} ürün bulundu`
                }
              </p>
            </div>
            
            {/* Filtre Butonu - Sadece ürün araması için */}
            {searchType === 'products' && (
              <button
                onClick={() => setShowFilters(true)}
                style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              Gelişmiş Filtreler
              {Object.keys(appliedFilters).length > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginLeft: '0.25rem'
                }}>
                  {Object.keys(appliedFilters).length}
                </span>
              )}
            </button>
            )}
          </div>
        </div>

        {/* Sıralama Seçici - Sadece ürün araması için */}
        {searchType === 'products' && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '2rem',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '0.5rem 1rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                width: '1.5rem',
                height: '1.5rem',
                backgroundColor: '#6366f1',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.75rem'
              }}>
                🔄
              </div>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Sırala:
              </span>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '1rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <option value="popularity">🔥 Popülerlik</option>
              <option value="price-low">💰 Fiyat (Düşük → Yüksek)</option>
              <option value="price-high">💰 Fiyat (Yüksek → Düşük)</option>
              <option value="date-new">📅 Tarih (Yeni → Eski)</option>
              <option value="date-old">📅 Tarih (Eski → Yeni)</option>
            </select>
          </div>
        )}

        {/* Akıllı Algılama Önerileri */}
        {!isLoading && query && getSmartSuggestions(query).length > 0 && searchResults.length > 0 && (
          <div style={{
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>💡</span>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: 0
              }}>
                Bunu mu demek istediniz?
              </h3>
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {getSmartSuggestions(query).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(suggestion)}&type=${searchType}`)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#374151';
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '4rem 2rem'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Ürünler aranıyor...
              </p>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && (
          <>
            {/* Kullanıcı Sonuçları - Sadece kullanıcı araması için */}
            {searchType === 'users' && userResults.length > 0 && (
              <div style={{ marginBottom: '2rem', clear: 'both' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                  👤 Kullanıcılar
                </h2>
                <div className="user-results-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1rem',
                  width: '100%',
                  marginBottom: '2rem'
                }}>
                  {userResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => navigate(`/user/${user.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        width: '100%',
                        minHeight: '80px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#111827' }}>
                            {user.name}
                          </h3>
                          {user.verified && (
                            <span style={{ color: '#10b981', fontSize: '1.2rem' }}>✓</span>
                          )}
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                          Kullanıcı Profili
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ürün Sonuçları - Sadece ürün araması için */}
            {searchType === 'products' && searchResults.length > 0 && (
              <div style={{ marginBottom: '2rem', clear: 'both', position: 'relative' }}>
                <div 
                  key={gridKey}
                  ref={gridRef} 
                  className="grid-container" 
                  style={{ 
                    clear: 'both',
                    position: 'relative',
                    zIndex: 2,
                    isolation: 'isolate'
                  }}
                >
                  {sortProducts(searchResults, sortBy).map((product, index) => (
                    <div 
                      key={`${product.id}-${sortBy}-${index}`} 
                      className="grid-item"
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        isolation: 'isolate'
                      }}
                    >
                      <ProductCard 
                        product={product}
                        isFavorite={favoriteProducts.includes(product.id)}
                        onToggleFavorite={onToggleFavorite}
                        onAddToCart={() => {}}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sonuç Bulunamadı */}
            {((searchType === 'users' && userResults.length === 0) || 
              (searchType === 'products' && searchResults.length === 0)) && (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: '#6b7280'
              }}>
                <svg width="64" height="64" fill="#d1d5db" viewBox="0 0 24 24" style={{ marginBottom: '1rem' }}>
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                  {searchType === 'users' ? 'Kullanıcı bulunamadı' : 'Ürün bulunamadı'}
                </h3>
                <p style={{ marginBottom: '2rem' }}>
                  Aradığınız kriterlere uygun {searchType === 'users' ? 'kullanıcı' : 'ürün'} bulunamadı. Farklı anahtar kelimeler deneyin.
                </p>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Ana Sayfaya Dön
                </button>
              </div>
            )}
          </>
        )}

        {/* Search Suggestions */}
        {!isLoading && searchResults.length > 0 && (
          <div style={{
            marginTop: '3rem',
            padding: '2rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1rem'
            }}>
              💡 Arama İpuçları
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Daha spesifik arayın
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  "spor ayakkabı" yerine "nike spor ayakkabı" deneyin
                </p>
              </div>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Kategori kullanın
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  "kadın elbise", "erkek gömlek" gibi kategoriler ekleyin
                </p>
              </div>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Marka belirtin
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  "adidas", "nike", "zara" gibi marka isimleri kullanın
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Gelişmiş Filtreler Modal */}
        {showFilters && (
          <AdvancedFilters
            products={searchResults}
            selectedCategory={query}
            initialFilters={appliedFilters}
            onFiltersChange={(filters) => {
              setAppliedFilters(filters);
              setShowFilters(false);
            }}
            onClose={() => setShowFilters(false)}
          />
        )}
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

export default SearchResults;

