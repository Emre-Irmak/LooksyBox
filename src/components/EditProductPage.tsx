import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsWithUsers } from '../data/products';
import { generateProductAffiliateLink } from '../utils/affiliateUtils';

interface EditProductPageProps {
  sharedProducts?: any[];
  onProductUpdate?: (productId: number, updatedProduct: any) => void;
}

const EditProductPage = ({ sharedProducts = [], onProductUpdate }: EditProductPageProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Tüm ürünlerde ara
  const allProducts = [...productsWithUsers, ...sharedProducts];
  const product = allProducts.find(p => p.id === parseInt(id || '0'));
  
  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price?.replace('₺', '') || '',
    category: product?.category || '',
    subcategory: product?.subcategory || '',
    hashtags: product?.hashtags || '',
    productLink: product?.productLink || '',
    store: product?.store || '',
    images: [] as File[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>(product?.images || []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const categories = [
    { id: 'Kadın Giyim', name: 'Kadın Giyim', subcategories: ['Elbise', 'Üst Giyim', 'Alt Giyim', 'Ayakkabı', 'Çanta', 'Aksesuar'] },
    { id: 'Erkek Giyim', name: 'Erkek Giyim', subcategories: ['Üst Giyim', 'Alt Giyim', 'Ayakkabı', 'Aksesuar', 'Saat'] },
    { id: 'Anne & Çocuk', name: 'Anne & Çocuk', subcategories: ['Bebek Giyim', 'Çocuk Giyim', 'Hamile Giyim'] },
    { id: 'Ev & Yaşam', name: 'Ev & Yaşam', subcategories: ['Mobilya', 'Dekorasyon', 'Mutfak', 'Banyo'] },
    { id: 'Süpermarket', name: 'Süpermarket', subcategories: ['Gıda', 'İçecek', 'Temizlik', 'Kişisel Bakım'] },
    { id: 'Elektronik', name: 'Elektronik', subcategories: ['Telefon & Tablet', 'Bilgisayar', 'TV & Ses', 'Küçük Ev Aletleri'] },
    { id: 'Spor & Outdoor', name: 'Spor & Outdoor', subcategories: ['Spor Giyim', 'Fitness', 'Outdoor', 'Spor Malzemeleri'] }
  ];

  const stores = [
    'Trendyol', 'Hepsiburada', 'N11', 'GittiGidiyor', 'Amazon.com.tr',
    'Vatan Bilgisayar', 'Teknosa', 'MediaMarkt', 'Zara', 'H&M',
    'LC Waikiki', 'Defacto', 'Mango', 'Pull & Bear', 'Bershka',
    'Koton', 'Colin\'s', 'Network', 'Bauhaus', 'IKEA'
  ];

  const selectedCategory = categories.find(cat => cat.id === formData.category);
  const availableSubcategories = selectedCategory?.subcategories || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Desteklenen dosya formatlarını kontrol et
      const supportedTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'image/webp'
      ];
      
      const validFiles = files.filter(file => 
        supportedTypes.includes(file.type) || 
        file.name.toLowerCase().endsWith('.webp')
      );
      
      if (validFiles.length !== files.length) {
        alert('Bazı dosyalar desteklenmeyen format. Sadece JPG, PNG, GIF, BMP, TIFF ve WebP formatları desteklenir.');
      }
      
      if (validFiles.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...validFiles]
        }));

        // Her dosyayı base64'e çevir ve preview olarak sakla
        validFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64String = e.target?.result as string;
            setPreviewImages(prev => [...prev, base64String]);
          };
          reader.readAsDataURL(file);
        });
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    
    // Eğer silinen fotoğraf mevcut fotoğraf ise, önceki fotoğrafa geç
    if (index === currentImageIndex && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (index === currentImageIndex && currentImageIndex === 0 && previewImages.length > 1) {
      setCurrentImageIndex(0);
    } else if (previewImages.length === 1) {
      setCurrentImageIndex(0);
    }
  };

  const nextImage = () => {
    if (previewImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % previewImages.length);
    }
  };

  const prevImage = () => {
    if (previewImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + previewImages.length) % previewImages.length);
    }
  };

  const handleHashtagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // # sembolü ile başlamayan hashtag'leri otomatik olarak # ile başlat
    if (value && !value.startsWith('#')) {
      value = '#' + value;
    }
    
    setFormData(prev => ({
      ...prev,
      hashtags: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Form validasyonu
      if (!formData.title.trim()) {
        alert('Ürün başlığı gereklidir');
        return;
      }
      
      if (!formData.category) {
        alert('Kategori seçimi gereklidir');
        return;
      }
      
      if (previewImages.length === 0) {
        alert('En az bir fotoğraf yüklemelisiniz');
        return;
      }

      // Simüle edilmiş API çağrısı
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Güncellenmiş ürün oluştur
      const baseUpdatedProduct = {
        ...product,
        title: formData.title,
        description: formData.description,
        price: formData.price ? `₺${formData.price}` : undefined,
        category: formData.category,
        subcategory: formData.subcategory,
        hashtags: formData.hashtags,
        productLink: formData.productLink,
        store: formData.store,
        imageUrl: previewImages[0] || product?.imageUrl,
        images: previewImages
      };
      
      // Affiliate link oluştur
      const updatedProduct = generateProductAffiliateLink(baseUpdatedProduct);
      
      // Ürünü güncelle
      if (onProductUpdate) {
        onProductUpdate(product!.id, updatedProduct);
      }
      
      alert('Ürün başarıyla güncellendi! 🎉');
      navigate(`/product/${product!.id}`);
      
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          margin: '0 auto',
          textAlign: 'center',
          color: 'white'
        }}>
          <h2>Ürün Bulunamadı</h2>
          <p>Düzenlemek istediğiniz ürün bulunamadı.</p>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: 'white',
              color: '#667eea',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              marginTop: '1rem'
            }}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '0.5rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '0.75rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.25rem'
          }}>
            ✏️ Ürünü Düzenle
          </h1>
          <p style={{
            margin: 0,
            opacity: 0.9,
            fontSize: '0.9rem'
          }}>
            {product.title}
          </p>
        </div>

        {/* Ana İçerik */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', padding: '0.75rem' }}>
          {/* Sol Taraf - Fotoğraf Yükleme */}
          <div>
            <h3 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📸 Fotoğraflar
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '400',
                color: '#6b7280'
              }}>
                (En az 1, en fazla 5 - JPG, PNG, WebP, GIF desteklenir)
              </span>
            </h3>
            
            {/* Dosya Seçme Alanı */}
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '0.75rem',
              textAlign: 'center',
              backgroundColor: '#f9fafb',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: '80px',
              maxWidth: '200px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.backgroundColor = '#eff6ff';
              e.currentTarget.style.transform = 'scale(1.01)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            >
              <svg width="24" height="24" fill="#6b7280" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              <div>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem', fontWeight: '500' }}>
                  Fotoğraf Ekle
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.webp,image/webp,image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/tiff"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            {/* Fotoğraf Önizleme Alanı */}
            {previewImages.length > 0 && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <h4 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🖼️ Fotoğraflar
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: '400',
                    color: '#6b7280'
                  }}>
                    ({currentImageIndex + 1}/{previewImages.length})
                  </span>
                </h4>
                
                {/* Ana Fotoğraf Görüntüleme Alanı */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '400px',
                  margin: '0 auto',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '3px solid #e5e7eb',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                  aspectRatio: '1',
                  backgroundColor: '#f9fafb'
                }}>
                  <img
                    src={previewImages[currentImageIndex]}
                    alt={`Preview ${currentImageIndex + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  
                  {/* Silme Butonu */}
                  <button
                    type="button"
                    onClick={() => removeImage(currentImageIndex)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(4px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.95)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                    }}
                  >
                    ×
                  </button>
                  
                  {/* Navigation Butonları */}
                  {previewImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevImage}
                        style={{
                          position: 'absolute',
                          left: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        ‹
                      </button>
                      
                      <button
                        type="button"
                        onClick={nextImage}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
                
                {/* Thumbnail Navigation */}
                {previewImages.length > 1 && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    marginTop: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    {previewImages.map((preview, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentImageIndex(index)}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: index === currentImageIndex ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: 'white',
                          boxShadow: index === currentImageIndex ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <img
                          src={preview}
                          alt={`Thumbnail ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sağ Taraf - Form Bilgileri */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📝 Ürün Bilgileri
            </h3>

            {/* Ürün Linki */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.375rem',
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.85rem'
              }}>
                Ürün Linki
              </label>
              <input
                type="url"
                name="productLink"
                value={formData.productLink}
                onChange={handleInputChange}
                placeholder="https://example.com/urun"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Başlık */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.375rem',
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.85rem'
              }}>
                Ürün Başlığı *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Örn: Vintage Denim Ceket"
                required
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Açıklama */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.375rem',
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.85rem'
              }}>
                Açıklama
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Ürününüz hakkında detaylı bilgi verin..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Fiyat */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.375rem',
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.85rem'
              }}>
                Fiyat (TL)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="150"
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Kategori ve Alt Kategori */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.9rem'
                }}>
                  Kategori *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.9rem'
                }}>
                  Alt Kategori
                </label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  disabled={!formData.category}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: formData.category ? 'white' : '#f9fafb',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Alt Kategori Seçin</option>
                  {availableSubcategories.map(subcategory => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mağaza */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.375rem',
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.85rem'
              }}>
                Mağaza
              </label>
              <select
                name="store"
                value={formData.store}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Mağaza Seçin</option>
                {stores.map(store => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))}
              </select>
            </div>

            {/* Hashtag */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.375rem',
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.85rem'
              }}>
                Hashtag'ler
              </label>
              <input
                type="text"
                name="hashtags"
                value={formData.hashtags}
                onChange={handleHashtagInput}
                placeholder="#vintage #denim #fashion"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Gönder Butonları */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              paddingTop: '0.75rem',
              borderTop: '1px solid #e5e7eb',
              marginTop: '0.75rem'
            }}>
              <button
                type="button"
                onClick={() => navigate(`/product/${product.id}`)}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Güncelleniyor...
                  </>
                ) : (
                  '💾 Değişiklikleri Kaydet'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CSS Animasyon */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default EditProductPage;
