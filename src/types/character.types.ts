/**
 * Character Types - Tipos de personajes y stats
 */

// Clases de personaje disponibles
export type CharacterClass = 
  | 'warrior'
  | 'mage'
  | 'rogue'
  | 'archer'
  | 'paladin'
  | 'necromancer'
  | 'berserker'
  | 'monk'
  | 'healer';

// Stats base de un personaje
export interface CharacterStats {
  strength: number;      // Fuerza física
  dexterity: number;     // Destreza/Agilidad
  intelligence: number;  // Inteligencia/Magia
  vitality: number;      // Vitalidad/HP
  luck: number;          // Suerte (críticos, drops)
  
  // Stats derivados
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  speed: number;
  critRate: number;      // Porcentaje (0-100)
  critDamage: number;    // Porcentaje (100 = 1x, 200 = 2x)
}

// Equipamiento del personaje
export interface Equipment {
  weapon: string | null;
  helmet: string | null;
  armor: string | null;
  gloves: string | null;
  boots: string | null;
  accessory1: string | null;
  accessory2: string | null;
}

// Alias para compatibilidad
export type CharacterEquipment = Equipment;

export interface CharacterAppearance {
  skinColor: number;
  hairStyle: number;
  hairColor: number;
  faceStyle: number;
  bodyType: number;
}

// Para crear un nuevo personaje
export interface CreateCharacterDTO {
  name: string;
  class: CharacterClass;
  appearance: CharacterAppearance;
}

// Para actualizar personaje
export interface UpdateCharacterDTO {
  name?: string;
  equipment?: Partial<CharacterEquipment>;
  appearance?: Partial<CharacterAppearance>;
}

// Datos de personaje para serialización/API
export interface CharacterData {
  id: string;
  name: string;
  class: CharacterClass;
  level: number;
  stats: CharacterStats;
  equipment: CharacterEquipment;
  appearance: CharacterAppearance;
  createdAt?: string;
  updatedAt?: string;
}

// Respuesta del servidor
export interface CharacterResponse {
  success: boolean;
  character?: CharacterData;
  characters?: CharacterData[];
  message?: string;
}

// Configuración de clase (stats iniciales, habilidades)
export interface ClassConfig {
  class: CharacterClass;
  displayName: string;
  description: string;
  baseStats: CharacterStats;
  primaryStat: keyof CharacterStats;
  abilities: string[];
  modelPath: string;
  iconPath: string;
}

