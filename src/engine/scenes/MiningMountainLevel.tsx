/**
 * MiningMountainLevel - Nivel de Montaña Minera / Cueva de Goblins
 * Mina abandonada con túneles, vagonetas, cristales y goblins
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Float, Sparkles } from '@react-three/drei';
import { CaveAmbience } from '../systems/AmbientParticlesSystem';
import { SceneEnhancer } from '../components/SceneEnhancer';

// ============================================================
// COMPONENTES DE LA MINA
// ============================================================

interface TunnelProps {
  start: [number, number, number];
  end: [number, number, number];
  width?: number;
  height?: number;
}

function Tunnel({ start, end, width = 4, height = 4 }: TunnelProps) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = endVec.clone().sub(startVec);
  const length = direction.length();
  const center = startVec.clone().add(endVec).multiplyScalar(0.5);
  
  const angle = Math.atan2(direction.x, direction.z);

  return (
    <RigidBody type="fixed" colliders={false}>
      {/* Suelo del túnel */}
      <CuboidCollider 
        args={[width / 2, 0.5, length / 2]} 
        position={[center.x, center.y - height / 2, center.z]}
        rotation={[0, angle, 0]}
      />
      <mesh 
        position={[center.x, center.y - height / 2 + 0.25, center.z]} 
        rotation={[0, angle, 0]}
        receiveShadow
      >
        <boxGeometry args={[width, 0.5, length]} />
        <meshStandardMaterial color="#4a4040" roughness={0.95} />
      </mesh>

      {/* Paredes del túnel */}
      <mesh 
        position={[center.x - Math.cos(angle) * width / 2, center.y, center.z + Math.sin(angle) * width / 2]} 
        rotation={[0, angle, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.5, height, length]} />
        <meshStandardMaterial color="#3a3535" roughness={0.95} />
      </mesh>
      <mesh 
        position={[center.x + Math.cos(angle) * width / 2, center.y, center.z - Math.sin(angle) * width / 2]} 
        rotation={[0, angle, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.5, height, length]} />
        <meshStandardMaterial color="#3a3535" roughness={0.95} />
      </mesh>

      {/* Techo del túnel */}
      <mesh 
        position={[center.x, center.y + height / 2, center.z]} 
        rotation={[0, angle, 0]}
        receiveShadow
      >
        <boxGeometry args={[width + 1, 0.5, length]} />
        <meshStandardMaterial color="#2a2525" roughness={0.95} />
      </mesh>

      {/* Soportes de madera */}
      {Array.from({ length: Math.floor(length / 5) }).map((_, i) => {
        const t = (i + 0.5) / Math.floor(length / 5);
        const pos = startVec.clone().lerp(endVec, t);
        
        return (
          <group key={i}>
            {/* Postes verticales */}
            <mesh position={[pos.x - width / 2 + 0.3, pos.y, pos.z]} castShadow>
              <boxGeometry args={[0.3, height, 0.3]} />
              <meshStandardMaterial color="#5a4030" roughness={0.9} />
            </mesh>
            <mesh position={[pos.x + width / 2 - 0.3, pos.y, pos.z]} castShadow>
              <boxGeometry args={[0.3, height, 0.3]} />
              <meshStandardMaterial color="#5a4030" roughness={0.9} />
            </mesh>
            {/* Travesaño horizontal */}
            <mesh position={[pos.x, pos.y + height / 2 - 0.2, pos.z]} castShadow>
              <boxGeometry args={[width, 0.3, 0.3]} />
              <meshStandardMaterial color="#5a4030" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </RigidBody>
  );
}

interface CrystalClusterProps {
  position: [number, number, number];
  color?: string;
  count?: number;
  scale?: number;
}

function CrystalCluster({ 
  position, 
  color = '#66aaff', 
  count = 5,
  scale = 1 
}: CrystalClusterProps) {
  const crystals = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const radius = Math.random() * 0.5 * scale;
      data.push({
        position: [
          Math.cos(angle) * radius,
          Math.random() * 0.3 * scale,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        rotation: [
          (Math.random() - 0.5) * 0.3,
          Math.random() * Math.PI,
          (Math.random() - 0.5) * 0.3,
        ] as [number, number, number],
        height: (0.5 + Math.random() * 1) * scale,
        radius: (0.1 + Math.random() * 0.15) * scale,
      });
    }
    return data;
  }, [count, scale]);

  return (
    <group position={position}>
      {crystals.map((crystal, i) => (
        <Float key={i} floatIntensity={0.05} speed={1}>
          <mesh 
            position={crystal.position} 
            rotation={crystal.rotation}
            castShadow
          >
            <coneGeometry args={[crystal.radius, crystal.height, 6]} />
            <meshStandardMaterial 
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
              transparent
              opacity={0.85}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
        </Float>
      ))}
      
      {/* Luz del cristal */}
      <pointLight 
        position={[0, 0.5 * scale, 0]} 
        color={color} 
        intensity={1} 
        distance={8 * scale} 
      />
    </group>
  );
}

