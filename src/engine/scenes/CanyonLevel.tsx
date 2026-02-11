/**
 * CanyonLevel - Nivel de Cañón
 * Cañón con acantilados, cuevas, puentes colgantes y cascadas
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { MeshReflectorMaterial, Sparkles } from '@react-three/drei';
import { UltraSkySystem } from '../systems/UltraSkySystem';
import { VolcanoAmbience } from '../systems/AmbientParticlesSystem';
import { SceneEnhancer } from '../components/SceneEnhancer';
import { WaterfallEffect } from '../components/WaterfallEffect';

// ============================================================
// COMPONENTES DEL CAÑÓN
// ============================================================

interface CliffWallProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
}

function CliffWall({ 
  position, 
  rotation = [0, 0, 0], 
  width = 100, 
  height = 40, 
  depth = 8 
}: CliffWallProps) {
  // Crear forma irregular para el acantilado
  const segments = useMemo(() => {
    const segs = [];
    const segCount = 10;
    
    for (let i = 0; i < segCount; i++) {
      const x = (i / segCount - 0.5) * width;
      const heightVar = height * (0.7 + Math.random() * 0.3);
      const depthVar = depth * (0.8 + Math.random() * 0.4);
      segs.push({ x, height: heightVar, depth: depthVar });
    }
    return segs;
  }, [width, height, depth]);

  return (
    <RigidBody type="fixed" position={position} rotation={rotation} colliders={false}>
      <CuboidCollider args={[width / 2, height / 2, depth / 2]} position={[0, height / 2, 0]} />
      
      {segments.map((seg, i) => (
        <mesh key={i} position={[seg.x, seg.height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width / 10 + 2, seg.height, seg.depth]} />
          <meshStandardMaterial 
            color="#8b6b4a" 
            roughness={0.95}
          />
        </mesh>
      ))}

      {/* Detalles de roca */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = (Math.random() - 0.5) * width;
        const y = Math.random() * height * 0.8;
        const z = (Math.random() - 0.5) * depth * 0.3;
        const scale = 0.5 + Math.random() * 1.5;
        
        return (
          <mesh key={`rock-${i}`} position={[x, y, z + depth / 2]} scale={scale}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#7a5a3a" roughness={0.95} flatShading />
          </mesh>
        );
      })}
    </RigidBody>
  );
}

interface RopeBridgeProps {
  start: [number, number, number];
  end: [number, number, number];
  segments?: number;
}

