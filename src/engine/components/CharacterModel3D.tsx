/**
 * CharacterModel3D - Carga y renderiza el modelo 3D de un personaje
 * 
 * Usa useGLTF de drei para cargar .glb/.gltf y useAnimations para
 * reproducir las animaciones embebidas en el archivo.
 * 
 * Se conecta con el backend a través del personajeId:
 *   backend → personajeId → character-models.config → modelPath → useGLTF
 */

import { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  resolveModelPath,
  getCharacterModelConfig,
  type CharacterModelConfig,
} from '../../config/character-models.config';

// ============================================================
// TIPOS
// ============================================================

export interface CharacterModel3DProps {
  /** personajeId del backend (ej: "vision-espectral") */
  personajeId?: string | null;
  /** Clase del personaje como fallback */
  characterClass?: string | null;
  /** Animación activa: idle, walk, run, attack, etc. */
  animation?: string;
  /** Usar variante con arma (SingleWeapon) si existe */
  withWeapon?: boolean;
  /** Escala override (si no se pasa, usa la del config) */
  scale?: number;
  /** Callback cuando el modelo termina de cargar */
  onLoaded?: () => void;
  /** Callback si falla la carga */
  onError?: (error: Error) => void;
}

// ============================================================
// COMPONENTE
// ============================================================

