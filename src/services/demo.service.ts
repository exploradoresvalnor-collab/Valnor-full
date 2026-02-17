/**
 * Demo Service - Datos mock para modo invitado
 *
 * Proporciona datos básicos para que los invitados puedan jugar
 * sin necesidad de cuenta. Los datos se almacenan temporalmente
 * en localStorage durante la sesión.
 */

import type { CharacterData, EquipmentItem, ConsumableItem } from '../types';

// ============================================================
// DATOS DEMO PARA INVITADOS
// ============================================================

/** Personajes demo disponibles para invitados */
export const DEMO_CHARACTERS: CharacterData[] = [
  {
    id: 'demo-warrior-1',
    name: 'Guerrero Demo',
    class: 'warrior',
    level: 1,
    stats: {
      strength: 15, dexterity: 8, intelligence: 5, vitality: 14, luck: 8,
      attack: 20, defense: 15, magicAttack: 5, magicDefense: 8, speed: 8,
      critRate: 5, critDamage: 150,
    },
    equipment: {
      weapon: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      accessory1: null,
      accessory2: null,
    },
    appearance: {
      skinColor: 0,
      hairStyle: 0,
      hairColor: 1,
      faceStyle: 0,
      bodyType: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-mage-1',
    name: 'Mago Demo',
    class: 'mage',
    level: 1,
    stats: {
      strength: 5, dexterity: 8, intelligence: 15, vitality: 10, luck: 12,
      attack: 5, defense: 8, magicAttack: 20, magicDefense: 12, speed: 10,
      critRate: 3, critDamage: 180,
    },
    equipment: {
      weapon: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      accessory1: null,
      accessory2: null,
    },
    appearance: {
      skinColor: 1,
      hairStyle: 1,
      hairColor: 0,
      faceStyle: 1,
      bodyType: 1,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-archer-1',
    name: 'Arquero Demo',
    class: 'archer',
    level: 1,
    stats: {
      strength: 10, dexterity: 15, intelligence: 8, vitality: 12, luck: 10,
      attack: 18, defense: 10, magicAttack: 8, magicDefense: 10, speed: 15,
      critRate: 12, critDamage: 160,
    },
    equipment: {
      weapon: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      accessory1: null,
      accessory2: null,
    },
    appearance: {
      skinColor: 2,
      hairStyle: 2,
      hairColor: 2,
      faceStyle: 2,
      bodyType: 2,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/** Items de equipamiento demo */
export const DEMO_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'demo-sword-1',
    nombre: 'Espada de Entrenamiento',
    tipo: 'weapon',
    rareza: 'common',
    descripcion: 'Una espada básica para principiantes.',
    stats: { ataque: 5, critico: 2 },
    precio: 0,
    nivel: 1,
    icono: '/icons/items/sword-basic.svg',
    equipado: false,
    slot: 'weapon',
    mejoras: 0,
    maxMejoras: 5,
  },
  {
    id: 'demo-bow-1',
    nombre: 'Arco de Madera',
    tipo: 'weapon',
    rareza: 'common',
    descripcion: 'Un arco simple hecho de madera.',
    stats: { ataque: 4, velocidad: 2 },
    precio: 0,
    nivel: 1,
    icono: '/icons/items/bow-basic.svg',
    equipado: false,
    slot: 'weapon',
    mejoras: 0,
    maxMejoras: 5,
  },
  {
    id: 'demo-staff-1',
    nombre: 'Bastón de Aprendiz',
    tipo: 'weapon',
    rareza: 'common',
    descripcion: 'Un bastón mágico para estudiantes.',
    stats: { ataque: 6, critico: 2 },
    precio: 0,
    nivel: 1,
    icono: '/icons/items/staff-basic.svg',
    equipado: false,
    slot: 'weapon',
    mejoras: 0,
    maxMejoras: 5,
  },
  {
    id: 'demo-armor-1',
    nombre: 'Armadura de Cuero',
    tipo: 'armor',
    rareza: 'common',
    descripcion: 'Protección básica de cuero.',
    stats: { defensa: 3, hp: 1 },
    precio: 0,
    nivel: 1,
    icono: '/icons/items/armor-leather.svg',
    equipado: false,
    slot: 'armor',
    mejoras: 0,
    maxMejoras: 5,
  },
];

/** Consumibles demo */
export const DEMO_CONSUMABLES: ConsumableItem[] = [
  {
    id: 'demo-potion-1',
    nombre: 'Poción de Salud',
    descripcion: 'Restaura 50 HP.',
    tipo: 'consumable',
    rareza: 'common',
    nivel: 1,
    stats: {},
    precio: 0,
    cantidad: 5,
    efecto: 'Restaura 50 HP',
  },
  {
    id: 'demo-potion-2',
    nombre: 'Poción de Mana',
    descripcion: 'Restaura 30 MP.',
    tipo: 'consumable',
    rareza: 'common',
    nivel: 1,
    stats: {},
    precio: 0,
    cantidad: 3,
    efecto: 'Restaura 30 MP',
  },
];

// ============================================================
// FUNCIONES DE GESTIÓN DE DATOS DEMO
// ============================================================

const DEMO_STORAGE_KEY = 'valnor-demo-data';

/** Estructura de datos demo en localStorage */
interface DemoStorageData {
  characters: CharacterData[];
  equipment: EquipmentItem[];
  consumables: ConsumableItem[];
  lastUpdated: string;
}

/** Obtener datos demo del localStorage */
function getDemoData(): DemoStorageData {
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Error loading demo data:', error);
  }

  // Datos iniciales por defecto
  return {
    characters: [...DEMO_CHARACTERS],
    equipment: [...DEMO_EQUIPMENT],
    consumables: [...DEMO_CONSUMABLES],
    lastUpdated: new Date().toISOString(),
  };
}

/** Guardar datos demo en localStorage */
function saveDemoData(data: DemoStorageData): void {
  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving demo data:', error);
  }
}

/** Limpiar datos demo (al cambiar de modo o logout) */
export function clearDemoData(): void {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch (error) {
    console.warn('Error clearing demo data:', error);
  }
}

// ============================================================
// API SIMULADA PARA SERVICIOS
// ============================================================

/** Simular respuesta de personajes para invitados */
export function getDemoCharacters(): CharacterData[] {
  const data = getDemoData();
  return data.characters;
}

/** Simular respuesta de inventario para invitados */
export function getDemoInventory(): { equipment: EquipmentItem[]; consumables: ConsumableItem[] } {
  const data = getDemoData();
  return {
    equipment: data.equipment,
    consumables: data.consumables,
  };
}

/** Actualizar personaje demo (equipar/desequipar) */
export function updateDemoCharacter(characterId: string, updates: Partial<CharacterData>): void {
  const data = getDemoData();
  const index = data.characters.findIndex(c => c.id === characterId);
  if (index !== -1) {
    data.characters[index] = { ...data.characters[index], ...updates };
    saveDemoData(data);
  }
}

/** Agregar item al inventario demo */
export function addDemoItem(item: EquipmentItem | ConsumableItem): void {
  const data = getDemoData();
  if ('effect' in item) {
    // Es consumible
    data.consumables.push(item as ConsumableItem);
  } else {
    // Es equipamiento
    data.equipment.push(item as EquipmentItem);
  }
  saveDemoData(data);
}