// Mapa de configuración de clases
export const CLASS_CONFIGS: Record<CharacterClass, ClassConfig> = {
  warrior: {
    class: 'warrior',
    displayName: 'Guerrero',
    description: 'Maestro del combate cuerpo a cuerpo con alta defensa.',
    baseStats: {
      strength: 15, dexterity: 8, intelligence: 5, vitality: 14, luck: 8,
      attack: 20, defense: 15, magicAttack: 5, magicDefense: 8, speed: 8,
      critRate: 5, critDamage: 150,
    },
    primaryStat: 'strength',
    abilities: ['slash', 'shield_bash', 'battle_cry'],
    modelPath: '/assets/models/characters/Character Soldier.glb',
    iconPath: '/icons/classes/warrior.svg',
  },
  mage: {
    class: 'mage',
    displayName: 'Mago',
    description: 'Domina las artes arcanas con poderosos hechizos.',
    baseStats: {
      strength: 5, dexterity: 8, intelligence: 16, vitality: 8, luck: 10,
      attack: 8, defense: 6, magicAttack: 25, magicDefense: 15, speed: 10,
      critRate: 8, critDamage: 180,
    },
    primaryStat: 'intelligence',
    abilities: ['fireball', 'ice_spike', 'arcane_shield'],
    modelPath: '/assets/models/characters/Characters_Sam.gltf',
    iconPath: '/icons/classes/mage.svg',
  },
  rogue: {
    class: 'rogue',
    displayName: 'Pícaro',
    description: 'Ataca desde las sombras con velocidad letal.',
    baseStats: {
      strength: 10, dexterity: 16, intelligence: 8, vitality: 8, luck: 12,
      attack: 18, defense: 8, magicAttack: 8, magicDefense: 8, speed: 15,
      critRate: 15, critDamage: 200,
    },
    primaryStat: 'dexterity',
    abilities: ['backstab', 'smoke_bomb', 'poison_blade'],
    modelPath: '/assets/models/characters/Characters_Shaun.gltf',
    iconPath: '/icons/classes/rogue.svg',
  },
  archer: {
    class: 'archer',
    displayName: 'Arquero',
    description: 'Experto en combate a distancia con precisión mortal.',
    baseStats: {
      strength: 8, dexterity: 15, intelligence: 8, vitality: 10, luck: 12,
      attack: 16, defense: 8, magicAttack: 10, magicDefense: 8, speed: 14,
      critRate: 12, critDamage: 180,
    },
    primaryStat: 'dexterity',
    abilities: ['aimed_shot', 'multishot', 'evasion'],
    modelPath: '/assets/models/characters/Characters_Lis.gltf',
    iconPath: '/icons/classes/archer.svg',
  },
  paladin: {
    class: 'paladin',
    displayName: 'Paladín',
    description: 'Guerrero sagrado con habilidades de curación.',
    baseStats: {
      strength: 12, dexterity: 8, intelligence: 12, vitality: 14, luck: 8,
      attack: 15, defense: 14, magicAttack: 12, magicDefense: 14, speed: 8,
      critRate: 6, critDamage: 150,
    },
    primaryStat: 'vitality',
    abilities: ['holy_strike', 'divine_shield', 'heal'],
    modelPath: '/assets/models/characters/Caballero root.gltf',
    iconPath: '/icons/classes/paladin.svg',
  },
  necromancer: {
    class: 'necromancer',
    displayName: 'Nigromante',
    description: 'Invoca a los muertos y drena la vida de sus enemigos.',
    baseStats: {
      strength: 6, dexterity: 8, intelligence: 15, vitality: 10, luck: 10,
      attack: 8, defense: 8, magicAttack: 22, magicDefense: 12, speed: 10,
      critRate: 10, critDamage: 170,
    },
    primaryStat: 'intelligence',
    abilities: ['life_drain', 'summon_skeleton', 'curse'],
    modelPath: '/assets/models/characters/BlueSoldier_Male.gltf',
    iconPath: '/icons/classes/necromancer.svg',
  },
  berserker: {
    class: 'berserker',
    displayName: 'Berserker',
    description: 'Guerrero furioso que sacrifica defensa por poder devastador.',
    baseStats: {
      strength: 18, dexterity: 10, intelligence: 4, vitality: 12, luck: 6,
      attack: 25, defense: 8, magicAttack: 4, magicDefense: 6, speed: 12,
      critRate: 15, critDamage: 200,
    },
    primaryStat: 'strength',
    abilities: ['rage', 'whirlwind', 'bloodlust'],
    modelPath: '/assets/models/characters/Character Soldier.glb',
    iconPath: '/icons/classes/berserker.svg',
  },
  monk: {
    class: 'monk',
    displayName: 'Monje',
    description: 'Artista marcial que combina agilidad con poder espiritual.',
    baseStats: {
      strength: 10, dexterity: 14, intelligence: 10, vitality: 12, luck: 10,
      attack: 14, defense: 12, magicAttack: 12, magicDefense: 14, speed: 14,
      critRate: 12, critDamage: 160,
    },
    primaryStat: 'dexterity',
    abilities: ['flurry_of_blows', 'inner_peace', 'chi_blast'],
    modelPath: '/assets/models/characters/Characters_Matt.gltf',
    iconPath: '/icons/classes/monk.svg',
  },
  healer: {
    class: 'healer',
    displayName: 'Sanador',
    description: 'Especialista en curación y protección de aliados.',
    baseStats: {
      strength: 5, dexterity: 8, intelligence: 14, vitality: 12, luck: 12,
      attack: 6, defense: 10, magicAttack: 18, magicDefense: 16, speed: 10,
      critRate: 15, critDamage: 150,
    },
    primaryStat: 'intelligence',
    abilities: ['heal', 'regeneration', 'purify'],
    modelPath: '/assets/models/characters/Characters_Lis.gltf',
    iconPath: '/icons/classes/healer.svg',
  },
};
