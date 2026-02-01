/**
 * Loot System - Sistema de botín y recompensas
 */

import type { ItemRarity } from '../../types';

// ============================================================
// TIPOS
// ============================================================

export type ItemType = 
  | 'weapon'
  | 'armor'
  | 'accessory'
  | 'consumable'
  | 'material'
  | 'quest'
  | 'currency'
  | 'gem';

export type EquipSlot = 
  | 'mainHand'
  | 'offHand'
  | 'head'
  | 'chest'
  | 'legs'
  | 'feet'
  | 'hands'
  | 'neck'
  | 'ring1'
  | 'ring2';

// ============================================================
// INTERFACES
// ============================================================

export interface ItemStats {
  attack?: number;
  defense?: number;
  magicAttack?: number;
  magicDefense?: number;
  health?: number;
  mana?: number;
  strength?: number;
  dexterity?: number;
  intelligence?: number;
  vitality?: number;
  luck?: number;
  critRate?: number;
  critDamage?: number;
  speed?: number;
}

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  level: number;
  slot?: EquipSlot;
  stats?: ItemStats;
  stackable: boolean;
  maxStack: number;
  sellValue: number;
  icon?: string;
  modelId?: string;
}

export interface LootItem {
  itemId: string;
  quantity: number;
  item: ItemDef;
}

export interface LootDrop {
  items: LootItem[];
  gold: number;
  experience: number;
}

export interface LootTableEntry {
  itemId: string;
  weight: number;
  minQuantity: number;
  maxQuantity: number;
  minLevel?: number;
}

export interface LootTable {
  id: string;
  entries: LootTableEntry[];
  guaranteedDrops?: string[];
  goldRange: [number, number];
  dropChance: number; // 0-1
}

// ============================================================
// RAREZA Y PROBABILIDADES
// ============================================================

const RARITY_WEIGHTS: Record<ItemRarity, number> = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
};

const RARITY_STAT_MULTIPLIERS: Record<ItemRarity, number> = {
  common: 1.0,
  uncommon: 1.2,
  rare: 1.5,
  epic: 2.0,
  legendary: 3.0,
};

const RARITY_GOLD_MULTIPLIERS: Record<ItemRarity, number> = {
  common: 1,
  uncommon: 3,
  rare: 10,
  epic: 50,
  legendary: 200,
};

// ============================================================
// BASE DE DATOS DE ITEMS (ejemplos)
// ============================================================

