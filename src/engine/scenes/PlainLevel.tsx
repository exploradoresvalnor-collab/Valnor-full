/**
 * PlainLevel - Nivel de Llanuras
 * Llanuras abiertas con granjas, molinos, cercas y campos de cultivo
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Float, Sparkles } from '@react-three/drei';
import { UltraSkySystem } from '../systems/UltraSkySystem';
import { InstancedGrass } from '../systems/InstancedGrass';
import { WildlifeSystem } from '../systems/WildlifeSystem';
import { ForestAmbience } from '../systems/AmbientParticlesSystem';

// ============================================================
// COMPONENTES DE LA LLANURA
// ============================================================

interface WindmillProps {
  position: [number, number, number];
  scale?: number;
}

function Windmill({ position, scale = 1 }: WindmillProps) {
  const bladesRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider args={[2 * scale, 6 * scale, 2 * scale]} position={[0, 6 * scale, 0]} />
      
      {/* Torre del molino */}
      <mesh position={[0, 6 * scale, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5 * scale, 2.5 * scale, 12 * scale, 6]} />
        <meshStandardMaterial color="#d4c4a8" roughness={0.9} />
      </mesh>

      {/* Techo */}
      <mesh position={[0, 12.5 * scale, 0]} castShadow>
        <coneGeometry args={[2 * scale, 3 * scale, 6]} />
        <meshStandardMaterial color="#5a4030" roughness={0.9} />
      </mesh>

      {/* Aspas */}
      <group ref={bladesRef} position={[0, 9 * scale, 1.6 * scale]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh 
            key={i} 
            rotation={[0, 0, (i * Math.PI) / 2]}
            position={[0, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.5 * scale, 6 * scale, 0.1 * scale]} />
            <meshStandardMaterial color="#8a7060" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Puerta */}
      <mesh position={[0, 1.5 * scale, 2 * scale]}>
        <boxGeometry args={[1.5 * scale, 3 * scale, 0.2 * scale]} />
        <meshStandardMaterial color="#5a4030" roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

interface FarmhouseProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

function Farmhouse({ position, rotation = [0, 0, 0] }: FarmhouseProps) {
  return (
    <RigidBody type="fixed" position={position} rotation={rotation} colliders="cuboid">
      {/* Cuerpo de la casa */}
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 4, 6]} />
        <meshStandardMaterial color="#c4a482" roughness={0.9} />
      </mesh>

      {/* Techo */}
      <mesh position={[0, 5, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[9, 1, 7]} />
        <meshStandardMaterial color="#8b4513" roughness={0.9} />
      </mesh>
      <mesh position={[0, 5.8, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
        <extrudeGeometry args={[
          new THREE.Shape([
            new THREE.Vector2(-4.5, 0),
            new THREE.Vector2(0, 2.5),
            new THREE.Vector2(4.5, 0),
          ]),
          { depth: 7, bevelEnabled: false }
        ]} />
        <meshStandardMaterial color="#6a3a1a" roughness={0.9} />
      </mesh>

      {/* Puerta */}
      <mesh position={[0, 1.5, 3.1]}>
        <boxGeometry args={[1.5, 3, 0.2]} />
        <meshStandardMaterial color="#5a4030" roughness={0.9} />
      </mesh>

      {/* Ventanas */}
      {[[-2.5, 2.5], [2.5, 2.5]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 3.1]}>
          <boxGeometry args={[1.2, 1.2, 0.1]} />
          <meshStandardMaterial color="#88aacc" roughness={0.3} metalness={0.1} />
        </mesh>
      ))}

      {/* Chimenea */}
      <mesh position={[3, 6, -1]} castShadow>
        <boxGeometry args={[1, 3, 1]} />
        <meshStandardMaterial color="#8a7a6a" roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

interface FenceProps {
  start: [number, number, number];
  end: [number, number, number];
  postSpacing?: number;
}

