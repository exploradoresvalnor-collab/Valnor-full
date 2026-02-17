/**
 * Character Models Config
 * 
 * Mapeo entre personajeId del backend y archivos .glb/.gltf en
 * public/assets/models/characters/
 * 
 * Cuando el backend devuelve un personaje con personajeId = "vision-espectral",
 * este config resuelve qué archivo 3D cargar.
 */

// ============================================================
// MAPEO: personajeId (backend) → modelo 3D (archivo)
// ============================================================

export interface CharacterModelConfig {
  /** Ruta al archivo .glb/.gltf relativa a public/ */
  modelPath: string;
  /** Nombre para mostrar */
  displayName: string;
  /** Escala del modelo (ajustar según tamaño real del .glb) */
  scale: number;
  /** Offset vertical para que los pies toquen el suelo */
  yOffset: number;
  /** Nombres de animaciones disponibles en el archivo (depende del .glb) */
  animations?: {
    idle?: string;
    idle2?: string;     // segunda animación de idle (Idle_2, Idle_01, ...)
    walk?: string;
    run?: string;
    sprint?: string;
    jump?: string;
    fall?: string;
    attack?: string;
    attack2?: string;
    slash?: string;     // nombres alternativos para ataques
    death?: string;
    hit?: string;
  }; 
}

/**
 * Mapeo principal: personajeId → modelo 3D
 * 
 * Los personajeId vienen del backend (GET /api/users/me → user.personajes[].personajeId)
 * Los archivos están en public/assets/models/characters/
 */
export const CHARACTER_MODEL_MAP: Record<string, CharacterModelConfig> = {
  'sir-nocturno': {
    modelPath: '/assets/models/characters/Caballero root.gltf',
    displayName: 'Sir Nocturno',
    scale: 1,
    yOffset: 0,
    animations: {
      idle: 'Idle_Sword',
      idle2: 'Idle_Neutral',    // segunda variante de idle disponible en el GLTF
      walk: 'Walk',
      run: 'Run',
      attack: 'Sword_Slash',
      attack2: 'Sword_Slash',   // usar la misma animación como fallback (no hay segunda slash)
      death: 'Death',
      hit: 'HitRecieve',
    },
  },
  'vision-espectral': {
    modelPath: '/assets/models/characters/Characters_Lis.gltf',
    displayName: 'Visión Espectral',
    scale: 1,
    yOffset: 0,
    animations: {
      idle: 'Idle',
      idle2: 'Idle_2',
      walk: 'Walk',
      run: 'Run',
      jump: 'Jump',
      attack: 'Slash',
      death: 'Death',
      hit: 'HitReact',
    },
  },
  'arcanis': {
    modelPath: '/assets/models/characters/Characters_Sam.gltf',
    displayName: 'Arcanis',
    scale: 1,
    yOffset: 0,
    animations: {
      idle: 'Idle',
      idle2: 'Idle_2',
      walk: 'Walk',
      run: 'Run',
      jump: 'Jump',
      attack: 'Slash',
      death: 'Death',
      hit: 'HitReact',
    },
  },
  'draco-igneo': {
    modelPath: '/assets/models/characters/Character Soldier.glb',
    displayName: 'Draco Ígneo',
    scale: 1,
    yOffset: 0,
    animations: {
      idle: 'Idle',
      walk: 'Walk',
      run: 'Run',
      attack: 'SwordSlash',
      death: 'Death',
      hit: 'RecieveHit',
    },
  },
  'tenebris': {
    modelPath: '/assets/models/characters/Characters_Shaun.gltf',
    displayName: 'Tenebris',
    scale: 1,
    yOffset: 0,
    animations: {
      idle: 'Idle',
      idle2: 'Idle_2',
      walk: 'Walk',
      run: 'Run',
      jump: 'Jump',
      attack: 'Slash',
      death: 'Death',
      hit: 'HitReact',
    },
  },
  'fenix-solar': {
    modelPath: '/assets/models/characters/Characters_Matt.gltf',
    displayName: 'Fénix Solar',
    scale: 1,
    yOffset: 0,
    animations: {
      idle: 'Idle',
      idle2: 'Idle_2',
      walk: 'Walk',
      run: 'Run',
      jump: 'Jump',
      attack: 'Slash',
      death: 'Death',
      hit: 'HitReact',
    },
  },
  'leviatan': {
    modelPath: '/assets/models/characters/BlueSoldier_Male.gltf',
    displayName: 'Leviatán',
    scale: 1,
    yOffset: 0,
    animations: {
      idle: 'Idle',
      walk: 'Walk',
      run: 'Run',
      jump: 'Jump',
      attack: 'SwordSlash',
      death: 'Death',
      hit: 'RecieveHit',
    },
  },
  'arbol-caos': {
    modelPath: '/assets/models/characters/Characters_GermanShepherd.gltf',
    displayName: 'Árbol del Caos',
    scale: 1,
    yOffset: 0,
    animations: {
      idle: 'Idle',
      idle2: 'Idle_2',
      walk: 'Walk',
      run: 'Run',
      attack: 'Attack',
      death: 'Death',
      hit: 'HitReact_Left',
    },
  },
};

