/**
 * TeamShowcase3D - Escena 3D para visualizar el equipo de personajes
 * 
 * Muestra hasta 4 personajes en fila, de pie, mirando al frente,
 * con animación Idle activa. Incluye iluminación, suelo y cámara orbital.
 * 
 * Uso:
 *   <TeamShowcase3D personajes={user.personajes} />
 *   <TeamShowcase3D personajeIds={['vision-espectral', 'sir-nocturno']} />
 */

import { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  AdaptiveDpr,
  ContactShadows,
  Environment,
  useGLTF,
  useAnimations,
  Html,
} from '@react-three/drei';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  resolveModelPath,
  getCharacterModelConfig,
  CHARACTER_MODEL_MAP,
} from '../../config/character-models.config';

// ============================================================
// TIPOS
// ============================================================

export interface ShowcaseCharacter {
  personajeId: string;
  nombre?: string;
  nivel?: number;
  rango?: string;
  clase?: string;
  /** Stats reales del backend { atk, vida, defensa } */
  stats?: { atk: number; vida: number; defensa: number };
  /** Cantidad de items equipados */
  equipamientoCount?: number;
}

export interface TeamShowcase3DProps {
  /** Personajes a mostrar (datos del backend) */
  personajes?: ShowcaseCharacter[];
  /** Alternativa: solo los IDs */
  personajeIds?: string[];
  /** Altura del contenedor CSS (default: 350px) */
  height?: number | string;
  /** Permitir rotar la cámara con el ratón */
  enableOrbit?: boolean;
  /** Mostrar nombre debajo de cada personaje */
  showNames?: boolean;
  /** Mostrar nivel/rango */
  showInfo?: boolean;
  /** Calidad de renderizado */
  quality?: 'low' | 'medium' | 'high';
  /** Personaje seleccionado (resaltado) */
  selectedId?: string | null;
  /** Callback al hacer clic en un personaje */
  onSelectCharacter?: (personajeId: string) => void;
  /** Fondo transparente */
  transparent?: boolean;
}

// ============================================================
// PERSONAJE INDIVIDUAL EN LA ESCENA
// ============================================================

interface ShowcaseCharacterModelProps {
  personajeId: string;
  position: [number, number, number];
  nombre?: string;
  nivel?: number;
  rango?: string;
  stats?: { atk: number; vida: number; defensa: number };
  equipamientoCount?: number;
  showName?: boolean;
  showInfo?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

function ShowcaseCharacterModel({
  personajeId,
  position,
  nombre,
  nivel,
  rango,
  stats,
  equipamientoCount,
  showName = true,
  showInfo = false,
  isSelected = false,
  onClick,
}: ShowcaseCharacterModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const config = getCharacterModelConfig(personajeId);
  const modelPath = resolveModelPath(personajeId);

  // Cargar modelo
  const { scene, animations } = useGLTF(modelPath);
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
              const c = m.clone();
              c.depthWrite = true;
              c.side = THREE.FrontSide;
              return c;
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

  // Animaciones
  const { actions, names: animationNames } = useAnimations(animations, groupRef);

  // Reproducir Idle
  useEffect(() => {
    if (!actions || animationNames.length === 0) return;

    // Buscar animación idle específica del config
    const idleAnim = config.animations?.idle || 'Idle';
    let actionKey = animationNames.find((n) => n === idleAnim);
    if (!actionKey) actionKey = animationNames.find((n) => n.toLowerCase().includes('idle'));
    if (!actionKey) actionKey = animationNames[0];

    if (actionKey && actions[actionKey]) {
      const action = actions[actionKey]!;
      action.reset().fadeIn(0.3).play();
      return () => { action.fadeOut(0.3); };
    }
  }, [actions, animationNames, config.animations?.idle]);

  // Efecto de selección (brillo sutil)
  useFrame((state) => {
    if (!groupRef.current) return;
    if (isSelected) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.03;
      groupRef.current.scale.setScalar(config.scale * pulse);
    }
  });

  const displayName = nombre || config.displayName;

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Modelo */}
      <group
        ref={groupRef}
        scale={config.scale}
        position={[0, config.yOffset, 0]}
        // Los modelos están mirando hacia Z+, rotamos para que miren a la cámara (Z-)
        rotation={[0, Math.PI, 0]}
      >
        <primitive object={clonedScene} />
      </group>

      {/* Indicador de selección (circulo brillante bajo el personaje) */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.5, 0.7, 32]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Nombre HTML */}
      {showName && (
        <Html
          position={[0, -0.3, 0]}
          center
          distanceFactor={6}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.8)',
              color: isSelected ? '#ffd700' : '#fff',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              border: isSelected ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.15)',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              minWidth: '80px',
            }}
          >
            <div>{displayName}</div>
            {showInfo && (
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                {nivel != null && (
                  <span style={{ opacity: 0.8, fontSize: '10px' }}>Nv.{nivel}</span>
                )}
                {rango && (
                  <span
                    style={{
                      fontSize: '9px',
                      background: getRangoColor(rango),
                      padding: '1px 4px',
                      borderRadius: '3px',
                    }}
                  >
                    {rango}
                  </span>
                )}
                {equipamientoCount != null && equipamientoCount > 0 && (
                  <span style={{ fontSize: '9px', color: '#4fc3f7' }}>⚔{equipamientoCount}</span>
                )}
              </div>
            )}
            {showInfo && stats && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 2, fontSize: '9px', opacity: 0.7 }}>
                <span style={{ color: '#ef5350' }}>⚔{stats.atk}</span>
                <span style={{ color: '#66bb6a' }}>♥{stats.vida}</span>
                <span style={{ color: '#42a5f5' }}>🛡{stats.defensa}</span>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================
