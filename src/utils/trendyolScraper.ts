/**
 * Trendyol ürün bilgilerini çekmek için scraping utility
 */

export interface TrendyolProductData {
  title: string;
  price: string;
  images: string[];
  description?: string;
  specs?: { [key: string]: string }; // Ürün özellikleri (key-value formatında)
}

/**
 * Trendyol URL'si olup olmadığını kontrol eder
 */
export const isTrendyolUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('trendyol.com');
  } catch {
    return false;
  }
};

/**
 * URL'nin ürün fotoğrafı olup olmadığını kontrol eder
 * Logo, icon, badge, etiket gibi gereksiz görselleri filtreler
 */
const isProductImage = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  
  // Kesinlikle filtrele - logo, icon, badge, etiket vb.
  const excludePatterns = [
    'logo',
    'icon',
    'badge',
    'etiket',
    'label',
    'tag',
    'banner',
    'qr',
    'qrcode',
    'placeholder',
    'loading',
    'spinner',
    'social',
    'facebook',
    'instagram',
    'youtube',
    'twitter',
    'whatsapp',
    'mastercard',
    'visa',
    'payment',
    'credit',
    'card',
    'certificate',
    'stamp',
    'watermark',
    'advertisement',
    'ad',
    'promo',
    'campaign',
    'header',
    'footer',
    'nav',
    'menu',
    'button',
    'arrow',
    'chevron',
    'close',
    'delete',
    'remove',
    'check',
    'tick',
    'star-empty',
    'star-filled',
    'heart-empty',
    'heart-filled',
    'share',
    'search',
    'filter',
    'sort',
    'cart',
    'bag',
    'user',
    'account',
    'profile',
    'settings',
    'notification',
    'bell',
    'message',
    'chat',
    'help',
    'support',
    'info',
    'warning',
    'error',
    'success',
    'play',
    'pause',
    'next',
    'prev',
    'previous',
    'back',
    'forward',
    'download',
    'upload',
    'refresh',
    'reload',
    'home',
    'category',
    'brand',
    'seller',
    'store',
    'shop',
    'marketplace',
    'trendyol-logo',
    'ty-logo',
    'app-store',
    'google-play',
    'app-icon',
    'favicon',
    'og-image',
    'meta-image',
    'thumbnail-small',
    'thumbnail-tiny',
    // Etiketler ve rozetler
    'bestseller',
    'best-seller',
    'en-cok-satan',
    'ençoksatan',
    'trending',
    'popular',
    'featured',
    'new',
    'yeni',
    'indirim',
    'discount',
    'sale',
    'kampanya',
    'campaign',
    'özel',
    'special',
    'seçili',
    'selected',
    'önerilen',
    'recommended',
    'favori',
    'favorite',
    'beğenilen',
    'liked',
    'hot',
    'sıcak',
    'flash',
    'hızlı',
    'fast',
    'express',
    'premium',
    'vip',
    'gold',
    'silver',
    'bronze',
    'platinum',
    'star',
    'yıldız',
    'rating',
    'puan',
    'review',
    'yorum',
    'comment',
    'feedback',
    'geri-bildirim',
    'gift',
    'hediye',
    'present',
    'box',
    'kutu',
    'package',
    'paket',
    'delivery',
    'teslimat',
    'cargo',
    'kargo',
    'shipping',
    'gönderim',
    'return',
    'iade',
    'refund',
    'geri-ödeme',
    'warranty',
    'garanti',
    'guarantee',
    'certificate',
    'sertifika',
    'quality',
    'kalite',
    'authentic',
    'orijinal',
    'original',
    'genuine',
    'gerçek',
    'verified',
    'doğrulanmış',
    'trusted',
    'güvenilir',
    'secure',
    'güvenli',
    'safe',
    'emniyetli'
  ];
  
  // Exclude pattern'leri kontrol et
  for (const pattern of excludePatterns) {
    if (lowerUrl.includes(pattern)) {
      return false;
    }
  }
  
  // Küçük thumbnail boyutlarını filtrele
  const sizePatterns = [
    /50x50/i,
    /100x100/i,
    /150x150/i,
    /200x200/i,
    /300x300/i,
    /_50\./i,
    /_100\./i,
    /_150\./i,
    /_200\./i,
    /thumb/i,
    /mini/i,
    /small/i,
    /tiny/i
  ];
  
  for (const pattern of sizePatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }
  
  // Ürün fotoğrafı olma kriterleri (en az biri olmalı)
  const productImagePatterns = [
    '/prod/',           // Ürün path'i
    '/ty',              // Ürün kodu (ty1749 gibi)
    '_org_',            // Orijinal fotoğraf
    '_zoom',            // Zoom fotoğrafı
    'mnresize',         // Resize edilmiş ürün fotoğrafı
    '/product/',        // Product path
    '/image/',          // Image path
    '/photo/',          // Photo path
    'product-image',    // Product image
    'gallery',          // Gallery
    'slider'            // Slider
  ];
  
  // En az bir ürün fotoğrafı pattern'i olmalı
  const hasProductPattern = productImagePatterns.some(pattern => lowerUrl.includes(pattern));
  
  if (!hasProductPattern) {
    return false; // Ürün fotoğrafı pattern'i yoksa reddet
  }
  
  return true;
};

/**
 * Trendyol ürün bilgilerini çeker
 * CORS sorunları nedeniyle proxy kullanılabilir
 */