function Fence({ start, end, postSpacing = 3 }: FenceProps) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = endVec.clone().sub(startVec);
  const length = direction.length();
  const center = startVec.clone().add(endVec).multiplyScalar(0.5);
  const angle = Math.atan2(direction.x, direction.z);

  const posts = Math.floor(length / postSpacing) + 1;

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider 
        args={[0.1, 0.6, length / 2]} 
        position={[center.x, 0.6, center.z]}
        rotation={[0, angle, 0]}
      />

      {/* Postes */}
      {Array.from({ length: posts }).map((_, i) => {
        const t = i / (posts - 1);
        const pos = startVec.clone().lerp(endVec, t);
        
        return (
          <mesh key={i} position={[pos.x, 0.6, pos.z]} castShadow>
            <boxGeometry args={[0.15, 1.2, 0.15]} />
            <meshStandardMaterial color="#6a5040" roughness={0.9} />
          </mesh>
        );
      })}

      {/* Rieles horizontales */}
      {[0.3, 0.8].map((y, idx) => (
        <mesh 
          key={idx}
          position={[center.x, y, center.z]} 
          rotation={[0, angle, 0]}
          castShadow
        >
          <boxGeometry args={[0.1, 0.1, length]} />
          <meshStandardMaterial color="#5a4030" roughness={0.9} />
        </mesh>
      ))}
    </RigidBody>
  );
}

interface CropFieldProps {
  position: [number, number, number];
  size?: [number, number];
  cropType?: 'wheat' | 'corn' | 'carrot';
}

function CropField({ 
  position, 
  size = [10, 10], 
  cropType = 'wheat' 
}: CropFieldProps) {
  const crops = useMemo(() => {
    const cropData = [];
    const [width, depth] = size;
    const spacing = 0.8;
    const rows = Math.floor(width / spacing);
    const cols = Math.floor(depth / spacing);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        cropData.push({
          x: (i - rows / 2) * spacing + (Math.random() - 0.5) * 0.2,
          z: (j - cols / 2) * spacing + (Math.random() - 0.5) * 0.2,
          height: 0.4 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    return cropData;
  }, [size]);

  const colors = {
    wheat: '#d4aa44',
    corn: '#44aa44',
    carrot: '#44aa22',
  };

  return (
    <group position={position}>
      {/* Suelo de cultivo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.95} />
      </mesh>

      {/* Cultivos */}
      {crops.map((crop, i) => (
        <Float key={i} floatIntensity={0.05} speed={2}>
          <mesh position={[crop.x, crop.height / 2, crop.z]}>
            <cylinderGeometry args={[0.02, 0.03, crop.height, 6]} />
            <meshStandardMaterial color={colors[cropType]} roughness={0.8} />
          </mesh>
          {cropType === 'wheat' && (
            <mesh position={[crop.x, crop.height + 0.1, crop.z]}>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshStandardMaterial color="#c49a34" roughness={0.9} />
            </mesh>
          )}
        </Float>
      ))}
    </group>
  );
}

function HayBale({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position} colliders="cuboid">
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, Math.random() * Math.PI]}>
        <cylinderGeometry args={[0.8, 0.8, 1.2, 12]} />
        <meshStandardMaterial color="#c4a444" roughness={0.95} />
      </mesh>
    </RigidBody>
  );
}