function MineCart({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">
      {/* Cuerpo de la vagoneta */}
      <mesh castShadow>
        <boxGeometry args={[1.5, 1, 2]} />
        <meshStandardMaterial color="#5a5050" roughness={0.8} metalness={0.3} />
      </mesh>
      
      {/* Ruedas */}
      {[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.6, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 12]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Contenido (piedras/minerales) */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.5, 6, 6]} />
        <meshStandardMaterial color="#6a5a4a" roughness={0.95} flatShading />
      </mesh>
    </RigidBody>
  );
}

interface RailTracksProps {
  start: [number, number, number];
  end: [number, number, number];
}

function RailTracks({ start, end }: RailTracksProps) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = endVec.clone().sub(startVec);
  const length = direction.length();
  const center = startVec.clone().add(endVec).multiplyScalar(0.5);
  const angle = Math.atan2(direction.x, direction.z);

  const sleepers = Math.floor(length / 1.5);

  return (
    <group>
      {/* Rieles */}
      <mesh position={[center.x - 0.4, center.y + 0.1, center.z]} rotation={[0, angle, 0]}>
        <boxGeometry args={[0.08, 0.1, length]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[center.x + 0.4, center.y + 0.1, center.z]} rotation={[0, angle, 0]}>
        <boxGeometry args={[0.08, 0.1, length]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Durmientes */}
      {Array.from({ length: sleepers }).map((_, i) => {
        const t = (i + 0.5) / sleepers;
        const pos = startVec.clone().lerp(endVec, t);
        
        return (
          <mesh key={i} position={[pos.x, pos.y, pos.z]} rotation={[0, angle + Math.PI / 2, 0]}>
            <boxGeometry args={[1.2, 0.1, 0.15]} />
            <meshStandardMaterial color="#5a4030" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function Torch({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      // Parpadeo de la antorcha
      lightRef.current.intensity = 1.5 + Math.sin(state.clock.elapsedTime * 10) * 0.3;
    }
  });

  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.8, 8]} />
        <meshStandardMaterial color="#5a4030" roughness={0.9} />
      </mesh>
      
      {/* Llama (simple) */}
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshBasicMaterial color="#ff6622" />
      </mesh>
      
      <pointLight 
        ref={lightRef}
        position={[0, 0.5, 0]} 
        color="#ff6622" 
        intensity={1.5} 
        distance={12}
        castShadow
      />
    </group>
  );
}

function CaveRoom({ position, size = 15 }: { position: [number, number, number]; size?: number }) {
  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      {/* Suelo */}
      <CuboidCollider args={[size / 2, 0.5, size / 2]} position={[0, -0.5, 0]} />
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[size / 2, 16]} />
        <meshStandardMaterial color="#3a3535" roughness={0.95} />
      </mesh>

      {/* Paredes irregulares */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const dist = size / 2 - 0.5;
        const height = 6 + Math.random() * 4;
        
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * dist,
              height / 2,
              Math.sin(angle) * dist,
            ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[3, height, 1]} />
            <meshStandardMaterial color="#2a2525" roughness={0.95} />
          </mesh>
        );
      })}

      {/* Estalactitas */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + Math.random();
        const dist = Math.random() * (size / 2 - 2);
        
        return (
          <mesh
            key={`stalactite-${i}`}
            position={[
              Math.cos(angle) * dist,
              8 - Math.random() * 2,
              Math.sin(angle) * dist,
            ]}
            castShadow
          >
            <coneGeometry args={[0.2 + Math.random() * 0.3, 1 + Math.random() * 2, 6]} />
            <meshStandardMaterial color="#4a4040" roughness={0.95} />
          </mesh>
        );
      })}
    </RigidBody>
  );
}

