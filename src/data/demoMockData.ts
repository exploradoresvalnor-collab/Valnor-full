import type { TeamMember } from '../stores/teamStore';
import type { EquipmentItem, ConsumableItem } from '../types/item.types';

// Personajes demo — usar personajeId que existe en CHARACTER_MODEL_MAP para que
// CharacterModel3D los renderice sin problema (ej: 'sir-nocturno', 'vision-espectral')
export const DEMO_CHARACTERS: TeamMember[] = [
  {
    id: 'sir-nocturno',
    name: 'Sir Nocturno',
    level: 25,
    class: 'warrior',
    rarity: 'epic',
    stats: { attack: 180, defense: 220, health: 1600, speed: 10 },
    isLeader: true,
  },
  {
    id: 'vision-espectral',
    name: 'Visión Espectral',
    level: 24,
    class: 'archer',
    rarity: 'legendary',
    stats: { attack: 240, defense: 90, health: 900, speed: 18 },
  },
  {
    id: 'arcanis',
    name: 'Arcanis',
    level: 23,
    class: 'mage',
    rarity: 'rare',
    stats: { attack: 200, defense: 110, health: 1050, speed: 12 },
  },
];

// Equipamiento demo — objetos completos (InventorySummary y Inventory los muestran)
export const DEMO_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'demo-weap-1',
    nombre: 'Espada del Exilio',
    descripcion: 'Espada demo con gran ataque.',
    tipo: 'weapon',
    rareza: 'epic',
    nivel: 20,
    stats: { ataque: 120, critico: 15 },
    precio: 5000,
    equipado: false,
    slot: 'weapon',
    mejoras: 3,
    maxMejoras: 5,
  },
  {
    id: 'demo-armor-1',
    nombre: 'Peto de Mithril',
    descripcion: 'Armadura demo resistente.',
    tipo: 'armor',
    rareza: 'legendary',
    nivel: 25,
    stats: { defensa: 250, hp: 500 },
    precio: 10000,
    equipado: false,
    slot: 'armor',
    mejoras: 5,
    maxMejoras: 5,
  },
];

// Consumibles demo
export const DEMO_CONSUMABLES: ConsumableItem[] = [
  {
    id: 'demo-pot-1',
    nombre: 'Poción de Vida Mayor',
    descripcion: 'Restaura 1000 HP al instante.',
    tipo: 'consumable',
    rareza: 'rare',
    nivel: 10,
    stats: {},
    precio: 200,
    cantidad: 15,
    efecto: 'heal_1000',
  },
  {
    id: 'demo-pot-2',
    nombre: 'Elixir de Maná',
    descripcion: 'Restaura 500 MP.',
    tipo: 'consumable',
    rareza: 'uncommon',
    nivel: 5,
    stats: {},
    precio: 100,
    cantidad: 5,
    efecto: 'mana_500',
  },
];
