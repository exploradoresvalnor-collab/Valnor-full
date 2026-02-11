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
  const { actions, names: animationNames } = useAnimations(gltfAnimations, groupRef);

  // Log de animaciones disponibles (solo en dev)
  useEffect(() => {
    if (import.meta.env.DEV && animationNames.length > 0) {
      console.log(
        `[CharacterModel3D] "${personajeId || 'unknown'}" animaciones:`,
        animationNames,
      );
    }
  }, [animationNames, personajeId]);

  // Reproducir animación activa con crossfade
  useEffect(() => {
    if (!actions || animationNames.length === 0) return;

    // Buscar la animación (case-insensitive + fuzzy match)
    const actionKey = findBestAnimation(animation, animationNames);

    if (actionKey && actions[actionKey]) {
      const action = actions[actionKey];
      action.reset().fadeIn(0.25).play();

      return () => {
        action.fadeOut(0.25);
      };
    } else if (animationNames.length > 0 && actions[animationNames[0]]) {
      // Si no encuentra la animación solicitada, reproducir la primera disponible
      const fallback = actions[animationNames[0]]!;
      fallback.reset().fadeIn(0.25).play();
      return () => {
        fallback.fadeOut(0.25);
      };
    }
  }, [animation, actions, animationNames]);

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
