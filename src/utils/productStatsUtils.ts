/**
 * Ürün istatistikleri yönetimi için utility fonksiyonları
 */

export interface ProductStats {
  productId: number;
  title: string;
  uploadDate: string;
  likes: number;
  clicks: number;
  siteVisits: number;
  cartAdds: number;
  views: number;
  shares: number;
}

/**
 * Ürün istatistiklerini al
 */
export const getProductStats = (productId: number): ProductStats | null => {
  try {
    const savedStats = localStorage.getItem(`productStats_${productId}`);
    if (savedStats) {
      return JSON.parse(savedStats);
    }
    return null;
  } catch (error) {
    console.error('Ürün istatistikleri alınırken hata:', error);
    return null;
  }
};

/**
 * Ürün istatistiklerini kaydet
 */
export const saveProductStats = (stats: ProductStats): void => {
  try {
    localStorage.setItem(`productStats_${stats.productId}`, JSON.stringify(stats));
  } catch (error) {
    console.error('Ürün istatistikleri kaydedilirken hata:', error);
  }
};

/**
 * Ürün istatistiğini güncelle
 */
export const updateProductStat = (productId: number, statType: keyof Omit<ProductStats, 'productId' | 'title' | 'uploadDate'>, increment: number = 1): void => {
  try {
    const currentStats = getProductStats(productId);
    if (currentStats) {
      const updatedStats = {
        ...currentStats,
        [statType]: (currentStats[statType] as number) + increment
      };
      saveProductStats(updatedStats);
    } else {
      // Eğer istatistik yoksa, yeni oluştur
      const newStats: ProductStats = {
        productId,
        title: '', // Bu daha sonra güncellenecek
        uploadDate: new Date().toISOString(),
        likes: 0,
        clicks: 0,
        siteVisits: 0,
        cartAdds: 0,
        views: 0,
        shares: 0,
        [statType]: increment
      };
      saveProductStats(newStats);
    }
  } catch (error) {
    console.error('Ürün istatistiği güncellenirken hata:', error);
  }
};

/**
 * Ürün görüntülenme sayısını artır
 */
export const trackProductView = (productId: number): void => {
  updateProductStat(productId, 'views');
};

/**
 * Ürün tıklama sayısını artır
 */
export const trackProductClick = (productId: number): void => {
  updateProductStat(productId, 'clicks');
};

/**
 * Ürün beğeni sayısını artır
 */
export const trackProductLike = (productId: number): void => {
  updateProductStat(productId, 'likes');
};

/**
 * Ürün sepete eklenme sayısını artır
 */
export const trackProductCartAdd = (productId: number): void => {
  updateProductStat(productId, 'cartAdds');
};

/**
 * Ürün site ziyaret sayısını artır
 */
export const trackProductSiteVisit = (productId: number): void => {
  updateProductStat(productId, 'siteVisits');
};

/**
 * Ürün paylaşım sayısını artır
 */
export const trackProductShare = (productId: number): void => {
  updateProductStat(productId, 'shares');
};

/**
 * Ürün istatistiklerini başlat (yeni ürün için)
 */
export const initializeProductStats = (productId: number, title: string, uploadDate?: string): void => {
  const stats: ProductStats = {
    productId,
    title,
    uploadDate: uploadDate || new Date().toISOString(),
    likes: 0,
    clicks: 0,
    siteVisits: 0,
    cartAdds: 0,
    views: 0,
    shares: 0
  };
  saveProductStats(stats);
};

/**
 * Tüm ürün istatistiklerini al
 */
export const getAllProductStats = (): ProductStats[] => {
  try {
    const allStats: ProductStats[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('productStats_')) {
        const stats = getProductStats(parseInt(key.replace('productStats_', '')));
        if (stats) {
          allStats.push(stats);
        }
      }
    }
    return allStats;
  } catch (error) {
    console.error('Tüm ürün istatistikleri alınırken hata:', error);
    return [];
  }
};

/**
 * Ürün istatistiklerini sıfırla
 */
export const resetProductStats = (productId: number): void => {
  try {
    localStorage.removeItem(`productStats_${productId}`);
  } catch (error) {
    console.error('Ürün istatistikleri sıfırlanırken hata:', error);
  }
};
