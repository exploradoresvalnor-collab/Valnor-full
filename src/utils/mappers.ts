/**
 * Mappers centralizados — Backend (ES) → Frontend (EN)
 *
 * El backend usa campos en español (nombre, nivel, rareza, etc.)
 * El frontend usa campos en inglés (name, level, rarity, etc.)
 * Estas funciones normalizan los datos para evitar repetir
 * `x.nombre || x.name` en 40+ sitios.
 */

// ============================================================
// TIPOS COMPARTIDOS
// ============================================================

export type CharacterClass = 'warrior' | 'mage' | 'archer' | 'paladin' | 'healer' | 'rogue';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

const VALID_CLASSES: CharacterClass[] = ['warrior', 'mage', 'archer', 'paladin', 'healer', 'rogue'];
const VALID_RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

function toClass(raw: string | undefined): CharacterClass {
  const v = (raw || 'warrior').toLowerCase() as CharacterClass;
  return VALID_CLASSES.includes(v) ? v : 'warrior';
}

function toRarity(raw: string | undefined): ItemRarity {
  const v = (raw || 'common').toLowerCase() as ItemRarity;
  return VALID_RARITIES.includes(v) ? v : 'common';
}

// ============================================================
// INTERFACES NORMALIZADAS
// ============================================================

export interface MappedCharacter {
  id: string;
  personajeId: string;
  name: string;
  level: number;
  rank: string;
  class: CharacterClass;
  rarity: ItemRarity;
  stats: MappedStats;
  equipmentCount: number;
  currentHealth: number;
  maxHealth: number;
  state: string;
}

export interface MappedStats {
  attack: number;
  defense: number;
  health: number;
  speed: number;
}

export interface MappedStatsES {
  atk: number;
  vida: number;
  defensa: number;
}

export interface MappedItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'material';
  rarity: string;
  quantity: number;
  description?: string;
}

export interface MappedTeamMember {
  id: string;
  name: string;
  level: number;
  class: CharacterClass;
  rarity: ItemRarity;
  stats: MappedStats;
}

export interface MappedShowcaseCharacter {
  personajeId: string;
  nombre: string;
  nivel: number;
  rango: string;
  clase: string;
  stats?: MappedStatsES;
  equipamientoCount: number;
}

export interface MappedRankingPlayer {
  rank: number;
  username: string;
  level: number;
  class: string;
  score: number;
  avatar?: string;
}

export interface MappedActivity {
  id: number;
  text: string;
  time: string;
  type: string;
}

// ============================================================
// MAPPERS
// ============================================================

/**
 * Normaliza un personaje del backend (ES) al formato interno (EN)
 */
export function mapCharacter(raw: any): MappedCharacter {
  const stats = raw.stats || {};
  return {
    id: raw._id || raw.id || raw.personajeId || '',
    personajeId: raw.personajeId || raw._id || raw.id || '',
    name: raw.nombre || raw.name || raw.personajeId || 'Héroe',
    level: raw.nivel || raw.level || 1,
    rank: raw.rango || raw.rank || 'D',
    class: toClass(raw.clase || raw.class),
    rarity: toRarity(raw.rareza || raw.rarity),
    stats: mapStatsEN(stats),
    equipmentCount: Array.isArray(raw.equipamiento) ? raw.equipamiento.length : 0,
    currentHealth: raw.saludActual ?? 100,
    maxHealth: raw.saludMaxima ?? 100,
    state: raw.estado || 'active',
  };
}

/**
 * Normaliza stats del backend → formato EN (attack, defense, health, speed)
 */
export function mapStatsEN(raw: any): MappedStats {
  return {
    attack: raw.atk || raw.attack || 10,
    defense: raw.defensa || raw.defense || 10,
    health: raw.vida || raw.health || 100,
    speed: raw.speed || raw.velocidad || 10,
  };
}

/**
 * Normaliza stats del backend → formato ES (atk, vida, defensa)
 */
export function mapStatsES(raw: any): MappedStatsES {
  return {
    atk: raw.atk || raw.attack || 0,
    vida: raw.vida || raw.health || 0,
    defensa: raw.defensa || raw.defense || 0,
  };
}

/**
 * Convierte un character raw a formato ShowcaseCharacter (para TeamShowcase3D)
 */
export function mapToShowcase(raw: any): MappedShowcaseCharacter {
  const stats = raw.stats;
  return {
    personajeId: raw.personajeId || raw._id || raw.id || '',
    nombre: raw.nombre || raw.name || raw.personajeId || 'Héroe',
    nivel: raw.nivel || raw.level || 1,
    rango: raw.rango || raw.rank || 'D',
    clase: raw.clase || raw.class || 'warrior',
    stats: stats ? mapStatsES(stats) : undefined,
    equipamientoCount: Array.isArray(raw.equipamiento) ? raw.equipamiento.length : 0,
  };
}

/**
 * Convierte un character raw a TeamMember (para teamStore)
 */
