/**
 * Character Registry - Registro y gestión de personajes
 */

import type { CharacterClass, CharacterStats } from '../../../types';
import { Character, type CharacterConfig } from '../Character';

// ============================================================
// TIPOS
// ============================================================

export interface CharacterTemplate {
  id: string;
  name: string;
  displayName: string;
  characterClass: CharacterClass;
  description: string;
  baseStats: CharacterStats;
  startingAbilities: string[];
  icon?: string;
  modelId?: string;
  color?: string;
}

export interface CharacterPreset {
  templateId: string;
  customName?: string;
  startingLevel?: number;
  bonusStats?: Partial<CharacterStats>;
}

// ============================================================
// TEMPLATES DE PERSONAJES
// ============================================================

const CHARACTER_TEMPLATES: Map<string, CharacterTemplate> = new Map([
  ['warrior_default', {
    id: 'warrior_default',
    name: 'warrior',
    displayName: 'Guerrero',
    characterClass: 'warrior',
    description: 'Un maestro del combate cuerpo a cuerpo con alta defensa y fuerza.',
    baseStats: {
      strength: 15, dexterity: 10, intelligence: 8, vitality: 14, luck: 8,
      attack: 15, defense: 12, magicAttack: 5, magicDefense: 8, speed: 10,
      critRate: 8, critDamage: 150,
    },
    startingAbilities: ['slash', 'shield_bash'],
    color: '#cc3333',
  }],
  
  ['mage_default', {
    id: 'mage_default',
    name: 'mage',
    displayName: 'Mago',
    characterClass: 'mage',
    description: 'Domina las artes arcanas con poderosos hechizos devastadores.',
    baseStats: {
      strength: 6, dexterity: 8, intelligence: 18, vitality: 8, luck: 10,
      attack: 5, defense: 6, magicAttack: 18, magicDefense: 12, speed: 8,
      critRate: 10, critDamage: 160,
    },
    startingAbilities: ['magic_missile', 'fireball'],
    color: '#3366cc',
  }],
  
  ['rogue_default', {
    id: 'rogue_default',
    name: 'rogue',
    displayName: 'Pícaro',
    characterClass: 'rogue',
    description: 'Ágil y letal, especialista en ataques críticos desde las sombras.',
    baseStats: {
      strength: 10, dexterity: 18, intelligence: 10, vitality: 8, luck: 14,
      attack: 12, defense: 6, magicAttack: 8, magicDefense: 6, speed: 15,
      critRate: 18, critDamage: 180,
    },
    startingAbilities: ['backstab', 'poison_blade'],
    color: '#9933cc',
  }],
  
  ['archer_default', {
    id: 'archer_default',
    name: 'archer',
    displayName: 'Arquero',
    characterClass: 'archer',
    description: 'Maestro del arco con precisión mortal a larga distancia.',
    baseStats: {
      strength: 10, dexterity: 16, intelligence: 10, vitality: 10, luck: 12,
      attack: 14, defense: 8, magicAttack: 8, magicDefense: 8, speed: 12,
      critRate: 15, critDamage: 170,
    },
    startingAbilities: ['aimed_shot', 'rapid_fire'],
    color: '#33cc33',
  }],
  
  ['paladin_default', {
    id: 'paladin_default',
    name: 'paladin',
    displayName: 'Paladín',
    characterClass: 'paladin',
    description: 'Caballero sagrado que combina fuerza física con magia divina.',
    baseStats: {
      strength: 14, dexterity: 8, intelligence: 12, vitality: 14, luck: 8,
      attack: 12, defense: 14, magicAttack: 10, magicDefense: 12, speed: 8,
      critRate: 8, critDamage: 150,
    },
    startingAbilities: ['holy_strike', 'heal'],
    color: '#ffcc00',
  }],
  
  ['necromancer_default', {
    id: 'necromancer_default',
    name: 'necromancer',
    displayName: 'Nigromante',
    characterClass: 'necromancer',
    description: 'Maestro de las artes oscuras que invoca a los muertos.',
    baseStats: {
      strength: 6, dexterity: 8, intelligence: 18, vitality: 10, luck: 12,
      attack: 5, defense: 8, magicAttack: 16, magicDefense: 14, speed: 8,
      critRate: 12, critDamage: 160,
    },
    startingAbilities: ['shadow_bolt', 'raise_skeleton'],
    color: '#663399',
  }],
  
  ['berserker_default', {
    id: 'berserker_default',
    name: 'berserker',
    displayName: 'Berserker',
    characterClass: 'berserker',
    description: 'Guerrero salvaje que sacrifica defensa por poder destructivo.',
    baseStats: {
      strength: 20, dexterity: 12, intelligence: 4, vitality: 12, luck: 8,
      attack: 20, defense: 6, magicAttack: 3, magicDefense: 4, speed: 12,
      critRate: 15, critDamage: 180,
    },
    startingAbilities: ['savage_strike', 'battle_rage'],
    color: '#cc6600',
  }],
  
  ['monk_default', {
    id: 'monk_default',
    name: 'monk',
    displayName: 'Monje',
    characterClass: 'monk',
    description: 'Artista marcial que usa chi para potenciar sus ataques.',
    baseStats: {
      strength: 12, dexterity: 14, intelligence: 12, vitality: 12, luck: 10,
      attack: 12, defense: 10, magicAttack: 10, magicDefense: 12, speed: 14,
      critRate: 12, critDamage: 160,
    },
    startingAbilities: ['palm_strike', 'meditate'],
    color: '#00cccc',
  }],
]);