// ============================================================
// NIVEL PRINCIPAL
// ============================================================

interface MiningMountainLevelProps {
  showCrystals?: boolean;
  showEffects?: boolean;
}

export function MiningMountainLevel({
  showCrystals = true,
  showEffects = true,
}: MiningMountainLevelProps) {
  return (
    <group name="mining-mountain-level">
      {/* Iluminación ambiental oscura */}
      <ambientLight intensity={0.15} color="#4a4a5a" />

      {/* Entrada de la mina */}
      <CaveRoom position={[0, 0, 0]} size={20} />

      {/* Túneles principales */}
      <Tunnel start={[0, 0, 10]} end={[0, 0, 40]} />
      <Tunnel start={[-10, 0, 0]} end={[-40, 0, 0]} />
      <Tunnel start={[10, 0, 0]} end={[40, 0, 0]} />
      <Tunnel start={[0, 0, -10]} end={[0, -5, -35]} height={5} /> {/* Túnel descendente */}

      {/* Salas conectadas */}
      <CaveRoom position={[0, 0, 50]} size={12} />
      <CaveRoom position={[-50, 0, 0]} size={15} />
      <CaveRoom position={[50, 0, 0]} size={10} />
      <CaveRoom position={[0, -5, -45]} size={18} />

      {/* Vías de tren */}
      <RailTracks start={[0, 0.01, 10]} end={[0, 0.01, 50]} />
      <RailTracks start={[-10, 0.01, 0]} end={[-50, 0.01, 0]} />

      {/* Vagonetas */}
      <MineCart position={[0, 0.5, 25]} />
      <MineCart position={[-30, 0.5, 0]} />

      {/* Antorchas */}
      {[
        [5, 2, 5], [-5, 2, 5], [5, 2, -5], [-5, 2, -5],
        [0, 2, 20], [0, 2, 35],
        [-20, 2, 0], [-35, 2, 0],
        [20, 2, 0], [35, 2, 0],
        [0, 2, -20],
      ].map((pos, i) => (
        <Torch key={i} position={pos as [number, number, number]} />
      ))}

      {/* Cristales */}
      {showCrystals && (
        <>
          <CrystalCluster position={[8, 0, 8]} color="#66aaff" count={7} scale={1.2} />
          <CrystalCluster position={[-8, 0, -5]} color="#aa66ff" count={5} scale={0.8} />
          <CrystalCluster position={[0, 0, 48]} color="#66ffaa" count={6} scale={1} />
          <CrystalCluster position={[-48, 0, 3]} color="#ffaa66" count={8} scale={1.5} />
          <CrystalCluster position={[48, 0, -2]} color="#ff66aa" count={4} scale={0.7} />
          <CrystalCluster position={[5, -5, -43]} color="#66ffff" count={10} scale={2} />
        </>
      )}

      {/* Partículas ambientales */}
      {showEffects && <CaveAmbience />}

      {/* Mejoras visuales (bloom alto para cristales emisivos) */}
      <SceneEnhancer biome="mine" />

      {/* Sparkles de minerales */}
      {showEffects && (
        <Sparkles
          position={[0, 3, 0]}
          count={100}
          size={2}
          speed={0.2}
          scale={[80, 10, 80]}
          color="#ffdd88"
          opacity={0.4}
        />
      )}
    </group>
  );
}

// ============================================================
// SPAWN POINTS
// ============================================================

export const MINING_SPAWN_POINTS = {
  entrance: new THREE.Vector3(0, 1, 0),
  northChamber: new THREE.Vector3(0, 1, 50),
  westChamber: new THREE.Vector3(-50, 1, 0),
  eastChamber: new THREE.Vector3(50, 1, 0),
  deepChamber: new THREE.Vector3(0, -4, -45),
};

export default MiningMountainLevel;
