/**
 * ValleyLevel - Nivel de Valle Natural
 * Valle con río, puentes, árboles y montañas
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier';
import { MeshReflectorMaterial, Float, Sparkles } from '@react-three/drei';
import { UltraSkySystem } from '../systems/UltraSkySystem';
import { InstancedGrass } from '../systems/InstancedGrass';
import { ForestAmbience } from '../systems/AmbientParticlesSystem';
import { WildlifeSystem } from '../systems/WildlifeSystem';

// ============================================================
// COMPONENTES DEL VALLE
// ============================================================

interface TreeProps {
  position: [number, number, number];
  scale?: number;
  treeType?: 'oak' | 'pine' | 'willow';
}

function Tree({ position, scale = 1, treeType = 'oak' }: TreeProps) {
  const colors = {
    oak: { trunk: '#5a4030', leaves: '#2d5a1e' },
    pine: { trunk: '#4a3525', leaves: '#1a4a1a' },
    willow: { trunk: '#6a5040', leaves: '#3a6a2a' },
  };

  const { trunk, leaves } = colors[treeType];

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CylinderCollider args={[2 * scale, 0.3 * scale]} position={[0, 2 * scale, 0]} />
      
      {/* Tronco */}
      <mesh position={[0, 2 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.3 * scale, 0.5 * scale, 4 * scale, 8]} />
        <meshStandardMaterial color={trunk} roughness={0.9} />
      </mesh>

      {/* Copa del árbol */}
      {treeType === 'pine' ? (
        // Pino: conos apilados
        <>
          <mesh position={[0, 5 * scale, 0]} castShadow>
            <coneGeometry args={[2 * scale, 3 * scale, 8]} />
            <meshStandardMaterial color={leaves} roughness={0.8} />
          </mesh>
          <mesh position={[0, 7 * scale, 0]} castShadow>
            <coneGeometry args={[1.5 * scale, 2.5 * scale, 8]} />
            <meshStandardMaterial color={leaves} roughness={0.8} />
          </mesh>
          <mesh position={[0, 8.5 * scale, 0]} castShadow>
            <coneGeometry args={[1 * scale, 2 * scale, 8]} />
            <meshStandardMaterial color={leaves} roughness={0.8} />
          </mesh>
        </>
      ) : (
        // Roble/Sauce: esfera
        <mesh position={[0, 5.5 * scale, 0]} castShadow>
          <sphereGeometry args={[2.5 * scale, 8, 8]} />
          <meshStandardMaterial color={leaves} roughness={0.8} />
        </mesh>
      )}
    </RigidBody>
  );
}

interface RockProps {
  position: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}

function Rock({ position, scale = 1, rotation = [0, 0, 0] }: RockProps) {
  return (
    <RigidBody type="fixed" position={position} rotation={rotation} colliders="hull">
      <mesh castShadow receiveShadow scale={scale}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color="#6a6a6a" 
          roughness={0.95} 
          flatShading
        />
      </mesh>
    </RigidBody>
  );
}