function RopeBridge({ start, end, segments = 15 }: RopeBridgeProps) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = endVec.clone().sub(startVec);
  direction.normalize();
  
  // Ángulo para orientar el puente
  const angle = Math.atan2(direction.x, direction.z);

  // Crear tablones del puente con catenaria
  const planks = useMemo(() => {
    const plankData = [];
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pos = startVec.clone().lerp(endVec, t);
      
      // Catenaria: curva hacia abajo en el centro
      const sag = Math.sin(t * Math.PI) * 3;
      pos.y -= sag;
      
      plankData.push({
        position: [pos.x, pos.y, pos.z] as [number, number, number],
        rotation: [0, angle, (Math.random() - 0.5) * 0.1] as [number, number, number],
      });
    }
    
    return plankData;
  }, [start, end, segments]);

  return (
    <group>
      {/* Postes de anclaje */}
      <RigidBody type="fixed" position={start} colliders="cuboid">
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.4, 4, 8]} />
          <meshStandardMaterial color="#5a4030" roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={end} colliders="cuboid">
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.4, 4, 8]} />
          <meshStandardMaterial color="#5a4030" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Tablones del puente */}
      <RigidBody type="fixed" colliders={false}>
        {planks.map((plank, i) => (
          <group key={i}>
            <CuboidCollider 
              args={[0.6, 0.1, 1.5]} 
              position={plank.position}
            />
            <mesh 
              position={plank.position} 
              rotation={plank.rotation}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[1.2, 0.15, 3]} />
              <meshStandardMaterial color="#6a5040" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </RigidBody>

      {/* Cuerdas */}
      {[-1.3, 1.3].map((zOffset, idx) => (
        <mesh key={idx}>
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3(
              planks.map(p => new THREE.Vector3(p.position[0], p.position[1] + 1, p.position[2] + zOffset))
            ),
            segments * 2,
            0.05,
            8,
            false
          ]} />
          <meshStandardMaterial color="#8a7060" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Waterfall({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_state) => {
    if (meshRef.current) {
      // Animar offset de textura para simular flujo
      // (Si tuviéramos textura, aquí la animaríamos)
    }
  });

  return (
    <group position={position}>
      {/* Agua cayendo */}
      <mesh ref={meshRef} position={[0, -10, 0]}>
        <cylinderGeometry args={[2, 3, 20, 16, 1, true]} />
        <meshStandardMaterial 
          color="#6699bb"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Niebla/spray */}
      <Sparkles
        position={[0, -20, 0]}
        count={100}
        size={4}
        speed={2}
        scale={[8, 5, 8]}
        color="#ffffff"
        opacity={0.5}
      />

      {/* Piscina en la base */}
      <mesh position={[0, -21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6, 32]} />
        <MeshReflectorMaterial
          mirror={0.6}
          color="#4488aa"
          roughness={0.2}
        />
      </mesh>

      {/* Rocas alrededor */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 5 + Math.random() * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              -20 + Math.random(),
              Math.sin(angle) * radius,
            ]}
            scale={1 + Math.random()}
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#6a5a4a" roughness={0.95} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

interface CaveEntranceProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

function CaveEntrance({ position, rotation = [0, 0, 0] }: CaveEntranceProps) {
  return (
    <RigidBody type="fixed" position={position} rotation={rotation} colliders={false}>
      {/* Marco de la cueva */}
      <mesh castShadow receiveShadow>
        <torusGeometry args={[4, 2, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.95} />
      </mesh>

      {/* Interior oscuro */}
      <mesh position={[0, 0, -1]}>
        <circleGeometry args={[3.5, 16, 0, Math.PI]} />
        <meshBasicMaterial color="#111111" side={THREE.DoubleSide} />
      </mesh>

      {/* Colisión de entrada */}
      <CuboidCollider args={[3, 4, 0.5]} position={[0, 0, -2]} sensor />

      {/* Estalactitas decorativas */}
      {[-2, -1, 0, 1, 2].map((x) => (
        <mesh key={x} position={[x, 3.5 - Math.abs(x) * 0.5, 0]} castShadow>
          <coneGeometry args={[0.2, 1 + Math.random(), 6]} />
          <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
        </mesh>
      ))}
    </RigidBody>
  );
}

function CanyonFloor() {
  return (
    <group>
      {/* Suelo del cañón (abajo) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -25, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 150]} />
          <meshStandardMaterial color="#6a5a4a" roughness={0.95} />
        </mesh>
      </RigidBody>

      {/* Río en el fondo */}
      <mesh position={[0, -24.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 150]} />
        <MeshReflectorMaterial
          mirror={0.5}
          color="#3377aa"
          roughness={0.3}
          blur={[200, 100]}
        />
      </mesh>

      {/* Plataformas elevadas (caminos) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-20, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[15, 2, 100]} />
          <meshStandardMaterial color="#7a6a5a" roughness={0.9} />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[20, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[15, 2, 100]} />
          <meshStandardMaterial color="#7a6a5a" roughness={0.9} />
        </mesh>
      </RigidBody>
    </group>
  );
}

// ============================================================
// NIVEL PRINCIPAL
// ============================================================

interface CanyonLevelProps {
  timeOfDay?: number;
  showEffects?: boolean;
}

export function CanyonLevel({
  timeOfDay = 15,
  showEffects = true,
}: CanyonLevelProps) {
  return (
    <group name="canyon-level">
      {/* Cielo */}
      <UltraSkySystem initialTime={timeOfDay} />

      {/* Iluminación */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[20, 60, 30]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />

      {/* Luz de relleno (simula rebote en paredes) */}
      <pointLight position={[0, -10, 0]} intensity={0.5} color="#ffa066" distance={50} />

      {/* Paredes del cañón */}
      <CliffWall position={[-35, 0, 0]} width={10} height={50} depth={120} />
      <CliffWall position={[35, 0, 0]} width={10} height={50} depth={120} />
      
      {/* Paredes de fondo */}
      <CliffWall 
        position={[0, 0, -60]} 
        rotation={[0, Math.PI / 2, 0]} 
        width={70} 
        height={40} 
        depth={10}
      />

      {/* Suelo del cañón */}
      <CanyonFloor />

      {/* Puentes colgantes */}
      <RopeBridge 
        start={[-12, 0, -20]} 
        end={[12, 0, -20]} 
        segments={12}
      />
      <RopeBridge 
        start={[-12, 0, 20]} 
        end={[12, 0, 20]} 
        segments={12}
      />

      {/* Cascada mejorada */}
      <WaterfallEffect position={[0, -20, -50]} width={5} height={22} />

      {/* Mejoras visuales (PostProcess + Fog + Environment) */}
      <SceneEnhancer biome="canyon" />

      {/* Cuevas */}
      <CaveEntrance position={[-30, 0, 10]} rotation={[0, Math.PI / 2, 0]} />
      <CaveEntrance position={[30, 0, -10]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Plataformas intermedias */}
      {[
        [-10, -8, 0],
        [10, -12, 5],
        [-8, -15, -15],
        [8, -18, 15],
      ].map((pos, i) => (
        <RigidBody key={i} type="fixed" position={pos as [number, number, number]} colliders="cuboid">
          <mesh castShadow receiveShadow>
            <boxGeometry args={[6, 1, 6]} />
            <meshStandardMaterial color="#7a6a5a" roughness={0.9} />
          </mesh>
        </RigidBody>
      ))}

      {/* Partículas de polvo/ceniza */}
      {showEffects && <VolcanoAmbience />}

      {/* Sparkles en las rocas */}
      {showEffects && (
        <Sparkles
          position={[0, 5, 0]}
          count={50}
          size={2}
          speed={0.2}
          scale={[60, 30, 100]}
          color="#ffcc88"
          opacity={0.3}
        />
      )}
    </group>
  );
}

// ============================================================
// SPAWN POINTS
// ============================================================

export const CANYON_SPAWN_POINTS = {
  westPlatform: new THREE.Vector3(-20, 2, 0),
  eastPlatform: new THREE.Vector3(20, 2, 0),
  bridgeNorth: new THREE.Vector3(0, 1, -20),
  bridgeSouth: new THREE.Vector3(0, 1, 20),
  canyonFloor: new THREE.Vector3(0, -24, 0),
  westCave: new THREE.Vector3(-25, 1, 10),
  eastCave: new THREE.Vector3(25, 1, -10),
};

export default CanyonLevel;