export function mapToTeamMember(raw: any): MappedTeamMember {
  return {
    id: raw.personajeId || raw._id || raw.id || '',
    name: raw.nombre || raw.name || 'Héroe',
    level: raw.nivel || raw.level || 1,
    class: toClass(raw.clase || raw.class),
    rarity: toRarity(raw.rareza || raw.rarity),
    stats: mapStatsEN(raw.stats || {}),
  };
}

/**
 * Mapea un item de inventario del backend al formato normalizado
 */
export function mapInventoryItem(raw: any, fallbackType: 'armor' | 'consumable' = 'armor'): MappedItem {
  if (typeof raw === 'string') {
    return {
      id: raw,
      name: fallbackType === 'consumable' ? 'Consumible' : 'Equipo',
      type: fallbackType,
      rarity: 'common',
      quantity: 1,
    };
  }
  const tipo = raw.tipo || raw.type || '';
  let type: MappedItem['type'] = fallbackType;
  if (tipo === 'arma' || tipo === 'weapon') type = 'weapon';
  else if (tipo === 'armadura' || tipo === 'armor' || tipo === 'escudo' || tipo === 'casco' || tipo === 'botas') type = 'armor';
  else if (tipo === 'consumable' || tipo === 'pocion' || tipo === 'alimento' || tipo === 'pergamino') type = 'consumable';
  else if (tipo === 'material') type = 'material';

  return {
    id: raw._id || raw.id || raw.itemId || '',
    name: raw.nombre || raw.name || (fallbackType === 'consumable' ? 'Consumible' : 'Equipo'),
    type,
    rarity: raw.rareza || raw.rarity || 'common',
    quantity: raw.cantidad || raw.quantity || raw.usos_restantes || 1,
    description: raw.descripcion || raw.description,
  };
}

/**
 * Mapea un jugador de ranking del backend
 */
export function mapRankingPlayer(raw: any, index: number): MappedRankingPlayer {
  return {
    rank: raw.rank || raw.position || raw.posicion || index + 1,
    username: raw.username || raw.nombre || raw.name || 'Jugador',
    level: raw.level || raw.nivel || 1,
    class: raw.class || raw.clase || 'warrior',
    score: raw.score || raw.puntuacion || raw.puntos || 0,
    avatar: raw.avatar,
  };
}

/**
 * Mapea actividad reciente del dashboard
 */
export function mapActivity(raw: any, index: number): MappedActivity {
  return {
    id: raw.id || index + 1,
    text: raw.texto || raw.text || raw.descripcion || 'Actividad',
    time: raw.tiempo || raw.time || raw.fecha || '',
    type: raw.tipo || raw.type || 'combat',
  };
}

// ============================================================
// PODER (POWER) — Fórmula unificada
// ============================================================

/**
 * Calcula el poder de un personaje incluyendo stats de equipamiento.
 * Fórmula: (atk + defensa + floor(vida/10)) de stats base + mismo de cada equipo.
 * Si el personaje tiene equipamiento resuelto con stats, los suma.
 */
export function calcCharacterPower(
  char: { stats?: { atk?: number; defensa?: number; vida?: number; attack?: number; defense?: number; health?: number }; equipamiento?: any[] },
  equipCatalog?: any[]
): number {
  const s = char.stats || {};
  const atk = s.atk ?? s.attack ?? 0;
  const def = s.defensa ?? s.defense ?? 0;
  const vida = s.vida ?? s.health ?? 0;

  let basePower = atk + def + Math.floor(vida / 10);

  // Sumar stats de equipamiento
  if (Array.isArray(char.equipamiento) && char.equipamiento.length > 0) {
    for (const eq of char.equipamiento) {
      // Caso 1: el equipo ya tiene stats inline
      if (eq.stats) {
        basePower += (eq.stats.atk ?? eq.stats.attack ?? 0)
                   + (eq.stats.defensa ?? eq.stats.defense ?? 0)
                   + Math.floor((eq.stats.vida ?? eq.stats.health ?? 0) / 10);
        continue;
      }
      // Caso 2: buscar en catálogo por itemId
      if (equipCatalog && eq.id) {
        const catalogItem = equipCatalog.find((c: any) => c._id === eq.id);
        if (catalogItem?.stats) {
          basePower += (catalogItem.stats.atk ?? 0)
                     + (catalogItem.stats.defensa ?? 0)
                     + Math.floor((catalogItem.stats.vida ?? 0) / 10);
        }
      }
    }
  }

  return basePower;
}

/**
 * Calcula el poder total de un equipo (array de personajes).
 */
export function calcTeamPower(
  characters: any[],
  equipCatalog?: any[]
): number {
  return characters.reduce((sum, c) => sum + calcCharacterPower(c, equipCatalog), 0);
}

/**
 * Obtiene el personaje activo de un array de personajes
 */
export function findActiveCharacter(personajes: any[], activeId?: string): any | null {
  if (!Array.isArray(personajes) || personajes.length === 0) return null;
  if (activeId) {
    const found = personajes.find((p: any) => p.personajeId === activeId);
    if (found) return found;
  }
  return personajes[0];
}
