/**
 * CastleLevel - Nivel de Fortaleza Medieval
 * Castillo con torres, murallas, patio interior y calabozos
 */

import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { MeshReflectorMaterial } from '@react-three/drei';
import { UltraSkySystem } from '../systems/UltraSkySystem';
import { ForestAmbience } from '../systems/AmbientParticlesSystem';
import { SceneEnhancer } from '../components/SceneEnhancer';

// ============================================================
// COMPONENTES DEL CASTILLO
// ============================================================

interface TowerProps {
  position: [number, number, number];
  height?: number;
  radius?: number;
}

function Tower({ position, height = 15, radius = 3 }: TowerProps) {
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider args={[radius, height / 2, radius]} position={[0, height / 2, 0]} />
      
      {/* Cuerpo de la torre */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.1, height, 8]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
      </mesh>
      
      {/* Techo cónico */}
      <mesh position={[0, height + 2, 0]} castShadow>
        <coneGeometry args={[radius * 1.3, 4, 8]} />
        <meshStandardMaterial color="#4a3030" roughness={0.8} />
      </mesh>

      {/* Almenas */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={i} position={[x, height, z]} castShadow>
            <boxGeometry args={[1, 1.5, 0.5]} />
            <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
          </mesh>
        );
      })}
    </RigidBody>
  );
}

interface WallProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  length?: number;
  height?: number;
}

