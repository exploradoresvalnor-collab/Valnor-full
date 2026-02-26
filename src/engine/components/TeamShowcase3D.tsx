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
  useGLTF,
  useAnimations,
  Html,
  Sparkles,
  Environment,
  Float
} from '@react-three/drei';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
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
        const isEffectPlane = mesh.name.toLowerCase().includes('plane') ||
          mesh.name.toLowerCase().includes('effect') ||
          mesh.name.toLowerCase().includes('aura');
        if (isEffectPlane) {
          mesh.visible = false;
        }

        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => {
              const c = m.clone();
              if (c.transparent) c.depthWrite = false;
              return c;
            });
          } else {
            mesh.material = (mesh.material as THREE.Material).clone();
            if ((mesh.material as THREE.Material).transparent) {
              (mesh.material as THREE.Material).depthWrite = false;
            }
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
        // Los modelos miran a la cámara (al jugador)
        rotation={[0, 0, 0]}
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
              background: 'linear-gradient(135deg, rgba(20, 15, 30, 0.85) 0%, rgba(10, 5, 15, 0.95) 100%)',
              backdropFilter: 'blur(8px)',
              color: isSelected ? '#ffd700' : '#e0e0e0',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: '"Cinzel", "Trajan Pro", serif, system-ui',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              border: isSelected ? '1px solid #cfa144' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: isSelected ? '0 0 15px rgba(207, 161, 68, 0.4)' : '0 4px 10px rgba(0,0,0,0.5)',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              minWidth: '90px',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ fontSize: '14px', letterSpacing: '0.5px', marginBottom: '2px' }}>{displayName}</div>
            {showInfo && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', marginTop: 4, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {nivel != null && (
                  <span style={{ opacity: 0.9, fontSize: '11px', color: '#b0b0b0' }}>Nv.{nivel}</span>
                )}
                {rango && (
                  <span
                    style={{
                      fontSize: '10px',
                      background: getRangoColor(rango),
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      color: '#fff',
                      textShadow: '0 1px 1px rgba(0,0,0,0.5)'
                    }}
                  >
                    {rango}
                  </span>
                )}
                {equipamientoCount != null && equipamientoCount > 0 && (
                  <span style={{ fontSize: '10px', color: '#4fc3f7', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '12px' }}>⚔</span> {equipamientoCount}
                  </span>
                )}
              </div>
            )}
            {showInfo && stats && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 6, fontSize: '11px', opacity: 0.85 }}>
                <span style={{ color: '#ef5350', display: 'flex', alignItems: 'center', gap: '2px' }}>⚔ {stats.atk}</span>
                <span style={{ color: '#66bb6a', display: 'flex', alignItems: 'center', gap: '2px' }}>♥ {stats.vida}</span>
                <span style={{ color: '#42a5f5', display: 'flex', alignItems: 'center', gap: '2px' }}>🛡 {stats.defensa}</span>
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
        0.5, // Movidos un poco hacia adelante
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

  // Ref para el anillo pulsante de la plataforma
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
  });

  return (
    <>
      {/* Entorno PBR para iluminación realista de los modelos */}
      <Environment preset="city" />

      {/* ═══ Iluminación Cinematográfica ═══ */}
      {/* Key light — ámbar cálido (sol mágico) */}
      <directionalLight
        position={[5, 8, 3]}
        intensity={2.5}
        color="#ffb05a"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Fill light — púrpura mágico */}
      <directionalLight
        position={[-4, 5, -3]}
        intensity={1.2}
        color="#b07cd8"
      />

      {/* Rim light — azul frío para contrasté */}
      <pointLight position={[0, 4, -5]} intensity={1.5} color="#6aade9" distance={15} />

      {/* Ambient — tono cálido base */}
      <ambientLight intensity={0.7} color="#e8c9a4" />

      {/* Hemisphere — suelo marrón + cielo púrpura */}
      <hemisphereLight args={['#4a2d6e', '#2a1a12', 0.8]} />

      {/* ═══ Spotlights individuales por personaje (arena effect) ═══ */}
      {positions.map((pos, i) => (
        <spotLight
          key={`spot-${i}`}
          position={[pos[0], 6, pos[2] + 1]}
          target-position={[pos[0], 0, pos[2]]}
          angle={0.4}
          penumbra={0.8}
          intensity={2.5}
          color="#ffbe60"
          distance={12}
          castShadow={false}
        />
      ))}

      {/* ═══ Partículas mágicas (magic dust) ═══ */}
      <Sparkles
        count={60}
        scale={[12, 6, 8]}
        size={2.5}
        speed={0.4}
        opacity={0.5}
        color="#ffd700"
      />
      <Sparkles
        count={30}
        scale={[10, 5, 6]}
        size={1.8}
        speed={0.3}
        opacity={0.3}
        color="#c77dff"
      />

      {/* ═══ Fondo de Montañas Procedurales ═══ */}
      {/* <ProceduralMountains /> (Removido para estética AAA) */}

      {/* ═══ Plataforma Elegante AAA (Reemplaza la Piedra) ═══ */}
      <PremiumStage />

      {/* Rim Light 1: Luz azulada intensa desde atrás a la izquierda */}
      <spotLight
        position={[-6, 4, -6]}
        angle={0.6}
        penumbra={0.5}
        intensity={6}
        color="#4287f5"
        distance={20}
      />

      {/* Rim Light 2: Luz púrpura mágica desde atrás a la derecha */}
      <spotLight
        position={[6, 3, -4]}
        angle={0.5}
        penumbra={0.8}
        intensity={5}
        color="#a342f5"
        distance={20}
      />

      {/* Sombras de contacto */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.6}
        scale={14}
        blur={2.5}
        far={4}
        color="#0a0612"
      />

      {/* ═══ Anillos de rareza bajo cada personaje ═══ */}
      {positions.map((pos, i) => (
        <mesh key={`ring-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[pos[0], 0.03, pos[2]]}>
          <ringGeometry args={[0.55, 0.75, 32]} />
          <meshBasicMaterial
            color={
              characters[i]?.rango === 'S' ? '#ffd700' :
                characters[i]?.rango === 'A' ? '#c77dff' :
                  characters[i]?.rango === 'B' ? '#4a90d9' :
                    '#ff8c00'
            }
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* ═══ Personajes ═══ */}
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
        onCreated={({ gl }) => {
          // Force context disposal on unmount to prevent WebGLRenderer Context Lost
          return () => gl.dispose();
        }}
        gl={{
          antialias: quality !== 'low',
          alpha: transparent,
          powerPreference: 'high-performance',
        }}
        style={{ background: transparent ? 'transparent' : 'radial-gradient(ellipse at 50% 80%, #1a0e20 0%, #0a0612 60%, #050308 100%)' }}
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

        {/* Cámara apuntando al equipo heroico con mejor encuadre (centrado) */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          target={[0, 1.8, 0]} // Centrado perfecto para ver personajes de cuerpo completo
        />

        {/* Post-Procesamiento AAA (Bloom mágica selectiva y Viñeteado) */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.9} // Alto umbral para que SOLO brille lo mágico (anillos/chispas)
            luminanceSmoothing={0.1}
            height={300}
            intensity={1.8}
          />
          <Vignette eskil={false} offset={0.2} darkness={1.2} />
        </EffectComposer>

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

// ==========================================
// SCENE COMPONENTS (PREMIUM AAA STAGE)
// ==========================================

function MagicRing({ radius, color, speed, yOffset }: { radius: number, color: string, speed: number, yOffset: number }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * speed;
    }
  });

  return (
    <mesh ref={ringRef} position={[0, yOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.1, 64]} />
      <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6} />
    </mesh>
  );
}

function PremiumStage() {
  return (
    <group position={[0, -0.05, 0]}>
      {/* Base cilíndrica de Obsidiana Pulida (Muy Ancha) */}
      <mesh receiveShadow castShadow position={[0, -0.2, 0]}>
        <cylinderGeometry args={[25, 24, 0.4, 64]} />
        <meshPhysicalMaterial
          color="#0a0a0c"
          metalness={0.9}
          roughness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Borde dorado de la plataforma */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[25.05, 25.05, 0.05, 64]} />
        <meshStandardMaterial color="#cfa144" metalness={1} roughness={0.2} emissive="#4a3600" />
      </mesh>

      {/* Anillos Mágicos Flotantes Extendidos */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
        <MagicRing radius={26} color="#4287f5" speed={0.05} yOffset={-0.2} />
        <MagicRing radius={28} color="#a342f5" speed={-0.03} yOffset={-0.5} />
        <MagicRing radius={30} color="#f5b342" speed={0.02} yOffset={-0.8} />
      </Float>
    </group>
  );
}