const ITEM_DATABASE: Map<string, ItemDef> = new Map([
  // Armas
  ['sword_iron', {
    id: 'sword_iron',
    name: 'Espada de Hierro',
    description: 'Una espada básica de hierro forjado.',
    type: 'weapon',
    rarity: 'common',
    level: 1,
    slot: 'mainHand',
    stats: { attack: 10, strength: 2 },
    stackable: false,
    maxStack: 1,
    sellValue: 25,
  }],
  ['sword_steel', {
    id: 'sword_steel',
    name: 'Espada de Acero',
    description: 'Una espada de acero bien templado.',
    type: 'weapon',
    rarity: 'uncommon',
    level: 10,
    slot: 'mainHand',
    stats: { attack: 25, strength: 5, critRate: 2 },
    stackable: false,
    maxStack: 1,
    sellValue: 100,
  }],
  ['staff_apprentice', {
    id: 'staff_apprentice',
    name: 'Bastón de Aprendiz',
    description: 'Un bastón mágico para magos principiantes.',
    type: 'weapon',
    rarity: 'common',
    level: 1,
    slot: 'mainHand',
    stats: { magicAttack: 12, intelligence: 3, mana: 20 },
    stackable: false,
    maxStack: 1,
    sellValue: 30,
  }],
  ['bow_hunting', {
    id: 'bow_hunting',
    name: 'Arco de Caza',
    description: 'Un arco utilizado para cazar presas pequeñas.',
    type: 'weapon',
    rarity: 'common',
    level: 1,
    slot: 'mainHand',
    stats: { attack: 8, dexterity: 3, critRate: 3 },
    stackable: false,
    maxStack: 1,
    sellValue: 20,
  }],
  ['dagger_assassin', {
    id: 'dagger_assassin',
    name: 'Daga del Asesino',
    description: 'Una daga afilada para golpes rápidos.',
    type: 'weapon',
    rarity: 'rare',
    level: 15,
    slot: 'mainHand',
    stats: { attack: 18, dexterity: 8, critRate: 8, critDamage: 20, speed: 5 },
    stackable: false,
    maxStack: 1,
    sellValue: 350,
  }],
  
  // Armaduras
  ['armor_leather', {
    id: 'armor_leather',
    name: 'Armadura de Cuero',
    description: 'Protección ligera de cuero curtido.',
    type: 'armor',
    rarity: 'common',
    level: 1,
    slot: 'chest',
    stats: { defense: 5, health: 20 },
    stackable: false,
    maxStack: 1,
    sellValue: 20,
  }],
  ['armor_chainmail', {
    id: 'armor_chainmail',
    name: 'Cota de Malla',
    description: 'Armadura de anillas metálicas entrelazadas.',
    type: 'armor',
    rarity: 'uncommon',
    level: 10,
    slot: 'chest',
    stats: { defense: 15, health: 50, vitality: 3 },
    stackable: false,
    maxStack: 1,
    sellValue: 80,
  }],
  ['robe_mage', {
    id: 'robe_mage',
    name: 'Túnica de Mago',
    description: 'Una túnica encantada que aumenta el poder mágico.',
    type: 'armor',
    rarity: 'common',
    level: 1,
    slot: 'chest',
    stats: { defense: 2, magicDefense: 8, mana: 30, intelligence: 2 },
    stackable: false,
    maxStack: 1,
    sellValue: 25,
  }],
  ['helmet_iron', {
    id: 'helmet_iron',
    name: 'Casco de Hierro',
    description: 'Un casco resistente de hierro.',
    type: 'armor',
    rarity: 'common',
    level: 5,
    slot: 'head',
    stats: { defense: 5, health: 15 },
    stackable: false,
    maxStack: 1,
    sellValue: 15,
  }],
  ['boots_leather', {
    id: 'boots_leather',
    name: 'Botas de Cuero',
    description: 'Botas cómodas para largas caminatas.',
    type: 'armor',
    rarity: 'common',
    level: 1,
    slot: 'feet',
    stats: { defense: 2, speed: 2 },
    stackable: false,
    maxStack: 1,
    sellValue: 10,
  }],
  
  // Accesorios
  ['ring_power', {
    id: 'ring_power',
    name: 'Anillo de Poder',
    description: 'Un anillo que aumenta la fuerza.',
    type: 'accessory',
    rarity: 'uncommon',
    level: 5,
    slot: 'ring1',
    stats: { strength: 5, attack: 5 },
    stackable: false,
    maxStack: 1,
    sellValue: 50,
  }],
  ['amulet_health', {
    id: 'amulet_health',
    name: 'Amuleto de Vitalidad',
    description: 'Un amuleto que aumenta la salud máxima.',
    type: 'accessory',
    rarity: 'uncommon',
    level: 5,
    slot: 'neck',
    stats: { health: 50, vitality: 3 },
    stackable: false,
    maxStack: 1,
    sellValue: 60,
  }],
  
  // Consumibles
  ['potion_health_small', {
    id: 'potion_health_small',
    name: 'Poción de Salud (Pequeña)',
    description: 'Restaura 50 puntos de salud.',
    type: 'consumable',
    rarity: 'common',
    level: 1,
    stats: { health: 50 },
    stackable: true,
    maxStack: 99,
    sellValue: 5,
  }],
  ['potion_health_medium', {
    id: 'potion_health_medium',
    name: 'Poción de Salud (Media)',
    description: 'Restaura 150 puntos de salud.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 10,
    stats: { health: 150 },
    stackable: true,
    maxStack: 99,
    sellValue: 20,
  }],
  ['potion_mana_small', {
    id: 'potion_mana_small',
    name: 'Poción de Maná (Pequeña)',
    description: 'Restaura 30 puntos de maná.',
    type: 'consumable',
    rarity: 'common',
    level: 1,
    stats: { mana: 30 },
    stackable: true,
    maxStack: 99,
    sellValue: 5,
  }],
  ['potion_mana_medium', {
    id: 'potion_mana_medium',
    name: 'Poción de Maná (Media)',
    description: 'Restaura 100 puntos de maná.',
    type: 'consumable',
    rarity: 'uncommon',
    level: 10,
    stats: { mana: 100 },
    stackable: true,
    maxStack: 99,
    sellValue: 20,
  }],
  
  // Materiales
  ['material_iron_ore', {
    id: 'material_iron_ore',
    name: 'Mineral de Hierro',
    description: 'Mineral bruto utilizado en forja.',
    type: 'material',
    rarity: 'common',
    level: 1,
    stackable: true,
    maxStack: 999,
    sellValue: 2,
  }],
  ['material_leather', {
    id: 'material_leather',
    name: 'Cuero',
    description: 'Cuero curtido de animales.',
    type: 'material',
    rarity: 'common',
    level: 1,
    stackable: true,
    maxStack: 999,
    sellValue: 3,
  }],
  ['material_cloth', {
    id: 'material_cloth',
    name: 'Tela',
    description: 'Tela de buena calidad.',
    type: 'material',
    rarity: 'common',
    level: 1,
    stackable: true,
    maxStack: 999,
    sellValue: 2,
  }],
  ['material_bone', {
    id: 'material_bone',
    name: 'Hueso',
    description: 'Hueso resistente de criaturas.',
    type: 'material',
    rarity: 'common',
    level: 1,
    stackable: true,
    maxStack: 999,
    sellValue: 1,
  }],
  ['material_magic_essence', {
    id: 'material_magic_essence',
    name: 'Esencia Mágica',
    description: 'Esencia concentrada de energía mágica.',
    type: 'material',
    rarity: 'uncommon',
    level: 5,
    stackable: true,
    maxStack: 999,
    sellValue: 15,
  }],
  
  // Gemas
  ['gem_ruby', {
    id: 'gem_ruby',
    name: 'Rubí',
    description: 'Una gema roja brillante.',
    type: 'gem',
    rarity: 'rare',
    level: 1,
    stackable: true,
    maxStack: 99,
    sellValue: 100,
  }],
  ['gem_sapphire', {
    id: 'gem_sapphire',
    name: 'Zafiro',
    description: 'Una gema azul brillante.',
    type: 'gem',
    rarity: 'rare',
    level: 1,
    stackable: true,
    maxStack: 99,
    sellValue: 100,
  }],
]);

