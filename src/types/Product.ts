export interface Product {
  id: number;
  title: string;
  imageUrl: string;
  images?: string[]; // Çoklu fotoğraf desteği
  price?: string;
  category?: string;
  subcategory?: string;
  season?: string;
  description?: string;
  features?: string[];
  originalPrice?: string;
  discount?: string;
  rating?: number;
  reviews?: number;
  store?: string;
  brand?: string;
  likes?: number;
  user?: {
    id: number;
    name: string;
    avatar: string;
    verified: boolean;
  };
  popularityRank?: number;
  productLink?: string; // Orijinal ürün linki
  affiliateLink?: string; // Kullanıcıya özel affiliate link
  shareDate?: string;
  specs?: { [key: string]: string }; // Ürün özellikleri (key-value formatında)
}