function Wall({ position, rotation = [0, 0, 0], length = 20, height = 8 }: WallProps) {
  return (
    <RigidBody type="fixed" position={position} rotation={rotation} colliders={false}>
      <CuboidCollider args={[length / 2, height / 2, 1]} position={[0, height / 2, 0]} />
      
      {/* Cuerpo de la muralla */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, height, 2]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
      </mesh>

      {/* Almenas */}
      {Array.from({ length: Math.floor(length / 2) }).map((_, i) => (
        <mesh key={i} position={[-length / 2 + i * 2 + 1, height + 0.5, 0]} castShadow>
          <boxGeometry args={[0.8, 1, 2.2]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
        </mesh>
      ))}

      {/* Pasarela superior */}
      <mesh position={[0, height - 0.5, -0.8]} receiveShadow>
        <boxGeometry args={[length, 0.3, 1.5]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

function Gate({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      {/* Pilares del portón */}
      <mesh position={[-3, 4, 0]} castShadow>
        <boxGeometry args={[2, 8, 3]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>
      <mesh position={[3, 4, 0]} castShadow>
        <boxGeometry args={[2, 8, 3]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>

      {/* Arco superior */}
      <mesh position={[0, 7, 0]} castShadow>
        <boxGeometry args={[8, 2, 3]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>

      {/* Rejas del portón (decorativo) */}
      {[-2, -1, 0, 1, 2].map((x) => (
        <mesh key={x} position={[x, 3, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 6, 8]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Colisión del portón abierto (hueco) */}
      <CuboidCollider args={[3, 4, 1.5]} position={[-4, 4, 0]} />
      <CuboidCollider args={[3, 4, 1.5]} position={[4, 4, 0]} />
      <CuboidCollider args={[4, 2, 1.5]} position={[0, 7, 0]} />
    </RigidBody>
  );
}

function MainBuilding() {
  return (
    <RigidBody type="fixed" position={[0, 0, -30]} colliders="cuboid">
      {/* Edificio principal */}
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[20, 12, 15]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
      </mesh>

      {/* Techo */}
      <mesh position={[0, 13, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[16, 6, 4]} />
        <meshStandardMaterial color="#4a3030" roughness={0.8} />
      </mesh>

      {/* Puertas */}
      <mesh position={[0, 2.5, 7.6]}>
        <boxGeometry args={[4, 5, 0.3]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>

      {/* Ventanas */}
      {[-6, 6].map((x) =>
        [3, 8].map((y) => (
          <mesh key={`${x}-${y}`} position={[x, y, 7.6]}>
            <boxGeometry args={[2, 3, 0.2]} />
            <meshStandardMaterial color="#2a4a6a" roughness={0.3} />
          </mesh>
        ))
      )}
    </RigidBody>
  );
}

function Courtyard() {
  return (
    <group position={[0, 0, 0]}>
      {/* Suelo del patio */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#6a6a5a" roughness={0.95} />
        </mesh>
      </RigidBody>

      {/* Fuente central */}
      <RigidBody type="fixed" position={[0, 0, 0]} colliders="hull">
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[4, 4.5, 1, 16]} />
          <meshStandardMaterial color="#7a7a7a" roughness={0.8} />
        </mesh>
        {/* Agua de la fuente */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[3.5, 3.5, 0.3, 16]} />
          <MeshReflectorMaterial
            mirror={0.5}
            color="#4488aa"
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
        {/* Estatua central */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.8, 4, 8]} />
          <meshStandardMaterial color="#888888" roughness={0.6} metalness={0.2} />
        </mesh>
      </RigidBody>

      {/* Antorchas */}
      {[
        [-15, 15], [15, 15], [-15, -15], [15, -15],
        [-25, 0], [25, 0], [0, 25], [0, -20]
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 4, 8]} />
            <meshStandardMaterial color="#4a3020" roughness={0.9} />
          </mesh>
          <pointLight
            position={[0, 4.5, 0]}
            color="#ff6622"
            intensity={2}
            distance={15}
            castShadow
          />
        </group>
      ))}
    </group>
  );
}

function TrainingDummies() {
  const positions: [number, number, number][] = [
    [-20, 0, 10],
    [-18, 0, 15],
    [-22, 0, 15],
  ];

  return (
    <group>
      {positions.map((pos, i) => (
        <RigidBody key={i} type="fixed" position={pos} colliders="cuboid">
          {/* Poste */}
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 2, 8]} />
            <meshStandardMaterial color="#5a4030" roughness={0.9} />
          </mesh>
          {/* Cuerpo del dummy */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <capsuleGeometry args={[0.4, 1, 8, 16]} />
            <meshStandardMaterial color="#a08060" roughness={0.9} />
          </mesh>
          {/* Brazos */}
          <mesh position={[0.6, 2.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
            <meshStandardMaterial color="#5a4030" roughness={0.9} />
          </mesh>
          <mesh position={[-0.6, 2.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
            <meshStandardMaterial color="#5a4030" roughness={0.9} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}

// ============================================================
// NIVEL PRINCIPAL
// ============================================================

interface CastleLevelProps {
  timeOfDay?: number; // 0-24
  showAmbience?: boolean;
}

export function CastleLevel({
  timeOfDay = 12,
  showAmbience = true,
}: CastleLevelProps) {
  return (
    <group name="castle-level">
      {/* Cielo */}
      <UltraSkySystem initialTime={timeOfDay} />

      {/* Luz principal */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[50, 100, 30]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      {/* Torres de las esquinas */}
      <Tower position={[-35, 0, -35]} />
      <Tower position={[35, 0, -35]} />
      <Tower position={[-35, 0, 35]} />
      <Tower position={[35, 0, 35]} />

      {/* Murallas */}
      <Wall position={[0, 0, 35]} length={70} />
      <Wall position={[0, 0, -35]} length={70} />
      <Wall position={[-35, 0, 0]} rotation={[0, Math.PI / 2, 0]} length={70} />
      <Wall position={[35, 0, 0]} rotation={[0, Math.PI / 2, 0]} length={70} />

      {/* Portón principal */}
      <Gate position={[0, 0, 35]} />

      {/* Edificio principal */}
      <MainBuilding />

      {/* Patio interior */}
      <Courtyard />

      {/* Área de entrenamiento */}
      <TrainingDummies />

      {/* Partículas ambientales */}
      {showAmbience && <ForestAmbience />}

      {/* Mejoras visuales */}
      <SceneEnhancer biome="castle" weather />

      {/* Suelo exterior (hierba) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.1, 0]}
          receiveShadow
        >
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#3a5a2a" roughness={0.9} />
        </mesh>
      </RigidBody>
    </group>
  );
}

// ============================================================
// SPAWN POINTS
// ============================================================

export const CASTLE_SPAWN_POINTS = {
  entrance: new THREE.Vector3(0, 1, 30),
  courtyard: new THREE.Vector3(0, 1, 0),
  trainingArea: new THREE.Vector3(-20, 1, 12),
  mainHall: new THREE.Vector3(0, 1, -22),
};

export default CastleLevel;