export function CharacterModel3D({
  personajeId,
  characterClass,
  animation = 'Idle',
  withWeapon = false,
  scale: scaleOverride,
  onLoaded,
  onError: _onError,
}: CharacterModel3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Resolver config y path del modelo
  const config: CharacterModelConfig = useMemo(
    () => getCharacterModelConfig(personajeId),
    [personajeId],
  );

  const modelPath = useMemo(
    () => resolveModelPath(personajeId, characterClass, withWeapon),
    [personajeId, characterClass, withWeapon],
  );

  const finalScale = scaleOverride ?? config.scale;

  // Cargar GLTF
  const { scene, animations: gltfAnimations } = useGLTF(modelPath);

  // Clonar la escena con SkeletonUtils para SkinnedMesh correcto
  const clonedScene = useMemo(() => {
    const clone = skeletonClone(scene);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Evitar z-fighting
        mesh.frustumCulled = false;

        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => {
              const cloned = m.clone();
              cloned.depthWrite = true;
              cloned.side = THREE.FrontSide;
              return cloned;
            });
          } else {
            mesh.material = mesh.material.clone();
            (mesh.material as THREE.Material).depthWrite = true;
            (mesh.material as THREE.Material).side = THREE.FrontSide;
          }
        }
      }
    });

    return clone;
  }, [scene]);

  // Sistema de animaciones
  // --- Stripping root-position tracks prevents "root motion" from moving the visual
  // model away from the physics/collider (common cause of visual jitter).
  const cleanedAnimations = useMemo(() => {
    return (gltfAnimations || []).map((clip) => {
      const clone = clip.clone();
      // Keep only non-root position tracks. Remove position tracks that target
      // common root-bone names (Hips / Pelvis / Root) to neutralize root-motion.
      clone.tracks = clone.tracks.filter((track) => {
        const name = track.name.toLowerCase();
        const isPosition = name.endsWith('.position');
        const isRootTarget = /hip|pelvis|root/.test(name);
        // drop only position tracks targeting root-like nodes
        return !(isPosition && isRootTarget);
      });
      return clone;
    });
  }, [gltfAnimations]);

  const { actions, names: animationNames } = useAnimations(cleanedAnimations, groupRef);

  // Log de animaciones disponibles (solo en dev) + validar mappings del config
  useEffect(() => {
    if (import.meta.env.DEV && animationNames.length > 0) {
      console.log(
        `[CharacterModel3D] "${personajeId || 'unknown'}" animaciones:`,
        animationNames,
      );

      // Validar que los nombres declarados en config.animations existan
      const animMap = (config as any).animations || {};
      Object.keys(animMap).forEach((k) => {
        const declared = animMap[k];
        if (declared && !animationNames.includes(declared)) {
          console.warn(
            `[CharacterModel3D] Mismatch de animación para "${personajeId || 'unknown'}": config.animations.${k} = "${declared}" no existe en GLTF. Available: ${animationNames.join(', ')}`,
          );
        }
      });
    }
  }, [animationNames, personajeId, config]);

  // Reproducir animación activa con crossfade — con validaciones y fallback seguro
  useEffect(() => {
    if (!actions || animationNames.length === 0) return;

    let targetAction: THREE.AnimationAction | null = null;
    let actionKey: string | null = null;

    // 1. Resolver usando el mapa explícito del config (si existe)
    const animMap = (config as any).animations || {};
    const propToConfigKey: Record<string, string> = {
      'Idle': 'idle',
      'Walk': 'walk',
      'Run': 'run',
      'Sprint': 'sprint',
      'Attack': 'attack',
      'Death': 'death',
      'Hit': 'hit',
      'Jump': 'jump',
      'Fall': 'fall',
    };

    const configKey = propToConfigKey[animation] || animation.toLowerCase();

    if (animMap[configKey]) {
      const declared = animMap[configKey];
      // Si el nombre declarado existe exactamente en actions, úsalo
      if (actions[declared]) {
        targetAction = actions[declared];
        actionKey = declared;
      } else {
        // Nombre declarado NO existe — intentar resolver con búsqueda fuzzy y avisar
        const fuzzy = findBestAnimation(declared, animationNames);
        if (fuzzy && actions[fuzzy]) {
          console.warn(
            `[CharacterModel3D] Automap: config.animations.${configKey} = "${declared}" no existe — usando "${fuzzy}" en su lugar.`,
          );
          targetAction = actions[fuzzy];
          actionKey = fuzzy;
        } else {
          console.warn(
            `[CharacterModel3D] Mapeo inválido para "${personajeId || 'unknown'}": config.animations.${configKey} = "${declared}" — no se encontró en GLTF. Intentando fallback.`,
          );
        }
      }
    }

    // 2. Si no se encontró por config, intentar por el nombre pedido (prop) — fuzzy
    if (!targetAction) {
      const byProp = findBestAnimation(animation, animationNames);
      if (byProp && actions[byProp]) {
        targetAction = actions[byProp];
        actionKey = byProp;
      }
    }

    // 3. Fallback más seguro: priorizar Idle → Walk → Run antes de elegir la primera disponible
    if (!targetAction && animationNames.length > 0) {
      const preferred = ['Idle', 'Walk', 'Run'];
      for (const p of preferred) {
        const match = findBestAnimation(p, animationNames);
        if (match && actions[match]) {
          targetAction = actions[match];
          actionKey = match;
          break;
        }
      }
    }

    // 4. Último recurso: la primera animación disponible
    if (!targetAction && animationNames.length > 0) {
      targetAction = actions[animationNames[0]];
      actionKey = animationNames[0];
    }

    if (targetAction) {
      const oneShot = ['Attack', 'Hit', 'Death', 'Jump'].some(k => animation.includes(k));
      targetAction.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, oneShot ? 0 : Infinity);
      targetAction.clampWhenFinished = oneShot;

      // If action already running, ensure it's not paused/zero-weight
      if (targetAction.isRunning()) {
        try { targetAction.setEffectiveTimeScale((targetAction as any).getEffectiveTimeScale?.() ?? 1); } catch {}
        targetAction.setEffectiveWeight(1);
        targetAction.fadeIn(0.2);
        return;
      }

      // Fade out other running actions
      Object.keys(actions).forEach((key) => {
        const other = actions[key];
        if (other && other !== targetAction && other.isRunning()) {
          other.fadeOut(0.25);
        }
      });

      // Defensive: ensure the action actually animates (weight/timeScale set)
      targetAction.reset();
      try {
        targetAction.setEffectiveTimeScale(1);
        targetAction.setEffectiveWeight(1);
      } catch (err) {
        /* ignore if API not available */
      }
      targetAction.fadeIn(0.25).play();

      if (import.meta.env.DEV) {
        console.log(`[CharacterModel3D] play → "${actionKey}" (oneShot=${oneShot})`);
      }
    }
  }, [animation, actions, animationNames, config, personajeId]);

  // Notificar carga exitosa
  useEffect(() => {
    onLoaded?.();
  }, [clonedScene]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <group ref={groupRef} scale={finalScale} position={[0, config.yOffset, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ============================================================
// PLACEHOLDER (se muestra mientras carga el modelo)
// ============================================================

export function CharacterPlaceholder() {
  return (
    <group>
      {/* Cuerpo */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Cabeza */}
      <mesh castShadow position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Indicador de dirección */}
      <group position={[0, 1.3, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <coneGeometry args={[0.1, 0.2, 8]} />
          <meshBasicMaterial color="#ff6600" />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================
// PRELOAD
// ============================================================

/**
 * Precarga modelos de personajes específicos (llamar antes de renderizar)
 * Ejemplo: preloadCharacterModels(['vision-espectral', 'sir-nocturno'])
 */
export function preloadCharacterModels(personajeIds: string[]) {
  personajeIds.forEach((id) => {
    const path = resolveModelPath(id);
    useGLTF.preload(path);
  });
}

// ============================================================
// UTILIDADES INTERNAS
// ============================================================

/**
 * Busca la mejor coincidencia de animación en la lista disponible.
 * Maneja variaciones de nombre como "idle", "Idle", "IDLE", "Armature|Idle", etc.
 */
function findBestAnimation(
  requested: string,
  available: string[],
): string | null {
  if (available.length === 0) return null;

  const lower = requested.toLowerCase();

  // 1. Match exacto
  const exact = available.find((name) => name === requested);
  if (exact) return exact;

  // 2. Match case-insensitive
  const caseInsensitive = available.find(
    (name) => name.toLowerCase() === lower,
  );
  if (caseInsensitive) return caseInsensitive;

  // 3. Match parcial (ej: "Armature|Idle" contiene "idle")
  const partial = available.find((name) =>
    name.toLowerCase().includes(lower),
  );
  if (partial) return partial;

  // 4. Por mapeo de sinónimos comunes
  const synonyms: Record<string, string[]> = {
    idle: ['idle', 'stand', 'wait', 'rest', 'breathe'],
    walk: ['walk', 'locomotion', 'move'],
    run: ['run', 'sprint', 'jog', 'fast'],
    attack: ['attack', 'slash', 'hit', 'strike', 'swing', 'punch'],
    death: ['death', 'die', 'dead', 'defeat'],
    hit: ['hit', 'hurt', 'damage', 'impact', 'react'],
    jump: ['jump', 'leap'],
  };

  const alts = synonyms[lower] || [];
  for (const alt of alts) {
    const match = available.find((name) =>
      name.toLowerCase().includes(alt),
    );
    if (match) return match;
  }

  return null;
}