// ============================================================
// TABLAS DE LOOT
// ============================================================

const LOOT_TABLES: Map<string, LootTable> = new Map([
  ['loot_goblin', {
    id: 'loot_goblin',
    entries: [
      { itemId: 'material_cloth', weight: 40, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'potion_health_small', weight: 20, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'sword_iron', weight: 5, minQuantity: 1, maxQuantity: 1, minLevel: 1 },
    ],
    goldRange: [3, 10],
    dropChance: 0.6,
  }],
  ['loot_undead', {
    id: 'loot_undead',
    entries: [
      { itemId: 'material_bone', weight: 50, minQuantity: 1, maxQuantity: 5 },
      { itemId: 'potion_health_small', weight: 15, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'helmet_iron', weight: 3, minQuantity: 1, maxQuantity: 1, minLevel: 5 },
    ],
    goldRange: [5, 15],
    dropChance: 0.5,
  }],
  ['loot_orc', {
    id: 'loot_orc',
    entries: [
      { itemId: 'material_leather', weight: 40, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'sword_iron', weight: 10, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'sword_steel', weight: 3, minQuantity: 1, maxQuantity: 1, minLevel: 10 },
      { itemId: 'potion_health_small', weight: 20, minQuantity: 1, maxQuantity: 2 },
    ],
    goldRange: [10, 30],
    dropChance: 0.7,
  }],
  ['loot_beast', {
    id: 'loot_beast',
    entries: [
      { itemId: 'material_leather', weight: 60, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'material_bone', weight: 30, minQuantity: 1, maxQuantity: 2 },
    ],
    goldRange: [1, 5],
    dropChance: 0.4,
  }],
  ['loot_spider', {
    id: 'loot_spider',
    entries: [
      { itemId: 'material_cloth', weight: 40, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'potion_health_small', weight: 15, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'material_magic_essence', weight: 10, minQuantity: 1, maxQuantity: 1, minLevel: 5 },
    ],
    goldRange: [5, 20],
    dropChance: 0.5,
  }],
  ['loot_elemental', {
    id: 'loot_elemental',
    entries: [
      { itemId: 'material_magic_essence', weight: 50, minQuantity: 2, maxQuantity: 5 },
      { itemId: 'gem_ruby', weight: 5, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'gem_sapphire', weight: 5, minQuantity: 1, maxQuantity: 1 },
    ],
    goldRange: [20, 50],
    dropChance: 0.8,
  }],
  ['loot_dragon', {
    id: 'loot_dragon',
    entries: [
      { itemId: 'material_magic_essence', weight: 30, minQuantity: 5, maxQuantity: 10 },
      { itemId: 'gem_ruby', weight: 20, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'gem_sapphire', weight: 20, minQuantity: 1, maxQuantity: 3 },
    ],
    guaranteedDrops: ['material_magic_essence'],
    goldRange: [100, 300],
    dropChance: 1.0,
  }],
  ['loot_boss_goblin', {
    id: 'loot_boss_goblin',
    entries: [
      { itemId: 'sword_steel', weight: 30, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'armor_chainmail', weight: 20, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'ring_power', weight: 15, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'potion_health_medium', weight: 40, minQuantity: 2, maxQuantity: 5 },
      { itemId: 'gem_ruby', weight: 10, minQuantity: 1, maxQuantity: 2 },
    ],
    guaranteedDrops: ['potion_health_medium'],
    goldRange: [150, 400],
    dropChance: 1.0,
  }],
]);

