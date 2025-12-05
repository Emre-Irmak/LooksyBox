/**
 * Affiliate link yönetimi için utility fonksiyonları
 */

/**
 * Kullanıcı ID'sini localStorage'dan al veya yeni oluştur
 */
export const getOrCreateUserId = (): string => {
  let userId = localStorage.getItem('affiliateUserId');
  
  if (!userId) {
    // Benzersiz kullanıcı ID'si oluştur
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('affiliateUserId', userId);
  }
  
  return userId;
};

/**
 * Orijinal ürün linkini kullanıcıya özel affiliate linke dönüştür
 */
export const createAffiliateLink = (originalLink: string, productId: number, userId?: string): string => {
  if (!originalLink) return '';
  
  const affiliateUserId = userId || getOrCreateUserId();
  
  // Affiliate link formatı: https://looksy.com/affiliate/{userId}/{productId}#{encodedOriginalLink}
  const baseUrl = window.location.origin;
  const encodedOriginalLink = encodeURIComponent(originalLink);
  return `${baseUrl}/affiliate/${affiliateUserId}/${productId}#${encodedOriginalLink}`;
};

/**
 * Affiliate linkten orijinal linki çıkar
 */
export const extractOriginalLinkFromAffiliate = (affiliateLink: string): string | null => {
  try {
    const url = new URL(affiliateLink);
    const pathParts = url.pathname.split('/');
    
    if (pathParts[1] === 'affiliate' && pathParts.length >= 4) {
      // const userId = pathParts[2];
      const productId = pathParts[3];
      
      // Önce URL hash'inden orijinal linki al
      if (url.hash) {
        const originalLink = decodeURIComponent(url.hash.substring(1));
        if (originalLink.startsWith('http')) {
          return originalLink;
        }
      }
      
      // Eğer hash'te yoksa localStorage'dan ara
      const sharedProducts = JSON.parse(localStorage.getItem('sharedProducts') || '[]');
      let product = sharedProducts.find((p: any) => p.id === parseInt(productId));
      
      if (!product) {
        const allProducts = JSON.parse(localStorage.getItem('allProducts') || '[]');
        product = allProducts.find((p: any) => p.id === parseInt(productId));
      }
      
      return product?.productLink || null;
    }
    
    return null;
  } catch (error) {
    console.error('Affiliate link parse hatası:', error);
    return null;
  }
};

/**
 * Affiliate link tıklama istatistiklerini kaydet
 */
export const trackAffiliateClick = (userId: string, productId: number): void => {
  const clickData = {
    userId,
    productId,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    referrer: document.referrer
  };
  
  // Tıklama verilerini localStorage'a kaydet
  const existingClicks = JSON.parse(localStorage.getItem('affiliateClicks') || '[]');
  existingClicks.push(clickData);
  localStorage.setItem('affiliateClicks', JSON.stringify(existingClicks));
  
  console.log('Affiliate tıklama kaydedildi:', clickData);
};

/**
 * Kullanıcının affiliate istatistiklerini al
 */
export const getAffiliateStats = (userId?: string): {
  totalClicks: number;
  uniqueProducts: number;
} => {
  const targetUserId = userId || getOrCreateUserId();
  const allClicks = JSON.parse(localStorage.getItem('affiliateClicks') || '[]');
  
  const userClicks = allClicks.filter((click: any) => click.userId === targetUserId);
  const uniqueProducts = new Set(userClicks.map((click: any) => click.productId));
  
  return {
    totalClicks: userClicks.length,
    uniqueProducts: uniqueProducts.size
  };
};

/**
 * Ürün için affiliate link oluştur ve ürünü güncelle
 */
export const generateProductAffiliateLink = (product: any, userId?: string): any => {
  if (!product.productLink) return product;
  
  const affiliateUserId = userId || getOrCreateUserId();
  const affiliateLink = createAffiliateLink(product.productLink, product.id, affiliateUserId);
  
  return {
    ...product,
    affiliateLink
  };
};
