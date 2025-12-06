import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { generateProductAffiliateLink, createAffiliateLink, getOrCreateUserId } from '../utils/affiliateUtils';
import { scrapeTrendyolProduct, isTrendyolUrl } from '../utils/trendyolScraper';
import ImageEditor from './ImageEditor';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ShareProductPageProps {
  onProductShared?: (product: {
    id: number;
    title: string;
    description: string;
    price?: string;
    category: string;
    subcategory?: string;
    hashtags: string;
    productLink: string;
    images: string[];
    user: {
      id: number;
      name: string;
      avatar: string;
      verified: boolean;
    };
    likes: number;
    rating: number;
    reviews: number;
    shareDate: string;
    popularityRank: number;
  }) => void;
}

const ShareProductPage = ({ onProductShared }: ShareProductPageProps) => {
  const navigate = useNavigate();
  const { isDarkMode, themeMode } = useDarkMode();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    hashtags: '',
    productLink: '',
    store: '',
    brand: '',
    images: [] as File[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [affiliateLinkPreview, setAffiliateLinkPreview] = useState<string>('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState<number>(0);
  const [isPriceLocked, setIsPriceLocked] = useState(false);
  const [isNonTrendyolStore, setIsNonTrendyolStore] = useState(false);
  const [productSpecs, setProductSpecs] = useState<{ [key: string]: string }>({});
  // Her fotoğraf için boyut bilgisi: { url: string, width: number, height: number }[]
  const [imageDimensions, setImageDimensions] = useState<Array<{ width: number; height: number }>>([]);
  
  // Image Editor states
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [originalScrapedImages, setOriginalScrapedImages] = useState<string[]>([]);
  const [originalPreviewImages, setOriginalPreviewImages] = useState<string[]>([]);


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

  // Başlıktan kategori ve alt kategori tahmin et
  const predictCategoryFromTitle = (title: string): { category: string; subcategory: string } => {
    if (!title) return { category: '', subcategory: '' };
    
    const titleLower = title.toLowerCase();
    const words = titleLower.split(/\s+/);
    
    // Kategori ve alt kategori eşleştirme anahtarları
    const categoryKeywords: { [key: string]: { category: string; subcategory: string }[] } = {
      // Elektronik
      'elektronik': [
        { category: 'Elektronik', subcategory: '' }
      ],
      'bilgisayar': [
        { category: 'Elektronik', subcategory: 'Bilgisayar' }
      ],
      'laptop': [
        { category: 'Elektronik', subcategory: 'Bilgisayar' }
      ],
      'notebook': [
        { category: 'Elektronik', subcategory: 'Bilgisayar' }
      ],
      'monster': [
        { category: 'Elektronik', subcategory: 'Bilgisayar' }
      ],
      'asus': [
        { category: 'Elektronik', subcategory: 'Bilgisayar' }
      ],
      'hp': [
        { category: 'Elektronik', subcategory: 'Bilgisayar' }
      ],
      'lenovo': [
        { category: 'Elektronik', subcategory: 'Bilgisayar' }
      ],
      'acer': [
        { category: 'Elektronik', subcategory: 'Bilgisayar' }
      ],
      'msi': [
        { category: 'Elektronik', subcategory: 'Bilgisayar' }
      ],
      'telefon': [
        { category: 'Elektronik', subcategory: 'Telefon & Tablet' }
      ],
      'iphone': [
        { category: 'Elektronik', subcategory: 'Telefon & Tablet' }
      ],
      'samsung': [
        { category: 'Elektronik', subcategory: 'Telefon & Tablet' }
      ],
      'xiaomi': [
        { category: 'Elektronik', subcategory: 'Telefon & Tablet' }
      ],
      'tablet': [
        { category: 'Elektronik', subcategory: 'Telefon & Tablet' }
      ],
      'ipad': [
        { category: 'Elektronik', subcategory: 'Telefon & Tablet' }
      ],
      'tv': [
        { category: 'Elektronik', subcategory: 'TV & Ses' }
      ],
      'televizyon': [
        { category: 'Elektronik', subcategory: 'TV & Ses' }
      ],
      'kulaklık': [
        { category: 'Elektronik', subcategory: 'TV & Ses' }
      ],
      'hoparlör': [
        { category: 'Elektronik', subcategory: 'TV & Ses' }
      ],
      'küçük ev aleti': [
        { category: 'Elektronik', subcategory: 'Küçük Ev Aletleri' }
      ],
      'elektrikli süpürge': [
        { category: 'Elektronik', subcategory: 'Küçük Ev Aletleri' }
      ],
      'ütü': [
        { category: 'Elektronik', subcategory: 'Küçük Ev Aletleri' }
      ],
      
      // Kadın Giyim
      'kadın': [
        { category: 'Kadın Giyim', subcategory: '' }
      ],
      'elbise': [
        { category: 'Kadın Giyim', subcategory: 'Elbise' }
      ],
      'bluz': [
        { category: 'Kadın Giyim', subcategory: 'Üst Giyim' }
      ],
      'tişört': [
        { category: 'Kadın Giyim', subcategory: 'Üst Giyim' }
      ],
      'gömlek': [
        { category: 'Kadın Giyim', subcategory: 'Üst Giyim' }
      ],
      'pantolon': [
        { category: 'Kadın Giyim', subcategory: 'Alt Giyim' }
      ],
      'jean': [
        { category: 'Kadın Giyim', subcategory: 'Alt Giyim' }
      ],
      'etek': [
        { category: 'Kadın Giyim', subcategory: 'Alt Giyim' }
      ],
      'ayakkabı': [
        { category: 'Kadın Giyim', subcategory: 'Ayakkabı' }
      ],
      'topuklu': [
        { category: 'Kadın Giyim', subcategory: 'Ayakkabı' }
      ],
      'spor ayakkabı': [
        { category: 'Kadın Giyim', subcategory: 'Ayakkabı' }
      ],
      'çanta': [
        { category: 'Kadın Giyim', subcategory: 'Çanta' }
      ],
      'çeki': [
        { category: 'Kadın Giyim', subcategory: 'Çanta' }
      ],
      'aksesuar': [
        { category: 'Kadın Giyim', subcategory: 'Aksesuar' }
      ],
      'kolye': [
        { category: 'Kadın Giyim', subcategory: 'Aksesuar' }
      ],
      'küpe': [
        { category: 'Kadın Giyim', subcategory: 'Aksesuar' }
      ],
      
      // Erkek Giyim
      'erkek': [
        { category: 'Erkek Giyim', subcategory: '' }
      ],
      'erkek tişört': [
        { category: 'Erkek Giyim', subcategory: 'Üst Giyim' }
      ],
      'erkek gömlek': [
        { category: 'Erkek Giyim', subcategory: 'Üst Giyim' }
      ],
      'erkek pantolon': [
        { category: 'Erkek Giyim', subcategory: 'Alt Giyim' }
      ],
      'erkek ayakkabı': [
        { category: 'Erkek Giyim', subcategory: 'Ayakkabı' }
      ],
      'erkek çanta': [
        { category: 'Erkek Giyim', subcategory: 'Aksesuar' }
      ],
      'saat': [
        { category: 'Erkek Giyim', subcategory: 'Saat' }
      ],
      'kol saati': [
        { category: 'Erkek Giyim', subcategory: 'Saat' }
      ],
      
      // Anne & Çocuk
      'bebek': [
        { category: 'Anne & Çocuk', subcategory: 'Bebek Giyim' }
      ],
      'çocuk': [
        { category: 'Anne & Çocuk', subcategory: 'Çocuk Giyim' }
      ],
      'hamile': [
        { category: 'Anne & Çocuk', subcategory: 'Hamile Giyim' }
      ],
      
      // Ev & Yaşam
      'mobilya': [
        { category: 'Ev & Yaşam', subcategory: 'Mobilya' }
      ],
      'kanepe': [
        { category: 'Ev & Yaşam', subcategory: 'Mobilya' }
      ],
      'masa': [
        { category: 'Ev & Yaşam', subcategory: 'Mobilya' }
      ],
      'sandalye': [
        { category: 'Ev & Yaşam', subcategory: 'Mobilya' }
      ],
      'dekorasyon': [
        { category: 'Ev & Yaşam', subcategory: 'Dekorasyon' }
      ],
      'mutfak': [
        { category: 'Ev & Yaşam', subcategory: 'Mutfak' }
      ],
      'banyo': [
        { category: 'Ev & Yaşam', subcategory: 'Banyo' }
      ],
      
      // Süpermarket
      'gıda': [
        { category: 'Süpermarket', subcategory: 'Gıda' }
      ],
      'içecek': [
        { category: 'Süpermarket', subcategory: 'İçecek' }
      ],
      'temizlik': [
        { category: 'Süpermarket', subcategory: 'Temizlik' }
      ],
      'kişisel bakım': [
        { category: 'Süpermarket', subcategory: 'Kişisel Bakım' }
      ],
      
      // Spor & Outdoor
      'spor': [
        { category: 'Spor & Outdoor', subcategory: 'Spor Giyim' }
      ],
      'fitness': [
        { category: 'Spor & Outdoor', subcategory: 'Fitness' }
      ],
      'outdoor': [
        { category: 'Spor & Outdoor', subcategory: 'Outdoor' }
      ],
      'spor malzemesi': [
        { category: 'Spor & Outdoor', subcategory: 'Spor Malzemeleri' }
      ],
      
      // Spor markaları (ayakkabı/giyim)
      'nike': [
        { category: 'Spor & Outdoor', subcategory: 'Spor Giyim' }
      ],
      'adidas': [
        { category: 'Spor & Outdoor', subcategory: 'Spor Giyim' }
      ],
      'puma': [
        { category: 'Spor & Outdoor', subcategory: 'Spor Giyim' }
      ],
      'reebok': [
        { category: 'Spor & Outdoor', subcategory: 'Spor Giyim' }
      ],
      'new balance': [
        { category: 'Spor & Outdoor', subcategory: 'Spor Giyim' }
      ],
      
      // Moda markaları
      'zara': [
        { category: 'Kadın Giyim', subcategory: '' }
      ],
      'h&m': [
        { category: 'Kadın Giyim', subcategory: '' }
      ],
      'mango': [
        { category: 'Kadın Giyim', subcategory: '' }
      ],
      'lc waikiki': [
        { category: 'Kadın Giyim', subcategory: '' }
      ],
      'defacto': [
        { category: 'Kadın Giyim', subcategory: '' }
      ],
      'koton': [
        { category: 'Kadın Giyim', subcategory: '' }
      ]
    };
    
    // Önce tam eşleşmeleri kontrol et (2-3 kelimeli ifadeler)
    for (let i = 0; i < words.length - 1; i++) {
      const twoWord = words[i] + ' ' + words[i + 1];
      if (categoryKeywords[twoWord]) {
        const match = categoryKeywords[twoWord][0];
        return { category: match.category, subcategory: match.subcategory };
      }
    }
    
    // Sonra tek kelime eşleşmelerini kontrol et
    for (const word of words) {
      if (categoryKeywords[word]) {
        const match = categoryKeywords[word][0];
        return { category: match.category, subcategory: match.subcategory };
      }
    }
    
    // Hiçbir eşleşme bulunamazsa boş döndür
    return { category: '', subcategory: '' };
  };

  // Türkçe sayı okuma fonksiyonu
  const numberToTurkishText = (num: number): string => {
    const ones = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
    const tens = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
    const hundreds = ['', 'yüz', 'iki yüz', 'üç yüz', 'dört yüz', 'beş yüz', 'altı yüz', 'yedi yüz', 'sekiz yüz', 'dokuz yüz'];
    
    if (num === 0) return 'sıfır';
    if (num < 0) return 'eksi ' + numberToTurkishText(-num);
    
    const convertThreeDigits = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) {
        if (n === 10) return 'on';
        if (n === 11) return 'on bir';
        return 'on ' + ones[n % 10];
      }
      if (n < 100) {
        const ten = Math.floor(n / 10);
        const one = n % 10;
        return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
      }
      if (n < 1000) {
        const hundred = Math.floor(n / 100);
        const remainder = n % 100;
        return hundreds[hundred] + (remainder > 0 ? ' ' + convertThreeDigits(remainder) : '');
      }
      return '';
    };
    
    let result = '';
    const numStr = Math.floor(num).toString();
    const numInt = Math.floor(num);
    
    if (numInt >= 1000000) {
      const millions = Math.floor(numInt / 1000000);
      if (millions === 1) {
        result += 'bir milyon ';
      } else {
        result += convertThreeDigits(millions) + ' milyon ';
      }
      const remainder = numInt % 1000000;
      if (remainder > 0) {
        if (remainder < 1000) {
          result += convertThreeDigits(remainder);
        } else {
          const thousands = Math.floor(remainder / 1000);
          if (thousands === 1) {
            result += 'bin ';
          } else {
            result += convertThreeDigits(thousands) + ' bin ';
          }
          const lastThree = remainder % 1000;
          if (lastThree > 0) {
            result += convertThreeDigits(lastThree);
          }
        }
      }
    } else if (numInt >= 1000) {
      const thousands = Math.floor(numInt / 1000);
      if (thousands === 1) {
        result += 'bin ';
      } else {
        result += convertThreeDigits(thousands) + ' bin ';
      }
      const remainder = numInt % 1000;
      if (remainder > 0) {
        result += convertThreeDigits(remainder);
      }
    } else {
      result = convertThreeDigits(numInt);
    }
    
    return result.trim();
  };
  
  // Fiyatı Türkçe metne çevir
  const priceToTurkishText = (priceStr: string): string => {
    if (!priceStr || priceStr.trim() === '') return '';
    
    // Fiyat string'ini temizle (TL, ₺, boşluk vb. kaldır, sadece sayı, nokta ve virgül bırak)
    let cleanPrice = priceStr.toString().replace(/[^\d.,]/g, '').trim();
    
    if (!cleanPrice) return '';
    
    // Türkçe format: nokta binlik, virgül ondalık
    // Önce nokta ve virgül durumunu kontrol et
    const hasComma = cleanPrice.includes(',');
    const hasDot = cleanPrice.includes('.');
    
    let integerPart = '';
    let decimalPart = '';
    
    if (hasComma && hasDot) {
      // Hem nokta hem virgül var - son virgül ondalık ayırıcı
      const lastCommaIndex = cleanPrice.lastIndexOf(',');
      integerPart = cleanPrice.substring(0, lastCommaIndex).replace(/\./g, '');
      decimalPart = cleanPrice.substring(lastCommaIndex + 1);
    } else if (hasComma) {
      // Sadece virgül var - ondalık ayırıcı olarak kabul et
      const parts = cleanPrice.split(',');
      integerPart = parts[0].replace(/\./g, '');
      decimalPart = parts[1] || '';
    } else if (hasDot) {
      // Sadece nokta var - kontrol et: eğer son kısım 1-2 karakter ise ondalık olabilir
      const parts = cleanPrice.split('.');
      // Eğer sadece 2 parça var ve ikinci parça 1-2 karakter ise ondalık olabilir
      if (parts.length === 2 && parts[1].length <= 2 && parts[1].length > 0) {
        // Ondalık olabilir
        integerPart = parts[0].replace(/\./g, '');
        decimalPart = parts[1];
      } else {
        // Binlik ayırıcı - tüm noktaları kaldır
        integerPart = cleanPrice.replace(/\./g, '');
        decimalPart = '';
      }
    } else {
      integerPart = cleanPrice;
      decimalPart = '';
    }
    
    // Sayıya çevir
    const integerNum = parseInt(integerPart || '0', 10);
    const decimalNum = parseInt(decimalPart || '0', 10);
    
    if (isNaN(integerNum) && isNaN(decimalNum)) return '';
    if (integerNum === 0 && decimalNum === 0) return 'sıfır tl';
    
    let result = '';
    
    if (integerNum > 0) {
      result = numberToTurkishText(integerNum) + ' tl';
    } else {
      result = 'sıfır tl';
    }
    
    if (decimalNum > 0) {
      const decimalText = numberToTurkishText(decimalNum);
      result += ' ' + decimalText + ' kuruş';
    }
    
    return result;
  };

  // Duplicate ürün kontrolü için state
  const [duplicateError, setDuplicateError] = useState<string>('');

  // Duplicate ürün kontrolü fonksiyonu
  const checkForDuplicateProduct = (productLink: string): boolean => {
    if (!productLink.trim()) return false;
    
    try {
      // Mevcut kullanıcının paylaştığı ürünleri kontrol et
      const sharedProducts = JSON.parse(localStorage.getItem('sharedProducts') || '[]');
      const currentUserId = getOrCreateUserId(); // Doğru userId'yi al
      
      console.log('Current User ID:', currentUserId);
      console.log('Shared Products:', sharedProducts);
      
      // Aynı kullanıcının aynı linki paylaşıp paylaşmadığını kontrol et
      const isDuplicate = sharedProducts.some((product: any) => {
        const linkMatch = product.productLink === productLink;
        const userMatch = product.user?.id === currentUserId;
        
        console.log('Product:', product.productLink, 'vs', productLink, 'Match:', linkMatch);
        console.log('User ID:', product.user?.id, 'vs', currentUserId, 'Match:', userMatch);
        
        return linkMatch && userMatch;
      });
      
      console.log('Is Duplicate:', isDuplicate);
      return isDuplicate;
    } catch (error) {
      console.error('Duplicate kontrol hatası:', error);
      return false;
    }
  };

  // Ürün linki değiştiğinde affiliate link preview'ını güncelle, duplicate kontrolü yap ve Trendyol scraping
  useEffect(() => {
    if (formData.productLink && formData.productLink.trim()) {
      // Duplicate kontrolü
      if (checkForDuplicateProduct(formData.productLink)) {
        setDuplicateError('Bu ürün daha önce paylaşılmış! Aynı ürünü tekrar paylaşamazsınız.');
        setAffiliateLinkPreview('');
        return;
      } else {
        setDuplicateError('');
      }
      
      // Geçici bir ürün ID'si oluştur (gerçek ID form submit'te oluşturulacak)
      const tempProductId = Date.now();
      const affiliateLink = createAffiliateLink(formData.productLink, tempProductId);
      setAffiliateLinkPreview(affiliateLink);

      // Trendyol URL'si ise scraping yap
      if (isTrendyolUrl(formData.productLink)) {
        setIsScraping(true);
        setDuplicateError(''); // Scraping başlarken duplicate hatasını temizle
        setIsNonTrendyolStore(false); // Trendyol URL'si ise uyarıyı kaldır
        
        scrapeTrendyolProduct(formData.productLink)
          .then((scrapedData) => {
            if (scrapedData) {
              console.log('✅ Scraping başarılı:', scrapedData);
              
              // Marka bilgisini başlıktan çıkar (genellikle ilk kelime veya ilk iki kelime)
              const extractBrandFromTitle = (title: string): string => {
                if (!title) return '';
                const words = title.trim().split(/\s+/);
                // Eğer başlık çok uzunsa, ilk 1-2 kelimeyi marka olarak al
                if (words.length > 3) {
                  // İlk kelimeyi kontrol et, eğer çok kısaysa (2 karakter veya daha az) ilk 2 kelimeyi al
                  if (words[0].length <= 2 && words.length > 1) {
                    return words.slice(0, 2).join(' ');
                  }
                  return words[0];
                }
                // Kısa başlıklarda ilk kelimeyi al
                return words[0] || '';
              };

              const extractedBrand = extractBrandFromTitle(scrapedData.title);
              
              // Kategori ve alt kategori tahmin et
              const predictedCategory = predictCategoryFromTitle(scrapedData.title);
              
              // Başlık doldur (kullanıcı değiştirebilir)
              setFormData(prev => ({
                ...prev,
                title: scrapedData.title,
                description: scrapedData.description || prev.description,
                price: scrapedData.price,
                store: 'Trendyol',
                brand: extractedBrand || prev.brand,
                category: predictedCategory.category || prev.category,
                subcategory: predictedCategory.subcategory || prev.subcategory
              }));
              
              // Ürün özelliklerini kaydet
              if (scrapedData.specs && Object.keys(scrapedData.specs).length > 0) {
                setProductSpecs(scrapedData.specs);
                console.log('✅ Ürün özellikleri çekildi:', scrapedData.specs);
                console.log(`📊 ${Object.keys(scrapedData.specs).length} özellik bulundu`);
              } else {
                setProductSpecs({});
                console.log('ℹ️ Ürün özellikleri bulunamadı veya boş');
              }
              
              // Fiyatı kilitle
              setIsPriceLocked(true);
              
              // Fotoğrafları ayarla
              if (scrapedData.images && scrapedData.images.length > 0) {
                setScrapedImages(scrapedData.images);
                setOriginalScrapedImages([...scrapedData.images]); // Orijinal fotoğrafları sakla
                setCoverImageIndex(0);
                setCurrentImageIndex(0);
                console.log(`✅ ${scrapedData.images.length} fotoğraf bulundu`);
              } else {
                console.warn('⚠️ Fotoğraf bulunamadı');
              }
            } else {
              console.warn('⚠️ Scraping sonucu boş');
              setDuplicateError('Ürün bilgileri çekilemedi. Lütfen manuel olarak doldurun veya farklı bir link deneyin.');
            }
          })
          .catch((error) => {
            console.error('❌ Scraping hatası:', error);
            setDuplicateError(`Ürün bilgileri çekilirken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}. Lütfen manuel olarak doldurun.`);
          })
          .finally(() => {
            setIsScraping(false);
          });
      } else {
        // Trendyol değilse, scraped data'yı temizle ve uyarı göster
        setScrapedImages([]);
        setProductSpecs({});
        setIsPriceLocked(false);
        
        // Eğer link girilmişse ama Trendyol değilse uyarı göster
        if (formData.productLink.trim().length > 0) {
          setIsNonTrendyolStore(true);
        } else {
          setIsNonTrendyolStore(false);
        }
      }
    } else {
      setAffiliateLinkPreview('');
        setDuplicateError('');
        setScrapedImages([]);
        setProductSpecs({});
        setIsPriceLocked(false);
        setIsNonTrendyolStore(false);
    }
  }, [formData.productLink]);

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
            setPreviewImages(prev => {
              const newImages = [...prev, base64String];
              // Orijinal preview'ları da sakla (sadece yeni eklenenler için)
              if (originalPreviewImages.length < newImages.length) {
                setOriginalPreviewImages([...originalPreviewImages, base64String]);
              }
              return newImages;
            });
          };
          reader.readAsDataURL(file);
        });
      }
    }
  };

  // Tüm görüntüleri birleştir (scraped + uploaded)
  const allImages = [...scrapedImages, ...previewImages];
  
  // Fotoğraflar yüklendiğinde boyut bilgisini al
  useEffect(() => {
    const loadImageDimensions = async () => {
      const dimensions: Array<{ width: number; height: number }> = [];
      
      for (const imageUrl of allImages) {
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = () => {
              dimensions.push({ width: img.width, height: img.height });
              resolve(null);
            };
            img.onerror = () => {
              dimensions.push({ width: 0, height: 0 }); // Hata durumunda 0
              resolve(null);
            };
            img.src = imageUrl;
          });
        } catch (error) {
          console.error('Fotoğraf boyutu alınamadı:', error);
          dimensions.push({ width: 0, height: 0 });
        }
      }
      
      // Sadece boyut bilgisi eksikse güncelle (kırpma sonrası güncellemeleri koru)
      setImageDimensions(prev => {
        if (prev.length !== allImages.length) {
          return dimensions;
        }
        // Mevcut boyut bilgilerini koru, sadece eksik olanları ekle
        const updated = [...prev];
        dimensions.forEach((dim, index) => {
          if (updated[index] && (updated[index].width === 0 || updated[index].height === 0)) {
            updated[index] = dim;
          } else if (!updated[index]) {
            updated[index] = dim;
          }
        });
        return updated;
      });
    };
    
    if (allImages.length > 0) {
      loadImageDimensions();
    }
  }, [allImages.length]); // Sadece fotoğraf sayısı değiştiğinde çalış
  
  // Kapak fotoğrafı seç
  const selectCoverImage = (index: number) => {
    setCoverImageIndex(index);
    // Kapak fotoğrafını en başa taşı
    if (index < scrapedImages.length) {
      // Scraped image
      const newScrapedImages = [...scrapedImages];
      const [selectedImage] = newScrapedImages.splice(index, 1);
      newScrapedImages.unshift(selectedImage);
      setScrapedImages(newScrapedImages);
      setCoverImageIndex(0);
    } else {
      // Uploaded image
      const uploadedIndex = index - scrapedImages.length;
      const newPreviewImages = [...previewImages];
      const [selectedImage] = newPreviewImages.splice(uploadedIndex, 1);
      newPreviewImages.unshift(selectedImage);
      setPreviewImages(newPreviewImages);
      setCoverImageIndex(scrapedImages.length);
    }
    setCurrentImageIndex(0);
  };

  const removeImage = (index: number) => {
    if (index < scrapedImages.length) {
      // Scraped image sil
      setScrapedImages(prev => prev.filter((_, i) => i !== index));
      if (coverImageIndex === index) {
        setCoverImageIndex(0);
      } else if (coverImageIndex > index) {
        setCoverImageIndex(coverImageIndex - 1);
      }
    } else {
      // Uploaded image sil
      const uploadedIndex = index - scrapedImages.length;
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== uploadedIndex)
      }));
      setPreviewImages(prev => prev.filter((_, i) => i !== uploadedIndex));
      if (coverImageIndex === index) {
        setCoverImageIndex(scrapedImages.length > 0 ? 0 : 0);
      } else if (coverImageIndex > index) {
        setCoverImageIndex(coverImageIndex - 1);
      }
    }
    
    // Eğer silinen fotoğraf mevcut fotoğraf ise, önceki fotoğrafa geç
    if (index === currentImageIndex && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (index === currentImageIndex && currentImageIndex === 0 && allImages.length > 1) {
      setCurrentImageIndex(0);
    } else if (allImages.length === 1) {
      setCurrentImageIndex(0);
    }
  };

  const nextImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }
  };

  const prevImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  // Fotoğraf düzenleme fonksiyonları
  const handleEditImage = (index: number) => {
    setEditingImageIndex(index);
    setIsEditingImage(true);
  };

  const handleSaveEditedImage = (editedImageUrl: string, width: number, height: number) => {
    if (editingImageIndex === null) return;

    if (editingImageIndex < scrapedImages.length) {
      // Scraped image düzenlendi
      const newScrapedImages = [...scrapedImages];
      newScrapedImages[editingImageIndex] = editedImageUrl;
      setScrapedImages(newScrapedImages);
      
      // Boyut bilgisini güncelle
      const newDimensions = [...imageDimensions];
      newDimensions[editingImageIndex] = { width, height };
      setImageDimensions(newDimensions);
    } else {
      // Preview image düzenlendi
      const previewIndex = editingImageIndex - scrapedImages.length;
      const newPreviewImages = [...previewImages];
      newPreviewImages[previewIndex] = editedImageUrl;
      setPreviewImages(newPreviewImages);
      
      // Boyut bilgisini güncelle
      const newDimensions = [...imageDimensions];
      const dimensionIndex = scrapedImages.length + previewIndex;
      newDimensions[dimensionIndex] = { width, height };
      setImageDimensions(newDimensions);
    }
    
    setIsEditingImage(false);
    setEditingImageIndex(null);
  };

  const handleResetAllImages = () => {
    if (window.confirm('Tüm fotoğraf değişikliklerini sıfırlamak istediğinize emin misiniz?')) {
      if (originalScrapedImages.length > 0) {
        setScrapedImages([...originalScrapedImages]);
      }
      if (originalPreviewImages.length > 0) {
        setPreviewImages([...originalPreviewImages]);
      }
      setCoverImageIndex(0);
      setCurrentImageIndex(0);
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
    
    // Kullanıcı giriş kontrolü
    if (!user || !user.id) {
      alert('Ürün paylaşmak için lütfen giriş yapın.');
      navigate('/login');
      return;
    }
    
    // Trendyol kontrolü
    if (formData.productLink && !isTrendyolUrl(formData.productLink)) {
      alert('Sadece Trendyol ürünleri paylaşılabilir. Lütfen Trendyol linki girin.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Form validasyonu
      if (!formData.title.trim()) {
        alert('Ürün başlığı gereklidir');
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.category) {
        alert('Kategori seçimi gereklidir');
        setIsSubmitting(false);
        return;
      }
      
      if (allImages.length === 0) {
        alert('En az bir fotoğraf yüklemelisiniz');
        setIsSubmitting(false);
        return;
      }

      // Duplicate ürün kontrolü
      if (formData.productLink && checkForDuplicateProduct(formData.productLink)) {
        alert('Bu ürün daha önce paylaşılmış! Aynı ürünü tekrar paylaşamazsınız.');
        setIsSubmitting(false);
        return;
      }

      // Images JSONB[] formatına dönüştür (her fotoğraf için url, width, height)
      const imagesJsonb = allImages.map((url, index) => {
        const dimensions = imageDimensions[index] || { width: 0, height: 0 };
        return {
          url: url,
          width: dimensions.width,
          height: dimensions.height
        };
      });

      // Veritabanına kaydet (önce affiliate_url olmadan)
      // ID'yi manuel olarak belirtme, Supabase otomatik üretsin
      const insertData: any = {
        title: formData.title,
        description: formData.description || null,
        price: formData.price || null,
        category: formData.category,
        subcategory: formData.subcategory || null,
        hashtags: formData.hashtags || null,
        product_link: formData.productLink || null,
        affiliate_url: null, // Önce null, sonra güncellenecek
        store: formData.store || stores[Math.floor(Math.random() * stores.length)] || null,
        brand: formData.brand || null,
        specs: Object.keys(productSpecs).length > 0 ? productSpecs : null,
        images: imagesJsonb.length > 0 ? imagesJsonb : null,
        image_url: allImages[coverImageIndex] || allImages[0] || null,
        cover_image_index: coverImageIndex,
        created_by: user.id, // Kullanıcı giriş kontrolü yapıldığı için artık user.id garantili
        rating: 0,
        review_count: 0,
        like_count: 0
      };

      console.log('📝 Veritabanına kaydedilecek veri:', insertData);
      console.log('👤 Kullanıcı ID (created_by):', user.id);

      const { data: insertedProduct, error: insertError } = await supabase
        .from('products')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Veritabanı kayıt hatası:', insertError);
        console.error('Hata detayları:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          status: (insertError as any).status,
          statusText: (insertError as any).statusText
        });
        
        // 409 Conflict hatası (duplicate key veya unique constraint)
        if (insertError.code === '23505' || 
            insertError.message.includes('duplicate key') || 
            (insertError as any).status === 409) {
          console.error('🔍 Duplicate key hatası tespit edildi. Sequence kontrol ediliyor...');
          alert('Veritabanı ID çakışması oluştu. Bu genellikle sequence sorunundan kaynaklanır.\n\nLütfen fix_products_sequence.sql dosyasını Supabase SQL Editor\'da çalıştırın ve tekrar deneyin.\n\nHata kodu: ' + insertError.code);
        } else {
          alert('Ürün kaydedilirken bir hata oluştu:\n\n' + insertError.message + '\n\nHata kodu: ' + (insertError.code || 'Bilinmeyen'));
        }
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Ürün veritabanına kaydedildi:', insertedProduct);

      // Affiliate link oluştur (ürün ID'si ile)
      const affiliateLink = formData.productLink 
        ? createAffiliateLink(formData.productLink, insertedProduct.id, user?.id)
        : null;

      // Affiliate link'i güncelle
      if (affiliateLink) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ affiliate_url: affiliateLink })
          .eq('id', insertedProduct.id);

        if (updateError) {
          console.error('Affiliate link güncelleme hatası:', updateError);
        } else {
          console.log('✅ Affiliate link güncellendi:', affiliateLink);
        }
      }

      // Rastgele veriler oluştur (UI için)
      const randomUserNames = [
        'Ayşe Yılmaz', 'Mehmet Kaya', 'Zeynep Demir', 'Ali Özkan', 'Elif Şahin',
        'Can Arslan', 'Selin Öztürk', 'Emre Çelik', 'Deniz Kılıç', 'Berk Yıldız',
        'Ceren Aktaş', 'Furkan Doğan', 'Gizem Özkan', 'Hakan Yılmaz', 'İrem Kaya'
      ];
      
      const randomLikes = Math.floor(Math.random() * 1000) + 50;
      const randomRating = (Math.random() * 2 + 3).toFixed(1);
      const randomReviews = Math.floor(Math.random() * 200) + 10;
      
      const randomDate = new Date();
      const randomUserName = randomUserNames[Math.floor(Math.random() * randomUserNames.length)];
      
      // Yeni ürün oluştur (UI için)
      const baseProduct = {
        id: insertedProduct.id,
        title: formData.title,
        description: formData.description,
        price: formData.price ? `₺${formData.price}` : undefined,
        category: formData.category,
        subcategory: formData.subcategory,
        hashtags: formData.hashtags,
        productLink: formData.productLink,
        store: formData.store || stores[Math.floor(Math.random() * stores.length)],
        brand: formData.brand || undefined,
        specs: Object.keys(productSpecs).length > 0 ? productSpecs : {},
        imageUrl: allImages[coverImageIndex] || allImages[0] || '',
        images: allImages,
        user: {
          id: user?.id || getOrCreateUserId(),
          name: randomUserName,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(randomUserName)}&background=3b82f6&color=fff`,
          verified: Math.random() > 0.3
        },
        likes: randomLikes,
        rating: parseFloat(randomRating),
        reviews: randomReviews,
        shareDate: randomDate.toISOString(),
        popularityRank: 999
      };
      
      // Affiliate link oluştur
      const newProduct = generateProductAffiliateLink(baseProduct);
      
      // Ürünü ana sayfaya ekle
      if (onProductShared) {
        onProductShared(newProduct);
      }
      
      alert('Ürününüz başarıyla paylaşıldı! 🎉');
      navigate('/');
      
    } catch (error) {
      console.error('Paylaşım hatası:', error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kullanıcı giriş kontrolü - eğer giriş yapılmamışsa mesaj göster
  if (!user || !user.id) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: themeMode === 'pink' ? '#fef7f7' : isDarkMode ? '#111827' : '#f8fafc',
        padding: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
          backgroundColor: themeMode === 'pink' ? '#fef7f7' : isDarkMode ? '#1f2937' : 'white',
          borderRadius: '16px',
          boxShadow: themeMode === 'pink' ? '0 4px 6px -1px rgba(236, 72, 153, 0.2)' : isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(229, 231, 235, 0.5)',
          padding: '3rem 2rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1.5rem'
          }}>
            🔒
          </div>
          <h1 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.75rem',
            fontWeight: 'bold',
            color: themeMode === 'pink' ? '#be185d' : isDarkMode ? '#f3f4f6' : '#111827'
          }}>
            Ürün Paylaşabilmek İçin Giriş Yapmanız Gerekiyor
          </h1>
          <p style={{
            margin: '0 0 2rem 0',
            fontSize: '1rem',
            color: themeMode === 'pink' ? '#9f1239' : isDarkMode ? '#d1d5db' : '#6b7280',
            lineHeight: '1.6'
          }}>
            Ürün paylaşmak ve Looksy topluluğuna katılmak için lütfen giriş yapın veya yeni bir hesap oluşturun.
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: themeMode === 'pink' ? '#ec4899' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: themeMode === 'pink' ? '0 4px 6px -1px rgba(236, 72, 153, 0.3)' : '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeMode === 'pink' ? '#db2777' : '#2563eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = themeMode === 'pink' ? '0 6px 12px -1px rgba(236, 72, 153, 0.4)' : '0 6px 12px -1px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = themeMode === 'pink' ? '#ec4899' : '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = themeMode === 'pink' ? '0 4px 6px -1px rgba(236, 72, 153, 0.3)' : '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
              }}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => navigate('/signup')}
              style={{
                backgroundColor: 'transparent',
                color: themeMode === 'pink' ? '#ec4899' : '#3b82f6',
                border: `2px solid ${themeMode === 'pink' ? '#ec4899' : '#3b82f6'}`,
                borderRadius: '0.75rem',
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeMode === 'pink' ? '#fdf2f8' : '#eff6ff';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Kayıt Ol
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: themeMode === 'pink' ? '#fef7f7' : isDarkMode ? '#111827' : '#f8fafc',
      padding: '0.5rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: themeMode === 'pink' ? '#fef7f7' : isDarkMode ? '#1f2937' : 'white',
        borderRadius: '16px',
        boxShadow: themeMode === 'pink' ? '0 4px 6px -1px rgba(236, 72, 153, 0.2)' : isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        border: themeMode === 'pink' ? '1px solid rgba(249, 168, 212, 0.3)' : isDarkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid rgba(229, 231, 235, 0.5)'
      }}>
        {/* Header - Kompakt */}
        <div style={{
          background: themeMode === 'pink' 
            ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            🛍️ Ürün Paylaş
          </h1>
          <p style={{
            margin: 0,
            opacity: 0.9,
            fontSize: '0.9rem'
          }}>
            Ürününüzü Looksy topluluğu ile paylaşın
          </p>
        </div>

        {/* Ana İçerik - Sol: Fotoğraflar, Sağ: Form */}
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
            
            {/* Dosya Seçme Alanı - Küçük */}
            <div style={{
              border: themeMode === 'pink' ? '2px dashed #f9a8d4' : isDarkMode ? '2px dashed #4b5563' : '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '0.75rem',
              textAlign: 'center',
              backgroundColor: themeMode === 'pink' ? '#fdf2f8' : isDarkMode ? '#374151' : '#f9fafb',
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

            {/* Scraping Loading Indicator */}
            {isScraping && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  border: '3px solid #0ea5e9',
                  borderTop: '3px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '0.5rem'
                }} />
                <span style={{ color: '#0369a1', fontSize: '0.875rem' }}>
                  Trendyol'dan ürün bilgileri çekiliyor...
                </span>
              </div>
            )}

            {/* Fotoğraf Önizleme Alanı - Carousel/Slider */}
            {allImages.length > 0 && (
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
                  🖼️ {scrapedImages.length > 0 ? 'Ürün Fotoğrafları' : 'Yüklenen Fotoğraflar'}
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: '400',
                    color: '#6b7280'
                  }}>
                    ({currentImageIndex + 1}/{allImages.length})
                  </span>
                  {coverImageIndex === currentImageIndex && (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#059669',
                      backgroundColor: '#d1fae5',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      📌 Kapak Fotoğrafı
                    </span>
                  )}
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
                  backgroundColor: '#f9fafb',
                  // Dikey yükseklik fotoğrafın oranına göre dinamik
                  ...(imageDimensions[currentImageIndex] ? {
                    aspectRatio: `${imageDimensions[currentImageIndex].width} / ${imageDimensions[currentImageIndex].height}`
                  } : {
                    aspectRatio: '1' // Varsayılan (boyut bilgisi yoksa)
                  })
                }}>
                  {/* Mevcut Fotoğraf */}
                  <img
                    src={allImages[currentImageIndex]}
                    alt={`Preview ${currentImageIndex + 1}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      objectFit: 'contain'
                    }}
                  />
                  
                  {/* Fotoğraf Numarası */}
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '0.5rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {currentImageIndex + 1}
                  </div>
                  
                  {/* Boyut Bilgisi */}
                  {imageDimensions[currentImageIndex] && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '10rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.9)',
                      color: 'white',
                      borderRadius: '8px',
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      zIndex: 10
                    }}>
                      {imageDimensions[currentImageIndex].width} × {imageDimensions[currentImageIndex].height} px
                    </div>
                  )}
                  
                  {/* Düzenle Butonu */}
                  <button
                    type="button"
                    onClick={() => handleEditImage(currentImageIndex)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '3.5rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(4px)',
                      gap: '0.25rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.95)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                    }}
                  >
                    ✏️ Düzenle
                  </button>

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
                  
                  {/* Kapak Fotoğrafı Seç Butonu */}
                  {coverImageIndex !== currentImageIndex && (
                    <button
                      type="button"
                      onClick={() => selectCoverImage(currentImageIndex)}
                      style={{
                        position: 'absolute',
                        bottom: '0.5rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(5, 150, 105, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(4px)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(4, 120, 87, 0.95)';
                        e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(5, 150, 105, 0.9)';
                        e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                      }}
                    >
                      📌 Kapak Fotoğrafı Seç
                    </button>
                  )}

                  {/* Navigation Butonları - Sadece birden fazla fotoğraf varsa */}
                  {allImages.length > 1 && (
                    <>
                      {/* Sol Ok */}
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                        }}
                      >
                        ‹
                      </button>
                      
                      {/* Sağ Ok */}
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                        }}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
                
                {/* Thumbnail Navigation - Sadece birden fazla fotoğraf varsa */}
                {allImages.length > 1 && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    marginTop: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    {allImages.map((image, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: index === currentImageIndex 
                              ? '3px solid #3b82f6' 
                              : index === coverImageIndex 
                                ? '3px solid #059669' 
                                : '2px solid #e5e7eb',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: 'white',
                            boxShadow: index === currentImageIndex 
                              ? '0 4px 12px rgba(59, 130, 246, 0.3)' 
                              : index === coverImageIndex
                                ? '0 4px 12px rgba(5, 150, 105, 0.3)'
                                : '0 2px 4px rgba(0, 0, 0, 0.1)',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            if (index !== currentImageIndex) {
                              e.currentTarget.style.transform = 'scale(1.05)';
                              e.currentTarget.style.borderColor = '#3b82f6';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (index !== currentImageIndex) {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.borderColor = index === coverImageIndex ? '#059669' : '#e5e7eb';
                            }
                          }}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                        </button>
                        {index === coverImageIndex && (
                          <div style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            backgroundColor: '#059669',
                            color: 'white',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                          }}>
                            📌
                          </div>
                        )}
                        {index < scrapedImages.length && (
                          <div style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: '-4px',
                            backgroundColor: '#0ea5e9',
                            color: 'white',
                            borderRadius: '4px',
                            padding: '2px 4px',
                            fontSize: '8px',
                            fontWeight: 'bold'
                          }}>
                            TY
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Sıfırla Butonu - Sadece değişiklik yapıldıysa göster */}
                {(scrapedImages.length > 0 || previewImages.length > 0) && (
                  <div style={{
                    marginTop: '1rem',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <button
                      type="button"
                      onClick={handleResetAllImages}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef4444';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      🔄 Tüm Değişiklikleri Sıfırla
                    </button>
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

            {/* Ürün Linki - En Başta */}
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
                placeholder="https://www.trendyol.com/urun/..."
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
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              
              {/* Anlaşmalı Olmayan Mağaza Uyarısı */}
              {isNonTrendyolStore && formData.productLink.trim() && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '6px',
                  color: '#92400e',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>⚠️</span>
                  <span><strong>Anlaşmalı Olmayan Mağaza:</strong> Sadece Trendyol ürünleri paylaşılabilir. Lütfen Trendyol linki girin.</span>
                </div>
              )}
              
              {/* Error Message (Duplicate veya Scraping hatası) */}
              {duplicateError && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  borderLeft: '4px solid #ef4444'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <div style={{
                      fontSize: '1rem'
                    }}>
                      ⚠️
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#dc2626'
                    }}>
                      {duplicateError.includes('Duplicate') || duplicateError.includes('daha önce paylaşılmış') 
                        ? 'Duplicate Ürün Tespit Edildi!' 
                        : 'Bilgi Çekme Hatası!'}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#991b1b',
                    lineHeight: '1.4'
                  }}>
                    {duplicateError}
                  </div>
                </div>
              )}
              
              {/* Affiliate Link Preview */}
              {affiliateLinkPreview && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  borderLeft: '4px solid #0ea5e9'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      fontSize: '1rem'
                    }}>
                      🔗
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#0c4a6e'
                    }}>
                      Affiliate Linkiniz:
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'white',
                    border: '1px solid #e0f2fe',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#0369a1',
                    wordBreak: 'break-all'
                  }}>
                    <span style={{ flex: 1 }}>
                      {affiliateLinkPreview}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(affiliateLinkPreview);
                        // Toast notification için basit alert
                        alert('Affiliate link kopyalandı! 📋');
                      }}
                      style={{
                        backgroundColor: '#0ea5e9',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#0284c7';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#0ea5e9';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      📋 Kopyala
                    </button>
                  </div>
                  
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    fontStyle: 'italic'
                  }}>
                    Bu link paylaşıldığında sizin adınıza tıklama takibi yapılacak
                  </div>
                </div>
              )}
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
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Açıklama - Başlığın Hemen Altında */}
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
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
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
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="150"
                readOnly={isPriceLocked}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  backgroundColor: isPriceLocked ? '#f3f4f6' : 'white',
                  cursor: isPriceLocked ? 'not-allowed' : 'text'
                }}
                onFocus={(e) => {
                  if (!isPriceLocked) {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {isPriceLocked && (
                <div style={{
                  marginTop: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>
                  🔒 Fiyat Trendyol'dan otomatik çekildi, değiştirilemez
                </div>
              )}
              {formData.price && formData.price.trim() !== '' && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: '#0c4a6e',
                  fontStyle: 'italic'
                }}>
                  <strong>Fiyat Bilgisi:</strong> {priceToTurkishText(formData.price)}
                </div>
              )}
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
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
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
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
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
                 disabled
                 style={{
                   width: '100%',
                   padding: '0.6rem',
                   border: '2px solid #e5e7eb',
                   borderRadius: '6px',
                   fontSize: '0.85rem',
                   outline: 'none',
                   transition: 'all 0.2s ease',
                   backgroundColor: '#f3f4f6',
                   boxSizing: 'border-box',
                   cursor: 'not-allowed',
                   opacity: 0.7
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

             {/* Marka */}
             <div>
               <label style={{
                 display: 'block',
                 marginBottom: '0.375rem',
                 fontWeight: '600',
                 color: '#374151',
                 fontSize: '0.85rem'
               }}>
                 Marka
               </label>
               <input
                 type="text"
                 name="brand"
                 value={formData.brand}
                 onChange={handleInputChange}
                 placeholder="Örn: Nike, Adidas, Zara"
                 style={{
                   width: '100%',
                   padding: '0.6rem',
                   border: '2px solid #e5e7eb',
                   borderRadius: '6px',
                   fontSize: '0.85rem',
                   outline: 'none',
                   transition: 'all 0.2s ease',
                   boxSizing: 'border-box',
                   backgroundColor: 'white'
                 }}
                 onFocus={(e) => {
                   e.target.style.borderColor = '#3b82f6';
                   e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                 }}
                 onBlur={(e) => {
                   e.target.style.borderColor = '#e5e7eb';
                   e.target.style.boxShadow = 'none';
                 }}
               />
             </div>

             {/* Ürün Özellikleri */}
             {Object.keys(productSpecs).length > 0 && (
               <div>
                 <label style={{
                   display: 'block',
                   marginBottom: '0.75rem',
                   fontWeight: '600',
                   color: '#374151',
                   fontSize: '0.9rem'
                 }}>
                   Ürün Özellikleri
                 </label>
                 <div style={{
                   padding: '1rem',
                   backgroundColor: '#f9fafb',
                   border: '2px solid #e5e7eb',
                   borderRadius: '8px',
                   maxHeight: '300px',
                   overflowY: 'auto'
                 }}>
                   {Object.entries(productSpecs).map(([key, value], index) => (
                     <div
                       key={index}
                       style={{
                         display: 'flex',
                         padding: '0.5rem 0',
                         borderBottom: index < Object.keys(productSpecs).length - 1 ? '1px solid #e5e7eb' : 'none'
                       }}
                     >
                       <div style={{
                         fontWeight: '600',
                         color: '#374151',
                         fontSize: '0.85rem',
                         minWidth: '150px',
                         flexShrink: 0
                       }}>
                         {key}:
                       </div>
                       <div style={{
                         color: '#6b7280',
                         fontSize: '0.85rem',
                         flex: 1,
                         marginLeft: '0.5rem'
                       }}>
                         {value}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}

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
                 onFocus={(e) => {
                   e.target.style.borderColor = '#3b82f6';
                   e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                 }}
                 onBlur={(e) => {
                   e.target.style.borderColor = '#e5e7eb';
                   e.target.style.boxShadow = 'none';
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
                onClick={() => navigate('/')}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isNonTrendyolStore}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: (isSubmitting || isNonTrendyolStore) ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: (isSubmitting || isNonTrendyolStore) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting && !isNonTrendyolStore) {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting && !isNonTrendyolStore) {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
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
                    Paylaşılıyor...
                  </>
                ) : (
                  '🛍️ Ürünü Paylaş'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Editor Modal */}
      {isEditingImage && editingImageIndex !== null && (
        <ImageEditor
          imageUrl={allImages[editingImageIndex]}
          onSave={handleSaveEditedImage}
          onClose={() => {
            setIsEditingImage(false);
            setEditingImageIndex(null);
          }}
          isDarkMode={isDarkMode}
          themeMode={themeMode}
        />
      )}

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

export default ShareProductPage;