function Well({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position} colliders="hull">
      {/* Base de piedra */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.3, 1, 8]} />
        <meshStandardMaterial color="#7a7a7a" roughness={0.95} />
      </mesh>

      {/* Interior (agua) */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.1, 16]} />
        <meshStandardMaterial color="#3366aa" roughness={0.2} />
      </mesh>

      {/* Postes del techo */}
      <mesh position={[-1, 1.5, 0]} castShadow>
        <boxGeometry args={[0.15, 2, 0.15]} />
        <meshStandardMaterial color="#5a4030" roughness={0.9} />
      </mesh>
      <mesh position={[1, 1.5, 0]} castShadow>
        <boxGeometry args={[0.15, 2, 0.15]} />
        <meshStandardMaterial color="#5a4030" roughness={0.9} />
      </mesh>

      {/* Techo */}
      <mesh position={[0, 2.8, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[1.5, 0.8, 4]} />
        <meshStandardMaterial color="#6a3a1a" roughness={0.9} />
      </mesh>

      {/* Cubo */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.4, 0.5, 0.4]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

// ============================================================
// NIVEL PRINCIPAL
// ============================================================

interface PlainLevelProps {
  timeOfDay?: number;
  showWildlife?: boolean;
  showGrass?: boolean;
}

export function PlainLevel({
  timeOfDay = 11,
  showWildlife = true,
  showGrass = true,
}: PlainLevelProps) {
  return (
    <group name="plain-level">
      {/* Cielo */}
      <UltraSkySystem initialTime={timeOfDay} />

      {/* Iluminación */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[40, 80, 30]}
        intensity={1.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      {/* Suelo principal */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#5a8a3a" roughness={0.95} />
        </mesh>
      </RigidBody>

      {/* Camino de tierra */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[6, 200]} />
        <meshStandardMaterial color="#8a7a5a" roughness={0.95} />
      </mesh>

      {/* Molinos */}
      <Windmill position={[-30, 0, 20]} scale={1.2} />
      <Windmill position={[40, 0, -30]} scale={0.9} />

      {/* Granjas */}
      <Farmhouse position={[-25, 0, -25]} rotation={[0, Math.PI / 6, 0]} />
      <Farmhouse position={[30, 0, 35]} rotation={[0, -Math.PI / 4, 0]} />

      {/* Campos de cultivo */}
      <CropField position={[-50, 0.01, 20]} size={[20, 15]} cropType="wheat" />
      <CropField position={[-50, 0.01, -10]} size={[15, 20]} cropType="corn" />
      <CropField position={[50, 0.01, -20]} size={[18, 18]} cropType="wheat" />

      {/* Cercas */}
      <Fence start={[-60, 0, 30]} end={[-40, 0, 30]} />
      <Fence start={[-40, 0, 30]} end={[-40, 0, 10]} />
      <Fence start={[-40, 0, 10]} end={[-60, 0, 10]} />
      <Fence start={[-60, 0, 10]} end={[-60, 0, 30]} />

      <Fence start={[40, 0, -10]} end={[60, 0, -10]} />
      <Fence start={[60, 0, -10]} end={[60, 0, -30]} />
      <Fence start={[60, 0, -30]} end={[40, 0, -30]} />
      <Fence start={[40, 0, -30]} end={[40, 0, -10]} />

      {/* Balas de heno */}
      {[
        [-18, 0.6, -20], [-16, 0.6, -22], [-20, 0.6, -21],
        [35, 0.6, 28], [33, 0.6, 30], [37, 0.6, 31],
      ].map((pos, i) => (
        <HayBale key={i} position={pos as [number, number, number]} />
      ))}

      {/* Pozos */}
      <Well position={[-20, 0, -15]} />
      <Well position={[25, 0, 25]} />

      {/* Hierba */}
      {showGrass && (
        <>
          <InstancedGrass count={20000} area={80} position={[0, 0, 0]} bladeHeight={0.35} />
          <InstancedGrass count={10000} area={50} position={[-60, 0, 50]} bladeHeight={0.4} />
          <InstancedGrass count={10000} area={50} position={[60, 0, -50]} bladeHeight={0.4} />
        </>
      )}

      {/* Fauna */}
      {showWildlife && <WildlifeSystem maxAnimals={30} spawnRadius={80} />}

      {/* Partículas */}
      <ForestAmbience />

      {/* Sparkles en campos de trigo */}
      <Sparkles
        position={[-50, 1, 20]}
        count={40}
        size={2}
        speed={0.2}
        scale={[25, 3, 20]}
        color="#ffdd88"
        opacity={0.4}
      />
    </group>
  );
}

// ============================================================
// SPAWN POINTS
// ============================================================

export const PLAIN_SPAWN_POINTS = {
  roadCenter: new THREE.Vector3(0, 1, 0),
  westFarm: new THREE.Vector3(-25, 1, -20),
  eastFarm: new THREE.Vector3(30, 1, 30),
  westMill: new THREE.Vector3(-30, 1, 15),
  eastMill: new THREE.Vector3(40, 1, -25),
  wheatField: new THREE.Vector3(-50, 1, 20),
};

export default PlainLevel;
