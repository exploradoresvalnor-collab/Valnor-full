/**
 * LevelKit - Herramientas y utilidades para crear niveles
 * Componentes reutilizables, helpers y presets
 */

import * as THREE from 'three';
import { useRef } from 'react';
import { RigidBody, CuboidCollider, CylinderCollider, BallCollider, RapierRigidBody } from '@react-three/rapier';
import { Float, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

// ============================================================
// TIPOS COMUNES
// ============================================================

export interface LevelProps {
  showDebug?: boolean;
  timeOfDay?: number;
  showEffects?: boolean;
  onLoad?: () => void;
}

export interface SpawnPoint {
  name: string;
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  type: 'player' | 'enemy' | 'item' | 'npc';
}

export interface LevelBounds {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

// ============================================================
// COMPONENTES PRIMITIVOS REUTILIZABLES
// ============================================================

interface PlatformProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
  moving?: boolean;
  moveAxis?: 'x' | 'y' | 'z';
  moveDistance?: number;
  moveSpeed?: number;
}

export function Platform({
  position,
  size = [4, 0.5, 4],
  color = '#8a8a8a',
  moving = false,
  moveAxis = 'y',
  moveDistance = 3,
  moveSpeed = 1,
}: PlatformProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const startPos = useRef(position);

  // Plataformas móviles con kinematic body
  useFrame((state) => {
    if (!moving || !bodyRef.current) return;
    const t = state.clock.elapsedTime * moveSpeed;
    const offset = Math.sin(t) * moveDistance;
    const pos = { x: startPos.current[0], y: startPos.current[1], z: startPos.current[2] };
    if (moveAxis === 'x') pos.x += offset;
    else if (moveAxis === 'y') pos.y += offset;
    else pos.z += offset;
    bodyRef.current.setNextKinematicTranslation(pos);
  });

  return (
    <RigidBody ref={bodyRef} type={moving ? 'kinematicPosition' : 'fixed'} position={position} colliders="cuboid">
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </RigidBody>
  );
}

interface RampProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
  color?: string;
}

export function Ramp({
  position,
  rotation = [0, 0, 0],
  size = [4, 0.5, 6],
  color = '#7a7a7a',
}: RampProps) {
  // Rotación aplicada al RigidBody completo para que collider y mesh coincidan
  const combinedRotation: [number, number, number] = [
    rotation[0] - 0.3,
    rotation[1],
    rotation[2],
  ];
  return (
    <RigidBody type="fixed" position={position} rotation={combinedRotation} colliders="cuboid">
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </RigidBody>
  );
}

interface PillarProps {
  position: [number, number, number];
  height?: number;
  radius?: number;
  color?: string;
}

export function Pillar({
  position,
  height = 5,
  radius = 0.5,
  color = '#6a6a6a',
}: PillarProps) {
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CylinderCollider args={[height / 2, radius]} position={[0, height / 2, 0]} />
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius * 1.1, height, 8]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

interface WallSegmentProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
  color?: string;
  hasWindow?: boolean;
  hasDoor?: boolean;
}

export function WallSegment({
  position,
  rotation = [0, 0, 0],
  size = [6, 4, 0.5],
  color = '#9a9a9a',
  hasWindow = false,
  hasDoor = false,
}: WallSegmentProps) {
  return (
    <RigidBody type="fixed" position={position} rotation={rotation} colliders={false}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
      
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>

      {hasWindow && (
        <mesh position={[0, 0.5, size[2] / 2 + 0.01]}>
          <planeGeometry args={[1.5, 1.5]} />
          <meshStandardMaterial color="#88aacc" transparent opacity={0.7} />
        </mesh>
      )}

      {hasDoor && (
        <mesh position={[0, -size[1] / 2 + 1.2, size[2] / 2 + 0.01]}>
          <planeGeometry args={[1.5, 2.4]} />
          <meshStandardMaterial color="#5a4030" />
        </mesh>
      )}
    </RigidBody>
  );
}

// ============================================================
// TRIGGERS Y ZONAS
// ============================================================

interface TriggerZoneProps {
  position: [number, number, number];
  size: [number, number, number];
  onEnter?: () => void;
  onExit?: () => void;
  visible?: boolean;
  color?: string;
}

export function TriggerZone({
  position,
  size,
  onEnter,
  onExit,
  visible = false,
  color = '#ffff0044',
}: TriggerZoneProps) {
  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders={false}
      sensor
      onIntersectionEnter={onEnter}
      onIntersectionExit={onExit}
    >
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} sensor />
      
      {visible && (
        <mesh>
          <boxGeometry args={size} />
          <meshBasicMaterial color={color} transparent opacity={0.3} wireframe />
        </mesh>
      )}
    </RigidBody>
  );
}

interface SpawnMarkerProps {
  position: [number, number, number];
  type?: 'player' | 'enemy' | 'item' | 'checkpoint';
  label?: string;
  visible?: boolean;
}