export const scrapeTrendyolProduct = async (productUrl: string): Promise<TrendyolProductData | null> => {
  try {
    console.log('🔍 Trendyol scraping başlatılıyor:', productUrl);
    
    if (!isTrendyolUrl(productUrl)) {
      console.log('❌ Trendyol URL değil');
      return null;
    }

    // Proxy seçenekleri - sadece çalışan proxy kullanılıyor
    const proxies = [
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(productUrl)}`
    ];

    let html = '';
    let lastError: Error | null = null;

    // Her proxy'yi sırayla dene
    for (let i = 0; i < proxies.length; i++) {
      try {
        console.log(`🔄 Proxy ${i + 1}/${proxies.length} deneniyor...`);
        const response = await fetch(proxies[i], {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data: any;
        const contentType = response.headers.get('content-type');
        
        // Response tipine göre parse et
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          // HTML olarak geliyorsa direkt al
          html = await response.text();
          if (html && html.length > 1000) {
            console.log(`✅ Proxy ${i + 1} başarılı (HTML), uzunluk: ${html.length}`);
            break;
          }
          continue;
        }
        
        // allorigins.win formatı
        if (data.contents) {
          html = data.contents;
        } 
        // corsproxy.io formatı (direkt HTML döner)
        else if (typeof data === 'string') {
          html = data;
        }
        // codetabs formatı
        else if (data.data) {
          html = data.data;
        }
        // allorigins alternatif format
        else if (data.status?.http_code === 200 && data.contents) {
          html = data.contents;
        }
        else {
          console.warn('Beklenmeyen response formatı:', data);
          html = typeof data === 'string' ? data : JSON.stringify(data);
        }

        if (html && html.length > 1000) {
          console.log(`✅ Proxy ${i + 1} başarılı, HTML uzunluğu: ${html.length}`);
          break;
        }
      } catch (error) {
        console.warn(`⚠️ Proxy ${i + 1} başarısız:`, error);
        lastError = error as Error;
        continue;
      }
    }

    if (!html || html.length < 1000) {
      throw new Error(`HTML çekilemedi. Son hata: ${lastError?.message || 'Bilinmeyen hata'}`);
    }

    console.log('✅ HTML başarıyla çekildi, uzunluk:', html.length);
    console.log('📄 HTML\'in ilk 500 karakteri:', html.substring(0, 500));

    // Cloudflare blokunu kontrol et
    const htmlLower = html.toLowerCase();
    if (htmlLower.includes('sorry, you have been blocked') || 
        htmlLower.includes('attention required') ||
        htmlLower.includes('cloudflare') && htmlLower.includes('blocked') ||
        htmlLower.includes('cf-error-details') ||
        htmlLower.includes('unable to access')) {
      throw new Error('Trendyol sayfası Cloudflare tarafından bloklanmış. Lütfen daha sonra tekrar deneyin veya farklı bir proxy kullanın.');
    }

    // HTML'i parse etmek için DOMParser kullan
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    console.log('📊 Parse edilen HTML:', {
      title: doc.title,
      scriptCount: doc.querySelectorAll('script').length,
      imgCount: doc.querySelectorAll('img').length
    });

    // Önce script tag'lerinden JSON verisini çek (Trendyol genellikle burada tutar)
    let productData: any = null;
    const scripts = doc.querySelectorAll('script');
    
    for (const script of scripts) {
      const scriptText = script.textContent || '';
      
      // window.__PRODUCT_DETAIL_APP__ veya benzeri pattern'leri ara
      if (scriptText.includes('__PRODUCT_DETAIL_APP__') || 
          scriptText.includes('productDetail') ||
          scriptText.includes('productData')) {
        try {
          // JSON verisini extract et
          const jsonMatch = scriptText.match(/(?:window\.__PRODUCT_DETAIL_APP__|productDetail|productData)\s*=\s*({[\s\S]*?});/);
          if (jsonMatch) {
            productData = JSON.parse(jsonMatch[1]);
            console.log('✅ Script tag\'den veri bulundu');
            break;
          }
        } catch (e) {
          console.warn('Script tag parse hatası:', e);
        }
      }
      
      // JSON-LD formatını da kontrol et
      if (script.getAttribute('type') === 'application/ld+json') {
        try {
          const jsonData = JSON.parse(scriptText);
          if (jsonData['@type'] === 'Product' || jsonData.name) {
            productData = jsonData;
            console.log('✅ JSON-LD verisi bulundu');
            break;
          }
        } catch (e) {
          // JSON parse hatası, devam et
        }
      }
    }

    let title = '';
    let price = '';
    let images: string[] = [];
    let description = '';
    let scriptPrice: number | null = null;

    // Eğer script tag'den veri bulunduysa, onu kullan
    if (productData) {
      // Title
      title = productData.name || 
              productData.title || 
              productData.productName ||
              productData.product?.name ||
              '';
      
      // Price - Script tag'den fiyat çek (geçici olarak, HTML'den de kontrol edilecek)
      if (productData.offers?.price || productData.price) {
        const scriptPriceValue = productData.offers?.price || productData.price;
        // Fiyatı sayıya çevir ve kontrol et
        const numPrice = typeof scriptPriceValue === 'number' ? scriptPriceValue : parseFloat(String(scriptPriceValue));
        if (!isNaN(numPrice) && numPrice >= 1 && numPrice <= 1000000) {
          scriptPrice = numPrice;
          console.log(`💰 Script tag'den fiyat bulundu: ${scriptPrice} TL`);
        }
      }
      
      // Images - Tüm olası image field'larını kontrol et
      if (productData.image) {
        if (Array.isArray(productData.image)) {
          images = productData.image;
        } else {
          images = [productData.image];
        }
      }
      
      // Alternatif image field'ları
      if (images.length <= 1) {
        if (productData.images && Array.isArray(productData.images)) {
          images = productData.images;
        } else if (productData.galleryImages && Array.isArray(productData.galleryImages)) {
          images = productData.galleryImages;
        } else if (productData.productImages && Array.isArray(productData.productImages)) {
          images = productData.productImages;
        } else if (productData.imageUrls && Array.isArray(productData.imageUrls)) {
          images = productData.imageUrls;
        } else if (productData.product?.images && Array.isArray(productData.product.images)) {
          images = productData.product.images;
        } else if (productData.product?.galleryImages && Array.isArray(productData.product.galleryImages)) {
          images = productData.product.galleryImages;
        }
      }
      
      // Description
      description = productData.description || productData.product?.description || '';
    }
    
    // Script tag'lerinden daha agresif image arama - HER ZAMAN çalıştır
    console.log('🔍 Script tag\'lerinde fotoğraf aranıyor...');
    
    const allScripts = doc.querySelectorAll('script');
    const foundImageUrlsFromScripts = new Set<string>();
    
    console.log(`📜 ${allScripts.length} script tag bulundu`);
    
    for (const script of allScripts) {
      const scriptText = script.textContent || '';
      
      if (!scriptText || scriptText.length < 100) continue; // Çok kısa script'leri atla
      
      // Tüm script tag'lerinden Trendyol CDN URL'lerini bul - YENİ CDN'leri de dahil et
      const urlPatterns = [
        // YENİ: dsmcdn.com
        /https?:\/\/[^\s"',\[\]<>{}()]+cdn\.dsmcdn\.com[^\s"',\[\]<>{}()]+\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG|WEBP|GIF)/gi,
        /https?:\/\/[^\s"',\[\]<>{}()]+dsmcdn\.com[^\s"',\[\]<>{}()]+\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG|WEBP|GIF)/gi,
        // ESKİ: cdn.trendyol.com
        /https?:\/\/[^\s"',\[\]<>{}()]+cdn\.trendyol\.com[^\s"',\[\]<>{}()]+\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG|WEBP|GIF)/gi,
        // ESKİ: ty-cdn.com
        /https?:\/\/[^\s"',\[\]<>{}()]+ty-cdn\.com[^\s"',\[\]<>{}()]+\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG|WEBP|GIF)/gi
      ];
      
      for (const pattern of urlPatterns) {
        const allUrls = scriptText.match(pattern);
        if (allUrls && allUrls.length > 0) {
          allUrls.forEach(url => {
            const cleanUrl = url.replace(/['"]/g, '').split('?')[0].split('&')[0];
            if (isProductImage(cleanUrl)) {
              foundImageUrlsFromScripts.add(cleanUrl);
            }
          });
        }
      }
      
      // JSON array pattern'lerini de ara (galleryImages, productImages, etc.)
      if (scriptText.includes('galleryImages') || 
          scriptText.includes('productImages') || 
          scriptText.includes('images') ||
          scriptText.includes('imageUrls') ||
          scriptText.includes('productImageUrls')) {
        try {
          // Daha esnek JSON array pattern'leri
          const imageArrayPatterns = [
            /galleryImages\s*[:=]\s*\[([^\]]+)\]/g,
            /productImages\s*[:=]\s*\[([^\]]+)\]/g,
            /images\s*[:=]\s*\[([^\]]+)\]/g,
            /"images"\s*:\s*\[([^\]]+)\]/g,
            /'images'\s*:\s*\[([^\]]+)\]/g,
            /imageUrls\s*[:=]\s*\[([^\]]+)\]/g,
            /productImageUrls\s*[:=]\s*\[([^\]]+)\]/g
          ];
          
          for (const pattern of imageArrayPatterns) {
            const matches = Array.from(scriptText.matchAll(pattern));
            for (const match of matches) {
              if (match[1]) {
                // Array içindeki URL'leri bul
                const arrayUrlPattern = /https?:\/\/[^\s"',\[\]]+\.(jpg|jpeg|png|webp|gif)/gi;
                const arrayUrls = match[1].match(arrayUrlPattern);
                if (arrayUrls) {
                  arrayUrls.forEach(url => {
                    const cleanUrl = url.replace(/['"]/g, '').split('?')[0].split('&')[0];
                    if ((url.includes('cdn.trendyol.com') || 
                         url.includes('ty-cdn.com') ||
                         url.includes('cdn.dsmcdn.com') ||
                         url.includes('dsmcdn.com')) &&
                         isProductImage(cleanUrl)) {
                      foundImageUrlsFromScripts.add(cleanUrl);
                    }
                  });
                }
              }
            }
          }
        } catch (e) {
          // Devam et
        }
      }
    }
    
    if (foundImageUrlsFromScripts.size > 0) {
      const newImages = Array.from(foundImageUrlsFromScripts);
      images = [...new Set([...images, ...newImages])];
      console.log(`✅ Script tag'lerinden ${newImages.length} yeni fotoğraf bulundu, toplam: ${images.length}`);
    }

    // Eğer script tag'den veri bulunamadıysa, HTML'den parse et
    if (!title) {
      console.log('⚠️ Script tag\'den veri bulunamadı, HTML parse ediliyor...');
      
      // Ürün başlığı - Trendyol'un farklı sayfa yapıları için çoklu selector
      const titleSelectors = [
        'h1.pr-new-br',
        'h1[data-test-id="product-name"]',
        '.pr-new-br h1',
        'h1.product-name',
        '.product-name-container h1',
        '.pr-in-cn h1',
        'h1.pr-new-br span',
        '.product-detail-container h1',
        'h1[class*="product"]',
        '.pr-new-br',
        '[data-test-id="product-name"]',
        'h1', // Genel h1 tag'i (son çare)
        'h2[class*="product"]',
        'h2[class*="title"]',
        '.product-title',
        '.product-name'
      ];
      
      for (const selector of titleSelectors) {
        const titleElement = doc.querySelector(selector);
        if (titleElement) {
          const candidateTitle = titleElement.textContent?.trim() || '';
          if (candidateTitle && candidateTitle.length > 5) {
            // Cloudflare mesajlarını filtrele
            const lowerCandidate = candidateTitle.toLowerCase();
            if (lowerCandidate.includes('sorry') && lowerCandidate.includes('blocked') ||
                lowerCandidate.includes('attention required') ||
                lowerCandidate.includes('unable to access') ||
                lowerCandidate.includes('cloudflare')) {
              continue; // Cloudflare mesajlarını atla
            }
            
            // Sadece fiyat/indirim bilgisi içeren kısa başlıkları atla
            const isPriceOnly = (lowerCandidate.includes('sepette') && lowerCandidate.includes('tl')) ||
                               (candidateTitle.length < 20 && (lowerCandidate.includes('tl') || lowerCandidate.includes('indirim')));
            
            if (!isPriceOnly) {
              title = candidateTitle;
            console.log(`✅ Başlık bulundu (${selector}):`, title.substring(0, 50));
            break;
          }
        }
      }
    }

      // Eğer hala başlık bulunamadıysa, daha agresif arama yap
      if (!title || title.length < 3) {
        console.log('⚠️ Selector\'lardan başlık bulunamadı, agresif arama yapılıyor...');
        
        // Tüm h1, h2, h3 elementlerini kontrol et
        const headingElements = doc.querySelectorAll('h1, h2, h3');
        for (const heading of headingElements) {
          const headingText = heading.textContent?.trim() || '';
          if (headingText && headingText.length > 10) {
            // Cloudflare ve hata mesajlarını filtrele
            const lowerHeading = headingText.toLowerCase();
            if (lowerHeading.includes('sorry') && lowerHeading.includes('blocked') ||
                lowerHeading.includes('attention required') ||
                lowerHeading.includes('unable to access') ||
                lowerHeading.includes('cloudflare')) {
              continue; // Cloudflare mesajlarını atla
            }
            
            // "Marka Kampanyası" içeren başlıkları da kabul et (ürün başlığında geçebilir)
            // Sadece fiyat/indirim ile ilgili kısa başlıkları filtrele
            // Eğer başlık çok kısaysa ve sadece fiyat/indirim bilgisi içeriyorsa atla
            const isPriceOnly = (lowerHeading.includes('sepette') && lowerHeading.includes('tl')) ||
                               (lowerHeading.length < 20 && (lowerHeading.includes('tl') || lowerHeading.includes('indirim')));
            
            if (!isPriceOnly) {
              title = headingText;
              console.log(`✅ Başlık bulundu (agresif arama - ${heading.tagName}):`, title.substring(0, 50));
              break;
            }
          }
        }
        
        // Eğer hala bulunamadıysa, ilk uzun h1'i al (Cloudflare mesajlarını filtrele)
        if (!title || title.length < 3) {
          const allH1s = doc.querySelectorAll('h1');
          for (const h1 of allH1s) {
            const h1Text = h1.textContent?.trim() || '';
            if (!h1Text || h1Text.length < 5) continue;
            
            const lowerH1 = h1Text.toLowerCase();
            // Cloudflare mesajlarını filtrele
            if (lowerH1.includes('sorry') && lowerH1.includes('blocked') ||
                lowerH1.includes('attention required') ||
                lowerH1.includes('unable to access') ||
                lowerH1.includes('cloudflare')) {
              continue; // Cloudflare mesajlarını atla
            }
            
            // Sadece fiyat/indirim bilgisi içeren kısa başlıkları atla
            const isPriceOnly = (lowerH1.includes('sepette') && lowerH1.includes('tl')) ||
                               (h1Text.length < 20 && (lowerH1.includes('tl') || lowerH1.includes('indirim')));
            
            if (!isPriceOnly) {
              title = h1Text;
              console.log(`✅ Başlık bulundu (ilk h1):`, title.substring(0, 50));
              break;
            }
          }
        }
      }
    }

    // Senaryo tespiti ve fiyat çekme
    console.log('🔍 Senaryo tespiti yapılıyor...');
    
    // Senaryo tespiti: Hangi fiyat senaryosu var?
    type PriceScenario = 'no_discount' | 'basket_discount' | 'basket_percentage_discount' | 'lowest_price' | 'trendyol_plus' | 'coupon' | 'unknown';
    
    const detectPriceScenario = (): PriceScenario => {
      const htmlLower = html.toLowerCase();
      
      // Senaryo 4: Son x günün en düşük fiyatı kontrolü
      // Örnek: "Son 14 Günün En Düşük Fiyatı!" veya "Son 30 Günün En Düşük Fiyatı"
      const lowestPricePattern = /son\s+\d+\s+günün\s+en\s+düşük\s+fiyatı/i;
      if (lowestPricePattern.test(html)) {
        return 'lowest_price';
      }
      
      // Senaryo 3: Sepette yüzdelik indirim kontrolü - "Sepette %" pattern'i varsa
      // Örnek: "Sepette %5 indirim" veya "Sepette %2 indirim"
      const sepettePercentagePattern = /sepette\s+%\s*\d+/i;
      if (sepettePercentagePattern.test(html)) {
        // Yüzdelik indirimden sonra bir "Sepette" + fiyat formatı var mı kontrol et
        const sepettePriceAfterPercentage = /sepette\s+%\s*\d+[\s\S]*?sepette\s+[\d.,]+\s*(tl|₺)/i;
        if (sepettePriceAfterPercentage.test(html)) {
          return 'basket_percentage_discount';
        }
      }
      
      // Sepette indirim kontrolü - "Sepette" kelimesi ve yanında fiyat formatı varsa
      // Pattern: "Sepette" + sayı + TL formatı
      if (htmlLower.includes('sepette')) {
        // "Sepette" kelimesinden sonra fiyat formatı var mı kontrol et
        const sepettePricePattern = /sepette\s+[\d.,]+\s*(tl|₺)/i;
        if (sepettePricePattern.test(html)) {
          return 'basket_discount';
        }
      }
      
      // Trendyol Plus indirimi kontrolü
      if (htmlLower.includes('trendyol plus') || htmlLower.includes('plus üyelerine özel')) {
        return 'trendyol_plus';
      }
      
      // Kupon kontrolü (ama bu senaryo 1'i engellemez, sadece bilgi için)
      if (htmlLower.includes('kupon fırsatı') || htmlLower.includes('coupon')) {
        // Kupon varsa ama başka indirim yoksa, senaryo 1 olabilir
        // Çünkü kupon fiyat değil, sadece bir kampanya
      }
      
      // Eğer hiçbir özel indirim yoksa, Senaryo 1: Herhangi bir indirim yok
      return 'no_discount';
    };
    
    const scenario = detectPriceScenario();
    console.log(`📋 Tespit edilen senaryo: ${scenario}`);
    
    // Fiyat çıkarma yardımcı fonksiyonu
    const extractPrice = (text: string, ignoreCoupon: boolean = false): number | null => {
      if (!text) return null;
      
      const lowerText = text.toLowerCase();
      
      // "Marka Kampanyası" ifadesini içeren metinleri kontrol et
      // Eğer sadece "Marka Kampanyası" var ve fiyat formatı yoksa, atla
      // Ama eğer "Marka Kampanyası" + "Sepette" + fiyat formatı varsa, fiyatı çek
      if (lowerText.includes('marka kampanyası') || lowerText.includes('marka kampanyasi')) {
        // "Sepette" + fiyat formatı var mı kontrol et
        const hasSepettePrice = /sepette\s+[\d.,]+\s*(tl|₺)/i.test(text);
        // Genel fiyat formatı var mı kontrol et (sadece sayı + TL)
        const hasGeneralPrice = /[\d.,]+\s*(tl|₺)/i.test(text);
        
        if (!hasSepettePrice && !hasGeneralPrice) {
          // Sadece "Marka Kampanyası" var, fiyat yok, bu metni atla
          return null;
        }
        // Eğer hem "Marka Kampanyası" hem de fiyat formatı varsa, devam et (fiyatı çek)
      }
      
      // Kupon içeren metinleri atla (eğer ignoreCoupon true ise)
      if (ignoreCoupon && (lowerText.includes('kupon') || lowerText.includes('coupon'))) {
        return null;
      }
      
      // "Sepette" kelimesi varsa özel kontrol yap
      if (lowerText.includes('sepette')) {
        // "Sepette" kelimesinden sonra gelen fiyatı bul
        // Pattern: "Sepette" + boşluk + sayı + (opsiyonel nokta/virgül) + sayı + "TL" veya "₺"
        // Örnek: "Sepette 110 TL" veya "Sepette 99,90 TL" veya "Sepette 13.571,55 TL"
        const sepettePriceMatch = text.match(/sepette\s+([\d.,]+)\s*(tl|₺)/i);
        
        if (sepettePriceMatch) {
          // Türkçe format: nokta binlik ayırıcı, virgül ondalık ayırıcı
          let priceStr = sepettePriceMatch[1].trim();
          
          // Önce tüm binlik ayırıcıları (nokta) kaldır
          priceStr = priceStr.replace(/\./g, '');
          // Sonra ondalık ayırıcıyı (virgül) noktaya çevir
          // Eğer birden fazla virgül varsa, sadece son virgülü ondalık ayırıcı olarak kabul et
          const lastCommaIndex = priceStr.lastIndexOf(',');
          if (lastCommaIndex !== -1) {
            priceStr = priceStr.substring(0, lastCommaIndex) + '.' + priceStr.substring(lastCommaIndex + 1);
          }
          
          const priceValue = parseFloat(priceStr);
          
          // Geçerli fiyat aralığı kontrolü
          if (!isNaN(priceValue) && priceValue >= 1 && priceValue <= 1000000) {
            // Fiyattan sonra gelen metni kontrol et
            // Eğer fiyattan sonra harf varsa (string), bu fiyatı alma
            const matchEndIndex = sepettePriceMatch.index! + sepettePriceMatch[0].length;
            const afterPrice = text.substring(matchEndIndex);
            
            // Fiyattan sonra gelen karakterleri kontrol et
            // Eğer harf varsa (a-z, A-Z, Türkçe karakterler), bu fiyatı alma
            // Sadece boşluk, noktalama, satır sonu varsa geçerli
            if (afterPrice && /[a-zA-ZçğıöşüÇĞIİÖŞÜ]/.test(afterPrice)) {
              // Fiyattan sonra harf var, bu fiyatı alma
              // Örnek: "100TL'ye" → "'ye" içinde 'y' harfi var → ALMA
              return null;
            }
            
            // Eğer fiyattan sonra hiçbir şey yoksa veya sadece boşluk/noktalama/satır sonu varsa, geçerli
            // Örnek: "199TL" veya "199TL " veya "199TL\n" → AL
            return priceValue;
          }
        }
      }
      
      // "10 TL indirim" veya "indirim 10 TL" gibi metinleri atla (bunlar indirim miktarı, fiyat değil)
      // Ama "90 TL" gibi sadece fiyat olan metinleri al
      if (lowerText.includes('indirim')) {
        // Eğer metinde "indirim" kelimesi varsa ve sayı + TL formatı varsa
        // Bu muhtemelen "10 TL indirim" gibi bir metin, fiyat değil
        // Ama "90 TL" gibi sadece fiyat varsa al (indirim kelimesi yanında değilse)
        const hasPriceFormat = /\d+[.,]?\d*\s*(tl|₺)/i.test(text);
        const hasDiscountText = /indirim/i.test(text);
        
        // Eğer hem fiyat formatı hem de indirim kelimesi varsa, muhtemelen indirim miktarı
        // Ama eğer sadece fiyat formatı varsa (indirim kelimesi yoksa), fiyat olabilir
        if (hasDiscountText && hasPriceFormat) {
          // "Sepette 10 TL indirim" gibi metinler - atla
          return null;
        }
      }
      
      // "kupon", "coupon" gibi kelimeleri içeren metinleri atla (eğer ignoreCoupon true ise)
      if (ignoreCoupon && (lowerText.includes('kupon') || lowerText.includes('coupon'))) {
        return null;
      }
      
      // "son x günün en düşük fiyatı" gibi ifadeleri atla (bunlar gün sayısı, fiyat değil)
      if ((lowerText.includes('günün') || lowerText.includes('gün')) && lowerText.includes('düşük')) {
        return null;
      }
      
      // "son x gün" gibi ifadeleri de atla
      if (/son\s+\d+\s+gün/i.test(text)) {
        return null;
      }
      
      // Genel fiyat çıkarma: Mutlaka sayı + TL veya ₺ formatı olmalı
      // Pattern: Türkçe format - nokta binlik ayırıcı, virgül ondalık ayırıcı
      // Örnek: "110 TL", "99,90 TL", "100₺", "1.234,56 TL", "13.571,55 TL"
      // Daha geniş pattern: Tüm sayısal karakterleri (nokta, virgül dahil) yakala
      const priceMatch = text.match(/([\d.,]+)\s*(tl|₺)/i);
      
      if (priceMatch) {
        // Türkçe format: nokta binlik ayırıcı, virgül ondalık ayırıcı
        let priceStr = priceMatch[1].trim();
        
        // Önce tüm binlik ayırıcıları (nokta) kaldır
        priceStr = priceStr.replace(/\./g, '');
        // Sonra ondalık ayırıcıyı (virgül) noktaya çevir
        // Eğer birden fazla virgül varsa, sadece son virgülü ondalık ayırıcı olarak kabul et
        const lastCommaIndex = priceStr.lastIndexOf(',');
        if (lastCommaIndex !== -1) {
          priceStr = priceStr.substring(0, lastCommaIndex) + '.' + priceStr.substring(lastCommaIndex + 1);
        }
        
        const priceValue = parseFloat(priceStr);
        
        // Geçerli fiyat aralığı kontrolü (1 TL - 1.000.000 TL)
        if (!isNaN(priceValue) && priceValue >= 1 && priceValue <= 1000000) {
          // Fiyattan sonra gelen metni kontrol et
          // Eğer fiyattan sonra harf varsa (string), bu fiyatı alma
          const matchEndIndex = priceMatch.index! + priceMatch[0].length;
          const afterPrice = text.substring(matchEndIndex);
          
          // Fiyattan sonra gelen karakterleri kontrol et
          // Eğer harf varsa (a-z, A-Z, Türkçe karakterler), bu fiyatı alma
          // Sadece boşluk, noktalama, satır sonu varsa geçerli
          if (afterPrice && /[a-zA-ZçğıöşüÇĞIİÖŞÜ]/.test(afterPrice)) {
            // Fiyattan sonra harf var, bu fiyatı alma
            // Örnek: "100TL'ye" → "'ye" içinde 'y' harfi var → ALMA
            return null;
          }
          
          // Eğer fiyattan sonra hiçbir şey yoksa veya sadece boşluk/noktalama/satır sonu varsa, geçerli
          // Örnek: "199TL" veya "199TL " veya "199TL\n" → AL
          return priceValue;
        }
      }
      
      // Eğer sayı + TL formatı yoksa, fiyat olarak kabul etme
      return null;
    };
    
    // Senaryo 1: Herhangi bir indirim yoksa - Başlığın altından direkt fiyat çek
    if (scenario === 'no_discount') {
      console.log('📋 Senaryo 1: Herhangi bir indirim yok - Başlığın altından fiyat çekiliyor...');
      
      // Başlık elementini bul
      const titleElement = doc.querySelector('h1.pr-new-br') || 
                          doc.querySelector('h1[data-test-id="product-name"]') ||
                          doc.querySelector('.pr-new-br h1') ||
                          doc.querySelector('h1.product-name') ||
                          doc.querySelector('.product-name-container h1') ||
                          doc.querySelector('.pr-in-cn h1');
      
      if (titleElement) {
        console.log('✅ Başlık elementi bulundu, altındaki elementler taranıyor...');
        
        // Senaryo 1 için özel fiyat selector'ları (başlığın altındaki direkt fiyat elementleri)
        const scenario1PriceSelectors = [
          '.pr-bx-w .prc-box-orgnl',        // Orijinal fiyat (indirim yoksa bu görünür)
          '.pr-bx-w .prc-box',              // Genel fiyat kutusu
          '[data-test-id="price-current-price"]', // Mevcut fiyat
          '.pr-new-br .prc-box-orgnl',      // Yeni format orijinal fiyat
          '.price-container .price',        // Genel fiyat container
          '.product-price-container .price' // Ürün fiyat container
        ];
        
        // Önce spesifik selector'lardan dene
        for (const selector of scenario1PriceSelectors) {
          try {
            const elements = doc.querySelectorAll(selector);
            for (const el of elements) {
              const text = el.textContent?.trim() || '';
              const lowerText = text.toLowerCase();
              
              // Kupon içeren elementleri atla
              if (lowerText.includes('kupon') || lowerText.includes('coupon')) {
                continue;
              }
              
              const priceValue = extractPrice(text, true); // Kupon bilgisini görmezden gel
              if (priceValue !== null) {
                price = priceValue.toString();
                console.log(`✅ Senaryo 1 - Fiyat bulundu (${selector}): ${price} TL - Metin: "${text.substring(0, 50)}"`);
                break;
              }
            }
            if (price) break;
          } catch (e) {
            continue;
          }
        }
        
        // Eğer spesifik selector'lardan bulunamadıysa, başlıktan sonraki tüm elementleri tara
        if (!price) {
          // Başlığın parent container'ını bul
          let container: Element | null = titleElement.parentElement;
          const maxDepth = 5;
          let depth = 0;
          
          while (container && depth < maxDepth) {
            // Container içindeki tüm elementleri kontrol et
            const allElements = container.querySelectorAll('*');
            const foundPrices: number[] = [];
            
            for (const el of allElements) {
              // Başlık elementinin kendisini atla
              if (el === titleElement || el.contains(titleElement)) {
                continue;
              }
              
              const text = el.textContent?.trim() || '';
              if (!text) continue;
              
              const lowerText = text.toLowerCase();
              
              // Kupon içeren elementleri atla
              if (lowerText.includes('kupon') || lowerText.includes('coupon')) {
                continue;
              }
              
              const priceValue = extractPrice(text, true);
              if (priceValue !== null) {
                foundPrices.push(priceValue);
                console.log(`  💰 Senaryo 1 - Fiyat adayı: ${priceValue} TL - Metin: "${text.substring(0, 50)}"`);
              }
            }
            
            if (foundPrices.length > 0) {
              // En büyük fiyatı al (ana fiyat genelde en büyüktür)
              const maxPrice = Math.max(...foundPrices);
              price = maxPrice.toString();
              console.log(`✅ Senaryo 1 - Fiyat başarıyla çekildi: ${price} TL`);
              break;
            }
            
            container = container.parentElement;
            depth++;
          }
        }
        
        // Eğer hala bulunamadıysa, başlıktan sonraki sibling elementleri kontrol et
        if (!price) {
          let nextSibling: Element | null = titleElement.nextElementSibling;
          let siblingDepth = 0;
          
          while (nextSibling && siblingDepth < 10) {
            const text = nextSibling.textContent?.trim() || '';
            const lowerText = text.toLowerCase();
            
            // Kupon içeren elementleri atla
            if (!lowerText.includes('kupon') && !lowerText.includes('coupon')) {
              const priceValue = extractPrice(text, true);
              if (priceValue !== null) {
                price = priceValue.toString();
                console.log(`✅ Senaryo 1 - Fiyat sibling elementten çekildi: ${price} TL`);
                break;
              }
            }
            
            nextSibling = nextSibling.nextElementSibling;
            siblingDepth++;
          }
        }
      } else {
        console.warn('⚠️ Senaryo 1: Başlık elementi bulunamadı, genel arama yapılıyor...');
      }
    }
    
    // Senaryo 2: Sepette indirim varsa - "Sepette" kelimesinden hemen sonra gelen fiyatı çek
    if (scenario === 'basket_discount' && !price) {
      console.log('📋 Senaryo 2: Sepette indirim var - "Sepette" kelimesinden sonraki fiyat çekiliyor...');
      
      // "Sepette" kelimesini içeren tüm elementleri bul
      const allElements = doc.querySelectorAll('*');
      const foundSepettePrices: number[] = [];
      
      for (const el of allElements) {
        const text = el.textContent?.trim() || '';
        if (!text) continue;
        
        const lowerText = text.toLowerCase();
        
        // "Sepette" kelimesini içeren elementleri bul
        // "Marka Kampanyası" ifadesi olsa bile, "Sepette" + fiyat formatını çek
        if (lowerText.includes('sepette')) {
          // "Sepette" kelimesinden hemen sonra gelen fiyatı çek
          // Pattern: "Sepette" + boşluk + sayı + (opsiyonel nokta/virgül) + sayı + "TL" veya "₺"
          // Örnek: "Sepette 101.599 TL" veya "Sepette 99,90 TL" veya "Sepette 1.234,56 TL" veya "Sepette 49.999 TL"
          // "Marka Kampanyası" ifadesi varsa bile, "Sepette" + fiyat formatını çek
          const sepettePriceMatch = text.match(/sepette\s+([\d.,]+)\s*(tl|₺)/i);
          
          if (sepettePriceMatch) {
            // Türkçe format: nokta binlik ayırıcı, virgül ondalık ayırıcı
            // "101.599" -> 101599, "99,90" -> 99.90, "1.234,56" -> 1234.56, "13.571,55" -> 13571.55
            let priceStr = sepettePriceMatch[1].trim();
            
            // Önce tüm binlik ayırıcıları (nokta) kaldır
            priceStr = priceStr.replace(/\./g, '');
            // Sonra ondalık ayırıcıyı (virgül) noktaya çevir
            // Eğer birden fazla virgül varsa, sadece son virgülü ondalık ayırıcı olarak kabul et
            const lastCommaIndex = priceStr.lastIndexOf(',');
            if (lastCommaIndex !== -1) {
              priceStr = priceStr.substring(0, lastCommaIndex) + '.' + priceStr.substring(lastCommaIndex + 1);
            }
            
            const priceValue = parseFloat(priceStr);
            
            // Geçerli fiyat aralığı kontrolü (1 TL - 1.000.000 TL)
            if (!isNaN(priceValue) && priceValue >= 1 && priceValue <= 1000000) {
              // Fiyattan sonra gelen metni kontrol et
              const matchEndIndex = sepettePriceMatch.index! + sepettePriceMatch[0].length;
              const afterPrice = text.substring(matchEndIndex);
              
              // Fiyattan sonra harf varsa atla
              if (afterPrice && /[a-zA-ZçğıöşüÇĞIİÖŞÜ]/.test(afterPrice)) {
                continue;
              }
              
              foundSepettePrices.push(priceValue);
              console.log(`  💰 Senaryo 2 - Sepette fiyat bulundu: ${priceValue} TL - Metin: "${text.substring(0, 80)}"`);
            }
          }
        }
      }
      
      // En düşük fiyatı al (sepette fiyat genelde en düşük olur)
      if (foundSepettePrices.length > 0) {
        const minPrice = Math.min(...foundSepettePrices);
        price = minPrice.toString();
        console.log(`✅ Senaryo 2 - Sepette fiyat başarıyla çekildi: ${price} TL`);
      } else {
        console.warn('⚠️ Senaryo 2: "Sepette" kelimesinden sonra fiyat bulunamadı');
      }
    }
    
    // Senaryo 3: Sepette yüzdelik indirim varsa - İlk "Sepette %" ifadesini atla, ikinci "Sepette" ifadesinden sonraki fiyatı al
    if (scenario === 'basket_percentage_discount' && !price) {
      console.log('📋 Senaryo 3: Sepette yüzdelik indirim var - İkinci "Sepette" ifadesinden sonraki fiyat çekiliyor...');
      
      // "Sepette" kelimesini içeren tüm elementleri bul ve sırayla kontrol et
      const allElements = doc.querySelectorAll('*');
      const sepetteElements: { element: Element; text: string; index: number }[] = [];
      
      // Önce tüm "Sepette" içeren elementleri topla
      for (const el of allElements) {
        const text = el.textContent?.trim() || '';
        if (!text) continue;
        
        const lowerText = text.toLowerCase();
        if (lowerText.includes('sepette')) {
          sepetteElements.push({ element: el, text: text, index: sepetteElements.length });
        }
      }
      
      console.log(`  🔍 ${sepetteElements.length} adet "Sepette" içeren element bulundu`);
      
      // İlk "Sepette %" ifadesini bul ve atla, sonraki "Sepette" ifadesinden fiyatı çek
      let foundFirstPercentage = false;
      const foundSepettePrices: number[] = [];
      
      for (let i = 0; i < sepetteElements.length; i++) {
        const { text } = sepetteElements[i];
        
        // İlk yüzdelik "Sepette" ifadesini bul ve atla
        // Pattern: "Sepette %" + sayı
        const percentageMatch = text.match(/sepette\s+%\s*\d+/i);
        if (percentageMatch && !foundFirstPercentage) {
          foundFirstPercentage = true;
          console.log(`  ⏭️ İlk yüzdelik "Sepette" ifadesi atlandı: "${text.substring(0, 50)}"`);
          continue; // Bu ifadeyi atla
        }
        
        // Yüzdelik ifadeyi atladıktan sonra, bir sonraki "Sepette" ifadesinden fiyatı çek
        if (foundFirstPercentage) {
          // "Sepette" kelimesinden hemen sonra gelen fiyatı çek
          // Örnek: "Sepette 92.835,40 TL" veya "Sepette 110 TL" veya "Sepette 1.234,56 TL"
          // Daha güvenli yaklaşım: "Sepette" kelimesinden sonra, TL/₺ işaretine kadar olan tüm sayısal karakterleri yakala
          
          // Önce spesifik pattern dene: "Sepette" + boşluk + sayılar (nokta/virgül dahil) + boşluk + TL/₺
          let sepettePriceMatch = text.match(/sepette\s+([\d]{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\s*(tl|₺)/i);
          
          // Eğer spesifik pattern eşleşmezse, daha genel pattern dene
          if (!sepettePriceMatch) {
            // "Sepette" kelimesinden sonra, TL/₺ işaretine kadar olan tüm karakterleri yakala
            sepettePriceMatch = text.match(/sepette\s+([^\s]+?)\s*(tl|₺)/i);
          }
          
          // Son çare: Daha geniş pattern
          if (!sepettePriceMatch) {
            sepettePriceMatch = text.match(/sepette\s+([\d.,]+)\s*(tl|₺)/i);
          }
          
          if (sepettePriceMatch) {
            // Türkçe format: nokta binlik ayırıcı, virgül ondalık ayırıcı
            let priceStr = sepettePriceMatch[1].trim();
            
            // Debug: Orijinal string'i logla
            console.log(`  🔍 Senaryo 3 - Parse edilecek fiyat string: "${priceStr}" (tam metin: "${text.substring(0, 100)}")`);
            
            // Önce binlik ayırıcıları (nokta) kaldır - TÜM noktaları kaldır
            priceStr = priceStr.replace(/\./g, '');
            // Sonra ondalık ayırıcıyı (virgül) noktaya çevir - Sadece son virgülü noktaya çevir
            // Eğer birden fazla virgül varsa, sadece son virgülü ondalık ayırıcı olarak kabul et
            const lastCommaIndex = priceStr.lastIndexOf(',');
            if (lastCommaIndex !== -1) {
              priceStr = priceStr.substring(0, lastCommaIndex) + '.' + priceStr.substring(lastCommaIndex + 1);
            }
            
            const priceValue = parseFloat(priceStr);
            
            // Debug: Parse edilen değeri logla
            console.log(`  🔍 Senaryo 3 - Parse edilen fiyat değeri: ${priceValue} TL (orijinal: "${sepettePriceMatch[1]}")`);
            
            // Geçerli fiyat aralığı kontrolü (1 TL - 1.000.000 TL)
            if (!isNaN(priceValue) && priceValue >= 1 && priceValue <= 1000000) {
              // Fiyattan sonra gelen metni kontrol et
              const matchEndIndex = sepettePriceMatch.index! + sepettePriceMatch[0].length;
              const afterPrice = text.substring(matchEndIndex);
              
              // Fiyattan sonra harf varsa atla
              if (afterPrice && /[a-zA-ZçğıöşüÇĞIİÖŞÜ]/.test(afterPrice)) {
                continue;
              }
              
              foundSepettePrices.push(priceValue);
              console.log(`  💰 Senaryo 3 - Sepette fiyat bulundu: ${priceValue} TL - Metin: "${text.substring(0, 80)}"`);
              
              // İlk geçerli fiyatı bulduktan sonra dur (ikinci "Sepette" ifadesinden sonraki ilk fiyat)
              break;
            }
          }
        }
      }
      
      // En düşük fiyatı al (eğer birden fazla bulunduysa)
      if (foundSepettePrices.length > 0) {
        const minPrice = Math.min(...foundSepettePrices);
        price = minPrice.toString();
        console.log(`✅ Senaryo 3 - Sepette fiyat başarıyla çekildi: ${price} TL`);
      } else {
        console.warn('⚠️ Senaryo 3: Yüzdelik indirimden sonraki "Sepette" ifadesinden fiyat bulunamadı');
      }
    }
    
    // Senaryo 4: Son x günün en düşük fiyatı - Üstü çizili fiyattan sonra gelen üstü çizili olmayan fiyatı çek
    if (scenario === 'lowest_price' && !price) {
      console.log('📋 Senaryo 4: Son x günün en düşük fiyatı - Üstü çizili fiyattan sonraki fiyat çekiliyor...');
      
      // Önce spesifik fiyat selector'larını dene
      const scenario4Selectors = [
        '.pr-bx-w .prc-box-dscntd',      // İndirimli fiyat
        '.pr-bx-w .prc-box-orgnl',       // Orijinal fiyat
        '.pr-bx-w .prc-box',             // Genel fiyat kutusu
        '[data-test-id="price-current-price"]', // Mevcut fiyat
        '.pr-new-br .prc-box-dscntd',    // Yeni format indirimli
        '.price-container .price',       // Genel fiyat container
        '.product-price-container .price' // Ürün fiyat container
      ];
      
      const foundPrices: { price: number; isStrikethrough: boolean }[] = [];
      
      for (const selector of scenario4Selectors) {
        try {
          const elements = doc.querySelectorAll(selector);
          for (const el of elements) {
            const text = el.textContent?.trim() || '';
            if (!text) continue;
            
            // Fiyat formatını kontrol et
            const priceMatch = text.match(/([\d.,]+)\s*(tl|₺)/i);
            if (priceMatch) {
              // Türkçe format: nokta binlik ayırıcı, virgül ondalık ayırıcı
              let priceStr = priceMatch[1].trim();
              
              // Önce tüm binlik ayırıcıları (nokta) kaldır
              priceStr = priceStr.replace(/\./g, '');
              // Sonra ondalık ayırıcıyı (virgül) noktaya çevir
              const lastCommaIndex = priceStr.lastIndexOf(',');
              if (lastCommaIndex !== -1) {
                priceStr = priceStr.substring(0, lastCommaIndex) + '.' + priceStr.substring(lastCommaIndex + 1);
              }
              
              const priceValue = parseFloat(priceStr);
              
              // Geçerli fiyat aralığı kontrolü
              if (!isNaN(priceValue) && priceValue >= 1 && priceValue <= 1000000) {
                // Elementin üstü çizili olup olmadığını kontrol et
                let isStrikethrough = false;
                
                // HTML tag kontrolü
                if (el.tagName === 'S' || el.tagName === 'STRIKE' || el.tagName === 'DEL') {
                  isStrikethrough = true;
                }
                // CSS class kontrolü
                else if (el.classList.toString().toLowerCase().includes('strikethrough') ||
                        el.classList.toString().toLowerCase().includes('line-through')) {
                  isStrikethrough = true;
                }
                // CSS style kontrolü
                else {
                  try {
                    const computedStyle = window.getComputedStyle(el);
                    const textDecoration = computedStyle.textDecoration || computedStyle.textDecorationLine || '';
                    if (textDecoration.includes('line-through')) {
                      isStrikethrough = true;
                    }
                  } catch (e) {
                    // getComputedStyle çalışmazsa devam et
                  }
                }
                
                // HTML içeriğinde <s>, <strike>, <del> tag'leri var mı kontrol et
                if (!isStrikethrough) {
                  const innerHTML = el.innerHTML || '';
                  if (/<s[^>]*>|<strike[^>]*>|<del[^>]*>/i.test(innerHTML)) {
                    isStrikethrough = true;
                  }
                }
                
                foundPrices.push({ price: priceValue, isStrikethrough });
                console.log(`  💰 Senaryo 4 - Fiyat bulundu (${selector}): ${priceValue} TL (üstü çizili: ${isStrikethrough})`);
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      // Eğer spesifik selector'lardan fiyat bulunamadıysa, geniş arama yap
      if (foundPrices.length === 0) {
        console.log('  🔍 Spesifik selector\'lardan fiyat bulunamadı, geniş arama yapılıyor...');
        
        // "Son x günün en düşük fiyatı" ifadesini içeren elementi bul
        const allElements = doc.querySelectorAll('*');
        let lowestPriceElement: Element | null = null;
        
        for (const el of allElements) {
          const text = el.textContent?.trim() || '';
          
          // "Son x günün en düşük fiyatı" pattern'ini kontrol et
          if (/son\s+\d+\s+günün\s+en\s+düşük\s+fiyatı/i.test(text)) {
            lowestPriceElement = el;
            console.log(`  ✅ "Son x günün en düşük fiyatı" ifadesi bulundu: "${text.substring(0, 50)}"`);
            break;
          }
        }
        
        if (lowestPriceElement) {
          // Önce parent container içinde ara
          let container: Element | null = lowestPriceElement.parentElement;
          const maxDepth = 10;
          let depth = 0;
          
          while (container && depth < maxDepth) {
            // Container içindeki tüm elementleri kontrol et
            const allContainerElements = Array.from(container.querySelectorAll('*'));
            
            for (let idx = 0; idx < allContainerElements.length; idx++) {
              const el = allContainerElements[idx];
              
              // "Son x günün en düşük fiyatı" elementinin kendisini atla
              if (el === lowestPriceElement || el.contains(lowestPriceElement)) {
                continue;
              }
              
              const text = el.textContent?.trim() || '';
              if (!text) continue;
              
              // Fiyat formatını kontrol et
              const priceMatch = text.match(/([\d.,]+)\s*(tl|₺)/i);
              if (priceMatch) {
                // Türkçe format: nokta binlik ayırıcı, virgül ondalık ayırıcı
                let priceStr = priceMatch[1].trim();
                
                // Önce tüm binlik ayırıcıları (nokta) kaldır
                priceStr = priceStr.replace(/\./g, '');
                // Sonra ondalık ayırıcıyı (virgül) noktaya çevir
                const lastCommaIndex = priceStr.lastIndexOf(',');
                if (lastCommaIndex !== -1) {
                  priceStr = priceStr.substring(0, lastCommaIndex) + '.' + priceStr.substring(lastCommaIndex + 1);
                }
                
                const priceValue = parseFloat(priceStr);
                
                // Geçerli fiyat aralığı kontrolü
                if (!isNaN(priceValue) && priceValue >= 1 && priceValue <= 1000000) {
                  // Elementin üstü çizili olup olmadığını kontrol et
                  let isStrikethrough = false;
                  
                  // HTML tag kontrolü
                  if (el.tagName === 'S' || el.tagName === 'STRIKE' || el.tagName === 'DEL') {
                    isStrikethrough = true;
                  }
                  // CSS class kontrolü
                  else if (el.classList.toString().toLowerCase().includes('strikethrough') ||
                          el.classList.toString().toLowerCase().includes('line-through')) {
                    isStrikethrough = true;
                  }
                  // CSS style kontrolü
                  else {
                    try {
                      const computedStyle = window.getComputedStyle(el);
                      const textDecoration = computedStyle.textDecoration || computedStyle.textDecorationLine || '';
                      if (textDecoration.includes('line-through')) {
                        isStrikethrough = true;
                      }
                    } catch (e) {
                      // getComputedStyle çalışmazsa devam et
                    }
                  }
                  
                  // HTML içeriğinde <s>, <strike>, <del> tag'leri var mı kontrol et
                  if (!isStrikethrough) {
                    const innerHTML = el.innerHTML || '';
                    if (/<s[^>]*>|<strike[^>]*>|<del[^>]*>/i.test(innerHTML)) {
                      isStrikethrough = true;
                    }
                  }
                  
                  foundPrices.push({ price: priceValue, isStrikethrough });
                  console.log(`  💰 Senaryo 4 - Fiyat bulundu: ${priceValue} TL (üstü çizili: ${isStrikethrough}) - Metin: "${text.substring(0, 50)}"`);
                }
              }
            }
            
            if (foundPrices.length > 0) break;
            
            container = container.parentElement;
            depth++;
          }
          
          // Eğer container içinde bulunamadıysa, tüm sayfada ara
          if (foundPrices.length === 0) {
            console.log('  🔍 Container içinde fiyat bulunamadı, tüm sayfada arama yapılıyor...');
            
            // Tüm sayfadaki fiyatları bul
            const allPageElements = doc.querySelectorAll('*');
            for (const el of allPageElements) {
              // "Son x günün en düşük fiyatı" elementinin kendisini atla
              if (el === lowestPriceElement || el.contains(lowestPriceElement)) {
                continue;
              }
              
              const text = el.textContent?.trim() || '';
              if (!text) continue;
              
              // Fiyat formatını kontrol et - sadece tam fiyat formatı (sayı + TL)
              const priceMatch = text.match(/^([\d.,]+)\s*(tl|₺)$/i);
              if (!priceMatch) {
                // Eğer tam format eşleşmezse, içinde fiyat formatı var mı kontrol et
                const priceMatchInText = text.match(/([\d.,]+)\s*(tl|₺)/i);
                if (!priceMatchInText) continue;
                
                // Eğer metin çok uzunsa veya başka kelimeler içeriyorsa, atla
                if (text.length > 50 || /[a-zA-ZçğıöşüÇĞIİÖŞÜ]{3,}/.test(text.replace(/[\d.,\sTL₺]/gi, ''))) {
                  continue;
                }
              }
              
              const finalMatch = priceMatch || text.match(/([\d.,]+)\s*(tl|₺)/i);
              if (finalMatch) {
                // Türkçe format: nokta binlik ayırıcı, virgül ondalık ayırıcı
                let priceStr = finalMatch[1].trim();
                
                // Önce tüm binlik ayırıcıları (nokta) kaldır
                priceStr = priceStr.replace(/\./g, '');
                // Sonra ondalık ayırıcıyı (virgül) noktaya çevir
                const lastCommaIndex = priceStr.lastIndexOf(',');
                if (lastCommaIndex !== -1) {
                  priceStr = priceStr.substring(0, lastCommaIndex) + '.' + priceStr.substring(lastCommaIndex + 1);
                }
                
                const priceValue = parseFloat(priceStr);
                
                // Geçerli fiyat aralığı kontrolü (1 TL - 1.000.000 TL)
                if (!isNaN(priceValue) && priceValue >= 1 && priceValue <= 1000000) {
                  // Elementin üstü çizili olup olmadığını kontrol et
                  let isStrikethrough = false;
                  
                  // HTML tag kontrolü
                  if (el.tagName === 'S' || el.tagName === 'STRIKE' || el.tagName === 'DEL') {
                    isStrikethrough = true;
                  }
                  // CSS class kontrolü
                  else if (el.classList.toString().toLowerCase().includes('strikethrough') ||
                          el.classList.toString().toLowerCase().includes('line-through')) {
                    isStrikethrough = true;
                  }
                  // CSS style kontrolü
                  else {
                    try {
                      const computedStyle = window.getComputedStyle(el);
                      const textDecoration = computedStyle.textDecoration || computedStyle.textDecorationLine || '';
                      if (textDecoration.includes('line-through')) {
                        isStrikethrough = true;
                      }
                    } catch (e) {
                      // getComputedStyle çalışmazsa devam et
                    }
                  }
                  
                  // HTML içeriğinde <s>, <strike>, <del> tag'leri var mı kontrol et
                  if (!isStrikethrough) {
                    const innerHTML = el.innerHTML || '';
                    if (/<s[^>]*>|<strike[^>]*>|<del[^>]*>/i.test(innerHTML)) {
                      isStrikethrough = true;
                    }
                  }
                  
                  foundPrices.push({ price: priceValue, isStrikethrough });
                  console.log(`  💰 Senaryo 4 - Fiyat bulundu (tüm sayfa): ${priceValue} TL (üstü çizili: ${isStrikethrough}) - Metin: "${text.substring(0, 50)}"`);
                }
              }
            }
          }
        }
      }
      
      // Üstü çizili olmayan en düşük fiyatı seç
      if (foundPrices.length > 0) {
        const nonStrikethroughPrices = foundPrices.filter(p => !p.isStrikethrough);
        if (nonStrikethroughPrices.length > 0) {
          const minPrice = Math.min(...nonStrikethroughPrices.map(p => p.price));
          price = minPrice.toString();
          console.log(`✅ Senaryo 4 - Üstü çizili olmayan en düşük fiyat çekildi: ${price} TL`);
        } else {
          // Eğer tüm fiyatlar üstü çiziliyse, en düşük fiyatı al
          const minPrice = Math.min(...foundPrices.map(p => p.price));
          price = minPrice.toString();
          console.log(`✅ Senaryo 4 - Tüm fiyatlar üstü çizili, en düşük fiyat çekildi: ${price} TL`);
        }
      } else {
        console.warn('⚠️ Senaryo 4: Hiç fiyat bulunamadı');
      }
    }
    
    // Eğer Senaryo 1, 2, 3 veya 4'te fiyat bulunamadıysa veya başka bir senaryo varsa, genel arama yap
    if (!price) {
      console.log('🔍 Genel fiyat araması yapılıyor...');
    
    // Öncelikli fiyat selector'ları (indirimli, sepette, plus fiyatları önce)
    const prioritySelectors = [
      '.pr-bx-w .prc-box-dscntd',      // İndirimli fiyat
      '.pr-bx-w .prc-dsc',              // İndirimli fiyat (alternatif)
      '.pr-bx-w .prc-box-sllw',         // Sepette fiyat
      '[data-test-id="price-current-price"]', // Mevcut fiyat
      '.pr-new-br .prc-box-dscntd',     // Yeni format indirimli
      '.price-container .price',        // Genel fiyat container
      '.product-price-container .price' // Ürün fiyat container
    ];
    
    // Tüm fiyat selector'ları
    const allPriceSelectors = [
      ...prioritySelectors,
      '.pr-bx-w .prc-box-orgnl',       // Orijinal fiyat (son çare)
      '[class*="price"]',
      '[data-test-id*="price"]'
    ];
    
    const foundPrices: number[] = [];
      const foundPricesWithStrikethrough: { price: number; isStrikethrough: boolean }[] = [];
    const priceElements = new Set<Element>();
    
    // Script tag'den bulunan fiyatı da ekle
    if (scriptPrice !== null) {
      foundPrices.push(scriptPrice);
        foundPricesWithStrikethrough.push({ price: scriptPrice, isStrikethrough: false });
    }
    
    // Tüm selector'lardan fiyat elementlerini topla
    for (const selector of allPriceSelectors) {
      try {
        const elements = doc.querySelectorAll(selector);
        elements.forEach(el => {
          if (!priceElements.has(el)) {
            priceElements.add(el);
            const text = el.textContent?.trim() || '';
              
              // extractPrice fonksiyonu "Marka Kampanyası" kontrolünü yapıyor, burada tekrar kontrol etmeye gerek yok
              const priceValue = extractPrice(text, scenario === 'no_discount'); // Senaryo 1 ise kupon bilgisini görmezden gel
            if (priceValue !== null) {
              foundPrices.push(priceValue);
                
                // Senaryo 4 için üstü çizili kontrolü yap
                let isStrikethrough = false;
                if (scenario === 'lowest_price') {
                  // HTML tag kontrolü
                  if (el.tagName === 'S' || el.tagName === 'STRIKE' || el.tagName === 'DEL') {
                    isStrikethrough = true;
                  }
                  // CSS class kontrolü
                  else if (el.classList.toString().toLowerCase().includes('strikethrough') ||
                          el.classList.toString().toLowerCase().includes('line-through')) {
                    isStrikethrough = true;
                  }
                  // CSS style kontrolü
                  else {
                    try {
                      const computedStyle = window.getComputedStyle(el);
                      const textDecoration = computedStyle.textDecoration || computedStyle.textDecorationLine || '';
                      if (textDecoration.includes('line-through')) {
                        isStrikethrough = true;
                      }
                    } catch (e) {
                      // getComputedStyle çalışmazsa devam et
                    }
                  }
                }
                
                foundPricesWithStrikethrough.push({ price: priceValue, isStrikethrough });
                console.log(`  💰 Fiyat bulundu (${selector}): ${priceValue} TL (üstü çizili: ${isStrikethrough}) - Metin: "${text.substring(0, 50)}"`);
            }
          }
        });
      } catch (e) {
        // Selector hatası, devam et
        continue;
      }
    }
    
      // Senaryo 4 için: Eğer selector'lardan fiyat bulunamadıysa, tüm sayfada agresif arama yap
      if (scenario === 'lowest_price' && foundPricesWithStrikethrough.length === 0) {
        console.log('  🔍 Senaryo 4 - Selector\'lardan fiyat bulunamadı, tüm sayfada agresif arama yapılıyor...');
        
        // Tüm sayfadaki fiyatları bul
        const allPageElements = doc.querySelectorAll('*');
        for (const el of allPageElements) {
          const text = el.textContent?.trim() || '';
          if (!text) continue;
          
          // Fiyat formatını kontrol et
          const priceMatch = text.match(/([\d.,]+)\s*(tl|₺)/i);
          if (priceMatch) {
            // Türkçe format: nokta binlik ayırıcı, virgül ondalık ayırıcı
            let priceStr = priceMatch[1].trim();
            
            // Önce tüm binlik ayırıcıları (nokta) kaldır
            priceStr = priceStr.replace(/\./g, '');
            // Sonra ondalık ayırıcıyı (virgül) noktaya çevir
            const lastCommaIndex = priceStr.lastIndexOf(',');
            if (lastCommaIndex !== -1) {
              priceStr = priceStr.substring(0, lastCommaIndex) + '.' + priceStr.substring(lastCommaIndex + 1);
            }
            
            const priceValue = parseFloat(priceStr);
            
            // Geçerli fiyat aralığı kontrolü (1 TL - 1.000.000 TL)
            if (!isNaN(priceValue) && priceValue >= 1 && priceValue <= 1000000) {
              // Elementin üstü çizili olup olmadığını kontrol et
              let isStrikethrough = false;
              
              // HTML tag kontrolü
              if (el.tagName === 'S' || el.tagName === 'STRIKE' || el.tagName === 'DEL') {
                isStrikethrough = true;
              }
              // CSS class kontrolü
              else if (el.classList.toString().toLowerCase().includes('strikethrough') ||
                      el.classList.toString().toLowerCase().includes('line-through')) {
                isStrikethrough = true;
              }
              // CSS style kontrolü
              else {
                try {
                  const computedStyle = window.getComputedStyle(el);
                  const textDecoration = computedStyle.textDecoration || computedStyle.textDecorationLine || '';
                  if (textDecoration.includes('line-through')) {
                    isStrikethrough = true;
                  }
                } catch (e) {
                  // getComputedStyle çalışmazsa devam et
                }
              }
              
              // HTML içeriğinde <s>, <strike>, <del> tag'leri var mı kontrol et
              if (!isStrikethrough) {
                const innerHTML = el.innerHTML || '';
                if (/<s[^>]*>|<strike[^>]*>|<del[^>]*>/i.test(innerHTML)) {
                  isStrikethrough = true;
                }
              }
              
              foundPricesWithStrikethrough.push({ price: priceValue, isStrikethrough });
              console.log(`  💰 Senaryo 4 (agresif arama) - Fiyat bulundu: ${priceValue} TL (üstü çizili: ${isStrikethrough}) - Metin: "${text.substring(0, 50)}"`);
            }
          }
        }
      }
      
      // Senaryo 4 için: Üstü çizili olmayan en düşük fiyatı seç
      if (scenario === 'lowest_price' && foundPricesWithStrikethrough.length > 0) {
        const nonStrikethroughPrices = foundPricesWithStrikethrough.filter(p => !p.isStrikethrough);
        if (nonStrikethroughPrices.length > 0) {
          const minPrice = Math.min(...nonStrikethroughPrices.map(p => p.price));
          price = minPrice.toString();
          console.log(`✅ Senaryo 4 (genel arama) - Üstü çizili olmayan en düşük fiyat seçildi: ${price} TL`);
        } else {
          // Eğer tüm fiyatlar üstü çiziliyse, en düşük fiyatı al
          const minPrice = Math.min(...foundPricesWithStrikethrough.map(p => p.price));
          price = minPrice.toString();
          console.log(`✅ Senaryo 4 (genel arama) - Tüm fiyatlar üstü çizili, en düşük fiyat seçildi: ${price} TL`);
        }
      }
      // Diğer senaryolar için: En düşük fiyatı seç (indirimli/sepette fiyat genelde en düşük olur)
      else if (foundPrices.length > 0) {
      const minPrice = Math.min(...foundPrices);
      price = minPrice.toString();
      console.log(`✅ En düşük fiyat seçildi: ${price} TL (${foundPrices.length} farklı fiyat bulundu: ${foundPrices.join(', ')} TL)`);
    } else {
      console.warn('⚠️ Hiç geçerli fiyat bulunamadı');
      }
    }

    // Fotoğraflar - ÖNCE HTML'in tamamından direkt regex ile bul (en güvenilir yöntem)
    console.log('🔍 HTML\'in tamamından fotoğraflar aranıyor (regex ile)...');
    
    // HTML'de Trendyol CDN referanslarını bul (yeni ve eski CDN'ler)
    const trendyolCdnMatches = html.match(/cdn\.trendyol\.com|ty-cdn\.com|cdn\.dsmcdn\.com|dsmcdn\.com/gi);
    console.log(`📸 HTML'de Trendyol CDN referansı: ${trendyolCdnMatches ? trendyolCdnMatches.length : 0} kez geçiyor`);
    
    // HTML'in tamamından Trendyol CDN URL'lerini bul - YENİ CDN'leri de dahil et
    const urlPatterns = [
      // YENİ: dsmcdn.com (Trendyol'un yeni CDN'i)
      /https?:\/\/[^\s"',\[\]<>{}()]+cdn\.dsmcdn\.com[^\s"',\[\]<>{}()]+\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG|WEBP|GIF)/gi,
      // YENİ: dsmcdn.com alternatif format
      /https?:\/\/[^\s"',\[\]<>{}()]+dsmcdn\.com[^\s"',\[\]<>{}()]+\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG|WEBP|GIF)/gi,
      // ESKİ: Standart Trendyol CDN pattern
      /https?:\/\/[^\s"',\[\]<>{}()]+cdn\.trendyol\.com[^\s"',\[\]<>{}()]+\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG|WEBP|GIF)/gi,
      // ESKİ: ty-cdn.com pattern
      /https?:\/\/[^\s"',\[\]<>{}()]+ty-cdn\.com[^\s"',\[\]<>{}()]+\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG|WEBP|GIF)/gi
    ];
    
    const foundImageUrls = new Set<string>();
    
    for (let i = 0; i < urlPatterns.length; i++) {
      const pattern = urlPatterns[i];
      const matches = html.match(pattern);
      console.log(`🔍 Pattern ${i + 1} ile ${matches ? matches.length : 0} eşleşme bulundu`);
      
      if (matches && matches.length > 0) {
        matches.forEach((url, index) => {
          try {
            const cleanUrl = url.replace(/['"]/g, '').split('?')[0].split('&')[0]; // Query string ve parametreleri kaldır
            
            // Sadece Trendyol CDN'lerinden gelenleri al (yeni ve eski)
            if (cleanUrl.includes('cdn.trendyol.com') || 
                cleanUrl.includes('ty-cdn.com') || 
                cleanUrl.includes('cdn.dsmcdn.com') ||
                cleanUrl.includes('dsmcdn.com')) {
              // Ürün fotoğrafı kontrolü yap
              if (cleanUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) && isProductImage(cleanUrl)) {
                foundImageUrls.add(cleanUrl);
                if (index < 3) { // İlk 3 URL'yi logla
                  console.log(`  ✅ Bulunan URL ${index + 1}: ${cleanUrl.substring(0, 100)}...`);
                }
              }
            }
          } catch (e) {
            // URL parse hatası, devam et
          }
        });
      }
    }
    
    if (foundImageUrls.size > 0) {
      const newImages = Array.from(foundImageUrls);
      images = [...new Set([...images, ...newImages])];
      console.log(`✅ HTML regex taramasından ${newImages.length} fotoğraf bulundu, toplam: ${images.length}`);
    } else {
      console.warn('⚠️ HTML regex taramasından hiç fotoğraf bulunamadı!');
      // HTML'den örnek bir kısım göster
      const sampleHtml = html.substring(0, 2000);
      console.log('📄 HTML örneği (ilk 2000 karakter):', sampleHtml);
    }
    
    // HTML'den link tag'lerini de çek (preload image'lar için)
    console.log('🔍 HTML\'den link tag\'leri (preload) aranıyor...');
    const preloadLinks = doc.querySelectorAll('link[rel="preload"][as="image"]');
    console.log(`📎 ${preloadLinks.length} preload link bulundu`);
    
    preloadLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && (href.includes('cdn.dsmcdn.com') || 
                   href.includes('dsmcdn.com') ||
                   href.includes('cdn.trendyol.com') ||
                   href.includes('ty-cdn.com'))) {
        const cleanUrl = href.split('?')[0].split('&')[0];
        if (cleanUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) && isProductImage(cleanUrl)) {
          images.push(cleanUrl);
          console.log(`  ✅ Preload link'ten fotoğraf bulundu: ${cleanUrl.substring(0, 100)}...`);
        }
      }
    });
    
    // HTML'den img tag'lerini de çek
    console.log('🔍 HTML\'den img tag\'leri aranıyor...');
    
    const imageSelectors = [
      'img[data-test-id="product-image"]',
      '.product-image-container img',
      '.gallery-container img',
      '.product-slider img',
      '.prdct-img img',
      'img.product-image',
      '.product-images img',
      '.product-detail-image img',
      '.pr-new-img-cn img',
      '.product-photos img',
      '.product-thumbnails img',
      '.thumbnail-list img',
      '.gallery-thumbnails img',
      'img[data-src]',
      'img[data-lazy-src]',
      'img[data-original]',
      'img[data-lazy]',
      'img' // Tüm img tag'leri (son çare)
    ];

    const foundImagesFromHTML = new Set<string>();

    // Tüm selector'ları dene
    for (const selector of imageSelectors) {
      try {
        const imgElements = doc.querySelectorAll(selector);
        if (imgElements.length > 0) {
          imgElements.forEach((img) => {
            // Önce data attribute'larından çek (lazy loading için)
            const src = img.getAttribute('data-src') || 
                       img.getAttribute('data-lazy-src') ||
                       img.getAttribute('data-original') ||
                       img.getAttribute('data-lazy') ||
                       img.getAttribute('src');
            
            if (src && src.trim()) {
              // Relative URL'leri absolute'ye çevir
              let absoluteUrl = src.trim();
              if (!absoluteUrl.startsWith('http')) {
                if (absoluteUrl.startsWith('//')) {
                  absoluteUrl = `https:${absoluteUrl}`;
                } else if (absoluteUrl.startsWith('/')) {
                  absoluteUrl = `https://cdn.trendyol.com${absoluteUrl}`;
                } else {
                  absoluteUrl = `https://cdn.trendyol.com/${absoluteUrl}`;
                }
              }
              
              // Query string'i kaldır
              absoluteUrl = absoluteUrl.split('?')[0].split('&')[0];
              
              // Sadece Trendyol CDN'lerinden gelen ve geçerli image formatlarını al (yeni ve eski)
              if ((absoluteUrl.includes('cdn.trendyol.com') || 
                   absoluteUrl.includes('ty-cdn.com') ||
                   absoluteUrl.includes('cdn.dsmcdn.com') ||
                   absoluteUrl.includes('dsmcdn.com')) &&
                  absoluteUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) &&
                  isProductImage(absoluteUrl)) {
                foundImagesFromHTML.add(absoluteUrl);
              }
            }
          });
        }
      } catch (e) {
        // Selector hatası, devam et
        continue;
      }
    }
    
    // Bulunan fotoğrafları ekle
    if (foundImagesFromHTML.size > 0) {
      const newImages = Array.from(foundImagesFromHTML);
      images = [...new Set([...images, ...newImages])];
      console.log(`✅ HTML img tag'lerinden ${newImages.length} yeni fotoğraf bulundu, toplam: ${images.length}`);
    }

    // JSON-LD'den de dene - ÖNCE JSON-LD'yi kontrol et (daha güvenilir)
    console.log('🔍 JSON-LD\'den fotoğraflar aranıyor...');
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    console.log(`📋 ${jsonLdScripts.length} JSON-LD script bulundu`);
    
    for (const script of jsonLdScripts) {
      try {
        const jsonData = JSON.parse(script.textContent || '');
        
        // image field'ını kontrol et
        if (jsonData.image) {
          if (Array.isArray(jsonData.image)) {
            jsonData.image.forEach((img: string) => {
              if (img && typeof img === 'string') {
                const cleanUrl = img.split('?')[0].split('&')[0];
                 if ((cleanUrl.includes('cdn.dsmcdn.com') ||
                      cleanUrl.includes('dsmcdn.com') ||
                      cleanUrl.includes('cdn.trendyol.com') ||
                      cleanUrl.includes('ty-cdn.com')) &&
                     isProductImage(cleanUrl) &&
                     !images.includes(cleanUrl)) {
                   images.push(cleanUrl);
                   console.log(`  ✅ JSON-LD image array'den: ${cleanUrl.substring(0, 100)}...`);
                 }
              }
            });
          } else if (typeof jsonData.image === 'string') {
            const cleanUrl = jsonData.image.split('?')[0].split('&')[0];
             if ((cleanUrl.includes('cdn.dsmcdn.com') ||
                  cleanUrl.includes('dsmcdn.com') ||
                  cleanUrl.includes('cdn.trendyol.com') ||
                  cleanUrl.includes('ty-cdn.com')) &&
                 isProductImage(cleanUrl) &&
                 !images.includes(cleanUrl)) {
               images.push(cleanUrl);
               console.log(`  ✅ JSON-LD image string'den: ${cleanUrl.substring(0, 100)}...`);
             }
          }
        }
        
        // Alternatif field'lar
        if (jsonData.images && Array.isArray(jsonData.images)) {
          jsonData.images.forEach((img: string) => {
            if (img && typeof img === 'string') {
              const cleanUrl = img.split('?')[0].split('&')[0];
             if ((cleanUrl.includes('cdn.dsmcdn.com') ||
                  cleanUrl.includes('dsmcdn.com') ||
                  cleanUrl.includes('cdn.trendyol.com') ||
                  cleanUrl.includes('ty-cdn.com')) &&
                 isProductImage(cleanUrl) &&
                 !images.includes(cleanUrl)) {
               images.push(cleanUrl);
               console.log(`  ✅ JSON-LD images array'den: ${cleanUrl.substring(0, 100)}...`);
             }
            }
          });
        }
      } catch (e) {
        // JSON parse hatası, devam et
        console.warn('JSON-LD parse hatası:', e);
      }
    }
    
    if (jsonLdScripts.length > 0) {
      console.log(`✅ JSON-LD'den fotoğraf kontrolü tamamlandı, toplam: ${images.length}`);
    }

    // Açıklama - Eğer script tag'den bulunamadıysa HTML'den parse et
    if (!description) {
      const descriptionSelectors = [
        '.product-description',
        '.pr-in-dt-dsc',
        '[data-test-id="product-description"]',
        '.product-detail-description',
        '[class*="description"]'
      ];
      
      for (const selector of descriptionSelectors) {
        const descriptionElement = doc.querySelector(selector);
        if (descriptionElement) {
          description = descriptionElement.textContent?.trim() || '';
          if (description && description.length > 10) {
            break;
          }
        }
      }
    }

    // Fotoğrafları temizle ve sırala (akıllı duplicate kontrolü)
    console.log(`🔍 ${images.length} fotoğraf duplicate kontrolünden önce`);
    
    // Önce query string'leri ve parametreleri kaldırarak normalize et
    const normalizedImages = new Map<string, string>();
    
    images.forEach(img => {
      try {
        // URL'yi parse et
        const url = new URL(img);
        // Query string ve hash'i kaldır
        url.search = '';
        url.hash = '';
        const normalizedUrl = url.toString();
        
        // Eğer bu normalized URL daha önce görülmediyse ekle
        // Veya daha kısa/optimize edilmiş versiyonu varsa onu kullan
        if (!normalizedImages.has(normalizedUrl)) {
          normalizedImages.set(normalizedUrl, img);
        } else {
          // Eğer mevcut URL daha kısa veya daha iyi ise, onu kullan
          const existing = normalizedImages.get(normalizedUrl)!;
          if (img.length < existing.length || img.includes('_org_') || img.includes('_zoom')) {
            normalizedImages.set(normalizedUrl, img);
          }
        }
      } catch (e) {
        // URL parse hatası, direkt ekle
        const cleanUrl = img.split('?')[0].split('#')[0];
        if (!normalizedImages.has(cleanUrl)) {
          normalizedImages.set(cleanUrl, img);
        }
      }
    });
    
    images = Array.from(normalizedImages.values());
    console.log(`🧹 Normalize sonrası: ${images.length} benzersiz fotoğraf`);
    
    // Aynı fotoğrafın farklı versiyonlarını filtrele (örneğin: 1_org_zoom.jpg, 1_org_sel.jpg, 1.jpg)
    const finalImages: string[] = [];
    const seenImageKeys = new Set<string>();
    
    images.forEach(img => {
      try {
        // URL'den fotoğraf numarasını ve base path'i çıkar
        // Örnek: .../031408bb-c987-39a7-a72b-56cf6eb842fb/1_org_zoom.jpg
        // -> basePath: .../031408bb-c987-39a7-a72b-56cf6eb842fb/
        // -> num: 1
        
        // Önce UUID'yi bul (base path için)
        const uuidMatch = img.match(/([a-f0-9-]{36,})\//i);
        const uuid = uuidMatch ? uuidMatch[1] : null;
        
        // Fotoğraf numarasını bul
        const numPatterns = [
          /\/(\d+)[_\.]/,           // /1_ veya /1.
          /_(\d+)[_\.]/,            // _1_ veya _1.
          /-(\d+)[_\.]/,            // -1_ veya -1.
          /(\d+)_org/,              // 1_org
          /(\d+)_zoom/,             // 1_zoom
          /(\d+)_sel/,              // 1_sel
          /(\d+)\.(jpg|jpeg|png|webp|gif)/i  // 1.jpg
        ];
        
        let imageNum: string | null = null;
        
        for (const pattern of numPatterns) {
          const match = img.match(pattern);
          if (match) {
            imageNum = match[1];
            break;
          }
        }
        
        if (imageNum && uuid) {
          // UUID + numara kombinasyonunu kontrol et (en güvenilir yöntem)
          const imageKey = `${uuid}_${imageNum}`;
          
          if (!seenImageKeys.has(imageKey)) {
            seenImageKeys.add(imageKey);
            finalImages.push(img);
          } else {
            console.log(`⚠️ Duplicate fotoğraf atlandı (UUID+numara): ${img.substring(0, 100)}...`);
          }
        } else if (imageNum) {
          // UUID bulunamadıysa, sadece numara + path son kısmı
          const pathMatch = img.match(/\/([^\/]+\/[^\/]+\/\d+[_\.])/);
          if (pathMatch) {
            const imageKey = `${pathMatch[1]}_${imageNum}`;
            if (!seenImageKeys.has(imageKey)) {
              seenImageKeys.add(imageKey);
              finalImages.push(img);
            } else {
              console.log(`⚠️ Duplicate fotoğraf atlandı (path+numara): ${img.substring(0, 100)}...`);
            }
          } else {
            // Path bulunamazsa direkt ekle
            finalImages.push(img);
          }
        } else {
          // Numara bulunamazsa, URL'nin kendisini key olarak kullan
          const urlKey = img.split('?')[0].split('#')[0];
          if (!seenImageKeys.has(urlKey)) {
            seenImageKeys.add(urlKey);
            finalImages.push(img);
          } else {
            console.log(`⚠️ Duplicate fotoğraf atlandı (URL): ${img.substring(0, 100)}...`);
          }
        }
      } catch (e) {
        // Hata durumunda direkt ekle (ama yine de kontrol et)
        const urlKey = img.split('?')[0].split('#')[0];
        if (!seenImageKeys.has(urlKey)) {
          seenImageKeys.add(urlKey);
          finalImages.push(img);
        }
      }
    });
    
    images = finalImages;
    console.log(`✅ Final duplicate kontrolü sonrası: ${images.length} benzersiz fotoğraf`);
    
    // Fotoğrafları sırala (numara sırasına göre)
    images.sort((a, b) => {
      // URL'den numarayı çıkar ve karşılaştır
      const numA = a.match(/\/(\d+)[_\.]/)?.[1] || a.match(/_(\d+)[_\.]/)?.[1] || a.match(/-(\d+)[_\.]/)?.[1] || '0';
      const numB = b.match(/\/(\d+)[_\.]/)?.[1] || b.match(/_(\d+)[_\.]/)?.[1] || b.match(/-(\d+)[_\.]/)?.[1] || '0';
      return parseInt(numA) - parseInt(numB);
    });
    
    console.log(`✅ Toplam ${images.length} benzersiz ürün fotoğrafı bulundu ve sıralandı`);
    
    console.log('📊 Çekilen veriler:', {
      title: title ? title.substring(0, 50) + '...' : 'Bulunamadı',
      price: price || 'Bulunamadı',
      imagesCount: images.length,
      description: description ? description.substring(0, 50) + '...' : 'Bulunamadı'
    });
    
    // Fotoğrafları detaylı logla
    if (images.length > 0) {
      console.log(`🖼️ ${images.length} fotoğraf bulundu:`);
      images.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.substring(0, 120)}${img.length > 120 ? '...' : ''}`);
      });
    } else {
      console.warn('⚠️ Hiç fotoğraf çekilemedi!');
      console.warn('🔍 HTML uzunluğu:', html.length);
      console.warn('🔍 Script tag sayısı:', doc.querySelectorAll('script').length);
      console.warn('🔍 Img tag sayısı:', doc.querySelectorAll('img').length);
      
      // Son çare: HTML'deki TÜM URL'leri bul ve filtrele
      console.log('🔍 Son çare: HTML\'deki tüm URL\'ler taranıyor...');
      const allUrlPattern = /https?:\/\/[^\s"',\[\]<>{}()]+/gi;
      const allUrls = html.match(allUrlPattern);
      console.log(`📊 HTML'de toplam ${allUrls ? allUrls.length : 0} URL bulundu`);
      
      if (allUrls) {
        const imageUrls = allUrls.filter(url => {
          const lowerUrl = url.toLowerCase();
          return (lowerUrl.includes('cdn.trendyol.com') || 
                  lowerUrl.includes('ty-cdn.com') ||
                  lowerUrl.includes('cdn.dsmcdn.com') ||
                  lowerUrl.includes('dsmcdn.com')) &&
                 (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || 
                  lowerUrl.endsWith('.png') || lowerUrl.endsWith('.webp') || 
                  lowerUrl.endsWith('.gif') || lowerUrl.includes('.jpg') || 
                  lowerUrl.includes('.png'));
        });
        
        console.log(`📸 Filtrelenmiş image URL sayısı: ${imageUrls.length}`);
        
        if (imageUrls.length > 0) {
          imageUrls.forEach((url, index) => {
            const cleanUrl = url.replace(/['"]/g, '').split('?')[0].split('&')[0];
            if (isProductImage(cleanUrl)) {
              images.push(cleanUrl);
              if (index < 5) {
                console.log(`  ✅ Son çare URL ${index + 1}: ${cleanUrl.substring(0, 100)}...`);
              }
            }
          });
          
          // Duplicate'leri kaldır
          images = [...new Set(images)];
          console.log(`✅ Son çare yöntemiyle ${images.length} fotoğraf bulundu!`);
        }
      }
    }

    // Başlık kontrolü - Cloudflare mesajlarını filtrele
    if (title) {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('sorry') && lowerTitle.includes('blocked') ||
          lowerTitle.includes('attention required') ||
          lowerTitle.includes('unable to access') ||
          lowerTitle.includes('cloudflare')) {
        throw new Error('Trendyol sayfası Cloudflare tarafından bloklanmış. Lütfen daha sonra tekrar deneyin veya farklı bir proxy kullanın.');
      }
      
      // Eğer başlık sadece fiyat/indirim bilgisi içeriyorsa, gerçek başlık değildir
      const isPriceOnly = (lowerTitle.includes('sepette') && lowerTitle.includes('tl')) ||
                         (title.length < 20 && (lowerTitle.includes('tl') || lowerTitle.includes('indirim')));
      if (isPriceOnly) {
        console.warn('⚠️ Bulunan başlık sadece fiyat/indirim bilgisi içeriyor, tekrar arama yapılıyor...');
        title = ''; // Başlığı sıfırla, tekrar ara
      }
    }
    
    // Eğer hala başlık bulunamadıysa, son çare olarak tüm sayfadaki en uzun metni dene
    if (!title || title.length < 3) {
      console.log('⚠️ Başlık bulunamadı, son çare arama yapılıyor...');
      
      // Tüm elementleri kontrol et, en uzun ve anlamlı metni bul
      const allElements = doc.querySelectorAll('*');
      let longestText = '';
      let longestLength = 0;
      
      for (const el of allElements) {
        const text = el.textContent?.trim() || '';
        if (!text || text.length < 10) continue;
        
        const lowerText = text.toLowerCase();
        
        // Cloudflare mesajlarını filtrele
        if (lowerText.includes('sorry') && lowerText.includes('blocked') ||
            lowerText.includes('attention required') ||
            lowerText.includes('unable to access') ||
            lowerText.includes('cloudflare')) {
          continue;
        }
        
        // Sadece fiyat/indirim bilgisi içeren metinleri atla
        const isPriceOnly = (lowerText.includes('sepette') && lowerText.includes('tl')) ||
                           (text.length < 20 && (lowerText.includes('tl') || lowerText.includes('indirim')));
        if (isPriceOnly) continue;
        
        // "Marka Kampanyası", "Sepette" gibi ifadeleri içeren ama uzun metinleri kabul et
        // (ürün başlığında bu kelimeler geçebilir)
        if (text.length > longestLength && text.length > 20) {
          longestText = text;
          longestLength = text.length;
        }
      }
      
      if (longestText && longestText.length > 10) {
        title = longestText;
        console.log(`✅ Başlık bulundu (son çare - en uzun metin):`, title.substring(0, 50));
      }
    }
    
    if (!title || title.length < 3) {
      throw new Error('Ürün başlığı bulunamadı. Trendyol sayfası yüklenmemiş olabilir veya Cloudflare tarafından bloklanmış olabilir.');
    }

    // Ürün özelliklerini çek
    console.log('🔍 Ürün özellikleri çekiliyor...');
    const specs: { [key: string]: string } = {};
    
    try {
      // Önce JSON state'den özellikleri çek (daha güvenilir)
      console.log('🔍 JSON state\'den özellikler aranıyor...');
      try {
        const scripts = doc.querySelectorAll('script');
        let foundState = false;
        
        for (const script of scripts) {
          const scriptText = script.textContent || '';
          if (!scriptText || scriptText.length < 100) continue;
          
          // Pattern 1: __PRODUCT_DETAIL_APP_INITIAL_STATE__
          if (scriptText.includes('__PRODUCT_DETAIL_APP_INITIAL_STATE__') || 
              scriptText.includes('PRODUCT_DETAIL_APP_INITIAL_STATE')) {
            try {
              // Daha esnek pattern - farklı formatları dene
              const patterns = [
                /(?:window\.)?__PRODUCT_DETAIL_APP_INITIAL_STATE__\s*=\s*({[\s\S]*?});/,
                /__PRODUCT_DETAIL_APP_INITIAL_STATE__\s*[:=]\s*({[\s\S]*?})(?:;|$)/,
                /"__PRODUCT_DETAIL_APP_INITIAL_STATE__"\s*:\s*({[\s\S]*?})(?:,|\})/,
                /PRODUCT_DETAIL_APP_INITIAL_STATE[^=]*=\s*({[\s\S]*?});/
              ];
              
              for (const pattern of patterns) {
                const match = scriptText.match(pattern);
                if (match && match[1]) {
                  try {
                    const stateData = JSON.parse(match[1]);
                    foundState = true;
                    console.log('✅ JSON state bulundu, parse ediliyor...');
                    
                    // Farklı path'leri dene
                    const paths = [
                      stateData.attributes,
                      stateData.product?.attributes,
                      stateData.productDetail?.attributes,
                      stateData.product?.productAttributes,
                      stateData.productDetail?.productAttributes,
                      stateData.data?.attributes,
                      stateData.data?.product?.attributes,
                      stateData.result?.attributes,
                      stateData.result?.product?.attributes
                    ];
                    
                    for (const attributes of paths) {
                      if (Array.isArray(attributes) && attributes.length > 0) {
                        attributes.forEach((attr: any) => {
                          if (attr && typeof attr === 'object') {
                            const name = attr.name || attr.key || attr.label || attr.title || attr.attributeName;
                            const value = attr.value || attr.attributeValue || attr.text || String(attr);
                            
                            if (name && value && typeof name === 'string' && typeof value === 'string') {
                              specs[name.trim()] = String(value).trim();
                            }
                          }
                        });
                        console.log(`✅ ${attributes.length} özellik JSON state'den çekildi`);
                        break; // İlk başarılı path'ten sonra dur
                      }
                    }
                    
                    // Eğer attributes array bulunamadıysa, tüm state'i tarayalım
                    if (Object.keys(specs).length === 0) {
                      const searchInObject = (obj: any, depth = 0): void => {
                        if (depth > 5) return; // Maksimum derinlik
                        if (!obj || typeof obj !== 'object') return;
                        
                        if (Array.isArray(obj)) {
                          obj.forEach((item: any) => {
                            if (item && typeof item === 'object') {
                              const name = item.name || item.key || item.label;
                              const value = item.value || item.text;
                              if (name && value && typeof name === 'string') {
                                specs[name.trim()] = String(value).trim();
                              }
                              searchInObject(item, depth + 1);
                            }
                          });
                        } else {
                          Object.keys(obj).forEach(key => {
                            if (key.toLowerCase().includes('attribute') || 
                                key.toLowerCase().includes('spec') ||
                                key.toLowerCase().includes('property')) {
                              searchInObject(obj[key], depth + 1);
                            }
                          });
                        }
                      };
                      
                      searchInObject(stateData);
                    }
                    
                    break; // İlk başarılı match'ten sonra dur
                  } catch (parseError) {
                    console.warn('JSON parse hatası, bir sonraki pattern deneniyor...', parseError);
                    continue;
                  }
                }
              }
            } catch (e) {
              console.warn('JSON state extract hatası:', e);
            }
          }
          
          // Pattern 2: JSON-LD formatı
          if (script.getAttribute('type') === 'application/ld+json') {
            try {
              const jsonData = JSON.parse(scriptText);
              if (jsonData['@type'] === 'Product') {
                if (jsonData.additionalProperty && Array.isArray(jsonData.additionalProperty)) {
                  jsonData.additionalProperty.forEach((prop: any) => {
                    if (prop.name && prop.value) {
                      specs[prop.name] = prop.value;
                    }
                  });
                  console.log(`✅ JSON-LD'den ${jsonData.additionalProperty.length} özellik bulundu`);
                }
              }
            } catch (e) {
              // JSON parse hatası, devam et
            }
          }
          
          // Pattern 3: Genel JSON içinde attributes ara
          if (scriptText.includes('attributes') && scriptText.includes('name') && scriptText.includes('value')) {
            try {
              // JSON array pattern'ini ara
              const attrPattern = /attributes\s*:\s*\[([^\]]+)\]/g;
              const matches = Array.from(scriptText.matchAll(attrPattern));
              for (const match of matches) {
                if (match[1]) {
                  // Her attribute objesini bul
                  const objPattern = /\{([^}]+)\}/g;
                  const objMatches = Array.from(match[1].matchAll(objPattern));
                  for (const objMatch of objMatches) {
                    const nameMatch = objMatch[1].match(/name\s*:\s*["']([^"']+)["']/);
                    const valueMatch = objMatch[1].match(/value\s*:\s*["']([^"']+)["']/);
                    if (nameMatch && valueMatch) {
                      specs[nameMatch[1]] = valueMatch[1];
                    }
                  }
                }
              }
            } catch (e) {
              // Pattern match hatası, devam et
            }
          }
        }
        
        if (!foundState) {
          console.log('⚠️ JSON state bulunamadı, HTML\'den çekiliyor...');
        }
      } catch (e) {
        console.warn('JSON state çekme hatası:', e);
      }
      
      // HTML'den özellikleri çek (fallback)
      console.log('🔍 HTML\'den özellikler aranıyor...');
      const extractSpecsFromHTML = (doc: Document): { [key: string]: string } => {
        const extractedSpecs: { [key: string]: string } = {};
        
        // Format 1: .product-info-item .item-title + .item-value
        const productInfoItems = doc.querySelectorAll('.product-info-item');
        productInfoItems.forEach((item) => {
          const titleEl = item.querySelector('.item-title, [class*="title"], [class*="name"]');
          const valueEl = item.querySelector('.item-value, [class*="value"], [class*="text"]');
          if (titleEl && valueEl) {
            const key = titleEl.textContent?.trim() || '';
            const value = valueEl.textContent?.trim() || '';
            if (key && value && key.length < 100) {
              extractedSpecs[key] = value;
            }
          }
        });
        
        // Format 2: table tr th + td
        const tableRows = doc.querySelectorAll('table tr');
        tableRows.forEach((row) => {
          const th = row.querySelector('th');
          const td = row.querySelector('td');
          if (th && td) {
            const key = th.textContent?.trim() || '';
            const value = td.textContent?.trim() || '';
            if (key && value && key.length < 100 && !key.includes('TL') && !key.includes('₺')) {
              extractedSpecs[key] = value;
            }
          }
        });
        
        // Format 3: .detail-attribute-wrapper ve benzeri
        const attributeSelectors = [
          '.detail-attribute-wrapper',
          '.attribute-wrapper',
          '[class*="attribute"]',
          '[class*="spec"]',
          '[class*="property"]',
          '[data-test-id*="attribute"]',
          '[data-test-id*="spec"]'
        ];
        
        attributeSelectors.forEach((selector) => {
          try {
            const elements = doc.querySelectorAll(selector);
            elements.forEach((el) => {
              const titleEl = el.querySelector('[class*="title"], [class*="name"], strong, b, dt');
              const valueEl = el.querySelector('[class*="value"], [class*="text"], dd, span:not([class*="title"])');
              
              if (titleEl && valueEl) {
                const key = titleEl.textContent?.trim() || '';
                const value = valueEl.textContent?.trim() || '';
                if (key && value && key.length < 100 && key !== value) {
                  extractedSpecs[key] = value;
                }
              } else {
                // ":" ile ayrılmış format
                const text = el.textContent?.trim() || '';
                const colonIndex = text.indexOf(':');
                if (colonIndex > 0 && colonIndex < text.length - 1) {
                  const key = text.substring(0, colonIndex).trim();
                  const value = text.substring(colonIndex + 1).trim();
                  if (key && value && key.length < 100 && value.length < 500) {
                    extractedSpecs[key] = value;
                  }
                }
              }
            });
          } catch (e) {
            // Selector hatası, devam et
          }
        });
        
        // Format 4: Genel "key: value" pattern'i (son çare)
        if (Object.keys(extractedSpecs).length === 0) {
          console.log('🔍 Genel pattern ile özellikler aranıyor...');
          const allElements = doc.querySelectorAll('div, span, p, li, td');
          allElements.forEach((el) => {
            const text = el.textContent?.trim() || '';
            // "Key: Value" formatını ara (key kısa, value uzun olabilir)
            const colonMatch = text.match(/^([^:]{1,50}):\s*(.{1,200})$/);
            if (colonMatch) {
              const key = colonMatch[1].trim();
              const value = colonMatch[2].trim();
              // Fiyat, tarih gibi şeyleri filtrele
              if (key && value && 
                  !key.toLowerCase().includes('tl') && 
                  !key.toLowerCase().includes('fiyat') &&
                  !key.toLowerCase().includes('tarih') &&
                  !value.match(/^\d+[.,]\d+\s*(tl|₺)$/i) &&
                  key.length > 2 && key.length < 50) {
                extractedSpecs[key] = value;
              }
            }
          });
        }
        
        return extractedSpecs;
      };
      
      // HTML'den özellikleri çek
      const htmlSpecs = extractSpecsFromHTML(doc);
      Object.assign(specs, htmlSpecs);
      console.log(`✅ HTML'den ${Object.keys(htmlSpecs).length} özellik bulundu`);
      
      // "Ürün Özellikleri" gibi başlık key'lerini filtrele
      const filteredSpecs: { [key: string]: string } = {};
      Object.keys(specs).forEach(key => {
        const lowerKey = key.toLowerCase();
        // Başlık olabilecek key'leri filtrele
        if (!lowerKey.includes('ürün özellikleri') && 
            !lowerKey.includes('özellikler') && 
            !lowerKey.includes('specifications') &&
            !lowerKey.includes('product features') &&
            key.length > 0 && 
            specs[key] && 
            specs[key].length > 0) {
          filteredSpecs[key] = specs[key];
        }
      });
      
      // Filtrelenmiş specs'i kullan
      Object.keys(specs).forEach(key => delete specs[key]);
      Object.assign(specs, filteredSpecs);
      
      console.log(`📊 Toplam ${Object.keys(specs).length} özellik çekildi (filtrelenmiş)`);
      if (Object.keys(specs).length > 0) {
        console.log('Özellikler:', Object.keys(specs).slice(0, 10).join(', '), '...');
        // İlk birkaç özelliği detaylı göster
        const sampleSpecs = Object.entries(specs).slice(0, 3);
        sampleSpecs.forEach(([key, value]) => {
          console.log(`  - ${key}: ${value}`);
        });
      } else {
        console.warn('⚠️ Hiç özellik bulunamadı. HTML yapısı kontrol ediliyor...');
        // Debug: Sayfadaki bazı elementleri göster
        const testSelectors = [
          '.product-info-item',
          'table',
          '.detail-attribute-wrapper',
          '[class*="attribute"]',
          '[class*="spec"]'
        ];
        testSelectors.forEach(selector => {
          const elements = doc.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`  📌 ${selector}: ${elements.length} element bulundu`);
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Özellik çekme hatası:', error);
    }

    return {
      title: title.trim(),
      price: price.trim(),
      images: images.length > 0 ? images : [],
      description: description.trim(),
      specs: Object.keys(specs).length > 0 ? specs : {}
    };
  } catch (error) {
    console.error('❌ Trendyol scraping hatası:', error);
    console.error('Hata detayı:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

/**
 * Alternatif: Puppeteer kullanarak scraping (backend gerekir)
 * Bu fonksiyon sadece referans için, browser'da çalışmaz
 */
export const scrapeTrendyolWithPuppeteer = async (productUrl: string): Promise<TrendyolProductData | null> => {
  // Bu fonksiyon sadece backend'de çalışır
  // Browser'da kullanılamaz
  throw new Error('Bu fonksiyon sadece backend\'de çalışır');
};

