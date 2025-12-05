import { useState, useEffect } from 'react';
import type { Product } from '../types/Product';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  key: string;
  label: string;
  type: 'select' | 'range' | 'checkbox' | 'color';
  options: FilterOption[];
  multiple?: boolean;
  minValue?: number;
  maxValue?: number;
}

interface AdvancedFiltersProps {
  products: Product[];
  selectedCategory: string;
  onFiltersChange: (filters: Record<string, any>) => void;
  onClose: () => void;
  initialFilters?: Record<string, any>;
}

const AdvancedFilters = ({ products, selectedCategory, onFiltersChange, onClose, initialFilters = {} }: AdvancedFiltersProps) => {
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  const [availableFilters, setAvailableFilters] = useState<FilterGroup[]>([]);
  const [priceRange, setPriceRange] = useState({ 
    min: initialFilters.priceRange?.min?.toString() || '', 
    max: initialFilters.priceRange?.max?.toString() || '' 
  });

  // Kategoriye göre filtreleri belirle
  useEffect(() => {
    const getFiltersForCategory = (category: string): FilterGroup[] => {
      // Arama terimine göre dinamik filtreler oluştur
      const isSearchQuery = category && !['Kadın', 'Erkek', 'Anne & Çocuk', 'Ev & Yaşam', 'Süpermarket', 'Elektronik', 'Spor & Outdoor'].includes(category);
      
      // Mevcut ürünlerden dinamik mağaza seçenekleri oluştur
      const availableStores = [...new Set(products.map(p => p.store).filter(Boolean))];
      const storeOptions = availableStores.map(store => ({ value: store, label: store }));
      
      // Ana sayfa için fiyat aralığı hesapla
      const allPrices = products
        .map(p => {
          const priceStr = p.price?.replace(/[^\d]/g, '') || '0';
          return parseInt(priceStr) || 0;
        })
        .filter(price => price > 0);
      
      console.log('🔍 Fiyat Hesaplama Debug:');
      console.log('Ürün sayısı:', products.length);
      console.log('Fiyatlı ürün sayısı:', allPrices.length);
      console.log('Min fiyat:', allPrices.length > 0 ? Math.min(...allPrices) : 'Yok');
      console.log('Max fiyat:', allPrices.length > 0 ? Math.max(...allPrices) : 'Yok');
      
      const baseFilters: FilterGroup[] = [
        {
          key: 'priceRange',
          label: 'Fiyat Aralığı',
          type: 'range',
          options: [],
          minValue: allPrices.length > 0 ? Math.min(...allPrices) : 0,
          maxValue: allPrices.length > 0 ? Math.max(...allPrices) : 10000
        },
        {
          key: 'store',
          label: 'Mağaza',
          type: 'checkbox',
          options: storeOptions.length > 0 ? storeOptions.filter(option => option.value && option.label).map(option => ({ value: option.value!, label: option.label! })) : [
            { value: 'Trendyol', label: 'Trendyol' },
            { value: 'Hepsiburada', label: 'Hepsiburada' },
            { value: 'N11', label: 'N11' }
          ],
          multiple: true
        },
        {
          key: 'rating',
          label: 'Değerlendirme',
          type: 'select',
          options: [
            { value: '4.5+', label: '4.5+ Yıldız' },
            { value: '4.0+', label: '4.0+ Yıldız' },
            { value: '3.5+', label: '3.5+ Yıldız' },
            { value: '3.0+', label: '3.0+ Yıldız' }
          ]
        }
      ];

      // Kategoriye özel filtreler
      if (category === 'Erkek Giyim' || category === 'Erkek') {
        return [
          ...baseFilters,
          {
            key: 'subcategory',
            label: 'Alt Kategori',
            type: 'checkbox',
            options: [
              { value: 'Üst Giyim', label: 'Üst Giyim' },
              { value: 'Alt Giyim', label: 'Alt Giyim' },
              { value: 'Gömlek', label: 'Gömlek' },
              { value: 'Ceket', label: 'Ceket' }
            ],
            multiple: true
          },
          {
            key: 'size',
            label: 'Beden',
            type: 'checkbox',
            options: [
              { value: 'S', label: 'S' },
              { value: 'M', label: 'M' },
              { value: 'L', label: 'L' },
              { value: 'XL', label: 'XL' },
              { value: 'XXL', label: 'XXL' }
            ],
            multiple: true
          },
          {
            key: 'season',
            label: 'Mevsim',
            type: 'checkbox',
            options: [
              { value: 'Yazlık', label: 'Yazlık' },
              { value: 'Kışlık', label: 'Kışlık' }
            ],
            multiple: true
          },
          {
            key: 'material',
            label: 'Kumaş',
            type: 'checkbox',
            options: [
              { value: 'Pamuk', label: 'Pamuk' },
              { value: 'Denim', label: 'Denim' },
              { value: 'Deri', label: 'Deri' },
              { value: 'Polyester', label: 'Polyester' }
            ],
            multiple: true
          }
        ];
      }

      if (category === 'Kadın Giyim' || category === 'Kadın') {
        return [
          ...baseFilters,
          {
            key: 'subcategory',
            label: 'Alt Kategori',
            type: 'checkbox',
            options: [
              { value: 'Elbise', label: 'Elbise' },
              { value: 'Üst Giyim', label: 'Üst Giyim' },
              { value: 'Alt Giyim', label: 'Alt Giyim' }
            ],
            multiple: true
          },
          {
            key: 'dressSize',
            label: 'Elbise Bedeni',
            type: 'checkbox',
            options: [
              { value: 'XS', label: 'XS' },
              { value: 'S', label: 'S' },
              { value: 'M', label: 'M' },
              { value: 'L', label: 'L' },
              { value: 'XL', label: 'XL' }
            ],
            multiple: true
          },
          {
            key: 'dressLength',
            label: 'Elbise Boyu',
            type: 'checkbox',
            options: [
              { value: 'Mini', label: 'Mini' },
              { value: 'Midi', label: 'Midi' },
              { value: 'Maxi', label: 'Maxi' }
            ],
            multiple: true
          },
          {
            key: 'occasion',
            label: 'Kullanım Amacı',
            type: 'checkbox',
            options: [
              { value: 'Günlük', label: 'Günlük' },
              { value: 'İş', label: 'İş' },
              { value: 'Özel Günler', label: 'Özel Günler' },
              { value: 'Gece', label: 'Gece' }
            ],
            multiple: true
          },
          {
            key: 'season',
            label: 'Mevsim',
            type: 'checkbox',
            options: [
              { value: 'Yazlık', label: 'Yazlık' },
              { value: 'Kışlık', label: 'Kışlık' }
            ],
            multiple: true
          }
        ];
      }

      if (category === 'Anne & Çocuk') {
        return [
          ...baseFilters,
          {
            key: 'subcategory',
            label: 'Alt Kategori',
            type: 'checkbox',
            options: [
              { value: 'Bebek Giyim', label: 'Bebek Giyim' },
              { value: 'Çocuk Giyim', label: 'Çocuk Giyim' }
            ],
            multiple: true
          },
          {
            key: 'ageGroup',
            label: 'Yaş Grubu',
            type: 'checkbox',
            options: [
              { value: '0-6 ay', label: '0-6 ay' },
              { value: '6-12 ay', label: '6-12 ay' },
              { value: '1-2 yaş', label: '1-2 yaş' },
              { value: '2-4 yaş', label: '2-4 yaş' },
              { value: '4-6 yaş', label: '4-6 yaş' }
            ],
            multiple: true
          },
          {
            key: 'gender',
            label: 'Cinsiyet',
            type: 'checkbox',
            options: [
              { value: 'Kız', label: 'Kız' },
              { value: 'Erkek', label: 'Erkek' },
              { value: 'Unisex', label: 'Unisex' }
            ],
            multiple: true
          }
        ];
      }

      if (category === 'Ev & Yaşam') {
        return [
          ...baseFilters,
          {
            key: 'subcategory',
            label: 'Alt Kategori',
            type: 'checkbox',
            options: [
              { value: 'Mobilya', label: 'Mobilya' },
              { value: 'Dekorasyon', label: 'Dekorasyon' },
              { value: 'Mutfak', label: 'Mutfak' }
            ],
            multiple: true
          },
          {
            key: 'room',
            label: 'Oda',
            type: 'checkbox',
            options: [
              { value: 'Yatak Odası', label: 'Yatak Odası' },
              { value: 'Oturma Odası', label: 'Oturma Odası' },
              { value: 'Mutfak', label: 'Mutfak' },
              { value: 'Banyo', label: 'Banyo' }
            ],
            multiple: true
          },
          {
            key: 'material',
            label: 'Malzeme',
            type: 'checkbox',
            options: [
              { value: 'Ahşap', label: 'Ahşap' },
              { value: 'Metal', label: 'Metal' },
              { value: 'Plastik', label: 'Plastik' },
              { value: 'Cam', label: 'Cam' }
            ],
            multiple: true
          }
        ];
      }

      if (category === 'Süpermarket') {
        return [
          ...baseFilters,
          {
            key: 'subcategory',
            label: 'Alt Kategori',
            type: 'checkbox',
            options: [
              { value: 'Gıda', label: 'Gıda' },
              { value: 'İçecek', label: 'İçecek' },
              { value: 'Temizlik', label: 'Temizlik' }
            ],
            multiple: true
          },
          {
            key: 'dietary',
            label: 'Diyet Özellikleri',
            type: 'checkbox',
            options: [
              { value: 'Organik', label: 'Organik' },
              { value: 'Glutensiz', label: 'Glutensiz' },
              { value: 'Laktozsuz', label: 'Laktozsuz' },
              { value: 'Vegan', label: 'Vegan' }
            ],
            multiple: true
          },
          {
            key: 'freshness',
            label: 'Tazelik',
            type: 'checkbox',
            options: [
              { value: 'Taze', label: 'Taze' },
              { value: 'Dondurulmuş', label: 'Dondurulmuş' },
              { value: 'Konserve', label: 'Konserve' }
            ],
            multiple: true
          }
        ];
      }

      if (category === 'Elektronik') {
        return [
          ...baseFilters,
          {
            key: 'subcategory',
            label: 'Alt Kategori',
            type: 'checkbox',
            options: [
              { value: 'Telefon & Tablet', label: 'Telefon & Tablet' },
              { value: 'Bilgisayar', label: 'Bilgisayar' },
              { value: 'TV & Ses', label: 'TV & Ses' }
            ],
            multiple: true
          },
          {
            key: 'brand',
            label: 'Marka',
            type: 'checkbox',
            options: [
              { value: 'Apple', label: 'Apple' },
              { value: 'Samsung', label: 'Samsung' },
              { value: 'Huawei', label: 'Huawei' },
              { value: 'Xiaomi', label: 'Xiaomi' }
            ],
            multiple: true
          },
          {
            key: 'screenSize',
            label: 'Ekran Boyutu',
            type: 'checkbox',
            options: [
              { value: '5-6 inç', label: '5-6 inç' },
              { value: '6-7 inç', label: '6-7 inç' },
              { value: '7+ inç', label: '7+ inç' }
            ],
            multiple: true
          },
          {
            key: 'storage',
            label: 'Depolama',
            type: 'checkbox',
            options: [
              { value: '64GB', label: '64GB' },
              { value: '128GB', label: '128GB' },
              { value: '256GB', label: '256GB' },
              { value: '512GB+', label: '512GB+' }
            ],
            multiple: true
          }
        ];
      }

      if (category === 'Spor & Outdoor') {
        return [
          ...baseFilters,
          {
            key: 'subcategory',
            label: 'Alt Kategori',
            type: 'checkbox',
            options: [
              { value: 'Spor Giyim', label: 'Spor Giyim' },
              { value: 'Spor Ayakkabı', label: 'Spor Ayakkabı' },
              { value: 'Fitness', label: 'Fitness' }
            ],
            multiple: true
          },
          {
            key: 'sportType',
            label: 'Spor Türü',
            type: 'checkbox',
            options: [
              { value: 'Fitness', label: 'Fitness' },
              { value: 'Koşu', label: 'Koşu' },
              { value: 'Futbol', label: 'Futbol' },
              { value: 'Basketbol', label: 'Basketbol' }
            ],
            multiple: true
          },
          {
            key: 'shoeSize',
            label: 'Ayakkabı Numarası',
            type: 'checkbox',
            options: [
              { value: '36-38', label: '36-38' },
              { value: '39-41', label: '39-41' },
              { value: '42-44', label: '42-44' },
              { value: '45+', label: '45+' }
            ],
            multiple: true
          }
        ];
      }

      // Arama terimi için dinamik filtreler
      if (isSearchQuery) {
        const searchTerm = category.toLowerCase();
        
        // Arama terimine göre ürünleri filtrele
        const filteredProducts = products.filter(product => {
          const titleMatch = product.title.toLowerCase().includes(searchTerm);
          const categoryMatch = product.category?.toLowerCase().includes(searchTerm);
          const subcategoryMatch = product.subcategory?.toLowerCase().includes(searchTerm);
          const descriptionMatch = product.description?.toLowerCase().includes(searchTerm);
          
          return titleMatch || categoryMatch || subcategoryMatch || descriptionMatch;
        });
        
        const dynamicFilters: FilterGroup[] = [...baseFilters];
        
        // Filtrelenmiş ürünlerden dinamik mağaza seçenekleri oluştur
        const filteredStores = [...new Set(filteredProducts.map(p => p.store).filter(Boolean))];
        if (filteredStores.length > 0) {
          const storeFilterIndex = dynamicFilters.findIndex(f => f.key === 'store');
          if (storeFilterIndex !== -1) {
            dynamicFilters[storeFilterIndex] = {
              key: 'store',
              label: 'Mağaza',
              type: 'checkbox',
              options: filteredStores.filter(store => store).map(store => ({ value: store!, label: store! })),
              multiple: true
            };
          }
        }
        
        // Arama terimine göre özel filtreler ekle
        if (searchTerm.includes('elbise') || searchTerm.includes('dress')) {
          dynamicFilters.push({
            key: 'dressLength',
            label: 'Elbise Boyu',
            type: 'checkbox',
            options: [
              { value: 'Mini', label: 'Mini' },
              { value: 'Midi', label: 'Midi' },
              { value: 'Maxi', label: 'Maxi' }
            ],
            multiple: true
          });
        }
        
        if (searchTerm.includes('ayakkabı') || searchTerm.includes('shoe')) {
          dynamicFilters.push({
            key: 'shoeSize',
            label: 'Ayakkabı Numarası',
            type: 'checkbox',
            options: [
              { value: '36-38', label: '36-38' },
              { value: '39-41', label: '39-41' },
              { value: '42-44', label: '42-44' },
              { value: '45+', label: '45+' }
            ],
            multiple: true
          });
        }
        
        if (searchTerm.includes('telefon') || searchTerm.includes('phone')) {
          dynamicFilters.push({
            key: 'brand',
            label: 'Marka',
            type: 'checkbox',
            options: [
              { value: 'Apple', label: 'Apple' },
              { value: 'Samsung', label: 'Samsung' },
              { value: 'Huawei', label: 'Huawei' },
              { value: 'Xiaomi', label: 'Xiaomi' }
            ],
            multiple: true
          });
        }
        
        if (searchTerm.includes('spor') || searchTerm.includes('sport')) {
          dynamicFilters.push({
            key: 'sportType',
            label: 'Spor Türü',
            type: 'checkbox',
            options: [
              { value: 'Fitness', label: 'Fitness' },
              { value: 'Koşu', label: 'Koşu' },
              { value: 'Futbol', label: 'Futbol' },
              { value: 'Basketbol', label: 'Basketbol' }
            ],
            multiple: true
          });
        }
        
        // Filtrelenmiş ürünlerden dinamik seçenekler oluştur
        const availableSubcategories = [...new Set(filteredProducts.map(p => p.subcategory).filter(Boolean))];
        if (availableSubcategories.length > 0) {
          dynamicFilters.push({
            key: 'subcategory',
            label: 'Alt Kategori',
            type: 'checkbox',
            options: availableSubcategories.filter(sub => sub).map(sub => ({ value: sub!, label: sub! })),
            multiple: true
          });
        }
        
        const availableSeasons = [...new Set(filteredProducts.map(p => p.season).filter(Boolean))];
        if (availableSeasons.length > 0) {
          dynamicFilters.push({
            key: 'season',
            label: 'Mevsim',
            type: 'checkbox',
            options: availableSeasons.filter(season => season).map(season => ({ value: season!, label: season! })),
            multiple: true
          });
        }
        
        // Filtrelenmiş ürünlerden dinamik marka seçenekleri oluştur
        const availableBrands = [...new Set(filteredProducts.map(p => p.store).filter(Boolean))];
        if (availableBrands.length > 0) {
          dynamicFilters.push({
            key: 'brand',
            label: 'Marka',
            type: 'checkbox',
            options: availableBrands.filter(brand => brand).map(brand => ({ value: brand!, label: brand! })),
            multiple: true
          });
        }
        
        // Filtrelenmiş ürünlerden fiyat aralığı bilgisi oluştur
        const prices = filteredProducts
          .map(p => {
            const priceStr = p.price?.replace(/[^\d]/g, '') || '0';
            return parseInt(priceStr) || 0;
          })
          .filter(price => price > 0);
        
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          // Fiyat aralığı filtresini güncelle
          const priceFilterIndex = dynamicFilters.findIndex(f => f.key === 'priceRange');
          if (priceFilterIndex !== -1) {
            dynamicFilters[priceFilterIndex] = {
              ...dynamicFilters[priceFilterIndex],
              // Fiyat aralığı için ek bilgi ekle
              minValue: minPrice,
              maxValue: maxPrice
            };
          }
        }
        
        return dynamicFilters;
      }

      return baseFilters;
    };

    setAvailableFilters(getFiltersForCategory(selectedCategory));
  }, [selectedCategory, products]);

  // initialFilters değiştiğinde priceRange'i güncelle
  useEffect(() => {
    if (initialFilters.priceRange) {
      setPriceRange({
        min: initialFilters.priceRange.min?.toString() || '',
        max: initialFilters.priceRange.max?.toString() || ''
      });
    }
  }, [initialFilters]);

  const handleFilterChange = (filterKey: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handlePriceRangeChange = (type: 'min' | 'max', value: string) => {
    const numericValue = value === '' ? '' : parseFloat(value);
    
    setPriceRange(prev => {
      const newRange = {
        ...prev,
        [type]: value
      };
      
      // Min değeri max'tan büyük olamaz
      if (type === 'min' && numericValue !== '' && prev.max !== '' && numericValue > parseFloat(prev.max)) {
        newRange.max = value;
      }
      
      // Max değeri min'den küçük olamaz
      if (type === 'max' && numericValue !== '' && prev.min !== '' && numericValue < parseFloat(prev.min)) {
        newRange.min = value;
      }
      
      return newRange;
    });
  };

  const applyFilters = () => {
    const finalFilters = { ...filters };
    
    // Fiyat aralığını ekle
    if (priceRange.min || priceRange.max) {
      finalFilters.priceRange = {
        min: priceRange.min ? parseFloat(priceRange.min) : 0,
        max: priceRange.max ? parseFloat(priceRange.max) : Infinity
      };
    }
    
    onFiltersChange(finalFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setPriceRange({ min: '', max: '' });
    onFiltersChange({});
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '2rem',
        padding: '2rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0
          }}>
            Gelişmiş Filtreler
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '2rem' }}>
          {availableFilters.map((filterGroup) => (
            <div key={filterGroup.key} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.75rem'
              }}>
                {filterGroup.label}
              </h3>
              
              {filterGroup.type === 'range' && filterGroup.key === 'priceRange' && (
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: '#374151',
                      minWidth: '60px'
                    }}>
                      Min:
                    </label>
                     <input
                       type="number"
                       placeholder={filterGroup.minValue ? `₺${filterGroup.minValue}` : 'Min fiyat'}
                       value={priceRange.min}
                       onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                       min={filterGroup.minValue || 0}
                       max={priceRange.max || filterGroup.maxValue || undefined}
                       style={{
                         width: '120px',
                         padding: '0.5rem',
                         border: '1px solid #d1d5db',
                         borderRadius: '0.5rem',
                         fontSize: '0.875rem',
                         outline: 'none',
                         transition: 'border-color 0.2s ease'
                       }}
                       onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                       onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                     />
                  </div>
                  
                  <div style={{ 
                    width: '20px', 
                    height: '1px', 
                    backgroundColor: '#d1d5db',
                    margin: '0 0.5rem'
                  }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: '#374151',
                      minWidth: '60px'
                    }}>
                      Max:
                    </label>
                     <input
                       type="number"
                       placeholder={filterGroup.maxValue ? `₺${filterGroup.maxValue}` : 'Max fiyat'}
                       value={priceRange.max}
                       onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                       min={priceRange.min || filterGroup.minValue || 0}
                       max={filterGroup.maxValue || undefined}
                       style={{
                         width: '120px',
                         padding: '0.5rem',
                         border: '1px solid #d1d5db',
                         borderRadius: '0.5rem',
                         fontSize: '0.875rem',
                         outline: 'none',
                         transition: 'border-color 0.2s ease'
                       }}
                       onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                       onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                     />
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    fontStyle: 'italic',
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    {(() => {
                      console.log('🎯 Fiyat Aralığı Render Debug:');
                      console.log('filterGroup.minValue:', filterGroup.minValue);
                      console.log('filterGroup.maxValue:', filterGroup.maxValue);
                      console.log('filterGroup:', filterGroup);
                      
                      return filterGroup.minValue && filterGroup.maxValue 
                        ? `📊 Mevcut fiyat aralığı: ₺${filterGroup.minValue.toLocaleString()} - ₺${filterGroup.maxValue.toLocaleString()}`
                        : '💡 Boş bırakılan alan sınırsız olarak kabul edilir'
                    })()}
                  </div>
                </div>
              )}

              {filterGroup.type === 'range' && filterGroup.key !== 'priceRange' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {filterGroup.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange(filterGroup.key, option.value)}
                      style={{
                        backgroundColor: filters[filterGroup.key] === option.value 
                          ? '#3b82f6' 
                          : 'rgba(59, 130, 246, 0.1)',
                        color: filters[filterGroup.key] === option.value 
                          ? 'white' 
                          : '#3b82f6',
                        border: '1px solid #3b82f6',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              {filterGroup.type === 'checkbox' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {filterGroup.options.map((option) => (
                    <label
                      key={option.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        padding: '0.5rem 1rem',
                        backgroundColor: filters[filterGroup.key]?.includes(option.value)
                          ? 'rgba(59, 130, 246, 0.1)'
                          : 'transparent',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filters[filterGroup.key]?.includes(option.value) || false}
                        onChange={(e) => {
                          const currentValues = filters[filterGroup.key] || [];
                          if (e.target.checked) {
                            handleFilterChange(filterGroup.key, [...currentValues, option.value]);
                          } else {
                            handleFilterChange(filterGroup.key, currentValues.filter((v: string) => v !== option.value));
                          }
                        }}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: '0.875rem' }}>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {filterGroup.type === 'select' && (
                <select
                  value={filters[filterGroup.key] || ''}
                  onChange={(e) => handleFilterChange(filterGroup.key, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Seçiniz</option>
                  {filterGroup.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={clearFilters}
            style={{
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Temizle
          </button>
          <button
            onClick={applyFilters}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Filtreleri Uygula
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;
