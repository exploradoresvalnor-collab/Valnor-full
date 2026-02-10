/**
 * Tipos de Items - Valnor Juego
 */

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ItemType = 'weapon' | 'armor' | 'helmet' | 'boots' | 'accessory' | 'consumable';
export type EquipmentSlot = 'weapon' | 'armor' | 'helmet' | 'boots' | 'accessory1' | 'accessory2';

export interface ItemStats {
  ataque?: number;
  defensa?: number;
  hp?: number;
  velocidad?: number;
  critico?: number;
  evasion?: number;
}

export interface Item {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: ItemType;
  rareza: ItemRarity;
  nivel: number;
  stats: ItemStats;
  precio: number;
  imagen?: string;
  icono?: string;
}

export interface EquipmentItem extends Item {
  equipado: boolean;
  slot: EquipmentSlot;
  mejoras: number;
  maxMejoras: number;
}

export interface ConsumableItem extends Item {
  cantidad: number;
  efecto: string;
  duracion?: number;
}

export interface EquippedItems {
  weapon: EquipmentItem | null;
  armor: EquipmentItem | null;
  helmet: EquipmentItem | null;
  boots: EquipmentItem | null;
  accessory1: EquipmentItem | null;
  accessory2: EquipmentItem | null;
}

// Colores por rareza (fuente única de verdad)
export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9d9d9d',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
  mythic: '#e6cc80',
};

export const RARITY_NAMES: Record<ItemRarity, string> = {
  common: 'Común',
  uncommon: 'Poco Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
  mythic: 'Mítico',
};