export function SpawnMarker({
  position,
  type = 'player',
  label,
  visible = true,
}: SpawnMarkerProps) {
  const colors = {
    player: '#00ff00',
    enemy: '#ff0000',
    item: '#ffff00',
    checkpoint: '#00ffff',
  };

  if (!visible) return null;

  return (
    <group position={position}>
      {/* Marker visual */}
      <mesh>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
        <meshBasicMaterial color={colors[type]} transparent opacity={0.5} />
      </mesh>
      
      {/* Flecha hacia arriba */}
      <mesh position={[0, 1, 0]}>
        <coneGeometry args={[0.2, 0.5, 8]} />
        <meshBasicMaterial color={colors[type]} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshBasicMaterial color={colors[type]} />
      </mesh>

      {/* Label */}
      {label && (
        <Text
          position={[0, 2, 0]}
          fontSize={0.3}
          color={colors[type]}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

// ============================================================
// DECORACIONES
// ============================================================

interface CrateProps {
  position: [number, number, number];
  size?: number;
  breakable?: boolean;
}

export function Crate({ position, size = 1, breakable = false }: CrateProps) {
  return (
    <RigidBody 
      type={breakable ? 'dynamic' : 'fixed'} 
      position={position} 
      colliders="cuboid"
      mass={breakable ? 10 : undefined}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color="#8a6a4a" roughness={0.9} />
      </mesh>
      {/* Detalles de la caja */}
      <mesh position={[0, 0, size / 2 + 0.01]}>
        <planeGeometry args={[size * 0.8, size * 0.8]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

interface BarrelProps {
  position: [number, number, number];
  color?: string;
  explosive?: boolean;
}

export function Barrel({ position, color = '#5a4a3a', explosive = false }: BarrelProps) {
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CylinderCollider args={[0.6, 0.5]} />
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.2, 12]} />
        <meshStandardMaterial color={explosive ? '#ff4444' : color} roughness={0.8} />
      </mesh>
      {/* Aros metálicos */}
      {[-0.4, 0, 0.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.52, 0.03, 8, 24]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
    </RigidBody>
  );
}

interface TorchStandProps {
  position: [number, number, number];
  lit?: boolean;
}

export function TorchStand({ position, lit = true }: TorchStandProps) {
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="hull">
        {/* Soporte */}
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.1, 2, 8]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Base */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.2, 8]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
        </mesh>
        {/* Antorcha */}
        <mesh position={[0, 2.1, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.3, 8]} />
          <meshStandardMaterial color="#5a4030" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Luz */}
      {lit && (
        <>
          <pointLight
            position={[0, 2.3, 0]}
            color="#ff6622"
            intensity={2}
            distance={15}
            castShadow
          />
          {/* Llama (simple) */}
          <Float floatIntensity={0.2} speed={8}>
            <mesh position={[0, 2.35, 0]}>
              <coneGeometry args={[0.06, 0.15, 8]} />
              <meshBasicMaterial color="#ff8844" />
            </mesh>
          </Float>
        </>
      )}
    </group>
  );
}

// ============================================================
// UTILIDADES
// ============================================================

/**
 * Genera spawn points en un patrón de grid
 */
export function generateGridSpawns(
  center: THREE.Vector3,
  rows: number,
  cols: number,
  spacing: number,
  type: SpawnPoint['type'] = 'enemy'
): SpawnPoint[] {
  const spawns: SpawnPoint[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = center.x + (c - cols / 2) * spacing;
      const z = center.z + (r - rows / 2) * spacing;

      spawns.push({
        name: `spawn_${r}_${c}`,
        position: new THREE.Vector3(x, center.y, z),
        type,
      });
    }
  }

  return spawns;
}

/**
 * Genera spawn points en un círculo
 */
export function generateCircleSpawns(
  center: THREE.Vector3,
  count: number,
  radius: number,
  type: SpawnPoint['type'] = 'enemy'
): SpawnPoint[] {
  const spawns: SpawnPoint[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = center.x + Math.cos(angle) * radius;
    const z = center.z + Math.sin(angle) * radius;

    spawns.push({
      name: `spawn_circle_${i}`,
      position: new THREE.Vector3(x, center.y, z),
      rotation: new THREE.Euler(0, -angle + Math.PI / 2, 0),
      type,
    });
  }

  return spawns;
}

/**
 * Calcula los bounds de un nivel a partir de spawn points
 */
export function calculateLevelBounds(spawns: SpawnPoint[], padding = 10): LevelBounds {
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

  spawns.forEach((spawn) => {
    min.min(spawn.position);
    max.max(spawn.position);
  });

  min.subScalar(padding);
  max.addScalar(padding);

  return { min, max };
}

/**
 * Obtiene el spawn point más cercano a una posición
 */
export function getNearestSpawn(
  position: THREE.Vector3,
  spawns: SpawnPoint[],
  type?: SpawnPoint['type']
): SpawnPoint | null {
  let nearest: SpawnPoint | null = null;
  let nearestDist = Infinity;

  spawns.forEach((spawn) => {
    if (type && spawn.type !== type) return;

    const dist = position.distanceTo(spawn.position);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = spawn;
    }
  });

  return nearest;
}

// ============================================================
// EXPORTS
// ============================================================

export const LevelKit = {
  // Componentes
  Platform,
  Ramp,
  Pillar,
  WallSegment,
  TriggerZone,
  SpawnMarker,
  Crate,
  Barrel,
  TorchStand,

  // Utilidades
  generateGridSpawns,
  generateCircleSpawns,
  calculateLevelBounds,
  getNearestSpawn,
};

export default LevelKit;
