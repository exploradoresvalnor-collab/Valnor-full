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
import type { AnimationState } from '../systems/AnimationSystem';

// ============================================================
// TIPOS
// ============================================================

export interface CharacterModel3DProps {
  /** personajeId del backend (ej: "vision-espectral") */
  personajeId?: string | null;
  /** Clase del personaje como fallback */
  characterClass?: string | null;
  /** Usar variante con arma (SingleWeapon) si existe */
  withWeapon?: boolean;
  /** Escala override (si no se pasa, usa la del config) */
  scale?: number;
  /** Callback cuando el modelo y las animaciones están listos */
  onAnimationsReady?: (
    mixer: THREE.AnimationMixer,
    animations: Map<AnimationState, THREE.AnimationClip>
  ) => void;
  /** Callback si falla la carga */
  onError?: (error: Error) => void;
}

// ============================================================
// COMPONENTE
// ============================================================

export function CharacterModel3D({
  personajeId,
  characterClass,
  withWeapon = false,
  scale: scaleOverride,
  onAnimationsReady,
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

  const { mixer } = useAnimations(gltfAnimations, groupRef);

  // Mapear animaciones y notificar al padre cuando esté listo
  useEffect(() => {
    if (!mixer || !gltfAnimations || gltfAnimations.length === 0 || !config) {
      return;
    }

    const processedAnimations = new Map<AnimationState, THREE.AnimationClip>();
    const configAnims = config.animations || {};

    // Invertir el mapa de config para buscar por nombre de archivo
    const reverseAnimMap = new Map<string, AnimationState>();
    for (const key in configAnims) {
      const animState = key as AnimationState;
      const animNameInFile = (configAnims as any)[key];
      if (animNameInFile) {
        reverseAnimMap.set(animNameInFile, animState);
      }
    }
    
    // Mapear cada animación del GLTF a nuestro AnimationState estándar
    gltfAnimations.forEach(clip => {
      // 1. Buscar en el config
      if(reverseAnimMap.has(clip.name)) {
        const animState = reverseAnimMap.get(clip.name)!;
        processedAnimations.set(animState, clip);
        return;
      }

      // 2. Fallback por nombre (si no está en el config)
      const animStateKey = clip.name.toLowerCase() as AnimationState;
      if (!processedAnimations.has(animStateKey)) {
        processedAnimations.set(animStateKey, clip);
      }
    });

    if (import.meta.env.DEV) {
      console.log(
        `[CharacterModel3D] Animaciones procesadas para "${personajeId || 'unknown'}":`,
        Array.from(processedAnimations.keys()),
      );
    }
    
    onAnimationsReady?.(mixer, processedAnimations);
  
  }, [mixer, gltfAnimations, config, onAnimationsReady, personajeId]);


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