// ============================================================
// FUNCIONES DE LOOT
// ============================================================

/**
 * Obtiene un item de la base de datos
 */
export function getItemDef(itemId: string): ItemDef | null {
  return ITEM_DATABASE.get(itemId) ?? null;
}

/**
 * Obtiene una tabla de loot
 */
export function getLootTable(tableId: string): LootTable | null {
  return LOOT_TABLES.get(tableId) ?? null;
}

/**
 * Selecciona una rareza aleatoria basada en luck
 */
export function rollRarity(luck: number = 0): ItemRarity {
  const luckBonus = Math.min(luck * 0.1, 20); // Max 20% bonus
  
  const adjustedWeights: Record<ItemRarity, number> = {
    common: Math.max(RARITY_WEIGHTS.common - luckBonus, 20),
    uncommon: RARITY_WEIGHTS.uncommon + luckBonus * 0.3,
    rare: RARITY_WEIGHTS.rare + luckBonus * 0.4,
    epic: RARITY_WEIGHTS.epic + luckBonus * 0.2,
    legendary: RARITY_WEIGHTS.legendary + luckBonus * 0.1,
  };
  
  const total = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  
  for (const [rarity, weight] of Object.entries(adjustedWeights)) {
    roll -= weight;
    if (roll <= 0) {
      return rarity as ItemRarity;
    }
  }
  
  return 'common';
}

/**
 * Genera loot de una tabla
 */