// ============================================================
// VARIANTES CON ARMA (SingleWeapon) — para modo combate
// ============================================================

export const CHARACTER_WEAPON_VARIANTS: Record<string, string> = {
  'vision-espectral': '/assets/models/characters/Characters_Lis_SingleWeapon.gltf',
  'arcanis': '/assets/models/characters/Characters_Sam_SingleWeapon.gltf',
  'tenebris': '/assets/models/characters/Characters_Shaun_SingleWeapon.gltf',
  'fenix-solar': '/assets/models/characters/Characters_Matt_SingleWeapon.gltf',
};

// ============================================================
// MODELOS EXTRA (no asignados a personajes del backend aún)
// ============================================================
// Disponibles para futuros personajes o NPCs:
//   - Characters_Pug.gltf          → mascota / NPC
//   - Characters Matt.glb          → variante .glb de Matt
//   - Characters Shaun.glb         → variante .glb de Shaun

// ============================================================
// FALLBACK POR CLASE (cuando no se encuentra el personajeId)
// ============================================================

export const CLASS_FALLBACK_MODEL: Record<string, string> = {
  warrior: '/assets/models/characters/Character Soldier.glb',
  mage: '/assets/models/characters/Characters_Sam.gltf',
  rogue: '/assets/models/characters/Characters_Shaun.gltf',
  archer: '/assets/models/characters/Characters_Lis.gltf',
  paladin: '/assets/models/characters/Caballero root.gltf',
  necromancer: '/assets/models/characters/BlueSoldier_Male.gltf',
  berserker: '/assets/models/characters/Character Soldier.glb',
  monk: '/assets/models/characters/Characters_Matt.gltf',
  healer: '/assets/models/characters/Characters_Lis.gltf',
};

// ============================================================
// HELPERS
// ============================================================

/** Modelo placeholder cuando no se encuentra nada */
const PLACEHOLDER_MODEL = '/assets/models/characters/Character Soldier.glb';

/**
 * Resuelve la ruta del modelo 3D para un personaje.
 * Prioridad: personajeId → clase → placeholder
 */
export function resolveModelPath(
  personajeId?: string | null,
  characterClass?: string | null,
  withWeapon = false,
): string {
  // 1. Buscar por personajeId
  if (personajeId && CHARACTER_MODEL_MAP[personajeId]) {
    // Si pide variante con arma y existe
    if (withWeapon && CHARACTER_WEAPON_VARIANTS[personajeId]) {
      return CHARACTER_WEAPON_VARIANTS[personajeId];
    }
    return CHARACTER_MODEL_MAP[personajeId].modelPath;
  }

  // 2. Fallback por clase
  if (characterClass && CLASS_FALLBACK_MODEL[characterClass]) {
    return CLASS_FALLBACK_MODEL[characterClass];
  }

  // 3. Placeholder genérico
  return PLACEHOLDER_MODEL;
}

/**
 * Obtiene la config completa de un personaje (o config por defecto)
 */
export function getCharacterModelConfig(personajeId?: string | null): CharacterModelConfig {
  if (personajeId && CHARACTER_MODEL_MAP[personajeId]) {
    return CHARACTER_MODEL_MAP[personajeId];
  }

  return {
    modelPath: PLACEHOLDER_MODEL,
    displayName: 'Aventurero',
    scale: 1,
    yOffset: 0,
  };
}

/**
 * Devuelve todos los paths de modelos para precargar
 */
export function getAllModelPaths(): string[] {
  return Object.values(CHARACTER_MODEL_MAP).map(c => c.modelPath);
}