// PLACEHOLDER MIENTRAS CARGA
// ============================================================

function PlaceholderCharacter({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
        <meshStandardMaterial color="#ffd700" wireframe transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ============================================================
// ESCENA COMPLETA
// ============================================================

function ShowcaseScene({
  characters,
  showNames,
  showInfo,
  selectedId,
  onSelectCharacter,
}: {
  characters: ShowcaseCharacter[];
  showNames: boolean;
  showInfo: boolean;
  selectedId?: string | null;
  onSelectCharacter?: (id: string) => void;
}) {
  // Calcular posiciones: 2 filas si hay más de 4 personajes
  const positions = useMemo(() => {
    const count = characters.length;
    
    if (count <= 4) {
      // Una sola fila, bien espaciados
      const spacing = 2.2;
      const totalWidth = (count - 1) * spacing;
      const startX = -totalWidth / 2;
      return characters.map((_, i) => [
        startX + i * spacing,
        0,
        0,
      ] as [number, number, number]);
    }
    
    // Más de 4: 2 filas (V-formation)
    const frontCount = Math.ceil(count / 2);
    const backCount = count - frontCount;
    const spacing = 2.4;
    const result: [number, number, number][] = [];
    
    // Fila frontal
    const frontWidth = (frontCount - 1) * spacing;
    for (let i = 0; i < frontCount; i++) {
      result.push([
        -frontWidth / 2 + i * spacing,
        0,
        1.2, // adelante
      ]);
    }
    
    // Fila trasera
    const backWidth = (backCount - 1) * spacing;
    for (let i = 0; i < backCount; i++) {
      result.push([
        -backWidth / 2 + i * spacing,
        0,
        -1.2, // atrás
      ]);
    }
    
    return result;
  }, [characters.length]);

  return (
    <>
      {/* Iluminación */}
      <ambientLight intensity={0.5} color="#c4b5fd" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight
        position={[-3, 4, -2]}
        intensity={0.3}
        color="#9b59b6"
      />

      {/* Rim light (contraluz) */}
      <pointLight position={[0, 3, -4]} intensity={0.8} color="#3498db" distance={10} />

      {/* Suelo con sombras de contacto */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={12}
        blur={2.5}
        far={4}
        color="#1a1a2e"
      />

      {/* Suelo sutil */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial
          color="#1e1e2e"
          roughness={0.95}
          metalness={0.05}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Personajes */}
      {characters.map((char, i) => (
        <Suspense key={char.personajeId} fallback={<PlaceholderCharacter position={positions[i]} />}>
          <ShowcaseCharacterModel
            personajeId={char.personajeId}
            position={positions[i]}
            nombre={char.nombre}
            nivel={char.nivel}
            rango={char.rango}
            stats={char.stats}
            equipamientoCount={char.equipamientoCount}
            showName={showNames}
            showInfo={showInfo}
            isSelected={selectedId === char.personajeId}
            onClick={onSelectCharacter ? () => onSelectCharacter(char.personajeId) : undefined}
          />
        </Suspense>
      ))}

      {/* Environment (iluminación basada en imagen) */}
      <Environment preset="night" />
    </>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL EXPORTADO
// ============================================================

export function TeamShowcase3D({
  personajes,
  personajeIds,
  height = 350,
  enableOrbit = true,
  showNames = true,
  showInfo = true,
  quality = 'medium',
  selectedId,
  onSelectCharacter,
  transparent = false,
}: TeamShowcase3DProps) {
  // Construir lista de personajes a mostrar
  const characters: ShowcaseCharacter[] = useMemo(() => {
    if (personajes && personajes.length > 0) {
      return personajes.slice(0, 8); // Máximo 8
    }
    if (personajeIds && personajeIds.length > 0) {
      return personajeIds.slice(0, 8).map((id) => ({
        personajeId: id,
        nombre: CHARACTER_MODEL_MAP[id]?.displayName || id,
      }));
    }
    return [];
  }, [personajes, personajeIds]);

  if (characters.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontStyle: 'italic',
        }}
      >
        No hay personajes para mostrar
      </div>
    );
  }

  // Calcular distancia de cámara según cantidad de personajes
  const cameraZ = characters.length <= 2 ? 5 : characters.length <= 4 ? 7 : 10;
  const cameraY = characters.length <= 4 ? 2.5 : 3.5;

  const dpr: [number, number] = quality === 'low' ? [0.5, 1] : quality === 'high' ? [1, 2] : [0.75, 1.5];

  return (
    <div style={{ height, width: '100%', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
      <Canvas
        shadows
        dpr={dpr}
        camera={{ position: [0, cameraY, cameraZ], fov: 45 }}
        gl={{
          antialias: quality !== 'low',
          alpha: transparent,
          powerPreference: 'high-performance',
        }}
        style={{ background: transparent ? 'transparent' : 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)' }}
      >
        <Suspense fallback={null}>
          <ShowcaseScene
            characters={characters}
            showNames={showNames}
            showInfo={showInfo}
            selectedId={selectedId}
            onSelectCharacter={onSelectCharacter}
          />
        </Suspense>

        <OrbitControls
          enabled={enableOrbit}
          target={[0, 1, 0]}
          minDistance={3}
          maxDistance={12}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          enablePan={false}
          enableZoom={enableOrbit}
          autoRotate={false}
        />

        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function getRangoColor(rango: string): string {
  switch (rango?.toUpperCase()) {
    case 'S': return '#ff4444';
    case 'A': return '#ff8800';
    case 'B': return '#aa44ff';
    case 'C': return '#4488ff';
    case 'D': return '#44aa44';
    default: return '#666';
  }
}

export default TeamShowcase3D;