export function generateLoot(
  tableId: string,
  playerLevel: number,
  options: {
    luck?: number;
    lootMultiplier?: number;
    goldMultiplier?: number;
  } = {}
): LootDrop {
  const { luck = 0, lootMultiplier = 1.0, goldMultiplier = 1.0 } = options;
  
  const table = getLootTable(tableId);
  if (!table) {
    console.warn(`Loot table not found: ${tableId}`);
    return { items: [], gold: 0, experience: 0 };
  }
  
  const items: LootItem[] = [];
  
  // Drops garantizados
  if (table.guaranteedDrops) {
    for (const itemId of table.guaranteedDrops) {
      const itemDef = getItemDef(itemId);
      if (itemDef) {
        items.push({
          itemId,
          quantity: 1,
          item: itemDef,
        });
      }
    }
  }
  
  // Calcular número de drops
  const baseDrops = Math.random() < table.dropChance ? 1 : 0;
  const bonusDrops = luck > 20 ? Math.floor(Math.random() * 2) : 0;
  const totalDrops = Math.floor((baseDrops + bonusDrops) * lootMultiplier);
  
  // Seleccionar items
  const eligibleEntries = table.entries.filter(
    entry => !entry.minLevel || playerLevel >= entry.minLevel
  );
  
  if (eligibleEntries.length > 0 && totalDrops > 0) {
    const totalWeight = eligibleEntries.reduce((sum, entry) => sum + entry.weight, 0);
    
    for (let i = 0; i < totalDrops; i++) {
      let roll = Math.random() * totalWeight;
      
      for (const entry of eligibleEntries) {
        roll -= entry.weight;
        if (roll <= 0) {
          const itemDef = getItemDef(entry.itemId);
          if (itemDef) {
            const quantity = Math.floor(
              entry.minQuantity + Math.random() * (entry.maxQuantity - entry.minQuantity + 1)
            );
            
            // Buscar si ya existe el item
            const existing = items.find(i => i.itemId === entry.itemId);
            if (existing && itemDef.stackable) {
              existing.quantity = Math.min(existing.quantity + quantity, itemDef.maxStack);
            } else {
              items.push({
                itemId: entry.itemId,
                quantity,
                item: itemDef,
              });
            }
          }
          break;
        }
      }
    }
  }
  
  // Calcular oro
  const [minGold, maxGold] = table.goldRange;
  const baseGold = Math.floor(minGold + Math.random() * (maxGold - minGold + 1));
  const luckGoldBonus = 1 + luck * 0.01;
  const gold = Math.floor(baseGold * goldMultiplier * luckGoldBonus);
  
  return { items, gold, experience: 0 };
}

/**
 * Escala stats de un item según su rareza
 */
export function scaleItemStats(item: ItemDef, targetRarity: ItemRarity): ItemDef {
  if (!item.stats) return item;
  
  const multiplier = RARITY_STAT_MULTIPLIERS[targetRarity];
  const scaledStats: ItemStats = {};
  
  for (const [key, value] of Object.entries(item.stats)) {
    if (typeof value === 'number') {
      scaledStats[key as keyof ItemStats] = Math.floor(value * multiplier);
    }
  }
  
  return {
    ...item,
    rarity: targetRarity,
    stats: scaledStats,
    sellValue: Math.floor(item.sellValue * RARITY_GOLD_MULTIPLIERS[targetRarity]),
    name: `${item.name} (${targetRarity})`,
  };
}

/**
 * Obtiene el valor de venta total del loot
 */
export function calculateLootValue(loot: LootDrop): number {
  let total = loot.gold;
  
  for (const item of loot.items) {
    total += item.item.sellValue * item.quantity;
  }
  
  return total;
}

/**
 * Registra un nuevo item en la base de datos
 */
export function registerItem(item: ItemDef): void {
  ITEM_DATABASE.set(item.id, item);
}

/**
 * Registra una nueva tabla de loot
 */
export function registerLootTable(table: LootTable): void {
  LOOT_TABLES.set(table.id, table);
}

/**
 * Obtiene todos los items por tipo
 */
export function getItemsByType(type: ItemType): ItemDef[] {
  const items: ItemDef[] = [];
  ITEM_DATABASE.forEach(item => {
    if (item.type === type) {
      items.push(item);
    }
  });
  return items;
}

/**
 * Obtiene todos los items por rareza
 */
export function getItemsByRarity(rarity: ItemRarity): ItemDef[] {
  const items: ItemDef[] = [];
  ITEM_DATABASE.forEach(item => {
    if (item.rarity === rarity) {
      items.push(item);
    }
  });
  return items;
}
