/**
 * Tipos de Items - Valnor Juego
 */

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
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

// Colores por rareza
export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export const RARITY_NAMES: Record<ItemRarity, string> = {
  common: 'Común',
  uncommon: 'Poco Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
};