// ============================================================
// CLASE REGISTRY
// ============================================================

class CharacterRegistry {
  private static instance: CharacterRegistry;
  private customTemplates: Map<string, CharacterTemplate> = new Map();
  private activeCharacters: Map<string, Character> = new Map();
  
  private constructor() {}
  
  static getInstance(): CharacterRegistry {
    if (!CharacterRegistry.instance) {
      CharacterRegistry.instance = new CharacterRegistry();
    }
    return CharacterRegistry.instance;
  }
  
  // ============================================================
  // TEMPLATES
  // ============================================================
  
  /**
   * Obtiene un template por ID
   */
  getTemplate(templateId: string): CharacterTemplate | null {
    return CHARACTER_TEMPLATES.get(templateId) ?? this.customTemplates.get(templateId) ?? null;
  }
  
  /**
   * Obtiene template por clase
   */
  getTemplateByClass(characterClass: CharacterClass): CharacterTemplate | null {
    const defaultId = `${characterClass}_default`;
    return this.getTemplate(defaultId);
  }
  
  /**
   * Obtiene todos los templates disponibles
   */
  getAllTemplates(): CharacterTemplate[] {
    const all: CharacterTemplate[] = [];
    CHARACTER_TEMPLATES.forEach(t => all.push(t));
    this.customTemplates.forEach(t => all.push(t));
    return all;
  }
  
  /**
   * Registra un template personalizado
   */
  registerTemplate(template: CharacterTemplate): void {
    this.customTemplates.set(template.id, template);
  }
  
  /**
   * Elimina un template personalizado
   */
  unregisterTemplate(templateId: string): boolean {
    return this.customTemplates.delete(templateId);
  }
  
  // ============================================================
  // CREACIÓN DE PERSONAJES
  // ============================================================
  
  /**
   * Crea un personaje desde un template
   */
  createFromTemplate(templateId: string, playerName: string, options?: {
    level?: number;
    bonusStats?: Partial<CharacterStats>;
  }): Character | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;
    
    // Combinar stats base con bonus
    const finalStats = { ...template.baseStats };
    if (options?.bonusStats) {
      Object.entries(options.bonusStats).forEach(([key, value]) => {
        if (value !== undefined && key in finalStats) {
          (finalStats as Record<string, number>)[key] += value;
        }
      });
    }
    
    const config: CharacterConfig = {
      name: playerName,
      characterClass: template.characterClass,
      baseStats: finalStats,
      level: options?.level ?? 1,
    };
    
    return new Character(config);
  }
  
  /**
   * Crea un personaje desde un preset
   */
  createFromPreset(preset: CharacterPreset, playerName?: string): Character | null {
    return this.createFromTemplate(preset.templateId, playerName ?? 'Hero', {
      level: preset.startingLevel,
      bonusStats: preset.bonusStats,
    });
  }
  
  /**
   * Crea un personaje rápido para testing
   */
  createQuickCharacter(characterClass: CharacterClass, level: number = 1): Character | null {
    const templateId = `${characterClass}_default`;
    return this.createFromTemplate(templateId, 'TestHero', { level });
  }
  
  // ============================================================
  // GESTIÓN DE PERSONAJES ACTIVOS
  // ============================================================
  
  /**
   * Registra un personaje activo
   */
  registerCharacter(character: Character): void {
    this.activeCharacters.set(character.id, character);
  }
  
  /**
   * Obtiene un personaje por ID
   */
  getCharacter(id: string): Character | null {
    return this.activeCharacters.get(id) ?? null;
  }
  
  /**
   * Elimina un personaje del registro
   */
  unregisterCharacter(id: string): boolean {
    return this.activeCharacters.delete(id);
  }
  
  /**
   * Obtiene todos los personajes activos
   */
  getAllCharacters(): Character[] {
    return Array.from(this.activeCharacters.values());
  }
  
  /**
   * Actualiza todos los personajes activos
   */
  updateAll(deltaTime: number): void {
    this.activeCharacters.forEach(character => {
      character.update(deltaTime);
    });
  }
  
  /**
   * Limpia todos los personajes activos
   */
  clearAll(): void {
    this.activeCharacters.clear();
  }
}

// ============================================================
// EXPORTS
// ============================================================

export const characterRegistry = CharacterRegistry.getInstance();

// Funciones de conveniencia
export const getCharacterTemplate = (id: string) => 
  characterRegistry.getTemplate(id);

export const getCharacterTemplateByClass = (cls: CharacterClass) => 
  characterRegistry.getTemplateByClass(cls);

export const getAllCharacterTemplates = () => 
  characterRegistry.getAllTemplates();

export const createCharacter = (templateId: string, name: string, level?: number) =>
  characterRegistry.createFromTemplate(templateId, name, { level });

export const createQuickCharacter = (cls: CharacterClass, level?: number) =>
  characterRegistry.createQuickCharacter(cls, level);
