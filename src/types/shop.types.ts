/**
 * Shop Types - Tipos de tienda
 */

import type { ItemRarity, Item } from './item.types';

// Tipo de producto
export type ShopItemType = 'item' | 'bundle' | 'currency' | 'subscription' | 'gacha';

// Moneda de pago
export type PaymentCurrency = 'gold' | 'gems' | 'real_money';

// Estado del producto
export type ShopItemStatus = 'available' | 'sold_out' | 'coming_soon' | 'limited' | 'discontinued';

// Producto de la tienda
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  
  // Precio
  price: number;
  currency: PaymentCurrency;
  originalPrice?: number;  // Para descuentos
  discount?: number;       // Porcentaje
  
  // Contenido
  items: ShopItemContent[];
  
  // Límites
  purchaseLimit?: number;       // Por usuario
  globalLimit?: number;         // Total disponible
  currentStock?: number;        // Stock actual
  
  // Tiempo
  availableFrom?: string;
  availableUntil?: string;
  isLimited: boolean;
  
  // Visual
  thumbnail: string;
  bannerImage?: string;
  rarity?: ItemRarity;
  
  // Metadatos
  status: ShopItemStatus;
  category: ShopCategory;
  tags: string[];
  featured: boolean;
  sortOrder: number;
}

export interface ShopItemContent {
  type: 'item' | 'gold' | 'gems' | 'experience';
  itemId?: string;
  item?: Item;
  quantity: number;
  isGuaranteed: boolean;  // Para gachas
  dropRate?: number;      // Para gachas
}

// Categoría de tienda
export type ShopCategory = 
  | 'featured'      // Destacados
  | 'weapons'       // Armas
  | 'armor'         // Armaduras
  | 'consumables'   // Consumibles
  | 'materials'     // Materiales
  | 'bundles'       // Paquetes
  | 'currency'      // Moneda premium
  | 'cosmetics'     // Cosméticos
  | 'gacha';        // Sistema gacha

// Banner de gacha
export interface GachaBanner {
  id: string;
  name: string;
  description: string;
  
  // Costos
  singlePullCost: number;
  tenPullCost: number;      // Normalmente con descuento
  currency: PaymentCurrency;
  
  // Pool de items
  pool: GachaPoolEntry[];
  
  // Pity system
  pityCount: number;        // Después de X pulls, garantizado
  currentPity?: number;     // Pity actual del usuario
  
  // Featured items
  featuredItems: string[];  // IDs de items destacados
  featuredRateUp: number;   // Multiplicador de probabilidad
  
  // Tiempo
  startDate: string;
  endDate: string;
  
  // Visual
  bannerImage: string;
  backgroundColor: string;
}

export interface GachaPoolEntry {
  itemId: string;
  item?: Item;
  rarity: ItemRarity;
  baseRate: number;       // Probabilidad base (0-100)
  isFeatured: boolean;
}

// Resultado de gacha
export interface GachaResult {
  bannerId: string;
  pullCount: number;
  items: GachaPullResult[];
  pityProgress: number;
  isPityReached: boolean;
}

export interface GachaPullResult {
  itemId: string;
  item: Item;
  rarity: ItemRarity;
  isNew: boolean;         // Primera vez que lo obtiene
  isFeatured: boolean;
  pullNumber: number;
}

// Historial de compras
export interface PurchaseHistory {
  id: string;
  userId: string;
  
  // Producto
  shopItemId: string;
  shopItemName: string;
  shopItemType: ShopItemType;
  
  // Pago
  price: number;
  currency: PaymentCurrency;
  
  // Contenido recibido
  itemsReceived: ShopItemContent[];
  
  // Fecha
  purchasedAt: string;
  
  // Estado
  status: 'completed' | 'pending' | 'refunded' | 'failed';
}

// Para realizar compra
export interface PurchaseDTO {
  shopItemId: string;
  quantity?: number;
}

// Para tirar gacha
export interface GachaPullDTO {
  bannerId: string;
  pullCount: 1 | 10;  // Single o multi
}

// Respuestas del servidor
export interface ShopResponse {
  success: boolean;
  items?: ShopItem[];
  categories?: ShopCategory[];
  message?: string;
}

export interface GachaBannerResponse {
  success: boolean;
  banners?: GachaBanner[];
  message?: string;
}

export interface PurchaseResponse {
  success: boolean;
  purchase?: PurchaseHistory;
  newBalance?: {
    gold: number;
    gems: number;
  };
  message?: string;
}

export interface GachaResponse {
  success: boolean;
  result?: GachaResult;
  newBalance?: {
    gold: number;
    gems: number;
  };
  message?: string;
}

// Configuración de tienda
export interface ShopConfig {
  // Tasas de conversión
  gemsToGoldRate: number;
  
  // Límites diarios
  dailyPurchaseLimit: number;
  dailyGachaLimit: number;
  
  // Descuentos por cantidad
  bulkDiscounts: {
    quantity: number;
    discount: number;
  }[];
}