function River() {
  return (
    <group position={[0, -0.3, 0]}>
      {/* Cauce del río */}
      <RigidBody type="fixed" colliders={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <planeGeometry args={[12, 150]} />
          <MeshReflectorMaterial
            mirror={0.7}
            color="#3388aa"
            roughness={0.1}
            metalness={0.1}
            blur={[300, 100]}
            mixStrength={0.8}
          />
        </mesh>

        {/* Colisión del agua (no sólida, pero detecta) */}
        <CuboidCollider 
          args={[6, 0.5, 75]} 
          position={[0, -0.3, 0]} 
          sensor
        />
      </RigidBody>

      {/* Orillas */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-7, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[3, 150]} />
          <meshStandardMaterial color="#5a4a3a" roughness={0.95} />
        </mesh>
        <mesh position={[7, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[3, 150]} />
          <meshStandardMaterial color="#5a4a3a" roughness={0.95} />
        </mesh>
      </RigidBody>
    </group>
  );
}

interface BridgeProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

function Bridge({ position, rotation = [0, 0, 0] }: BridgeProps) {
  return (
    <RigidBody type="fixed" position={position} rotation={rotation} colliders="cuboid">
      {/* Tablero del puente */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.4, 14]} />
        <meshStandardMaterial color="#6a5040" roughness={0.9} />
      </mesh>

      {/* Barandillas */}
      <mesh position={[-2.8, 1, 0]} castShadow>
        <boxGeometry args={[0.2, 1.5, 14]} />
        <meshStandardMaterial color="#5a4030" roughness={0.9} />
      </mesh>
      <mesh position={[2.8, 1, 0]} castShadow>
        <boxGeometry args={[0.2, 1.5, 14]} />
        <meshStandardMaterial color="#5a4030" roughness={0.9} />
      </mesh>

      {/* Postes de las barandillas */}
      {[-6, -3, 0, 3, 6].map((z) => (
        <group key={z}>
          <mesh position={[-2.8, 1.2, z]} castShadow>
            <boxGeometry args={[0.3, 2, 0.3]} />
            <meshStandardMaterial color="#5a4030" roughness={0.9} />
          </mesh>
          <mesh position={[2.8, 1.2, z]} castShadow>
            <boxGeometry args={[0.3, 2, 0.3]} />
            <meshStandardMaterial color="#5a4030" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Pilares de soporte */}
      <mesh position={[-2, -1, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 3, 8]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
      </mesh>
      <mesh position={[2, -1, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 3, 8]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

function Mountain({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <RigidBody type="fixed" position={position} colliders="hull">
      <mesh castShadow receiveShadow scale={scale}>
        <coneGeometry args={[15, 30, 6]} />
        <meshStandardMaterial 
          color="#5a5a4a" 
          roughness={0.95} 
          flatShading
        />
      </mesh>
      {/* Nieve en la cima */}
      <mesh position={[0, 12 * scale, 0]} scale={scale * 0.5}>
        <coneGeometry args={[5, 8, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
    </RigidBody>
  );
}

function Flowers({ count = 50, area = 30, position = [0, 0, 0] as [number, number, number] }) {
  const flowers = useMemo(() => {
    const flowerData = [];
    const colors = ['#ff6b9d', '#ffdb6b', '#6b9fff', '#ff9d6b', '#9dff6b'];
    
    for (let i = 0; i < count; i++) {
      flowerData.push({
        position: [
          (Math.random() - 0.5) * area,
          0.1,
          (Math.random() - 0.5) * area,
        ] as [number, number, number],
        color: colors[Math.floor(Math.random() * colors.length)],
        scale: 0.3 + Math.random() * 0.3,
      });
    }
    return flowerData;
  }, [count, area]);

  return (
    <group position={position}>
      {flowers.map((flower, i) => (
        <Float key={i} floatIntensity={0.2} speed={2}>
          <mesh position={flower.position} scale={flower.scale}>
            <sphereGeometry args={[0.1, 6, 6]} />
            <meshStandardMaterial color={flower.color} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// ============================================================
// NIVEL PRINCIPAL
// ============================================================

interface ValleyLevelProps {
  timeOfDay?: number;
  showWildlife?: boolean;
  showGrass?: boolean;
}

export function ValleyLevel({
  timeOfDay = 10,
  showWildlife = true,
  showGrass = true,
}: ValleyLevelProps) {
  // Posiciones de árboles
  const trees = useMemo(() => {
    const treeData: { pos: [number, number, number]; type: 'oak' | 'pine' | 'willow'; scale: number }[] = [];
    
    // Bosque izquierdo
    for (let i = 0; i < 20; i++) {
      treeData.push({
        pos: [-20 - Math.random() * 30, 0, -50 + Math.random() * 100],
        type: Math.random() > 0.5 ? 'oak' : 'pine',
        scale: 0.8 + Math.random() * 0.5,
      });
    }
    
    // Bosque derecho
    for (let i = 0; i < 20; i++) {
      treeData.push({
        pos: [20 + Math.random() * 30, 0, -50 + Math.random() * 100],
        type: Math.random() > 0.5 ? 'oak' : 'pine',
        scale: 0.8 + Math.random() * 0.5,
      });
    }

    return treeData;
  }, []);

  // Posiciones de rocas
  const rocks = useMemo(() => {
    const rockData: { pos: [number, number, number]; scale: number; rot: [number, number, number] }[] = [];
    
    for (let i = 0; i < 15; i++) {
      rockData.push({
        pos: [
          (Math.random() - 0.5) * 80,
          Math.random() * 0.5,
          (Math.random() - 0.5) * 100,
        ],
        scale: 0.5 + Math.random() * 1.5,
        rot: [Math.random(), Math.random(), Math.random()],
      });
    }
    
    return rockData;
  }, []);

  return (
    <group name="valley-level">
      {/* Cielo */}
      <UltraSkySystem initialTime={timeOfDay} />

      {/* Iluminación */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[30, 80, 50]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />

      {/* Suelo principal */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#4a7a3a" roughness={0.95} />
        </mesh>
      </RigidBody>

      {/* Río */}
      <River />

      {/* Puentes */}
      <Bridge position={[0, 0.5, -30]} />
      <Bridge position={[0, 0.5, 30]} />

      {/* Montañas de fondo */}
      <Mountain position={[-70, 0, -60]} scale={1.5} />
      <Mountain position={[70, 0, -70]} scale={1.2} />
      <Mountain position={[0, 0, -90]} scale={2} />

      {/* Árboles */}
      {trees.map((tree, i) => (
        <Tree key={i} position={tree.pos} treeType={tree.type} scale={tree.scale} />
      ))}

      {/* Rocas */}
      {rocks.map((rock, i) => (
        <Rock key={i} position={rock.pos} scale={rock.scale} rotation={rock.rot} />
      ))}

      {/* Flores */}
      <Flowers count={80} area={40} position={[-25, 0, 0]} />
      <Flowers count={80} area={40} position={[25, 0, 0]} />

      {/* Hierba instanciada */}
      {showGrass && (
        <>
          <InstancedGrass 
            count={15000} 
            area={60} 
            position={[-30, 0, 0]}
            bladeHeight={0.4}
          />
          <InstancedGrass 
            count={15000} 
            area={60} 
            position={[30, 0, 0]}
            bladeHeight={0.4}
          />
        </>
      )}

      {/* Fauna */}
      {showWildlife && <WildlifeSystem maxAnimals={25} spawnRadius={50} />}

      {/* Partículas ambientales */}
      <ForestAmbience />

      {/* Sparkles cerca del agua */}
      <Sparkles
        position={[0, 1, -30]}
        count={30}
        size={3}
        speed={0.3}
        scale={[15, 5, 15]}
        color="#aaddff"
      />
      <Sparkles
        position={[0, 1, 30]}
        count={30}
        size={3}
        speed={0.3}
        scale={[15, 5, 15]}
        color="#aaddff"
      />
    </group>
  );
}

// ============================================================
// SPAWN POINTS
// ============================================================

export const VALLEY_SPAWN_POINTS = {
  bridgeNorth: new THREE.Vector3(0, 1, -30),
  bridgeSouth: new THREE.Vector3(0, 1, 30),
  westForest: new THREE.Vector3(-35, 1, 0),
  eastForest: new THREE.Vector3(35, 1, 0),
  center: new THREE.Vector3(0, 1, 0),
};

export default ValleyLevel;
